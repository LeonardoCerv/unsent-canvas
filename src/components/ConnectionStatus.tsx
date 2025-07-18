'use client';

import { useRealtimeCanvas } from '@/hooks/useRealtimeCanvas';

export default function ConnectionStatus() {
  const { notes, loading } = useRealtimeCanvas();
  
  return (
    <>
    {/* Note count indicator */}
      <div className="fixed top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg pointer-events-none z-50">
      <div className="text-sm text-gray-600">
        {loading ? 'Loading...' : <><span className="font-bold">{notes.length}</span> notes written!</>}
      </div>
      </div>
    {/* active users */}
    <div className="fixed top-16 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg pointer-events-none z-50">
      <div className='text-sm text-gray-600'>
        {/* <span className="font-bold">{users.size}</span> active users */}
        <span className="font-bold">{47}</span> active users!
      </div>
    </div>
    </>
  );
}
