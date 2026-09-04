/**
 * Byte-mode QR (ECC M) for print cards. No extra dependency.
 * Finder patterns + Reed-Solomon so a phone can scan /photos?code=ATL-XXXX.
 */

const ECC_M_CODEWORDS: Record<number, { total: number; data: number; blocks: number; groups?: [number, number, number, number] }> = {
  1: { total: 26, data: 16, blocks: 1 },
  2: { total: 44, data: 28, blocks: 1 },
  3: { total: 70, data: 44, blocks: 2 },
  4: { total: 100, data: 64, blocks: 2 },
  5: { total: 134, data: 86, blocks: 2 },
  6: { total: 172, data: 108, blocks: 4 },
  7: { total: 196, data: 124, blocks: 4 },
  8: { total: 242, data: 154, blocks: 4 },
  9: { total: 292, data: 182, blocks: 4 },
  10: { total: 346, data: 216, blocks: 6 },
};

function versionSize(version: number): number {
  return 17 + 4 * version;
}

const ALIGNMENT: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};

function gfMul(a: number, b: number): number {
  if (!a || !b) return 0;
  let p = 0;
  for (let i = 0; i < 8; i += 1) {
    if (b & 1) p ^= a;
    const hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) a ^= 0x1d;
    b >>= 1;
  }
  return p;
}

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x = gfMul(x, 2);
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255]!;
})();

function gfMulLog(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a]! + LOG[b]!]!;
}

function rsGenerator(degree: number): Uint8Array {
  const poly = new Uint8Array(degree + 1);
  poly[0] = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = i; j >= 0; j -= 1) {
      poly[j + 1] ^= gfMulLog(poly[j]!, EXP[i]!);
    }
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = rsGenerator(ecCount);
  const rec = new Uint8Array(data.length + ecCount);
  rec.set(data);
  for (let i = 0; i < data.length; i += 1) {
    const coef = rec[i]!;
    if (coef === 0) continue;
    for (let j = 0; j < gen.length; j += 1) {
      rec[i + j]! ^= gfMulLog(coef, gen[j]!);
    }
  }
  return rec.slice(data.length);
}

function pickVersion(byteLength: number): number {
  for (let v = 1; v <= 10; v += 1) {
    const spec = ECC_M_CODEWORDS[v]!;
    const cap = spec.data - 2;
    if (byteLength <= cap) return v;
  }
  throw new Error("Text is too long for a print QR.");
}

function bitsToBytes(bits: number[]): Uint8Array {
  const out = new Uint8Array(Math.ceil(bits.length / 8));
  for (let i = 0; i < bits.length; i += 1) {
    if (bits[i]) out[i >> 3]! |= 1 << (7 - (i & 7));
  }
  return out;
}

function buildData(text: string, version: number): Uint8Array {
  const bytes = Array.from(new TextEncoder().encode(text));
  const spec = ECC_M_CODEWORDS[version]!;
  const bits: number[] = [];
  const push = (value: number, len: number) => {
    for (let i = len - 1; i >= 0; i -= 1) bits.push((value >> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) push(b, 8);
  const maxBits = spec.data * 8;
  const terminator = Math.min(4, maxBits - bits.length);
  for (let i = 0; i < terminator; i += 1) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const data = bitsToBytes(bits);
  const padded = new Uint8Array(spec.data);
  padded.set(data.slice(0, spec.data));
  const pads = [0xec, 0x11];
  let p = 0;
  for (let i = data.length; i < spec.data; i += 1) {
    padded[i] = pads[p % 2]!;
    p += 1;
  }
  return padded;
}

function interleave(data: Uint8Array, version: number): Uint8Array {
  const spec = ECC_M_CODEWORDS[version]!;
  const blockCount = spec.blocks;
  const shortBlocks = blockCount - (spec.data % blockCount);
  const shortLen = Math.floor(spec.data / blockCount);
  const blocks: Uint8Array[] = [];
  const eccs: Uint8Array[] = [];
  const ecLen = Math.floor((spec.total - spec.data) / blockCount);
  let offset = 0;
  for (let i = 0; i < blockCount; i += 1) {
    const len = shortLen + (i < shortBlocks ? 0 : 1);
    const block = data.slice(offset, offset + len);
    offset += len;
    blocks.push(block);
    eccs.push(rsEncode(block, ecLen));
  }
  const out: number[] = [];
  const maxData = Math.max(...blocks.map((b) => b.length));
  for (let i = 0; i < maxData; i += 1) {
    for (const block of blocks) if (i < block.length) out.push(block[i]!);
  }
  for (let i = 0; i < ecLen; i += 1) {
    for (const ecc of eccs) out.push(ecc[i]!);
  }
  return Uint8Array.from(out);
}

type Cell = -1 | 0 | 1;

function fillFinders(grid: Cell[][], size: number) {
  const draw = (r: number, c: number) => {
    for (let y = -1; y <= 7; y += 1) {
      for (let x = -1; x <= 7; x += 1) {
        const rr = r + y;
        const cc = c + x;
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
        const on =
          x === -1 || x === 7 || y === -1 || y === 7
            ? false
            : x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
        if (y === -1 || y === 7 || x === -1 || x === 7) {
          if (rr >= 0 && cc >= 0 && rr < size && cc < size && (x === -1 || x === 7 || y === -1 || y === 7)) {
            if (x >= 0 && x <= 6 && y >= 0 && y <= 6) {
              /* finder handled below */
            }
          }
        }
        if (x >= -1 && x <= 7 && y >= -1 && y <= 7) {
          const inSep = x === -1 || x === 7 || y === -1 || y === 7;
          const inFinder = x >= 0 && x <= 6 && y >= 0 && y <= 6;
          if (inFinder) {
            const onMod =
              x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
            grid[rr]![cc] = onMod ? 1 : 0;
          } else if (inSep) {
            grid[rr]![cc] = 0;
          }
        }
        void on;
      }
    }
  };
  draw(0, 0);
  draw(0, size - 7);
  draw(size - 7, 0);
}

function fillTiming(grid: Cell[][], size: number) {
  for (let i = 0; i < size; i += 1) {
    if (grid[6]![i] === -1) grid[6]![i] = i % 2 === 0 ? 1 : 0;
    if (grid[i]![6] === -1) grid[i]![6] = i % 2 === 0 ? 1 : 0;
  }
}

function fillAlign(grid: Cell[][], version: number) {
  const pos = ALIGNMENT[version] ?? [];
  for (const r of pos) {
    for (const c of pos) {
      if (grid[r]![c] !== -1) continue;
      for (let y = -2; y <= 2; y += 1) {
        for (let x = -2; x <= 2; x += 1) {
          const on = Math.max(Math.abs(x), Math.abs(y)) !== 1 || (x === 0 && y === 0);
          const dark = Math.max(Math.abs(x), Math.abs(y)) === 2 || (x === 0 && y === 0);
          grid[r + y]![c + x] = dark && on ? 1 : 0;
        }
      }
    }
  }
}

function maskFn(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0:
      return (r + c) % 2 === 0;
    case 1:
      return r % 2 === 0;
    case 2:
      return c % 3 === 0;
    case 3:
      return (r + c) % 3 === 0;
    case 4:
      return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5:
      return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6:
      return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    default:
      return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
  }
}

const FORMAT_MASKS = [
  0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0,
];

function setFormat(grid: Cell[][], size: number, mask: number) {
  const bits = FORMAT_MASKS[mask]!;
  const coords: Array<[number, number]> = [];
  for (let i = 0; i < 6; i += 1) coords.push([i, 8]);
  coords.push([7, 8], [8, 8], [8, 7]);
  for (let i = 5; i >= 0; i -= 1) coords.push([8, i]);
  const other: Array<[number, number]> = [];
  for (let i = 0; i < 8; i += 1) other.push([8, size - 1 - i]);
  for (let i = 0; i < 7; i += 1) other.push([size - 7 + i, 8]);
  for (let i = 0; i < 15; i += 1) {
    const bit = (bits >> (14 - i)) & 1 ? 1 : 0;
    const [r, c] = coords[i]!;
    grid[r]![c] = bit as Cell;
    const [r2, c2] = other[i]!;
    grid[r2]![c2] = bit as Cell;
  }
  grid[size - 8]![8] = 1;
}

function placeData(grid: Cell[][], size: number, data: Uint8Array, mask: number) {
  let bit = 0;
  const total = data.length * 8;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    for (let i = 0; i < size; i += 1) {
      const row = upward ? size - 1 - i : i;
      for (const c of [col, col - 1]) {
        if (grid[row]![c] !== -1) continue;
        const dark = bit < total ? ((data[bit >> 3]! >> (7 - (bit & 7))) & 1) === 1 : false;
        const masked = maskFn(mask, row, c) ? !dark : dark;
        grid[row]![c] = masked ? 1 : 0;
        bit += 1;
      }
    }
    upward = !upward;
  }
}

function scoreGrid(grid: Cell[][], size: number): number {
  let score = 0;
  for (let r = 0; r < size; r += 1) {
    let run = 1;
    for (let c = 1; c < size; c += 1) {
      if (grid[r]![c] === grid[r]![c - 1]) run += 1;
      else {
        if (run >= 5) score += run - 2;
        run = 1;
      }
    }
    if (run >= 5) score += run - 2;
  }
  for (let c = 0; c < size; c += 1) {
    let run = 1;
    for (let r = 1; r < size; r += 1) {
      if (grid[r]![c] === grid[r - 1]![c]) run += 1;
      else {
        if (run >= 5) score += run - 2;
        run = 1;
      }
    }
    if (run >= 5) score += run - 2;
  }
  let dark = 0;
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) if (grid[r]![c] === 1) dark += 1;
  }
  const percent = (dark * 100) / (size * size);
  score += Math.abs(percent - 50) / 5 * 10;
  return score;
}

export function encodeQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  const version = pickVersion(bytes.length);
  const size = versionSize(version);
  const raw = interleave(buildData(text, version), version);

  let best: Cell[][] | null = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask += 1) {
    const grid: Cell[][] = Array.from({ length: size }, () => Array<Cell>(size).fill(-1));
    fillFinders(grid, size);
    fillAlign(grid, version);
    fillTiming(grid, size);
    grid[8]![8] = 0;
    setFormat(grid, size, mask);
    placeData(grid, size, raw, mask);
    const score = scoreGrid(grid, size);
    if (score < bestScore) {
      bestScore = score;
      best = grid;
    }
  }
  return (best ?? []).map((row) => row.map((cell) => cell === 1));
}

export function qrSvg(
  text: string,
  opts?: { moduleSize?: number; color?: string; background?: string; quiet?: number },
): string {
  const matrix = encodeQrMatrix(text);
  const quiet = opts?.quiet ?? 4;
  const moduleSize = opts?.moduleSize ?? 8;
  const color = opts?.color ?? "#cfc6b0";
  const background = opts?.background ?? "#0a0a0b";
  const dim = (matrix.length + quiet * 2) * moduleSize;
  const rects: string[] = [];
  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y]!.length; x += 1) {
      if (!matrix[y]![x]) continue;
      const px = (x + quiet) * moduleSize;
      const py = (y + quiet) * moduleSize;
      rects.push(`<rect x="${px}" y="${py}" width="${moduleSize}" height="${moduleSize}" />`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" width="${dim}" height="${dim}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${background}"/><g fill="${color}">${rects.join("")}</g></svg>`;
}
