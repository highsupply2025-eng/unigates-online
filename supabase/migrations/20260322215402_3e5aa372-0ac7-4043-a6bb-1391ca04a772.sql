
-- Admin can update courses
CREATE POLICY "Admins can update courses"
ON public.courses FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete courses
CREATE POLICY "Admins can delete courses"
ON public.courses FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert courses
CREATE POLICY "Admins can insert courses"
ON public.courses FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can update book orders
CREATE POLICY "Admins can update orders"
ON public.book_orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete book orders
CREATE POLICY "Admins can delete orders"
ON public.book_orders FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete subscriptions
CREATE POLICY "Admins can delete subscriptions"
ON public.user_subscriptions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update live streams
CREATE POLICY "Admins can update streams"
ON public.live_streams FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete live streams
CREATE POLICY "Admins can delete streams"
ON public.live_streams FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update profiles
CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
