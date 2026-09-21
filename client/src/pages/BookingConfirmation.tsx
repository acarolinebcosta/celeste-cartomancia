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

  if (booking === undefined) return <ConfirmationShell><p className="confirmation-lede" role="status">Carregando pré-reserva demonstrativa…</p></ConfirmationShell>;
  if (!booking) return <ConfirmationShell><span className="section-kicker">RESERVA NÃO ENCONTRADA</span><h1>Este código não está<br /><em>nesta sessão.</em></h1><p className="confirmation-lede">As pré-reservas mock ficam apenas nesta aba. Inicie novamente se você atualizou ou abriu o link em outro navegador.</p><Link href="/agendar" className="button button-primary confirmation-link">Iniciar atendimento</Link></ConfirmationShell>;

  const { data } = booking;
  const isAsync = !data.date;
  return (
    <ConfirmationShell>
      <div className="confirmation-icon"><Check size={28} /></div>
      <span className="section-kicker">PRÉ-RESERVA · {booking.publicCode}</span>
      <h1>Seu atendimento com<br /><em>a Celeste está encaminhado.</em></h1>
      <p className="confirmation-lede">Esta é uma demonstração persistida somente nesta sessão. A reserva real só será confirmada após pagamento validado pelo backend.</p>
      <div className="confirmation-card">
        <div><span>Leitura</span><strong>{booking.readingName}</strong></div>
        <div><span>{isAsync ? "Entrega" : "Data e horário"}</span><strong>{isAsync ? "Prazo informado antes da confirmação" : `${formatDate(data.date)} · ${data.time}`}</strong></div>
        <div><span>Modalidade</span><strong>{data.modality ? getModalityLabel(data.modality) : "—"}</strong></div>
        <div><span>Status</span><strong className="pending-status">Aguardando pagamento</strong></div>
      </div>
      <div className="confirmation-actions"><Link className="button button-primary" href="/">Voltar para a Celeste</Link><a className="button button-ghost" href="https://wa.me/5500000000000" target="_blank" rel="noreferrer" onClick={() => track("whatsapp_click", { source: "confirmation" })}>Falar pelo WhatsApp <MessageCircle size={16} /></a></div>
    </ConfirmationShell>
  );
}

function ConfirmationShell({ children }: { children: ReactNode }) {
  return <div className="site-shell booking-shell"><SiteHeader /><main className="confirmation-page section-pad">{children}</main></div>;
}
