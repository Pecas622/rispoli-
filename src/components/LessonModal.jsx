import { useState, useEffect } from 'react';
import { X, Check, Video, AlignLeft, Layers } from 'lucide-react';
import VideoSelector from './VideoSelector';
import UploadResources from './UploadResources';

const EMPTY = {
  title: '',
  description: '',
  content: '',
  contentType: 'video',
  duration: '',
  video: { type: 'none', url: '' },
  resources: [],
  isPreview: false,
  order: 1,
};

const CONTENT_TYPES = [
  { key: 'video', label: 'Video',          Icon: Video     },
  { key: 'text',  label: 'Texto',          Icon: AlignLeft },
  { key: 'both',  label: 'Video + Texto',  Icon: Layers    },
];

const TABS = [
  { key: 'basic',     label: 'Información' },
  { key: 'video',     label: 'Video'       },
  { key: 'text',      label: 'Texto'       },
  { key: 'resources', label: 'Recursos'    },
];

export default function LessonModal({ lesson, nextOrder, onSave, onClose }) {
  const [form, setForm]     = useState(EMPTY);
  const [active, setActive] = useState('basic');

  useEffect(() => {
    setForm(lesson ? { ...EMPTY, ...lesson } : { ...EMPTY, order: nextOrder });
    setActive('basic');
  }, [lesson, nextOrder]);

  const set = k => e =>
    setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({ ...form, order: Number(form.order) || 1 });
  };

  const visibleTabs = TABS.filter(t => {
    if (t.key === 'video') return form.contentType === 'video' || form.contentType === 'both';
    if (t.key === 'text')  return form.contentType === 'text'  || form.contentType === 'both';
    return true;
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal lesson-modal">
        <button className="modal-close-btn" onClick={onClose}><X size={14} /></button>
        <p className="modal-title">{lesson ? 'Editar clase' : 'Nueva clase'}</p>

        <div className="lesson-modal-tabs">
          {visibleTabs.map(t => (
            <button
              key={t.key}
              type="button"
              className={`lm-tab${active === t.key ? ' active' : ''}`}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="lesson-modal-body">
          {/* ── Información ── */}
          {active === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-field">
                <label>Tipo de contenido</label>
                <div className="lm-type-selector">
                  {CONTENT_TYPES.map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      className={`lm-type-btn${form.contentType === key ? ' active' : ''}`}
                      onClick={() => {
                        setForm(p => ({ ...p, contentType: key }));
                        if (key === 'video') setActive('basic');
                      }}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label>Título *</label>
                <input
                  className="input"
                  placeholder="Ej: Introducción a los GDS"
                  value={form.title}
                  onChange={set('title')}
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label>Descripción breve</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Resumen corto visible en el programa del curso"
                  value={form.description}
                  onChange={set('description')}
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Duración (mm:ss)</label>
                  <input
                    className="input"
                    placeholder="Ej: 15:30"
                    value={form.duration}
                    onChange={set('duration')}
                  />
                </div>
                <div className="form-field">
                  <label>Orden</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={form.order}
                    onChange={set('order')}
                  />
                </div>
              </div>

              <label className="lm-check-label">
                <input
                  type="checkbox"
                  checked={form.isPreview}
                  onChange={set('isPreview')}
                />
                <span>Vista previa gratuita (visible sin inscripción)</span>
              </label>
            </div>
          )}

          {/* ── Video ── */}
          {active === 'video' && (
            <VideoSelector
              value={form.video}
              onChange={v => setForm(p => ({ ...p, video: v }))}
            />
          )}

          {/* ── Texto ── */}
          {active === 'text' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p className="lm-text-hint">
                Escribí el contenido completo de la clase. Usá líneas en blanco para separar párrafos.
              </p>
              <textarea
                className="input lm-content-area"
                placeholder="Contenido de la clase...&#10;&#10;Podés escribir explicaciones, listas, ejemplos y más."
                value={form.content}
                onChange={set('content')}
              />
              <p className="lm-text-hint" style={{ fontSize: 11 }}>
                {form.content.length} caracteres · {form.content.split(/\n\n+/).filter(Boolean).length} párrafos
              </p>
            </div>
          )}

          {/* ── Recursos ── */}
          {active === 'resources' && (
            <UploadResources
              resources={form.resources}
              onChange={r => setForm(p => ({ ...p, resources: r }))}
            />
          )}
        </div>

        <div className="form-actions" style={{ marginTop: 24 }}>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!form.title.trim()}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <Check size={14} /> {lesson ? 'Guardar' : 'Crear clase'}
          </button>
        </div>
      </div>
    </div>
  );
}
