# Poker Night

Multiplayer Texas Hold'em poker you can play with friends from anywhere. Free to host, no signup required.

## Overview

Poker Night is a real-time browser poker game for 2-8 players. Players join rooms via a code, see each other's chip counts and actions live, and chat at the table. The backend handles all game logic and state; the frontend is a thin React client.

## Features

- Texas Hold'em with full hand evaluation (straight flush down to high card)
- Real-time sync via WebSockets -- all players see every action instantly
- Room codes -- share a code with friends to play together
- Chat panel at the table
- Showdown with hand reveal and winner display
- Mobile-friendly layout

## Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Frontend  | React 18 + Vite         |
| Backend   | Node.js + Express       |
| Realtime  | Socket.io               |
| Hosting   | Vercel (client) + Render (server) -- both free |

## Getting Started (Local)

### Prerequisites

- Node.js 18+
- npm

### Run the server

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### Run the client

```bash
cd client
cp .env.example .env
# VITE_SERVER_URL should be http://localhost:3001
npm install
npm run dev
```

Open http://localhost:5173, enter a name, and click "Create Room". Open a second tab or browser, join with the same room code, and click "Start Game".

## Deploying (Free, Online Multiplayer)

### Step 1 -- Deploy the server to Render

1. Push the `server/` folder to a GitHub repo (or the whole project).
2. Go to https://render.com and create a free account.
3. Click "New Web Service" and connect your GitHub repo.
4. Set these values:
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`
5. Add an environment variable:
   - `CLIENT_ORIGIN` = `https://your-app.vercel.app` (you will fill this in after step 2)
6. Deploy. Copy the URL Render gives you (e.g. `https://poker-night-server.onrender.com`).

> Render free tier spins down after 15 minutes of inactivity. The first connection after a sleep takes ~30 seconds. This is fine for casual play.

### Step 2 -- Deploy the client to Vercel

1. Go to https://vercel.com and create a free account.
2. Click "Add New Project" and import your GitHub repo.
3. Set the root directory to `client`.
4. Add an environment variable:
   - `VITE_SERVER_URL` = the Render URL from step 1 (e.g. `https://poker-night-server.onrender.com`)
5. Deploy. Vercel gives you a public URL.

### Step 3 -- Update Render with the Vercel URL

1. Go back to your Render service.
2. Update the `CLIENT_ORIGIN` environment variable to your Vercel URL.
3. Render redeploys automatically.

Now share your Vercel URL with friends and play.

## How to Play

1. Open the Vercel URL.
2. Enter your name and click "Create Room" -- you get a room code.
3. Share the room code with friends. They visit the same URL, enter their name, and paste the code.
4. Once everyone is in, any player clicks "Start Game".
5. Standard Texas Hold'em rules: blinds, pre-flop, flop, turn, river, showdown.

## Project Structure

```
poker-night/
├── client/               React + Vite frontend
│   └── src/
│       ├── components/   Card, PlayerSeat, BettingControls, Chat, ResultOverlay
│       ├── hooks/        useSocket -- all socket logic in one place
│       ├── App.jsx       Lobby and game views
│       └── styles.css    Full CSS, no framework needed
└── server/               Node.js backend
    └── src/
        ├── game/
        │   ├── deck.js       Card creation and shuffle
        │   ├── evaluator.js  5-card hand ranking and 7-card best-hand finder
        │   └── engine.js     Game state machine (rounds, betting, winners)
        └── index.js          Socket.io server, room management
```

## License

MIT
