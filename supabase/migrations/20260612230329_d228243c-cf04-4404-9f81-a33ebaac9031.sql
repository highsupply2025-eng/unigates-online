
ALTER TABLE public.department_members
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS national_id text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS qualification text,
  ADD COLUMN IF NOT EXISTS specialization text,
  ADD COLUMN IF NOT EXISTS hire_date date,
  ADD COLUMN IF NOT EXISTS notes text;
