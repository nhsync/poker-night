import { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { Card } from './components/Card';
import { PlayerSeat } from './components/PlayerSeat';
import { BettingControls } from './components/BettingControls';
import { Chat } from './components/Chat';
import { ResultOverlay } from './components/ResultOverlay';

export default function App() {
  const { connected, gameState, messages, error, roomInfo, result, joinRoom, startGame, sendAction, sendMessage } = useSocket();
  const [nameInput, setNameInput] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [showResult, setShowResult] = useState(false);

  const prevResult = useState(null);
  if (result && !showResult) setShowResult(true);

  const myPlayer = gameState?.players.find(p => p.id === roomInfo?.playerId);
  const isMyTurn = gameState?.activePlayerId === roomInfo?.playerId;
  const canStart = gameState?.stage === 'waiting' || gameState?.stage === 'showdown';

  function handleJoin() {
    const name = nameInput.trim();
    const room = roomInput.trim() || generateRoomCode();
    if (!name) return;
    setRoomInput(room);
    joinRoom(room, name);
  }

  function handleAction(action, amount) {
    sendAction(action, amount);
  }

  function handleNextRound() {
    setShowResult(false);
    startGame(roomInfo.roomId);
  }

  if (!roomInfo) {
    return (
      <div className="lobby">
        <div className="lobby__box">
          <h1 className="lobby__title">Poker Night</h1>
          <p className="lobby__sub">Multiplayer Poker. Free. No signup.</p>

          {!connected && <p className="lobby__connecting">Connecting to server...</p>}

          <div className="lobby__field">
            <label>Your name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={nameInput}
              maxLength={20}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
          </div>

          <div className="lobby__field">
            <label>Room code <span className="lobby__hint">(leave blank to create new)</span></label>
            <input
              type="text"
              placeholder="e.g. FRIENDS1"
              value={roomInput}
              maxLength={8}
              onChange={e => setRoomInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button className="btn btn--primary btn--lg" onClick={handleJoin} disabled={!connected || !nameInput.trim()}>
        {roomInput.trim() ? 'Join Room' : 'Create Room'}
      </button>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
        <a
          href="https://www.linkedin.com/in/nitinhrao"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0077b5', fontSize: '13px', textDecoration: 'none' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#0077b5">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          Created by Nitin H Rao
        </a>
      </div>
    </div>
  </div>
    );
  }

  return (
    <div className="game">
      <header className="game__header">
        <span className="game__logo">Poker Night</span>
        <span className="game__room">Room: {roomInfo.roomId}</span>
        <span className={`game__status ${isMyTurn ? 'game__status--active' : ''}`}>
  {isMyTurn ? 'Your turn' : gameState?.stage || ''}
</span>
<button
  className="btn btn--sm"
  style={{ marginLeft: '8px' }}
  onClick={() => window.location.reload()}
>
  Leave Table
</button>
      </header>

      <div className="game__body">
        <div className="game__table-wrap">
          <div className="game__table">
            <div className="table__info">
              <span className="table__pot">Pot: {gameState?.pot ?? 0}</span>
              <span className="table__stage">{gameState?.stage}</span>
            </div>

            <div className="table__community">
              {gameState?.communityCards?.length > 0
                ? gameState.communityCards.map((c, i) => <Card key={i} card={c} />)
                : <span className="table__empty">Community cards</span>
              }
            </div>

            <div className="table__players">
              {gameState?.players.map((player, i) => (
                <PlayerSeat
                  key={player.id}
                  player={player}
                  isActive={gameState.activePlayerId === player.id}
                  isMe={player.id === roomInfo.playerId}
                  isDealer={i === gameState.dealerIndex}
                />
              ))}
            </div>

            {canStart && (
  <div style={{ display: 'flex', gap: '8px' }}>
    <button className="btn btn--primary table__start" onClick={() => startGame(roomInfo.roomId)}>
      {gameState?.stage === 'waiting' ? 'Start Game' : 'Next Round'}
    </button>
    <button className="btn btn--danger table__start" onClick={() => window.location.reload()}>
      Leave Table
    </button>
  </div>
)}
          </div>

          {myPlayer && gameState && !canStart && (
            <BettingControls
              gameState={gameState}
              myPlayer={myPlayer}
              onAction={handleAction}
            />
          )}

          {error && <p className="error-msg error-msg--center">{error}</p>}
        </div>

        <Chat messages={messages} onSend={sendMessage} />
      </div>

      {showResult && result && (
        <ResultOverlay result={result} onDismiss={handleNextRound} />
      )}
    </div>
  );
}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
