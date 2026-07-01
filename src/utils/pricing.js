export const REGIONS = {
  AR: {
    code: 'AR',
    label: 'Argentina',
    flag: '🇦🇷',
    currency: 'ARS',
    symbol: '$',
    locale: 'es-AR',
    processor: 'mercadopago',
    checkoutLabel: 'Comprar con Mercado Pago',
  },
  WORLD: {
    code: 'WORLD',
    label: 'Resto del mundo',
    flag: '🌍',
    currency: 'USD',
    symbol: 'USD',
    locale: 'en-US',
    processor: 'stripe',
    checkoutLabel: 'Pay with Stripe',
  },
};

export function getRegionPrice(course, regionCode) {
  if (regionCode === 'WORLD') {
    return {
      current:  course.priceUSD         ?? 0,
      original: course.originalPriceUSD ?? 0,
    };
  }
  return {
    current:  course.priceARS         ?? course.price,
    original: course.originalPriceARS ?? course.originalPrice,
  };
}

export function formatPrice(amount, regionCode) {
  if (regionCode === 'WORLD') {
    return `USD ${amount.toLocaleString('en-US')}`;
  }
  return `$${amount.toLocaleString('es-AR')}`;
}

export function getCheckoutLabel(regionCode) {
  return REGIONS[regionCode]?.checkoutLabel ?? REGIONS.AR.checkoutLabel;
}
