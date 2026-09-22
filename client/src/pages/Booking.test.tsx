import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Booking from "@/pages/Booking";
import { ServiceCatalogProvider } from "@/contexts/ServiceCatalogContext";
import { MockServiceCatalogService } from "@/services/serviceCatalogService";

function renderAt(path: string) {
  window.history.replaceState({}, "", path);
  return render(<ServiceCatalogProvider service={new MockServiceCatalogService()}><Booking /></ServiceCatalogProvider>);
}

describe("Booking", () => {
  it("pré-seleciona serviço informado por querystring", async () => {
    renderAt("/agendar?servico=amor-relacoes");
    expect(await screen.findByRole("button", { name: /Amor & Relações/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("pré-seleciona modalidade e filtra leituras compatíveis", async () => {
    renderAt("/agendar?modalidade=voice");
    expect(await screen.findByText(/Mostrando leituras compatíveis com Chamada de voz/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Pergunta Direta/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entre Caminhos/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("fluxo async não mostra calendário e apresenta questão", async () => {
    const user = userEvent.setup();
    renderAt("/agendar?servico=pergunta-direta");
    await user.click(await screen.findByRole("button", { name: /Continuar/ }));
    expect(screen.getByRole("heading", { name: "O que pede clareza?" })).toBeInTheDocument();
    expect(screen.queryByText("Encontre um momento.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /09:/ })).not.toBeInTheDocument();
  });

  it("fluxo scheduled mostra etapa de calendário", async () => {
    const user = userEvent.setup();
    renderAt("/agendar?servico=amor-relacoes&modalidade=voice");
    await user.click(await screen.findByRole("button", { name: /Continuar/ }));
    expect(screen.getByRole("heading", { name: "Como prefere conversar?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Chamada de voz/ })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /Continuar/ }));
    expect(screen.getByRole("heading", { name: "Encontre um momento." })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole("button", { pressed: false }).length).toBeGreaterThan(0));
  });

  it("não avança com e-mail inválido ou termos não aceitos", async () => {
    const user = userEvent.setup();
    renderAt("/agendar?servico=pergunta-direta");
    await user.click(await screen.findByRole("button", { name: /Continuar/ }));
    await user.type(screen.getByLabelText("Pergunta"), "Como posso olhar para esta mudança?");
    await user.click(screen.getByRole("button", { name: /Continuar/ }));

    await user.type(screen.getByLabelText("Nome"), "Ana Costa");
    await user.type(screen.getByLabelText("E-mail"), "ana@");
    await user.type(screen.getByLabelText("WhatsApp"), "(11) 99999-9999");
    await user.click(screen.getByRole("button", { name: /Continuar/ }));

    expect(await screen.findByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(screen.getByText(/precisa aceitar os Termos/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Como podemos te encontrar?" })).toBeInTheDocument();
  });
});
