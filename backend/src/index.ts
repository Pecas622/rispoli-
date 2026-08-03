import 'dotenv/config';
import { app } from './app';
import { prisma } from './lib/prisma';

const PORT = Number(process.env.PORT) || 4000;

// Variables sin las cuales el servidor no puede funcionar de forma segura.
// Si falta alguna, mejor abortar el arranque que fallar silenciosamente en
// cada petición autenticada (JWT_SECRET) o sin poder conectar (DATABASE_URL).
const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'] as const;

function checkRequiredEnv() {
  const faltantes = REQUIRED_ENV.filter(key => !process.env[key]);
  if (faltantes.length > 0) {
    console.error(`❌ Faltan variables de entorno obligatorias: ${faltantes.join(', ')}`);
    process.exit(1);
  }
}

async function main() {
  checkRequiredEnv();

  // Test DB connection
  await prisma.$connect();
  console.log('✅ Base de datos conectada');

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📡 API disponible en http://localhost:${PORT}/api`);
  });
}

main().catch(err => {
  console.error('❌ Error al iniciar el servidor:', err);
  process.exit(1);
});

process.on('SIGINT',  () => { prisma.$disconnect(); process.exit(0); });
process.on('SIGTERM', () => { prisma.$disconnect(); process.exit(0); });
