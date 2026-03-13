
-- Books table
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  author_ar TEXT NOT NULL,
  author_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  category TEXT NOT NULL DEFAULT 'programming',
  pages INTEGER DEFAULT 0,
  format TEXT DEFAULT 'PDF',
  cover_url TEXT,
  is_bestseller BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  rating NUMERIC(2,1) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Book orders table
CREATE TABLE public.book_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_orders ENABLE ROW LEVEL SECURITY;

-- Books: public read
CREATE POLICY "Books are viewable by everyone" ON public.books
  FOR SELECT USING (is_active = true);

-- Books: admin can manage
CREATE POLICY "Admins can insert books" ON public.books
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update books" ON public.books
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete books" ON public.books
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Orders: users can view own
CREATE POLICY "Users can view own orders" ON public.book_orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Orders: authenticated can insert own
CREATE POLICY "Users can create own orders" ON public.book_orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON public.book_orders
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
