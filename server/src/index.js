const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createGame, addPlayer, removePlayer, startRound, playerAction, getPublicState } = require('./game/engine');

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// roomId -> game state
const rooms = new Map();

function broadcastRoom(roomId, event, data) {
  io.to(roomId).emit(event, data);
}

function broadcastGameState(roomId) {
  const game = rooms.get(roomId);
  if (!game) return;
  for (const player of game.players) {
    const socketId = playerSocketMap.get(player.id);
    if (socketId) {
      io.to(socketId).emit('game:state', getPublicState(game, player.id));
    }
  }
}

// playerId -> socketId
const playerSocketMap = new Map();
// socketId -> { roomId, playerId }
const socketMeta = new Map();

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('room:join', ({ roomId, playerName }) => {
    if (!roomId || !playerName) {
      socket.emit('error', { message: 'Room ID and player name are required.' });
      return;
    }

    const cleanRoom = roomId.trim().toUpperCase().slice(0, 8);
    const cleanName = playerName.trim().slice(0, 20);

    if (!rooms.has(cleanRoom)) {
      rooms.set(cleanRoom, createGame(cleanRoom));
    }

    const game = rooms.get(cleanRoom);

    if (game.stage !== 'waiting' && game.stage !== 'showdown') {
      const existing = game.players.find(p => p.name === cleanName);
      if (!existing) {
        socket.emit('error', { message: 'Game in progress. Wait for next round.' });
        return;
      }
    }

    const playerId = `${cleanRoom}-${cleanName}`;
    addPlayer(game, playerId, cleanName);

    const player = game.players.find(p => p.id === playerId);
    if (player) player.connected = true;

    playerSocketMap.set(playerId, socket.id);
    socketMeta.set(socket.id, { roomId: cleanRoom, playerId });

    socket.join(cleanRoom);

    socket.emit('room:joined', { roomId: cleanRoom, playerId });
    broadcastRoom(cleanRoom, 'chat', { system: true, message: `${cleanName} joined the table.` });
    broadcastGameState(cleanRoom);
  });

  socket.on('game:start', ({ roomId }) => {
    const meta = socketMeta.get(socket.id);
    if (!meta || meta.roomId !== roomId) return;

    const game = rooms.get(roomId);
    if (!game) return;

    const result = startRound(game);
    if (result.error) {
      socket.emit('error', { message: result.error });
      return;
    }

    broadcastRoom(roomId, 'chat', { system: true, message: 'New round started.' });
    broadcastGameState(roomId);
  });

  socket.on('game:action', ({ action, amount }) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;

    const { roomId, playerId } = meta;
    const game = rooms.get(roomId);
    if (!game) return;

    const result = playerAction(game, playerId, action, amount);
    if (result.error) {
      socket.emit('error', { message: result.error });
      return;
    }

    const player = game.players.find(p => p.id === playerId);
    broadcastRoom(roomId, 'chat', {
      system: true,
      message: `${player?.name} ${action}s${action === 'raise' ? ` to ${amount}` : ''}.`,
    });

    if (result.winners) {
      broadcastRoom(roomId, 'game:result', result);
    }

    broadcastGameState(roomId);
  });

  socket.on('chat:message', ({ message }) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;

    const game = rooms.get(meta.roomId);
    const player = game?.players.find(p => p.id === meta.playerId);
    if (!player) return;

    broadcastRoom(meta.roomId, 'chat', {
      system: false,
      name: player.name,
      message: message.slice(0, 200),
    });
  });

  socket.on('disconnect', () => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;

    const { roomId, playerId } = meta;
    const game = rooms.get(roomId);

    if (game) {
      const player = game.players.find(p => p.id === playerId);
      if (player) {
        player.connected = false;
        broadcastRoom(roomId, 'chat', { system: true, message: `${player.name} disconnected.` });

        // Remove players with no chips who disconnect
        if (player.chips === 0 && game.stage === 'waiting') {
          removePlayer(game, playerId);
        }
      }

      broadcastGameState(roomId);

      // Clean up empty rooms
      if (game.players.filter(p => p.connected).length === 0) {
        setTimeout(() => {
          if (rooms.has(roomId) && rooms.get(roomId).players.filter(p => p.connected).length === 0) {
            rooms.delete(roomId);
          }
        }, 60000);
      }
    }

    socketMeta.delete(socket.id);
    playerSocketMap.delete(playerId);
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Poker server running on port ${PORT}`);
});
