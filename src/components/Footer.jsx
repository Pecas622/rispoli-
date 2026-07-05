import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const SLink = ({ href, label, children }) => (
  <a href={href} aria-label={label}
    style={{width:32,height:32,background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--r-sm)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-3)',transition:'var(--transition)'}}
    onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-2)';e.currentTarget.style.color='var(--text)';}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-3)';}}>
    {children}
  </a>
);

export default function Footer() {
  return (
    <footer style={{borderTop:'1px solid var(--border)',paddingTop:56,paddingBottom:32,background:'var(--bg-2)'}}>
      <div className="container">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:40,marginBottom:48}}>
          <div>
            <Link to="/" style={{display:'inline-flex',alignItems:'center',gap:7,marginBottom:14,color:'var(--text)',fontFamily:'var(--display)',fontSize:16,fontWeight:700,letterSpacing:'-0.02em'}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:'var(--violet-mid)',flexShrink:0}}/>
              Go Travel Academy
</Link>
            <p style={{fontSize:13,color:'var(--text-3)',lineHeight:1.75,marginBottom:18,maxWidth:220}}>
              La plataforma de educación tech líder en América Latina.
            </p>
            <div style={{display:'flex',gap:8}}>
              <SLink href="#" label="X / Twitter">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.257 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </SLink>
              <SLink href="#" label="Instagram">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor" stroke="none"/></svg>
              </SLink>
              <SLink href="#" label="LinkedIn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
              </SLink>
              <SLink href="#" label="YouTube">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>
              </SLink>
            </div>
          </div>

          <div>
            <p style={{fontSize:12,fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:14}}>Cursos</p>
            {['Programación Web','UX/UI Design','Marketing Digital','Data Science','Ciberseguridad','Apps Móviles'].map(item=>(
              <Link key={item} to="/cursos" style={{display:'block',fontSize:13,color:'var(--text-3)',marginBottom:9,transition:'color 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.color='var(--text)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--text-3)'}>
                {item}
              </Link>
            ))}
          </div>

          <div>
            <p style={{fontSize:12,fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:14}}>Empresa</p>
            {[['Nosotros','/nosotros'],['Empresas','/empresas'],['Blog','/blog'],['Contacto','/contacto']].map(([l,to])=>(
              <Link key={l} to={to} style={{display:'block',fontSize:13,color:'var(--text-3)',marginBottom:9,transition:'color 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.color='var(--text)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--text-3)'}>
                {l}
              </Link>
            ))}
          </div>

          <div>
            <p style={{fontSize:12,fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:14}}>Contacto</p>
            {[{I:Mail,t:'hola@gotravelacademy.com'},{I:Phone,t:'+54 11 4567-8900'},{I:MapPin,t:'Buenos Aires, Argentina'}].map(({I,t})=>(
              <div key={t} style={{display:'flex',alignItems:'center',gap:9,fontSize:13,color:'var(--text-3)',marginBottom:10}}>
                <I size={13} style={{flexShrink:0}}/>{t}
              </div>
            ))}
            <div style={{marginTop:20}}>
              <p style={{fontSize:12,color:'var(--text-3)',marginBottom:8}}>Newsletter</p>
              <div style={{display:'flex',gap:8}}>
                <input className="input" type="email" placeholder="tu@email.com" style={{fontSize:13,padding:'8px 12px'}}/>
                <button className="btn btn-primary btn-sm"><Mail size={13}/></button>
              </div>
            </div>
          </div>
        </div>

        <div style={{borderTop:'1px solid var(--border)',paddingTop:20,display:'flex',flexWrap:'wrap',gap:12,justifyContent:'space-between',alignItems:'center'}}>
          <p style={{fontSize:12,color:'var(--text-3)'}}>© 2026 Go Travel Academy. Todos los derechos reservados.</p>
          <div style={{display:'flex',gap:18}}>
            {['Privacidad','Términos','Cookies'].map(t=>(
              <a key={t} href="#" style={{fontSize:12,color:'var(--text-3)',transition:'color 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.color='var(--text)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--text-3)'}>
                {t}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
