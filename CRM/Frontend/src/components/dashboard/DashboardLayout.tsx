import React, { useEffect, useState } from 'react';
import { useDashboardStore } from '@/store/dashboardStore';
import { 
  Briefcase, DollarSign, Users, Shield, Phone, MessageSquare, Heart, 
  Zap, Cpu, Calendar, TrendingUp, Compass, Activity, FileText, Download, Sliders, Table, X,
  Clock, AlertCircle, Play, CheckCircle, Bell, Volume2, Sparkles, Filter, Settings, FileSpreadsheet
} from 'lucide-react';
import { KPIWidget } from './KPIWidget';
import { WidgetWrapper } from './WidgetWrapper';
import { ChartWidget } from './ChartWidget';
import { GeoWidget } from './GeoWidget';
import { BuilderPanel } from './BuilderPanel';

export function DashboardLayout() {
  const { 
    activeType, setActiveType, metrics, fetchMetrics, isLoading,
    startDate, endDate, department, team, agentId, setFilters
  } = useDashboardStore();

  const [localSearch, setLocalSearch] = useState('');
  const [selectedReportType, setSelectedReportType] = useState('lead_report');
  const [generatedReportData, setGeneratedReportData] = useState<any[]>([]);
  const [reportChartType, setReportChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleCron, setScheduleCron] = useState('0 9 * * 1'); // Monday 9am

  // Real-time Event Stream state for Contact Center
  const [liveEvents, setLiveEvents] = useState<any[]>([
    { time: '11:42:05 PM', msg: 'Call from Customer care lines routed to Raghav', type: 'INFO' },
    { time: '11:43:12 PM', msg: 'Outbound queue load check - SLA 98.4%', type: 'SUCCESS' },
    { time: '11:44:02 PM', msg: 'Supervisor comment logged on Vipin Kumar profile', type: 'COMMENT' },
  ]);

  useEffect(() => {
    fetchMetrics();
    // Simulate real-time websocket event log stream
    const interval = setInterval(() => {
      const msgs = [
        'Call connected to extension 102',
        'Incoming WhatsApp notification queued for sales review',
        'Lead claimed by Raghav',
        'IVR response completed for customer care caller',
        'SLA warning resolved for queue #2',
      ];
      const types = ['INFO', 'SUCCESS', 'SUCCESS', 'INFO', 'WARN'];
      const randomIdx = Math.floor(Math.random() * msgs.length);
      const timeStr = new Date().toLocaleTimeString();
      setLiveEvents(prev => [
        { time: timeStr, msg: msgs[randomIdx], type: types[randomIdx] },
        ...prev.slice(0, 5)
      ]);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const dashboards = [
    { type: 'executive', label: 'Executive Dashboard', icon: Briefcase },
    { type: 'sales_lead', label: 'Sales & Lead Dashboard', icon: DollarSign },
    { type: 'agent_performance', label: 'Agent Performance', icon: Users },
    { type: 'omnichannel', label: 'Omnichannel Dashboard', icon: MessageSquare },
    { type: 'contact_center', label: 'Contact Center Live', icon: Phone },
    { type: 'customer_experience', label: 'Customer Experience', icon: Heart },
    { type: 'ai_insights', label: 'AI Insights Dashboard', icon: Cpu },
    { type: 'reports', label: 'Reports & Analytics', icon: FileText },
    { type: 'custom', label: 'Custom Builder', icon: Sliders },
  ];

  const filteredDashboards = dashboards.filter(d => 
    d.label.toLowerCase().includes(localSearch.toLowerCase())
  );

  const handleExportPDF = () => {
    window.print();
  };

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
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full bg-[#F8FAFC] text-[#0F172A] md:bg-[#050505] md:text-white">
      {/* 1. Left Selector Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex w-64 border-r border-[#1e1e1e] bg-[#090909] flex-col p-4 shrink-0">
        <input 
          type="text" 
          placeholder="Search Presets..." 
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full bg-[#141414] border border-[#222] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-orange-500 mb-4"
        />
        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
          {filteredDashboards.map((d) => (
            <button
              key={d.type}
              onClick={() => setActiveType(d.type)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all border ${
                activeType === d.type 
                  ? 'bg-orange-600/15 border-orange-500/20 text-orange-500 shadow-lg shadow-orange-500/5' 
                  : 'text-slate-400 hover:bg-[#121212] hover:text-white border-transparent'
              }`}
            >
              <d.icon className="w-3.5 h-3.5" />
              <span>{d.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* 2. Main Content Board */}
      <main className="flex-1 flex flex-col overflow-hidden bg-transparent text-white">
        {/* Mobile Preset Selector - Only visible on mobile */}
        <div className="block md:hidden p-4 pb-2 border-b border-[#1e1e1e] bg-[#0b0b0b] shrink-0">
          <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-1">Select Preset Dashboard</label>
          <select 
            value={activeType} 
            onChange={(e) => setActiveType(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0F172A] outline-none shadow-sm cursor-pointer"
          >
            {dashboards.map((d) => (
              <option key={d.type} value={d.type}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Top Filtration Dock */}
        <header className="border-b border-[#1e1e1e] bg-[#090909] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* Start Date */}
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Start Date</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setFilters({ startDate: e.target.value })}
                className="bg-[#141414] border border-[#222] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500 shadow-none min-h-[40px] md:min-h-0"
              />
            </div>
            {/* End Date */}
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">End Date</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setFilters({ endDate: e.target.value })}
                className="bg-[#141414] border border-[#222] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500 shadow-none min-h-[40px] md:min-h-0"
              />
            </div>
            {/* Dept */}
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Department</span>
              <select 
                value={department}
                onChange={(e) => setFilters({ department: e.target.value })}
                className="bg-[#141414] border border-[#222] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500 shadow-none min-h-[40px] md:min-h-0"
              >
                <option value="All">All Departments</option>
                <option value="Sales">Sales Division</option>
                <option value="Care">Care Support</option>
                <option value="Marketing">Marketing Hub</option>
              </select>
            </div>
          </div>
          <button 
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[48px] md:min-h-0 bg-[#141414] hover:bg-[#202020] border border-[#222] rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all self-stretch md:self-auto shadow-none"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF Report</span>
          </button>
        </header>

        {/* Viewport content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative bg-[#050505]">
          {isLoading && (
            <div className="absolute inset-0 bg-[#050505]/40 flex items-center justify-center text-xs text-slate-500 z-10">
              <span className="w-5 h-5 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mr-2.5"></span>
              Loading dashboard metrics...
            </div>
          )}

          {/* DYNAMIC RENDERING BLOCK FOR CUSTOM VIEWS */}
          {activeType === 'custom' && <BuilderPanel />}

          {/* 1. EXECUTIVE DASHBOARD */}
          {activeType === 'executive' && (
            <div className="space-y-6">
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPIWidget label="Total Customers" value={metrics.kpis?.[0]?.value || '184'} change="+4.3%" isPositive={true} />
                <KPIWidget label="Active Leads Pool" value={metrics.kpis?.[1]?.value || '12'} change="+12.4%" isPositive={true} />
                <KPIWidget label="Conversion Rate" value={metrics.kpis?.[2]?.value || '42.5%'} change="+3.1%" isPositive={true} />
                <KPIWidget label="Pipeline Value" value={metrics.kpis?.[3]?.value || '$840,250'} change="+14.2%" isPositive={true} />
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <WidgetWrapper title="Revenue growth & Trend Analysis" dataForExport={metrics.charts?.revenueTrend}>
                    <ChartWidget type="line" data={metrics.charts?.revenueTrend || []} />
                  </WidgetWrapper>
                </div>
                <div>
                  <WidgetWrapper title="Acquisition Pipeline funnel" dataForExport={metrics.charts?.salesFunnel}>
                    <ChartWidget type="funnel" data={metrics.charts?.salesFunnel || []} />
                  </WidgetWrapper>
                </div>
              </div>

              {/* AI & Operations grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-[#E2E8F0] md:bg-[#0b0b0b] md:border-[#1e1e1e] p-5 rounded-2xl shadow-sm md:shadow-none text-[#0F172A] md:text-white">
                  <h3 className="text-sm font-bold text-[#64748B] md:text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-orange-500" /> AI Executive Insight</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 border border-blue-100 md:bg-orange-950/10 md:border-orange-500/20 rounded-xl">
                      <p className="text-xs text-[#0F172A] md:text-slate-300 font-medium">Sales Pipeline velocity has improved by **14%** following optimized agent occupancy allocations in support channels.</p>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-100 md:bg-emerald-950/10 md:border-emerald-500/20 rounded-xl">
                      <p className="text-xs text-[#0F172A] md:text-slate-300 font-medium">Monthly growth targets are on track with a positive CSAT index forecast of **88.5%**.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-[#E2E8F0] md:bg-[#0b0b0b] md:border-[#1e1e1e] p-5 rounded-2xl shadow-sm md:shadow-none text-[#0F172A] md:text-white">
                  <h3 className="text-sm font-bold text-[#64748B] md:text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-1.5"><Bell className="w-4 h-4 text-orange-500" /> Recent Business Activities</h3>
                  <div className="space-y-2.5">
                    {liveEvents.map((e, i) => (
                      <div key={i} className="flex justify-between items-center text-xs border-b border-[#E2E8F0] md:border-b-[#1c1c1c]/40 pb-2">
                        <span className="text-[#64748B] md:text-slate-400 font-medium">{e.msg}</span>
                        <span className="text-[10px] text-[#94A3B8] md:text-slate-600">{e.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. SALES & LEAD DASHBOARD */}
          {activeType === 'sales_lead' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPIWidget label="New Leads" value={metrics.kpis?.[0]?.value || '12'} change="+12.4%" isPositive={true} />
                <KPIWidget label="Qualified Leads" value={metrics.kpis?.[1]?.value || '5'} change="+11.2%" isPositive={true} />
                <KPIWidget label="Won Deals" value={metrics.kpis?.[2]?.value || '8'} change="+9.4%" isPositive={true} />
                <KPIWidget label="Forecasted Revenue" value={metrics.kpis?.[5]?.value || '$950,000'} change="On Track" isPositive={true} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <WidgetWrapper title="Lead Generation Source Share" dataForExport={metrics.charts?.sourceShare}>
                    <ChartWidget type="pie" data={metrics.charts?.sourceShare || []} />
                  </WidgetWrapper>
                </div>
                <div className="lg:col-span-2">
                  <WidgetWrapper title="Weekly Pipeline Velocity" dataForExport={metrics.charts?.pipelineTrend}>
                    <ChartWidget type="bar" data={metrics.charts?.pipelineTrend || []} />
                  </WidgetWrapper>
                </div>
              </div>
            </div>
          )}

          {/* 3. AGENT PERFORMANCE DASHBOARD */}
          {activeType === 'agent_performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPIWidget label="Total Calls Handled" value="420" change="+12.4%" isPositive={true} />
                <KPIWidget label="Avg Talk Time" value="2m 45s" change="Optimal" isPositive={true} />
                <KPIWidget label="SLA Compliance" value="96.2%" change="+1.5%" isPositive={true} />
                <KPIWidget label="Occupancy Rate" value="84.2%" change="+1.5%" isPositive={true} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-[#E2E8F0] md:bg-[#0b0b0b] md:border-[#1e1e1e] p-5 rounded-2xl text-[#0F172A] md:text-white shadow-sm md:shadow-none">
                  <h3 className="text-sm font-bold text-[#64748B] md:text-slate-400 mb-4 uppercase tracking-wider">Agent Performance Scorecard</h3>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] md:border-b-[#1c1c1c] text-[#64748B] md:text-slate-500">
                        <th className="pb-2">Agent Name</th>
                        <th className="pb-2 text-right">Talk Time</th>
                        <th className="pb-2 text-right">SLA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] md:divide-[#1c1c1c]/40">
                      <tr>
                        <td className="py-2.5 font-bold">Raghav</td>
                        <td className="py-2.5 text-right">2m 45s</td>
                        <td className="py-2.5 text-right text-emerald-600 md:text-emerald-400 font-bold">96.2%</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold">Agent Smith</td>
                        <td className="py-2.5 text-right">3m 12s</td>
                        <td className="py-2.5 text-right text-emerald-600 md:text-emerald-400 font-bold">94.8%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <WidgetWrapper title="Productivity Flow By Hours" dataForExport={metrics.charts?.callsPerHour}>
                  <ChartWidget type="line" data={metrics.charts?.callsPerHour || []} />
                </WidgetWrapper>
              </div>
            </div>
          )}

          {/* 4. OMNICHANNEL DASHBOARD */}
          {activeType === 'omnichannel' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPIWidget label="WhatsApp Messages" value="2,840" change="+14.2%" isPositive={true} />
                <KPIWidget label="Email Dispatched" value="850" change="+4.1%" isPositive={true} />
                <KPIWidget label="SMS Notifications" value="4,200" change="+22.4%" isPositive={true} />
                <KPIWidget label="Live Chats Handled" value="1,420" change="+18.4%" isPositive={true} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <WidgetWrapper title="Channel Utilization Distribution" dataForExport={metrics.charts?.sourceShare}>
                    <ChartWidget type="pie" data={metrics.charts?.sourceShare || []} />
                  </WidgetWrapper>
                </div>
                <div className="lg:col-span-2">
                  <WidgetWrapper title="Traffic Flow volume" dataForExport={metrics.charts?.pipelineTrend}>
                    <ChartWidget type="bar" data={metrics.charts?.pipelineTrend || []} />
                  </WidgetWrapper>
                </div>
              </div>
            </div>
          )}

          {/* 5. CONTACT CENTER DASHBOARD */}
          {activeType === 'contact_center' && (
            <div className="space-y-6">
              {/* Real-time stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-orange-600/10 border border-orange-500/20 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Live Active Calls</span>
                    <span className="text-3xl font-extrabold text-white block mt-1">4</span>
                  </div>
                  <Volume2 className="w-8 h-8 text-orange-500" />
                </div>
                <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Waiting in Queue</span>
                    <span className="text-3xl font-extrabold text-white block mt-1">2</span>
                  </div>
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
                <div className="p-4 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Available Agents</span>
                    <span className="text-3xl font-extrabold text-white block mt-1">6</span>
                  </div>
                  <Users className="w-8 h-8 text-emerald-500" />
                </div>
              </div>

              {/* Call monitor list */}
              <div className="bg-[#0b0b0b] border border-[#1e1e1e] p-5 rounded-2xl">
                <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-1.5"><Play className="w-4 h-4 text-orange-500" /> Live Agent Call Monitoring Panel</h3>
                <div className="divide-y divide-[#1c1c1c]/50">
                  <div className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="font-bold">Raghav</span>
                    </div>
                    <span className="text-slate-400">Call Connected (04:12 mins)</span>
                    <button className="px-2.5 py-1 bg-[#141414] hover:bg-[#202020] border border-[#222] rounded-lg font-bold text-[10px] uppercase text-orange-500">Listen</button>
                  </div>
                  <div className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span className="font-bold">Agent Smith</span>
                    </div>
                    <span className="text-slate-400">Available</span>
                    <span className="text-slate-600 text-[10px]">Standby</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. CUSTOMER EXPERIENCE DASHBOARD */}
          {activeType === 'customer_experience' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPIWidget label="NPS (Net Promoter)" value="72" change="+4" isPositive={true} />
                <KPIWidget label="CSAT Index" value="88.5%" change="+2.1%" isPositive={true} />
                <KPIWidget label="Retention Rate" value="94.2%" change="+0.8%" isPositive={true} />
                <KPIWidget label="Churn Risk Index" value="5.8%" change="-0.8%" isPositive={true} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <WidgetWrapper title="Customer Sentiments Breakdown" dataForExport={metrics.charts?.sourceShare}>
                    <ChartWidget type="pie" data={metrics.charts?.sourceShare || []} />
                  </WidgetWrapper>
                </div>
                <div className="lg:col-span-2">
                  <WidgetWrapper title="Customer retention trend" dataForExport={metrics.charts?.revenueTrend}>
                    <ChartWidget type="line" data={metrics.charts?.revenueTrend || []} />
                  </WidgetWrapper>
                </div>
              </div>
            </div>
          )}

          {/* 7. AI INSIGHTS DASHBOARD */}
          {activeType === 'ai_insights' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPIWidget label="AI Summaries" value="840" change="100% Auto" isPositive={true} />
                <KPIWidget label="AI Sentiment Accuracy" value="94.2%" change="+1.5%" isPositive={true} />
                <KPIWidget label="AI Time Saved" value="142 Hrs" change="High ROI" isPositive={true} />
                <KPIWidget label="AI Lead Scores" value="245" change="Synced" isPositive={true} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <WidgetWrapper title="AI usage analytics trend" dataForExport={metrics.charts?.pipelineTrend}>
                    <ChartWidget type="bar" data={metrics.charts?.pipelineTrend || []} />
                  </WidgetWrapper>
                </div>
                <div className="bg-[#0b0b0b] border border-[#1e1e1e] p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-orange-500" /> AI Recommendations</h3>
                    <p className="text-xs text-slate-300">Customer care queues should trigger an SMS template callback alert when average wait times exceed 20 seconds.</p>
                  </div>
                  <div className="mt-4 p-3 bg-orange-950/10 border border-orange-500/20 rounded-xl">
                    <span className="text-[10px] font-bold text-orange-500 block uppercase tracking-wider">Projected Impact</span>
                    <span className="text-xs text-slate-400 block mt-0.5">Increases FCR by +4.2%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. REPORTS & ANALYTICS (REPORT CENTER) */}
          {activeType === 'reports' && (
            <div className="bg-[#0b0b0b] border border-[#1e1e1e] rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-4">
                <div>
                  <h2 className="text-md font-bold flex items-center gap-2"><FileSpreadsheet className="text-orange-500 w-5 h-5" /> Analytics Center</h2>
                  <p className="text-xs text-slate-500 mt-1">Configure parameters, schedule reports, and display charting breakdowns.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsScheduleModalOpen(true)}
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
                    <option value="whatsapp_report">WhatsApp Reports</option>
                    <option value="email_report">Email Reports</option>
                    <option value="ticket_report">Ticket Reports</option>
                    <option value="agent_report">Agent Reports</option>
                    <option value="campaign_report">Campaign Reports</option>
                    <option value="revenue_report">Revenue Reports</option>
                    <option value="user_activity_report">User Activity Reports</option>
                    <option value="geolocation_report">Geolocation Reports</option>
                    <option value="ai_report">AI Performance Reports</option>
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
                  {/* Custom chart preview block */}
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

                  {/* Table records */}
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
            </div>
          )}
        </div>
      </main>

      {/* SCHEDULE REPORT DIALOG MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0b0b0b] border border-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#1e1e1e]">
              <h2 className="text-md font-bold text-white">Schedule Report Dispatch</h2>
              <p className="text-xs text-slate-500 mt-1">Configure automated dispatch frequency (cron notation).</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cron Schedule Pattern</label>
                <input 
                  type="text" 
                  value={scheduleCron} 
                  onChange={(e) => setScheduleCron(e.target.value)}
                  placeholder="e.g. 0 9 * * 1" 
                  className="w-full bg-[#141414] border border-[#262626] focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-white outline-none" 
                />
                <span className="text-[9px] text-slate-500">Defaults to: Every Monday at 9:00 AM</span>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#1e1e1e]">
                <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="px-4 py-2 bg-[#141414] border border-[#262626] text-white hover:bg-[#202020] rounded-lg text-xs font-semibold">
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsScheduleModalOpen(false);
                    alert(`Report dispatch successfully scheduled for: ${scheduleCron}`);
                  }} 
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(234,88,12,0.1)]"
                >
                  Save Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
