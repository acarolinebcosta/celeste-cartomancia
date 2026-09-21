import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="not-found-page section-pad">
        <span className="not-found-code">404</span>
        <span className="section-kicker">PÁGINA NÃO ENCONTRADA</span>
        <h1>Nem todos os caminhos<br /><em>levam à mesma carta.</em></h1>
        <p>Esta página não foi encontrada.</p>
        <Link href="/" className="button button-primary"><ArrowLeft size={15} /> Voltar para a Celeste</Link>
      </main>
    </div>
  );
}
