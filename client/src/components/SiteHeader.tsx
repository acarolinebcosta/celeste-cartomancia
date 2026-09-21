import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import BrandMark from "@/components/BrandMark";
import { navItems } from "@/data/navigation";

const MOBILE_MENU_ID = "celeste-mobile-navigation";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [location, setLocation] = useLocation();
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const goTo = (href: string) => {
    setOpen(false);
    if (href.startsWith("/#") && location === "/") {
      document.querySelector(href.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setLocation(href);
    }
  };

  return (
    <header className={`site-header ${isScrolled || open ? "is-scrolled" : ""}`}>
      <div className="site-header-inner">
        <Link href="/" className="wordmark" onClick={() => setOpen(false)} aria-label="Celeste Cartomancia, início">
          <BrandMark /><span>CELESTE</span><small>cartomancia</small>
        </Link>
        <nav className="desktop-nav" aria-label="Navegação principal">
          {navItems.map((item) => <button key={item.href} type="button" onClick={() => goTo(item.href)}>{item.label}</button>)}
        </nav>
        <div className="header-actions">
          <Link href="/agendar" className="text-cta" onClick={() => setOpen(false)}>Agendar <span aria-hidden="true">↗</span></Link>
          <button ref={toggleRef} className="icon-button mobile-menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls={MOBILE_MENU_ID} aria-label={open ? "Fechar menu" : "Abrir menu"}>
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      <nav id={MOBILE_MENU_ID} className={`mobile-nav ${open ? "is-open" : ""}`} aria-label="Navegação mobile" hidden={!open}>
        {navItems.map((item) => <button key={item.href} type="button" onClick={() => goTo(item.href)}>{item.label}</button>)}
        <Link href="/agendar" onClick={() => setOpen(false)}>Agendar uma leitura <span aria-hidden="true">↗</span></Link>
      </nav>
    </header>
  );
}
