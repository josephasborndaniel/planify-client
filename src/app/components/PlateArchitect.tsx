import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Minus, Plus, Download, Users, Utensils, Info, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import plateImg from './plate.png';
import waterImg from './water.png';
import birImg from './biriyani.png';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MenuItem {
  id: string;
  category: 'Starters' | 'Main Course' | 'Breads' | 'Desserts' | 'Hot Beverages' | 'Cold Drinks & Juices';
  name: string;
  pricePerPlate: number;
  quantity: number;
  imgUrl: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Starters': '🥗',
  'Main Course': '🍛',
  'Breads': '🫓',
  'Desserts': '🍮',
  'Hot Beverages': '☕',
  'Cold Drinks & Juices': '🥤',
};

export function PlateArchitect() {
  const { isDark } = useTheme();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [guestCount, setGuestCount] = useState(500);
  const [showPlate, setShowPlate] = useState(true);

  useEffect(() => {
    const fetchCatering = async () => {
      const { data } = await supabase.from('items').select('*').in('category', ['Starters', 'Main Course', 'Breads', 'Desserts', 'Hot Beverages', 'Cold Drinks & Juices']);
      if (data && data.length > 0) {
        setItems(data.map(d => ({
          id: d.id,
          category: d.category as MenuItem['category'],
          name: d.name,
          pricePerPlate: d.base_price,
          quantity: 0,
          imgUrl: d.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop'
        })));
      }
    };
    fetchCatering();
  }, []);

  const bg = isDark ? '#1a1025' : '#f0f7ff';
  const card = isDark ? '#231534' : '#ddeeff';
  const border = isDark ? 'rgba(192,156,222,0.2)' : 'rgba(42,125,212,0.18)';
  const text = isDark ? '#f0e6ff' : '#0d2d52';
  const textMuted = isDark ? 'rgba(240,230,255,0.6)' : '#3a6898';
  const muted = isDark ? '#2d1e45' : '#c8e4ff';
  const purple = isDark ? '#c09cde' : '#2a7dd4';

  const updateQuantity = (id: string, delta: number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    ));
  };

  const selectedItems = items.filter(i => i.quantity > 0 && i.category !== 'Hot Beverages' && i.category !== 'Cold Drinks & Juices');
  const selectedDrinks = items.filter(i => i.quantity > 0 && (i.category === 'Hot Beverages' || i.category === 'Cold Drinks & Juices'));
  const pricePerPlate = items.reduce((sum, item) => sum + (item.pricePerPlate * item.quantity), 0);
  const totalCost = pricePerPlate * guestCount;
  const totalSelected = selectedItems.length + selectedDrinks.length;
  const allSelected = items.filter(i => i.quantity > 0);

  const generateAndSharePDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const quoteNo = `PLF-${Date.now().toString().slice(-6)}`;

    // ── Background header band ──
    doc.setFillColor(42, 125, 212);
    doc.rect(0, 0, pageW, 42, 'F');

    // White accent stripe
    doc.setFillColor(255, 255, 255, 0.15);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.line(0, 42, pageW, 42);

    // Brand name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text('PLANIFY', 14, 18);

    // Tagline
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 230, 255);
    doc.text('Professional Event Planning', 14, 24);

    // Document title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('FOOD & CATERING QUOTATION', pageW - 14, 16, { align: 'right' });

    // Quote meta
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 230, 255);
    doc.text(`Quote No: ${quoteNo}`, pageW - 14, 22, { align: 'right' });
    doc.text(`Date: ${date}`, pageW - 14, 27, { align: 'right' });
    doc.text(`Quote No: ${quoteNo}`, pageW - 14, 32, { align: 'right' });

    // ── Guest count highlight banner ──
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 46, pageW - 28, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(42, 125, 212);
    doc.text('👥  EVENT CATERING FOR:', 18, 55);
    doc.setFontSize(11);
    doc.setTextColor(20, 80, 160);
    doc.text(`${guestCount.toLocaleString('en-IN')} PERSONS`, pageW - 18, 55, { align: 'right' });

    // ── Section: Prepared by ──
    let y = 66;
    doc.setFillColor(240, 247, 255);
    doc.roundedRect(14, y, pageW - 28, 22, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(42, 125, 212);
    doc.text('PREPARED BY', 18, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text('Planify Event Management', 18, y + 12);
    doc.text('contact@planify.in  |  +91 98765 43210  |  www.planify.in', 18, y + 17);

    // ── Items table ──
    y += 28;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(42, 125, 212);
    doc.text('CATERING ITEMS', 14, y);
    doc.setDrawColor(42, 125, 212);
    doc.setLineWidth(0.5);
    doc.line(14, y + 1, 14 + 42, y + 1);

    const tableRows = allSelected.map((item, i) => [
      i + 1,
      item.category,
      item.name,
      `${item.quantity} serving${item.quantity > 1 ? 's' : ''}`,
      `Rs.${item.pricePerPlate}`,
      `Rs.${(item.pricePerPlate * item.quantity * guestCount).toLocaleString('en-IN')}`,
    ]);

    // Note below table header
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`* Totals calculated for ${guestCount.toLocaleString('en-IN')} persons. Rate/Plate × Qty/Plate × No. of Persons = Total.`, 14, y + 3);

    autoTable(doc, {
      startY: y + 10,
      head: [['#', 'Category', 'Item', 'Qty/Plate', 'Rate/Plate', 'Total']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [42, 125, 212],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      bodyStyles: { fontSize: 8, textColor: [30, 30, 30], halign: 'center' },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 28 },
        2: { halign: 'left', cellWidth: 55 },
        3: { cellWidth: 20 },
        4: { cellWidth: 22 },
        5: { cellWidth: 28 },
      },
      alternateRowStyles: { fillColor: [240, 247, 255] },
      margin: { left: 14, right: 14 },
    });

    // ── Summary box ──
    const afterTable = (doc as any).lastAutoTable.finalY + 8;
    const summaryX = pageW - 14 - 72;

    doc.setFillColor(42, 125, 212);
    doc.roundedRect(summaryX, afterTable, 72, 42, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(200, 230, 255);
    doc.text('SUMMARY', summaryX + 5, afterTable + 7);

    const summaryLines = [
      [`No. of Persons:`, `${guestCount.toLocaleString('en-IN')}`],
      [`Rate / Plate:`, `Rs.${pricePerPlate}`],
      [`Subtotal:`, `Rs.${totalCost.toLocaleString('en-IN')}`],
      [`GST (18%):`, `Rs.${Math.round(totalCost * 0.18).toLocaleString('en-IN')}`],
    ];
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 240, 255);
    summaryLines.forEach(([label, val], i) => {
      doc.text(label, summaryX + 5, afterTable + 14 + i * 6);
      doc.text(val, summaryX + 67, afterTable + 14 + i * 6, { align: 'right' });
    });

    doc.setLineWidth(0.3);
    doc.setDrawColor(255, 255, 255);
    doc.line(summaryX + 5, afterTable + 38, summaryX + 67, afterTable + 38);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('GRAND TOTAL:', summaryX + 5, afterTable + 45);
    doc.text(`Rs.${Math.round(totalCost * 1.18).toLocaleString('en-IN')}`, summaryX + 67, afterTable + 45, { align: 'right' });

    // ── Terms ──
    const termsY = afterTable + 52;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(42, 125, 212);
    doc.text('TERMS & CONDITIONS', 14, termsY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    const terms = [
      '1. This quotation is valid for 15 days from the date of issue.',
      '2. 50% advance payment required to confirm the booking.',
      '3. GST @18% applicable on all services.',
      '4. Prices may vary based on seasonal availability of ingredients.',
      '5. Cancellations within 7 days of the event are non-refundable.',
    ];
    terms.forEach((t, i) => doc.text(t, 14, termsY + 6 + i * 5));

    // ── Footer ──
    const footerY = doc.internal.pageSize.getHeight() - 12;
    doc.setFillColor(42, 125, 212);
    doc.rect(0, footerY - 4, pageW, 20, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(200, 230, 255);
    doc.text(`© ${new Date().getFullYear()} Planify Event Management. All rights reserved.`, pageW / 2, footerY + 3, { align: 'center' });
    doc.text('This is a computer-generated quotation and is valid without a signature.', pageW / 2, footerY + 8, { align: 'center' });

    // ── Share PDF as actual file via Web Share API, fallback to WhatsApp text ──
    const fileName = `Planify_Catering_Quote_${quoteNo}.pdf`;
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    const waText = `🍽️ *Planify Catering Quotation*

*Quote No:* ${quoteNo}
*Date:* ${date}
*No. of Persons:* ${guestCount.toLocaleString('en-IN')}
*Total Items:* ${allSelected.length}
*Rate/Plate:* ₹${pricePerPlate}
*Subtotal:* ₹${totalCost.toLocaleString('en-IN')}
*GST (18%):* ₹${Math.round(totalCost * 0.18).toLocaleString('en-IN')}
*Grand Total:* ₹${Math.round(totalCost * 1.18).toLocaleString('en-IN')}

_Detailed PDF attached. Authorised by Planify Event Management._`;

    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      // Mobile: share the actual PDF file
      navigator.share({
        title: `Planify Catering Quotation - ${quoteNo}`,
        text: waText,
        files: [pdfFile],
      }).catch(() => {
        // User cancelled or error, still download
        doc.save(fileName);
      });
    } else {
      // Desktop: download PDF and open WhatsApp with text
      doc.save(fileName);
      window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: bg, color: text }}>

      {/* Header */}
      <div
        className="px-4 py-3 flex justify-between items-center z-20"
        style={{
          background: isDark ? 'rgba(26,16,37,0.95)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${border}`,
        }}
      >
        <div>
          <h1 className="text-lg font-black flex items-center gap-2" style={{ color: text }}>
            <Utensils className="w-5 h-5" style={{ color: purple }} />
            Plate Architect
          </h1>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: textMuted }}>Gastronomy Planner</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide" style={{ color: textMuted }}>Total</p>
          <p className="text-xl font-black" style={{ color: text }}>₹{totalCost.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-3 px-4 py-2.5" style={{ borderBottom: `1px solid ${border}`, background: muted }}>
        {[
          { label: 'Guests', value: guestCount },
          { label: 'Dishes', value: totalSelected },
          { label: '/ Plate', value: `₹${pricePerPlate}` },
        ].map((stat, i) => (
          <div key={i} className="flex-1 text-center">
            <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: textMuted }}>{stat.label}</p>
            <p className="text-sm font-black" style={{ color: text }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">

        {/* Plate Preview (collapsible on mobile) */}
        <div style={{ borderBottom: `1px solid ${border}` }}>
          <button
            onClick={() => setShowPlate(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3"
            style={{ color: text }}
          >
            <span className="text-sm font-bold">🍽️ Plate Preview</span>
            {showPlate ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showPlate && (
            <div className="flex items-center justify-center gap-6 px-4 pb-5" style={{ background: isDark ? '#1a1025' : '#faf8ff' }}>
              {/* Plate */}
              <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex-shrink-0">
                <img loading="lazy" src={plateImg} alt="Plate" className="w-full h-full object-contain drop-shadow-xl" />
                <div className="absolute inset-0">
                  {selectedItems.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-[10px] text-center italic px-4" style={{ color: textMuted }}>Select dishes to<br/>populate</p>
                    </div>
                  )}
                  <div className="relative w-full h-full">
                    {selectedItems.map((item, index) => {
                      const angle = (index / selectedItems.length) * 2 * Math.PI;
                      const radius = 55;
                      const x = Math.cos(angle) * radius;
                      const y = Math.sin(angle) * radius;
                      return (
                        <div
                          key={item.id}
                          className="absolute transition-all duration-500"
                          style={{ left: `calc(50% + ${x}px - 24px)`, top: `calc(50% + ${y}px - 24px)` }}
                        >
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full overflow-hidden shadow-md border-2 border-white">
                              <img loading="lazy" src={item.imgUrl} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white" style={{ background: purple }}>
                              {item.quantity}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Drinks */}
              {selectedDrinks.length > 0 && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: textMuted }}>Drinks</p>
                  {selectedDrinks.map(drink => (
                    <div key={drink.id} className="flex flex-col items-center gap-1 animate-in fade-in zoom-in-75">
                      <div className="w-14 h-20 rounded-xl overflow-hidden shadow-md">
                        <img loading="lazy" src={drink.imgUrl} alt={drink.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: purple, color: '#fff' }}>×{drink.quantity}</span>
                      <p className="text-[9px] text-center font-medium max-w-16" style={{ color: textMuted }}>{drink.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Guest Count */}
        <div className="px-4 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: purple }} />
              <span className="text-sm font-bold" style={{ color: text }}>Guest Count</span>
            </div>
            <span className="text-2xl font-black" style={{ color: text }}>{guestCount}</span>
          </div>
          <input
            type="range"
            min="50"
            max="2000"
            step="50"
            value={guestCount}
            onChange={e => setGuestCount(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: purple, background: `linear-gradient(to right, ${purple} ${(guestCount - 50) / 1950 * 100}%, ${isDark ? 'rgba(192,156,222,0.2)' : 'rgba(138,79,196,0.2)'} 0%)` }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px]" style={{ color: textMuted }}>50</span>
            <span className="text-[10px]" style={{ color: textMuted }}>2,000</span>
          </div>
        </div>

        {/* Menu Items */}
        <div className="px-4 py-4 space-y-5">
          {(['Starters', 'Main Course', 'Breads', 'Desserts', 'Hot Beverages', 'Cold Drinks & Juices'] as const).map(category => {
            const catItems = items.filter(i => i.category === category);
            if (!catItems.length) return null;
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{CATEGORY_EMOJIS[category]}</span>
                  <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: text }}>{category}</h3>
                  <div className="flex-1 h-px" style={{ background: border }} />
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {catItems.map(item => (
                    <div
                      key={item.id}
                      className="rounded-2xl p-2.5 transition-all"
                      style={{
                        background: item.quantity > 0 ? (isDark ? '#2d1e45' : '#f5f0fb') : card,
                        border: `1px solid ${item.quantity > 0 ? purple + '66' : border}`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <img loading="lazy" src={item.imgUrl} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt={item.name} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold leading-tight line-clamp-2" style={{ color: text }}>{item.name}</p>
                          <p className="text-[10px] mt-0.5 font-semibold" style={{ color: purple }}>₹{item.pricePerPlate}/plate</p>
                        </div>
                      </div>
                      <div
                        className="flex items-center justify-between rounded-full px-1 py-1"
                        style={{ background: isDark ? '#1a1025' : '#e8f3ff', border: `1px solid ${border}` }}
                      >
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={item.quantity === 0}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-25"
                          style={{ color: text }}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-black" style={{ color: text }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
                          style={{ background: purple, color: '#fff' }}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Footer CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-4 z-20"
        style={{
          background: isDark ? 'rgba(26,16,37,0.97)' : 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(12px)',
          borderTop: `1px solid ${border}`,
        }}
      >
        <button
          onClick={generateAndSharePDF}
          disabled={allSelected.length === 0}
          className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-lg disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${purple}, ${isDark ? '#a07ac8' : '#5aa0e0'})`, color: '#fff' }}
        >
          <Download className="w-4 h-4" />
          Export PDF & Share on WhatsApp
          <Share2 className="w-4 h-4" />
        </button>
        <p className="mt-2 text-center flex items-center justify-center gap-1 text-[10px]" style={{ color: textMuted }}>
          <Info className="w-3 h-3" /> Taxes & service charges applied at checkout
        </p>
      </div>
    </div>
  );
}
