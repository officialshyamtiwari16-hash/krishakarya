import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(__dirname, 'public', 'logo.svg');
const outputDir = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  try {
    const sharpModule = await import('sharp');
    const sharp = sharpModule.default || sharpModule;
    console.log(`Reading source logo from: ${logoPath}`);

    // Generate icon-192.png
    await sharp(logoPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(outputDir, 'icon-192.png'));
    console.log('Generated /public/icons/icon-192.png');

    // Generate icon-512.png
    await sharp(logoPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(outputDir, 'icon-512.png'));
    console.log('Generated /public/icons/icon-512.png');
  } catch (err) {
    console.warn('Sharp icon generation notice (using existing icons in /public/icons):', err?.message || err);
  }
}

generateIcons();

