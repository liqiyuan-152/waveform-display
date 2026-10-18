# Changelog

## 0.2.0

Compared with 0.1.17, this pre-1.0 minor release includes substantial architecture, lifecycle, animation and demo changes.

### Features

- Refactor the framework-independent TypeScript library into data, model, layout, renderer, scheduling and animation modules. Vue and Ant Design Vue remain demo-only dependencies.
- Add instance lookup and initialization, joint data/options updates, effective option snapshots, events and actions.
- Add opt-in entry and update animations with pause, resume, finish and static fallback behavior.
- Rebuild the demo configuration panel, including single/multiple value-axis modes and scientific number formatting.

### Fixes

- Preserve per-field global style inheritance and explicit zero/false overrides, including zero-width legends.
- Validate dimensions atomically, respect fixed display widths, and update percentage dimensions when the host resizes.
- Reject conflicting responsive height limits while preserving the last valid chart.
- Append points without rewriting existing points or wrapping the point count; guard empty-series actions and recover from empty preview.
- Keep series selection valid after dataset changes, preserve colors at zero alpha, and prevent invalid slider drafts from being committed.
- Fit long value-axis titles and prevent overlap between shot metadata and the X-axis title.

### Compatibility notes

- Duplicate construction on one container now throws; use `Waveform.init()` to reuse an instance.
- Mutating operations, option snapshots and animation controls throw after destruction. Destruction remains idempotent.
- Width and height must be finite positive numbers, positive numeric strings, positive px values, or percentages in `(0, 100]`; unsupported units and invalid values are rejected.
- Percentage dimensions refer to the host container. Give the host an explicit height when using percentage height.
- Internal source paths have moved; import public APIs from `waveform-display`.
- See [migration notes](docs/migration.md) for lifecycle, update and animation details.

### Validation

- 45 test files and 502 tests pass, together with type checking, library and demo builds.
- 196 OpenSpec verification tasks completed, with browser geometry and animation evidence archived under `openspec/changes/archive/2026-10-18-verify-demo-control-accuracy/`.
