import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

async function setup() {
  console.log('🚀 Starting backend setup...\n');

  try {
    // 1. Install dependencies
    console.log('Installing dependencies...');
    await execAsync('npm install', { cwd: rootDir });
    console.log('✅ Dependencies installed successfully\n');

    // 2. Run verification script
    console.log('Running verification script...');
    await execAsync('node scripts/verifySetup.js', { cwd: rootDir });
    
    console.log('\n✨ Setup completed successfully!');
    console.log('\nTo start the development server, run:');
    console.log('npm run dev');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setup(); 