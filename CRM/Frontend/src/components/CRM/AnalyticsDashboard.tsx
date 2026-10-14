import React from 'react';

export const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">KPI Analytics (Gemini AI Insights)</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 uppercase text-sm">Avg Sentiment</h3>
          <p className="text-3xl font-bold text-green-400 mt-2">78% POSITIVE</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 uppercase text-sm">Escalation Rate</h3>
          <p className="text-3xl font-bold text-red-400 mt-2">12%</p>
        </div>
      </div>
    </div>
  );
};
