import { createContext } from "react";
import type { Reading } from "@/types/domain";

export type ServiceCatalogState = {
  services: Reading[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export const ServiceCatalogContext = createContext<ServiceCatalogState | null>(null);
