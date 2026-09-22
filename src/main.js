import { ChessGameManager } from './chess-game.js';
import { BoardUI } from './board-ui.js';
import { soundFx } from './audio.js';
import { getBestMove } from './bot.js';
import { PIECE_SVGS } from './assets/pieces.js';
import { ChessTimer } from './timer.js';
import { ChessNetwork } from './network.js';

// Application State
const game = new ChessGameManager();
const timer = new ChessTimer(180, 2);
const network = new ChessNetwork();
let boardUI = null;

let currentMode = 'bot-medium'; // 'pass' | 'bot-easy' | 'bot-medium' | 'bot-hard' | 'online'
let myOnlineColor = null; // 'w' | 'b' | null
let autoFlip = false;
let isMuted = false;
let activeSidebarTab = 'moves'; // 'moves' | 'chat'
let unreadChatCount = 0;

// DOM Elements: Header & Status
const headerStatus = document.getElementById('headerStatus');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const appModeBadge = document.getElementById('appModeBadge');
const roomPill = document.getElementById('roomPill');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const copyRoomLinkBtn = document.getElementById('copyRoomLinkBtn');
const headerLeaveRoomBtn = document.getElementById('headerLeaveRoomBtn');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundIcon = document.getElementById('soundIcon');
const openOnlineModalBtn = document.getElementById('openOnlineModalBtn');

// DOM Elements: Player Bars & Timers
const topPlayerCard = document.getElementById('topPlayerCard');
const topPlayerAvatar = document.getElementById('topPlayerAvatar');
const topPlayerName = document.getElementById('topPlayerName');
const topPlayerTag = document.getElementById('topPlayerTag');
const topCapturedPieces = document.getElementById('topCapturedPieces');
const topMaterialDiff = document.getElementById('topMaterialDiff');
const topTimer = document.getElementById('topTimer');
const topTurnPill = document.getElementById('topTurnPill');

const bottomPlayerCard = document.getElementById('bottomPlayerCard');
const bottomPlayerAvatar = document.getElementById('bottomPlayerAvatar');
const bottomPlayerName = document.getElementById('bottomPlayerName');
const bottomPlayerTag = document.getElementById('bottomPlayerTag');
const bottomCapturedPieces = document.getElementById('bottomCapturedPieces');
const bottomMaterialDiff = document.getElementById('bottomMaterialDiff');
const bottomTimer = document.getElementById('bottomTimer');
const bottomTurnPill = document.getElementById('bottomTurnPill');

// DOM Elements: Toolbar & Selectors
const flipBoardBtn = document.getElementById('flipBoardBtn');
const undoBtn = document.getElementById('undoBtn');
const undoBtnText = document.getElementById('undoBtnText');
const redoBtn = document.getElementById('redoBtn');
const newGameBtn = document.getElementById('newGameBtn');
const resignBtn = document.getElementById('resignBtn');
const drawBtn = document.getElementById('drawBtn');
const leaveRoomBtn = document.getElementById('leaveRoomBtn');
const onlineActionsRow = document.getElementById('onlineActionsRow');
const onlineLeaveRow = document.getElementById('onlineLeaveRow');
const localOptionsGrid = document.getElementById('localOptionsGrid');

const gameModeSelect = document.getElementById('gameModeSelect');
const timeControlSelect = document.getElementById('timeControlSelect');
const boardThemeSelect = document.getElementById('boardThemeSelect');
const autoFlipSwitch = document.getElementById('autoFlipSwitch');

// DOM Elements: Tabs, History & Chat
const tabMovesBtn = document.getElementById('tabMovesBtn');
const tabChatBtn = document.getElementById('tabChatBtn');
const paneMoves = document.getElementById('paneMoves');
const paneChat = document.getElementById('paneChat');
const chatUnreadBadge = document.getElementById('chatUnreadBadge');
const historyList = document.getElementById('historyList');
const moveCountBadge = document.getElementById('moveCountBadge');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

// DOM Elements: Modals
const onlineModal = document.getElementById('onlineModal');
const closeOnlineModalBtn = document.getElementById('closeOnlineModalBtn');
const roomTabCreateBtn = document.getElementById('roomTabCreateBtn');
const roomTabJoinBtn = document.getElementById('roomTabJoinBtn');
const sectionCreateRoom = document.getElementById('sectionCreateRoom');
const sectionJoinRoom = document.getElementById('sectionJoinRoom');
const onlineTimeSelect = document.getElementById('onlineTimeSelect');
const createRoomActionBtn = document.getElementById('createRoomActionBtn');
const createdRoomBox = document.getElementById('createdRoomBox');
const createdRoomCode = document.getElementById('createdRoomCode');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const roomCodeInput = document.getElementById('roomCodeInput');
const joinRoomActionBtn = document.getElementById('joinRoomActionBtn');

const takebackModal = document.getElementById('takebackModal');
const acceptTakebackBtn = document.getElementById('acceptTakebackBtn');
const declineTakebackBtn = document.getElementById('declineTakebackBtn');

const drawOfferModal = document.getElementById('drawOfferModal');
const acceptDrawBtn = document.getElementById('acceptDrawBtn');
const declineDrawBtn = document.getElementById('declineDrawBtn');

const rematchModal = document.getElementById('rematchModal');
const acceptRematchBtn = document.getElementById('acceptRematchBtn');
const declineRematchBtn = document.getElementById('declineRematchBtn');

const promotionModal = document.getElementById('promotionModal');
const promotionChoices = document.getElementById('promotionChoices');

const gameOverModal = document.getElementById('gameOverModal');
const gameOverTitle = document.getElementById('gameOverTitle');
const gameOverSubtitle = document.getElementById('gameOverSubtitle');
const modalRematchBtn = document.getElementById('modalRematchBtn');
const modalGameOverLeaveBtn = document.getElementById('modalGameOverLeaveBtn');

// Initialize Board UI
boardUI = new BoardUI(document.getElementById('chessboard'), game, {
  orientation: 'white',
  onMove: handlePlayerMove,
  onPromotion: showPromotionModal,
  onHistoryStep: handleHistoryStep
});

// Setup Timer Callbacks
timer.setCallbacks({
  onTick: handleTimerTick,
  onTimeout: handleTimerTimeout
});

// Setup Initial Theme
const savedTheme = localStorage.getItem('chess_theme') || 'default';
boardThemeSelect.value = savedTheme;
setBoardTheme(savedTheme);

// Event Listeners: Main Toolbar
flipBoardBtn.addEventListener('click', () => {
  const newOrientation = boardUI.toggleOrientation();
  updatePlayerBarsOrientation(newOrientation);
});

undoBtn.addEventListener('click', handleUndoOrTakeback);
redoBtn.addEventListener('click', handleRedo);
newGameBtn.addEventListener('click', () => {
  if (currentMode === 'online') {
    if (confirm('Start a new game? This will reset the online board.')) {
      startNewGame();
    }
  } else {
    startNewGame();
  }
});

modalRematchBtn.addEventListener('click', () => {
  if (currentMode === 'online') {
    network.sendRematchRequest();
    modalRematchBtn.textContent = 'Rematch Requested...';
    modalRematchBtn.disabled = true;
    addChatMessage('System', 'Rematch requested. Waiting for opponent...', 'system');
  } else {
    closeGameOverModal();
    startNewGame();
  }
});

// Leave Room Listeners
headerLeaveRoomBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to leave the room?')) {
    leaveOnlineRoom();
  }
});

leaveRoomBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to leave the room?')) {
    leaveOnlineRoom();
  }
});

modalGameOverLeaveBtn.addEventListener('click', () => {
  leaveOnlineRoom();
});

resignBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to resign?')) {
    network.sendResign();
    handleGameResigned(myOnlineColor);
  }
});

drawBtn.addEventListener('click', () => {
  network.sendDrawOffer();
  addChatMessage('System', 'Draw offer sent to opponent.', 'system');
});

gameModeSelect.addEventListener('change', (e) => {
  currentMode = e.target.value;
  updatePlayerBarLabels();
  if (isBotTurn() && !game.isGameOver()) {
    triggerBotMove();
  }
});

timeControlSelect.addEventListener('change', (e) => {
  const [initSec, inc] = parseTimeSelectValue(e.target.value);
  timer.reset(initSec, inc);
  updateAllUI();
});

boardThemeSelect.addEventListener('change', (e) => {
  setBoardTheme(e.target.value);
});

autoFlipSwitch.addEventListener('change', (e) => {
  autoFlip = e.target.checked;
});

soundToggleBtn.addEventListener('click', () => {
  isMuted = soundFx.toggleMute();
  updateSoundIcon();
});

// Tabs: Moves vs Chat
tabMovesBtn.addEventListener('click', () => switchSidebarTab('moves'));
tabChatBtn.addEventListener('click', () => switchSidebarTab('chat'));

// Chat Input Form & Emoji reactions
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = '';
  addChatMessage('You', text, 'mine');

  if (currentMode === 'online') {
    network.sendChat(text, 'Friend');
  }
});

document.querySelectorAll('.reaction-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.dataset.msg;
    addChatMessage('You', text, 'mine');
    if (currentMode === 'online') {
      network.sendChat(text, 'Friend');
    }
  });
});

// Online Modal Events
openOnlineModalBtn.addEventListener('click', () => {
  onlineModal.classList.add('open');
});

closeOnlineModalBtn.addEventListener('click', () => {
  onlineModal.classList.remove('open');
});

roomTabCreateBtn.addEventListener('click', () => {
  roomTabCreateBtn.classList.add('active');
  roomTabJoinBtn.classList.remove('active');
  sectionCreateRoom.classList.add('active');
  sectionJoinRoom.classList.remove('active');
});

roomTabJoinBtn.addEventListener('click', () => {
  roomTabJoinBtn.classList.add('active');
  roomTabCreateBtn.classList.remove('active');
  sectionJoinRoom.classList.add('active');
  sectionCreateRoom.classList.remove('active');
});

createRoomActionBtn.addEventListener('click', () => {
  const [initSec, inc] = parseTimeSelectValue(onlineTimeSelect.value);
  const selectedColor = document.querySelector('input[name="colorChoice"]:checked').value;

  // Crucial: Set Host's timer right away to match selected time control
  timer.reset(initSec, inc);

  const code = network.createRoom({ initial: initSec, increment: inc }, selectedColor);
  createdRoomCode.textContent = code;
  createdRoomBox.style.display = 'flex';
  createRoomActionBtn.style.display = 'none';

  myOnlineColor = network.playerColor;
  setupNetworkCallbacks();
});

copyLinkBtn.addEventListener('click', () => {
  const url = `${window.location.origin}${window.location.pathname}?room=${network.roomCode}`;
  navigator.clipboard.writeText(url).then(() => {
    copyLinkBtn.textContent = 'Link Copied!';
    setTimeout(() => { copyLinkBtn.innerHTML = `<span>Copy Invite Link</span>`; }, 2000);
  });
});

copyCodeBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(network.roomCode).then(() => {
    copyCodeBtn.textContent = 'Code Copied!';
    setTimeout(() => { copyCodeBtn.textContent = 'Copy Code'; }, 2000);
  });
});

copyRoomLinkBtn.addEventListener('click', () => {
  const url = `${window.location.origin}${window.location.pathname}?room=${network.roomCode}`;
  navigator.clipboard.writeText(url).then(() => {
    alert(`Invite Link Copied: ${url}`);
  });
});

joinRoomActionBtn.addEventListener('click', () => {
  const code = roomCodeInput.value.trim().toUpperCase();
  if (code.length < 4) {
    alert('Please enter a valid room code.');
    return;
  }
  setupNetworkCallbacks();
  network.joinRoom(code);
  joinRoomActionBtn.textContent = 'Connecting...';
  joinRoomActionBtn.disabled = true;
});

// Takeback Modal Handlers
acceptTakebackBtn.addEventListener('click', () => {
  takebackModal.classList.remove('open');
  network.sendUndoResponse(true);
  executeTakeback();
  addChatMessage('System', 'You accepted the takeback.', 'system');
});

declineTakebackBtn.addEventListener('click', () => {
  takebackModal.classList.remove('open');
  network.sendUndoResponse(false);
  addChatMessage('System', 'You declined the takeback.', 'system');
});

// Draw Offer Modal Handlers
acceptDrawBtn.addEventListener('click', () => {
  drawOfferModal.classList.remove('open');
  network.sendDrawResponse(true);
  handleDrawAgreed();
});

declineDrawBtn.addEventListener('click', () => {
  drawOfferModal.classList.remove('open');
  network.sendDrawResponse(false);
  addChatMessage('System', 'You declined the draw offer.', 'system');
});

// Rematch Modal Handlers
acceptRematchBtn.addEventListener('click', () => {
  rematchModal.classList.remove('open');
  // Invert colors for rematch
  const newHostColor = myOnlineColor === 'w' ? 'b' : 'w';
  myOnlineColor = newHostColor;
  network.sendRematchResponse(true, newHostColor);
  startOnlineRematchGame();
  addChatMessage('System', 'Rematch accepted! Colors swapped. Good luck!', 'system');
});

declineRematchBtn.addEventListener('click', () => {
  rematchModal.classList.remove('open');
  network.sendRematchResponse(false);
  addChatMessage('System', 'You declined the rematch request.', 'system');
});

// Check URL query parameter for automatic room joining
const urlParams = new URLSearchParams(window.location.search);
const autoRoomCode = urlParams.get('room');
if (autoRoomCode) {
  setupNetworkCallbacks();
  network.joinRoom(autoRoomCode);
  onlineModal.classList.add('open');
  roomTabJoinBtn.click();
  roomCodeInput.value = autoRoomCode.toUpperCase();
  joinRoomActionBtn.textContent = 'Connecting to Room...';
  joinRoomActionBtn.disabled = true;
}

// Initial Setup
const [defaultInit, defaultInc] = parseTimeSelectValue(timeControlSelect.value);
timer.reset(defaultInit, defaultInc);
updateAllUI();

// --------------------------------------------------------------------------
// Core Logic & Handlers
// --------------------------------------------------------------------------

function parseTimeSelectValue(val) {
  const [init, inc] = val.split(',').map(Number);
  return [init, inc];
}

function setBoardTheme(themeName) {
  if (themeName === 'default') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', themeName);
  }
  localStorage.setItem('chess_theme', themeName);
}

function updateSoundIcon() {
  if (isMuted) {
    soundToggleBtn.classList.add('active');
    soundIcon.innerHTML = `
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27l4.73 4.73H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
    `;
    soundToggleBtn.title = "Unmute Sound";
  } else {
    soundToggleBtn.classList.remove('active');
    soundIcon.innerHTML = `
      <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77zm-2.5 9.77l-4.5-4H3v6h4l4.5 4V4l-4.5 4zm4.5-1c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
    `;
    soundToggleBtn.title = "Mute Sound";
  }
}

function switchSidebarTab(tab) {
  activeSidebarTab = tab;
  if (tab === 'moves') {
    tabMovesBtn.classList.add('active');
    tabChatBtn.classList.remove('active');
    paneMoves.classList.add('active');
    paneChat.classList.remove('active');
  } else {
    tabChatBtn.classList.add('active');
    tabMovesBtn.classList.remove('active');
    paneChat.classList.add('active');
    paneMoves.classList.remove('active');
    unreadChatCount = 0;
    chatUnreadBadge.style.display = 'none';
  }
}

function addChatMessage(sender, text, type = 'theirs') {
  const emptyPrompt = chatMessages.querySelector('.chat-empty');
  if (emptyPrompt) emptyPrompt.remove();

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${type}`;

  if (type !== 'system') {
    const senderEl = document.createElement('span');
    senderEl.className = 'chat-sender';
    senderEl.textContent = sender;
    bubble.appendChild(senderEl);
  }

  const textEl = document.createElement('span');
  textEl.textContent = text;
  bubble.appendChild(textEl);

  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  if (type === 'theirs' && activeSidebarTab !== 'chat') {
    unreadChatCount++;
    chatUnreadBadge.textContent = unreadChatCount;
    chatUnreadBadge.style.display = 'inline-block';
  }
}

function handlePlayerMove(from, to, promotion = 'q') {
  const move = game.makeMove(from, to, promotion);
  if (!move) {
    soundFx.playIllegal();
    return;
  }

  playMoveSound(move);
  timer.switchTurn(game.getTurn());

  if (currentMode === 'online') {
    const myRemaining = myOnlineColor === 'w' ? timer.whiteTime : timer.blackTime;
    network.sendMove(from, to, promotion, myRemaining, game.getFen());
  }

  onMoveSuccess();
}

function onMoveSuccess() {
  updateAllUI();

  const status = game.getGameStatus();
  if (status.over) {
    timer.stop();
    soundFx.playGameOver();
    showGameOverModal(status);
    return;
  }

  if (autoFlip && currentMode === 'pass') {
    const nextTurn = game.getTurn();
    boardUI.setOrientation(nextTurn === 'w' ? 'white' : 'black');
    updatePlayerBarsOrientation(boardUI.orientation);
  }

  if (isBotTurn()) {
    triggerBotMove();
  }
}

function isBotTurn() {
  return currentMode.startsWith('bot-') && game.getTurn() === 'b' && !game.isGameOver();
}

function triggerBotMove() {
  statusText.textContent = 'Bot is thinking...';
  statusIndicator.className = 'status-indicator';

  setTimeout(() => {
    if (game.isGameOver() || game.getTurn() !== 'b') return;

    const difficulty = currentMode.replace('bot-', '');
    const botMove = getBestMove(game.getFen(), difficulty);

    if (botMove) {
      const executed = game.makeMove(botMove.from, botMove.to, botMove.promotion || 'q');
      if (executed) {
        playMoveSound(executed);
        timer.switchTurn(game.getTurn());
        updateAllUI();

        const status = game.getGameStatus();
        if (status.over) {
          timer.stop();
          soundFx.playGameOver();
          showGameOverModal(status);
        }
      }
    }
  }, 350);
}

function playMoveSound(move) {
  if (game.isGameOver()) {
    soundFx.playGameOver();
  } else if (game.isCheck()) {
    soundFx.playCheck();
  } else if (move.flags && (move.flags.includes('k') || move.flags.includes('q'))) {
    soundFx.playCastle();
  } else if (move.captured) {
    soundFx.playCapture();
  } else {
    soundFx.playMove();
  }
}

// --------------------------------------------------------------------------
// Undo / Takeback Handling
// --------------------------------------------------------------------------

function handleUndoOrTakeback() {
  if (!game.canUndo()) return;

  if (currentMode === 'online') {
    const lastMove = game.getLastMove();
    if (!lastMove) return;

    // Strict check: player can ONLY request takeback for their own move!
    if (lastMove.color !== myOnlineColor) {
      addChatMessage('System', 'You can only take back your own move, not your opponent\'s.', 'system');
      return;
    }

    network.sendUndoRequest();
    addChatMessage('System', 'Takeback requested. Waiting for opponent to accept...', 'system');
    undoBtn.disabled = true;
    setTimeout(() => { updateActionButtons(); }, 4000);
    return;
  }

  // Local / Bot undo
  if (currentMode.startsWith('bot-') && game.getTurn() === 'w') {
    game.undo();
    if (game.canUndo()) {
      game.undo();
    }
  } else {
    game.undo();
  }

  soundFx.playUndo();
  timer.switchTurn(game.getTurn());
  updateAllUI();
}

function executeTakeback() {
  game.undo();
  soundFx.playUndo();
  timer.switchTurn(game.getTurn());
  updateAllUI();
}

function handleRedo() {
  if (!game.canRedo()) return;
  const move = game.redo();
  if (move) {
    playMoveSound(move);
    timer.switchTurn(game.getTurn());
    updateAllUI();
  }
}

function handleHistoryStep(viewIdx, total) {
  updateAllUI();
  soundFx.playUndo();
}

function startNewGame() {
  game.reset();
  boardUI.clearSelection();
  closeGameOverModal();

  const [initSec, inc] = parseTimeSelectValue(timeControlSelect.value);
  timer.reset(initSec, inc);

  updateAllUI();
}

function handleGameResigned(resignedColor) {
  timer.stop();
  const winner = resignedColor === 'w' ? 'Black' : 'White';
  const status = {
    over: true,
    type: 'resignation',
    title: `${winner} wins by Resignation`,
    winner
  };
  soundFx.playGameOver();
  showGameOverModal(status);
}

function handleDrawAgreed() {
  timer.stop();
  const status = {
    over: true,
    type: 'draw',
    title: 'Draw by Mutual Agreement',
    winner: null
  };
  soundFx.playGameOver();
  showGameOverModal(status);
}

function leaveOnlineRoom() {
  network.disconnect();
  currentMode = 'bot-medium';
  myOnlineColor = null;
  appModeBadge.textContent = 'LOCAL';
  appModeBadge.className = 'brand-badge';
  roomPill.style.display = 'none';
  onlineActionsRow.style.display = 'none';
  onlineLeaveRow.style.display = 'none';
  modalGameOverLeaveBtn.style.display = 'none';
  localOptionsGrid.style.display = 'grid';
  undoBtnText.textContent = 'Undo';
  boardUI.setAllowedColor(null);
  boardUI.setOrientation('white');

  // Clear query params from URL
  const url = new URL(window.location.href);
  url.searchParams.delete('room');
  window.history.replaceState({}, '', url.pathname);

  addChatMessage('System', 'You left the room. Returned to local play.', 'system');
  closeGameOverModal();
  rematchModal.classList.remove('open');
  startNewGame();
}

function startOnlineRematchGame() {
  game.reset();
  boardUI.clearSelection();
  boardUI.setOrientation(myOnlineColor === 'w' ? 'white' : 'black');
  boardUI.setAllowedColor(myOnlineColor);

  closeGameOverModal();
  rematchModal.classList.remove('open');

  if (network.timeControl) {
    timer.reset(network.timeControl.initial, network.timeControl.increment);
  }

  updatePlayerBarLabels();
  updateAllUI();
}

// --------------------------------------------------------------------------
// Timer Event Handlers
// --------------------------------------------------------------------------

function handleTimerTick(state) {
  const isWhiteBottom = boardUI.orientation === 'white';

  const bottomFormatted = isWhiteBottom ? state.whiteFormatted : state.blackFormatted;
  const topFormatted = isWhiteBottom ? state.blackFormatted : state.whiteFormatted;

  const bottomLow = isWhiteBottom ? state.whiteLow : state.blackLow;
  const topLow = isWhiteBottom ? state.blackLow : state.whiteLow;

  const bottomActive = (isWhiteBottom && state.activeColor === 'w') || (!isWhiteBottom && state.activeColor === 'b');
  const topActive = (isWhiteBottom && state.activeColor === 'b') || (!isWhiteBottom && state.activeColor === 'w');

  bottomTimer.textContent = bottomFormatted;
  topTimer.textContent = topFormatted;

  bottomTimer.className = `player-timer ${bottomActive ? 'active' : ''} ${bottomLow ? 'low-time' : ''}`;
  topTimer.className = `player-timer ${topActive ? 'active' : ''} ${topLow ? 'low-time' : ''}`;

  if (!state.hasTimer) {
    bottomTimer.style.display = 'none';
    topTimer.style.display = 'none';
  } else {
    bottomTimer.style.display = 'block';
    topTimer.style.display = 'block';
  }
}

function handleTimerTimeout(color) {
  soundFx.playGameOver();
  const winner = color === 'w' ? 'Black' : 'White';
  const status = {
    over: true,
    type: 'timeout',
    title: `${winner} wins on Time!`,
    winner
  };
  showGameOverModal(status);
}

// --------------------------------------------------------------------------
// Online Network Setup
// --------------------------------------------------------------------------

function setupNetworkCallbacks() {
  network.setCallback('onConnected', (code) => {
    roomCodeDisplay.textContent = code;
  });

  network.setCallback('onOpponentJoined', (data) => {
    onlineModal.classList.remove('open');

    // Make sure host timer is synchronized with chosen time control
    if (network.timeControl) {
      timer.reset(network.timeControl.initial, network.timeControl.increment);
    }

    enterOnlineMode();
    addChatMessage('System', `${data.name || 'Friend'} joined the game!`, 'system');
  });

  network.setCallback('onGameSync', (config) => {
    onlineModal.classList.remove('open');
    myOnlineColor = config.playerColor;

    if (config.timeControl) {
      timer.reset(config.timeControl.initial, config.timeControl.increment);
    }

    enterOnlineMode();
    addChatMessage('System', `Connected! You are playing as ${myOnlineColor === 'w' ? 'White' : 'Black'}.`, 'system');
  });

  network.setCallback('onMove', (data) => {
    const move = game.makeMove(data.from, data.to, data.promotion);
    if (move) {
      playMoveSound(move);
      timer.switchTurn(game.getTurn());

      // Sync opponent's clock precisely
      if (data.timeRemaining !== undefined) {
        if (myOnlineColor === 'w') {
          timer.blackTime = data.timeRemaining;
        } else {
          timer.whiteTime = data.timeRemaining;
        }
      }

      onMoveSuccess();
    }
  });

  network.setCallback('onChat', (data) => {
    addChatMessage(data.senderName || 'Friend', data.text, 'theirs');
    soundFx.playMove();
  });

  network.setCallback('onUndoRequest', () => {
    takebackModal.classList.add('open');
  });

  network.setCallback('onUndoResponse', (accepted) => {
    if (accepted) {
      executeTakeback();
      addChatMessage('System', 'Takeback was accepted.', 'system');
    } else {
      addChatMessage('System', 'Takeback request was declined by opponent.', 'system');
    }
  });

  network.setCallback('onResign', (color) => {
    handleGameResigned(color);
  });

  network.setCallback('onDrawOffer', () => {
    drawOfferModal.classList.add('open');
  });

  network.setCallback('onDrawResponse', (accepted) => {
    if (accepted) {
      handleDrawAgreed();
    } else {
      addChatMessage('System', 'Draw offer declined.', 'system');
    }
  });

  network.setCallback('onRematchRequest', () => {
    rematchModal.classList.add('open');
    soundFx.playCheck();
    addChatMessage('System', 'Opponent has requested a rematch!', 'system');
  });

  network.setCallback('onRematchResponse', (accepted, newHostColor) => {
    if (accepted) {
      if (newHostColor) {
        myOnlineColor = newHostColor === 'w' ? 'b' : 'w';
      } else {
        myOnlineColor = myOnlineColor === 'w' ? 'b' : 'w';
      }
      startOnlineRematchGame();
      addChatMessage('System', 'Rematch accepted! Colors swapped. Good luck!', 'system');
    } else {
      modalRematchBtn.textContent = 'Request Rematch';
      modalRematchBtn.disabled = false;
      addChatMessage('System', 'Rematch offer declined by opponent.', 'system');
    }
  });

  network.setCallback('onOpponentLeft', () => {
    addChatMessage('System', 'Your opponent has left the room.', 'system');
    statusText.textContent = 'Opponent left room';
  });

  network.setCallback('onError', (msg) => {
    console.warn('Network message:', msg);
  });
}

function enterOnlineMode() {
  currentMode = 'online';
  appModeBadge.textContent = 'ONLINE';
  appModeBadge.className = 'brand-badge online';
  roomPill.style.display = 'flex';
  onlineActionsRow.style.display = 'grid';
  onlineLeaveRow.style.display = 'grid';
  modalGameOverLeaveBtn.style.display = 'block';
  localOptionsGrid.style.display = 'none';
  undoBtnText.textContent = 'Takeback';

  // Set board orientation to match player's color
  boardUI.setOrientation(myOnlineColor === 'w' ? 'white' : 'black');
  boardUI.setAllowedColor(myOnlineColor);

  updatePlayerBarLabels();
  updateAllUI();
}

// --------------------------------------------------------------------------
// UI Rendering & Helpers
// --------------------------------------------------------------------------

function showPromotionModal(from, to, callback) {
  const turn = game.getTurn();
  promotionChoices.innerHTML = '';

  const pieceTypes = ['q', 'n', 'r', 'b'];
  pieceTypes.forEach(type => {
    const btn = document.createElement('button');
    btn.className = 'promotion-piece-btn';
    btn.innerHTML = PIECE_SVGS[`${turn}${type}`];
    btn.addEventListener('click', () => {
      promotionModal.classList.remove('open');
      callback(type);
    });
    promotionChoices.appendChild(btn);
  });

  promotionModal.classList.add('open');
}

function showGameOverModal(status) {
  gameOverTitle.textContent = status.title;
  if (status.type === 'checkmate') {
    gameOverSubtitle.textContent = `Magnificent game! ${status.winner} won by checkmate.`;
  } else if (status.type === 'timeout') {
    gameOverSubtitle.textContent = `${status.winner} won because the opponent ran out of time.`;
  } else if (status.type === 'resignation') {
    gameOverSubtitle.textContent = `${status.winner} won by opponent resignation.`;
  } else {
    gameOverSubtitle.textContent = `The game concluded with a ${status.title.toLowerCase()}.`;
  }

  if (currentMode === 'online') {
    modalRematchBtn.textContent = 'Request Rematch';
    modalRematchBtn.disabled = false;
    modalGameOverLeaveBtn.style.display = 'block';
  } else {
    modalRematchBtn.textContent = 'Play Again';
    modalRematchBtn.disabled = false;
    modalGameOverLeaveBtn.style.display = 'none';
  }

  gameOverModal.classList.add('open');
}

function closeGameOverModal() {
  gameOverModal.classList.remove('open');
}

function updateAllUI() {
  boardUI.render();
  updateGameStatusBadge();
  updateActionButtons();
  updateMoveHistory();
  updateCapturedPieces();
  updatePlayerBarsTurn();
}

function updateGameStatusBadge() {
  const status = game.getGameStatus();
  statusText.textContent = status.title;

  statusIndicator.className = 'status-indicator';
  if (status.type === 'check') {
    statusIndicator.classList.add('check');
  } else if (status.over) {
    statusIndicator.style.backgroundColor = 'var(--accent-gold)';
    statusIndicator.style.boxShadow = '0 0 10px var(--accent-gold)';
  } else {
    statusIndicator.style.backgroundColor = 'var(--accent-green)';
    statusIndicator.style.boxShadow = '0 0 8px var(--accent-green)';
  }
}

function updateActionButtons() {
  if (currentMode === 'online') {
    const lastMove = game.getLastMove();
    // In online mode: Takeback is ONLY enabled if the last move made was yours!
    undoBtn.disabled = !game.canUndo() || !lastMove || lastMove.color !== myOnlineColor;
  } else {
    undoBtn.disabled = !game.canUndo();
  }
  redoBtn.disabled = !game.canRedo();
}

function updatePlayerBarsOrientation(orientation) {
  if (orientation === 'white') {
    topPlayerAvatar.textContent = '♟️';
    topPlayerName.textContent = getPlayerName('b');
    topPlayerTag.textContent = 'Black';

    bottomPlayerAvatar.textContent = '♙';
    bottomPlayerName.textContent = getPlayerName('w');
    bottomPlayerTag.textContent = 'White';
  } else {
    topPlayerAvatar.textContent = '♙';
    topPlayerName.textContent = getPlayerName('w');
    topPlayerTag.textContent = 'White';

    bottomPlayerAvatar.textContent = '♟️';
    bottomPlayerName.textContent = getPlayerName('b');
    bottomPlayerTag.textContent = 'Black';
  }
  updateCapturedPieces();
  updatePlayerBarsTurn();
}

function getPlayerName(color) {
  if (currentMode === 'online') {
    if (color === myOnlineColor) return 'You';
    return 'Friend';
  }
  if (currentMode.startsWith('bot-')) {
    if (color === 'w') return 'You';
    if (currentMode === 'bot-easy') return 'StockBot (Easy)';
    if (currentMode === 'bot-medium') return 'StockBot (Medium)';
    if (currentMode === 'bot-hard') return 'StockBot (Hard)';
  }
  return color === 'w' ? 'White (P1)' : 'Black (P2)';
}

function updatePlayerBarLabels() {
  updatePlayerBarsOrientation(boardUI.orientation);
}

function updatePlayerBarsTurn() {
  const turn = game.getTurn();
  const isWhiteBottom = boardUI.orientation === 'white';
  const bottomIsTurn = (isWhiteBottom && turn === 'w') || (!isWhiteBottom && turn === 'b');

  if (bottomIsTurn) {
    bottomPlayerCard.classList.add('active-turn');
    bottomTurnPill.textContent = 'To Move';
    topPlayerCard.classList.remove('active-turn');
    topTurnPill.textContent = 'Waiting';
  } else {
    topPlayerCard.classList.add('active-turn');
    topTurnPill.textContent = 'To Move';
    bottomPlayerCard.classList.remove('active-turn');
    bottomTurnPill.textContent = 'Waiting';
  }

  if (game.isGameOver()) {
    topPlayerCard.classList.remove('active-turn');
    bottomPlayerCard.classList.remove('active-turn');
    topTurnPill.textContent = 'Finished';
    bottomTurnPill.textContent = 'Finished';
  }
}

function updateCapturedPieces() {
  const capData = game.getCapturedData();
  const isWhiteBottom = boardUI.orientation === 'white';

  const whiteCapturedContainer = isWhiteBottom ? bottomCapturedPieces : topCapturedPieces;
  const blackCapturedContainer = isWhiteBottom ? topCapturedPieces : bottomCapturedPieces;

  const whiteDiffEl = isWhiteBottom ? bottomMaterialDiff : topMaterialDiff;
  const blackDiffEl = isWhiteBottom ? topMaterialDiff : bottomMaterialDiff;

  whiteCapturedContainer.innerHTML = capData.capturedByWhite.map(p => {
    return `<div class="captured-piece-mini">${PIECE_SVGS[`b${p.type}`]}</div>`;
  }).join('');
  whiteDiffEl.textContent = capData.whiteScoreAdvantage || '';

  blackCapturedContainer.innerHTML = capData.capturedByBlack.map(p => {
    return `<div class="captured-piece-mini">${PIECE_SVGS[`w${p.type}`]}</div>`;
  }).join('');
  blackDiffEl.textContent = capData.blackScoreAdvantage || '';
}

function updateMoveHistory() {
  const history = game.getHistory();
  moveCountBadge.textContent = history.length;

  if (history.length === 0) {
    historyList.innerHTML = `
      <div class="history-empty" id="historyEmpty">
        <p>Use keyboard <strong>← / →</strong> to review moves at any time.</p>
      </div>
    `;
    return;
  }

  const currentViewIdx = game.getViewIndex();

  let html = '';
  for (let i = 0; i < history.length; i += 2) {
    const turnNumber = Math.floor(i / 2) + 1;
    const whiteMove = history[i];
    const blackMove = history[i + 1];

    const whiteIdx = i + 1;
    const blackIdx = i + 2;

    const whiteActive = (currentViewIdx === whiteIdx) ? 'active' : '';
    const blackActive = (currentViewIdx === blackIdx) ? 'active' : '';

    html += `
      <div class="move-row">
        <span class="move-num">${turnNumber}.</span>
        <span class="move-san ${whiteActive}" data-move-idx="${whiteIdx}">${whiteMove ? whiteMove.san : ''}</span>
        <span class="move-san ${blackActive}" data-move-idx="${blackIdx}">${blackMove ? blackMove.san : ''}</span>
      </div>
    `;
  }

  historyList.innerHTML = html;

  if (!game.isViewingHistory()) {
    historyList.scrollTop = historyList.scrollHeight;
  }

  const sanElements = historyList.querySelectorAll('.move-san');
  sanElements.forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.moveIdx, 10);
      if (!isNaN(idx)) {
        game.jumpToHistory(idx);
        boardUI.render();
        updateAllUI();
      }
    });
  });
}
