import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, X, Check, LayoutList, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { coursesApi } from '../services/api';
import { courses as mockCourses, categories, levels, modalities } from '../data/courses';

const USE_API = import.meta.env.VITE_USE_API === 'true';

const emptyForm = {
  title: '', subtitle: '', description: '',
  category: categories[1], level: levels[1], modality: modalities[1],
  duration: '', hours: '', price: '', originalPrice: '', priceUSD: '', originalPriceUSD: '', transferCode: '',
  image: '', featured: false, published: true,
  tags: '', requirements: '', includes: '', learningObjectives: '', targetAudience: '',
  instructorName: '', instructorRole: '', instructorAvatar: '', instructorBio: '',
};

// Convierte el form (strings) al shape que espera la API
function formToPayload(form) {
  return {
    title:            form.title,
    subtitle:         form.subtitle || undefined,
    description:      form.description || undefined,
    category:         form.category,
    level:            form.level,
    modality:         form.modality,
    duration:         form.duration || undefined,
    hours:            form.hours ? Number(form.hours) : undefined,
    price:            Number(form.price),
    originalPrice:    form.originalPrice ? Number(form.originalPrice) : undefined,
    priceUSD:         form.priceUSD ? Number(form.priceUSD) : undefined,
    originalPriceUSD: form.originalPriceUSD ? Number(form.originalPriceUSD) : undefined,
    transferCode:     form.transferCode || undefined,
    image:            form.image || undefined,
    featured:         form.featured,
    published:        form.published,
    tags:             form.tags.split(',').map(t => t.trim()).filter(Boolean),
    requirements:     form.requirements.split('\n').map(t => t.trim()).filter(Boolean),
    includes:         form.includes.split('\n').map(t => t.trim()).filter(Boolean),
    learningObjectives: form.learningObjectives.split('\n').map(t => t.trim()).filter(Boolean),
    targetAudience:     form.targetAudience.split('\n').map(t => t.trim()).filter(Boolean),
    instructorName:   form.instructorName || undefined,
    instructorRole:   form.instructorRole || undefined,
    instructorAvatar: form.instructorAvatar || undefined,
    instructorBio:    form.instructorBio || undefined,
  };
}

// Convierte un curso real (de la API) al shape del form (todo string, para inputs controlados)
function courseToForm(c) {
  return {
    title: c.title ?? '', subtitle: c.subtitle ?? '', description: c.description ?? '',
    category: c.category ?? categories[1], level: c.level ?? levels[1], modality: c.modality ?? modalities[1],
    duration: c.duration ?? '', hours: c.hours ?? '',
    price: c.price ?? '', originalPrice: c.originalPrice ?? '', priceUSD: c.priceUSD ?? '', originalPriceUSD: c.originalPriceUSD ?? '', transferCode: c.transferCode ?? '',
    image: c.image ?? '', featured: !!c.featured, published: c.published ?? true,
    tags: (c.tags ?? []).join(', '),
    requirements: (c.requirements ?? []).join('\n'),
    includes: (c.includes ?? []).join('\n'),
    learningObjectives: (c.learningObjectives ?? []).join('\n'),
    targetAudience: (c.targetAudience ?? []).join('\n'),
    instructorName: c.instructorName ?? '', instructorRole: c.instructorRole ?? '',
    instructorAvatar: c.instructorAvatar ?? '', instructorBio: c.instructorBio ?? '',
  };
}

export default function AdminCourses() {
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(USE_API);
  const [saving,  setSaving]  = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadCourses = useCallback(() => {
    if (!USE_API) { setCourses(mockCourses); setLoading(false); return; }
    setLoading(true);
    coursesApi.list()
      .then(res => setCourses(res.courses))
      .catch(() => showToast('Error al cargar los cursos', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm(emptyForm); setModal('create'); };
  const openEdit = c => { setForm(courseToForm(c)); setModal(c); };

  const handleSave = async () => {
    if (!form.title || !form.price) { showToast('Completá los campos requeridos', 'error'); return; }

    if (!USE_API) {
      // Mock fallback (sin backend corriendo)
      const ars = Number(form.price);
      if (modal === 'create') {
        setCourses(p => [{ ...form, id: Date.now(), price: ars }, ...p]);
      } else {
        setCourses(p => p.map(c => c.id === modal.id ? { ...c, ...form, price: ars } : c));
      }
      showToast(modal === 'create' ? 'Curso creado' : 'Curso actualizado');
      setModal(null);
      return;
    }

    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (modal === 'create') {
        const res = await coursesApi.create(payload);
        setCourses(p => [res.course, ...p]);
        showToast('Curso creado');
      } else {
        const res = await coursesApi.update(modal.id, payload);
        setCourses(p => p.map(c => c.id === modal.id ? res.course : c));
        showToast('Curso actualizado');
      }
      setModal(null);
    } catch (err) {
      showToast(err.message || 'Error al guardar el curso', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!USE_API) {
      setCourses(p => p.filter(c => c.id !== id));
      setDeleteId(null);
      showToast('Eliminado', 'info');
      return;
    }
    try {
      await coursesApi.delete(id);
      setCourses(p => p.filter(c => c.id !== id));
      showToast('Eliminado', 'info');
    } catch (err) {
      showToast(err.message || 'Error al eliminar', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const set = k => e => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [k]: v }));
  };

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'40vh' }}>
        <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--violet)' }} />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-head">
        <span className="admin-table-head-title">Gestión de cursos</span>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15}/> Nuevo curso</button>
      </div>

      <div className="admin-stats">
        {[
          { label:'Total cursos',      val: courses.length },
          { label:'Estudiantes',       val: courses.reduce((a,c)=>a+(c.students||0),0).toLocaleString() },
          { label:'Rating promedio',   val: courses.length ? (courses.reduce((a,c)=>a+(c.rating||0),0)/courses.length).toFixed(1) : '0.0' },
          { label:'Ingresos est.',     val: `$${Math.round(courses.reduce((a,c)=>a+(c.price||0)*(c.students||0)*0.08,0)/1000000)}M` },
        ].map(({ label, val }) => (
          <div key={label} className="admin-stat">
            <div className="admin-stat-label">{label}</div>
            <div className="admin-stat-val">{val}</div>
          </div>
        ))}
      </div>

      <div className="admin-table-card">
        <div className="admin-table-head">
          <span className="admin-table-head-title">Cursos</span>
          <div className="table-search-wrap">
            <Search size={13} />
            <input className="input table-search" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Curso</th>
                <th>Categoría</th>
                <th>Nivel</th>
                <th>Alumnos</th>
                <th>Rating</th>
                <th>Precio</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="table-course-cell">
                      <img src={c.image} alt="" className="table-thumb" />
                      <div>
                        <div className="table-course-name">{c.title}</div>
                        <div className="table-course-dur">{c.duration}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-default">{c.category}</span></td>
                  <td style={{fontSize:13,color:'var(--text-2)'}}>{c.level}</td>
                  <td style={{fontSize:13,fontWeight:600}}>{(c.students||0).toLocaleString()}</td>
                  <td style={{fontSize:13}}>★ {c.rating || 0}</td>
                  <td style={{fontSize:13,fontWeight:700}}>${(c.price||0).toLocaleString()}</td>
                  <td>
                    {c.published === false
                      ? <span className="badge badge-default" style={{color:'var(--text-3)'}}>Borrador</span>
                      : <span className="badge badge-green">Publicado</span>}
                  </td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      <button className="action-btn content" title="Contenido" onClick={() => navigate(`/admin/courses/${c.id}/content`)}><LayoutList size={13}/></button>
                      <button className="action-btn" title="Editar" onClick={() => openEdit(c)}><Edit2 size={13}/></button>
                      <button className="action-btn del" title="Eliminar" onClick={() => setDeleteId(c.id)}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal" style={{maxWidth:560,maxHeight:'85vh',overflowY:'auto'}}>
            <button className="modal-close-btn" onClick={()=>setModal(null)}><X size={14}/></button>
            <p className="modal-title">{modal==='create' ? 'Nuevo curso' : `Editar curso`}</p>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="form-field">
                <label>Título *</label>
                <input className="input" placeholder="Ej: Agente de Viajes Profesional" value={form.title} onChange={set('title')} />
              </div>
              <div className="form-field">
                <label>Subtítulo</label>
                <input className="input" placeholder="Bajada corta del curso" value={form.subtitle} onChange={set('subtitle')} />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Precio ARS *</label>
                  <input className="input" type="number" placeholder="89900" value={form.price} onChange={set('price')} />
                </div>
                <div className="form-field">
                  <label>Precio original ARS</label>
                  <input className="input" type="number" placeholder="129900" value={form.originalPrice} onChange={set('originalPrice')} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Precio USD</label>
                  <input className="input" type="number" placeholder="89" value={form.priceUSD} onChange={set('priceUSD')} />
                </div>
                <div className="form-field">
                  <label>Precio original USD</label>
                  <input className="input" type="number" placeholder="129" value={form.originalPriceUSD} onChange={set('originalPriceUSD')} />
                </div>
              </div>
              <div className="form-field">
                <label>Código de descuento por transferencia (10% off, opcional)</label>
                <input className="input" placeholder="TRANSFER10" value={form.transferCode} onChange={set('transferCode')} />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Duración</label>
                  <input className="input" placeholder="6 meses" value={form.duration} onChange={set('duration')} />
                </div>
                <div className="form-field">
                  <label>Horas</label>
                  <input className="input" type="number" placeholder="120" value={form.hours} onChange={set('hours')} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Categoría</label>
                  <select className="input" value={form.category} onChange={set('category')}>
                    {categories.slice(1).map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Nivel</label>
                  <select className="input" value={form.level} onChange={set('level')}>
                    {levels.slice(1).map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Modalidad</label>
                <select className="input" value={form.modality} onChange={set('modality')}>
                  {modalities.slice(1).map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Imagen (URL)</label>
                <input className="input" placeholder="https://..." value={form.image} onChange={set('image')} />
              </div>
              <div className="form-field">
                <label>Descripción</label>
                <textarea className="input" rows={3} placeholder="Descripción del curso..." value={form.description} onChange={set('description')} />
              </div>
              <div className="form-field">
                <label>Tags (separados por coma)</label>
                <input className="input" placeholder="IATA, Amadeus, Sabre" value={form.tags} onChange={set('tags')} />
              </div>
              <div className="form-field">
                <label>Con este curso aprenderás (uno por línea)</label>
                <textarea className="input" rows={2} placeholder="Cotizar y vender vuelos, hoteles y servicios turísticos" value={form.learningObjectives} onChange={set('learningObjectives')} />
              </div>
              <div className="form-field">
                <label>Orientado para (uno por línea)</label>
                <textarea className="input" rows={2} placeholder="Personas interesadas en comenzar a trabajar en turismo" value={form.targetAudience} onChange={set('targetAudience')} />
              </div>
              <div className="form-field">
                <label>Requisitos (uno por línea)</label>
                <textarea className="input" rows={2} placeholder="Computadora con acceso a internet" value={form.requirements} onChange={set('requirements')} />
              </div>
              <div className="form-field">
                <label>Incluye (uno por línea)</label>
                <textarea className="input" rows={2} placeholder="Certificado, acceso de por vida..." value={form.includes} onChange={set('includes')} />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Instructor</label>
                  <input className="input" placeholder="Nombre" value={form.instructorName} onChange={set('instructorName')} />
                </div>
                <div className="form-field">
                  <label>Rol del instructor</label>
                  <input className="input" placeholder="Especialista IATA · Ex Despegar" value={form.instructorRole} onChange={set('instructorRole')} />
                </div>
              </div>
              <div className="form-field">
                <label>Avatar del instructor (URL)</label>
                <input className="input" placeholder="https://..." value={form.instructorAvatar} onChange={set('instructorAvatar')} />
              </div>
              <div className="form-field">
                <label>Bio del instructor</label>
                <textarea className="input" rows={2} value={form.instructorBio} onChange={set('instructorBio')} />
              </div>
              <div className="form-row">
                <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13}}>
                  <input type="checkbox" checked={form.featured} onChange={set('featured')} /> Destacado
                </label>
                <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13}}>
                  <input type="checkbox" checked={form.published} onChange={set('published')} /> Publicado
                </label>
              </div>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={()=>setModal(null)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{flex:1,justifyContent:'center'}}>
                  {saving ? <div className="spinner"/> : <Check size={14}/>} {modal==='create' ? 'Crear curso' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={()=>setDeleteId(null)}>
          <div className="modal" style={{maxWidth:360}} onClick={e=>e.stopPropagation()}>
            <p className="modal-title">¿Eliminar curso?</p>
            <p style={{fontSize:14,color:'var(--text-2)',marginBottom:24}}>Esta acción no se puede deshacer.</p>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setDeleteId(null)} className="btn btn-outline" style={{flex:1,justifyContent:'center'}}>Cancelar</button>
              <button onClick={()=>handleDelete(deleteId)} className="btn btn-primary" style={{flex:1,justifyContent:'center',background:'var(--red)',borderColor:'var(--red)'}}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
