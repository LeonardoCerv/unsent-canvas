'use client';

import { useCallback } from 'react';
import { CreateNoteData } from '@/types/note';
import { useCanvas } from '@/contexts/CanvasContext';
import { useRealtimeNotes } from '@/contexts/RealtimeContext';
import { 
  checkCooldown, 
  recordPostTime, 
  checkRateLimit,
} from '@/lib/clientCooldown';

export function useRealtimeCanvas() {
  const { dispatch } = useCanvas();
  const { notes, loading, connected } = useRealtimeNotes();
  
  // Send note function
  const sendNote = useCallback(async (data: CreateNoteData) => {
    try {
      // Check cooldown
      const cooldownCheck = checkCooldown({ cooldownMinutes: 2, maxPostsPerHour: 30 });
      const rateLimitCheck = checkRateLimit({ cooldownMinutes: 2, maxPostsPerHour: 30 });
      
      if (cooldownCheck.inCooldown || rateLimitCheck.exceeded) {
        throw new Error('Please wait before sending another note');
      }
      
      // Create note
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create note');
      }

      const newNote = await response.json();
      
      // Set cooldown
      recordPostTime({ cooldownMinutes: 2, maxPostsPerHour: 30 });
      const cooldownEnd = Date.now() + (2 * 60 * 1000);
      dispatch({
        type: 'SET_COOLDOWN',
        payload: { endTime: cooldownEnd },
      });
      
      return newNote;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }, [dispatch]);
  
  return {
    notes,
    loading,
    connectionStatus: connected ? 'connected' : 'disconnected',
    sendNote,
  };
}