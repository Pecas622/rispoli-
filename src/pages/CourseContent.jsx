import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, PlusCircle, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { courses as allCourses } from '../data/courses';
import CourseStats from '../components/CourseStats';
import ModuleCard from '../components/ModuleCard';
import ModuleModal from '../components/ModuleModal';
import LessonModal from '../components/LessonModal';
import LessonPreview from '../components/LessonPreview';
import './CourseContent.css';

export default function CourseContent() {
  const { id } = useParams();
  const {
    user,
    getCourseContent,
    addModule, updateModule, deleteModule, reorderModules,
    addLesson, updateLesson, deleteLesson, reorderLessons,
  } = useApp();

  if (!user)              return <Navigate to="/" />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" />;

  const course  = allCourses.find(c => c.id === parseInt(id));
  const content = getCourseContent(id);
  const modules = content.modules;

  const [moduleModal,   setModuleModal]   = useState(null); // null | 'new' | moduleObj
  const [lessonModal,   setLessonModal]   = useState(null); // null | { moduleId, lesson? }
  const [previewLesson, setPreviewLesson] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // null | { type, moduleId, lessonId? }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0);

  const totalSeconds = modules.reduce((a, m) =>
    a + m.lessons.reduce((b, l) => {
      if (!l.duration) return b;
      const [min = 0, sec = 0] = l.duration.split(':').map(Number);
      return b + min * 60 + sec;
    }, 0), 0);

  const totalResources = modules.reduce((a, m) =>
    a + m.lessons.reduce((b, l) => b + (l.resources?.length || 0), 0), 0);

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);

  const stats = [
    { label: 'Módulos',        value: modules.length,           icon: 'Layers'    },
    { label: 'Clases',         value: totalLessons,             icon: 'Play'      },
    { label: 'Horas totales',  value: `${h}h ${m}m`,           icon: 'Clock'     },
    { label: 'Recursos',       value: totalResources,           icon: 'Paperclip' },
  ];

  // ── Module actions ─────────────────────────────────────────────────────────
  const saveModule = (data) => {
    if (moduleModal && moduleModal !== 'new') {
      updateModule(id, moduleModal.id, data);
    } else {
      addModule(id, data);
    }
    setModuleModal(null);
  };

  const moveModule = (index, dir) => {
    const arr = [...modules];
    const swap = index + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[index], arr[swap]] = [arr[swap], arr[index]];
    reorderModules(id, arr.map((mod, i) => ({ ...mod, order: i + 1 })));
  };

  // ── Lesson actions ─────────────────────────────────────────────────────────
  const saveLesson = (data) => {
    const { moduleId, lesson } = lessonModal;
    if (lesson) {
      updateLesson(id, moduleId, lesson.id, data);
    } else {
      addLesson(id, moduleId, data);
    }
    setLessonModal(null);
  };

  const moveLesson = (moduleId, index, dir) => {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;
    const arr = [...mod.lessons];
    const swap = index + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[index], arr[swap]] = [arr[swap], arr[index]];
    reorderLessons(id, moduleId, arr.map((l, i) => ({ ...l, order: i + 1 })));
  };

  // ── Delete confirm ─────────────────────────────────────────────────────────
  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'module') {
      deleteModule(id, deleteConfirm.moduleId);
    } else {
      deleteLesson(id, deleteConfirm.moduleId, deleteConfirm.lessonId);
    }
    setDeleteConfirm(null);
  };

  if (!course) return (
    <div className="container" style={{ padding: '120px 24px', textAlign: 'center' }}>
      <p style={{ marginBottom: 20, color: 'var(--text-2)' }}>Curso no encontrado.</p>
      <Link to="/admin" className="btn btn-primary">Volver al panel</Link>
    </div>
  );

  return (
    <div className="course-content-page">
      <div className="container">

        {/* Header */}
        <div className="cc-header">
          <Link to="/admin" className="cc-back-link">
            <ArrowLeft size={15} /> Volver al panel
          </Link>
          <div className="cc-title-block">
            <span className="label">Administrar contenido</span>
            <h1 className="cc-page-title">{course.title}</h1>
          </div>
        </div>

        {/* Stats */}
        <CourseStats stats={stats} />

        {/* Modules */}
        <div className="cc-modules-section">
          <div className="cc-section-header">
            <h2 className="cc-section-title">Módulos del curso</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setModuleModal('new')}>
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

      {/* Module modal */}
      {moduleModal && (
        <ModuleModal
          module={moduleModal === 'new' ? null : moduleModal}
          nextOrder={modules.length + 1}
          onSave={saveModule}
          onClose={() => setModuleModal(null)}
        />
      )}

      {/* Lesson modal */}
      {lessonModal && (
        <LessonModal
          lesson={lessonModal.lesson}
          nextOrder={(modules.find(m => m.id === lessonModal.moduleId)?.lessons.length ?? 0) + 1}
          onSave={saveLesson}
          onClose={() => setLessonModal(null)}
        />
      )}

      {/* Lesson preview */}
      {previewLesson && (
        <LessonPreview lesson={previewLesson} onClose={() => setPreviewLesson(null)} />
      )}

      {/* Delete confirm */}
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
              <button
                className="btn btn-outline"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setDeleteConfirm(null)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', background: 'var(--red)', borderColor: 'var(--red)' }}
                onClick={confirmDelete}
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
