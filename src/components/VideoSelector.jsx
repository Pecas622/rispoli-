import { CirclePlay, Video, Ban, Link2, ShieldOff } from 'lucide-react';

function extractYouTubeId(url) {
  const m = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
  return m ? m[1] : '';
}

function extractVimeoId(url) {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : '';
}

const TYPES = [
  { key: 'youtube', label: 'YouTube',       Icon: CirclePlay },
  { key: 'vimeo',   label: 'Vimeo',         Icon: Video      },
  { key: 'url',     label: 'URL directa',   Icon: Link2      },
  { key: 'none',    label: 'Sin video',     Icon: Ban        },
];

export default function VideoSelector({ value, onChange }) {
  const setType = (type) => onChange({ type, url: '' });
  const setUrl  = (url)  => onChange({ ...value, url });

  return (
    <div className="video-selector">

      {/* Tipo selector */}
      <div className="vs-type-tabs">
        {TYPES.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            className={`vs-tab${value.type === key ? ' active' : ''}`}
            onClick={() => setType(key)}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>
      <p className="vs-url-hint">
        Subí el video como "no listado" a Vimeo o YouTube y pegá el link acá — evita depender de hosting propio para archivos pesados.
      </p>

      {/* ── YouTube ── */}
      {value.type === 'youtube' && (
        <div className="vs-input-wrap">
          <input
            className="input"
            placeholder="https://www.youtube.com/watch?v=..."
            value={value.url}
            onChange={e => setUrl(e.target.value)}
          />
          {extractYouTubeId(value.url) ? (
            <div className="vs-preview">
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeId(value.url)}?rel=0&modestbranding=1`}
                title="Vista previa YouTube"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="vs-url-hint">Pegá la URL del video de YouTube</p>
          )}
        </div>
      )}

      {/* ── Vimeo ── */}
      {value.type === 'vimeo' && (
        <div className="vs-input-wrap">
          <input
            className="input"
            placeholder="https://vimeo.com/123456789"
            value={value.url}
            onChange={e => setUrl(e.target.value)}
          />
          {extractVimeoId(value.url) ? (
            <div className="vs-preview">
              <iframe
                src={`https://player.vimeo.com/video/${extractVimeoId(value.url)}?badge=0&byline=0&portrait=0&title=0&sidedock=0`}
                title="Vista previa Vimeo"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="vs-url-hint">Pegá la URL del video de Vimeo</p>
          )}
          <div className="vs-tip">
            <ShieldOff size={12} />
            Para bloquear descargas en Vimeo, activá "Downloads: Disabled" en la configuración de privacidad del video en tu cuenta Vimeo Pro.
          </div>
        </div>
      )}

      {/* ── URL directa ── */}
      {value.type === 'url' && (
        <div className="vs-input-wrap">
          <input
            className="input"
            placeholder="https://cdn.ejemplo.com/video.mp4"
            value={value.url}
            onChange={e => setUrl(e.target.value)}
          />
          {value.url && (
            <div className="vs-preview" onContextMenu={e => e.preventDefault()}>
              <video
                src={value.url}
                controls
                controlsList="nodownload"
                disablePictureInPicture
                onContextMenu={e => e.preventDefault()}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          )}
          <div className="vs-tip">
            <ShieldOff size={12} />
            Los videos con URL directa tienen descarga bloqueada a nivel del reproductor.
          </div>
        </div>
      )}

      {/* ── Sin video ── */}
      {value.type === 'none' && (
        <div className="vs-no-video">
          <Ban size={24} />
          <p>Esta clase no tiene video.</p>
        </div>
      )}
    </div>
  );
}
