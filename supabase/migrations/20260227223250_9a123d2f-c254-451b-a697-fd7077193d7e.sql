
-- Courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  instructor_ar TEXT NOT NULL,
  instructor_en TEXT NOT NULL,
  category_ar TEXT NOT NULL,
  category_en TEXT NOT NULL,
  episode_count INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT false,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Course views tracking
CREATE TABLE public.course_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Weekly top viewed courses (materialized cache)
CREATE TABLE public.weekly_top_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  view_count INTEGER NOT NULL DEFAULT 0,
  week_start TIMESTAMP WITH TIME ZONE NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_top_courses ENABLE ROW LEVEL SECURITY;

-- Courses are publicly readable
CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (true);

-- Anyone can record a view
CREATE POLICY "Anyone can record views" ON public.course_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Views are readable by everyone" ON public.course_views FOR SELECT USING (true);

-- Weekly top is publicly readable
CREATE POLICY "Weekly top courses are viewable by everyone" ON public.weekly_top_courses FOR SELECT USING (true);

-- Function to calculate weekly top courses
CREATE OR REPLACE FUNCTION public.calculate_weekly_top_courses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  week_start_date TIMESTAMP WITH TIME ZONE;
BEGIN
  week_start_date := date_trunc('week', now());
  
  -- Clear previous week's data
  DELETE FROM weekly_top_courses WHERE week_start = week_start_date;
  
  -- Insert top 30 courses by views this week
  INSERT INTO weekly_top_courses (course_id, view_count, week_start)
  SELECT 
    cv.course_id,
    COUNT(*) as view_count,
    week_start_date
  FROM course_views cv
  WHERE cv.viewed_at >= week_start_date
  GROUP BY cv.course_id
  ORDER BY view_count DESC
  LIMIT 30;
END;
$$;

-- Indexes for performance
CREATE INDEX idx_course_views_viewed_at ON public.course_views(viewed_at);
CREATE INDEX idx_course_views_course_id ON public.course_views(course_id);
CREATE INDEX idx_weekly_top_week_start ON public.weekly_top_courses(week_start);
CREATE INDEX idx_courses_is_free ON public.courses(is_free);
CREATE INDEX idx_courses_created_at ON public.courses(created_at);

-- Trigger for updated_at on courses
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
