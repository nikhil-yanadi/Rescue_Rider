-- ============================================================
-- RESCUE RIDER — SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: riders
-- ============================================================
CREATE TABLE IF NOT EXISTS public.riders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  phone               TEXT NOT NULL,
  delivery_company    TEXT NOT NULL,
  employee_id         TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending'
                      CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  is_available        BOOLEAN NOT NULL DEFAULT FALSE,
  hero_points         INTEGER NOT NULL DEFAULT 0,
  rescue_streak       INTEGER NOT NULL DEFAULT 0,
  total_rescues       INTEGER NOT NULL DEFAULT 0,
  avatar_url          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: emergencies
-- ============================================================
CREATE TABLE IF NOT EXISTS public.emergencies (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_id        TEXT NOT NULL UNIQUE,
  latitude            DOUBLE PRECISION NOT NULL,
  longitude           DOUBLE PRECISION NOT NULL,
  address             TEXT,
  threat_description  TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  severity_level      TEXT NOT NULL DEFAULT 'medium'
                      CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
  victim_contact      TEXT,
  assigned_rider_id   UUID REFERENCES public.riders(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: emergency_media
-- ============================================================
CREATE TABLE IF NOT EXISTS public.emergency_media (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_id  UUID REFERENCES public.emergencies(id) ON DELETE CASCADE NOT NULL,
  media_type    TEXT NOT NULL CHECK (media_type IN ('image', 'voice')),
  url           TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: emergency_assignments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.emergency_assignments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_id  UUID REFERENCES public.emergencies(id) ON DELETE CASCADE NOT NULL,
  rider_id      UUID REFERENCES public.riders(id) ON DELETE CASCADE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'notified'
                CHECK (status IN ('notified', 'accepted', 'rejected', 'completed')),
  notified_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at   TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(emergency_id, rider_id)
);

-- ============================================================
-- TABLE: reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_id  UUID REFERENCES public.emergencies(id) ON DELETE CASCADE NOT NULL,
  rider_id      UUID REFERENCES public.riders(id) ON DELETE CASCADE NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(emergency_id, rider_id)
);

-- ============================================================
-- TABLE: hero_points
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hero_points (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id      UUID REFERENCES public.riders(id) ON DELETE CASCADE NOT NULL,
  points        INTEGER NOT NULL,
  reason        TEXT NOT NULL,
  emergency_id  UUID REFERENCES public.emergencies(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id      UUID REFERENCES public.riders(id) ON DELETE CASCADE NOT NULL,
  emergency_id  UUID REFERENCES public.emergencies(id) ON DELETE CASCADE NOT NULL,
  type          TEXT NOT NULL
                CHECK (type IN ('new_emergency', 'assignment_accepted', 'mission_update')),
  message       TEXT NOT NULL,
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: admin_users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: rider_milestones
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rider_milestones (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES public.emergency_assignments(id) ON DELETE CASCADE NOT NULL,
  rider_id      UUID REFERENCES public.riders(id) ON DELETE CASCADE NOT NULL,
  latitude      DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: rescue_reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rescue_reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emergency_id    UUID REFERENCES public.emergencies(id) ON DELETE CASCADE NOT NULL,
  rider_id        UUID REFERENCES public.riders(id) ON DELETE CASCADE NOT NULL,
  review_status   TEXT NOT NULL DEFAULT 'pending'
                  CHECK (review_status IN ('pending', 'approved', 'rejected')),
  admin_notes     TEXT,
  reviewed_by     UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER riders_updated_at
  BEFORE UPDATE ON public.riders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER emergencies_updated_at
  BEFORE UPDATE ON public.emergencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_riders_user_id ON public.riders(user_id);
CREATE INDEX IF NOT EXISTS idx_riders_verification_status ON public.riders(verification_status);
CREATE INDEX IF NOT EXISTS idx_riders_is_available ON public.riders(is_available);
CREATE INDEX IF NOT EXISTS idx_emergencies_status ON public.emergencies(status);
CREATE INDEX IF NOT EXISTS idx_emergencies_created_at ON public.emergencies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_assignments_rider_id ON public.emergency_assignments(rider_id);
CREATE INDEX IF NOT EXISTS idx_emergency_assignments_emergency_id ON public.emergency_assignments(emergency_id);
CREATE INDEX IF NOT EXISTS idx_notifications_rider_id ON public.notifications(rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_milestones_assignment_id ON public.rider_milestones(assignment_id);
CREATE INDEX IF NOT EXISTS idx_rider_milestones_rider_id ON public.rider_milestones(rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_milestones_timestamp ON public.rider_milestones(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_rescue_reviews_emergency_id ON public.rescue_reviews(emergency_id);
CREATE INDEX IF NOT EXISTS idx_rescue_reviews_rider_id ON public.rescue_reviews(rider_id);
CREATE INDEX IF NOT EXISTS idx_rescue_reviews_status ON public.rescue_reviews(review_status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescue_reviews ENABLE ROW LEVEL SECURITY;

-- ── RIDERS policies ──────────────────────────────────────────
-- Riders can read/update their own record
CREATE POLICY "Riders can view own profile"
  ON public.riders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Riders can update own profile"
  ON public.riders FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow insert for any authenticated user (uid matches user_id)
-- Also allow service role inserts (for cases where session isn't ready yet)
CREATE POLICY "Anyone can register as rider"
  ON public.riders FOR INSERT
  WITH CHECK (true);

-- ── EMERGENCIES policies ─────────────────────────────────────
-- Anyone can create emergencies (victims, no auth required)
CREATE POLICY "Anyone can create emergency"
  ON public.emergencies FOR INSERT
  WITH CHECK (true);

-- Authenticated riders can view emergencies assigned to them
CREATE POLICY "Riders can view assigned emergencies"
  ON public.emergencies FOR SELECT
  USING (
    assigned_rider_id IN (
      SELECT id FROM public.riders WHERE user_id = auth.uid()
    )
    OR auth.uid() IS NOT NULL
  );

-- Riders can update emergency status
CREATE POLICY "Riders can update emergency status"
  ON public.emergencies FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ── EMERGENCY_MEDIA policies ─────────────────────────────────
CREATE POLICY "Anyone can insert emergency media"
  ON public.emergency_media FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view media"
  ON public.emergency_media FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── EMERGENCY_ASSIGNMENTS policies ───────────────────────────
CREATE POLICY "Riders can view their own assignments"
  ON public.emergency_assignments FOR SELECT
  USING (
    rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
  );

CREATE POLICY "System can create assignments"
  ON public.emergency_assignments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Riders can update their own assignments"
  ON public.emergency_assignments FOR UPDATE
  USING (
    rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
  );

-- ── NOTIFICATIONS policies ────────────────────────────────────
CREATE POLICY "Riders can view own notifications"
  ON public.notifications FOR SELECT
  USING (
    rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
  );

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Riders can mark own notifications read"
  ON public.notifications FOR UPDATE
  USING (
    rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
  );

-- ── HERO_POINTS policies ──────────────────────────────────────
CREATE POLICY "Riders can view own hero points"
  ON public.hero_points FOR SELECT
  USING (
    rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
  );

CREATE POLICY "System can insert hero points"
  ON public.hero_points FOR INSERT
  WITH CHECK (true);

-- ── REVIEWS policies ─────────────────────────────────────────
CREATE POLICY "Anyone can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Riders can view own reviews"
  ON public.reviews FOR SELECT
  USING (
    rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
  );

-- ── ADMIN_USERS policies ──────────────────────────────────────
CREATE POLICY "Admins can view admin records"
  ON public.admin_users FOR SELECT
  USING (auth.uid() = user_id);

-- ── RIDER_MILESTONES policies ─────────────────────────────────
CREATE POLICY "Riders can view own milestones"
  ON public.rider_milestones FOR SELECT
  USING (
    rider_id IN (SELECT id FROM public.riders WHERE user_id = auth.uid())
  );

CREATE POLICY "System can insert milestones"
  ON public.rider_milestones FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all milestones"
  ON public.rider_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    )
  );

-- ── RESCUE_REVIEWS policies ───────────────────────────────────
CREATE POLICY "Admins can view all rescue reviews"
  ON public.rescue_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update rescue reviews"
  ON public.rescue_reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert rescue reviews"
  ON public.rescue_reviews FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKET
-- Run this separately or via Supabase Dashboard
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('emergency-media', 'emergency-media', true);

-- ============================================================
-- SEED: Create first admin user
-- After running this SQL, sign up a user via Supabase Auth,
-- then insert them here:
--
-- INSERT INTO public.admin_users (user_id, email, full_name)
-- VALUES ('<auth-user-uuid>', 'admin@rescuerider.com', 'Admin User');
-- ============================================================
