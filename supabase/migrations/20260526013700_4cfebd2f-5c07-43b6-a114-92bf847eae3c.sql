
CREATE TABLE public.cloudflare_live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  live_input_uid text NOT NULL UNIQUE,
  rtmps_url text NOT NULL,
  rtmps_stream_key text NOT NULL,
  playback_hls_url text,
  playback_dash_url text,
  recording_uid text,
  status text NOT NULL DEFAULT 'idle',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cloudflare_live_streams ENABLE ROW LEVEL SECURITY;

-- Public view (no stream key) for students
CREATE OR REPLACE VIEW public.cloudflare_live_streams_public
WITH (security_invoker = true) AS
SELECT id, lecturer_id, title, description, live_input_uid,
       playback_hls_url, playback_dash_url, recording_uid,
       status, started_at, ended_at, created_at
FROM public.cloudflare_live_streams;

-- Lecturer can manage own streams
CREATE POLICY "Lecturer manages own streams"
ON public.cloudflare_live_streams
FOR ALL
USING (auth.uid() = lecturer_id)
WITH CHECK (auth.uid() = lecturer_id);

-- Admin manages all
CREATE POLICY "Admin manages all streams"
ON public.cloudflare_live_streams
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view public fields (via the view's underlying select)
CREATE POLICY "Authenticated can view public stream fields"
ON public.cloudflare_live_streams
FOR SELECT
TO authenticated
USING (true);

CREATE TRIGGER trg_cf_streams_updated
BEFORE UPDATE ON public.cloudflare_live_streams
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_cf_streams_lecturer ON public.cloudflare_live_streams(lecturer_id);
CREATE INDEX idx_cf_streams_status ON public.cloudflare_live_streams(status);
