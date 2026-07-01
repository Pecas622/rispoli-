import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Navbar.css';

const navLinks = [
  { label: 'Inicio', to: '/' },
  { label: 'Cursos', to: '/cursos' },
  { label: 'Mi Aprendizaje', to: '/dashboard' },
  { label: 'Certificaciones', to: '/certificaciones' },
  { label: 'Nosotros', to: '/nosotros' },
  { label: 'Contacto', to: '/contacto' },
];

export default function Navbar() {
  const { user, logout, setAuthModal } = useApp();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); setUserMenu(false); }, [location]);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <img src="/logo.jpg" alt="GO Travel Academy" className="navbar-logo-img" />
          <span className="logo-text"> Travel Academy</span>
        </Link>

        <div className={`navbar-links ${open ? 'open' : ''}`}>
          {navLinks.map(link => (
            <Link key={link.to} to={link.to}
              className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}>
              {link.label}
            </Link>
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

          <button className="icon-btn mobile-menu-btn" onClick={() => setOpen(!open)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
