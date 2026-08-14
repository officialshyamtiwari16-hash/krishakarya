import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, 'public');
const logoSvgPath = path.join(publicDir, 'logo.svg');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateAllIcons() {
  try {
    if (!fs.existsSync(logoSvgPath)) {
      throw new Error(`Source logo not found at: ${logoSvgPath}`);
    }

    console.log(`Reading source logo from: ${logoSvgPath}`);

    // Generate public/icons/icon-192.png
    await sharp(logoSvgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(iconsDir, 'icon-192.png'));
    console.log('✓ Generated public/icons/icon-192.png');

    // Generate public/icons/icon-512.png
    await sharp(logoSvgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(iconsDir, 'icon-512.png'));
    console.log('✓ Generated public/icons/icon-512.png');

    // Generate root public icons
    await sharp(logoSvgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'logo-192.png'));

    await sharp(logoSvgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'logo-512.png'));

    await sharp(logoSvgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'logo.png'));

    await sharp(logoSvgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon.png'));

    await sharp(logoSvgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'pwa-192.png'));

    await sharp(logoSvgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'pwa-512.png'));

    // Generate 1200x630 OpenGraph social share card
    const ogSvg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#064e3b" />
            <stop offset="50%" stop-color="#022c22" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fbbf24" />
            <stop offset="100%" stop-color="#f59e0b" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#bgGrad)" />
        
        <!-- Subtle Grid Pattern -->
        <g stroke="rgba(255,255,255,0.05)" stroke-width="1">
          <line x1="100" y1="0" x2="100" y2="630" />
          <line x1="300" y1="0" x2="300" y2="630" />
          <line x1="500" y1="0" x2="500" y2="630" />
          <line x1="700" y1="0" x2="700" y2="630" />
          <line x1="900" y1="0" x2="900" y2="630" />
          <line x1="1100" y1="0" x2="1100" y2="630" />
          <line x1="0" y1="100" x2="1200" y2="100" />
          <line x1="0" y1="300" x2="1200" y2="300" />
          <line x1="0" y1="500" x2="1200" y2="500" />
        </g>

        <!-- Brand Emblem Container -->
        <circle cx="200" cy="315" r="110" fill="#047857" fill-opacity="0.3" stroke="#10b981" stroke-width="3" />
        <circle cx="200" cy="315" r="90" fill="#065f46" />
        
        <!-- Sprout Glyph in Center -->
        <g transform="translate(145, 260) scale(1.1)">
          <path d="M50 85 V30" stroke="#34d399" stroke-width="8" stroke-linecap="round" />
          <path d="M50 45 C30 25, 10 35, 10 55 C25 58, 45 50, 50 45 Z" fill="#10b981" />
          <path d="M50 35 C70 15, 90 25, 90 45 C75 48, 55 40, 50 35 Z" fill="#6ee7b7" />
        </g>

        <!-- Typography -->
        <text x="360" y="270" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="72" fill="#ffffff" letter-spacing="-1">Krishakarya</text>
        <text x="360" y="340" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="34" fill="#34d399">कृषककार्य — Empowering Indian Agriculture</text>
        
        <rect x="360" y="380" width="720" height="2" fill="rgba(52, 211, 153, 0.4)" />
        
        <text x="360" y="430" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="24" fill="#cbd5e1">
          ✓ On-Demand Machinery Rental  •  ✓ Sahyogi Farm Workers  •  ✓ Kisan Khatabook
        </text>
        <text x="360" y="475" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="22" fill="#94a3b8">
          The unified digital agriculture ecosystem for modern farmers across Bharat.
        </text>
      </svg>
    `;

    await sharp(Buffer.from(ogSvg))
      .resize(1200, 630)
      .png()
      .toFile(path.join(publicDir, 'og-image.png'));
    console.log('✓ Generated public/og-image.png (1200x630)');

    console.log('✅ All icons and preview assets generated successfully.');
  } catch (err) {
    console.error('❌ Error generating icons:', err?.message || err);
    process.exit(1);
  }
}

generateAllIcons();
