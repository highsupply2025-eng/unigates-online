import { Button } from "@/components/ui/button";

const PromoBanner = () => {
  return (
    <section className="bg-gradient-to-r from-[hsl(260,60%,20%)] via-background to-background py-4 px-6 md:px-12">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-3xl">🍿</span>
          <div>
            <p className="font-semibold text-foreground">
              The Netflix you love for just SAR 25.99.
            </p>
            <p className="text-sm text-muted-foreground">
              Get our most affordable, ad-supported plan.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="whitespace-nowrap border-foreground text-foreground hover:bg-foreground hover:text-background">
          Learn More
        </Button>
      </div>
    </section>
  );
};

export default PromoBanner;
