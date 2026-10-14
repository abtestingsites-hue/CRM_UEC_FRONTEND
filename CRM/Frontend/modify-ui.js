const fs = require('fs');
let file = fs.readFileSync('src/app/call-center/page.tsx', 'utf8');

// 1. Update state type
file = file.replace(/const \[activeTab, setActiveTab\] = useState\<'inbound' \| 'outbound'\>\('inbound'\);/, "const [activeTab, setActiveTab] = useState<'internal' | 'inbound' | 'outbound'>('internal');");

// 2. Add queuedCalls and missedCalls to useCallStore destructuring
file = file.replace(/const \{ setActiveCall \} = useCallStore\(\);/, "const { setActiveCall, queuedCalls, missedCalls, fetchDashboardCalls } = useCallStore();");

// 3. Update tabs rendering
const oldTabs = `        <div className="flex bg-[#111] border border-[#222] rounded-lg p-1">
          <button
            onClick={() => setActiveTab('inbound')}
            className={\`px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors \${activeTab === 'inbound' ? 'bg-[#222] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}\`}
          >
            <Phone className="w-4 h-4" /> Inbound
          </button>
          <button
            onClick={() => setActiveTab('outbound')}
            className={\`px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors \${activeTab === 'outbound' ? 'bg-[#222] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}\`}
          >
            <PhoneOutgoing className="w-4 h-4" /> Outbound
          </button>
        </div>`;

const newTabs = `        <div className="flex bg-[#111] border border-[#222] rounded-lg p-1">
          <button
            onClick={() => setActiveTab('inbound')}
            className={\`px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors \${activeTab === 'inbound' ? 'bg-[#222] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}\`}
          >
            <Phone className="w-4 h-4" /> Inbound Logs
          </button>
          <button
            onClick={() => setActiveTab('internal')}
            className={\`px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors \${activeTab === 'internal' ? 'bg-[#222] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}\`}
          >
            <Users className="w-4 h-4" /> Internal
          </button>
          <button
            onClick={() => setActiveTab('outbound')}
            className={\`px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors \${activeTab === 'outbound' ? 'bg-[#222] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}\`}
          >
            <PhoneOutgoing className="w-4 h-4" /> Outbound
          </button>
        </div>`;

file = file.replace(oldTabs, newTabs);

// 4. Update the condition for rendering Internal Directory
file = file.replace(/\{activeTab === 'inbound' \? \(/, "{activeTab === 'internal' ? (");

// 5. Add Inbound Logs section
const outboundSectionRegex = /          \) \: \(\n            <div className=\"flex flex-col items-center justify-center h-full text-center p-8\">[\s\S]*?<\/div>\n          \)}/m;

const match = file.match(outboundSectionRegex);
if (match) {
  const outboundContent = match[0].replace(') : (', ") : activeTab === 'outbound' ? (");
  const inboundLogsContent = `  ) : activeTab === 'inbound' ? (
            <div className="flex flex-col h-full">
              <div className="p-5 border-b border-[#222] bg-[#0a0a0a] flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Phone className="w-5 h-5 text-primary" /> Inbound Call Logs
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Recent queued and missed inbound calls</p>
                </div>
                <button onClick={() => fetchDashboardCalls()} className="bg-[#222] hover:bg-[#333] text-white text-xs px-3 py-1.5 rounded transition-colors">Refresh</button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
                
                {/* Queued Calls */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 mb-3">Currently Ringing / Queued</h3>
                  {(!queuedCalls || queuedCalls.length === 0) ? (
                    <div className="text-center p-6 bg-[#111] border border-[#222] rounded-xl text-slate-500 text-sm">No active inbound calls</div>
                  ) : (
                    <div className="space-y-3">
                      {queuedCalls.map((call: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-[#111] border border-[#222] rounded-xl hover:border-primary/50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                              <Phone className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">{call.customer?.name || 'Unknown Caller'}</h4>
                              <p className="text-xs text-slate-400">{call.customer?.phone || call.reason || 'Unknown Number'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold">RINGING</span>
                            <div className="text-xs text-slate-500 mt-1">{new Date(call.startedAt || call.createdAt).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Missed Calls */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 mb-3">Recent Missed Calls</h3>
                  {(!missedCalls || missedCalls.length === 0) ? (
                    <div className="text-center p-6 bg-[#111] border border-[#222] rounded-xl text-slate-500 text-sm">No recent missed calls</div>
                  ) : (
                    <div className="space-y-3">
                      {missedCalls.map((call: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-[#111] border border-rose-500/20 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center">
                              <Phone className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">{call.customer?.name || 'Unknown Caller'}</h4>
                              <p className="text-xs text-slate-400">{call.customer?.phone || call.reason || 'Unknown Number'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-1 bg-rose-500/20 text-rose-400 rounded text-xs font-bold">MISSED</span>
                            <div className="text-xs text-slate-500 mt-1">{new Date(call.startedAt || call.createdAt).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>\n` + outboundContent;
            
  file = file.replace(outboundSectionRegex, inboundLogsContent);
}

fs.writeFileSync('src/app/call-center/page.tsx', file);
