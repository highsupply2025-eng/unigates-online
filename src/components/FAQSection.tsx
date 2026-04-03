import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const FAQSection = () => {
  const { t, language } = useLanguage();
  const ArrowIcon = language === "ar" ? ChevronLeft : ChevronRight;
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className={`section-divider py-12 md:py-20 px-6 md:px-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">{t.faq.title}</h2>

        <Accordion type="single" collapsible className="space-y-3">
          {t.faq.items.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card border-2 border-primary/15 rounded-xl overflow-hidden hover:border-primary/40 transition-colors"
            >
              <AccordionTrigger className="px-6 py-5 text-base md:text-lg font-semibold hover:no-underline hover:bg-primary/5 text-right">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-5 text-base text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

      </div>
    </section>
  );
};

export default FAQSection;
