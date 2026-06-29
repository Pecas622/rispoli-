import { Link, Navigate } from 'react-router-dom';
import { BookOpen, Award, ArrowRight, Play } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { courses } from '../data/courses';
import './Dashboard.css';

const PROGRESS = { 1:68, 2:35, 3:100, 4:12, 5:0, 6:55 };

export default function Dashboard() {
  const { user } = useApp();
  if (!user) return <Navigate to="/" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;

  const enrolled = courses.filter(c => user.enrolledCourses?.includes(c.id));
  const completed = enrolled.filter(c => PROGRESS[c.id] === 100).length;
  const totalHours = enrolled.reduce((a,c) => a + Math.round(c.hours * (PROGRESS[c.id]||0) / 100), 0);

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dash-top">
          <p className="dash-greeting">Panel de alumno</p>
          <h1 className="dash-title">
            Hola, {user.name.split(' ')[0]}
            <img src={user.avatar} alt="" className="dash-user-img" />
          </h1>
        </div>

        <div className="dash-stats">
          {[
            { icon:'📚', val: enrolled.length, label:'Cursos inscriptos' },
            { icon:'✅', val: completed,        label:'Completados' },
            { icon:'⏱', val: `${totalHours}h`, label:'Horas aprendidas' },
            { icon:'🏆', val: completed,        label:'Certificados' },
          ].map(({ icon, val, label }) => (
            <div key={label} className="dash-stat-card">
              <span className="dash-stat-icon">{icon}</span>
              <div className="dash-stat-val">{val}</div>
              <div className="dash-stat-label">{label}</div>
            </div>
          ))}
        </div>

        <p className="dash-section-title">Mis cursos</p>

        {enrolled.length === 0 ? (
          <div className="dash-empty">
            <BookOpen size={36} style={{color:'var(--text-3)',marginBottom:16}} />
            <h3>Todavía no tenés cursos</h3>
            <p style={{marginBottom:24}}>Explorá el catálogo y empezá a aprender</p>
            <Link to="/cursos" className="btn btn-primary">Ver cursos <ArrowRight size={14}/></Link>
          </div>
        ) : (
          <div className="dash-courses-grid">
            {enrolled.map(course => {
              const prog = PROGRESS[course.id] || 0;
              return (
                <div key={course.id} className="dash-course-card card">
                  <div className="dash-course-img">
                    <img src={course.image} alt={course.title} />
                    {prog === 100 && (
                      <div className="dash-done-badge">
                        <Award size={28} color="white" />
                      </div>
                    )}
                  </div>
                  <div className="dash-course-body">
                    <div className="dash-course-title">{course.title}</div>
                    <div className="dash-course-instructor">{course.instructor.name}</div>
                    <div className="dash-progress-row">
                      <div className="progress-bar" style={{flex:1}}>
                        <div className="progress-fill" style={{width:`${prog}%`}} />
                      </div>
                      <span className="dash-progress-pct">{prog}%</span>
                    </div>
                    <div className="dash-actions">
                      <Link to={`/cursos/${course.id}`} className="btn btn-primary btn-sm" style={{flex:1,justifyContent:'center'}}>
                        <Play size={12} fill="white" color="white" />
                        {prog===0 ? 'Comenzar' : prog===100 ? 'Repasar' : 'Continuar'}
                      </Link>
                      {prog===100 && (
                        <button className="btn btn-outline btn-sm"><Award size={13}/></button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {enrolled.length > 0 && (
          <div style={{marginTop:40,paddingTop:40,borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <p style={{fontSize:14,color:'var(--text-3)'}}>¿Querés aprender algo más?</p>
            <Link to="/cursos" className="btn btn-outline btn-sm">Explorar cursos <ArrowRight size={13}/></Link>
          </div>
        )}
      </div>
    </div>
  );
}
