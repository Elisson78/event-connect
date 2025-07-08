import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sizes = [192, 512];

async function generateIcons() {
  for (const size of sizes) {
    const svgPath = `public/icons/icon-${size}x${size}.svg`;
    const pngPath = `public/icons/icon-${size}x${size}.png`;
    
    if (fs.existsSync(svgPath)) {
      try {
        await sharp(svgPath)
          .resize(size, size)
          .png()
          .toFile(pngPath);
        
        console.log(`✅ Generated ${pngPath}`);
      } catch (error) {
        console.error(`❌ Error generating ${pngPath}:`, error);
      }
    } else {
      console.warn(`⚠️  SVG file not found: ${svgPath}`);
    }
  }
}

generateIcons().catch(console.error); 