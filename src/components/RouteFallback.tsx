/**
 * Top progress bar shown while a lazy route chunk is loading.
 * Replaces the previous blank fallback so navigation feels instant.
 */
const RouteFallback = () => (
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

export default RouteFallback;
