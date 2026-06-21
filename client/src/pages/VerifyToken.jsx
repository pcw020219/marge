import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';

export default function VerifyToken() {
  const [searchParams]   = useSearchParams();
  const { login }        = useAuth();
  const navigate         = useNavigate();
  const queryClient      = useQueryClient();
  const [error, setError] = useState('');
  const called           = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setError('유효하지 않은 링크입니다.');
      return;
    }

    api.verifyMagicLink(token)
      .then((data) => {
        if (data?.token) {
          queryClient.clear();
          login(data.token);
          navigate('/', { replace: true });
        } else {
          setError('링크가 만료되었거나 유효하지 않습니다.');
        }
      })
      .catch(() => setError('인증 중 오류가 발생했습니다.'));
  }, []);

  const card = {
    width: '100%', maxWidth: '400px',
    background: 'var(--card)', borderRadius: '16px',
    padding: '2.5rem 2rem', boxShadow: 'var(--shadow)',
    textAlign: 'center',
  };

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '1rem' }}>
        <div style={card}>
          <p style={{ color: 'var(--danger, #e05252)', marginBottom: '1.5rem' }}>{error}</p>
          <a href="/login" className="btn btn-ghost">다시 로그인하기</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="loading-wrap"><span className="spinner" /></div>
    </div>
  );
}
