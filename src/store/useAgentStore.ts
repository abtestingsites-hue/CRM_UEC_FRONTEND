import { create } from 'zustand';

type AgentStatus = 'AVAILABLE' | 'BUSY' | 'BREAK' | 'OFFLINE' | 'WRAP_UP';

interface AgentState {
  status: AgentStatus;
  agentId: string | null;
  socketConnected: boolean;
  activeCalls: number;
  setStatus: (status: AgentStatus) => void;
  setSocketConnected: (connected: boolean) => void;
  incrementActiveCalls: () => void;
  decrementActiveCalls: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  status: 'OFFLINE',
  agentId: null,
  socketConnected: false,
  activeCalls: 0,
  setStatus: (status) => set({ status }),
  setSocketConnected: (connected) => set({ socketConnected: connected }),
  incrementActiveCalls: () => set((state) => ({ activeCalls: state.activeCalls + 1 })),
  decrementActiveCalls: () => set((state) => ({ activeCalls: Math.max(0, state.activeCalls - 1) })),
}));
