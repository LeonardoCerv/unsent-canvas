/**
 * Client-side cooldown system using localStorage
 * This minimizes Supabase database calls by handling cooldowns entirely on the client
 */

export interface CooldownConfig {
  cooldownMinutes: number;
  maxPostsPerHour: number;
}

// Get cooldown duration from environment variable
const getCooldownMinutes = (): number => {
  const envValue = process.env.NEXT_PUBLIC_COOLDOWN_MINUTES;
  const parsedValue = envValue ? parseInt(envValue, 10) : 2;
  return isNaN(parsedValue) || parsedValue < 1 ? 2 : parsedValue;
};

const DEFAULT_CONFIG: CooldownConfig = {
  cooldownMinutes: getCooldownMinutes(),
  maxPostsPerHour: 30,
};

// Storage keys
const COOLDOWN_KEY = 'unsent_canvas_cooldown';
const POST_HISTORY_KEY = 'unsent_canvas_post_history';

// In-memory cooldown tracking for session
let sessionCooldownEnd: number | null = null;
let sessionPostHistory: number[] = [];

// Initialize from localStorage
function initializeFromStorage() {
  if (typeof window === 'undefined') return;
  
  try {
    const storedCooldown = localStorage.getItem(COOLDOWN_KEY);
    if (storedCooldown) {
      const cooldownEnd = parseInt(storedCooldown);
      if (cooldownEnd > Date.now()) {
        sessionCooldownEnd = cooldownEnd;
      } else {
        localStorage.removeItem(COOLDOWN_KEY);
      }
    }
    
    const storedHistory = localStorage.getItem(POST_HISTORY_KEY);
    if (storedHistory) {
      const history = JSON.parse(storedHistory) as number[];
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      sessionPostHistory = history.filter(time => time > oneHourAgo);
      
      // Clean up old entries
      if (sessionPostHistory.length !== history.length) {
        localStorage.setItem(POST_HISTORY_KEY, JSON.stringify(sessionPostHistory));
      }
    }
  } catch (error) {
    console.error('Error initializing from storage:', error);
  }
}

// Initialize on module load
initializeFromStorage();

/**
 * Check if user is currently in cooldown
 */
export function checkCooldown(config: CooldownConfig = DEFAULT_CONFIG): {
  inCooldown: boolean;
  timeLeft: number;
  lastPostTime?: number;
} {
  if (typeof window === 'undefined') {
    return { inCooldown: false, timeLeft: 0 };
  }
  
  const now = Date.now();
  
  // Check session cooldown first
  if (sessionCooldownEnd && sessionCooldownEnd > now) {
    return {
      inCooldown: true,
      timeLeft: sessionCooldownEnd - now,
      lastPostTime: sessionCooldownEnd - (config.cooldownMinutes * 60 * 1000),
    };
  }
  
  // Check localStorage cooldown
  try {
    const storedCooldown = localStorage.getItem(COOLDOWN_KEY);
    if (storedCooldown) {
      const cooldownEnd = parseInt(storedCooldown);
      if (cooldownEnd > now) {
        sessionCooldownEnd = cooldownEnd;
        return {
          inCooldown: true,
          timeLeft: cooldownEnd - now,
          lastPostTime: cooldownEnd - (config.cooldownMinutes * 60 * 1000),
        };
      } else {
        localStorage.removeItem(COOLDOWN_KEY);
        sessionCooldownEnd = null;
      }
    }
  } catch (error) {
    console.error('Error checking cooldown:', error);
  }
  
  return { inCooldown: false, timeLeft: 0 };
}

/**
 * Check if user has exceeded rate limit
 */
export function checkRateLimit(config: CooldownConfig = DEFAULT_CONFIG): {
  exceeded: boolean;
  postsInLastHour: number;
} {
  if (typeof window === 'undefined') {
    return { exceeded: false, postsInLastHour: 0 };
  }
  
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const recentPosts = sessionPostHistory.filter(time => time > oneHourAgo);
  
  return {
    exceeded: recentPosts.length >= config.maxPostsPerHour,
    postsInLastHour: recentPosts.length,
  };
}

/**
 * Record a new post time and set cooldown
 */
export function recordPostTime(config: CooldownConfig = DEFAULT_CONFIG): void {
  if (typeof window === 'undefined') return;
  
  const now = Date.now();
  const cooldownEnd = now + (config.cooldownMinutes * 60 * 1000);
  
  // Set cooldown
  sessionCooldownEnd = cooldownEnd;
  localStorage.setItem(COOLDOWN_KEY, cooldownEnd.toString());
  
  // Record post in history
  sessionPostHistory.push(now);
  
  // Clean up old entries (keep only last hour + some buffer)
  const twoHoursAgo = now - (2 * 60 * 60 * 1000);
  sessionPostHistory = sessionPostHistory.filter(time => time > twoHoursAgo);
  
  // Save to localStorage
  try {
    localStorage.setItem(POST_HISTORY_KEY, JSON.stringify(sessionPostHistory));
  } catch (error) {
    console.error('Error saving post history:', error);
  }
}

/**
 * Clear cooldown (for testing or admin purposes)
 */
export function clearCooldown(): void {
  if (typeof window === 'undefined') return;
  
  sessionCooldownEnd = null;
  localStorage.removeItem(COOLDOWN_KEY);
}

/**
 * Clear all cooldown data
 */
export function clearAllCooldownData(): void {
  if (typeof window === 'undefined') return;
  
  sessionCooldownEnd = null;
  sessionPostHistory = [];
  localStorage.removeItem(COOLDOWN_KEY);
  localStorage.removeItem(POST_HISTORY_KEY);
}

/**
 * Get cooldown status for UI display
 */
export function getCooldownStatus(config: CooldownConfig = DEFAULT_CONFIG): {
  isInCooldown: boolean;
  timeLeft: number;
  timeLeftFormatted: string;
  canPost: boolean;
} {
  const cooldownCheck = checkCooldown(config);
  const rateLimitCheck = checkRateLimit(config);
  
  const timeLeft = cooldownCheck.timeLeft;
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const timeLeftFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  return {
    isInCooldown: cooldownCheck.inCooldown,
    timeLeft,
    timeLeftFormatted,
    canPost: !cooldownCheck.inCooldown && !rateLimitCheck.exceeded,
  };
}

/**
 * Subscribe to cooldown changes (for React components)
 */
export function subscribeToCooldownChanges(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const interval = setInterval(callback, 1000); // Check every second
  
  return () => clearInterval(interval);
}
