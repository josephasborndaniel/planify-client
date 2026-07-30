import { supabase, type PricingTier } from './supabase';

// ── Feature 3: Billing Engine ─────────────────────────────────────────────────
export function calculateItemCost(
  basePrice: number,
  costType: 'unit_based' | 'fixed_rate',
  quantity: number
): number {
  return costType === 'fixed_rate' ? basePrice : basePrice * quantity;
}

// ── Feature 1: Tiered Pricing ─────────────────────────────────────────────────
export function resolveTier(
  tiers: PricingTier[],
  quantity: number
): PricingTier | null {
  if (!tiers.length) return null;
  const sorted = [...tiers].sort((a, b) => a.min_qty - b.min_qty);
  for (const tier of sorted) {
    const withinMax = tier.max_qty === null || quantity <= tier.max_qty;
    if (quantity >= tier.min_qty && withinMax) return tier;
  }
  return sorted[sorted.length - 1]; // fallback to highest tier
}

export function calculateTieredCost(tiers: PricingTier[], quantity: number): number {
  const tier = resolveTier(tiers, quantity);
  if (!tier) return 0;
  return tier.rate * quantity;
}

export async function fetchTiersForItem(itemId: string): Promise<PricingTier[]> {
  const { data, error } = await supabase
    .from('pricing_tiers')
    .select('*')
    .eq('item_id', itemId)
    .order('min_qty');
  if (error) return [];
  return data as PricingTier[];
}

// ── Feature 2: Logistics Calculator ──────────────────────────────────────────
export interface LogisticsInput {
  distanceKm: number;
  itemQuantity: number;
  baseFee: number;
  perKmRate: number;
  vehicleFee: number;
  itemsPerTruck: number;
}

export interface LogisticsBreakdown {
  baseFee: number;
  distanceFee: number;
  truckLoads: number;
  vehicleFee: number;
  total: number;
}

export function calculateLogistics(input: LogisticsInput): LogisticsBreakdown {
  const truckLoads = Math.ceil(input.itemQuantity / input.itemsPerTruck);
  const distanceFee = input.distanceKm * input.perKmRate;
  const vehicleFeeTotal = truckLoads * input.vehicleFee;
  return {
    baseFee: input.baseFee,
    distanceFee,
    truckLoads,
    vehicleFee: vehicleFeeTotal,
    total: input.baseFee + distanceFee + vehicleFeeTotal,
  };
}

// ── GST Helper ────────────────────────────────────────────────────────────────
const GST_RATE = 0.18;

export function computeGST(subtotal: number) {
  const gst = parseFloat((subtotal * GST_RATE).toFixed(2));
  return { gst, total: parseFloat((subtotal + gst).toFixed(2)) };
}
