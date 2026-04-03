-- Fix 1: Remove overly permissive SELECT policy on college_invitations
DROP POLICY IF EXISTS "Authenticated users can view active invitations" ON public.college_invitations;

-- Replace with scoped policy: admins see all, college members see their own college's invitations
CREATE POLICY "Admins can view all invitations"
ON public.college_invitations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "College members can view own college invitations"
ON public.college_invitations
FOR SELECT
TO authenticated
USING (
  college_id IN (
    SELECT cm.college_id FROM public.college_members cm WHERE cm.user_id = auth.uid()
  )
);

-- Fix 2: Remove overly permissive assignment-files upload policy
DROP POLICY IF EXISTS "Auth users can upload assignment files" ON storage.objects;
