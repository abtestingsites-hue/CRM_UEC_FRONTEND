const fs = require('fs');
const file = 'd:/CRM/Frontend/src/app/calendar/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda' | 'timeline'>('month');",
  "const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda' | 'timeline'>('week');"
);

content = content.replace(
  /const fetchEvents = async \(\) => {[\s\S]*?try {[\s\S]*?const token = localStorage.getItem\('paramantra_access_token'\);[\s\S]*?const res = await apiFetch\(`\/calendar`, {[\s\S]*?headers: { Authorization: `Bearer \$\{token\}` },[\s\S]*?}\);[\s\S]*?if \(res\.ok\) {/m,
  `const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const start = new Date(currentDate);
      start.setDate(1);
      const end = new Date(start);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      const res = await apiFetch(\`/api/v1/appointments/calendar?startDate=\${start.toISOString()}&endDate=\${end.toISOString()}\`);
      if (res.ok) {`
);

content = content.replace(
  /useEffect\(\(\) => {\s*fetchEvents\(\);\s*fetchCustomers\(\);\s*}, \[\]\);/g,
  `useEffect(() => {\n    fetchEvents();\n    fetchCustomers();\n  }, [currentDate]);`
);

content = content.replace(
  /const handleCreateEvent = async \(data: any\) => {[\s\S]*?try {[\s\S]*?const token = localStorage.getItem\('paramantra_access_token'\);[\s\S]*?const res = await apiFetch\(`\/calendar`, {[\s\S]*?method: 'POST',[\s\S]*?headers: {[\s\S]*?'Content-Type': 'application\/json',[\s\S]*?Authorization: `Bearer \$\{token\}`,[\s\S]*?},[\s\S]*?body: JSON.stringify\(data\),[\s\S]*?}\);/m,
  `const handleCreateEvent = async (data: any) => {
    try {
      const res = await apiFetch(\`/api/v1/appointments\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          duration: Math.max(30, Math.floor((new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 60000)),
        }),
      });`
);

content = content.replace(
  /<div key=\{evt\.id\} className=\{`text-\[10px\] border p-2\.5 rounded-lg flex flex-col gap-1\.5 font-bold \$\{getTypeStyle\(evt\.type\)\}`\}>\s*<span className="truncate">\{evt\.title\}<\/span>\s*<span className="text-\[8px\] opacity-80 flex items-center gap-0\.5"><Clock className="w-2\.5 h-2\.5" \/> \{new Date\(evt\.startTime\)\.toLocaleTimeString\(\[\], \{ hour: '2-digit', minute: '2-digit' \}\)\}<\/span>\s*<\/div>/g,
  `<div key={evt.id} className={\`text-[10px] border p-2.5 rounded-lg flex flex-col gap-1.5 font-bold \${getTypeStyle(evt.type)}\`}>
     <span className="truncate text-[9px] text-white/50">{evt.bookingId || ''}</span>
     <span className="truncate">{evt.title}</span>
     <span className="truncate text-[9px]">{evt.customer?.name || evt.lead?.customerName || 'No Patient Linked'}</span>
     <span className="text-[8px] opacity-80 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {evt.status}</span>
   </div>`
);

// We should also replace the `user` dependency that was missing if we use it, but we can just let it be.
fs.writeFileSync(file, content);
console.log('Updated Calendar');
