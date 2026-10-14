import { create } from 'zustand';

interface QueueState {
  callsInQueue: number;
  emergencyAlerts: number;
  queues: any[];
  alerts: any[];
  setQueueData: (data: Partial<QueueState>) => void;
}

export const useQueueStore = create<QueueState>((set) => ({
  callsInQueue: 0,
  emergencyAlerts: 0,
  queues: [],
  alerts: [],
  setQueueData: (data) => set((state) => ({ ...state, ...data })),
}));
