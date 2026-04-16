ALTER TABLE public.active_sessions DROP CONSTRAINT IF EXISTS active_sessions_user_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS active_sessions_user_device_uidx
  ON public.active_sessions(user_id, device_id);