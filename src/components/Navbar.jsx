import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, ChevronDown, Globe, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Navbar.css';

const REGION_OPTIONS = [
  { code: 'AR',    flag: '🇦🇷', label: 'Argentina',    sub: 'ARS · Mercado Pago' },
  { code: 'WORLD', flag: '🌍', label: 'Internacional', sub: 'USD · Stripe'        },
];

const navLinks = [
  { label: 'Inicio', to: '/' },
  { label: 'Cursos', to: '/cursos' },
  { label: 'Mi Aprendizaje', to: '/dashboard', protected: true },
  { label: 'Certificaciones', to: '/certificaciones', protected: true },
  { label: 'Nosotros', to: '/nosotros' },
  { label: 'Contacto', to: '/contacto' },
];

export default function Navbar() {
  const { user, logout, setAuthModal, region, selectRegion } = useApp();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [regionMenu, setRegionMenu] = useState(false);
  const regionRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (!regionMenu) return;
    const handler = (e) => {
      if (regionRef.current && !regionRef.current.contains(e.target)) setRegionMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [regionMenu]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); setUserMenu(false); setRegionMenu(false); }, [location]);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <img src="/logo.jpg" alt="Go Travel Academy" className="navbar-logo-img" />
          <span className="logo-text">Go Travel Academy</span>
        </Link>

        <div className={`navbar-links ${open ? 'open' : ''}`}>
          {navLinks.map(link => (
            link.protected && !user ? (
              <button
                key={link.to}
                type="button"
                className="nav-link nav-link-btn"
                onClick={() => setAuthModal('login')}
              >
                {link.label}
              </button>
            ) : (
              <Link key={link.to} to={link.to}
                className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}>
                {link.label}
              </Link>
            )
          ))}
          <div className="navbar-mobile-actions">
            {user ? (
              <>
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="btn btn-outline">Mi panel</Link>
                <button onClick={logout} className="btn btn-primary">Salir</button>
              </>
            ) : (
              <>
                <button onClick={() => setAuthModal('login')} className="btn btn-outline">Iniciar sesión</button>
                <button onClick={() => setAuthModal('register')} className="btn btn-primary">Comenzar ahora</button>
              </>
            )}
          </div>
        </div>

        <div className="navbar-actions">
          {user ? (
            <div className="user-menu-wrap">
              <button className="user-trigger" onClick={() => setUserMenu(!userMenu)}>
                <img src={user.avatar} alt={user.name} className="user-avatar" />
                <span className="user-trigger-name">{user.name.split(' ')[0]}</span>
                <ChevronDown size={12} className={`chevron ${userMenu ? 'open' : ''}`} />
              </button>
              {userMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="dropdown-item">
                    <LayoutDashboard size={14} /> {user.role === 'admin' ? 'Panel Admin' : 'Mi panel'}
                  </Link>
                  <button onClick={logout} className="dropdown-item danger">
                    <LogOut size={14} /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-btns">
              <button onClick={() => setAuthModal('login')} className="btn btn-ghost btn-sm">Iniciar sesión</button>
              <button onClick={() => setAuthModal('register')} className="btn btn-primary btn-sm">Comenzar ahora</button>
            </div>
          )}

          {/* Region selector */}
          <div className="region-menu-wrap" ref={regionRef}>
            <button
              className="region-trigger"
              onClick={() => setRegionMenu(!regionMenu)}
              title="Cambiar región / moneda"
            >
              <span className="region-trigger-flag">
                {region === 'WORLD' ? '🌍' : '🇦🇷'}
              </span>
              <Globe size={11} className="region-trigger-icon" />
            </button>

            {regionMenu && (
              <div className="region-dropdown">
                <div className="region-dropdown-label">Región y moneda</div>
                {REGION_OPTIONS.map(opt => {
                  const active = (region || 'AR') === opt.code;
                  return (
                    <button
                      key={opt.code}
                      className={`region-option ${active ? 'active' : ''}`}
                      onClick={() => { selectRegion(opt.code); setRegionMenu(false); }}
                    >
                      <span className="region-opt-flag">{opt.flag}</span>
                      <span className="region-opt-text">
                        <span className="region-opt-label">{opt.label}</span>
                        <span className="region-opt-sub">{opt.sub}</span>
                      </span>
                      {active && <Check size={13} className="region-check" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button className="icon-btn mobile-menu-btn" onClick={() => setOpen(!open)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
