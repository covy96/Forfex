import React from 'react';

/**
 * Header sticky delle pagine.
 * - desktop: titolo a sinistra, azioni e `extra` sulla stessa riga a destra
 * - mobile: titolo grande + azioni sulla prima riga, `extra` (es. selettore anno)
 *   su una seconda riga scorrevole orizzontalmente
 */
export default function PageHeader({ title, subtitle, actions, extra }) {
  return (
    <div className="fx-header">
      <div className="fx-header-row">
        <div className="min-w-0">
          <div className="fx-header-title">{title}</div>
          {subtitle && <div className="fx-header-sub">{subtitle}</div>}
        </div>
        <div className="ml-auto flex items-center gap-2.5 shrink-0">
          {extra && <div className="hidden md:block">{extra}</div>}
          {actions}
        </div>
      </div>
      {extra && (
        <div className="md:hidden fx-header-extra fx-scroll-x">
          {extra}
        </div>
      )}
    </div>
  );
}

/** Selettore anno a pillole, riusato in più pagine. */
export function YearSegment({ years, value, onChange }) {
  return (
    <div className="fx-seg">
      {years.map(y => (
        <button key={y} type="button" aria-pressed={value === y} onClick={() => onChange(y)}>
          {y}
        </button>
      ))}
    </div>
  );
}
