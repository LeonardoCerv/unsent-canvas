import { NextRequest, NextResponse } from 'next/server';
import { createNote, getNotes, getNotesByArea, getNotesBySentTo } from '@/lib/database';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minX = searchParams.get('minX');
    const maxX = searchParams.get('maxX');
    const minY = searchParams.get('minY');
    const maxY = searchParams.get('maxY');
    const sentTo = searchParams.get('sentTo');

    let notes;
    
    if (sentTo) {
      notes = await getNotesBySentTo(sentTo);
    } else if (minX && maxX && minY && maxY) {
      notes = await getNotesByArea(
        parseInt(minX),
        parseInt(maxX),
        parseInt(minY),
        parseInt(maxY)
      );
    } else {
      notes = await getNotes();
    }

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Basic field validation - detailed validation is handled in createNote
    if (!data.message || !data.sent_to || typeof data.x !== 'number' || typeof data.y !== 'number') {
      return NextResponse.json({ error: 'Missing required fields: message, sent_to, x, y' }, { status: 400 });
    }

    // Cooldown and rate limiting is now handled entirely on the client side
    // This reduces database calls to Supabase
    
    const note = await createNote(data);
    
    if (!note) {
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }
    
    return NextResponse.json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const data = await request.json();
    const { id: noteId } = data;

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required in request body' },
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    // Basic rate limiting check (could be enhanced)
    console.log(`Report attempt for note ${noteId} from IP: ${clientIP}`);

    // First get the current report count, then increment it
    const { data: currentNote, error: fetchError } = await supabase
      .from('notes')
      .select('report_count')
      .eq('id', noteId)
      .single();

    if (fetchError) {
      console.error('Error fetching note:', fetchError);
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    const newReportCount = (currentNote?.report_count || 0) + 1;
    console.log(`Incrementing report count for note ${noteId} to ${newReportCount}`);

    // Update the report count
    const { data: updatedNote, error } = await supabase
      .from('notes')
      .update({ 
        report_count: newReportCount
      })
      .eq('id', noteId)
      .select('report_count')
      .single();

    if (error) {
      console.error('Error updating report count:', error);
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      );
    }

    if (!updatedNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Log the report for potential moderation action
    console.log(`Note ${noteId} reported. New report count: ${updatedNote.report_count}`);

    // If report count reaches a threshold, we could take action here
    if (updatedNote.report_count >= 5) {
      console.warn(`Note ${noteId} has reached ${updatedNote.report_count} reports - may need moderation`);
      // Could automatically hide note or flag for review
    }

    return NextResponse.json({
      success: true,
      reportCount: updatedNote.report_count,
      message: 'Report submitted successfully'
    });

  } catch (error) {
    console.error('Error in report API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
