import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, PlusCircle, BookOpen, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { coursesApi, modulesApi, lessonsApi } from '../services/api';
import { courses as mockCourses } from '../data/courses';
import CourseStats from '../components/CourseStats';
import ModuleCard from '../components/ModuleCard';
import ModuleModal from '../components/ModuleModal';
import LessonModal from '../components/LessonModal';
import LessonPreview from '../components/LessonPreview';
import './CourseContent.css';

const USE_API = import.meta.env.VITE_USE_API === 'true';

export default function CourseContent() {
  const { id } = useParams();
  const { user, showToast } = useApp();

  const [course,  setCourse]  = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const [moduleModal,   setModuleModal]   = useState(null);
  const [lessonModal,   setLessonModal]   = useState(null);
  const [previewLesson, setPreviewLesson] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const isInstructor = user?.role === 'instructor';
  const isAdmin      = user?.role === 'admin';

  if (!user || (!isAdmin && !isInstructor)) return <Navigate to="/dashboard" />;

  // ── Carga inicial ──────────────────────────────────────────────────────────
  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      if (USE_API) {
        const [courseRes, modulesRes] = await Promise.all([
          coursesApi.get(id),
          modulesApi.list(id),
        ]);
        setCourse(courseRes.course);
        setModules(modulesRes.modules);
      } else {
        const found = mockCourses.find(c => String(c.id) === String(id));
        setCourse(found ?? null);
        setModules([]);
      }
    } catch (err) {
      showToast('Error al cargar el contenido', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadContent(); }, [loadContent]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalLessons   = modules.reduce((a, m) => a + m.lessons.length, 0);
  const totalResources = modules.reduce((a, m) =>
    a + m.lessons.reduce((b, l) => b + (l.resources?.length || 0), 0), 0);
  const totalSeconds   = modules.reduce((a, m) =>
    a + m.lessons.reduce((b, l) => {
      const [min = 0, sec = 0] = (l.duration ?? '').split(':').map(Number);
      return b + min * 60 + sec;
    }, 0), 0);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);

  const stats = [
    { label: 'Módulos',       value: modules.length, icon: 'Layers'    },
    { label: 'Clases',        value: totalLessons,   icon: 'Play'      },
    { label: 'Horas totales', value: `${h}h ${m}m`,  icon: 'Clock'     },
    { label: 'Recursos',      value: totalResources, icon: 'Paperclip' },
  ];

  // ── Módulos ────────────────────────────────────────────────────────────────
  const saveModule = async (data) => {
    setSaving(true);
    try {
      if (USE_API) {
        if (moduleModal && moduleModal !== 'new') {
          const res = await modulesApi.update(moduleModal.id, data);
          setModules(prev => prev.map(m => m.id === moduleModal.id ? { ...m, ...res.module } : m));
          showToast('Módulo actualizado');
        } else {
          const res = await modulesApi.create(id, { ...data, order: modules.length + 1 });
          setModules(prev => [...prev, { ...res.module, lessons: [] }]);
          showToast('Módulo creado');
        }
      } else {
        // mock fallback
        if (moduleModal && moduleModal !== 'new') {
          setModules(prev => prev.map(m => m.id === moduleModal.id ? { ...m, ...data } : m));
        } else {
          setModules(prev => [...prev, { id: `mod_${Date.now()}`, ...data, lessons: [] }]);
        }
        showToast(moduleModal && moduleModal !== 'new' ? 'Módulo actualizado' : 'Módulo creado');
      }
    } catch (err) {
      showToast(err.message || 'Error al guardar el módulo', 'error');
    } finally {
      setSaving(false);
      setModuleModal(null);
    }
  };

  const moveModule = async (index, dir) => {
    const arr  = [...modules];
    const swap = index + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[index], arr[swap]] = [arr[swap], arr[index]];
    const reordered = arr.map((mod, i) => ({ ...mod, order: i + 1 }));
    setModules(reordered);
    if (USE_API) {
      try {
        await modulesApi.reorder(id, reordered.map(m => ({ id: m.id, order: m.order })));
      } catch {
        showToast('Error al reordenar', 'error');
        setModules(modules); // revert
      }
    }
  };

  const confirmDeleteModule = async (moduleId) => {
    if (USE_API) {
      try {
        await modulesApi.remove(moduleId);
        setModules(prev => prev.filter(m => m.id !== moduleId));
        showToast('Módulo eliminado', 'info');
      } catch (err) {
        showToast(err.message || 'Error al eliminar', 'error');
      }
    } else {
      setModules(prev => prev.filter(m => m.id !== moduleId));
      showToast('Módulo eliminado', 'info');
    }
    setDeleteConfirm(null);
  };

  // ── Lecciones ──────────────────────────────────────────────────────────────
  const saveLesson = async (data) => {
    const { moduleId, lesson } = lessonModal;
    setSaving(true);
    try {
      if (USE_API) {
        if (lesson) {
          const res = await lessonsApi.update(lesson.id, data);
          setModules(prev => prev.map(m =>
            m.id === moduleId
              ? { ...m, lessons: m.lessons.map(l => l.id === lesson.id ? res.lesson : l) }
              : m
          ));
          showToast('Clase actualizada');
        } else {
          const mod = modules.find(m => m.id === moduleId);
          const res = await lessonsApi.create(moduleId, { ...data, order: (mod?.lessons.length ?? 0) + 1 });
          setModules(prev => prev.map(m =>
            m.id === moduleId ? { ...m, lessons: [...m.lessons, res.lesson] } : m
          ));
          showToast('Clase creada');
        }
      } else {
        if (lesson) {
          setModules(prev => prev.map(m =>
            m.id === moduleId
              ? { ...m, lessons: m.lessons.map(l => l.id === lesson.id ? { ...l, ...data } : l) }
              : m
          ));
        } else {
          setModules(prev => prev.map(m =>
            m.id === moduleId
              ? { ...m, lessons: [...m.lessons, { id: `les_${Date.now()}`, ...data }] }
              : m
          ));
        }
        showToast(lesson ? 'Clase actualizada' : 'Clase creada');
      }
    } catch (err) {
      showToast(err.message || 'Error al guardar la clase', 'error');
    } finally {
      setSaving(false);
      setLessonModal(null);
    }
  };

  const moveLesson = async (moduleId, index, dir) => {
    const mod  = modules.find(m => m.id === moduleId);
    if (!mod) return;
    const arr  = [...mod.lessons];
    const swap = index + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[index], arr[swap]] = [arr[swap], arr[index]];
    const reordered = arr.map((l, i) => ({ ...l, order: i + 1 }));
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, lessons: reordered } : m));
    if (USE_API) {
      try {
        await lessonsApi.reorder(moduleId, reordered.map(l => ({ id: l.id, order: l.order })));
      } catch {
        setModules(prev => prev.map(m => m.id === moduleId ? { ...m, lessons: mod.lessons } : m));
      }
    }
  };

  const confirmDeleteLesson = async (moduleId, lessonId) => {
    if (USE_API) {
      try {
        await lessonsApi.remove(lessonId);
        setModules(prev => prev.map(m =>
          m.id === moduleId ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m
        ));
        showToast('Clase eliminada', 'info');
      } catch (err) {
        showToast(err.message || 'Error al eliminar', 'error');
      }
    } else {
      setModules(prev => prev.map(m =>
        m.id === moduleId ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m
      ));
      showToast('Clase eliminada', 'info');
    }
    setDeleteConfirm(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'module') {
      confirmDeleteModule(deleteConfirm.moduleId);
    } else {
      confirmDeleteLesson(deleteConfirm.moduleId, deleteConfirm.lessonId);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="course-content-page">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
          <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--violet)' }} />
        </div>
      </div>
    );
  }

  if (!course) return (
    <div className="container" style={{ padding: '120px 24px', textAlign: 'center' }}>
      <p style={{ marginBottom: 20, color: 'var(--text-2)' }}>Curso no encontrado.</p>
      <Link to="/admin" className="btn btn-primary">Volver al panel</Link>
    </div>
  );

  const backLink = isInstructor ? '/instructor' : '/admin';

  return (
    <div className="course-content-page">
      <div className="container">

        <div className="cc-header">
          <Link to={backLink} className="cc-back-link">
            <ArrowLeft size={15} /> Volver al panel
          </Link>
          <div className="cc-title-block">
            <span className="label">
              {isInstructor ? 'Gestionar contenido' : 'Administrar contenido'}
            </span>
            <h1 className="cc-page-title">{course.title}</h1>
          </div>
        </div>

        <CourseStats stats={stats} />

        <div className="cc-modules-section">
          <div className="cc-section-header">
            <h2 className="cc-section-title">Módulos del curso</h2>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setModuleModal('new')}
              disabled={saving}
            >
              <PlusCircle size={15} /> Agregar módulo
            </button>
          </div>

          {modules.length === 0 ? (
            <div className="cc-empty">
              <BookOpen size={48} />
              <h3>Sin módulos</h3>
              <p>Comenzá creando el primer módulo del curso.</p>
              <button className="btn btn-primary" onClick={() => setModuleModal('new')}>
                <PlusCircle size={15} /> Agregar módulo
              </button>
            </div>
          ) : (
            <div className="cc-modules-list">
              {modules.map((mod, i) => (
                <ModuleCard
                  key={mod.id}
                  module={mod}
                  index={i}
                  totalModules={modules.length}
                  onEdit={() => setModuleModal(mod)}
                  onDelete={() => setDeleteConfirm({ type: 'module', moduleId: mod.id })}
                  onMoveUp={() => moveModule(i, -1)}
                  onMoveDown={() => moveModule(i, 1)}
                  onAddLesson={moduleId => setLessonModal({ moduleId, lesson: null })}
                  onEditLesson={(moduleId, lesson) => setLessonModal({ moduleId, lesson })}
                  onDeleteLesson={(moduleId, lessonId) =>
                    setDeleteConfirm({ type: 'lesson', moduleId, lessonId })}
                  onMoveLesson={moveLesson}
                  onPreviewLesson={setPreviewLesson}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {moduleModal && (
        <ModuleModal
          module={moduleModal === 'new' ? null : moduleModal}
          nextOrder={modules.length + 1}
          onSave={saveModule}
          onClose={() => setModuleModal(null)}
        />
      )}

      {lessonModal && (
        <LessonModal
          lesson={lessonModal.lesson}
          nextOrder={(modules.find(m => m.id === lessonModal.moduleId)?.lessons.length ?? 0) + 1}
          onSave={saveLesson}
          onClose={() => setLessonModal(null)}
        />
      )}

      {previewLesson && (
        <LessonPreview lesson={previewLesson} onClose={() => setPreviewLesson(null)} />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <p className="modal-title">
              ¿Eliminar {deleteConfirm.type === 'module' ? 'módulo' : 'clase'}?
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>
              {deleteConfirm.type === 'module'
                ? 'Se eliminarán el módulo y todas sus clases. Esta acción no se puede deshacer.'
                : 'Esta acción no se puede deshacer.'}
            </p>
            <div className="form-actions">
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', background: 'var(--red)', borderColor: 'var(--red)' }}
                onClick={handleDeleteConfirm}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
