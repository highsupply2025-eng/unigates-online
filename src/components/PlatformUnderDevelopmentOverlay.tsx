import React, { useState, useEffect } from "react";
import { PlatformKey, isPlatformUnderDevelopment } from "@/lib/platformAvailability";
import PlatformUnderDevelopment from "@/components/PlatformUnderDevelopment";

interface Props {
  platform: PlatformKey;
  children: React.ReactNode;
}

export const PlatformUnderDevelopmentOverlay: React.FC<Props> = ({ platform, children }) => {
  const [isUnderDev, setIsUnderDev] = useState<boolean>(() =>
    isPlatformUnderDevelopment(platform)
  );

  useEffect(() => {
    setIsUnderDev(isPlatformUnderDevelopment(platform));
  }, [platform]);

  // If platform is live or inside Lovable / local development environment:
  // Show full platform content and tools for active development & editing
  if (!isUnderDev) {
    return <>{children}</>;
  }

  // On production / for the public:
  // Render the dedicated "Under Development & Launching Soon" screen with underlying content completely hidden
  return <PlatformUnderDevelopment platform={platform} />;
};

export default PlatformUnderDevelopmentOverlay;
