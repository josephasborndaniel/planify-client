import { useState } from 'react';
import { FileText, Download, Plus, Trash2, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../app/context/ThemeContext';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface QuoteItem { id: string; category: string; name: string; qty: number; unitPrice: number; unit: string; }

const CATALOG: { category: string; emoji: string; items: { name: string; unitPrice: number; unit: string }[] }[] = [
  {
    category: 'Seating & Furniture', emoji: '🪑',
    items: [
      { name: 'Banquet Chair', unitPrice: 80, unit: 'per chair' },
      { name: 'Round Table (8-seater)', unitPrice: 350, unit: 'per table' },
      { name: 'Sofa Set (3+1+1)', unitPrice: 2500, unit: 'per set' },
      { name: 'Stage Throne Chairs', unitPrice: 3500, unit: 'per pair' },
      { name: 'High Bar Stool', unitPrice: 150, unit: 'per stool' },
      { name: 'Kids Chair', unitPrice: 50, unit: 'per chair' },
    ],
  },
  {
    category: 'Venue & Stage', emoji: '🏟️',
    items: [
      { name: 'Stage Platform (per sq.m)', unitPrice: 2500, unit: 'per sq.m' },
      { name: 'Red Carpet (per ft)', unitPrice: 120, unit: 'per ft' },
      { name: 'Entrance Gate Arch', unitPrice: 8000, unit: 'fixed' },
      { name: 'Shamiana Tent (per sq.ft)', unitPrice: 45, unit: 'per sq.ft' },
      { name: 'Mandap Setup', unitPrice: 25000, unit: 'fixed' },
      { name: 'Photo Booth Corner', unitPrice: 6000, unit: 'fixed' },
    ],
  },
  {
    category: 'Lighting & AV', emoji: '💡',
    items: [
      { name: 'LED Par Light', unitPrice: 500, unit: 'per light' },
      { name: 'DJ Console + Sound System', unitPrice: 18000, unit: 'fixed' },
      { name: 'Projector + Screen (8ft)', unitPrice: 5000, unit: 'fixed' },
      { name: 'Fairy Light Canopy (per sq.m)', unitPrice: 300, unit: 'per sq.m' },
      { name: 'Spotlights (set of 4)', unitPrice: 2000, unit: 'per set' },
      { name: 'Neon Name Sign', unitPrice: 4500, unit: 'fixed' },
    ],
  },
  {
    category: 'Floral & Decoration', emoji: '🌸',
    items: [
      { name: 'Fresh Flower Centrepiece', unitPrice: 800, unit: 'per table' },
      { name: 'Floral Arch (6ft)', unitPrice: 6000, unit: 'fixed' },
      { name: 'Rose Petal Pathway (per ft)', unitPrice: 150, unit: 'per ft' },
      { name: 'Balloon Cluster Decor', unitPrice: 1200, unit: 'per cluster' },
      { name: 'Hanging Floral Chandelier', unitPrice: 9000, unit: 'fixed' },
      { name: 'Table Runner (floral)', unitPrice: 400, unit: 'per table' },
    ],
  },
  {
    category: 'Service Staff', emoji: '🧑‍🍳',
    items: [
      { name: 'Waiter / Server', unitPrice: 1200, unit: 'per person/day' },
      { name: 'Event Coordinator', unitPrice: 5000, unit: 'per person/day' },
      { name: 'Security Guard', unitPrice: 1500, unit: 'per person/day' },
      { name: 'Valet Parking Attendant', unitPrice: 1200, unit: 'per person/day' },
      { name: 'Makeup Artist', unitPrice: 8000, unit: 'fixed' },
      { name: 'Photographer', unitPrice: 15000, unit: 'fixed' },
      { name: 'Videographer', unitPrice: 18000, unit: 'fixed' },
    ],
  },
  {
    category: 'Customization Add-ons', emoji: '✨',
    items: [
      { name: 'Custom Name Banner (10ft)', unitPrice: 2500, unit: 'fixed' },
      { name: 'Invitation Card Design (per 100)', unitPrice: 3000, unit: 'per 100' },
      { name: 'Return Gift Packing (per gift)', unitPrice: 80, unit: 'per gift' },
      { name: 'Theme Costume Rental', unitPrice: 500, unit: 'per costume' },
      { name: 'Custom Cake (per kg)', unitPrice: 1200, unit: 'per kg' },
      { name: 'Fireworks Package', unitPrice: 15000, unit: 'fixed' },
    ],
  },
];

export function QuoteGenerator() {
  const { isDark } = useTheme();
  const [eventType, setEventType] = useState('Wedding');
  const [clientName, setClientName] = useState('');
  const [guestCount, setGuestCount] = useState(200);
  const [eventDate, setEventDate] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [openCat, setOpenCat] = useState<string | null>('Seating & Furniture');
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState(1);
  const [customPrice, setCustomPrice] = useState(0);
  const [customUnit, setCustomUnit] = useState('fixed');

  const bg = isDark ? '#1a1025' : '#f0f7ff';
  const card = isDark ? '#231534' : '#ddeeff';
  const border = isDark ? 'rgba(192,156,222,0.2)' : 'rgba(42,125,212,0.18)';
  const text = isDark ? '#f0e6ff' : '#0d2d52';
  const textMuted = isDark ? 'rgba(240,230,255,0.6)' : '#3a6898';
  const accent = isDark ? '#c09cde' : '#2a7dd4';
  const muted = isDark ? '#2d1e45' : '#c8e4ff';

  const addCatalogItem = (cat: string, item: { name: string; unitPrice: number; unit: string }) => {
    const existing = items.find(i => i.name === item.name);
    if (existing) {
      setItems(prev => prev.map(i => i.id === existing.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setItems(prev => [...prev, { id: Date.now().toString(), category: cat, name: item.name, qty: 1, unitPrice: item.unitPrice, unit: item.unit }]);
    }
  };

  const addCustomItem = () => {
    if (!customName || customPrice <= 0) return;
    setItems(prev => [...prev, { id: Date.now().toString(), category: 'Custom', name: customName, qty: customQty, unitPrice: customPrice, unit: customUnit }]);
    setCustomName(''); setCustomQty(1); setCustomPrice(0); setCustomUnit('fixed');
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const updateQty = (id: string, delta: number) => setItems(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const quoteNo = `PLF-EV-${Date.now().toString().slice(-6)}`;

    // Header
    doc.setFillColor(42, 125, 212);
    doc.rect(0, 0, pageW, 44, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text('PLANIFY', 14, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 230, 255);
    doc.text('Professional Event Planning', 14, 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('EXTRAS & VENUE QUOTATION', pageW - 14, 15, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 230, 255);
    doc.text(`Quote: ${quoteNo}`, pageW - 14, 22, { align: 'right' });
    doc.text(`Date: ${date}`, pageW - 14, 28, { align: 'right' });
    doc.text(`Event Date: ${eventDate || 'TBD'}`, pageW - 14, 34, { align: 'right' });

    // Client info banner
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 48, pageW - 28, 20, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(42, 125, 212);
    doc.text('CLIENT DETAILS', 18, 55);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(8);
    doc.text(`Name: ${clientName || 'N/A'}   |   Event: ${eventType}   |   Guests: ${guestCount.toLocaleString('en-IN')}`, 18, 62);

    // Prepared by
    let y = 74;
    doc.setFillColor(240, 247, 255);
    doc.roundedRect(14, y, pageW - 28, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(42, 125, 212);
    doc.text('PREPARED BY: Planify Event Management', 18, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('contact@planify.in  |  +91 98765 43210  |  www.planify.in', 18, y + 12);

    y += 22;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(42, 125, 212);
    doc.text('EXTRAS, VENUE & CUSTOMIZATION ITEMS', 14, y);
    doc.setDrawColor(42, 125, 212);
    doc.setLineWidth(0.5);
    doc.line(14, y + 1, 14 + 80, y + 1);

    const rows = items.map((item, i) => [
      i + 1,
      item.category,
      item.name,
      item.qty,
      `Rs.${item.unitPrice.toLocaleString('en-IN')}`,
      item.unit,
      `Rs.${(item.qty * item.unitPrice).toLocaleString('en-IN')}`,
    ]);

    autoTable(doc, {
      startY: y + 5,
      head: [['#', 'Category', 'Item', 'Qty', 'Unit Price', 'Unit', 'Total']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [42, 125, 212], textColor: 255, fontStyle: 'bold', fontSize: 7, halign: 'center' },
      bodyStyles: { fontSize: 7, textColor: [30, 30, 30], halign: 'center' },
      columnStyles: {
        0: { cellWidth: 8 }, 1: { cellWidth: 28 }, 2: { halign: 'left', cellWidth: 50 },
        3: { cellWidth: 10 }, 4: { cellWidth: 22 }, 5: { cellWidth: 22 }, 6: { cellWidth: 22 },
      },
      alternateRowStyles: { fillColor: [240, 247, 255] },
      margin: { left: 14, right: 14 },
    });

    const afterTable = (doc as any).lastAutoTable.finalY + 8;
    const sx = pageW - 14 - 76;

    doc.setFillColor(42, 125, 212);
    doc.roundedRect(sx, afterTable, 76, 46, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(200, 230, 255);
    doc.text('PRICE SUMMARY', sx + 5, afterTable + 7);
    const sLines = [
      ['Guests:', guestCount.toLocaleString('en-IN')],
      ['Subtotal:', `Rs.${subtotal.toLocaleString('en-IN')}`],
      ['GST (18%):', `Rs.${gst.toLocaleString('en-IN')}`],
    ];
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 240, 255);
    sLines.forEach(([l, v], i) => {
      doc.text(l, sx + 5, afterTable + 15 + i * 7);
      doc.text(v, sx + 71, afterTable + 15 + i * 7, { align: 'right' });
    });
    doc.setDrawColor(255, 255, 255);
    doc.line(sx + 5, afterTable + 37, sx + 71, afterTable + 37);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('GRAND TOTAL:', sx + 5, afterTable + 44);
    doc.text(`Rs.${total.toLocaleString('en-IN')}`, sx + 71, afterTable + 44, { align: 'right' });

    const termsY = afterTable + 54;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(42, 125, 212);
    doc.text('TERMS & CONDITIONS', 14, termsY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    ['1. Quotation valid for 15 days from issue date.',
      '2. 50% advance payment required to confirm booking.',
      '3. GST @18% applicable on all services.',
      '4. Damage or loss of rented items charged at replacement cost.',
      '5. Cancellation within 7 days is non-refundable.']
      .forEach((t, i) => doc.text(t, 14, termsY + 6 + i * 5));

    const footerY = doc.internal.pageSize.getHeight() - 12;
    doc.setFillColor(42, 125, 212);
    doc.rect(0, footerY - 4, pageW, 20, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(200, 230, 255);
    doc.text(`© ${new Date().getFullYear()} Planify Event Management. All rights reserved.`, pageW / 2, footerY + 3, { align: 'center' });
    doc.text('This is a computer-generated quotation.', pageW / 2, footerY + 8, { align: 'center' });

    const fileName = `Planify_EventQuote_${quoteNo}.pdf`;
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    const waText = `🎪 *Planify Event Quotation*\n\n*Quote:* ${quoteNo}\n*Client:* ${clientName || 'N/A'}\n*Event:* ${eventType}\n*Date:* ${eventDate || 'TBD'}\n*Guests:* ${guestCount.toLocaleString('en-IN')}\n*Items:* ${items.length}\n*Subtotal:* ₹${subtotal.toLocaleString('en-IN')}\n*GST (18%):* ₹${gst.toLocaleString('en-IN')}\n*Grand Total:* ₹${total.toLocaleString('en-IN')}\n\n_PDF quotation attached. Authorised by Planify._`;

    // Save to Database so Admin can see it
    supabase.from('quotes').insert([{
      quote_type: 'custom_stage',
      event_type: eventType,
      guest_count: guestCount,
      line_items: items,
      subtotal,
      gst,
      total,
      event_date: eventDate || null,
      client_name: clientName || 'Guest'
    }]).then(({ error }) => {
      if (error) console.error("Error saving quote", error);
    });

    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      navigator.share({ title: `Planify Quote ${quoteNo}`, text: waText, files: [pdfFile] })
        .catch(() => doc.save(fileName));
    } else {
      doc.save(fileName);
      window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
    }
  };

  const inputStyle = { background: muted, color: text, border: `1px solid ${border}` };
  const inputCls = 'w-full px-3 py-2 rounded-xl text-sm outline-none';

  return (
    <div className="pb-8 rounded-3xl" style={{ background: bg, color: text }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3" style={{ borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center gap-2 mb-0.5">
          <FileText className="w-5 h-5" style={{ color: accent }} />
          <h1 className="text-xl font-black" style={{ color: text }}>Event Quote Builder</h1>
        </div>
        <p className="text-xs" style={{ color: textMuted }}>Extras • Venue • Customization • Staff</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Event Details */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: card, border: `1px solid ${border}` }}>
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: accent }}>📋 Event Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase block mb-1" style={{ color: textMuted }}>Client Name</label>
              <input className={inputCls} style={inputStyle} placeholder="e.g. Raj & Priya" value={clientName} onChange={e => setClientName(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase block mb-1" style={{ color: textMuted }}>Event Type</label>
              <select className={inputCls} style={inputStyle} value={eventType} onChange={e => setEventType(e.target.value)}>
                {['Wedding', 'Birthday', 'Baby Shower', 'Housewarming', 'Corporate', 'Memorial'].map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase block mb-1" style={{ color: textMuted }}>Event Date</label>
              <input type="date" className={inputCls} style={inputStyle} value={eventDate} onChange={e => setEventDate(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase block mb-1" style={{ color: textMuted }}>Guests: {guestCount}</label>
              <input type="range" min={10} max={2000} step={10} value={guestCount} onChange={e => setGuestCount(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer mt-2" style={{ accentColor: accent }} />
            </div>
          </div>
        </div>

        {/* Catalog */}
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-widest px-1" style={{ color: accent }}>🛍️ Select Items</p>
          {CATALOG.map(cat => (
            <div key={cat.category} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
              <button
                onClick={() => setOpenCat(openCat === cat.category ? null : cat.category)}
                className="w-full flex items-center justify-between px-4 py-3"
                style={{ background: card, color: text }}
              >
                <span className="text-sm font-bold">{cat.emoji} {cat.category}</span>
                {openCat === cat.category ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openCat === cat.category && (
                <div className="grid grid-cols-2 gap-2 p-3" style={{ background: isDark ? '#1a1025' : '#f5faff' }}>
                  {cat.items.map(item => {
                    const inCart = items.find(i => i.name === item.name);
                    return (
                      <button
                        key={item.name}
                        onClick={() => addCatalogItem(cat.category, item)}
                        className="text-left rounded-xl p-2.5 transition-all active:scale-95"
                        style={{
                          background: inCart ? (isDark ? '#2d1e45' : '#e8f0fe') : muted,
                          border: `1px solid ${inCart ? accent + '88' : border}`,
                        }}
                      >
                        <p className="text-[11px] font-bold leading-tight" style={{ color: text }}>{item.name}</p>
                        <p className="text-[10px] mt-0.5 font-semibold" style={{ color: accent }}>₹{item.unitPrice.toLocaleString('en-IN')}</p>
                        <p className="text-[9px]" style={{ color: textMuted }}>{item.unit}</p>
                        {inCart && <span className="text-[9px] font-black" style={{ color: accent }}>✓ ×{inCart.qty}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Custom Item */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: card, border: `1px solid ${border}` }}>
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: accent }}>➕ Add Custom Item</p>
          <input className={inputCls} style={inputStyle} placeholder="Item name (e.g. Horse Carriage)" value={customName} onChange={e => setCustomName(e.target.value)} />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px]" style={{ color: textMuted }}>Qty</label>
              <input type="number" min={1} className={inputCls} style={inputStyle} value={customQty} onChange={e => setCustomQty(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-[10px]" style={{ color: textMuted }}>Unit Price ₹</label>
              <input type="number" min={0} className={inputCls} style={inputStyle} value={customPrice} onChange={e => setCustomPrice(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-[10px]" style={{ color: textMuted }}>Unit</label>
              <input className={inputCls} style={inputStyle} placeholder="fixed" value={customUnit} onChange={e => setCustomUnit(e.target.value)} />
            </div>
          </div>
          <button onClick={addCustomItem} className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95"
            style={{ background: accent, color: '#fff' }}>
            <Plus className="w-4 h-4" /> Add Custom Item
          </button>
        </div>

        {/* Cart */}
        {items.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
            <div className="px-4 py-2.5" style={{ background: muted }}>
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: accent }}>🧾 Quote Items ({items.length})</p>
            </div>
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3" style={{ background: card, borderBottom: `1px solid ${border}` }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: text }}>{item.name}</p>
                  <p className="text-[10px]" style={{ color: textMuted }}>{item.category} · {item.unit}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black" style={{ background: muted, color: text }}>−</button>
                  <span className="w-5 text-center text-xs font-black" style={{ color: text }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black" style={{ background: accent, color: '#fff' }}>+</button>
                </div>
                <span className="text-xs font-black w-20 text-right" style={{ color: accent }}>₹{(item.qty * item.unitPrice).toLocaleString('en-IN')}</span>
                <button onClick={() => removeItem(item.id)}><Trash2 className="w-4 h-4 text-red-400" /></button>
              </div>
            ))}
            <div className="px-4 py-3 space-y-1" style={{ background: isDark ? '#1a1025' : '#f0f7ff' }}>
              <div className="flex justify-between text-xs" style={{ color: textMuted }}><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-xs" style={{ color: textMuted }}><span>GST (18%)</span><span>₹{gst.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between font-black text-base pt-1" style={{ color: text, borderTop: `2px solid ${accent}` }}>
                <span>Grand Total</span><span style={{ color: accent }}>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="mt-8 mb-4">
        <button
          onClick={generatePDF}
          disabled={items.length === 0}
          className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-40 transition-all"
          style={{ background: `linear-gradient(135deg, ${accent}, ${isDark ? '#a07ac8' : '#5aa0e0'})`, color: '#fff' }}
        >
          <Download className="w-5 h-5" /> Export PDF & Share on WhatsApp <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
