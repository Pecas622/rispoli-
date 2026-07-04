import { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { courses as mockCourses, categories, levels, modalities } from '../data/courses';
import { coursesApi } from '../services/api';
import CourseCard from '../components/CourseCard';
import './Courses.css';

const USE_API = import.meta.env.VITE_USE_API === 'true';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(USE_API);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [level, setLevel] = useState('Todos');
  const [modality, setModality] = useState('Todos');

  useEffect(() => {
    if (!USE_API) { setCourses(mockCourses); setLoading(false); return; }
    coursesApi.list()
      .then(res => setCourses(res.courses))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => courses.filter(c => {
    const q = query.toLowerCase();
    const matchQ = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || (c.tags ?? []).some(t => t.toLowerCase().includes(q));
    return matchQ
      && (category === 'Todos' || c.category === category)
      && (level === 'Todos' || c.level === level)
      && (modality === 'Todos' || c.modality === modality);
  }), [courses, query, category, level, modality]);

  const reset = () => { setQuery(''); setCategory('Todos'); setLevel('Todos'); setModality('Todos'); };
  const hasFilters = query || category !== 'Todos' || level !== 'Todos' || modality !== 'Todos';

  return (
    <div className="courses-page">
      <div className="courses-head">
        <div className="container">
          <p className="label">Catálogo de cursos</p>
          <h1 className="section-title" style={{marginBottom:0}}>Encontrá tu próximo curso</h1>
          <div className="search-wrap">
            <Search size={15} className="search-icon-left" />
            <input
              className="search-field"
              type="text"
              placeholder="Buscar cursos, tecnologías, habilidades..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && <button onClick={() => setQuery('')} className="search-clear"><X size={14} /></button>}
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="container" style={{display:'flex',gap:20,flexWrap:'wrap',alignItems:'center',width:'100%'}}>
          <div className="filter-group">
            <span className="filter-label-sm">Categoría:</span>
            {categories.map(c => (
              <button key={c} className={`filter-chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="filter-group" style={{marginLeft:'auto'}}>
            <select className="filter-select" value={level} onChange={e => setLevel(e.target.value)}>
              <option value="Todos">Nivel</option>
              {levels.slice(1).map(l => <option key={l}>{l}</option>)}
            </select>
            <select className="filter-select" value={modality} onChange={e => setModality(e.target.value)}>
              <option value="Todos">Modalidad</option>
              {modalities.slice(1).map(m => <option key={m}>{m}</option>)}
            </select>
            {hasFilters && (
              <button onClick={reset} className="btn-ghost btn btn-sm" style={{padding:'5px 10px',fontSize:13}}>
                <X size={13} /> Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="results-section">
        <div className="container">
          <div className="results-meta">
            <span className="results-count">
              <strong>{filtered.length}</strong> curso{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign:'center', padding:'80px 0' }}>
              <div className="spinner" style={{ margin:'0 auto' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>Sin resultados</h3>
              <p>Probá con otros términos o limpiá los filtros</p>
              <button onClick={reset} className="btn btn-primary">Ver todos</button>
            </div>
          ) : (
            <div className="grid-auto">
              {filtered.map(c => <CourseCard key={c.id} course={c} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
