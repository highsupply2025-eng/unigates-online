ALTER TABLE public.departments ADD COLUMN department_code text UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_code ON public.departments(department_code);
