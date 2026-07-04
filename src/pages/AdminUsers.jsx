import { useState, useEffect, useCallback } from 'react';
import { Search, X, Check, Edit2, Trash2, Loader, ChevronLeft, ChevronRight, Gift } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usersApi, enrollmentsApi, coursesApi } from '../services/api';

const ROLES = ['STUDENT', 'INSTRUCTOR', 'ADMIN'];

export default function AdminUsers() {
  const { showToast } = useApp();

  const [users,      setUsers]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');

  const [editUser,  setEditUser]  = useState(null);
  const [editForm,  setEditForm]  = useState({ name: '', avatar: '', role: 'STUDENT', isBlocked: false });
  const [saving,    setSaving]    = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);

  const [detailUser,        setDetailUser]        = useState(null);
  const [detailEnrollments, setDetailEnrollments]  = useState(null);
  const [allCourses,        setAllCourses]         = useState([]);
  const [grantCourseId,     setGrantCourseId]      = useState('');
  const [grantConfirm,      setGrantConfirm]       = useState(false);
  const [granting,          setGranting]           = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    usersApi.list({ search, page, limit: 20 })
      .then(res => { setUsers(res.users); setTotal(res.total); setTotalPages(res.totalPages); })
      .catch(() => showToast('Error al cargar usuarios', 'error'))
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce de búsqueda
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => { setPage(1); }, [search]);

  // ── Editar ───────────────────────────────────────────────
  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ name: u.name, avatar: u.avatar ?? '', role: u.role, isBlocked: !!u.isBlocked });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await usersApi.update(editUser.id, editForm);
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...res.user } : u));
      showToast('Usuario actualizado');
      setEditUser(null);
    } catch (err) {
      showToast(err.message || 'Error al actualizar', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar ─────────────────────────────────────────────
  const confirmDelete = async () => {
    try {
      await usersApi.remove(deleteUser.id);
      setUsers(prev => prev.filter(u => u.id !== deleteUser.id));
      showToast('Usuario eliminado', 'info');
    } catch (err) {
      showToast(err.message || 'Error al eliminar', 'error');
    } finally {
      setDeleteUser(null);
    }
  };

  // ── Detalle (inscripciones + dar curso gratis) ──────────
  const openDetail = (u) => {
    setDetailUser(u);
    setDetailEnrollments(null);
    setGrantCourseId('');
    setGrantConfirm(false);
    enrollmentsApi.all({ userId: u.id })
      .then(res => setDetailEnrollments(res.enrollments))
      .catch(() => setDetailEnrollments([]));
    if (allCourses.length === 0) {
      coursesApi.list().then(res => setAllCourses(res.courses)).catch(() => {});
    }
  };

  const grantFreeCourse = async () => {
    if (!grantCourseId) return;
    setGranting(true);
    try {
      await enrollmentsApi.free(grantCourseId, detailUser.id);
      showToast('Curso otorgado gratis');
      const res = await enrollmentsApi.all({ userId: detailUser.id });
      setDetailEnrollments(res.enrollments);
      setGrantCourseId('');
      setGrantConfirm(false);
    } catch (err) {
      showToast(err.message || 'Error al otorgar el curso', 'error');
    } finally {
      setGranting(false);
    }
  };

  return (
    <div className="container">
      <div className="admin-table-card">
        <div className="admin-table-head">
          <span className="admin-table-head-title">Usuarios {total ? `(${total})` : ''}</span>
          <div className="table-search-wrap">
            <Search size={13} />
            <input className="input table-search" placeholder="Buscar por nombre o email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
            <Loader size={26} style={{ animation: 'spin 1s linear infinite', color: 'var(--violet)' }} />
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Registrado</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ cursor:'pointer' }} onClick={() => openDetail(u)}>
                      <td style={{fontSize:13,fontWeight:600}}>{u.name}</td>
                      <td style={{fontSize:13,color:'var(--text-2)'}}>{u.email}</td>
                      <td><span className="badge badge-default">{u.role}</span></td>
                      <td style={{fontSize:13,color:'var(--text-2)'}}>{new Date(u.createdAt).toLocaleDateString('es-AR')}</td>
                      <td>
                        {u.isBlocked
                          ? <span className="badge badge-default" style={{color:'var(--red)'}}>Bloqueado</span>
                          : <span className="badge badge-green">Activo</span>}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{display:'flex',gap:6}}>
                          <button className="action-btn" title="Editar" onClick={() => openEdit(u)}><Edit2 size={13}/></button>
                          <button className="action-btn del" title="Eliminar" onClick={() => setDeleteUser(u)}><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign:'center', padding:'32px 0', color:'var(--text-3)' }}>Sin usuarios</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:14, padding:'16px 0' }}>
                <button className="action-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14}/></button>
                <span style={{ fontSize:13, color:'var(--text-3)' }}>Página {page} de {totalPages}</span>
                <button className="action-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14}/></button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Editar usuario */}
      {editUser && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setEditUser(null)}>
          <div className="modal" style={{maxWidth:440}}>
            <button className="modal-close-btn" onClick={()=>setEditUser(null)}><X size={14}/></button>
            <p className="modal-title">Editar usuario</p>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="form-field">
                <label>Nombre</label>
                <input className="input" value={editForm.name} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))} />
              </div>
              <div className="form-field">
                <label>Avatar (URL)</label>
                <input className="input" value={editForm.avatar} onChange={e=>setEditForm(p=>({...p,avatar:e.target.value}))} />
              </div>
              <div className="form-field">
                <label>Rol</label>
                <select className="input" value={editForm.role} onChange={e=>setEditForm(p=>({...p,role:e.target.value}))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13}}>
                <input type="checkbox" checked={editForm.isBlocked} onChange={e=>setEditForm(p=>({...p,isBlocked:e.target.checked}))} />
                Bloqueado (solo etiqueta, no impide iniciar sesión todavía)
              </label>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={()=>setEditUser(null)}>Cancelar</button>
                <button className="btn btn-primary" onClick={saveEdit} disabled={saving} style={{flex:1,justifyContent:'center'}}>
                  {saving ? <div className="spinner"/> : <Check size={14}/>} Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Eliminar usuario */}
      {deleteUser && (
        <div className="modal-overlay" onClick={()=>setDeleteUser(null)}>
          <div className="modal" style={{maxWidth:380}} onClick={e=>e.stopPropagation()}>
            <p className="modal-title">¿Eliminar a {deleteUser.name}?</p>
            <p style={{fontSize:14,color:'var(--text-2)',marginBottom:24}}>
              Esta acción no se puede deshacer. Se van a borrar también sus inscripciones y su progreso.
            </p>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setDeleteUser(null)} className="btn btn-outline" style={{flex:1,justifyContent:'center'}}>Cancelar</button>
              <button onClick={confirmDelete} className="btn btn-primary" style={{flex:1,justifyContent:'center',background:'var(--red)',borderColor:'var(--red)'}}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Detalle: inscripciones + dar curso gratis */}
      {detailUser && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setDetailUser(null)}>
          <div className="modal" style={{maxWidth:520,maxHeight:'85vh',overflowY:'auto'}}>
            <button className="modal-close-btn" onClick={()=>setDetailUser(null)}><X size={14}/></button>
            <p className="modal-title">{detailUser.name}</p>
            <p style={{fontSize:13,color:'var(--text-3)',marginTop:-16,marginBottom:20}}>{detailUser.email}</p>

            <p style={{fontSize:12,fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:10}}>Cursos inscriptos</p>
            {detailEnrollments === null ? (
              <div style={{ display:'flex', justifyContent:'center', padding:'20px 0' }}>
                <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--violet)' }} />
              </div>
            ) : detailEnrollments.length === 0 ? (
              <p style={{fontSize:13,color:'var(--text-3)',marginBottom:20}}>Sin inscripciones todavía.</p>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
                {detailEnrollments.map(e => (
                  <div key={e.id} style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'8px 12px',border:'1px solid var(--border)',borderRadius:'var(--r-sm)'}}>
                    <span>{e.course?.title ?? '—'}</span>
                    <span style={{color:'var(--text-3)'}}>
                      {e.paidAt ? new Date(e.paidAt).toLocaleDateString('es-AR') : 'Pendiente'} · ${(e.amount ?? 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p style={{fontSize:12,fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:10}}>Dar curso gratis</p>
            <div style={{display:'flex',gap:8}}>
              <select className="input" value={grantCourseId} onChange={e=>{setGrantCourseId(e.target.value); setGrantConfirm(false);}} style={{flex:1}}>
                <option value="">Elegí un curso...</option>
                {allCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              {!grantConfirm ? (
                <button className="btn btn-outline" disabled={!grantCourseId} onClick={()=>setGrantConfirm(true)}>
                  <Gift size={14}/> Dar gratis
                </button>
              ) : (
                <button className="btn btn-primary" onClick={grantFreeCourse} disabled={granting}>
                  {granting ? <div className="spinner"/> : <Check size={14}/>} Confirmar
                </button>
              )}
            </div>
            {grantConfirm && (
              <p style={{fontSize:12,color:'var(--text-3)',marginTop:8}}>
                Confirmá para darle acceso gratuito a este curso a {detailUser.name}.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
