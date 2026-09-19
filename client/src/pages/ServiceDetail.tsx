import { ArrowLeft, ArrowUpRight, Check, Clock3, LockKeyhole } from "lucide-react";
import { Link, useRoute } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import { formatBRL, getReading, readings } from "@/lib/content";
import { track } from "@/lib/analytics";

export default function ServiceDetail() {
  const [, params] = useRoute("/leituras/:slug");
  if (!readings.some((item) => item.slug === params?.slug)) {
    return <div className="site-shell"><SiteHeader /><main className="confirmation-page section-pad"><div className="confirmation-icon">?</div><span className="section-kicker">LEITURA NÃO ENCONTRADA</span><h1>Essa leitura<br /><em>não existe.</em></h1><p className="confirmation-lede">O endereço pode ter mudado. Volte para a lista e escolha uma leitura disponível.</p><Link href="/#leituras" className="button button-primary" style={{ marginTop: 32 }}>Ver leituras <ArrowUpRight size={16} /></Link></main></div>;
  }
  const reading = getReading(params?.slug);

  return <div className="site-shell"><SiteHeader /><main><section className="service-hero section-pad"><Link href="/#leituras" className="back-link"><ArrowLeft size={15} /> Todas as leituras</Link><div className="service-hero-grid"><div><span className="section-kicker">LEITURA 0{Math.max(1, ["pergunta-direta", "entre-caminhos", "amor-relacoes", "panorama-do-ciclo", "leitura-profunda"].indexOf(reading.slug) + 1)}</span><h1>{reading.name}<br /><em>{reading.eyebrow.toLowerCase()}.</em></h1><p className="service-lede">{reading.description}</p><div className="service-price"><strong>{formatBRL(reading.price)}</strong><span>valor inicial · consulta completa</span></div><Link href={`/agendar?servico=${reading.slug}`} className="button button-primary" onClick={() => track("select_service", { service: reading.slug })}>Agendar esta leitura <ArrowUpRight size={16} /></Link></div><div className="service-visual"><div className="service-orbit" /><div className="service-symbol">✦</div><span>um espaço<br />para a pergunta</span></div></div></section><section className="section-pad service-body"><div className="service-detail-grid"><div><span className="section-kicker">PARA QUEM É</span><h2>Uma leitura para<br /><em>o seu momento.</em></h2><p>{reading.audience}</p></div><div className="explores-panel"><span className="section-kicker">O QUE PODE SER EXPLORADO</span><ul>{reading.explores.map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul></div></div><div className="service-info-row"><div><Clock3 size={18} /><span><strong>Duração</strong>{reading.duration}</span></div><div><LockKeyhole size={18} /><span><strong>Privacidade</strong>Encontro individual e confidencial</span></div><div><span className="info-star">✦</span><span><strong>Modalidades</strong>Voz ou videochamada</span></div></div></section><section className="section-pad service-next"><span className="section-kicker">PRÓXIMO PASSO</span><h2>Você não precisa<br /><em>decidir tudo agora.</em></h2><p>Escolha um horário e a modalidade que fizer mais sentido. O valor final aparece antes da confirmação.</p><Link href={`/agendar?servico=${reading.slug}`} className="button button-primary" onClick={() => track("begin_booking", { source: "service_detail", service: reading.slug })}>Encontrar um horário <ArrowUpRight size={16} /></Link></section></main><MobileSticky reading={reading.slug} price={reading.price} /></div>;
}

function MobileSticky({ reading, price }: { reading: string; price: number }) {
  return <div className="mobile-sticky-cta"><div><span>A partir de</span><strong>{formatBRL(price)}</strong></div><Link href={`/agendar?servico=${reading}`} className="button button-primary">Agendar <ArrowUpRight size={16} /></Link></div>;
}
