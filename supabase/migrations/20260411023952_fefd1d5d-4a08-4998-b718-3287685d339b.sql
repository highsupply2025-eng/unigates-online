
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en TEXT NOT NULL DEFAULT '',
  title_ar TEXT NOT NULL DEFAULT '',
  message_en TEXT NOT NULL DEFAULT '',
  message_ar TEXT NOT NULL DEFAULT '',
  notification_type TEXT NOT NULL DEFAULT 'general',
  sender_id UUID NOT NULL,
  recipient_id UUID,
  target_role TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage notifications"
ON public.notifications FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view notifications targeted to them or broadcast
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (
  recipient_id = auth.uid()
  OR (
    recipient_id IS NULL
    AND (
      target_role IS NULL
      OR target_role IN (SELECT role::text FROM public.user_roles WHERE user_id = auth.uid())
    )
  )
);

-- Users can mark their notifications as read
CREATE POLICY "Users can mark notifications read"
ON public.notifications FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
