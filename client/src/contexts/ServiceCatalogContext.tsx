import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { serviceCatalogService, type ServiceCatalogService } from "@/services/serviceCatalogService";
import type { Reading } from "@/types/domain";

type ServiceCatalogState = {
  services: Reading[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

const ServiceCatalogContext = createContext<ServiceCatalogState | null>(null);

export function ServiceCatalogProvider({
  children,
  service = serviceCatalogService,
}: {
  children: ReactNode;
  service?: ServiceCatalogService;
}) {
  const [services, setServices] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void service.listServices()
      .then((result) => {
        if (!active) return;
        setServices(result);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setServices([]);
        setError("Não foi possível carregar as leituras. Tente novamente em instantes.");
        setLoading(false);
      });
    return () => { active = false; };
  }, [revision, service]);

  const value = useMemo(() => ({
    services,
    loading,
    error,
    reload: () => setRevision((current) => current + 1),
  }), [error, loading, services]);

  return <ServiceCatalogContext.Provider value={value}>{children}</ServiceCatalogContext.Provider>;
}

export function useServiceCatalog() {
  const context = useContext(ServiceCatalogContext);
  if (!context) throw new Error("useServiceCatalog must be used inside ServiceCatalogProvider");
  return context;
}
