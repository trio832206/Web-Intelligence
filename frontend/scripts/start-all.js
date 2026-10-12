import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDir = path.resolve(__dirname, '..');
const backendDir = path.resolve(frontendDir, '..', 'backend');

console.log('\x1b[36m%s\x1b[0m', '==========================================================');
console.log('\x1b[36m%s\x1b[0m', '⚡ Web Intelligence Platform: Launching Backend & Frontend');
console.log('\x1b[36m%s\x1b[0m', '🌐 Backend:  http://localhost:8000');
console.log('\x1b[36m%s\x1b[0m', '🖥️  Frontend: http://localhost:5173');
console.log('\x1b[36m%s\x1b[0m', '==========================================================\n');

// 1. Spawn Backend (Node.js Gateway on port 8000)
const backend = spawn('npm', ['start'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true
});

// 2. Spawn Frontend (Vite Dev Server on port 5173)
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true
});

// Handle graceful termination of both processes
function cleanExit() {
  console.log('\n\x1b[33m%s\x1b[0m', 'Stopping all Web Intelligence services...');
  if (backend && !backend.killed) {
    try { backend.kill('SIGINT'); } catch {}
  }
  if (frontend && !frontend.killed) {
    try { frontend.kill('SIGINT'); } catch {}
  }
  process.exit(0);
}

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
backend.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\x1b[31mBackend process exited with code ${code}\x1b[0m`);
  }
});
frontend.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\x1b[31mFrontend process exited with code ${code}\x1b[0m`);
  }
});
