import { create } from 'zustand';

interface CustomerState {
  activeCustomer: any | null;
  setActiveCustomer: (customer: any) => void;
  clearCustomer: () => void;
}

export const useCustomerStore = create<CustomerState>((set) => ({
  activeCustomer: null,
  setActiveCustomer: (customer) => set({ activeCustomer: customer }),
  clearCustomer: () => set({ activeCustomer: null }),
}));
