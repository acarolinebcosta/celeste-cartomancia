import { Check, MessageCircle } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useRoute } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import { getModalityLabel } from "@/data/modalities";
import { track } from "@/lib/analytics";
import { bookingService } from "@/services/bookingService";
import type { Booking } from "@/types/domain";
import { formatDate } from "@/utils/formatters";

export default function BookingConfirmation() {
  const [, params] = useRoute("/agendamento/:publicCode");
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void bookingService.getBooking(params?.publicCode ?? "").then((result) => {
      if (active) setBooking(result);
    });
    return () => { active = false; };
  }, [params?.publicCode]);

  if (booking === undefined) return <ConfirmationShell><p className="confirmation-lede" role="status">Carregando pré-reserva…</p></ConfirmationShell>;
  if (!booking) return <ConfirmationShell><span className="section-kicker">RESERVA NÃO ENCONTRADA</span><h1>Este código não está<br /><em>disponível.</em></h1><p className="confirmation-lede">Confira o código informado ou inicie novamente o atendimento.</p><Link href="/agendar" className="button button-primary confirmation-link">Iniciar atendimento</Link></ConfirmationShell>;

  const isAsync = booking.fulfillmentType === "async";
  const scheduled = booking.scheduledStart ? new Date(booking.scheduledStart) : null;
  return (
    <ConfirmationShell>
      <div className="confirmation-icon"><Check size={28} /></div>
      <span className="section-kicker">PRÉ-RESERVA · {booking.publicCode}</span>
      <h1>Seu atendimento com<br /><em>a Celeste está encaminhado.</em></h1>
      <p className="confirmation-lede">A pré-reserva permanece pendente. A confirmação real só acontecerá após pagamento validado pelo backend em uma próxima fase.</p>
      <div className="confirmation-card">
        <div><span>Leitura</span><strong>{booking.service.name}</strong></div>
        <div><span>{isAsync ? "Entrega" : "Data e horário"}</span><strong>{isAsync ? "Prazo informado antes da confirmação" : scheduled ? `${formatDate(scheduled.toISOString().slice(0, 10))} · ${scheduled.toLocaleTimeString("pt-BR", { timeZone: booking.timezone, hour: "2-digit", minute: "2-digit" })}` : "—"}</strong></div>
        <div><span>Modalidade</span><strong>{booking.modality ? getModalityLabel(booking.modality) : "—"}</strong></div>
        <div><span>Status</span><strong className="pending-status">Aguardando pagamento</strong></div>
      </div>
      <div className="confirmation-actions"><Link className="button button-primary" href="/">Voltar para a Celeste</Link><a className="button button-ghost" href="https://wa.me/5500000000000" target="_blank" rel="noreferrer" onClick={() => track("whatsapp_click", { source: "confirmation" })}>Falar pelo WhatsApp <MessageCircle size={16} /></a></div>
    </ConfirmationShell>
  );
}

function ConfirmationShell({ children }: { children: ReactNode }) {
  return <div className="site-shell booking-shell"><SiteHeader /><main className="confirmation-page section-pad">{children}</main></div>;
}
