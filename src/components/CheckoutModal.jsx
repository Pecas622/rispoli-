import { useState } from 'react';
import { X, Lock, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getRegionPrice, formatPrice, REGIONS } from '../utils/pricing';
import './CheckoutModal.css';

export default function CheckoutModal() {
  const { checkoutModal, setCheckoutModal, region, showToast } = useApp();
  const [step, setStep] = useState('form'); // form | processing | success
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvc: '' });

  if (!checkoutModal) return null;
  const course = checkoutModal;

  const processor = REGIONS[region === 'WORLD' ? 'WORLD' : 'AR'];
  const { current: price } = getRegionPrice(course, region);

  const close = () => {
    setCheckoutModal(null);
    setStep('form');
    setCard({ number: '', name: '', expiry: '', cvc: '' });
  };

  const set = k => e => setCard(p => ({ ...p, [k]: e.target.value }));

  const handlePay = async e => {
    e.preventDefault();
    setStep('processing');
    await new Promise(r => setTimeout(r, 1400));
    setStep('success');
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
      <div className="modal checkout-modal">
        <button className="modal-close-btn" onClick={close}><X size={14} /></button>

        {step === 'success' ? (
          <div className="checkout-success">
            <div className="checkout-success-icon"><ShieldCheck size={30} /></div>
            <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8 }}>Pago simulado con éxito</h2>
            <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 20 }}>
              Esto es una demo — no se realizó ningún cargo real y la pasarela de pago todavía no está conectada a un procesador productivo.
            </p>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={close}>
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <p className="checkout-badge">
              <Lock size={11} /> Checkout de demostración
            </p>
            <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>
              {processor.checkoutLabel}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
              Ningún dato de esta pantalla se procesa ni se guarda.
            </p>

            <div className="checkout-summary">
              <span className="checkout-summary-title">{course.title}</span>
              <span className="checkout-summary-price">{formatPrice(price, region)}</span>
            </div>

            <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
              <div>
                <label className="checkout-label">Número de tarjeta</label>
                <input className="input" placeholder="4242 4242 4242 4242" maxLength={19}
                  value={card.number} onChange={set('number')} disabled={step === 'processing'} required />
              </div>
              <div>
                <label className="checkout-label">Nombre en la tarjeta</label>
                <input className="input" placeholder="Como figura en la tarjeta"
                  value={card.name} onChange={set('name')} disabled={step === 'processing'} required />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">Vencimiento</label>
                  <input className="input" placeholder="MM/AA" maxLength={5}
                    value={card.expiry} onChange={set('expiry')} disabled={step === 'processing'} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="checkout-label">CVC</label>
                  <input className="input" placeholder="123" maxLength={4}
                    value={card.cvc} onChange={set('cvc')} disabled={step === 'processing'} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 6 }} disabled={step === 'processing'}>
                {step === 'processing' ? <><div className="spinner" /> Procesando...</> : `Pagar ${formatPrice(price, region)}`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
