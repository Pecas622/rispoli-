import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LayoutList, Search, BookOpen, Users, Star, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { coursesApi } from '../services/api';
import { courses as mockCourses } from '../data/courses';
import './Instructor.css';

const USE_API = import.meta.env.VITE_USE_API === 'true';

export default function Instructor() {
  const { user } = useApp();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);

  if (!user) return <Navigate to="/" />;
  if (user.role !== 'instructor') return <Navigate to="/dashboard" />;

  useEffect(() => {
    if (USE_API) {
      coursesApi.list()
        .then(res => setCourses(res.courses))
        .catch(() => setCourses([]))
        .finally(() => setLoading(false));
    } else {
      setCourses(mockCourses);
      setLoading(false);
    }
  }, []);

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.category ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="instructor-page">
      <div className="container">

        <div className="instr-header">
          <div>
            <p className="instr-greeting">Panel de instructor</p>
            <h1 className="instr-title">Mis cursos</h1>
          </div>
        </div>

        <div className="instr-toolbar">
          <div className="search-wrap" style={{ maxWidth: 340 }}>
            <Search size={15} className="search-icon" />
            <input
              className="search-input"
              placeholder="Buscar curso…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--violet)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="instr-empty">
            <BookOpen size={48} />
            <h3>Sin cursos asignados</h3>
            <p>Contactá al administrador para que te asigne cursos.</p>
          </div>
        ) : (
          <div className="instr-grid">
            {filtered.map(course => (
              <div key={course.id} className="instr-card card">
                <div className="instr-card-img">
                  {course.image
                    ? <img src={course.image} alt={course.title} />
                    : <div className="instr-card-img-placeholder"><BookOpen size={32} /></div>
                  }
                  <span className={`badge ${course.published !== false ? 'badge-teal' : 'badge-gray'}`}>
                    {course.published !== false ? 'Publicado' : 'Borrador'}
                  </span>
                </div>
                <div className="instr-card-body">
                  <p className="instr-card-category">{course.category}</p>
                  <h3 className="instr-card-title">{course.title}</h3>
                  <div className="instr-card-meta">
                    <span><Users size={13} /> {course.students ?? 0} alumnos</span>
                    <span><Star size={13} /> {course.rating ?? '—'}</span>
                  </div>
                  <button
                    className="btn btn-primary btn-sm instr-content-btn"
                    onClick={() => navigate(`/admin/courses/${course.id}/content`)}
                  >
                    <LayoutList size={14} /> Gestionar contenido
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
