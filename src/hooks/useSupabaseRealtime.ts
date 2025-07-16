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
          setNotes(prev => [newNote, ...prev]);
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
    await createNote(data);
  };

  return {
    notes,
    loading,
    sendNote,
  };
}
