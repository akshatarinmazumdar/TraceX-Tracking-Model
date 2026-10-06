import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('\x1b[36m%s\x1b[0m', '🚀 Trace-X Unified Launcher: Starting Backend & Frontend...');

// Helper to kill processes on a port
function killPort(port) {
  try {
    const pid = execSync(`lsof -t -i:${port}`, { encoding: 'utf8' }).trim();
    if (pid) {
      console.log(`\x1b[33m[Setup] Port ${port} is in use by PID ${pid}. Reclaiming port...\x1b[0m`);
      pid.split('\n').forEach(p => {
        try {
          execSync(`kill -9 ${p}`);
        } catch (err) {
          // ignore individual kill failure
        }
      });
    }
  } catch (e) {
    // Port not in use, ignore error
  }
}

// Reclaim ports to prevent conflict issues
killPort(5000);
killPort(5173);
killPort(5174);

// Helper to kill a child process
function killProcess(proc) {
  if (proc) {
    try {
      proc.kill('SIGTERM');
    } catch (e) {
      // ignore
    }
  }
}

// 1. Start Backend (Flask)
let backendProc = null;
const venvPython = path.join(projectRoot, '.venv', 'bin', 'python');
const systemPython = 'python3';
const pythonBin = fs.existsSync(venvPython) ? venvPython : systemPython;

console.log('\x1b[33m%s\x1b[0m', `🐍 Starting backend using: ${pythonBin}`);

// We do NOT use shell: true here to prevent space-in-path parsing errors in the shell
backendProc = spawn(pythonBin, [path.join(projectRoot, 'backend.py')], {
  cwd: projectRoot,
  env: process.env
});

backendProc.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line) console.log(`\x1b[32m[Backend]\x1b[0m ${line}`);
  });
});

backendProc.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line) console.warn(`\x1b[31m[Backend Err]\x1b[0m ${line}`);
  });
});

backendProc.on('close', (code) => {
  console.log(`\x1b[31m[Backend] process exited with code ${code}\x1b[0m`);
  killProcess(frontendProc);
  process.exit(code || 0);
});

// 2. Start Frontend (Vite)
console.log('\x1b[33m%s\x1b[0m', '⚡ Starting frontend (Vite)...');

// Find npx command based on platform
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

// We do NOT use shell: true here to prevent shell escaping warnings and path parsing errors
const frontendProc = spawn(npxCmd, ['vite'], {
  cwd: __dirname,
  env: process.env
});

frontendProc.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line) console.log(`\x1b[34m[Frontend]\x1b[0m ${line}`);
  });
});

frontendProc.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line) console.warn(`\x1b[35m[Frontend Err]\x1b[0m ${line}`);
  });
});

frontendProc.on('close', (code) => {
  console.log(`\x1b[31m[Frontend] process exited with code ${code}\x1b[0m`);
  killProcess(backendProc);
  process.exit(code || 0);
});

// Handle termination signals to cleanly exit both child processes
const cleanup = () => {
  console.log('\x1b[33m%s\x1b[0m', '\n🛑 Shutting down backend and frontend...');
  killProcess(backendProc);
  killProcess(frontendProc);
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
