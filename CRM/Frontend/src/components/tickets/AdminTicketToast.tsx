"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/providers/SocketProvider";
import { useAuthStore } from "@/store/authStore";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, X } from "lucide-react";

export function AdminTicketToast() {
  const { socket } = useSocket();
  const { user } = useAuthStore();
  const [ticketAlerts, setTicketAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!socket || !user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) return;

    const handleAlert = (ticket: any) => {
      setTicketAlerts(prev => [...prev, ticket]);
      
      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        setTicketAlerts(prev => prev.filter(t => t.id !== ticket.id));
      }, 6000);
    };

    socket.on('admin_ticket_alert', handleAlert);
    
    return () => {
      socket.off('admin_ticket_alert', handleAlert);
    };
  }, [socket, user]);

  if (ticketAlerts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {ticketAlerts.map(ticket => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className={`p-4 rounded-xl border shadow-2xl flex gap-3 w-80 pointer-events-auto backdrop-blur-md ${
              ticket.priority === 'HIGH' || ticket.priority === 'EMERGENCY' 
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-50' 
                : 'bg-[#111]/90 border-[#333] text-white'
            }`}
          >
            <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${ticket.priority === 'HIGH' || ticket.priority === 'EMERGENCY' ? 'text-rose-500 animate-pulse' : 'text-primary'}`} />
            <div className="flex-1 overflow-hidden">
              <h4 className="font-bold text-sm">
                {ticket.priority === 'HIGH' || ticket.priority === 'EMERGENCY' ? 'URGENT: ' : 'New '} 
                Ticket Assigned
              </h4>
              <p className="text-xs mt-1 opacity-90 truncate">
                <span className="font-semibold text-white">Dept:</span> {ticket.category}
              </p>
              {ticket.resolution && (
                <p className="text-xs mt-1 opacity-70 truncate line-clamp-2 break-words">
                  {ticket.resolution}
                </p>
              )}
            </div>
            <button 
              onClick={() => setTicketAlerts(prev => prev.filter(t => t.id !== ticket.id))}
              className="text-slate-400 hover:text-white h-fit"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
