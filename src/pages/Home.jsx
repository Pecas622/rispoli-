import { Link } from 'react-router-dom';
import { ArrowRight, Plus, ChevronLeft, ChevronRight, Check, Video, Award, Briefcase, Globe } from 'lucide-react';
import { courses as mockCourses, testimonials, faqs } from '../data/courses';
import { coursesApi } from '../services/api';
import CourseCard from '../components/CourseCard';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useSEO } from '../hooks/useSEO';
import './Home.css';

const USE_API = import.meta.env.VITE_USE_API === 'true';

const ALLIES = [
  { name: 'Universidad del Aconcagua', src: '/alianzas/aconcagua.png', color: '#3F9BC4', plain: true },
  { name: 'Go Travel Academy', src: '/logoo.png', color: '#2E63D6', plain: true },
];

// Pilares de la plataforma: van en el hero, en lugar del carrusel de cursos
// con precios (el precio solo se muestra en la ficha de cada curso).
const PILLARS = [
  { icon: Video,     title: '100% online',        desc: 'Clases grabadas, a tu ritmo y desde cualquier lugar.' },
  { icon: Award,     title: 'Certificado',        desc: 'Al terminar cada curso. El de Agente de Viajes, avalado por la Universidad del Aconcagua.' },
  { icon: Briefcase, title: 'Casos reales',       desc: 'Sistemas y situaciones del trabajo diario en turismo.' },
  { icon: Globe,     title: 'Toda Latinoamérica', desc: 'Alumnos de toda la región aprendiendo con nosotros.' },
];

const LEARN = [
  'Cursos para trabajar en turismo: desde agente de viajes hasta destinos específicos',
  'Clases 100% online y grabadas, para ver a tu ritmo desde cualquier país',
  'Casos reales y sistemas profesionales del rubro',
  'Docentes que trabajan hoy en la industria',
  'Acompañamiento para dar el salto a vender viajes',
];

const INCLUDES = [
  'Certificado al finalizar cada curso',
  'Acceso inmediato a las clases grabadas',
  'Material descargable de cada clase',
  'Foro de preguntas por clase, respondidas por el equipo',
];

const HIGHLIGHTS = [
  { title: 'Formación práctica', desc: 'Aprendé con casos reales, no con teoría.' },
  { title: 'Herramientas del rubro', desc: 'Sistemas profesionales y preparación real para trabajar en turismo.' },
];

const ORG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type':    'EducationalOrganization',
  name:        'Go Travel Academy',
  url:         'https://gotravelacademy.com',
  logo:        'https://gotravelacademy.com/gta-logo.jpeg',
  description: 'Formación 100% online para agentes de viajes, con casos reales y certificado avalado por la Universidad del Aconcagua.',
  sameAs: [
    'https://www.instagram.com/go.travelacademy/',
    'https://www.facebook.com/profile.php?id=61576498965707',
  ],
};

export default function Home() {
  const { setAuthModal } = useApp();
  const [openFaq, setOpenFaq] = useState(null);
  const [courses, setCourses] = useState(USE_API ? [] : mockCourses);

  useSEO({ path: '/', jsonLd: ORG_JSON_LD });

  useEffect(() => {
    if (!USE_API) return;
    coursesApi.list().then(res => setCourses(res.courses)).catch(() => setCourses([]));
  }, []);

  // "Los más elegidos": los cursos en venta primero y, al final, el próximo a
  // lanzar (precio 0) como tarjeta "próximamente".
  const comingSoon = courses.find(c => c.price === 0);
  const featured = [
    ...courses.filter(c => c.price > 0).map(c => ({ ...c, kind: 'course' })),
    ...(comingSoon ? [{ ...comingSoon, kind: 'soon', subtitle: comingSoon.subtitle ?? '' }] : []),
  ];

  // Barra fija con CTA a cursos: aparece recién cuando la sección "Cursos
  // destacados" llega a la parte de arriba de la pantalla (debajo del navbar).
  const coursesRef = useRef(null);
  const [showCtaBar, setShowCtaBar] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const el = coursesRef.current;
      if (el) setShowCtaBar(el.getBoundingClientRect().top <= 80);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Testimonios: en celular el texto se recorta a unas líneas con un "Leer
  // más" que lo expande. Solo se ofrece el botón en las reseñas que
  // realmente quedaron recortadas (se mide al montar y al cambiar el ancho).
  const testBodyRefs = useRef([]);
  const [clampedTests, setClampedTests] = useState([]);   // índices recortados
  const [expandedTests, setExpandedTests] = useState([]); // índices expandidos
  useEffect(() => {
    const measure = () => {
      setClampedTests(testBodyRefs.current.flatMap((el, i) =>
        el && el.scrollHeight > el.clientHeight + 1 ? [i] : []));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [expandedTests]);
  const toggleTest = (i) => setExpandedTests(prev =>
    prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  // Testimonios: carrusel de a uno, con auto-avance cada 6s (se reinicia al interactuar)
  const [testIndex, setTestIndex] = useState(0);
  const nextTest = () => setTestIndex(i => (i + 1) % testimonials.length);
  const prevTest = () => setTestIndex(i => (i - 1 + testimonials.length) % testimonials.length);
  const testPos = (i) => {
    const nT = testimonials.length;
    const r = ((i - testIndex) % nT + nT) % nT;
    if (r === 0) return 'is-center';
    if (r === 1) return 'is-right';
    if (r === nT - 1) return 'is-left';
    return 'is-hidden';
  };
  // En celular el carrusel es una pista con scroll nativo (se arrastra con el
  // dedo). Cuando cambia el índice (flechas, puntos, autoavance) se desplaza
  // la pista hasta esa tarjeta; y cuando la persona arrastra, se lee qué
  // tarjeta quedó centrada para actualizar el índice.
  const testTrackRef = useRef(null);
  const testTouching = useRef(false);
  const testSnapTimer = useRef(null);
  const isTestTrack = () => window.matchMedia('(max-width: 768px)').matches;
  const testCardOffset = (track, card) => card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
  useEffect(() => {
    const track = testTrackRef.current;
    if (!track || !isTestTrack()) return;
    const card = track.children[testIndex];
    if (card) track.scrollTo({ left: testCardOffset(track, card), behavior: 'smooth' });
  }, [testIndex]);
  const onTestScroll = () => {
    const track = testTrackRef.current;
    if (!track || !isTestTrack()) return;
    clearTimeout(testSnapTimer.current);
    // 150 ms sin eventos de scroll = la pista se detuvo (un desplazamiento
    // suave en curso dispara eventos en cada cuadro, así que no se lee a mitad).
    testSnapTimer.current = setTimeout(() => {
      let best = 0, bestDist = Infinity;
      [...track.children].forEach((card, i) => {
        const d = Math.abs(testCardOffset(track, card) - track.scrollLeft);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      setTestIndex(best);
    }, 150);
  };

  // Autoavance cada 6 s. Se reinicia al interactuar (cambia testIndex) y no
  // avanza mientras hay un dedo apoyado en la pista.
  useEffect(() => {
    const id = setInterval(() => {
      if (testTouching.current) return;
      setTestIndex(i => (i + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(id);
  }, [testIndex]);

  return (
    <div>

      {/* Barra fija con CTA a cursos, aparece al pasar el carrusel */}
      <div className={`course-cta-bar ${showCtaBar ? 'show' : ''}`}>
        <div className="container course-cta-bar-inner">
          <span className="course-cta-bar-text">Empezá tu carrera de agente de viajes</span>
          <Link to="/cursos" className="btn btn-primary btn-sm">
            Ver cursos <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="hero">
        {/* Fondo: nubes en bucle continuo + ala fija camuflada */}
        <div className="hero-clouds" aria-hidden="true" />
        <div className="hero-wing" aria-hidden="true" />

        <div className="container hero-inner">
          <div className="hero-eyebrow">
            <span>✈️</span>
            La plataforma N°1 para agentes de viajes
          </div>

          <h1 className="hero-title">
            Convertite en <span className="hero-title-accent">Agente de Viajes</span> con clases 100% online
          </h1>

          <p className="hero-desc">
            Aprendé a cotizar vuelos y hoteles, armar paquetes y manejar clientes reales
            con casos prácticos y sistemas profesionales del rubro. Certificado avalado
            por la Universidad del Aconcagua.
          </p>

          {/* Pilares de la plataforma (reemplaza al carrusel de cursos con precios) */}
          <div className="hero-pillars">
            {PILLARS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="hero-pillar">
                <span className="hero-pillar-icon"><Icon size={20} strokeWidth={2} /></span>
                <h3 className="hero-pillar-title">{title}</h3>
                <p className="hero-pillar-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALIANZAS PROFESIONALES (cinta dinámica de logos) ─── */}
      <div className="allies-bar">
        <div className="allies-marquee">
          <div className="allies-track">
            {Array.from({ length: 8 }).flatMap((_, g) =>
              ALLIES.map((a, i) => (
                a.plain ? (
                  <div
                    className="allies-item allies-item-plain"
                    key={`${g}-${i}`}
                    role="img"
                    aria-label={g > 0 ? undefined : a.name}
                    aria-hidden={g > 0 ? 'true' : undefined}
                  >
                    <img src={a.src} alt="" />
                  </div>
                ) : (
                  <div
                    className="allies-item"
                    key={`${g}-${i}`}
                    role="img"
                    aria-label={g > 0 ? undefined : a.name}
                    aria-hidden={g > 0 ? 'true' : undefined}
                    style={{ '--logo': `url(${a.src})`, '--logo-color': a.color }}
                  />
                )
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── WHY US ──────────────────────────────────────── */}
      <section className="why-section">
        <div className="container">
          <div className="section-header centered">
            <p className="section-eyebrow">Por qué Go Travel Academy</p>
            <h2 className="section-title">Aprender diferente produce resultados diferentes</h2>
          </div>

          <div className="course-info-grid">
            <div className="course-info-card">
              <h3 className="course-info-title">¿Qué vas a encontrar en Go Travel Academy?</h3>
              <ul className="course-info-list">
                {LEARN.map(item => (
                  <li key={item}><Check size={18} strokeWidth={2.5} /><span>{item}</span></li>
                ))}
              </ul>
            </div>
            <div className="course-info-card course-info-card--includes">
              <h3 className="course-info-title">¿Qué incluyen los cursos?</h3>
              <ul className="course-info-list">
                {INCLUDES.map(item => (
                  <li key={item}><Check size={18} strokeWidth={2.5} /><span>{item}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="course-highlights">
            {HIGHLIGHTS.map(h => (
              <div key={h.title} className="course-highlight">
                <h4>{h.title}</h4>
                <p>{h.desc}</p>
              </div>
            ))}
          </div>

          <div className="course-info-cta">
            <Link to="/cursos" className="btn btn-primary btn-lg">
              Ver cursos <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURED COURSES ────────────────────────────── */}
      <section className="courses-section" ref={coursesRef}>
        <div className="container">
          <div className="section-header split">
            <div>
              <p className="section-eyebrow">Cursos destacados</p>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Los más elegidos</h2>
            </div>
            <Link to="/cursos" className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid-auto">
            {featured.map(s => (
              s.kind === 'course'
                ? <CourseCard key={s.id} course={s} />
                : (
                  <article key={s.id} className="course-card">
                    <div className="cc-image-wrap">
                      <img src={s.image} alt={s.title} className="cc-image" loading="lazy" />
                      <span className="cc-cat-badge">Próximamente</span>
                    </div>
                    <div className="cc-body">
                      <div className="cc-level-row">
                        <span className="cc-level-pill" style={{ background: '#E8F1FD', color: '#2E63D6' }}>Nuevo</span>
                      </div>
                      <h3 className="cc-title">{s.title}</h3>
                      <p className="cc-soon-desc">{s.subtitle}</p>
                    </div>
                    <div className="cc-footer">
                      <span className="cc-soon-note">Lanzamiento próximo</span>
                    </div>
                  </article>
                )
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────── */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header centered">
            <p className="section-eyebrow">Testimonios</p>
            <h2 className="section-title">Resultados reales de agentes reales</h2>
            <p className="section-lead">Historias de agentes que usaron Go Travel Academy para dar el salto en su carrera.</p>
          </div>
          <div className="test-carousel">
            <button className="test-arrow test-arrow-prev" onClick={prevTest} aria-label="Anterior">
              <ChevronLeft size={22} />
            </button>

            <div
              className="test-stage"
              ref={testTrackRef}
              onScroll={onTestScroll}
              onTouchStart={() => { testTouching.current = true; }}
              onTouchEnd={() => { testTouching.current = false; }}
            >
              {testimonials.map((t, i) => (
                <div
                  key={t.id}
                  className={`test-card-wrap ${testPos(i)}`}
                  onClick={() => { if (testPos(i) !== 'is-center') setTestIndex(i); }}
                >
                  <div className="testimonial-card testimonial-card--solo">
                    <div className="test-stars">
                      {[...Array(t.rating)].map((_, i2) => (
                        <svg key={i2} width="15" height="15" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                      ))}
                    </div>
                    <p
                      className={`test-body ${expandedTests.includes(i) ? '' : 'is-clamped'}`}
                      ref={el => { testBodyRefs.current[i] = el; }}
                    >
                      "{t.text}"
                    </p>
                    {(clampedTests.includes(i) || expandedTests.includes(i)) && (
                      <button type="button" className="test-more" onClick={e => { e.stopPropagation(); toggleTest(i); }}>
                        {expandedTests.includes(i) ? 'Leer menos' : 'Leer más'}
                      </button>
                    )}
                    <div className="test-footer">
                      <img src={t.avatar} alt={t.name} className="test-avatar" />
                      <div>
                        <div className="test-name">{t.name}</div>
                        <div className="test-role">{t.role}</div>
                      </div>
                      <div className="test-course-tag">{t.course}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="test-arrow test-arrow-next" onClick={nextTest} aria-label="Siguiente">
              <ChevronRight size={22} />
            </button>
          </div>

          <div className="test-dots">
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                className={`test-dot ${testIndex === i ? 'active' : ''}`}
                onClick={() => setTestIndex(i)}
                aria-label={`Testimonio ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section className="faq-section">
        <div className="container">
          <div className="section-header centered">
            <p className="section-eyebrow">FAQ</p>
            <h2 className="section-title">Preguntas frecuentes</h2>
          </div>
          <div className="faq-list">
            {faqs.map((f, i) => (
              <div key={i} className="faq-item" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="faq-q">
                  <span>{f.q}</span>
                  <Plus size={16} className={`faq-q-icon ${openFaq === i ? 'open' : ''}`} />
                </div>
                {openFaq === i && <p className="faq-a">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ───────────────────────────────────── */}
      <section className="cta-strip">
        <div className="container">
          <div className="cta-inner">
            <div className="cta-text">
              <p className="cta-eyebrow">¿Listo para despegar?</p>
              <h2 className="cta-title">Empezá tu carrera en turismo hoy</h2>
              <p className="cta-lead">La plataforma N°1 para agentes de viajes: formación 100% online, práctica con sistemas reales y certificado avalado por la Universidad del Aconcagua.</p>
            </div>
            <div className="cta-actions">
              <button onClick={() => setAuthModal('register')} className="btn cta-btn-primary btn-lg">
                Crear cuenta gratis <ArrowRight size={16} />
              </button>
              <Link to="/cursos" className="btn cta-btn-outline btn-lg">Ver cursos</Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
