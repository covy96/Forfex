import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '@/lib/useUserProfile';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import IncomeForm from '@/components/forms/IncomeForm';
import { computeStato, STATO_META } from '@/lib/payments';

const currentYear = new Date().getFullYear();
const euro2 = (n) => '€ ' + new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

const FILTERS = [
  { id: 'tutte', label: 'Tutte' },
  { id: 'incassata', label: 'Incassate' },
  { id: 'aperte', label: 'Da incassare' },
  { id: 'attesa', label: 'In attesa' },
  { id: 'scaduta', label: 'Scadute' },
];

function Badge({ stato }) {
  const s = STATO_META[stato] || STATO_META.incassata;
  return (
    <span className="fx-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 600,
      letterSpacing: '0.06em', padding: '4px 9px', borderRadius: 5, color: s.color, background: 'color-mix(in oklch, ' + s.color + ' 11%, transparent)' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />{s.label}
    </span>
  );
}

export default function Pagamenti() {
  const { user } = useUserProfile();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('f') || 'tutte');
  const [selectedYear, setSelectedYear] = useState(Number(searchParams.get('anno')) || currentYear);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: incomes = [] } = useQuery({ queryKey: ['incomes', user?.id], queryFn: () => base44.entities.Income.filter({ created_by: user?.email }), enabled: !!user });

  const save = useMutation({
    mutationFn: (data) => editing ? base44.entities.Income.update(editing.id, data) : base44.entities.Income.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incomes'] }); setShowForm(false); setEditing(null); toast.success('Pagamento salvato'); },
  });
  const del = useMutation({
    mutationFn: (id) => base44.entities.Income.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incomes'] }); toast.success('Pagamento eliminato'); },
  });

  const rows = useMemo(() => {
    return incomes
      .filter(p => Number(p.year) === selectedYear)
      .map(p => ({ ...p, _stato: computeStato(p) }))
      .filter(p => filter === 'tutte' || (filter === 'aperte' ? p._stato !== 'incassata' : p._stato === filter))
      .sort((a, b) => new Date(b.date || b.data_emissione || 0) - new Date(a.date || a.data_emissione || 0));
  }, [incomes, filter, selectedYear]);

  const totale = rows.reduce((s, p) => s + Number(p.amount || 0), 0);
  const years = []; for (let y = 2023; y <= currentYear + 1; y++) years.push(y);

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
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>Pagamenti</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
            className="fx-panel fx-num cursor-pointer" style={{ padding: '7px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--fx-txt)' }}>
            {years.map(y => <option key={y} value={y}>Anno {y}</option>)}
          </select>
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            style={{ background: 'var(--fx-ind)', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus className="w-4 h-4" /> Registra pagamento
          </button>
        </div>
      </div>

      <div className="animate-fade-up" style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Filtri */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="fx-mono" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', padding: '7px 14px', borderRadius: 7,
                background: filter === f.id ? 'var(--fx-accent-soft)' : 'var(--fx-panel)',
                color: filter === f.id ? 'var(--fx-ind-deep)' : 'var(--fx-mut)',
                border: '1px solid ' + (filter === f.id ? 'transparent' : 'var(--fx-line)') }}>
              {f.label}
            </button>
          ))}
          <div className="fx-num" style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 12.5, color: 'var(--fx-mut)' }}>
            {rows.length} voci · {euro2(totale)}
          </div>
        </div>

        {/* Lista */}
        <div className="fx-panel" style={{ padding: '6px 22px 14px' }}>
          {rows.length === 0 && <div style={{ fontSize: 13, color: 'var(--fx-mut)', padding: '24px 0', textAlign: 'center' }}>Nessun pagamento per questo filtro.</div>}
          {rows.map((p, i) => (
            <div key={p.id} className="group" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderTop: i ? '1px solid var(--fx-line-soft)' : 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.cliente || p.description || 'Pagamento'}</div>
                <div className="fx-num" style={{ fontSize: 11.5, color: 'var(--fx-mut)', marginTop: 2 }}>
                  {p.numero_doc ? p.numero_doc + ' · ' : ''}{p.metodo || ''}{p.date ? ' · inc. ' + new Date(p.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : (p.data_scadenza ? ' · scad. ' + new Date(p.data_scadenza).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '')}
                </div>
              </div>
              <Badge stato={p._stato} />
              <div className="fx-num" style={{ fontSize: 14.5, fontWeight: 600, minWidth: 100, textAlign: 'right' }}>{euro2(Number(p.amount))}</div>
              <div style={{ display: 'flex', gap: 2, opacity: 0.55 }} className="group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditing(p); setShowForm(true); }} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-fx-chip"><Pencil className="w-3.5 h-3.5" style={{ color: 'var(--fx-mut)' }} /></button>
                <button onClick={() => del.mutate(p.id)} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-fx-chip"><Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--fx-bad)' }} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <IncomeForm initialData={editing} onSubmit={(data) => save.mutate(data)} onClose={() => { setShowForm(false); setEditing(null); }} />
      )}
    </div>
  );
}
