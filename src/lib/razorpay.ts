import { supabase } from './supabase';
import type { EventRecord } from './supabase';

// ── Feature 6: Razorpay Milestone Payments ────────────────────────────────────

declare global {
  interface Window { Razorpay: any; }
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID ?? '';

export interface RazorpayOptions {
  amount: number; // in paise (multiply ₹ by 100)
  currency?: string;
  name?: string;
  description?: string;
  orderId?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (paymentId: string, orderId: string) => void;
  onFailure: (error: any) => void;
}

export function openRazorpay(opts: RazorpayOptions) {
  // Fallback if Razorpay is not configured: simulate success after 1 second
  if (!RAZORPAY_KEY) {
    console.warn('Razorpay key missing. Simulating successful payment for testing.');
    setTimeout(() => {
      opts.onSuccess(`simulated_pay_${Date.now()}`, `order_${Date.now()}`);
    }, 1000);
    return;
  }

  if (!window.Razorpay) {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => initRazorpay(opts);
    document.body.appendChild(script);
  } else {
    initRazorpay(opts);
  }
}

function initRazorpay(opts: RazorpayOptions) {
  const rzp = new window.Razorpay({
    key: RAZORPAY_KEY,
    amount: opts.amount,
    currency: opts.currency ?? 'INR',
    name: opts.name ?? 'Planify',
    description: opts.description ?? 'Event Booking',
    order_id: opts.orderId,
    prefill: opts.prefill ?? {},
    theme: { color: '#2a7dd4' },
    handler: (response: any) => {
      opts.onSuccess(response.razorpay_payment_id, response.razorpay_order_id);
    },
    modal: {
      ondismiss: () => opts.onFailure({ reason: 'dismissed' }),
    },
  });
  rzp.on('payment.failed', (response: any) => opts.onFailure(response.error));
  rzp.open();
}

// ── Update payment status in Supabase ────────────────────────────────────────
export async function recordPayment(
  eventId: string,
  amount: number,
  paymentType: 'advance' | 'balance',
  razorpayPaymentId: string
) {
  await supabase.from('payments').insert({
    event_id: eventId,
    amount,
    payment_type: paymentType,
    razorpay_payment_id: razorpayPaymentId,
    status: 'success',
  });

  // Update event payment status
  const nextStatus: EventRecord['payment_status'] =
    paymentType === 'advance' ? 'advance_paid' : 'settled';

  await supabase
    .from('events')
    .update({ payment_status: nextStatus })
    .eq('id', eventId);
}

export async function fetchEvent(eventId: string): Promise<EventRecord | null> {
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();
  return data ?? null;
}

export async function createEvent(
  name: string,
  eventType: string,
  eventDate: string,
  totalAmount: number
): Promise<string | null> {
  const { data, error } = await supabase
    .from('events')
    .insert({ name, event_type: eventType, event_date: eventDate, total_amount: totalAmount })
    .select('id')
    .single();
  if (error) return null;
  return data.id;
}
