// Espansione scadenze ricorrenti in occorrenze concrete per un anno.

export const RECURRENCES = [
  { id: 'annuale', label: 'Ogni anno' },
  { id: 'mensile', label: 'Ogni mese' },
  { id: 'settimanale', label: 'Ogni settimana' },
  { id: 'giorni', label: 'Ogni N giorni' },
];

export const WEEKDAYS = [
  { value: 1, label: 'Lunedì' }, { value: 2, label: 'Martedì' }, { value: 3, label: 'Mercoledì' },
  { value: 4, label: 'Giovedì' }, { value: 5, label: 'Venerdì' }, { value: 6, label: 'Sabato' }, { value: 0, label: 'Domenica' },
];

// Indica se il template è attivo nell'anno richiesto.
export function templateActive(t, year) {
  const start = Number(t.start_year) || year;
  if (t.is_recurring === false) return start === year;
  return start <= year;
}

// Espande un template in occorrenze [{ month, day, label, amount, key }] per l'anno.
export function expandTemplate(t, year) {
  const rec = t.recurrence || 'annuale';
  const label = t.label;
  const amount = t.amount_calculated || 0;
  const out = [];

  if (rec === 'mensile') {
    const day = Math.min(31, Math.max(1, Number(t.day) || 1));
    for (let m = 1; m <= 12; m++) {
      const last = new Date(year, m, 0).getDate(); // ultimo giorno del mese
      out.push({ month: m, day: Math.min(day, last) });
    }
  } else if (rec === 'settimanale') {
    let d = new Date(year, 0, 1);
    if (t.weekday != null && t.weekday !== '') {
      while (d.getDay() !== Number(t.weekday)) d.setDate(d.getDate() + 1);
    }
    while (d.getFullYear() === year) {
      out.push({ month: d.getMonth() + 1, day: d.getDate() });
      d.setDate(d.getDate() + 7);
    }
  } else if (rec === 'giorni') {
    const n = Math.max(1, Number(t.interval_days) || 30);
    let d = new Date(year, 0, 1);
    while (d.getFullYear() === year) {
      out.push({ month: d.getMonth() + 1, day: d.getDate() });
      d.setDate(d.getDate() + n);
    }
  } else {
    // annuale
    out.push({ month: Number(t.month) || 1, day: Number(t.day) || 30 });
  }

  return out.map((o, i) => ({ ...o, label, amount, key: `custom_${t.id}_${o.month}_${o.day}_${i}` }));
}
