import { useState } from "react";
import { brandAssets } from "@/config/brand";

export default function BrandMark() {
  const [failed, setFailed] = useState(false);

  return (
    <span className="brand-mark" aria-hidden="true">
      {!failed ? <img src={brandAssets.symbol} alt="" onError={() => setFailed(true)} /> : <span className="brand-fallback">☾</span>}
    </span>
  );
}
