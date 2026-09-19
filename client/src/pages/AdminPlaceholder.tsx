import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";

export default function AdminPlaceholder() {
  return <div className="site-shell"><SiteHeader /><main className="confirmation-page section-pad"><div className="confirmation-icon"><LockKeyhole size={24} /></div><span className="section-kicker">ÁREA RESTRITA · FRONTEND</span><h1>Área administrativa<br /><em>em desenvolvimento.</em></h1><p className="confirmation-lede">O dashboard será conectado posteriormente ao backend, autenticação e banco de dados. Nenhuma lógica administrativa está ativa nesta versão.</p><Link href="/" className="button button-ghost" style={{ marginTop: 32 }}><ArrowLeft size={15} /> Voltar para a Celeste</Link></main></div>;
}
