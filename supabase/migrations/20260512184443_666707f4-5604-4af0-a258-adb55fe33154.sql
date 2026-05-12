CREATE TABLE public.live_stream_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stream_id, user_id)
);

ALTER TABLE public.live_stream_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings"
  ON public.live_stream_ratings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can rate"
  ON public.live_stream_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own rating"
  ON public.live_stream_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own rating"
  ON public.live_stream_ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_live_stream_ratings_stream ON public.live_stream_ratings(stream_id);