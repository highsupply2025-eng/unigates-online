import { useState, useRef, useEffect, ReactNode } from "react";
import { MessageCircle, X, Send, ExternalLink, Sparkles, RefreshCw, Landmark, School, GraduationCap, BookOpen, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

const WHATSAPP_NUMBER = "00966563057356";
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

type Message = { role: "user" | "assistant"; content: string };

// Helper to render markdown links [text](url) as clickable React Router links
const renderMessageContent = (text: string, navigate: (to: string) => void): ReactNode[] => {
  const parts: ReactNode[] = [];
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const label = match[1];
    const url = match[2];
    
    if (url.startsWith("/")) {
      parts.push(
        <button
          key={`${match.index}-${url}`}
          onClick={() => navigate(url)}
          className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 my-0.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-xs underline-offset-2"
        >
          <span>{label}</span>
          <span className="text-[10px]">↗</span>
        </button>
      );
    } else {
      parts.push(
        <a
          key={`${match.index}-${url}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 my-0.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-xs"
        >
          <span>{label}</span>
          <span className="text-[10px]">↗</span>
        </a>
      );
    }
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
};

const AIChatWidget = () => {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const welcomeMsg = isRtl
    ? "مرحباً بك في UNIGATES! 👋 أنا مساعدك الذكي اللحظي. كيف يمكنني مساعدتك اليوم؟ يمكنك سؤالي عن إنشاء الحسابات، تسجيل الكليات والمدارس، أو استعراض الدورات والمكتبة."
    : "Welcome to UNIGATES! 👋 I'm your real-time AI advisor. How can I guide you today? Ask me about account setup, institutional onboarding, courses, or bookstore.";

  const quickPrompts = isRtl
    ? [
        { label: "🏛️ كيف أسجل كليتي أو معهدي؟", prompt: "كيف يمكنني تسجيل كليتي أو معهدي كمسؤول مؤسسي؟ وما هي الخطوات؟" },
        { label: "🏫 كيف أسجل مدرسة جديدة؟", prompt: "أريد تسجيل مدرسة في المنصة المدرسية، ما هي طريقة إنشاء الحساب والبيانات المطلوبة؟" },
        { label: "🎓 كيف أنشئ حساب كطالب؟", prompt: "كيف أنشئ حساب طالب جديد للوصول إلى المحاضرات والواجبات؟" },
        { label: "👨‍🏫 كيف أنضم كعضو هيئة تدريس أو معلم؟", prompt: "كيف يتم إنشاء حساب محاضر أو معلم وربطه بالكلية أو المدرسة؟" },
        { label: "🔒 كيف تعمل سلاسل اعتماد الاختبارات؟", prompt: "اشرح لي آلية سلاسل الاعتماد الرقمي للاختبارات من رئيس القسم حتى العميد." },
      ]
    : [
        { label: "🏛️ Register College / Institute", prompt: "How do I register a college or institute on UNIGATES?" },
        { label: "🏫 Register School", prompt: "How do I onboard a new K-12 school?" },
        { label: "🎓 Student Sign Up", prompt: "How do I create a student account?" },
        { label: "👨‍🏫 Faculty / Teacher Sign Up", prompt: "How do I join as faculty or teacher?" },
        { label: "🔒 Exam Approval Chains", prompt: "How do digital exam approval workflows work?" },
      ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const streamChat = async (allMessages: Message[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: allMessages,
        pageContext: {
          pathname: location.pathname,
          language,
        },
      }),
    });

    if (!resp.ok || !resp.body) {
      throw new Error("Failed to start stream");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantSoFar }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleSendText = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat(updated);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isRtl
            ? "عذراً، حدث خطأ في الاتصال. يمكنك التواصل المباشر مع فريق الدعم عبر الواتساب: [تواصل عبر الواتساب](https://wa.me/00966563057356)."
            : "Sorry, a connection error occurred. You can reach out directly via WhatsApp: [Contact on WhatsApp](https://wa.me/00966563057356).",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}`, "_blank");
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Floating Trigger Button on the Right - Vertical Orientation */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 group flex flex-col items-center gap-2.5 py-3.5 px-2 sm:px-2.5 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-blue-600 via-indigo-600 to-purple-700 text-white shadow-2xl shadow-indigo-500/40 hover:scale-105 hover:-translate-x-1 transition-all duration-300 ring-2 ring-white/40 dark:ring-white/20 cursor-pointer"
          aria-label="Open AI Assistant"
        >
          {/* Top Live Icon */}
          <div className="relative w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-xs group-hover:scale-110 transition-transform">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            <span className="absolute -top-1 -end-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-1 -end-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
          </div>

          {/* Vertical Text */}
          <span
            className="font-black text-[11px] sm:text-xs tracking-wider text-slate-100 group-hover:text-amber-300 transition-colors select-none py-1"
            style={{
              writingMode: "vertical-rl",
              transform: isRtl ? "rotate(180deg)" : "rotate(180deg)",
              letterSpacing: "1px",
            }}
          >
            {isRtl ? "مساعد UNIGATES الذكي" : "UNIGATES AI ASSISTANT"}
          </span>

          {/* Bottom Mini Sparkle */}
          <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
          </div>
        </button>
      )}

      {/* Chat Window Anchored on the Right */}
      {isOpen && (
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-50 w-[380px] max-w-[calc(100vw-1.5rem)] h-[580px] max-h-[calc(100vh-3rem)] bg-card border-2 border-primary/30 rounded-3xl shadow-2xl shadow-indigo-500/30 flex flex-col overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-4 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-xs">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <p className="font-black text-sm leading-tight flex items-center gap-1.5">
                  <span>UNIGATES AI</span>
                  <Badge className="bg-emerald-400/20 text-emerald-300 border-emerald-400/30 text-[9px] px-1.5 py-0">
                    {isRtl ? "متصل لحظياً" : "Live Online"}
                  </Badge>
                </p>
                <p className="text-[10px] text-slate-200 font-medium">
                  {isRtl ? "مستشارك التعليمي والتوجيهي" : "Your Smart Academic Advisor"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  title={isRtl ? "محادثة جديدة" : "New Chat"}
                  className="hover:bg-white/20 rounded-xl p-1.5 transition-colors text-white/80 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded-xl p-1.5 transition-colors text-white"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-muted/20">
            {/* Welcome message */}
            <div className="flex justify-start">
              <div className="max-w-[88%] bg-card border border-border/80 text-foreground rounded-2xl rounded-tl-xs p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs space-y-2">
                <p>{welcomeMsg}</p>
              </div>
            </div>

            {/* Quick Action Suggestion Chips (Shown on initial or empty chat) */}
            {messages.length === 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-black text-muted-foreground px-1">
                  {isRtl ? "⚡ استفسارات سريعة وشائعة:" : "⚡ Quick guidance options:"}
                </p>
                <div className="flex flex-col gap-1.5">
                  {quickPrompts.map((qp, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendText(qp.prompt)}
                      className="text-start px-3 py-2 rounded-xl bg-card hover:bg-primary/10 border border-border/80 hover:border-primary/40 text-xs font-bold text-foreground transition-all duration-200 shadow-xs flex items-center justify-between group"
                    >
                      <span className="line-clamp-1">{qp.label}</span>
                      <span className="text-primary text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message List */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs font-medium"
                      : "bg-card border border-border/80 text-foreground rounded-tl-xs font-normal whitespace-pre-wrap"
                  }`}
                >
                  {msg.role === "user"
                    ? msg.content
                    : renderMessageContent(msg.content, (to) => {
                        navigate(to);
                        setIsOpen(false);
                      })}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-card border border-border/80 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* WhatsApp Direct Support Button */}
          <div className="px-3 pt-2 bg-card border-t border-border/40">
            <button
              onClick={openWhatsApp}
              className="w-full flex items-center justify-center gap-2 text-xs text-white bg-[#25D366] hover:bg-[#20bd5a] rounded-xl py-2 px-3 transition-all duration-200 font-bold shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isRtl ? "محادثة الدعم المباشر عبر الواتساب" : "Chat on Official WhatsApp"}</span>
            </button>
          </div>

          {/* Text Input Footer */}
          <div className="p-3 bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendText(input);
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRtl ? "اكتب استفسارك أو الجهة التي ترغب بتسجيلها..." : "Type your inquiry or institution name..."}
                className="flex-1 bg-muted/60 border border-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="rounded-xl w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all shrink-0"
              >
                <Send className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;
