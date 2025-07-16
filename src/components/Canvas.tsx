'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Note } from '@/types/note';
import NoteCard from './NoteCard';

interface CanvasProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onCanvasClick: (x: number, y: number) => void;
  loading?: boolean;
}

interface ViewState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export default function Canvas({ notes, onNoteClick, onCanvasClick, loading = false }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = useState<ViewState>({ zoom: 0.6, offsetX: 200, offsetY: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [mouseWorldPos, setMouseWorldPos] = useState({ x: 0, y: 0 });

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;
  const GRID_SIZE = 5; // Size of each grid square in screen pixels

  // Screen to world coordinates (convert pixels to grid units)
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    // Convert screen pixels to world pixels, then to grid units
    const worldPixelX = ((screenX - rect.left) / viewState.zoom) - viewState.offsetX;
    const worldPixelY = ((screenY - rect.top) / viewState.zoom) - viewState.offsetY;
    
    // Convert to grid units (each grid square = 1 unit)
    const x = worldPixelX / GRID_SIZE;
    const y = worldPixelY / GRID_SIZE;
    
    return { x, y };
  }, [viewState]);

  // World to screen coordinates (convert grid units to pixels)
  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    // Convert grid units to world pixels
    const worldPixelX = worldX * GRID_SIZE;
    const worldPixelY = worldY * GRID_SIZE;
    
    // Convert to screen pixels
    const x = (worldPixelX + viewState.offsetX) * viewState.zoom;
    const y = (worldPixelY + viewState.offsetY) * viewState.zoom;
    return { x, y };
  }, [viewState]);

  // Check if a click hits a note (for canvas background clicks)
  const isClickOnNote = useCallback((worldX: number, worldY: number) => {
    const noteSize = 24 / GRID_SIZE; // Convert note size to grid units (24px / 5px = 4.8 units)
    
    return notes.some(note => {
      // Compare in grid units
      return worldX >= note.x && worldX <= note.x + noteSize &&
             worldY >= note.y && worldY <= note.y + noteSize;
    });
  }, [notes]);

  // Draw canvas (now only for loading indicator)
  const draw = useCallback(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
    
  // Draw loading indicator
  if (loading) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Loading...', canvas.width / 2, canvas.height / 2);
    ctx.textAlign = 'left';
  }
  }, [loading]);

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Always update mouse world position for the position indicator
    const worldPos = screenToWorld(e.clientX, e.clientY);
    setMouseWorldPos(worldPos);
    
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastPanPoint.x;
    const deltaY = e.clientY - lastPanPoint.y;
    
    setViewState(prev => ({
      ...prev,
      offsetX: prev.offsetX + deltaX / prev.zoom,
      offsetY: prev.offsetY + deltaY / prev.zoom
    }));
    
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  }, [isDragging, lastPanPoint, screenToWorld]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Check if it was a click (not a drag)
    const dragDistance = Math.sqrt(
      Math.pow(e.clientX - dragStart.x, 2) + Math.pow(e.clientY - dragStart.y, 2)
    );
    
    if (dragDistance < 5) {
      // Check if clicked on canvas background (notes handle their own clicks now)
      const worldPos = screenToWorld(e.clientX, e.clientY);
      
      if (!isClickOnNote(worldPos.x, worldPos.y)) {
        // Snap to grid for clean placement
        const snappedX = Math.round(worldPos.x);
        const snappedY = Math.round(worldPos.y);
        onCanvasClick(snappedX, snappedY);
      }
    }
  }, [isDragging, dragStart, screenToWorld, isClickOnNote, onCanvasClick]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(viewState.zoom * zoomFactor, MIN_ZOOM), MAX_ZOOM);
    
    if (newZoom !== viewState.zoom) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      
      setViewState(prev => {
        const newOffsetX = mouseX / newZoom - worldPos.x;
        const newOffsetY = mouseY / newZoom - worldPos.y;
        
        return {
          zoom: newZoom,
          offsetX: newOffsetX,
          offsetY: newOffsetY
        };
      });
    }
  }, [viewState, screenToWorld]);

  // Initialize canvas size
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [draw]);

  // Redraw when state changes
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-gray-50 overflow-hidden cursor-grab active:cursor-grabbing relative"
      style={{ touchAction: 'none' }}
    >
      {/* CSS Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #d1d5db 1px, transparent 1px),
            linear-gradient(to bottom, #d1d5db 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
          transform: `translate(${(viewState.offsetX * viewState.zoom) % GRID_SIZE}px, ${(viewState.offsetY * viewState.zoom) % GRID_SIZE}px)`,
          opacity: 0.4,
        }}
      />
      
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDragging(false)}
        onWheel={handleWheel}
        className="block relative z-10"
        style={{ backgroundColor: 'transparent' }}
      />
      
      {/* Notes container */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {notes.map((note) => {
          const screenPos = worldToScreen(note.x, note.y);
          return (
            <div 
              key={note.id} 
              className="pointer-events-auto absolute"
              style={{
                left: `${screenPos.x}px`,
                top: `${screenPos.y}px`,
              }}
            >
              <NoteCard
                note={note}
                onClick={onNoteClick}
                scale={1}
                isPreview={true}
              />
            </div>
          );
        })}
      </div>
      
      {/* Position indicator */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg pointer-events-none z-50">
        <div className="text-sm text-gray-600">
          x: {Math.round(mouseWorldPos.x)}, y: {Math.round(mouseWorldPos.y)}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Grid: {Math.floor(mouseWorldPos.x)}, {Math.floor(mouseWorldPos.y)}
        </div>
      </div>

    </div>
  );
}
