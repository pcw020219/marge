import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';

export default function Login() {
  const { isAuthenticated } = useAuth();
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.sendMagicLink(email.trim());
      setSent(true);
    } catch {
      setError('이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const card = {
    width: '100%', maxWidth: '400px',
    background: 'var(--card)', borderRadius: '16px',
    padding: '2.5rem 2rem', boxShadow: 'var(--shadow)',
  };

  if (sent) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '1rem' }}>
        <div style={card}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem', textAlign: 'center' }}>✉️</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', textAlign: 'center', marginBottom: '0.75rem' }}>이메일을 확인하세요</h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)' }}>{email}</strong>으로<br />로그인 링크를 보냈습니다.
          </p>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.85rem', marginTop: '1rem' }}>
            링크는 15분간 유효합니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '1rem' }}>
      <div style={card}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', textAlign: 'center', marginBottom: '0.4rem' }}>
          Marge <em style={{ fontStyle: 'italic', opacity: 0.7 }}>여백</em>
        </div>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.75rem' }}>
          이메일로 로그인하세요
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 주소"
            required
            autoFocus
          />
          {error && (
            <p style={{ color: 'var(--danger, #e05252)', fontSize: '0.85rem', margin: 0 }}>{error}</p>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading
              ? <><span className="spinner spinner--sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> 전송 중</>
              : '로그인 링크 받기'}
          </button>
        </form>
      </div>
    </div>
  );
}
