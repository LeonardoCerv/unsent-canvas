'use client';

import { useCanvas } from '@/contexts/CanvasContext';

export default function ConnectionStatus() {
  const { state } = useCanvas();
  const { connectionStatus, users } = state;
  
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
    <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 z-50">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="text-sm font-medium text-gray-700">
          {getStatusText()}
        </span>
      </div>
      
      {connectionStatus === 'connected' && (
        <div className="mt-2 text-xs text-gray-500">
          {users.size} active users
        </div>
      )}
    </div>
  );
}
