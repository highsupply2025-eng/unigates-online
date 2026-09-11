import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import SimpleHeader from "@/components/SimpleHeader";
import SEO from "@/components/SEO";
import SiteFooter from "@/components/SiteFooter";
import { useState } from "react";

const Contact = () => {
  const { language, dir } = useLanguage();
  const { toast } = useToast();
  const isRtl = dir === "rtl";
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast({
        title: language === "ar" ? "تم إرسال رسالتك بنجاح" : "Message sent successfully",
        description: language === "ar" ? "سنتواصل معك في أقرب وقت" : "We'll get back to you soon",
      });
    }, 1000);
  };

  const content = {
    ar: {
      title: "تواصل معنا",
      subtitle: "نحن هنا لمساعدتك. لا تتردد في التواصل معنا بأي طريقة تناسبك",
      formTitle: "أرسل لنا رسالة",
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      subject: "الموضوع",
      message: "الرسالة",
      send: "إرسال الرسالة",
      sending: "جاري الإرسال...",
      contactInfo: "معلومات التواصل",
      channels: [
        { icon: MessageCircle, title: "واتساب", desc: "استجابة فورية", value: "00966563057356", color: "bg-[#25D366]", href: "https://wa.me/966563057356?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D9%88%D8%A7%D9%84%D8%AA%D9%88%D8%A7%D8%B5%D9%84%20%D8%A8%D8%AE%D8%B5%D9%88%D8%B5%20%D9%85%D9%86%D8%B8%D9%88%D9%85%D8%A9%20UNIGATES" },
        { icon: Mail, title: "البريد الإلكتروني", desc: "نرد خلال 24 ساعة", value: "info@unigates.com", color: "bg-gradient-to-r from-primary to-[hsl(200,75%,30%)]", href: "mailto:info@unigates.com" },
        { icon: Phone, title: "الهاتف", desc: "أيام العمل 9ص - 5م", value: "00966563057356", color: "bg-primary", href: "tel:+966563057356" },
        { icon: MapPin, title: "العنوان", desc: "المملكة العربية السعودية", value: "الرياض", color: "bg-primary", href: "#" },
      ],
      hours: "ساعات العمل",
      hoursText: "الأحد - الخميس: 9:00 صباحاً - 5:00 مساءً\nالجمعة والسبت: مغلق\nالدعم عبر الواتساب: متاح على مدار الساعة",
    },
    en: {
      title: "Contact Us",
      subtitle: "We're here to help. Don't hesitate to reach out through any channel that suits you",
      formTitle: "Send us a message",
      name: "Full Name",
      email: "Email",
      subject: "Subject",
      message: "Message",
      send: "Send Message",
      sending: "Sending...",
      contactInfo: "Contact Information",
      channels: [
        { icon: MessageCircle, title: "WhatsApp", desc: "Instant response", value: "00966563057356", color: "bg-[#25D366]", href: "https://wa.me/966563057356?text=Hello%2C%20I%20would%20like%20to%20inquire%20about%20the%20UNIGATES%20platform" },
        { icon: Mail, title: "Email", desc: "We reply within 24 hours", value: "info@unigates.com", color: "bg-gradient-to-r from-primary to-[hsl(200,75%,30%)]", href: "mailto:info@unigates.com" },
        { icon: Phone, title: "Phone", desc: "Workdays 9AM - 5PM", value: "00966563057356", color: "bg-primary", href: "tel:+966563057356" },
        { icon: MapPin, title: "Address", desc: "Kingdom of Saudi Arabia", value: "Riyadh", color: "bg-primary", href: "#" },
      ],
      hours: "Working Hours",
      hoursText: "Sunday - Thursday: 9:00 AM - 5:00 PM\nFriday & Saturday: Closed\nWhatsApp support: Available 24/7",
    },
  };

  const c = content[language];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <SEO
        title={isRtl ? "تواصل معنا — UNIGATES" : "Contact UNIGATES"}
        description={isRtl ? "تواصل مع فريق UNIGATES عبر البريد الإلكتروني، الهاتف، أو نموذج التواصل." : "Get in touch with the UNIGATES team via email, phone, or our contact form."}
      />
      <SimpleHeader />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(200,75%,30%)] shadow-xl shadow-primary/30 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-4">{c.title}</h1>
            <p className="text-foreground/70 max-w-2xl mx-auto">{c.subtitle}</p>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
            {/* Contact Form */}
            <div className="bg-card border-2 border-primary/20 rounded-2xl p-8 shadow-md">
              <h2 className="text-2xl font-black text-foreground mb-6">{c.formTitle}</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="contact_name" className="text-foreground font-bold">{c.name}</Label>
                  <Input id="contact_name" name="name" autoComplete="name" required className="mt-1.5 border-2 border-primary/20 focus:border-primary" />
                </div>
                <div>
                  <Label htmlFor="contact_email" className="text-foreground font-bold">{c.email}</Label>
                  <Input id="contact_email" name="email" type="email" autoComplete="email" required className="mt-1.5 border-2 border-primary/20 focus:border-primary" />
                </div>
                <div>
                  <Label htmlFor="contact_subject" className="text-foreground font-bold">{c.subject}</Label>
                  <Input id="contact_subject" name="subject" required className="mt-1.5 border-2 border-primary/20 focus:border-primary" />
                </div>
                <div>
                  <Label htmlFor="contact_message" className="text-foreground font-bold">{c.message}</Label>
                  <Textarea id="contact_message" name="message" required rows={5} className="mt-1.5 border-2 border-primary/20 focus:border-primary" />
                </div>
                <Button type="submit" disabled={sending} className="w-full bg-gradient-to-r from-primary to-[hsl(200,75%,30%)] shadow-md text-white font-bold h-12">
                  {sending ? c.sending : c.send}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-foreground mb-6">{c.contactInfo}</h2>
              {c.channels.map((ch, i) => (
                <a key={i} href={ch.href} target={ch.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="flex items-start gap-4 bg-card border border-primary/15 rounded-xl p-5 hover:shadow-md transition-shadow group">
                  <div className={`w-12 h-12 rounded-xl ${ch.color} flex items-center justify-center flex-shrink-0 text-white group-hover:scale-105 transition-transform`}>
                    <ch.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-bold">{ch.title}</h3>
                    <p className="text-foreground/60 text-sm">{ch.desc}</p>
                    <p className="text-primary font-bold text-sm mt-1">{ch.value}</p>
                  </div>
                </a>
              ))}

              <div className="bg-card border-2 border-primary/15 rounded-xl p-6 mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-foreground font-bold">{c.hours}</h3>
                </div>
                <p className="text-foreground/70 text-sm whitespace-pre-line leading-relaxed">{c.hoursText}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Contact;
