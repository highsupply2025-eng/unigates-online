-- Allow public count access to profiles for stats
CREATE POLICY "Anyone can count profiles"
ON public.profiles
FOR SELECT
USING (true);
