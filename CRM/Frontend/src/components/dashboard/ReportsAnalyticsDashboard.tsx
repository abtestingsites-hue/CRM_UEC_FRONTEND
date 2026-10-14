import React, { useState } from 'react';
import { Download, FileSpreadsheet, Table, CalendarDays, Mail, Printer } from 'lucide-react';
import { WidgetWrapper } from './WidgetWrapper';
import { ChartWidget } from './ChartWidget';

export function ReportsAnalyticsDashboard() {
  const [selectedReportType, setSelectedReportType] = useState('lead_report');
  const [generatedReportData, setGeneratedReportData] = useState<any[]>([]);
  const [reportChartType, setReportChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [cronExpression, setCronExpression] = useState('0 9 * * 1');

  const handleGenerateReport = () => {
    switch (selectedReportType) {
      case 'lead_report':
        setGeneratedReportData([
          { 'Lead ID': 'L-102', Name: 'Vipin Kumar', Phone: '98452 11029', Status: 'Assigned', Source: 'Google Search' },
          { 'Lead ID': 'L-103', Name: 'Aditya Sen', Phone: '98402 33491', Status: 'Contacted', Source: 'Facebook Campaign' },
          { 'Lead ID': 'L-104', Name: 'Karan Sharma', Phone: '91204 44589', Status: 'Won', Source: 'Live Chat Support' },
        ]);
        break;
      case 'customer_report':
        setGeneratedReportData([
          { 'Customer ID': 'C-801', Name: 'Raghavan Pillai', Phone: '91204 88390', ActiveSince: '2025-05-12', Org: 'UEC Health' },
          { 'Customer ID': 'C-802', Name: 'Narayana Swamy', Phone: '98452 88491', ActiveSince: '2026-01-20', Org: 'Senior Care Corp' },
        ]);
        break;
      case 'call_report':
        setGeneratedReportData([
          { 'Call ID': 'CALL-840', Caller: 'Raghav', Recipient: 'Vipin Kumar', Duration: '4m 12s', Status: 'Completed' },
          { 'Call ID': 'CALL-841', Caller: 'Raghav', Recipient: 'Aditya Sen', Duration: '1m 45s', Status: 'No Answer' },
        ]);
        break;
      default:
        setGeneratedReportData([
          { Key: 'Metric A', Value: 120, Share: '40%' },
          { Key: 'Metric B', Value: 95, Share: '30%' },
          { Key: 'Metric C', Value: 85, Share: '30%' },
        ]);
    }
  };

  const handleExportCSV = () => {
    if (generatedReportData.length === 0) return;
    const headers = Object.keys(generatedReportData[0]).join(',');
    const rows = generatedReportData.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_${selectedReportType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#0b0b0b] border border-[#1e1e1e] rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-4">
        <div>
          <h2 className="text-md font-bold flex items-center gap-2"><FileSpreadsheet className="text-orange-500 w-5 h-5" /> Analytics Center</h2>
          <p className="text-xs text-slate-500 mt-1">Configure parameters, schedule reports, and display charting breakdowns.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsScheduleOpen(true)}
            className="px-3 py-1.5 bg-[#141414] hover:bg-[#202020] border border-[#222] rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all"
          >
            Schedule Report
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#0e0e0e] border border-[#1c1c1c] p-4 rounded-xl items-end">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Select Report Type</span>
          <select 
            value={selectedReportType} 
            onChange={(e) => {
              setSelectedReportType(e.target.value);
              setGeneratedReportData([]);
            }}
            className="bg-[#141414] border border-[#222] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500 w-full"
          >
            <option value="lead_report">Lead Reports</option>
            <option value="customer_report">Customer Reports</option>
            <option value="call_report">Call Reports</option>
          </select>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Chart Type Preview</span>
          <select 
            value={reportChartType} 
            onChange={(e) => setReportChartType(e.target.value as any)}
            className="bg-[#141414] border border-[#222] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500 w-full"
          >
            <option value="bar">Bar Chart View</option>
            <option value="line">Line Chart View</option>
            <option value="pie">Pie Chart View</option>
          </select>
        </div>

        <button 
          onClick={handleGenerateReport}
          className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(234,88,12,0.1)] transition-all h-9"
        >
          <Table className="w-3.5 h-3.5" />
          <span>Generate Report</span>
        </button>
      </div>

      {/* Data and Preview charts */}
      {generatedReportData.length > 0 ? (
        <div className="space-y-6">
          <div className="h-[240px]">
            <WidgetWrapper title="Analytics Preview Chart">
              <ChartWidget 
                type={reportChartType} 
                data={generatedReportData.map((row, idx) => ({
                  name: row.Name || row.Caller || row.Number || row.Subject || row.Title || row.User || row.City || row.Task || `Item ${idx}`,
                  value: Number(row.Duration?.replace(/[^\d]/g, '') || row.Gross?.replace(/[^\d]/g, '') || row.Value || row.CustomerCount || row.Spend?.replace(/[^\d]/g, '') || row.Accuracy?.replace(/[^\d]/g, '') || 5)
                }))} 
              />
            </WidgetWrapper>
          </div>

          <div className="space-y-4">
            <div className="flex justify-end">
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] hover:bg-[#202020] border border-[#222] rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>
            <div className="border border-[#1e1e1e] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#121212] border-b border-[#1c1c1c] text-slate-400 font-bold uppercase tracking-wider">
                    {Object.keys(generatedReportData[0]).map(key => (
                      <th key={key} className="p-3 font-semibold">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1c1c]/50">
                  {generatedReportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#121212]/30 transition-colors text-slate-300">
                      {Object.values(row).map((val: any, cellIdx) => (
                        <td key={cellIdx} className="p-3 font-medium">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-[#0c0c0c] border border-dashed border-[#1c1c1c] rounded-xl text-slate-500 text-xs">
          Click **Generate Report** to pull real-time database logs based on parameters.
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0b0b0b] border border-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#1e1e1e]">
              <h2 className="text-md font-bold text-white">Schedule Report Dispatch</h2>
            </div>
            <div className="p-6 space-y-4">
              <input 
                type="text" 
                value={cronExpression} 
                onChange={(e) => setCronExpression(e.target.value)}
                className="w-full bg-[#141414] border border-[#262626] focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-white outline-none" 
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsScheduleOpen(false)} className="px-4 py-2 bg-[#141414] text-white rounded-lg text-xs">Cancel</button>
                <button type="button" onClick={() => setIsScheduleOpen(false)} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
