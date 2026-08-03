import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { COUNTRY_CODES, DEFAULT_COUNTRY, findCountry } from '../utils/countries';
import { detectCountry } from '../utils/currency';

// Alumnos que entran por Google no pasan por el formulario de registro, así
// que se quedan sin teléfono (Google no lo provee). Este modal los bloquea
// hasta que lo completen, para que no queden cuentas sin forma de contactarlos.
export default function CompleteProfileModal() {
  const { user, updateProfile, logout } = useApp();
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    detectCountry().then(iso => { if (iso && findCountry(iso)) setPhoneCountry(iso); }).catch(() => {});
  }, []);

  if (!user || user.phone || user.role !== 'student') return null;

  const handleSubmit = async e => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6) { setError('Teléfono incompleto'); return; }
    setError('');
    setSaving(true);
    const result = await updateProfile({ phone: `${findCountry(phoneCountry)?.dial ?? ''}${digits}` });
    setSaving(false);
    if (!result.success) setError('No se pudo guardar, probá de nuevo');
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 300 }}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <p className="modal-title">Completá tu perfil</p>
        <p style={{ fontSize: 13.5, color: 'var(--text-2)', marginBottom: 18, lineHeight: 1.6 }}>
          Necesitamos tu teléfono para poder ayudarte con tu inscripción y avisarte sobre tus cursos.
        </p>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-3)', marginBottom: 6 }}>
            Teléfono
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              className="input"
              value={phoneCountry}
              onChange={e => setPhoneCountry(e.target.value)}
              aria-label="Código de país"
              style={{ width: 112, flexShrink: 0, paddingLeft: 10, paddingRight: 6 }}
            >
              {COUNTRY_CODES.map(c => (
                <option key={c.iso} value={c.iso}>{c.flag} {c.dial}</option>
              ))}
            </select>
            <input
              className="input" type="tel" placeholder="9 11 1234-5678" autoComplete="tel-national"
              value={phone} onChange={e => setPhone(e.target.value)} style={{ flex: 1, minWidth: 0 }} autoFocus
            />
          </div>
          {error && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 8 }}>{error}</p>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} disabled={saving}>
            {saving ? 'Guardando...' : 'Continuar'}
          </button>
          <button
            type="button"
            onClick={logout}
            style={{ width: '100%', textAlign: 'center', marginTop: 10, background: 'none', border: 'none', fontSize: 12.5, color: 'var(--text-3)', cursor: 'pointer' }}
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
