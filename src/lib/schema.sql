-- ============================================================
-- Planify — Full Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Items ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  cost_type text CHECK (cost_type IN ('unit_based','fixed_rate')) DEFAULT 'unit_based',
  base_price numeric NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- ── Tiered Pricing ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  min_qty int NOT NULL,
  max_qty int,  -- NULL means "and above"
  rate numeric NOT NULL,
  tier_name text CHECK (tier_name IN ('budget','standard','premium'))
);

-- ── Logistics Configuration ────────────────────────────────────
CREATE TABLE IF NOT EXISTS logistics_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_fee numeric DEFAULT 500,
  per_km_rate numeric DEFAULT 20,
  vehicle_fee numeric DEFAULT 2000,
  items_per_truck int DEFAULT 50
);

-- Seed default logistics config
INSERT INTO logistics_config (base_fee, per_km_rate, vehicle_fee, items_per_truck)
VALUES (500, 20, 2000, 50)
ON CONFLICT DO NOTHING;

-- ── Vendor Profile ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tagline text,
  phone text,
  email text,
  address text,
  lat numeric,
  lng numeric,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendor_profile(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendor_profile(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  rating int CHECK (rating BETWEEN 1 AND 5),
  review_text text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ── Quotes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_type text CHECK (quote_type IN ('package','custom_stage','catering')),
  event_type text,
  guest_count int,
  line_items jsonb DEFAULT '[]',
  subtotal numeric,
  gst numeric,
  total numeric,
  created_at timestamptz DEFAULT now()
);

-- ── Designs (Canvas State for WhatsApp Sharing) ────────────────
CREATE TABLE IF NOT EXISTS designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text,
  canvas_state jsonb DEFAULT '{}',
  item_list jsonb DEFAULT '[]',
  dimensions jsonb,  -- {length, width}
  created_at timestamptz DEFAULT now()
);

-- ── Events & Milestone Payments ────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_type text,
  event_date date,
  total_amount numeric DEFAULT 0,
  payment_status text CHECK (payment_status IN
    ('pending','advance_paid','balance_due','settled'))
    DEFAULT 'pending',
  razorpay_order_id text,
  created_at timestamptz DEFAULT now()
);

-- ── Vendor Profile Settings ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tagline text,
  phone text NOT NULL,
  email text NOT NULL,
  address text,
  banner_image text,
  lat numeric,
  lng numeric,
  verified boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendor_profile(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_type text CHECK (payment_type IN ('advance','balance')),
  razorpay_payment_id text,
  status text CHECK (status IN ('pending','success','failed')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- ── Event Packages (Phase 4 Customization) ─────────────────────
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL, -- e.g., 'wedding', 'birthday'
  tier_id text NOT NULL, -- e.g., 'budget', 'standard', 'premium'
  name text NOT NULL,
  price numeric NOT NULL,
  cover_image text NOT NULL,
  description text NOT NULL,
  features text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ── Seed Sample Items ──────────────────────────────────────────
INSERT INTO items (name, category, cost_type, base_price) VALUES
  ('Folding Chair',     'Infrastructure', 'unit_based',  150),
  ('Round Table',       'Infrastructure', 'unit_based',  800),
  ('LED Spotlight',     'Lighting',       'unit_based', 1500),
  ('String Lights',     'Lighting',       'unit_based',  800),
  ('Flower Arrangement','Decor',          'unit_based', 5000),
  ('Stage Decoration',  'Decor',          'fixed_rate', 25000),
  ('Shamiyana Tent',    'Infrastructure', 'fixed_rate', 15000)
ON CONFLICT DO NOTHING;

-- ── Seed Tiered Pricing for Chairs ────────────────────────────
-- Will be linked to the chair item after insert
-- (Run after seeding items or replace uuid with actual id)
-- Example:
-- INSERT INTO pricing_tiers (item_id, min_qty, max_qty, rate, tier_name)
-- SELECT id, 1, 50, 150, 'budget' FROM items WHERE name = 'Folding Chair'
-- UNION ALL
-- SELECT id, 51, 200, 130, 'standard' FROM items WHERE name = 'Folding Chair'
-- UNION ALL
-- SELECT id, 201, NULL, 110, 'premium' FROM items WHERE name = 'Folding Chair';

-- ── RLS Policies (allow public read for now) ───────────────────
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_items" ON items FOR SELECT USING (true);
CREATE POLICY "public_read_tiers" ON pricing_tiers FOR SELECT USING (true);
CREATE POLICY "public_read_logistics" ON logistics_config FOR SELECT USING (true);
CREATE POLICY "public_read_vendor" ON vendor_profile FOR SELECT USING (true);
CREATE POLICY "public_read_gallery" ON vendor_gallery FOR SELECT USING (true);
CREATE POLICY "public_read_reviews" ON vendor_reviews FOR SELECT USING (true);
CREATE POLICY "public_insert_reviews" ON vendor_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_quotes" ON quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_quotes" ON quotes FOR SELECT USING (true);
CREATE POLICY "public_update_quotes" ON quotes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public_insert_designs" ON designs FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_designs" ON designs FOR SELECT USING (true);
CREATE POLICY "public_read_events" ON events FOR SELECT USING (true);
CREATE POLICY "public_insert_events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_events" ON events FOR UPDATE USING (true);
CREATE POLICY "public_read_payments" ON payments FOR SELECT USING (true);
CREATE POLICY "public_insert_payments" ON payments FOR INSERT WITH CHECK (true);

