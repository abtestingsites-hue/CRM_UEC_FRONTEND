import React from 'react';

export const Customer360: React.FC<{ customerId: string | null }> = ({ customerId }) => {
  if (!customerId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No active customer profile selected.
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 bg-gray-800/50">
        <h2 className="text-xl font-bold text-white">Customer 360</h2>
        <p className="text-sm text-gray-400">ID: {customerId}</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Active Services */}
        <section>
          <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3 font-semibold">Active Services</h3>
          <div className="bg-gray-700/30 rounded-lg p-3">
            <p className="text-white font-medium">Premium Mobility Plan</p>
            <p className="text-xs text-green-400">Active until Dec 2026</p>
          </div>
        </section>

        {/* Interaction History */}
        <section>
          <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3 font-semibold">Timeline</h3>
          <div className="space-y-4">
            <div className="relative pl-4 border-l-2 border-blue-500">
              <span className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-blue-500"></span>
              <p className="text-sm font-medium text-white">Call with Support</p>
              <p className="text-xs text-gray-400">Yesterday at 14:30</p>
              <p className="text-sm text-gray-300 mt-1 italic">"Customer requested a change in billing cycle."</p>
            </div>
            
            <div className="relative pl-4 border-l-2 border-green-500">
              <span className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-green-500"></span>
              <p className="text-sm font-medium text-white">WhatsApp Message</p>
              <p className="text-xs text-gray-400">Oct 12 at 09:15</p>
            </div>
          </div>
        </section>

        {/* AI Summaries */}
        <section>
          <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-3 font-semibold">Latest AI Insights</h3>
          <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-purple-500 text-xs px-2 py-0.5 rounded font-bold text-white">GEMINI</span>
              <span className="text-xs text-yellow-400 font-bold">ESCALATION RISK: LOW</span>
            </div>
            <p className="text-sm text-gray-300">Customer is generally satisfied but had trouble finding the invoice portal.</p>
          </div>
        </section>
      </div>
    </div>
  );
};
