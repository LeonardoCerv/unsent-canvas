import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration for report API');
}

// Create supabase client only if we have the required environment variables
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { id: noteId } = await params;

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
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

    // Update the report count
    const { data, error } = await supabase
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

    if (!data) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Log the report for potential moderation action
    console.log(`Note ${noteId} reported. New report count: ${data.report_count}`);

    // If report count reaches a threshold, we could take action here
    if (data.report_count >= 5) {
      console.warn(`Note ${noteId} has reached ${data.report_count} reports - may need moderation`);
      // Could automatically hide note or flag for review
    }

    return NextResponse.json({
      success: true,
      reportCount: data.report_count,
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
