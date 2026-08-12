// Corrige el "paidAt" de los pagos de Mercado Pago que quedaron con la fecha
// del último reenvío de webhook procesado en vez de la fecha real de
// aprobación (bug corregido en payments.routes.ts — este script repara el
// daño que ya estaba hecho en la base antes del fix).
//
// Solo toca paidAt. No toca refundedAt: "Revocar acceso" es una acción local
// nuestra que Mercado Pago nunca ve, así que su status va a seguir diciendo
// "approved" para esos pagos aunque el admin haya revocado el acceso acá —
// tocar refundedAt en base a lo que dice MP sería deshacer revocaciones
// hechas a propósito.
//
// Uso:
//   npx tsx src/scripts/fix-paid-dates.ts            (aplica los cambios)
//   npx tsx src/scripts/fix-paid-dates.ts --dry-run   (solo muestra qué cambiaría)

import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { getMPClient, Payment } from '../lib/mercadopago';

const dryRun = process.argv.includes('--dry-run');
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  const enrollments = await prisma.enrollment.findMany({
    where: { paymentProvider: 'mercadopago', mpPaymentId: { not: null } },
    include: { user: { select: { email: true } }, course: { select: { title: true } } },
  });

  console.log(`${enrollments.length} pagos de Mercado Pago para revisar${dryRun ? ' (dry-run, no se va a escribir nada)' : ''}.\n`);

  const paymentApi = new Payment(getMPClient());
  let corregidos = 0;
  let sinCambios = 0;
  let errores = 0;

  for (const e of enrollments) {
    try {
      const payment = await paymentApi.get({ id: Number(e.mpPaymentId) });
      if (!payment.date_approved) {
        console.log(`⚠ ${e.mpPaymentId} (${e.user.email} — ${e.course.title}): MP no devolvió date_approved, se salta.`);
        errores++;
        continue;
      }

      const fechaReal = new Date(payment.date_approved);
      const fechaActual = e.paidAt;
      // Compara solo hasta el minuto: la hora exacta puede variar un poco por
      // husos horarios/redondeo y no vale la pena "corregir" eso.
      const yaCoincide = fechaActual && Math.abs(fechaActual.getTime() - fechaReal.getTime()) < 60_000;

      if (yaCoincide) {
        sinCambios++;
        continue;
      }

      console.log(
        `✎ ${e.mpPaymentId} (${e.user.email} — ${e.course.title}): ` +
        `${fechaActual?.toLocaleString('es-AR') ?? '(sin fecha)'} → ${fechaReal.toLocaleString('es-AR')}`,
      );
      corregidos++;

      if (!dryRun) {
        await prisma.enrollment.update({ where: { id: e.id }, data: { paidAt: fechaReal } });
      }
    } catch (err: any) {
      console.log(`✗ ${e.mpPaymentId} (${e.user.email}): error consultando MP — ${err.message}`);
      errores++;
    }
    await sleep(150); // no golpear la API de MP de más
  }

  console.log(`\nListo. Corregidos: ${corregidos} · Ya estaban bien: ${sinCambios} · Errores: ${errores}`);
  if (dryRun && corregidos > 0) {
    console.log('Corré sin --dry-run para aplicar los cambios de verdad.');
  }
}

main()
  .catch(err => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
