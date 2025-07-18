interface ModerationResult {
  isAllowed: boolean;
  reason?: string;
}

// Enhanced rate limiting class
export class EnhancedRateLimit {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 300000) { // 5 attempts per 5 minutes
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return true;
    }

    // Record this attempt
    validAttempts.push(now);
    this.attempts.set(identifier, validAttempts);
    
    return false;
  }

  getRemainingTime(identifier: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length < this.maxAttempts) {
      return 0;
    }

    // Return time until oldest attempt expires
    const oldestAttempt = Math.min(...validAttempts);
    return Math.max(0, this.windowMs - (now - oldestAttempt));
  }
}

// Global rate limiter instance
const globalRateLimit = new EnhancedRateLimit();

// Common spam patterns
const SPAM_PATTERNS = [
  /(.)\1{10,}/i, // Repeated characters (10+)
  /^(.{1,3})\1{5,}$/i, // Repeated short patterns
  /https?:\/\/[^\s]+/gi, // URLs
  /\b(buy|sale|discount|offer|deal|free|win|winner|prize)\b/gi, // Promotional spam
  /\b\d{10,}\b/g, // Long numbers (phone numbers, etc.)
];

// Inappropriate content patterns
const INAPPROPRIATE_PATTERNS = [
  // Add patterns for inappropriate content detection
  /\b(hate|violence|threat)\b/gi,
];

// Basic profanity filter (can be expanded)
const PROFANITY_WORDS = [
  'badword1', 'badword2', // Replace with actual profanity list
];

export function moderateContent(content: string): ModerationResult {
  const trimmedContent = content.trim();

  // Check content length
  if (trimmedContent.length === 0) {
    return { isAllowed: false, reason: 'Content cannot be empty' };
  }

  if (trimmedContent.length > 500) {
    return { isAllowed: false, reason: 'Content too long (max 500 characters)' };
  }

  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(trimmedContent)) {
      return { isAllowed: false, reason: 'Content appears to be spam' };
    }
  }

  // Check for inappropriate content
  for (const pattern of INAPPROPRIATE_PATTERNS) {
    if (pattern.test(trimmedContent)) {
      return { isAllowed: false, reason: 'Content contains inappropriate material' };
    }
  }

  // Check for profanity
  const lowerContent = trimmedContent.toLowerCase();
  for (const word of PROFANITY_WORDS) {
    if (lowerContent.includes(word)) {
      return { isAllowed: false, reason: 'Content contains inappropriate language' };
    }
  }

  return { isAllowed: true };
}

export function checkRateLimit(identifier: string): { isAllowed: boolean; remainingTime?: number } {
  if (globalRateLimit.isRateLimited(identifier)) {
    return {
      isAllowed: false,
      remainingTime: globalRateLimit.getRemainingTime(identifier)
    };
  }
  
  return { isAllowed: true };
}
