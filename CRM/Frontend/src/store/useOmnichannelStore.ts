import { create } from 'zustand';

interface Message {
  id: string;
  content: string;
  channel: 'WhatsApp' | 'Instagram' | 'Email';
}

interface OmnichannelState {
  activeThreads: any[];
  messages: Message[];
  addMessage: (msg: Message) => void;
}

export const useOmnichannelStore = create<OmnichannelState>((set) => ({
  activeThreads: [],
  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
}));
