const SUIT_SYMBOLS = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
const RED_SUITS = new Set(['hearts', 'diamonds']);

export function Card({ card, faceDown = false, small = false }) {
  const size = small ? 'card card--small' : 'card';

  if (faceDown || !card) {
    return <div className={`${size} card--back`}><span>?</span></div>;
  }

  const red = RED_SUITS.has(card.suit);
  return (
    <div className={`${size} ${red ? 'card--red' : 'card--black'}`}>
      <span className="card__rank">{card.rank}</span>
      <span className="card__suit">{SUIT_SYMBOLS[card.suit]}</span>
    </div>
  );
}
