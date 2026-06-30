import 'dotenv/config';
import { app } from './app';
import { prisma } from './lib/prisma';

const PORT = Number(process.env.PORT) || 4000;

async function main() {
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
