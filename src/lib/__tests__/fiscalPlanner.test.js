import { describe, it, expect } from 'vitest';
import { computeDeadlinesForYear } from '@/lib/fiscalPlanner';

// ────────────────────────────────────────────────────────────────
// CASO D'ORO — dati reali dai F24 di Giacomo (anni d'imposta 2023-2025)
// Imposta dovuta: 2023=752, 2024=831, 2025=1.029,30
// Verifica che le scadenze ricostruite combacino coi versamenti reali.
// ────────────────────────────────────────────────────────────────
const profile = {
  pension_fund: 'inarcassa', tax_regime: 'forfettario_5',
  activity_start_year: 2023, pension_fund_start_year: 2024, birth_year: 1996,
};
const incomes = [
  { year: 2023, type: 'professionale', amount: 18497.90, stato: 'incassata' },
  { year: 2024, type: 'professionale', amount: 27595, stato: 'incassata' },
  { year: 2025, type: 'professionale', amount: 27684, stato: 'incassata' },
];
const settingsByYear = {
  2023: { imposta_dovuta: 752 },
  2024: { imposta_dovuta: 831, inarcassa_minimi: 1035 },
  2025: { imposta_dovuta: 1029.30, inarcassa_minimi: 1286 },
  2026: { inarcassa_minimi: 1303 },
};

const find = (deadlines, type) => deadlines.find(d => d.type === type);

describe('Scadenze 2025 = F24 reali', () => {
  const { deadlines } = computeDeadlinesForYear({ profile, incomes, settingsByYear, year: 2025 });
  it('30/06 Saldo imposta 2024 + 1° acconto 2025 = 494,50 €', () => {
    expect(find(deadlines, 'imposta_sostitutiva_saldo').calculatedAmount).toBeCloseTo(494.50, 2);
  });
  it('30/11 2° acconto 2025 = 415,50 €', () => {
    expect(find(deadlines, 'imposta_sostitutiva_acconto2').calculatedAmount).toBeCloseTo(415.50, 2);
  });
  it('minimi Inarcassa 1.286 → 643 € a rata', () => {
    expect(find(deadlines, 'inarcassa_minimi_giugno').calculatedAmount).toBeCloseTo(643, 2);
    expect(find(deadlines, 'inarcassa_minimi_settembre').calculatedAmount).toBeCloseTo(643, 2);
  });
});

describe('Scadenze 2026 = stima utente verificata', () => {
  const { deadlines } = computeDeadlinesForYear({ profile, incomes, settingsByYear, year: 2026 });
  it('30/06 Saldo imposta 2025 (198,30) + 1° acconto 2026 (514,65) = 712,95 €', () => {
    expect(find(deadlines, 'imposta_sostitutiva_saldo').calculatedAmount).toBeCloseTo(712.95, 2);
  });
  it('30/11 2° acconto 2026 = 514,65 €', () => {
    expect(find(deadlines, 'imposta_sostitutiva_acconto2').calculatedAmount).toBeCloseTo(514.65, 2);
  });
});

describe('Senza imposta dovuta → stima dal reddito (non deve crashare)', () => {
  it('produce scadenze coerenti per anno stimato', () => {
    const { deadlines } = computeDeadlinesForYear({ profile, incomes, settingsByYear: { 2025: {}, 2026: {} }, year: 2026 });
    expect(deadlines.length).toBeGreaterThan(0);
    expect(find(deadlines, 'imposta_sostitutiva_saldo').calculatedAmount).toBeGreaterThanOrEqual(0);
  });
});
