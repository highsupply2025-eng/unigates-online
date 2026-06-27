/**
 * Route transition overlay shown while a lazy route chunk loads.
 * Displays the UNIGATES logo with a subtle pulse + top progress bar
 * so navigation feels branded and instant.
 */
const RouteFallback = () => (
  <>
    <div className="fixed top-0 inset-x-0 z-[100] h-0.5 overflow-hidden bg-transparent pointer-events-none">
      <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent animate-[routebar_0.8s_ease-in-out_infinite]" />
    </div>
    <div className="fixed inset-0 z-[99] flex items-center justify-center bg-background/70 backdrop-blur-sm pointer-events-none animate-[routefade_0.15s_ease-out]">
      <img
        src="/images/unigates-logo.png"
        alt="UNIGATES"
        className="w-28 h-28 sm:w-36 sm:h-36 object-contain animate-[logopulse_1.2s_ease-in-out_infinite] drop-shadow-2xl"
      />
    </div>
    <style>{`
      @keyframes routebar {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(400%); }
      }
      @keyframes logopulse {
        0%, 100% { transform: scale(1); opacity: 0.85; }
        50% { transform: scale(1.08); opacity: 1; }
      }
      @keyframes routefade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `}</style>
  </>
);

export default RouteFallback;
