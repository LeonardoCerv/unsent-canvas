'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
interface User {
  id: string;
  cursor: {
    x: number;
    y: number;
    lastUpdate: number;
  };
  connected: boolean;
  color: string;
}

interface CanvasState {
  users: Map<string, User>;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  cooldownEndTime: number | null;
  messageCache: Map<string, unknown>;
}

// Actions
type CanvasAction =
  | { type: 'UPDATE_USER_CURSOR'; payload: { userId: string; x: number; y: number } }
  | { type: 'USER_CONNECTED'; payload: { userId: string; color: string } }
  | { type: 'USER_DISCONNECTED'; payload: { userId: string } }
  | { type: 'SET_CONNECTION_STATUS'; payload: 'connected' | 'disconnected' | 'connecting' }
  | { type: 'SET_COOLDOWN'; payload: { endTime: number } }
  | { type: 'CLEAR_COOLDOWN' }
  | { type: 'CACHE_MESSAGE'; payload: { key: string; data: unknown } }
  | { type: 'CLEAR_CACHE' };

// Initial state
const initialState: CanvasState = {
  users: new Map(),
  connectionStatus: 'disconnected',
  cooldownEndTime: null,
  messageCache: new Map(),
};

// Reducer
function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'UPDATE_USER_CURSOR': {
      const { userId, x, y } = action.payload;
      const newUsers = new Map(state.users);
      const user = newUsers.get(userId);
      
      if (user) {
        newUsers.set(userId, {
          ...user,
          cursor: { x, y, lastUpdate: Date.now() },
        });
      }
      
      return { ...state, users: newUsers };
    }
    
    case 'USER_CONNECTED': {
      const { userId, color } = action.payload;
      const newUsers = new Map(state.users);
      newUsers.set(userId, {
        id: userId,
        cursor: { x: 0, y: 0, lastUpdate: Date.now() },
        connected: true,
        color,
      });
      
      return { ...state, users: newUsers };
    }
    
    case 'USER_DISCONNECTED': {
      const { userId } = action.payload;
      const newUsers = new Map(state.users);
      newUsers.delete(userId);
      
      return { ...state, users: newUsers };
    }
    
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    
    case 'SET_COOLDOWN':
      return { ...state, cooldownEndTime: action.payload.endTime };
    
    case 'CLEAR_COOLDOWN':
      return { ...state, cooldownEndTime: null };
    
    case 'CACHE_MESSAGE': {
      const { key, data } = action.payload;
      const newCache = new Map(state.messageCache);
      newCache.set(key, data);
      
      return { ...state, messageCache: newCache };
    }
    
    case 'CLEAR_CACHE':
      return { ...state, messageCache: new Map() };
    
    default:
      return state;
  }
}

// Context
const CanvasContext = createContext<{
  state: CanvasState;
  dispatch: React.Dispatch<CanvasAction>;
} | null>(null);

// Provider
export function CanvasProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(canvasReducer, initialState);
  
  return (
    <CanvasContext.Provider value={{ state, dispatch }}>
      {children}
    </CanvasContext.Provider>
  );
}

// Hook
export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
}
