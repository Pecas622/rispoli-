import { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function waitForGoogleScript(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const start = Date.now();
    const check = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(check);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(check);
        reject(new Error('No se pudo cargar el script de Google'));
      }
    }, 100);
  });
}

export default function AuthModal() {
  const { authModal, setAuthModal, login, loginWithGoogle, register, forgotPassword } = useApp();
  const googleBtnRef = useRef(null);
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', phone:'', password:'' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (!authModal || forgotMode || !GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    waitForGoogleScript()
      .then(() => {
        if (cancelled || !googleBtnRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => loginWithGoogle(response.credential),
        });
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline', size: 'large', width: 360,
          text: authModal === 'login' ? 'signin_with' : 'signup_with',
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [authModal, forgotMode]);

  if (!authModal) return null;
  const isLogin = authModal === 'login';

  const close = () => { setAuthModal(null); setForgotMode(false); setForgotSent(false); setForgotEmail(''); };

  const validate = () => {
    const e = {};
    if (!isLogin) {
      if (!form.firstName.trim()) e.firstName = 'Requerido';
      if (!form.lastName.trim())  e.lastName  = 'Requerido';
      if (!form.phone.trim()) e.phone = 'Requerido';
      else if (form.phone.replace(/\D/g, '').length < 8) e.phone = 'Teléfono inválido';
    }
    if (!form.email.trim()) e.email = 'Requerido';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email inválido';
    if (!form.password) e.password = 'Requerido';
    else if (!isLogin && form.password.length < 8) e.password = 'Mínimo 8 caracteres';
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await (isLogin ? login(form.email, form.password) : register(form));
    setLoading(false);
  };

  const handleForgotSubmit = async e => {
    e.preventDefault();
    if (!forgotEmail.trim() || !/\S+@\S+\.\S+/.test(forgotEmail)) return;
    setForgotLoading(true);
    await forgotPassword(forgotEmail);
    setForgotLoading(false);
    setForgotSent(true);
  };

  const set = k => e => { setForm(p=>({...p,[k]:e.target.value})); setErrors(p=>({...p,[k]:''})); };

  const FieldErr = ({k}) => errors[k] ? <span style={{fontSize:12,color:'var(--red)',marginTop:3,display:'block'}}>{errors[k]}</span> : null;

  if (forgotMode) {
    return (
      <div className="modal-overlay" onClick={e => e.target===e.currentTarget && close()}>
        <div className="modal">
          <button className="modal-close-btn" style={{position:'absolute',top:14,right:14,width:28,height:28,borderRadius:6,background:'var(--bg-2)',border:'1px solid var(--border)',color:'var(--text-3)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}} onClick={close}><X size={14}/></button>

          <h2 style={{fontSize:20,fontWeight:700,marginBottom:6,letterSpacing:'-0.02em'}}>Recuperar contraseña</h2>
          <p style={{fontSize:14,color:'var(--text-3)',marginBottom:24}}>
            {forgotSent
              ? 'Si el email existe en nuestro sistema, te enviamos instrucciones para restablecer tu contraseña.'
              : 'Ingresá tu email y te enviamos un enlace para restablecerla.'}
          </p>

          {!forgotSent && (
            <form onSubmit={handleForgotSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:500,color:'var(--text-3)',marginBottom:6}}>Email</label>
                <input className="input" type="email" placeholder="tu@email.com" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'12px',marginTop:4}} disabled={forgotLoading}>
                {forgotLoading ? <><div className="spinner"/>Enviando...</> : 'Enviar instrucciones'}
              </button>
            </form>
          )}

          <p style={{textAlign:'center',marginTop:18,fontSize:13,color:'var(--text-3)'}}>
            <button onClick={()=>{ setForgotMode(false); setForgotSent(false); setForgotEmail(''); }} style={{background:'none',border:'none',color:'var(--text)',fontWeight:600,cursor:'pointer',fontSize:13}}>
              Volver a iniciar sesión
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && close()}>
      <div className="modal">
        <button className="modal-close-btn" style={{position:'absolute',top:14,right:14,width:28,height:28,borderRadius:6,background:'var(--bg-2)',border:'1px solid var(--border)',color:'var(--text-3)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}} onClick={close}><X size={14}/></button>

        <h2 style={{fontSize:20,fontWeight:700,marginBottom:6,letterSpacing:'-0.02em'}}>
          {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
        </h2>
        <p style={{fontSize:14,color:'var(--text-3)',marginBottom:24}}>
          {isLogin ? 'Continuá aprendiendo donde lo dejaste' : 'Únete a más de 150.000 estudiantes'}
        </p>

        {GOOGLE_CLIENT_ID && (
          <>
            <div ref={googleBtnRef} style={{display:'flex',justifyContent:'center',minHeight:40,marginBottom:18}} />
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
              <div style={{flex:1,height:1,background:'var(--border)'}} />
              <span style={{fontSize:12,color:'var(--text-3)'}}>o</span>
              <div style={{flex:1,height:1,background:'var(--border)'}} />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
          {!isLogin && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:500,color:'var(--text-3)',marginBottom:6}}>Nombre</label>
                <input className="input" type="text" placeholder="Juan" autoComplete="given-name" value={form.firstName} onChange={set('firstName')} />
                <FieldErr k="firstName" />
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:500,color:'var(--text-3)',marginBottom:6}}>Apellido</label>
                <input className="input" type="text" placeholder="Pérez" autoComplete="family-name" value={form.lastName} onChange={set('lastName')} />
                <FieldErr k="lastName" />
              </div>
            </div>
          )}
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:500,color:'var(--text-3)',marginBottom:6}}>Email</label>
            <input className="input" type="email" placeholder="tu@email.com" value={form.email} onChange={set('email')} />
            <FieldErr k="email" />
          </div>
          {!isLogin && (
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:500,color:'var(--text-3)',marginBottom:6}}>Teléfono</label>
              <input className="input" type="tel" placeholder="+54 9 261 555 5555" autoComplete="tel" value={form.phone} onChange={set('phone')} />
              <FieldErr k="phone" />
            </div>
          )}
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:500,color:'var(--text-3)',marginBottom:6}}>Contraseña</label>
            <div style={{position:'relative'}}>
              <input className="input" type={showPass?'text':'password'} placeholder="••••••••" value={form.password} onChange={set('password')} style={{paddingRight:40}} />
              <button type="button" onClick={()=>setShowPass(!showPass)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',display:'flex'}}>
                {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
            <FieldErr k="password" />
            {isLogin && (
              <button type="button" onClick={()=>setForgotMode(true)} style={{background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',fontSize:12,marginTop:8,padding:0}}>
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'12px',marginTop:4}} disabled={loading}>
            {loading ? <><div className="spinner"/>Procesando...</> : isLogin ? 'Iniciar sesión' : 'Crear cuenta gratis'}
          </button>
        </form>

        <p style={{textAlign:'center',marginTop:18,fontSize:13,color:'var(--text-3)'}}>
          {isLogin ? '¿No tenés cuenta? ' : '¿Ya tenés cuenta? '}
          <button onClick={()=>setAuthModal(isLogin?'register':'login')} style={{background:'none',border:'none',color:'var(--text)',fontWeight:600,cursor:'pointer',fontSize:13}}>
            {isLogin ? 'Crear una gratis' : 'Iniciar sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}
