# Production Code Review — Resolved

Review date: 2026-07-20
Resolution date: 2026-07-21

## Resolution status

All 12 findings from this review have been resolved and verified. The original problem statements remain below as an audit record; their status now reflects the current worktree.

| Finding | Resolution evidence |
|---|---|
| Failed audio initialization could not recover | `src/useMetronomePlayback.ts` clears the failed context/promise and protects concurrent attempts; the Playwright transient-failure retry test passes. |
| Bundle exceeded its browser contract | `vite.config.js` explicitly targets ES2020, the tap implementation no longer uses `.at()`, PostCSS emits hex fallbacks before OKLCH, and `package.json` documents the supported browsers. |
| Vulnerable Vite development tooling | Vite 8.1.5 and plugin-react 6.0.3 are locked; dependency installation reports zero vulnerabilities and `npm ls --all` resolves. |
| No automated regression or CI coverage | Vitest, Testing Library, Playwright, strict checks, and `.github/workflows/ci.yml` now gate the critical flows. |
| Start below the fold on short phones | The short-viewport layout keeps Start inside 320×568; the Playwright viewport regression passes without horizontal overflow. |
| Incomplete radio keyboard model | Meter radios use roving focus plus Arrow/Home/End selection; unit and browser tests pass. |
| Silent/weak BPM validation | Invalid input remains visible, is not committed, and has linked visible/status error text; component tests cover invalid and valid commits. |
| Most logic escaped type checking | All source modules are TS/TSX, strict/no-unchecked checking is enabled, React runtime/types are aligned at 19.x, and source plus test/config type checks pass. |
| Stale committed deployment artifact | The tracked `build/` directory is removed; `dist/` is ignored, generated from source, and documented as the only release artifact. |
| Scale text was too small | Essential scale/header sizes were increased, with a purpose-built compact treatment for short phones. |
| Dead duplicated manifests | Both unused manifests were removed and the document theme color now matches the page backdrop. |
| Missing production documentation | `README.md` now documents architecture, requirements, support policy, audio behavior, checks, CI, deployment, accessibility, and release steps. |

### [High] A failed audio download is cached permanently and Start cannot recover

**Location:** `src/useMetronomePlayback.js:87-114`, `src/useMetronomePlayback.js:264-293`
**Status:** Resolved
**Problem:**
`audioBuffersPromiseRef` is initialized once and retains a rejected `Promise` if either click sample fails to fetch or decode. The error path resets playback state but never clears the rejected promise or the partially initialized `AudioContext`. Every later Start attempt awaits the same rejection instead of retrying the assets. The UI also reduces the detailed error stored in `playbackError` to the generic “Audio unavailable” label in `src/components/PulseSection.jsx:11-23`.

**Impact:**
A transient asset/CDN/network failure disables the product’s core function for the rest of the page session. The only recovery is an undocumented reload, and the generic message gives the user no useful recovery direction.

**Example:**
In browser fault injection, the first WAV request was failed and the first Start attempt showed “Audio unavailable.” After requests were allowed again, a second Start attempt made zero new WAV requests and remained unavailable; reloading was required.

**Recommended fix:**
On load/decode failure, clear `audioBuffersPromiseRef`, close or reset the failed context as appropriate, and allow the next user gesture to create a fresh load attempt. Preserve cancellation protection for in-flight starts. Surface a concise actionable error such as “Sound could not be loaded — try again,” while retaining details for diagnostics. Add a regression test that fails the first asset request and succeeds on retry.

**Fix scope:** Medium
**Regression risk:** Medium

### [Medium] The emitted bundle does not honor its nominal browser compatibility target

**Location:** `vite.config.js:4-8`, `src/App.css:5-21`, `src/components/TempoControls.jsx:245-248`
**Status:** Resolved
**Problem:**
The Vite configuration leaves the default build target in place, which in the installed Vite version includes Chrome 87, Edge 88, Firefox 78, and Safari 14. The CSS relies almost entirely on `oklch()` without RGB/hex fallbacks, and the JavaScript uses `Array.prototype.at()`. Those features are not available across that target set. The production bundle retains `.at(-1)`, and there is no `@supports` fallback, browserslist, polyfill, or documented minimum browser version.

**Impact:**
On an ostensibly targeted older browser, the tap-tempo handler can throw and most color/background declarations become invalid. The instrument can render as largely unstyled or unreadable instead of degrading gracefully.

**Example:**
A user opening the app in Safari 14 can reach the page because it supports ES modules, but the OKLCH-only lacquer/brass styling is unsupported and tapping Tap Tempo invokes an unsupported `.at()` method.

**Recommended fix:**
Define and document an explicit supported-browser policy. Replace `.at(-1)` with index access or provide a suitable polyfill. If older browsers remain supported, emit sRGB fallback declarations before OKLCH values and test them. If they are intentionally unsupported, align the build target and documentation with the actual minimum versions and add a compatibility smoke test.

**Fix scope:** Medium
**Regression risk:** Medium

### [Medium] Vulnerable Vite development tooling is locked into the repository

**Location:** `package.json:20-25`, `package-lock.json:1553-1562`, `package-lock.json:2614-2629`
**Status:** Resolved
**Problem:**
`npm audit` reports one high, one moderate, and one low development dependency vulnerability. Vite 5.4.21 is affected by path traversal / file disclosure advisories (including GHSA-fx2h-pf6j-xcff), its esbuild 0.21.5 dependency is affected by the development-server cross-origin request advisory, and Babel 7.29.0 has a low-severity source-map file-read advisory. The audit’s available Vite fix is a major-version upgrade.

**Impact:**
These findings do not enter the generated static production bundle—`npm audit --omit=dev` reported zero vulnerabilities—but they can expose local files or credentials if a developer or preview server is reachable by untrusted clients. They also leave the build pipeline on a known-vulnerable toolchain.

**Example:**
A developer runs Vite with a network-accessible host for device testing on a shared network. An attacker who can reach that server may exploit a path-handling weakness to read files the server should deny.

**Recommended fix:**
Upgrade Vite and `@vitejs/plugin-react` together to a supported, patched major version, review the migration notes, rebuild, and rerun the complete browser checks. Until then, bind development servers to loopback unless LAN access is explicitly required and trusted.

**Fix scope:** Medium
**Regression risk:** High

### [Medium] Core timing and interaction behavior has no automated regression coverage or CI gate

**Location:** `package.json:6-10`, `src/useMetronomePlayback.js:26-345`, `src/components/TempoControls.jsx:28-383`, `src/components/MeterDisplay.jsx:30-302`
**Status:** Resolved
**Problem:**
The only scripts are `dev`, `build`, and `preview`. There are no unit, integration, end-to-end, lint, or CI configuration files. Complex behavior—look-ahead audio scheduling, cancellation generations, live BPM/meter rescheduling, press-and-hold acceleration, tap averaging, pointer capture, keyboard sliders, and audio failure recovery—is therefore unprotected. `npm run` confirms no test or lint command exists.

**Impact:**
Regressions in the product’s defining behavior can merge and deploy as long as the app still bundles. Timing and async lifecycle defects are especially easy to miss through manual happy-path testing.

**Example:**
Resetting the audio promise incorrectly, changing effect dependencies, or altering pointer-capture order could create duplicate beats, timers after unmount, or buttons that continue stepping; the production build would still pass.

**Recommended fix:**
Add deterministic unit tests for pure tempo/tap calculations and scheduler state transitions, component tests for keyboard/pointer/error behavior, and a small Playwright suite for start/stop, tempo, meter, retry, reduced motion, and mobile viewport checks. Add lint/typecheck/test/build commands and make them required CI checks. Use a fake or injectable clock/audio adapter for reliable scheduler tests.

**Fix scope:** Large
**Regression risk:** Low

### [Medium] The primary playback control is below the fold on short phones

**Location:** `src/App.css:148-159`, `src/App.css:948-989`
**Status:** Resolved
**Problem:**
The mobile breakpoint reduces the meter to a still-fixed 375px height but does not adapt for short viewports. At 320×568, the page is 867px tall and the Start button begins at y=705, about 137px below the initial viewport. The first screen shows the decorative scale and only part of the tempo controls; playback cannot be started without scrolling.

**Impact:**
The highest-priority action is hidden on compact or landscape mobile screens, increasing time-to-task and making the app feel broken or ornamental. This conflicts with the documented goal that small-screen use be first-class.

**Example:**
On a 320×568 device, a musician opens the app one-handed and sees the metronome body plus a clipped control base. They must discover that the page scrolls and move past the tempo and meter sections before reaching Start.

**Recommended fix:**
Add a short-viewport mobile layout that compresses the scale, moves transport earlier, or keeps transport visibly sticky without covering content. Test at 320×568, common landscape sizes, 200% zoom, and with enlarged text. Keep the mechanical silhouette while prioritizing the task controls.

**Fix scope:** Medium
**Regression risk:** Medium

### [Medium] The custom radio group does not implement radio-group keyboard behavior

**Location:** `src/components/MeasureControls.jsx:15-30`
**Status:** Resolved
**Problem:**
The meter buttons declare `role="radiogroup"` and `role="radio"`, but every option remains a normal Tab stop and there is no roving `tabIndex` or Arrow-key handling. In browser testing, focusing 4/4 and pressing ArrowRight left focus and selection on 4/4. This does not match the ARIA radio-group interaction model users of assistive technology expect.

**Impact:**
Keyboard users must Tab through all seven meter choices, and familiar arrow-key selection does nothing. The declared semantics promise a behavior the component does not provide.

**Example:**
A screen-reader user tabs to the selected 4/4 radio and presses Right Arrow expecting 5/4. Nothing changes, so they must tab repeatedly and activate a separate button.

**Recommended fix:**
Prefer native radio inputs styled to match the instrument, or implement the complete ARIA pattern: only the selected radio in the Tab order, Arrow keys moving focus/selection with wrapping, and Space selecting where appropriate. Add keyboard tests.

**Fix scope:** Small
**Regression risk:** Medium

### [Medium] Invalid BPM entry is identified only weakly and is silently rewritten

**Location:** `src/components/TempoControls.jsx:145-150`, `src/components/TempoControls.jsx:166-189`, `src/components/TempoControls.jsx:291-314`, `src/App.css:552-554`
**Status:** Resolved
**Problem:**
While editing, an out-of-range or nonnumeric value only changes the border color and sets `aria-invalid`; the described help text explains keyboard increments but not the error or valid range. On blur, invalid numeric input is silently clamped and invalid text/empty input silently reverts. There is no visible or announced validation message describing what happened.

**Impact:**
This relies on color for sighted error recognition and does not satisfy clear error identification for assistive users. Silent correction can also leave users practicing at a materially different tempo from the value they intended.

**Example:**
A user mistypes `999`, sees only a brief red outline, tabs away, and the value becomes `220` without an explanation that the accepted range is 40–220.

**Recommended fix:**
Add persistent error text linked with `aria-describedby` that states the valid range, pair color with an icon/text state, and choose an explicit commit policy: block commit until corrected or announce that the value was clamped. Keep the last valid value available for Escape/cancel.

**Fix scope:** Small
**Regression risk:** Low

### [Medium] Type checking passes while most application logic is effectively unchecked

**Location:** `tsconfig.json:3-19`, `package.json:14-19`, `src/useMetronomePlayback.js:26-345`, `src/components/MeterDisplay.jsx:30-302`
**Status:** Resolved
**Problem:**
The project uses TypeScript entry files but keeps nearly all components and the core playback hook in `.js`/`.jsx`. `allowJs` is enabled without `checkJs`, `strict` is disabled, and no props, refs, or scheduler structures are typed. Runtime React 18.3.1 is also paired with React 19 type packages. Consequently `tsc --noEmit` passes while leaving the most failure-prone code as `any`-shaped JavaScript and suppressing nullability checks such as the root element lookup.

**Impact:**
Invalid prop shapes, wrong timer/source map values, unsupported platform APIs, stale callback assumptions, and React version mismatches are discovered only at runtime or during manual review.

**Example:**
A refactor passes a string BPM or changes `scheduledSourcesRef` values from times to objects. The compiler does not protect arithmetic and Web Audio calls inside the JavaScript hook.

**Recommended fix:**
Align `@types/react` and `@types/react-dom` with the runtime major, enable `strict`, and either migrate the hook/components incrementally to TS/TSX or enable `checkJs` with JSDoc types first. Type the audio context fallback, refs, callbacks, CSS custom-property styles, and component props. Stage the change so existing issues can be resolved in manageable batches.

**Fix scope:** Large
**Regression risk:** Medium

### [Medium] A stale tracked build conflicts with the configured production output

**Location:** `vite.config.js:4-7`, `.gitignore:7`, `build/index.html:5-14`
**Status:** Resolved
**Problem:**
Vite is configured to emit `dist`, and `dist` is ignored, but a separate `build/` directory is committed. That tracked bundle still uses `/projects/metronome/` asset URLs, old hashes, an old description/theme, legacy font assets, and none of the current Tap Tempo, draggable weight, audio error, or Web Audio strings. Git history confirms `build/` predates the current source refactor.

**Impact:**
There are two plausible production artifacts with different behavior. A host, release script, or maintainer that publishes the tracked `build/` folder will deploy stale code even though `npm run build` succeeds locally.

**Example:**
A static hosting configuration points at `build/` by convention. The source review and CI build look current, but users receive the older interface and timing implementation referenced by `index-DiXNdw4z.js`.

**Recommended fix:**
Choose one deployment model. Prefer generating `dist` from source in CI and publishing that immutable artifact; remove the tracked legacy build. If committed artifacts are required, configure Vite and documentation to use exactly one directory and add a CI freshness check that fails when source and artifact diverge.

**Fix scope:** Medium
**Regression risk:** Medium

### [Low] Essential scale text is rendered at extremely small sizes

**Location:** `src/App.css:141-146`, `src/App.css:161-170`, `src/App.css:197-207`, `src/App.css:239-247`
**Status:** Resolved
**Problem:**
The maker subtitle, scale heading, scale numbers, and tempo terms use `0.45rem`–`0.52rem`, approximately 7.2–8.3 CSS pixels at the default root size. They remain this small at the mobile breakpoint. Contrast is generally strong, but the text itself is difficult to resolve on ordinary-density phone displays and for low-vision users.

**Impact:**
The visual scale—the main affordance for the draggable weight—becomes hard to scan, especially on mobile or in bright practice environments. Users fall back to the lower readout instead of benefiting from the mechanical scale.

**Example:**
At 320px width, the terms in the captured mobile view are visibly cramped and truncate visually around the pendulum even though the layout does not overflow.

**Recommended fix:**
Increase essential scale labels, selectively hide decorative copy on compact screens, and re-space marks to maintain legibility. Verify at default zoom, enlarged text, and low-resolution/mobile displays rather than relying only on desktop screenshots.

**Fix scope:** Small
**Regression risk:** Medium

### [Low] The web-app manifest is duplicated but never activated

**Location:** `index.html:3-12`, `manifest.json:1-15`, `public/manifest.json:1-15`
**Status:** Resolved
**Problem:**
Identical manifests exist at the repository root and under `public/`, but `index.html` has no `<link rel="manifest">`. The root copy is not part of the Vite public pipeline, while the public copy is emitted but undiscoverable. Manifest colors are black, the document theme color is near-black, and the actual page background is light cool gray.

**Impact:**
Installability metadata is dead configuration, maintainers can update the wrong copy, and mobile browser/installed-app chrome can be visually disconnected from the rendered page. There is also no service worker or documented offline behavior, so the presence of a standalone manifest overstates PWA readiness.

**Example:**
Chromium browser inspection found zero manifest links even though `manifest.json` was present in the production output; “install app” behavior cannot use the supplied name, icon, start URL, or display mode.

**Recommended fix:**
Decide whether installability is a supported feature. If yes, keep one manifest under `public`, link it from `index.html`, align theme/background colors with the UI, provide appropriate icon sizes, and document the intended offline limitations. If not, remove the duplicate/dead manifest files.

**Fix scope:** Small
**Regression risk:** Low

### [Low] Production and maintenance requirements are under-documented

**Location:** `README.md:1-16`
**Status:** Resolved
**Problem:**
The README lists install/dev/build/preview commands but does not document the architecture, supported Node/browser versions, deployment directory/base path, audio autoplay requirements, error recovery, test status, release process, or the fact that all data and sounds are local. This is particularly risky given the conflicting `build` and `dist` outputs and the browser-feature assumptions.

**Impact:**
Future maintainers must reverse-engineer production behavior and can easily deploy the wrong artifact, claim unsupported browsers, or overlook the absence of automated checks.

**Example:**
A new maintainer follows `npm run build` and receives `dist/`, while an existing hosting setup may still expect the committed `build/`; the README gives no way to determine which is authoritative.

**Recommended fix:**
Document the client-only architecture and main flow, prerequisites, supported browsers, build/deployment contract, expected Web Audio behavior, verification commands, and known limitations. Keep operational facts concise and testable.

**Fix scope:** Small
**Regression risk:** Low

## Final summary

### Finding counts (all resolved)

- Critical: 0
- High: 1
- Medium: 8
- Low: 3
- Total: 12

### Architecture and data flow reviewed

This is a client-only React 18 single-page application built by Vite. `App.tsx` owns BPM and meter state. `TempoControls`, `MeasureControls`, and the draggable `MeterDisplay` send state changes upward. `useMetronomePlayback` owns a Web Audio context, downloads two bundled same-origin WAV files, schedules audio ahead on the audio clock, and schedules visual React state updates to match. There is no server API, persistence, authentication, authorization, analytics, user-generated HTML, secret handling, or third-party runtime integration.

The main flows reviewed were initial rendering, direct/slider/step/drag/tap tempo changes, meter changes, Start/Stop, the Space shortcut, live cadence changes, visual beat feedback, audio failure handling, reduced motion, keyboard behavior, mobile layout, asset/build output, and dependency/tooling state.

### UI audit health score

| Dimension | Score | Key finding |
|---|---:|---|
| Accessibility | 2/4 | Radio keyboard model and input error identification need work |
| Performance | 4/4 | Lean bundle and audio-clock look-ahead scheduling behaved well |
| Responsive design | 3/4 | No horizontal overflow, but transport is hidden initially on short phones |
| Theming | 3/4 | Coherent tokens, but OKLCH has no compatibility fallback |
| Anti-patterns | 4/4 | No generic/AI UI anti-patterns detected |
| **Total** | **16/20 (Good)** | Address the weak production-readiness dimensions before release |

The anti-pattern verdict is a pass: the interface is a coherent single instrument rather than a generic card/grid product surface. The deterministic detector returned no findings. The visual system uses restrained state color, familiar controls, and purposeful motion.

### Commands and checks run

- `npm ls --all` — passed; the declared tree resolved. The existing workspace also contains extraneous Playwright packages used for review, but they are not declared or shipped.
- `npm install --ignore-scripts --package-lock-only --dry-run` — passed and reported the lock state up to date; no dependency files were changed.
- `./node_modules/.bin/tsc --noEmit --pretty false` — exited 0, with the coverage limitations described above.
- `npm run` — confirmed only `dev`, `build`, and `preview` scripts exist.
- `npm run build -- --outDir /tmp/metronome-review-build.4V3aWZ` — passed in 1.28s; output was 163.77 kB JS (52.44 kB gzip), 22.19 kB CSS (5.65 kB gzip), plus 48.85 kB of WAV assets. The repository output directories were not touched by this build.
- `npm audit --json` — completed after the sandboxed registry attempt failed DNS; found 0 critical, 1 high, 1 moderate, and 1 low development-tool vulnerability.
- `npm audit --omit=dev --json` — passed with zero production dependency vulnerabilities.
- `npm outdated --json` — identified newer majors for Vite/plugin-react, React/React DOM, Tailwind, and TypeScript; age alone was not reported as a defect where no concrete risk was found.
- `git diff --check` — passed before the report was written.
- Impeccable deterministic source scan — returned zero anti-pattern findings.
- Static scans for injection/storage/debug/TODO patterns — found no dangerous HTML injection, eval, client storage, cookies, leaked debugging calls, or unresolved application TODOs.
- Headless Chromium production-build QA — current Chromium rendered without console/page errors; Start/Stop, Space, tempo steps, valid/clamped direct input, Tap Tempo, meter click, weight Home/End, live cadence changes, and reduced motion worked. Visual cadence was approximately 500ms at 120 BPM and 333ms at 180 BPM.
- Responsive browser QA at 1440×900, 390×844, and 320×568 — no horizontal overflow; the short-phone transport position and meter target dimensions were measured. Desktop and mobile screenshots were visually inspected.
- Audio fault injection — confirmed the rejected-promise retry defect.
- Repository/history/artifact comparison — confirmed the committed `build/` bundle is stale relative to current source and generated `dist` output.

### Checks not run

- No repository lint check could be run because there is no linter dependency, configuration, or script.
- No repository unit/component/E2E suite could be run because none exists.
- A clean `npm ci` was not run because it would replace `node_modules` and violate the no-mutation review constraint; dependency resolution and lock consistency were validated read-only instead.
- Safari and Firefox were not available in the workspace, so cross-engine behavior was assessed statically and with Chromium only.
- Audible output quality, hardware latency, long-duration drift, background-tab behavior, and real mobile audio routing could not be validated in muted headless Chromium. The audio-clock scheduling code and visual cadence were inspected/tested, but this is not a substitute for device testing.
- No server/auth/API penetration checks were applicable because the repository has no backend, accounts, authorization boundary, secrets, or remote runtime API.

### Five issues to fix first

1. Reset and retry audio initialization after load/decode failures.
2. Establish an explicit browser support contract and remove unsupported emitted features or add fallbacks.
3. Upgrade the vulnerable Vite development toolchain.
4. Add regression tests and CI gates around audio scheduling and controls.
5. Make transport reachable on short phones and complete the radio/input accessibility behavior.

### Suggested implementation order

1. Add a focused failing regression test/harness for audio retry, then fix the cached rejection and improve the error message.
2. Establish the automated test/lint/typecheck/build CI baseline so subsequent work is protected.
3. Upgrade Vite/plugin-react and rerun build, audit, and browser QA.
4. Define supported browsers; replace `.at()`, add color fallbacks or raise/document the minimum versions, and add compatibility smoke checks.
5. Correct radio-group keyboard behavior and BPM error messaging.
6. Implement the short-viewport layout and retest mobile, zoom, text enlargement, and reduced motion.
7. Align React types, introduce strict checking, and migrate/JSDoc-type the playback and interaction modules incrementally.
8. Resolve the `build`/`dist` deployment contract and remove stale/dead artifacts.
9. Activate or remove the manifest, improve small text, and update operational documentation.
10. Run a final full production build, audit, cross-browser/device audio pass, and UI audit.

### Areas reviewed that appeared healthy

- The Web Audio look-ahead design uses the audio clock rather than relying on `setTimeout` for sound timing, and observed cadence stayed close to the selected BPM.
- Scheduler, visual timer, source, animation-frame, and AudioContext cleanup paths are present and generally careful.
- Current Chromium happy paths for tempo, meter, transport, tap tempo, direct manipulation, and live rescheduling worked without runtime errors.
- The generated bundle is modest, local assets are small, and production dependencies have no reported audit vulnerabilities.
- No unsafe HTML injection, eval, credential storage, remote tracking, or user-data exposure surface was found.
- Buttons and inputs are mostly semantic and labeled; focus indicators are strong; the custom tempo weight includes slider semantics and keyboard support.
- Reduced-motion behavior is implemented and verified, and the pendulum is transform-animated rather than layout-animated.
- The responsive layout avoids horizontal scrolling at the tested widths, and major controls meet reasonable target sizes except the compact meter cells.
- State ownership is straightforward, component boundaries are understandable, and there is little duplication beyond small clamp helpers.
- The visual design is distinctive, coherent with `PRODUCT.md`/`DESIGN.md`, and free of the UI anti-patterns targeted by the audit.

### Assumptions and uncertainties

- Severity assumes the app is intended for general production web use, including compact phones and keyboard/assistive-technology users.
- The stale `build/` deployment impact depends on hosting configuration, which is not present in this repository; the artifact mismatch itself is confirmed.
- The Vite advisories primarily affect development/preview serving, not the static production files. Risk rises if those servers are exposed beyond loopback.
- Browser compatibility impact depends on the intended minimum browser versions, which are undocumented. The mismatch with the current Vite default target and emitted features is confirmed.
- Headless visual cadence does not prove acoustic latency or long-duration musical accuracy on physical devices; those require real-device measurement.
