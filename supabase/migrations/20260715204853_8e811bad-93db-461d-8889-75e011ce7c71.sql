DO $$
DECLARE t text;
DECLARE tables text[] := ARRAY[
  'college_members','courses','live_streams','assignments','course_episodes',
  'lecturer_ratings','stream_attendance','quizzes','quiz_submissions',
  'lecture_schedules','assignment_submissions','student_presence_checkins',
  'college_registrations','institute_registrations','departments',
  'department_members','user_roles','profiles','college_invitations','institute_invitations'
];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;