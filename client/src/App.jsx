import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import Navbar from './components/Navbar';
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
  const location = useLocation();
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
      <Navbar theme={theme} onToggleTheme={toggleTheme} onScreenshot={handleScreenshot} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<BookList />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/quotes" element={<QuoteCollection />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </main>
    </div>
  );
}
