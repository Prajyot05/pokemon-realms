import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { monitor } from '@colyseus/monitor';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { WorldRoom } from './rooms/WorldRoom';
import { authRouter } from './auth/authRouter';

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({ server }),
});

// Register rooms
gameServer.define('zone', WorldRoom);

// Colyseus monitor panel (dev only)
app.use('/colyseus', monitor());

// Auth routes
app.use('/auth', authRouter);

const PORT = Number(process.env.PORT) || 3001;

gameServer.listen(PORT).then(() => {
  console.log(`🚀 Pokemon Realms server running on http://localhost:${PORT}`);
  console.log(`📊 Monitor: http://localhost:${PORT}/colyseus`);
});
