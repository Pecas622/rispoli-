import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';

async function main() {
  console.log('🌱 Iniciando seed...');

  // ── Users ────────────────────────────────────────────────
  const adminHash   = await bcrypt.hash('admin123', 12);
  const studentHash = await bcrypt.hash('123456',   12);

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@edutech.com' },
    update: {},
    create: {
      name:         'Admin EduTech',
      email:        'admin@edutech.com',
      passwordHash: adminHash,
      role:         'ADMIN',
      avatar:       'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80',
    },
  });

  const student = await prisma.user.upsert({
    where:  { email: 'juan@email.com' },
    update: {},
    create: {
      name:         'Juan Estudiante',
      email:        'juan@email.com',
      passwordHash: studentHash,
      role:         'STUDENT',
      avatar:       'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&q=80',
    },
  });

  console.log('✅ Usuarios creados:', admin.email, student.email);

  // ── Courses ──────────────────────────────────────────────
  const course1 = await prisma.course.upsert({
    where:  { id: 'course_web_fullstack' },
    update: {},
    create: {
      id:            'course_web_fullstack',
      title:         'Desarrollo Web Full Stack',
      subtitle:      'HTML, CSS, JS, React & Node.js',
      description:   'Domina el desarrollo web moderno desde cero. Aprende a crear aplicaciones completas con las tecnologías más demandadas del mercado laboral.',
      category:      'Programación',
      level:         'Principiante',
      modality:      'En vivo',
      duration:      '6 meses',
      hours:         120,
      price:         89900,
      originalPrice: 129900,
      rating:        4.9,
      reviews:       2847,
      students:      12400,
      image:         'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80',
      featured:      true,
    },
  });

  const course2 = await prisma.course.upsert({
    where:  { id: 'course_ux_ui' },
    update: {},
    create: {
      id:            'course_ux_ui',
      title:         'UX/UI Design Profesional',
      subtitle:      'Figma, Design Systems & Prototipado',
      description:   'Aprende a diseñar interfaces digitales centradas en el usuario.',
      category:      'Diseño',
      level:         'Principiante',
      modality:      'Grabado',
      duration:      '4 meses',
      hours:         80,
      price:         74900,
      originalPrice: 109900,
      rating:        4.8,
      reviews:       1923,
      students:      8750,
      image:         'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80',
      featured:      true,
    },
  });

  console.log('✅ Cursos creados:', course1.title, course2.title);

  // ── Modules & Lessons for course 1 ──────────────────────
  const mod1 = await prisma.module.upsert({
    where:  { id: 'mod_intro' },
    update: {},
    create: {
      id:          'mod_intro',
      courseId:    course1.id,
      title:       'Introducción al Desarrollo Web',
      description: 'Primeros pasos y configuración del entorno de trabajo.',
      order:       1,
    },
  });

  await prisma.lesson.upsert({
    where:  { id: 'les_bienvenida' },
    update: {},
    create: {
      id:          'les_bienvenida',
      moduleId:    mod1.id,
      title:       'Bienvenida al curso',
      description: 'Presentación del curso y metodología de trabajo.',
      duration:    '5:30',
      videoType:   'youtube',
      videoUrl:    '',
      isPreview:   true,
      order:       1,
    },
  });

  await prisma.lesson.upsert({
    where:  { id: 'les_instalacion' },
    update: {},
    create: {
      id:          'les_instalacion',
      moduleId:    mod1.id,
      title:       'Instalación del entorno',
      description: 'Instalamos VS Code, Node.js y las extensiones recomendadas.',
      duration:    '12:00',
      videoType:   'youtube',
      videoUrl:    '',
      isPreview:   false,
      order:       2,
    },
  });

  const mod2 = await prisma.module.upsert({
    where:  { id: 'mod_html_css' },
    update: {},
    create: {
      id:          'mod_html_css',
      courseId:    course1.id,
      title:       'HTML & CSS Fundamentals',
      description: 'Bases del lenguaje de marcado y estilización con CSS moderno.',
      order:       2,
    },
  });

  await prisma.lesson.upsert({
    where:  { id: 'les_html_basico' },
    update: {},
    create: {
      id:          'les_html_basico',
      moduleId:    mod2.id,
      title:       'Estructura básica de HTML',
      description: 'Tags semánticos, atributos y estructura del documento HTML5.',
      duration:    '18:45',
      videoType:   'youtube',
      videoUrl:    '',
      isPreview:   false,
      order:       1,
    },
  });

  console.log('✅ Módulos y clases creados');

  // ── Enrollment for demo student ──────────────────────────
  await prisma.enrollment.upsert({
    where:  { userId_courseId: { userId: student.id, courseId: course1.id } },
    update: {},
    create: {
      userId:   student.id,
      courseId: course1.id,
      paidAt:   new Date(),
      amount:   89900,
    },
  });

  console.log('✅ Inscripción de demo creada');
  console.log('\n🎉 Seed completado exitosamente!\n');
  console.log('  Admin:    admin@edutech.com / admin123');
  console.log('  Alumno:   juan@email.com    / 123456\n');
}

main()
  .catch(err => { console.error('❌ Error en seed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
