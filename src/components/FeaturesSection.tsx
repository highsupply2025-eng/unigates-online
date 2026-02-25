import { Tv, Download, Smartphone, Users } from "lucide-react";

const features = [
  {
    icon: Tv,
    title: "Enjoy on your TV",
    description: "Watch on Smart TVs, Playstation, Xbox, Chromecast, Apple TV, Blu-ray players, and more.",
  },
  {
    icon: Download,
    title: "Download your shows to watch offline",
    description: "Save your favorites easily and always have something to watch.",
  },
  {
    icon: Smartphone,
    title: "Watch everywhere",
    description: "Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV.",
  },
  {
    icon: Users,
    title: "Create profiles for kids",
    description: "Send kids on adventures with their favorite characters in a space made just for them — free with your membership.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="section-divider py-12 md:py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-10">More Reasons to Join</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-gradient-to-br from-secondary to-muted rounded-lg p-6 flex flex-col gap-4 min-h-[220px]"
            >
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
              <feature.icon className="w-10 h-10 text-primary self-end" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
