#!/usr/bin/env node

/**
 * Workaround wrapper around `vjsverify`.
 *
 * `vjsverify` (via `@brandonocasey/spawn-promise`) spawns `npm pack --json
 * --dry-run` and parses its JSON stdout. When `node`/`npm` is installed via
 * snap (Ubuntu), the snap shim at `/snap/bin/node` is actually a symlink to
 * `/usr/bin/snap`, and snap's AppArmor confinement silently drops the
 * sub-process's stdout/stderr when it is itself spawned from another node
 * process. The end result is that `vjsverify` receives an empty stdout and
 * throws `TypeError: Cannot read properties of null (reading '0')`.
 *
 * The fix is to prepend `/snap/node/current/bin` (the real node/npm binaries,
 * not the snap shim) to `PATH`, so any sub-process call to `npm` resolves to
 * the actual binary and works as expected.
 *
 * On non-snap installations this prefix simply does not exist and is ignored
 * by the resolver, so the wrapper is safe to run anywhere.
 */

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const env = Object.assign({}, process.env);
const snapNodeBin = '/snap/node/current/bin';

if (fs.existsSync(snapNodeBin)) {
  env.PATH = `${snapNodeBin}${path.delimiter}${env.PATH || ''}`;
}

const binDir = path.join(__dirname, '..', 'node_modules', '.bin');
const isWin = process.platform === 'win32';
const vjsverify = path.join(binDir, isWin ? 'vjsverify.cmd' : 'vjsverify');

// Skip the ES5 syntax check: Video.js 8 dropped IE11 support, so the plugin
// is no longer transpiled down to ES5 (its `browserslist` is just "defaults").
// `vjsverify`'s syntax check is hard-coded to ES5 and would always fail on
// modern bundles.
const child = spawn(
  vjsverify,
  ['--verbose', '--skip-syntax', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env,
    shell: isWin
  }
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code);
  }
});
