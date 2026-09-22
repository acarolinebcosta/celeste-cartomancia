import type { Reading } from "@/types/domain";

export const mockReadings: Reading[] = [
  {
    slug: "pergunta-direta",
    name: "Pergunta Direta",
    eyebrow: "Para um ponto específico",
    description: "Uma leitura objetiva para olhar com cuidado para a questão que está pedindo clareza agora.",
    audience: "Para quem chega com uma pergunta delimitada e deseja uma interpretação cuidadosa, sem rodeios.",
    explores: ["o contexto da situação", "movimentos e possibilidades", "o que merece atenção neste momento"],
    fulfillmentType: "async",
    durationMinutes: null,
    priceCents: 4900,
    active: true,
    availableModalities: ["message"],
    estimatedDelivery: "Prazo de entrega será informado antes da confirmação.",
  },
  {
    slug: "entre-caminhos",
    name: "Entre Caminhos",
    eyebrow: "Para decisões importantes",
    description: "Uma leitura para organizar possibilidades quando mais de um caminho parece fazer sentido.",
    audience: "Para momentos de decisão, comparação e escolhas que pedem presença antes de qualquer movimento.",
    explores: ["os caminhos disponíveis", "tensões e recursos de cada possibilidade", "o que pode orientar sua escolha"],
    fulfillmentType: "scheduled",
    durationMinutes: 30,
    priceCents: 12900,
    active: true,
    availableModalities: ["voice", "video"],
  },
  {
    slug: "amor-relacoes",
    name: "Amor & Relações",
    eyebrow: "Para vínculos em movimento",
    description: "Um espaço para compreender dinâmicas afetivas, aproximações, afastamentos e possibilidades.",
    audience: "Para quem deseja olhar para um vínculo com mais honestidade, contexto e delicadeza.",
    explores: ["a dinâmica atual", "padrões de aproximação e afastamento", "possibilidades de conversa e movimento"],
    fulfillmentType: "scheduled",
    durationMinutes: 30,
    priceCents: 12900,
    active: true,
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
    fulfillmentType: "scheduled",
    durationMinutes: 30,
    priceCents: 12900,
    active: true,
    availableModalities: ["voice", "video"],
  },
  {
    slug: "leitura-profunda",
    name: "Leitura Profunda",
    eyebrow: "Para olhar com mais tempo",
    description: "Uma conversa mais longa para explorar diferentes perguntas ou uma situação em camadas.",
    audience: "Para quem deseja percorrer uma questão com calma, conectando contexto, nuances e próximos passos.",
    explores: ["várias perguntas relacionadas", "camadas da situação", "recursos para atravessar o momento"],
    fulfillmentType: "scheduled",
    durationMinutes: 60,
    priceCents: 17900,
    active: true,
    availableModalities: ["voice", "video"],
  },
];

export const readings = mockReadings;

export const getReading = (slug?: string | null) => mockReadings.find((reading) => reading.slug === slug) ?? mockReadings[0];

export const findReading = (slug?: string | null) => mockReadings.find((reading) => reading.slug === slug);
