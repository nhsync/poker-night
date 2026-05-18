import { Card } from './Card';

export function PlayerSeat({ player, isActive, isMe, isDealer }) {
  return (
    <div className={`seat ${isActive ? 'seat--active' : ''} ${isMe ? 'seat--me' : ''} ${player.folded ? 'seat--folded' : ''} ${!player.connected ? 'seat--disconnected' : ''}`}>
      <div className="seat__header">
        <span className="seat__name">
          {player.name}
          {isDealer && <span className="badge badge--dealer">D</span>}
        </span>
        <span className="seat__chips">{player.chips} chips</span>
      </div>

      <div className="seat__cards">
        {isMe && player.hand
          ? player.hand.map((card, i) => <Card key={i} card={card} />)
          : Array.from({ length: player.cardCount }).map((_, i) => <Card key={i} faceDown />)
        }
      </div>

      {player.bet > 0 && (
        <div className="seat__bet">Bet: {player.bet}</div>
      )}

      {player.folded && <div className="seat__status">Folded</div>}
      {player.allIn && <div className="seat__status seat__status--allin">All In</div>}
      {!player.connected && <div className="seat__status">Disconnected</div>}
    </div>
  );
}
