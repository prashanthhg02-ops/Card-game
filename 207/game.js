const CARD_SETS = {
  easy: ["🍓", "🍋", "🍇", "🍊", "🍉", "🍒", "🥝", "🍍"],
  medium: ["🍓", "🍋", "🍇", "🍊", "🍉", "🍒", "🥝", "🍍", "🥑", "🍑"],
  hard: ["🍓", "🍋", "🍇", "🍊", "🍉", "🍒", "🥝", "🍍", "🥑", "🍑", "🫐", "🥥", "🍈", "🍐", "🥕", "🌽", "🍄", "🌶️"],
};

const grid = document.querySelector("#card-grid");
const movesElement = document.querySelector("#moves");
const timerElement = document.querySelector("#timer");
const matchesElement = document.querySelector("#matches");
const pairTotalElement = document.querySelector("#pair-total");
const difficultySelect = document.querySelector("#difficulty");
const restartButton = document.querySelector("#restart");
const playAgainButton = document.querySelector("#play-again");
const winMessage = document.querySelector("#win-message");
const winSummary = document.querySelector("#win-summary");
const bestScore = document.querySelector("#best-score");
const boardHint = document.querySelector("#board-hint");

let firstCard = null;
let secondCard = null;
let isLocked = false;
let moves = 0;
let matches = 0;
let elapsedSeconds = 0;
let timerId = null;
let mismatchTimeoutId = null;
let hasStarted = false;
let gameFinished = false;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function shuffle(cards) {
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[randomIndex]] = [cards[randomIndex], cards[index]];
  }

  return cards;
}

function startTimer() {
  if (hasStarted) return;

  hasStarted = true;
  timerId = window.setInterval(() => {
    elapsedSeconds += 1;
    timerElement.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function updateBestScore() {
  const best = localStorage.getItem(`flip-and-find-best-${difficultySelect.value}`);
  const value = document.createElement("span");
  value.textContent = best ? `${best} moves` : "—";
  bestScore.replaceChildren("Your best: ", value);
}

function createCard(symbol, index) {
  const card = document.createElement("button");
  card.className = "card";
  card.type = "button";
  card.dataset.symbol = symbol;
  card.setAttribute("aria-label", `Card ${index + 1}, face down`);

  const back = document.createElement("span");
  back.className = "card-back";
  back.setAttribute("aria-hidden", "true");
  const backMark = document.createElement("span");
  backMark.textContent = "✳";
  back.append(backMark);

  const face = document.createElement("span");
  face.className = "card-face";
  face.setAttribute("aria-hidden", "true");
  face.textContent = symbol;

  card.append(back, face);
  card.addEventListener("click", () => flipCard(card));
  return card;
}

function flipCard(card) {
  if (
    isLocked ||
    gameFinished ||
    card === firstCard ||
    card.classList.contains("is-matched") ||
    card.classList.contains("is-flipped")
  ) {
    return;
  }

  startTimer();
  card.classList.add("is-flipped");
  card.setAttribute("aria-label", `Card showing ${card.dataset.symbol}`);

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  moves += 1;
  movesElement.textContent = moves;
  isLocked = true;

  if (firstCard.dataset.symbol === secondCard.dataset.symbol) {
    firstCard.classList.add("is-matched");
    secondCard.classList.add("is-matched");
    firstCard.setAttribute("aria-label", `Matched ${firstCard.dataset.symbol}`);
    secondCard.setAttribute("aria-label", `Matched ${secondCard.dataset.symbol}`);
    firstCard.disabled = true;
    secondCard.disabled = true;
    matches += 1;
    matchesElement.textContent = matches;
    resetTurn();

    if (matches === CARD_SETS[difficultySelect.value].length) {
      finishGame();
    }
    return;
  }

  const unmatchedCards = [firstCard, secondCard];
  mismatchTimeoutId = window.setTimeout(() => {
    unmatchedCards.forEach((flippedCard) => {
      flippedCard.classList.remove("is-flipped");
      flippedCard.setAttribute(
        "aria-label",
        `Card ${Array.from(grid.children).indexOf(flippedCard) + 1}, face down`,
      );
    });
    mismatchTimeoutId = null;
    resetTurn();
  }, 850);
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  isLocked = false;
}

function finishGame() {
  gameFinished = true;
  window.clearInterval(timerId);
  boardHint.textContent = "All pairs found!";
  winSummary.textContent = `You found them all in ${moves} moves and ${formatTime(elapsedSeconds)}.`;
  winMessage.hidden = false;

  const storageKey = `flip-and-find-best-${difficultySelect.value}`;
  const previousBest = Number(localStorage.getItem(storageKey));
  if (!previousBest || moves < previousBest) {
    localStorage.setItem(storageKey, String(moves));
    updateBestScore();
    winSummary.textContent += " A new personal best!";
  }
}

function startNewGame() {
  window.clearInterval(timerId);
  window.clearTimeout(mismatchTimeoutId);
  mismatchTimeoutId = null;
  firstCard = null;
  secondCard = null;
  isLocked = false;
  moves = 0;
  matches = 0;
  elapsedSeconds = 0;
  hasStarted = false;
  gameFinished = false;

  movesElement.textContent = "0";
  matchesElement.textContent = "0";
  timerElement.textContent = "00:00";
  pairTotalElement.textContent = CARD_SETS[difficultySelect.value].length;
  boardHint.textContent = "Tap a card to flip it";
  winMessage.hidden = true;
  grid.replaceChildren(
    ...shuffle([...CARD_SETS[difficultySelect.value], ...CARD_SETS[difficultySelect.value]])
      .map((symbol, index) => createCard(symbol, index)),
  );
  grid.dataset.difficulty = difficultySelect.value;
  updateBestScore();
}

difficultySelect.addEventListener("change", startNewGame);
restartButton.addEventListener("click", startNewGame);
playAgainButton.addEventListener("click", startNewGame);

startNewGame();
