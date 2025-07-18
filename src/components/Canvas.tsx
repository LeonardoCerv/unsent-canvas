'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Note } from '@/types/note';
import NoteCard from './NoteCard';
import UserCursor from './UserCursor';
import CooldownTimer from './CooldownTimer';
import ConnectionStatus from './ConnectionStatus';
import { useCanvas } from '@/contexts/CanvasContext';
import { RotateCcw } from 'lucide-react';

interface CanvasProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onCanvasClick: (x: number, y: number) => void;
  loading?: boolean;
  updateCursor?: (x: number, y: number) => void;
}

interface ViewState {
  zoom: number;
  offsetX: number;
  offsetY: number;
  browserZoom: number;
}

export default function Canvas({ notes, onNoteClick, onCanvasClick, loading = false, updateCursor }: CanvasProps) {
  const { state } = useCanvas();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scalableContentRef = useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = useState<ViewState>({ 
    zoom: 0.6, 
    offsetX: 200, 
    offsetY: 200,
    browserZoom: 1
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [mouseWorldPos, setMouseWorldPos] = useState({ x: 0, y: 0 });
  const [isNoteClicked, setIsNoteClicked] = useState(false);

  const [currentMousePos, setCurrentMousePos] = useState({ x: 0, y: 0 });

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;
  const MIN_BROWSER_ZOOM = 0.25;
  const MAX_BROWSER_ZOOM = 4;
  const GRID_SIZE = 5;
  const PAN_SPEED = 1.5; // Multiplier for scroll-based panning

  // Screen to world coordinates (accounting for browser zoom)
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const rect = scalableContentRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    const contentX = (screenX - rect.left) / viewState.browserZoom;
    const contentY = (screenY - rect.top) / viewState.browserZoom;
    
    const worldPixelX = (contentX / viewState.zoom) - viewState.offsetX;
    const worldPixelY = (contentY / viewState.zoom) - viewState.offsetY;
    
    const x = worldPixelX / GRID_SIZE;
    const y = worldPixelY / GRID_SIZE;
    
    return { x, y };
  }, [viewState]);

  // World to screen coordinates
  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    const worldPixelX = worldX * GRID_SIZE;
    const worldPixelY = worldY * GRID_SIZE;
    
    const x = (worldPixelX + viewState.offsetX) * viewState.zoom;
    const y = (worldPixelY + viewState.offsetY) * viewState.zoom;
    return { x, y };
  }, [viewState]);

  // Check if a click hits a note
  const isClickOnNote = useCallback((worldX: number, worldY: number) => {
    return isNoteClicked;
  }, [isNoteClicked]);

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
      
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

  // Zoom to center function (fallback for zoom buttons)
  const zoomToCenter = useCallback((zoomFactor: number) => {
    const rect = scalableContentRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.width / 2 / viewState.browserZoom;
    const centerY = rect.height / 2 / viewState.browserZoom;
    
    const newBrowserZoom = Math.min(Math.max(viewState.browserZoom * zoomFactor, MIN_BROWSER_ZOOM), MAX_BROWSER_ZOOM);
    
    if (newBrowserZoom !== viewState.browserZoom) {
      const zoomRatio = newBrowserZoom / viewState.browserZoom;
      
      // Keep the center point fixed during zoom
      const newOffsetX = viewState.offsetX + (centerX / viewState.zoom) * (1 - zoomRatio);
      const newOffsetY = viewState.offsetY + (centerY / viewState.zoom) * (1 - zoomRatio);
      
      setViewState(prev => ({
        ...prev,
        browserZoom: newBrowserZoom,
        offsetX: newOffsetX,
        offsetY: newOffsetY
      }));
    }
  }, [viewState]);

  // Zoom to cursor function (primary zoom method)
  const zoomToCursor = useCallback((zoomFactor: number, clientX?: number, clientY?: number) => {
    const rect = scalableContentRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Use provided coordinates or current mouse position
    const mouseX = clientX !== undefined ? 
      (clientX - rect.left) / viewState.browserZoom : 
      (currentMousePos.x - rect.left) / viewState.browserZoom;
    const mouseY = clientY !== undefined ? 
      (clientY - rect.top) / viewState.browserZoom : 
      (currentMousePos.y - rect.top) / viewState.browserZoom;
    
    const newBrowserZoom = Math.min(Math.max(viewState.browserZoom * zoomFactor, MIN_BROWSER_ZOOM), MAX_BROWSER_ZOOM);
    
    if (newBrowserZoom !== viewState.browserZoom) {
      const zoomRatio = newBrowserZoom / viewState.browserZoom;
      
      // Keep the mouse position fixed during zoom
      const newOffsetX = viewState.offsetX + (mouseX / viewState.zoom) * (1 - zoomRatio);
      const newOffsetY = viewState.offsetY + (mouseY / viewState.zoom) * (1 - zoomRatio);
      
      setViewState(prev => ({
        ...prev,
        browserZoom: newBrowserZoom,
        offsetX: newOffsetX,
        offsetY: newOffsetY
      }));
    }
  }, [viewState, currentMousePos]);

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    setMouseWorldPos(worldPos);
    setCurrentMousePos({ x: e.clientX, y: e.clientY });
    
    // Update cursor position for real-time tracking
    if (updateCursor && !isDragging) {
      updateCursor(worldPos.x, worldPos.y);
    }
    
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastPanPoint.x;
    const deltaY = e.clientY - lastPanPoint.y;
    
    setViewState(prev => ({
      ...prev,
      offsetX: prev.offsetX + deltaX / (prev.zoom * prev.browserZoom),
      offsetY: prev.offsetY + deltaY / (prev.zoom * prev.browserZoom)
    }));
    
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  }, [isDragging, lastPanPoint, screenToWorld, viewState.browserZoom, updateCursor]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const dragDistance = Math.sqrt(
      Math.pow(e.clientX - dragStart.x, 2) + Math.pow(e.clientY - dragStart.y, 2)
    );
    
    if (dragDistance < 5) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      
      if (!isClickOnNote(worldPos.x, worldPos.y)) {
        const snappedX = Math.round(worldPos.x);
        const snappedY = Math.round(worldPos.y);
        onCanvasClick(snappedX, snappedY);
      }
    }
  }, [isDragging, dragStart, screenToWorld, isClickOnNote, onCanvasClick]);

  // Enhanced wheel handler for both panning and zooming
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const rect = scalableContentRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Update current mouse position for cursor-based zoom
    setCurrentMousePos({ x: e.clientX, y: e.clientY });
    
    // Check for modifier keys to determine behavior
    const isZoom = e.ctrlKey || e.metaKey;
    const isHorizontalPan = e.shiftKey;
    
    if (isZoom) {
      // Zoom behavior - zoom to cursor position
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      zoomToCursor(zoomFactor, e.clientX, e.clientY);
    } else {
      // Panning behavior
      let deltaX = 0;
      let deltaY = 0;
      
      if (isHorizontalPan) {
        // Shift + scroll = horizontal pan
        deltaX = e.deltaY * PAN_SPEED;
      } else {
        // Normal scroll behavior
        deltaX = e.deltaX * PAN_SPEED;
        deltaY = e.deltaY * PAN_SPEED;
      }
      
      setViewState(prev => ({
        ...prev,
        offsetX: prev.offsetX - deltaX / (prev.zoom * prev.browserZoom),
        offsetY: prev.offsetY - deltaY / (prev.zoom * prev.browserZoom)
      }));
    }
  }, [zoomToCursor]);

  // Disable pinch-to-zoom (trackpad/touch) - do nothing on touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
    }
  }, []);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
    }
  }, []);
  const handleTouchEnd = useCallback(() => {}, []);

  // Keyboard shortcuts for browser zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey)) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          zoomToCenter(1.1);
        } else if (e.key === '-') {
          e.preventDefault();
          zoomToCenter(0.9);
        } else if (e.key === '0') {
          e.preventDefault();
          setViewState(prev => ({
            ...prev,
            browserZoom: 1,
            offsetX: 200,
            offsetY: 200
          }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomToCenter]);

  // Initialize canvas size
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = scalableContentRef.current;
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
      className="w-full h-full bg-gray-50 overflow-hidden relative"
    >
      {/* Scalable content container - only this scales with browser zoom */}
      <div 
        ref={scalableContentRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ 
          touchAction: 'none',
          transform: `scale(${viewState.browserZoom})`,
          transformOrigin: 'top left',
          width: `${100 / viewState.browserZoom}%`,
          height: `${100 / viewState.browserZoom}%`
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDragging(false)}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
                onMouseDown={() => setIsNoteClicked(true)}
                onMouseUp={() => setIsNoteClicked(false)}
                onMouseLeave={() => setIsNoteClicked(false)}
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
        
        {/* User Cursors */}
        <div className="absolute inset-0 pointer-events-none z-30">
          {Array.from(state.users.entries()).map(([userId, user]) => {
            const screenPos = worldToScreen(user.cursor.x, user.cursor.y);
            return (
              <UserCursor
                key={userId}
                userId={userId}
                x={screenPos.x}
                y={screenPos.y}
                color={user.color}
                lastUpdate={user.cursor.lastUpdate}
              />
            );
          })}
        </div>
      </div>
      
      {/* Fixed UI Elements - these don't scale with browser zoom */}
      {/* Cooldown Timer */}
      {state.cooldownEndTime && (
        <CooldownTimer
          endTime={state.cooldownEndTime}
          onComplete={() => {
            // Will be handled by the parent component
          }}
        />
      )}
      
      {/* Connection Status */}
      <ConnectionStatus />
      {/* Position indicator */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg pointer-events-none z-50">
        <div className="text-sm text-gray-600">
          x: {Math.floor(mouseWorldPos.x)}, y: {Math.floor(mouseWorldPos.y)}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg pointer-events-auto z-50">
        <div className="flex flex-col gap-1 p-2 w-fit">
          <button
            onClick={() => zoomToCenter(1.1)}
            className="p-1 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 font-bold"
            title="Zoom In (Ctrl/Cmd + Scroll Up)"
          >
            +
          </button>
          <div className="text-xs text-center text-gray-500 px-1">
            {Math.round(viewState.browserZoom * 100)}%
          </div>
          <button
            onClick={() => zoomToCenter(0.9)}
            className="p-1 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 font-bold"
            title="Zoom Out (Ctrl/Cmd + Scroll Down)"
          >
            -
          </button>
          <button
            onClick={() => setViewState(prev => ({
              ...prev,
              browserZoom: 1,
              offsetX: 200,
              offsetY: 200
            }))}
            className="flex pt-4 pb-2 text-center items-center justify-center rounded hover:bg-gray-100 text-gray-600 font-bold"
            title="Reset Zoom (Ctrl/Cmd + 0)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Commands & Hotkeys Sidebar */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg pointer-events-auto z-50 w-64">
        <div className="flex flex-col gap-2 p-3">
          <div className="font-semibold text-gray-700 mb-1">Commands & Hotkeys</div>
          <ul className="text-xs text-gray-600 space-y-1">
            <li><span className="font-medium">Pan:</span> Drag with mouse or scroll</li>
            <li><span className="font-medium">Zoom In/Out:</span> <kbd>Ctrl/Cmd</kbd> + <kbd>Scroll</kbd></li>
            <li><span className="font-medium">Reset Zoom:</span> <kbd>Ctrl/Cmd</kbd> + <kbd>0</kbd></li>
            <li><span className="font-medium">Add Note:</span> Click empty grid cell</li>
            <li><span className="font-medium">Select Note:</span> Click note card</li>
            <li><span className="font-medium">Horizontal Pan:</span> <kbd>Shift</kbd> + <kbd>Scroll</kbd></li>
          </ul>
        </div>
      </div>
    </div>
  );
}