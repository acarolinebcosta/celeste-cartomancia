import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

const content = {
  terms: {
    kicker: "TERMOS DE USO",
    title: "Uma relação clara, desde o início.",
    intro: "Texto provisório para revisão jurídica antes da publicação.",
    sections: [
      ["Sobre o serviço", "A Celeste oferece leituras de caráter simbólico e reflexivo. O atendimento não substitui aconselhamento médico, psicológico, jurídico ou financeiro profissional."],
      ["Agendamento e pagamento", "Condições definitivas de agendamento, confirmação, remarcação, cancelamento e reembolso serão apresentadas antes da contratação e deverão ser revisadas juridicamente."],
      ["Responsabilidades", "A pessoa atendida é responsável pelas próprias decisões. A Celeste se compromete a apresentar com clareza o formato, o valor e as condições aplicáveis antes da confirmação."],
      ["Revisão necessária", "Este conteúdo é uma estrutura inicial e não deve ser publicado como documento jurídico definitivo sem revisão especializada."],
    ],
  },
  privacy: {
    kicker: "POLÍTICA DE PRIVACIDADE",
    title: "Privacidade faz parte do cuidado.",
    intro: "Texto provisório para revisão jurídica e adequação à operação real antes da publicação.",
    sections: [
      ["Dados necessários", "O fluxo frontend solicita nome, e-mail, WhatsApp e, quando aplicável, contexto ou pergunta para demonstrar a organização do atendimento. Nesta fase não existe envio a um backend real."],
      ["Analytics e UTMs", "Analytics opcionais só são preparados após consentimento. Parâmetros de campanha podem ser guardados temporariamente na sessão do navegador para futura atribuição."],
      ["Pagamentos", "Este frontend não coleta nem armazena dados reais de cartão. A futura integração de pagamentos deverá usar componentes seguros do provedor escolhido."],
      ["Revisão necessária", "Prazos de retenção, base legal, controlador, canais de contato e direitos dos titulares deverão ser definidos com a operação e revisão jurídica antes da publicação."],
    ],
  },
} as const;

export default function LegalPage({ kind }: { kind: keyof typeof content }) {
  const page = content[kind];
  return <div className="site-shell"><SiteHeader /><main className="legal-page section-pad"><Link href="/" className="back-link"><ArrowLeft size={15} /> Voltar para a Celeste</Link><span className="section-kicker">{page.kicker}</span><h1>{page.title}</h1><p className="legal-review-note">{page.intro}</p><div className="legal-sections">{page.sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}</div></main><SiteFooter /></div>;
}
