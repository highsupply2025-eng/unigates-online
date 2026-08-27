-- Migration: Delete test course "نن" / "sfsfsfsf" and associated records
DO $$
DECLARE
  v_course_ids uuid[];
BEGIN
  -- Find all test courses with title 'نن' or 'sfsfsfsf' or instructor 'sfsfsfsf'
  SELECT array_agg(id) INTO v_course_ids
  FROM public.courses
  WHERE title_ar = 'نن'
     OR title_en = 'sfsfsfsf'
     OR instructor_ar = 'sfsfsfsf'
     OR instructor_en = 'sfsfsfsf';

  IF v_course_ids IS NOT NULL AND array_length(v_course_ids, 1) > 0 THEN
    -- Delete from related tables
    DELETE FROM public.course_episodes WHERE course_id = ANY(v_course_ids);
    DELETE FROM public.course_attachments WHERE course_id = ANY(v_course_ids);
    DELETE FROM public.user_subscriptions WHERE course_id = ANY(v_course_ids);
    DELETE FROM public.assignments WHERE course_id = ANY(v_course_ids);
    DELETE FROM public.schedules WHERE course_id = ANY(v_course_ids);
    
    -- Delete the courses
    DELETE FROM public.courses WHERE id = ANY(v_course_ids);
  END IF;
END $$;
