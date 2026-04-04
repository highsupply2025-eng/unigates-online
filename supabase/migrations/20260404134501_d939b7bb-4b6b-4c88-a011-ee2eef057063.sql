-- Fix: Remove college members' ability to read invitation codes
-- Only admins should see invitation codes
DROP POLICY "College members can view own college invitations" ON public.college_invitations;