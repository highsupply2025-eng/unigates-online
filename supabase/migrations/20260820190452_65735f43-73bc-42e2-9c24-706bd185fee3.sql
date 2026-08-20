CREATE OR REPLACE FUNCTION public.is_any_institution_owner(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = _user_id
      AND (
        EXISTS (SELECT 1 FROM public.college_registrations cr WHERE lower(cr.email) = lower(u.email) AND cr.status = 'approved')
        OR EXISTS (SELECT 1 FROM public.institute_registrations ir WHERE lower(ir.email) = lower(u.email) AND ir.status = 'approved')
        OR EXISTS (SELECT 1 FROM public.school_registrations sr WHERE lower(sr.email) = lower(u.email) AND sr.status = 'approved')
      )
  )
$function$;