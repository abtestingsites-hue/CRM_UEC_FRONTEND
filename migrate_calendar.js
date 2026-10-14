const fs = require('fs');
const path = require('path');

const calPath = 'd:/CRM/Frontend/src/app/calendar/page.tsx';
const aptPath = 'd:/CRM/Frontend/src/app/appointments/page.tsx';

// 1. Read current calendar (which has the booking engine logic)
let calContent = fs.readFileSync(calPath, 'utf8');

// 2. Prepare the new Appointments page by modifying calContent
let newAptContent = calContent;
newAptContent = newAptContent.replace(
  /<h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">\s*<CalendarIcon className="text-orange-500 w-6 h-6" \/> Enterprise Scheduler\s*<\/h1>/g,
  `<h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
     <CalendarIcon className="text-orange-500 w-6 h-6" /> Appointment Management
   </h1>`
);
newAptContent = newAptContent.replace(
  /export default function CalendarPage\(\) \{/g,
  `export default function AppointmentsPage() {`
);

// Write to appointments page
fs.writeFileSync(aptPath, newAptContent);

// 3. Revert Calendar page to original logic
let revertedCalContent = fs.readFileSync(calPath, 'utf8');
revertedCalContent = revertedCalContent.replace(
  /const \[view, setView\] = useState<'month' \| 'week' \| 'day' \| 'agenda' \| 'timeline'>\('week'\);/g,
  `const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda' | 'timeline'>('month');`
);

revertedCalContent = revertedCalContent.replace(
  /const fetchEvents = async \(\) => \{[\s\S]*?try \{[\s\S]*?const start = new Date\(currentDate\);[\s\S]*?const res = await apiFetch\(`\/api\/v1\/appointments\/calendar\?startDate=\$\{start\.toISOString\(\)\}&endDate=\$\{end\.toISOString\(\)\}`\);[\s\S]*?if \(res\.ok\) \{/m,
  `const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('paramantra_access_token');
      const res = await apiFetch(\`/calendar\`, {
        headers: { Authorization: \`Bearer \${token}\` },
      });
      if (res.ok) {`
);

revertedCalContent = revertedCalContent.replace(
  /useEffect\(\(\) => \{\s*fetchEvents\(\);\s*fetchCustomers\(\);\s*\}, \[currentDate\]\);/g,
  `useEffect(() => {\n    fetchEvents();\n    fetchCustomers();\n  }, []);`
);

revertedCalContent = revertedCalContent.replace(
  /const handleCreateEvent = async \(data: any\) => \{[\s\S]*?try \{[\s\S]*?const userStr = localStorage\.getItem\('crm_user'\);[\s\S]*?const res = await apiFetch\(`\/api\/v1\/appointments`, \{[\s\S]*?method: 'POST',[\s\S]*?headers: \{ 'Content-Type': 'application\/json' \},[\s\S]*?body: JSON\.stringify\(\{[\s\S]*?\}\),[\s\S]*?\}\);/m,
  `const handleCreateEvent = async (data: any) => {
    try {
      const token = localStorage.getItem('paramantra_access_token');
      const res = await apiFetch(\`/calendar\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${token}\`,
        },
        body: JSON.stringify(data),
      });`
);

revertedCalContent = revertedCalContent.replace(
  /<div key=\{evt\.id\} className=\{`text-\[10px\] border p-2\.5 rounded-lg flex flex-col gap-1\.5 font-bold \$\{getTypeStyle\(evt\.type\)\}`\}>\s*<span className="truncate text-\[9px\] text-white\/50">\{evt\.bookingId \|\| ''\}<\/span>\s*<span className="truncate">\{evt\.title\}<\/span>\s*<span className="truncate text-\[9px\]">\{evt\.customer\?\.name \|\| evt\.lead\?\.customerName \|\| 'No Patient Linked'\}<\/span>\s*<span className="text-\[8px\] opacity-80 flex items-center gap-0\.5"><Clock className="w-2\.5 h-2\.5" \/> \{new Date\(evt\.startTime\)\.toLocaleTimeString\(\[\], \{ hour: '2-digit', minute: '2-digit' \}\)\} - \{evt\.status\}<\/span>\s*<\/div>/g,
  `<div key={evt.id} className={\`text-[10px] border p-2.5 rounded-lg flex flex-col gap-1.5 font-bold \${getTypeStyle(evt.type)}\`}>
     <span className="truncate">{evt.title}</span>
     <span className="text-[8px] opacity-80 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
   </div>`
);

fs.writeFileSync(calPath, revertedCalContent);
console.log('Migration Complete');
