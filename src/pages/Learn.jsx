import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, Circle, Play, Lock,
  FileText, Archive, Image, Code, File, AlignLeft, ChevronDown,
  MessageCircle, Send, Trash2, User as UserIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { coursesApi, modulesApi, progressApi, questionsApi } from '../services/api';
import './Learn.css';

const TYPE_ICONS = { pdf: FileText, zip: Archive, image: Image, code: Code };

function extractYouTubeId(url = '') {
  return url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1] ?? '';
}
function extractVimeoId(url = '') {
  return url.match(/vimeo\.com\/(\d+)/)?.[1] ?? '';
}

function VideoPlayer({ videoType, videoUrl }) {
  if (!videoType || videoType === 'none' || !videoUrl) {
    return (
      <div className="learn-no-video">
        <Play size={36} />
        <span>Sin video configurado</span>
      </div>
    );
  }
  const noDownload = (e) => e.preventDefault();

  if (videoType === 'youtube') {
    const id = extractYouTubeId(videoUrl);
    if (!id) return null;
    return (
      <div className="learn-video-wrap" onContextMenu={noDownload}>
        <iframe
          src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`}
          title="Video clase" allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
      </div>
    );
  }
  if (videoType === 'vimeo') {
    const id = extractVimeoId(videoUrl);
    if (!id) return null;
    return (
      <div className="learn-video-wrap" onContextMenu={noDownload}>
        <iframe
          src={`https://player.vimeo.com/video/${id}?badge=0&byline=0&portrait=0&title=0&sidedock=0&dnt=1`}
          title="Video clase" allowFullScreen
        />
      </div>
    );
  }
  // 'url' | 'upload'
  return (
    <div className="learn-video-wrap" onContextMenu={noDownload}>
      <video
        src={videoUrl} controls
        controlsList="nodownload nofullscreen"
        disablePictureInPicture
        onContextMenu={noDownload}
        className="learn-native-video"
      />
    </div>
  );
}

function TextContent({ content }) {
  if (!content?.trim()) return null;
  const paragraphs = content.split(/\n\n+/).filter(Boolean);
  return (
    <div className="learn-section">
      <h3 className="learn-section-title">
        <AlignLeft size={14} style={{ display: 'inline', marginRight: 6 }} />
        Contenido de la clase
      </h3>
      <div className="learn-text-content">
        {paragraphs.map((p, i) => (
          <p key={i}>{p.split('\n').map((line, j) => (
            <span key={j}>{line}{j < p.split('\n').length - 1 && <br />}</span>
          ))}</p>
        ))}
      </div>
    </div>
  );
}

// Foro de preguntas de la clase: público entre todos los inscriptos al
// curso (no solo entre el alumno y el instructor), pregunta y respuesta.
function QuestionRow({ q, currentUser, onDeleteQuestion, onSubmitAnswer, onDeleteAnswer }) {
  const [replying, setReplying] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [sending, setSending] = useState(false);

  const canDelete = (authorId) => currentUser && (currentUser.id === authorId || currentUser.role === 'admin' || currentUser.role === 'instructor');

  const submitAnswer = async () => {
    if (!answerText.trim()) return;
    setSending(true);
    const ok = await onSubmitAnswer(q.id, answerText.trim());
    setSending(false);
    if (ok) { setAnswerText(''); setReplying(false); }
  };

  return (
    <div className="learn-question">
      <div className="learn-question-head">
        <div className="learn-question-avatar">
          {q.user?.avatar ? <img src={q.user.avatar} alt={q.user.name} /> : <UserIcon size={13} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="learn-question-name">
            {q.user?.name ?? 'Alumno'}
            {(q.user?.role === 'ADMIN' || q.user?.role === 'INSTRUCTOR') && <span className="learn-question-staff">Staff</span>}
          </div>
          <p className="learn-question-body">{q.body}</p>
        </div>
        {canDelete(q.userId) && (
          <button className="learn-question-del" onClick={() => onDeleteQuestion(q.id)} title="Eliminar pregunta">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {q.answers?.length > 0 && (
        <div className="learn-answers">
          {q.answers.map(a => (
            <div key={a.id} className="learn-answer">
              <div className="learn-question-avatar learn-answer-avatar">
                {a.user?.avatar ? <img src={a.user.avatar} alt={a.user.name} /> : <UserIcon size={11} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="learn-question-name">
                  {a.user?.name ?? 'Alumno'}
                  {(a.user?.role === 'ADMIN' || a.user?.role === 'INSTRUCTOR') && <span className="learn-question-staff">Staff</span>}
                </div>
                <p className="learn-question-body">{a.body}</p>
              </div>
              {canDelete(a.userId) && (
                <button className="learn-question-del" onClick={() => onDeleteAnswer(q.id, a.id)} title="Eliminar respuesta">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {replying ? (
        <div className="learn-answer-form">
          <input
            className="input" placeholder="Escribí una respuesta..."
            value={answerText} onChange={e => setAnswerText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitAnswer()}
            autoFocus
          />
          <button className="btn btn-primary btn-sm" onClick={submitAnswer} disabled={sending || !answerText.trim()}>
            {sending ? <div className="spinner" /> : <Send size={13} />}
          </button>
        </div>
      ) : (
        <button className="learn-reply-btn" onClick={() => setReplying(true)}>Responder</button>
      )}
    </div>
  );
}

function LessonQuestions({ lessonId, user, showToast }) {
  const [questions, setQuestions] = useState(null); // null = cargando
  const [newQuestion, setNewQuestion] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setQuestions(null);
    setNewQuestion('');
    if (!lessonId) return;
    questionsApi.list(lessonId)
      .then(res => setQuestions(res.questions ?? []))
      .catch(() => setQuestions([]));
  }, [lessonId]);

  const submitQuestion = async () => {
    if (!newQuestion.trim()) return;
    setPosting(true);
    try {
      const res = await questionsApi.create(lessonId, newQuestion.trim());
      setQuestions(prev => [...(prev ?? []), res.question]);
      setNewQuestion('');
    } catch (err) {
      showToast(err.message || 'No se pudo publicar la pregunta', 'error');
    } finally {
      setPosting(false);
    }
  };

  const submitAnswer = async (questionId, body) => {
    try {
      const res = await questionsApi.answer(questionId, body);
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, answers: [...(q.answers ?? []), res.answer] } : q));
      return true;
    } catch (err) {
      showToast(err.message || 'No se pudo publicar la respuesta', 'error');
      return false;
    }
  };

  const deleteQuestion = async (questionId) => {
    try {
      await questionsApi.remove(questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch (err) {
      showToast(err.message || 'No se pudo eliminar', 'error');
    }
  };

  const deleteAnswer = async (questionId, answerId) => {
    try {
      await questionsApi.removeAnswer(answerId);
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, answers: q.answers.filter(a => a.id !== answerId) } : q));
    } catch (err) {
      showToast(err.message || 'No se pudo eliminar', 'error');
    }
  };

  return (
    <div className="learn-section">
      <h3 className="learn-section-title">
        <MessageCircle size={14} style={{ display: 'inline', marginRight: 6 }} />
        Preguntas de la clase
      </h3>
      <p className="learn-questions-hint">Visible para todos los inscriptos en el curso.</p>

      <div className="learn-answer-form" style={{ marginBottom: 18 }}>
        <input
          className="input" placeholder="Escribí tu pregunta sobre esta clase..."
          value={newQuestion} onChange={e => setNewQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submitQuestion()}
        />
        <button className="btn btn-primary btn-sm" onClick={submitQuestion} disabled={posting || !newQuestion.trim()}>
          {posting ? <div className="spinner" /> : <Send size={13} />}
        </button>
      </div>

      {questions === null ? (
        <p className="learn-questions-hint">Cargando...</p>
      ) : questions.length === 0 ? (
        <p className="learn-questions-hint">Todavía no hay preguntas en esta clase. ¡Sé el primero!</p>
      ) : (
        <div className="learn-questions-list">
          {questions.map(q => (
            <QuestionRow
              key={q.id} q={q} currentUser={user}
              onDeleteQuestion={deleteQuestion}
              onSubmitAnswer={submitAnswer}
              onDeleteAnswer={deleteAnswer}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Learn() {
  const { id } = useParams();
  const { user, showToast, refreshEnrollments } = useApp();

  const [course, setCourse]     = useState(null);
  const [modules, setModules]   = useState([]);
  const [unlocked, setUnlocked] = useState(false);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [loading, setLoading]   = useState(true);
  const [marking, setMarking]   = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      coursesApi.get(id),
      modulesApi.list(id),
      progressApi.getCourse(id).catch(() => ({ completedLessonIds: [] })),
    ])
      .then(([courseRes, modulesRes, progressRes]) => {
        if (cancelled) return;
        setCourse(courseRes.course);
        setModules(modulesRes.modules);
        setUnlocked(!!modulesRes.unlocked);
        setCompletedIds(new Set(progressRes.completedLessonIds ?? []));

        const firstLesson = modulesRes.modules?.[0]?.lessons?.[0];
        if (firstLesson) setActiveLessonId(firstLesson.id);
      })
      .catch(() => { if (!cancelled) showToast('No se pudo cargar el curso', 'error'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id, user]);

  const flatLessons = useMemo(
    () => modules.flatMap(m => m.lessons.map(l => ({ ...l, moduleTitle: m.title }))),
    [modules],
  );
  const activeLesson = flatLessons.find(l => l.id === activeLessonId);
  const activeIndex  = flatLessons.findIndex(l => l.id === activeLessonId);

  const totalLessons     = flatLessons.length;
  const completedCount   = flatLessons.filter(l => completedIds.has(l.id)).length;
  const progressPercent  = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;

  if (!user) return <Navigate to="/" replace />;

  // El backend ya enmascara el contenido si el usuario no pagó, pero además
  // lo sacamos directamente del visor y lo mandamos a comprar el curso.
  if (!loading && !unlocked) {
    showToast('Necesitás inscribirte en el curso para ver las clases', 'info');
    return <Navigate to={`/cursos/${id}`} replace />;
  }

  const toggleModule = (modId) => setCollapsed(c => ({ ...c, [modId]: !c[modId] }));

  const goToLesson = (lessonId) => {
    setActiveLessonId(lessonId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleComplete = async () => {
    if (!activeLesson || marking) return;
    setMarking(true);
    const isDone = completedIds.has(activeLesson.id);
    try {
      if (isDone) {
        await progressApi.uncompleteLesson(activeLesson.id);
        setCompletedIds(prev => { const s = new Set(prev); s.delete(activeLesson.id); return s; });
      } else {
        await progressApi.completeLesson(activeLesson.id);
        setCompletedIds(prev => new Set(prev).add(activeLesson.id));
      }
      refreshEnrollments();
    } catch {
      showToast('No se pudo actualizar el progreso', 'error');
    } finally {
      setMarking(false);
    }
  };

  const goNext = () => {
    const next = flatLessons[activeIndex + 1];
    if (next) goToLesson(next.id);
  };
  const goPrev = () => {
    const prev = flatLessons[activeIndex - 1];
    if (prev) goToLesson(prev.id);
  };

  if (loading) {
    return (
      <div className="learn-loading">
        <div className="spinner" />
      </div>
    );
  }

  const hasVideo = activeLesson && (activeLesson.contentType === 'video' || activeLesson.contentType === 'both' || !activeLesson.contentType);
  const hasText  = activeLesson?.content?.trim() && (activeLesson.contentType === 'text' || activeLesson.contentType === 'both');

  return (
    <div className="learn-page">
      <div className="learn-topbar">
        <Link to={`/cursos/${id}`} className="back-link">
          <ArrowLeft size={14} /> Volver al curso
        </Link>
        <div className="learn-topbar-title">{course?.title}</div>
        <div className="learn-progress-pill">{progressPercent}% completado</div>
      </div>

      <div className="learn-layout">
        <aside className="learn-sidebar">
          <div className="learn-sidebar-progress">
            <div className="learn-progress-track">
              <div className="learn-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <span>{completedCount}/{totalLessons} clases completadas</span>
          </div>

          {modules.map(mod => (
            <div key={mod.id} className="learn-module">
              <button className="learn-module-header" onClick={() => toggleModule(mod.id)}>
                <span>{mod.title}</span>
                <ChevronDown size={14} className={collapsed[mod.id] ? 'rot' : ''} />
              </button>
              {!collapsed[mod.id] && (
                <ul className="learn-lesson-list">
                  {mod.lessons.map(l => {
                    const done = completedIds.has(l.id);
                    const active = l.id === activeLessonId;
                    const isLocked = !unlocked && !l.isPreview;
                    return (
                      <li key={l.id}>
                        <button
                          className={`learn-lesson-item ${active ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                          onClick={() => !isLocked && goToLesson(l.id)}
                          disabled={isLocked}
                        >
                          {isLocked ? <Lock size={14} /> : done ? <CheckCircle size={14} className="done-icon" /> : <Circle size={14} />}
                          <span>{l.title}</span>
                          {l.duration && <span className="learn-lesson-duration">{l.duration}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </aside>

        <main className="learn-main">
          {!activeLesson ? (
            <div className="learn-empty">Este curso todavía no tiene clases cargadas.</div>
          ) : (
            <>
              <h1 className="learn-lesson-title">{activeLesson.title}</h1>
              {activeLesson.moduleTitle && <p className="learn-lesson-module">{activeLesson.moduleTitle}</p>}

              {hasVideo && <VideoPlayer videoType={activeLesson.videoType} videoUrl={activeLesson.videoUrl} />}
              {hasText && <TextContent content={activeLesson.content} />}
              {!hasVideo && !hasText && (
                <div className="learn-no-video">
                  <Play size={36} />
                  <span>Sin contenido configurado</span>
                </div>
              )}

              {activeLesson.description && (
                <div className="learn-section">
                  <h3 className="learn-section-title">Descripción</h3>
                  <p className="learn-desc">{activeLesson.description}</p>
                </div>
              )}

              {activeLesson.resources?.length > 0 && (
                <div className="learn-section">
                  <h3 className="learn-section-title">Recursos descargables</h3>
                  <ul className="learn-resources">
                    {activeLesson.resources.map(r => {
                      const Icon = TYPE_ICONS[r.type] || File;
                      return (
                        <li key={r.id} className="learn-resource-item">
                          <Icon size={15} />
                          <span className="learn-resource-name">{r.name}</span>
                          <span className="learn-resource-size">{r.size}</span>
                          {r.url && (
                            <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                              Descargar
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <LessonQuestions lessonId={activeLesson.id} user={user} showToast={showToast} />

              <div className="learn-footer">
                <button className="btn btn-outline" onClick={goPrev} disabled={activeIndex <= 0}>
                  Anterior
                </button>
                <button
                  className={`btn ${completedIds.has(activeLesson.id) ? 'btn-outline' : 'btn-primary'}`}
                  onClick={handleToggleComplete}
                  disabled={marking}
                >
                  <CheckCircle size={15} />
                  {completedIds.has(activeLesson.id) ? 'Marcada como completada' : 'Marcar como completada'}
                </button>
                <button className="btn btn-outline" onClick={goNext} disabled={activeIndex >= flatLessons.length - 1}>
                  Siguiente
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
