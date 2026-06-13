import React, { useState } from 'react';
import { LogoWordmark, AppIcon } from '@/components/brand/Logo';
import { useNavigate } from 'react-router-dom';

const FeatureCard = ({ icon, title, desc }) => (
  <div style={{
    background: 'var(--fx-panel)',
    border: '1px solid var(--fx-line)',
    borderRadius: 16,
    padding: '28px 24px',
    display: 'flex', flexDirection: 'column', gap: 12,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: 'var(--fx-accent-soft)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 22,
    }}>{icon}</div>
    <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: 'var(--fx-txt)' }}>{title}</div>
    <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fx-mut)' }}>{desc}</div>
  </div>
);

const StatBubble = ({ value, label }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    background: 'var(--fx-panel)',
    border: '1px solid var(--fx-line)',
    borderRadius: 16, padding: '20px 28px',
    minWidth: 120,
  }}>
    <span style={{
      fontFamily: 'var(--fx-mono)', fontWeight: 700, fontSize: 28,
      color: 'var(--fx-ind)', letterSpacing: '-0.04em',
    }}>{value}</span>
    <span style={{ fontSize: 12, color: 'var(--fx-mut)', textAlign: 'center', lineHeight: 1.4 }}>{label}</span>
  </div>
);

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fx-bg)', color: 'var(--fx-txt)' }}>
      {/* Nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'color-mix(in oklch, var(--fx-bg) 88%, transparent)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--fx-line-soft)',
        padding: '0 max(24px, calc((100vw - 1100px) / 2))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
      }}>
        <LogoWordmark size={26} accent="var(--fx-ind)" />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid var(--fx-line)',
              background: 'transparent', cursor: 'pointer', fontFamily: 'var(--fx-sans)',
              fontSize: 14, fontWeight: 600, color: 'var(--fx-txt)',
            }}
          >Accedi</button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: 'var(--fx-ind)', cursor: 'pointer', fontFamily: 'var(--fx-sans)',
              fontSize: 14, fontWeight: 600, color: '#fff',
            }}
          >Inizia gratis</button>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        padding: '96px max(24px, calc((100vw - 1100px) / 2)) 80px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32,
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--fx-accent-soft)',
          border: '1px solid color-mix(in oklch, var(--fx-ind) 30%, transparent)',
          borderRadius: 999, padding: '6px 14px',
          fontSize: 13, fontWeight: 600, color: 'var(--fx-ind)',
          fontFamily: 'var(--fx-mono)',
        }}>
          📊 &nbsp;Per partite IVA in regime forfettario
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 68px)',
          fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.08,
          maxWidth: 820,
          margin: 0,
        }}>
          Gestisci Inarcassa e INPS{' '}
          <span style={{ color: 'var(--fx-ind)' }}>senza sorprese</span>
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2vw, 20px)', lineHeight: 1.65,
          color: 'var(--fx-mut)', maxWidth: 600, margin: 0,
        }}>
          Registra ogni fattura, calcola automaticamente i contributi previdenziali
          e le tasse da accantonare. Saprai sempre quanto mettere da parte, prima che arrivino le scadenze.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '14px 32px', borderRadius: 12, border: 'none',
              background: 'var(--fx-ind)', cursor: 'pointer', fontFamily: 'var(--fx-sans)',
              fontSize: 16, fontWeight: 700, color: '#fff',
              boxShadow: '0 4px 24px color-mix(in oklch, var(--fx-ind) 40%, transparent)',
            }}
          >Inizia a usarlo gratis →</button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '14px 32px', borderRadius: 12,
              border: '1px solid var(--fx-line)',
              background: 'var(--fx-panel)', cursor: 'pointer', fontFamily: 'var(--fx-sans)',
              fontSize: 16, fontWeight: 600, color: 'var(--fx-txt)',
            }}
          >Accedi all'account</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
          <StatBubble value="23%" label="Aliquota sostitutiva regime forfettario" />
          <StatBubble value="F24" label="Scadenze calcolate automaticamente" />
          <StatBubble value="INA + INPS" label="Inarcassa e gestione separata" />
        </div>
      </section>

      {/* Dashboard mockup strip */}
      <section style={{
        padding: '0 max(24px, calc((100vw - 1100px) / 2)) 80px',
      }}>
        <div style={{
          background: 'var(--fx-panel)',
          border: '1px solid var(--fx-line)',
          borderRadius: 20,
          padding: 32,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
        }}>
          {[
            { label: 'Incassato YTD', value: '€ 28.400', sub: '+12% vs anno scorso', color: 'var(--fx-ok)' },
            { label: 'Da accantonare (tasse)', value: '€ 6.532', sub: '23% + contributi', color: 'var(--fx-warn)' },
            { label: 'Prossima scadenza', value: '30 giu', sub: 'INPS Gestione Separata', color: 'var(--fx-bad)' },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'var(--fx-bg)',
              border: '1px solid var(--fx-line-soft)',
              borderRadius: 12, padding: '20px 18px',
            }}>
              <div style={{ fontSize: 12, color: 'var(--fx-mut)', fontFamily: 'var(--fx-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{item.label}</div>
              <div style={{ fontFamily: 'var(--fx-mono)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--fx-txt)', marginBottom: 6 }}>{item.value}</div>
              <div style={{ fontSize: 12, color: item.color, fontWeight: 600 }}>{item.sub}</div>
            </div>
          ))}

          {/* Mini bar chart */}
          <div style={{ gridColumn: '1 / -1', background: 'var(--fx-bg)', border: '1px solid var(--fx-line-soft)', borderRadius: 12, padding: '20px 18px' }}>
            <div style={{ fontSize: 12, color: 'var(--fx-mut)', fontFamily: 'var(--fx-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Incassi mensili 2024</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 60 }}>
              {[0.4, 0.6, 0.3, 0.8, 0.5, 0.9, 0.7, 0.55, 0.65, 0.45, 0.8, 0.3].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h * 100}%`, background: i === 6 ? 'var(--fx-ind)' : 'var(--fx-accent-soft)', borderRadius: 4 }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              {['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D'].map((m, i) => (
                <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--fx-mut)', fontFamily: 'var(--fx-mono)' }}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{
        padding: '80px max(24px, calc((100vw - 1100px) / 2))',
        borderTop: '1px solid var(--fx-line-soft)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontFamily: 'var(--fx-mono)', fontSize: 12, color: 'var(--fx-ind)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Funzionalità</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Tutto quello che ti serve,<br />niente di più
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <FeatureCard
            icon="💰"
            title="Registra i pagamenti"
            desc="Aggiungi ogni fattura incassata con un click. Forfex calcola automaticamente quanto mettere da parte per tasse e contributi."
          />
          <FeatureCard
            icon="🏛️"
            title="Inarcassa e INPS"
            desc="Supporto nativo per Inarcassa (ingegneri e architetti) e INPS Gestione Separata. I calcoli dei contributi sono sempre precisi."
          />
          <FeatureCard
            icon="📅"
            title="Scadenze fiscali"
            desc="Tutte le scadenze F24, rate INPS e acconto/saldo IRPEF in un calendario chiaro. Nessuna data mancata."
          />
          <FeatureCard
            icon="📊"
            title="Accantonamento tasse"
            desc="Vedi in tempo reale quanto devi mettere da parte. La percentuale viene calcolata sulla tua aliquota reale, contributi inclusi."
          />
          <FeatureCard
            icon="📈"
            title="Analisi incassi"
            desc="Grafici mensili e confronto annuale. Scopri i mesi migliori e pianifica la liquidità con anticipo."
          />
          <FeatureCard
            icon="⚡"
            title="Semplice e veloce"
            desc="Interfaccia progettata per i professionisti che vogliono sapere i numeri, non perdere tempo con il software."
          />
        </div>
      </section>

      {/* How it works */}
      <section style={{
        padding: '80px max(24px, calc((100vw - 1100px) / 2))',
        background: 'var(--fx-panel)',
        borderTop: '1px solid var(--fx-line-soft)',
        borderBottom: '1px solid var(--fx-line-soft)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontFamily: 'var(--fx-mono)', fontSize: 12, color: 'var(--fx-ind)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Come funziona</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            In tre passi
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32, maxWidth: 860, margin: '0 auto' }}>
          {[
            { n: '01', title: 'Registra ogni fattura', desc: 'Inserisci gli importi incassati man mano che arrivano. Ci vogliono 10 secondi.' },
            { n: '02', title: 'Imposta il tuo profilo', desc: 'Scegli cassa previdenziale (Inarcassa o INPS), aliquota e anno di attività.' },
            { n: '03', title: 'Rimani aggiornato', desc: 'La dashboard ti mostra in tempo reale accantonamento e prossime scadenze.' },
          ].map(step => (
            <div key={step.n} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{
                fontFamily: 'var(--fx-mono)', fontWeight: 700, fontSize: 13,
                color: 'var(--fx-ind)', letterSpacing: '0.06em',
              }}>{step.n}</span>
              <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>{step.title}</div>
              <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--fx-mut)' }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '96px max(24px, calc((100vw - 1100px) / 2))',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
        textAlign: 'center',
      }}>
        <AppIcon size={56} />
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, maxWidth: 560 }}>
          Inizia a tenere i conti sotto controllo
        </h2>
        <p style={{ fontSize: 16, color: 'var(--fx-mut)', maxWidth: 440, lineHeight: 1.6, margin: 0 }}>
          Smettila di fare i conti su un foglio Excel. Forfex è gratuito e pronto all'uso.
        </p>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '16px 40px', borderRadius: 12, border: 'none',
            background: 'var(--fx-ind)', cursor: 'pointer', fontFamily: 'var(--fx-sans)',
            fontSize: 17, fontWeight: 700, color: '#fff', marginTop: 8,
            boxShadow: '0 4px 32px color-mix(in oklch, var(--fx-ind) 40%, transparent)',
          }}
        >Accedi o registrati →</button>
        <p style={{ fontSize: 13, color: 'var(--fx-mut)', margin: 0 }}>Nessuna carta di credito. Gratis per sempre.</p>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '24px max(24px, calc((100vw - 1100px) / 2))',
        borderTop: '1px solid var(--fx-line-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <LogoWordmark size={20} accent="var(--fx-ind)" />
        <span style={{ fontSize: 13, color: 'var(--fx-mut)' }}>
          Fatto per liberi professionisti italiani in regime forfettario
        </span>
      </footer>
    </div>
  );
}
