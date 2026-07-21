# Metronome

A client-only mechanical metronome built with React, TypeScript, Web Audio, and Vite. It provides direct BPM entry, tap tempo, press-and-hold stepping, a draggable tempo weight, selectable 2/4–8/4 meters, keyboard control, and synchronized visual beat feedback.

## Requirements

- Node.js 24
- npm 11+
- A current evergreen browser with Web Audio support

The production build targets ES2020 and emits sRGB fallbacks before enhanced OKLCH colors. The supported browser policy is the `browserslist` field in `package.json`: browsers with at least 0.5% usage, the latest two versions, Firefox ESR, and browsers that are not end-of-life.

## Architecture

- `src/App.tsx` owns the selected BPM and meter.
- `src/components/` contains the instrument display and controls.
- `src/useMetronomePlayback.ts` owns the Web Audio context, schedules clicks ahead on the audio clock, and synchronizes visual beat state.
- `src/tempo.ts` contains validated tempo and tap-tempo calculations.
- `src/sounds/` contains the two same-origin click samples.

There is no backend, account system, persistence, analytics, or third-party runtime API. The browser downloads only the built application and its local click samples.

## Scripts

- `npm install` — install dependencies for local development.
- `npm run dev` — start the loopback-only development server.
- `npm run lint` — run ESLint with warnings treated as failures.
- `npm run typecheck` — run strict TypeScript checking.
- `npm test` — run unit and component regression tests.
- `npm run test:e2e` — build and run the Playwright Chromium suite.
- `npm run check` — run lint, type checking, unit/component tests, and a production build.
- `npm run build` — create the authoritative production artifact in `dist/`.
- `npm run preview` — preview the current `dist/` artifact locally.

CI runs `npm ci`, the complete fast check, a clean production build, and the Playwright regression suite. `dist/` is generated and must not be committed; deploy it directly from CI rather than publishing a checked-in build directory.

## Audio behavior

Browsers require playback to begin from a user gesture, so use Start or the Space shortcut before audio is created. If a click sample cannot be downloaded or decoded, the interface explains the failure and Start performs a fresh retry. Reloading is not required.

The metronome uses a short look-ahead loop to schedule audio against `AudioContext.currentTime`; visual timers do not determine sound timing. Verify audible latency and long-duration drift on representative physical devices before a release that changes scheduling code or sound assets.

## Accessibility and responsive support

- All controls are keyboard reachable, and meter radios support Arrow, Home, and End navigation.
- BPM validation remains visible and is connected to the input for assistive technology.
- Reduced-motion preferences stop the pendulum animation.
- A compact short-viewport layout keeps Start visible at 320×568 without horizontal scrolling.
- The app does not currently advertise PWA installation or offline playback.

## Release checklist

1. Run `npm ci` from a clean checkout.
2. Run `npm run check` and `npm run test:e2e`.
3. Run `npm audit` and review any development-tool findings.
4. Test audible cadence, background/foreground behavior, and output routing on physical desktop and mobile devices.
5. Publish the generated `dist/` artifact.
