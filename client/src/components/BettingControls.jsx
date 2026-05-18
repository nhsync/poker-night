import { useState } from 'react';

export function BettingControls({ gameState, myPlayer, onAction }) {
  const [raiseAmount, setRaiseAmount] = useState(gameState.currentBet * 2 || 40);

  if (!myPlayer || myPlayer.folded || myPlayer.allIn) return null;
  if (gameState.activePlayerId !== myPlayer.id) return null;
  if (gameState.stage === 'waiting' || gameState.stage === 'showdown') return null;

  const canCheck = myPlayer.bet >= gameState.currentBet;
  const callAmount = Math.min(gameState.currentBet - myPlayer.bet, myPlayer.chips);
  const minRaise = gameState.currentBet + 1;
  const maxRaise = myPlayer.chips + myPlayer.bet;

  return (
    <div className="betting">
      <div className="betting__row">
        <button className="btn btn--danger" onClick={() => onAction('fold')}>
          Fold
        </button>

        {canCheck ? (
          <button className="btn btn--primary" onClick={() => onAction('check')}>
            Check
          </button>
        ) : (
          <button className="btn btn--primary" onClick={() => onAction('call')}>
            Call {callAmount}
          </button>
        )}

        {myPlayer.chips > callAmount && (
          <button className="btn btn--accent" onClick={() => onAction('raise', raiseAmount)}>
            Raise to {raiseAmount}
          </button>
        )}
      </div>

      {myPlayer.chips > callAmount && (
        <div className="betting__raise">
          <input
            type="range"
            min={minRaise}
            max={maxRaise}
            step={1}
            value={raiseAmount}
            onChange={e => setRaiseAmount(Number(e.target.value))}
          />
          <span className="betting__raise-label">{raiseAmount} chips</span>
          <button className="btn btn--sm" onClick={() => onAction('raise', myPlayer.chips + myPlayer.bet)}>
            All In
          </button>
        </div>
      )}
    </div>
  );
}
