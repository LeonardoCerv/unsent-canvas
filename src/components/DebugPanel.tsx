'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createNote, getNotes, testConnection } from '@/lib/database';

export default function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'failed'>('unknown');

  const testCreateNote = async () => {
    setLoading(true);
    try {
      const testNote = await createNote({
        sent_to: 'Test User',
        message: 'Test message from debug panel',
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: '#fef3c7'
      });
      console.log('Test note created:', testNote);
      await loadNotes();
    } catch (error) {
      console.error('Error creating test note:', error);
    }
    setLoading(false);
  };

  const loadNotes = async () => {
    setLoading(true);
    try {
      const fetchedNotes = await getNotes();
      setNotes(fetchedNotes);
      console.log('Fetched notes:', fetchedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
    setLoading(false);
  };

  const testConnectionStatus = async () => {
    setLoading(true);
    try {
      const isConnected = await testConnection();
      setConnectionStatus(isConnected ? 'success' : 'failed');
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionStatus('failed');
    }
    setLoading(false);
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button onClick={() => setIsVisible(true)} size="sm" variant="outline">
          Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white border rounded-lg p-4 shadow-lg max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Debug Panel</h3>
        <Button onClick={() => setIsVisible(false)} size="sm" variant="outline">
          ×
        </Button>
      </div>
      
      <div className="space-y-2">
        <Button 
          onClick={testConnectionStatus} 
          disabled={loading}
          size="sm"
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </Button>
        
        <div className="text-sm">
          Connection: 
          <span className={`ml-1 ${
            connectionStatus === 'success' ? 'text-green-600' : 
            connectionStatus === 'failed' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {connectionStatus === 'success' ? '✓ Connected' : 
             connectionStatus === 'failed' ? '✗ Failed' : 'Unknown'}
          </span>
        </div>
        
        <Button 
          onClick={testCreateNote} 
          disabled={loading}
          size="sm"
          className="w-full"
        >
          {loading ? 'Creating...' : 'Create Test Note'}
        </Button>
        
        <Button 
          onClick={loadNotes} 
          disabled={loading}
          size="sm"
          variant="outline"
          className="w-full"
        >
          {loading ? 'Loading...' : 'Load Notes'}
        </Button>
        
        <div className="text-sm text-gray-600">
          Notes in DB: {notes.length}
        </div>
        
        {notes.length > 0 && (
          <div className="max-h-32 overflow-y-auto text-xs">
            {notes.slice(0, 3).map(note => (
              <div key={note.id} className="border-b pb-1 mb-1">
                <div>To: {note.sent_to}</div>
                <div>Message: {note.message.slice(0, 30)}...</div>
                <div>Position: ({note.x}, {note.y})</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
