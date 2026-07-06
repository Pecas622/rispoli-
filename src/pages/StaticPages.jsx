import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PageShell = ({ label, title, lead, children }) => (
  <div style={{paddingTop:80}}>
    <div style={{padding:'56px 0 48px',borderBottom:'1px solid var(--border)'}}>
      <div className="container">
        <p className="label" style={{marginBottom:12}}>{label}</p>
        <h1 style={{fontFamily:'var(--display)',fontSize:'clamp(32px,5vw,56px)',fontWeight:800,letterSpacing:'-0.03em',marginBottom:16}}>{title}</h1>
        {lead && <p style={{fontSize:17,color:'var(--text-2)',lineHeight:1.75,maxWidth:520}}>{lead}</p>}
      </div>
    </div>
    <div className="container" style={{paddingBottom:96,paddingTop:64}}>{children}</div>
  </div>
);

const logos = ['Google','Meta','Amazon','Mercado Libre','Globant','Rappi','Despegar','OLX','Accenture','IBM','Oracle','SAP'];

export function Empresas() {
  const { setAuthModal } = useApp();
  return (
    <PageShell label="Soluciones corporativas" title="Go Travel Academy para empresas" lead="Potenciá el talento de tu equipo con programas de capacitación a medida, diseñados junto a líderes de la industria.">
      <div className="grid-4" style={{marginBottom:64}}>
        {[
          { icon:'🎯', title:'Hasta 500+ personas', desc:'Planes para equipos de cualquier tamaño con gestión centralizada.' },
          { icon:'📋', title:'Contenido personalizado', desc:'Desarrollamos cursos específicos para tus tecnologías y procesos.' },
          { icon:'📊', title:'Reportes y analytics', desc:'Dashboard con métricas de progreso, engagement y ROI de capacitación.' },
          { icon:'🤝', title:'Soporte dedicado', desc:'Customer success manager asignado y SLA garantizado.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} style={{padding:'24px',border:'1px solid var(--border)',borderRadius:'var(--r-lg)'}}>
            <div style={{fontSize:28,marginBottom:14}}>{icon}</div>
            <h3 style={{fontSize:15,fontWeight:600,marginBottom:8}}>{title}</h3>
            <p style={{fontSize:13,color:'var(--text-2)',lineHeight:1.7}}>{desc}</p>
          </div>
        ))}
      </div>
      <div style={{marginBottom:64}}>
        <p className="label" style={{marginBottom:20}}>Empresas que confían en nosotros</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
          {logos.map(logo=>(
            <div key={logo} style={{padding:'8px 18px',border:'1px solid var(--border)',borderRadius:'var(--r-sm)',fontSize:13,fontWeight:500,color:'var(--text-2)'}}>{logo}</div>
          ))}
        </div>
      </div>
      <button onClick={()=>setAuthModal('register')} className="btn btn-primary btn-lg">Solicitar demo <ArrowRight size={15}/></button>
    </PageShell>
  );
}

export function Nosotros() {
  return (
    <PageShell
      label="Nuestra historia"
      title="La escuela de agentes de viajes de Rispoli"
      lead="Formación creada por una de las agencias más reconocidas de Argentina. 100% práctica y enfocada en los destinos que de verdad cuesta vender."
    >
      {/* ── El fundador ── */}
      <div style={{display:'grid',gridTemplateColumns:'0.85fr 1.15fr',gap:56,alignItems:'center',marginBottom:64}}>
        <img src="/lucio-rispoli.png" alt="Lucio Rispoli, fundador de Go Travel Academy" style={{width:'100%',height:420,objectFit:'cover',objectPosition:'center 22%',borderRadius:'var(--r-lg)',border:'1px solid var(--border)'}} />
        <div>
          <p className="label" style={{marginBottom:12,color:'var(--violet-mid)'}}>El fundador</p>
          <h2 style={{fontFamily:'var(--display)',fontSize:30,fontWeight:800,letterSpacing:'-0.02em',marginBottom:4}}>Lucio Rispoli</h2>
          <p style={{fontSize:14,color:'var(--text-3)',marginBottom:22}}>Fundador de Go Travel Academy · +12 años en la industria de viajes</p>
          <p style={{color:'var(--text-2)',lineHeight:1.9,fontSize:15,marginBottom:20}}>Más de 12 años vendiendo viajes en una de las agencias más tradicionales y reconocidas de Argentina. Acompañó a miles de viajeros a los destinos más variados del mundo: de Europa a Asia, Estados Unidos, el Caribe y Sudamérica.</p>
          <p style={{fontFamily:'var(--display)',fontSize:'clamp(18px,2vw,22px)',fontWeight:700,letterSpacing:'-0.02em',lineHeight:1.4,color:'var(--text)'}}>“Viajar transforma, y mi trabajo es ser el puente entre ese deseo y la vivencia concreta.”</p>
        </div>
      </div>

      {/* ── Por qué existe ── */}
      <div style={{maxWidth:760,marginBottom:56}}>
        <p className="label" style={{marginBottom:16,color:'var(--violet-mid)'}}>Por qué existe</p>
        <h2 style={{fontFamily:'var(--display)',fontSize:'clamp(24px,3vw,32px)',fontWeight:800,letterSpacing:'-0.02em',lineHeight:1.2,marginBottom:20}}>Una escuela hecha por quienes venden viajes todos los días</h2>
        <p style={{color:'var(--text-2)',lineHeight:1.9,fontSize:15}}>Faltaba una formación realmente práctica, con las habilidades que pide el mercado y no teoría desactualizada. Por eso nace Go Travel Academy: para que aprendas desde cero o te profesionalices como agente de viajes, con casos reales, sistemas del rubro y foco en los destinos más difíciles de vender —justo donde Rispoli tiene décadas de experiencia.</p>
      </div>

      {/* ── Pilares ── */}
      <div className="grid-3">
        {[
          {t:'Experiencia real',d:'Aprendés de quienes venden viajes de verdad, todos los días. Nada de teoría desactualizada.'},
          {t:'100% práctico',d:'Casos reales y las habilidades concretas que el mercado laboral le pide a un agente de viajes.'},
          {t:'Destinos que cuestan vender',d:'Nos especializamos en los destinos más difíciles, donde Rispoli tiene décadas de trayectoria.'},
        ].map(({t,d})=>(
          <div key={t} style={{padding:'24px',border:'1px solid var(--border)',borderRadius:'var(--r-lg)'}}>
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:8}}>{t}</h3>
            <p style={{fontSize:13.5,color:'var(--text-2)',lineHeight:1.7}}>{d}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

const posts = [
  {title:'10 razones para aprender a programar en 2026',cat:'Programación',date:'12 Jun 2026',img:'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=80',author:'Carlos Méndez'},
  {title:'La guía definitiva de UX Research para principiantes',cat:'Diseño',date:'8 Jun 2026',img:'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&q=80',author:'Ana Rodríguez'},
  {title:'ChatGPT y el futuro del marketing digital',cat:'Marketing',date:'3 Jun 2026',img:'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',author:'Valentina Torres'},
  {title:'Cómo conseguir tu primer trabajo como Data Scientist',cat:'Data Science',date:'28 May 2026',img:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',author:'Diego Fernández'},
  {title:'React vs Vue vs Angular en 2026',cat:'Programación',date:'22 May 2026',img:'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80',author:'Laura Giménez'},
  {title:'Ciberseguridad: amenazas clave en 2026',cat:'Tecnología',date:'18 May 2026',img:'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&q=80',author:'Martín Vargas'},
];

export function Blog() {
  return (
    <PageShell label="Recursos gratuitos" title="Blog" lead="Artículos, tutoriales y guías escritas por profesionales de la industria.">
      <div className="grid-auto">
        {posts.map(p=>(
          <article key={p.title} style={{border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden',cursor:'pointer',transition:'border-color 0.2s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-2)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
            <img src={p.img} alt={p.title} style={{width:'100%',height:180,objectFit:'cover',display:'block'}} />
            <div style={{padding:'18px 20px'}}>
              <span className="badge badge-default" style={{marginBottom:10,display:'inline-flex'}}>{p.cat}</span>
              <h3 style={{fontSize:15,fontWeight:600,lineHeight:1.4,marginBottom:12}}>{p.title}</h3>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-3)'}}>
                <span>{p.author}</span><span>{p.date}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

export function Contacto() {
  const { showToast } = useApp();
  const handleSubmit = e => { e.preventDefault(); showToast('Mensaje enviado. Te respondemos pronto'); e.target.reset(); };
  return (
    <PageShell label="Contacto" title="Hablemos" lead="¿Tenés dudas? Nuestro equipo te responde en menos de 24 horas.">
      <div style={{maxWidth:560}}>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:500,color:'var(--text-3)',marginBottom:6}}>Nombre</label>
              <input required className="input" type="text" placeholder="Tu nombre"/>
            </div>
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:500,color:'var(--text-3)',marginBottom:6}}>Email</label>
              <input required className="input" type="email" placeholder="tu@email.com"/>
            </div>
          </div>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:500,color:'var(--text-3)',marginBottom:6}}>Asunto</label>
            <select className="input">
              {['Consulta sobre un curso','Problemas técnicos','Facturación y pagos','Propuesta empresas','Otro'].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:500,color:'var(--text-3)',marginBottom:6}}>Mensaje</label>
            <textarea required className="input" rows={5} placeholder="¿En qué podemos ayudarte?"/>
          </div>
          <div>
            <button type="submit" className="btn btn-primary btn-lg">Enviar mensaje <ArrowRight size={15}/></button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
