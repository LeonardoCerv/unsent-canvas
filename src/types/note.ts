export interface Note {
  id: string;
  created_at: string;
  sent_to: string;
  message: string;
  x: number;
  y: number;
}

export interface CreateNoteData {
  sent_to: string;
  message: string;
  x: number;
  y: number;
}

export interface NotePosition {
  x: number;
  y: number;
}
