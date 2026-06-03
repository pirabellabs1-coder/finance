// Generates brand PWA icons (gradient + stacked cards) as PNGs — no deps.
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function png(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0;
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const lerp = (a, b, t) => a + (b - a) * t;
const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const C1 = hex("#FF7A18");
const C2 = hex("#FF3D2E");

function makeIcon(N) {
  const buf = Buffer.alloc(N * N * 4);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const t = (x + y) / (2 * N);
      const i = (y * N + x) * 4;
      buf[i] = lerp(C1[0], C2[0], t);
      buf[i + 1] = lerp(C1[1], C2[1], t);
      buf[i + 2] = lerp(C1[2], C2[2], t);
      buf[i + 3] = 255;
    }
  }
  const blend = (x, y, r, g, b, a) => {
    const i = (y * N + x) * 4;
    buf[i] = Math.round(buf[i] * (1 - a) + r * a);
    buf[i + 1] = Math.round(buf[i + 1] * (1 - a) + g * a);
    buf[i + 2] = Math.round(buf[i + 2] * (1 - a) + b * a);
  };
  const rrect = (x0, y0, x1, y1, rad, a) => {
    for (let y = Math.floor(y0); y < y1; y++) {
      for (let x = Math.floor(x0); x < x1; x++) {
        let dx = 0;
        let dy = 0;
        if (x < x0 + rad && y < y0 + rad) {
          dx = x0 + rad - x;
          dy = y0 + rad - y;
        } else if (x > x1 - rad && y < y0 + rad) {
          dx = x - (x1 - rad);
          dy = y0 + rad - y;
        } else if (x < x0 + rad && y > y1 - rad) {
          dx = x0 + rad - x;
          dy = y - (y1 - rad);
        } else if (x > x1 - rad && y > y1 - rad) {
          dx = x - (x1 - rad);
          dy = y - (y1 - rad);
        }
        if (dx * dx + dy * dy > rad * rad) continue;
        blend(x, y, 255, 255, 255, a);
      }
    }
  };
  // Two stacked "cards"
  rrect(N * 0.3, N * 0.27, N * 0.74, N * 0.49, N * 0.05, 0.8);
  rrect(N * 0.24, N * 0.45, N * 0.78, N * 0.73, N * 0.06, 1);
  return png(N, N, buf);
}

mkdirSync("public", { recursive: true });
writeFileSync("public/icon-192.png", makeIcon(192));
writeFileSync("public/icon-512.png", makeIcon(512));
writeFileSync("public/apple-touch-icon.png", makeIcon(180));
console.log("Icons generated: 192, 512, apple-touch-icon");
