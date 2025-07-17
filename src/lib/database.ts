import { supabase } from './supabase';
import { CreateNoteData, Note } from '@/types/note';
import { validateSentTo, validateMessage, validateCoordinates } from './validation';

export async function testConnection(): Promise<boolean> {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { error } = await supabase
      .from('notes')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Connection test failed:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }
    
    console.log('Connection test successful');
    return true;
  } catch (error) {
    console.error('Connection test error:', error);
    return false;
  }
}

export async function createNote(data: CreateNoteData): Promise<Note | null> {
  
  // Validate the data using centralized validation
  const sentToValidation = validateSentTo(data.sent_to);
  const messageValidation = validateMessage(data.message);
  const coordinatesValidation = validateCoordinates(data.x, data.y);
  
  // Collect all validation errors
  const allErrors = [
    ...sentToValidation.errors,
    ...messageValidation.errors,
    ...coordinatesValidation.errors
  ];
  
  if (allErrors.length > 0) {
    throw new Error(`Validation failed: ${allErrors.join(', ')}`);
  }
  
  const insertData = {
    sent_to: sentToValidation.sanitized!,
    message: messageValidation.sanitized!,
    x: Math.round(data.x), // Ensure integers
    y: Math.round(data.y), // Ensure integers
    color: data.color || '#fff3a0', // Default sticky note yellow
  };
  
  const { data: note, error } = await supabase
    .from('notes')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    const errorMessage = error.message || error.details || 'Unknown database error';
    const descriptiveError = new Error(`Database error: ${errorMessage}`);
    descriptiveError.cause = error;
    throw descriptiveError;
  }
  return note;
}

export async function getNotes(): Promise<Note[]> {
  console.log('Fetching notes from database...');
  
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', {
      error,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return [];
  }

  console.log('Notes fetched successfully:', notes?.length || 0, 'notes');
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
