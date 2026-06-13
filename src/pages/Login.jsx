import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { LogoWordmark } from '@/components/brand/Logo';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');
    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login',
      });
      if (error) setError(error.message);
      else setMessage('Email inviata! Controlla la posta e clicca il link.');
    } else if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage('Controlla la tua email per confermare la registrazione.');
    }
    setLoading(false);
  };

  const inputCls = 'w-full rounded-[8px] px-3.5 py-2.5 text-[14px] outline-none transition-colors';
  const inputStyle = { background: 'var(--fx-bg)', border: '1px solid var(--fx-line)', color: 'var(--fx-txt)' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fx-bg)', color: 'var(--fx-txt)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="animate-fade-up" style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <LogoWordmark size={40} />
        </div>
        <p className="fx-label" style={{ textAlign: 'center', marginBottom: 26 }}>Taglia la burocrazia</p>

        <div className="fx-panel" style={{ padding: 24 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 9, background: 'var(--fx-chip)', marginBottom: 20 }}>
            {[['login', 'Accedi'], ['signup', 'Registrati']].map(([m, l]) => (
              <button key={m} onClick={() => { setMode(m); setError(''); setMessage(''); }}
                className="flex-1 text-[13px] font-semibold rounded-[6px] py-2 transition-colors"
                style={{ background: mode === m ? 'var(--fx-panel)' : 'transparent', color: mode === m ? 'var(--fx-txt)' : 'var(--fx-mut)',
                  boxShadow: mode === m ? '0 1px 2px rgba(0,0,0,0.06)' : 'none' }}>
                {l}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="fx-label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@esempio.it" className={inputCls} style={inputStyle} />
            </div>
            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <label className="fx-label">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} className={inputCls} style={inputStyle} />
              </div>
            )}
            {error && <p className="text-[12.5px]" style={{ color: 'var(--fx-bad)' }}>{error}</p>}
            {message && <p className="text-[12.5px]" style={{ color: 'var(--fx-ok)' }}>{message}</p>}
            <button type="submit" disabled={loading}
              className="w-full text-white text-[14px] font-semibold rounded-[8px] py-2.5 transition-opacity"
              style={{ background: 'var(--fx-ind)', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Attendi…' : mode === 'login' ? 'Accedi' : mode === 'signup' ? 'Crea account' : 'Invia email di reset'}
            </button>
            {mode === 'login' && (
              <button type="button" onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
                className="w-full text-[12.5px] text-center transition-colors"
                style={{ color: 'var(--fx-mut)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Hai dimenticato la password?
              </button>
            )}
            {mode === 'forgot' && (
              <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }}
                className="w-full text-[12.5px] text-center transition-colors"
                style={{ color: 'var(--fx-mut)', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← Torna al login
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
