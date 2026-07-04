import { useState, useRef, useEffect } from 'react';
import { Mail, ShieldCheck, X, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './VerifyEmailModal.css';

export default function VerifyEmailModal() {
  const { pendingVerification, setPendingVerification, verifyEmail, verifyLoginCode, resendVerificationCode } = useApp();

  const [digits, setDigits]       = useState(['', '', '', '', '', '']);
  const [error,  setError]        = useState('');
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown]   = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (pendingVerification) {
      setDigits(['', '', '', '', '', '']);
      setError('');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [pendingVerification]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!pendingVerification) return null;

  const { email, type = 'registration', devCode } = pendingVerification;
  const isLogin = type === 'login';
  const code = digits.join('');

  const handleDigit = (i, value) => {
    const v = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError('');
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
    if (next.every(d => d !== '')) handleSubmit(next.join(''));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split('');
      setDigits(next);
      inputRefs.current[5]?.focus();
      handleSubmit(pasted);
    }
    e.preventDefault();
  };

  const handleSubmit = async (codeOverride) => {
    const finalCode = codeOverride ?? code;
    if (finalCode.length < 6) { setError('Ingresá los 6 dígitos'); return; }
    setLoading(true);
    setError('');
    const verifyFn = isLogin ? verifyLoginCode : verifyEmail;
    const result = await verifyFn(email, finalCode);
    if (!result.success) {
      setError(result.message || 'Código incorrecto');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (cooldown > 0 || isLogin) return; // Para login, el usuario debe volver a iniciar sesión
    setResending(true);
    await resendVerificationCode(email);
    setResending(false);
    setCooldown(60);
    setDigits(['', '', '', '', '', '']);
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) =>
    a + '*'.repeat(Math.min(b.length, 4)) + c
  );

  return (
    <div className="vem-overlay" onClick={e => e.target === e.currentTarget && setPendingVerification(null)}>
      <div className="vem-modal" role="dialog" aria-modal="true">
        <button className="vem-close" onClick={() => setPendingVerification(null)} aria-label="Cerrar">
          <X size={18} />
        </button>

        <div className="vem-icon" style={isLogin ? { background: 'rgba(111,149,232,0.12)', color: 'var(--accent)' } : {}}>
          {isLogin ? <ShieldCheck size={28} /> : <Mail size={28} />}
        </div>

        <h2 className="vem-title">
          {isLogin ? 'Verificá tu identidad' : 'Verificá tu email'}
        </h2>
        <p className="vem-subtitle">
          {isLogin
            ? <>Por seguridad, enviamos un código de acceso a<br /><strong>{maskedEmail}</strong></>
            : <>Enviamos un código de 6 dígitos a<br /><strong>{maskedEmail}</strong></>
          }
        </p>
        {devCode && (
          <div className="vem-dev-banner">
            <span className="vem-dev-label">🛠️ Modo Desarrollo · Email no configurado</span>
            <span className="vem-dev-code">{devCode}</span>
            <button className="vem-dev-fill" onClick={() => {
              setDigits(devCode.split(''));
              inputRefs.current[5]?.focus();
              setTimeout(() => handleSubmit(devCode), 80);
            }}>
              Usar automáticamente
            </button>
          </div>
        )}

        {isLogin && !devCode && (
          <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#713F12', marginBottom: 8, textAlign: 'left' }}>
            🔒 Este código expira en <strong>10 minutos</strong>. No lo compartás con nadie.
          </div>
        )}

        <div className="vem-inputs" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => inputRefs.current[i] = el}
              className={`vem-digit ${error ? 'vem-digit--error' : ''}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {error && <p className="vem-error">{error}</p>}

        <button
          className="btn btn-primary vem-btn"
          onClick={() => handleSubmit()}
          disabled={loading || code.length < 6}
        >
          {loading ? 'Verificando…' : 'Confirmar código'}
        </button>

        {isLogin ? (
          <p className="vem-note" style={{ color: 'var(--text-3)', marginTop: 4 }}>
            ¿No llegó? Cerrá esta ventana e iniciá sesión de nuevo para pedir un nuevo código.
          </p>
        ) : (
          <div className="vem-resend">
            <span>¿No llegó el email?</span>
            <button
              className="vem-resend-btn"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
            >
              {resending ? 'Enviando…' :
               cooldown > 0 ? `Reenviar en ${cooldown}s` :
               <><RotateCcw size={13} /> Reenviar código</>}
            </button>
          </div>
        )}

        <p className="vem-note">El código expira en {isLogin ? '10' : '15'} minutos</p>
      </div>
    </div>
  );
}
