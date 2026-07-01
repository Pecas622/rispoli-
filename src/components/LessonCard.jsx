import { Edit2, Trash2, Eye, Clock, CirclePlay, Video, Upload, FileText, AlignLeft, Layers, Link2 } from 'lucide-react';

const VIDEO_LABELS = { youtube: 'YouTube', vimeo: 'Vimeo', upload: 'Archivo', url: 'URL' };
const VIDEO_ICONS  = { youtube: CirclePlay, vimeo: Video, upload: Upload, url: Link2 };

const CONTENT_TYPE_BADGE = {
  video: null,
  text:  { label: 'Texto',          bg: 'var(--teal-pale)',   color: 'var(--teal)'       },
  both:  { label: 'Video + Texto',  bg: 'var(--amber-pale)',  color: 'var(--amber)'      },
};

export default function LessonCard({
  lesson, index, totalLessons,
  onEdit, onDelete, onMoveUp, onMoveDown, onPreview,
}) {
  const VideoIcon  = VIDEO_ICONS[lesson.video?.type];
  const typeBadge  = CONTENT_TYPE_BADGE[lesson.contentType];

  return (
    <div className="lesson-card">
      <div className="lesson-card-left">
        <span className="lesson-num">{lesson.order ?? index + 1}</span>
        <div className="lesson-info">
          <div className="lesson-title">
            {lesson.title}
            {lesson.isPreview && (
              <span className="badge badge-teal" style={{ fontSize: 10, padding: '2px 7px' }}>
                Vista previa
              </span>
            )}
            {typeBadge && (
              <span className="badge" style={{ fontSize: 10, padding: '2px 7px', background: typeBadge.bg, color: typeBadge.color }}>
                {typeBadge.label}
              </span>
            )}
          </div>
          <div className="lesson-meta">
            {lesson.duration && (
              <span className="lesson-meta-item">
                <Clock size={11} /> {lesson.duration}
              </span>
            )}
            {VideoIcon && lesson.video?.type !== 'none' &&
             (lesson.contentType === 'video' || lesson.contentType === 'both' || !lesson.contentType) && (
              <span className="lesson-meta-item">
                <VideoIcon size={11} /> {VIDEO_LABELS[lesson.video.type]}
              </span>
            )}
            {lesson.content?.trim() &&
             (lesson.contentType === 'text' || lesson.contentType === 'both') && (
              <span className="lesson-meta-item">
                <AlignLeft size={11} /> Texto
              </span>
            )}
            {lesson.resources?.length > 0 && (
              <span className="lesson-meta-item">
                <FileText size={11} /> {lesson.resources.length} recurso{lesson.resources.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="lesson-card-actions">
        <button className="order-btn" onClick={onMoveUp} disabled={index === 0} title="Subir">↑</button>
        <button className="order-btn" onClick={onMoveDown} disabled={index === totalLessons - 1} title="Bajar">↓</button>
        <button className="action-btn" onClick={onPreview} title="Vista previa"><Eye size={13} /></button>
        <button className="action-btn" onClick={onEdit} title="Editar"><Edit2 size={13} /></button>
        <button className="action-btn del" onClick={onDelete} title="Eliminar"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}
