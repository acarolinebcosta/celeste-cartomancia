import { ArrowLeft, ArrowUpRight, Check, Clock3, LockKeyhole } from "lucide-react";
import { Link, useRoute } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import { useServiceCatalog } from "@/contexts/ServiceCatalogContext";
import { formatModalities } from "@/data/modalities";
import { track } from "@/lib/analytics";
import { formatBRL, formatPriceFrom, formatReadingDuration } from "@/utils/formatters";

export default function ServiceDetail() {
  const [, params] = useRoute("/leituras/:slug");
  const catalog = useServiceCatalog();
  if (catalog.loading) return <ServiceState message="Carregando leitura…" />;
  if (catalog.error) return <ServiceState message={catalog.error} onRetry={catalog.reload} />;
  const reading = catalog.services.find((item) => item.slug === params?.slug);
  if (!reading) {
    return <div className="site-shell"><SiteHeader /><main className="confirmation-page section-pad"><div className="confirmation-icon">?</div><span className="section-kicker">LEITURA NÃO ENCONTRADA</span><h1>Essa leitura<br /><em>não existe.</em></h1><p className="confirmation-lede">O endereço pode ter mudado. Volte para a lista e escolha uma leitura disponível.</p><Link href="/#leituras" className="button button-primary" style={{ marginTop: 32 }}>Ver leituras <ArrowUpRight size={16} /></Link></main></div>;
  }

  const isAsync = reading.fulfillmentType === "async";
  const readingNumber = Math.max(1, catalog.services.findIndex((item) => item.slug === reading.slug) + 1);

  return <div className="site-shell"><SiteHeader /><main><section className="service-hero section-pad"><Link href="/#leituras" className="back-link"><ArrowLeft size={15} /> Todas as leituras</Link><div className="service-hero-grid"><div><span className="section-kicker">LEITURA 0{readingNumber}</span><h1>{reading.name}<br /><em>{reading.eyebrow.toLowerCase()}.</em></h1><p className="service-lede">{reading.description}</p><div className="service-price"><strong>{formatBRL(reading.priceCents)}</strong><span>valor inicial · leitura completa</span></div><Link href={`/agendar?servico=${reading.slug}`} className="button button-primary" onClick={() => track("select_service", { service: reading.slug })}>{isAsync ? "Enviar minha questão" : "Agendar esta leitura"} <ArrowUpRight size={16} /></Link></div><div className="service-visual"><div className="service-orbit" /><div className="service-symbol">✦</div><span>um espaço<br />para a pergunta</span></div></div></section><section className="section-pad service-body"><div className="service-detail-grid"><div><span className="section-kicker">PARA QUEM É</span><h2>Uma leitura para<br /><em>o seu momento.</em></h2><p>{reading.audience}</p></div><div className="explores-panel"><span className="section-kicker">O QUE PODE SER EXPLORADO</span><ul>{reading.explores.map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul></div></div><div className="service-info-row"><div><Clock3 size={18} /><span><strong>{isAsync ? "Entrega" : "Duração"}</strong>{formatReadingDuration(reading)}</span></div><div><LockKeyhole size={18} /><span><strong>Privacidade</strong>Atendimento individual e confidencial</span></div><div><span className="info-star">✦</span><span><strong>Modalidade</strong>{formatModalities(reading.availableModalities)}</span></div></div>{reading.estimatedDelivery && <p className="delivery-note">{reading.estimatedDelivery}</p>}</section><section className="section-pad service-next"><span className="section-kicker">PRÓXIMO PASSO</span><h2>Você não precisa<br /><em>decidir tudo agora.</em></h2><p>{isAsync ? "Envie sua questão e os dados necessários para receber a leitura. O prazo será apresentado antes da confirmação." : "Escolha um horário e a modalidade que fizer mais sentido. O valor final aparece antes da confirmação."}</p><Link href={`/agendar?servico=${reading.slug}`} className="button button-primary" onClick={() => track("begin_booking", { source: "service_detail", service: reading.slug })}>{isAsync ? "Enviar minha questão" : "Encontrar um horário"} <ArrowUpRight size={16} /></Link></section></main><MobileSticky reading={reading.slug} priceCents={reading.priceCents} label={isAsync ? "Enviar questão" : "Agendar"} /></div>;
}

function MobileSticky({ reading, priceCents, label }: { reading: string; priceCents: number; label: string }) {
  return <div className="mobile-sticky-cta"><div><span>{formatPriceFrom(priceCents)}</span></div><Link href={`/agendar?servico=${reading}`} className="button button-primary">{label} <ArrowUpRight size={16} /></Link></div>;
}

function ServiceState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="site-shell"><SiteHeader /><main className="confirmation-page section-pad"><span className="section-kicker">LEITURAS</span><h1>Um momento,<br /><em>por favor.</em></h1><p className="confirmation-lede" role={onRetry ? "alert" : "status"}>{message}</p>{onRetry && <button className="button button-primary" type="button" onClick={onRetry}>Tentar novamente</button>}</main></div>;
}
