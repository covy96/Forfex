import React, { useState, useEffect } from 'react';
import { useUserProfile } from '@/lib/useUserProfile';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";
import { toast } from "sonner";

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

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
  { value: 'forfettario_5', label: 'Forfettario 5%' },
  { value: 'forfettario_15', label: 'Forfettario 15%' },
  { value: 'ordinario', label: 'Regime Ordinario' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => currentYear - i);

export default function Profile() {
  const { user, profile, saveProfile, initials, avatarColor, displayName } = useUserProfile();
  const [form, setForm] = useState({
    first_name: '', last_name: '', fiscal_code: '', vat_number: '', birth_year: '',
    profession: '', pension_fund: '', activity_start_year: '',
    pension_fund_start_year: '', tax_regime: '', email_notifications: false,
    avatar_color: AVATAR_COLORS[0],
  });

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        fiscal_code: profile.fiscal_code || '',
        vat_number: profile.vat_number || '',
        birth_year: profile.birth_year || '',
        profession: profile.profession || '',
        pension_fund: profile.pension_fund || '',
        activity_start_year: profile.activity_start_year || '',
        pension_fund_start_year: profile.pension_fund_start_year || '',
        tax_regime: profile.tax_regime || '',
        email_notifications: profile.email_notifications || false,
        avatar_color: profile.avatar_color || AVATAR_COLORS[0],
      });
    }
  }, [profile?.id]);

  const handleSave = async () => {
    await saveProfile({
      ...form,
      birth_year: form.birth_year ? Number(form.birth_year) : null,
      activity_start_year: form.activity_start_year ? Number(form.activity_start_year) : null,
      pension_fund_start_year: form.pension_fund_start_year ? Number(form.pension_fund_start_year) : null,
    });
    toast.success('Profilo aggiornato');
  };

  const set = (field) => (val) => setForm(f => ({ ...f, [field]: val }));
  const setInput = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div style={{ background: "var(--fx-bg)", color: "var(--fx-txt)" }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'color-mix(in oklch, var(--fx-bg) 92%, transparent)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--fx-line-soft)',
        padding: '0 30px',
        display: 'flex', alignItems: 'center',
        height: 56,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>Profilo</div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6 animate-fade-up [&_.bg-white]:shadow-apple">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ backgroundColor: form.avatar_color }}
          >
            {initials}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{displayName || user?.email}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="flex gap-2 mt-2">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(f => ({ ...f, avatar_color: c }))}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${form.avatar_color === c ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Dati Personali */}
        <Card className="fx-panel border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dati Personali</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Nome</Label>
                <Input value={form.first_name} onChange={setInput('first_name')} placeholder="Mario" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Cognome</Label>
                <Input value={form.last_name} onChange={setInput('last_name')} placeholder="Rossi" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Codice Fiscale</Label>
                <Input value={form.fiscal_code} onChange={setInput('fiscal_code')} placeholder="RSSMRA80A01H501Z" className="uppercase" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Partita IVA</Label>
                <Input value={form.vat_number} onChange={setInput('vat_number')} placeholder="12345678901" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Anno di nascita</Label>
                <Input type="number" value={form.birth_year} onChange={setInput('birth_year')} placeholder="es. 1992" />
                <p className="text-xs text-slate-400">Per agevolazioni Inarcassa under 35</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attività */}
        <Card className="fx-panel border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Attività Professionale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Professione</Label>
                <Select value={form.profession} onValueChange={set('profession')}>
                  <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent>
                    {PROFESSIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Anno inizio attività</Label>
                <Select value={String(form.activity_start_year)} onValueChange={set('activity_start_year')}>
                  <SelectTrigger><SelectValue placeholder="Anno..." /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Previdenza */}
        <Card className="fx-panel border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cassa Previdenziale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Cassa previdenziale</Label>
                <Select value={form.pension_fund} onValueChange={set('pension_fund')}>
                  <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent>
                    {PENSION_FUNDS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Anno primo versamento</Label>
                <Select value={String(form.pension_fund_start_year)} onValueChange={set('pension_fund_start_year')}>
                  <SelectTrigger><SelectValue placeholder="Anno..." /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regime Fiscale */}
        <Card className="fx-panel border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Regime Fiscale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Regime fiscale</Label>
              <Select value={form.tax_regime} onValueChange={set('tax_regime')}>
                <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                <SelectContent>
                  {TAX_REGIMES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifiche */}
        <Card className="fx-panel border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notifiche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Notifiche email scadenze</p>
                <p className="text-xs text-slate-500">Ricevi promemoria sulle scadenze fiscali</p>
              </div>
              <Switch checked={form.email_notifications} onCheckedChange={set('email_notifications')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="text-white" style={{ background: "var(--fx-ind)" }}>
            <Save className="w-4 h-4 mr-2" /> Salva Profilo
          </Button>
        </div>
      </div>
    </div>
  );
}