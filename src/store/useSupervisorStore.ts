import { create } from 'zustand';

interface SupervisorState {
  activeMonitors: string[];
  slaAlerts: any[];
  addAlert: (alert: any) => void;
}

export const useSupervisorStore = create<SupervisorState>((set) => ({
  activeMonitors: [],
  slaAlerts: [],
  addAlert: (alert) => set((state) => ({ slaAlerts: [...state.slaAlerts, alert] })),
}));
