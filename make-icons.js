// Generates minimal valid PNG icons without any dependencies
// Uses raw PNG binary construction

const fs = require('fs');
const zlib = require('zlib');

function createPNG(size, colorTop, colorBot) {
  // Draw a simple gradient square with "STR" text approximated as colored pixels
  // We'll create a solid amber square as the icon background

  const width = size;
  const height = size;

  // Create pixel data (RGBA)
  const pixels = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = y / height;
      // Interpolate between colorTop and colorBot
      const r = Math.round(colorTop[0] + (colorBot[0] - colorTop[0]) * t);
      const g = Math.round(colorTop[1] + (colorBot[1] - colorTop[1]) * t);
      const b = Math.round(colorTop[2] + (colorBot[2] - colorTop[2]) * t);

      // Rounded corners mask
      const cx = width / 2, cy = height / 2;
      const radius = width * 0.18;
      const dx = Math.max(0, Math.abs(x - cx) - (cx - radius));
      const dy = Math.max(0, Math.abs(y - cy) - (cy - radius));
      const dist = Math.sqrt(dx * dx + dy * dy);
      const alpha = dist > radius ? 0 : 255;

      // Draw a simple "S" shape in white in the center
      const nx = (x - width * 0.5) / (width * 0.3);
      const ny = (y - height * 0.5) / (height * 0.3);

      // White circle in center (logo placeholder)
      const inCircle = (nx * nx + ny * ny) < 0.25;
      const pr = inCircle ? 255 : r;
      const pg = inCircle ? 255 : g;
      const pb = inCircle ? 255 : b;

      const idx = (y * width + x) * 4;
      pixels[idx]     = pr;
      pixels[idx + 1] = pg;
      pixels[idx + 2] = pb;
      pixels[idx + 3] = alpha;
    }
  }

  // Build PNG
  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c;
    }
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const crcBuf = Buffer.concat([typeBytes, data]);
    const crcVal = Buffer.alloc(4); crcVal.writeUInt32BE(crc32(crcBuf));
    return Buffer.concat([len, typeBytes, data, crcVal]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // IDAT - filter each row with filter type 0 (None)
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    rawRows.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      rawRows.push(pixels[idx], pixels[idx+1], pixels[idx+2], pixels[idx+3]);
    }
  }
  const compressed = zlib.deflateSync(Buffer.from(rawRows));

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const png = Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);

  return png;
}

// Amber gradient: #b45309 → #f59e0b
const top = [180, 83, 9];
const bot = [245, 158, 11];

fs.writeFileSync('icon-192.png', createPNG(192, top, bot));
fs.writeFileSync('icon-512.png', createPNG(512, top, bot));
console.log('Icons generated: icon-192.png, icon-512.png');
