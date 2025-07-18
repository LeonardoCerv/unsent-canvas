'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Note } from '@/types/note';

interface RealtimeContextType {
  notes: Note[];
  addNote: (note: Note) => void;
  removeNote: (noteId: string) => void;
  setNotes: (notes: Note[]) => void;
  loading: boolean;
  connected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [connected, setConnected] = useState<boolean>(false);
  
  // Load initial notes
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const response = await fetch('/api/notes');
        if (response.ok) {
          const initialNotes = await response.json();
          setNotes(initialNotes);
        }
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadNotes();
  }, []);
  
  // Set up realtime subscription (this stays persistent)
  useEffect(() => {
    console.log('Setting up persistent realtime subscription...');
    
    const channel = supabase
      .channel('notes_persistent')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notes' 
        },
        (payload) => {
          console.log('New note broadcast received:', payload);
            const newNote = payload.new as Note;
            setNotes(prev => [newNote, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'notes' 
        },
        (payload) => {
            console.log('Note deleted broadcast received:', payload);
            const deletedNote = payload.old;
            setNotes(prev => prev.filter(note => note.id !== deletedNote.id));
        }
      )
      .subscribe((status, err) => {
        console.log('Persistent subscription status:', status);
        if (err) {
          console.error('Persistent subscription error:', err);
        }
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to persistent notes channel');
          setConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          console.error('Persistent subscription failed:', status);
          setConnected(false);
        }
      });
    
    return () => {
      console.log('Cleaning up persistent subscription...');
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array - this subscription stays persistent
  
  const addNote = (note: Note) => {
    setNotes(prev => [note, ...prev]);
  };
  
  const removeNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  };
  
  const value = {
    notes,
    addNote,
    removeNote,
    setNotes,
    loading,
    connected,
  };
  
  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeNotes() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeNotes must be used within a RealtimeProvider');
  }
  return context;
}