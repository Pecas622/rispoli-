import { useState } from 'react';
import { CirclePlay, Video, Upload, Ban, Link2, ShieldOff } from 'lucide-react';

function extractYouTubeId(url) {
  const m = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
  return m ? m[1] : '';
}

function extractVimeoId(url) {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : '';
}

function fmtSize(bytes) {
  if (!bytes) return '';
  return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

const TYPES = [
  { key: 'youtube', label: 'YouTube',       Icon: CirclePlay },
  { key: 'vimeo',   label: 'Vimeo',         Icon: Video      },
  { key: 'url',     label: 'URL directa',   Icon: Link2      },
  { key: 'upload',  label: 'Subir archivo', Icon: Upload     },
  { key: 'none',    label: 'Sin video',     Icon: Ban        },
];

export default function VideoSelector({ value, onChange }) {
  const [localFile, setLocalFile] = useState(null);
  const [localUrl,  setLocalUrl]  = useState('');

  const setType = (type) => {
    setLocalFile(null);
    setLocalUrl('');
    onChange({ type, url: '' });
  };
  const setUrl = (url) => onChange({ ...value, url });

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const blobUrl = URL.createObjectURL(f);
    setLocalFile(f);
    setLocalUrl(blobUrl);
    onChange({ ...value, url: f.name, _blobUrl: blobUrl });
  };

  const removeFile = () => {
    if (localUrl) URL.revokeObjectURL(localUrl);
    setLocalFile(null);
    setLocalUrl('');
    onChange({ ...value, url: '', _blobUrl: undefined });
  };

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
                src={`https://player.vimeo.com/video/${extractVimeoId(value.url)}?badge=0&byline=0&portrait=0&title=0`}
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

      {/* ── Subir archivo ── */}
      {value.type === 'upload' && (
        <div className="vs-input-wrap">
          {localFile ? (
            <div className="vs-uploaded">
              <div className="vs-preview" onContextMenu={e => e.preventDefault()}>
                <video
                  src={localUrl}
                  controls
                  controlsList="nodownload"
                  disablePictureInPicture
                  onContextMenu={e => e.preventDefault()}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              <div className="vs-file-info">
                <span className="vs-file-chosen">{localFile.name}</span>
                <span className="vs-file-size">{fmtSize(localFile.size)}</span>
                <button type="button" className="btn btn-outline btn-sm" onClick={removeFile}>
                  Cambiar video
                </button>
              </div>
            </div>
          ) : (
            <label className="vs-upload-zone">
              <Upload size={28} className="vs-upload-icon" />
              <p className="vs-upload-hint">Hacé click o arrastrá un archivo de video</p>
              <p className="vs-upload-formats">MP4, MOV, AVI, MKV · máx. 2 GB</p>
              <input
                type="file"
                accept="video/*"
                className="vs-file-input"
                onChange={handleFileChange}
              />
            </label>
          )}
          <div className="vs-tip">
            <ShieldOff size={12} />
            La descarga está bloqueada en el reproductor. Para máxima protección, usá un CDN privado con firma de URLs.
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
