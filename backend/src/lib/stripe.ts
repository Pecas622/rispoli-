import Stripe from 'stripe';

// Stripe se inicializa de forma lazy para que el servidor arranque
// sin las claves configuradas. Las rutas de pago verifican isStripeReady()
// antes de usarlo y devuelven un error claro si no está configurado.

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_...') {
    throw new Error('STRIPE_SECRET_KEY no está configurado en .env');
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }
  return _stripe;
}

export function isStripeReady(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return !!key && key !== 'sk_test_...';
}
