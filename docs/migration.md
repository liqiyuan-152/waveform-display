# Migration notes

The library remains a TypeScript class with ESM and UMD entry points. Vue and Ant Design Vue are used only by the example application. Import supported APIs from `waveform-display`; internal source paths have moved and are not public entry points.

## Lifecycle changes

- A container can have one active instance. Direct duplicate construction throws. `Waveform.init(target, data, options)` returns an existing instance without replacing its data or options.
- `Waveform.getInstanceByDom(target)` looks up the current first matching element. Instances stay bound to their original element even if selector matches later change.
- Destroy is idempotent and removes only the chart's own SVG. Existing host nodes remain intact.
- Mutating operations, `getOptions()` and animation controls throw after destruction. `toSVGString()` returns an empty string; `downloadSVG()` does nothing.

## Updates and defaults

`update({ data, options })` commits a joint update, while `resize()` synchronously measures the current host. `getOptions()` returns an isolated effective snapshot, including functions by identity. Use small patches for edits; do not use this effective snapshot as the persistent source of explicit axis or title overrides.

Input data is copied. Mutating an existing input array alone does not update the chart; calling `updateData` with that same array does. Series IDs should be unique when visibility state or animation continuity must survive reorderings. Optional point IDs allow X values to change while preserving identity.

## Opt-in animation

Set `animationEnabled: true` to animate subsequent changes. Entry defaults to 1000ms, cubic-in-out and 100ms staggering; updates default to 300ms. `animation` and `animationUpdate` have independent `enabled`, `duration`, `easing`, `onComplete` and `onAbort` fields. Entry also supports `delay`, `staggerDelay` and `direction` (`left-to-right`, `right-to-left`, `center-out`).

Use `chart.animation.pause()`, `resume()`, `finish()` and `isRunning()`. Export remains synchronous and returns the final target, not an intermediate frame. Export-triggered completion callbacks run after serialization/download initiation. Animation defaults off and degrades to static for reduced motion, unavailable RAF, incompatible coordinates, the point threshold or internal buffer limits.

## Versioning

This working change does not publish or change package version `0.1.17`. Before release, select a version under the repository's release policy, accounting for stricter duplicate-construction and destroyed-instance behavior. Packed-module compatibility results are recorded in the evidence directory; do not infer CommonJS support solely from the filename suffix.

The actual packed artifact passed ESM rendering, browser UMD rendering, and strict TypeScript NodeNext/Bundler consumers on Node 20.20.2. CommonJS `require()` also succeeded on Node 20.20.2, whose runtime can load the synchronous ESM D3 dependency; this result does not guarantee older Node 20 patch releases. No Vue/Ant Design or D3 type package was needed by the clean public-API consumer.
