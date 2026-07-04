import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';

async function main() {
  console.log('🌱 Iniciando seed de GO Travel Academy...');

  // ── Users ────────────────────────────────────────────────────────────────────
  const adminHash   = await bcrypt.hash('admin123', 12);
  const studentHash = await bcrypt.hash('123456',   12);

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@gotravelacademy.com' },
    update: {},
    create: {
      name:          'Admin GO Travel Academy',
      email:         'admin@gotravelacademy.com',
      passwordHash:  adminHash,
      role:          'ADMIN',
      emailVerified: true,
      avatar:        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80',
    },
  });

  const student = await prisma.user.upsert({
    where:  { email: 'juan@email.com' },
    update: {},
    create: {
      name:          'Juan Estudiante',
      email:         'juan@email.com',
      passwordHash:  studentHash,
      role:          'STUDENT',
      emailVerified: true,
      avatar:        'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&q=80',
    },
  });

  console.log('✅ Usuarios creados:', admin.email, student.email);

  // ── Courses ──────────────────────────────────────────────────────────────────
  const course1 = await prisma.course.upsert({
    where:  { id: 'course_agente_viajes' },
    update: {},
    create: {
      id:              'course_agente_viajes',
      title:           'Agente de Viajes Profesional',
      subtitle:        'Formación completa IATA, GDS y ventas turísticas',
      description:     'Convertite en un agente de viajes certificado. Desde los fundamentos del turismo hasta el manejo profesional de sistemas GDS, paquetes y atención al viajero. El curso más completo del mercado.',
      category:        'Formación',
      level:           'Principiante',
      modality:        'En vivo',
      duration:        '6 meses',
      hours:           120,
      price:           89900,
      originalPrice:   129900,
      priceUSD:        89,
      originalPriceUSD: 129,
      rating:          4.9,
      reviews:         2847,
      students:        12400,
      image:           'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80',
      featured:        true,
      published:       true,
    },
  });

  const course2 = await prisma.course.upsert({
    where:  { id: 'course_gds_amadeus' },
    update: {},
    create: {
      id:              'course_gds_amadeus',
      title:           'GDS Amadeus Completo',
      subtitle:        'PNRs, tarifas, ticketing y reemisiones',
      description:     'Dominá el sistema Amadeus de principio a fin. Desde la creación de reservas aéreas hasta la gestión de hoteles, autos y servicios especiales. Incluye práctica con terminal real.',
      category:        'GDS & Reservas',
      level:           'Intermedio',
      modality:        'Online',
      duration:        '3 meses',
      hours:           80,
      price:           69900,
      originalPrice:   99900,
      priceUSD:        69,
      originalPriceUSD: 99,
      rating:          4.8,
      reviews:         1923,
      students:        8700,
      image:           'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600&q=80',
      featured:        true,
      published:       true,
    },
  });

  const course3 = await prisma.course.upsert({
    where:  { id: 'course_turismo_lujo' },
    update: {},
    create: {
      id:              'course_turismo_lujo',
      title:           'Turismo de Lujo & Premium',
      subtitle:        'Experiencias VIP, hoteles 5★ y clientes de alto valor',
      description:     'Especializate en el segmento más rentable del turismo. Aprende a diseñar experiencias únicas para clientes premium, gestionar proveedores de lujo y posicionar tu agencia en el mercado de alto valor.',
      category:        'Turismo de Lujo',
      level:           'Avanzado',
      modality:        'En vivo',
      duration:        '4 meses',
      hours:           90,
      price:           99900,
      originalPrice:   149900,
      priceUSD:        99,
      originalPriceUSD: 149,
      rating:          4.9,
      reviews:         1200,
      students:        5100,
      image:           'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
      featured:        true,
      published:       true,
    },
  });

  const course4 = await prisma.course.upsert({
    where:  { id: 'course_marketing_digital' },
    update: {},
    create: {
      id:              'course_marketing_digital',
      title:           'Marketing Digital para Agencias',
      subtitle:        'SEO, Instagram, Google Ads y email marketing turístico',
      description:     'Potenciá tu agencia de viajes con estrategias digitales que realmente convierten. Aprende a atraer clientes online, crear contenido que vende y gestionar campañas rentables en el sector turístico.',
      category:        'Marketing Turístico',
      level:           'Intermedio',
      modality:        'Grabado',
      duration:        '3 meses',
      hours:           60,
      price:           59900,
      originalPrice:   89900,
      priceUSD:        59,
      originalPriceUSD: 89,
      rating:          4.7,
      reviews:         1456,
      students:        6300,
      image:           'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=600&q=80',
      featured:        true,
      published:       true,
    },
  });

  const course5 = await prisma.course.upsert({
    where:  { id: 'course_revenue_hotelero' },
    update: {},
    create: {
      id:              'course_revenue_hotelero',
      title:           'Revenue Management Hotelero',
      subtitle:        'OTAs, pricing dinámico y optimización de ingresos',
      description:     'Dominá el revenue management y maximizá los ingresos de tu hotel. Aprendé a trabajar con OTAs, implementar estrategias de pricing dinámico y tomar decisiones basadas en datos.',
      category:        'Gestión Hotelera',
      level:           'Avanzado',
      modality:        'Online',
      duration:        '4 meses',
      hours:           80,
      price:           79900,
      originalPrice:   119900,
      priceUSD:        79,
      originalPriceUSD: 119,
      rating:          4.8,
      reviews:         987,
      students:        3200,
      image:           'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80',
      featured:        false,
      published:       true,
    },
  });

  const course6 = await prisma.course.upsert({
    where:  { id: 'course_destinos_mundo' },
    update: {},
    create: {
      id:              'course_destinos_mundo',
      title:           'Destinos del Mundo',
      subtitle:        'Europa, Asia, América y Caribe para agentes',
      description:     'Conocé en profundidad los destinos más vendidos del mundo. Información actualizada sobre visas, mejor época para viajar, atracciones, alojamiento y tips para asesorar correctamente a tus clientes.',
      category:        'Formación',
      level:           'Principiante',
      modality:        'Grabado',
      duration:        '2 meses',
      hours:           40,
      price:           39900,
      originalPrice:   59900,
      priceUSD:        39,
      originalPriceUSD: 59,
      rating:          4.6,
      reviews:         2100,
      students:        9800,
      image:           'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80',
      featured:        false,
      published:       true,
    },
  });

  console.log('✅ 6 cursos creados');

  // ── Módulos y clases del Curso 1 (Agente de Viajes) ──────────────────────────
  const mod1 = await prisma.module.upsert({
    where:  { id: 'mod_agt_fundamentos' },
    update: {},
    create: {
      id:          'mod_agt_fundamentos',
      courseId:    course1.id,
      title:       'Fundamentos del Turismo',
      description: 'Historia, tipos de turismo y organismos internacionales.',
      order:       1,
    },
  });

  await prisma.lesson.upsert({
    where:  { id: 'les_agt_bienvenida' },
    update: {},
    create: {
      id:          'les_agt_bienvenida',
      moduleId:    mod1.id,
      title:       'Bienvenida al curso',
      description: 'Presentación del programa y metodología de trabajo.',
      duration:    '5:30',
      videoType:   'youtube',
      videoUrl:    '',
      contentType: 'video',
      isPreview:   true,
      order:       1,
    },
  });

  await prisma.lesson.upsert({
    where:  { id: 'les_agt_historia' },
    update: {},
    create: {
      id:          'les_agt_historia',
      moduleId:    mod1.id,
      title:       'Historia del turismo mundial',
      description: 'Evolución del sector desde el Grand Tour hasta la era digital.',
      duration:    '18:00',
      videoType:   'youtube',
      videoUrl:    '',
      contentType: 'video',
      isPreview:   false,
      order:       2,
    },
  });

  const mod2 = await prisma.module.upsert({
    where:  { id: 'mod_agt_gds' },
    update: {},
    create: {
      id:          'mod_agt_gds',
      courseId:    course1.id,
      title:       'GDS Amadeus & Sabre',
      description: 'Creación de PNRs, búsqueda de vuelos y emisión de tickets.',
      order:       2,
    },
  });

  await prisma.lesson.upsert({
    where:  { id: 'les_agt_intro_gds' },
    update: {},
    create: {
      id:          'les_agt_intro_gds',
      moduleId:    mod2.id,
      title:       'Introducción a los GDS',
      description: 'Qué son los sistemas de distribución global y cómo funcionan.',
      duration:    '22:00',
      videoType:   'youtube',
      videoUrl:    '',
      contentType: 'video',
      isPreview:   false,
      order:       1,
    },
  });

  console.log('✅ Módulos y clases creados para Agente de Viajes');

  // ── Módulos del Curso 2 (GDS Amadeus) ────────────────────────────────────────
  const mod3 = await prisma.module.upsert({
    where:  { id: 'mod_ama_fundamentos' },
    update: {},
    create: {
      id:          'mod_ama_fundamentos',
      courseId:    course2.id,
      title:       'Fundamentos Amadeus',
      description: 'Acceso al sistema, comandos básicos y disponibilidad.',
      order:       1,
    },
  });

  await prisma.lesson.upsert({
    where:  { id: 'les_ama_acceso' },
    update: {},
    create: {
      id:          'les_ama_acceso',
      moduleId:    mod3.id,
      title:       'Acceso y navegación básica',
      description: 'Primeros pasos en la terminal Amadeus.',
      duration:    '15:00',
      videoType:   'youtube',
      videoUrl:    '',
      contentType: 'video',
      isPreview:   true,
      order:       1,
    },
  });

  console.log('✅ Módulos del GDS Amadeus creados');

  // ── Inscripción demo ──────────────────────────────────────────────────────────
  await prisma.enrollment.upsert({
    where:  { userId_courseId: { userId: student.id, courseId: course1.id } },
    update: {},
    create: {
      userId:          student.id,
      courseId:        course1.id,
      paidAt:          new Date(),
      amount:          89900,
      currency:        'ARS',
      paymentProvider: 'mercadopago',
    },
  });

  console.log('✅ Inscripción demo creada (Juan → Agente de Viajes)');
  console.log('\n🎉 Seed completado!\n');
  console.log('  Admin:   admin@gotravelacademy.com / admin123');
  console.log('  Alumno:  juan@email.com / 123456\n');
}

main()
  .catch(err => { console.error('❌ Error en seed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
