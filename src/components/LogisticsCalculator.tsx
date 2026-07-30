import { useState, useEffect } from 'react';
import { Truck, MapPin, Package, ChevronDown, ChevronUp, IndianRupee } from 'lucide-react';
import { useTheme } from '../app/context/ThemeContext';
import { calculateLogistics, type LogisticsBreakdown } from '../lib/pricingEngine';
import { supabase, type LogisticsConfig } from '../lib/supabase';

interface LogisticsCalculatorProps {
  itemQuantity?: number;
  onTotalChange?: (total: number) => void;
}

export function LogisticsCalculator({ itemQuantity = 0, onTotalChange }: LogisticsCalculatorProps) {
  const { isDark } = useTheme();
  const [distance, setDistance] = useState(10);
  const [qty, setQty] = useState(itemQuantity);
  const [config, setConfig] = useState<LogisticsConfig | null>(null);
  const [breakdown, setBreakdown] = useState<LogisticsBreakdown | null>(null);
  const [expanded, setExpanded] = useState(false);

  const bg = isDark ? '#1a1025' : '#f0f7ff';
  const card = isDark ? '#231534' : '#ddeeff';
  const border = isDark ? 'rgba(192,156,222,0.2)' : 'rgba(42,125,212,0.18)';
  const text = isDark ? '#f0e6ff' : '#0d2d52';
  const textMuted = isDark ? 'rgba(240,230,255,0.6)' : '#3a6898';
  const accent = isDark ? '#c09cde' : '#2a7dd4';

  useEffect(() => {
    supabase.from('logistics_config').select('*').limit(1).single()
      .then(({ data }) => { if (data) setConfig(data as LogisticsConfig); });
  }, []);

  useEffect(() => { setQty(itemQuantity); }, [itemQuantity]);

  useEffect(() => {
    if (!config) return;
    const result = calculateLogistics({
      distanceKm: distance,
      itemQuantity: qty,
      baseFee: config.base_fee,
      perKmRate: config.per_km_rate,
      vehicleFee: config.vehicle_fee,
      itemsPerTruck: config.items_per_truck,
    });
    setBreakdown(result);
    onTotalChange?.(result.total);
  }, [distance, qty, config]);

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${border}` }}>
      <span className="text-xs" style={{ color: textMuted }}>{label}</span>
      <span className="text-xs font-bold" style={{ color: text }}>{value}</span>
    </div>
  );

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: card, border: `1px solid ${border}` }}>
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4" style={{ color: accent }} />
          <span className="text-sm font-bold" style={{ color: text }}>Logistics Calculator</span>
        </div>
        <div className="flex items-center gap-3">
          {breakdown && (
            <span className="text-sm font-black" style={{ color: accent }}>
              +₹{breakdown.total.toLocaleString('en-IN')}
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4" style={{ color: textMuted }} /> : <ChevronDown className="w-4 h-4" style={{ color: textMuted }} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${border}` }}>
          {/* Distance slider */}
          <div className="pt-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" style={{ color: accent }} />
                <span className="text-xs font-semibold" style={{ color: text }}>Delivery Distance</span>
              </div>
              <span className="text-sm font-black" style={{ color: accent }}>{distance} km</span>
            </div>
            <input
              type="range" min="1" max="200" value={distance}
              onChange={e => setDistance(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: accent }}
            />
            <div className="flex justify-between mt-0.5">
              <span className="text-[10px]" style={{ color: textMuted }}>1 km</span>
              <span className="text-[10px]" style={{ color: textMuted }}>200 km</span>
            </div>
          </div>

          {/* Item qty */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" style={{ color: accent }} />
                <span className="text-xs font-semibold" style={{ color: text }}>Item Quantity</span>
              </div>
              <span className="text-sm font-black" style={{ color: accent }}>{qty}</span>
            </div>
            <input
              type="range" min="1" max="500" value={qty}
              onChange={e => setQty(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: accent }}
            />
          </div>

          {/* Breakdown */}
          {breakdown && (
            <div className="rounded-xl p-3 mt-2" style={{ background: isDark ? '#1a1025' : '#f0f7ff' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: textMuted }}>Breakdown</p>
              <Row label="Base Fee" value={`₹${breakdown.baseFee.toLocaleString('en-IN')}`} />
              <Row label={`Distance Fee (${distance} km × ₹${config?.per_km_rate ?? 20})`} value={`₹${breakdown.distanceFee.toLocaleString('en-IN')}`} />
              <Row label={`Vehicle Fee (${breakdown.truckLoads} truck${breakdown.truckLoads > 1 ? 's' : ''})`} value={`₹${breakdown.vehicleFee.toLocaleString('en-IN')}`} />
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-black" style={{ color: text }}>Total Logistics</span>
                <span className="text-base font-black" style={{ color: accent }}>₹{breakdown.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
