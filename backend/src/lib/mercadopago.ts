// ── Mercado Pago — listo para conectar ────────────────────────────────────────
//
// Cuando tengas las credenciales:
//   1. npm install mercadopago
//   2. Descomentar el código de abajo
//   3. Agregar MP_ACCESS_TOKEN y MP_WEBHOOK_SECRET al .env
//
// Dashboard MP: https://www.mercadopago.com.ar/developers/es/docs
// Credenciales:  https://www.mercadopago.com.ar/settings/account/credentials

export function isMercadoPagoReady(): boolean {
  const token = process.env.MP_ACCESS_TOKEN;
  return !!token && token !== 'APP_USR-...';
}

// ── Descomentar tras instalar 'mercadopago' ───────────────────────────────────
//
// import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
//
// let _client: MercadoPagoConfig | null = null;
//
// export function getMPClient(): MercadoPagoConfig {
//   if (!isMercadoPagoReady()) {
//     throw new Error('MP_ACCESS_TOKEN no está configurado en .env');
//   }
//   if (!_client) {
//     _client = new MercadoPagoConfig({
//       accessToken: process.env.MP_ACCESS_TOKEN!,
//       options: { timeout: 5000 },
//     });
//   }
//   return _client;
// }
//
// export { Preference, Payment };
