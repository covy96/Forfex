// Logica fatture/pagamenti FORFEX

// Stato derivato: incassata (ha data incasso) · attesa (non incassata, non scaduta)
// · scaduta (non incassata e oltre la data di scadenza).
export function computeStato(p) {
  if (!p) return 'incassata';
  if (p.stato === 'incassata' || p.date) return 'incassata';
  if (p.stato == null && p.date == null && p.data_scadenza == null) return 'incassata'; // legacy
  if (p.data_scadenza) {
    const due = new Date(p.data_scadenza);
    if (!isNaN(due) && due < new Date(new Date().toDateString())) return 'scaduta';
  }
  return 'attesa';
}

export const STATO_META = {
  incassata: { label: 'INCASSATA', color: 'var(--fx-ok)' },
  attesa: { label: 'IN ATTESA', color: 'var(--fx-warn)' },
  scaduta: { label: 'SCADUTA', color: 'var(--fx-bad)' },
};

export const METODI = ['Bonifico SEPA', 'Contanti', 'Carta', 'Assegno', 'PayPal', 'Altro'];

// Anno/mese fiscale di competenza: per le incassate la data incasso, altrimenti emissione.
export function fiscalYearMonth(p) {
  const ref = p.date || p.data_incasso || p.data_emissione || p.data_scadenza;
  if (!ref) return { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  const d = new Date(ref);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
