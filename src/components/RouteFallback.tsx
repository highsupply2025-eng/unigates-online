import { useEffect, useState } from "react";

/**
 * Top progress bar shown while a lazy route chunk is loading.
 * We delay rendering for 180ms so already-prefetched chunks swap
 * instantly with no visible bar flash.
 */
const RouteFallback = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[100] h-0.5 overflow-hidden bg-transparent pointer-events-none">
      <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent animate-[routebar_1s_ease-in-out_infinite]" />
      <style>{`
        @keyframes routebar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

export default RouteFallback;
