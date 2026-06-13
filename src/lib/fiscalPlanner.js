/**
 * ============================================================================
 *  FORFEX — PIANIFICATORE PLURIENNALE (principio di cassa)
 * ============================================================================
 *
 *  Calcola, per ogni anno solare, le scadenze (cassa) di imposte e contributi,
 *  con deduzione dei contributi previdenziali PER CASSA (versati nell'anno).
 *
 *  Gli anni vengono elaborati IN SEQUENZA crescente perché:
 *    • i contributi deducibili che riducono l'imponibile dell'anno N sono
 *      quelli effettivamente VERSATI nell'anno N (minimi N + conguaglio su N-1);
 *    • l'imposta/contributo in acconto dell'anno N dipende dall'anno N-1
 *      (metodo storico). Nessuna circolarità: tutto dipende da anni precedenti.
 *
 *  Modello scadenze INARCASSA (anno N):
 *    30/06  Minimi 50%      + Saldo imposta(N-1) + 1° acconto imposta(N)
 *    30/09  Minimi 50%
 *    30/11  2° acconto imposta(N)
 *    31/12  Conguaglio Inarcassa = contributi competenza(N-1) − minimi(N-1)
 *
 *  Modello scadenze INPS GESTIONE SEPARATA (anno N):
 *    30/06  Saldo imposta(N-1) + 1° acc. imposta(N)
 *           + Saldo contributi INPS(N-1) + 1° acc. contributi(N)
 *    30/11  2° acc. imposta(N) + 2° acc. contributi(N)
 *    (i contributi INPS seguono le scadenze e il metodo storico dell'IRPEF)
 *
 *  NB: importi "calcolati" sui dati reali; quando manca il fatturato dell'anno
 *  di competenza l'importo è 0 e marcato come "stimato".
 * ============================================================================
 */

import {
  getTaxRate, getFatturato, computeContributi, computeImposta, splitAcconti,
  getDefaultRates, resolveInarcassaParams, DEFAULT_PROFITABILITY_COEFFICIENT,
} from '@/lib/fiscalEngine';

const MONTHS = ['', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

const fmtDate = (day, month, year) => `${day} ${MONTHS[month]} ${year}`;

/**
 * Pre-calcola, per ogni anno, i dati di competenza che servono da base agli
 * anni successivi: imposta dovuta, contributi previdenziali, deducibile versato.
 *
 * @returns Map<year, {fatturato, hasData, contributi, imposta, taxRatePct,
 *                     deducibilePaidInYear, accontoImposta, accontoContributi}>
 */
function buildYearContext({ profile, incomes, settingsByYear, minYear, maxYear }) {
  const pensionFund = profile?.pension_fund || 'inarcassa';
  const ctx = new Map();

  // 1) Competenza pura (dipende solo dal fatturato dell'anno)
  for (let y = minYear; y <= maxYear; y++) {
    const settings = settingsByYear?.[y] || {};
    const fatturato = getFatturato(incomes, y);
    const hasData = fatturato > 0;
    const taxRatePct = getTaxRate(profile, y, settings);
    const contributi = computeContributi({ pensionFund, fatturato, profile, settings, year: y });
    ctx.set(y, { year: y, settings, fatturato, hasData, taxRatePct, contributi });
  }

  // 2) Deducibile VERSATO nell'anno (cassa) + imposta con base netta
  for (let y = minYear; y <= maxYear; y++) {
    const cur = ctx.get(y);
    const prev = ctx.get(y - 1);
    const d = getDefaultRates(pensionFund, y) || {};

    let deducibilePaidInYear = 0;

    if (pensionFund === 'inarcassa') {
      // Minimi versati nell'anno y: quota soggettiva deducibile + maternità
      const py = resolveInarcassaParams(profile, cur.settings, y);
      const minimiDeducibiliY = py.minSogg + py.maternita;

      // Conguaglio versato a fine y: parte soggettiva eccedente il minimo, su N-1
      let conguaglioDeducibile = 0;
      if (prev && prev.hasData) {
        const pPrev = resolveInarcassaParams(profile, prev.settings, y - 1);
        conguaglioDeducibile = Math.max(0, prev.contributi.soggettivo - pPrev.minSogg);
      }
      deducibilePaidInYear = minimiDeducibiliY + conguaglioDeducibile;
    } else if (pensionFund === 'inps_gestione_separata') {
      // Contributi INPS versati nell'anno y (interamente deducibili):
      //   saldo(N-1) + acconti(N), metodo storico.
      const contribPrev = prev?.contributi?.totale ?? 0;
      const contribPrev2 = ctx.get(y - 2)?.contributi?.totale ?? 0;
      const saldoPrev = Math.max(0, contribPrev - contribPrev2);       // saldo N-1
      const accontiY = contribPrev;                                    // acconto N (storico 100%)
      deducibilePaidInYear = saldoPrev + accontiY;
    }

    const { imponibileLordo, imponibileFiscale, imposta } = computeImposta({
      fatturato: cur.fatturato,
      settings: cur.settings,
      taxRatePct: cur.taxRatePct,
      deducibiliVersatiNelloAnno: deducibilePaidInYear,
    });

    cur.deducibilePaidInYear = deducibilePaidInYear;
    cur.imponibileLordo = imponibileLordo;
    cur.imponibileFiscale = imponibileFiscale;
    // Override: se l'utente ha inserito l'imposta dovuta da dichiarazione,
    // usa quella (esatta) invece della stima da reddito. Gli anni di
    // transizione/passati così sono certi; gli anni futuri restano stimati.
    cur.imposta = cur.settings?.imposta_dovuta != null
      ? Number(cur.settings.imposta_dovuta)
      : imposta;
    cur.impostaStimata = imposta;
    cur.impostaManuale = cur.settings?.imposta_dovuta != null;
  }

  return ctx;
}

/**
 * Costruisce la lista scadenze per UN anno (usa il contesto pluriennale).
 *
 * @returns Array<deadline> dove ogni deadline ha:
 *   { key, type, day, month, year, date, title, description, calcType,
 *     calculatedAmount, group? }
 */
export function computeDeadlinesForYear({ profile, incomes, settingsByYear, year }) {
  const pensionFund = profile?.pension_fund || 'inarcassa';
  const minYear = Math.min(year - 2, (Number(profile?.activity_start_year) || year));
  const ctx = buildYearContext({ profile, incomes, settingsByYear, minYear, maxYear: year });

  const fmtEuro = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  const cur = ctx.get(year);
  const prev = ctx.get(year - 1);

  const baseHasData = prev?.hasData;
  // Imposta "certa" se inserita manualmente da dichiarazione, altrimenti
  // calcolata (se c'è il reddito base) o stimata.
  const calcType = (prev?.impostaManuale || ctx.get(year - 2)?.impostaManuale)
    ? 'calcolato'
    : (baseHasData ? 'calcolato' : 'stimato');

  // ---- IMPOSTA (comune a tutte le casse) ----------------------------------
  // Saldo(N-1) = imposta(N-1) − acconti versati in N-1 (metodo storico = imposta(N-2))
  const impostaPrev = prev?.imposta ?? 0;
  const impostaPrev2 = ctx.get(year - 2)?.imposta ?? 0;
  const accontiVersatiPrev = impostaPrev2; // acconti pagati durante N-1, basati su N-2
  const saldoImposta = Math.max(0, impostaPrev - accontiVersatiPrev);
  const { primoAcconto, secondoAcconto, accontoUnico } = splitAcconti(impostaPrev);

  const deadlines = [];

  if (pensionFund === 'inarcassa') {
    const pY = resolveInarcassaParams(profile, cur.settings, year);
    const { minSogg, minIntegr, maternita, agevolato } = pY;
    // Minimi: usa il valore unico inserito dall'utente, altrimenti somma i minimi
    const minimiTotale = cur.settings?.inarcassa_minimi != null
      ? cur.settings.inarcassa_minimi
      : (minSogg + minIntegr + maternita);
    const quotaMinimi = minimiTotale * 0.5;
    const agevLabel = agevolato ? ' (agevolato neo-iscritto)' : '';

    // 30/06 — Minimi 50%
    deadlines.push({
      key: 'giugno_minimi', type: 'inarcassa_minimi_giugno', day: 30, month: 6, year,
      date: fmtDate(30, 6, year), title: `Minimi Inarcassa (1ª rata 50%)${agevLabel}`,
      calcType: minimiTotale > 0 ? 'calcolato' : 'stimato',
      calculatedAmount: fmtEuro(quotaMinimi), group: 'giugno',
      description: `Minimi annui ${fmtEuro(minimiTotale)} (sogg. ${fmtEuro(minSogg)} + integr. ${fmtEuro(minIntegr)} + matern. ${fmtEuro(maternita)})${agevolato ? ' — minimi ridotti per agevolazione' : ''} — 50%`,
    });

    // 30/06 — Saldo imposta(N-1) + 1° acconto(N)
    deadlines.push({
      key: 'giugno_imposta', type: 'imposta_sostitutiva_saldo', day: 30, month: 6, year,
      date: fmtDate(30, 6, year), title: 'Saldo Imposta + 1° Acconto', calcType,
      calculatedAmount: fmtEuro(saldoImposta + primoAcconto), group: 'giugno',
      description: [
        `Saldo imposta ${year - 1}: ${fmtEuro(saldoImposta)} (imposta ${fmtEuro(impostaPrev)} − acconti versati ${fmtEuro(accontiVersatiPrev)})`,
        accontoUnico ? 'Acconto in unica soluzione a novembre (imposta ≤ 257,52 €)'
          : `1° acconto ${year} (50%): ${fmtEuro(primoAcconto)}`,
        `Base: fatturato ${year - 1} = ${fmtEuro(prev?.fatturato ?? 0)}`,
      ].join('\n'),
    });

    // 30/09 — Minimi 50%
    deadlines.push({
      key: 'settembre_minimi', type: 'inarcassa_minimi_settembre', day: 30, month: 9, year,
      date: fmtDate(30, 9, year), title: 'Minimi Inarcassa (2ª rata 50%)',
      calcType: minimiTotale > 0 ? 'calcolato' : 'stimato',
      calculatedAmount: fmtEuro(quotaMinimi),
      description: `Saldo minimi annui ${fmtEuro(minimiTotale)} — 50%`,
    });

    // 30/11 — 2° acconto imposta(N)
    deadlines.push({
      key: 'novembre_imposta', type: 'imposta_sostitutiva_acconto2', day: 30, month: 11, year,
      date: fmtDate(30, 11, year),
      title: accontoUnico ? 'Acconto Imposta (unica soluzione)' : '2° Acconto Imposta', calcType,
      calculatedAmount: fmtEuro(secondoAcconto),
      description: accontoUnico
        ? `Acconto ${year} 100% su imposta ${fmtEuro(impostaPrev)}: ${fmtEuro(secondoAcconto)}`
        : `2° acconto ${year} (50%) su imposta ${fmtEuro(impostaPrev)}: ${fmtEuro(secondoAcconto)}`,
    });

    // 31/12 — Conguaglio Inarcassa su competenza N-1
    const firstYear = profile?.inarcassa_first_year ?? profile?.pension_fund_start_year ?? null;
    const showConguaglio = firstYear != null ? year > Number(firstYear) : true;
    if (showConguaglio && prev) {
      const pPrev = resolveInarcassaParams(profile, prev.settings, year - 1);
      const minimiPrev = prev.settings?.inarcassa_minimi != null
        ? prev.settings.inarcassa_minimi
        : (pPrev.minSogg + pPrev.minIntegr + pPrev.maternita);
      const dovutoPrev = prev.contributi.totale; // sogg + integr + maternità competenza N-1
      const conguaglio = Math.max(0, dovutoPrev - minimiPrev);
      deadlines.push({
        key: 'dicembre_conguaglio', type: 'inarcassa_conguaglio', day: 31, month: 12, year,
        date: fmtDate(31, 12, year), title: 'Conguaglio Inarcassa',
        calcType: prev.hasData ? 'calcolato' : 'stimato',
        calculatedAmount: fmtEuro(conguaglio),
        description: prev.hasData ? [
          `Soggettivo ${year - 1}: ${fmtEuro(prev.contributi.soggettivo)}`,
          `Integrativo ${year - 1}: ${fmtEuro(prev.contributi.integrativo)}`,
          `Maternità: ${fmtEuro(prev.contributi.maternita)}`,
          `Totale dovuto: ${fmtEuro(dovutoPrev)} − minimi già versati ${fmtEuro(minimiPrev)}`,
          `= Conguaglio: ${fmtEuro(conguaglio)}`,
        ].join('\n') : `Nessun fatturato registrato per il ${year - 1}`,
      });
    }
  }

  if (pensionFund === 'inps_gestione_separata') {
    // Contributi INPS: saldo(N-1) + acconti(N), metodo storico 100% split 50/50
    const contribPrev = prev?.contributi?.totale ?? 0;
    const contribPrev2 = ctx.get(year - 2)?.contributi?.totale ?? 0;
    const saldoContrib = Math.max(0, contribPrev - contribPrev2);
    const accSplit = splitAcconti(contribPrev);

    deadlines.push({
      key: 'giugno_imposta', type: 'imposta_sostitutiva_saldo', day: 30, month: 6, year,
      date: fmtDate(30, 6, year), title: 'Saldo Imposta + 1° Acconto', calcType,
      calculatedAmount: fmtEuro(saldoImposta + primoAcconto), group: 'giugno',
      description: [
        `Saldo imposta ${year - 1}: ${fmtEuro(saldoImposta)}`,
        `1° acconto imposta ${year}: ${fmtEuro(primoAcconto)}`,
      ].join('\n'),
    });
    deadlines.push({
      key: 'giugno_inps', type: 'inps_saldo_acconto1', day: 30, month: 6, year,
      date: fmtDate(30, 6, year), title: 'Saldo + 1° Acconto INPS', group: 'giugno',
      calcType, calculatedAmount: fmtEuro(saldoContrib + accSplit.primoAcconto),
      description: [
        `Saldo contributi ${year - 1}: ${fmtEuro(saldoContrib)}`,
        `1° acconto contributi ${year}: ${fmtEuro(accSplit.primoAcconto)}`,
      ].join('\n'),
    });
    deadlines.push({
      key: 'novembre_imposta', type: 'imposta_sostitutiva_acconto2', day: 30, month: 11, year,
      date: fmtDate(30, 11, year), title: '2° Acconto Imposta', calcType,
      calculatedAmount: fmtEuro(secondoAcconto),
      description: `2° acconto imposta ${year}: ${fmtEuro(secondoAcconto)}`,
    });
    deadlines.push({
      key: 'novembre_inps', type: 'inps_acconto2', day: 30, month: 11, year,
      date: fmtDate(30, 11, year), title: '2° Acconto INPS', calcType,
      calculatedAmount: fmtEuro(accSplit.secondoAcconto),
      description: `2° acconto contributi ${year}: ${fmtEuro(accSplit.secondoAcconto)}`,
    });
  }

  // Ordina per mese, poi per giorno
  deadlines.sort((a, b) => (a.month - b.month) || (a.day - b.day));
  return { deadlines, context: cur, prevContext: prev };
}

export default { computeDeadlinesForYear };
