import { useDrag } from 'react-dnd';
import { Flower2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface ResourceItem {
  id: string;
  name: string;
  price: number;
  category: 'Decor' | 'Infrastructure' | 'Lighting' | 'Stage Background';
  icon: any;
  image: string | any;
  isBackground?: boolean;
}

function DraggableResourceCard({ item }: { item: ResourceItem }) {
  const { isDark } = useTheme();
  const [{ isDragging }, drag] = useDrag({
    type: 'RESOURCE_ITEM',
    item: { id: item.id, name: item.name, price: item.price, category: item.category, image: item.image, isBackground: item.isBackground },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const card = isDark ? '#231534' : '#ddeeff';
  const border = isDark ? 'rgba(192,156,222,0.25)' : 'rgba(42,125,212,0.18)';
  const text = isDark ? '#f0e6ff' : '#0d2d52';

  return (
    <div
      ref={drag}
      className={`flex-shrink-0 w-24 sm:w-28 rounded-2xl overflow-hidden cursor-move touch-none transition-all ${
        isDragging ? 'opacity-40 scale-90' : 'hover:scale-105'
      }`}
      style={{ touchAction: 'none', background: card, border: `1px solid ${border}` }}
    >
      <div className="w-full h-16 sm:h-20 overflow-hidden flex items-center justify-center p-1" style={{ background: isDark ? '#2d1e45' : '#c8e4ff' }}>
        <img loading="lazy"
          src={item.image}
          alt={item.name}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/></svg>';
          }}
        />
      </div>
      <div className="p-1.5 text-center">
        <p className="text-[10px] font-semibold line-clamp-2 leading-tight" style={{ color: text }}>{item.name}</p>
        {item.price > 0 && (
          <p className="text-[10px] font-black mt-0.5" style={{ color: '#c09cde' }}>₹{item.price.toLocaleString('en-IN')}</p>
        )}
      </div>
    </div>
  );
}

export function ResourceRibbon() {
  const { isDark } = useTheme();
  const [dbResources, setDbResources] = useState<ResourceItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchResources = async () => {
      const { data } = await supabase.from('items').select('*').in('category', ['Decor', 'Infrastructure', 'Lighting', 'Stage Background']);
      if (data && data.length > 0) {
        setDbResources(data.map(d => ({
          id: d.id,
          name: d.name,
          price: d.base_price,
          category: d.category as ResourceItem['category'],
          icon: Flower2,
          image: d.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&h=400',
          isBackground: d.category === 'Stage Background'
        })));
      }
    };
    fetchResources();
  }, []);

  const categories = ['All', 'Stage Background', 'Decor', 'Infrastructure', 'Lighting'];
  const filteredResources = activeCategory === 'All'
    ? dbResources
    : dbResources.filter(r => r.category === activeCategory);

  const bg = isDark ? '#1a1025' : '#f0f7ff';
  const border = isDark ? 'rgba(192,156,222,0.2)' : 'rgba(42,125,212,0.18)';
  const text = isDark ? '#f0e6ff' : '#0d2d52';
  const purple = isDark ? '#c09cde' : '#2a7dd4';


  return (
    <div style={{ background: bg, borderTop: `1px solid ${border}` }}>
      {/* Category Tabs */}
      <div className="flex gap-1.5 px-3 pt-3 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all active:scale-95"
            style={{
              background: activeCategory === cat ? purple : (isDark ? '#2d1e45' : '#c8e4ff'),
              color: activeCategory === cat ? '#fff' : text,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Resource Cards */}
      <div className="p-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filteredResources.map(item => (
            <DraggableResourceCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
