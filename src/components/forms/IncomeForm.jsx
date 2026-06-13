import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { METODI, fiscalYearMonth } from '@/lib/payments';

const today = () => new Date().toISOString().slice(0, 10);

export default function IncomeForm({ onSubmit, onClose, initialData }) {
  const init = initialData || {};
  const wasIncassata = init.stato ? init.stato === 'incassata' : (init.date != null || init.id == null);
  const [form, setForm] = useState({
    cliente: init.cliente || init.description || '',
    numero_doc: init.numero_doc || '',
    amount: init.amount != null ? String(init.amount) : '',
    type: init.type || 'professionale',
    metodo: init.metodo || 'Bonifico SEPA',
    data_emissione: init.data_emissione || today(),
    data_incasso: init.date || init.data_incasso || today(),
    data_scadenza: init.data_scadenza || '',
    incassata: wasIncassata,
    notes: init.notes || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const stato = form.incassata ? 'incassata' : 'attesa';
    const date = form.incassata ? form.data_incasso : null;
    const { year, month } = fiscalYearMonth({ date, data_emissione: form.data_emissione });
    onSubmit({
      cliente: form.cliente,
      description: form.cliente, // retrocompat / display
      numero_doc: form.numero_doc || null,
      amount: parseFloat(String(form.amount).replace(',', '.')) || 0,
      type: form.type,
      metodo: form.metodo,
      data_emissione: form.data_emissione || null,
      data_scadenza: form.incassata ? null : (form.data_scadenza || null),
      date,
      stato,
      notes: form.notes,
      year, month,
    });
  };

  const fieldCls = 'rounded-[8px] border-fx-line';

  return (
    <Dialog open onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="rounded-[14px] sm:max-w-lg" style={{ background: 'var(--fx-panel)' }}>
        <DialogHeader>
          <DialogTitle className="fx-sans text-xl tracking-tight" style={{ color: 'var(--fx-txt)' }}>
            {initialData?.id ? 'Modifica pagamento' : 'Registra pagamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label className="fx-label">Cliente</Label>
              <Input value={form.cliente} onChange={e => set('cliente', e.target.value)} placeholder="Studio Rossi Architettura" required className={fieldCls} />
            </div>
            <div className="space-y-1.5">
              <Label className="fx-label">N° documento</Label>
              <Input value={form.numero_doc} onChange={e => set('numero_doc', e.target.value)} placeholder="FT 2026/014" className={fieldCls} />
            </div>
            <div className="space-y-1.5">
              <Label className="fx-label">Importo (€)</Label>
              <Input type="text" inputMode="decimal" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="2.440,00" required className={fieldCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="fx-label">Tipo</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger className={fieldCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professionale">Professionale</SelectItem>
                  <SelectItem value="personale">Personale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="fx-label">Metodo</Label>
              <Select value={form.metodo} onValueChange={v => set('metodo', v)}>
                <SelectTrigger className={fieldCls}><SelectValue /></SelectTrigger>
                <SelectContent>{METODI.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="fx-label">Data emissione</Label>
              <Input type="date" value={form.data_emissione} onChange={e => set('data_emissione', e.target.value)} className={fieldCls} />
            </div>
            <div className="space-y-1.5">
              <Label className="fx-label">{form.incassata ? 'Data incasso' : 'Data scadenza'}</Label>
              {form.incassata
                ? <Input type="date" value={form.data_incasso} onChange={e => set('data_incasso', e.target.value)} className={fieldCls} />
                : <Input type="date" value={form.data_scadenza} onChange={e => set('data_scadenza', e.target.value)} className={fieldCls} />}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-[8px] px-3.5 py-2.5" style={{ background: 'var(--fx-chip)' }}>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--fx-txt)' }}>Già incassata</p>
              <p className="text-[11px]" style={{ color: 'var(--fx-mut)' }}>Solo le incassate contano per le tasse</p>
            </div>
            <Switch checked={form.incassata} onCheckedChange={v => set('incassata', v)} />
          </div>

          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-[8px]">Annulla</Button>
            <Button type="submit" className="rounded-[8px] text-white" style={{ background: 'var(--fx-ind)' }}>Salva pagamento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
