import http from 'http';
import { WebSocketServer } from 'ws';
import cron from 'node-cron';
import app from './app.js';
import { config } from './config.js';
import { getDb, closeDb } from './db/connection.js';
import { ensureUploadDir } from './storage/disk.js';
import { runPurge } from './storage/cleanup.js';
import { handleWsConnection, startHeartbeat } from './ws/handler.js';

// Initialize
getDb();
ensureUploadDir();

const server = http.createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', handleWsConnection);
const heartbeatInterval = startHeartbeat(wss);

// Daily cleanup at 3 AM
cron.schedule('0 3 * * *', () => {
  console.log('[cron] Running daily purge...');
  runPurge();
});

server.listen(config.port, config.host, () => {
  console.log(`[server] Share It! running at http://${config.host}:${config.port}`);
});

// Graceful shutdown
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
  console.log('[server] Shutting down...');
  clearInterval(heartbeatInterval);
  wss.close();
  server.close();
  closeDb();
  process.exit(0);
}
