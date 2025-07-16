'use client';

import { useState, useCallback, useEffect } from 'react';
import Canvas from './Canvas';
import CreateNoteModal from './CreateNoteModal';
import NoteCard from './NoteCard';
import SetupGuide from './SetupGuide';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { Note, CreateNoteData } from '@/types/note';

export default function UnsentCanvas() {
  const { notes, loading, sendNote } = useSupabaseRealtime();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Check if environment variables are set
  useEffect(() => {
    const hasSupabaseConfig = 
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url' &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key';
    
    if (!hasSupabaseConfig) {
      setShowSetupGuide(true);
    }
  }, []);

  const handleCanvasClick = useCallback((x: number, y: number) => {
    setModalPosition({ x, y });
    setIsModalOpen(true);
  }, []);

  const handleNoteClick = useCallback((note: Note) => {
    setSelectedNote(note);
  }, []);

  const handleCreateNote = useCallback(async (data: CreateNoteData) => {
    try {
      console.log('Creating note with data:', data);
      const result = await sendNote(data);
      console.log('Note created successfully:', result);
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  }, [sendNote]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleClosePreview = useCallback(() => {
    setSelectedNote(null);
  }, []);

  return (
    <div className="relative w-full h-full">
      {showSetupGuide && <SetupGuide />}
      
      <Canvas
        notes={notes}
        onNoteClick={handleNoteClick}
        onCanvasClick={handleCanvasClick}
        loading={loading}
      />
      
      <CreateNoteModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateNote}
        x={modalPosition.x}
        y={modalPosition.y}
      />
      
      {/* Note preview overlay using the same NoteCard component */}
      {selectedNote && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={handleClosePreview}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <NoteCard
              note={selectedNote}
              onClick={handleClosePreview}
              scale={1}
              isPreview={true}
            />
          </div>
        </div>
      )}
      
      {/* Instructions overlay */}
      {notes.length === 0 && !loading && !showSetupGuide && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-8 shadow-lg text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Welcome to Unsent Canvas
            </h2>
            <p className="text-gray-600 mb-4">
              Click anywhere on the canvas to create your first note.
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>• Use mouse wheel to zoom in/out</p>
              <p>• Click and drag to pan around</p>
              <p>• All notes are anonymous and public</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Note count indicator */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg pointer-events-none z-50">
        <div className="text-sm text-gray-600">
          {loading ? 'Loading...' : `${notes.length} notes`}
        </div>
      </div>
      
    </div>
  );
}
