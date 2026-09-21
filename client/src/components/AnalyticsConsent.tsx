import { useState } from "react";
import { getAnalyticsConsent, setAnalyticsConsent, type ConsentValue } from "@/lib/analytics";

export default function AnalyticsConsent() {
  const [consent, setConsent] = useState<ConsentValue | null>(() => getAnalyticsConsent());
  if (consent) return null;

  const decide = (value: ConsentValue) => {
    setAnalyticsConsent(value);
    setConsent(value);
  };

  return (
    <aside className="analytics-consent" aria-label="Preferências de analytics">
      <p>Usamos analytics opcionais para entender a navegação e melhorar a experiência. Nenhum dado de marketing é coletado sem sua escolha.</p>
      <div><button className="button button-primary" type="button" onClick={() => decide("accepted")}>Aceitar</button><button className="button button-ghost" type="button" onClick={() => decide("declined")}>Recusar</button></div>
    </aside>
  );
}
