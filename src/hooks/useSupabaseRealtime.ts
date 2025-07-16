import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Note, CreateNoteData } from '@/types/note';
import { createNote, getNotes } from '@/lib/database';

export function useSupabaseRealtime() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial notes
    const loadNotes = async () => {
      const initialNotes = await getNotes();
      setNotes(initialNotes);
      setLoading(false);
    };

    loadNotes();

    // Set up realtime subscription
    const channel = supabase
      .channel('notes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notes' },
        (payload) => {
          const newNote = payload.new as Note;
          // Only add if not already in local state (prevent duplicates)
          setNotes(prev => {
            const exists = prev.some(note => note.id === newNote.id);
            if (!exists) {
              return [newNote, ...prev];
            }
            return prev;
          });
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notes' },
        (payload) => {
          const deletedNote = payload.old as Note;
          setNotes(prev => prev.filter(note => note.id !== deletedNote.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sendNote = async (data: CreateNoteData) => {
    try {
      // Create the note in the database
      const newNote = await createNote(data);
      
      if (newNote) {
        // Update local state immediately for instant feedback
        setNotes(prev => [newNote, ...prev]);
      }
      
      return newNote;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  };

  return {
    notes,
    loading,
    sendNote,
  };
}
