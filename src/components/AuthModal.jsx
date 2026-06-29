import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AuthModal() {
  const { authModal, setAuthModal, login, register } = useApp();
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (!authModal) return null;
  const isLogin = authModal === 'login';

  const validate = () => {
    const e = {};
    if (!isLogin && !form.name.trim()) e.name = 'Requerido';
    if (!form.email.trim()) e.email = 'Requerido';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email inválido';
    if (!form.password) e.password = 'Requerido';
    else if (form.password.length < 6) e.password = 'Mínimo 6 caracteres';
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const ok = isLogin ? login(form.email, form.password) : register(form.name, form.email, form.password);
    if (!ok) setLoading(false);
  };

  const set = k => e => { setForm(p=>({...p,[k]:e.target.value})); setErrors(p=>({...p,[k]:''})); };

  const FieldErr = ({k}) => errors[k] ? <span style={{fontSize:12,color:'var(--red)',marginTop:3,display:'block'}}>{errors[k]}</span> : null;

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setAuthModal(null)}>
      <div className="modal">
        <button className="modal-close-btn" style={{position:'absolute',top:14,right:14,width:28,height:28,borderRadius:6,background:'var(--bg-2)',border:'1px solid var(--border)',color:'var(--text-3)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}} onClick={()=>setAuthModal(null)}><X size={14}/></button>

        <h2 style={{fontSize:20,fontWeight:700,marginBottom:6,letterSpacing:'-0.02em'}}>
          {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
        </h2>
        <p style={{fontSize:14,color:'var(--text-3)',marginBottom:24}}>
          {isLogin ? 'Continuá aprendiendo donde lo dejaste' : 'Únete a más de 150.000 estudiantes'}
        </p>

        {isLogin && (
          <div style={{background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'10px 14px',marginBottom:20,fontSize:12,color:'var(--text-3)'}}>
            Demo: <strong style={{color:'var(--text)'}}>admin@edutech.com</strong> / admin123 · <strong style={{color:'var(--text)'}}>juan@email.com</strong> / 123456
          </div>
        )}

        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
          {!isLogin && (
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:500,color:'var(--text-3)',marginBottom:6}}>Nombre completo</label>
              <input className="input" type="text" placeholder="Tu nombre" value={form.name} onChange={set('name')} />
              <FieldErr k="name" />
            </div>
          )}
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:500,color:'var(--text-3)',marginBottom:6}}>Email</label>
            <input className="input" type="email" placeholder="tu@email.com" value={form.email} onChange={set('email')} />
            <FieldErr k="email" />
          </div>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:500,color:'var(--text-3)',marginBottom:6}}>Contraseña</label>
            <div style={{position:'relative'}}>
              <input className="input" type={showPass?'text':'password'} placeholder="••••••••" value={form.password} onChange={set('password')} style={{paddingRight:40}} />
              <button type="button" onClick={()=>setShowPass(!showPass)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',display:'flex'}}>
                {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
            <FieldErr k="password" />
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
