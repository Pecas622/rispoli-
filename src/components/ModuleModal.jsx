import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const EMPTY = { title: '', description: '', order: 1 };

export default function ModuleModal({ module, nextOrder, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    setForm(module
      ? { title: module.title, description: module.description || '', order: module.order }
      : { ...EMPTY, order: nextOrder }
    );
  }, [module, nextOrder]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({ ...form, order: Number(form.order) });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close-btn" onClick={onClose}><X size={14} /></button>
        <p className="modal-title">{module ? 'Editar módulo' : 'Nuevo módulo'}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-field">
            <label>Título *</label>
            <input
              className="input"
              placeholder="Ej: Introducción al curso"
              value={form.title}
              onChange={set('title')}
              autoFocus
            />
          </div>
          <div className="form-field">
            <label>Descripción</label>
            <textarea
              className="input"
              rows={2}
              placeholder="¿De qué trata este módulo?"
              value={form.description}
              onChange={set('description')}
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
          <div className="form-actions">
            <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!form.title.trim()}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Check size={14} /> {module ? 'Guardar' : 'Crear módulo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
