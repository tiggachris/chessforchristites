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

    // Drag and pointer interaction state
    this.isDragging = false;
    this.dragStartSquare = null;
    this.dragGhost = null;
    this.pointerDownInfo = null;
    this.currentHoverSquare = null;

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
    // We attach pointerdown to handle both mouse & touch smoothly
    squareEl.addEventListener('pointerdown', (e) => {
      // Only process primary button (left click or single touch)
      if (e.button !== 0) return;

      if (this.game.isViewingHistory()) {
        this.game.jumpToLive();
        this.render();
        this.onHistoryStep(this.game.getViewIndex(), this.game.getTotalPositions());
        return;
      }

      // Check turn and allowed color
      const currentBoard = this.game.getBoard();
      const piece = this.getPieceAt(squareName, currentBoard);
      const isMyTurn = (!this.allowedColor || this.game.getTurn() === this.allowedColor);
      const isMyPiece = Boolean(piece && piece.color === this.game.getTurn() && isMyTurn);

      this.pointerDownInfo = {
        squareName,
        startX: e.clientX,
        startY: e.clientY,
        pointerId: e.pointerId,
        isTouch: e.pointerType === 'touch',
        isMyPiece
      };
    });
  }

  bindGlobalEvents() {
    const onPointerMove = (e) => {
      if (!this.pointerDownInfo) return;

      const info = this.pointerDownInfo;

      if (this.isDragging) {
        // Prevent default browser scroll and gestures on mobile
        e.preventDefault();

        // Update ghost position
        this.updateGhostPosition(e.clientX, e.clientY, info.isTouch);

        // Highlight square under drag pointer
        const hoverSquare = this.getSquareFromCoords(e.clientX, e.clientY + (info.isTouch ? -16 : 0));
        this.setDragHoverSquare(hoverSquare);
      } else {
        // Check if movement exceeds threshold to start dragging
        if (!info.isMyPiece) return;

        const dist = Math.hypot(e.clientX - info.startX, e.clientY - info.startY);
        // 5px threshold distinguishes a tap from a deliberate drag
        if (dist >= 5) {
          e.preventDefault();
          this.initiateDrag(info.squareName, e.clientX, e.clientY, info.isTouch);
        }
      }
    };

    const onPointerUp = (e) => {
      if (!this.pointerDownInfo) return;

      const info = this.pointerDownInfo;
      this.pointerDownInfo = null;

      if (this.isDragging) {
        e.preventDefault();
        const dropSquare = this.getSquareFromCoords(e.clientX, e.clientY + (info.isTouch ? -16 : 0));
        this.endDrag(dropSquare);
      } else {
        // Handle as a clean tap / click on the square
        this.handleSquareTap(info.squareName);
      }
    };

    const onPointerCancel = () => {
      if (this.pointerDownInfo || this.isDragging) {
        this.pointerDownInfo = null;
        this.cleanupDragVisuals();
        this.render();
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { passive: false });
    window.addEventListener('pointercancel', onPointerCancel);

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

  initiateDrag(squareName, clientX, clientY, isTouch) {
    this.isDragging = true;
    this.dragStartSquare = squareName;
    this.selectedSquare = squareName;
    this.possibleMoves = this.game.getPossibleMoves(squareName);

    // Find starting square and piece element
    const squareEl = this.container.querySelector(`.square[data-square="${squareName}"]`);
    const pieceEl = squareEl ? squareEl.querySelector('.chess-piece') : null;
    if (!pieceEl) {
      this.isDragging = false;
      return;
    }

    // Mark original piece as dragging
    pieceEl.classList.add('dragging');
    this.container.classList.add('is-dragging');

    // Create drag ghost element with dynamic dimensions matching the board square
    const rect = squareEl.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = `chess-piece-ghost ${isTouch ? 'touch-ghost' : ''}`;
    ghost.innerHTML = pieceEl.innerHTML;
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;

    document.body.appendChild(ghost);
    this.dragGhost = ghost;

    // Immediately display move hint dots on board
    this.renderMoveHints();

    this.updateGhostPosition(clientX, clientY, isTouch);
  }

  updateGhostPosition(clientX, clientY, isTouch) {
    if (!this.dragGhost) return;
    // On touch devices, offset the ghost slightly upwards so the finger does not obscure the square
    const offsetY = isTouch ? -24 : 0;
    this.dragGhost.style.left = `${clientX}px`;
    this.dragGhost.style.top = `${clientY + offsetY}px`;
  }

  setDragHoverSquare(squareName) {
    if (this.currentHoverSquare === squareName) return;

    if (this.currentHoverSquare) {
      const prevEl = this.container.querySelector(`.square[data-square="${this.currentHoverSquare}"]`);
      if (prevEl) {
        prevEl.classList.remove('drag-hover', 'drag-legal');
      }
    }

    this.currentHoverSquare = squareName;

    if (squareName) {
      const curEl = this.container.querySelector(`.square[data-square="${squareName}"]`);
      if (curEl) {
        curEl.classList.add('drag-hover');
        if (this.possibleMoves.some(m => m.to === squareName)) {
          curEl.classList.add('drag-legal');
        }
      }
    }
  }

  endDrag(dropSquare) {
    const fromSquare = this.dragStartSquare;
    this.cleanupDragVisuals();

    if (dropSquare && fromSquare && dropSquare !== fromSquare) {
      // Check if dropped on a legal target square
      const validMove = this.possibleMoves.find(m => m.to === dropSquare);
      if (validMove) {
        this.triggerMoveAttempt(fromSquare, dropSquare, validMove);
        return;
      }

      // Check if dropped on another friendly piece (switch selection)
      const currentBoard = this.game.getBoard();
      const targetPiece = this.getPieceAt(dropSquare, currentBoard);
      const isMyTurn = (!this.allowedColor || this.game.getTurn() === this.allowedColor);
      if (targetPiece && targetPiece.color === this.game.getTurn() && isMyTurn) {
        this.selectSquare(dropSquare);
        return;
      }

      // Dropped on an illegal square: clear selection
      this.clearSelection();
      this.render();
      return;
    }

    if (dropSquare === fromSquare) {
      // Dropped back on starting square: keep selected so player can tap destination
      this.render();
      return;
    }

    // Dropped outside board or cancelled
    this.clearSelection();
    this.render();
  }

  cleanupDragVisuals() {
    this.isDragging = false;
    this.dragStartSquare = null;
    this.container.classList.remove('is-dragging');

    if (this.dragGhost) {
      this.dragGhost.remove();
      this.dragGhost = null;
    }

    if (this.currentHoverSquare) {
      const curEl = this.container.querySelector(`.square[data-square="${this.currentHoverSquare}"]`);
      if (curEl) {
        curEl.classList.remove('drag-hover', 'drag-legal');
      }
      this.currentHoverSquare = null;
    }

    // Remove dragging class from any piece
    this.container.querySelectorAll('.chess-piece.dragging').forEach(el => {
      el.classList.remove('dragging');
    });
  }

  renderMoveHints() {
    // Highlight selected square
    const startEl = this.container.querySelector(`.square[data-square="${this.selectedSquare}"]`);
    if (startEl) startEl.classList.add('selected');

    // Add hint dots/captures for legal moves
    this.possibleMoves.forEach(moveOption => {
      const targetEl = this.container.querySelector(`.square[data-square="${moveOption.to}"]`);
      if (targetEl && !targetEl.querySelector('.hint-dot') && !targetEl.querySelector('.hint-capture')) {
        const isCapture = moveOption.captured || (moveOption.flags && moveOption.flags.includes('e'));
        const hint = document.createElement('div');
        hint.className = isCapture ? 'hint-capture' : 'hint-dot';
        targetEl.appendChild(hint);
      }
    });
  }

  handleSquareTap(squareName) {
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
      // Tap on same square cancels selection
      if (this.selectedSquare === squareName) {
        this.clearSelection();
        this.render();
        return;
      }

      // Tap on a legal move destination executes the move
      const validMove = this.possibleMoves.find(m => m.to === squareName);
      if (validMove) {
        this.triggerMoveAttempt(this.selectedSquare, squareName, validMove);
        return;
      }

      // Tap on another friendly piece selects that piece
      const currentBoard = this.game.getBoard();
      const targetPiece = this.getPieceAt(squareName, currentBoard);
      if (targetPiece && targetPiece.color === this.game.getTurn()) {
        if (!this.allowedColor || targetPiece.color === this.allowedColor) {
          this.selectSquare(squareName);
          return;
        }
      }

      // Any other square clears selection
      this.clearSelection();
      this.render();
      return;
    }

    // No square currently selected: select if piece belongs to current turn
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

  getSquareFromCoords(clientX, clientY) {
    const boardRect = this.container.getBoundingClientRect();
    if (
      clientX < boardRect.left || clientX > boardRect.right ||
      clientY < boardRect.top || clientY > boardRect.bottom
    ) {
      return null;
    }

    const relX = clientX - boardRect.left;
    const relY = clientY - boardRect.top;
    const col = Math.floor((relX / boardRect.width) * 8);
    const row = Math.floor((relY / boardRect.height) * 8);

    if (col < 0 || col > 7 || row < 0 || row > 7) return null;

    const ranks = this.orientation === 'white' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const files = this.orientation === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
    const fileLetters = 'abcdefgh';

    const r = ranks[row];
    const f = files[col];
    return `${fileLetters[f]}${r + 1}`;
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
