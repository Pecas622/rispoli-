import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Award, Download, User, BookOpen, CheckCircle, ArrowLeft, FileText, ExternalLink, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './UserPages.css';

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

function LoadingBlock() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <Loader size={26} style={{ animation: 'spin 1s linear infinite', color: 'var(--violet-mid)' }} />
    </div>
  );
}

// ── Certificaciones ───────────────────────────────────────────────────────────
export function Certificaciones() {
  const { user, enrollments, enrollmentsLoading, showToast } = useApp();
  if (!user) return <Navigate to="/" />;

  const completed = enrollments.filter(e => e.progressPercent === 100);

  return (
    <PageShell icon={Award} label="Mis logros" title="Certificados">
      {enrollmentsLoading ? (
        <LoadingBlock />
      ) : completed.length === 0 ? (
        <EmptyState
          icon={Award}
          title="Todavía no tenés certificados"
          desc="Completá un curso al 100% para obtener tu certificado oficial avalado por la Universidad del Aconcagua."
          action={<Link to="/cursos" className="btn btn-primary">Explorar cursos <BookOpen size={14} /></Link>}
        />
      ) : (
        <div className="cert-grid">
          {completed.map(e => (
            <CertCard key={e.courseId} course={e.course} user={user} showToast={showToast} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

function CertCard({ course, user, showToast }) {
  const certNum = `GTA-${new Date().getFullYear()}-${String(course.id).slice(-4).toUpperCase()}`;
  const date = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(6,4,63,0.06)' }}>
      <div style={{ background: 'linear-gradient(135deg, #06043F 0%, #0D0A6B 100%)', padding: '28px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <p style={{ color: '#8CB0F4', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Certificado oficial</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Go Travel Academy</p>
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
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Verificado · Aval Universidad del Aconcagua</span>
        </div>
      </div>

      <div style={{ padding: '14px 20px', display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => showToast('Descarga de PDF disponible próximamente', 'info')}>
          <Download size={13} /> Descargar PDF
        </button>
        <button className="btn btn-outline btn-sm"
          onClick={() => showToast('Compartir disponible próximamente', 'info')}>
          <ExternalLink size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Descargas ─────────────────────────────────────────────────────────────────
const TYPE_COLORS = { PDF: '#EF4444', XLSX: '#22C55E', ZIP: '#F59E0B' };

export function Descargas() {
  const { user, enrollments, enrollmentsLoading } = useApp();
  if (!user) return <Navigate to="/" />;

  const available = enrollments.flatMap(e =>
    (e.course?.modules ?? []).flatMap(m =>
      (m.lessons ?? []).flatMap(l =>
        (l.resources ?? []).map(r => ({ ...r, courseTitle: e.course.title }))
      )
    )
  );

  return (
    <PageShell icon={Download} label="Recursos" title="Mis descargas">
      {enrollmentsLoading ? (
        <LoadingBlock />
      ) : available.length === 0 ? (
        <EmptyState
          icon={Download}
          title="No tenés recursos disponibles"
          desc="Los materiales descargables de tus cursos aparecerán acá cuando el instructor los suba."
          action={<Link to="/cursos" className="btn btn-primary">Ver cursos <BookOpen size={14} /></Link>}
        />
      ) : (
        <div className="downloads-list">
          {available.map(file => {
            const type = (file.type || '').toUpperCase();
            const color = TYPE_COLORS[type] ?? '#6F95E8';
            return (
              <div key={file.id} className="download-row">
                <div className="download-icon" style={{ background: `${color}18` }}>
                  <FileText size={18} color={color} />
                </div>
                <div className="download-info">
                  <div className="download-name">{file.name}</div>
                  <div className="download-meta">
                    <span className="download-type" style={{ background: `${color}18`, color }}>{type || 'Archivo'}</span>
                    {file.size ? `${file.size} · ` : ''}{file.courseTitle}
                  </div>
                </div>
                <a className="btn btn-outline btn-sm" href={file.url || '#'} target="_blank" rel="noreferrer">
                  <Download size={13} />
                  <span className="hide-xs">Descargar</span>
                </a>
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
  const { user, showToast, region, selectRegion, enrollments, updateProfile, changePassword } = useApp();
  if (!user) return <Navigate to="/" />;

  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    await updateProfile({ name });
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) { showToast('La nueva contraseña debe tener al menos 8 caracteres', 'error'); return; }
    setChangingPwd(true);
    const result = await changePassword(currentPassword, newPassword);
    setChangingPwd(false);
    if (result.success) { setCurrentPassword(''); setNewPassword(''); }
  };

  const enrolled  = enrollments.length;
  const completed = enrollments.filter(e => e.progressPercent === 100).length;

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
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>

          <div className="perfil-prefs-section">
            <h3 className="perfil-section-title">Cambiar contraseña</h3>
            <div className="perfil-pwd-fields">
              <div className="perfil-field">
                <label>Contraseña actual</label>
                <input className="input" type="password" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              </div>
              <div className="perfil-field">
                <label>Nueva contraseña</label>
                <input className="input" type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              disabled={changingPwd || !currentPassword || !newPassword}
              onClick={handleChangePassword}
            >
              {changingPwd ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </div>

          <div className="perfil-prefs-section">
            <h2 className="perfil-form-title">Preferencias</h2>
            <div className="perfil-field">
              <label>Región y moneda</label>
              <div className="perfil-region-options">
                <button
                  className={`perfil-region-btn ${!region || region === 'AR' ? 'active' : ''}`}
                  onClick={() => { selectRegion('AR'); showToast('Región actualizada: Argentina'); }}
                >
                  🇦🇷 Argentina · ARS
                </button>
                <button
                  className={`perfil-region-btn ${region === 'WORLD' ? 'active' : ''}`}
                  onClick={() => { selectRegion('WORLD'); showToast('Region updated: International'); }}
                >
                  🌍 Resto del mundo · USD
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </PageShell>
  );
}
