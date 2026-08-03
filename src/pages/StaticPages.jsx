import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSEO } from '../hooks/useSEO';
import { contactApi } from '../services/api';

const PageShell = ({ label, title, lead, path, children }) => {
  useSEO({ title: `${title} — Go Travel Academy`, description: lead, path });
  return (
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
};

const logos = ['Google','Meta','Amazon','Mercado Libre','Globant','Rappi','Despegar','OLX','Accenture','IBM','Oracle','SAP'];

export function Empresas() {
  const { setAuthModal } = useApp();
  return (
    <PageShell path="/empresas" label="Soluciones corporativas" title="Go Travel Academy para empresas" lead="Potenciá el talento de tu equipo con programas de capacitación a medida, diseñados junto a líderes de la industria.">
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
      path="/nosotros"
      label="Nuestra historia"
      title="La escuela de agentes de viajes de Lucio Rispoli"
      lead="Formación creada por una de las agencias más reconocidas de Argentina. 100% práctica y enfocada en los destinos que de verdad cuesta vender."
    >
      {/* ── El fundador ── */}
      <div style={{display:'grid',gridTemplateColumns:'0.85fr 1.15fr',gap:56,alignItems:'center',marginBottom:64}}>
        <img src="/luciorispoli.jpg" alt="Lucio Rispoli, fundador de Go Travel Academy" style={{width:'100%',height:420,objectFit:'cover',objectPosition:'center 22%',borderRadius:'var(--r-lg)',border:'1px solid var(--border)'}} />
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
    <PageShell path="/blog" label="Recursos gratuitos" title="Blog" lead="Artículos, tutoriales y guías escritas por profesionales de la industria.">
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
  const [form, setForm] = useState({ name: '', email: '', subject: 'Consulta sobre un curso', message: '' });
  const [sending, setSending] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSending(true);
    try {
      await contactApi.send(form);
      showToast('Mensaje enviado. Te respondemos pronto');
      setForm({ name: '', email: '', subject: 'Consulta sobre un curso', message: '' });
    } catch (err) {
      showToast(err.message || 'No se pudo enviar el mensaje. Probá de nuevo.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <PageShell path="/contacto" label="Contacto" title="Hablemos" lead="¿Tenés dudas? Nuestro equipo te responde en menos de 24 horas.">
      <div style={{maxWidth:560}}>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:500,color:'var(--text-3)',marginBottom:6}}>Nombre</label>
              <input required className="input" type="text" placeholder="Tu nombre" value={form.name} onChange={set('name')}/>
            </div>
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:500,color:'var(--text-3)',marginBottom:6}}>Email</label>
              <input required className="input" type="email" placeholder="tu@email.com" value={form.email} onChange={set('email')}/>
            </div>
          </div>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:500,color:'var(--text-3)',marginBottom:6}}>Asunto</label>
            <select className="input" value={form.subject} onChange={set('subject')}>
              {['Consulta sobre un curso','Problemas técnicos','Facturación y pagos','Propuesta empresas','Otro'].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:500,color:'var(--text-3)',marginBottom:6}}>Mensaje</label>
            <textarea required className="input" rows={5} placeholder="¿En qué podemos ayudarte?" value={form.message} onChange={set('message')}/>
          </div>
          <div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={sending}>
              {sending ? 'Enviando...' : <>Enviar mensaje <ArrowRight size={15}/></>}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}

// ── Páginas legales (Privacidad / Términos / Cookies) ──────────────────────────
const legalH2 = {fontFamily:'var(--display)',fontSize:'clamp(19px,2.2vw,24px)',fontWeight:800,letterSpacing:'-0.02em',marginTop:34,marginBottom:12};
const legalP  = {fontSize:14.5,color:'var(--text-2)',lineHeight:1.85,marginBottom:14};
const legalUl = {margin:'0 0 14px 20px',padding:0};
const legalLi = {fontSize:14.5,color:'var(--text-2)',lineHeight:1.85,marginBottom:8};
const legalStrong = {color:'var(--text)',fontWeight:700};

function LegalDoc({ updated, children }) {
  return (
    <div style={{maxWidth:760}}>
      <p style={{fontSize:13,color:'var(--text-3)',marginBottom:8}}>Última actualización: {updated}</p>
      {children}
    </div>
  );
}

export function Privacidad() {
  return (
    <PageShell
      path="/privacidad"
      label="Legal"
      title="Política de Privacidad"
      lead="Cómo recolectamos, usamos y protegemos tus datos personales en Go Travel Academy."
    >
      <LegalDoc updated="Agosto 2026">
        <h2 style={legalH2}>1. Quiénes somos</h2>
        <p style={legalP}>
          Go Travel Academy ("nosotros", "el sitio") es la plataforma de formación online en{' '}
          <strong style={legalStrong}>gotravelacademy.com</strong>, operada desde Argentina. Esta política
          explica qué datos personales recolectamos de quienes visitan el sitio o se inscriben en un curso,
          para qué los usamos y qué derechos tenés sobre ellos.
        </p>

        <h2 style={legalH2}>2. Qué datos recolectamos</h2>
        <p style={legalP}>Según cómo interactúes con el sitio, podemos recolectar:</p>
        <ul style={legalUl}>
          <li style={legalLi}><strong style={legalStrong}>Datos de cuenta:</strong> nombre, apellido, email y teléfono al registrarte, o nombre, email y foto de perfil si entrás con Google.</li>
          <li style={legalLi}><strong style={legalStrong}>Datos de compra:</strong> el curso adquirido, el monto y el medio de pago usado. Los pagos se procesan a través de Mercado Pago o Stripe — <strong style={legalStrong}>nunca vemos ni almacenamos el número de tu tarjeta</strong>, eso queda a cargo de esos procesadores.</li>
          <li style={legalLi}><strong style={legalStrong}>Datos de uso:</strong> tu progreso en los cursos, las reseñas que dejás, y mensajes que nos envíes por el formulario de contacto.</li>
          <li style={legalLi}><strong style={legalStrong}>Datos de navegación:</strong> cookies técnicas para mantener tu sesión iniciada, y cookies de Meta (Facebook/Instagram) para medir la efectividad de nuestras campañas publicitarias. Más detalle en nuestra <a href="/cookies" style={{color:'var(--accent)'}}>Política de Cookies</a>.</li>
        </ul>

        <h2 style={legalH2}>3. Para qué usamos tus datos</h2>
        <ul style={legalUl}>
          <li style={legalLi}>Crear y administrar tu cuenta, y darte acceso al contenido de los cursos que comprás.</li>
          <li style={legalLi}>Procesar pagos, emitir el comprobante de compra y avisarte sobre el estado de tu inscripción (aprobada, rechazada o reembolsada).</li>
          <li style={legalLi}>Responder tus consultas y darte soporte.</li>
          <li style={legalLi}>Enviarte comunicaciones sobre tu cuenta o tus cursos (no vendemos tu email a terceros para spam).</li>
          <li style={legalLi}>Medir y optimizar nuestras campañas publicitarias en Meta (Facebook/Instagram).</li>
        </ul>

        <h2 style={legalH2}>4. Con quién compartimos tus datos</h2>
        <p style={legalP}>
          No vendemos tus datos personales. Los compartimos únicamente con los proveedores que necesitamos
          para operar el servicio, cada uno con su propia política de privacidad:
        </p>
        <ul style={legalUl}>
          <li style={legalLi}><strong style={legalStrong}>Mercado Pago / Stripe</strong> — procesamiento de pagos.</li>
          <li style={legalLi}><strong style={legalStrong}>Meta (Facebook/Instagram)</strong> — medición de campañas publicitarias.</li>
          <li style={legalLi}><strong style={legalStrong}>Google</strong> — si elegís iniciar sesión con tu cuenta de Google.</li>
          <li style={legalLi}><strong style={legalStrong}>Brevo</strong> — envío de emails transaccionales (verificación, comprobantes, notificaciones).</li>
          <li style={legalLi}><strong style={legalStrong}>Proveedores de infraestructura</strong> (hosting, base de datos, almacenamiento de archivos) — para que el sitio funcione.</li>
        </ul>

        <h2 style={legalH2}>5. Cuánto tiempo los conservamos</h2>
        <p style={legalP}>
          Conservamos tus datos mientras tu cuenta esté activa. Si la eliminás, los datos de facturación se
          conservan el tiempo que exige la normativa impositiva vigente; el resto se elimina o anonimiza.
        </p>

        <h2 style={legalH2}>6. Tus derechos</h2>
        <p style={legalP}>
          De acuerdo a la Ley 25.326 de Protección de Datos Personales, tenés derecho a acceder, rectificar,
          actualizar y solicitar la supresión de tus datos personales. Para ejercer estos derechos, escribinos a{' '}
          <a href="mailto:academygotravel@gmail.com" style={{color:'var(--accent)'}}>academygotravel@gmail.com</a>.
          La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de la Ley 25.326,
          tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados
          en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.
        </p>

        <h2 style={legalH2}>7. Seguridad</h2>
        <p style={legalP}>
          Tu contraseña se guarda encriptada (nunca en texto plano), la sesión viaja en una cookie protegida
          contra acceso desde JavaScript, y todo el tráfico del sitio va cifrado (HTTPS). Ningún sistema es
          100% infalible, pero tomamos medidas razonables para proteger tu información.
        </p>

        <h2 style={legalH2}>8. Menores de edad</h2>
        <p style={legalP}>
          Nuestros cursos están dirigidos a personas mayores de 18 años. No recolectamos deliberadamente datos
          de menores sin el consentimiento de madre, padre o tutor.
        </p>

        <h2 style={legalH2}>9. Cambios a esta política</h2>
        <p style={legalP}>
          Podemos actualizar esta política ocasionalmente. Los cambios importantes los vamos a comunicar por
          email o con un aviso visible en el sitio.
        </p>

        <h2 style={legalH2}>10. Contacto</h2>
        <p style={legalP}>
          ¿Dudas sobre esta política? Escribinos a{' '}
          <a href="mailto:academygotravel@gmail.com" style={{color:'var(--accent)'}}>academygotravel@gmail.com</a>.
        </p>
      </LegalDoc>
    </PageShell>
  );
}

export function Terminos() {
  return (
    <PageShell
      path="/terminos"
      label="Legal"
      title="Términos y Condiciones"
      lead="Las condiciones que rigen el uso del sitio y la compra de nuestros cursos."
    >
      <LegalDoc updated="Agosto 2026">
        <h2 style={legalH2}>1. Aceptación de los términos</h2>
        <p style={legalP}>
          Al crear una cuenta, comprar un curso o usar gotravelacademy.com de cualquier forma, aceptás estos
          términos y nuestra <a href="/privacidad" style={{color:'var(--accent)'}}>Política de Privacidad</a>.
          Si no estás de acuerdo, te pedimos que no uses el sitio.
        </p>

        <h2 style={legalH2}>2. El servicio</h2>
        <p style={legalP}>
          Go Travel Academy ofrece cursos de formación online en el rubro turístico, con contenido en video,
          material descargable y, en los cursos que corresponda, certificado avalado por la Universidad del
          Aconcagua. El acceso es 100% digital: no se envía material físico.
        </p>

        <h2 style={legalH2}>3. Tu cuenta</h2>
        <ul style={legalUl}>
          <li style={legalLi}>Sos responsable de que los datos que nos das al registrarte sean correctos.</li>
          <li style={legalLi}>Sos responsable de mantener tu contraseña segura y de toda actividad que ocurra desde tu cuenta.</li>
          <li style={legalLi}>Nos reservamos el derecho de suspender cuentas que usen el sitio de forma fraudulenta o que violen estos términos.</li>
        </ul>

        <h2 style={legalH2}>4. Compras y pagos</h2>
        <p style={legalP}>
          Los precios se muestran en ARS o USD según tu región, e incluyen impuestos cuando corresponda. Podés
          pagar con Mercado Pago (Argentina, hasta 6 cuotas o con 10% de descuento por transferencia) o con
          Stripe (pagos internacionales). El acceso al curso se activa apenas el pago queda confirmado.
        </p>

        <h2 style={legalH2}>5. Acceso al contenido</h2>
        <p style={legalP}>
          El acceso a un curso es personal e intransferible. No está permitido compartir tu usuario, ni
          descargar, redistribuir, revender o publicar el contenido de los cursos (videos, materiales,
          textos) por fuera de la plataforma.
        </p>

        <h2 style={legalH2}>6. Reembolsos y cancelaciones</h2>
        <p style={legalP}>
          Si tu pago se reembolsa, se anula o entra en disputa (a través de Mercado Pago o Stripe), el acceso
          al curso correspondiente se desactiva automáticamente. Te avisamos por email cuando esto pasa. Para
          consultas puntuales sobre un reembolso, escribinos a{' '}
          <a href="mailto:academygotravel@gmail.com" style={{color:'var(--accent)'}}>academygotravel@gmail.com</a>.
        </p>

        <h2 style={legalH2}>7. Propiedad intelectual</h2>
        <p style={legalP}>
          Todo el contenido de los cursos (videos, textos, materiales, marca y diseño del sitio) es propiedad
          de Go Travel Academy o de sus instructores, y está protegido por las leyes de propiedad intelectual
          vigentes. Comprar un curso te da una licencia de uso personal, no la titularidad del contenido.
        </p>

        <h2 style={legalH2}>8. Certificados</h2>
        <p style={legalP}>
          El certificado de un curso se emite una vez que completás el 100% del contenido. La validez y el
          reconocimiento del certificado dependen del aval indicado en cada curso.
        </p>

        <h2 style={legalH2}>9. Limitación de responsabilidad</h2>
        <p style={legalP}>
          Hacemos nuestro mejor esfuerzo para que el sitio funcione sin interrupciones, pero no garantizamos
          disponibilidad ininterrumpida. No nos hacemos responsables por resultados laborales o económicos que
          puedas o no obtener a partir de tomar un curso.
        </p>

        <h2 style={legalH2}>10. Cambios</h2>
        <p style={legalP}>
          Podemos modificar estos términos o el servicio en cualquier momento. Los cambios relevantes los
          vamos a comunicar por email o con un aviso en el sitio.
        </p>

        <h2 style={legalH2}>11. Ley aplicable</h2>
        <p style={legalP}>
          Estos términos se rigen por las leyes de la República Argentina. Ante cualquier conflicto, las
          partes se someten a los tribunales competentes de Argentina.
        </p>

        <h2 style={legalH2}>12. Contacto</h2>
        <p style={legalP}>
          ¿Dudas sobre estos términos? Escribinos a{' '}
          <a href="mailto:academygotravel@gmail.com" style={{color:'var(--accent)'}}>academygotravel@gmail.com</a>.
        </p>
      </LegalDoc>
    </PageShell>
  );
}

export function Cookies() {
  return (
    <PageShell
      path="/cookies"
      label="Legal"
      title="Política de Cookies"
      lead="Qué cookies usamos en gotravelacademy.com y para qué."
    >
      <LegalDoc updated="Agosto 2026">
        <h2 style={legalH2}>1. Qué es una cookie</h2>
        <p style={legalP}>
          Una cookie es un pequeño archivo que un sitio guarda en tu navegador para recordar información entre
          visitas — por ejemplo, que iniciaste sesión, o desde qué anuncio llegaste.
        </p>

        <h2 style={legalH2}>2. Qué cookies usamos</h2>
        <ul style={legalUl}>
          <li style={legalLi}>
            <strong style={legalStrong}>Cookie de sesión (esencial):</strong> mantiene tu inicio de sesión activo.
            Está protegida (no accesible desde JavaScript) y es necesaria para que el sitio funcione — no se
            puede desactivar sin dejar de poder iniciar sesión.
          </li>
          <li style={legalLi}>
            <strong style={legalStrong}>Cookies de Meta (_fbp, _fbc):</strong> las coloca el Pixel de Meta
            (Facebook/Instagram) para medir qué tan efectivas son nuestras campañas publicitarias y mostrarte
            anuncios más relevantes. Son de terceros (Meta).
          </li>
          <li style={legalLi}>
            <strong style={legalStrong}>Preferencias:</strong> guardamos tu región y moneda elegida (Argentina/ARS
            o Internacional/USD) en el almacenamiento local de tu navegador, no en una cookie propiamente dicha.
          </li>
        </ul>

        <h2 style={legalH2}>3. Cómo controlarlas</h2>
        <p style={legalP}>
          Podés bloquear o eliminar cookies desde la configuración de tu navegador. Tené en cuenta que bloquear
          la cookie de sesión va a impedir que puedas iniciar sesión o comprar un curso. Las cookies de Meta
          las podés gestionar también desde la configuración de anuncios de tu cuenta de Facebook/Instagram.
        </p>

        <h2 style={legalH2}>4. Contacto</h2>
        <p style={legalP}>
          ¿Dudas sobre esta política? Escribinos a{' '}
          <a href="mailto:academygotravel@gmail.com" style={{color:'var(--accent)'}}>academygotravel@gmail.com</a>.
        </p>
      </LegalDoc>
    </PageShell>
  );
}
