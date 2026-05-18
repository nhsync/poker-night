import { Card } from './Card';

export function ResultOverlay({ result, onDismiss }) {
  if (!result) return null;

  return (
    <div className="overlay">
      <div className="overlay__box">
        <h2 className="overlay__title">Round Over</h2>

        {result.winners.map((w, i) => (
          <div key={i} className="overlay__winner">
            <span className="overlay__name">{w.name}</span>
            <span className="overlay__hand">{w.handName || w.reason}</span>
            <span className="overlay__chips">+{w.amount} chips</span>
          </div>
        ))}

        {result.allHands && (
          <div className="overlay__hands">
            {result.allHands.map((h, i) => (
              <div key={i} className="overlay__hand-row">
                <span>{h.name}: {h.handName}</span>
                <div className="overlay__cards">
                  {h.hand.map((c, j) => <Card key={j} card={c} small />)}
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="btn btn--primary overlay__btn" onClick={onDismiss}>
          Play Next Round
        </button>
      </div>
    </div>
  );
}
