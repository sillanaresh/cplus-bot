const fs = require('fs');
const { PNG } = require('pngjs');

// Read the logo
const logo = PNG.sync.read(fs.readFileSync('./public/logo-transparent.png'));

// Crop just the logo part (left side, excluding the "capillary" text)
// The logo is approximately in the first 86x86 pixels (square)
const cropWidth = 86;
const cropHeight = 86;
const cropX = 0;
const cropY = 0;

// Create a cropped image with just the logo circles
const cropped = new PNG({ width: cropWidth, height: cropHeight });

for (let y = 0; y < cropHeight; y++) {
  for (let x = 0; x < cropWidth; x++) {
    const srcIdx = (logo.width * (y + cropY) + (x + cropX)) << 2;
    const dstIdx = (cropWidth * y + x) << 2;

    cropped.data[dstIdx] = logo.data[srcIdx];
    cropped.data[dstIdx + 1] = logo.data[srcIdx + 1];
    cropped.data[dstIdx + 2] = logo.data[srcIdx + 2];
    cropped.data[dstIdx + 3] = logo.data[srcIdx + 3];
  }
}

// Create a 32x32 favicon (we'll scale the cropped logo)
const favicon = new PNG({ width: 32, height: 32 });

// Calculate scaling to fit 32x32 while maintaining aspect ratio
const scaleX = 32 / cropWidth;
const scaleY = 32 / cropHeight;
const scale = Math.min(scaleX, scaleY);

const newWidth = Math.floor(cropWidth * scale);
const newHeight = Math.floor(cropHeight * scale);
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
    const srcIdx = (cropWidth * srcY + srcX) << 2;
    const dstIdx = (32 * (y + offsetY) + (x + offsetX)) << 2;

    favicon.data[dstIdx] = cropped.data[srcIdx];
    favicon.data[dstIdx + 1] = cropped.data[srcIdx + 1];
    favicon.data[dstIdx + 2] = cropped.data[srcIdx + 2];
    favicon.data[dstIdx + 3] = cropped.data[srcIdx + 3];
  }
}

// Write the favicon as PNG (Next.js supports PNG favicons)
fs.writeFileSync('./app/icon.png', PNG.sync.write(favicon));
console.log('✅ Favicon created at app/icon.png');
