import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Clock3, CreditCard, LockKeyhole, MessageCircle, QrCode, ShieldCheck, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import { getModalityLabel, modalityDetails } from "@/data/modalities";
import { useServiceCatalog } from "@/contexts/ServiceCatalogContext";
import { asyncQuestionSchema, customerSchema, type AsyncQuestionFormData, type CustomerFormData } from "@/features/booking/customerSchema";
import { getBookingSteps, initializeBookingFromSearch, selectDate, selectModality, selectReading, stepLabels, type BookingStep } from "@/features/booking/bookingState";
import { getStoredUtms, track } from "@/lib/analytics";
import { ApiError } from "@/lib/apiClient";
import { availabilityService, usingMockApi, type AvailabilitySlot, type AvailableDate } from "@/services/availabilityService";
import { bookingService } from "@/services/bookingService";
import { paymentService, type PaymentMethod } from "@/services/paymentService";
import type { BookingDraft, Modality, PaymentStatus, Reading } from "@/types/domain";
import { formatBRL, formatDate, formatDateLong, formatDateShort, formatReadingDuration } from "@/utils/formatters";

export default function Booking() {
  const catalog = useServiceCatalog();
  if (catalog.loading) return <CatalogBookingState message="Carregando leituras…" />;
  if (catalog.error) return <CatalogBookingState message={catalog.error} onRetry={catalog.reload} />;
  if (catalog.services.length === 0) return <CatalogBookingState message="Nenhuma leitura está disponível no momento." />;
  return <BookingFlow readings={catalog.services} />;
}

function BookingFlow({ readings }: { readings: Reading[] }) {
  const [, setLocation] = useLocation();
  const initial = useMemo(() => initializeBookingFromSearch(window.location.search, readings), [readings]);
  const [booking, setBooking] = useState(initial.booking);
  const [modalityFilter, setModalityFilter] = useState<Modality | null>(initial.modalityFilter);
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [availabilityRevision, setAvailabilityRevision] = useState(0);
  const reading = readings.find((item) => item.slug === booking.readingSlug) ?? readings[0];
  const steps = useMemo(() => getBookingSteps(reading), [reading]);
  const activeStep = steps[stepIndex];
  const visibleReadings = modalityFilter
    ? readings.filter((item) => item.availableModalities.includes(modalityFilter))
    : readings;

  useEffect(() => {
    let active = true;
    setAvailableDates([]);
    if (reading.fulfillmentType === "scheduled" && booking.modality) {
      void availabilityService.getAvailableDates(reading, booking.modality)
        .then((dates) => { if (active) setAvailableDates(dates); })
        .catch(() => { if (active) setErrors(["Não foi possível carregar a agenda. Tente novamente."]); });
    }
    return () => { active = false; };
  }, [availabilityRevision, booking.modality, reading]);

  useEffect(() => {
    let active = true;
    setAvailableSlots([]);
    if (reading.fulfillmentType === "scheduled" && booking.date && booking.modality) {
      void availabilityService.getAvailableSlots(reading, booking.date, booking.modality)
        .then((slots) => { if (active) setAvailableSlots(slots); })
        .catch(() => { if (active) setErrors(["Não foi possível carregar os horários. Tente novamente."]); });
    }
    return () => { active = false; };
  }, [availabilityRevision, booking.date, booking.modality, reading]);

  const goBack = () => {
    setErrors([]);
    setStepIndex((value) => Math.max(0, value - 1));
  };

  const goForward = () => {
    setErrors([]);
    if (activeStep === "reading") track("select_service", { service: reading.slug });
    if (activeStep === "modality" && !booking.modality) {
      setErrors(["Escolha uma modalidade para continuar."]);
      return;
    }
    if (activeStep === "schedule" && (!booking.date || !booking.time)) {
      setErrors(["Escolha um dia e um horário disponíveis."]);
      return;
    }
    if (activeStep === "summary") {
      track("begin_checkout", {
        service: reading.slug,
        modality: booking.modality ?? "message",
        utms: getStoredUtms(),
      });
    }
    setStepIndex((value) => Math.min(value + 1, steps.length - 1));
  };

  const chooseReading = (next: Reading) => {
    setBooking((current) => selectReading(current, next));
    setErrors([]);
  };

  const saveQuestion = (data: AsyncQuestionFormData) => {
    setBooking((current) => ({ ...current, question: data.question }));
    setStepIndex((value) => value + 1);
  };

  const saveCustomer = (data: CustomerFormData) => {
    setBooking((current) => ({ ...current, ...data }));
    track("submit_customer_data", { service: reading.slug, fulfillmentType: reading.fulfillmentType });
    setStepIndex((value) => value + 1);
  };

  const createPreview = async (method: PaymentMethod) => {
    setErrors([]);
    try {
      const preview = await bookingService.createBooking({ reading, data: booking, utms: getStoredUtms() });
      await paymentService.createCheckout(preview.publicCode, method);
      setLocation(`/agendamento/${preview.publicCode}`);
    } catch (error) {
      if (error instanceof ApiError && error.code === "SLOT_UNAVAILABLE") {
        setBooking((current) => ({ ...current, time: "" }));
        setAvailabilityRevision((value) => value + 1);
        setStepIndex(Math.max(0, steps.indexOf("schedule")));
        setErrors(["Esse horário acabou de ficar indisponível. Escolha outro horário para continuar."]);
        return;
      }
      if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
        setErrors(["Revise os dados informados antes de continuar."]);
        return;
      }
      setErrors(["Não foi possível criar a pré-reserva. Tente novamente em instantes."]);
    }
  };

  return (
    <div className="site-shell booking-shell">
      <SiteHeader />
      <main className="booking-page section-pad">
        <div className="booking-heading">
          <Link href="/" className="back-link"><ArrowLeft size={15} /> Voltar ao início</Link>
          <span className="section-kicker">ATENDIMENTO · AMERICA/SAO_PAULO</span>
          <h1>Um encontro começa<br /><em>com espaço.</em></h1>
        </div>
        <Stepper steps={steps} activeIndex={stepIndex} />
        <div className="booking-layout">
          <section className="booking-card" aria-live="polite">
            {activeStep === "reading" && <ReadingStep readings={visibleReadings} selected={booking.readingSlug} modalityFilter={modalityFilter} onClearFilter={() => setModalityFilter(null)} onSelect={chooseReading} />}
            {activeStep === "modality" && <ModalityStep reading={reading} selected={booking.modality} onSelect={(value) => { setBooking((current) => selectModality(current, value)); track("select_modality", { modality: value, service: reading.slug }); }} />}
            {activeStep === "schedule" && <ScheduleStep dates={availableDates} slots={availableSlots} booking={booking} reading={reading} isMock={usingMockApi} onDate={(value) => { setBooking((current) => selectDate(current, value)); track("select_date", { date: value, service: reading.slug }); }} onTime={(value) => { setBooking((current) => ({ ...current, time: value })); track("select_time", { time: value, service: reading.slug }); }} />}
            {activeStep === "question" && <QuestionStep defaultValue={booking.question} onBack={goBack} onSubmit={saveQuestion} />}
            {activeStep === "details" && <DetailsStep booking={booking} onBack={goBack} onSubmit={saveCustomer} />}
            {activeStep === "summary" && <SummaryStep booking={booking} reading={reading} />}
            {activeStep === "payment" && <PaymentStep reading={reading} onBack={goBack} onConfirm={createPreview} />}
            {errors.length > 0 && <div className="form-errors" role="alert">{errors.map((error) => <p key={error}>{error}</p>)}</div>}
            {!["question", "details", "payment"].includes(activeStep) && (
              <div className="booking-actions">
                <button className="button button-ghost" type="button" onClick={goBack} disabled={stepIndex === 0}><ArrowLeft size={15} /> Voltar</button>
                <button className="button button-primary" type="button" onClick={goForward}>{activeStep === "summary" ? "Ir para pagamento" : "Continuar"} <ArrowRight size={15} /></button>
              </div>
            )}
          </section>
          <BookingSummary booking={booking} reading={reading} />
        </div>
      </main>
    </div>
  );
}

function Stepper({ steps, activeIndex }: { steps: BookingStep[]; activeIndex: number }) {
  return (
    <ol className="stepper" aria-label="Etapas do atendimento">
      {steps.map((step, index) => (
        <li className={`stepper-item ${index === activeIndex ? "active" : ""} ${index < activeIndex ? "done" : ""}`} key={step} aria-current={index === activeIndex ? "step" : undefined}>
          <span aria-hidden="true">{index < activeIndex ? <Check size={13} /> : String(index + 1).padStart(2, "0")}</span>
          <span className="stepper-label">{stepLabels[step]}</span>
        </li>
      ))}
    </ol>
  );
}

function ReadingStep({ readings: choices, selected, modalityFilter, onClearFilter, onSelect }: { readings: Reading[]; selected: string; modalityFilter: Modality | null; onClearFilter: () => void; onSelect: (reading: Reading) => void }) {
  return <div><StepIntro eyebrow="01 · LEITURA" title="O que você quer olhar?" copy="Comece escolhendo o formato que melhor acolhe a sua pergunta." />{modalityFilter && <p className="filter-note">Mostrando leituras compatíveis com {getModalityLabel(modalityFilter)}. <button type="button" onClick={onClearFilter}>Ver todas</button></p>}<div className="booking-options">{choices.map((reading) => <button type="button" className={`booking-option ${selected === reading.slug ? "selected" : ""}`} aria-pressed={selected === reading.slug} key={reading.slug} onClick={() => onSelect(reading)}><span><strong>{reading.name}</strong><small>{reading.eyebrow}</small></span><span className="option-price">{formatBRL(reading.priceCents)}</span></button>)}</div></div>;
}

function ModalityStep({ reading, selected, onSelect }: { reading: Reading; selected: Modality | null; onSelect: (value: Modality) => void }) {
  return <div><StepIntro eyebrow="02 · MODALIDADE" title="Como prefere conversar?" copy="Escolha a forma de presença que combina com este momento." /><div className="booking-options">{reading.availableModalities.map((modality) => <button type="button" className={`booking-option modality-option ${selected === modality ? "selected" : ""}`} aria-pressed={selected === modality} key={modality} onClick={() => onSelect(modality)}><span><strong>{modalityDetails[modality].name}</strong><small>{modalityDetails[modality].description}</small></span><span className="modality-icon">{modality === "video" ? <Video size={18} /> : <MessageCircle size={18} />}</span></button>)}</div><p className="quiet-note"><Clock3 size={15} /> Sem cobrança por minuto. O valor exibido é o valor da consulta.</p></div>;
}

function ScheduleStep({ dates, slots, booking, reading, isMock, onDate, onTime }: { dates: AvailableDate[]; slots: AvailabilitySlot[]; booking: BookingDraft; reading: Reading; isMock: boolean; onDate: (value: string) => void; onTime: (value: string) => void }) {
  return <div><StepIntro eyebrow="03 · DATA E HORÁRIO" title="Encontre um momento." copy={`${isMock ? "Mostramos disponibilidade demonstrativa." : "Mostramos os horários disponíveis."} O fuso considerado é America/Sao_Paulo.`} /><div className="date-picker"><div className="date-list">{dates.map(({ isoDate, date }) => <button type="button" key={isoDate} className={`date-option ${booking.date === isoDate ? "selected" : ""}`} aria-pressed={booking.date === isoDate} onClick={() => onDate(isoDate)}><span>{date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span><strong>{formatDateShort(date)}</strong></button>)}</div>{booking.date ? <div className="time-list"><span className="section-kicker">HORÁRIOS EM {formatDateLong(new Date(`${booking.date}T12:00:00`))}</span><div>{slots.map(({ startTime }) => <button type="button" key={startTime} className={`time-option ${booking.time === startTime ? "selected" : ""}`} aria-pressed={booking.time === startTime} onClick={() => onTime(startTime)}>{startTime}</button>)}</div></div> : <p className="quiet-note">Escolha um dia para ver os horários de {formatReadingDuration(reading)}.</p>}</div></div>;
}

function QuestionStep({ defaultValue, onBack, onSubmit }: { defaultValue: string; onBack: () => void; onSubmit: (data: AsyncQuestionFormData) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<AsyncQuestionFormData>({ resolver: zodResolver(asyncQuestionSchema), defaultValues: { question: defaultValue } });
  return <form onSubmit={handleSubmit(onSubmit)} noValidate><StepIntro eyebrow="02 · SUA QUESTÃO" title="O que pede clareza?" copy="Envie sua questão e os dados necessários para receber a leitura." /><div className="details-form"><label htmlFor="question">Pergunta</label><textarea id="question" rows={6} {...register("question")} aria-invalid={Boolean(errors.question)} aria-describedby={errors.question ? "question-error" : undefined} placeholder="Conte qual questão você gostaria de olhar." />{errors.question && <p className="field-error" id="question-error" role="alert">{errors.question.message}</p>}<p className="quiet-note">Prazo de entrega será informado antes da confirmação.</p></div><FormActions onBack={onBack} /></form>;
}

function DetailsStep({ booking, onBack, onSubmit }: { booking: BookingDraft; onBack: () => void; onSubmit: (data: CustomerFormData) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<CustomerFormData>({ resolver: zodResolver(customerSchema), defaultValues: { name: booking.name, email: booking.email, whatsapp: booking.whatsapp, context: booking.context, termsAccepted: booking.termsAccepted } });
  const errorProps = (name: keyof CustomerFormData) => ({ "aria-invalid": Boolean(errors[name]), "aria-describedby": errors[name] ? `${name}-error` : undefined });
  return <form onSubmit={handleSubmit(onSubmit)} noValidate><StepIntro eyebrow="SEUS DADOS" title="Como podemos te encontrar?" copy="Só pedimos o necessário para organizar o atendimento. O contexto inicial é opcional." /><div className="details-form"><label htmlFor="name">Nome</label><input id="name" autoComplete="name" {...register("name")} {...errorProps("name")} placeholder="Como você gostaria de ser chamada?" /><FieldError id="name-error" message={errors.name?.message} /><label htmlFor="email">E-mail</label><input id="email" type="email" autoComplete="email" {...register("email")} {...errorProps("email")} placeholder="voce@exemplo.com" /><FieldError id="email-error" message={errors.email?.message} /><label htmlFor="whatsapp">WhatsApp</label><input id="whatsapp" type="tel" autoComplete="tel" {...register("whatsapp")} {...errorProps("whatsapp")} placeholder="(00) 00000-0000" /><FieldError id="whatsapp-error" message={errors.whatsapp?.message} /><label htmlFor="context">Contexto inicial <span>opcional</span></label><textarea id="context" rows={4} {...register("context")} {...errorProps("context")} placeholder="Se quiser, conte brevemente o que te traz até aqui." /><FieldError id="context-error" message={errors.context?.message} /><label className="consent-line"><input type="checkbox" {...register("termsAccepted")} aria-invalid={Boolean(errors.termsAccepted)} aria-describedby={errors.termsAccepted ? "termsAccepted-error" : undefined} /><span>Li e concordo com os <a href="/termos" target="_blank">Termos</a> e a <a href="/privacidade" target="_blank">Política de Privacidade</a>.</span></label><FieldError id="termsAccepted-error" message={errors.termsAccepted?.message} /></div><FormActions onBack={onBack} /></form>;
}

function SummaryStep({ booking, reading }: { booking: BookingDraft; reading: Reading }) {
  return <div><StepIntro eyebrow="RESUMO" title="Revise com calma." copy="Confira os dados antes de acessar a demonstração de pagamento." /><div className="payment-review"><div><span>Leitura</span><strong>{reading.name}</strong></div><div><span>Entrega</span><strong>{reading.fulfillmentType === "async" ? "Por mensagem" : `${booking.modality ? getModalityLabel(booking.modality) : "—"} · ${booking.date ? formatDate(booking.date) : "—"} · ${booking.time || "—"}`}</strong></div>{reading.fulfillmentType === "async" && <div><span>Questão</span><strong>{booking.question}</strong></div>}<div><span>Contato</span><strong>{booking.name} · {booking.email}</strong></div><div><span>Valor</span><strong className="payment-total">{formatBRL(reading.priceCents)}</strong></div></div></div>;
}

const paymentStatusLabels: Record<PaymentStatus, string> = { awaiting_payment: "Aguardando pagamento", rejected: "Pagamento recusado", expired: "Pagamento expirado", cancelled: "Pagamento cancelado", approved: "Pagamento aprovado", refunded: "Pagamento reembolsado" };

function PaymentStep({ reading, onBack, onConfirm }: { reading: Reading; onBack: () => void; onConfirm: (method: PaymentMethod) => Promise<void> }) {
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [status, setStatus] = useState<PaymentStatus>("awaiting_payment");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    track("mock_checkout_viewed", { service: reading.slug, paymentStatus: status });
  }, [reading.slug, status]);

  const confirm = async () => {
    setSubmitting(true);
    try { await onConfirm(method); } finally { setSubmitting(false); }
  };

  return <div><StepIntro eyebrow="PAGAMENTO · DEMONSTRAÇÃO" title="Escolha como continuar." copy="Nenhuma cobrança será realizada. A integração de pagamento será montada aqui futuramente." /><div className="payment-methods" role="group" aria-label="Forma de pagamento demonstrativa"><button type="button" className={method === "pix" ? "selected" : ""} aria-pressed={method === "pix"} onClick={() => setMethod("pix")}><QrCode size={19} /> Pix</button><button type="button" className={method === "card" ? "selected" : ""} aria-pressed={method === "card"} onClick={() => setMethod("card")}><CreditCard size={19} /> Cartão</button></div><div className="payment-placeholder"><ShieldCheck size={20} /><div><strong>{method === "pix" ? "Área reservada para checkout Pix" : "Área reservada para o componente seguro de cartão"}</strong><p>Não informe dados reais. Este frontend não processa nem armazena dados de pagamento.</p></div></div><div className={`payment-status status-${status}`} role="status"><span>Status visual</span><strong>{paymentStatusLabels[status]}</strong>{status === "approved" && <small>Aprovação demonstrativa manual; não gera evento de compra.</small>}</div>{import.meta.env.DEV && <label className="dev-status-control" htmlFor="mock-payment-status">Simular estado visual em desenvolvimento<select id="mock-payment-status" value={status} onChange={(event) => setStatus(event.target.value as PaymentStatus)}>{Object.entries(paymentStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}<div className="booking-actions"><button className="button button-ghost" type="button" onClick={onBack}><ArrowLeft size={15} /> Voltar</button><button className="button button-primary" type="button" disabled={submitting} onClick={confirm}>Criar pré-reserva <ArrowRight size={15} /></button></div><p className="payment-disclaimer"><ShieldCheck size={14} /> A confirmação real dependerá do pagamento verificado em uma próxima fase. Nenhum evento de compra é emitido neste mock.</p></div>;
}

function BookingSummary({ booking, reading }: { booking: BookingDraft; reading: Reading }) {
  return <aside className="booking-summary"><span className="section-kicker">RESUMO</span><div className="summary-symbol">✦</div><h2>{reading.name}</h2><p>{reading.description}</p><div className="summary-line"><span>Valor inicial</span><strong>{formatBRL(reading.priceCents)}</strong></div>{booking.modality && <div className="summary-line"><span>Modalidade</span><strong>{getModalityLabel(booking.modality)}</strong></div>}{reading.fulfillmentType === "scheduled" && booking.date && <div className="summary-line"><span>Quando</span><strong>{formatDate(booking.date)} {booking.time && `· ${booking.time}`}</strong></div>}{reading.fulfillmentType === "async" && <div className="summary-line"><span>Entrega</span><strong>{reading.estimatedDelivery}</strong></div>}<div className="summary-note"><LockKeyhole size={15} /> Seus dados são tratados com privacidade.</div></aside>;
}

function CatalogBookingState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="site-shell booking-shell"><SiteHeader /><main className="confirmation-page section-pad"><span className="section-kicker">ATENDIMENTO</span><h1>Organizando<br /><em>as leituras.</em></h1><p className="confirmation-lede" role={onRetry ? "alert" : "status"}>{message}</p>{onRetry && <button className="button button-primary" type="button" onClick={onRetry}>Tentar novamente</button>}</main></div>;
}

function StepIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <div className="step-intro"><span className="section-kicker">{eyebrow}</span><h2>{title}</h2><p>{copy}</p></div>;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p className="field-error" id={id} role="alert">{message}</p> : null;
}

function FormActions({ onBack }: { onBack: () => void }) {
  return <div className="booking-actions"><button className="button button-ghost" type="button" onClick={onBack}><ArrowLeft size={15} /> Voltar</button><button className="button button-primary" type="submit">Continuar <ArrowRight size={15} /></button></div>;
}
