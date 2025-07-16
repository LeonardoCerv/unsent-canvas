import { supabase } from './supabase';
import { CreateNoteData, Note } from '@/types/note';

export async function createNote(data: CreateNoteData): Promise<Note | null> {
  const { data: note, error } = await supabase
    .from('notes')
    .insert({
      sent_to: data.sent_to,
      message: data.message,
      x: data.x,
      y: data.y,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating note:', error);
    return null;
  }

  return note;
}

export async function getNotes(): Promise<Note[]> {
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    return [];
  }

  return notes || [];
}

export async function getNotesByArea(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): Promise<Note[]> {
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .gte('x', minX)
    .lte('x', maxX)
    .gte('y', minY)
    .lte('y', maxY)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes by area:', error);
    return [];
  }

  return notes || [];
}

export async function getNotesBySentTo(sentTo: string): Promise<Note[]> {
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('sent_to', sentTo)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes by sent_to:', error);
    return [];
  }

  return notes || [];
}

export async function deleteNote(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting note:', error);
    return false;
  }

  return true;
}
