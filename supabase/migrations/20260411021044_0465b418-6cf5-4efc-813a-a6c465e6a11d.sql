-- Add new leadership roles to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'department_head';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vice_dean';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dean';
