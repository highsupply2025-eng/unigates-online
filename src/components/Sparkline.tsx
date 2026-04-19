import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

interface SparklineProps {
  data: number[];
  color?: string;
}

export const Sparkline = ({ data, color = "hsl(var(--primary))" }: SparklineProps) => {
  const chartData = data.map((value, i) => ({ i, value }));
  return (
    <div className="w-full h-8 mt-1.5 -mb-1">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <YAxis hide domain={[0, "dataMax + 1"]} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Bucket ISO timestamps into the last `days` days (oldest -> newest). */
export const bucketByDay = (timestamps: string[], days = 7): number[] => {
  const buckets = new Array(days).fill(0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  timestamps.forEach((ts) => {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < days) buckets[days - 1 - diff] += 1;
  });
  return buckets;
};
