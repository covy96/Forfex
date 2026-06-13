import { describe, it, expect } from 'vitest';
import { computeContributi } from '@/lib/fiscalEngine';
import { computeDeadlinesForYear } from '@/lib/fiscalPlanner';

const profile = {
  pension_fund: 'inps_gestione_separata', tax_regime: 'forfettario_5',
  activity_start_year: 2024, birth_year: 1990,
};
const incomes = [
  { year: 2024, type: 'professionale', amount: 30000, stato: 'incassata' },
  { year: 2025, type: 'professionale', amount: 30000, stato: 'incassata' },
];

describe('INPS Gestione Separata — contributi', () => {
  it('contributo = reddito × 26,07%, interamente deducibile, nessun minimo', () => {
    const c = computeContributi({ pensionFund: 'inps_gestione_separata', fatturato: 30000, profile, settings: {}, year: 2025 });
    expect(c.reddito).toBeCloseTo(23400, 2);       // 30000 × 78%
    expect(c.contributo).toBeCloseTo(6100.38, 2);  // 23400 × 26.07%
    expect(c.totale).toBeCloseTo(6100.38, 2);
    expect(c.deducibile).toBeCloseTo(6100.38, 2);  // tutto deducibile
  });
});

describe('INPS — scadenze (no minimi/conguaglio Inarcassa)', () => {
  const { deadlines } = computeDeadlinesForYear({ profile, incomes, settingsByYear: {}, year: 2026 });
  it('genera imposta + contributi INPS, niente voci Inarcassa', () => {
    const types = deadlines.map(d => d.type);
    expect(types.some(t => t.startsWith('inps'))).toBe(true);
    expect(types.some(t => t.startsWith('inarcassa'))).toBe(false);
  });
  it('imposta sostitutiva 5% presente', () => {
    expect(deadlines.find(d => d.type === 'imposta_sostitutiva_saldo')).toBeTruthy();
  });
});
