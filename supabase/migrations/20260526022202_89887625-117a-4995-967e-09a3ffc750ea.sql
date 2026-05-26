
-- Fix 1: Scope leadership view of institution_quizzes to their own institution
DROP POLICY IF EXISTS "Leadership can view institution quizzes" ON public.institution_quizzes;

CREATE POLICY "Leadership can view own institution quizzes"
ON public.institution_quizzes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leadership_institution_ids(auth.uid()) li
    WHERE li.institution_id = institution_quizzes.institution_id
      AND li.institution_type = institution_quizzes.institution_type
  )
);

-- Fix 2: Restrict student assignment-file uploads to the specific course they're subscribed to
DROP POLICY IF EXISTS "Subscribed students can upload assignment files" ON storage.objects;

CREATE POLICY "Subscribed students can upload assignment files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-files'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1
    FROM public.assignments a
    JOIN public.user_subscriptions us ON us.course_id = a.course_id
    WHERE a.id::text = (storage.foldername(name))[2]
      AND us.user_id = auth.uid()
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
  )
);
