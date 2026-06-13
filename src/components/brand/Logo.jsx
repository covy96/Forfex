import React from 'react';

// Glifo "x"-forbice: due aste incrociate + due occhielli pieni
export function FxXGlyph({ height = 44, color = 'var(--fx-accent)' }) {
  const w = height * 0.82;
  return (
    <svg width={w} height={height} viewBox="0 0 40 48" fill="none" aria-hidden="true" style={{ display: 'block' }}>
      <line x1="8" y1="10" x2="32" y2="40" stroke={color} strokeWidth="7" strokeLinecap="round" />
      <line x1="32" y1="10" x2="8" y2="40" stroke={color} strokeWidth="7" strokeLinecap="round" />
      <circle cx="6.5" cy="43" r="3.2" fill={color} />
      <circle cx="33.5" cy="43" r="3.2" fill={color} />
    </svg>
  );
}

// Forbice "aperta" — usata nell'icona app
export function FxScissor({ size = 40, color = 'currentColor', stroke = 3.4 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <line x1="15" y1="5" x2="33" y2="37" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <line x1="33" y1="5" x2="15" y2="37" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <circle cx="12.5" cy="41" r="4.6" stroke={color} strokeWidth={stroke} fill="none" />
      <circle cx="35.5" cy="41" r="4.6" stroke={color} strokeWidth={stroke} fill="none" />
    </svg>
  );
}

// Wordmark: "forfe" + glifo "x"
export function LogoWordmark({ size = 32, color = 'var(--fx-txt)', accent = 'var(--fx-accent)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, lineHeight: 1 }}>
      <span style={{
        fontFamily: 'var(--fx-sans)', fontWeight: 800, fontSize: size,
        letterSpacing: '-0.035em', lineHeight: 1, color,
      }}>forfe</span>
      <span style={{ alignSelf: 'flex-end', transform: 'translateY(4%)', marginLeft: size * -0.08 }}>
        <FxXGlyph height={size * 0.78} color={accent} />
      </span>
    </div>
  );
}

// Icona app: tile indaco con glifo "x" bianco
export function AppIcon({ size = 40, radius }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius ?? size * 0.24,
      background: 'var(--fx-ind)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <FxXGlyph height={size * 0.58} color="#fff" />
    </div>
  );
}

export default LogoWordmark;
