
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'lecturer', 'student');

-- 2. Create user_roles table with approval status
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if role is approved
CREATE OR REPLACE FUNCTION public.has_approved_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND approved = true
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roles"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Add creator_id to courses table
ALTER TABLE public.courses ADD COLUMN creator_id UUID REFERENCES auth.users(id);

-- Update courses RLS - lecturers can manage own courses
CREATE POLICY "Approved lecturers can insert courses"
ON public.courses FOR INSERT
WITH CHECK (public.has_approved_role(auth.uid(), 'lecturer') AND auth.uid() = creator_id);

CREATE POLICY "Lecturers can update own courses"
ON public.courses FOR UPDATE
USING (auth.uid() = creator_id);

CREATE POLICY "Lecturers can delete own courses"
ON public.courses FOR DELETE
USING (auth.uid() = creator_id);

-- 4. Course episodes table
CREATE TABLE public.course_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  episode_number INTEGER NOT NULL DEFAULT 1,
  video_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  is_preview BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Episodes viewable by everyone"
ON public.course_episodes FOR SELECT
USING (true);

CREATE POLICY "Lecturers can insert episodes"
ON public.course_episodes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = course_id AND creator_id = auth.uid()
  )
);

CREATE POLICY "Lecturers can update own episodes"
ON public.course_episodes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = course_id AND creator_id = auth.uid()
  )
);

CREATE POLICY "Lecturers can delete own episodes"
ON public.course_episodes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = course_id AND creator_id = auth.uid()
  )
);

-- 5. Course attachments table
CREATE TABLE public.course_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attachments viewable by everyone"
ON public.course_attachments FOR SELECT
USING (true);

CREATE POLICY "Lecturers can insert attachments"
ON public.course_attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = course_id AND creator_id = auth.uid()
  )
);

CREATE POLICY "Lecturers can delete own attachments"
ON public.course_attachments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = course_id AND creator_id = auth.uid()
  )
);

-- 6. Trigger for updated_at on new tables
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_episodes_updated_at
BEFORE UPDATE ON public.course_episodes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Storage bucket for course content (videos/attachments)
INSERT INTO storage.buckets (id, name, public) VALUES ('course-content', 'course-content', false);

CREATE POLICY "Lecturers can upload course content"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'course-content' AND public.has_approved_role(auth.uid(), 'lecturer'));

CREATE POLICY "Lecturers can view own course content"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-content' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Lecturers can delete own course content"
ON storage.objects FOR DELETE
USING (bucket_id = 'course-content' AND auth.uid()::text = (storage.foldername(name))[1]);
