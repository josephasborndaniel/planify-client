import { useRef, useState, useEffect } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { X, RotateCw, Maximize2, FlipHorizontal } from 'lucide-react';

interface DroppedItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string | any;
  x: number;
  y: number;
}

interface StageCanvasProps {
  droppedItems: DroppedItem[];
  onDrop: (item: any, position: { x: number; y: number }) => void;
  onRemoveItem: (id: string) => void;
  onMoveItem?: (id: string, x: number, y: number) => void;
  backgroundImage?: string;
  onSetBackground?: (imageUrl: string) => void;
}

function DraggableItem({ item, onRemove, onMove, canvasRef }: {
  item: DroppedItem;
  onRemove: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
}) {
  const [isSelected, setIsSelected] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  
  // Transformation States
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentX, setCurrentX] = useState(item.x);
  const [currentY, setCurrentY] = useState(item.y);

  const [{ isDragging }, drag] = useDrag({
    type: 'PLACED_ITEM',
    item: { ...item, isPlaced: true, x: currentX, y: currentY },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Touch handling for moving items
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const itemStartX = currentX;
    const itemStartY = currentY;
    let hasMoved = false;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!canvasRef.current) return;
      hasMoved = true;
      const moveTouch = moveEvent.touches[0];
      const deltaX = moveTouch.clientX - startX;
      const deltaY = moveTouch.clientY - startY;

      setCurrentX(itemStartX + deltaX);
      setCurrentY(itemStartY + deltaY);
    };

    const handleTouchEnd = () => {
      if (!hasMoved) {
        setIsSelected(!isSelected);
      } else {
        onMove(item.id, currentX, currentY);
      }
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  // Mouse handling for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const itemStartX = currentX;
    const itemStartY = currentY;
    let hasMoved = false;

    const onMouseMove = (moveEvent: MouseEvent) => {
      hasMoved = true;
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      setCurrentX(itemStartX + deltaX);
      setCurrentY(itemStartY + deltaY);
    };

    const onMouseUp = () => {
      if (!hasMoved) {
        setIsSelected(!isSelected);
      } else {
        onMove(item.id, currentX, currentY);
      }
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Seamless Rotation Logic (touch + mouse)
  const handleRotateStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startAngle = rotation;
    const startPos = 'touches' in e ? e.touches[0].clientX : e.clientX;

    const onMove = (moveEvent: TouchEvent | MouseEvent) => {
      const currentPos = moveEvent instanceof TouchEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const deltaX = currentPos - startPos;
      setRotation(startAngle + deltaX * 2);
    };

    const onEnd = () => {
      document.removeEventListener('mousemove', onMove as EventListener);
      document.removeEventListener('touchmove', onMove as EventListener);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchend', onEnd);
    };

    document.addEventListener('mousemove', onMove as EventListener);
    document.addEventListener('touchmove', onMove as EventListener, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
  };

  // Seamless Resize Logic (touch + mouse)
  const handleResizeStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startScale = scale;
    const startPos = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const onMove = (moveEvent: TouchEvent | MouseEvent) => {
      const currentPos = moveEvent instanceof TouchEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;
      const deltaY = startPos - currentPos;
      const newScale = Math.max(0.3, startScale + deltaY * 0.01);
      setScale(newScale);
    };

    const onEnd = () => {
      document.removeEventListener('mousemove', onMove as EventListener);
      document.removeEventListener('touchmove', onMove as EventListener);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchend', onEnd);
    };

    document.addEventListener('mousemove', onMove as EventListener);
    document.addEventListener('touchmove', onMove as EventListener, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
  };

  return (
    <div
      ref={itemRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`absolute cursor-move touch-none select-none transition-shadow ${
        isSelected ? 'z-50' : 'z-10'
      }`}
      style={{
        left: `${currentX}px`,
        top: `${currentY}px`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${isFlipped ? -scale : scale}, ${scale})`,
        width: 'clamp(80px, 25vw, 140px)',
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none',
      }}
    >
      {/* Control Handles */}
      {isSelected && !isDragging && (
        <>
          <div 
            onMouseDown={handleRotateStart}
            onTouchStart={handleRotateStart}
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing z-[70] touch-none"
            style={{ backgroundColor: '#ffffff', border: '2px solid #c09cde', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
          >
            <RotateCw className="w-4 h-4" style={{ color: '#c09cde' }} />
          </div>

          <div 
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
            onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setIsFlipped(!isFlipped); }}
            className="absolute top-1/2 -left-10 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer z-[70] active:scale-90 transition-transform"
            style={{ backgroundColor: '#ffffff', border: '2px solid #3b82f6', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', touchAction: 'none' }}
          >
            <FlipHorizontal className="w-4 h-4" style={{ color: '#3b82f6' }} />
          </div>

          <div 
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            className="absolute -bottom-4 -right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-nwse-resize z-[70] touch-none"
            style={{ backgroundColor: '#c09cde', border: '2px solid #ffffff', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}
          >
            <Maximize2 className="w-4 h-4" style={{ color: '#ffffff' }} />
          </div>
        </>
      )}

      {/* Image Display */}
      <div className="relative flex items-center justify-center">
        <img loading="lazy"
          src={item.image}
          alt={item.name}
          className={`w-full h-auto object-contain transition-all rounded-sm`}
          style={isSelected ? { outline: '2px solid #c09cde', outlineOffset: '2px' } : {}}
          draggable={false}
        />
      </div>

      {/* Item Label */}
      {isSelected && scale > 0.6 && (
        <div className="mt-2 p-1 text-center rounded" style={{ backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #c09cde', color: '#c09cde', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
          <div className="font-medium text-[10px] line-clamp-1">{item.name}</div>
          <div className="text-[10px] font-bold" style={{ color: '#c09cde' }}>₹{item.price}</div>
        </div>
      )}

      {/* Remove Button */}
      {isSelected && (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
          onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onRemove(item.id); }}
          className="absolute -top-3 -right-3 rounded-full p-1.5 transition-all z-[80] active:scale-90"
          style={{
            backgroundColor: '#ef4444',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(239,68,68,0.5)',
            border: '2px solid #fff',
            width: 26, height: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'none',
            cursor: 'pointer'
          }}
          title="Remove from canvas"
        >
          <X className="w-3 h-3" />
        </button>
      )}

    </div>
  );
}

export function StageCanvas({ droppedItems, onDrop, onRemoveItem, onMoveItem, backgroundImage, onSetBackground }: StageCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop({
    accept: ['RESOURCE_ITEM', 'PLACED_ITEM'],
    drop: (item: any, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current?.getBoundingClientRect();

      if (offset && canvasRect) {
        const x = offset.x - canvasRect.left;
        const y = offset.y - canvasRect.top;

        if (item.isBackground && onSetBackground) {
          onSetBackground(item.image);
        } else if (item.isPlaced && onMoveItem) {
          onMoveItem(item.id, x, y);
        } else {
          onDrop(item, { x, y });
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="text-xs sm:text-sm px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#c09cde', border: '1px solid #c09cde' }}>
        <span className="font-bold" style={{ color: '#c09cde' }}>Stage Area:</span> 10m × 10m
      </div>

      <div
        ref={(node) => {
          canvasRef.current = node;
          drop(node);
        }}
        className={`relative w-full aspect-[4/3] md:h-[650px] rounded-3xl transition-all overflow-hidden touch-none`}
        style={{ 
          maxWidth: '900px', 
          margin: '0 auto', 
          touchAction: 'none',
          backgroundColor: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          outline: isOver ? '4px solid #c09cde' : '1px solid #c09cde'
        }}
      >
        {backgroundImage ? (
          <img
            loading="lazy"
            src={backgroundImage}
            alt="background"
            className="absolute inset-0 pointer-events-none"
            style={{
              width: '100%', height: '100%',
              objectFit: 'fill', objectPosition: 'center',
              zIndex: 0, display: 'block'
            }}
          />

        ) : (
          <div className="absolute inset-0 opacity-10 bg-grid-pattern" style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'30\' height=\'30\' viewBox=\'0 0 30 30\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'1.5\' cy=\'1.5\' r=\'1.5\' fill=\'%23c09cde\'/%3E%3C/svg%3E")',
            backgroundSize: '30px 30px' 
          }} />
        )}

        <div className="absolute inset-0" style={{ zIndex: 2 }}>
          {droppedItems.map((item) => (
            <DraggableItem
              key={item.id}
              item={item}
              onRemove={onRemoveItem}
              onMove={onMoveItem!}
              canvasRef={canvasRef}
            />
          ))}

          {droppedItems.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ color: '#c09cde' }}>
              <div className="text-center">
                <Maximize2 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-lg font-light">Stage is empty</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
