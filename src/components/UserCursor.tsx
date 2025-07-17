'use client';

interface UserCursorProps {
  userId: string;
  x: number;
  y: number;
  color: string;
  lastUpdate: number;
}

export default function UserCursor({ x, y, color }: UserCursorProps) {
  // Cursors are always visible - no auto-hide functionality
  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      {/* Small cursor arrow - no label */}
      <div
        className="relative"
        style={{
          width: '8px',
          height: '8px',
          transform: 'translate(-1px, -1px)',
        }}
      >
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 0L8 3L5 4L3 8L0 0Z"
            fill={color}
            stroke="white"
            strokeWidth="0.5"
          />
        </svg>
      </div>
    </div>
  );
}
