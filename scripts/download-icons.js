import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const iconCollections = {
  'lets-icons': ['check-ring'],
  'gg': ['radio-check'],
  'carbon': ['quotes'],
  'ph': ['quotes-fill'],
  'mdi': ['github'],
  'mingcute': ['bilibili-line'],
  'line-md': ['email'],
  'tabler': ['brand-netease-music'],
  'vscode-icons': ['file-type-html', 'file-type-light-js'],
  'material-icon-theme': ['python', 'vue'],
  'logos': ['mysql'],
  'skill-icons': ['autocad-light', 'photoshop'],
  'catppuccin': ['markdown-mdx'],
  'devicon': ['css3', 'git'],
  'lsicon': ['file-cdr-outline'],
  'fa7-solid': ['blog'],
};

async function downloadIcon(collection, iconName) {
  try {
    const url = `https://api.iconify.design/${collection}.json?icons=${iconName}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error downloading ${collection}/${iconName}:`, error.message);
    return null;
  }
}

async function downloadAllIcons() {
  const iconsDir = resolve('./icons');
  
  if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir, { recursive: true });
  }

  for (const [collection, icons] of Object.entries(iconCollections)) {
    console.log(`\nDownloading ${collection}...`);
    
    const collectionData = {
      prefix: collection,
      icons: {},
    };

    for (const iconName of icons) {
      console.log(`  - ${iconName}`);
      const data = await downloadIcon(collection, iconName);
      
      if (data && data.icons) {
        collectionData.icons[iconName] = data.icons[iconName];
        if (data.aliases) {
          collectionData.aliases = data.aliases;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (Object.keys(collectionData.icons).length > 0) {
      const filePath = resolve(iconsDir, `${collection}.json`);
      writeFileSync(filePath, JSON.stringify(collectionData, null, 2));
      console.log(`✓ Saved ${collection}.json`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✅ All icons downloaded!');
}

downloadAllIcons().catch(console.error);
