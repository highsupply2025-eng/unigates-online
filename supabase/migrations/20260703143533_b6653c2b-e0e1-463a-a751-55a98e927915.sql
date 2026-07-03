GRANT SELECT, INSERT ON public.college_registrations TO anon, authenticated;
GRANT UPDATE, DELETE ON public.college_registrations TO authenticated;
GRANT ALL ON public.college_registrations TO service_role;

GRANT SELECT, INSERT ON public.institute_registrations TO anon, authenticated;
GRANT UPDATE, DELETE ON public.institute_registrations TO authenticated;
GRANT ALL ON public.institute_registrations TO service_role;

GRANT SELECT, INSERT ON public.school_registrations TO anon, authenticated;
GRANT UPDATE, DELETE ON public.school_registrations TO authenticated;
GRANT ALL ON public.school_registrations TO service_role;