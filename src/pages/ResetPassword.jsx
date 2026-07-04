import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ResetPassword() {
  const { resetPassword, showToast } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword]   = useState('');
  const [confirm,  setConfirm]    = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState('');
  const [done,     setDone]       = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }

    setLoading(true);
    const result = await resetPassword(token, password);
    setLoading(false);

    if (result.success) {
      setDone(true);
      showToast('Contraseña actualizada. Ya podés iniciar sesión.');
      setTimeout(() => navigate('/'), 2000);
    } else {
      setError(result.message || 'No se pudo restablecer la contraseña');
    }
  };

  return (
    <div style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 24px' }}>
      <div style={{ width:'100%', maxWidth:400, border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:32 }}>
        <h1 style={{ fontSize:20, fontWeight:700, marginBottom:6, letterSpacing:'-0.02em' }}>Restablecer contraseña</h1>

        {!token && (
          <p style={{ fontSize:14, color:'var(--text-3)' }}>
            El enlace no es válido. Solicitá uno nuevo desde el login.
          </p>
        )}

        {token && done && (
          <p style={{ fontSize:14, color:'var(--text-3)' }}>
            Listo, tu contraseña fue actualizada. Te llevamos al inicio…
          </p>
        )}

        {token && !done && (
          <>
            <p style={{ fontSize:14, color:'var(--text-3)', marginBottom:24 }}>
              Elegí una contraseña nueva para tu cuenta.
            </p>
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--text-3)', marginBottom:6 }}>Nueva contraseña</label>
                <div style={{ position:'relative' }}>
                  <input className="input" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} style={{ paddingRight:40 }} />
                  <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-3)', cursor:'pointer', display:'flex' }}>
                    {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--text-3)', marginBottom:6 }}>Confirmar contraseña</label>
                <input className="input" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={confirm} onChange={e=>setConfirm(e.target.value)} />
              </div>
              {error && <span style={{ fontSize:12, color:'var(--red)' }}>{error}</span>}
              <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'12px', marginTop:4 }} disabled={loading}>
                {loading ? <><div className="spinner"/>Guardando...</> : 'Guardar nueva contraseña'}
              </button>
            </form>
          </>
        )}

        <p style={{ textAlign:'center', marginTop:18, fontSize:13, color:'var(--text-3)' }}>
          <Link to="/" style={{ color:'var(--text)', fontWeight:600 }}>Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
