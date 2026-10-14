import React, { useState } from 'react';
import { Maximize2, Download, Table, X } from 'lucide-react';

interface WidgetWrapperProps {
  title: string;
  children: React.ReactNode;
  dataForExport?: any[];
}

export function WidgetWrapper({ title, children, dataForExport }: WidgetWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDrillDown, setShowDrillDown] = useState(false);

  const exportToCSV = () => {
    if (!dataForExport || dataForExport.length === 0) {
      alert("No data available to export");
      return;
    }
    const headers = Object.keys(dataForExport[0]).join(',');
    const rows = dataForExport.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="bg-[#0b0b0b] border border-[#1e1e1e] rounded-2xl p-5 flex flex-col h-[320px] transition-all hover:border-[#2b2b2b] relative group">
        {/* Header Tools */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-sm font-bold text-slate-200 tracking-wide">{title}</h3>
          <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setShowDrillDown(true)} 
              title="Drill-down details"
              className="p-2 hover:bg-[#1a1a1a] rounded-lg text-slate-400 hover:text-white"
            >
              <Table className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>
            <button 
              onClick={exportToCSV} 
              title="Export CSV"
              className="p-2 hover:bg-[#1a1a1a] rounded-lg text-slate-400 hover:text-white"
            >
              <Download className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>
            <button 
              onClick={() => setIsFullscreen(true)} 
              title="Maximize"
              className="p-2 hover:bg-[#1a1a1a] rounded-lg text-slate-400 hover:text-white"
            >
              <Maximize2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 relative text-white">
          {children}
        </div>
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8">
          <div className="w-full h-full bg-[#0b0b0b] border border-[#1e1e1e] rounded-3xl p-5 md:p-6 flex flex-col relative max-w-6xl max-h-[85vh] text-white">
            <button 
              onClick={() => setIsFullscreen(false)}
              className="absolute top-5 right-5 p-2 bg-[#141414] hover:bg-[#202020] border border-[#262626] rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-white mb-6 pr-12">{title} (Expanded)</h2>
            <div className="flex-1 min-h-0">
              {children}
            </div>
          </div>
        </div>
      )}

      {/* Drill-down Drawer Sheet */}
      {showDrillDown && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-[#0b0b0b] border-l border-[#1e1e1e] h-full p-5 md:p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 text-white">
            <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">{title} - Detailed Records</h3>
                <p className="text-xs text-slate-500 mt-1">Granular breakdown of records linked to this KPI</p>
              </div>
              <button 
                onClick={() => setShowDrillDown(false)}
                className="p-2 bg-[#141414] hover:bg-[#202020] border border-[#262626] rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {dataForExport && dataForExport.length > 0 ? (
                <div className="border border-[#1c1c1c] rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#121212] border-b border-[#1c1c1c] text-slate-400 font-bold uppercase tracking-wider">
                        {Object.keys(dataForExport[0]).map(key => (
                          <th key={key} className="p-3 font-semibold">{key.replace(/([A-Z])/g, ' $1')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1c1c1c]/50">
                      {dataForExport.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#121212]/30 transition-colors text-slate-300">
                          {Object.values(row).map((val: any, cellIdx) => (
                            <td key={cellIdx} className="p-3 font-medium truncate max-w-[180px]">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-500 text-xs">No details records loaded for this widget.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
