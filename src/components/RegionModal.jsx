import { Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './RegionModal.css';

export default function RegionModal() {
  const { showRegionModal, selectRegion } = useApp();
  if (!showRegionModal) return null;

  return (
    <div className="rm-overlay">
      <div className="rm-modal">
        <div className="rm-icon">
          <Globe size={28} />
        </div>
        <h2 className="rm-title">¿Desde dónde accedés?</h2>
        <p className="rm-sub">
          Seleccioná tu región para ver precios y métodos de pago disponibles.
        </p>
        <div className="rm-options">
          <button className="rm-option" onClick={() => selectRegion('AR')}>
            <span className="rm-flag">🇦🇷</span>
            <span className="rm-option-text">
              <span className="rm-option-label">Argentina</span>
              <span className="rm-option-detail">Precios en ARS · Mercado Pago</span>
            </span>
          </button>
          <button className="rm-option" onClick={() => selectRegion('WORLD')}>
            <span className="rm-flag">🌍</span>
            <span className="rm-option-text">
              <span className="rm-option-label">Resto del mundo</span>
              <span className="rm-option-detail">Prices in USD · Stripe</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
