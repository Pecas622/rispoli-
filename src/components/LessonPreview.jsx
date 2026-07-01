import { X, CheckCircle, Play, FileText, Archive, Image, Code, File, AlignLeft } from 'lucide-react';

const TYPE_ICONS = { pdf: FileText, zip: Archive, image: Image, code: Code };

function extractYouTubeId(url = '') {
  return url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1] ?? '';
}
function extractVimeoId(url = '') {
  return url.match(/vimeo\.com\/(\d+)/)?.[1] ?? '';
}

function VideoPlayer({ video }) {
  if (!video || video.type === 'none' || !video.url) {
    return (
      <div className="lp-no-video">
        <Play size={36} />
        <span>Sin video configurado</span>
      </div>
    );
  }

  const noDownload = (e) => e.preventDefault();

  if (video.type === 'youtube') {
    const id = extractYouTubeId(video.url);
    if (!id) return null;
    return (
      <div className="lp-video-wrap" onContextMenu={noDownload}>
        <iframe
          src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`}
          title="Video clase"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
        <div className="lp-video-guard" />
      </div>
    );
  }

  if (video.type === 'vimeo') {
    const id = extractVimeoId(video.url);
    if (!id) return null;
    return (
      <div className="lp-video-wrap" onContextMenu={noDownload}>
        <iframe
          src={`https://player.vimeo.com/video/${id}?badge=0&byline=0&portrait=0&title=0&dnt=1`}
          title="Video clase"
          allowFullScreen
        />
        <div className="lp-video-guard" />
      </div>
    );
  }

  if (video.type === 'url' || video.type === 'upload') {
    const src = video._blobUrl || video.url;
    return (
      <div className="lp-video-wrap" onContextMenu={noDownload}>
        <video
          src={src}
          controls
          controlsList="nodownload nofullscreen"
          disablePictureInPicture
          onContextMenu={noDownload}
          className="lp-native-video"
        />
      </div>
    );
  }

  return null;
}

function TextContent({ content }) {
  if (!content?.trim()) return null;
  const paragraphs = content.split(/\n\n+/).filter(Boolean);
  return (
    <div className="lp-section">
      <h3 className="lp-section-title">
        <AlignLeft size={14} style={{ display: 'inline', marginRight: 6 }} />
        Contenido de la clase
      </h3>
      <div className="lp-text-content">
        {paragraphs.map((p, i) => (
          <p key={i}>{p.split('\n').map((line, j) => (
            <span key={j}>{line}{j < p.split('\n').length - 1 && <br />}</span>
          ))}</p>
        ))}
      </div>
    </div>
  );
}

export default function LessonPreview({ lesson, onClose }) {
  const hasVideo = lesson.video?.type !== 'none' && lesson.video?.url &&
    (lesson.contentType === 'video' || lesson.contentType === 'both' || !lesson.contentType);
  const hasText  = lesson.content?.trim() &&
    (lesson.contentType === 'text' || lesson.contentType === 'both');

  return (
    <div className="modal-overlay lp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal lp-modal">
        <div className="lp-header">
          <div>
            <p className="label" style={{ marginBottom: 4 }}>Vista previa del alumno</p>
            <h2 className="lp-title">{lesson.title}</h2>
            {lesson.duration && (
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{lesson.duration} min</p>
            )}
          </div>
          <button className="modal-close-btn" style={{ position: 'static', flexShrink: 0 }} onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {hasVideo && <VideoPlayer video={lesson.video} />}

        {hasText && <TextContent content={lesson.content} />}

        {!hasVideo && !hasText && (
          <div className="lp-no-video">
            <Play size={36} />
            <span>Sin contenido configurado</span>
          </div>
        )}

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
                      Descargar
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
