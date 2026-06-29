export const initialCourseContent = {
  1: {
    modules: [
      {
        id: 'mod_1',
        title: 'Introducción al Desarrollo Web',
        description: 'Primeros pasos, herramientas y configuración del entorno de trabajo.',
        order: 1,
        lessons: [
          {
            id: 'les_1_1',
            title: 'Bienvenida al curso',
            description: 'Presentación del curso, metodología y lo que vas a aprender en cada módulo.',
            duration: '5:30',
            video: { type: 'youtube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            resources: [],
            isPreview: true,
            order: 1,
          },
          {
            id: 'les_1_2',
            title: 'Instalación del entorno',
            description: 'Instalamos VS Code, Node.js y las extensiones recomendadas para el curso.',
            duration: '12:00',
            video: { type: 'youtube', url: '' },
            resources: [
              { id: 'res_1', name: 'guia-instalacion.pdf', type: 'pdf', size: '2.1 MB' },
            ],
            isPreview: false,
            order: 2,
          },
        ],
      },
      {
        id: 'mod_2',
        title: 'HTML & CSS Fundamentals',
        description: 'Bases del lenguaje de marcado HTML y estilización con CSS moderno.',
        order: 2,
        lessons: [
          {
            id: 'les_2_1',
            title: 'Estructura básica de HTML',
            description: 'Tags semánticos, atributos y estructura del documento HTML5.',
            duration: '18:45',
            video: { type: 'youtube', url: '' },
            resources: [
              { id: 'res_2', name: 'html-cheatsheet.pdf', type: 'pdf', size: '1.4 MB' },
              { id: 'res_3', name: 'ejercicios-html.zip', type: 'zip', size: '512 KB' },
            ],
            isPreview: false,
            order: 1,
          },
          {
            id: 'les_2_2',
            title: 'CSS Flexbox & Grid',
            description: 'Domina los sistemas de layout modernos: Flexbox y CSS Grid.',
            duration: '22:10',
            video: { type: 'vimeo', url: '' },
            resources: [],
            isPreview: false,
            order: 2,
          },
        ],
      },
    ],
  },
  2: {
    modules: [
      {
        id: 'mod_3',
        title: 'Fundamentos de Diseño UX',
        description: 'Principios de diseño centrado en el usuario.',
        order: 1,
        lessons: [
          {
            id: 'les_3_1',
            title: 'Introducción al UX Design',
            description: 'Qué es UX, por qué importa y cómo aplicarlo en proyectos reales.',
            duration: '10:00',
            video: { type: 'youtube', url: '' },
            resources: [],
            isPreview: true,
            order: 1,
          },
        ],
      },
    ],
  },
};
