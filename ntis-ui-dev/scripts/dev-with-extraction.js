const { spawn } = require('child_process');
const path = require('path');

console.log('[NTIS UI] Launching Next.js development server...');

const nextBin = path.resolve(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');

const child = spawn(process.execPath, [nextBin, 'dev', '-H', '0.0.0.0'], {
  stdio: 'inherit',
  shell: false,
  cwd: path.resolve(__dirname, '..')
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});
process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});

