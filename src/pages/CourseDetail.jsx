import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Clock, Users, BookOpen, Play, CheckCircle, ChevronDown, Award, Lock } from 'lucide-react';
import { courses } from '../data/courses';
import { useApp } from '../context/AppContext';
import './CourseDetail.css';

const levelBadge = { 'Principiante':'badge-green','Intermedio':'badge-amber','Avanzado':'badge-red' };

// Progreso simulado por courseId (igual que en Dashboard)
const MOCK_PROGRESS = { 1: 68, 2: 35, 3: 100, 4: 12, 5: 0, 6: 55 };

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, enrollCourse, isEnrolled, setAuthModal, showToast } = useApp();
  const [openModule, setOpenModule] = useState(0);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (searchParams.get('payment') === 'cancelled') {
      showToast('Pago cancelado. Podés intentarlo de nuevo cuando quieras.', 'error');
    }
  }, []);

  const course = courses.find(c => c.id === Number(id));
  if (!course) return (
    <div style={{padding:'160px 0',textAlign:'center'}}>
      <h2>Curso no encontrado</h2>
      <Link to="/cursos" className="btn btn-primary" style={{display:'inline-flex',marginTop:20}}>Ver cursos</Link>
    </div>
  );

  const enrolled = isEnrolled(course.id);
  const discount  = Math.round((1 - course.price / course.originalPrice) * 100);

  // ── Cálculo de progreso ─────────────────────────────────────────────────────
  const prog        = enrolled ? (MOCK_PROGRESS[course.id] ?? 0) : 0;
  const allTopics   = course.syllabus.flatMap(m => m.topics);
  const totalTopics = allTopics.length;
  const completedCount = Math.round(totalTopics * prog / 100);
  const nextTopic   = prog < 100 ? allTopics[completedCount] : null;

  // Pre-calcular índices por módulo
  let runningIdx = 0;
  const modulesWithIdx = course.syllabus.map(mod => {
    const startIdx = runningIdx;
    runningIdx += mod.topics.length;
    return { ...mod, startIdx, endIdx: runningIdx };
  });

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
            {/* ── Columna izquierda ── */}
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

            {/* ── Sidebar ── */}
            {enrolled ? (
              <ProgressCard
                course={course}
                prog={prog}
                completedCount={completedCount}
                totalTopics={totalTopics}
                nextTopic={nextTopic}
              />
            ) : (
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
                    {discount > 0 && <span className="enroll-discount">-{discount}%</span>}
                  </div>
                  {discount > 0 && <p className="enroll-urgency">Oferta finaliza en 2 días</p>}

                  <button
                    onClick={handleEnroll}
                    className="btn btn-primary"
                    style={{width:'100%',justifyContent:'center',padding:'13px',marginTop:16}}
                    disabled={enrolling}
                  >
                    {enrolling ? <><div className="spinner" /> Procesando...</> : 'Inscribirme ahora'}
                  </button>

                  <p style={{textAlign:'center',fontSize:12,color:'var(--text-3)',marginTop:10}}>
                    Garantía de devolución 30 días
                  </p>

                  <div className="enroll-includes">
                    <p className="enroll-includes-title">Incluye</p>
                    {course.includes.map(item => (
                      <div key={item} className="include-item">
                        <CheckCircle size={13} style={{color:'var(--violet-mid)',flexShrink:0}} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="detail-content">
        <div className="container">
          <div className="detail-cols">
            <div>
              {/* ── Programa ── */}
              <div className="detail-section">
                <h2 className="detail-section-title">Programa del curso</h2>

                {enrolled && (
                  <div className="prog-summary-bar">
                    <div className="psb-text">
                      <span>{completedCount} de {totalTopics} clases completadas</span>
                      <span className="psb-pct">{prog}%</span>
                    </div>
                    <div className="progress-bar" style={{height:6}}>
                      <div className="progress-fill" style={{width:`${prog}%`, background: prog === 100 ? 'var(--green)' : 'var(--violet-mid)'}} />
                    </div>
                  </div>
                )}

                {modulesWithIdx.map((mod, i) => {
                  const modDone = enrolled && completedCount >= mod.endIdx;
                  const modInProgress = enrolled && completedCount > mod.startIdx && completedCount < mod.endIdx;

                  return (
                    <div
                      key={i}
                      className={`module-row ${modDone ? 'mod-done' : modInProgress ? 'mod-active' : ''}`}
                      onClick={() => setOpenModule(openModule === i ? null : i)}
                    >
                      <div className="module-header">
                        <div className={`module-num ${modDone ? 'num-done' : modInProgress ? 'num-active' : ''}`}>
                          {modDone ? <CheckCircle size={13} /> : String(i+1).padStart(2,'0')}
                        </div>
                        <div style={{flex:1}}>
                          <div className="module-label">{mod.week}</div>
                          <div className="module-name">{mod.title}</div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
                          {enrolled && (
                            <span className="mod-status-pill">
                              {modDone ? 'Completado' : modInProgress ? `${completedCount - mod.startIdx}/${mod.topics.length}` : `0/${mod.topics.length}`}
                            </span>
                          )}
                          <ChevronDown size={15} className={`module-chevron ${openModule === i ? 'open' : ''}`} />
                        </div>
                      </div>

                      {openModule === i && (
                        <div className="module-topics">
                          {mod.topics.map((t, ti) => {
                            const absIdx = mod.startIdx + ti;
                            const done    = enrolled && absIdx < completedCount;
                            const current = enrolled && absIdx === completedCount;
                            const locked  = !enrolled && absIdx > 0;

                            return (
                              <div key={t} className={`topic-row ${done ? 'topic-done' : current ? 'topic-current' : ''}`}>
                                <span className="topic-icon">
                                  {done    ? <CheckCircle size={13} color="var(--green)" /> :
                                   current  ? <Play size={12} fill="var(--violet-mid)" color="var(--violet-mid)" /> :
                                   locked   ? <Lock size={11} color="var(--text-3)" /> :
                                              <Play size={11} fill="var(--text-3)" color="var(--text-3)" />}
                                </span>
                                <span className="topic-name">{t}</span>
                                {done && <span className="topic-done-badge">✓</span>}
                                {current && <span className="topic-current-badge">Siguiente</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Instructor ── */}
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

              {/* ── Requisitos ── */}
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

// ── Tarjeta de progreso (sidebar cuando el alumno está inscripto) ─────────────
function ProgressCard({ course, prog, completedCount, totalTopics, nextTopic }) {
  const remaining = totalTopics - completedCount;
  const isComplete = prog === 100;

  return (
    <div className="progress-card card card-elevated">
      {/* Imagen con overlay de progreso */}
      <div className="pc-thumb">
        <img src={course.image} alt={course.title} />
        <div className="pc-thumb-overlay">
          <div className="pc-pct-badge">{prog}%</div>
        </div>
      </div>

      <div className="pc-body">
        {isComplete ? (
          /* ── Estado: completado ── */
          <div className="pc-complete">
            <div className="pc-complete-icon">
              <Award size={32} color="var(--amber)" />
            </div>
            <div className="pc-complete-title">¡Curso completado!</div>
            <p className="pc-complete-sub">Obtuviste tu certificado oficial.</p>
            <Link to="/certificaciones" className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:16}}>
              <Award size={14} /> Ver mi certificado
            </Link>
            <Link to="/cursos" className="btn btn-outline" style={{width:'100%',justifyContent:'center',marginTop:10}}>
              Explorar más cursos
            </Link>
          </div>
        ) : (
          /* ── Estado: en progreso ── */
          <>
            <div className="pc-header">
              <span className="pc-label">Tu progreso</span>
              <span className="pc-pct-text">{prog}%</span>
            </div>

            <div className="progress-bar pc-bar">
              <div className="progress-fill" style={{width:`${prog}%`}} />
            </div>

            <div className="pc-counts">
              <span><strong>{completedCount}</strong> completadas</span>
              <span><strong>{remaining}</strong> restantes</span>
            </div>

            {prog === 0 ? (
              <>
                <div className="pc-next-label">Empezá con</div>
                <div className="pc-next-lesson">{nextTopic}</div>
                <Link to={`/cursos/${course.id}/contenido`} className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:16}}>
                  <Play size={14} fill="white" color="white" /> Comenzar curso
                </Link>
              </>
            ) : (
              <>
                <div className="pc-next-label">Siguiente clase</div>
                <div className="pc-next-lesson">{nextTopic}</div>
                <Link to={`/cursos/${course.id}/contenido`} className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:16}}>
                  <Play size={14} fill="white" color="white" /> Continuar
                </Link>
              </>
            )}

            <Link to="/dashboard" className="btn btn-outline" style={{width:'100%',justifyContent:'center',marginTop:10,fontSize:13}}>
              Ir al panel
            </Link>
          </>
        )}

        {/* Stats rápidas */}
        <div className="pc-stats">
          <div className="pc-stat">
            <BookOpen size={14} color="var(--text-3)" />
            <span>{totalTopics} clases</span>
          </div>
          <div className="pc-stat">
            <Clock size={14} color="var(--text-3)" />
            <span>{course.hours}h de contenido</span>
          </div>
        </div>
      </div>
    </div>
  );
}
