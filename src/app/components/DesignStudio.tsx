import { useState, useRef } from 'react';
import { ResourceRibbon } from './ResourceRibbon';
import { StageCanvas } from './StageCanvas';
import { IndianRupee, Share2, Loader2, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { buildWhatsAppLink, saveDesignToSupabase } from '../../lib/whatsapp';
import html2canvas from 'html2canvas';

interface DroppedItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string | any;
  x: number;
  y: number;
}

interface DesignStudioProps {
  initialPackage?: string | null;
  eventType?: string | null;
}

export function DesignStudio({ initialPackage, eventType }: DesignStudioProps) {
  const { isDark } = useTheme();
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [sharing, setSharing] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const bg = isDark ? '#1a1025' : '#f0f7ff';
  const card = isDark ? '#231534' : '#ddeeff';
  const border = isDark ? 'rgba(192,156,222,0.2)' : 'rgba(42,125,212,0.18)';
  const text = isDark ? '#f0e6ff' : '#0d2d52';
  const textMuted = isDark ? 'rgba(240,230,255,0.6)' : '#3a6898';
  const purple = isDark ? '#c09cde' : '#2a7dd4';

  const handleDrop = (item: any, position: { x: number; y: number }) => {
    const newItem: DroppedItem = {
      id: `${item.id}-${Date.now()}`,
      name: item.name,
      price: item.price,
      category: item.category,
      image: item.image,
      x: position.x,
      y: position.y,
    };
    setDroppedItems([...droppedItems, newItem]);
    setTotalCost(totalCost + item.price);
  };

  const removeItem = (id: string) => {
    const item = droppedItems.find(i => i.id === id);
    if (item) {
      setDroppedItems(droppedItems.filter(i => i.id !== id));
      setTotalCost(totalCost - item.price);
    }
  };

  const moveItem = (id: string, x: number, y: number) => {
    setDroppedItems(droppedItems.map(item =>
      item.id === id ? { ...item, x, y } : item
    ));
  };

  // ── Feature 7: WhatsApp Share ──────────────────────────────────
  const handleWhatsAppShare = async () => {
    if (!droppedItems.length) return;
    setSharing(true);

    try {
      const itemList = droppedItems.map(i => ({ name: i.name, quantity: 1 }));
      const canvasState = { items: droppedItems, background: backgroundImage };

      // Save to Supabase and get shareable ID
      let designId = '';
      try {
        designId = await saveDesignToSupabase(
          eventType ?? 'Event',
          canvasState,
          itemList,
        );
      } catch (e) {
        console.error("Supabase save failed", e);
      }

      let textMessage = `Hi, here is my custom stage design!\n\n*Event:* ${eventType ?? 'Event'}\n*Total Cost:* ₹${totalCost.toLocaleString('en-IN')}\n\n*Items Included:*\n${itemList.map(i => `- ${i.name}`).join('\n')}`;
      if (designId) {
        textMessage += `\n\nDesign ID: ${designId}`;
      }

      // Capture screenshot as JPEG
      let imageFile: File | null = null;
      if (stageRef.current) {
        try {
          const canvas = await html2canvas(stageRef.current, { 
            useCORS: true, 
            backgroundColor: isDark ? '#1a1025' : '#f0f7ff',
            scale: 3 // Dramatically improves image resolution
          });
          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 1.0));
          if (blob) {
            imageFile = new File([blob], 'stage-design.jpg', { type: 'image/jpeg' });
          }
        } catch (captureErr: any) {
          console.error("Screenshot capture failed:", captureErr);
          alert("Failed to capture image: " + (captureErr?.message || captureErr));
          return;
        }
      }

      if (!imageFile) return;

      // Try Web Share API (Mobile native sharing tray) - ONLY works on HTTPS or localhost!
      if (navigator.canShare && navigator.canShare({ files: [imageFile], text: textMessage })) {
        try { await navigator.clipboard.writeText(textMessage); } catch (e) {} // Backup clipboard
        
        await navigator.share({
          title: 'My Stage Design',
          text: textMessage,
          files: [imageFile],
        });
      } else if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        try { await navigator.clipboard.writeText(textMessage); } catch (e) {} // Backup clipboard
        await navigator.share({ files: [imageFile] });
      } else {
        // Fallback if Web Share API is blocked (e.g., testing on local IP like http://192.168... instead of HTTPS)
        const url = URL.createObjectURL(imageFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'planify-stage-design.jpg';
        a.click();
        URL.revokeObjectURL(url);
        
        // Also open WhatsApp web fallback for the text
        const finalLink = `https://wa.me/?text=${encodeURIComponent(textMessage)}`;
        window.open(finalLink, '_blank');
        
        alert("📸 Image Downloaded!\n\nYour browser blocked the native share tray. The image has been downloaded instead, and WhatsApp is opening in a new tab with your text details. Please attach the downloaded image to the chat manually!");
      }
    } catch (err) {
      console.error("Sharing failed:", err);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: bg, color: text }}>
      {/* Header */}
      <div
        className="px-4 py-3 sticky top-0 z-10"
        style={{
          background: isDark ? 'rgba(26,16,37,0.9)' : 'rgba(240,247,255,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${border}`,
        }}
      >
        <h1 className="text-lg font-black tracking-tight" style={{ color: text }}>Design Studio</h1>
        <p className="text-xs mt-0.5" style={{ color: textMuted }}>Drag items to build your stage layout</p>
      </div>

      {/* Top-right buttons */}
      <div className="fixed top-14 right-3 z-20 flex flex-col gap-2">
        {/* Total Cost Badge */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-full text-sm shadow-lg"
          style={{ background: card, border: `1px solid ${border}`, color: text }}
        >
          <IndianRupee className="w-4 h-4" style={{ color: purple }} />
          <div>
            <div className="text-[10px] hidden sm:block" style={{ color: textMuted }}>Total</div>
            <div className="font-black text-sm">₹{totalCost.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* WhatsApp Share */}
        <button
          onClick={handleWhatsAppShare}
          disabled={sharing || droppedItems.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-40"
          style={{ background: '#25d366', color: '#fff' }}
          title="Share via WhatsApp"
        >
          {sharing
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Share2 className="w-4 h-4" />
          }
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Clear Background */}
        {backgroundImage && (
          <button
            onClick={() => setBackgroundImage('')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold shadow-lg transition-all active:scale-95 bg-red-500 text-white"
            title="Remove Background"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Clear Bg</span>
          </button>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto p-2 sm:p-4" ref={stageRef}>
        <StageCanvas
          droppedItems={droppedItems}
          onDrop={handleDrop}
          onRemoveItem={removeItem}
          onMoveItem={moveItem}
          backgroundImage={backgroundImage}
          onSetBackground={setBackgroundImage}
        />
      </div>

      {/* Resource Ribbon */}
      <ResourceRibbon />
    </div>
  );
}
