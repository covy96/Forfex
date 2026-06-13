import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Save, Check, Calendar, Settings, Landmark, Repeat, Plus } from "lucide-react";
import { toast } from "sonner";
import { useUserProfile } from '@/lib/useUserProfile';
import CustomDeadlineSettings from '@/components/scadenze/CustomDeadlineSettings';
import { computeDeadlinesForYear } from '@/lib/fiscalPlanner';
import { expandTemplate, templateActive } from '@/lib/recurrence';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

function formatCurrency(amount) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(amount || 0);
}

const MONTH_ABBR = { Gennaio: 'GEN', Febbraio: 'FEB', Marzo: 'MAR', Aprile: 'APR', Maggio: 'MAG', Giugno: 'GIU', Luglio: 'LUG', Agosto: 'AGO', Settembre: 'SET', Ottobre: 'OTT', Novembre: 'NOV', Dicembre: 'DIC' };

function BadgeCalcolo({ tipo }) {
  const map = {
    calcolato: { c: 'var(--fx-ok)', t: 'CALCOLATO' },
    proiettato: { c: 'var(--fx-warn)', t: 'PROIETTATO' },
    stimato: { c: 'var(--fx-mut)', t: 'STIMATO' },
  };
  const s = map[tipo] || map.stimato;
  return (
    <span className="fx-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9.5, fontWeight: 600,
      letterSpacing: '0.08em', padding: '3px 7px', borderRadius: 5, color: s.c, background: 'color-mix(in oklch, ' + s.c + ' 12%, transparent)' }}>
      {s.t}
    </span>
  );
}

function DeadlineCard({ title, date, description, descriptionSub, type, calcType, calculatedAmount, deadlineRecord, onSave }) {
  const [override, setOverride] = useState(deadlineRecord?.amount_override != null ? String(deadlineRecord.amount_override) : '');
  const [isPaid, setIsPaid] = useState(deadlineRecord?.is_paid || false);
  const [paidDate, setPaidDate] = useState(deadlineRecord?.paid_date || '');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setOverride(deadlineRecord?.amount_override != null ? String(deadlineRecord.amount_override) : '');
    setIsPaid(deadlineRecord?.is_paid || false);
    setPaidDate(deadlineRecord?.paid_date || '');
    setDirty(false);
  }, [deadlineRecord?.id, deadlineRecord?.amount_override, deadlineRecord?.is_paid, deadlineRecord?.paid_date]);

  const displayAmount = override !== '' && !isNaN(parseFloat(override))
    ? parseFloat(override) : calculatedAmount;

  const [dayStr, monthName] = String(date).split(' ');

  const togglePaid = (val) => {
    setIsPaid(val);
    if (val && !paidDate) setPaidDate(new Date().toISOString().slice(0, 10));
    if (!val) setPaidDate('');
    setDirty(true);
  };

  const handleSave = () => {
    onSave({
      amount_override: override !== '' && !isNaN(parseFloat(override)) ? parseFloat(override) : null,
      is_paid: isPaid,
      paid_date: isPaid ? (paidDate || null) : null,
      amount_calculated: calculatedAmount
    });
    setDirty(false);
  };

  return (
    <div className="fx-panel" style={{ padding: '16px 18px', borderColor: isPaid ? 'color-mix(in oklch, var(--fx-ok) 40%, var(--fx-line))' : 'var(--fx-line)', background: isPaid ? 'color-mix(in oklch, var(--fx-ok) 5%, var(--fx-panel))' : 'var(--fx-panel)' }}>
      <div className="flex items-start gap-4">
        {/* Quadratino data */}
        <div style={{ width: 46, height: 46, borderRadius: 8, flexShrink: 0, border: '1px solid var(--fx-line)', background: 'var(--fx-chip)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="fx-num" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{dayStr}</div>
          <div className="fx-label" style={{ fontSize: 8, marginTop: 2 }}>{MONTH_ABBR[monthName] || ''}</div>
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[15px] font-semibold" style={{ color: 'var(--fx-txt)' }}>{title}</p>
            <BadgeCalcolo tipo={calcType} />
            {isPaid && (
              <span className="fx-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 600, letterSpacing: '0.08em', padding: '3px 7px', borderRadius: 5, color: 'var(--fx-ok)', background: 'color-mix(in oklch, var(--fx-ok) 12%, transparent)' }}>
                <Check className="w-3 h-3" />PAGATO
              </span>
            )}
          </div>
          <p className="text-[11.5px] whitespace-pre-line" style={{ color: 'var(--fx-mut)' }}>{description}</p>
        </div>

        <div className="flex flex-col items-end gap-2.5 min-w-[190px]">
          <p className="fx-num" style={{ fontSize: 22, fontWeight: 700, color: isPaid ? 'var(--fx-ok)' : 'var(--fx-txt)' }}>{formatCurrency(displayAmount)}</p>
          <div className="flex flex-col items-end gap-1 w-full">
            <Label className="fx-label">Importo manuale (€)</Label>
            <Input type="number" step="0.01" placeholder="auto" value={override}
              onChange={(e) => { setOverride(e.target.value); setDirty(true); }}
              className="w-44 text-right text-sm h-8 rounded-[8px] border-fx-line fx-num" />
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-[12px]" style={{ color: 'var(--fx-mut)' }}>Pagato</Label>
            <Switch checked={isPaid} onCheckedChange={togglePaid} />
            {dirty && (
              <button onClick={handleSave} className="h-7 text-xs rounded-[8px] px-3 text-white flex items-center gap-1" style={{ background: 'var(--fx-ind)' }}>
                <Save className="w-3 h-3" /> Salva
              </button>
            )}
          </div>
          {isPaid && (
            <div className="flex flex-col items-end gap-1">
              <Label className="fx-label">Data pagamento</Label>
              <Input type="date" value={paidDate} onChange={(e) => { setPaidDate(e.target.value); setDirty(true); }}
                className="w-44 text-right text-sm h-8 rounded-[8px] border-fx-line" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ScadenzeFiscali() {
  const { user, profile } = useUserProfile();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showSettings, setShowSettings] = useState(false);
  const queryClient = useQueryClient();

  const [settingsForm, setSettingsForm] = useState({ inarcassa_minimi: '' });

  const { data: allIncomes = [] } = useQuery({
    queryKey: ['incomes', user?.id],
    queryFn: () => base44.entities.Income.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: fiscalSettings = [] } = useQuery({
    queryKey: ['fiscalSettings', user?.id],
    queryFn: () => base44.entities.FiscalSettings.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: deadlines = [] } = useQuery({
    queryKey: ['paymentDeadlines', user?.id],
    queryFn: () => base44.entities.PaymentDeadline.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const { data: customTemplates = [] } = useQuery({
    queryKey: ['customDeadlineTemplates', user?.id],
    queryFn: () => base44.entities.PaymentDeadline.filter({ created_by: user?.email, type: 'custom', year: 9999 }),
    enabled: !!user,
  });

  const settings = fiscalSettings.find(s => s.year === selectedYear) || {};

  useEffect(() => {
    setSettingsForm({
      inarcassa_minimi: settings.inarcassa_minimi != null ? String(settings.inarcassa_minimi) : ''
    });
  }, [selectedYear, fiscalSettings.length, settings.id]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data) => settings.id
      ? base44.entities.FiscalSettings.update(settings.id, data)
      : base44.entities.FiscalSettings.create({ ...data, year: selectedYear, tax_rate: 15, profitability_coefficient: 78 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscalSettings'] });
      toast.success('Impostazioni salvate');
    }
  });

  const createDeadlineMutation = useMutation({
    mutationFn: (data) => base44.entities.PaymentDeadline.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paymentDeadlines'] }),
  });
  const updateDeadlineMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PaymentDeadline.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paymentDeadlines'] }),
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      inarcassa_minimi: settingsForm.inarcassa_minimi !== '' ? parseFloat(settingsForm.inarcassa_minimi) : null
    });
  };

  const { deadlineData, summary } = useMemo(() => {
    if (!profile) return { deadlineData: [], summary: { total: 0, paid: 0, toPay: 0 } };

    // Costruisci settingsByYear (override utente per anno) dai FiscalSettings
    const settingsByYear = {};
    fiscalSettings.forEach(s => { if (s.year != null) settingsByYear[s.year] = s; });

    // Motore di calcolo: scadenze imposte + contributi (cassa) per l'anno
    const { deadlines: engineDeadlines } = computeDeadlinesForYear({
      profile,
      incomes: allIncomes,
      settingsByYear,
      year: selectedYear,
    });

    const yearDeadlines = deadlines.filter(d => Number(d.year) === selectedYear);
    const getRecord = (type) => yearDeadlines.find(d => d.type === type);

    // Scadenze custom attive per l'anno selezionato, espanse in occorrenze
    const MONTH_NAMES = ['','Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
    const activeCustomTemplates = customTemplates.filter(t => templateActive(t, selectedYear));
    const customOccurrences = activeCustomTemplates.flatMap(t =>
      expandTemplate(t, selectedYear).map(o => {
        const customRecord = yearDeadlines.find(d => d.type === 'custom' && d.label === o.label && Number(d.month) === Number(o.month) && Number(d.day) === Number(o.day));
        return {
          key: o.key,
          date: `${o.day} ${MONTH_NAMES[Number(o.month)]} ${selectedYear}`,
          month: Number(o.month),
          day: Number(o.day),
          title: o.label,
          description: t.notes || '',
          type: 'custom',
          calcType: 'calcolato',
          calculatedAmount: o.amount || 0,
          deadlineRecord: customRecord,
          isCustom: true,
          templateId: t.id,
        };
      })
    );

    const deadlineData = [
      ...engineDeadlines.map(d => ({
        key: d.key,
        date: d.date,
        month: d.month,
        day: d.day,
        title: d.title,
        description: d.description,
        type: d.type,
        calcType: d.calcType,
        calculatedAmount: d.calculatedAmount,
        deadlineRecord: getRecord(d.type),
        group: d.group,
      })),
      ...customOccurrences,
    ];

    // Ordina per mese, poi per giorno
    deadlineData.sort((a, b) => (Number(a.month) - Number(b.month)) || ((a.day || 30) - (b.day || 30)));

    const effectiveAmount = (d) => {
      const rec = d.deadlineRecord;
      return rec?.amount_override != null ? rec.amount_override : d.calculatedAmount;
    };

    // Totale gruppo "giugno" (più scadenze nello stesso giorno) + flag ultimo del gruppo
    const giugnoItems = deadlineData.filter(d => d.group === 'giugno');
    const groupTotaleGiugno = giugnoItems.reduce((s, d) => s + effectiveAmount(d), 0);
    giugnoItems.forEach((d, idx) => {
      d.groupTotal = groupTotaleGiugno;
      d.isLastInGroup = idx === giugnoItems.length - 1;
    });

    // Riepilogo SOLO fiscale (tasse + contributi), escluse le scadenze personali
    const fiscalItems = deadlineData.filter(d => !d.isCustom);
    const total = fiscalItems.reduce((s, d) => s + effectiveAmount(d), 0);
    const paid = fiscalItems.reduce((s, d) => !d.deadlineRecord?.is_paid ? s : s + effectiveAmount(d), 0);

    return { deadlineData, summary: { total, paid, toPay: total - paid } };
  }, [allIncomes, deadlines, selectedYear, fiscalSettings, customTemplates, profile]);

  const handleSaveDeadline = (deadlineInfo, saveData) => {
    const existing = deadlineInfo.deadlineRecord;
    const payload = {
      year: selectedYear, label: deadlineInfo.title, month: deadlineInfo.month,
      type: deadlineInfo.type, amount_calculated: saveData.amount_calculated,
      amount_override: saveData.amount_override, is_paid: saveData.is_paid,
      paid_date: saveData.paid_date,
      ...(deadlineInfo.isCustom ? { day: deadlineInfo.day } : {}),
    };
    if (existing) updateDeadlineMutation.mutate({ id: existing.id, data: payload });
    else createDeadlineMutation.mutate(payload);
  };

  const years = [];
  for (let y = 2023; y <= currentYear + 1; y++) years.push(y);

  return (
    <div style={{ background: 'var(--fx-bg)', color: 'var(--fx-txt)' }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'color-mix(in oklch, var(--fx-bg) 92%, transparent)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--fx-line-soft)',
        padding: '0 30px',
        display: 'flex', alignItems: 'center', gap: 14,
        height: 56,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>Scadenze Fiscali</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setShowSettings(s => !s)}
            className="flex items-center gap-2 text-[12.5px] font-semibold rounded-[8px] px-3 py-1.5 transition-colors"
            style={{ background: showSettings ? 'var(--fx-ind)' : 'var(--fx-panel)', color: showSettings ? '#fff' : 'var(--fx-mut)', border: '1px solid var(--fx-line)' }}
          >
            <Settings className="w-3.5 h-3.5" /> Impostazioni
          </button>
          <div className="fx-panel inline-flex p-1 gap-1">
            {years.map(year => (
              <button key={year} onClick={() => setSelectedYear(year)}
                className="fx-num rounded-[6px] px-3 py-1 text-[12.5px] font-semibold transition-colors"
                style={{ background: selectedYear === year ? 'var(--fx-ind)' : 'transparent', color: selectedYear === year ? '#fff' : 'var(--fx-mut)' }}>
                {year}
              </button>
            ))}
          </div>

      <div className="animate-fade-up" style={{ padding: '24px 30px' }}>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden mb-8"
            >
              <div className="rounded-3xl bg-white/70 border border-slate-100 shadow-apple p-6 space-y-4">
                <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
                  <Settings className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                  <span>Aliquote, coefficienti e minimi Inarcassa per anno si impostano in <Link to="/Settings" className="text-indigo-600 font-medium">Impostazioni Fiscali</Link>. Qui gestisci le scadenze personalizzate.</span>
                </div>
                <CustomDeadlineSettings onClose={() => setShowSettings(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Due colonne: tasse a sinistra, tue scadenze a destra */}
        {(() => {
          const fiscal = deadlineData.filter(d => !d.isCustom);
          const custom = deadlineData.filter(d => d.isCustom);
          const eff = (d) => d.deadlineRecord?.amount_override != null ? d.deadlineRecord.amount_override : d.calculatedAmount;
          const cTot = custom.reduce((s, d) => s + eff(d), 0);
          const cPaid = custom.reduce((s, d) => d.deadlineRecord?.is_paid ? s + eff(d) : s, 0);
          return (
            <div className="dash-grid grid gap-6" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
              {/* COLONNA SINISTRA — tasse e contributi */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Landmark className="w-4 h-4" style={{ color: 'var(--fx-accent)' }} />
                  <h2 className="fx-label">Tasse e contributi {selectedYear}</h2>
                </div>
                {fiscal.map((d, i) => (
                  <motion.div key={d.key}
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1], delay: i * 0.05 }}>
                    <DeadlineCard
                      title={d.title} date={d.date} description={d.description}
                      type={d.type} calcType={d.calcType} calculatedAmount={d.calculatedAmount}
                      deadlineRecord={d.deadlineRecord} descriptionSub={d.descriptionSub}
                      onSave={(saveData) => handleSaveDeadline(d, saveData)}
                    />
                    {d.isLastInGroup && (
                      <div className="flex justify-end mt-2.5">
                        <div className="fx-panel inline-flex items-center gap-3 px-4 py-1.5" style={{ background: 'var(--fx-chip)' }}>
                          <span className="fx-label">Totale Giugno</span>
                          <span className="fx-num text-[16px] font-bold">{formatCurrency(d.groupTotal)}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
                {/* Riepilogo fiscale */}
                <div className="rounded-[12px] p-6 mt-2" style={{ background: 'var(--fx-ind-deep)', color: '#fff' }}>
                  <h3 className="fx-label mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>Riepilogo tasse {selectedYear}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="fx-label mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Totale</p>
                      <p className="fx-num text-xl font-bold">{formatCurrency(summary.total)}</p>
                    </div>
                    <div>
                      <p className="fx-label mb-1.5" style={{ color: 'var(--fx-ind-glow)' }}>Pagato</p>
                      <p className="fx-num text-xl font-bold" style={{ color: 'var(--fx-ind-glow)' }}>{formatCurrency(summary.paid)}</p>
                    </div>
                    <div>
                      <p className="fx-label mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Da versare</p>
                      <p className="fx-num text-xl font-bold">{formatCurrency(summary.toPay)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLONNA DESTRA — le tue scadenze */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4" style={{ color: 'var(--fx-mut)' }} />
                    <h2 className="fx-label">Le tue scadenze {selectedYear}</h2>
                  </div>
                  <button onClick={() => setShowSettings(true)} className="fx-label flex items-center gap-1" style={{ color: 'var(--fx-accent)' }}>
                    <Plus className="w-3.5 h-3.5" /> Aggiungi
                  </button>
                </div>
                {custom.length === 0 ? (
                  <div className="fx-panel text-center text-sm" style={{ padding: '28px 20px', color: 'var(--fx-mut)' }}>
                    Nessuna scadenza personale.<br />Aggiungi affitto, canone, assicurazione… da <button onClick={() => setShowSettings(true)} className="font-semibold" style={{ color: 'var(--fx-accent)' }}>Impostazioni</button>.
                  </div>
                ) : (
                  <>
                    {custom.map((d, i) => (
                      <motion.div key={d.key}
                        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1], delay: i * 0.04 }}>
                        <DeadlineCard
                          title={d.title} date={d.date} description={d.description}
                          type={d.type} calcType={d.calcType} calculatedAmount={d.calculatedAmount}
                          deadlineRecord={d.deadlineRecord} descriptionSub={d.descriptionSub}
                          onSave={(saveData) => handleSaveDeadline(d, saveData)}
                        />
                      </motion.div>
                    ))}
                    {/* Riepilogo personali */}
                    <div className="fx-panel p-6 mt-2">
                      <h3 className="fx-label mb-4">Riepilogo tue scadenze {selectedYear}</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="fx-label mb-1.5">Totale</p>
                          <p className="fx-num text-xl font-bold" style={{ color: 'var(--fx-txt)' }}>{formatCurrency(cTot)}</p>
                        </div>
                        <div>
                          <p className="fx-label mb-1.5" style={{ color: 'var(--fx-ok)' }}>Pagato</p>
                          <p className="fx-num text-xl font-bold" style={{ color: 'var(--fx-ok)' }}>{formatCurrency(cPaid)}</p>
                        </div>
                        <div>
                          <p className="fx-label mb-1.5">Da pagare</p>
                          <p className="fx-num text-xl font-bold" style={{ color: 'var(--fx-txt)' }}>{formatCurrency(cTot - cPaid)}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </div>
      </div>
      </div>
    </div>
  );
}