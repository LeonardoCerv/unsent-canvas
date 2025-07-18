'use client';

import { useEffect, useState } from 'react';

interface CanvasAnnouncerProps {
  totalNotes: number;
  visibleNotes: number;
  isLoading: boolean;
  currentPosition: { x: number; y: number };
  zoom: number;
}

export default function CanvasAnnouncer({ 
  totalNotes, 
  visibleNotes, 
  isLoading, 
  currentPosition, 
  zoom 
}: CanvasAnnouncerProps) {
  const [announcement, setAnnouncement] = useState('');
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [lastZoom, setLastZoom] = useState(zoom);

  useEffect(() => {
    if (isLoading) {
      setAnnouncement('Loading canvas content...');
      return;
    }

    // Announce major position changes
    const positionDiff = Math.abs(currentPosition.x - lastPosition.x) + Math.abs(currentPosition.y - lastPosition.y);
    if (positionDiff > 100) {
      setAnnouncement(`Moved to position ${Math.floor(currentPosition.x)}, ${Math.floor(currentPosition.y)}`);
      setLastPosition(currentPosition);
    }

    // Announce zoom changes
    const zoomDiff = Math.abs(zoom - lastZoom);
    if (zoomDiff > 0.2) {
      setAnnouncement(`Zoom level changed to ${Math.round(zoom * 100)}%`);
      setLastZoom(zoom);
    }
  }, [currentPosition, zoom, isLoading, lastPosition, lastZoom]);

  useEffect(() => {
    setAnnouncement(`Canvas loaded with ${totalNotes} notes. ${visibleNotes} currently visible.`);
  }, [totalNotes, visibleNotes]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
