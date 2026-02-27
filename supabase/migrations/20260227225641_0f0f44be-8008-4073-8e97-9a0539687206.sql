
-- Create storage bucket for course thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Course thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-thumbnails');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload course thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'course-thumbnails' AND auth.uid() IS NOT NULL);
