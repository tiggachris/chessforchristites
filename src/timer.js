/**
 * High-precision digital chess clock with increment and low-time display.
 */
export class ChessTimer {
  constructor(initialSeconds = 180, increment = 0) {
    this.initialSeconds = initialSeconds;
    this.increment = increment;
    this.whiteTime = initialSeconds;
    this.blackTime = initialSeconds;
    this.activeColor = null;
    this.hasStarted = false;
    this.isPaused = false;
    this.isGameOver = false;

    this.timerInterval = null;
    this.lastTickTime = null;

    this.onTickCallback = () => {};
    this.onTimeoutCallback = () => {};
  }

  setCallbacks({ onTick, onTimeout }) {
    if (onTick) this.onTickCallback = onTick;
    if (onTimeout) this.onTimeoutCallback = onTimeout;
  }

  reset(initialSeconds = this.initialSeconds, increment = this.increment) {
    this.stop();
    this.initialSeconds = initialSeconds;
    this.increment = increment;
    this.whiteTime = initialSeconds;
    this.blackTime = initialSeconds;
    this.activeColor = null;
    this.hasStarted = false;
    this.isPaused = false;
    this.isGameOver = false;
    this._emitTick();
  }

  start(turn = 'w') {
    if (this.initialSeconds <= 0 || this.isGameOver) return;
    this.hasStarted = true;
    this.activeColor = turn;
    this.isPaused = false;
    this.lastTickTime = performance.now();

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => this._tick(), 100);
    this._emitTick();
  }

  switchTurn(newTurn) {
    if (this.initialSeconds <= 0 || this.isGameOver) return;

    if (!this.hasStarted) {
      this.start(newTurn);
      return;
    }

    // Add increment to the player who just finished their move
    if (this.activeColor === 'w') {
      this.whiteTime += this.increment;
    } else if (this.activeColor === 'b') {
      this.blackTime += this.increment;
    }

    this.activeColor = newTurn;
    this.lastTickTime = performance.now();
    this._emitTick();
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (!this.hasStarted || this.isGameOver) return;
    this.isPaused = false;
    this.lastTickTime = performance.now();
  }

  stop() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isGameOver = true;
  }

  setTime(whiteTime, blackTime) {
    this.whiteTime = whiteTime;
    this.blackTime = blackTime;
    this._emitTick();
  }

  _tick() {
    if (this.isPaused || !this.hasStarted || this.isGameOver || this.initialSeconds <= 0) return;

    const now = performance.now();
    const deltaSeconds = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    if (this.activeColor === 'w') {
      this.whiteTime = Math.max(0, this.whiteTime - deltaSeconds);
      if (this.whiteTime <= 0) {
        this.stop();
        this.onTimeoutCallback('w');
      }
    } else if (this.activeColor === 'b') {
      this.blackTime = Math.max(0, this.blackTime - deltaSeconds);
      if (this.blackTime <= 0) {
        this.stop();
        this.onTimeoutCallback('b');
      }
    }

    this._emitTick();
  }

  _emitTick() {
    this.onTickCallback({
      whiteFormatted: this.formatTime(this.whiteTime),
      blackFormatted: this.formatTime(this.blackTime),
      whiteSeconds: this.whiteTime,
      blackSeconds: this.blackTime,
      whiteLow: this.whiteTime <= 20 && this.initialSeconds > 0,
      blackLow: this.blackTime <= 20 && this.initialSeconds > 0,
      activeColor: this.activeColor,
      hasTimer: this.initialSeconds > 0
    });
  }

  formatTime(seconds) {
    if (this.initialSeconds <= 0) return '--:--';
    if (seconds <= 0) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    // If under 10 seconds, show tenths (Chess.com style)
    if (seconds < 10) {
      const tenths = Math.floor((seconds % 1) * 10);
      return `0:0${secs}.${tenths}`;
    }

    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}
