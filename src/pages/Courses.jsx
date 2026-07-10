import { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { courses as mockCourses } from '../data/courses';
import { coursesApi } from '../services/api';
import CourseCard from '../components/CourseCard';
import { useSEO } from '../hooks/useSEO';
import './Courses.css';

const USE_API = import.meta.env.VITE_USE_API === 'true';

export default function Courses() {
  useSEO({
    title:       'Cursos de agente de viajes y turismo — Go Travel Academy',
    description: 'Explorá nuestros cursos de formación en turismo: agente de viajes, destinos internacionales y más, con certificado avalado por la Universidad del Aconcagua.',
    path:        '/cursos',
  });

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(USE_API);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!USE_API) { setCourses(mockCourses); setLoading(false); return; }
    coursesApi.list()
      .then(res => setCourses(res.courses))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => courses.filter(c => {
    const q = query.toLowerCase();
    return !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || (c.tags ?? []).some(t => t.toLowerCase().includes(q));
  }), [courses, query]);

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
              <p>Probá con otros términos</p>
              <button onClick={() => setQuery('')} className="btn btn-primary">Ver todos</button>
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
