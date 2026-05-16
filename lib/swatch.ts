// Deterministic colour pair for product/item thumbnails so the same item
// always renders the same swatch without storing colours in the DB.

const PALETTE: Array<[string, string]> = [
  ['#e6d4a2', '#b88a3a'],
  ['#f7efe1', '#d6c6a5'],
  ['#dfd09a', '#9b8138'],
  ['#f3d96e', '#c79924'],
  ['#d8e0b4', '#7a9b2e'],
  ['#e0bf95', '#7a4a1f'],
  ['#f6d889', '#a86b13'],
  ['#d6c290', '#8a6a2a'],
  ['#f4f1ec', '#c2b8a8'],
  ['#f7f1e3', '#cdbe93'],
  ['#cfe0c2', '#86a37b'],
  ['#cfdcc6', '#5a8a52'],
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function swatchFor(seed: string): [string, string] {
  return PALETTE[hash(seed) % PALETTE.length];
}
