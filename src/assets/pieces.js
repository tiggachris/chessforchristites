/**
 * Vector SVG representations of chess pieces.
 * Standard tournament/Chess.com styling with clean fills, strokes, and details.
 */
export const PIECE_SVGS = {
  // White Pieces
  wp: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#fff" stroke="#1f1e1b" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  wn: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="none" fill-rule="evenodd" stroke="#1f1e1b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" fill="#fff"/>
      <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,7.4 17.03,6.77 18.5,9 C 19.34,10.27 18.89,12.51 19,13 C 20.89,12.5 21.1,9.9 22,10 z" fill="#fff"/>
      <circle cx="12.5" cy="18.5" r="1.5" fill="#1f1e1b"/>
      <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" fill="#1f1e1b"/>
    </g>
  </svg>`,

  wb: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="none" fill-rule="evenodd" stroke="#1f1e1b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <g fill="#fff" stroke-linecap="butt">
        <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z"/>
        <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 22.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z"/>
        <path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z"/>
      </g>
      <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" stroke-linejoin="miter"/>
      <path d="M 22.5,10 C 26.5,10 32,15 32,23 C 32,28.5 27.5,30 22.5,30 C 17.5,30 13,28.5 13,23 C 13,15 18.5,10 22.5,10 z" fill="#fff"/>
      <path d="M 20.5,11 L 24.5,15"/>
    </g>
  </svg>`,

  wr: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="#fff" fill-rule="evenodd" stroke="#1f1e1b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z"/>
      <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z"/>
      <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14"/>
      <path d="M 34,14 L 31,17 L 14,17 L 11,14"/>
      <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17"/>
      <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5"/>
      <path d="M 11,14 L 34,14"/>
    </g>
  </svg>`,

  wq: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="#fff" fill-rule="evenodd" stroke="#1f1e1b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 8 12 A 2 2 0 1 1 4,12 A 2 2 0 1 1 8 12 z"/>
      <path d="M 16 8.5 A 2 2 0 1 1 12,8.5 A 2 2 0 1 1 16 8.5 z"/>
      <path d="M 24.5 7.5 A 2 2 0 1 1 20.5,7.5 A 2 2 0 1 1 24.5 7.5 z"/>
      <path d="M 33 8.5 A 2 2 0 1 1 29,8.5 A 2 2 0 1 1 33 8.5 z"/>
      <path d="M 41 12 A 2 2 0 1 1 37,12 A 2 2 0 1 1 41 12 z"/>
      <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,10 L 14,25 L 6.5,13.5 L 9,26 z"/>
      <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 36,37.5 34.5,36 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z"/>
      <path d="M 11.5,30 C 15,29 30,29 33.5,30"/>
      <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5"/>
    </g>
  </svg>`,

  wk: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="none" fill-rule="evenodd" stroke="#1f1e1b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 22.5,11.63 L 22.5,6" stroke-linejoin="miter"/>
      <path d="M 20,8 L 25,8" stroke-linejoin="miter"/>
      <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 22.5,25" fill="#fff"/>
      <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 34.5,32 37.5,22.5 37.5,22.5 C 37.5,22.5 38.5,19 36,17.5 C 33.5,16 32,18.5 32,18.5 C 32,18.5 29.5,13.5 26,13.5 C 22.5,13.5 22.5,17 22.5,17 C 22.5,17 22.5,13.5 19,13.5 C 15.5,13.5 13,18.5 13,18.5 C 13,18.5 11.5,16 9,17.5 C 6.5,19 7.5,22.5 7.5,22.5 C 7.5,22.5 10.5,32 11.5,37 z" fill="#fff"/>
      <path d="M 11.5,30 C 17,27 28,27 33.5,30"/>
      <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5"/>
      <path d="M 11.5,37 C 17,34 28,34 33.5,37"/>
    </g>
  </svg>`,

  // Black Pieces
  bp: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#242220" stroke="#101010" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M 12 38.5 C 12 36 15 35 22.5 35 C 30 35 33 36 33 38.5" fill="none" stroke="#75726e" stroke-width="1"/>
  </svg>`,

  bn: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="none" fill-rule="evenodd" stroke="#101010" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" fill="#242220"/>
      <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,7.4 17.03,6.77 18.5,9 C 19.34,10.27 18.89,12.51 19,13 C 20.89,12.5 21.1,9.9 22,10 z" fill="#242220"/>
      <circle cx="12.5" cy="18.5" r="1.5" fill="#f0d9b5"/>
      <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" fill="#f0d9b5"/>
    </g>
  </svg>`,

  bb: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="none" fill-rule="evenodd" stroke="#101010" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <g fill="#242220" stroke-linecap="butt">
        <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z"/>
        <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 22.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z"/>
        <path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z"/>
      </g>
      <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" stroke="#75726e" stroke-linejoin="miter"/>
      <path d="M 22.5,10 C 26.5,10 32,15 32,23 C 32,28.5 27.5,30 22.5,30 C 17.5,30 13,28.5 13,23 C 13,15 18.5,10 22.5,10 z" fill="#242220"/>
      <path d="M 20.5,11 L 24.5,15" stroke="#75726e"/>
    </g>
  </svg>`,

  br: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="#242220" fill-rule="evenodd" stroke="#101010" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z"/>
      <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z"/>
      <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14"/>
      <path d="M 34,14 L 31,17 L 14,17 L 11,14"/>
      <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17"/>
      <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5"/>
      <path d="M 11,14 L 34,14"/>
      <path d="M 14 31 L 31 31" stroke="#75726e" stroke-width="1"/>
    </g>
  </svg>`,

  bq: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="#242220" fill-rule="evenodd" stroke="#101010" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 8 12 A 2 2 0 1 1 4,12 A 2 2 0 1 1 8 12 z"/>
      <path d="M 16 8.5 A 2 2 0 1 1 12,8.5 A 2 2 0 1 1 16 8.5 z"/>
      <path d="M 24.5 7.5 A 2 2 0 1 1 20.5,7.5 A 2 2 0 1 1 24.5 7.5 z"/>
      <path d="M 33 8.5 A 2 2 0 1 1 29,8.5 A 2 2 0 1 1 33 8.5 z"/>
      <path d="M 41 12 A 2 2 0 1 1 37,12 A 2 2 0 1 1 41 12 z"/>
      <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,10 L 14,25 L 6.5,13.5 L 9,26 z"/>
      <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 36,37.5 34.5,36 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z"/>
      <path d="M 11.5,30 C 15,29 30,29 33.5,30" stroke="#75726e" stroke-width="1"/>
      <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" stroke="#75726e" stroke-width="1"/>
    </g>
  </svg>`,

  bk: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="none" fill-rule="evenodd" stroke="#101010" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 22.5,11.63 L 22.5,6" stroke-linejoin="miter"/>
      <path d="M 20,8 L 25,8" stroke-linejoin="miter"/>
      <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 22.5,25" fill="#242220"/>
      <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 34.5,32 37.5,22.5 37.5,22.5 C 37.5,22.5 38.5,19 36,17.5 C 33.5,16 32,18.5 32,18.5 C 32,18.5 29.5,13.5 26,13.5 C 22.5,13.5 22.5,17 22.5,17 C 22.5,17 22.5,13.5 19,13.5 C 15.5,13.5 13,18.5 13,18.5 C 13,18.5 11.5,16 9,17.5 C 6.5,19 7.5,22.5 7.5,22.5 C 7.5,22.5 10.5,32 11.5,37 z" fill="#242220"/>
      <path d="M 11.5,30 C 17,27 28,27 33.5,30" stroke="#75726e" stroke-width="1"/>
      <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" stroke="#75726e" stroke-width="1"/>
      <path d="M 11.5,37 C 17,34 28,34 33.5,37" stroke="#75726e" stroke-width="1"/>
    </g>
  </svg>`
};

/**
 * Returns SVG markup string for a piece object { type: 'p'|'n'|'b'|'r'|'q'|'k', color: 'w'|'b' }
 */
export function getPieceSvg(piece) {
  if (!piece) return '';
  const key = `${piece.color}${piece.type}`;
  return PIECE_SVGS[key] || '';
}
