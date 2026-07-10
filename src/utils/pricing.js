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

// dolarRate = cotización ARS por USD (dolarapi.com). Solo se usa como respaldo
// para convertir en vivo cuando un curso no tiene cargado su precio en USD a mano.
export function getRegionPrice(course, regionCode, dolarRate) {
  if (regionCode === 'WORLD') {
    const arsToUsd = (ars) => (dolarRate ? +(ars / dolarRate).toFixed(2) : ars);
    return {
      current:  course.priceUSD         ?? (course.price         != null ? arsToUsd(course.price)         : 0),
      original: course.originalPriceUSD ?? (course.originalPrice != null ? arsToUsd(course.originalPrice) : 0),
    };
  }
  return {
    current:  course.priceARS         ?? course.price,
    original: course.originalPriceARS ?? course.originalPrice,
  };
}

const arsFormatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatPrice(amount, regionCode) {
  return regionCode === 'WORLD' ? `${usdFormatter.format(amount)} USD` : arsFormatter.format(amount);
}

export function getCheckoutLabel(regionCode) {
  return REGIONS[regionCode]?.checkoutLabel ?? REGIONS.AR.checkoutLabel;
}
