import { useTheme } from '../app/context/ThemeContext';
import type { PricingTier } from '../lib/supabase';
import { resolveTier } from '../lib/pricingEngine';

interface TierBadgeProps {
  tiers: PricingTier[];
  quantity: number;
}

const TIER_COLORS = {
  budget:   { bg: '#ddeeff', text: '#0d2d52', dot: '#3b82f6' },
  standard: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  premium:  { bg: '#fce7f3', text: '#9d174d', dot: '#ec4899' },
};

export function TierBadge({ tiers, quantity }: TierBadgeProps) {
  const { isDark } = useTheme();
  const activeTier = resolveTier(tiers, quantity);
  if (!activeTier) return null;

  const colors = TIER_COLORS[activeTier.tier_name as keyof typeof TIER_COLORS] ?? TIER_COLORS.budget;

  return (
    <div className="flex gap-1.5 flex-wrap mt-2">
      {tiers.map(tier => {
        const isActive = tier.id === activeTier.id;
        const c = TIER_COLORS[tier.tier_name as keyof typeof TIER_COLORS] ?? TIER_COLORS.budget;
        return (
          <span
            key={tier.id}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all"
            style={{
              background: isActive ? c.bg : isDark ? '#2d1e45' : '#f0f7ff',
              color: isActive ? c.text : isDark ? '#9ca3af' : '#6b7280',
              border: `1px solid ${isActive ? c.dot : 'transparent'}`,
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: isActive ? c.dot : '#9ca3af' }}
            />
            {tier.tier_name.charAt(0).toUpperCase() + tier.tier_name.slice(1)}
            {' · '}₹{tier.rate}/unit
            {tier.min_qty && ` (${tier.min_qty}${tier.max_qty ? `–${tier.max_qty}` : '+'})`}
          </span>
        );
      })}
    </div>
  );
}
