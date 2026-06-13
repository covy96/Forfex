import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { LogoWordmark } from '@/components/brand/Logo';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const inputCls = 'w-full rounded-[8px] px-3.5 py-2.5 text-[14px] outline-none transition-colors';
  const inputStyle = { background: 'var(--fx-bg)', border: '1px solid var(--fx-line)', color: 'var(--fx-txt)' };

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Le password non coincidono.'); return; }
    if (password.length < 6) { setError('Minimo 6 caratteri.'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => navigate('/'), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fx-bg)', color: 'var(--fx-txt)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="animate-fade-up" style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <LogoWordmark size={40} />
        </div>
        <p className="fx-label" style={{ textAlign: 'center', marginBottom: 26 }}>Nuova password</p>

        <div className="fx-panel" style={{ padding: 24 }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
              <p style={{ fontSize: 14, color: 'var(--fx-ok)', fontWeight: 600 }}>Password aggiornata!</p>
              <p style={{ fontSize: 13, color: 'var(--fx-mut)', marginTop: 6 }}>Stai per essere reindirizzato…</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="fx-label">Nuova password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} className={inputCls} style={inputStyle} />
              </div>
              <div className="space-y-1.5">
                <label className="fx-label">Conferma password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="••••••••" minLength={6} className={inputCls} style={inputStyle} />
              </div>
              {error && <p className="text-[12.5px]" style={{ color: 'var(--fx-bad)' }}>{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full text-white text-[14px] font-semibold rounded-[8px] py-2.5 transition-opacity"
                style={{ background: 'var(--fx-ind)', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Salvataggio…' : 'Imposta nuova password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
