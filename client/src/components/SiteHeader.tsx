import { Menu, Moon, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { navItems } from "@/lib/content";

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <Moon size={15} strokeWidth={1.3} />
    </span>
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();

  const goTo = (href: string) => {
    setOpen(false);
    if (href.startsWith("/#") && location === "/") {
      document.querySelector(href.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setLocation(href);
    }
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="wordmark" onClick={() => setOpen(false)} aria-label="Celeste Cartomancia, início">
          <BrandMark />
          <span>CELESTE</span>
          <small>cartomancia</small>
        </Link>

        <nav className={`desktop-nav ${open ? "is-open" : ""}`} aria-label="Navegação principal">
          {navItems.map((item) => (
            <button key={item.href} type="button" onClick={() => goTo(item.href)}>{item.label}</button>
          ))}
        </nav>

        <div className="header-actions">
          <Link href="/agendar" className="text-cta" onClick={() => setOpen(false)}>Agendar <span aria-hidden="true">↗</span></Link>
          <button className="icon-button mobile-menu-button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Fechar menu" : "Abrir menu"}>
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      <div className={`mobile-nav ${open ? "is-open" : ""}`}>
        {navItems.map((item) => (
          <button key={item.href} type="button" onClick={() => goTo(item.href)}>{item.label}</button>
        ))}
        <Link href="/agendar" onClick={() => setOpen(false)}>Agendar uma leitura <span aria-hidden="true">↗</span></Link>
      </div>
    </header>
  );
}
