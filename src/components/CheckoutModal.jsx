import { useState, useEffect } from 'react';
import { Lock, X, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { courses } from '../data/courses';
import './CheckoutModal.css';

function formatCardNumber(v) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}
function formatExpiry(v) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export default function CheckoutModal() {
  const { checkoutModal, setCheckoutModal, confirmMockEnroll } = useApp();
  const [step, setStep] = useState('form'); // 'form' | 'processing' | 'success'
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (checkoutModal) {
      setStep('form');
      setCard({ number: '', expiry: '', cvv: '', name: '' });
      setErrors({});
    }
  }, [checkoutModal]);

  if (!checkoutModal) return null;

  const course = courses.find(c => c.id === checkoutModal.courseId);
  if (!course) return null;

  const validate = () => {
    const e = {};
    if (card.number.replace(/\s/g, '').length < 16) e.number = 'Número inválido';
    if (!card.expiry || card.expiry.length < 5) e.expiry = 'Vencimiento inválido';
    if (!card.cvv || card.cvv.length < 3) e.cvv = 'CVV inválido';
    if (!card.name.trim()) e.name = 'Ingresá el nombre';
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep('processing');
    await new Promise(r => setTimeout(r, 2200));
    setStep('success');
    await new Promise(r => setTimeout(r, 1400));
    confirmMockEnroll(checkoutModal.courseId);
    setCheckoutModal(null);
  };

  const set = field => e => {
    let v = e.target.value;
    if (field === 'number') v = formatCardNumber(v);
    if (field === 'expiry') v = formatExpiry(v);
    if (field === 'cvv')    v = v.replace(/\D/g, '').slice(0, 4);
    setCard(p => ({ ...p, [field]: v }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  const useTestCard = () =>
    setCard({ number: '4242 4242 4242 4242', expiry: '12/28', cvv: '123', name: 'Usuario Prueba' });

  const discount = course.originalPrice
    ? Math.round((1 - course.price / course.originalPrice) * 100)
    : 0;

  return (
    <div className="co-overlay" onClick={e => e.target === e.currentTarget && step === 'form' && setCheckoutModal(null)}>
      <div className="co-modal">

        {/* Header */}
        <div className="co-header">
          <div className="co-header-left">
            <Lock size={13} />
            <span>Pago seguro · GO Travel Academy</span>
          </div>
          {step === 'form' && (
            <button className="co-close" onClick={() => setCheckoutModal(null)}><X size={15} /></button>
          )}
        </div>

        {/* Course info */}
        <div className="co-course-info">
          <img src={course.image} alt={course.title} className="co-course-img" />
          <div className="co-course-meta">
            <p className="co-course-title">{course.title}</p>
            <p className="co-course-sub">Acceso de por vida · {course.hours}h de contenido</p>
          </div>
          <div>
            <div className="co-course-price">${course.price.toLocaleString()}</div>
            {discount > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-3)', textDecoration: 'line-through', textAlign: 'right' }}>
                ${course.originalPrice.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="co-form">
            <div className="co-test-hint" onClick={useTestCard}>
              <CreditCard size={13} />
              Modo demo — click para usar tarjeta de prueba: <strong>4242 4242 4242 4242</strong>
            </div>

            <div className="co-field">
              <label>Número de tarjeta</label>
              <div className={`co-input-wrap ${errors.number ? 'error' : ''}`}>
                <CreditCard size={14} className="co-input-icon" />
                <input
                  value={card.number}
                  onChange={set('number')}
                  placeholder="1234 5678 9012 3456"
                  className="co-input"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  maxLength={19}
                />
              </div>
              {errors.number && <span className="co-err">{errors.number}</span>}
            </div>

            <div className="co-row">
              <div className="co-field">
                <label>Vencimiento</label>
                <input
                  value={card.expiry}
                  onChange={set('expiry')}
                  placeholder="MM/AA"
                  className={`co-input-plain ${errors.expiry ? 'error' : ''}`}
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  maxLength={5}
                />
                {errors.expiry && <span className="co-err">{errors.expiry}</span>}
              </div>
              <div className="co-field">
                <label>CVV</label>
                <input
                  value={card.cvv}
                  onChange={set('cvv')}
                  placeholder="123"
                  className={`co-input-plain ${errors.cvv ? 'error' : ''}`}
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  maxLength={4}
                  type="password"
                />
                {errors.cvv && <span className="co-err">{errors.cvv}</span>}
              </div>
            </div>

            <div className="co-field">
              <label>Nombre en la tarjeta</label>
              <input
                value={card.name}
                onChange={set('name')}
                placeholder="Nombre Apellido"
                className={`co-input-plain ${errors.name ? 'error' : ''}`}
                autoComplete="cc-name"
              />
              {errors.name && <span className="co-err">{errors.name}</span>}
            </div>

            <button type="submit" className="btn btn-primary co-pay-btn">
              Pagar ${course.price.toLocaleString()}
            </button>
          </form>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <div className="co-state">
            <div className="co-spinner" />
            <p className="co-state-title">Procesando pago...</p>
            <p className="co-state-sub">No cerrés esta ventana</p>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="co-state">
            <CheckCircle size={44} style={{ color: 'var(--green)' }} />
            <p className="co-state-title">¡Pago aprobado!</p>
            <p className="co-state-sub">Activando tu acceso al curso...</p>
          </div>
        )}

        <div className="co-footer">
          <Shield size={12} />
          <span>Transacción cifrada con SSL 256 bits</span>
        </div>
      </div>
    </div>
  );
}
