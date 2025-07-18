'use client';

import { useCanvas } from '@/contexts/CanvasContext';
import { useRealtimeCanvas } from '@/hooks/useRealtimeCanvas';

export default function ConnectionStatus() {
  const { state } = useCanvas();
  const { connectionStatus, users } = state;
  const { notes, loading, sendNote, updateCursor, userId } = useRealtimeCanvas();
  
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <>
    <div className="fixed top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 z-50">
      <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-sm font-medium text-gray-700">
        {getStatusText()}
      </span>
      </div>
    </div>
    {/* Note count indicator */}
      <div className="fixed top-28 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg pointer-events-none z-50">
      <div className="text-sm text-gray-600">
        {loading ? 'Loading...' : <><span className="font-bold">{notes.length}</span> notes written!</>}
      </div>
      </div>
    {connectionStatus === 'connected' && (
      <div className="fixed top-16 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg pointer-events-none z-50">
      <div className='text-sm text-gray-600'>
        <span className="font-bold">{users.size}</span> active users
      </div>
      </div>
    )}
    </>
  );
}
