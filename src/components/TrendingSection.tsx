import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const trendingShows = [
  { title: "Stranger Things", rank: 1, color: "from-red-900 to-red-700" },
  { title: "Wednesday", rank: 2, color: "from-purple-900 to-purple-700" },
  { title: "The Night Agent", rank: 3, color: "from-blue-900 to-blue-700" },
  { title: "Bridgerton", rank: 4, color: "from-pink-900 to-pink-700" },
  { title: "Squid Game", rank: 5, color: "from-green-900 to-green-700" },
  { title: "The Lincoln Lawyer", rank: 6, color: "from-amber-900 to-amber-700" },
  { title: "Love Is Blind", rank: 7, color: "from-rose-900 to-rose-700" },
  { title: "The Queen", rank: 8, color: "from-teal-900 to-teal-700" },
  { title: "Black Mirror", rank: 9, color: "from-slate-800 to-slate-600" },
  { title: "Breaking Bad", rank: 10, color: "from-emerald-900 to-emerald-700" },
];

const TrendingSection = () => {
  const [filter, setFilter] = useState("saudi");

  return (
    <section className="section-divider py-12 md:py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Trending Now</h2>
        <Tabs value={filter} onValueChange={setFilter} className="mb-8">
          <TabsList className="bg-transparent border border-border p-0 h-auto">
            <TabsTrigger
              value="saudi"
              className="data-[state=active]:bg-secondary data-[state=active]:text-foreground rounded-none px-4 py-2 text-sm"
            >
              Saudi Arabia
            </TabsTrigger>
            <TabsTrigger
              value="global"
              className="data-[state=active]:bg-secondary data-[state=active]:text-foreground rounded-none px-4 py-2 text-sm"
            >
              Global
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {trendingShows.map((show) => (
            <div key={show.rank} className="relative flex-shrink-0 w-[140px] md:w-[180px] group cursor-pointer">
              <div className={`aspect-[2/3] rounded bg-gradient-to-br ${show.color} flex items-end p-3 transition-transform group-hover:scale-105`}>
                <p className="text-sm font-semibold text-foreground leading-tight">{show.title}</p>
              </div>
              <span className="absolute -left-2 -bottom-2 text-6xl md:text-7xl font-black text-foreground/20 leading-none select-none" style={{ textShadow: '2px 2px 0 hsl(0 0% 0%)' }}>
                {show.rank}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingSection;
