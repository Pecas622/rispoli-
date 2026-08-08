import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Rutas públicas y estables: se generan como HTML estático en el build
// (SEO-1). El resto (campus, panel de admin, checkout, etc.) sigue
// renderizando 100% client-side como hasta ahora — no hace falta que un
// crawler las vea, y son rutas que dependen de sesión de usuario.
const PRERENDER_PATHS = [
  '/', '/cursos', '/empresas', '/nosotros', '/blog',
  '/contacto', '/privacidad', '/terminos', '/cookies',
];

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  ssgOptions: {
    // Los globals de navegador (window/localStorage/document) se simulan
    // durante el prerender para que el código que ya asume que existen
    // (contexto de auth, Pixel, etc.) no rompa el build.
    mock: true,
    includedRoutes: () => PRERENDER_PATHS,
  },
})
