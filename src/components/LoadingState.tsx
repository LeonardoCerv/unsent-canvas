'use client';

import { useEffect, useState } from 'react';

interface LoadingStateProps {
  isLoading: boolean;
  text?: string;
  showSpinner?: boolean;
  className?: string;
}

export default function LoadingState({ 
  isLoading, 
  text = 'Loading...', 
  showSpinner = true, 
  className = '' 
}: LoadingStateProps) {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    
    return () => clearInterval(interval);
  }, [isLoading]);
  
  if (!isLoading) return null;
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {showSpinner && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-green-500 mr-2" />
      )}
      <span className="text-sm text-gray-600">
        {text}{dots}
      </span>
    </div>
  );
}
