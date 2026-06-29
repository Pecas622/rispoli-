import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Star, Clock, Users, BookOpen, Play, CheckCircle, ChevronDown, Minus } from 'lucide-react';
import { courses } from '../data/courses';
import { useApp } from '../context/AppContext';
import './CourseDetail.css';

const levelBadge = { 'Principiante':'badge-green','Intermedio':'badge-amber','Avanzado':'badge-red' };

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, enrollCourse, isEnrolled, setAuthModal } = useApp();
  const [openModule, setOpenModule] = useState(0);
  const [enrolling, setEnrolling] = useState(false);

  const course = courses.find(c => c.id === Number(id));
  if (!course) return (
    <div style={{padding:'160px 0',textAlign:'center'}}>
      <h2>Curso no encontrado</h2>
      <Link to="/cursos" className="btn btn-primary" style={{display:'inline-flex',marginTop:20}}>Ver cursos</Link>
    </div>
  );

  const enrolled = isEnrolled(course.id);
  const discount = Math.round((1 - course.price / course.originalPrice) * 100);

  const handleEnroll = async () => {
    if (!user) { setAuthModal('register'); return; }
    setEnrolling(true);
    await new Promise(r => setTimeout(r, 700));
    enrollCourse(course.id);
    setEnrolling(false);
  };

  return (
    <div className="course-detail">
      <div className="detail-head">
        <div className="container">
          <button onClick={() => navigate(-1)} className="back-link">
            <ArrowLeft size={14} /> Volver
          </button>
          <div className="detail-layout">
            <div>
              <div className="detail-badges">
                <span className={`badge ${levelBadge[course.level]||'badge-default'}`}>{course.level}</span>
                <span className="badge badge-default">{course.category}</span>
                <span className="badge badge-default">{course.modality}</span>
              </div>
              <h1 className="detail-title">{course.title}</h1>
              <p className="detail-subtitle">{course.subtitle}</p>
              <p className="detail-desc">{course.description}</p>

              <div className="detail-meta-row">
                <span className="detail-meta-item">
                  <Star size={13} fill="#F59E0B" color="#F59E0B" />
                  <strong>{course.rating}</strong> ({course.reviews.toLocaleString()} reseñas)
                </span>
                <span className="detail-meta-item"><Users size={13} /> {course.students.toLocaleString()} estudiantes</span>
                <span className="detail-meta-item"><Clock size={13} /> {course.duration}</span>
                <span className="detail-meta-item"><BookOpen size={13} /> {course.hours}h de contenido</span>
              </div>

              <div className="instructor-mini">
                <img src={course.instructor.avatar} alt={course.instructor.name} />
                <div>
                  <div className="instructor-mini-name">{course.instructor.name}</div>
                  <div className="instructor-mini-role">{course.instructor.role}</div>
                </div>
              </div>
            </div>

            {/* Enroll card */}
            <div className="enroll-card card card-elevated">
              <div className="enroll-thumb">
                <img src={course.image} alt={course.title} />
                <div className="enroll-thumb-overlay">
                  <div className="play-btn-circle">
                    <Play size={18} fill="var(--text)" color="var(--text)" style={{marginLeft:2}} />
                  </div>
                </div>
              </div>
              <div className="enroll-body">
                <div className="enroll-price">
                  <span className="enroll-price-now">${course.price.toLocaleString()}</span>
                  {discount > 0 && <span className="enroll-price-was">${course.originalPrice.toLocaleString()}</span>}
                </div>
                {discount > 0 && <p className="enroll-urgency">Oferta finaliza en 2 días</p>}

                {enrolled ? (
                  <>
                    <div className="enrolled-pill">
                      <CheckCircle size={16} /> Ya estás inscripto
                    </div>
                    <Link to="/dashboard" className="btn btn-outline" style={{width:'100%',justifyContent:'center'}}>Ir a mi panel</Link>
                  </>
                ) : (
                  <button onClick={handleEnroll} className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'13px'}} disabled={enrolling}>
                    {enrolling ? <><div className="spinner" /> Procesando...</> : 'Inscribirme ahora'}
                  </button>
                )}

                <p style={{textAlign:'center',fontSize:12,color:'var(--text-3)',marginTop:10}}>
                  Garantía de devolución 30 días
                </p>

                <div className="enroll-includes">
                  <p className="enroll-includes-title">Incluye</p>
                  {course.includes.map(item => (
                    <div key={item} className="include-item">
                      <CheckCircle size={13} style={{color:'var(--teal)',flexShrink:0}} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-content">
        <div className="container">
          <div className="detail-cols">
            <div>
              {/* Syllabus */}
              <div className="detail-section">
                <h2 className="detail-section-title">Programa del curso</h2>
                {course.syllabus.map((mod, i) => (
                  <div key={i} className="module-row" onClick={() => setOpenModule(openModule === i ? null : i)}>
                    <div className="module-header">
                      <div className="module-num">{String(i+1).padStart(2,'0')}</div>
                      <div>
                        <div className="module-label">{mod.week}</div>
                        <div className="module-name">{mod.title}</div>
                      </div>
                      <ChevronDown size={15} className={`module-chevron ${openModule === i ? 'open' : ''}`} />
                    </div>
                    {openModule === i && (
                      <div className="module-topics">
                        {mod.topics.map(t => (
                          <div key={t} className="topic-row">
                            <Play size={11} fill="var(--text-3)" color="var(--text-3)" /> {t}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Instructor */}
              <div className="detail-section">
                <h2 className="detail-section-title">Tu instructor</h2>
                <div className="instructor-block">
                  <img src={course.instructor.avatar} alt={course.instructor.name} />
                  <div>
                    <div className="instructor-name">{course.instructor.name}</div>
                    <div className="instructor-role">{course.instructor.role}</div>
                    <p className="instructor-bio">{course.instructor.bio}</p>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="detail-section">
                <h2 className="detail-section-title">Requisitos</h2>
                {course.requirements.map(r => (
                  <div key={r} className="req-item">
                    <div className="req-dot" />
                    {r}
                  </div>
                ))}
              </div>
            </div>

            <div />
          </div>
        </div>
      </div>
    </div>
  );
}
