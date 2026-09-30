import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Sun, 
  Moon, 
  Bookmark, 
  Highlighter, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Lock, 
  FileText, 
  Sparkles, 
  HelpCircle,
  Clock,
  Maximize,
  Minimize,
  Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { BookStoreItem, PurchasedBook } from "@/types/bookStore";
import { BookStoreDataStore } from "@/services/bookStoreDataStore";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";

interface ReaderEbookModalProps {
  purchasedBook: PurchasedBook;
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const ReaderEbookModal: React.FC<ReaderEbookModalProps> = ({
  purchasedBook,
  isOpen,
  onClose,
  userEmail = "reader@unigates.online",
}) => {
  const { dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const book = purchasedBook.book;
  const chapters = book.full_content_chapters || [];

  const [currentChapterIndex, setCurrentChapterIndex] = useState(
    purchasedBook.lastReadChapterIndex || 0
  );
  const [fontSize, setFontSize] = useState<number>(18);
  const [lineHeight, setLineHeight] = useState<number>(1.8);
  const [readingTheme, setReadingTheme] = useState<"light" | "sepia" | "dark">("light");
  const [showSecurityNotice, setShowSecurityNotice] = useState(false);
  const [securityViolationsCount, setSecurityViolationsCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readingTimerSeconds, setReadingTimerSeconds] = useState(0);
  const [isReadingVoiceActive, setIsReadingVoiceActive] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [showNotesPanel, setShowNotesPanel] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);

  // Dynamic dynamic watermark positions
  const [watermarkPos, setWatermarkPos] = useState({ top: "20%", left: "30%" });

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const top = Math.floor(10 + Math.random() * 70) + "%";
      const left = Math.floor(10 + Math.random() * 70) + "%";
      setWatermarkPos({ top, left });
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Reading Timer
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setReadingTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Update progress on chapter change
  const handleChapterChange = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= chapters.length) return;
    setCurrentChapterIndex(newIndex);
    const progress = Math.round(((newIndex + 1) / (chapters.length || 1)) * 100);
    BookStoreDataStore.updateReadingProgress(purchasedBook.id, newIndex, progress);
  };

  // DRM & Anti-Piracy / Anti-Screenshot / Anti-Copy Listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent PrintScreen, Ctrl+P, Ctrl+S, Ctrl+U, Ctrl+C, F12, Ctrl+Shift+I
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && (e.key === "p" || e.key === "P" || e.key === "s" || e.key === "S" || e.key === "u" || e.key === "U" || e.key === "c" || e.key === "C")) ||
        (e.metaKey && (e.key === "p" || e.key === "P" || e.key === "s" || e.key === "S" || e.key === "c" || e.key === "C")) ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityViolation(
          isRtl
            ? "تنبيه أمني DRM: تصوير الشاشة والنسخ والطباعة محظورة تماماً لحماية حقوق المؤلف والناشر."
            : "DRM Security Alert: Screenshots, copying, and printing are strictly prohibited to protect publisher copyright."
        );
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerSecurityViolation(
        isRtl
          ? "القائمة المنسدلة والنسخ معطلة لحماية المحتوى الرقمي."
          : "Right-click context menu is disabled for content protection."
      );
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerSecurityViolation(
        isRtl ? "نسخ النصوص غير مسموح." : "Copying text is not allowed."
      );
    };

    // When user leaves window or tries screenshot capture tool
    const handleBlur = () => {
      setShowSecurityNotice(true);
    };
    const handleFocus = () => {
      setShowSecurityNotice(false);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("contextmenu", handleContextMenu, true);
    window.addEventListener("copy", handleCopy, true);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("copy", handleCopy, true);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isOpen, isRtl]);

  const triggerSecurityViolation = (msg: string) => {
    setSecurityViolationsCount((c) => c + 1);
    toast({
      title: isRtl ? "🔒 حماية المحتوى الرقمي (DRM Guard)" : "🔒 DRM Content Protection",
      description: msg,
      variant: "destructive",
    });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    BookStoreDataStore.addReadingNote(purchasedBook.id, currentChapterIndex, newNoteText.trim());
    setNewNoteText("");
    toast({
      title: isRtl ? "تم حفظ الملاحظة" : "Note Saved",
      description: isRtl ? "تمت إضافة الملاحظة إلى سجل قراءتك لهذا الكتاب." : "Note added to your reading log.",
    });
  };

  // Text to speech simulation
  const toggleAudioReader = () => {
    if (!("speechSynthesis" in window)) {
      toast({
        title: isRtl ? "غير مدعوم" : "Not Supported",
        description: isRtl ? "خاصية القراءة الصوتية غير مدعومة في هذا المتصفح." : "Speech synthesis not supported in this browser.",
      });
      return;
    }

    if (isReadingVoiceActive) {
      window.speechSynthesis.cancel();
      setIsReadingVoiceActive(false);
    } else {
      const currentChapter = chapters[currentChapterIndex];
      const textToRead = isRtl ? currentChapter?.content_ar : currentChapter?.content_en;
      if (!textToRead) return;

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = isRtl ? "ar-SA" : "en-US";
      utterance.rate = 0.9;
      utterance.onend = () => setIsReadingVoiceActive(false);
      utterance.onerror = () => setIsReadingVoiceActive(false);
      window.speechSynthesis.speak(utterance);
      setIsReadingVoiceActive(true);
    }
  };

  if (!isOpen) return null;

  const currentChapter = chapters[currentChapterIndex] || {
    id: "default",
    title_ar: "محتوى الكتاب الرقمي",
    title_en: "Digital Book Content",
    content_ar: "جاري تحميل محتوى الكتاب المشفر...",
    content_en: "Loading encrypted book content...",
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md select-none">
      {/* DRM Secure Overlay Container */}
      <div
        ref={containerRef}
        className={`relative w-full h-full flex flex-col transition-colors duration-300 ${
          readingTheme === "dark"
            ? "bg-zinc-950 text-zinc-100"
            : readingTheme === "sepia"
            ? "bg-[#fbf0d9] text-[#433422]"
            : "bg-white text-slate-900"
        }`}
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
      >
        {/* Anti-Screen Capture Moving Watermark */}
        <div
          className="pointer-events-none fixed z-40 transition-all duration-1000 ease-in-out font-mono font-bold opacity-15 text-xs select-none"
          style={{ top: watermarkPos.top, left: watermarkPos.left }}
        >
          <div className="p-2 rounded border border-current text-center rotate-[-12deg]">
            <p>UNIGATES DRM SECURE PROTECTED</p>
            <p>LICENSED TO: {userEmail}</p>
            <p>BOOK: {book.code} • {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Floating Diagonal Multi-Watermarks */}
        <div className="pointer-events-none fixed inset-0 z-30 opacity-5 flex flex-col justify-around overflow-hidden select-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="whitespace-nowrap font-black text-sm tracking-widest rotate-[-15deg] select-none">
              UNIGATES E-READER • READ-ONLY DRM • {userEmail} • {book.isbn} • UNIGATES E-READER • READ-ONLY DRM • {userEmail}
            </div>
          ))}
        </div>

        {/* Top Control Bar */}
        <header className="relative z-50 flex items-center justify-between px-4 py-3 border-b border-current/10 shadow-sm shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black truncate">
                {isRtl ? book.title_ar : book.title_en}
              </h2>
              <p className="text-xs opacity-70 truncate">
                {isRtl ? book.author_ar : book.author_en} • {book.publisher_ar}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Reading Timer */}
            <Badge variant="outline" className="hidden sm:flex items-center gap-1 text-xs py-1 border-current/20">
              <Clock className="w-3 h-3" />
              <span>{formatTimer(readingTimerSeconds)}</span>
            </Badge>

            {/* Offline Badge */}
            <Badge variant="secondary" className="hidden md:inline-flex text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {isRtl ? "متاح بدون إنترنت (محمي)" : "Offline Ready (DRM)"}
            </Badge>

            {/* Audio Voice Reading */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudioReader}
              className={`h-9 w-9 rounded-xl ${isReadingVoiceActive ? "bg-amber-500/20 text-amber-600" : ""}`}
              title={isRtl ? "قراءة صوتية ذكية" : "Audio Reader"}
            >
              {isReadingVoiceActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>

            {/* Theme Selector */}
            <div className="flex items-center rounded-lg border border-current/20 p-0.5">
              <button
                onClick={() => setReadingTheme("light")}
                className={`px-2 py-1 text-xs font-bold rounded ${readingTheme === "light" ? "bg-white text-slate-900 shadow-xs" : "opacity-70"}`}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setReadingTheme("sepia")}
                className={`px-2 py-1 text-xs font-bold rounded ${readingTheme === "sepia" ? "bg-[#e8d7b8] text-[#433422] shadow-xs" : "opacity-70"}`}
              >
                Sepia
              </button>
              <button
                onClick={() => setReadingTheme("dark")}
                className={`px-2 py-1 text-xs font-bold rounded ${readingTheme === "dark" ? "bg-zinc-800 text-zinc-100 shadow-xs" : "opacity-70"}`}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Font Zoom Controls */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => setFontSize((f) => Math.max(14, f - 2))}
              title={isRtl ? "تصغير الخط" : "Zoom Out"}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => setFontSize((f) => Math.min(30, f + 2))}
              title={isRtl ? "تكبير الخط" : "Zoom In"}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hidden sm:flex"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>

            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-xl hover:bg-red-500/10 hover:text-red-500"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Security Warning Popover if window loses focus */}
        {showSecurityNotice && (
          <div className="absolute inset-x-0 top-14 z-50 p-3 bg-amber-500/90 text-slate-950 text-xs font-bold text-center flex items-center justify-center gap-2 backdrop-blur-sm shadow-md animate-in fade-in">
            <Lock className="w-4 h-4" />
            <span>
              {isRtl
                ? "وضع الحماية النشط DRM: تم حجب أي برامج خارجية لمحاولة التقاط الشاشة أو التسجيل."
                : "Active DRM Guard: External screen capture/recording tools are actively blocked."}
            </span>
          </div>
        )}

        {/* Main Book Reader Workspace */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Chapter Navigation Sidebar (Desktop) */}
          <aside className="w-64 border-e border-current/10 hidden lg:flex flex-col p-4 shrink-0 overflow-y-auto">
            <h3 className="text-xs font-black uppercase tracking-wider mb-3 opacity-75">
              {isRtl ? "فهرس فصول الكتاب" : "Table of Contents"}
            </h3>
            <div className="space-y-1.5">
              {chapters.map((ch, idx) => (
                <button
                  key={ch.id}
                  onClick={() => handleChapterChange(idx)}
                  className={`w-full text-start p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    currentChapterIndex === idx
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : "hover:bg-current/5 opacity-80 hover:opacity-100"
                  }`}
                >
                  <span className="truncate">{isRtl ? ch.title_ar : ch.title_en}</span>
                  {currentChapterIndex === idx && <Bookmark className="w-3.5 h-3.5 fill-current shrink-0 ms-1" />}
                </button>
              ))}
            </div>

            {/* Reading Notes Box */}
            <div className="mt-6 pt-4 border-t border-current/10">
              <h4 className="text-xs font-bold mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>{isRtl ? "ملاحظاتي الشخصية" : "My Reading Notes"}</span>
              </h4>
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder={isRtl ? "اكتب تدوينة أو ملخصاً سريعاً..." : "Add a private reading note..."}
                rows={3}
                className="w-full text-xs p-2 rounded-lg bg-current/5 border border-current/10 focus:outline-hidden focus:border-amber-500 text-inherit placeholder:opacity-50"
              />
              <Button size="sm" onClick={handleAddNote} className="w-full mt-2 h-7 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white">
                {isRtl ? "حفظ الملاحظة" : "Save Note"}
              </Button>
            </div>
          </aside>

          {/* Book Content Viewer */}
          <main className="flex-1 flex flex-col overflow-y-auto px-4 sm:px-12 md:px-24 py-8 max-w-4xl mx-auto w-full">
            {/* Chapter Header */}
            <div className="mb-6 pb-4 border-b border-current/10">
              <div className="flex items-center justify-between gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] font-bold border-current/20">
                  {isRtl ? `الفصل ${currentChapterIndex + 1} من ${chapters.length || 1}` : `Chapter ${currentChapterIndex + 1} of ${chapters.length || 1}`}
                </Badge>
                <span className="text-[10px] opacity-60 font-mono">
                  ISBN: {book.isbn}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black mt-2">
                {isRtl ? currentChapter.title_ar : currentChapter.title_en}
              </h1>
            </div>

            {/* Protected Content Body */}
            <div
              ref={textContentRef}
              className="leading-relaxed font-serif whitespace-pre-line select-none flex-1"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              {isRtl ? currentChapter.content_ar : currentChapter.content_en}
            </div>

            {/* Bottom Chapter Navigator */}
            <div className="mt-12 pt-6 border-t border-current/10 flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleChapterChange(currentChapterIndex - 1)}
                disabled={currentChapterIndex === 0}
                className="font-bold border-current/20 gap-1.5"
              >
                {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                <span>{isRtl ? "الفصل السابق" : "Previous Chapter"}</span>
              </Button>

              <div className="text-xs font-bold opacity-75">
                {Math.round(((currentChapterIndex + 1) / (chapters.length || 1)) * 100)}% {isRtl ? "مكتمل" : "Completed"}
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={() => handleChapterChange(currentChapterIndex + 1)}
                disabled={currentChapterIndex >= chapters.length - 1}
                className="font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
              >
                <span>{isRtl ? "الفصل التالي" : "Next Chapter"}</span>
                {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </main>
        </div>

        {/* Footer Info Bar */}
        <footer className="px-4 py-2 border-t border-current/10 text-[11px] opacity-70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {isRtl
                ? "منظومة القراءة الآمنة DRM — مرخص لـ " + userEmail
                : "DRM Secure Reader — Licensed to " + userEmail}
            </span>
          </div>
          <div>
            <span>{isRtl ? "دار عبيد للنشر والتوزيع © 2026" : "Dar Obeid Publishing © 2026"}</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
