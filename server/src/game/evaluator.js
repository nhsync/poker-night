// Returns { rank, name, tiebreakers } for a 5-card hand.
// rank: higher = better (8=straight flush, 7=four of a kind, ... 0=high card)

function evaluateHand(cards) {
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const values = sorted.map(c => c.value);
  const suits = sorted.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = checkStraight(values);
  const counts = getCounts(values);
  const countValues = Object.values(counts).sort((a, b) => b - a);
  const groups = groupByCount(counts);

  if (isFlush && isStraight) {
    const isRoyal = values[0] === 14 && values[1] === 13;
    return { rank: isRoyal ? 9 : 8, name: isRoyal ? 'Royal Flush' : 'Straight Flush', tiebreakers: values };
  }
  if (countValues[0] === 4) return { rank: 7, name: 'Four of a Kind', tiebreakers: [...groups[4], ...groups[1]] };
  if (countValues[0] === 3 && countValues[1] === 2) return { rank: 6, name: 'Full House', tiebreakers: [...groups[3], ...groups[2]] };
  if (isFlush) return { rank: 5, name: 'Flush', tiebreakers: values };
  if (isStraight) return { rank: 4, name: 'Straight', tiebreakers: values };
  if (countValues[0] === 3) return { rank: 3, name: 'Three of a Kind', tiebreakers: [...groups[3], ...groups[1]] };
  if (countValues[0] === 2 && countValues[1] === 2) return { rank: 2, name: 'Two Pair', tiebreakers: [...groups[2].sort((a,b)=>b-a), ...groups[1]] };
  if (countValues[0] === 2) return { rank: 1, name: 'One Pair', tiebreakers: [...groups[2], ...groups[1]] };
  return { rank: 0, name: 'High Card', tiebreakers: values };
}

function checkStraight(values) {
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] - values[i + 1] !== 1) {
      // Check A-2-3-4-5 wheel
      if (i === 0 && JSON.stringify(values) === JSON.stringify([14, 5, 4, 3, 2])) return true;
      return false;
    }
  }
  return true;
}

function getCounts(values) {
  return values.reduce((acc, v) => { acc[v] = (acc[v] || 0) + 1; return acc; }, {});
}

function groupByCount(counts) {
  const groups = { 1: [], 2: [], 3: [], 4: [] };
  for (const [val, count] of Object.entries(counts)) {
    groups[count].push(Number(val));
  }
  for (const key of Object.keys(groups)) groups[key].sort((a, b) => b - a);
  return groups;
}

// Find best 5-card hand from up to 7 cards
function bestHand(cards) {
  if (cards.length <= 5) return evaluateHand(cards);
  let best = null;
  const combos = combinations(cards, 5);
  for (const combo of combos) {
    const result = evaluateHand(combo);
    if (!best || compareHands(result, best) > 0) best = result;
  }
  return best;
}

function compareHands(a, b) {
  if (a.rank !== b.rank) return a.rank - b.rank;
  for (let i = 0; i < Math.max(a.tiebreakers.length, b.tiebreakers.length); i++) {
    const diff = (a.tiebreakers[i] || 0) - (b.tiebreakers[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function combinations(arr, k) {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map(c => [first, ...c]),
    ...combinations(rest, k)
  ];
}

module.exports = { bestHand, compareHands };
