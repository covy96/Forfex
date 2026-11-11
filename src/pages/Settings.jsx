import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '@/lib/useUserProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Percent, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { getDefaultRates, getTaxRate } from '@/lib/fiscalEngine';
import Disclaimer from '@/components/Disclaimer';
import PageHeader, { YearSegment } from '@/components/layout/PageHeader';

const currentYear = new Date().getFullYear();
const YEARS = [];
for (let y = 2023; y <= currentYear + 1; y++) YEARS.push(y);

// Aliquote/coefficienti per anno (i minimi hanno un campo dedicato sopra)
const RATE_FIELDS = [
  { key: 'profitability_coefficient', label: 'Coefficiente redditività (%)', ph: 78 },
  { key: 'inarcassa_subjective_rate', label: 'Soggettivo (%)', defKey: 'soggettivo', fund: 'inarcassa' },
  { key: 'inarcassa_integrative_rate', label: 'Integrativo (%)', defKey: 'integrativo', fund: 'inarcassa' },
  { key: 'inps_rate', label: 'INPS Gest. Separata (%)', defKey: 'aliquota', fund: 'inps_gestione_separata' },
  { key: 'initial_cash', label: 'Disponibilità iniziale cassa (€)', ph: 0 },
];

const ALL_FIELDS = ['imposta_dovuta', 'inarcassa_minimi', ...RATE_FIELDS.map(f => f.key)];
const SPRING = { type: 'spring', stiffness: 400, damping: 30 };

export default function Settings() {
  const { user, profile } = useUserProfile();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [form, setForm] = useState({});

  const { data: fiscalSettings = [] } = useQuery({
    queryKey: ['fiscalSettings', user?.id],
    queryFn: () => base44.entities.FiscalSettings.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const settings = fiscalSettings.find(s => s.year === selectedYear);

  useEffect(() => {
    const f = {};
    ALL_FIELDS.forEach((key) => {
      f[key] = settings?.[key] != null ? String(settings[key]) : '';
    });
    setForm(f);
  }, [selectedYear, settings?.id]);

  const saveMutation = useMutation({
    mutationFn: (data) => settings?.id
      ? base44.entities.FiscalSettings.update(settings.id, data)
      : base44.entities.FiscalSettings.create({ ...data, year: selectedYear }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscalSettings'] });
      toast.success(`Impostazioni ${selectedYear} salvate`);
    },
  });

  const handleSave = () => {
    const payload = {};
    ALL_FIELDS.forEach((key) => {
      const raw = form[key];
      payload[key] = raw === '' || raw == null ? null : parseFloat(String(raw).replace(',', '.'));
    });
    saveMutation.mutate(payload);
  };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const taxAuto = getTaxRate(profile, selectedYear, {});
  const minimi = parseFloat(String(form.inarcassa_minimi || '').replace(',', '.')) || 0;
  const isInarcassa = (profile?.pension_fund || 'inarcassa') === 'inarcassa';
  const visibleRateFields = RATE_FIELDS.filter(f => !f.fund || f.fund === (profile?.pension_fund || 'inarcassa'));

  return (
    <div style={{ background: "var(--fx-bg)", color: "var(--fx-txt)" }}>
      <PageHeader
        title="Impostazioni fiscali"
        subtitle={`Parametri dell'anno ${selectedYear}`}
        extra={<YearSegment years={YEARS} value={selectedYear} onChange={setSelectedYear} />}
      />

      <div className="fx-page max-w-2xl mx-auto w-full animate-fade-up">

        {/* IMPOSTA DOVUTA — da dichiarazione */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="fx-panel p-4 md:p-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <Percent className="w-4 h-4 text-fx-accent" />
            <h3 className="text-[15px] font-semibold">Imposta sostitutiva dovuta {selectedYear}</h3>
          </div>
          <p className="text-[12px] leading-relaxed text-fx-mut mb-4">
            Importo dalla <b>dichiarazione dei redditi</b> del commercialista. Se lo inserisci, le scadenze (saldo + acconti)
            sono <b>esatte</b>; se lo lasci vuoto, l'app lo stima dal reddito ({taxAuto != null ? `${taxAuto}%` : 'n/d'}).
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 space-y-1.5">
              <Label className="fx-label">Imposta dovuta {selectedYear} (€)</Label>
              <Input
                type="text" inputMode="decimal"
                value={form.imposta_dovuta ?? ''}
                onChange={(e) => setField('imposta_dovuta', e.target.value)}
                placeholder="es. 1029.30"
                className="rounded-[10px] text-lg font-semibold border-fx-line h-11 fx-num"
              />
            </div>
            <div className="rounded-[10px] bg-fx-chip px-4 py-2.5 text-center sm:min-w-[120px]">
              <p className="fx-label">Acconto (50%+50%)</p>
              <p className="text-lg font-bold fx-num">
                {(((parseFloat(String(form.imposta_dovuta || '').replace(',', '.')) || 0)) * 0.5).toFixed(2)} € ×2
              </p>
            </div>
          </div>
        </motion.div>

        {/* MINIMI INARCASSA — solo per utenti Inarcassa */}
        {isInarcassa && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.04 }}
          className="fx-panel p-4 md:p-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="w-4 h-4 text-fx-accent" />
            <h3 className="text-[15px] font-semibold">Minimi Inarcassa {selectedYear}</h3>
          </div>
          <p className="text-[12px] leading-relaxed text-fx-mut mb-4">
            Inserisci il totale dei minimi che paghi quest'anno. Verrà diviso automaticamente: <b>50% a giugno</b> e <b>50% a settembre</b>.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 space-y-1.5">
              <Label className="fx-label">Minimi annui (€)</Label>
              <Input
                type="text" inputMode="decimal"
                value={form.inarcassa_minimi ?? ''}
                onChange={(e) => setField('inarcassa_minimi', e.target.value)}
                placeholder="es. 1303"
                className="rounded-[10px] text-lg font-semibold border-fx-line h-11 fx-num"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[10px] bg-fx-accent-soft px-4 py-2.5 text-center sm:min-w-[110px]">
                <p className="fx-label text-fx-accent">Giugno (50%)</p>
                <p className="text-lg font-bold text-fx-accent fx-num">{(minimi * 0.5).toFixed(2)} €</p>
              </div>
              <div className="rounded-[10px] bg-fx-accent-soft px-4 py-2.5 text-center sm:min-w-[110px]">
                <p className="fx-label text-fx-accent">Settembre (50%)</p>
                <p className="text-lg font-bold text-fx-accent fx-num">{(minimi * 0.5).toFixed(2)} €</p>
              </div>
            </div>
          </div>
        </motion.div>
        )}

        {/* ALIQUOTE / COEFFICIENTI */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.05 }}
          className="fx-panel p-4 md:p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Percent className="w-4 h-4 text-fx-accent" />
            <h3 className="text-[15px] font-semibold">Aliquote e coefficienti</h3>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-fx-chip text-fx-mut mb-4">
            <Percent className="w-3 h-3" /> Imposta sostitutiva automatica {selectedYear}: {taxAuto != null ? `${taxAuto}%` : 'n/d'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visibleRateFields.map(({ key, label, ph, defKey, fund }) => {
              const def = defKey ? (getDefaultRates(fund, selectedYear)?.[defKey]) : ph;
              return (
                <div key={key} className="space-y-1.5">
                  <Label className="fx-label">{label}</Label>
                  <Input
                    type="text" inputMode="decimal"
                    value={form[key] ?? ''}
                    onChange={(e) => setField(key, e.target.value)}
                    placeholder={def != null ? `default ${def}` : ''}
                    className="rounded-[10px] border-fx-line h-11 fx-num"
                  />
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] md:static z-10 flex md:justify-end">
          <motion.div whileTap={{ scale: 0.96 }} className="w-full md:w-auto">
            <Button onClick={handleSave} disabled={saveMutation.isPending}
              className="w-full md:w-auto h-12 md:h-10 rounded-[10px] shadow-apple-lg md:shadow-apple px-5 text-white text-[15px] md:text-sm" style={{ background: "var(--fx-ind)" }}>
              <Save className="w-4 h-4 mr-2" /> {saveMutation.isPending ? 'Salvataggio…' : `Salva ${selectedYear}`}
            </Button>
          </motion.div>
        </div>

        <Disclaimer />
      </div>
    </div>
  );
}
