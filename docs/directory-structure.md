# Directory structure

| Path | Responsibility |
| --- | --- |
| `src/index.ts`, `src/Waveform.ts` | Public exports and lifecycle facade |
| `src/types/` | Public data, configuration, actions, events and animation contracts |
| `src/config/` | Defaults, validated resolution, snapshots and patch merging |
| `src/model/` | Committed options/data and stable visibility state |
| `src/data/` | Input normalization and point snapshots |
| `src/layout/` | Layout engine, axis budgets, domain and tick strategies |
| `src/core/` | Target resolution, synchronous scheduler, events and actions |
| `src/animation/` | Timing, instance controller, numeric matching and presentation |
| `src/renderer/` | SVG renderer, built-in views and drawing helpers |
| `demo/` | Standalone Vue/Ant Design Vue app, configuration UI and assets |
| `tests/` | Unit, public API integration, Vue and browser fixtures |
| `docs/evidence/refactor-framework-independent-waveform/` | Verification logs, screenshots and measurements |
| `openspec/changes/archive/2026-10-18-refactor-framework-independent-waveform/` | Archived specification, tasks and acceptance mapping |

`pnpm build` emits only library code/declarations to `dist/`. `pnpm build:demo` emits the demo to `dist-demo/`. Both are generated artifacts. Demo base paths are controlled by `DEMO_BASE_PATH`; library entry points never import Demo files or Vue styles.
