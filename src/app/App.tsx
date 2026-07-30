import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { DesignStudio } from './components/DesignStudio';
import { PlateArchitect } from './components/PlateArchitect';

// import { PaymentTracker } from '../components/PaymentTracker'; // TODO: integrate later
import { useTheme } from './context/ThemeContext';
import {
  Users, Cake, Baby, Home, Church, ArrowRight, ArrowLeft,
  Zap, ShieldCheck, Star, Ruler, Sparkles, UtensilsCrossed, X,
  Sun, Moon, ChevronRight, FileText, CreditCard, LayoutGrid
} from 'lucide-react';

interface Design {
  id: string;
  image: string;
  title: string;
  description: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  coverImage: string;
  description: string;
  features: string[];
  designs: Design[];
}



const EVENTS = [
  { id: 'wedding', title: 'Weddings', desc: 'Grand stages & floral drapes', icon: <Users className="w-5 h-5" />, emoji: '💍', needsStageCustomization: true },
  { id: 'birthday', title: 'Birthdays', desc: 'Balloons & intimate lighting', icon: <Cake className="w-5 h-5" />, emoji: '🎂', needsStageCustomization: true },
  { id: 'baby', title: 'Baby Shower', desc: 'Soft pastels & central seating', icon: <Baby className="w-5 h-5" />, emoji: '🍼', needsStageCustomization: true },
  { id: 'housewarming', title: 'Housewarming', desc: 'Floral hangings & entrance', icon: <Home className="w-5 h-5" />, emoji: '🏡', needsStageCustomization: false },
  { id: 'memorial', title: 'Memorial', desc: 'White drapes & subtle florals', icon: <Church className="w-5 h-5" />, emoji: '🕊️', needsStageCustomization: false },
];

const PLAN_TIERS = [
  { id: 'budget', icon: <Zap className="w-4 h-4" />, badge: 'Starter', color: 'from-purple-400 to-purple-300' },
  { id: 'standard', icon: <ShieldCheck className="w-4 h-4" />, badge: 'Popular', color: 'from-purple-600 to-purple-400' },
  { id: 'premium', icon: <Star className="w-4 h-4" />, badge: 'VIP', color: 'from-purple-800 to-purple-500' },
];

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative w-14 h-7 rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #3d2860, #c09cde)'
          : 'linear-gradient(135deg, #2a7dd4, #5aa0e0)',
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-500"
        style={{ transform: isDark ? 'translateX(28px)' : 'translateX(0)' }}
      >
        {isDark
          ? <Moon className="w-3.5 h-3.5 text-[#3d2860]" />
          : <Sun className="w-3.5 h-3.5 text-[#2a7dd4]" />
        }
      </span>
    </button>
  );
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [activePackage, setActivePackage] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [currentDesignIndex, setCurrentDesignIndex] = useState(0);
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null);
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [dbPackages, setDbPackages] = useState<Record<string, Record<string, Plan>> | null>(null);
  const [eventDate, setEventDate] = useState('');
  const [vendorBanner, setVendorBanner] = useState<string | null>(null);

  useEffect(() => {
    const fetchDbPackages = async () => {
      if (!supabase) return;
      const { data } = await supabase.from('packages').select('*');
      if (data && data.length > 0) {
        const formatted: any = {};
        data.forEach(pkg => {
          if (!formatted[pkg.event_type]) formatted[pkg.event_type] = {};
          formatted[pkg.event_type][pkg.tier_id] = {
            id: pkg.tier_id,
            name: pkg.name,
            price: pkg.price,
            coverImage: pkg.cover_image,
            description: pkg.description,
            features: pkg.features || [],
            designs: [
              { id: pkg.id + '_1', image: pkg.cover_image, title: 'Main Cover', description: pkg.description },
              ...(pkg.image_2 ? [{ id: pkg.id + '_2', image: pkg.image_2, title: 'Gallery View', description: pkg.description_2 || '' }] : []),
              ...(pkg.image_3 ? [{ id: pkg.id + '_3', image: pkg.image_3, title: 'Gallery View', description: pkg.description_3 || '' }] : [])
            ]
          };
        });
        setDbPackages(formatted);
      }
      
      const { data: vData } = await supabase.from('vendor_profile').select('banner_image').limit(1).single();
      if (vData && vData.banner_image) {
        setVendorBanner(vData.banner_image);
      }
    };
    fetchDbPackages();
  }, []);

  // Carousel ref and state for touch-friendly autoscroll
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el || isHovered) return;

    let animationFrameId: number;

    const scroll = (time: number) => {
      if (el && !isHovered) {
        // Only scroll if we have overflow
        if (el.scrollWidth > el.clientWidth) {
          el.scrollLeft += 0.5;
          // The seamless loop point is exactly halfway through the duplicated content
          if (el.scrollLeft >= el.scrollWidth / 2) {
            el.scrollLeft = 0;
          }
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovered, selectedEvent, activeScreen]);

  const isDark = theme === 'dark';
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const bg = isDark ? '#1a1025' : '#f0f7ff';
  const card = isDark ? '#231534' : '#ddeeff';
  const border = isDark ? 'rgba(192,156,222,0.2)' : 'rgba(42,125,212,0.18)';
  const text = isDark ? '#f0e6ff' : '#0d2d52';
  const textMuted = isDark ? 'rgba(240,230,255,0.6)' : '#3a6898';
  const purple = isDark ? '#c09cde' : '#2a7dd4';

  const startDesign = (packageId: string | null = null) => {
    setActivePackage(packageId);
    setActiveScreen('studio');
  };

  const currentEvent = EVENTS.find(e => e.id === selectedEvent);

  const handleNextDesign = () => {
    if (selectedPlan) setCurrentDesignIndex(prev => (prev + 1) % selectedPlan.designs.length);
  };
  const handlePrevDesign = () => {
    if (selectedPlan) setCurrentDesignIndex(prev => (prev - 1 + selectedPlan.designs.length) % selectedPlan.designs.length);
  };
  const goHome = () => setActiveScreen('home');

  // ── PLAN DETAIL VIEW ─────────────────────────────────────────────────────────
  if (selectedPlan) {
    const currentDesign = selectedPlan.designs[currentDesignIndex];
    return (
      <div className="min-h-screen flex items-center justify-center p-3" style={{ background: bg, color: text }}>
        <div
          className="w-full max-w-lg rounded-[28px] overflow-hidden shadow-2xl"
          style={{ background: card, border: `1px solid ${border}` }}
        >
          {/* Plan Header */}
          <div
            className="relative px-5 pt-5 pb-4"
            style={{ background: `linear-gradient(135deg, ${isDark ? '#2d1e45' : '#c8e4ff'}, ${isDark ? '#1a1025' : '#b3d9ff'})` }}
          >
            <button
              onClick={() => { setSelectedPlan(null); setCurrentDesignIndex(0); setSelectedDesign(null); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: border, color: text }}
            >
              <X className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: purple }}>{selectedPlan.name} Plan</span>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-black" style={{ color: text }}>₹{selectedPlan.price.toLocaleString('en-IN')}</span>
              <span className="text-xs mb-1" style={{ color: textMuted }}>starting</span>
            </div>
          </div>

          {/* Image Carousel */}
          <div className="relative w-full aspect-video overflow-hidden">
            <img loading="lazy" src={currentDesign.image} alt={currentDesign.title} className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 flex items-center justify-between px-3">
              <button onClick={handlePrevDesign} className="w-9 h-9 bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center active:scale-90 transition-all">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button onClick={handleNextDesign} className="w-9 h-9 bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center active:scale-90 transition-all">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {selectedPlan.designs.map((_, i) => (
                <button key={i} onClick={() => setCurrentDesignIndex(i)}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: i === currentDesignIndex ? 20 : 6, background: i === currentDesignIndex ? '#fff' : 'rgba(255,255,255,0.5)' }}
                />
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="p-5 space-y-4">
            <div>
              <h3 className="font-bold text-lg" style={{ color: text }}>{currentDesign.title}</h3>
              <p className="text-sm mt-0.5" style={{ color: textMuted }}>{currentDesign.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {selectedPlan.features.map((f, i) => (
                <div key={i} className="rounded-xl px-3 py-2" style={{ background: isDark ? '#2d1e45' : '#c8e4ff' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: purple }}>
                      <span className="text-white text-[9px] font-black">✓</span>
                    </span>
                    <span className="text-xs font-medium" style={{ color: text }}>{f}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <input 
                type="date" 
                value={eventDate} 
                onChange={e => setEventDate(e.target.value)}
                className="w-full px-3 py-3 rounded-xl text-sm outline-none font-bold"
                style={{ background: isDark ? '#1a1025' : '#f0f7ff', color: text, border: `1px solid ${border}` }}
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={async () => {
                    if (!eventDate) {
                      alert("Please select an event date first.");
                      return;
                    }
                    const eventName = selectedEvent ? EVENTS.find(e => e.id === selectedEvent)?.title : 'Event';
                    
                    // Save order to Supabase
                    await supabase.from('quotes').insert([{
                      quote_type: 'package',
                      event_type: eventName,
                      total: selectedPlan.price,
                      client_name: 'App User (Package Booking)',
                      event_date: eventDate || null,
                      line_items: [{ name: currentDesign.title, qty: 1, unitPrice: selectedPlan.price }]
                    }]);

                    alert("✅ Booking Submitted! The vendor will review and accept your request shortly.");
                  }}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  style={{ background: `linear-gradient(135deg, ${purple}, ${isDark ? '#a07ac8' : '#5aa0e0'})`, color: '#fff' }}
                >
                  Book Now
                </button>

                <button
                  onClick={() => {
                    const eventName = selectedEvent ? EVENTS.find(e => e.id === selectedEvent)?.title : 'Event';
                    const text = `Hi, I'm interested in the ${currentDesign.title} package for my ${eventName} on ${eventDate || 'TBD'}!\n\n*Plan:* ${selectedPlan.name}\n*Starting from:* ₹${selectedPlan.price.toLocaleString('en-IN')}\n\nCould you provide more details?`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  style={{ background: isDark ? '#231534' : '#fff', color: purple, border: `2px solid ${purple}` }}
                >
                  WhatsApp Inquiry
                </button>
              </div>
              <button
                onClick={() => { setSelectedPlan(null); setCurrentDesignIndex(0); setSelectedDesign(null); }}
                className="w-full py-3 rounded-2xl font-medium text-sm transition-all active:scale-95"
                style={{ border: `1px solid ${border}`, color: text }}
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── STUDIO VIEW ───────────────────────────────────────────────────────────────
  if (activeScreen === 'studio') {
    return (
      <DndProvider
        backend={isTouchDevice ? TouchBackend : HTML5Backend}
        options={isTouchDevice ? { enableMouseEvents: true, delayTouchStart: 100 } : undefined}
      >
        <DesignStudio initialPackage={activePackage} eventType={selectedEvent} />
        <button
          onClick={goHome}
          onTouchEnd={(e) => { e.preventDefault(); goHome(); }}
          className="fixed top-3 left-3 z-50 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold shadow-lg transition-all active:scale-95"
          style={{ background: card, color: text, border: `1px solid ${border}` }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </DndProvider>
    );
  }

  // ── CATERING VIEW ─────────────────────────────────────────────────────────────
  if (activeScreen === 'catering') {
    return (
      <>
        <PlateArchitect />
        <button
          onClick={() => setActiveScreen('home')}
          className="fixed top-3 left-3 z-50 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold shadow-lg transition-all active:scale-95"
          style={{ background: card, color: text, border: `1px solid ${border}` }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </>
    );
  }



  // ── PAYMENT TRACKER VIEW (commented out — integrate later) ────────────────────
  // if (activeScreen === 'payments') {
  //   return (
  //     <>
  //       <PaymentTracker />
  //       <BottomNav active={activeScreen} onNav={setActiveScreen} isDark={isDark} border={border} card={card} text={text} purple={purple} />
  //     </>
  //   );
  // }

  // ── HOME VIEW ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-20" style={{ background: bg, color: text }}>

      {/* ── HEADER ── */}
      <header
        className="sticky top-0 z-30 px-4 py-3"
        style={{
          background: isDark ? 'rgba(26,16,37,0.85)' : 'rgba(240,247,255,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${border}`,
        }}
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${purple}, ${isDark ? '#a07ac8' : '#5aa0e0'})` }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none" style={{ color: text }}>Planify</h1>
              <p className="text-[10px] font-medium tracking-wide" style={{ color: textMuted }}>Event Planner</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <div className="px-4 pt-5 pb-2 max-w-lg mx-auto">
        <div
          className="rounded-3xl p-5 relative overflow-hidden bg-cover bg-center"
          style={{ 
            background: vendorBanner 
              ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${vendorBanner}) center/cover`
              : `linear-gradient(135deg, ${isDark ? '#2d1e45' : '#c8e4ff'}, ${isDark ? '#3d2860' : '#b3d9ff'})` 
          }}
        >
          {!vendorBanner && (
            <>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20" style={{ background: purple, transform: 'translate(30%, -30%)' }} />
              <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full opacity-10" style={{ background: isDark ? '#a07ac8' : '#5aa0e0', transform: 'translate(-30%, 30%)' }} />
            </>
          )}
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-1" style={{ color: vendorBanner ? '#c09cde' : purple }}>✨ Welcome</p>
            <h2 className="text-2xl font-black leading-tight mb-1.5" style={{ color: vendorBanner ? '#ffffff' : text }}>Plan your perfect event</h2>
            <p className="text-sm leading-relaxed" style={{ color: vendorBanner ? 'rgba(255,255,255,0.8)' : textMuted }}>Design stages, plan menus & get instant quotes — all in one app.</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-6">

        {/* ── EVENT SELECTION ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black tracking-tight" style={{ color: text }}>
              {selectedEvent ? `${currentEvent?.emoji} ${currentEvent?.title}` : '🎉 Event Type'}
            </h2>
            {selectedEvent && (
              <button
                onClick={() => setSelectedEvent(null)}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95"
                style={{ border: `1px solid ${border}`, color: text }}
              >
                <ArrowLeft className="w-3 h-3" /> All
              </button>
            )}
          </div>

          {!selectedEvent ? (
            /* Event Grid */
            <div className="grid grid-cols-2 gap-2.5">
              {EVENTS.map(event => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event.id)}
                  className="text-left p-4 rounded-2xl transition-all active:scale-95 group"
                  style={{ background: card, border: `1px solid ${border}` }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all" style={{ background: isDark ? '#3d2860' : '#b3d9ff', color: purple }}>
                    {event.icon}
                  </div>
                  <h3 className="font-bold text-sm leading-tight mb-0.5" style={{ color: text }}>{event.title}</h3>
                  <p className="text-[11px] leading-4" style={{ color: textMuted }}>{event.desc}</p>
                  <div className="mt-2.5 flex items-center gap-1" style={{ color: purple }}>
                    <span className="text-[10px] font-semibold">Select</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Plan Selection after event chosen */
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {currentEvent?.needsStageCustomization && (
                <button
                  onClick={() => startDesign()}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-95"
                  style={{ background: card, border: `1px solid ${border}` }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: isDark ? '#3d2860' : '#b3d9ff', color: purple }}>
                    <Ruler className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm" style={{ color: text }}>Customize Your Stage</h3>
                    <p className="text-xs mt-0.5" style={{ color: textMuted }}>Start with a blank canvas →</p>
                  </div>
                  <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: purple }} />
                </button>
              )}

              <p className="text-xs font-semibold uppercase tracking-widest px-1" style={{ color: textMuted }}>Or choose a package</p>

              {/* Plan carousel */}
              <div 
                className="relative overflow-x-auto hide-scrollbar rounded-2xl"
                ref={carouselRef}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onTouchStart={() => setIsHovered(true)}
                onTouchEnd={() => setIsHovered(false)}
                style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'auto' }}
              >
                <div className="flex gap-3 w-max pb-2">
                  {/* Render 4 times for a flawless infinite loop on any screen size */}
                  {[...PLAN_TIERS, ...PLAN_TIERS, ...PLAN_TIERS, ...PLAN_TIERS].map((tier, idx) => {
                    const basePlans = dbPackages || {};
                    const currentEventPlans = (selectedEvent && basePlans[selectedEvent]) ? basePlans[selectedEvent] : (basePlans['wedding'] || {});
                    const plan = currentEventPlans[tier.id];
                    
                    if (!plan) return null; // Safe fallback
                    
                    return (
                      <button
                        key={`${tier.id}-${idx}`}
                        onClick={() => setSelectedPlan(plan)}
                        className="w-[145px] flex-shrink-0 rounded-2xl overflow-hidden text-left transition-all active:scale-95 shadow-sm"
                        style={{ border: `1px solid ${border}`, background: card }}
                      >
                        <div className="aspect-[4/3] relative overflow-hidden">
                          <img loading="lazy" src={plan.coverImage} alt={plan.name} className="w-full h-full object-cover object-center" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <span className="absolute bottom-2 left-2 text-[10px] font-black text-white uppercase tracking-wide bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                            {tier.badge}
                          </span>
                          <span className="absolute top-2 right-2" style={{ color: '#fff' }}>{tier.icon}</span>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-black text-sm" style={{ color: text }}>{plan.name}</span>
                            <span className="text-xs font-black" style={{ color: purple }}>₹{(plan.price / 1000).toFixed(0)}k</span>
                          </div>
                          <p className="text-[10px] line-clamp-2" style={{ color: textMuted }}>{plan.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── DIVIDER ── */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: border }} />
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: textMuted }}>Also</span>
          <div className="flex-1 h-px" style={{ background: border }} />
        </div>

        {/* ── CATERING CARD ── */}
        <section>
          <h2 className="text-lg font-black tracking-tight mb-3" style={{ color: text }}>🍽️ Food & Catering</h2>
          <button
            onClick={() => setActiveScreen('catering')}
            className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-95 shadow-sm"
            style={{ background: card, border: `1px solid ${border}` }}
          >
            <div
              className="px-5 py-4 flex items-center gap-4"
              style={{ background: `linear-gradient(135deg, ${isDark ? '#2d1e45' : '#c8e4ff'}, ${isDark ? '#1a1025' : '#faf8ff'})` }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${purple}, ${isDark ? '#a07ac8' : '#5aa0e0'})` }}>
                <UtensilsCrossed className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black tracking-tight" style={{ color: text }}>Plate Architect</h3>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: textMuted }}>Build menus, estimate guests & export PDF quotes instantly</p>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: purple }} />
            </div>
            <div className="px-5 py-3 flex gap-2" style={{ borderTop: `1px solid ${border}` }}>
              {['Menu Builder', 'Guest Count', 'PDF Quotes'].map(tag => (
                <span key={tag} className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: isDark ? '#3d2860' : '#b3d9ff', color: isDark ? '#c09cde' : '#0d2d52' }}>
                  {tag}
                </span>
              ))}
            </div>
          </button>
        </section>

      </div>

      {/* ── BOTTOM NAV ── */}
      <BottomNav active={activeScreen} onNav={setActiveScreen} isDark={isDark} border={border} card={card} text={text} purple={purple} />
    </div>
  );
}

// ── Bottom Navigation Bar ─────────────────────────────────────────────────────
type Screen = 'home' | 'studio' | 'catering' | 'quotes' /* | 'payments' */;

function BottomNav({ active, onNav, isDark, border, card, text, purple }: {
  active: Screen;
  onNav: (s: Screen) => void;
  isDark: boolean; border: string; card: string; text: string; purple: string;
}) {
  const items = [
    { id: 'home' as Screen,     label: 'Home',    icon: <LayoutGrid className="w-5 h-5" /> },
    // { id: 'payments' as Screen, label: 'Pay', icon: <CreditCard className="w-5 h-5" /> }, // TODO: integrate later
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2 max-w-lg mx-auto"
      style={{
        background: isDark ? 'rgba(26,16,37,0.97)' : 'rgba(240,247,255,0.97)',
        backdropFilter: 'blur(16px)',
        borderTop: `1px solid ${border}`,
      }}
    >
      {items.map(item => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all active:scale-90"
            style={{
              background: isActive ? (isDark ? '#2d1e45' : '#c8e4ff') : 'transparent',
              color: isActive ? purple : isDark ? 'rgba(240,230,255,0.4)' : 'rgba(13,45,82,0.45)',
            }}
          >
            {item.icon}
            <span className="text-[9px] font-bold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
