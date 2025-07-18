'use client';

import { useState, useCallback, useEffect } from 'react';
import Canvas from './Canvas';
import CreateNoteModal from './CreateNoteModal';

import SetupGuide from './SetupGuide';

import { useRealtimeCanvas } from '@/hooks/useRealtimeCanvas';
import { Note, CreateNoteData } from '@/types/note';
import { getCooldownStatus } from '@/lib/clientCooldown';
import { moderateContent } from '@/lib/contentModeration';
import { hasUserReportedNote, recordUserReport } from '@/lib/reportSystem';
import NoteCard from './NoteCard';
import { AlertTriangle } from 'lucide-react';

export default function UnsentCanvas() {
  const { notes, loading, sendNote, updateCursor, userId } = useRealtimeCanvas();
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
    // Check if user is on cooldown before showing modal
    const cooldownStatus = getCooldownStatus();
    if (cooldownStatus.isInCooldown) {
      // Don't show modal if user is on cooldown
      return;
    }
    
    setModalPosition({ x, y });
    setIsModalOpen(true);
  }, []);

  const handleNoteClick = useCallback((note: Note) => {
    setSelectedNote(note);
  }, []);

  const handleCreateNote = useCallback(async (data: CreateNoteData) => {
    try {
      console.log('Creating note with data:', data);
      
      // Apply content moderation before sending
      const moderationResult = moderateContent(data.message);
      
      if (!moderationResult.isAllowed) {
        throw new Error(`Message blocked: ${moderationResult.reason}`);
      }
      
      const result = await sendNote(data);
      console.log('Note created successfully:', result);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  }, [sendNote]);

  const handleReport = useCallback(async (note: Note) => {
    // Check if user has already reported this note
    if (hasUserReportedNote(note.id)) {
      alert('You have already reported this note.');
      return;
    }

    // Record that user reported this note
    const success = recordUserReport(note.id);
    if (!success) {
      alert('Unable to submit report. Please try again.');
      return;
    }

    try {
      // Submit report to backend
      const response = await fetch(`/api/notes/${note.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Report submitted successfully. This note now has ${data.reportCount} reports.`);
        setSelectedNote(null); // Close preview after reporting
      } else {
        alert('Failed to submit report. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    }
  }, []);

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
        updateCursor={updateCursor}
      />
      
      <CreateNoteModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateNote}
        x={modalPosition.x}
        y={modalPosition.y}
        userId={userId}
      />
      
      {/* Note preview overlay using the same NoteCard component */}
      {selectedNote && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={handleClosePreview}
        >
          <div 
            className="relative mr-36 mb-128"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Report button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReport(selectedNote);
              }}
              className="relative -top-8 left-18 px-4 rounded-md flex flex-row items-center justify-center text-red-600 transition-colors border-red-500 border"
              title="Report this note"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Report this Note
            </button>
                        
            {/* Note content */}
            <NoteCard
              note={selectedNote}
              onClick={handleClosePreview}
              scale={10}
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
      

      
    </div>
  );
}
