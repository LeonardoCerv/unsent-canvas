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
      }}
      onClick={handleClick}
    >
      <div
        className="relative w-8 p-0.5 shadow-sm border-0 transition-all duration-200 hover:shadow-md group-hover:scale-125"
        style={{
          backgroundColor: note.color || '#fff3a0',
          fontFamily: 'Comic Sans MS, cursive, sans-serif',
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
          fontSize: '6px',
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
