import { useState } from 'react';

const STORAGE_KEY = 'site_unlocked';

export default function SiteGate({ children }) {
  const password = import.meta.env.VITE_SITE_PASSWORD;

  const [unlocked, setUnlocked] = useState(() => {
    if (!password) return true;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });
  const [input, setInput] = useState('');
  const [shake, setShake]   = useState(false);

  if (!password || unlocked) return children;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === password) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setUnlocked(true);
    } else {
      setShake(true);
      setInput('');
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg)', padding: '1rem',
    }}>
      <div style={{
        width: '100%', maxWidth: '360px',
        background: 'var(--card)', borderRadius: '20px',
        padding: '2.5rem 2rem', boxShadow: 'var(--shadow)',
        textAlign: 'center',
        animation: shake ? 'gate-shake 0.45s ease' : 'none',
      }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', marginBottom: '0.4rem' }}>
          Marge <em style={{ fontStyle: 'italic', opacity: 0.65 }}>여백</em>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
          비밀번호를 입력하세요
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="password"
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="••••••••"
            autoFocus
            style={{ textAlign: 'center', letterSpacing: '0.2em' }}
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            입장
          </button>
        </form>
      </div>

      <style>{`
        @keyframes gate-shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-5px); }
          80%      { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
