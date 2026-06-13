import React, { useMemo, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Switch } from "@/components/ui/switch";
import { CalendarClock, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { computeDeadlinesForYear } from '@/lib/fiscalPlanner';
import { useUserProfile } from '@/lib/useUserProfile';
import { toast } from "sonner";

function formatCurrency(amount) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(amount || 0);
}

const MONTH_NAMES_SHORT = ['','Gen.','Feb.','Mar.','Apr.','Mag.','Giu.','Lug.','Ago.','Sett.','Ott.','Nov.','Dic.'];

function daysUntil(month, year, day) {
  const today = new Date();
  const d = day || (month === 12 ? 31 : 30);
  const target = new Date(year, month - 1, d);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function monthLabel(month, year, day) {
  const d = day || (month === 12 ? 31 : 30);
  return `${d} ${MONTH_NAMES_SHORT[month] || ''} ${year}`;
}

function computeDeadlines(deadlines, fiscalSettings, incomes, customTemplates, year, profile) {
  // Usa il motore di calcolo (stesso della pagina Scadenze) per coerenza
  const settingsByYear = {};
  (fiscalSettings || []).forEach(s => { if (s.year != null) settingsByYear[s.year] = s; });

  let engineDeadlines = [];
  try {
    engineDeadlines = computeDeadlinesForYear({
      profile: profile || { pension_fund: 'inarcassa' },
      incomes: incomes || [],
      settingsByYear,
      year,
    }).deadlines;
  } catch (e) {
    engineDeadlines = [];
  }

  const yearDeadlines = deadlines.filter(d => Number(d.year) === year);
  const getRec = (type) => yearDeadlines.find(d => d.type === type);

  const standardItems = engineDeadlines.map(d => ({
    key: d.key,
    month: d.month,
    day: d.day,
    year,
    title: d.title.replace(' (agevolato neo-iscritto)', ''),
    type: d.type,
    calculatedAmount: d.calculatedAmount,
    deadlineRecord: getRec(d.type),
  }));

  // Scadenze custom attive per l'anno
  const activeCustom = (customTemplates || []).filter(t =>
    t.is_recurring ? Number(t.start_year) <= year : Number(t.start_year) === year
  ).map(t => {
    const customRecord = yearDeadlines.find(d => d.type === 'custom' && d.label === t.label && Number(d.month) === Number(t.month));
    return {
      key: `custom_${t.id}`,
      month: Number(t.month),
      day: t.day || 30,
      year,
      title: t.label,
      type: 'custom',
      calculatedAmount: t.amount_calculated || 0,
      deadlineRecord: customRecord,
    };
  });

  const allItems = [...standardItems, ...activeCustom];

  return allItems
    .map(d => ({
      ...d,
      effectiveAmount: d.deadlineRecord?.amount_override != null ? d.deadlineRecord.amount_override : d.calculatedAmount,
      isPaid: d.deadlineRecord?.is_paid || false,
      days: daysUntil(d.month, d.year, d.day),
    }))
    .sort((a, b) => {
      const monthDiff = a.month - b.month;
      if (monthDiff !== 0) return monthDiff;
      return (a.day || 30) - (b.day || 30);
    });
}

function urgencyGradient(days) {
  if (days <= 14) return 'from-rose-500 to-rose-600';
  if (days <= 45) return 'from-amber-500 to-amber-600';
  return 'from-slate-700 to-slate-800';
}

// Singola slide scadenza
function DeadlineSlide({ d, index, total, onTogglePaid }) {
  return (
    <div className="flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <CalendarClock className="w-3.5 h-3.5 opacity-70" />
        <span className="text-xs font-medium opacity-70 uppercase tracking-wide">
          {index === 0 ? 'Prossima scadenza' : `Scadenza ${index + 1} / ${total}`}
        </span>
      </div>

      {/* Body */}
      <div>
        <p className="text-base font-bold leading-tight mt-1">{d.title}</p>
        <p className="text-xs opacity-75 mt-0.5">
          {monthLabel(d.month, d.year, d.day)} · {d.days === 0 ? 'Oggi!' : d.days < 0 ? `${Math.abs(d.days)}g fa` : `tra ${d.days}g`}
        </p>
        <p className="text-2xl font-bold tabular-nums mt-1.5">{formatCurrency(d.effectiveAmount)}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={d.isPaid}
            onCheckedChange={(val) => onTogglePaid(d, val)}
            className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30 scale-90"
          />
          <span className="text-xs opacity-80">{d.isPaid ? 'Pagato' : 'Segna pagato'}</span>
        </div>
        <Link to="/ScadenzeFiscali">
          <button className="flex items-center gap-0.5 text-xs opacity-60 hover:opacity-100 transition-opacity">
            Dettagli <ChevronRight className="w-3 h-3" />
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function NextDeadlineWidget({ deadlines, fiscalSettings, incomes, customTemplates, selectedYear, queryClient }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isDragging = useRef(false);

  const { profile } = useUserProfile();
  const allDeadlines = useMemo(() =>
    computeDeadlines(deadlines, fiscalSettings, incomes, customTemplates, selectedYear, profile),
    [deadlines, fiscalSettings, incomes, customTemplates, selectedYear, profile]
  );

  // Ordina: prima le non pagate future, poi le pagate, poi le scadute
  const sortedDeadlines = useMemo(() => {
    const unpaidFuture = allDeadlines.filter(d => !d.isPaid && d.days >= 0).sort((a, b) => a.days - b.days);
    const unpaidPast = allDeadlines.filter(d => !d.isPaid && d.days < 0).sort((a, b) => b.days - a.days);
    const paid = allDeadlines.filter(d => d.isPaid).sort((a, b) => a.days - b.days);
    return [...unpaidFuture, ...unpaidPast, ...paid];
  }, [allDeadlines]);

  const updateDeadlineMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PaymentDeadline.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['paymentDeadlines'] }); toast.success('Aggiornato'); },
  });
  const createDeadlineMutation = useMutation({
    mutationFn: (data) => base44.entities.PaymentDeadline.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paymentDeadlines'] }),
  });

  const handleTogglePaid = (d, val) => {
    const payload = { year: d.year, month: d.month, type: d.type, label: d.title, amount_calculated: d.calculatedAmount, is_paid: val, paid_date: val ? new Date().toISOString().slice(0, 10) : null, ...(d.deadlineRecord?.amount_override != null ? { amount_override: d.deadlineRecord.amount_override } : {}) };
    if (d.deadlineRecord?.id) updateDeadlineMutation.mutate({ id: d.deadlineRecord.id, data: payload });
    else createDeadlineMutation.mutate(payload);
  };

  // Swipe handlers con live drag
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
    setDragOffset(0);
  };
  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (!isDragging.current && Math.abs(dx) > 8 && dy < Math.abs(dx)) {
      isDragging.current = true;
    }
    if (isDragging.current) {
      e.preventDefault();
      // Resistenza ai bordi
      const atStart = currentIndex === 0 && dx > 0;
      const atEnd = currentIndex === sortedDeadlines.length - 1 && dx < 0;
      setDragOffset(atStart || atEnd ? dx * 0.25 : dx);
    }
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 50 && dy < 80) {
      if (dx < 0 && currentIndex < sortedDeadlines.length - 1) setCurrentIndex(i => i + 1);
      if (dx > 0 && currentIndex > 0) setCurrentIndex(i => i - 1);
    }
    setDragOffset(0);
    touchStartX.current = null;
    isDragging.current = false;
  };

  if (allDeadlines.every(d => d.isPaid)) {
    return (
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-3xl shadow-apple-lg p-4 flex items-center gap-3 text-white">
        <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center shrink-0">
          <Check className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs opacity-75">Scadenze {selectedYear}</p>
          <p className="text-base font-bold">Tutto pagato!</p>
        </div>
      </div>
    );
  }

  const current = sortedDeadlines[currentIndex] || sortedDeadlines[0];
  const gradient = current?.isPaid ? 'from-emerald-500 to-emerald-600' : urgencyGradient(current?.days ?? 99);

  return (
    <>
      {/* MOBILE: swipeable carousel */}
      <div className="sm:hidden overflow-hidden rounded-2xl">
        {/* Track — non deve mai uscire dall'overflow-hidden del parent */}
        <div
          className="flex will-change-transform"
          style={{
            transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
            transition: dragOffset !== 0 ? 'none' : 'transform 0.3s ease-out',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {sortedDeadlines.map((d, i) => {
            const g = d.isPaid ? 'from-emerald-500 to-emerald-600' : urgencyGradient(d.days);
            return (
              <div
                key={d.key}
                className={`bg-gradient-to-r ${g} p-4 text-white select-none shrink-0`}
                style={{ width: '100%', minHeight: '140px' }}
              >
                <DeadlineSlide d={d} index={i} total={sortedDeadlines.length} onTogglePaid={handleTogglePaid} />
              </div>
            );
          })}
        </div>
        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-2">
          {sortedDeadlines.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`rounded-full transition-all ${i === currentIndex ? 'w-4 h-1.5 bg-slate-700' : 'w-1.5 h-1.5 bg-slate-300'}`}
            />
          ))}
        </div>
      </div>

      {/* DESKTOP: layout originale side-by-side */}
      <div className={`hidden sm:block bg-gradient-to-r ${urgencyGradient(sortedDeadlines.find(d => !d.isPaid && d.days >= 0)?.days ?? 99)} rounded-3xl shadow-apple-lg p-5 text-white`}>
        <div className="flex items-start gap-6">
          {/* Prossima */}
          <div className="flex-1">
            {(() => {
              const next = sortedDeadlines.find(d => !d.isPaid && d.days >= 0);
              if (!next) return <p className="text-lg font-semibold opacity-80">Nessuna scadenza imminente</p>;
              return (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarClock className="w-4 h-4 opacity-75" />
                    <span className="text-xs font-medium opacity-75 uppercase tracking-wide">Prossima Scadenza</span>
                  </div>
                  <p className="text-xl font-bold">{next.title}</p>
                  <p className="text-sm opacity-80 mt-0.5">{monthLabel(next.month, next.year, next.day)} · {next.days === 0 ? 'Oggi!' : `tra ${next.days} giorni`}</p>
                  <p className="text-3xl font-bold tabular-nums mt-2">{formatCurrency(next.effectiveAmount)}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Switch checked={next.isPaid} onCheckedChange={(val) => handleTogglePaid(next, val)} className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30" />
                    <span className="text-sm opacity-80">Segna come pagato</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Lista altre scadenze */}
          {sortedDeadlines.filter(d => !d.isPaid && d.days >= 0).length > 1 && (
            <div className="min-w-[210px] bg-white/10 rounded-xl p-3 space-y-2.5">
              <p className="text-xs font-medium opacity-70 uppercase tracking-wide">Prossime scadenze</p>
              {sortedDeadlines.filter(d => !d.isPaid && d.days >= 0).slice(1, 4).map(d => (
                <div key={d.key} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Switch checked={d.isPaid} onCheckedChange={(val) => handleTogglePaid(d, val)} className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30 scale-75" />
                    <div>
                      <p className="text-xs font-medium leading-tight">{d.title}</p>
                      <p className="text-xs opacity-60">{monthLabel(d.month, d.year, d.day)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold tabular-nums">{formatCurrency(d.effectiveAmount)}</span>
                </div>
              ))}
            </div>
          )}

          <Link to="/ScadenzeFiscali" className="self-start">
            <button className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition-opacity">
              Gestisci <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}