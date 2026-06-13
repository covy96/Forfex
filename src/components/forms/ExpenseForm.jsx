import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingDown } from 'lucide-react';

const today = () => new Date().toISOString().slice(0, 10);

const CATEGORIES = [
  { value: 'generale', label: 'Generale' },
  { value: 'ufficio', label: 'Ufficio' },
  { value: 'trasferta', label: 'Trasferta' },
  { value: 'software', label: 'Software' },
  { value: 'formazione', label: 'Formazione' },
  { value: 'consulenze', label: 'Consulenze' },
  { value: 'altro', label: 'Altro' },
];

export default function ExpenseForm({ onSubmit, onClose, initialData }) {
  const [form, setForm] = useState({
    description: initialData?.description || '',
    amount: initialData?.amount != null ? String(initialData.amount) : '',
    date: initialData?.date || today(),
    category: initialData?.category || 'generale',
    notes: initialData?.notes || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const d = new Date(form.date);
    onSubmit({
      description: form.description,
      amount: parseFloat(String(form.amount).replace(',', '.')) || 0,
      date: form.date,
      category: form.category,
      notes: form.notes,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="rounded-3xl sm:max-w-md shadow-apple-lg">
        <DialogHeader>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center mb-1">
            <TrendingDown className="w-5 h-5 text-rose-600" />
          </div>
          <DialogTitle className="text-xl tracking-tight">
            {initialData ? 'Modifica spesa' : 'Nuova spesa'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Descrizione</Label>
            <Input value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Es. Abbonamento software" required className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Importo (€)</Label>
              <Input type="text" inputMode="decimal" value={form.amount}
                onChange={e => set('amount', e.target.value)} placeholder="0,00" required className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Data</Label>
              <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} required className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Categoria</Label>
            <Select value={form.category} onValueChange={v => set('category', v)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-600">Note (opzionale)</Label>
            <Input value={form.notes} onChange={e => set('notes', e.target.value)} className="rounded-xl" />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Annulla</Button>
            <Button type="submit" className="rounded-xl bg-rose-600 hover:bg-rose-700">Salva spesa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
