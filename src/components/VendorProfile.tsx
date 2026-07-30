import { useState, useEffect } from 'react';
import { Star, MapPin, Phone, Mail, BadgeCheck, Image, MessageSquare, ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { useTheme } from '../app/context/ThemeContext';
import { supabase, type VendorProfile, type VendorReview, type VendorGalleryImage } from '../lib/supabase';

// Fallback static vendor profile for display when Supabase is not yet configured
const DEMO_VENDOR: VendorProfile = {
  id: 'demo',
  name: 'Planify Event Co.',
  tagline: 'Creating memories, one event at a time',
  phone: '+91 98765 43210',
  email: 'hello@planify.app',
  address: 'No. 42, MG Road, Bengaluru, Karnataka 560001',
  lat: 12.9716,
  lng: 77.5946,
  verified: true,
};

const DEMO_GALLERY = [
  'https://images.unsplash.com/photo-1519167758993-87dde89c1cc3?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1519224283042-481453be6f32?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1540575467063-178f50002c4b?w=600&h=400&fit=crop',
];

const DEMO_REVIEWS: Partial<VendorReview>[] = [
  { id: '1', reviewer_name: 'Priya S.', rating: 5, review_text: 'Absolutely stunning wedding setup! Every detail was perfect.', verified: true, created_at: '2026-04-10T10:00:00Z' },
  { id: '2', reviewer_name: 'Rajan M.', rating: 5, review_text: 'Professional team, delivered on time. Highly recommend!', verified: true, created_at: '2026-04-02T10:00:00Z' },
  { id: '3', reviewer_name: 'Aisha K.', rating: 4, review_text: 'Beautiful baby shower decorations. Will book again!', verified: false, created_at: '2026-03-22T10:00:00Z' },
];

function StarRating({ rating, size = 4 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star
          key={s}
          className={`w-${size} h-${size}`}
          fill={s <= rating ? '#f59e0b' : 'none'}
          stroke={s <= rating ? '#f59e0b' : '#d1d5db'}
        />
      ))}
    </div>
  );
}

export function VendorProfilePage() {
  const { isDark } = useTheme();
  const [vendor, setVendor] = useState<VendorProfile>(DEMO_VENDOR);
  const [reviews, setReviews] = useState<Partial<VendorReview>[]>(DEMO_REVIEWS);
  const [gallery, setGallery] = useState<string[]>(DEMO_GALLERY);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchVendorData = async () => {
      const { data: vData } = await supabase.from('vendor_profile').select('*').limit(1).single();
      if (vData) {
        setVendor(vData);
        
        const { data: gData } = await supabase.from('vendor_gallery').select('image_url').eq('vendor_id', vData.id);
        if (gData && gData.length > 0) {
          setGallery(gData.map(g => g.image_url));
        }

        const { data: rData } = await supabase.from('vendor_reviews').select('*').eq('vendor_id', vData.id).order('created_at', { ascending: false });
        if (rData && rData.length > 0) {
          setReviews(rData);
        }
      }
    };
    fetchVendorData();
  }, []);

  const bg = isDark ? '#1a1025' : '#f0f7ff';
  const card = isDark ? '#231534' : '#ddeeff';
  const border = isDark ? 'rgba(192,156,222,0.2)' : 'rgba(42,125,212,0.18)';
  const text = isDark ? '#f0e6ff' : '#0d2d52';
  const textMuted = isDark ? 'rgba(240,230,255,0.6)' : '#3a6898';
  const accent = isDark ? '#c09cde' : '#2a7dd4';
  const muted = isDark ? '#2d1e45' : '#c8e4ff';

  const avgRating = reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length;

  const submitReview = async () => {
    if (!newReview.name || !newReview.text) return;
    setSubmitting(true);
    const review: Partial<VendorReview> = {
      id: String(Date.now()),
      vendor_id: vendor.id,
      reviewer_name: newReview.name,
      rating: newReview.rating,
      review_text: newReview.text,
      verified: false,
      created_at: new Date().toISOString(),
    };

    // Try Supabase first, fall back to local state
    await supabase.from('vendor_reviews').insert({
      vendor_id: vendor.id,
      reviewer_name: newReview.name,
      rating: newReview.rating,
      review_text: newReview.text,
    }).then(() => {});

    setReviews(prev => [review, ...prev]);
    setNewReview({ name: '', rating: 5, text: '' });
    setShowReviewForm(false);
    setSubmitting(false);
  };

  const mapsUrl = `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY ?? ''}&q=${vendor.lat},${vendor.lng}&zoom=15`;

  const displayImages = [vendor.banner_image, ...gallery].filter(Boolean);
  if (displayImages.length === 0) displayImages.push(DEMO_GALLERY[0]);

  return (
    <div className="min-h-screen pb-10" style={{ background: bg, color: text }}>

      {/* Hero Banner */}
      <div className="relative h-48 overflow-hidden">
        <img loading="lazy" src={displayImages[galleryIdx % displayImages.length]} alt="Vendor" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">{vendor.name}</h1>
            {vendor.verified && <BadgeCheck className="w-5 h-5 text-blue-400" />}
          </div>
          <p className="text-sm text-white/80 mt-0.5">{vendor.tagline}</p>
        </div>
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-1">
            {displayImages.map((_, i) => (
              <button key={i} onClick={() => setGalleryIdx(i)}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ background: i === (galleryIdx % displayImages.length) ? '#fff' : 'rgba(255,255,255,0.5)' }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Rating Summary */}
        <div className="flex items-center justify-between rounded-2xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
          <div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black" style={{ color: accent }}>{avgRating.toFixed(1)}</span>
              <div className="mb-1">
                <StarRating rating={Math.round(avgRating)} />
                <p className="text-[11px] mt-0.5" style={{ color: textMuted }}>{reviews.length} reviews</p>
              </div>
            </div>
          </div>
          <div className="flex gap-1 flex-col">
            {[5,4,3,2,1].map(n => {
              const count = reviews.filter(r => r.rating === n).length;
              return (
                <div key={n} className="flex items-center gap-1.5">
                  <span className="text-[10px] w-2" style={{ color: textMuted }}>{n}</span>
                  <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: muted }}>
                    <div className="h-full rounded-full" style={{ background: '#f59e0b', width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }} />
                  </div>
                  <span className="text-[10px]" style={{ color: textMuted }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Info */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: card, border: `1px solid ${border}` }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: textMuted }}>Contact</p>
          {[
            { icon: <Phone className="w-4 h-4" />, value: vendor.phone, href: `tel:${vendor.phone}` },
            { icon: <Mail className="w-4 h-4" />, value: vendor.email, href: `mailto:${vendor.email}` },
            { icon: <MapPin className="w-4 h-4" />, value: vendor.address, href: '#map' },
          ].map((c, i) => (
            <a key={i} href={c.href} className="flex items-start gap-3 transition-all active:opacity-70">
              <span style={{ color: accent }}>{c.icon}</span>
              <span className="text-sm flex-1" style={{ color: text }}>{c.value}</span>
            </a>
          ))}
        </div>

        {/* Gallery Grid */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Image className="w-4 h-4" style={{ color: accent }} />
            <p className="text-sm font-bold" style={{ color: text }}>Gallery</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {gallery.map((img, i) => (
              <button key={i} onClick={() => setGalleryIdx(i)}
                className="aspect-video rounded-2xl overflow-hidden transition-all active:scale-95"
                style={{ border: i === galleryIdx ? `2px solid ${accent}` : `1px solid ${border}` }}
              >
                <img loading="lazy" src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Google Map */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4" style={{ color: accent }} />
            <p className="text-sm font-bold" style={{ color: text }}>Location</p>
          </div>
          {import.meta.env.VITE_GOOGLE_MAPS_KEY ? (
            <iframe
              src={mapsUrl}
              className="w-full h-48 rounded-2xl"
              style={{ border: `1px solid ${border}` }}
              loading="lazy"
              title="Vendor Location"
            />
          ) : (
            <div
              className="w-full h-48 rounded-2xl flex flex-col items-center justify-center gap-2 overflow-hidden relative"
              style={{ background: muted, border: `1px solid ${border}` }}
            >
              {/* Subtle grid background to simulate a map */}
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />
              <MapPin className="w-8 h-8 relative z-10" style={{ color: accent }} />
              <p className="text-xs font-bold relative z-10" style={{ color: textMuted }}>Interactive Map (Preview)</p>
              <a
                href={`https://www.google.com/maps?q=${vendor.lat},${vendor.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold px-4 py-1.5 rounded-full relative z-10 mt-1 transition-all active:scale-95"
                style={{ background: card, color: accent, border: `1px solid ${border}` }}
              >
                Open in Google Maps
              </a>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" style={{ color: accent }} />
              <p className="text-sm font-bold" style={{ color: text }}>Reviews</p>
            </div>
            <button
              onClick={() => setShowReviewForm(v => !v)}
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-all active:scale-95"
              style={{ background: accent, color: '#fff' }}
            >
              <Plus className="w-3 h-3" /> Write Review
            </button>
          </div>

          {showReviewForm && (
            <div className="rounded-2xl p-4 space-y-3 mb-3" style={{ background: card, border: `1px solid ${border}` }}>
              <input placeholder="Your name" value={newReview.name}
                onChange={e => setNewReview(n => ({ ...n, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: muted, color: text, border: `1px solid ${border}` }}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: textMuted }}>Rating:</span>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setNewReview(n => ({ ...n, rating: s }))}>
                      <Star
                        className="w-6 h-6 transition-all"
                        fill={s <= newReview.rating ? '#f59e0b' : 'none'}
                        stroke={s <= newReview.rating ? '#f59e0b' : '#d1d5db'}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea placeholder="Share your experience..." value={newReview.text}
                onChange={e => setNewReview(n => ({ ...n, text: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                style={{ background: muted, color: text, border: `1px solid ${border}` }}
              />
              <button onClick={submitReview} disabled={submitting || !newReview.name || !newReview.text}
                className="w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                style={{ background: accent, color: '#fff' }}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          )}

          <div className="space-y-3">
            {reviews.map(review => (
              <div key={review.id} className="rounded-2xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold" style={{ color: text }}>{review.reviewer_name}</span>
                      {review.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <p className="text-[10px]" style={{ color: textMuted }}>
                      {review.created_at ? new Date(review.created_at).toLocaleDateString('en-IN') : ''}
                    </p>
                  </div>
                  <StarRating rating={review.rating ?? 0} size={3} />
                </div>
                <p className="text-sm leading-relaxed" style={{ color: textMuted }}>{review.review_text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
