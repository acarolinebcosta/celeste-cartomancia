import { useContext } from "react";
import { ServiceCatalogContext } from "./serviceCatalogContext";

export function useServiceCatalog() {
  const context = useContext(ServiceCatalogContext);
  if (!context) throw new Error("useServiceCatalog must be used inside ServiceCatalogProvider");
  return context;
}
