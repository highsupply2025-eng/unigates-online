-- Add institution messaging and support for new faculty roles:
--  - مدرس (teacher) — dashboard like department_head
--  - أمين الكلية / أمين المعهد (college_secretary)
--  - مدير المكتبة (library_manager)
-- Messaging: contact box in dropdown opens page with faculty + college admin and starts correspondence

-- 1. Institution messages table (faculty ↔ administration, excluding students)
CREATE TABLE IF NOT EXISTS public.institution_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  institution_type TEXT NOT NULL CHECK (institution_type IN ('college','institute')),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_institution_messages_institution ON public.institution_messages(institution_id, institution_type);
CREATE INDEX IF NOT EXISTS idx_institution_messages_sender ON public.institution_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_institution_messages_receiver ON public.institution_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_institution_messages_created ON public.institution_messages(created_at DESC);

ALTER TABLE public.institution_messages ENABLE ROW LEVEL SECURITY;

-- Helper: is user part of institution (admin or faculty, excluding pure students)?
CREATE OR REPLACE FUNCTION public.is_institution_member(_user_id uuid, _institution_id uuid, _institution_type text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    -- institution admin (college/institute email owner, approved or pending)
    SELECT 1 FROM public.college_registrations cr
    WHERE cr.id = _institution_id AND _institution_type = 'college'
      AND lower(cr.email) = lower((SELECT email FROM auth.users WHERE id = _user_id))
      AND cr.status IN ('approved','pending')
    UNION ALL
    SELECT 1 FROM public.institute_registrations ir
    WHERE ir.id = _institution_id AND _institution_type = 'institute'
      AND lower(ir.email) = lower((SELECT email FROM auth.users WHERE id = _user_id))
      AND ir.status IN ('approved','pending')
    UNION ALL
    -- faculty member (any specific_role except pure student)
    SELECT 1 FROM public.institution_faculty_members ifm
    WHERE ifm.user_id = _user_id
      AND ifm.institution_id = _institution_id
      AND ifm.institution_type = _institution_type
  )
$$;

DROP POLICY IF EXISTS "institution_messages_select_own" ON public.institution_messages;
CREATE POLICY "institution_messages_select_own" ON public.institution_messages
  FOR SELECT TO authenticated
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

DROP POLICY IF EXISTS "institution_messages_insert_member" ON public.institution_messages;
CREATE POLICY "institution_messages_insert_member" ON public.institution_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND receiver_id != sender_id
    -- receiver must not be a pure student (exclude department_members role student via profile check)
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = receiver_id AND p.role = 'student'
    )
    AND public.is_institution_member(sender_id, institution_id, institution_type)
    AND public.is_institution_member(receiver_id, institution_id, institution_type)
  );

DROP POLICY IF EXISTS "institution_messages_delete_own" ON public.institution_messages;
CREATE POLICY "institution_messages_delete_own" ON public.institution_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

GRANT SELECT, INSERT, DELETE ON public.institution_messages TO authenticated;
GRANT ALL ON public.institution_messages TO service_role;

-- 2. Ensure new specific roles are documented (no enum, just text, so no DB change needed)
-- The Edge Function create-faculty-account already updated to allow:
--   teacher, college_secretary, library_manager
-- and maps them to profile/app roles.

-- 3. Allow Realtime for messages
-- (Supabase Realtime is enabled by default for new tables if publication includes it;
-- ensure table is added to supabase_realtime publication if not already)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.institution_messages';
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;
