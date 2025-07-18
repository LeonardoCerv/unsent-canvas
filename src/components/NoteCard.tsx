'use client';

import { Note } from '@/types/note';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  scale: number;
  isPreview?: boolean;
}

export default function NoteCard({ note, onClick, scale, isPreview = false }: NoteCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(note);
  };

  return (
    <div
      className="relative cursor-pointer group"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: '32px', // Ensure full width coverage
        height: 'auto', // Auto height based on content
        minHeight: '32px', // Minimum height for consistent click area
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Note to ${note.sent_to}: ${note.message.substring(0, 50)}${note.message.length > 50 ? '...' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
    >
      <div
        className="relative w-full p-0.5 shadow-sm border-0 transition-all duration-500 hover:shadow-md group-hover:scale-101"
        style={{
          backgroundColor: note.color || '#fff3a0',
          fontFamily: 'Comic Sans MS, cursive, sans-serif',
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
          fontSize: '6px',
          minHeight: '31px', // Match the minimum height
        }}
      >
        {/* To: label */}
        <div className="text-gray-600 font-normal leading-none whitespace-nowrap overflow-hidden text-ellipsis mb-0.5" style={{ fontSize: '4px' }}>
          To: {note.sent_to}
        </div>
        
        {/* Message content */}
        <div className="text-gray-800 leading-tight font-normal break-words" style={{ fontSize: '3px', lineHeight: '1.2' }}>
          {note.message.length > 150 ? `${note.message.substring(0, 150)}...` : note.message}
        </div>
      </div>
    </div>
  );
}
