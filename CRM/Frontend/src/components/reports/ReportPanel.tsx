import React, { useState, useEffect } from 'react';
import { FileText, Download, Mail, Loader2, FileCheck } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api';

interface ReportPanelProps {
  leadId: string;
}

export const ReportPanel: React.FC<ReportPanelProps> = ({ leadId }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailing, setEmailing] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  useEffect(() => {
    if (leadId) {
      fetchLatestReport();
    }
  }, [leadId]);

  const fetchLatestReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('paramantra_access_token');
      const res = await axios.get(`${API_BASE_URL}/leads/${leadId}/report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        setReport(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('paramantra_access_token');
      const res = await axios.post(`${API_BASE_URL}/leads/${leadId}/report/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReport(res.data);
    } catch (e) {
      console.error(e);
      alert('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = () => {
    const token = localStorage.getItem('paramantra_access_token');
    window.open(`${API_BASE_URL}/leads/report/${report.id}/export/pdf?access_token=${token}`, '_blank');
  };

  const exportWord = () => {
    const token = localStorage.getItem('paramantra_access_token');
    window.open(`${API_BASE_URL}/leads/report/${report.id}/export/word?access_token=${token}`, '_blank');
  };

  const sendEmail = async () => {
    if (!emailTo) return alert('Enter an email address');
    try {
      setEmailing(true);
      const token = localStorage.getItem('paramantra_access_token');
      await axios.post(`${API_BASE_URL}/leads/report/${report.id}/email`, { emailTo }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (e) {
      alert('Failed to send email.');
    } finally {
      setEmailing(false);
    }
  };

  return (
    <div className="bg-[#111] border border-[#222] rounded-3xl w-full h-full flex flex-col shadow-sm relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#222] bg-[#1a1a1a]">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          AI Lead History Report
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0a]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p>Analyzing timeline & generating report...</p>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {Object.entries(report.content).map(([key, value]) => (
              <div key={key} className="bg-[#151515] p-5 rounded-xl border border-[#222]">
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {value as string}
                </p>
              </div>
            ))}
            <div className="text-xs text-slate-500 text-center">
              Report generated on {new Date(report.createdAt).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
            <FileCheck className="w-12 h-12 text-slate-600 mb-2" />
            <p>No report found for this lead.</p>
            <button 
              onClick={generateReport}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              Generate One-Click AI Report
            </button>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {report && !loading && (
        <div className="p-5 border-t border-[#222] bg-[#1a1a1a] flex flex-wrap items-center justify-between gap-4">
          <button 
            onClick={generateReport}
            className="text-sm text-blue-400 hover:text-blue-300 font-medium px-4 py-2 hover:bg-blue-500/10 rounded-lg transition"
          >
            Regenerate Report
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#111] border border-[#333] rounded-lg p-1 mr-2">
              <input aria-label="Manager Email Address" 
                type="email" 
                placeholder="manager@company.com" 
                className="bg-transparent text-sm text-white px-3 py-1.5 outline-none w-48 placeholder-slate-500"
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
              />
              <button 
                onClick={sendEmail}
                disabled={emailing}
                className="bg-[#222] hover:bg-[#333] text-white p-1.5 rounded-md transition flex items-center justify-center min-w-[32px]"
                title="Email Report"
              >
                {emailing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              </button>
            </div>

            <button 
              onClick={exportWord}
              className="flex items-center gap-2 bg-[#222] hover:bg-[#333] border border-[#444] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Download className="w-4 h-4" /> Word
            </button>
            <button 
              onClick={exportPdf}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
      )}
      
      {/* Toast */}
      {emailSuccess && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg font-medium animate-bounce z-50">
          Report emailed successfully!
        </div>
      )}
    </div>
  );
};
