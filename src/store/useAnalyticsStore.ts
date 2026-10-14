import { create } from 'zustand';

interface AnalyticsState {
  metrics: {
    activeCalls: number;
    waitingQueue: number;
    averageWaitTime: string;
    slaPercent: number;
    missedCalls: number;
    agentOccupancy: number;
  };
  setMetrics: (metrics: any) => void;
  updateMetric: (key: string, value: any) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  metrics: {
    activeCalls: 0,
    waitingQueue: 0,
    averageWaitTime: '0m 00s',
    slaPercent: 100,
    missedCalls: 0,
    agentOccupancy: 0,
  },
  setMetrics: (metrics) => set({ metrics }),
  updateMetric: (key, value) => set((state) => ({
    metrics: { ...state.metrics, [key]: value }
  })),
}));
