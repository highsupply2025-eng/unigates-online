import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StudentPageHeader from "@/components/StudentPageHeader";
import SiteFooter from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";

const StudentRatings = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === "ar";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [avg, setAvg] = useState(0);

  useEffect(() => { (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const { data } = await supabase
      .from("lecturer_ratings")
      .select("id, lecturer_id, rating, comment, created_at")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });
    const list = data || [];
    const lecturerIds = Array.from(new Set(list.map((r: any) => r.lecturer_id)));
    let byId: Record<string, any> = {};
    if (lecturerIds.length > 0) {
      const { data: ps } = await supabase.from("profiles").select("user_id, full_name").in("user_id", lecturerIds);
      (ps || []).forEach((p: any) => { byId[p.user_id] = p; });
    }
    const enriched = list.map((r: any) => ({ ...r, lecturer: byId[r.lecturer_id] }));
    setRows(enriched);
    setAvg(enriched.length ? enriched.reduce((a: number, r: any) => a + r.rating, 0) / enriched.length : 0);
    setLoading(false);
  })(); }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StudentPageHeader titleAr="التقييمات" titleEn="Ratings" icon={<Star className="w-3 h-3" />} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-6 py-6">
        <h1 className="text-xl sm:text-2xl font-black mb-5 sm:mb-6 flex items-center gap-2.5">
          <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-yellow-500 to-amber-600 shadow-md shadow-amber-500/25">
            <Star className="w-5 h-5 text-white fill-white" strokeWidth={2.5} />
          </span>
          {isRtl ? "تقييماتي للمحاضرين" : "My Lecturer Ratings"}
        </h1>

        <Card className="mb-4">
          <CardContent className="p-5 text-center">
            <p className="text-xs text-muted-foreground mb-1">{isRtl ? "متوسط التقييم" : "Average Rating"}</p>
            <div className="flex items-center justify-center gap-1">
              <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
              <span className="text-3xl font-black">{avg ? avg.toFixed(1) : "—"}</span>
              <span className="text-muted-foreground text-sm">/ 5</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{rows.length} {isRtl ? "تقييم" : "ratings"}</p>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{isRtl ? "جاري التحميل..." : "Loading..."}</div>
        ) : rows.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">{isRtl ? "لم تقم بأي تقييم بعد" : "No ratings yet"}</CardContent></Card>
        ) : (
          <div className="grid gap-2">
            {rows.map(r => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h3 className="font-semibold text-sm truncate">{r.lecturer?.full_name || "—"}</h3>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < r.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString(isRtl ? "ar-EG" : "en-US")}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default StudentRatings;
