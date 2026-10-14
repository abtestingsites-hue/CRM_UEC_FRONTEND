const fs = require('fs');
let file = fs.readFileSync('src/providers/SocketProvider.tsx', 'utf8');

const correctText = `    if (!globalTelephonySocket) {
      const socketUrl = process.env.NEXT_PUBLIC_API_URL || \\\`\${API_BASE_URL}/\\\`;
      const mainUrl = \\\`\${API_BASE_URL}/\\\`;
      if (socketUrl === mainUrl || socketUrl.replace(/\\\\/$/, '') === mainUrl.replace(/\\\\/$/, '')) {
        console.log('[AGENT-SOCKET] reusing globalSocket for globalTelephonySocket');
        globalTelephonySocket = globalSocket;
      } else {
        console.log('[AGENT-SOCKET] created globalTelephonySocket');
        globalTelephonySocket = io(socketUrl, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          auth: { agentId: user.id }
        });
      }
    }

    if (!globalMediaSocket) {
      const mediaSocketUrl = process.env.NEXT_PUBLIC_MEDIA_URL || \\\`\${API_BASE_URL}/\\\`;
      const mainUrl = \\\`\${API_BASE_URL}/\\\`;
      if (mediaSocketUrl === mainUrl || mediaSocketUrl.replace(/\\\\/$/, '') === mainUrl.replace(/\\\\/$/, '')) {
        console.log('[AGENT-SOCKET] reusing globalSocket for globalMediaSocket');
        globalMediaSocket = globalSocket;
      } else {
        console.log('[AGENT-SOCKET] created globalMediaSocket');
        globalMediaSocket = io(mediaSocketUrl, {
          transports: ['websocket'],
          reconnection: true
        });
      }
    }`;

// Un-escape backticks in correctText
const finalText = correctText.replace(/\\`/g, '`');

file = file.replace(/if \(\!globalTelephonySocket\) \{[\s\S]*?else \{[\s\S]*?\}\s*\}/m, finalText);
fs.writeFileSync('src/providers/SocketProvider.tsx', file);
