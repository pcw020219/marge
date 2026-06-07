import { NavLink } from 'react-router-dom';

export default function Navbar({ theme, onToggleTheme, onScreenshot }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          Marge <em>여백</em>
        </NavLink>
        <div className="navbar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            서재
          </NavLink>
          <NavLink to="/quotes" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            문장
          </NavLink>
          <NavLink to="/stats" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            통계
          </NavLink>
          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label="테마 전환"
            title={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
          >
            {theme === 'light' ? '☾' : '☀'}
          </button>
          <button
            className="theme-toggle"
            onClick={onScreenshot}
            aria-label="스크린샷 저장"
            title="현재 페이지를 PNG로 저장"
          >
            ⎙
          </button>
        </div>
      </div>
    </nav>
  );
}
