import { createClient } from '@supabase/supabase-js';
import { CreateNoteData, Note } from '@/types/note';
import { validateSentTo, validateMessage, validateCoordinates } from './validation';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables are set
if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Service role client for write operations (server-only)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

// Anonymous client for read operations (public access)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

export async function testConnection(): Promise<boolean> {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection using anonymous client
    const { error } = await supabaseAnon
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
  
  // Use service role client for write operations
  const { data: note, error } = await supabaseService
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
  
  // Use anonymous client for read operations
  const { data: notes, error } = await supabaseAnon
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
  // Use anonymous client for read operations
  const { data: notes, error } = await supabaseAnon
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
  // Use anonymous client for read operations
  const { data: notes, error } = await supabaseAnon
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
  // Use service role client for write operations
  const { error } = await supabaseService
    .from('notes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting note:', error);
    return false;
  }

  return true;
}

export async function updateNoteReports(id: string): Promise<{ success: boolean; reportCount: number }> {
  // Use service role client for write operations
  const { data: note, error } = await supabaseService
    .from('notes')
    .select('report_count')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching note for report update:', error);
    return { success: false, reportCount: 0 };
  }

  const newReportCount = (note?.report_count || 0) + 1;

  const { data: updatedNote, error: updateError } = await supabaseService
    .from('notes')
    .update({ report_count: newReportCount })
    .eq('id', id)
    .select('report_count')
    .single();

  if (updateError) {
    console.error('Error updating report count:', updateError);
    return { success: false, reportCount: 0 };
  }

  return { success: true, reportCount: updatedNote?.report_count || 0 };
}

// Server-side rate limiting function
export async function checkRateLimit(
  clientIP: string, 
  action: string, 
  limitCount: number = 5, 
  windowMinutes: number = 60
): Promise<boolean> {
  try {
    // Use service role client for rate limiting operations
    const { data, error } = await supabaseService
      .rpc('check_rate_limit', {
        client_ip: clientIP,
        limit_action: action,
        limit_count: limitCount,
        limit_window: `${windowMinutes} minutes`
      });

    if (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow the request if rate limiting is broken
      return true;
    }

    return data as boolean;
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow the request if rate limiting is broken
    return true;
  }
}

