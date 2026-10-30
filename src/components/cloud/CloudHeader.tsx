import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ArrowUpLeft, Globe, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/unigates-logo-transparent.png";

export default function CloudHeader() {
  const { isRtl, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => { if (active) setSignedIn(Boolean(data.session)); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  const links = [["#spaces", "المساحات السحابية", "Cloud spaces"], ["#possibilities", "داخل مساحتك", "Your workspace"], ["#how-it-works", "كيف تبدأ؟", "How it works"], ["#questions", "الأسئلة الشائعة", "FAQs"]];
  return <header className="cloud-header">
    <Link to="/" className="cloud-brand" aria-label="UNIGATES"><img src={logo} alt="" width={44} height={44} /><div><strong>UNIGATES<span>®</span></strong><small>{isRtl ? "مساحة للتعليم. أفق بلا حدود." : "Space to teach. Room to grow."}</small></div></Link>
    <nav className="hidden xl:flex items-center gap-7" aria-label={isRtl ? "القائمة الرئيسية" : "Main navigation"}>{links.map(([href, ar, en]) => <a className="cloud-nav-link" key={href} href={`/${href}`}>{isRtl ? ar : en}</a>)}</nav>
    <div className="flex items-center gap-2 sm:gap-4">
      <Button variant="ghost" size="sm" onClick={() => setLanguage(isRtl ? "en" : "ar")} aria-label={isRtl ? "Switch to English" : "التحويل للعربية"}><Globe /> <span className="hidden sm:inline">{isRtl ? "EN" : "العربية"}</span></Button>
      <Button asChild variant="ghost" className="hidden md:inline-flex"><Link to={signedIn ? "/profile" : "/login"}><UserRound />{isRtl ? (signedIn ? "حسابي" : "تسجيل الدخول") : (signedIn ? "My profile" : "Sign in")}</Link></Button>
      <Button asChild className="cloud-primary hidden sm:inline-flex"><a href="/#spaces">{isRtl ? "احجز مساحتك" : "Get your space"}<ArrowUpLeft /></a></Button>
      <Button variant="ghost" size="icon" className="xl:hidden" aria-expanded={open} aria-label={isRtl ? "القائمة" : "Menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
    </div>
    {open && <nav className="cloud-mobile-menu" aria-label={isRtl ? "قائمة الجوال" : "Mobile menu"}>{links.map(([href, ar, en]) => <a key={href} href={`/${href}`} onClick={() => setOpen(false)}>{isRtl ? ar : en}</a>)}<Link to={signedIn ? "/profile" : "/login"}>{isRtl ? (signedIn ? "حسابي" : "تسجيل الدخول") : (signedIn ? "My profile" : "Sign in")}</Link></nav>}
  </header>;
}