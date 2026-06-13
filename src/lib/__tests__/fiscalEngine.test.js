import { describe, it, expect } from 'vitest';
import {
  getTaxRate, getFatturato, computeContributi, computeImposta,
  splitAcconti, resolveInarcassaParams, getDefaultRates,
} from '@/lib/fiscalEngine';

// Profilo reale di test (caso Giacomo): architetto Inarcassa, attività dal 2023,
// iscrizione Inarcassa 2024, forfettario, nato 1996 (under 35 → agevolato).
const profile = {
  pension_fund: 'inarcassa', tax_regime: 'forfettario_5',
  activity_start_year: 2023, pension_fund_start_year: 2024, birth_year: 1996,
};

describe('getTaxRate — 5% primi 5 anni poi 15%, auto', () => {
  it('5% dal 2023 al 2027, 15% dal 2028', () => {
    for (const y of [2023, 2024, 2025, 2026, 2027]) expect(getTaxRate(profile, y)).toBe(5);
    expect(getTaxRate(profile, 2028)).toBe(15);
  });
  it('override esplicito vince', () => {
    expect(getTaxRate(profile, 2024, { tax_rate: 15 })).toBe(15);
  });
});

describe('Agevolazione neo-iscritto Inarcassa (under 35, primi 5 anni)', () => {
  it('2024 agevolato: soggettivo 7.25%, minimi 1/3', () => {
    const p = resolveInarcassaParams(profile, {}, 2024);
    expect(p.agevolato).toBe(true);
    expect(p.soggRate).toBe(7.25);
    expect(p.minSogg).toBe(928);
    expect(p.minIntegr).toBeCloseTo(283.33, 2);
  });
  it('contributi 2024 su 27.595 € incassato', () => {
    const c = computeContributi({ pensionFund: 'inarcassa', fatturato: 27595, profile, settings: {}, year: 2024 });
    expect(c.reddito).toBeCloseTo(21524.10, 2);
    expect(c.soggettivo).toBeCloseTo(1560.50, 1); // 21524.10 × 7.25%
    expect(c.integrativo).toBeCloseTo(1103.80, 1); // 27595 × 4%
  });
});

describe('getFatturato — solo fatture incassate (cassa)', () => {
  const incomes = [
    { year: 2024, type: 'professionale', amount: 1000, stato: 'incassata' },
    { year: 2024, type: 'professionale', amount: 500, stato: 'attesa' },
    { year: 2024, type: 'personale', amount: 999, stato: 'incassata' },
    { year: 2024, type: 'professionale', amount: 200 }, // legacy senza stato
  ];
  it('conta incassate + legacy, esclude attesa e personale', () => {
    expect(getFatturato(incomes, 2024)).toBe(1200);
  });
});

describe('splitAcconti — soglia DL 124/2019', () => {
  it('sopra soglia: 50/50', () => {
    const s = splitAcconti(1000);
    expect(s.primoAcconto).toBe(500); expect(s.secondoAcconto).toBe(500); expect(s.accontoUnico).toBe(false);
  });
  it('sotto 257,52: unica soluzione', () => {
    const s = splitAcconti(200);
    expect(s.accontoUnico).toBe(true); expect(s.secondoAcconto).toBe(200);
  });
});
