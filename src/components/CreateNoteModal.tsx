'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { validateMessage, validateSentTo, LIMITS } from '@/lib/validation';
import { CreateNoteData } from '@/types/note';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateNoteData & { userId?: string }) => void;
  x: number;
  y: number;
  userId?: string;
}

const NOTE_COLORS = [
  '#ffffff', // White
  '#fef3c7', // Yellow
  '#fce7f3', // Pink
  '#e0f2fe', // Light Blue
  '#f0f9ff', // Sky Blue
  '#ecfdf5', // Green
  '#fef3e2', // Orange
  '#f3e8ff', // Purple
  '#fecaca', // Red
  '#d1fae5', // Emerald
];

export default function CreateNoteModal({ isOpen, onClose, onSubmit, x, y, userId }: CreateNoteModalProps) {
  const [message, setMessage] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [messageErrors, setMessageErrors] = useState<string[]>([]);
  const [sentToErrors, setSentToErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const characterCount = message.length;
  const maxCharacters = LIMITS.MESSAGE_MAX_LENGTH;

  // Validate message in real-time
  useEffect(() => {
    if (message) {
      const validation = validateMessage(message);
      setMessageErrors(validation.errors);
    } else {
      setMessageErrors([]);
    }
  }, [message]);

  // Validate sent_to in real-time
  useEffect(() => {
    if (sentTo) {
      const validation = validateSentTo(sentTo);
      setSentToErrors(validation.errors);
    } else {
      setSentToErrors([]);
    }
  }, [sentTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    // Final validation
    const messageValidation = validateMessage(message);
    const sentToValidation = validateSentTo(sentTo);
    
    setMessageErrors(messageValidation.errors);
    setSentToErrors(sentToValidation.errors);
    
    if (messageValidation.isValid && sentToValidation.isValid) {
      try {
        const noteData = {
          message: messageValidation.sanitized!,
          sent_to: sentToValidation.sanitized!,
          x,
          y,
          color: selectedColor,
          userId
        };
        
        console.log('Submitting note data:', noteData);
        await onSubmit(noteData);
        
        // Reset form
        setMessage('');
        setSentTo('');
        setSelectedColor(NOTE_COLORS[0]);
        setMessageErrors([]);
        setSentToErrors([]);
        onClose();
      } catch (error: unknown) {
        console.error('Error creating note:', error);
        // Show error message to user
        if (error instanceof Error && error.message?.includes('check constraint')) {
          setSentToErrors(['Recipient name is too long']);
        } else {
          setSentToErrors(['Failed to create note. Please try again.']);
        }
      }
    }
    
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setMessage('');
      setSentTo('');
      setSelectedColor(NOTE_COLORS[0]);
      setMessageErrors([]);
      setSentToErrors([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a Note</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient Input */}
          <div className="space-y-2">
            <Label htmlFor="sent_to">To:</Label>
            <Input
              id="sent_to"
              value={sentTo}
              onChange={(e) => setSentTo(e.target.value)}
              placeholder="Who is this note for?"
              maxLength={LIMITS.SENT_TO_MAX_LENGTH}
              className={sentToErrors.length > 0 ? 'border-red-500' : ''}
            />
            {sentToErrors.map((error, index) => (
              <p key={index} className="text-sm text-red-500">{error}</p>
            ))}
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="message">Message:</Label>
              <span className={`text-sm ${characterCount > maxCharacters ? 'text-red-500' : 'text-gray-500'}`}>
                {characterCount}/{maxCharacters}
              </span>
            </div>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What do you want to say?"
              rows={4}
              className={messageErrors.length > 0 ? 'border-red-500' : ''}
            />
            {messageErrors.map((error, index) => (
              <p key={index} className="text-sm text-red-500">{error}</p>
            ))}
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Note Color:</Label>
            <div className="flex flex-wrap gap-2">
              {NOTE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-gray-800 scale-110' 
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Position Info */}
          <div className="text-sm text-gray-500">
            Position: ({Math.round(x)}, {Math.round(y)})
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                messageErrors.length > 0 ||
                sentToErrors.length > 0 ||
                !message.trim() ||
                !sentTo.trim()
              }
            >
              {isSubmitting ? 'Creating...' : 'Create Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
