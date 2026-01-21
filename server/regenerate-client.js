const { execSync } = require('child_process');
const path = require('path');

console.log('Regenerating Prisma client with new schema...');

try {
  // Delete existing client to force regeneration
  const clientDir = path.join(__dirname, 'node_modules', '@prisma', 'client');
  const fs = require('fs');
  if (fs.existsSync(clientDir)) {
    fs.rmSync(clientDir, { recursive: true, force: true });
    console.log('Removed existing Prisma client');
  }
  
  // Regenerate client
  execSync('npx prisma generate', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Prisma client regenerated successfully!');
} catch (error) {
  console.error('❌ Failed to regenerate Prisma client:', error.message);
  process.exit(1);
}
