const fs = require('fs');
const file = 'd:/CRM/Frontend/src/app/calendar/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const handleCreateEvent = async \(data: any\) => \{[\s\S]*?try \{[\s\S]*?const res = await apiFetch\(`\/api\/v1\/appointments`, \{[\s\S]*?method: 'POST',[\s\S]*?headers: \{ 'Content-Type': 'application\/json' \},[\s\S]*?body: JSON\.stringify\(\{[\s\S]*?\.\.\.data,[\s\S]*?duration: Math\.max\(30, Math\.floor\(\(new Date\(data\.endTime\)\.getTime\(\) - new Date\(data\.startTime\)\.getTime\(\)\) \/ 60000\)\),[\s\S]*?\}\),[\s\S]*?\}\);/m,
  `const handleCreateEvent = async (data: any) => {
    try {
      const userStr = localStorage.getItem('crm_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const duration = Math.max(30, Math.floor((new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 60000));
      
      const res = await apiFetch(\`/api/v1/appointments\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          appointmentType: data.type,
          customerId: data.customerId,
          date: new Date(data.startTime).toISOString(),
          startTime: new Date(data.startTime).toISOString(),
          duration: duration,
          assignedAgentId: user?.id,
          doctorId: user?.id,
          bookingSource: 'AGENT',
        }),
      });`
);

fs.writeFileSync(file, content);
console.log('Updated Calendar Payload');
