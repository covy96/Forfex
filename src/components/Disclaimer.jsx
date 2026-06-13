import React from 'react';
import { Info } from 'lucide-react';

// Disclaimer di responsabilità: le stime non sostituiscono il commercialista.
export default function Disclaimer({ compact = false }) {
  if (compact) {
    return (
      <p className="text-[10px] leading-snug" style={{ color: 'var(--fx-mut)' }}>
        Le stime sono indicative e non sostituiscono il commercialista. Aliquote da verificare sulle fonti ufficiali.
      </p>
    );
  }
  return (
    <div className="fx-panel flex items-start gap-2.5" style={{ padding: '12px 14px' }}>
      <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--fx-mut)' }} />
      <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--fx-mut)' }}>
        <b style={{ color: 'var(--fx-txt)' }}>Stime indicative.</b> Forfex calcola imposte e contributi con le formule del
        regime forfettario, ma <b>non sostituisce il commercialista</b>. Le aliquote e i minimi annuali vanno verificati
        sulle fonti ufficiali (Agenzia Entrate, Inarcassa, INPS).
      </p>
    </div>
  );
}
