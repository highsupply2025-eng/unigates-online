import { useEffect, useState } from "react";
import { Bell, ChevronDown, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface Notification {
  id: string;
  title_en: string;
  title_ar: string;
  message_en: string;
  message_ar: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

interface Props {
  /** When provided, fires whenever unread count changes (used for header badge). */
  onUnreadChange?: (n: number) => void;
}

const typeColors: Record<string, string> = {
  general: "bg-blue-100 text-blue-700",
  alert: "bg-red-100 text-red-700",
  success: "bg-green-100 text-green-700",
  info: "bg-purple-100 text-purple-700",
};

const NotificationsInline = ({ onUnreadChange }: Props) => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications((data as Notification[]) || []);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("notifications-inline")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const unread = notifications.filter(n => !n.is_read).length;
  useEffect(() => { onUnreadChange?.(unread); }, [unread, onUnreadChange]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const ids = notifications.filter(n => !n.is_read).map(n => n.id);
    if (ids.length) {
      await Promise.all(ids.map(id => supabase.from("notifications").update({ is_read: true }).eq("id", id)));
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return isAr ? "الآن" : "now";
    if (mins < 60) return isAr ? `منذ ${mins} د` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return isAr ? `منذ ${hrs} س` : `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return isAr ? `منذ ${days} ي` : `${days}d ago`;
  };

  return (
    <div className="rounded-md border border-border/50">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm hover:bg-muted/40 rounded-md"
      >
        <Bell className="w-4 h-4 text-primary shrink-0" />
        <span className="flex-1 text-start font-medium">{isAr ? "الإشعارات" : "Notifications"}</span>
        {unread > 0 && (
          <span className="min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-border/50">
          {unread > 0 && (
            <div className="px-2 py-1.5 flex justify-end">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); markAllRead(); }}
                className="text-[11px] inline-flex items-center gap-1 text-primary hover:underline"
              >
                <CheckCheck className="w-3 h-3" />
                {isAr ? "قراءة الكل" : "Read all"}
              </button>
            </div>
          )}
          <ScrollArea className="max-h-64">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs">
                <Bell className="w-6 h-6 mx-auto mb-1.5 opacity-30" />
                {isAr ? "لا توجد إشعارات" : "No notifications"}
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={(e) => { e.stopPropagation(); if (!n.is_read) markAsRead(n.id); }}
                  className={`px-2.5 py-2 border-t border-border/40 hover:bg-muted/30 cursor-pointer ${!n.is_read ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-semibold text-xs truncate">{isAr ? n.title_ar : n.title_en}</span>
                        <Badge className={`text-[9px] px-1 py-0 ${typeColors[n.notification_type] || typeColors.general}`}>
                          {n.notification_type}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{isAr ? n.message_ar : n.message_en}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default NotificationsInline;
