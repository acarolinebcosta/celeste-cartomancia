import { ArrowUpRight, ChevronDown, Clock3, Headphones, LockKeyhole, MessageCircle, Play, Sparkles, Video } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import { faqs, formatBRL, modalityDetails, navItems, readings, testimonials, type Modality } from "@/lib/content";
import { track } from "@/lib/analytics";

const modalityIcons: Record<Modality, typeof MessageCircle> = { message: MessageCircle, voice: Headphones, video: Video };

export default function Home() {
  const startBooking = (source: string) => {
    track("begin_booking", { source });
  };

  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="hero-section section-pad">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> CELESTE <span className="eyebrow-muted">/ CARTOMANCIA</span></div>
            <h1>Clareza para aquilo que hoje parece <em>confuso.</em></h1>
            <p className="hero-lede">Leituras de Tarot e Baralho Cigano conduzidas com cuidado, privacidade e mais de 9 anos de experiência.</p>
            <div className="hero-actions">
              <Link href="/agendar" className="button button-primary" onClick={() => startBooking("hero")}>Agendar uma leitura <ArrowUpRight size={16} /></Link>
              <a href="#leituras" className="button button-ghost">Conhecer as leituras <span aria-hidden="true">↓</span></a>
            </div>
            <div className="hero-signature"><span>Atendimento online</span><i /> <span>Individual</span><i /> <span>Confidencial</span></div>
          </div>
          <div className="hero-art" aria-label="Composição abstrata inspirada no emblema da Celeste">
            <div className="hero-art-glow" />
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-sun"><span>✦</span></div>
            <div className="art-caption"><span className="caption-number">01</span><span>um espaço para<br />escutar o agora</span></div>
            <div className="art-vertical">CLAREZA · ESCUTA · PRESENÇA</div>
          </div>
        </section>

        <section className="intro-strip">
          <p>Nem toda pergunta precisa de uma resposta pronta.<br /><em>Às vezes, ela precisa de um lugar para ser vista.</em></p>
          <span className="intro-symbol">✦</span>
        </section>

        <section className="section-pad chooser-section" id="consultas">
          <div className="section-heading split-heading">
            <div><span className="section-kicker">COMECE POR ONDE FIZER SENTIDO</span><h2>Duas formas de<br /><em>encontrar sua consulta.</em></h2></div>
            <p>Você pode escolher pelo que quer olhar ou pela forma como prefere viver esse encontro.</p>
          </div>
          <div className="chooser-grid">
            <a href="#leituras" className="chooser-card chooser-card-dark">
              <span className="chooser-index">01 / LEITURA</span>
              <h3>Escolher<br /><em>pela leitura.</em></h3>
              <p>Encontre o formato que melhor acolhe a pergunta que você traz.</p>
              <span className="circle-arrow" aria-hidden="true"><ArrowUpRight size={18} /></span>
            </a>
            <a href="#modalidades" className="chooser-card chooser-card-line">
              <span className="chooser-index">02 / MODALIDADE</span>
              <h3>Escolher<br /><em>pela modalidade.</em></h3>
              <p>Decida como prefere conversar: mensagem, voz ou videochamada.</p>
              <span className="circle-arrow" aria-hidden="true"><ArrowUpRight size={18} /></span>
            </a>
          </div>
        </section>

        <section className="section-pad readings-section" id="leituras">
          <div className="section-heading"><span className="section-kicker">LEITURAS</span><h2>Uma leitura para cada<br /><em>momento de pergunta.</em></h2><p>Escolha com calma. O valor exibido é o valor da consulta — sem cobrança por minuto.</p></div>
          <div className="readings-grid">
            {readings.map((reading, index) => (
              <article className={`reading-card ${reading.featured ? "reading-card-featured" : ""}`} key={reading.slug}>
                <div className="reading-topline"><span>0{index + 1}</span><span>{reading.duration}</span></div>
                <div className="reading-icon">{reading.featured ? <Sparkles size={18} /> : <span>✦</span>}</div>
                <span className="reading-eyebrow">{reading.eyebrow}</span>
                <h3>{reading.name}</h3>
                <p>{reading.description}</p>
                <div className="reading-footer"><strong>{reading.priceLabel}</strong><Link href={`/leituras/${reading.slug}`} onClick={() => track("view_service", { service: reading.slug })}>Ver leitura <ArrowUpRight size={15} /></Link></div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-pad modalities-section" id="modalidades">
          <div className="section-heading split-heading"><div><span className="section-kicker">O ENCONTRO</span><h2>Escolha como<br /><em>prefere conversar.</em></h2></div><p>O mesmo cuidado em diferentes formas de presença. Você sempre sabe o que vai pagar antes de agendar.</p></div>
          <div className="modalities-list">
            {(Object.keys(modalityDetails) as Modality[]).map((modality, index) => {
              const Icon = modalityIcons[modality];
              return <div className="modality-row" key={modality}><span className="modality-number">0{index + 1}</span><Icon size={20} strokeWidth={1.4} /><div className="modality-text"><h3>{modalityDetails[modality].name}</h3><p>{modalityDetails[modality].description}</p></div><span className="modality-note">{modalityDetails[modality].note}</span><Link href={`/agendar?modalidade=${modality}`} className="row-arrow" aria-label={`Agendar por ${modalityDetails[modality].name}`} onClick={() => track("select_modality", { modality })}><ArrowUpRight size={18} /></Link></div>;
            })}
          </div>
        </section>

        <section className="process-section" id="como-funciona">
          <div className="section-pad"><div className="section-heading"><span className="section-kicker">COMO FUNCIONA</span><h2>Um caminho simples<br /><em>até a sua pergunta.</em></h2></div><div className="process-grid">{["Escolha sua leitura.", "Escolha como prefere conversar.", "Reserve seu horário.", "Faça sua consulta com privacidade."].map((item, index) => <div className="process-step" key={item}><span>0{index + 1}</span><p>{item}</p></div>)}</div></div>
        </section>

        <section className="section-pad about-section" id="sobre">
          <div className="about-image-placeholder"><div className="portrait-orbit" /><div className="portrait-monogram">C</div><span>espaço reservado<br />para fotografia</span></div>
          <div className="about-copy"><span className="section-kicker">SOBRE A CELESTE</span><h2>Há encontros que começam com <em>uma pergunta.</em></h2><p>A cartomancia faz parte da minha trajetória há cerca de nove anos. Ao longo desse tempo, construí uma maneira própria de conduzir cada leitura: com escuta, interpretação e respeito ao momento de quem chega até mim.</p><p>Na Celeste, cada consulta é individual. Não existe uma leitura pronta para todas as pessoas — existe uma conversa, um contexto e as cartas abertas diante dele.</p><Link href="/agendar" className="inline-link" onClick={() => startBooking("about")}>Conhecer as leituras <ArrowUpRight size={15} /></Link></div>
        </section>

        <section className="section-pad testimonials-section"><div className="section-heading split-heading"><div><span className="section-kicker">DEPOIMENTOS</span><h2>Palavras que ficam<br /><em>depois do encontro.</em></h2></div><span className="placeholder-note">Textos de exemplo · substituir antes da publicação</span></div><div className="testimonials-grid">{testimonials.map((item) => <blockquote key={item.name}><span className="quote-mark">“</span><p>{item.text}</p><footer><strong>{item.name}</strong><span>{item.type}</span></footer></blockquote>)}</div></section>

        <section className="section-pad faq-section" id="duvidas"><div className="faq-layout"><div className="section-heading"><span className="section-kicker">DÚVIDAS</span><h2>Antes de<br /><em>chegar.</em></h2><p>Se a sua pergunta não estiver aqui, escreva pelo WhatsApp. Vamos responder com cuidado.</p><a className="inline-link" href="https://wa.me/5500000000000" target="_blank" rel="noreferrer" onClick={() => track("whatsapp_click", { source: "faq" })}>Falar pelo WhatsApp <ArrowUpRight size={15} /></a></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={17} /></summary><p>{answer}</p></details>)}</div></div></section>

        <section className="final-cta-section"><div className="final-cta-inner"><span className="section-kicker">QUANDO VOCÊ ESTIVER PRONTA</span><h2>Abra espaço para<br /><em>olhar com clareza.</em></h2><Link href="/agendar" className="button button-primary" onClick={() => startBooking("final_cta")}>Agendar uma leitura <ArrowUpRight size={16} /></Link></div><span className="final-star">✦</span></section>
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  return <footer className="site-footer"><div className="footer-main"><div className="footer-brand"><div className="wordmark"><span className="brand-mark"><Sparkles size={14} /></span><span>CELESTE</span><small>cartomancia</small></div><p>Leituras com cuidado,<br />privacidade e presença.</p></div><div className="footer-links"><div><span>EXPLORAR</span>{navItems.slice(0, 4).map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}</div><div><span>LEGAL</span><a href="#">Política de Privacidade</a><a href="#">Termos de Uso</a><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram ↗</a></div></div></div><div className="footer-bottom"><span>© 2026 Celeste Cartomancia</span><span>Atendimento online · Brasil</span></div><p className="disclaimer">As leituras oferecidas pela Celeste têm caráter simbólico e reflexivo e não substituem orientação médica, psicológica, jurídica ou financeira profissional.</p></footer>;
}
