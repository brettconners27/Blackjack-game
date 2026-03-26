const suits = [
  { symbol: "♠", color: "black" },
  { symbol: "♥", color: "red" },
  { symbol: "♦", color: "red" },
  { symbol: "♣", color: "black" },
];

const ranks = [
  { label: "A", value: 11 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
  { label: "6", value: 6 },
  { label: "7", value: 7 },
  { label: "8", value: 8 },
  { label: "9", value: 9 },
  { label: "10", value: 10 },
  { label: "J", value: 10 },
  { label: "Q", value: 10 },
  { label: "K", value: 10 },
];

const state = {
  deck: [],
  deckCount: 4,
  playerHands: [],
  playerBets: [],
  handIds: [],
  nextHandId: 1,
  activeHandIndex: 0,
  dealerHand: [],
  roundOver: true,
  bankroll: 500,
  atmDebt: 0,
  currentBet: 0,
  wins: 0,
  losses: 0,
  pushes: 0,
  atmPromptOpen: false,
  showCount: false,
  useCountStrategy: false,
  runningCount: 0,
  trueCount: 0,
  currentHandLog: [],
  lastHandRecap: [],
  correctDecisions: 0,
  totalDecisions: 0,
  perfectHands: 0,
  gradedHands: 0,
};

const elements = {
  status: document.getElementById("status"),
  dealerHand: document.getElementById("dealer-hand"),
  playerHand: document.getElementById("player-hand"),
  dealerScore: document.getElementById("dealer-score"),
  playerScore: document.getElementById("player-score"),
  dealButton: document.getElementById("deal-button"),
  hitButton: document.getElementById("hit-button"),
  standButton: document.getElementById("stand-button"),
  doubleButton: document.getElementById("double-button"),
  splitButton: document.getElementById("split-button"),
  bankroll: document.getElementById("bankroll"),
  atmDebt: document.getElementById("atm-debt"),
  currentBet: document.getElementById("current-bet"),
  wins: document.getElementById("wins"),
  losses: document.getElementById("losses"),
  pushes: document.getElementById("pushes"),
  winRate: document.getElementById("win-rate"),
  shoeCount: document.getElementById("shoe-count"),
  deckCount: document.getElementById("deck-count"),
  clearBetButton: document.getElementById("clear-bet-button"),
  chipButtons: Array.from(document.querySelectorAll("[data-chip]")),
  atmModal: document.getElementById("atm-modal"),
  atmYesButton: document.getElementById("atm-yes-button"),
  atmNoButton: document.getElementById("atm-no-button"),
  celebrationLayer: document.getElementById("celebration-layer"),
  showCountToggle: document.getElementById("show-count-toggle"),
  useCountStrategyToggle: document.getElementById("use-count-strategy-toggle"),
  countPanel: document.getElementById("count-panel"),
  runningCount: document.getElementById("running-count"),
  trueCount: document.getElementById("true-count"),
  decisionScore: document.getElementById("decision-score"),
  decisionAccuracy: document.getElementById("decision-accuracy"),
  perfectHands: document.getElementById("perfect-hands"),
  strategyModeLabel: document.getElementById("strategy-mode-label"),
  recapModeLabel: document.getElementById("recap-mode-label"),
  handRecap: document.getElementById("hand-recap"),
};

function getHiLoValue(rank) {
  if (["2", "3", "4", "5", "6"].includes(rank)) {
    return 1;
  }

  if (["10", "J", "Q", "K", "A"].includes(rank)) {
    return -1;
  }

  return 0;
}

function createDeck() {
  const deck = [];

  for (let deckNumber = 0; deckNumber < state.deckCount; deckNumber += 1) {
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({
          suit: suit.symbol,
          color: suit.color,
          rank: rank.label,
          value: rank.value,
          countValue: getHiLoValue(rank.label),
          exposed: false,
        });
      }
    }
  }

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  return deck;
}

function drawCard() {
  if (state.deck.length === 0) {
    resetShoeState();
  }

  return state.deck.pop();
}

function getHandValue(hand) {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    total += card.value;
    if (card.rank === "A") {
      aces += 1;
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return { total, soft: aces > 0 };
}

function hasHiddenDealerCard() {
  return state.dealerHand.some((card) => !card.exposed);
}

function getDecksRemainingExact() {
  const hiddenCards = state.dealerHand.filter((card) => !card.exposed).length;
  return Math.max((state.deck.length + hiddenCards) / 52, 0.25);
}

function updateTrueCount() {
  const exact = state.runningCount / getDecksRemainingExact();
  state.trueCount = exact >= 0 ? Math.floor(exact) : Math.ceil(exact);
}

function markCardExposed(card) {
  if (!card || card.exposed) {
    return;
  }

  card.exposed = true;
  state.runningCount += card.countValue;
  updateTrueCount();
}

function revealDealerHoleCard() {
  if (state.dealerHand[1]) {
    markCardExposed(state.dealerHand[1]);
  }
}

function resetCountState() {
  state.runningCount = 0;
  state.trueCount = 0;
}

function resetShoeState(clearTable = false) {
  state.deck = createDeck();
  resetCountState();

  if (clearTable) {
    state.playerHands = [];
    state.playerBets = [];
    state.handIds = [];
    state.activeHandIndex = 0;
    state.dealerHand = [];
  }
}

function dealerShouldHit(hand) {
  const { total, soft } = getHandValue(hand);
  return total < 17 || (total === 17 && soft);
}

function setControls({ deal, hit, stand, double, split }) {
  elements.dealButton.disabled = !deal;
  elements.hitButton.disabled = !hit;
  elements.standButton.disabled = !stand;
  elements.doubleButton.disabled = !double;
  elements.splitButton.disabled = !split;
}

function formatMoney(amount) {
  return `$${amount}`;
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function formatAction(action) {
  return action.charAt(0).toUpperCase() + action.slice(1);
}

function canDeal() {
  return state.roundOver && state.currentBet > 0;
}

function getActiveHand() {
  return state.playerHands[state.activeHandIndex] || [];
}

function getActiveHandId() {
  return state.handIds[state.activeHandIndex];
}

function canSplit() {
  if (state.roundOver || state.playerHands.length !== 1) {
    return false;
  }

  const hand = state.playerHands[0];
  return hand.length === 2 && hand[0].value === hand[1].value && state.bankroll >= state.currentBet;
}

function canDouble() {
  if (state.roundOver) {
    return false;
  }

  const hand = getActiveHand();
  const activeBet = state.playerBets[state.activeHandIndex] || 0;
  return hand.length === 2 && state.bankroll >= activeBet;
}

function updateModal() {
  elements.atmModal.classList.toggle("hidden", !state.atmPromptOpen);
}

function getWinRate() {
  const resolvedHands = state.wins + state.losses + state.pushes;
  if (resolvedHands === 0) {
    return "0%";
  }

  return formatPercent((state.wins / resolvedHands) * 100);
}

function getDecisionAccuracy() {
  if (state.totalDecisions === 0) {
    return "0%";
  }

  return formatPercent((state.correctDecisions / state.totalDecisions) * 100);
}

function getPairValue(hand) {
  if (hand.length !== 2 || hand[0].value !== hand[1].value) {
    return null;
  }

  return hand[0].value;
}

function getDealerUpcardValue() {
  return state.dealerHand[0] ? state.dealerHand[0].value : 0;
}

function getDealerUpcardLabel() {
  return state.dealerHand[0] ? `${state.dealerHand[0].rank}${state.dealerHand[0].suit}` : "--";
}

function getHandDescriptor(hand) {
  const pairValue = getPairValue(hand);
  const { total, soft } = getHandValue(hand);

  if (pairValue === 11) {
    return "Pair of Aces";
  }

  if (pairValue === 10) {
    return "Pair of Tens";
  }

  if (pairValue) {
    return `Pair of ${pairValue}s`;
  }

  if (soft) {
    return `Soft ${total}`;
  }

  return `Hard ${total}`;
}

function getBaseActionWithFallback(primaryAction, canUsePrimary, fallbackAction) {
  return canUsePrimary ? primaryAction : fallbackAction;
}

function getBasicStrategyAction(hand, dealerValue, options) {
  const { canDouble: allowDouble, canSplit: allowSplit } = options;
  const pairValue = getPairValue(hand);
  const { total, soft } = getHandValue(hand);

  if (pairValue) {
    let pairAction = null;

    if (pairValue === 11 || pairValue === 8) {
      pairAction = "split";
    } else if (pairValue === 9) {
      pairAction = [2, 3, 4, 5, 6, 8, 9].includes(dealerValue) ? "split" : "stand";
    } else if (pairValue === 7) {
      pairAction = dealerValue >= 2 && dealerValue <= 7 ? "split" : "hit";
    } else if (pairValue === 6) {
      pairAction = dealerValue >= 2 && dealerValue <= 6 ? "split" : "hit";
    } else if (pairValue === 4) {
      pairAction = [5, 6].includes(dealerValue) ? "split" : "hit";
    } else if (pairValue === 3 || pairValue === 2) {
      pairAction = dealerValue >= 2 && dealerValue <= 7 ? "split" : "hit";
    } else if (pairValue === 10) {
      pairAction = "stand";
    }

    if (pairAction === "split" && allowSplit) {
      return "split";
    }
  }

  if (soft) {
    if (total >= 19) {
      return "stand";
    }

    if (total === 18) {
      if (dealerValue >= 3 && dealerValue <= 6) {
        return getBaseActionWithFallback("double", allowDouble, "stand");
      }

      if ([2, 7, 8].includes(dealerValue)) {
        return "stand";
      }

      return "hit";
    }

    if (total === 17) {
      return dealerValue >= 3 && dealerValue <= 6
        ? getBaseActionWithFallback("double", allowDouble, "hit")
        : "hit";
    }

    if (total === 16 || total === 15) {
      return dealerValue >= 4 && dealerValue <= 6
        ? getBaseActionWithFallback("double", allowDouble, "hit")
        : "hit";
    }

    return dealerValue >= 5 && dealerValue <= 6
      ? getBaseActionWithFallback("double", allowDouble, "hit")
      : "hit";
  }

  if (total >= 17) {
    return "stand";
  }

  if (total >= 13) {
    return dealerValue >= 2 && dealerValue <= 6 ? "stand" : "hit";
  }

  if (total === 12) {
    return dealerValue >= 4 && dealerValue <= 6 ? "stand" : "hit";
  }

  if (total === 11) {
    return getBaseActionWithFallback("double", allowDouble, "hit");
  }

  if (total === 10) {
    return dealerValue >= 2 && dealerValue <= 9
      ? getBaseActionWithFallback("double", allowDouble, "hit")
      : "hit";
  }

  if (total === 9) {
    return dealerValue >= 3 && dealerValue <= 6
      ? getBaseActionWithFallback("double", allowDouble, "hit")
      : "hit";
  }

  return "hit";
}

function applyCountDeviations(hand, dealerValue, options, basicAction) {
  const { canDouble: allowDouble, canSplit: allowSplit, trueCount } = options;
  const pairValue = getPairValue(hand);
  const { total, soft } = getHandValue(hand);

  if (allowSplit && pairValue && pairValue === 10) {
    if (dealerValue === 5 && trueCount >= 5) {
      return "split";
    }

    if (dealerValue === 6 && trueCount >= 4) {
      return "split";
    }
  }

  if (!soft && !pairValue) {
    if (total === 16 && dealerValue === 10 && trueCount >= 0) {
      return "stand";
    }

    if (total === 16 && dealerValue === 9 && trueCount >= 5) {
      return "stand";
    }

    if (total === 15 && dealerValue === 10 && trueCount >= 4) {
      return "stand";
    }

    if (total === 15 && dealerValue === 9 && trueCount >= 2) {
      return "stand";
    }

    if (total === 12 && dealerValue === 3 && trueCount >= 2) {
      return "stand";
    }

    if (total === 12 && dealerValue === 2 && trueCount >= 3) {
      return "stand";
    }

    if (total === 11 && dealerValue === 11 && allowDouble && trueCount >= 1) {
      return "double";
    }

    if (total === 10 && dealerValue === 10 && allowDouble && trueCount >= 4) {
      return "double";
    }

    if (total === 10 && dealerValue === 11 && allowDouble && trueCount >= 4) {
      return "double";
    }

    if (total === 9 && dealerValue === 2 && allowDouble && trueCount >= 1) {
      return "double";
    }

    if (total === 9 && dealerValue === 7 && allowDouble && trueCount >= 3) {
      return "double";
    }
  }

  return basicAction;
}

function getRecommendedAction(hand, dealerValue, options) {
  const basicAction = getBasicStrategyAction(hand, dealerValue, options);
  const recommendedAction = options.useCountStrategy
    ? applyCountDeviations(hand, dealerValue, options, basicAction)
    : basicAction;

  return {
    basicAction,
    recommendedAction,
    countAdjusted: recommendedAction !== basicAction,
  };
}

function recordDecision(chosenAction) {
  const hand = getActiveHand();
  if (hand.length === 0) {
    return;
  }

  const recommendation = getRecommendedAction(hand, getDealerUpcardValue(), {
    canDouble: canDouble(),
    canSplit: canSplit(),
    useCountStrategy: state.useCountStrategy,
    trueCount: state.trueCount,
  });

  const decision = {
    handId: getActiveHandId(),
    handLabel: getHandDescriptor(hand),
    dealerUpcard: getDealerUpcardLabel(),
    runningCount: state.runningCount,
    trueCount: state.trueCount,
    chosenAction,
    recommendedAction: recommendation.recommendedAction,
    basicAction: recommendation.basicAction,
    countAdjusted: recommendation.countAdjusted,
    correct: chosenAction === recommendation.recommendedAction,
    mode: state.useCountStrategy ? "Count-Aware" : "Basic",
  };

  state.currentHandLog.push(decision);
  state.totalDecisions += 1;
  if (decision.correct) {
    state.correctDecisions += 1;
  }
}

function finalizeTraining(results) {
  const recap = state.handIds.map((handId, index) => {
    const decisions = state.currentHandLog.filter((entry) => entry.handId === handId);
    const graded = decisions.length > 0;
    const perfect = graded && decisions.every((entry) => entry.correct);

    if (graded) {
      state.gradedHands += 1;
      if (perfect) {
        state.perfectHands += 1;
      }
    }

    return {
      title: `Hand ${index + 1}`,
      outcome: results[index] ? results[index].outcome : "push",
      graded,
      perfect,
      decisions,
    };
  });

  state.lastHandRecap = recap;
  state.currentHandLog = [];
}

function renderHandRecap() {
  elements.recapModeLabel.textContent = state.useCountStrategy ? "Count-Aware" : "Basic";

  if (state.lastHandRecap.length === 0) {
    elements.handRecap.innerHTML = `
      <p class="recap-empty">Play a hand to see how your decisions matched perfect strategy.</p>
    `;
    return;
  }

  elements.handRecap.innerHTML = state.lastHandRecap.map((hand) => {
    const verdict = hand.graded
      ? hand.perfect
        ? "Perfect"
        : "Mistakes Found"
      : "No Decision";

    const decisionMarkup = hand.decisions.length > 0
      ? `<div class="recap-list">${hand.decisions.map((decision) => `
        <article class="recap-item ${decision.correct ? "correct" : "incorrect"}">
          <div class="recap-item-header">
            <strong>${decision.handLabel} vs ${decision.dealerUpcard}</strong>
            <span class="recap-badge">${decision.correct ? "Correct" : "Incorrect"}</span>
          </div>
          <p>You chose <strong>${formatAction(decision.chosenAction)}</strong>. Best play was <strong>${formatAction(decision.recommendedAction)}</strong>.</p>
          <p class="recap-meta">Count ${decision.runningCount} / True ${decision.trueCount} · ${decision.mode}</p>
          ${decision.countAdjusted ? `<p class="deviation-note">Count deviation: basic strategy would have been ${formatAction(decision.basicAction)}.</p>` : ""}
        </article>
      `).join("")}</div>`
      : `<p class="recap-empty">No player decision was required on this hand.</p>`;

    return `
      <article class="recap-hand">
        <div class="recap-hand-header">
          <h3 class="recap-hand-title">${hand.title}</h3>
          <span class="recap-verdict">${verdict}</span>
        </div>
        ${decisionMarkup}
      </article>
    `;
  }).join("");
}

function updateHud() {
  elements.bankroll.textContent = formatMoney(state.bankroll);
  elements.atmDebt.textContent = formatMoney(state.atmDebt);
  elements.currentBet.textContent = formatMoney(state.currentBet);
  elements.wins.textContent = `${state.wins}`;
  elements.losses.textContent = `${state.losses}`;
  elements.pushes.textContent = `${state.pushes}`;
  elements.winRate.textContent = getWinRate();
  elements.shoeCount.textContent = `${state.deckCount}`;
  elements.deckCount.value = `${state.deckCount}`;
  elements.showCountToggle.checked = state.showCount;
  elements.useCountStrategyToggle.checked = state.useCountStrategy;
  elements.countPanel.classList.toggle("hidden", !state.showCount);
  elements.runningCount.textContent = `${state.runningCount}`;
  elements.trueCount.textContent = `${state.trueCount}`;
  elements.decisionScore.textContent = `${state.correctDecisions} / ${state.totalDecisions}`;
  elements.decisionAccuracy.textContent = getDecisionAccuracy();
  elements.perfectHands.textContent = `${state.perfectHands} / ${state.gradedHands}`;
  elements.strategyModeLabel.textContent = state.useCountStrategy ? "Count-Aware" : "Basic";

  for (const button of elements.chipButtons) {
    const chipValue = Number(button.dataset.chip);
    button.disabled = !state.roundOver || chipValue > state.bankroll;
  }

  elements.clearBetButton.disabled = !state.roundOver || state.currentBet === 0;
  elements.deckCount.disabled = !state.roundOver;
  elements.dealButton.disabled = !canDeal();
  updateModal();
}

function renderDealerHand(container, hand) {
  container.textContent = "";

  for (const [index, card] of hand.entries()) {
    const hidden = index === 1 && !card.exposed;
    const cardElement = document.createElement("div");
    cardElement.className = `card ${card.color}${hidden ? " hidden" : ""}`;

    if (!hidden) {
      cardElement.innerHTML = `
        <div class="rank">${card.rank}</div>
        <div class="suit">${card.suit}</div>
        <div class="pip">${card.suit}</div>
      `;
    }

    container.appendChild(cardElement);
  }
}

function renderPlayerHands() {
  elements.playerHand.textContent = "";
  elements.playerHand.className = state.playerHands.length > 1 ? "player-hands" : "hand";

  state.playerHands.forEach((hand, index) => {
    const wrap = document.createElement("div");
    wrap.className = `player-hand-wrap${index === state.activeHandIndex && !state.roundOver ? " active-hand" : ""}`;

    const header = document.createElement("div");
    header.className = "player-hand-header";
    const total = getHandValue(hand).total;
    header.innerHTML = `
      <p class="player-hand-title">Hand ${index + 1}</p>
      <span class="player-hand-bet">${formatMoney(state.playerBets[index] || 0)} · ${total}</span>
    `;

    const cards = document.createElement("div");
    cards.className = "hand";

    for (const card of hand) {
      const cardElement = document.createElement("div");
      cardElement.className = `card ${card.color}`;
      cardElement.innerHTML = `
        <div class="rank">${card.rank}</div>
        <div class="suit">${card.suit}</div>
        <div class="pip">${card.suit}</div>
      `;
      cards.appendChild(cardElement);
    }

    wrap.appendChild(header);
    wrap.appendChild(cards);
    elements.playerHand.appendChild(wrap);
  });
}

function updateScores() {
  if (state.playerHands.length === 0) {
    elements.playerScore.textContent = "Score: 0";
  } else if (state.playerHands.length === 1) {
    elements.playerScore.textContent = `Score: ${getHandValue(state.playerHands[0]).total}`;
  } else {
    const scores = state.playerHands.map((hand, index) => `H${index + 1}: ${getHandValue(hand).total}`);
    elements.playerScore.textContent = scores.join(" | ");
  }

  if (hasHiddenDealerCard() && state.dealerHand.length > 0) {
    elements.dealerScore.textContent = `Score: ${getHandValue([state.dealerHand[0]]).total}+`;
    return;
  }

  elements.dealerScore.textContent = `Score: ${getHandValue(state.dealerHand).total}`;
}

function render() {
  renderDealerHand(elements.dealerHand, state.dealerHand);
  renderPlayerHands();
  updateScores();
  updateHud();
  renderHandRecap();
}

function launchCelebration(type) {
  const layer = elements.celebrationLayer;
  layer.textContent = "";

  const count = type === "piggy" ? 16 : type === "gold" ? 22 : 24;
  for (let index = 0; index < count; index += 1) {
    const piece = document.createElement("div");
    piece.className = `celebration-piece ${type}`;
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.animationDuration = `${3 + Math.random() * 1.8}s`;
    piece.style.animationDelay = `${Math.random() * 0.45}s`;
    piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 18}vw`);
    piece.style.setProperty("--spin", `${(Math.random() - 0.5) * 900}deg`);
    if (type === "piggy") {
      piece.textContent = "🐷";
    }
    layer.appendChild(piece);
  }

  window.setTimeout(() => {
    layer.textContent = "";
  }, 5200);
}

function finishRound(message, results = []) {
  let shouldRainMoney = false;
  let shouldRainPiggies = false;
  let shouldRainGold = false;

  finalizeTraining(results);

  for (const result of results) {
    if (result.outcome === "win") {
      state.wins += 1;
      state.bankroll += result.blackjack
        ? result.bet + Math.floor(result.bet * 1.5)
        : result.bet * 2;
      shouldRainGold = shouldRainGold || Boolean(result.blackjack);
      shouldRainPiggies = shouldRainPiggies || (Boolean(result.doubled) && !result.blackjack);
      shouldRainMoney = shouldRainMoney || (!result.doubled && !result.blackjack);
    } else if (result.outcome === "loss") {
      state.losses += 1;
    } else if (result.outcome === "push") {
      state.pushes += 1;
      state.bankroll += result.bet;
    }
  }

  state.currentBet = 0;
  state.roundOver = true;
  state.activeHandIndex = 0;
  elements.status.textContent = message;
  state.atmPromptOpen = state.bankroll <= 0;
  render();
  setControls({ deal: canDeal(), hit: false, stand: false, double: false, split: false });

  if (shouldRainGold) {
    launchCelebration("gold");
  } else if (shouldRainPiggies) {
    launchCelebration("piggy");
  } else if (shouldRainMoney) {
    launchCelebration("money");
  }
}

function checkForBlackjack() {
  const playerTotal = getHandValue(state.playerHands[0]).total;
  const dealerTotal = getHandValue(state.dealerHand).total;

  if (playerTotal === 21 && dealerTotal === 21) {
    revealDealerHoleCard();
    finishRound("Both player and dealer have blackjack. Push.", [
      { outcome: "push", bet: state.playerBets[0] },
    ]);
    return true;
  }

  if (playerTotal === 21) {
    revealDealerHoleCard();
    finishRound("Blackjack! Player wins 3:2.", [
      { outcome: "win", bet: state.playerBets[0], blackjack: true },
    ]);
    return true;
  }

  if (dealerTotal === 21) {
    revealDealerHoleCard();
    finishRound("Dealer has blackjack. Dealer wins.", [
      { outcome: "loss", bet: state.playerBets[0] },
    ]);
    return true;
  }

  return false;
}

function startNewHandState() {
  state.playerHands = [[drawCard(), drawCard()]];
  state.playerBets = [state.currentBet];
  state.handIds = [state.nextHandId];
  state.nextHandId += 1;
  state.currentHandLog = [];
  state.activeHandIndex = 0;
  state.dealerHand = [drawCard(), drawCard()];
  state.roundOver = false;
  state.atmPromptOpen = false;

  for (const card of state.playerHands[0]) {
    markCardExposed(card);
  }
  markCardExposed(state.dealerHand[0]);
}

function deal() {
  if (!canDeal()) {
    elements.status.textContent = state.bankroll === 0
      ? "Bankroll is empty. Refresh the page to restart the table."
      : "Place a chip bet before dealing.";
    render();
    return;
  }

  if (state.deck.length < state.deckCount * 12) {
    resetShoeState();
  }

  startNewHandState();
  elements.status.textContent = "Your move: hit, stand, or split if the opening cards match.";
  render();
  setControls({ deal: false, hit: true, stand: true, double: canDouble(), split: canSplit() });

  checkForBlackjack();
}

function completePlayerTurn(message) {
  if (advanceToNextHand(message)) {
    return;
  }

  elements.status.textContent = message || "Dealer reveals the hole card and plays out the hand.";
  revealDealerHoleCard();
  state.roundOver = true;
  render();
  setControls({ deal: false, hit: false, stand: false, double: false, split: false });
  window.setTimeout(() => {
    resolveDealerTurn();
  }, 500);
}

function hit() {
  if (state.roundOver) {
    return;
  }

  recordDecision("hit");
  const hand = getActiveHand();
  const card = drawCard();
  hand.push(card);
  markCardExposed(card);
  render();

  const playerTotal = getHandValue(hand).total;
  if (playerTotal > 21) {
    completePlayerTurn(`Hand ${state.activeHandIndex + 1} busts.`);
  } else if (playerTotal === 21) {
    completePlayerTurn(`Hand ${state.activeHandIndex + 1} is complete at 21.`);
  } else {
    elements.status.textContent = state.playerHands.length > 1
      ? `Hand ${state.activeHandIndex + 1}: hit or stand.`
      : "Your move: hit or stand.";
    setControls({ deal: false, hit: true, stand: true, double: canDouble(), split: canSplit() });
  }
}

function resolveDealerTurn() {
  while (dealerShouldHit(state.dealerHand)) {
    const card = drawCard();
    state.dealerHand.push(card);
    markCardExposed(card);
  }

  const dealerTotal = getHandValue(state.dealerHand).total;
  const results = [];
  const summaries = [];

  state.playerHands.forEach((hand, index) => {
    const playerTotal = getHandValue(hand).total;
    const bet = state.playerBets[index];
    const doubled = bet > state.currentBet;

    if (playerTotal > 21) {
      results.push({ outcome: "loss", bet });
      summaries.push(`Hand ${index + 1} busts`);
      return;
    }

    if (dealerTotal > 21) {
      results.push({ outcome: "win", bet, doubled });
      summaries.push(`Hand ${index + 1} wins`);
      return;
    }

    if (dealerTotal > playerTotal) {
      results.push({ outcome: "loss", bet });
      summaries.push(`Hand ${index + 1} loses`);
      return;
    }

    if (dealerTotal < playerTotal) {
      results.push({ outcome: "win", bet, doubled });
      summaries.push(`Hand ${index + 1} wins`);
      return;
    }

    results.push({ outcome: "push", bet });
    summaries.push(`Hand ${index + 1} pushes`);
  });

  const prefix = dealerTotal > 21 ? "Dealer busts." : `Dealer stands on ${dealerTotal}.`;
  finishRound(`${prefix} ${summaries.join(". ")}.`, results);
}

function stand() {
  if (state.roundOver) {
    return;
  }

  recordDecision("stand");
  completePlayerTurn(`Hand ${state.activeHandIndex + 1} stands.`);
}

function advanceToNextHand(message) {
  if (state.playerHands.length > 1 && state.activeHandIndex < state.playerHands.length - 1) {
    state.activeHandIndex += 1;
    elements.status.textContent = message
      ? `${message} Now playing hand ${state.activeHandIndex + 1}.`
      : `Now playing hand ${state.activeHandIndex + 1}.`;
    render();
    setControls({ deal: false, hit: true, stand: true, double: canDouble(), split: false });
    return true;
  }

  return false;
}

function splitHand() {
  if (!canSplit()) {
    return;
  }

  recordDecision("split");
  const [firstCard, secondCard] = state.playerHands[0];
  const nextHandId = state.nextHandId;
  state.nextHandId += 1;

  state.playerHands = [
    [firstCard, drawCard()],
    [secondCard, drawCard()],
  ];
  state.playerBets = [state.currentBet, state.currentBet];
  state.handIds = [state.handIds[0], nextHandId];
  state.bankroll -= state.currentBet;
  state.activeHandIndex = 0;

  markCardExposed(state.playerHands[0][1]);
  markCardExposed(state.playerHands[1][1]);

  elements.status.textContent = "Hand split. Play hand 1 first.";
  render();
  setControls({ deal: false, hit: true, stand: true, double: canDouble(), split: false });
}

function doubleDown() {
  if (!canDouble()) {
    return;
  }

  recordDecision("double");
  state.bankroll -= state.playerBets[state.activeHandIndex];
  state.playerBets[state.activeHandIndex] *= 2;
  const hand = getActiveHand();
  const card = drawCard();
  hand.push(card);
  markCardExposed(card);
  render();

  const total = getHandValue(hand).total;
  if (total > 21) {
    completePlayerTurn(`Hand ${state.activeHandIndex + 1} doubles and busts.`);
    return;
  }

  completePlayerTurn(`Hand ${state.activeHandIndex + 1} doubles and stands.`);
}

function addChipToBet(amount) {
  if (!state.roundOver || amount > state.bankroll) {
    return;
  }

  state.bankroll -= amount;
  state.currentBet += amount;
  render();
}

function clearBet() {
  if (!state.roundOver) {
    return;
  }

  state.bankroll += state.currentBet;
  state.currentBet = 0;
  elements.status.textContent = "Bet cleared. Place chips to start the next hand.";
  render();
}

function updateDeckCount(event) {
  if (!state.roundOver) {
    return;
  }

  state.deckCount = Number(event.target.value);
  resetShoeState(true);
  state.lastHandRecap = [];
  elements.status.textContent = `Shoe reset to ${state.deckCount} deck${state.deckCount === 1 ? "" : "s"}.`;
  render();
}

function hitTheAtm() {
  state.bankroll = 500;
  state.atmDebt -= 500;
  state.currentBet = Math.min(state.currentBet, state.bankroll);
  state.atmPromptOpen = false;
  elements.status.textContent = "Fresh cash on the table. The ATM debt is now on the books.";
  render();
  setControls({ deal: canDeal(), hit: false, stand: false, double: false, split: false });
}

function resetTraining() {
  state.correctDecisions = 0;
  state.totalDecisions = 0;
  state.perfectHands = 0;
  state.gradedHands = 0;
  state.lastHandRecap = [];
  state.currentHandLog = [];
}

function resetRunningScore() {
  state.wins = 0;
  state.losses = 0;
  state.pushes = 0;
}

function resetBankroll() {
  state.bankroll = 500;
  state.atmDebt = 0;
  state.currentBet = 0;
  state.atmPromptOpen = false;
  resetRunningScore();
  resetTraining();
  resetShoeState(true);
  elements.status.textContent = "Bankroll reset to $500.";
  render();
  setControls({ deal: canDeal(), hit: false, stand: false, double: false, split: false });
}

function updateShowCount(event) {
  state.showCount = event.target.checked;
  render();
}

function updateStrategyMode(event) {
  state.useCountStrategy = event.target.checked;
  render();
}

elements.dealButton.addEventListener("click", deal);
elements.hitButton.addEventListener("click", hit);
elements.standButton.addEventListener("click", stand);
elements.doubleButton.addEventListener("click", doubleDown);
elements.splitButton.addEventListener("click", splitHand);
elements.clearBetButton.addEventListener("click", clearBet);
elements.deckCount.addEventListener("change", updateDeckCount);
elements.atmYesButton.addEventListener("click", hitTheAtm);
elements.atmNoButton.addEventListener("click", resetBankroll);
elements.showCountToggle.addEventListener("change", updateShowCount);
elements.useCountStrategyToggle.addEventListener("change", updateStrategyMode);

for (const button of elements.chipButtons) {
  button.addEventListener("click", () => {
    addChipToBet(Number(button.dataset.chip));
  });
}

resetShoeState();
render();
