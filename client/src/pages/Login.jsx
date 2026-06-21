import { useState, useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();

  const [step, setStep]       = useState('email'); // 'email' | 'code'
  const [email, setEmail]     = useState('');
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const codeRef = useRef(null);

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.sendCode(email.trim());
      setStep('code');
    } catch {
      setError('이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (val) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.verifyCode(email.trim(), val);
      if (data?.token) {
        queryClient.clear();
        login(data.token);
      } else {
        setError('코드가 올바르지 않거나 만료되었습니다.');
        setCode('');
        codeRef.current?.focus();
      }
    } catch {
      setError('인증 중 오류가 발생했습니다.');
      setCode('');
      codeRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
    if (val.length === 6) submitCode(val);
  };

  const handleResend = async () => {
    setCode('');
    setError('');
    setLoading(true);
    try {
      await api.sendCode(email.trim());
    } catch {
      setError('재전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const card = {
    width: '100%', maxWidth: '400px',
    background: 'var(--card)', borderRadius: '16px',
    padding: '2.5rem 2rem', boxShadow: 'var(--shadow)',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '1rem' }}>
      <div style={card}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', textAlign: 'center', marginBottom: '0.4rem' }}>
          Marge <em style={{ fontStyle: 'italic', opacity: 0.7 }}>여백</em>
        </div>

        {step === 'email' ? (
          <>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.75rem' }}>
              이메일로 인증 코드를 받으세요
            </p>
            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소"
                required
                autoFocus
              />
              {error && <p style={{ color: 'var(--danger, #e05252)', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading
                  ? <><span className="spinner spinner--sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> 전송 중</>
                  : '인증 코드 받기'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.5rem' }}>
              <strong style={{ color: 'var(--text)' }}>{email}</strong>으로
            </p>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.75rem', fontSize: '0.9rem' }}>
              6자리 인증 코드를 보냈습니다
            </p>
            <input
              ref={codeRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className="input"
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              disabled={loading}
              style={{ textAlign: 'center', fontSize: '1.75rem', letterSpacing: '0.4em', fontFamily: 'var(--font-serif)' }}
            />
            {error && <p style={{ color: 'var(--danger, #e05252)', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>{error}</p>}
            {loading && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                <span className="spinner spinner--sm" /> 인증 중…
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { setStep('email'); setCode(''); setError(''); }}
                style={{ fontSize: '0.85rem' }}
              >
                ← 이메일 변경
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleResend}
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
              >
                코드 재전송
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
