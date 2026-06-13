import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/lib/useUserProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { LogoWordmark } from '@/components/brand/Logo';
import { base44 } from '@/api/base44Client';

const STEPS = ['Chi sei', 'La tua attività', 'La tua previdenza', 'I tuoi numeri', 'Tutto pronto!'];

const PROFESSIONS = [
  { value: 'architetto', label: 'Architetto' },
  { value: 'ingegnere', label: 'Ingegnere' },
  { value: 'altro_inarcassa', label: 'Altro (Inarcassa)' },
  { value: 'altro_inps', label: 'Altro (INPS)' },
];

const PENSION_FUNDS = [
  { value: 'inarcassa', label: 'Inarcassa' },
  { value: 'inps_gestione_separata', label: 'INPS Gestione Separata' },
  { value: 'altro', label: 'Altra cassa' },
];

const TAX_REGIMES = [
  { value: 'forfettario_5', label: 'Forfettario 5% (startup)' },
  { value: 'forfettario_15', label: 'Forfettario 15%' },
  { value: 'ordinario', label: 'Regime Ordinario' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => currentYear - i);

export default function Onboarding() {
  const navigate = useNavigate();
  const { saveProfile, isSaving, randomColor } = useUserProfile();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    first_name: '', last_name: '', vat_number: '', fiscal_code: '', birth_year: '',
    profession: '', activity_start_year: currentYear,
    tax_regime: 'forfettario_15',
    pension_fund: 'inarcassa', pension_fund_start_year: currentYear,
    // Numeri fiscali iniziali (facoltativi) per partire già calibrati
    imposta_dovuta_prev: '', minimi_current: '',
  });

  const set = (key, val) => setData(d => ({ ...d, [key]: val }));
  const prevYear = currentYear - 1;

  const handleFinish = async () => {
    const { imposta_dovuta_prev, minimi_current, ...profileData } = data;
    await saveProfile({ ...profileData, avatar_color: randomColor() });

    // Crea le impostazioni fiscali iniziali se l'utente ha fornito i numeri
    const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
    try {
      const imp = num(imposta_dovuta_prev);
      if (imp != null) await base44.entities.FiscalSettings.create({ year: prevYear, imposta_dovuta: imp });
      const min = num(minimi_current);
      if (min != null) await base44.entities.FiscalSettings.create({ year: currentYear, inarcassa_minimi: min });
    } catch (e) { /* non bloccare l'onboarding se il salvataggio settings fallisce */ }

    toast.success('Profilo creato! Benvenuto in Forfex.');
    navigate('/');
  };

  const canNext = () => {
    if (step === 0) return data.first_name.trim() && data.last_name.trim();
    if (step === 1) return data.profession && data.activity_start_year;
    if (step === 2) return data.pension_fund && data.pension_fund_start_year;
    return true; // step 3 (numeri) facoltativo
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fx-bg)', color: 'var(--fx-txt)' }} className="flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-7">
        <LogoWordmark size={34} />
      </div>

      {/* Card */}
      <div className="fx-panel w-full max-w-md overflow-hidden" style={{ borderRadius: 14 }}>
        {/* Progress */}
        <div className="flex gap-1.5 p-3">
          {STEPS.map((s, i) => (
            <div key={i} className="h-[3.5px] flex-1 rounded-full transition-colors duration-300"
              style={{ background: i <= step ? 'var(--fx-ind)' : 'var(--fx-chip)' }} />
          ))}
        </div>

        <div className="px-8 pb-8 pt-3">
          {/* Step indicator */}
          <p className="fx-label mb-2">Passo {step + 1} di {STEPS.length}</p>

          {/* Step 0 */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Benvenuto!</h2>
                <p className="text-slate-500 mt-1 text-sm">Dicci come ti chiami per iniziare.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nome <span className="text-rose-500">*</span></Label>
                  <Input value={data.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Mario" />
                </div>
                <div className="space-y-1.5">
                  <Label>Cognome <span className="text-rose-500">*</span></Label>
                  <Input value={data.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Rossi" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Partita IVA</Label>
                <Input value={data.vat_number} onChange={e => set('vat_number', e.target.value)} placeholder="IT12345678901" />
              </div>
              <div className="space-y-1.5">
                <Label>Codice Fiscale</Label>
                <Input value={data.fiscal_code} onChange={e => set('fiscal_code', e.target.value)} placeholder="RSSMRA..." />
              </div>
              <div className="space-y-1.5">
                <Label>Anno di nascita</Label>
                <Input type="number" value={data.birth_year} onChange={e => set('birth_year', e.target.value ? Number(e.target.value) : '')} placeholder="es. 1992" />
                <p className="text-xs text-slate-400">Serve per le agevolazioni Inarcassa under 35</p>
              </div>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">La tua attività</h2>
                <p className="text-slate-500 mt-1 text-sm">Professione e regime fiscale.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Professione</Label>
                <Select value={data.profession} onValueChange={v => set('profession', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent>
                    {PROFESSIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Anno inizio attività</Label>
                <Select value={String(data.activity_start_year)} onValueChange={v => set('activity_start_year', Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Regime fiscale</Label>
                <Select value={data.tax_regime} onValueChange={v => set('tax_regime', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TAX_REGIMES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">La tua previdenza</h2>
                <p className="text-slate-500 mt-1 text-sm">A quale cassa previdenziale sei iscritto?</p>
              </div>
              <div className="space-y-1.5">
                <Label>Cassa previdenziale</Label>
                <Select value={data.pension_fund} onValueChange={v => set('pension_fund', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PENSION_FUNDS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Anno primo versamento</Label>
                <Select value={String(data.pension_fund_start_year)} onValueChange={v => set('pension_fund_start_year', Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">Usato per calcolare correttamente il conguaglio Inarcassa</p>
              </div>
            </div>
          )}

          {/* Step 3 — I tuoi numeri (facoltativo) */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--fx-txt)' }}>I tuoi numeri</h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--fx-mut)' }}>
                  Due dati (facoltativi) per partire già calibrato. Niente documenti da caricare — li trovi sulla
                  dichiarazione del commercialista e sul bollettino Inarcassa. Puoi anche saltare e inserirli dopo.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Imposta sostitutiva dovuta {prevYear} (€)</Label>
                <Input type="text" inputMode="decimal" value={data.imposta_dovuta_prev}
                  onChange={e => set('imposta_dovuta_prev', e.target.value)} placeholder="es. 1029.30" />
                <p className="text-xs text-slate-400">Dalla dichiarazione dei redditi {prevYear}. Serve per le scadenze di saldo/acconto esatte.</p>
              </div>

              {data.pension_fund === 'inarcassa' && (
                <div className="space-y-1.5">
                  <Label>Minimi Inarcassa {currentYear} (€)</Label>
                  <Input type="text" inputMode="decimal" value={data.minimi_current}
                    onChange={e => set('minimi_current', e.target.value)} placeholder="es. 1303" />
                  <p className="text-xs text-slate-400">Il totale dei minimi annui (verrà diviso 50% giugno + 50% settembre).</p>
                </div>
              )}

              <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: 'var(--fx-chip)' }}>
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--fx-ind)' }} />
                <p className="text-xs" style={{ color: 'var(--fx-mut)' }}>
                  Nessun F24 o documento viene caricato. Memorizziamo solo i pochi importi che inserisci tu.
                </p>
              </div>
            </div>
          )}

          {/* Step 4 — Riepilogo */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--fx-accent-soft)' }}>
                  <CheckCircle2 className="w-9 h-9" style={{ color: 'var(--fx-ind)' }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--fx-txt)' }}>Tutto pronto, {data.first_name}!</h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--fx-mut)' }}>Ecco un riepilogo del tuo profilo.</p>
                </div>
              </div>
              <div className="rounded-xl p-4 space-y-2 text-sm" style={{ background: 'var(--fx-chip)' }}>
                <div className="flex justify-between"><span className="text-slate-500">Nome</span><span className="font-medium">{data.first_name} {data.last_name}</span></div>
                {data.vat_number && <div className="flex justify-between"><span className="text-slate-500">P.IVA</span><span className="font-medium">{data.vat_number}</span></div>}
                <div className="flex justify-between"><span className="text-slate-500">Professione</span><span className="font-medium capitalize">{data.profession.replace('_', ' ')}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Regime</span><span className="font-medium">{data.tax_regime.replace('_', ' ')}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Cassa prev.</span><span className="font-medium">{PENSION_FUNDS.find(p => p.value === data.pension_fund)?.label}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">1° versamento</span><span className="font-medium">{data.pension_fund_start_year}</span></div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Indietro
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="gap-1 text-white"
                style={{ background: 'var(--fx-ind)' }}
              >
                Avanti <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={isSaving}
                className="text-white"
                style={{ background: 'var(--fx-ind)' }}
              >
                {isSaving ? 'Salvataggio...' : 'Inizia →'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}