-- ============ roles ============
CREATE TYPE public.app_role AS ENUM ('customer','worker','admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  phone text,
  role text NOT NULL DEFAULT 'CUSTOMER',
  language text NOT NULL DEFAULT 'English',
  state text DEFAULT '', district text DEFAULT '', mandal text DEFAULT '',
  village text DEFAULT '', pincode text DEFAULT '', landmark text DEFAULT '',
  lat double precision, lng double precision,
  status text NOT NULL DEFAULT 'APPROVED',
  rejection_reason text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX profiles_email_key ON public.profiles (lower(email));
CREATE UNIQUE INDEX profiles_phone_key ON public.profiles (phone) WHERE phone IS NOT NULL AND phone <> '';
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile write" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- ============ worker profiles ============
CREATE SEQUENCE public.worker_code_seq START 2000;

CREATE TABLE public.worker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_code text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  category_id text NOT NULL DEFAULT 'domestic',
  skills text[] NOT NULL DEFAULT '{}',
  society text NOT NULL DEFAULT '',
  membership_id text NOT NULL DEFAULT '',
  experience integer NOT NULL DEFAULT 0,
  hourly integer NOT NULL DEFAULT 300,
  languages text[] NOT NULL DEFAULT '{}',
  area text NOT NULL DEFAULT '',
  radius_km integer NOT NULL DEFAULT 10,
  rating numeric NOT NULL DEFAULT 0,
  jobs integer NOT NULL DEFAULT 0,
  completion_rate integer NOT NULL DEFAULT 100,
  available_now boolean NOT NULL DEFAULT true,
  availability_days text NOT NULL DEFAULT '',
  availability_time text NOT NULL DEFAULT '',
  certificates text NOT NULL DEFAULT '',
  kyc text NOT NULL DEFAULT '',
  payout text NOT NULL DEFAULT '',
  insurance text NOT NULL DEFAULT '',
  lat double precision, lng double precision,
  status text NOT NULL DEFAULT 'Pending',
  verified jsonb NOT NULL DEFAULT '{"identity":false,"skill":false,"certificate":false,"member":false}'::jsonb,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX worker_profiles_category_idx ON public.worker_profiles (category_id);
CREATE INDEX worker_profiles_status_idx ON public.worker_profiles (status);
GRANT SELECT, INSERT, UPDATE ON public.worker_profiles TO authenticated;
GRANT ALL ON public.worker_profiles TO service_role;
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workers readable" ON public.worker_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "worker self update" ON public.worker_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "worker self insert" ON public.worker_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============ bookings ============
CREATE TABLE public.bookings (
  id text PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_email text NOT NULL DEFAULT '',
  customer_name text NOT NULL DEFAULT '',
  customer_phone text,
  worker_code text NOT NULL REFERENCES public.worker_profiles(worker_code) ON DELETE RESTRICT,
  worker_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category_id text NOT NULL DEFAULT '',
  subservice text NOT NULL DEFAULT '',
  problem text NOT NULL DEFAULT '',
  date date NOT NULL,
  slot text NOT NULL DEFAULT '',
  start_at timestamptz NOT NULL DEFAULT now(),
  address text NOT NULL DEFAULT '',
  lat double precision, lng double precision, accuracy integer,
  location_source text NOT NULL DEFAULT 'manual',
  distance_km numeric NOT NULL DEFAULT 0,
  emergency boolean NOT NULL DEFAULT false,
  recurring text NOT NULL DEFAULT 'One-time',
  status text NOT NULL DEFAULT 'Pending',
  amount integer NOT NULL DEFAULT 0,
  materials integer NOT NULL DEFAULT 0,
  coop_fee integer NOT NULL DEFAULT 0,
  platform_fee integer NOT NULL DEFAULT 0,
  payment text NOT NULL DEFAULT 'Pending',
  payment_method text,
  txn text,
  paid_at timestamptz,
  demo_payment boolean,
  rating integer,
  review text,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bookings_customer_idx ON public.bookings (customer_id, created_at DESC);
CREATE INDEX bookings_worker_idx ON public.bookings (worker_code, created_at DESC);
CREATE INDEX bookings_worker_user_idx ON public.bookings (worker_user_id);
CREATE INDEX bookings_status_idx ON public.bookings (status);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "booking parties read" ON public.bookings FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR worker_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "customer creates booking" ON public.bookings FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "booking parties update" ON public.bookings FOR UPDATE TO authenticated
  USING (customer_id = auth.uid() OR worker_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (customer_id = auth.uid() OR worker_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.is_booking_member(_booking_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = _booking_id
      AND (b.customer_id = auth.uid() OR b.worker_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  );
$$;

-- ============ payments ============
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id text NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pending',
  method text,
  txn text,
  is_test boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_booking_idx ON public.payments (booking_id);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment parties read" ON public.payments FOR SELECT TO authenticated USING (public.is_booking_member(booking_id));
CREATE POLICY "payment insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_booking_member(booking_id));

-- ============ messages ============
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id text NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_role text NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_booking_idx ON public.messages (booking_id, created_at);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "message parties read" ON public.messages FOR SELECT TO authenticated USING (public.is_booking_member(booking_id));
CREATE POLICY "message insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.is_booking_member(booking_id));

-- ============ reviews ============
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id text NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  worker_code text NOT NULL,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text NOT NULL DEFAULT '',
  stars integer NOT NULL,
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reviews_worker_idx ON public.reviews (worker_code, created_at DESC);
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews readable" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "customer writes review" ON public.reviews FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid() AND public.is_booking_member(booking_id));

-- ============ notifications ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audience text NOT NULL,
  target text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'booking',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  tag text NOT NULL DEFAULT '',
  booking_id text,
  dedupe_key text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedupe_key)
);
CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ new user handling ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  r text := UPPER(COALESCE(m->>'role','CUSTOMER'));
  code text;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role, language, state, district, mandal, village, pincode, landmark, status)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(m->>'full_name',''), NULLIF(m->>'phone',''), r,
    COALESCE(m->>'language','English'),
    COALESCE(m->>'state',''), COALESCE(m->>'district',''), COALESCE(m->>'mandal',''),
    COALESCE(m->>'village',''), COALESCE(m->>'pincode',''), COALESCE(m->>'landmark',''),
    CASE WHEN r = 'WORKER' THEN 'PENDING' ELSE 'APPROVED' END
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, (CASE WHEN r='ADMIN' THEN 'admin' WHEN r='WORKER' THEN 'worker' ELSE 'customer' END)::public.app_role)
  ON CONFLICT DO NOTHING;

  IF r = 'WORKER' THEN
    code := 'SS-W-' || nextval('public.worker_code_seq')::text;
    INSERT INTO public.worker_profiles (
      user_id, worker_code, name, category_id, skills, society, membership_id, experience,
      languages, area, availability_days, availability_time, certificates, kyc, payout, status
    ) VALUES (
      NEW.id, code, COALESCE(m->>'full_name',''), COALESCE(NULLIF(m->>'category_id',''),'domestic'),
      CASE WHEN COALESCE(m->>'skills','') = '' THEN '{}'::text[]
           ELSE string_to_array(m->>'skills', ',') END,
      COALESCE(m->>'society',''), COALESCE(m->>'membership_id',''),
      COALESCE(NULLIF(m->>'experience','')::int, 0),
      CASE WHEN COALESCE(m->>'language','') = '' THEN '{}'::text[] ELSE ARRAY[m->>'language'] END,
      COALESCE(NULLIF(TRIM(COALESCE(m->>'village','') || ', ' || COALESCE(m->>'district','')), ','), ''),
      COALESCE(m->>'availability_days',''), COALESCE(m->>'availability_time',''),
      COALESCE(m->>'certificates',''), COALESCE(m->>'kyc',''), COALESCE(m->>'payout',''),
      'Pending'
    ) ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ notification fan-out ============
CREATE OR REPLACE FUNCTION public.push_notification(
  _user_id uuid, _audience text, _target text, _type text,
  _title text, _body text, _tag text, _booking_id text, _dedupe text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, audience, target, type, title, body, tag, booking_id, dedupe_key)
  VALUES (_user_id, _audience, _target, _type, _title, _body, _tag, _booking_id, _dedupe)
  ON CONFLICT (user_id, dedupe_key) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_booking_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  admin_id uuid;
  title text; body text; ntype text; dedupe text;
  wname text;
BEGIN
  SELECT name INTO wname FROM public.worker_profiles WHERE worker_code = NEW.worker_code;
  wname := COALESCE(wname, 'The worker');

  IF TG_OP = 'INSERT' THEN
    ntype := 'booking_created';
    dedupe := NEW.id || ':created';
    PERFORM public.push_notification(NEW.customer_id,'customer',NEW.customer_email,ntype,
      'Booking requested', 'Your request for ' || NEW.subservice || ' was sent to ' || wname || '.', 'Booking', NEW.id, dedupe);
    PERFORM public.push_notification(NEW.worker_user_id,'worker',NEW.worker_code,ntype,
      'New booking request', NEW.customer_name || ' requested ' || NEW.subservice || ' on ' || NEW.date || ' (' || NEW.slot || ').', 'Booking', NEW.id, dedupe);
    FOR admin_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
      PERFORM public.push_notification(admin_id,'admin','admin',ntype,
        'New booking ' || NEW.id, NEW.customer_name || ' -> ' || wname || ' (' || NEW.subservice || ')', 'Booking', NEW.id, dedupe);
    END LOOP;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    dedupe := NEW.id || ':status:' || NEW.status;
    ntype := 'booking_' || lower(replace(NEW.status,' ','_'));
    title := 'Booking ' || NEW.status;
    body := NEW.subservice || ' with ' || wname || ' is now ' || NEW.status || '.';
    PERFORM public.push_notification(NEW.customer_id,'customer',NEW.customer_email,ntype,title,body,'Booking',NEW.id,dedupe);
    PERFORM public.push_notification(NEW.worker_user_id,'worker',NEW.worker_code,ntype,title,
      NEW.subservice || ' for ' || NEW.customer_name || ' is now ' || NEW.status || '.', 'Booking', NEW.id, dedupe);
    FOR admin_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
      PERFORM public.push_notification(admin_id,'admin','admin',ntype, NEW.id || ' ' || NEW.status, body, 'Booking', NEW.id, dedupe);
    END LOOP;
  END IF;

  IF NEW.payment IS DISTINCT FROM OLD.payment THEN
    dedupe := NEW.id || ':payment:' || NEW.payment;
    body := 'Payment for ' || NEW.subservice || ' is ' || NEW.payment || '.';
    PERFORM public.push_notification(NEW.customer_id,'customer',NEW.customer_email,'payment','Payment ' || NEW.payment, body,'Payment',NEW.id,dedupe);
    PERFORM public.push_notification(NEW.worker_user_id,'worker',NEW.worker_code,'payment','Payment ' || NEW.payment, body,'Payment',NEW.id,dedupe);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_notify_insert AFTER INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.notify_booking_event();
CREATE TRIGGER bookings_notify_update AFTER UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.notify_booking_event();

-- keep worker rating in sync with real reviews
CREATE OR REPLACE FUNCTION public.sync_worker_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.worker_profiles w
  SET rating = sub.avg_stars, updated_at = now()
  FROM (SELECT worker_code, ROUND(AVG(stars)::numeric, 1) AS avg_stars FROM public.reviews WHERE worker_code = NEW.worker_code GROUP BY worker_code) sub
  WHERE w.worker_code = sub.worker_code;
  RETURN NEW;
END;
$$;
CREATE TRIGGER reviews_sync_rating AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.sync_worker_rating();

-- updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER worker_profiles_touch BEFORE UPDATE ON public.worker_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER bookings_touch BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ realtime ============
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.worker_profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_profiles;