import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '@/lib/useUserProfile';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Pencil, ChevronDown } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
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

function Badge({ stato, small }) {
  const s = STATO_META[stato] || STATO_META.incassata;
  return (
    <span className="fx-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: small ? 4 : 6, fontSize: small ? 9 : 10.5, fontWeight: 600, whiteSpace: 'nowrap',
      letterSpacing: '0.06em', padding: small ? '2px 6px' : '4px 9px', borderRadius: 5, color: s.color, background: 'color-mix(in oklch, ' + s.color + ' 11%, transparent)' }}>
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
      <PageHeader
        title="Pagamenti"
        subtitle={`${rows.length} voci · ${euro2(totale)}`}
        actions={<>
          <div className="relative">
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} aria-label="Anno"
              className="fx-panel fx-num appearance-none cursor-pointer" style={{ padding: '7px 28px 7px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--fx-txt)', borderRadius: 9 }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--fx-mut)' }} />
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="fx-btn-primary" aria-label="Registra pagamento">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Registra pagamento</span>
          </button>
        </>}
      />

      <div className="animate-fade-up fx-page">
        {/* Filtri */}
        <div className="flex items-center gap-1.5 -mx-4 px-4 md:mx-0 md:px-0 fx-scroll-x">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="fx-mono shrink-0" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', padding: '7px 14px', borderRadius: 99, whiteSpace: 'nowrap',
                background: filter === f.id ? 'var(--fx-ind)' : 'var(--fx-panel)',
                color: filter === f.id ? '#fff' : 'var(--fx-mut)',
                border: '1px solid ' + (filter === f.id ? 'transparent' : 'var(--fx-line)') }}>
              {f.label}
            </button>
          ))}
          <div className="hidden md:block fx-num" style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--fx-mut)', whiteSpace: 'nowrap' }}>
            {rows.length} voci · {euro2(totale)}
          </div>
        </div>

        {/* Lista */}
        <div className="fx-panel px-4 py-1 md:px-[22px] md:pt-1.5 md:pb-3.5">
          {rows.length === 0 && <div style={{ fontSize: 13, color: 'var(--fx-mut)', padding: '24px 0', textAlign: 'center' }}>Nessun pagamento per questo filtro.</div>}
          {rows.map((p, i) => {
            const fmt = (d) => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
            const when = p.date ? 'inc. ' + fmt(p.date) : (p.data_scadenza ? 'scad. ' + fmt(p.data_scadenza) : '');
            const meta = [p.numero_doc, p.metodo, when].filter(Boolean).join(' · ');
            const metaShort = [p.numero_doc, when].filter(Boolean).join(' · ');
            const edit = () => { setEditing(p); setShowForm(true); };
            const remove = (e) => {
              e.stopPropagation();
              if (window.confirm(`Eliminare il pagamento di ${p.cliente || p.description || 'questo cliente'} (${euro2(Number(p.amount))})?`)) del.mutate(p.id);
            };
            return (
            <div key={p.id} className="group" style={{ borderTop: i ? '1px solid var(--fx-line-soft)' : 'none' }}>
              {/* desktop */}
              <div className="hidden md:flex" style={{ alignItems: 'center', gap: 12, padding: '13px 0' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.cliente || p.description || 'Pagamento'}</div>
                  <div className="fx-num truncate" style={{ fontSize: 11.5, color: 'var(--fx-mut)', marginTop: 2 }}>{meta}</div>
                </div>
                <Badge stato={p._stato} />
                <div className="fx-num" style={{ fontSize: 14.5, fontWeight: 600, minWidth: 100, textAlign: 'right' }}>{euro2(Number(p.amount))}</div>
                <div style={{ display: 'flex', gap: 2, opacity: 0.55 }} className="group-hover:opacity-100 transition-opacity">
                  <button onClick={edit} aria-label="Modifica" className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-fx-chip"><Pencil className="w-3.5 h-3.5" style={{ color: 'var(--fx-mut)' }} /></button>
                  <button onClick={remove} aria-label="Elimina" className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-fx-chip"><Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--fx-bad)' }} /></button>
                </div>
              </div>
              {/* mobile: tap sulla riga = modifica */}
              <div className="md:hidden flex items-center gap-2 py-3 cursor-pointer" onClick={edit}>
                <div className="min-w-0 flex-1">
                  <div className="truncate" style={{ fontSize: 14.5, fontWeight: 600 }}>{p.cliente || p.description || 'Pagamento'}</div>
                  <div className="fx-num truncate" style={{ fontSize: 11.5, color: 'var(--fx-mut)', marginTop: 3 }}>{metaShort}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="fx-num" style={{ fontSize: 14.5, fontWeight: 600 }}>{euro2(Number(p.amount))}</div>
                  <Badge stato={p._stato} small />
                </div>
                <button onClick={remove} aria-label="Elimina" className="w-9 h-9 -mr-2 rounded-lg flex items-center justify-center active:bg-fx-chip shrink-0">
                  <Trash2 className="w-4 h-4" style={{ color: 'var(--fx-bad)', opacity: 0.7 }} />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <IncomeForm initialData={editing} onSubmit={(data) => save.mutate(data)} onClose={() => { setShowForm(false); setEditing(null); }} />
      )}
    </div>
  );
}
