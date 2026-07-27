import { useState, useEffect } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen, Award, ArrowRight, Play, Loader, CheckCircle,
  Home, Download, User, LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { coursesApi } from '../services/api';
import './Dashboard.css';

const sidebarLinks = [
  { label: 'Inicio',        icon: Home,     to: '/' },
  { label: 'Mis cursos',    icon: BookOpen, to: '/dashboard' },
  { label: 'Certificados',  icon: Award,    to: '/certificaciones' },
  { label: 'Descargas',     icon: Download, to: '/descargas' },
  { label: 'Perfil',        icon: User,     to: '/perfil' },
];

export default function Dashboard() {
  const { user, logout, enrollments, enrollmentsLoading } = useApp();
  const [activeNav, setActiveNav]       = useState('/dashboard');
  const [searchParams, setSearchParams] = useSearchParams();
  const [allCourses, setAllCourses]     = useState([]);

  const paymentStatus = searchParams.get('payment');
  const paidCourseId  = searchParams.get('course');

  // Clean URL after reading payment params
  useEffect(() => {
    if (paymentStatus) {
      const t = setTimeout(() => {
        searchParams.delete('payment');
        searchParams.delete('course');
        setSearchParams(searchParams, { replace: true });
      }, 6000);
      return () => clearTimeout(t);
    }
  }, [paymentStatus]);

  useEffect(() => {
    coursesApi.list().then(res => setAllCourses(res.courses)).catch(() => setAllCourses([]));
  }, []);

  if (!user) return <Navigate to="/" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;

  if (enrollmentsLoading) {
    return (
      <div className="dashboard">
        <div className="dash-main" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--violet-mid)' }} />
        </div>
      </div>
    );
  }

  // ── Datos ────────────────────────────────────────────────
  const enrolled    = enrollments;
  const completed   = enrolled.filter(e => e.progressPercent === 100).length;
  const totalHours  = enrolled.reduce((a, e) => {
    const hrs = parseFloat(e.course?.hours) || 0;
    return a + Math.round(hrs * (e.progressPercent || 0) / 100);
  }, 0);

  const enrolledIds = enrolled.map(e => e.courseId);
  const recommended = allCourses.filter(c => !enrolledIds.includes(c.id)).slice(0, 3);

  return (
    <div className="dashboard">

      {/* ── Sidebar ── */}
      <aside className="dash-sidebar">
        {/* User profile */}
        <div className="dash-sidebar-user">
          <img src={user.avatar} alt={user.name} className="dash-sidebar-avatar" />
          <div className="dash-sidebar-info">
            <div className="dash-sidebar-name">{user.name}</div>
            <div className="dash-sidebar-role">Agente de viajes</div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="dash-sidebar-nav">
          {sidebarLinks.map(({ label, icon: Icon, to }) => (
            <Link
              key={to}
              to={to}
              className={`dash-nav-item ${activeNav === to ? 'active' : ''}`}
              onClick={() => setActiveNav(to)}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="dash-sidebar-footer">
          <button className="dash-nav-item dash-logout" onClick={logout}>
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="dash-main">

        {/* Payment success banner */}
        {paymentStatus === 'success' && (
          <div className="dash-payment-banner">
            <CheckCircle size={18} className="dash-payment-icon" />
            <div>
              <p className="dash-payment-title">¡Pago confirmado! Tu inscripción fue activada.</p>
              <p className="dash-payment-sub">Recibiste un email con el comprobante de compra.</p>
            </div>
          </div>
        )}

        {/* Greeting */}
        <div className="dash-header">
          <div>
            <p className="dash-greeting">Panel de alumno</p>
            <h1 className="dash-title">
              Hola, {user.name.split(' ')[0]} 👋
            </h1>
            <p className="dash-subtitle">Seguí con tu aprendizaje donde lo dejaste.</p>
          </div>
          {user.avatar && (
            <img src={user.avatar} alt="" className="dash-header-avatar" />
          )}
        </div>

        {/* Stats */}
        <div className="dash-stats">
          {[
            { icon: BookOpen, val: enrolled.length,  label: 'Cursos inscriptos', color: '#6F95E8' },
            { icon: CheckCircle, val: completed,     label: 'Completados',        color: '#16A34A' },
            { icon: Award, val: completed,           label: 'Certificados',       color: '#F59E0B' },
            { icon: Play, val: `${totalHours}h`,     label: 'Horas aprendidas',   color: '#8B5CF6' },
          ].map(({ icon: Icon, val, label, color }) => (
            <div key={label} className="dash-stat-card">
              <div className="dash-stat-icon-wrap" style={{ background: `${color}18`, color }}>
                <Icon size={18} />
              </div>
              <div className="dash-stat-val">{val}</div>
              <div className="dash-stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Mis cursos */}
        <div className="dash-section-header">
          <h2 className="dash-section-title">Mis cursos</h2>
          <Link to="/cursos" className="btn btn-outline btn-sm">
            Explorar más <ArrowRight size={13} />
          </Link>
        </div>

        {enrolled.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <BookOpen size={32} />
            </div>
            <h3>Todavía no tenés cursos</h3>
            <p>Explorá el catálogo y empezá a aprender hoy</p>
            <Link to="/cursos" className="btn btn-primary" style={{ marginTop: 20 }}>
              Ver cursos <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="dash-courses-grid">
            {enrolled.map(enrollment => {
              const course = enrollment.course;
              const prog   = enrollment.progressPercent || 0;
              const id     = enrollment.courseId;

              return (
                <div key={id} className="dash-course-card">
                  <div className="dash-course-img">
                    <img src={course.image} alt={course.title} />
                    {prog === 100 && (
                      <div className="dash-done-overlay">
                        <Award size={28} color="white" />
                      </div>
                    )}
                    <span className="dash-course-cat">{course.category}</span>
                  </div>
                  <div className="dash-course-body">
                    <div className="dash-course-title">{course.title}</div>
                    <div className="dash-course-meta">
                      {enrollment.completedLessons} / {enrollment.totalLessons} clases completadas
                    </div>

                    <div className="dash-progress-row">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${prog}%`, background: prog === 100 ? 'var(--green)' : 'var(--accent)' }}
                        />
                      </div>
                      <span className="dash-progress-pct">{prog}%</span>
                    </div>

                    <div className="dash-actions">
                      <Link
                        to={`/cursos/${id}`}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <Play size={12} fill="white" color="white" />
                        {prog === 0 ? 'Comenzar' : prog === 100 ? 'Repasar' : 'Continuar'}
                      </Link>
                      {prog === 100 && (
                        <Link to="/certificaciones" className="btn btn-outline btn-sm" title="Ver certificado">
                          <Award size={13} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cursos recomendados */}
        {recommended.length > 0 && (
          <>
            <div className="dash-section-header" style={{ marginTop: 56 }}>
              <h2 className="dash-section-title">Cursos recomendados</h2>
              <Link to="/cursos" className="btn btn-outline btn-sm">
                Ver todos <ArrowRight size={13} />
              </Link>
            </div>
            <div className="dash-rec-grid">
              {recommended.map(c => (
                <div key={c.id} className="dash-rec-card">
                  <img src={c.image} alt={c.title} className="dash-rec-img" />
                  <div className="dash-rec-body">
                    <span className="dash-rec-cat">{c.category}</span>
                    <div className="dash-rec-title">{c.title}</div>
                    <div className="dash-rec-meta">{c.instructorName ?? c.instructor?.name} · {c.duration}</div>
                    <div className="dash-rec-footer">
                      <span className="dash-rec-price">${(c.price ?? 0).toLocaleString()}</span>
                      <Link to={`/cursos/${c.id}`} className="btn btn-outline btn-sm">Ver curso</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="dash-mobile-nav">
        {sidebarLinks.map(({ label, icon: Icon, to }) => (
          <Link
            key={to + label}
            to={to}
            className={`dmn-item ${activeNav === to ? 'active' : ''}`}
            onClick={() => setActiveNav(to)}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
