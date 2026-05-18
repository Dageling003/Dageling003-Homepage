import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const iconsDir = resolve('./icons');
const svgDir = resolve('./icons-svg');

if (!existsSync(svgDir)) {
  mkdirSync(svgDir, { recursive: true });
}

const collections = [
  'lets-icons',
  'gg',
  'carbon',
  'ph',
  'mdi',
  'mingcute',
  'line-md',
  'tabler',
  'vscode-icons',
  'material-icon-theme',
  'logos',
  'skill-icons',
  'catppuccin',
  'devicon',
  'lsicon',
  'fa7-solid',
];

for (const collection of collections) {
  const jsonPath = resolve(iconsDir, `${collection}.json`);
  const collectionSvgDir = resolve(svgDir, collection);
  
  if (!existsSync(collectionSvgDir)) {
    mkdirSync(collectionSvgDir, { recursive: true });
  }
  
  try {
    const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    const prefix = data.prefix;
    
    console.log(`\nConverting ${prefix}...`);
    
    for (const [iconName, iconData] of Object.entries(data.icons)) {
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${iconData.body}</svg>`;
      const svgPath = resolve(collectionSvgDir, `${iconName}.svg`);
      
      writeFileSync(svgPath, svgContent);
      console.log(`  ✓ ${iconName}.svg`);
    }
  } catch (error) {
    console.error(`Error processing ${collection}:`, error.message);
  }
}

console.log('\n✅ All icons converted to SVG!');
