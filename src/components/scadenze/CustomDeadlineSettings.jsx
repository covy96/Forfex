import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '@/lib/useUserProfile';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, X, Check, Repeat } from "lucide-react";
import { toast } from "sonner";
import { RECURRENCES, WEEKDAYS } from "@/lib/recurrence";

const MONTHS = [
  { value: 1, label: 'Gennaio' }, { value: 2, label: 'Febbraio' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Aprile' }, { value: 5, label: 'Maggio' }, { value: 6, label: 'Giugno' },
  { value: 7, label: 'Luglio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Settembre' },
  { value: 10, label: 'Ottobre' }, { value: 11, label: 'Novembre' }, { value: 12, label: 'Dicembre' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const EMPTY_FORM = {
  label: '', recurrence: 'annuale',
  month: 6, day: 30, weekday: 1, interval_days: '',
  amount: '', is_recurring: true, start_year: currentYear, notes: '',
};

const RECUR_LABEL = {
  annuale: 'ogni anno', mensile: 'ogni mese', settimanale: 'ogni settimana', giorni: 'ogni N giorni',
};

function formatCurrency(amount) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(amount || 0);
}

function DeadlineForm({ initial = EMPTY_FORM, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const set = (field) => (val) => setForm(f => ({ ...f, [field]: val }));
  const rec = form.recurrence || 'annuale';

  const handleSave = () => {
    if (!form.label.trim()) { toast.error('Inserisci un nome per la scadenza'); return; }
    if (!form.amount || isNaN(Number(form.amount))) { toast.error('Inserisci un importo valido'); return; }
    if (rec === 'giorni' && (!form.interval_days || Number(form.interval_days) < 1)) { toast.error('Inserisci ogni quanti giorni'); return; }
    onSave(form);
  };

  return (
    <Card className="border-2 bg-white" style={{ borderColor: 'var(--fx-ind)' }}>
      <CardContent className="p-5 space-y-4">
        <div className="space-y-1.5">
          <Label className="fx-label">Nome scadenza *</Label>
          <Input value={form.label} onChange={(e) => set('label')(e.target.value)} placeholder="es. TOSAP, Canone RAI, Affitto studio..." />
        </div>

        {/* Ripetizione */}
        <div className="space-y-1.5">
          <Label className="fx-label">Ripetizione</Label>
          <Select value={rec} onValueChange={(v) => set('recurrence')(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {RECURRENCES.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Campi condizionali per tipo di ripetizione */}
        {rec === 'annuale' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="fx-label">Mese *</Label>
              <Select value={String(form.month)} onValueChange={(v) => set('month')(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHS.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="fx-label">Giorno *</Label>
              <Select value={String(form.day)} onValueChange={(v) => set('day')(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        )}

        {rec === 'mensile' && (
          <div className="space-y-1.5">
            <Label className="fx-label">Giorno del mese *</Label>
            <Select value={String(form.day)} onValueChange={(v) => set('day')(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DAYS.map(d => <SelectItem key={d} value={String(d)}>{d} di ogni mese</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-xs" style={{ color: 'var(--fx-mut)' }}>Verrà creata una scadenza ogni mese in quel giorno.</p>
          </div>
        )}

        {rec === 'settimanale' && (
          <div className="space-y-1.5">
            <Label className="fx-label">Giorno della settimana</Label>
            <Select value={String(form.weekday)} onValueChange={(v) => set('weekday')(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{WEEKDAYS.map(w => <SelectItem key={w.value} value={String(w.value)}>{w.label}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-xs" style={{ color: 'var(--fx-mut)' }}>Ogni settimana, nel giorno scelto.</p>
          </div>
        )}

        {rec === 'giorni' && (
          <div className="space-y-1.5">
            <Label className="fx-label">Ogni quanti giorni *</Label>
            <Input type="number" min="1" step="1" value={form.interval_days}
              onChange={(e) => set('interval_days')(e.target.value)} placeholder="es. 15" />
            <p className="text-xs" style={{ color: 'var(--fx-mut)' }}>Ripete ogni N giorni a partire dal 1° gennaio dell'anno.</p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="fx-label">Importo (€) *</Label>
          <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => set('amount')(e.target.value)} placeholder="es. 500.00" />
        </div>

        <div className="flex items-center gap-3">
          <Switch checked={form.is_recurring} onCheckedChange={set('is_recurring')} />
          <Label className="text-xs cursor-pointer" style={{ color: 'var(--fx-mut)' }}>Valida anche gli anni successivi</Label>
        </div>

        <div className="space-y-1.5">
          <Label className="fx-label">{form.is_recurring ? 'Anno inizio' : 'Anno di riferimento'}</Label>
          <Select value={String(form.start_year)} onValueChange={(v) => set('start_year')(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="fx-label">Note (opzionale)</Label>
          <Input value={form.notes} onChange={(e) => set('notes')(e.target.value)} placeholder="Note aggiuntive..." />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onCancel}><X className="w-3.5 h-3.5 mr-1" />Annulla</Button>
          <Button size="sm" className="text-white" style={{ background: 'var(--fx-ind)' }} onClick={handleSave}><Check className="w-3.5 h-3.5 mr-1" />Salva</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomDeadlineSettings({ onClose }) {
  const { user } = useUserProfile();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data: templates = [] } = useQuery({
    queryKey: ['customDeadlineTemplates', user?.id],
    queryFn: () => base44.entities.PaymentDeadline.filter({ created_by: user?.email, type: 'custom', year: 9999 }),
    enabled: !!user,
  });

  const inval = () => { queryClient.invalidateQueries({ queryKey: ['customDeadlineTemplates'] }); queryClient.invalidateQueries({ queryKey: ['paymentDeadlines'] }); };
  const onErr = (e) => toast.error('Errore: ' + (e?.message || 'salvataggio non riuscito'));
  const createMutation = useMutation({ mutationFn: (data) => base44.entities.PaymentDeadline.create(data), onSuccess: () => { inval(); toast.success('Scadenza creata'); setShowForm(false); }, onError: onErr });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => base44.entities.PaymentDeadline.update(id, data), onSuccess: () => { inval(); toast.success('Scadenza aggiornata'); setEditingId(null); }, onError: onErr });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.PaymentDeadline.delete(id), onSuccess: () => { inval(); toast.success('Scadenza eliminata'); }, onError: onErr });

  const payloadFrom = (form) => ({
    label: form.label,
    recurrence: form.recurrence || 'annuale',
    month: Number(form.month),
    day: Number(form.day),
    weekday: form.recurrence === 'settimanale' ? Number(form.weekday) : null,
    interval_days: form.recurrence === 'giorni' ? Number(form.interval_days) : null,
    amount_calculated: Number(form.amount),
    is_recurring: form.is_recurring,
    start_year: Number(form.start_year),
    notes: form.notes,
  });

  const handleCreate = (form) => createMutation.mutate({ year: 9999, type: 'custom', amount_override: null, is_paid: false, ...payloadFrom(form) });
  const handleUpdate = (id, form) => updateMutation.mutate({ id, data: payloadFrom(form) });

  const monthLabel = (m) => MONTHS.find(x => x.value === Number(m))?.label || m;
  const recurSummary = (t) => {
    const r = t.recurrence || 'annuale';
    if (r === 'mensile') return `il ${t.day} di ogni mese`;
    if (r === 'settimanale') return `ogni ${(WEEKDAYS.find(w => w.value === Number(t.weekday))?.label || 'settimana').toLowerCase()}`;
    if (r === 'giorni') return `ogni ${t.interval_days} giorni`;
    return `${t.day || 30} ${monthLabel(t.month)} ogni anno`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--fx-txt)' }}>Scadenze Personalizzate</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--fx-mut)' }}>Ricorrenza annuale, mensile, settimanale o ogni N giorni</p>
        </div>
        <div className="flex gap-2">
          {!showForm && (
            <Button size="sm" className="h-8 text-xs text-white" style={{ background: 'var(--fx-ind)' }} onClick={() => { setShowForm(true); setEditingId(null); }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Nuova scadenza
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onClose}><X className="w-3.5 h-3.5 mr-1" /> Chiudi</Button>
        </div>
      </div>

      {showForm && <DeadlineForm onSave={handleCreate} onCancel={() => setShowForm(false)} />}

      {templates.length === 0 && !showForm && (
        <div className="text-center py-10 text-sm rounded-xl border-2 border-dashed" style={{ color: 'var(--fx-mut)', borderColor: 'var(--fx-line)' }}>
          Nessuna scadenza personalizzata.<br />Clicca "Nuova scadenza" per aggiungerne una.
        </div>
      )}

      <div className="space-y-3">
        {templates.map(t => (
          editingId === t.id ? (
            <DeadlineForm key={t.id}
              initial={{ label: t.label, recurrence: t.recurrence || 'annuale', month: t.month, day: t.day || 30,
                weekday: t.weekday ?? 1, interval_days: t.interval_days ?? '', amount: t.amount_calculated || '',
                is_recurring: t.is_recurring ?? true, start_year: t.start_year || currentYear, notes: t.notes || '' }}
              onSave={(form) => handleUpdate(t.id, form)} onCancel={() => setEditingId(null)} />
          ) : (
            <div key={t.id} className="fx-panel" style={{ padding: 16 }}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--fx-txt)' }}>
                    <Repeat className="w-3.5 h-3.5" style={{ color: 'var(--fx-accent)' }} />{t.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--fx-mut)' }}>
                    {recurSummary(t)}{t.is_recurring ? ` · dal ${t.start_year}` : ` · solo ${t.start_year}`}{t.notes ? ` · ${t.notes}` : ''}
                  </p>
                </div>
                <p className="fx-num text-base font-bold" style={{ color: 'var(--fx-txt)' }}>{formatCurrency(t.amount_calculated)}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingId(t.id); setShowForm(false); }}><Pencil className="w-3.5 h-3.5" style={{ color: 'var(--fx-mut)' }} /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--fx-bad)' }} /></Button>
                </div>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
