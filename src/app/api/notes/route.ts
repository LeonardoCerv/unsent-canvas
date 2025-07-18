import { NextRequest, NextResponse } from 'next/server';
import { 
  createNote, 
  getNotes, 
  getNotesByArea, 
  getNotesBySentTo, 
  updateNoteReports,
  checkRateLimit 
} from '@/lib/database';


// Note: Database clients are now handled in database.ts
// This keeps the API routes clean and centralizes database access
const REPORT_RATE_LIMIT = parseInt(process.env.REPORT_RATE_LIMIT || '14400', 10);

const NOTE_RATE_LIMIT = parseInt(process.env.NOTE_RATE_LIMIT || '720', 10);

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

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    // Server-side rate limiting: 5 notes per hour per IP
    const rateLimitPassed = await checkRateLimit(clientIP, 'create_note', NOTE_RATE_LIMIT, 1440);
    
    if (!rateLimitPassed) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please wait before creating another note.' 
      }, { status: 429 });
    }

    // Create note using service role (server-only operation)
    const note = await createNote(data);
    
    if (!note) {
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }
    
    return NextResponse.json(note);
  } catch (error) {
    console.error('POST /api/notes - Error creating note:', error);
    return NextResponse.json({ 
      error: 'Failed to create note', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {

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

    // Server-side rate limiting: 60 reports per hour per IP
    const rateLimitPassed = await checkRateLimit(clientIP, 'report_note', REPORT_RATE_LIMIT, 1440);
    
    if (!rateLimitPassed) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please wait before reporting another note.' 
      }, { status: 429 });
    }

    console.log(`Report attempt for note ${noteId} from IP: ${clientIP}`);

    // Use secure database function to update report count
    const result = await updateNoteReports(noteId);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      );
    }

    // Log the report for potential moderation action
    console.log(`Note ${noteId} reported. New report count: ${result.reportCount}`);

    // If report count reaches a threshold, we could take action here
    if (result.reportCount >= 5) {
      console.warn(`Note ${noteId} has reached ${result.reportCount} reports - may need moderation`);
      // Could automatically hide note or flag for review
    }

    return NextResponse.json({
      success: true,
      reportCount: result.reportCount,
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
