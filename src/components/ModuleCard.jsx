import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit2, Trash2, PlusCircle } from 'lucide-react';
import LessonCard from './LessonCard';

export default function ModuleCard({
  module, index, totalModules,
  onEdit, onDelete, onMoveUp, onMoveDown,
  onAddLesson, onEditLesson, onDeleteLesson, onMoveLesson, onPreviewLesson,
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="module-card">
      <div className="module-card-header" onClick={() => setExpanded(e => !e)}>
        <div className="module-header-left">
          <span className="module-chevron">
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </span>
          <span className="module-badge">Módulo {module.order}</span>
          <div className="module-text">
            <span className="module-title">{module.title}</span>
            {module.description && <span className="module-desc">{module.description}</span>}
          </div>
        </div>

        <div className="module-header-right" onClick={e => e.stopPropagation()}>
          <span className="module-count">
            {module.lessons.length} clase{module.lessons.length !== 1 ? 's' : ''}
          </span>
          <div className="module-order-btns">
            <button className="order-btn" onClick={onMoveUp} disabled={index === 0} title="Subir módulo">↑</button>
            <button className="order-btn" onClick={onMoveDown} disabled={index === totalModules - 1} title="Bajar módulo">↓</button>
          </div>
          <button className="action-btn" onClick={onEdit} title="Editar módulo"><Edit2 size={13} /></button>
          <button className="action-btn del" onClick={onDelete} title="Eliminar módulo"><Trash2 size={13} /></button>
        </div>
      </div>

      {expanded && (
        <div className="module-card-body">
          {module.lessons.length === 0 ? (
            <p className="module-empty">Sin clases. Agregá la primera.</p>
          ) : (
            module.lessons.map((lesson, li) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                index={li}
                totalLessons={module.lessons.length}
                onEdit={() => onEditLesson(module.id, lesson)}
                onDelete={() => onDeleteLesson(module.id, lesson.id)}
                onMoveUp={() => onMoveLesson(module.id, li, -1)}
                onMoveDown={() => onMoveLesson(module.id, li, 1)}
                onPreview={() => onPreviewLesson(lesson)}
              />
            ))
          )}
          <button className="btn btn-ghost btn-sm cc-add-lesson-btn" onClick={() => onAddLesson(module.id)}>
            <PlusCircle size={14} /> Agregar clase
          </button>
        </div>
      )}
    </div>
  );
}
