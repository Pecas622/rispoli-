import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Award, Download, User, BookOpen, CheckCircle, ArrowLeft, FileText, ExternalLink, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { courses as mockCourses } from '../data/courses';
import './UserPages.css';

const MOCK_PROGRESS = { 1: 68, 2: 35, 3: 100, 4: 12, 5: 0, 6: 55 };

function PageShell({ icon: Icon, label, title, children }) {
  return (
    <div className="up-page">
      <div className="up-header">
        <div className="container">
          <Link to="/dashboard" className="up-header-back">
            <ArrowLeft size={13} /> Volver al panel
          </Link>
          <div className="up-header-title-row">
            <div className="up-header-icon"><Icon size={18} /></div>
            <div>
              <p className="up-header-label">{label}</p>
              <h1 className="up-header-h1">{title}</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="container up-content">
        {children}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="up-empty">
      <div className="up-empty-icon"><Icon size={28} /></div>
      <h3>{title}</h3>
      <p>{desc}</p>
      {action}
    </div>
  );
}

// ── Certificaciones ───────────────────────────────────────────────────────────
export function Certificaciones() {
  const { user } = useApp();
  if (!user) return <Navigate to="/" />;

  const completed = mockCourses.filter(c =>
    user.enrolledCourses?.includes(c.id) && MOCK_PROGRESS[c.id] === 100
  );

  return (
    <PageShell icon={Award} label="Mis logros" title="Certificados">
      {completed.length === 0 ? (
        <EmptyState
          icon={Award}
          title="Todavía no tenés certificados"
          desc="Completá un curso al 100% para obtener tu certificado oficial con validez IATA."
          action={<Link to="/cursos" className="btn btn-primary">Explorar cursos <BookOpen size={14} /></Link>}
        />
      ) : (
        <div className="cert-grid">
          {completed.map(course => (
            <CertCard key={course.id} course={course} user={user} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

function CertCard({ course, user }) {
  const certNum = `GTA-${new Date().getFullYear()}-${String(course.id).padStart(4, '0')}`;
  const date = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(6,4,63,0.06)' }}>
      <div style={{ background: 'linear-gradient(135deg, #06043F 0%, #0D0A6B 100%)', padding: '28px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <p style={{ color: '#8CB0F4', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Certificado oficial</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>GO Travel Academy</p>
          </div>
          <Award size={28} color="#8CB0F4" />
        </div>
        <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, lineHeight: 1.35, marginBottom: 8 }}>{course.title}</h3>
        <p style={{ color: '#8CB0F4', fontSize: 11 }}>{user.name}</p>
      </div>

      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, flexWrap: 'wrap', gap: 4 }}>
          <span style={{ color: 'var(--text-3)' }}>N°: <strong style={{ color: 'var(--text)' }}>{certNum}</strong></span>
          <span style={{ color: 'var(--text-3)' }}>{date}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <CheckCircle size={13} color="var(--violet-mid)" />
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Verificado · Aval IATA</span>
        </div>
      </div>

      <div style={{ padding: '14px 20px', display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => alert('PDF disponible cuando el backend esté activo.')}>
          <Download size={13} /> Descargar PDF
        </button>
        <button className="btn btn-outline btn-sm"
          onClick={() => alert('Compartir disponible cuando el backend esté activo.')}>
          <ExternalLink size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Descargas ─────────────────────────────────────────────────────────────────
const DOWNLOADS = [
  { id: 1, courseId: 1, name: 'Guía del Agente de Viajes IATA', type: 'PDF', size: '2.4 MB' },
  { id: 2, courseId: 1, name: 'Plantilla de Cotización de Paquetes', type: 'XLSX', size: '840 KB' },
  { id: 3, courseId: 2, name: 'Comandos Amadeus — Cheat Sheet', type: 'PDF', size: '1.1 MB' },
  { id: 4, courseId: 2, name: 'Glosario GDS — Amadeus y Sabre', type: 'PDF', size: '560 KB' },
  { id: 5, courseId: 3, name: 'Guía de Proveedores de Lujo 2026', type: 'PDF', size: '3.2 MB' },
  { id: 6, courseId: 4, name: 'Kit de Templates para Redes Sociales', type: 'ZIP', size: '18 MB' },
  { id: 7, courseId: 4, name: 'Calendario Editorial Turístico', type: 'XLSX', size: '670 KB' },
];

const TYPE_COLORS = { PDF: '#EF4444', XLSX: '#22C55E', ZIP: '#F59E0B' };

export function Descargas() {
  const { user } = useApp();
  if (!user) return <Navigate to="/" />;

  const enrolled = user.enrolledCourses || [];
  const available = DOWNLOADS.filter(d => enrolled.includes(d.courseId));

  return (
    <PageShell icon={Download} label="Recursos" title="Mis descargas">
      {available.length === 0 ? (
        <EmptyState
          icon={Download}
          title="No tenés recursos disponibles"
          desc="Al inscribirte en un curso, los materiales descargables aparecerán aquí."
          action={<Link to="/cursos" className="btn btn-primary">Ver cursos <BookOpen size={14} /></Link>}
        />
      ) : (
        <div className="downloads-list">
          {available.map(file => {
            const course = mockCourses.find(c => c.id === file.courseId);
            const color = TYPE_COLORS[file.type];
            return (
              <div key={file.id} className="download-row">
                <div className="download-icon" style={{ background: `${color}18` }}>
                  <FileText size={18} color={color} />
                </div>
                <div className="download-info">
                  <div className="download-name">{file.name}</div>
                  <div className="download-meta">
                    <span className="download-type" style={{ background: `${color}18`, color }}>{file.type}</span>
                    {file.size} · {course?.title}
                  </div>
                </div>
                <button className="btn btn-outline btn-sm"
                  onClick={() => alert('Descarga disponible cuando el backend esté activo.')}>
                  <Download size={13} />
                  <span className="hide-xs">Descargar</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

// ── Perfil ────────────────────────────────────────────────────────────────────
export function Perfil() {
  const { user, showToast } = useApp();
  if (!user) return <Navigate to="/" />;

  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    showToast('Perfil actualizado');
  };

  const enrolled  = (user.enrolledCourses || []).length;
  const completed = (user.enrolledCourses || []).filter(id => MOCK_PROGRESS[id] === 100).length;

  return (
    <PageShell icon={User} label="Mi cuenta" title="Perfil">
      <div className="perfil-grid">

        {/* Avatar card */}
        <div className="perfil-avatar-card">
          <img src={user.avatar} alt={user.name} className="perfil-avatar" />
          <div className="perfil-name">{user.name}</div>
          <div className="perfil-role">Agente de viajes</div>
          {[
            { label: 'Cursos inscriptos',  val: enrolled },
            { label: 'Completados',        val: completed },
            { label: 'Certificados',       val: completed },
          ].map(s => (
            <div key={s.label} className="perfil-stat-row">
              <span className="perfil-stat-label">{s.label}</span>
              <strong className="perfil-stat-val">{s.val}</strong>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="perfil-form-card">
          <h2 className="perfil-form-title">Información personal</h2>
          <form onSubmit={handleSave} className="perfil-form">
            <div className="perfil-field">
              <label>Nombre completo</label>
              <input className="input" type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="perfil-field">
              <label>Email</label>
              <input className="input" type="email" value={user.email} disabled style={{ opacity: 0.65, cursor: 'not-allowed' }} />
              <p className="perfil-field-note">El email no puede modificarse desde aquí.</p>
            </div>

            <div>
              <h3 className="perfil-section-title">Cambiar contraseña</h3>
              <div className="perfil-pwd-fields">
                <div className="perfil-field">
                  <label>Contraseña actual</label>
                  <input className="input" type="password" placeholder="••••••••" />
                </div>
                <div className="perfil-field">
                  <label>Nueva contraseña</label>
                  <input className="input" type="password" placeholder="••••••••" />
                </div>
              </div>
            </div>

            <div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </PageShell>
  );
}
