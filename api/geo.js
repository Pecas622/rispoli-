// Vercel Edge/Node inyecta automáticamente el país detectado por IP en este
// header — no hace falta ningún servicio externo de geolocalización.
export default function handler(req, res) {
  const country = req.headers['x-vercel-ip-country'] || null;
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ country });
}
