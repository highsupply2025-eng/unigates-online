ALTER TABLE public.live_streams
  ADD COLUMN IF NOT EXISTS category_ar text,
  ADD COLUMN IF NOT EXISTS category_en text,
  ADD COLUMN IF NOT EXISTS instructor_ar text,
  ADD COLUMN IF NOT EXISTS instructor_en text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;