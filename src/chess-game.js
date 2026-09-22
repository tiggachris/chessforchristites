import { Chess } from 'chess.js';

const PIECE_VALUES = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0
};

const STARTING_PIECES = {
  w: { p: 8, n: 2, b: 2, r: 2, q: 1 },
  b: { p: 8, n: 2, b: 2, r: 2, q: 1 }
};

export class ChessGameManager {
  constructor() {
    this.chess = new Chess();
    this.redoStack = [];
    this.historyFens = [this.chess.fen()];
    this.viewIndex = null; // null means live position, otherwise index in historyFens
  }

  reset() {
    this.chess.reset();
    this.redoStack = [];
    this.historyFens = [this.chess.fen()];
    this.viewIndex = null;
  }

  getTurn() {
    return this.chess.turn();
  }

  getBoard() {
    return this.chess.board();
  }

  getFen() {
    return this.chess.fen();
  }

  getHistory() {
    return this.chess.history({ verbose: true });
  }

  canUndo() {
    return this.chess.history().length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  getPossibleMoves(square) {
    if (this.viewIndex !== null && this.viewIndex !== this.historyFens.length - 1) {
      return []; // Read-only mode while viewing past moves
    }
    try {
      const moves = this.chess.moves({ square, verbose: true });
      return moves;
    } catch {
      return [];
    }
  }

  makeMove(from, to, promotion = 'q') {
    if (this.viewIndex !== null && this.viewIndex !== this.historyFens.length - 1) {
      // Jump back to live position before making a move
      this.jumpToLive();
    }

    try {
      const move = this.chess.move({
        from,
        to,
        promotion
      });

      if (move) {
        this.redoStack = [];
        this.historyFens.push(this.chess.fen());
        this.viewIndex = null;
        return move;
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  undo() {
    if (!this.canUndo()) return null;
    this.jumpToLive();
    const move = this.chess.undo();
    if (move) {
      this.redoStack.push(move);
      this.historyFens.pop();
      this.viewIndex = null;
      return move;
    }
    return null;
  }

  redo() {
    if (!this.canRedo()) return null;
    this.jumpToLive();
    const moveToRedo = this.redoStack.pop();
    if (moveToRedo) {
      const move = this.chess.move({
        from: moveToRedo.from,
        to: moveToRedo.to,
        promotion: moveToRedo.promotion || 'q'
      });
      if (move) {
        this.historyFens.push(this.chess.fen());
        this.viewIndex = null;
        return move;
      }
    }
    return null;
  }

  jumpToHistory(index) {
    if (index >= 0 && index < this.historyFens.length) {
      if (index === this.historyFens.length - 1) {
        this.viewIndex = null;
      } else {
        this.viewIndex = index;
      }
    }
  }

  stepBackward() {
    const current = this.viewIndex !== null ? this.viewIndex : this.historyFens.length - 1;
    if (current > 0) {
      this.viewIndex = current - 1;
      return true;
    }
    return false;
  }

  stepForward() {
    if (this.viewIndex !== null) {
      const next = this.viewIndex + 1;
      if (next >= this.historyFens.length - 1) {
        this.viewIndex = null; // Return to live
      } else {
        this.viewIndex = next;
      }
      return true;
    }
    return false;
  }

  jumpToStart() {
    if (this.historyFens.length > 1) {
      this.viewIndex = 0;
      return true;
    }
    return false;
  }

  jumpToEnd() {
    if (this.viewIndex !== null) {
      this.viewIndex = null;
      return true;
    }
    return false;
  }

  getViewIndex() {
    return this.viewIndex !== null ? this.viewIndex : this.historyFens.length - 1;
  }

  getTotalPositions() {
    return this.historyFens.length;
  }

  jumpToLive() {
    this.viewIndex = null;
  }

  isViewingHistory() {
    return this.viewIndex !== null && this.viewIndex !== this.historyFens.length - 1;
  }

  getCurrentDisplayBoard() {
    if (this.isViewingHistory()) {
      const tempChess = new Chess(this.historyFens[this.viewIndex]);
      return tempChess.board();
    }
    return this.chess.board();
  }

  isCheck() {
    return this.chess.inCheck();
  }

  isCheckmate() {
    return this.chess.isCheckmate();
  }

  isStalemate() {
    return this.chess.isStalemate();
  }

  isDraw() {
    return this.chess.isDraw();
  }

  isGameOver() {
    return this.chess.isGameOver();
  }

  getGameStatus() {
    if (this.isCheckmate()) {
      const winner = this.chess.turn() === 'w' ? 'Black' : 'White';
      return {
        over: true,
        type: 'checkmate',
        title: `Checkmate! ${winner} wins`,
        winner
      };
    }
    if (this.isStalemate()) {
      return {
        over: true,
        type: 'stalemate',
        title: 'Draw by Stalemate',
        winner: null
      };
    }
    if (this.chess.isThreefoldRepetition()) {
      return {
        over: true,
        type: 'repetition',
        title: 'Draw by 3-fold Repetition',
        winner: null
      };
    }
    if (this.chess.isInsufficientMaterial()) {
      return {
        over: true,
        type: 'material',
        title: 'Draw by Insufficient Material',
        winner: null
      };
    }
    if (this.chess.isDraw()) {
      return {
        over: true,
        type: 'draw',
        title: 'Draw by 50-move rule',
        winner: null
      };
    }
    if (this.isCheck()) {
      const checkedColor = this.chess.turn() === 'w' ? 'White' : 'Black';
      return {
        over: false,
        type: 'check',
        title: `${checkedColor} is in Check!`,
        winner: null
      };
    }
    const turnColor = this.chess.turn() === 'w' ? 'White' : 'Black';
    return {
      over: false,
      type: 'playing',
      title: `${turnColor} to move`,
      winner: null
    };
  }

  getKingSquare(color) {
    const board = this.chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === color) {
          return `${'abcdefgh'[c]}${8 - r}`;
        }
      }
    }
    return null;
  }

  /**
   * Returns captured pieces for both sides and material difference.
   */
  getCapturedData() {
    const counts = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
    };

    const currentBoard = this.chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = currentBoard[r][c];
        if (p && p.type !== 'k') {
          counts[p.color][p.type] = (counts[p.color][p.type] || 0) + 1;
        }
      }
    }

    // Pieces captured BY white = Black pieces missing from board
    const capturedByWhite = [];
    let whiteMaterial = 0;
    let blackMaterial = 0;

    for (const [type, total] of Object.entries(STARTING_PIECES.b)) {
      const missing = total - (counts.b[type] || 0);
      for (let i = 0; i < missing; i++) {
        capturedByWhite.push({ color: 'b', type });
      }
      blackMaterial += (counts.b[type] || 0) * PIECE_VALUES[type];
    }

    // Pieces captured BY black = White pieces missing from board
    const capturedByBlack = [];
    for (const [type, total] of Object.entries(STARTING_PIECES.w)) {
      const missing = total - (counts.w[type] || 0);
      for (let i = 0; i < missing; i++) {
        capturedByBlack.push({ color: 'w', type });
      }
      whiteMaterial += (counts.w[type] || 0) * PIECE_VALUES[type];
    }

    const diff = whiteMaterial - blackMaterial;

    return {
      capturedByWhite, // shown on White's profile
      capturedByBlack, // shown on Black's profile
      whiteScoreAdvantage: diff > 0 ? `+${diff}` : null,
      blackScoreAdvantage: diff < 0 ? `+${Math.abs(diff)}` : null
    };
  }

  getLastMove() {
    const hist = this.chess.history({ verbose: true });
    if (hist.length === 0) return null;
    return hist[hist.length - 1];
  }
}
