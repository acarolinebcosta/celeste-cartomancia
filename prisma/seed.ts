import { FulfillmentType, Modality, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const services = [
  {
    slug: "pergunta-direta",
    name: "Pergunta Direta",
    eyebrow: "Para um ponto específico",
    description: "Uma leitura objetiva para olhar com cuidado para a questão que está pedindo clareza agora.",
    audience: "Para quem chega com uma pergunta delimitada e deseja uma interpretação cuidadosa, sem rodeios.",
    explores: ["o contexto da situação", "movimentos e possibilidades", "o que merece atenção neste momento"],
    fulfillmentType: FulfillmentType.ASYNC,
    durationMinutes: null,
    priceCents: 4_900,
    featured: false,
    estimatedDelivery: "Prazo de entrega será informado antes da confirmação.",
    modalities: [Modality.MESSAGE],
  },
  {
    slug: "entre-caminhos",
    name: "Entre Caminhos",
    eyebrow: "Para decisões importantes",
    description: "Uma leitura para organizar possibilidades quando mais de um caminho parece fazer sentido.",
    audience: "Para momentos de decisão, comparação e escolhas que pedem presença antes de qualquer movimento.",
    explores: ["os caminhos disponíveis", "tensões e recursos de cada possibilidade", "o que pode orientar sua escolha"],
    fulfillmentType: FulfillmentType.SCHEDULED,
    durationMinutes: 30,
    priceCents: 12_900,
    featured: false,
    estimatedDelivery: null,
    modalities: [Modality.VOICE, Modality.VIDEO],
  },
  {
    slug: "amor-relacoes",
    name: "Amor & Relações",
    eyebrow: "Para vínculos em movimento",
    description: "Um espaço para compreender dinâmicas afetivas, aproximações, afastamentos e possibilidades.",
    audience: "Para quem deseja olhar para um vínculo com mais honestidade, contexto e delicadeza.",
    explores: ["a dinâmica atual", "padrões de aproximação e afastamento", "possibilidades de conversa e movimento"],
    fulfillmentType: FulfillmentType.SCHEDULED,
    durationMinutes: 30,
    priceCents: 12_900,
    featured: true,
    estimatedDelivery: null,
    modalities: [Modality.VOICE, Modality.VIDEO],
  },
  {
    slug: "panorama-do-ciclo",
    name: "Panorama do Ciclo",
    eyebrow: "Para o momento atual",
    description: "Uma leitura ampla sobre o presente, seus desafios e os movimentos do próximo ciclo.",
    audience: "Para quem sente que está atravessando uma fase de transição e quer enxergar o quadro maior.",
    explores: ["o momento presente", "desafios e aprendizados do ciclo", "movimentos e possibilidades próximas"],
    fulfillmentType: FulfillmentType.SCHEDULED,
    durationMinutes: 30,
    priceCents: 12_900,
    featured: false,
    estimatedDelivery: null,
    modalities: [Modality.VOICE, Modality.VIDEO],
  },
  {
    slug: "leitura-profunda",
    name: "Leitura Profunda",
    eyebrow: "Para olhar com mais tempo",
    description: "Uma conversa mais longa para explorar diferentes perguntas ou uma situação em camadas.",
    audience: "Para quem deseja percorrer uma questão com calma, conectando contexto, nuances e próximos passos.",
    explores: ["várias perguntas relacionadas", "camadas da situação", "recursos para atravessar o momento"],
    fulfillmentType: FulfillmentType.SCHEDULED,
    durationMinutes: 60,
    priceCents: 17_900,
    featured: false,
    estimatedDelivery: null,
    modalities: [Modality.VOICE, Modality.VIDEO],
  },
];

async function seedServices() {
  for (const definition of services) {
    const { modalities, ...data } = definition;
    const service = await prisma.service.upsert({
      where: { slug: data.slug },
      create: { ...data, active: true },
      update: { ...data, active: true },
    });

    await prisma.$transaction([
      prisma.serviceModality.deleteMany({ where: { serviceId: service.id } }),
      prisma.serviceModality.createMany({
        data: modalities.map((modality) => ({ serviceId: service.id, modality })),
      }),
    ]);
  }
}

async function seedAvailability() {
  const timezone = "America/Sao_Paulo";
  for (const dayOfWeek of [2, 3, 4, 5, 6]) {
    await prisma.availabilityRule.upsert({
      where: {
        dayOfWeek_startMinute_endMinute_timezone: {
          dayOfWeek,
          startMinute: 9 * 60,
          endMinute: 18 * 60,
          timezone,
        },
      },
      create: {
        dayOfWeek,
        startMinute: 9 * 60,
        endMinute: 18 * 60,
        bufferMinutes: 15,
        timezone,
        active: true,
      },
      update: { bufferMinutes: 15, active: true },
    });
  }
}

async function main() {
  await seedServices();
  await seedAvailability();
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error("Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
