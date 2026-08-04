import { useEffect, useState } from "react";
import RouteProgressBar from "./RouteProgressBar";

/**
 * Top progress bar shown while a lazy route chunk is loading.
 * We delay rendering for 180ms so already-prefetched chunks swap
 * instantly with no visible bar flash.
 */
const RouteFallback = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 180);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return <RouteProgressBar />;
};

export default RouteFallback;
