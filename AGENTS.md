# AGENTS.md

## Key Facts

- **Repo name** is `videojs-timecodes`; **npm package name** is `videojs-frames`; plugin registers as `player.frames()`.
- Plain ES modules — no TypeScript.
- `dist/` files are **committed** to the repo. Always rebuild before committing changes to `src/`.

## Package Manager & Node

- Package manager: **npm**. `package-lock.json` is gitignored — do not commit it.
- Node version: `lts/*` (see `.nvmrc`). Use `nvm use` before running anything.

## Developer Commands

```sh
npm install       # install deps
npm start         # dev server (Karma) + file watchers; browse at http://localhost:9999
npm run build     # clean + parallel CSS/JS/lang build (Rollup + PostCSS)
npm run lint      # vjsstandard (not plain ESLint)
npm test          # runs lint + build first (pretest hook), then unit + verify
```

- Browse tests while dev server is running: `http://localhost:9999/test/`
- `npm test` triggers `pretest` (lint → build) automatically — do not skip it.
- Coverage report is printed to stdout via `posttest` and written to `test/dist/coverage/text.txt`.

## Linting

- Linter is `vjsstandard` (videojs-standard wrapper around ESLint). Config is in `package.json` under `"vjsstandard"`.
- Ignores: `dist/`, `docs/`, `test/dist/`.
- On pre-commit, `lint-staged` auto-fixes staged `.js` files with `vjsstandard --fix` and re-stages them.
- On pre-push, `npm test` runs in full.

## Testing

- Framework: **QUnit** + **sinon** (fake timers). Tests run in **real browsers** (Chrome + Firefox) via **Karma** — not Jest or Vitest.
- Only one test file: `test/plugin.test.js`.
- To run tests without the full `pretest` pipeline: `npm run test:unit`.

## Build Pipeline

- `npm run build` runs `prebuild` (clean) then parallel: `build:css`, `build:js`, `build:lang`.
- CSS uses **PostCSS nesting syntax** — not standard CSS. Config: `scripts/postcss.config.js`.
- JS bundled with **Rollup**. Config: `scripts/rollup.config.js` (delegates to `videojs-generate-rollup-config`).
- Output targets: `dist/videojs-frames.cjs.js` (CommonJS), `dist/videojs-frames.es.js` (ES module), `dist/videojs-frames.js` / `.min.js` (UMD).

## Source Layout

```
src/
  plugin.js                  # main entrypoint; registers `player.frames()`
  plugin.css                 # PostCSS source
  parser.js                  # BIF file format parser (BIFParser class)
  components/
    bif-mouse-time-display.js  # thumbnail preview overlay (extends MouseTimeDisplay)
    clipping-ui.js             # noUiSlider clip range mount
  util/dom.js                  # getElementPosition / getPointerPosition helpers
```

## Plugin API Surface

Key public methods on the `frames` plugin instance:
- `seekForward(frames)`, `seekBackward(frames)`, `seekTo({ SMPTE|time|frame|seconds|milliseconds })`
- `toSMPTE()`, `toTime()`, `toFrames()`, `toSeconds()`, `toMilliseconds()`, `totalFrames()`
- `partialRestore(callback)`

Default options: `{ format: 'time', clippingEnabled: true, clippingDisplayed: false, clippingUi: false }`.
