interface MiniBarsProps {
  data: number[];
  color?: string;
  className?: string;
}

/** Tiny inline bar chart used inside KPI card headers (replaces an icon). */
export const MiniBars = ({ data, color = "hsl(var(--primary))", className = "" }: MiniBarsProps) => {
  const safe = data && data.length ? data : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...safe, 1);
  return (
    <div className={`w-12 h-6 mx-auto mb-1 flex items-end justify-center gap-[2px] ${className}`}>
      {safe.map((v, i) => (
        <div
          key={i}
          style={{
            height: `${Math.max((v / max) * 100, 8)}%`,
            backgroundColor: color,
            width: "3px",
            borderRadius: "1px",
            opacity: v === 0 ? 0.25 : 1,
          }}
        />
      ))}
    </div>
  );
};
