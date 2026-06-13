/**
 * Aliquote fiscali versionate per anno (sorgente: file JSON datati).
 * Aggiornare un anno = modificare/aggiungere il relativo JSON, senza toccare
 * il motore. Ogni anno ha `verified` (false finché non confermato su fonte
 * ufficiale), `source` e `updated`.
 */
import y2023 from './2023.json';
import y2024 from './2024.json';
import y2025 from './2025.json';
import y2026 from './2026.json';

const YEARS = [y2023, y2024, y2025, y2026];

export const RATES_META = {};        // year -> { verified, source, updated }
export const RATES_BY_YEAR = { inarcassa: {}, inps_gestione_separata: {} };
export const COEFF_BY_YEAR = {};     // year -> coefficiente professionale

YEARS.forEach((y) => {
  RATES_BY_YEAR.inarcassa[y.year] = { verified: y.verified, ...y.inarcassa };
  RATES_BY_YEAR.inps_gestione_separata[y.year] = { verified: y.verified, ...y.inps_gestione_separata };
  RATES_META[y.year] = { verified: y.verified, source: y.source, updated: y.updated };
  COEFF_BY_YEAR[y.year] = y.forfettario?.coefficiente_professionale ?? 78;
});

export const AVAILABLE_YEARS = YEARS.map((y) => y.year).sort((a, b) => a - b);
