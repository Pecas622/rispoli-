import { Paperclip, X, FileText, Archive, Image, Code, File } from 'lucide-react';

const EXT_TYPE = {
  pdf:  'pdf',
  zip: 'zip', rar: 'zip', '7z': 'zip',
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', svg: 'image', webp: 'image',
  js: 'code', ts: 'code', jsx: 'code', tsx: 'code', py: 'code', java: 'code', cpp: 'code', cs: 'code',
};

const TYPE_ICONS = { pdf: FileText, zip: Archive, image: Image, code: Code };

function fileType(name) {
  const ext = name.split('.').pop().toLowerCase();
  return EXT_TYPE[ext] || 'file';
}

function fmtSize(bytes) {
  if (typeof bytes === 'string') return bytes;
  return bytes > 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

export default function UploadResources({ resources, onChange }) {
  const addFiles = (e) => {
    const added = Array.from(e.target.files).map(f => ({
      id: `res_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: f.name,
      type: fileType(f.name),
      size: fmtSize(f.size),
    }));
    onChange([...resources, ...added]);
    e.target.value = '';
  };

  const remove = (id) => onChange(resources.filter(r => r.id !== id));

  return (
    <div className="upload-resources">
      <label className="ur-add-btn">
        <Paperclip size={14} />
        Agregar archivos
        <input
          type="file"
          multiple
          accept=".pdf,.zip,.rar,.jpg,.jpeg,.png,.gif,.svg,.mp4,.js,.ts,.jsx,.tsx,.doc,.docx,.xls,.xlsx,.csv,.txt"
          onChange={addFiles}
          hidden
        />
      </label>

      {resources.length > 0 ? (
        <ul className="ur-list">
          {resources.map(r => {
            const Icon = TYPE_ICONS[r.type] || File;
            return (
              <li key={r.id} className="ur-item">
                <Icon size={15} className="ur-icon" />
                <span className="ur-name">{r.name}</span>
                <span className="ur-size">{r.size}</span>
                <button type="button" className="ur-del" onClick={() => remove(r.id)}>
                  <X size={13} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="ur-empty">No hay recursos adjuntos.</p>
      )}
    </div>
  );
}
