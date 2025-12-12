const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Cleaning Vite cache...');
const clientViteDir = path.join(__dirname, 'client', 'node_modules', '.vite');
if (fs.existsSync(clientViteDir)) {
  fs.rmSync(clientViteDir, { recursive: true, force: true });
  console.log('Vite cache cleared.');
}

console.log('Starting development server...');
try {
  execSync('npm run dev', { stdio: 'inherit', cwd: __dirname });
} catch (error) {
  console.error('Failed to start server:', error.message);
  process.exit(1);
}