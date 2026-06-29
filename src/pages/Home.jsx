import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { courses, testimonials, stats, faqs } from '../data/courses';
import CourseCard from '../components/CourseCard';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './Home.css';

const statIcons = { users:'👤', book:'📚', building:'🏢', 'trending-up':'📈' };

export default function Home() {
  const { setAuthModal } = useApp();
  const [openFaq, setOpenFaq] = useState(null);
  const featured = courses.filter(c => c.featured).slice(0, 4);

  return (
    <div>
      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">
            <span className="hero-dot" />
            Plataforma líder en educación tech · LATAM
          </div>
          <h1 className="hero-title">
            Aprendé las<br />
            habilidades que<br />
            <em>el trabajo pide</em>
          </h1>
          <p className="hero-desc">
            Cursos en vivo y grabados de programación, diseño y tecnología.
            Con instructores que trabajan en las empresas más exigentes.
          </p>
          <div className="hero-cta">
            <button onClick={() => setAuthModal('register')} className="btn btn-primary btn-lg">
              Empezar gratis <ArrowRight size={16} />
            </button>
            <Link to="/cursos" className="btn btn-outline btn-lg">
              Ver catálogo
            </Link>
          </div>
          <div className="hero-trust">
            <div className="avatars">
              {['photo-1544005313-94ddf0286df2','photo-1539571696357-5a69c17a67c6','photo-1487412720507-e7ab37603c6f','photo-1506794778202-cad84cf45f1d'].map(p => (
                <img key={p} src={`https://images.unsplash.com/${p}?w=40&q=80`} alt="" className="avatar-sm" />
              ))}
            </div>
            <span>+150.000 estudiantes activos</span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-bar">
        <div className="container">
          <div className="stats-inner">
            {stats.map(s => (
              <div key={s.label} className="stat-col">
                <span className="stat-num">{s.value}</span>
                <span className="stat-desc">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURED COURSES */}
      <section className="courses-section">
        <div className="container">
          <div className="section-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:48 }}>
            <div>
              <p className="label section-label">Cursos destacados</p>
              <h2 className="section-title" style={{marginBottom:0}}>Los más elegidos</h2>
            </div>
            <Link to="/cursos" className="btn btn-outline btn-sm" style={{flexShrink:0}}>
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid-auto">
            {featured.map(c => <CourseCard key={c.id} course={c} />)}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="why-section">
        <div className="container">
          <div className="why-grid">
            <div className="why-img-wrap">
              <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&q=80" alt="Estudiantes" className="why-img" />
              <div className="why-stat-pill">
                <strong>95%</strong>
                <span>consiguió empleo<br/>en 6 meses</span>
              </div>
            </div>
            <div>
              <p className="label section-label">Por qué EduTech</p>
              <h2 className="section-title">Aprender diferente produce resultados diferentes</h2>
              <div className="why-items">
                {[
                  { title: 'Instructores activos en la industria', desc: 'No enseñamos teoría vieja. Cada instructor trabaja hoy en empresas como Google, Meta o Mercado Libre.' },
                  { title: 'Proyectos reales para tu portfolio', desc: 'Cada módulo termina en algo concreto. Salís con trabajo propio que podés mostrar a empleadores.' },
                  { title: 'Comunidad y soporte continuo', desc: 'Discord activo, tutores disponibles y red de alumni que se ayudan entre sí.' },
                  { title: 'Garantía de 30 días sin preguntas', desc: 'Si en el primer mes el curso no es lo que esperabas, te devolvemos el dinero.' },
                ].map((item, i) => (
                  <div key={item.title} className="why-item">
                    <div className="why-item-num">{i + 1}</div>
                    <div>
                      <div className="why-item-title">{item.title}</div>
                      <div className="why-item-desc">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:36}}>
                <button onClick={() => setAuthModal('register')} className="btn btn-primary">
                  Crear cuenta gratis <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header centered">
            <p className="label section-label">Testimonios</p>
            <h2 className="section-title">Resultados reales</h2>
            <p className="section-lead">Historias de personas que usaron EduTech para cambiar de carrera o avanzar en la que tenían.</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map(t => (
              <div key={t.id} className="testimonial-card card">
                <div className="test-stars">
                  {[...Array(t.rating)].map((_, i) => (
                    <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  ))}
                </div>
                <p className="test-body">{t.text}</p>
                <div className="test-author">
                  <img src={t.avatar} alt={t.name} className="test-avatar" />
                  <div>
                    <div className="test-name">{t.name}</div>
                    <div className="test-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <div className="container">
          <div className="section-header centered">
            <p className="label section-label">FAQ</p>
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

      {/* CTA */}
      <section className="cta-strip">
        <div className="container">
          <div className="cta-inner">
            <div className="cta-text">
              <h2>¿Listo para empezar?</h2>
              <p>Acceso gratuito al primer módulo de cualquier curso.</p>
            </div>
            <div className="cta-actions">
              <button onClick={() => setAuthModal('register')} className="btn btn-primary btn-lg">
                Crear cuenta gratis
              </button>
              <Link to="/cursos" className="btn btn-outline btn-lg">Ver cursos</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
