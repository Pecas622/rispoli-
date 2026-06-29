import { X, Download, CheckCircle, Play, FileText, Archive, Image, Code, File } from 'lucide-react';

const TYPE_ICONS = { pdf: FileText, zip: Archive, image: Image, code: Code };

function VideoEmbed({ video }) {
  if (!video || video.type === 'none' || !video.url) {
    return (
      <div className="lp-no-video">
        <Play size={36} />
        <span>Sin video configurado</span>
      </div>
    );
  }

  if (video.type === 'youtube') {
    const id = video.url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1];
    if (id) return (
      <div className="lp-video-wrap">
        <iframe src={`https://www.youtube.com/embed/${id}`} title="Video" allowFullScreen />
      </div>
    );
  }

  if (video.type === 'vimeo') {
    const id = video.url.match(/vimeo\.com\/(\d+)/)?.[1];
    if (id) return (
      <div className="lp-video-wrap">
        <iframe src={`https://player.vimeo.com/video/${id}`} title="Video" allowFullScreen />
      </div>
    );
  }

  return (
    <div className="lp-no-video">
      <Play size={36} />
      <span>{video.url || 'URL no configurada'}</span>
    </div>
  );
}

export default function LessonPreview({ lesson, onClose }) {
  return (
    <div className="modal-overlay lp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal lp-modal">
        <div className="lp-header">
          <div>
            <p className="label" style={{ marginBottom: 4 }}>Vista previa del alumno</p>
            <h2 className="lp-title">{lesson.title}</h2>
          </div>
          <button className="modal-close-btn" style={{ position: 'static', flexShrink: 0 }} onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <VideoEmbed video={lesson.video} />

        {lesson.description && (
          <div className="lp-section">
            <h3 className="lp-section-title">Descripción</h3>
            <p className="lp-desc">{lesson.description}</p>
          </div>
        )}

        {lesson.resources?.length > 0 && (
          <div className="lp-section">
            <h3 className="lp-section-title">Recursos descargables</h3>
            <ul className="lp-resources">
              {lesson.resources.map(r => {
                const Icon = TYPE_ICONS[r.type] || File;
                return (
                  <li key={r.id} className="lp-resource-item">
                    <Icon size={15} className="lp-resource-icon" />
                    <span className="lp-resource-name">{r.name}</span>
                    <span className="lp-resource-size">{r.size}</span>
                    <button className="btn btn-outline btn-sm">
                      <Download size={12} /> Descargar
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="lp-footer">
          <button className="btn btn-primary lp-complete-btn">
            <CheckCircle size={15} /> Marcar como completada
          </button>
        </div>
      </div>
    </div>
  );
}
