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
          <p className="lobby__sub">Texas Hold'em. Free. No signup.</p>

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
              <button className="btn btn--primary table__start" onClick={() => startGame(roomInfo.roomId)}>
                {gameState?.stage === 'waiting' ? 'Start Game' : 'Next Round'}
              </button>
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
