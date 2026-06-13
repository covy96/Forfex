import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '@/lib/useUserProfile';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import IncomeForm from '@/components/forms/IncomeForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { computeContributi, getTaxRate } from '@/lib/fiscalEngine';
import { computeDeadlinesForYear } from '@/lib/fiscalPlanner';
import { computeStato } from '@/lib/payments';
import { expandTemplate, templateActive } from '@/lib/recurrence';

const MESI = ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC'];
const currentYear = new Date().getFullYear();

const euro = (n, dec = 0) => '€ ' + new Intl.NumberFormat('it-IT', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n || 0);
const euro2 = (n) => euro(n, 2);

function Kpi({ label, value, sub, accent, onClick }) {
  return (
    <div onClick={onClick}
      className={`fx-panel flex-1 flex flex-col gap-2.5 ${onClick ? 'cursor-pointer hover-lift' : ''}`}
      style={{ padding: '20px 22px' }}>
      <div className="fx-label flex items-center gap-1.5">
        {label}
        {onClick && <span style={{ color: 'var(--fx-accent)', fontSize: 12 }}>›</span>}
      </div>
      <div className="fx-num" style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', color: accent ? 'var(--fx-accent)' : 'var(--fx-txt)' }}>{value}</div>
      <div style={{ fontSize: 12.5, color: 'var(--fx-mut)', lineHeight: 1.45 }}>{sub}</div>
    </div>
  );
}

function Step({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="fx-label" style={{ fontSize: 9 }}>{label}</div>
      <div className="fx-num" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>{value}</div>
    </div>
  );
}
function Op({ children }) {
  return <div className="fx-num" style={{ fontSize: 16, color: 'var(--fx-mut)', paddingBottom: 4 }}>{children}</div>;
}

function Bars({ data }) {
  const max = Math.max(1, ...data.map(d => d.v));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 130 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
          <div className="fx-num" style={{ fontSize: 10.5, color: 'var(--fx-mut)' }}>{d.v ? (d.v / 1000).toFixed(1) + 'k' : ''}</div>
          <div style={{ width: '100%', borderRadius: 4, height: `${(d.v / max) * 72}%`, minHeight: d.v ? 4 : 0,
            background: d.current ? 'var(--fx-ind)' : 'color-mix(in oklch, var(--fx-ind) 28%, var(--fx-chip))' }} />
          <div className="fx-label" style={{ fontSize: 9 }}>{d.m}</div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ stato }) {
  const map = {
    incassata: { c: 'var(--fx-ok)', t: 'INCASSATA' },
    attesa: { c: 'var(--fx-warn)', t: 'IN ATTESA' },
    scaduta: { c: 'var(--fx-bad)', t: 'SCADUTA' },
  };
  const s = map[stato] || map.incassata;
  return (
    <span className="fx-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 600,
      letterSpacing: '0.06em', padding: '4px 9px', borderRadius: 5, color: s.c, background: 'color-mix(in oklch, ' + s.c + ' 11%, transparent)' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.c }} />{s.t}
    </span>
  );
}

function ScadenzaRow({ d }) {
  const today = new Date();
  const target = new Date(d.year, d.month - 1, d.day || 30);
  const days = Math.ceil((target - today) / 86400000);
  const paidLabel = d.paidDate ? new Date(d.paidDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : null;
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '13px 0', opacity: d.isPaid ? 0.62 : 1 }}>
      <div style={{ width: 46, height: 46, borderRadius: 8, flexShrink: 0,
        border: '1px solid ' + (d.isPaid ? 'color-mix(in oklch, var(--fx-ok) 40%, var(--fx-line))' : 'var(--fx-line)'),
        background: d.isPaid ? 'color-mix(in oklch, var(--fx-ok) 10%, var(--fx-chip))' : 'var(--fx-chip)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="fx-num" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{d.day || 30}</div>
        <div className="fx-label" style={{ fontSize: 8, marginTop: 2 }}>{MESI[d.month - 1]}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{d.title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--fx-mut)', marginTop: 2 }}>
          {d.day || 30} {MESI[d.month - 1]} {d.year} · F24
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="fx-num" style={{ fontSize: 14, fontWeight: 600, color: d.isPaid ? 'var(--fx-ok)' : 'var(--fx-txt)' }}>{euro(d.amount)}</div>
        {d.isPaid ? (
          <div className="fx-label" style={{ fontSize: 8.5, marginTop: 3, color: 'var(--fx-ok)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Check className="w-2.5 h-2.5" />{paidLabel ? `PAGATO ${paidLabel}` : 'PAGATO'}
          </div>
        ) : (
          <div className="fx-label" style={{ fontSize: 8.5, marginTop: 3, color: days < 30 ? 'var(--fx-warn)' : 'var(--fx-mut)' }}>
            {days >= 0 ? `FRA ${days} GG` : `${Math.abs(days)} GG FA`}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, profile, displayName } = useUserProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [showStima, setShowStima] = useState(false);

  const { data: incomes = [] } = useQuery({ queryKey: ['incomes', user?.id], queryFn: () => base44.entities.Income.filter({ created_by: user?.email }), enabled: !!user });
  const { data: fiscalSettings = [] } = useQuery({ queryKey: ['fiscalSettings', user?.id], queryFn: () => base44.entities.FiscalSettings.filter({ created_by: user?.email }), enabled: !!user });
  const { data: deadlines = [] } = useQuery({ queryKey: ['paymentDeadlines', user?.id], queryFn: () => base44.entities.PaymentDeadline.filter({ created_by: user?.email }), enabled: !!user });
  const { data: customTemplates = [] } = useQuery({ queryKey: ['customDeadlineTemplates', user?.id], queryFn: () => base44.entities.PaymentDeadline.filter({ created_by: user?.email, type: 'custom', year: 9999 }), enabled: !!user });

  const createIncome = useMutation({
    mutationFn: (data) => editingIncome ? base44.entities.Income.update(editingIncome.id, data) : base44.entities.Income.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incomes'] }); setShowIncomeForm(false); setEditingIncome(null); toast.success('Pagamento registrato'); },
  });

  const settingsByYear = useMemo(() => { const o = {}; fiscalSettings.forEach(s => { if (s.year != null) o[s.year] = s; }); return o; }, [fiscalSettings]);
  const settings = settingsByYear[selectedYear] || {};

  const yearIncomes = incomes.filter(i => Number(i.year) === selectedYear);
  const withStato = yearIncomes.map(p => ({ ...p, _stato: computeStato(p) }));
  // Incassato = solo fatture incassate (principio di cassa)
  const profIncome = withStato.filter(i => i.type === 'professionale' && i._stato === 'incassata').reduce((s, i) => s + Number(i.amount || 0), 0);
  // Da incassare = fatture in attesa o scadute
  const daIncassare = withStato.filter(i => i._stato !== 'incassata').reduce((s, i) => s + Number(i.amount || 0), 0);
  const numAperte = withStato.filter(i => i._stato === 'attesa').length;
  const numScadute = withStato.filter(i => i._stato === 'scaduta').length;

  // KPI: tasse stimate (imposta + contributi)
  const contributi = computeContributi({ pensionFund: profile?.pension_fund || 'inarcassa', fatturato: profIncome, profile, settings, year: selectedYear });
  const coeff = (settings.profitability_coefficient ?? 78) / 100;
  const taxRate = (settings.imposta_dovuta != null) ? null : (getTaxRate(profile, selectedYear, settings) ?? 15);
  const imposta = settings.imposta_dovuta != null ? Number(settings.imposta_dovuta) : Math.max(0, profIncome * coeff - contributi.deducibile) * (taxRate / 100);

  // Floor minimi: se non hai i minimi di quest'anno, usa quelli dell'anno
  // precedente come proxy. I contributi annui non possono stare sotto i minimi.
  const prevSettings = settingsByYear[selectedYear - 1] || {};
  const minimiProxy = settings.inarcassa_minimi != null
    ? settings.inarcassa_minimi
    : (prevSettings.inarcassa_minimi != null ? prevSettings.inarcassa_minimi : null);
  const usaProxyMinimi = settings.inarcassa_minimi == null && prevSettings.inarcassa_minimi != null;
  const isInarcassa = (profile?.pension_fund || 'inarcassa') === 'inarcassa';
  const estimatedContributi = (isInarcassa && minimiProxy != null)
    ? Math.max(contributi.totale, minimiProxy)
    : contributi.totale;
  const tasseStimate = imposta + estimatedContributi;

  // Grafico incassi mensili (solo incassato)
  const chartData = MESI.map((m, idx) => {
    const v = withStato.filter(i => Number(i.month) === idx + 1 && i._stato === 'incassata').reduce((s, i) => s + Number(i.amount || 0), 0);
    return { m, v, current: selectedYear === currentYear && idx === new Date().getMonth() };
  });

  // Pagamenti recenti
  const recent = [...withStato].sort((a, b) => new Date(b.date || b.data_emissione || 0) - new Date(a.date || a.data_emissione || 0)).slice(0, 5);

  // Prossime scadenze (motore)
  const engineDeadlines = useMemo(() => {
    try { return computeDeadlinesForYear({ profile: profile || { pension_fund: 'inarcassa' }, incomes, settingsByYear, year: selectedYear }).deadlines; }
    catch { return []; }
  }, [profile, incomes, settingsByYear, selectedYear]);
  const yearDeadlineRecords = deadlines.filter(d => Number(d.year) === selectedYear);
  const recordFor = (type) => yearDeadlineRecords.find(r => r.type === type);
  const nextScad = engineDeadlines
    .filter(d => d.type.startsWith('imposta') || d.type.startsWith('inarcassa') || d.type.startsWith('inps'))
    .map(d => {
      const rec = recordFor(d.type);
      return {
        ...d,
        isPaid: rec?.is_paid || false,
        paidDate: rec?.paid_date || null,
        amount: rec?.amount_override != null ? rec.amount_override : d.calculatedAmount,
      };
    });

  // Accantonamento (pagato vs totale dovuto) — SOLO imposte e contributi,
  // NON le scadenze personalizzate (affitto, ecc.)
  const isFiscalType = (t) => !!t && (t.startsWith('imposta') || t.startsWith('inarcassa') || t.startsWith('inps'));
  const totaleDovuto = engineDeadlines.reduce((s, d) => s + d.calculatedAmount, 0);
  const accantonato = yearDeadlineRecords
    .filter(r => r.is_paid && isFiscalType(r.type))
    .reduce((s, r) => s + (r.amount_override ?? r.amount_calculated ?? 0), 0);
  const pct = totaleDovuto > 0 ? Math.min(100, Math.round(accantonato / totaleDovuto * 100)) : 0;

  // Spese ricorrenti personalizzate (affitto, ecc.) — distinte dalle tasse
  const customOccurrences = useMemo(() => {
    return (customTemplates || [])
      .filter(t => templateActive(t, selectedYear))
      .flatMap(t => expandTemplate(t, selectedYear).map(o => {
        const rec = yearDeadlineRecords.find(r => r.type === 'custom' && r.label === o.label && Number(r.month) === Number(o.month) && Number(r.day) === Number(o.day));
        return { ...o, isPaid: rec?.is_paid || false };
      }))
      .sort((a, b) => (a.month - b.month) || (a.day - b.day));
  }, [customTemplates, selectedYear, yearDeadlineRecords]);
  const speseTotaleAnno = customOccurrences.reduce((s, o) => s + (o.amount || 0), 0);
  const spesePagate = customOccurrences.filter(o => o.isPaid).reduce((s, o) => s + (o.amount || 0), 0);
  const today2 = new Date();
  const prossimeSpese = customOccurrences.filter(o => !o.isPaid && new Date(selectedYear, o.month - 1, o.day) >= new Date(today2.toDateString())).slice(0, 3);

  const years = []; for (let y = 2023; y <= currentYear + 1; y++) years.push(y);

  return (
    <div className="fxl" style={{ background: 'var(--fx-bg)', color: 'var(--fx-txt)' }}>
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
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>Ciao {displayName?.split(' ')[0] || ''}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="relative">
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
              className="fx-panel fx-num appearance-none cursor-pointer" style={{ padding: '7px 28px 7px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--fx-txt)' }}>
              {years.map(y => <option key={y} value={y}>Anno {y}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--fx-mut)' }} />
          </div>
          <button onClick={() => { setEditingIncome(null); setShowIncomeForm(true); }}
            style={{ background: 'var(--fx-ind)', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus className="w-4 h-4" /> Registra pagamento
          </button>
        </div>
      </div>

      <div className="animate-fade-up" style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* KPI */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Kpi label={`Incassato ${selectedYear}`} value={euro(profIncome)} sub={`${withStato.filter(i => i._stato === 'incassata').length} fatture incassate`}
            onClick={() => navigate(`/Pagamenti?f=incassata&anno=${selectedYear}`)} />
          <Kpi label={`Tasse stimate ${selectedYear + 1}`} value={euro(tasseStimate)} accent
            onClick={() => setShowStima(true)}
            sub={`${euro(imposta)} imposta + ${euro(estimatedContributi)} contributi`} />
          <Kpi label="Da incassare" value={euro(daIncassare)} sub={`${numAperte} aperte · ${numScadute} scadute`}
            onClick={() => navigate(`/Pagamenti?f=aperte&anno=${selectedYear}`)} />
        </div>

        {/* Grid */}
        <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: '1.9fr 1fr', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            {/* Chart */}
            <div className="fx-panel" style={{ padding: '18px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 14 }}>
                <div className="fx-label">Incassi mensili</div>
                <div className="fx-num" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fx-mut)' }}>GEN–DIC {selectedYear}</div>
              </div>
              <Bars data={chartData} />
            </div>
            {/* Pagamenti recenti */}
            <div className="fx-panel" style={{ padding: '18px 22px' }}>
              <div className="fx-label" style={{ marginBottom: 6 }}>Pagamenti recenti</div>
              {recent.length === 0 && <div style={{ fontSize: 13, color: 'var(--fx-mut)', padding: '14px 0' }}>Nessun pagamento registrato per il {selectedYear}.</div>}
              {recent.map((p, i) => (
                <div key={p.id} onClick={() => { setEditingIncome(p); setShowIncomeForm(true); }}
                  style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 0.7fr 0.5fr auto', gap: 12, alignItems: 'center', padding: '10.5px 0', cursor: 'pointer',
                    borderTop: i ? '1px solid var(--fx-line-soft)' : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.cliente || p.description || 'Pagamento'}</div>
                  <div className="fx-num" style={{ fontSize: 11.5, color: 'var(--fx-mut)' }}>{p.numero_doc || (p.type === 'professionale' ? 'PROF.' : 'PERS.')}</div>
                  <div className="fx-num" style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{euro2(Number(p.amount))}</div>
                  <div className="fx-num" style={{ fontSize: 11.5, color: 'var(--fx-mut)', textAlign: 'right' }}>{(p.date || p.data_emissione) ? new Date(p.date || p.data_emissione).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : ''}</div>
                  <StatusBadge stato={p._stato} />
                </div>
              ))}
            </div>
          </div>

          {/* Colonna destra */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="fx-panel cursor-pointer hover-lift" style={{ padding: '18px 22px' }} onClick={() => navigate('/ScadenzeFiscali')}>
              <div className="fx-label flex items-center gap-1.5" style={{ marginBottom: 4 }}>
                Prossime scadenze <span style={{ color: 'var(--fx-accent)', fontSize: 12 }}>›</span>
              </div>
              {nextScad.map((d, i) => (
                <div key={d.key} style={{ borderTop: i ? '1px solid var(--fx-line-soft)' : 'none' }}>
                  <ScadenzaRow d={d} />
                </div>
              ))}
            </div>
            <div className="fx-panel cursor-pointer hover-lift" style={{ padding: '18px 22px' }} onClick={() => navigate('/ScadenzeFiscali')}>
              <div className="fx-label flex items-center gap-1.5" style={{ marginBottom: 12 }}>
                Accantonamento tasse <span style={{ color: 'var(--fx-accent)', fontSize: 12 }}>›</span>
              </div>
              <div className="fx-num" style={{ fontSize: 24, fontWeight: 600 }}>{euro(accantonato)} <span style={{ fontSize: 12.5, color: 'var(--fx-mut)', fontWeight: 500 }}>/ {new Intl.NumberFormat('it-IT').format(Math.round(totaleDovuto))}</span></div>
              <div style={{ height: 8, borderRadius: 99, background: 'var(--fx-chip)', margin: '12px 0 8px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: 'var(--fx-ind)', transition: 'width .4s ease' }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--fx-mut)', lineHeight: 1.5 }}>
                Sei al {pct}%. {pct < 100 ? <>Restano da accantonare <b className="fx-num" style={{ color: 'var(--fx-txt)' }}>{euro(Math.max(0, totaleDovuto - accantonato))}</b>.</> : 'Sei coperto! 🎉'}
              </div>
            </div>

            {/* Spese ricorrenti (personalizzate, non tasse) */}
            {customOccurrences.length > 0 && (
              <div className="fx-panel cursor-pointer hover-lift" style={{ padding: '18px 22px' }} onClick={() => navigate('/ScadenzeFiscali')}>
                <div className="flex items-baseline justify-between mb-2.5">
                  <div className="fx-label flex items-center gap-1.5">Spese ricorrenti <span style={{ color: 'var(--fx-accent)', fontSize: 12 }}>›</span></div>
                  <div className="fx-num" style={{ fontSize: 11, color: 'var(--fx-mut)' }}>{customOccurrences.length} voci · {selectedYear}</div>
                </div>
                <div className="fx-num" style={{ fontSize: 22, fontWeight: 700 }}>{euro(speseTotaleAnno)}</div>
                <div style={{ fontSize: 11.5, color: 'var(--fx-mut)', marginTop: 2 }}>
                  pagate <b className="fx-num" style={{ color: 'var(--fx-ok)' }}>{euro(spesePagate)}</b> · da pagare <b className="fx-num" style={{ color: 'var(--fx-txt)' }}>{euro(speseTotaleAnno - spesePagate)}</b>
                </div>
                {prossimeSpese.length > 0 && (
                  <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: '1px solid var(--fx-line-soft)' }}>
                    {prossimeSpese.map(o => (
                      <div key={o.key} className="flex items-center justify-between text-[12px]">
                        <span style={{ color: 'var(--fx-txt)' }}>{o.label}</span>
                        <span className="fx-num" style={{ color: 'var(--fx-mut)' }}>{String(o.day).padStart(2, '0')} {MESI[o.month - 1].toLowerCase()} · {euro(o.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showIncomeForm && (
        <IncomeForm initialData={editingIncome} onSubmit={(data) => createIncome.mutate(data)} onClose={() => { setShowIncomeForm(false); setEditingIncome(null); }} />
      )}

      {/* Popup stima da accantonare */}
      <Dialog open={showStima} onOpenChange={setShowStima}>
        <DialogContent className="rounded-[16px] sm:max-w-2xl shadow-apple-lg" style={{ background: 'var(--fx-panel)' }}>
          <DialogHeader>
            <DialogTitle className="fx-label" style={{ fontSize: 11 }}>
              Stima da accantonare per il {selectedYear + 1} · forfettario{isInarcassa ? ' · Inarcassa' : ''}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2 rounded-[12px] p-5" style={{ background: 'var(--fx-bg)' }}>
            <div className="stima-row" style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
              <Step label={`Incassato ${selectedYear}`} value={euro(profIncome)} />
              <Op>×{Math.round(coeff * 100)}%</Op>
              <Step label="Imponibile" value={euro(profIncome * coeff)} />
              <Op>→</Op>
              <Step label={`Imposta${taxRate != null ? ` ${taxRate}%` : ' (da dich.)'}`} value={euro(imposta)} />
              <Op>+</Op>
              <Step label="Contributi prev." value={euro(estimatedContributi)} />
            </div>
            <div className="mt-5 pt-4 flex items-end justify-between" style={{ borderTop: '1px solid var(--fx-line)' }}>
              <div className="fx-label" style={{ color: 'var(--fx-accent)' }}>Totale da accantonare</div>
              <div className="fx-num" style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fx-accent)', lineHeight: 1 }}>{euro(tasseStimate)}</div>
            </div>
          </div>

          <div className="space-y-2 mt-1">
            <p style={{ fontSize: 12.5, color: 'var(--fx-mut)', lineHeight: 1.5 }}>
              Stima sulle fatture <b>incassate</b> del {selectedYear} (le verserai nel {selectedYear + 1}). I contributi {isInarcassa ? 'Inarcassa' : 'INPS'} usano le aliquote correnti{isInarcassa ? ' (soggettivo, integrativo, maternità)' : ''}.
            </p>
            {usaProxyMinimi && (
              <p className="fx-mono" style={{ fontSize: 11.5, color: 'var(--fx-warn)', lineHeight: 1.5 }}>
                ⓘ Minimi {selectedYear} non ancora inseriti: uso quelli del {selectedYear - 1} ({euro(minimiProxy)}) come proxy del minimo contributivo.
              </p>
            )}
            <p style={{ fontSize: 11.5, color: 'var(--fx-mut)' }}>
              Per una stima precisa inserisci l'imposta dovuta e i minimi dell'anno nelle <b>Impostazioni</b>.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
