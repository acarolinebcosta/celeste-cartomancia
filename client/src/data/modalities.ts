import type { Modality } from "@/types/domain";

export const modalities: Modality[] = ["message", "voice", "video"];

export const modalityDetails: Record<Modality, { name: string; description: string; note: string }> = {
  message: {
    name: "Mensagem",
    description: "Você envia sua questão e recebe a leitura posteriormente em texto e/ou áudio.",
    note: "Disponível para a Pergunta Direta.",
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

export const isModality = (value: string | null): value is Modality =>
  value !== null && modalities.includes(value as Modality);

export const getModalityLabel = (modality: Modality) => modalityDetails[modality].name;

export const formatModalities = (available: Modality[]) =>
  available.map(getModalityLabel).join(available.length > 1 ? " ou " : "");
