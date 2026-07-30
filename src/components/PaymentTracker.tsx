import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, CreditCard, BadgeCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useTheme } from '../app/context/ThemeContext';
import { openRazorpay, recordPayment, fetchEvent, createEvent } from '../lib/razorpay';
import type { EventRecord } from '../lib/supabase';

const PAYMENT_STAGES: { key: EventRecord['payment_status']; label: string; desc: string }[] = [
  { key: 'pending',      label: 'Pending',      desc: 'No payment received yet' },
  { key: 'advance_paid', label: 'Advance Paid',  desc: '30% advance cleared' },
  { key: 'balance_due',  label: 'Balance Due',   desc: 'Remaining amount to pay' },
  { key: 'settled',      label: 'Settled',       desc: 'Full payment complete' },
];

const STATUS_ORDER: EventRecord['payment_status'][] = ['pending', 'advance_paid', 'balance_due', 'settled'];

interface PaymentTrackerProps {
  eventId?: string;
  prefillName?: string;
  prefillPhone?: string;
}

export function PaymentTracker({ eventId: initId, prefillName, prefillPhone }: PaymentTrackerProps) {
  const { isDark } = useTheme();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  // New event form
  const [form, setForm] = useState({ name: '', eventType: 'Wedding', date: '', amount: 50000 });
  const [eventId, setEventId] = useState(initId ?? '');

  const bg = isDark ? '#1a1025' : '#f0f7ff';
  const card = isDark ? '#231534' : '#ddeeff';
  const border = isDark ? 'rgba(192,156,222,0.2)' : 'rgba(42,125,212,0.18)';
  const text = isDark ? '#f0e6ff' : '#0d2d52';
  const textMuted = isDark ? 'rgba(240,230,255,0.6)' : '#3a6898';
  const accent = isDark ? '#c09cde' : '#2a7dd4';
  const muted = isDark ? '#2d1e45' : '#c8e4ff';

  useEffect(() => {
    if (eventId) {
      setLoading(true);
      fetchEvent(eventId).then(e => { setEvent(e); setLoading(false); });
    }
  }, [eventId]);

  const currentStageIdx = event ? STATUS_ORDER.indexOf(event.payment_status) : -1;

  const handleCreateEvent = async () => {
    setLoading(true);
    const id = await createEvent(form.name, form.eventType, form.date, form.amount);
    if (id) {
      setEventId(id);
      const ev = await fetchEvent(id);
      setEvent(ev);
    }
    setLoading(false);
  };

  const handlePay = async (type: 'advance' | 'balance') => {
    if (!event) return;
    const amount = type === 'advance'
      ? Math.round(event.total_amount * 0.3)
      : Math.round(event.total_amount * 0.7);

    setPaying(true);
    openRazorpay({
      amount: amount * 100, // paise
      name: 'Planify Event',
      description: `${type === 'advance' ? 'Advance (30%)' : 'Balance (70%)'} — ${event.name}`,
      prefill: { name: prefillName, contact: prefillPhone },
      onSuccess: async (paymentId) => {
        await recordPayment(event.id, amount, type, paymentId);
        const updated = await fetchEvent(event.id);
        setEvent(updated);
        setPaying(false);
      },
      onFailure: () => setPaying(false),
    });
  };

  const inputClass = "w-full px-3 py-2 rounded-xl text-sm outline-none";

  return (
    <div className="min-h-screen pb-10" style={{ background: bg, color: text }}>
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-5 h-5" style={{ color: accent }} />
          <h1 className="text-xl font-black" style={{ color: text }}>Milestone Payments</h1>
        </div>
        <p className="text-xs" style={{ color: textMuted }}>Track advance & balance payments via Razorpay</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Create Event Form (shown if no event) */}
        {!event && !loading && (
          <div className="rounded-2xl p-4 space-y-3" style={{ background: card, border: `1px solid ${border}` }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: textMuted }}>New Event</p>
            <input placeholder="Event name" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={inputClass} style={{ background: muted, color: text, border: `1px solid ${border}` }}
            />
            <select value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}
              className={inputClass} style={{ background: muted, color: text, border: `1px solid ${border}` }}
            >
              {['Wedding','Birthday','Baby Shower','Corporate','Housewarming'].map(t => <option key={t}>{t}</option>)}
            </select>
            <input type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className={inputClass} style={{ background: muted, color: text, border: `1px solid ${border}` }}
            />
            <div>
              <label className="text-[11px]" style={{ color: textMuted }}>Total Amount: ₹{form.amount.toLocaleString('en-IN')}</label>
              <input type="range" min="5000" max="500000" step="5000" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer mt-1"
                style={{ accentColor: accent }}
              />
            </div>
            <button onClick={handleCreateEvent} disabled={!form.name || !form.date}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{ background: accent, color: '#fff' }}
            >
              Create Event
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: accent }} />
          </div>
        )}

        {/* Event Dashboard */}
        {event && (
          <>
            {/* Event Card */}
            <div className="rounded-2xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-black" style={{ color: text }}>{event.name}</h2>
                  <p className="text-xs" style={{ color: textMuted }}>{event.event_type} · {new Date(event.event_date).toLocaleDateString('en-IN')}</p>
                </div>
                <span className="text-2xl font-black" style={{ color: accent }}>
                  ₹{event.total_amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment Timeline */}
            <div className="rounded-2xl p-4 space-y-0" style={{ background: card, border: `1px solid ${border}` }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: textMuted }}>Payment Journey</p>
              {PAYMENT_STAGES.map((stage, idx) => {
                const isCompleted = idx <= currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                const isNext = idx === currentStageIdx + 1;
                return (
                  <div key={stage.key} className="flex gap-3 mb-4 last:mb-0">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: isCompleted ? accent : muted,
                          border: isCurrent ? `2px solid ${accent}` : 'none',
                        }}
                      >
                        {isCompleted
                          ? <CheckCircle2 className="w-4 h-4 text-white" />
                          : <Clock className="w-4 h-4" style={{ color: textMuted }} />
                        }
                      </div>
                      {idx < PAYMENT_STAGES.length - 1 && (
                        <div className="w-0.5 flex-1 my-1 min-h-[20px]" style={{ background: isCompleted ? accent : border }} />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-sm font-bold" style={{ color: isCompleted ? text : textMuted }}>{stage.label}</p>
                      <p className="text-[11px]" style={{ color: textMuted }}>{stage.desc}</p>
                      {stage.key === 'advance_paid' && isNext && (
                        <button
                          onClick={() => handlePay('advance')}
                          disabled={paying}
                          className="mt-2 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all active:scale-95"
                          style={{ background: accent, color: '#fff' }}
                        >
                          {paying ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                          Pay 30% Advance — ₹{Math.round(event.total_amount * 0.3).toLocaleString('en-IN')}
                        </button>
                      )}
                      {stage.key === 'settled' && currentStageIdx === 2 && (
                        <button
                          onClick={() => handlePay('balance')}
                          disabled={paying}
                          className="mt-2 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all active:scale-95"
                          style={{ background: accent, color: '#fff' }}
                        >
                          {paying ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                          Pay Balance — ₹{Math.round(event.total_amount * 0.7).toLocaleString('en-IN')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
