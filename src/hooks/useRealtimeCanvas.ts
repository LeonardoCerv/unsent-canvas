'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Note, CreateNoteData } from '@/types/note';
import { createNote, getNotes } from '@/lib/database';
import { useCanvas } from '@/contexts/CanvasContext';
import { 
  checkCooldown, 
  recordPostTime, 
  checkRateLimit, 
  getCooldownStatus,
  subscribeToCooldownChanges
} from '@/lib/clientCooldown';

// Generate random user ID and color
const generateUserId = () => Math.random().toString(36).substring(2, 15);
const generateUserColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#FFB6C1', '#87CEEB', '#F0E68C', '#FA8072'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

interface UseRealtimeCanvasOptions {
  cooldownMinutes?: number;
}

// Get cooldown duration from environment variable
const getCooldownMinutes = (): number => {
  const envValue = process.env.NEXT_PUBLIC_COOLDOWN_MINUTES;
  const parsedValue = envValue ? parseInt(envValue, 10) : 2;
  return isNaN(parsedValue) || parsedValue < 1 ? 2 : parsedValue;
};

export function useRealtimeCanvas(options: UseRealtimeCanvasOptions = {}) {
  const { cooldownMinutes = getCooldownMinutes() } = options;
  const { dispatch } = useCanvas();
  const userIdRef = useRef<string>(generateUserId());
  const userColorRef = useRef<string>(generateUserColor());
  const lastCursorUpdate = useRef<number>(0);
  const notesRef = useRef<Note[]>([]);
  const loadingRef = useRef<boolean>(true);
  
  // Initialize connection and load notes
  useEffect(() => {
    const initializeConnection = async () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });
      
      try {
        // Load initial notes
        const initialNotes = await getNotes();
        notesRef.current = initialNotes;
        loadingRef.current = false;
        
        // Register this user
        dispatch({
          type: 'USER_CONNECTED',
          payload: {
            userId: userIdRef.current,
            color: userColorRef.current,
          },
        });
        
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
      } catch (error) {
        console.error('Failed to initialize connection:', error);
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
      }
    };
    
    initializeConnection();
  }, [dispatch]);
  
  // Set up real-time subscriptions
  useEffect(() => {
    const notesChannel = supabase
      .channel('notes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notes' },
        (payload) => {
          const newNote = payload.new as Note;
          // Only add if not already in local state (prevent duplicates)
          if (!notesRef.current.some(note => note.id === newNote.id)) {
            notesRef.current = [newNote, ...notesRef.current];
          }
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notes' },
        (payload) => {
          const deletedNote = payload.old as Note;
          notesRef.current = notesRef.current.filter(note => note.id !== deletedNote.id);
        }
      )
      .subscribe();
    
    // Cursor tracking channel
    const cursorsChannel = supabase
      .channel('cursors')
      .on('broadcast', { event: 'cursor_move' }, (payload) => {
        const { userId, x, y } = payload.payload;
        if (userId !== userIdRef.current) {
          dispatch({
            type: 'UPDATE_USER_CURSOR',
            payload: { userId, x, y },
          });
        }
      })
      .on('broadcast', { event: 'user_join' }, (payload) => {
        const { userId, color } = payload.payload;
        if (userId !== userIdRef.current) {
          dispatch({
            type: 'USER_CONNECTED',
            payload: { userId, color },
          });
        }
      })
      .on('broadcast', { event: 'user_leave' }, (payload) => {
        const { userId } = payload.payload;
        if (userId !== userIdRef.current) {
          dispatch({
            type: 'USER_DISCONNECTED',
            payload: { userId },
          });
        }
      })
      .subscribe();
    
    // Announce user join
    cursorsChannel.send({
      type: 'broadcast',
      event: 'user_join',
      payload: {
        userId: userIdRef.current,
        color: userColorRef.current,
      },
    });
    
    // Cleanup on unmount
    return () => {
      const userId = userIdRef.current;
      cursorsChannel.send({
        type: 'broadcast',
        event: 'user_leave',
        payload: { userId },
      });
      
      supabase.removeChannel(notesChannel);
      supabase.removeChannel(cursorsChannel);
    };
  }, [dispatch]);
  
  // Cursor tracking with throttling
  const updateCursor = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - lastCursorUpdate.current > 50) { // Throttle to 20fps
      lastCursorUpdate.current = now;
      
      const channel = supabase.channel('cursors');
      channel.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload: {
          userId: userIdRef.current,
          x,
          y,
        },
      });
    }
  }, []);
  
  // Check cooldown status using client-side logic
  const checkCooldownStatus = useCallback((): boolean => {
    const cooldownCheck = checkCooldown({ cooldownMinutes, maxPostsPerHour: 30 });
    const rateLimitCheck = checkRateLimit({ cooldownMinutes, maxPostsPerHour: 30 });
    
    if (cooldownCheck.inCooldown) {
      dispatch({
        type: 'SET_COOLDOWN',
        payload: { endTime: Date.now() + cooldownCheck.timeLeft },
      });
      return true;
    }
    
    if (rateLimitCheck.exceeded) {
      // For rate limiting, we'll show a longer cooldown
      const rateLimitEnd = Date.now() + (60 * 60 * 1000); // 1 hour
      dispatch({
        type: 'SET_COOLDOWN',
        payload: { endTime: rateLimitEnd },
      });
      return true;
    }
    
    return false;
  }, [cooldownMinutes, dispatch]);
  
  // Send note with client-side cooldown enforcement
  const sendNote = useCallback(async (data: CreateNoteData) => {
    try {
      // Check cooldown and rate limit
      if (checkCooldownStatus()) {
        throw new Error('Please wait before sending another note');
      }
      
      // Create the note in the database
      const newNote = await createNote(data);
      
      if (newNote) {
        // Update local state immediately for instant feedback
        notesRef.current = [newNote, ...notesRef.current];
        
        // Record post time and set cooldown using client-side logic
        recordPostTime({ cooldownMinutes, maxPostsPerHour: 30 });
        
        const cooldownEnd = Date.now() + (cooldownMinutes * 60 * 1000);
        dispatch({
          type: 'SET_COOLDOWN',
          payload: { endTime: cooldownEnd },
        });
      }
      
      return newNote;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }, [checkCooldownStatus, cooldownMinutes, dispatch]);
  
  // Clear cooldown
  const clearCooldown = useCallback(() => {
    dispatch({ type: 'CLEAR_COOLDOWN' });
  }, [dispatch]);
  
  // Initialize cooldown state from localStorage
  useEffect(() => {
    checkCooldownStatus();
  }, [checkCooldownStatus]);
  
  // Subscribe to cooldown changes for real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToCooldownChanges(() => {
      const status = getCooldownStatus({ cooldownMinutes, maxPostsPerHour: 30 });
      if (status.isInCooldown) {
        dispatch({
          type: 'SET_COOLDOWN',
          payload: { endTime: Date.now() + status.timeLeft },
        });
      } else {
        dispatch({ type: 'CLEAR_COOLDOWN' });
      }
    });
    
    return unsubscribe;
  }, [cooldownMinutes, dispatch]);
  
  return {
    notes: notesRef.current,
    loading: loadingRef.current,
    sendNote,
    updateCursor,
    clearCooldown,
    checkCooldown: checkCooldownStatus,
    userId: userIdRef.current,
    userColor: userColorRef.current,
  };
}
