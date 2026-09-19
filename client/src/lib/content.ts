export type Modality = "message" | "voice" | "video";

export type Reading = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  audience: string;
  explores: string[];
  duration: string;
  price: number;
  priceLabel: string;
  featured?: boolean;
  availableModalities: Modality[];
};

export const readings: Reading[] = [
  {
    slug: "pergunta-direta",
    name: "Pergunta Direta",
    eyebrow: "Para um ponto específico",
    description: "Uma leitura objetiva para olhar com cuidado para a questão que está pedindo clareza agora.",
    audience: "Para quem chega com uma pergunta delimitada e deseja uma interpretação cuidadosa, sem rodeios.",
    explores: ["o contexto da situação", "movimentos e possibilidades", "o que merece atenção neste momento"],
    duration: "Leitura assíncrona",
    price: 49,
    priceLabel: "a partir de R$ 49",
    availableModalities: ["message"],
  },
  {
    slug: "entre-caminhos",
    name: "Entre Caminhos",
    eyebrow: "Para decisões importantes",
    description: "Uma leitura para organizar possibilidades quando mais de um caminho parece fazer sentido.",
    audience: "Para momentos de decisão, comparação e escolhas que pedem presença antes de qualquer movimento.",
    explores: ["os caminhos disponíveis", "tensões e recursos de cada possibilidade", "o que pode orientar sua escolha"],
    duration: "30 minutos",
    price: 129,
    priceLabel: "a partir de R$ 129",
    availableModalities: ["voice", "video"],
  },
  {
    slug: "amor-relacoes",
    name: "Amor & Relações",
    eyebrow: "Para vínculos em movimento",
    description: "Um espaço para compreender dinâmicas afetivas, aproximações, afastamentos e possibilidades.",
    audience: "Para quem deseja olhar para um vínculo com mais honestidade, contexto e delicadeza.",
    explores: ["a dinâmica atual", "padrões de aproximação e afastamento", "possibilidades de conversa e movimento"],
    duration: "30 minutos",
    price: 129,
    priceLabel: "a partir de R$ 129",
    featured: true,
    availableModalities: ["voice", "video"],
  },
  {
    slug: "panorama-do-ciclo",
    name: "Panorama do Ciclo",
    eyebrow: "Para o momento atual",
    description: "Uma leitura ampla sobre o presente, seus desafios e os movimentos do próximo ciclo.",
    audience: "Para quem sente que está atravessando uma fase de transição e quer enxergar o quadro maior.",
    explores: ["o momento presente", "desafios e aprendizados do ciclo", "movimentos e possibilidades próximas"],
    duration: "30 minutos",
    price: 129,
    priceLabel: "a partir de R$ 129",
    availableModalities: ["voice", "video"],
  },
  {
    slug: "leitura-profunda",
    name: "Leitura Profunda",
    eyebrow: "Para olhar com mais tempo",
    description: "Uma conversa mais longa para explorar diferentes perguntas ou uma situação em camadas.",
    audience: "Para quem deseja percorrer uma questão com calma, conectando contexto, nuances e próximos passos.",
    explores: ["várias perguntas relacionadas", "camadas da situação", "recursos para atravessar o momento"],
    duration: "60 minutos",
    price: 179,
    priceLabel: "a partir de R$ 179",
    availableModalities: ["voice", "video"],
  },
];

export const modalityDetails: Record<Modality, { name: string; description: string; note: string }> = {
  message: {
    name: "Mensagem",
    description: "Você envia sua questão e recebe a leitura posteriormente em texto e/ou áudio.",
    note: "Ideal para a Pergunta Direta.",
  },
  voice: {
    name: "Chamada de voz",
    description: "Uma consulta individual em tempo real, com presença e espaço para aprofundar a conversa.",
    note: "Opções de 30 ou 60 minutos.",
  },
  video: {
    name: "Videochamada",
    description: "Um encontro reservado com horário marcado e a intimidade de uma conversa olho no olho.",
    note: "Opções de 30 ou 60 minutos.",
  },
};

export const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

export const getReading = (slug?: string) => readings.find((reading) => reading.slug === slug) ?? readings[0];

export const getAvailableDates = (count = 12) => {
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  while (dates.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 1) dates.push(new Date(cursor));
  }

  return dates;
};

export const getAvailableTimes = (reading?: Reading) => {
  if (reading?.slug === "pergunta-direta") return ["09:30", "11:00", "14:30", "17:00"];
  if (reading?.duration === "60 minutos") return ["09:00", "11:00", "14:00", "16:00"];
  return ["09:30", "11:00", "14:30", "16:00", "18:00"];
};

export const formatDateLong = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(date);

export const formatDateShort = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date).replace(" de ", " ");

export const getModalityLabel = (modality: Modality) => modalityDetails[modality].name;

export const faqs = [
  ["Como funciona uma consulta online?", "Você escolhe a leitura, a modalidade e um horário disponível. No encontro, a conversa acontece de forma individual e reservada, com espaço para contextualizar sua pergunta e construir a interpretação em conjunto."],
  ["Preciso saber alguma coisa sobre Tarot?", "Não. Você não precisa conhecer as cartas nem ter uma pergunta perfeita. Basta chegar com curiosidade e, se quiser, compartilhar o que está vivendo."],
  ["Posso fazer mais de uma pergunta?", "Depende da leitura escolhida. A Leitura Profunda é o formato mais indicado para reunir temas relacionados. Na Pergunta Direta, o foco é uma questão específica."],
  ["Qual a diferença entre as leituras?", "Cada leitura foi desenhada para um tipo de momento: uma pergunta pontual, uma decisão, uma relação, uma visão do ciclo ou uma investigação mais ampla."],
  ["Como recebo a Pergunta Direta?", "Você envia sua questão no agendamento e recebe a leitura posteriormente, em texto e/ou áudio, conforme a combinação definida no pedido."],
  ["Posso remarcar meu horário?", "Sim, quando solicitado com antecedência e sujeito à disponibilidade. Os detalhes estarão nos Termos de Uso e na confirmação do agendamento."],
  ["Como funciona o cancelamento?", "As condições de cancelamento e reembolso serão apresentadas antes do pagamento e também enviadas na confirmação."],
  ["Minha consulta é confidencial?", "Sim. Cada encontro é individual e tratado com privacidade. Os dados são utilizados somente para organizar e realizar o atendimento, conforme a Política de Privacidade."],
] as const;

export const testimonials = [
  { name: "Marina", type: "Exemplo de depoimento", text: "A leitura me ajudou a nomear o que eu já sentia, sem respostas prontas. Saí com mais calma para tomar minha decisão." },
  { name: "L.", type: "Exemplo de depoimento", text: "Foi um espaço muito cuidadoso. A conversa teve profundidade, mas também leveza e respeito pelo meu tempo." },
  { name: "Camila", type: "Exemplo de depoimento", text: "Gostei de não sentir que havia uma promessa ou um destino fechado. A leitura abriu possibilidades para eu olhar melhor." },
];

export const navItems = [
  { label: "Leituras", href: "/#leituras" },
  { label: "Consultas", href: "/#modalidades" },
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Sobre", href: "/#sobre" },
  { label: "Dúvidas", href: "/#duvidas" },
];

export type BookingState = {
  readingSlug: string;
  modality: Modality | null;
  date: string;
  time: string;
  name: string;
  email: string;
  whatsapp: string;
  context: string;
};

export const emptyBooking: BookingState = {
  readingSlug: readings[0].slug,
  modality: null,
  date: "",
  time: "",
  name: "",
  email: "",
  whatsapp: "",
  context: "",
};
