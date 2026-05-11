import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";
import LecturerPageHeader from "@/components/LecturerPageHeader";

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

const typeColors: Record<string, string> = {
  general: "bg-blue-100 text-blue-700",
  alert: "bg-red-100 text-red-700",
  success: "bg-green-100 text-green-700",
  info: "bg-purple-100 text-purple-700",
};

const Notifications = () => {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const roles = (data || []).map((r: any) => r.role as string);
      if (roles.includes("lecturer")) setRole("lecturer");
      else if (roles.length) setRole(roles[0]);
    })();
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setNotifications((data as Notification[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("notifications-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const unread = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const ids = notifications.filter(n => !n.is_read).map(n => n.id);
    if (!ids.length) return;
    await Promise.all(ids.map(id => supabase.from("notifications").update({ is_read: true }).eq("id", id)));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return isRtl ? "الآن" : "now";
    if (mins < 60) return isRtl ? `منذ ${mins} د` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return isRtl ? `منذ ${hrs} س` : `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return isRtl ? `منذ ${days} ي` : `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <StudentPageHeader titleAr="الإشعارات" titleEn="Notifications" icon={<Bell className="w-3.5 h-3.5" />} />
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              {isRtl ? "كل الإشعارات" : "All Notifications"}
            </h2>
            {unread > 0 && (
              <Badge className="bg-destructive text-destructive-foreground">
                {unread} {isRtl ? "جديد" : "new"}
              </Badge>
            )}
          </div>
          {unread > 0 && (
            <Button size="sm" variant="outline" onClick={markAllRead} className="gap-1.5">
              <CheckCheck className="w-4 h-4" />
              {isRtl ? "تعليم الكل كمقروء" : "Mark all read"}
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">{isRtl ? "لا توجد إشعارات" : "No notifications"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <Card
                key={n.id}
                onClick={() => { if (!n.is_read) markAsRead(n.id); }}
                className={`cursor-pointer transition-colors hover:bg-muted/40 ${!n.is_read ? "border-primary/40 bg-primary/5" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-sm text-foreground">{isRtl ? n.title_ar : n.title_en}</span>
                        <Badge className={`text-[10px] ${typeColors[n.notification_type] || typeColors.general}`}>
                          {n.notification_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{isRtl ? n.message_ar : n.message_en}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1.5">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;
