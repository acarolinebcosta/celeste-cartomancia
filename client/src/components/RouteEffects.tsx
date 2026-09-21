import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { brandAssets } from "@/config/brand";
import { getAnalyticsConsent, track } from "@/lib/analytics";

function getRouteMeta(path: string) {
  if (path.startsWith("/leituras/")) return { title: "Leitura | Celeste Cartomancia", description: "Conheça esta leitura da Celeste e escolha o formato adequado ao seu momento." };
  if (path.startsWith("/agendar")) return { title: "Agendar uma leitura | Celeste", description: "Escolha sua leitura e organize seu atendimento online com a Celeste." };
  if (path.startsWith("/agendamento/")) return { title: "Pré-reserva | Celeste", description: "Consulte o estado demonstrativo da sua pré-reserva Celeste." };
  if (path === "/termos") return { title: "Termos de Uso | Celeste", description: "Termos de Uso provisórios da Celeste Cartomancia." };
  if (path === "/privacidade") return { title: "Política de Privacidade | Celeste", description: "Política de Privacidade provisória da Celeste Cartomancia." };
  return { title: "Celeste Cartomancia | Tarot e Baralho Cigano Online", description: "Consultas individuais de Tarot e Baralho Cigano conduzidas com cuidado, privacidade e presença." };
}

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
}

export default function RouteEffects() {
  const [location] = useLocation();
  const [consentVersion, setConsentVersion] = useState(0);
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    const onConsent = () => setConsentVersion((value) => value + 1);
    window.addEventListener("celeste:consent", onConsent);
    return () => window.removeEventListener("celeste:consent", onConsent);
  }, []);

  useEffect(() => {
    const path = location.split("?")[0] || "/";
    const { title, description } = getRouteMeta(path);
    const baseUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ?? window.location.origin;
    const canonicalUrl = `${baseUrl}${path}`;
    const imageUrl = `${baseUrl}${brandAssets.socialImage}`;

    document.title = title;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute("href", canonicalUrl);
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: imageUrl });

    if (getAnalyticsConsent() === "accepted" && lastTracked.current !== path) {
      track("page_view", { path });
      lastTracked.current = path;
    }
  }, [location, consentVersion]);

  return null;
}
