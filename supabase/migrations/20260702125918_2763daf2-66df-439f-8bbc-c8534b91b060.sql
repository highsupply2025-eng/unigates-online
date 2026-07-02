-- Add training_center and language_center to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'training_center';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'language_center';