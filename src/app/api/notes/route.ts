import { NextRequest, NextResponse } from 'next/server';
import { createNote, getNotes, getNotesByArea, getNotesBySentTo } from '@/lib/database';

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
    
    if (!data.message || !data.sent_to || typeof data.x !== 'number' || typeof data.y !== 'number') {
      return NextResponse.json({ error: 'Missing required fields: message, sent_to, x, y' }, { status: 400 });
    }

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
