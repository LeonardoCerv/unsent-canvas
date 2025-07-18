'use client';
import { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
interface CanvasState {
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  cooldownEndTime: number | null;
}

// Actions
type CanvasAction =
  | { type: 'SET_CONNECTION_STATUS'; payload: 'connected' | 'disconnected' | 'connecting' }
  | { type: 'SET_COOLDOWN'; payload: { endTime: number } }
  | { type: 'CLEAR_COOLDOWN' };

// Initial state
const initialState: CanvasState = {
  connectionStatus: 'disconnected',
  cooldownEndTime: null,
};

// Reducer
function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    case 'SET_COOLDOWN':
      return { ...state, cooldownEndTime: action.payload.endTime };
    case 'CLEAR_COOLDOWN':
      return { ...state, cooldownEndTime: null };
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