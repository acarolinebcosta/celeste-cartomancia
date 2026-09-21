import BrandMark from "@/components/BrandMark";
import { navItems } from "@/data/navigation";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand"><div className="wordmark"><BrandMark /><span>CELESTE</span><small>cartomancia</small></div><p>Leituras com cuidado,<br />privacidade e presença.</p></div>
        <div className="footer-links"><div><span>EXPLORAR</span>{navItems.slice(0, 4).map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}</div><div><span>LEGAL</span><a href="/privacidade">Política de Privacidade</a><a href="/termos">Termos de Uso</a><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram ↗</a></div></div>
      </div>
      <div className="footer-bottom"><span>© 2026 Celeste Cartomancia</span><span>Atendimento online · Brasil</span></div>
      <p className="disclaimer">As leituras oferecidas pela Celeste têm caráter simbólico e reflexivo e não substituem orientação médica, psicológica, jurídica ou financeira profissional.</p>
    </footer>
  );
}
