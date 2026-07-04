import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { courses, testimonials, stats, faqs } from '../data/courses';
import CourseCard from '../components/CourseCard';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './Home.css';

const statIcons = { users: '👤', book: '📚', building: '🏢', 'trending-up': '📈' };

const BENEFITS = [
  { icon: '📜', title: 'Certificados reconocidos', desc: 'Avalados por IATA y organismos internacionales del turismo.' },
  { icon: '🎥', title: 'Clases en vivo y grabadas', desc: 'Participá en directo o accedé a las grabaciones cuando quieras.' },
  { icon: '⏰', title: 'Acceso 24/7', desc: 'Aprendé a tu ritmo desde cualquier lugar del mundo.' },
  { icon: '👨‍🏫', title: 'Instructores activos', desc: 'Profesionales que trabajan hoy en la industria turística.' },
  { icon: '📥', title: 'Material descargable', desc: 'Guías, plantillas y recursos exclusivos para tu agencia.' },
  { icon: '🤝', title: 'Comunidad profesional', desc: 'Red de contactos y networking con agentes de todo el país.' },
];

const LOGOS = ['Despegar', 'Almundo', 'Flybondi', 'Latam', 'Aerolíneas', 'TripAdvisor', 'Booking.com', 'Expedia'];

const WHY_ITEMS = [
  { title: 'Instructores activos en la industria', desc: 'No enseñamos teoría desactualizada. Cada instructor trabaja hoy en empresas como Despegar, IATA o Booking.com.' },
  { title: 'Práctica real con sistemas GDS', desc: 'Accedés a simuladores de Amadeus y Sabre idénticos a los que usan las agencias. Llegás listo para trabajar desde el día 1.' },
  { title: 'Comunidad y soporte continuo', desc: 'Grupo activo, tutores disponibles y red de alumni que se ayudan entre sí en la industria.' },
  { title: 'Garantía de 30 días sin preguntas', desc: 'Si en el primer mes el curso no es lo que esperabas, te devolvemos el 100% del dinero.' },
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
  const featured = courses.filter(c => c.featured).slice(0, 4);

  return (
    <div>

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero-grid">

          {/* Left: text */}
          <div className="hero-left">
            <div className="hero-eyebrow">
              <span>✈️</span>
              La plataforma N°1 para agentes de viajes
            </div>

            <h1 className="hero-title">
              Dominá el turismo.<br />
              <span className="hero-title-accent">Transformá tu carrera.</span>
            </h1>

            <p className="hero-desc">
              Formación profesional para agentes de viajes. Cursos con certificado IATA,
              práctica en sistemas GDS y mentores activos en la industria.
            </p>

            <div className="hero-cta">
              <button onClick={() => setAuthModal('register')} className="btn btn-primary btn-lg">
                Comenzá gratis <ArrowRight size={16} />
              </button>
              <Link to="/cursos" className="btn btn-outline btn-lg">
                Ver cursos
              </Link>
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

          {/* Right: visual mockup */}
          <div className="hero-right">
            <div className="hero-mockup">
              {/* Browser chrome */}
              <div className="mockup-chrome">
                <span className="chrome-dot" style={{ background: '#FF5F56' }} />
                <span className="chrome-dot" style={{ background: '#FFBD2E' }} />
                <span className="chrome-dot" style={{ background: '#27C93F' }} />
                <div className="chrome-bar">go-travel-academy.com/cursos</div>
              </div>

              {/* Course preview card */}
              <div className="mockup-body">
                <div className="mockup-course">
                  <img
                    src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80"
                    alt="Course"
                    className="mockup-course-img"
                  />
                  <div className="mockup-course-info">
                    <span className="mockup-badge">Formación</span>
                    <div className="mockup-course-title">Agente de Viajes Profesional</div>
                    <div className="mockup-course-sub">María Eugenia Torres · IATA</div>
                    <div className="mockup-progress-label">
                      <span>Progreso</span>
                      <span className="mockup-pct">68%</span>
                    </div>
                    <div className="mockup-progress-track">
                      <div className="mockup-progress-fill" style={{ width: '68%' }} />
                    </div>
                  </div>
                </div>

                {/* Mini stat badges */}
                <div className="mockup-stats">
                  <div className="mockup-stat">
                    <div className="mockup-stat-val">4</div>
                    <div className="mockup-stat-lbl">Cursos activos</div>
                  </div>
                  <div className="mockup-stat">
                    <div className="mockup-stat-val">2</div>
                    <div className="mockup-stat-lbl">Certificados</div>
                  </div>
                  <div className="mockup-stat">
                    <div className="mockup-stat-val">86h</div>
                    <div className="mockup-stat-lbl">Horas</div>
                  </div>
                </div>
              </div>

              {/* Floating pills */}
              <div className="mockup-pill pill-top">
                🎓 ¡Certificado obtenido!
              </div>
              <div className="mockup-pill pill-bottom">
                ✈️ 98% satisfacción
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGOS BAR ───────────────────────────────────── */}
      <div className="logos-bar">
        <div className="container">
          <p className="logos-label">Empresas que confían en nosotros</p>
          <div className="logos-row">
            {LOGOS.map(name => (
              <span key={name} className="logo-pill">{name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ───────────────────────────────────────── */}
      <div className="stats-bar">
        <div className="container">
          <div className="stats-inner">
            {stats.map(s => (
              <div key={s.label} className="stat-col">
                <span className="stat-icon">{statIcons[s.icon]}</span>
                <span className="stat-num">{s.value}</span>
                <span className="stat-desc">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BENEFITS ────────────────────────────────────── */}
      <section className="benefits-section">
        <div className="container">
          <div className="section-header centered">
            <p className="section-eyebrow">Por qué elegirnos</p>
            <h2 className="section-title">Todo lo que necesitás para crecer</h2>
            <p className="section-lead">Formación diseñada por profesionales de la industria turística para que alcances tu próximo nivel.</p>
          </div>
          <div className="benefits-grid">
            {BENEFITS.map(b => (
              <div key={b.title} className="benefit-card">
                <div className="benefit-icon">{b.icon}</div>
                <h3 className="benefit-title">{b.title}</h3>
                <p className="benefit-desc">{b.desc}</p>
              </div>
            ))}
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
            {featured.map(c => <CourseCard key={c.id} course={c} />)}
          </div>
        </div>
      </section>

      {/* ── WHY US ──────────────────────────────────────── */}
      <section className="why-section">
        <div className="container">
          <div className="why-grid">
            <div className="why-img-wrap">
              <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&q=80" alt="Agentes de viajes aprendiendo" className="why-img" />
              <div className="why-stat-pill">
                <strong>98%</strong>
                <span>de satisfacción<br />en nuestros cursos</span>
              </div>
            </div>
            <div>
              <p className="section-eyebrow">Por qué GO Travel Academy</p>
              <h2 className="section-title">Aprender diferente produce resultados diferentes</h2>
              <div className="why-items">
                {WHY_ITEMS.map((item, i) => (
                  <div key={item.title} className="why-item">
                    <div className="why-item-num">{i + 1}</div>
                    <div>
                      <div className="why-item-title">{item.title}</div>
                      <div className="why-item-desc">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 36 }}>
                <button onClick={() => setAuthModal('register')} className="btn btn-primary">
                  Crear cuenta gratis <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────── */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header centered">
            <p className="section-eyebrow">Testimonios</p>
            <h2 className="section-title">Resultados reales de agentes reales</h2>
            <p className="section-lead">Historias de agentes que usaron GO Travel Academy para dar el salto en su carrera.</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map(t => (
              <div key={t.id} className="testimonial-card">
                <div className="test-stars">
                  {[...Array(t.rating)].map((_, i) => (
                    <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
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
              <p className="cta-lead">Acceso gratuito al primer módulo de cualquier curso. Sin tarjeta de crédito.</p>
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
