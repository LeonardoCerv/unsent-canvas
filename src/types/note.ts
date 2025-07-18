export interface Note {
  id: string;
  created_at: string;
  sent_to: string;
  message: string;
  x: number;
  y: number;
  color?: string;
  report_count?: number;
}

export interface CreateNoteData {
  sent_to: string;
  message: string;
  x: number;
  y: number;
  color?: string;
}

export interface NotePosition {
  x: number;
  y: number;
}
