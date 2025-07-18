// Server-safe HTML sanitization
function sanitizeHtml(input: string): string {
  // Simple server-side sanitization - remove HTML tags and dangerous characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, '') // Remove dangerous characters
    .trim();
}

// Database field limits
export const LIMITS = {
  SENT_TO_MAX_LENGTH: 15,
  MESSAGE_MAX_LENGTH: 150,
} as const;

// Basic profanity filter - can be expanded with more sophisticated filtering
const PROFANITY_WORDS = [
  'damn', 'hell', 'crap', 'shit', 'fuck', 'bitch', 'bastard', 'ass', 'piss',
  // Add more words as needed
];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: string;
}

export function validateMessage(message: string): ValidationResult {
  const errors: string[] = [];
  
  // Check if message is empty
  if (!message.trim()) {
    errors.push('Message cannot be empty');
    return { isValid: false, errors };
  }
  
  // Check character limit
  if (message.length > LIMITS.MESSAGE_MAX_LENGTH) {
    errors.push(`Message must be ${LIMITS.MESSAGE_MAX_LENGTH} characters or less`);
  }
  
  // Check for profanity
  const lowerMessage = message.toLowerCase();
  const containsProfanity = PROFANITY_WORDS.some(word => 
    lowerMessage.includes(word.toLowerCase())
  );
  
  if (containsProfanity) {
    errors.push('Message contains inappropriate language');
  }
  
  // Check for spam patterns
  const hasExcessiveRepeats = /(.)\1{4,}/.test(message); // 5+ same characters in a row
  const hasExcessiveCaps = message.replace(/[^A-Z]/g, '').length > message.length * 0.7;
  
  if (hasExcessiveRepeats) {
    errors.push('Message contains excessive repeated characters');
  }
  
  if (hasExcessiveCaps && message.length > 10) {
    errors.push('Message contains excessive capital letters');
  }
  
  // Sanitize the message
  const sanitized = sanitizeHtml(message);
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

export function validateSentTo(sentTo: string): ValidationResult {
  const errors: string[] = [];
  
  if (!sentTo.trim()) {
    errors.push('Recipient cannot be empty');
    return { isValid: false, errors };
  }
  
  if (sentTo.length > LIMITS.SENT_TO_MAX_LENGTH) {
    errors.push(`Recipient name must be ${LIMITS.SENT_TO_MAX_LENGTH} characters or less`);
  }
  
  // Basic sanitization
  const sanitized = sanitizeHtml(sentTo);
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

export function validateCoordinates(x: number, y: number): ValidationResult {
  const errors: string[] = [];
  
  if (isNaN(x) || isNaN(y)) {
    errors.push(`Invalid coordinates: x=${x}, y=${y}`);
  }
  
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    errors.push('Coordinates must be integers');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeInput(input: string): string {
  return sanitizeHtml(input);
}
