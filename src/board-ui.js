import { getPieceSvg, PIECE_SVGS } from './assets/pieces.js';

export class BoardUI {
  constructor(containerElement, game, options = {}) {
    this.container = containerElement;
    this.game = game;
    this.orientation = options.orientation || 'white'; // 'white' or 'black'
    this.allowedColor = options.allowedColor || null; // null for local, 'w' or 'b' for online lock
    this.selectedSquare = null;
    this.possibleMoves = [];
    this.onMoveCallback = options.onMove || (() => {});
    this.onPromotionCallback = options.onPromotion || null;
    this.onHistoryStep = options.onHistoryStep || (() => {});

    // Drag state
    this.isDragging = false;
    this.draggedPiece = null;
    this.dragStartSquare = null;
    this.dragGhost = null;

    this.init();
  }

  init() {
    this.render();
    this.bindGlobalEvents();
  }

  setAllowedColor(color) {
    this.allowedColor = color;
  }

  setOrientation(orientation) {
    if (this.orientation !== orientation) {
      this.orientation = orientation;
      this.clearSelection();
      this.render();
    }
  }

  toggleOrientation() {
    this.setOrientation(this.orientation === 'white' ? 'black' : 'white');
    return this.orientation;
  }

  clearSelection() {
    this.selectedSquare = null;
    this.possibleMoves = [];
  }

  render() {
    this.container.innerHTML = '';
    const board = this.game.getCurrentDisplayBoard();
    const lastMove = this.game.getLastMove();
    const isHistory = this.game.isViewingHistory();
    const checkedKingSquare = (!isHistory && this.game.isCheck()) ? this.game.getKingSquare(this.game.getTurn()) : null;

    const ranks = this.orientation === 'white' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const files = this.orientation === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

    const fileLetters = 'abcdefgh';

    for (let rIdx = 0; rIdx < 8; rIdx++) {
      const r = ranks[rIdx];
      for (let fIdx = 0; fIdx < 8; fIdx++) {
        const f = files[fIdx];
        const squareName = `${fileLetters[f]}${r + 1}`;
        const isLight = (r + f) % 2 !== 0;

        const squareEl = document.createElement('div');
        squareEl.className = `square ${isLight ? 'light' : 'dark'}`;
        squareEl.dataset.square = squareName;

        // Coordinate labels (Chess.com style)
        if (rIdx === 7) {
          const fileLabel = document.createElement('span');
          fileLabel.className = `coord-label coord-file ${isLight ? 'on-light' : 'on-dark'}`;
          fileLabel.textContent = fileLetters[f];
          squareEl.appendChild(fileLabel);
        }
        if (fIdx === 0) {
          const rankLabel = document.createElement('span');
          rankLabel.className = `coord-label coord-rank ${isLight ? 'on-light' : 'on-dark'}`;
          rankLabel.textContent = (r + 1).toString();
          squareEl.appendChild(rankLabel);
        }

        // Highlight last move (if not in history or matching history)
        if (lastMove && (lastMove.from === squareName || lastMove.to === squareName)) {
          squareEl.classList.add('last-move');
        }

        // Highlight selected square
        if (this.selectedSquare === squareName) {
          squareEl.classList.add('selected');
        }

        // Highlight king in check
        if (checkedKingSquare === squareName) {
          squareEl.classList.add('in-check');
        }

        // Check if this square is a possible move
        if (!isHistory) {
          const moveOption = this.possibleMoves.find(m => m.to === squareName);
          if (moveOption) {
            const isCapture = moveOption.captured || (moveOption.flags && moveOption.flags.includes('e'));
            const hint = document.createElement('div');
            hint.className = isCapture ? 'hint-capture' : 'hint-dot';
            squareEl.appendChild(hint);
          }
        }

        // Piece on this square
        const boardRow = 7 - r;
        const piece = board[boardRow][f];
        if (piece) {
          const pieceEl = document.createElement('div');
          pieceEl.className = 'chess-piece';
          pieceEl.dataset.piece = `${piece.color}${piece.type}`;
          pieceEl.dataset.square = squareName;
          pieceEl.innerHTML = getPieceSvg(piece);

          if (this.isDragging && this.dragStartSquare === squareName) {
            pieceEl.classList.add('dragging');
          }

          squareEl.appendChild(pieceEl);
        }

        this.bindSquareEvents(squareEl, squareName);
        this.container.appendChild(squareEl);
      }
    }

    // Floating banner if viewing past moves
    if (isHistory) {
      const viewIdx = this.game.getViewIndex();
      const total = this.game.getTotalPositions();
      const banner = document.createElement('div');
      banner.className = 'history-banner';
      banner.innerHTML = `
        <span>Viewing move <strong>${viewIdx}</strong> / ${total - 1}</span>
        <button class="history-banner-btn" id="returnLiveBtn">Return to live (↓)</button>
      `;
      banner.querySelector('#returnLiveBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.game.jumpToLive();
        this.render();
        this.onHistoryStep(this.game.getViewIndex(), this.game.getTotalPositions());
      });
      this.container.appendChild(banner);
    }
  }

  bindSquareEvents(squareEl, squareName) {
    squareEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleSquareClick(squareName);
    });

    const pieceEl = squareEl.querySelector('.chess-piece');
    if (pieceEl) {
      pieceEl.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        this.startDrag(e, squareName, pieceEl);
      });
      pieceEl.addEventListener('touchstart', (e) => {
        this.startDrag(e, squareName, pieceEl);
      }, { passive: false });
    }
  }

  handleSquareClick(squareName) {
    if (this.game.isViewingHistory()) {
      this.game.jumpToLive();
      this.render();
      this.onHistoryStep(this.game.getViewIndex(), this.game.getTotalPositions());
      return;
    }

    // If online color locked and it's not our color's turn, do nothing
    if (this.allowedColor && this.game.getTurn() !== this.allowedColor) {
      return;
    }

    if (this.selectedSquare) {
      if (this.selectedSquare === squareName) {
        this.clearSelection();
        this.render();
        return;
      }

      const validMove = this.possibleMoves.find(m => m.to === squareName);
      if (validMove) {
        this.triggerMoveAttempt(this.selectedSquare, squareName, validMove);
        return;
      }

      const currentBoard = this.game.getBoard();
      const targetPiece = this.getPieceAt(squareName, currentBoard);
      if (targetPiece && targetPiece.color === this.game.getTurn()) {
        if (!this.allowedColor || targetPiece.color === this.allowedColor) {
          this.selectSquare(squareName);
          return;
        }
      }

      this.clearSelection();
      this.render();
      return;
    }

    const currentBoard = this.game.getBoard();
    const piece = this.getPieceAt(squareName, currentBoard);
    if (piece && piece.color === this.game.getTurn()) {
      if (!this.allowedColor || piece.color === this.allowedColor) {
        this.selectSquare(squareName);
      }
    }
  }

  selectSquare(squareName) {
    this.selectedSquare = squareName;
    this.possibleMoves = this.game.getPossibleMoves(squareName);
    this.render();
  }

  startDrag(e, squareName, pieceEl) {
    if (this.game.isViewingHistory()) return;

    // Check turn
    if (this.allowedColor && this.game.getTurn() !== this.allowedColor) return;

    const currentBoard = this.game.getBoard();
    const piece = this.getPieceAt(squareName, currentBoard);
    if (!piece || piece.color !== this.game.getTurn()) return;
    if (this.allowedColor && piece.color !== this.allowedColor) return;

    if (e.type === 'touchstart') {
      e.preventDefault();
    }

    this.isDragging = true;
    this.dragStartSquare = squareName;
    this.selectedSquare = squareName;
    this.possibleMoves = this.game.getPossibleMoves(squareName);

    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    const ghost = document.createElement('div');
    ghost.className = 'chess-piece-ghost';
    ghost.innerHTML = pieceEl.innerHTML;
    ghost.style.left = `${clientX}px`;
    ghost.style.top = `${clientY}px`;
    document.body.appendChild(ghost);
    this.dragGhost = ghost;

    this.render();
  }

  bindGlobalEvents() {
    const onMove = (e) => {
      if (!this.isDragging || !this.dragGhost) return;
      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
      this.dragGhost.style.left = `${clientX}px`;
      this.dragGhost.style.top = `${clientY}px`;
    };

    const onEnd = (e) => {
      if (!this.isDragging) return;

      const clientX = e.type === 'touchend' ? (e.changedTouches[0]?.clientX || 0) : e.clientX;
      const clientY = e.type === 'touchend' ? (e.changedTouches[0]?.clientY || 0) : e.clientY;

      if (this.dragGhost) {
        this.dragGhost.remove();
        this.dragGhost = null;
      }

      this.isDragging = false;
      const fromSquare = this.dragStartSquare;
      this.dragStartSquare = null;

      const elBelow = document.elementFromPoint(clientX, clientY);
      const targetSquareEl = elBelow ? elBelow.closest('.square') : null;
      const targetSquare = targetSquareEl ? targetSquareEl.dataset.square : null;

      if (targetSquare && fromSquare && targetSquare !== fromSquare) {
        const validMove = this.possibleMoves.find(m => m.to === targetSquare);
        if (validMove) {
          this.triggerMoveAttempt(fromSquare, targetSquare, validMove);
          return;
        }
      }

      this.render();
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    // Keyboard Arrow Keys for move history review
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (this.game.stepBackward()) {
          this.clearSelection();
          this.render();
          this.onHistoryStep(this.game.getViewIndex(), this.game.getTotalPositions());
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (this.game.stepForward()) {
          this.clearSelection();
          this.render();
          this.onHistoryStep(this.game.getViewIndex(), this.game.getTotalPositions());
        }
      } else if (e.key === 'ArrowUp' || e.key === 'Home') {
        e.preventDefault();
        if (this.game.jumpToStart()) {
          this.clearSelection();
          this.render();
          this.onHistoryStep(this.game.getViewIndex(), this.game.getTotalPositions());
        }
      } else if (e.key === 'ArrowDown' || e.key === 'End') {
        e.preventDefault();
        if (this.game.jumpToEnd()) {
          this.clearSelection();
          this.render();
          this.onHistoryStep(this.game.getViewIndex(), this.game.getTotalPositions());
        }
      }
    });
  }

  triggerMoveAttempt(from, to, moveInfo) {
    const isPromotion = moveInfo.promotion || 
      (moveInfo.piece === 'p' && (to.endsWith('8') || to.endsWith('1')));

    if (isPromotion) {
      if (this.onPromotionCallback) {
        this.onPromotionCallback(from, to, (chosenPiece) => {
          this.clearSelection();
          this.onMoveCallback(from, to, chosenPiece);
        });
        return;
      }
    }

    this.clearSelection();
    this.onMoveCallback(from, to, 'q');
  }

  getPieceAt(squareName, board) {
    const file = squareName.charCodeAt(0) - 97;
    const rank = parseInt(squareName[1], 10);
    const boardRow = 8 - rank;
    return board[boardRow] ? board[boardRow][file] : null;
  }
}
