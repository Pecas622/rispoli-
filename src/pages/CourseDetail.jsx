import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Clock, Users, BookOpen, Play, CheckCircle, ChevronDown, Award, Lock } from 'lucide-react';
import { courses as mockCourses } from '../data/courses';
import { coursesApi, progressApi } from '../services/api';
import { useApp } from '../context/AppContext';
import { getRegionPrice, formatPrice, getCheckoutLabel } from '../utils/pricing';
import { useSEO } from '../hooks/useSEO';
import './CourseDetail.css';

const USE_API = import.meta.env.VITE_USE_API === 'true';
const levelBadge = {
  'Principiante':'badge-green','Intermedio':'badge-amber','Avanzado':'badge-red',
  'Principiante-Intermedio':'badge-green','Intermedio-Avanzado':'badge-amber',
};
const EMPTY_PROGRESS = { percent: 0, completed: 0, total: 0, completedLessonIds: [] };
const MOCK_PROGRESS = { 1: 68, 2: 35, 3: 100, 4: 12, 5: 0, 6: 55 }; // solo para el fallback sin backend

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, enrollCourse, isEnrolled, setAuthModal, showToast, region, dolarRate } = useApp();
  const [course, setCourse] = useState(undefined); // undefined = cargando, null = no encontrado
  const [progress, setProgress] = useState(EMPTY_PROGRESS);
  const [openModule, setOpenModule] = useState(0);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (searchParams.get('payment') === 'cancelled') {
      showToast('Pago cancelado. Podés intentarlo de nuevo cuando quieras.', 'error');
    }
  }, []);

  useEffect(() => {
    if (!USE_API) {
      setCourse(mockCourses.find(c => c.id === Number(id)) ?? null);
      return;
    }
    coursesApi.get(id)
      .then(res => setCourse(res.course))
      .catch(() => setCourse(null));
  }, [id]);

  const enrolled = course ? isEnrolled(course.id) : false;

  useEffect(() => {
    if (!USE_API || !enrolled || !course) return;
    progressApi.getCourse(course.id).then(setProgress).catch(() => {});
  }, [enrolled, course?.id]);

  useSEO({
    title:       course ? `${course.title} — Go Travel Academy` : undefined,
    description: course ? (course.subtitle || course.description?.slice(0, 160)) : undefined,
    image:       course?.image,
    path:        course ? `/cursos/${course.id}` : undefined,
    jsonLd: course ? {
      '@context': 'https://schema.org',
      '@type':    'Course',
      name:        course.title,
      description: course.description ?? course.subtitle ?? '',
      provider: {
        '@type': 'Organization',
        name:    'Go Travel Academy',
        sameAs:  'https://gotravelacademy.vercel.app',
      },
      ...(course.level    ? { educationalLevel: course.level } : {}),
      ...(course.modality ? { courseMode: course.modality } : {}),
      ...(course.price > 0 ? {
        offers: { '@type': 'Offer', price: course.price, priceCurrency: 'ARS', availability: 'https://schema.org/InStock' },
      } : {}),
    } : null,
  });

  if (course === undefined) return <div style={{padding:'160px 0',textAlign:'center'}}><div className="spinner" style={{margin:'0 auto'}} /></div>;
  if (!course) return (
    <div style={{padding:'160px 0',textAlign:'center'}}>
      <h2>Curso no encontrado</h2>
      <Link to="/cursos" className="btn btn-primary" style={{display:'inline-flex',marginTop:20}}>Ver cursos</Link>
    </div>
  );

  const { current: coursePrice, original: courseOriginal } = getRegionPrice(course, region, dolarRate);
  const discount  = courseOriginal > 0 ? Math.round((1 - coursePrice / courseOriginal) * 100) : 0;
  const checkoutLabel = getCheckoutLabel(region);

  const instructor = {
    name:   course.instructorName   ?? course.instructor?.name   ?? 'Por definir',
    role:   course.instructorRole   ?? course.instructor?.role   ?? '',
    avatar: course.instructorAvatar ?? course.instructor?.avatar ?? '',
    bio:    course.instructorBio    ?? course.instructor?.bio    ?? '',
  };
  const requirements     = course.requirements ?? [];
  const includes         = course.includes ?? [];
  const learningObjectives = course.learningObjectives ?? [];
  const targetAudience     = course.targetAudience ?? [];

  // ── Temario: real (módulos/clases) si viene de la API, mock si no ───────────
  const syllabus = course.modules
    ? course.modules.map((m, i) => ({ week: `Módulo ${i + 1}`, title: m.title, topics: (m.lessons ?? []).map(l => l.title) }))
    : (course.syllabus ?? []);

  // ── Cálculo de progreso ─────────────────────────────────────────────────────
  const allTopics   = syllabus.flatMap(m => m.topics);
  const totalTopics = USE_API ? (progress.total || allTopics.length) : allTopics.length;
  const prog        = enrolled ? (USE_API ? progress.percent : (MOCK_PROGRESS[course.id] ?? 0)) : 0;
  const completedCount = USE_API ? progress.completed : Math.round(totalTopics * prog / 100);
  const nextTopic   = prog < 100 ? allTopics[completedCount] : null;

  // Pre-calcular índices por módulo
  let runningIdx = 0;
  const modulesWithIdx = syllabus.map(mod => {
    const startIdx = runningIdx;
    runningIdx += mod.topics.length;
    return { ...mod, startIdx, endIdx: runningIdx };
  });

  const handleEnroll = async () => {
    if (!user) { setAuthModal('register'); return; }
    setEnrolling(true);
    await new Promise(r => setTimeout(r, 700));
    enrollCourse(course);
    setEnrolling(false);
  };

  const handleEnrollTransfer = async () => {
    if (!user) { setAuthModal('register'); return; }
    setEnrolling(true);
    await new Promise(r => setTimeout(r, 700));
    enrollCourse(course, { overridePrice: coursePrice * 0.9, paymentMethodLabel: 'Transferencia bancaria' });
    setEnrolling(false);
  };

  const handleContinue = () => showToast('El visor de clases estará disponible próximamente', 'info');

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
              {course.description && (
                <p className="detail-desc" style={{ whiteSpace: 'pre-line' }}>{course.description}</p>
              )}

              <div className="detail-meta-row">
                <span className="detail-meta-item">
                  <Star size={13} fill="#F59E0B" color="#F59E0B" />
                  <strong>{course.rating}</strong> ({course.reviews.toLocaleString()} reseñas)
                </span>
                <span className="detail-meta-item"><Users size={13} /> {course.students.toLocaleString()} estudiantes</span>
                {course.duration && <span className="detail-meta-item"><Clock size={13} /> {course.duration}</span>}
                {course.hours && <span className="detail-meta-item"><BookOpen size={13} /> {course.hours}h de contenido</span>}
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
                onContinue={handleContinue}
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
                  {course.price === 0 ? (
                    <>
                      <div className="enroll-price">
                        <span className="enroll-price-now">Próximamente</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="enroll-price">
                        <span className="enroll-price-now">{formatPrice(coursePrice, region)}</span>
                        {discount > 0 && <span className="enroll-price-was">{formatPrice(courseOriginal, region)}</span>}
                        {discount > 0 && <span className="enroll-discount">-{discount}%</span>}
                      </div>
                      <button
                        onClick={handleEnroll}
                        className="btn btn-primary"
                        style={{width:'100%',justifyContent:'center',padding:'13px',marginTop:16}}
                        disabled={enrolling}
                      >
                        {enrolling ? <><div className="spinner" /> Procesando...</> : checkoutLabel}
                      </button>

                      {region === 'AR' && course.transferCode && (
                        <div className="enroll-includes">
                          <p className="enroll-includes-title">Promociones disponibles</p>

                          <div style={{border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'12px 14px',marginBottom:10}}>
                            <p style={{fontSize:12,fontWeight:700,color:'var(--green)',marginBottom:4}}>10% OFF — Pagando por transferencia</p>
                            <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:2}}>
                              <span style={{fontSize:18,fontWeight:800}}>{formatPrice(coursePrice * 0.9, region)}</span>
                              <span style={{fontSize:12,color:'var(--text-3)',textDecoration:'line-through'}}>{formatPrice(coursePrice, region)}</span>
                            </div>
                            <p style={{fontSize:11,color:'var(--text-3)',marginBottom:10}}>Pago único</p>
                            <button
                              onClick={handleEnrollTransfer}
                              className="btn btn-outline btn-sm"
                              style={{width:'100%',justifyContent:'center'}}
                              disabled={enrolling}
                            >
                              {enrolling ? <><div className="spinner" /> Procesando...</> : `Pagar ${formatPrice(coursePrice * 0.9, region)} por transferencia`}
                            </button>
                          </div>

                          <div style={{border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'12px 14px'}}>
                            <p style={{fontSize:12,fontWeight:700,color:'var(--violet-mid)',marginBottom:4}}>6 cuotas sin interés — Con Mercado Pago</p>
                            <p style={{fontSize:18,fontWeight:800,marginBottom:2}}>6 x {formatPrice(coursePrice / 6, region)}</p>
                            <p style={{fontSize:11,color:'var(--text-3)'}}>Total: {formatPrice(coursePrice, region)} sin interés</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {includes.length > 0 && (
                    <div className="enroll-includes">
                      <p className="enroll-includes-title">Incluye</p>
                      {includes.map(item => (
                        <div key={item} className="include-item">
                          <CheckCircle size={13} style={{color:'var(--violet-mid)',flexShrink:0}} />
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
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
              {modulesWithIdx.length > 0 && (
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
              )}

              {/* ── Instructor ── */}
              <div className="detail-section">
                <h2 className="detail-section-title">Tu instructor</h2>
                <div className="instructor-block">
                  <img src={instructor.avatar} alt={instructor.name} />
                  <div>
                    <div className="instructor-name">{instructor.name}</div>
                    <div className="instructor-role">{instructor.role}</div>
                    <p className="instructor-bio">{instructor.bio}</p>
                  </div>
                </div>
              </div>

              {/* ── Con este curso aprenderás ── */}
              {learningObjectives.length > 0 && (
                <div className="detail-section">
                  <h2 className="detail-section-title">Con este curso aprenderás</h2>
                  {learningObjectives.map(item => (
                    <div key={item} className="req-item">
                      <CheckCircle size={15} style={{color:'var(--violet-mid)',flexShrink:0,marginTop:2}} />
                      {item}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Orientado para ── */}
              {targetAudience.length > 0 && (
                <div className="detail-section">
                  <h2 className="detail-section-title">Orientado para</h2>
                  {targetAudience.map(item => (
                    <div key={item} className="req-item">
                      <div className="req-dot" />
                      {item}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Requisitos ── */}
              <div className="detail-section">
                <h2 className="detail-section-title">Requisitos</h2>
                {requirements.map(r => (
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
function ProgressCard({ course, prog, completedCount, totalTopics, nextTopic, onContinue }) {
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
                <button onClick={onContinue} className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:16}}>
                  <Play size={14} fill="white" color="white" /> Comenzar curso
                </button>
              </>
            ) : (
              <>
                <div className="pc-next-label">Siguiente clase</div>
                <div className="pc-next-lesson">{nextTopic}</div>
                <button onClick={onContinue} className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:16}}>
                  <Play size={14} fill="white" color="white" /> Continuar
                </button>
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
