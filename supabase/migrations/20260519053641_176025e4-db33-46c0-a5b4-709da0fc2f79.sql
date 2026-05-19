ALTER TABLE public.quizzes ALTER COLUMN vice_dean_type TYPE TEXT[] USING CASE WHEN vice_dean_type IS NULL THEN NULL ELSE ARRAY[vice_dean_type] END;
ALTER TABLE public.lecture_schedules ALTER COLUMN vice_dean_type TYPE TEXT[] USING CASE WHEN vice_dean_type IS NULL THEN NULL ELSE ARRAY[vice_dean_type] END;
ALTER TABLE public.quizzes ALTER COLUMN vice_dean_type SET DEFAULT ARRAY['students']::text[];
ALTER TABLE public.lecture_schedules ALTER COLUMN vice_dean_type SET DEFAULT ARRAY['students']::text[];