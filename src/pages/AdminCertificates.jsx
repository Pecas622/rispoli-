import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader, Search, Upload, FileText, Trash2, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { certificatesApi, uploadsApi } from '../services/api';

// Mismo tope que /api/uploads (plan Free de Supabase).
const MAX_MB = 45;

const VISTAS = [
  { id: 'terminaron', label: 'Terminaron el curso' },
  { id: 'todos',      label: 'Todos sin certificado' },
  { id: 'cargados',   label: 'Certificados cargados' },
];

const fecha = d => (d ? new Date(d).toLocaleDateString('es-AR') : '—');

// Pestaña "Certificados" del panel: el equipo sube el PDF de cada alumno y el
// alumno lo descarga desde /certificaciones. Por defecto muestra a quienes
// terminaron un curso al 100% y todavía no tienen certificado.
export default function AdminCertificates() {
  const { showToast } = useApp();

  const [pending,  setPending]  = useState([]);
  const [loaded,   setLoaded]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [vista,    setVista]    = useState('terminaron');
  const [search,   setSearch]   = useState('');
  const [subiendo, setSubiendo] = useState(null); // clave alumno:curso en vuelo
  const [borrando, setBorrando] = useState(null); // certificado a confirmar antes de quitar
  const [quitandoId, setQuitandoId] = useState(null);

  const fileInput = useRef(null);
  const destino   = useRef(null); // { userId, courseId, nombre, reemplazo }

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    certificatesApi.adminList()
      .then(res => { setPending(res.pending); setLoaded(res.loaded); })
      .catch(() => { setError(true); showToast('Error al cargar los certificados', 'error'); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const elegirArchivo = (row, reemplazo = false) => {
    destino.current = { userId: row.userId, courseId: row.courseId, nombre: row.user?.name ?? 'el alumno', reemplazo };
    fileInput.current.value = '';
    fileInput.current.click();
  };

  const onArchivo = async (e) => {
    const file = e.target.files?.[0];
    const d = destino.current;
    if (!file || !d) return;
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      showToast('El certificado tiene que ser un archivo PDF', 'error'); return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      showToast(`El PDF pesa más de ${MAX_MB} MB`, 'error'); return;
    }
    const key = `${d.userId}:${d.courseId}`;
    setSubiendo(key);
    try {
      const { url, name } = await uploadsApi.upload(file);
      const res = await certificatesApi.save({ userId: d.userId, courseId: d.courseId, fileUrl: url, fileName: name ?? file.name });
      showToast(res.replaced
        ? 'Certificado reemplazado'
        : `Certificado cargado. Le avisamos por mail a ${d.nombre}.`);
      load();
    } catch (err) {
      showToast(err.message || 'No se pudo cargar el certificado', 'error');
    } finally {
      setSubiendo(null);
    }
  };

  const quitar = async () => {
    const c = borrando;
    setBorrando(null);
    setQuitandoId(c.id);
    try {
      await certificatesApi.remove(c.id);
      showToast('Certificado quitado');
      load();
    } catch (err) {
      showToast(err.message || 'No se pudo quitar el certificado', 'error');
    } finally {
      setQuitandoId(null);
    }
  };

  const q = search.trim().toLowerCase();
  const coincide = r => !q || [r.user?.name, r.user?.email, r.course?.title].some(v => v?.toLowerCase().includes(q));

  const terminaron = pending.filter(p => p.progressPercent === 100);
  const filas = vista === 'cargados'
    ? loaded.filter(coincide)
    : (vista === 'terminaron' ? terminaron : pending).filter(coincide);

  return (
    <div className="container">
      <input ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={onArchivo} />

      <div className="admin-stats">
        {[
          { label: 'Terminaron sin certificado', val: terminaron.length },
          { label: 'Certificados cargados',      val: loaded.length },
        ].map(({ label, val }) => (
          <div key={label} className="admin-stat">
            <div className="admin-stat-label">{label}</div>
            <div className="admin-stat-val">{loading ? '—' : val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {VISTAS.map(v => (
          <button key={v.id} className={`btn btn-sm ${vista === v.id ? 'btn-primary' : 'btn-outline'}`} onClick={() => setVista(v.id)}>
            {v.label}
          </button>
        ))}
      </div>

      <div className="admin-table-card">
        <div className="admin-table-head">
          <span className="admin-table-head-title">
            {VISTAS.find(v => v.id === vista).label} {loading ? '' : `(${filas.length})`}
          </span>
          <div className="table-search-wrap">
            <Search size={13} />
            <input className="input table-search" placeholder="Buscar alumno o curso..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Loader size={26} style={{ animation: 'spin 1s linear infinite', color: 'var(--violet)' }} />
          </div>
        ) : error ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>No se pudieron cargar los certificados.</p>
        ) : filas.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
            {q ? 'No hay resultados para esa búsqueda.'
              : vista === 'cargados' ? 'Todavía no se cargó ningún certificado.'
              : vista === 'terminaron' ? 'No hay alumnos esperando su certificado.'
              : 'Todos los alumnos inscriptos ya tienen su certificado.'}
          </p>
        ) : vista === 'cargados' ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Alumno</th><th>Curso</th><th>Cargado</th><th>Archivo</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {filas.map(c => {
                  const key = `${c.userId}:${c.courseId}`;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.user?.name ?? '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.user?.email}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{c.course?.title ?? '—'}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-2)' }}>{fecha(c.updatedAt ?? c.uploadedAt)}</td>
                      <td>
                        <a href={c.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                          <FileText size={13} /> Ver PDF
                        </a>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button className="btn btn-outline btn-sm" disabled={subiendo === key} onClick={() => elegirArchivo(c, true)}>
                            {subiendo === key ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />} Reemplazar
                          </button>
                          <button className="btn btn-outline btn-danger btn-sm" disabled={quitandoId === c.id} onClick={() => setBorrando(c)}>
                            <Trash2 size={13} /> Quitar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Alumno</th><th>Curso</th><th>Progreso</th><th>Compra</th><th>Certificado</th></tr>
              </thead>
              <tbody>
                {filas.map(p => {
                  const key = `${p.userId}:${p.courseId}`;
                  return (
                    <tr key={key}>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{p.user?.name ?? '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.user?.email}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{p.course?.title ?? '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 150 }}>
                          <div className="progress-bar" style={{ width: 60, flexShrink: 0 }}>
                            <div className="progress-fill" style={{ width: `${p.progressPercent}%`, background: p.progressPercent === 100 ? 'var(--green)' : 'var(--accent)' }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.completedLessons}/{p.totalLessons} · {p.progressPercent}%</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-2)' }}>{fecha(p.paidAt)}</td>
                      <td>
                        <button className="btn btn-primary btn-sm" disabled={subiendo === key} onClick={() => elegirArchivo(p)}>
                          {subiendo === key
                            ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Subiendo…</>
                            : <><Upload size={13} /> Cargar PDF</>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {borrando && (
        <div className="modal-overlay" onClick={() => setBorrando(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <p className="modal-title">¿Quitar este certificado?</p>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, margin: '8px 0 20px' }}>
              {borrando.user?.name} deja de ver su certificado de <strong>{borrando.course?.title}</strong>.
              Si terminó el curso, vuelve a figurar como pendiente.
            </p>
            <div className="form-actions">
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setBorrando(null)}>Cancelar</button>
              <button className="btn btn-primary btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={quitar}>Quitar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
