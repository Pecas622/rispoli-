import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';

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
            <p style={{fontSize:13,color:'var(--text-3)',lineHeight:1.75,marginBottom:18,maxWidth:240}}>
              La plataforma líder en formación para agentes de viajes de toda Latinoamérica.
            </p>
            <div style={{display:'flex',gap:8}}>
              <SLink href="#" label="Instagram">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor" stroke="none"/></svg>
              </SLink>
              <SLink href="#" label="Facebook">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.23.2 2.23.2v2.46H15.2c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0022 12z"/></svg>
              </SLink>
            </div>
          </div>

          <div>
            <p style={{fontSize:12,fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:14}}>Cursos</p>
            {['Agente de Viajes','Florida al completo','Europa esencial'].map(item=>(
              <Link key={item} to="/cursos" style={{display:'block',fontSize:13,color:'var(--text-3)',marginBottom:9,transition:'color 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.color='var(--text)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--text-3)'}>
                {item}
              </Link>
            ))}
          </div>

          <div>
            <p style={{fontSize:12,fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:14}}>Empresa</p>
            {[['Nosotros','/nosotros'],['Contacto','/contacto']].map(([l,to])=>(
              <Link key={l} to={to} style={{display:'block',fontSize:13,color:'var(--text-3)',marginBottom:9,transition:'color 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.color='var(--text)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--text-3)'}>
                {l}
              </Link>
            ))}
          </div>

          <div>
            <p style={{fontSize:12,fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:14}}>Contacto</p>
            {[{I:Mail,t:'academygotravel@gmail.com'},{I:Phone,t:'+54 9 2616 65-0766'}].map(({I,t})=>(
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
