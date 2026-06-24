const net = require('net');

const hosts = [
  { host: 'aws-1-us-east-1.pooler.supabase.com', port: 6543, label: 'Generic Pooler (Port 6543)' },
  { host: 'db.ezapxeduupaadeosouko.supabase.co', port: 5432, label: 'Direct Project Host (Port 5432)' },
  { host: 'db.ezapxeduupaadeosouko.supabase.co', port: 6543, label: 'Project Pooler Host (Port 6543)' }
];

console.log("--- Testing Database Host Connections ---\n");

hosts.forEach((item) => {
  console.log(`Testing TCP connection to ${item.label} at ${item.host}:${item.port}...`);
  const socket = new net.Socket();
  socket.setTimeout(5000);

  const start = Date.now();

  socket.on('connect', () => {
    const duration = Date.now() - start;
    console.log(`✅ ${item.label} CONNECTED successfully in ${duration}ms!`);
    socket.destroy();
  });

  socket.on('timeout', () => {
    console.log(`❌ ${item.label} TIMED OUT after 5s.`);
    socket.destroy();
  });

  socket.on('error', (err) => {
    console.log(`❌ ${item.label} FAILED: ${err.message}`);
  });

  socket.connect(item.port, item.host);
});
