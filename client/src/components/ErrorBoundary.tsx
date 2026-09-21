import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error("Celeste render error", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="error-page section-pad">
        <AlertTriangle aria-hidden="true" />
        <span className="section-kicker">ALGO SAIU DO CAMINHO</span>
        <h1>Não foi possível abrir<br /><em>esta página.</em></h1>
        <button className="button button-primary" onClick={() => window.location.reload()}>
          Tentar novamente <RotateCcw size={15} aria-hidden="true" />
        </button>
      </main>
    );
  }
}
