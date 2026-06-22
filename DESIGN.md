# Design

## Theme

A focused instrument-panel interface: dark outer canvas, lighter working surfaces, a single lime accent, and a technical readout that stays easy to scan during practice.

## Color

- `--bg`: deep charcoal-black for the page background.
- `--shell`: dark graphite for the main frame.
- `--panel`: slightly lighter graphite for control blocks.
- `--panel-strong`: a brighter neutral layer for active or selected surfaces.
- `--text`: near-white for body copy and labels.
- `--muted`: cool gray for supporting text.
- `--accent`: soft lime for primary selection and beat feedback.
- `--screen`: pale green-gray for the meter display.
- `--screen-text`: near-black for the readout.

## Typography

- Use a system sans stack for UI copy.
- Use a monospace readout for the BPM display so the number feels technical and stable.
- Keep the title compact and bold instead of decorative.
- Prefer sentence case over tracked all-caps labels.

## Components

- Main shell with a subtle border and layered surface treatment.
- Meter display with a high-contrast readout and status light.
- Tempo stepper and time-signature selector with consistent button shapes.
- Beat track cells that show the current pulse without extra ornament.
- A primary transport button that reads as the main action.

## Layout

- Top intro and meter first.
- Two-column control grid on larger screens.
- Single-column stacking on smaller screens.
- The pulse strip and transport action stay visually grouped at the bottom.

## Motion

- Use short, functional transitions for hover and selection.
- Keep beat feedback as a quick flash rather than a long animation.
- Honor reduced-motion settings with instant state changes.

## Shape

- Prefer 12 to 20px radii instead of oversized pills.
- Keep borders subtle and consistent.
- Avoid heavy shadows and decorative glass effects.
