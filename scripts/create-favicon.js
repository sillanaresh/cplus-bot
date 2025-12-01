const fs = require('fs');
const { PNG } = require('pngjs');

// Read the pre-cropped logo (just the circles, no text)
const logo = PNG.sync.read(fs.readFileSync('./public/logo-icon.png'));

// Create a 32x32 favicon
const favicon = new PNG({ width: 32, height: 32 });

// Calculate scaling to fit 32x32 while maintaining aspect ratio
// Increase size by 30% (multiply scale by 1.3)
const scaleX = 32 / logo.width;
const scaleY = 32 / logo.height;
const scale = Math.min(scaleX, scaleY) * 1.3;

const newWidth = Math.floor(logo.width * scale);
const newHeight = Math.floor(logo.height * scale);
const offsetX = Math.floor((32 - newWidth) / 2);
const offsetY = Math.floor((32 - newHeight) / 2);

// Fill with transparent background
for (let y = 0; y < 32; y++) {
  for (let x = 0; x < 32; x++) {
    const idx = (32 * y + x) << 2;
    favicon.data[idx] = 255;
    favicon.data[idx + 1] = 255;
    favicon.data[idx + 2] = 255;
    favicon.data[idx + 3] = 0; // transparent
  }
}

// Simple nearest-neighbor scaling
for (let y = 0; y < newHeight; y++) {
  for (let x = 0; x < newWidth; x++) {
    const srcX = Math.floor(x / scale);
    const srcY = Math.floor(y / scale);
    const srcIdx = (logo.width * srcY + srcX) << 2;
    const dstIdx = (32 * (y + offsetY) + (x + offsetX)) << 2;

    favicon.data[dstIdx] = logo.data[srcIdx];
    favicon.data[dstIdx + 1] = logo.data[srcIdx + 1];
    favicon.data[dstIdx + 2] = logo.data[srcIdx + 2];
    favicon.data[dstIdx + 3] = logo.data[srcIdx + 3];
  }
}

// Write the favicon as PNG (Next.js supports PNG favicons)
fs.writeFileSync('./app/icon.png', PNG.sync.write(favicon));
console.log('✅ Favicon created at app/icon.png');
