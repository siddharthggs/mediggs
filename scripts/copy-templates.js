// FILE: scripts/copy-templates.js
/// ANCHOR: CopyTemplatesScript
const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'templates');
const targetDir = path.join(__dirname, '..', 'dist_electron', 'templates');

try {
  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Copy all files from templates to dist_electron/templates
  if (fs.existsSync(sourceDir)) {
    const files = fs.readdirSync(sourceDir);
    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      
      if (fs.statSync(sourcePath).isFile()) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Copied: ${file}`);
      }
    }
    console.log('Templates copied successfully!');
  } else {
    console.warn('Source templates directory not found:', sourceDir);
  }
} catch (error) {
  console.error('Error copying templates:', error);
  process.exit(1);
}

