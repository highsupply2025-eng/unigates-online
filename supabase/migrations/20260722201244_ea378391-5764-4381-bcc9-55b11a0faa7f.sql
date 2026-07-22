
CREATE OR REPLACE FUNCTION public.enforce_book_order_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price numeric;
BEGIN
  SELECT price INTO v_price FROM public.books WHERE id = NEW.book_id;
  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Book not found';
  END IF;
  NEW.amount := v_price;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_book_order_price_trg ON public.book_orders;
CREATE TRIGGER enforce_book_order_price_trg
  BEFORE INSERT OR UPDATE OF amount, book_id ON public.book_orders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_book_order_price();

CREATE OR REPLACE FUNCTION public.confirm_registration_email(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT public.is_email_confirmed(auth.uid()) THEN
    RAISE EXCEPTION 'Email not verified';
  END IF;

  SELECT lower(email) INTO v_caller_email FROM auth.users WHERE id = auth.uid();

  IF v_caller_email IS NULL OR v_caller_email <> lower(_email) THEN
    RAISE EXCEPTION 'Forbidden: can only confirm your own registration';
  END IF;

  UPDATE public.college_registrations
    SET email_confirmed = true
    WHERE lower(email) = v_caller_email AND email_confirmed = false;

  UPDATE public.institute_registrations
    SET email_confirmed = true
    WHERE lower(email) = v_caller_email AND email_confirmed = false;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_registration_email(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.confirm_registration_email(text) TO authenticated;
