import React, { useState, useEffect } from 'react';
import { useUserProfile } from '@/lib/useUserProfile';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save, LogOut } from "lucide-react";
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/layout/PageHeader';
import Disclaimer from '@/components/Disclaimer';
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
      <PageHeader
        title="Profilo"
        actions={
          <button onClick={() => base44.auth.logout()} className="md:hidden flex items-center gap-1.5 text-[12.5px] font-semibold rounded-[9px] px-3 h-[34px]"
            style={{ background: 'var(--fx-panel)', color: 'var(--fx-bad)', border: '1px solid var(--fx-line)' }}>
            <LogOut className="w-3.5 h-3.5" /> Esci
          </button>
        }
      />

      <div className="fx-page max-w-2xl mx-auto w-full animate-fade-up">
        {/* Avatar */}
        <div className="fx-panel p-4 md:p-5 flex items-center gap-4">
          <div
            className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold text-white flex-shrink-0"
            style={{ backgroundColor: form.avatar_color }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold truncate">{displayName || user?.email}</p>
            <p className="text-sm text-fx-mut truncate">{user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-2.5">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(f => ({ ...f, avatar_color: c }))}
                  aria-label={`Colore ${c}`}
                  className={`w-6 h-6 md:w-5 md:h-5 rounded-full border-2 transition-all ${form.avatar_color === c ? 'scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c, ...(form.avatar_color === c ? { borderColor: 'var(--fx-txt)', boxShadow: '0 0 0 2px var(--fx-panel) inset' } : {}) }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Dati Personali */}
        <Card className="fx-panel shadow-none">
          <CardHeader className="p-4 pb-3 md:p-6 md:pb-3">
            <CardTitle className="text-[15px] font-semibold">Dati Personali</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="fx-label">Nome</Label>
                <Input value={form.first_name} onChange={setInput('first_name')} placeholder="Mario" />
              </div>
              <div className="space-y-1.5">
                <Label className="fx-label">Cognome</Label>
                <Input value={form.last_name} onChange={setInput('last_name')} placeholder="Rossi" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="fx-label">Codice Fiscale</Label>
                <Input value={form.fiscal_code} onChange={setInput('fiscal_code')} placeholder="RSSMRA80A01H501Z" className="uppercase" />
              </div>
              <div className="space-y-1.5">
                <Label className="fx-label">Partita IVA</Label>
                <Input value={form.vat_number} onChange={setInput('vat_number')} placeholder="12345678901" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="fx-label">Anno di nascita</Label>
                <Input type="number" value={form.birth_year} onChange={setInput('birth_year')} placeholder="es. 1992" />
                <p className="text-xs text-fx-mut">Per agevolazioni Inarcassa under 35</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attività */}
        <Card className="fx-panel shadow-none">
          <CardHeader className="p-4 pb-3 md:p-6 md:pb-3">
            <CardTitle className="text-[15px] font-semibold">Attività Professionale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="fx-label">Professione</Label>
                <Select value={form.profession} onValueChange={set('profession')}>
                  <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent>
                    {PROFESSIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="fx-label">Anno inizio attività</Label>
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
        <Card className="fx-panel shadow-none">
          <CardHeader className="p-4 pb-3 md:p-6 md:pb-3">
            <CardTitle className="text-[15px] font-semibold">Cassa Previdenziale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="fx-label">Cassa previdenziale</Label>
                <Select value={form.pension_fund} onValueChange={set('pension_fund')}>
                  <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent>
                    {PENSION_FUNDS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="fx-label">Anno primo versamento</Label>
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
        <Card className="fx-panel shadow-none">
          <CardHeader className="p-4 pb-3 md:p-6 md:pb-3">
            <CardTitle className="text-[15px] font-semibold">Regime Fiscale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
            <div className="space-y-1.5">
              <Label className="fx-label">Regime fiscale</Label>
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
        <Card className="fx-panel shadow-none">
          <CardHeader className="p-4 pb-3 md:p-6 md:pb-3">
            <CardTitle className="text-[15px] font-semibold">Notifiche</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium ">Notifiche email scadenze</p>
                <p className="text-xs text-fx-mut">Ricevi promemoria sulle scadenze fiscali</p>
              </div>
              <Switch checked={form.email_notifications} onCheckedChange={set('email_notifications')} />
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] md:static z-10 flex md:justify-end">
          <Button onClick={handleSave} className="w-full md:w-auto h-12 md:h-10 rounded-[10px] shadow-apple-lg md:shadow-apple text-white text-[15px] md:text-sm" style={{ background: "var(--fx-ind)" }}>
            <Save className="w-4 h-4 mr-2" /> Salva profilo
          </Button>
        </div>

        <div className="md:hidden">
          <Disclaimer />
        </div>
      </div>
    </div>
  );
}