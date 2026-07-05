import { Link } from 'react-router-dom';
import { ArrowRight, Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { courses as mockCourses, testimonials, faqs } from '../data/courses';
import { coursesApi } from '../services/api';
import CourseCard from '../components/CourseCard';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import './Home.css';

const USE_API = import.meta.env.VITE_USE_API === 'true';

const ALLIES = [
  { name: 'Rispoli Viajes', src: '/alianzas/rispoli-viajes.png', color: '#FF2F00' },
  { name: 'Universidad del Aconcagua', src: '/alianzas/aconcagua.png', color: '#3F9BC4', plain: true },
  { name: 'Rispoli Teens', src: '/alianzas/rispoli-teens.png', color: '#F3769E' },
];

const LEARN = [
  'Cotizar vuelos y hoteles',
  'Armar paquetes turísticos',
  'Manejar clientes reales',
  'Evitar errores comunes de venta',
  'Usar sistemas profesionales como el NDC y centrales de reservas de servicios terrestres',
];

const INCLUDES = [
  'Certificado avalado por la Universidad del Aconcagua',
  'Formación práctica con casos reales',
  'Acceso a clases grabadas',
  'Uso de sistemas profesionales',
];

const HIGHLIGHTS = [
  { title: 'Formación práctica', desc: 'Aprendé con casos reales.' },
  { title: 'Herramientas', desc: 'Sistemas del rubro turístico y preparación para trabajar en turismo.' },
];

const AVATAR_IDS = [
  'photo-1544005313-94ddf0286df2',
  'photo-1539571696357-5a69c17a67c6',
  'photo-1487412720507-e7ab37603c6f',
  'photo-1506794778202-cad84cf45f1d',
];

export default function Home() {
  const { setAuthModal } = useApp();
  const [openFaq, setOpenFaq] = useState(null);
  const [courses, setCourses] = useState(USE_API ? [] : mockCourses);

  useEffect(() => {
    if (!USE_API) return;
    coursesApi.list().then(res => setCourses(res.courses)).catch(() => setCourses([]));
  }, []);

  // Carrusel de cursos: 2 actuales (Agente + GDS Amadeus) + 1 próximamente. Central + laterales, bucle infinito.
  const carouselCourses = [1, 2].map(id => courses.find(c => c.id === id)).filter(Boolean);
  const slides = [
    ...carouselCourses.map(c => ({ ...c, kind: 'course' })),
    {
      kind: 'soon',
      id: 'soon',
      category: 'Próximamente',
      title: 'IA aplicada al turismo',
      subtitle: 'Automatizá tu agencia y vendé más usando inteligencia artificial.',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
    },
  ];
  const n = slides.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const nextSlide = () => setActiveIndex(i => (i + 1) % n);
  const prevSlide = () => setActiveIndex(i => (i - 1 + n) % n);
  const slidePos = (i) => {
    const r = ((i - activeIndex) % n + n) % n;
    if (r === 0) return 'is-center';
    if (r === 1) return 'is-right';
    if (r === n - 1) return 'is-left';
    return 'is-hidden';
  };

  // Barra fija con CTA a cursos: aparece cuando el carrusel queda arriba (fuera de vista)
  const carouselRef = useRef(null);
  const [showCtaBar, setShowCtaBar] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const el = carouselRef.current;
      if (el) setShowCtaBar(el.getBoundingClientRect().bottom < 70);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Testimonios: carrusel de a uno, con auto-avance cada 4s (se reinicia al interactuar)
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
  useEffect(() => {
    const id = setInterval(() => setTestIndex(i => (i + 1) % testimonials.length), 4000);
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
            Convertite en <span className="hero-title-accent">agente de viajes</span> con clases 100% online
          </h1>

          <p className="hero-desc">
            Aprendé a cotizar vuelos y hoteles, armar paquetes y manejar clientes reales
            con casos prácticos y sistemas profesionales del rubro. Certificado avalado
            por la Universidad del Aconcagua.
          </p>

          {/* Carrusel de cursos, justo debajo del texto secundario */}
          <div className="hc-block" ref={carouselRef}>
            <div className="hc-carousel">
              <button className="hc-arrow hc-arrow-prev" onClick={prevSlide} aria-label="Anterior">
                <ChevronLeft size={22} />
              </button>

              <div className="hc-stage">
                {slides.map((s, i) => (
                  <article
                    className={`hc-card ${slidePos(i)} ${s.kind === 'soon' ? 'hc-card-soon' : ''}`}
                    key={s.id}
                    onClick={() => { if (slidePos(i) !== 'is-center') setActiveIndex(i); }}
                  >
                    <div className="hc-card-media">
                      <img src={s.image} alt={s.title} />
                      <span className={`hc-badge ${s.kind === 'soon' ? 'hc-badge-soon' : ''}`}>{s.category}</span>
                    </div>
                    <div className="hc-card-body">
                      <h3 className="hc-card-title">{s.title}</h3>
                      <p className="hc-card-sub">{s.subtitle}</p>
                      {s.kind === 'course' ? (
                        <>
                          <div className="hc-card-meta">
                            <span>{s.level}</span><span>·</span><span>{s.duration}</span>
                          </div>
                          <div className="hc-card-foot">
                            <span className="hc-price">${(s.priceARS ?? s.price).toLocaleString('es-AR')}</span>
                            <Link to="/cursos" className="hc-card-btn">Ver curso</Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="hc-card-meta"><span>Muy pronto</span></div>
                          <div className="hc-card-foot">
                            <span className="hc-soon-note">Lanzamiento próximo</span>
                            <button className="hc-card-btn hc-card-btn-ghost" onClick={(e) => { e.stopPropagation(); setAuthModal('register'); }}>Avisame</button>
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <button className="hc-arrow hc-arrow-next" onClick={nextSlide} aria-label="Siguiente">
                <ChevronRight size={22} />
              </button>
            </div>

            <div className="hc-dots">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  className={`hc-dot ${activeIndex === i ? 'active' : ''}`}
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Ir al curso ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="hero-trust">
            <div className="avatars">
              {AVATAR_IDS.map(p => (
                <img key={p} src={`https://images.unsplash.com/${p}?w=40&q=80`} alt="" className="avatar-sm" />
              ))}
            </div>
            <span>Más de 12.000 agentes certificados</span>
          </div>
        </div>
      </section>

      {/* ── ALIANZAS PROFESIONALES (cinta dinámica de logos) ─── */}
      <div className="allies-bar">
        <div className="container">
          <p className="allies-label">Alianzas profesionales</p>
        </div>
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

            <div className="test-stage">
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
                    <p className="test-body">"{t.text}"</p>
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

      {/* ── WHY US ──────────────────────────────────────── */}
      <section className="why-section">
        <div className="container">
          <div className="section-header centered">
            <p className="section-eyebrow">Por qué Go Travel Academy</p>
            <h2 className="section-title">Aprender diferente produce resultados diferentes</h2>
          </div>

          <div className="course-info-grid">
            <div className="course-info-card">
              <h3 className="course-info-title">¿Qué vas a aprender?</h3>
              <ul className="course-info-list">
                {LEARN.map(item => (
                  <li key={item}><Check size={18} strokeWidth={2.5} /><span>{item}</span></li>
                ))}
              </ul>
            </div>
            <div className="course-info-card course-info-card--includes">
              <h3 className="course-info-title">¿Qué incluye este curso?</h3>
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
      <section className="courses-section">
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
            {slides.map(s => (
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
                      <span className="hc-soon-note">Lanzamiento próximo</span>
                      <button className="cc-cta-btn" onClick={() => setAuthModal('register')}>Avisame</button>
                    </div>
                  </article>
                )
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
