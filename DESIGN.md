# Design

## Theme

A physical mechanical metronome on a minimal cool-neutral field. The UI is the instrument itself: a tapered near-black chassis, engraved brass scale, moving pendulum, and compact controls integrated into the weighted base.

## Color

- `--backdrop`: cool neutral gray that keeps all attention on the instrument.
- `--shell`: near-black lacquer for the metronome body.
- `--ivory`: high-contrast instrument labeling.
- `--brass`: tempo markings and interactive hardware.
- `--red`: downbeat and playback feedback only.

## Typography

- Use a system sans stack for UI copy.
- Use a monospace readout only for the live BPM number.
- Use the system sans stack for controls and a restrained serif for the maker's mark and traditional tempo terms.
- Keep instrument labels compact and legible.

## Components

- Tapered lacquered chassis with an engraved tempo scale.
- Brass pendulum whose weight follows the selected BPM and whose swing follows playback.
- Tempo slider and step buttons integrated into the base.
- Compact meter selector, pulse lamps, and a physical transport switch.

## Layout

- The metronome is centered as one recognizable object rather than a collection of cards.
- Tempo and meter controls share a compact row on larger screens and stack on phones.
- Pulse feedback and transport remain grouped at the front of the base.

## Motion

- Synchronize the pendulum transition with the current BPM.
- Keep beat lamps as quick state changes.
- Stop the pendulum and use instant state changes when reduced motion is preferred.

## Shape

- Use small radii that resemble manufactured parts.
- Reserve circular shapes for hardware, lamps, and step controls.
- Use tactile highlights and compact shadows only where they clarify physical depth.
