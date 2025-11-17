const fs = require('fs');
const path = require('path');

// Read the PNG file
const inputPath = path.join(__dirname, '../public/logo.png');
const outputPath = path.join(__dirname, '../public/logo-transparent.png');

const PNG = require('pngjs').PNG;

const png = PNG.sync.read(fs.readFileSync(inputPath));

// Blue background color (approximate - we'll remove colors close to this)
const targetR = 37;  // RGB values for the blue background
const targetG = 79;
const targetB = 164;
const tolerance = 40; // Color tolerance

for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) << 2;

    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];

    // Calculate color distance from target blue
    const distance = Math.sqrt(
      Math.pow(r - targetR, 2) +
      Math.pow(g - targetG, 2) +
      Math.pow(b - targetB, 2)
    );

    // If color is close to target blue, make it transparent
    if (distance < tolerance) {
      png.data[idx + 3] = 0; // Set alpha to 0 (transparent)
    }
  }
}

fs.writeFileSync(outputPath, PNG.sync.write(png));
console.log('Transparent logo created at:', outputPath);
