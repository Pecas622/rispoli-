import { CirclePlay, Video, Upload, Ban } from 'lucide-react';

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
  { key: 'upload',  label: 'Subir archivo', Icon: Upload     },
  { key: 'none',    label: 'Sin video',     Icon: Ban        },
];

export default function VideoSelector({ value, onChange }) {
  const setType = (type) => onChange({ type, url: '' });
  const setUrl  = (url)  => onChange({ ...value, url });

  return (
    <div className="video-selector">
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

      {value.type === 'youtube' && (
        <div className="vs-input-wrap">
          <input
            className="input"
            placeholder="https://www.youtube.com/watch?v=..."
            value={value.url}
            onChange={e => setUrl(e.target.value)}
          />
          {extractYouTubeId(value.url) && (
            <div className="vs-preview">
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeId(value.url)}`}
                title="Vista previa YouTube"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}

      {value.type === 'vimeo' && (
        <div className="vs-input-wrap">
          <input
            className="input"
            placeholder="https://vimeo.com/123456789"
            value={value.url}
            onChange={e => setUrl(e.target.value)}
          />
          {extractVimeoId(value.url) && (
            <div className="vs-preview">
              <iframe
                src={`https://player.vimeo.com/video/${extractVimeoId(value.url)}`}
                title="Vista previa Vimeo"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}

      {value.type === 'upload' && (
        <div className="vs-upload-zone">
          <Upload size={28} className="vs-upload-icon" />
          <p className="vs-upload-hint">Seleccioná un archivo de video</p>
          <p className="vs-upload-formats">MP4, MOV, AVI · máx. 2 GB</p>
          <input
            type="file"
            accept="video/*"
            className="vs-file-input"
            onChange={e => setUrl(e.target.files[0]?.name || '')}
          />
          {value.url && <p className="vs-file-chosen">{value.url}</p>}
        </div>
      )}

      {value.type === 'none' && (
        <div className="vs-no-video">
          <Ban size={24} />
          <p>Esta clase no tiene video.</p>
        </div>
      )}
    </div>
  );
}
