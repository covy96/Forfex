/**
 * ============================================================================
 *  FORFEX — MOTORE DI CALCOLO FISCALE (regime forfettario)
 * ============================================================================
 *
 *  Sorgente UNICA di verità per il calcolo di imposte e contributi.
 *  Copre due casse previdenziali:
 *    - INARCASSA            (architetti / ingegneri)
 *    - INPS GESTIONE SEPARATA (professionisti senza cassa)
 *
 *  ── GARANZIE ──────────────────────────────────────────────────────────────
 *  Le FORMULE qui dentro seguono la normativa del regime forfettario:
 *    • imponibile lordo  = fatturato × coefficiente di redditività (78% prof.)
 *    • imponibile fiscale = imponibile lordo − contributi previdenziali
 *                           DEDUCIBILI effettivamente VERSATI nell'anno (cassa)
 *    • imposta sostitutiva = imponibile fiscale × aliquota (5% o 15%)
 *    • acconti forfettari (DL 124/2019): se imposta ≤ 257,52 € → acconto unico
 *      al 30/11; se > 257,52 € → 50% (30/06) + 50% (30/11). Saldo al 30/06 N+1.
 *
 *  ── COSTANTI ANNUALI — "DA VERIFICARE" ────────────────────────────────────
 *  I valori in RATES_BY_YEAR (minimi Inarcassa, maternità, aliquota INPS)
 *  cambiano OGNI ANNO. Sono inseriti come default ufficiali plausibili ma
 *  vanno SEMPRE confermati (sito Inarcassa / circolari INPS / commercialista).
 *  Ogni anno è marcato con `verified: false` finché non lo confermi.
 *  Qualunque valore può essere sovrascritto dalle impostazioni utente per anno
 *  (FiscalSettings), che hanno SEMPRE la precedenza sui default.
 *
 *  ── DEDUCIBILITÀ CONTRIBUTI (principio di cassa) ──────────────────────────
 *  Deducibili dall'imponibile fiscale: contributi previdenziali OBBLIGATORI
 *  effettivamente PAGATI nell'anno solare.
 *    • Inarcassa: contributo SOGGETTIVO + MATERNITÀ  → deducibili
 *                 contributo INTEGRATIVO (4%)        → NON deducibile (rivalsa
 *                 sul cliente, non è un costo del professionista)
 *    • INPS Gestione Separata: intero contributo     → deducibile
 *  ============================================================================
 */

// Soglia normativa sotto la quale l'acconto imposta è in unica soluzione (30/11)
export const ACCONTO_THRESHOLD = 257.52;

// Coefficiente di redditività per attività professionali (forfettario)
export const DEFAULT_PROFITABILITY_COEFFICIENT = 78; // %

/**
 * Tabella aliquote/minimi per anno — caricata dai file versionati in
 * `src/lib/rates/<anno>.json`. Ogni anno ha `verified: false` finché non
 * confermato su fonte ufficiale; sovrascrivibile dalle impostazioni utente
 * (FiscalSettings) che vincono sui default.
 */
export { RATES_BY_YEAR, RATES_META, AVAILABLE_YEARS } from '@/lib/rates';
import { RATES_BY_YEAR } from '@/lib/rates';

/**
 * Agevolazione neo-iscritti INARCASSA.
 * Riduzione dei contributi MINIMI (ed eventuale aliquota soggettiva agevolata)
 * per i primi anni di iscrizione, sotto una certa età.
 *
 * ── DA VERIFICARE coi valori ufficiali del tuo caso ──
 * Default qui impostati (parametrici, sovrascrivibili da FiscalSettings):
 *   • durata agevolazione: primi 5 anni di iscrizione
 *   • età massima: under 35 (verificata solo se `profile.birth_year` è noto)
 *   • riduzione minimo soggettivo: 50%
 *   • riduzione minimo integrativo: 50%
 *   • aliquota soggettiva: ordinaria (nessuna riduzione di default)
 */
export const AGEVOLAZIONE_DEFAULTS = {
  anni: 5,
  eta_max: 35,
  // Frazione del minimo dovuta in agevolazione (1/3 ⇒ riduzione di 2/3).
  // Usata SOLO come fallback se non sono presenti i minimi_*_agevolato espliciti.
  frazione_minimo: 1 / 3,
};

/** Stabilisce se l'anno rientra nell'agevolazione neo-iscritti Inarcassa. */
export function isInarcassaAgevolato(profile, settings, year) {
  // Override esplicito dalle impostazioni dell'anno (precedenza assoluta)
  if (settings?.inarcassa_agevolato != null) return !!settings.inarcassa_agevolato;

  const start = Number(profile?.pension_fund_start_year || profile?.inarcassa_first_year);
  if (!start) return false;
  const anni = settings?.inarcassa_agevolazione_anni ?? AGEVOLAZIONE_DEFAULTS.anni;
  const within = year >= start && year <= start + (anni - 1);
  if (!within) return false;

  // Controllo età: se conosciamo l'anno di nascita, verifica under età_max
  if (profile?.birth_year) {
    const etaMax = settings?.inarcassa_agevolazione_eta_max ?? AGEVOLAZIONE_DEFAULTS.eta_max;
    const eta = year - Number(profile.birth_year);
    return eta < etaMax;
  }
  // Anno di nascita ignoto: applichiamo in base alla sola finestra temporale
  return true;
}

/**
 * Risolve i parametri Inarcassa EFFETTIVI per un anno (default ufficiali +
 * override utente + agevolazione neo-iscritti). Sorgente unica usata da
 * computeContributi e dal pianificatore: garantisce coerenza dei minimi.
 */
export function resolveInarcassaParams(profile, settings, year) {
  const d = getDefaultRates('inarcassa', year) || {};
  const agevolato = isInarcassaAgevolato(profile, settings, year);

  let soggRate = settings?.inarcassa_subjective_rate ?? d.soggettivo ?? 14.5;
  const integrRate = settings?.inarcassa_integrative_rate ?? d.integrativo ?? 4;
  let minSogg = settings?.inarcassa_minimo_soggettivo ?? d.minimo_soggettivo ?? 0;
  let minIntegr = settings?.inarcassa_minimo_integrativo ?? d.minimo_integrativo ?? 0;
  const maternita = settings?.inarcassa_maternity_contribution ?? d.maternita ?? 0;

  if (agevolato) {
    // Aliquota soggettiva agevolata: override utente, poi default ufficiale
    if (settings?.inarcassa_subjective_rate_agevolato != null) {
      soggRate = settings.inarcassa_subjective_rate_agevolato;
    } else if (d.soggettivo_agevolato != null) {
      soggRate = d.soggettivo_agevolato;
    }
    // Minimi agevolati: usa i valori espliciti (ufficiali) se disponibili,
    // altrimenti applica la frazione di default (1/3).
    const fraz = settings?.inarcassa_frazione_minimo ?? AGEVOLAZIONE_DEFAULTS.frazione_minimo;
    minSogg = settings?.inarcassa_minimo_soggettivo_agevolato
      ?? d.minimo_soggettivo_agevolato
      ?? (minSogg * fraz);
    minIntegr = settings?.inarcassa_minimo_integrativo_agevolato
      ?? d.minimo_integrativo_agevolato
      ?? (minIntegr * fraz);
  }

  return { soggRate, integrRate, minSogg, minIntegr, maternita, agevolato };
}

/** Restituisce i default ufficiali (DA VERIFICARE) per cassa e anno. */
export function getDefaultRates(pensionFund, year) {
  const table = RATES_BY_YEAR[pensionFund] || {};
  const years = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (table[year]) return { ...table[year], _year: year };
  // Fallback: usa l'anno disponibile più vicino (l'ultimo ≤ year, altrimenti il primo)
  const leq = years.filter(y => y <= year);
  const pick = leq.length ? Math.max(...leq) : years[0];
  return pick != null ? { ...table[pick], _year: pick, _fallback: true } : null;
}

/**
 * Aliquota imposta sostitutiva per un dato anno — DERIVATA AUTOMATICAMENTE.
 *
 * Regola: TUTTI i forfettari pagano il 5% nei primi 5 ANNI dall'inizio
 * dell'attività (anno di apertura incluso), poi il 15%. Non dipende dalla
 * scelta manuale del regime: si calcola dall'anno di inizio attività.
 *
 *   anno ≤ activity_start_year + 4  →  5%
 *   anno >  activity_start_year + 4  →  15%
 *
 * Override possibile: settings.tax_rate (per anno) vince sul valore derivato.
 */
export function getTaxRate(profile, year, settings = null) {
  if (settings?.tax_rate != null) return settings.tax_rate;
  if (profile?.tax_regime === 'ordinario') return null; // non gestito qui
  const start = Number(profile?.activity_start_year) || year;
  return year <= start + 4 ? 5 : 15;
}

/**
 * Somma il fatturato professionale INCASSATO di un anno (principio di cassa).
 * Conta solo le fatture incassate (o quelle senza stato, retrocompatibilità);
 * le fatture "in attesa"/"scadute" non concorrono al reddito finché non pagate.
 */
export function getFatturato(incomes, year) {
  return (incomes || [])
    .filter(i => Number(i.year) === Number(year)
      && i.type === 'professionale'
      && (i.stato == null || i.stato === 'incassata'))
    .reduce((s, i) => s + (Number(i.amount) || 0), 0);
}

/**
 * Calcola i CONTRIBUTI previdenziali DI COMPETENZA di un anno (in base al
 * fatturato di quell'anno). Ritorna anche la quota deducibile.
 *
 * Inarcassa: soggettivo = max(reddito×%, minimo_soggettivo)
 *            integrativo = max(fatturato×%, minimo_integrativo)
 *            maternità   = importo fisso
 *   deducibile = soggettivo + maternità   (integrativo escluso: rivalsa)
 *
 * INPS GS:   contributo = reddito × aliquota   (no minimo per i professionisti)
 *   deducibile = intero contributo
 */
export function computeContributi({ pensionFund, fatturato, profile, settings, year }) {
  const coeff = (settings?.profitability_coefficient ?? DEFAULT_PROFITABILITY_COEFFICIENT) / 100;
  const reddito = fatturato * coeff;

  if (pensionFund === 'inarcassa') {
    const p = resolveInarcassaParams(profile, settings, year);
    const soggRate = p.soggRate / 100;
    const integrRate = p.integrRate / 100;
    const { minSogg, minIntegr, maternita, agevolato } = p;

    const soggettivoCalc = reddito * soggRate;
    const integrativoCalc = fatturato * integrRate;
    const soggettivo = Math.max(soggettivoCalc, minSogg);
    const integrativo = Math.max(integrativoCalc, minIntegr);

    return {
      reddito, agevolato,
      soggettivo, integrativo, maternita,
      totale: soggettivo + integrativo + maternita,
      deducibile: soggettivo + maternita, // integrativo NON deducibile
      minimo: minSogg + minIntegr + maternita,
      detail: { soggRate, integrRate, minSogg, minIntegr, soggettivoCalc, integrativoCalc, agevolato },
    };
  }

  if (pensionFund === 'inps_gestione_separata') {
    const d = getDefaultRates('inps_gestione_separata', year) || {};
    const aliquota = (settings?.inps_rate ?? d.aliquota ?? 26.07) / 100;
    const contributo = reddito * aliquota;
    return {
      reddito,
      contributo,
      totale: contributo,
      deducibile: contributo, // interamente deducibile
      detail: { aliquota },
    };
  }

  // Cassa "altro": nessun calcolo automatico contributi
  return { reddito, totale: 0, deducibile: 0, detail: {} };
}

/**
 * Calcola l'IMPOSTA SOSTITUTIVA di competenza di un anno.
 * Base = (fatturato × coeff) − contributi DEDUCIBILI VERSATI nell'anno (cassa).
 *
 * @param deducibiliVersatiNelloAnno  contributi deducibili effettivamente
 *        pagati nel medesimo anno solare (principio di cassa). Calcolati a
 *        monte dal motore annuale (vedi computeYearlyPlan).
 */
export function computeImposta({ fatturato, settings, taxRatePct, deducibiliVersatiNelloAnno = 0 }) {
  const coeff = (settings?.profitability_coefficient ?? DEFAULT_PROFITABILITY_COEFFICIENT) / 100;
  const imponibileLordo = fatturato * coeff;
  const imponibileFiscale = Math.max(0, imponibileLordo - deducibiliVersatiNelloAnno);
  const imposta = imponibileFiscale * (taxRatePct / 100);
  return { imponibileLordo, imponibileFiscale, imposta };
}

/**
 * Suddivide l'imposta dovuta in saldo + acconti secondo le regole forfettario.
 * Metodo storico: acconto anno N = 100% imposta anno N-1, split 50/50
 * (o unico se ≤ soglia). Saldo N-1 = imposta N-1 − acconti versati in N-1.
 */
export function splitAcconti(imposta) {
  if (imposta <= ACCONTO_THRESHOLD) {
    return { primoAcconto: 0, secondoAcconto: imposta, accontoUnico: true };
  }
  return { primoAcconto: imposta * 0.5, secondoAcconto: imposta * 0.5, accontoUnico: false };
}

export default {
  ACCONTO_THRESHOLD,
  DEFAULT_PROFITABILITY_COEFFICIENT,
  RATES_BY_YEAR,
  getDefaultRates,
  getTaxRate,
  getFatturato,
  computeContributi,
  computeImposta,
  splitAcconti,
};
