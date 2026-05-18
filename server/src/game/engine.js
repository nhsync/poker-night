const { createDeck, shuffleDeck } = require('./deck');
const { bestHand, compareHands } = require('./evaluator');

const STARTING_CHIPS = 1000;
const SMALL_BLIND = 10;
const BIG_BLIND = 20;

const STAGES = ['waiting', 'preflop', 'flop', 'turn', 'river', 'showdown'];

function createGame(roomId) {
  return {
    roomId,
    players: [],
    stage: 'waiting',
    deck: [],
    communityCards: [],
    pot: 0,
    currentBet: 0,
    dealerIndex: 0,
    activeIndex: 0,
    sidePots: [],
    lastAction: null,
  };
}

function addPlayer(game, playerId, name) {
  if (game.players.find(p => p.id === playerId)) return;
  game.players.push({
    id: playerId,
    name,
    chips: STARTING_CHIPS,
    hand: [],
    bet: 0,
    folded: false,
    allIn: false,
    connected: true,
  });
}

function removePlayer(game, playerId) {
  game.players = game.players.filter(p => p.id !== playerId);
}

function startRound(game) {
  if (game.players.length < 2) return { error: 'Need at least 2 players' };

  const activePlayers = game.players.filter(p => p.chips > 0 || p.allIn);
  if (activePlayers.length < 2) return { error: 'Not enough players with chips' };

  game.deck = shuffleDeck(createDeck());
  game.communityCards = [];
  game.pot = 0;
  game.currentBet = BIG_BLIND;
  game.stage = 'preflop';
  game.sidePots = [];
  game.lastAction = null;

  for (const player of game.players) {
    player.hand = [game.deck.pop(), game.deck.pop()];
    player.bet = 0;
    player.folded = false;
    player.allIn = false;
  }

  // Rotate dealer
  game.dealerIndex = (game.dealerIndex + 1) % game.players.length;

  const eligible = game.players.filter(p => p.chips > 0);
  if (eligible.length < 2) return { error: 'Not enough chips' };

  const smallIdx = (game.dealerIndex + 1) % game.players.length;
  const bigIdx = (game.dealerIndex + 2) % game.players.length;

  postBlind(game, smallIdx, SMALL_BLIND);
  postBlind(game, bigIdx, BIG_BLIND);

  // Action starts left of big blind
  game.activeIndex = (bigIdx + 1) % game.players.length;
  advanceToNextActive(game);

  return { ok: true };
}

function postBlind(game, index, amount) {
  const player = game.players[index];
  const actual = Math.min(amount, player.chips);
  player.chips -= actual;
  player.bet += actual;
  game.pot += actual;
  if (player.chips === 0) player.allIn = true;
}

function playerAction(game, playerId, action, amount) {
  const player = game.players.find(p => p.id === playerId);
  if (!player) return { error: 'Player not found' };
  if (game.players[game.activeIndex]?.id !== playerId) return { error: 'Not your turn' };
  if (player.folded || player.allIn) return { error: 'Cannot act' };

  switch (action) {
    case 'fold':
      player.folded = true;
      break;

    case 'check':
      if (player.bet < game.currentBet) return { error: 'Cannot check, must call or raise' };
      break;

    case 'call': {
      const callAmount = Math.min(game.currentBet - player.bet, player.chips);
      player.chips -= callAmount;
      player.bet += callAmount;
      game.pot += callAmount;
      if (player.chips === 0) player.allIn = true;
      break;
    }

    case 'raise': {
      const raiseTotal = Number(amount);
      if (raiseTotal <= game.currentBet) return { error: 'Raise must exceed current bet' };
      if (raiseTotal > player.chips + player.bet) return { error: 'Not enough chips' };
      const extra = raiseTotal - player.bet;
      player.chips -= extra;
      player.bet = raiseTotal;
      game.pot += extra;
      game.currentBet = raiseTotal;
      if (player.chips === 0) player.allIn = true;
      break;
    }

    default:
      return { error: 'Unknown action' };
  }

  game.lastAction = { playerId, action, amount: player.bet };

  // Check if round of betting is over
  const activePlayers = game.players.filter(p => !p.folded && !p.allIn);
  if (activePlayers.length === 0) {
  return advanceStage(game);
  }
  const active = game.players.filter(p => !p.folded && !p.allIn);
  const allCalled = active.every(p => p.bet === game.currentBet);
  const onlyOneLeft = game.players.filter(p => !p.folded).length === 1;

  if (onlyOneLeft) {
    return endRound(game);
  }

  if (allCalled || active.length === 0) {
    return advanceStage(game);
  }

  advanceToNextActive(game);
  return { ok: true };
}

function advanceToNextActive(game) {
  let attempts = 0;
  do {
    game.activeIndex = (game.activeIndex + 1) % game.players.length;
    attempts++;
    if (attempts > game.players.length) break;
  } while (
    game.players[game.activeIndex].folded ||
    game.players[game.activeIndex].allIn
  );
}

function advanceStage(game) {
  // Reset bets for new street
  for (const player of game.players) player.bet = 0;
  game.currentBet = 0;

  const stageIndex = STAGES.indexOf(game.stage);
  game.stage = STAGES[stageIndex + 1] || 'showdown';

  if (game.stage === 'flop') {
    game.communityCards.push(game.deck.pop(), game.deck.pop(), game.deck.pop());
  } else if (game.stage === 'turn' || game.stage === 'river') {
    game.communityCards.push(game.deck.pop());
  } else if (game.stage === 'showdown') {
    return endRound(game);
  }

  // Action starts left of dealer
  game.activeIndex = (game.dealerIndex + 1) % game.players.length;
  advanceToNextActive(game);

  return { ok: true, stage: game.stage };
}

function endRound(game) {
  game.stage = 'showdown';

  const contenders = game.players.filter(p => !p.folded);

  if (contenders.length === 1) {
    contenders[0].chips += game.pot;
    const result = {
      ok: true,
      stage: 'showdown',
      winners: [{ playerId: contenders[0].id, name: contenders[0].name, amount: game.pot, reason: 'Last player standing' }],
      pot: game.pot,
    };
    game.pot = 0;
    return result;
  }

  // Evaluate hands
  const evaluated = contenders.map(player => ({
    player,
    result: bestHand([...player.hand, ...game.communityCards]),
  }));

  evaluated.sort((a, b) => compareHands(b.result, a.result));

  // Simple split pot: winner(s) share the pot
  const best = evaluated[0].result;
  const winners = evaluated.filter(e => compareHands(e.result, best) === 0);
  const share = Math.floor(game.pot / winners.length);

  for (const w of winners) {
    w.player.chips += share;
  }

  const winnerSummary = winners.map(w => ({
    playerId: w.player.id,
    name: w.player.name,
    handName: w.result.name,
    amount: share,
    hand: w.player.hand,
  }));

  const allHands = evaluated.map(e => ({
    playerId: e.player.id,
    name: e.player.name,
    hand: e.player.hand,
    handName: e.result.name,
  }));

  const result = {
    ok: true,
    stage: 'showdown',
    winners: winnerSummary,
    allHands,
    pot: game.pot,
  };

  game.pot = 0;
  return result;
}

function getPublicState(game, forPlayerId) {
  return {
    stage: game.stage,
    pot: game.pot,
    currentBet: game.currentBet,
    communityCards: game.communityCards,
    dealerIndex: game.dealerIndex,
    activePlayerId: game.players[game.activeIndex]?.id || null,
    lastAction: game.lastAction,
    players: game.players.map(p => ({
      id: p.id,
      name: p.name,
      chips: p.chips,
      bet: p.bet,
      folded: p.folded,
      allIn: p.allIn,
      connected: p.connected,
      cardCount: p.hand.length,
      hand: p.id === forPlayerId ? p.hand : null,
    })),
  };
}

module.exports = { createGame, addPlayer, removePlayer, startRound, playerAction, getPublicState };
