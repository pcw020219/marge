import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import VerifyToken from './pages/VerifyToken';
import BookList from './pages/BookList';
import BookDetail from './pages/BookDetail';
import QuoteCollection from './pages/QuoteCollection';
import Stats from './pages/Stats';

const PAGE_NAMES = {
  '/': '서재',
  '/quotes': '문장',
  '/stats': '통계',
};

export default function App() {
  const location    = useLocation();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    return saved;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  const handleLogout = () => {
    queryClient.clear();
    logout();
  };

  const handleScreenshot = async () => {
    const target = document.querySelector('.main-content');
    if (!target) return;
    const canvas = await html2canvas(target, {
      backgroundColor: getComputedStyle(document.documentElement)
        .getPropertyValue('--bg').trim() || '#F5F0FF',
      scale: 2,
      useCORS: true,
    });
    const link = document.createElement('a');
    const pageName = PAGE_NAMES[location.pathname] ?? 'marge';
    link.download = `marge_${pageName}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="app">
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onScreenshot={handleScreenshot}
        user={user}
        onLogout={handleLogout}
      />
      <main className="main-content">
        <Routes>
          <Route path="/login"  element={<Login />} />
          <Route path="/verify" element={<VerifyToken />} />
          <Route path="/"         element={<ProtectedRoute><BookList /></ProtectedRoute>} />
          <Route path="/books/:id" element={<ProtectedRoute><BookDetail /></ProtectedRoute>} />
          <Route path="/quotes"   element={<ProtectedRoute><QuoteCollection /></ProtectedRoute>} />
          <Route path="/stats"    element={<ProtectedRoute><Stats /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}
