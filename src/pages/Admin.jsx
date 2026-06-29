import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, X, Check, LayoutList } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { courses as initialCourses } from '../data/courses';
import './Admin.css';

export default function Admin() {
  const { user, showToast } = useApp();
  const navigate = useNavigate();
  if (!user) return <Navigate to="/" />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" />;

  const [courses, setCourses] = useState(initialCourses);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ title:'', category:'Programación', level:'Principiante', price:'', duration:'', description:'' });

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm({ title:'', category:'Programación', level:'Principiante', price:'', duration:'', description:'' });
    setModal('create');
  };
  const openEdit = c => {
    setForm({ title:c.title, category:c.category, level:c.level, price:c.price, duration:c.duration, description:c.description });
    setModal(c);
  };
  const handleSave = () => {
    if (!form.title || !form.price) { showToast('Completá los campos requeridos', 'error'); return; }
    if (modal === 'create') {
      setCourses(p => [{ ...form, id:Date.now(), price:Number(form.price), originalPrice:Number(form.price)*1.3, rating:5, reviews:0, students:0, hours:40, modality:'Online', image:'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80', color:'#7C3AED', tags:[], syllabus:[], requirements:[], includes:[], featured:false, instructor:{ name:'Por definir', role:'', avatar:'', bio:'' }, subtitle:form.description.slice(0,60) }, ...p]);
      showToast('Curso creado');
    } else {
      setCourses(p => p.map(c => c.id === modal.id ? { ...c, ...form, price:Number(form.price) } : c));
      showToast('Curso actualizado');
    }
    setModal(null);
  };
  const handleDelete = id => { setCourses(p => p.filter(c => c.id !== id)); setDeleteId(null); showToast('Eliminado', 'info'); };
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-head">
          <div>
            <p className="label" style={{marginBottom:8}}>Panel de administración</p>
            <h1 style={{fontFamily:'var(--display)',fontSize:32,fontWeight:800,letterSpacing:'-0.03em'}}>Dashboard</h1>
          </div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={15}/> Nuevo curso</button>
        </div>

        <div className="admin-stats">
          {[
            { label:'Total cursos',      val: courses.length },
            { label:'Estudiantes',       val: courses.reduce((a,c)=>a+c.students,0).toLocaleString() },
            { label:'Rating promedio',   val: (courses.reduce((a,c)=>a+c.rating,0)/courses.length).toFixed(1) },
            { label:'Ingresos est.',     val: `$${Math.round(courses.reduce((a,c)=>a+c.price*c.students*0.08,0)/1000000)}M` },
          ].map(({ label, val }) => (
            <div key={label} className="admin-stat">
              <div className="admin-stat-label">{label}</div>
              <div className="admin-stat-val">{val}</div>
            </div>
          ))}
        </div>

        <div className="admin-table-card">
          <div className="admin-table-head">
            <span className="admin-table-head-title">Gestión de cursos</span>
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
                    <td style={{fontSize:13,fontWeight:600}}>{c.students.toLocaleString()}</td>
                    <td style={{fontSize:13}}>★ {c.rating}</td>
                    <td style={{fontSize:13,fontWeight:700}}>${c.price.toLocaleString()}</td>
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
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal">
            <button className="modal-close-btn" onClick={()=>setModal(null)}><X size={14}/></button>
            <p className="modal-title">{modal==='create' ? 'Nuevo curso' : `Editar curso`}</p>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="form-field">
                <label>Título *</label>
                <input className="input" placeholder="Ej: Desarrollo Web Full Stack" value={form.title} onChange={set('title')} />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Precio (ARS) *</label>
                  <input className="input" type="number" placeholder="89900" value={form.price} onChange={set('price')} />
                </div>
                <div className="form-field">
                  <label>Duración</label>
                  <input className="input" placeholder="4 meses" value={form.duration} onChange={set('duration')} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Categoría</label>
                  <select className="input" value={form.category} onChange={set('category')}>
                    {['Programación','Diseño','Marketing','Data Science','Tecnología'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Nivel</label>
                  <select className="input" value={form.level} onChange={set('level')}>
                    {['Principiante','Intermedio','Avanzado'].map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Descripción</label>
                <textarea className="input" rows={3} placeholder="Descripción breve..." value={form.description} onChange={set('description')} />
              </div>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={()=>setModal(null)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSave} style={{flex:1,justifyContent:'center'}}>
                  <Check size={14}/> {modal==='create' ? 'Crear curso' : 'Guardar'}
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
