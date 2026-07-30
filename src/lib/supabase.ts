import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

// Prevent app crash if .env is missing or dev server hasn't restarted yet
export const supabase = SUPABASE_URL 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : ({} as any);

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ─── DB Types ────────────────────────────────────────────────────
export interface Item {
  id: string;
  name: string;
  category: string;
  cost_type: 'unit_based' | 'fixed_rate';
  base_price: number;
  image_url?: string;
}

export interface PricingTier {
  id: string;
  item_id: string;
  min_qty: number;
  max_qty: number | null;
  rate: number;
  tier_name: 'budget' | 'standard' | 'premium';
}

export interface LogisticsConfig {
  id: string;
  base_fee: number;
  per_km_rate: number;
  vehicle_fee: number;
  items_per_truck: number;
}

export interface VendorProfile {
  id: string;
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  banner_image?: string;
  lat: number;
  lng: number;
  verified: boolean;
}

export interface VendorReview {
  id: string;
  vendor_id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  verified: boolean;
  created_at: string;
}

export interface VendorGalleryImage {
  id: string;
  vendor_id: string;
  image_url: string;
  caption: string;
  created_at: string;
}

export interface Quote {
  id: string;
  quote_type: 'package' | 'custom_stage' | 'catering';
  event_type: string;
  guest_count: number;
  line_items: LineItem[];
  subtotal: number;
  gst: number;
  total: number;
  created_at: string;
}

export interface LineItem {
  name: string;
  quantity: number;
  unit_price: number;
  amount: number;
  cost_type?: 'unit_based' | 'fixed_rate';
}

export interface Design {
  id: string;
  event_type: string;
  canvas_state: Json;
  item_list: Json;
  dimensions: { length: number; width: number } | null;
  created_at: string;
}

export interface EventRecord {
  id: string;
  name: string;
  event_type: string;
  event_date: string;
  total_amount: number;
  payment_status: 'pending' | 'advance_paid' | 'balance_due' | 'settled';
  razorpay_order_id?: string;
  created_at: string;
}
