import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Award, Download, User, BookOpen, CheckCircle, ArrowLeft, FileText, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { courses as mockCourses } from '../data/courses';

const MOCK_PROGRESS = { 1: 68, 2: 35, 3: 100, 4: 12, 5: 0, 6: 55 };

function PageShell({ icon: Icon, label, title, children }) {
  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: 'var(--bg-2)' }}>
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)', padding: '40px 0 32px' }}>
        <div className="container">
          <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)', marginBottom: 20, textDecoration: 'none' }}>
            <ArrowLeft size={13} /> Volver al panel
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--violet-pale)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</p>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', margin: 0 }}>{title}</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="container" style={{ paddingTop: 40, paddingBottom: 96 }}>
        {children}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div style={{ padding: '64px 40px', textAlign: 'center', border: '1.5px dashed var(--border-2)', borderRadius: 16, background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--violet-pale)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon size={28} />
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: action ? 24 : 0 }}>{desc}</p>
      {action}
    </div>
  );
}

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
          action={
            <Link to="/cursos" className="btn btn-primary">
              Explorar cursos <BookOpen size={14} />
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
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
      {/* Certificate preview */}
      <div style={{ background: 'linear-gradient(135deg, #06043F 0%, #0D0A6B 100%)', padding: '28px 24px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#8CB0F4', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Certificado oficial</p>
            <p style={{ color: 'white', fontSize: 11, opacity: 0.7, marginBottom: 4 }}>GO Travel Academy</p>
          </div>
          <Award size={28} color="#8CB0F4" />
        </div>
        <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, lineHeight: 1.35, marginTop: 12, marginBottom: 8 }}>{course.title}</h3>
        <p style={{ color: '#8CB0F4', fontSize: 11 }}>{user.name}</p>
      </div>
      {/* Info row */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: 'var(--text-3)' }}>Número: <strong style={{ color: 'var(--text)' }}>{certNum}</strong></span>
          <span style={{ color: 'var(--text-3)' }}>{date}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <CheckCircle size={13} color="var(--violet-mid)" />
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Verificado · Aval IATA</span>
        </div>
      </div>
      {/* Actions */}
      <div style={{ padding: '14px 20px', display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => alert('Descarga de PDF disponible cuando el backend esté activo.')}>
          <Download size={13} /> Descargar PDF
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => alert('Compartir disponible cuando el backend esté activo.')}>
          <ExternalLink size={13} />
        </button>
      </div>
    </div>
  );
}

const DOWNLOADS = [
  { id: 1, courseId: 1, name: 'Guía del Agente de Viajes IATA', type: 'PDF', size: '2.4 MB', category: 'Formación' },
  { id: 2, courseId: 1, name: 'Plantilla de Cotización de Paquetes', type: 'XLSX', size: '840 KB', category: 'Formación' },
  { id: 3, courseId: 2, name: 'Comandos Amadeus — Cheat Sheet', type: 'PDF', size: '1.1 MB', category: 'GDS & Reservas' },
  { id: 4, courseId: 2, name: 'Glosario GDS — Amadeus y Sabre', type: 'PDF', size: '560 KB', category: 'GDS & Reservas' },
  { id: 5, courseId: 3, name: 'Guía de Proveedores de Lujo 2026', type: 'PDF', size: '3.2 MB', category: 'Turismo de Lujo' },
  { id: 6, courseId: 4, name: 'Kit de Templates para Redes Sociales', type: 'ZIP', size: '18 MB', category: 'Marketing Turístico' },
  { id: 7, courseId: 4, name: 'Calendario Editorial Turístico', type: 'XLSX', size: '670 KB', category: 'Marketing Turístico' },
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
          action={
            <Link to="/cursos" className="btn btn-primary">
              Ver cursos <BookOpen size={14} />
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 720 }}>
          {available.map(file => {
            const course = mockCourses.find(c => c.id === file.courseId);
            return (
              <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: `${TYPE_COLORS[file.type]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={18} color={TYPE_COLORS[file.type]} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    <span style={{ background: `${TYPE_COLORS[file.type]}18`, color: TYPE_COLORS[file.type], padding: '1px 6px', borderRadius: 4, fontWeight: 600, fontSize: 10, marginRight: 8 }}>{file.type}</span>
                    {file.size} · {course?.title}
                  </div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => alert('Descarga disponible cuando el backend esté activo.')}>
                  <Download size={13} /> Descargar
                </button>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

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

  const enrolled = (user.enrolledCourses || []).length;
  const completed = (user.enrolledCourses || []).filter(id => MOCK_PROGRESS[id] === 100).length;

  return (
    <PageShell icon={User} label="Mi cuenta" title="Perfil">
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32, alignItems: 'start', maxWidth: 900 }}>

        {/* Left: avatar card */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
          <img src={user.avatar} alt={user.name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', marginBottom: 14 }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{user.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>Agente de viajes</div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Cursos inscriptos', val: enrolled },
              { label: 'Cursos completados', val: completed },
              { label: 'Certificados obtenidos', val: completed },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>{s.label}</span>
                <strong style={{ color: 'var(--text)' }}>{s.val}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, color: 'var(--text)' }}>Información personal</h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-3)', marginBottom: 6 }}>Nombre completo</label>
              <input className="input" type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-3)', marginBottom: 6 }}>Email</label>
              <input className="input" type="email" value={user.email} disabled style={{ opacity: 0.65, cursor: 'not-allowed' }} />
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>El email no puede modificarse desde aquí.</p>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 4 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>Cambiar contraseña</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-3)', marginBottom: 6 }}>Contraseña actual</label>
                  <input className="input" type="password" placeholder="••••••••" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-3)', marginBottom: 6 }}>Nueva contraseña</label>
                  <input className="input" type="password" placeholder="••••••••" />
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 8 }}>
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
