import { create } from 'zustand';

interface SessionState {
  sessionId: string | null;
  reconnectToken: string | null;
  isReconnecting: boolean;
  iceRestartState: boolean;
  setSession: (id: string, token: string) => void;
  setReconnecting: (state: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  reconnectToken: null,
  isReconnecting: false,
  iceRestartState: false,
  setSession: (id, token) => set({ sessionId: id, reconnectToken: token }),
  setReconnecting: (state) => set({ isReconnecting: state }),
}));
