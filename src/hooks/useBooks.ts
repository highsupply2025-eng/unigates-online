import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Book {
  id: string;
  title_ar: string;
  title_en: string;
  author_ar: string;
  author_en: string;
  description_ar: string | null;
  description_en: string | null;
  price: number;
  original_price: number | null;
  category: string;
  pages: number;
  format: string;
  cover_url: string | null;
  is_bestseller: boolean;
  is_new: boolean;
  rating: number;
  reviews_count: number;
}

export const useBooks = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["books"],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Book[];
    },
  });
};
