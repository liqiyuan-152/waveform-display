# Architecture

The public `Waveform` class is a framework-independent TypeScript facade. Vue and Ant Design Vue belong only to `demo/`. The library owns one SVG root and never clears unrelated host children.

## Data flow

`Waveform.update` validates configuration before committing it. `OptionManager` keeps explicit overrides separately from resolved defaults. `WaveformModel` owns normalized data snapshots and stable series visibility keys. Caller mutations take effect only after an explicit update, including resubmission of the same array reference.

`LayoutEngine` resolves the target domains, plot rectangle, axis measurements and `TickLayout` objects once per business update. X nice ticks use 1/2/3/5/10; Y uses 1/2/5/10. Explicit boundaries remain authoritative. Legacy is the default strategy.

`SvgRenderer` owns the SVG and `ViewRegistry` maintains built-in views in paint order. Views reconcile their own nodes and retain unchanged content. No renderer registry or plugin extension API is public.

## Animation

Animation defaults off. Each chart has its own `Animator`, using the target element's window and at most one pending RAF. `WaveformPresentation` prepares series/point matches and equal-length geometry arrays at commit time. Frames interpolate numerical values and shared domains, generate ticks within those domains, and draw without normalizing data or measuring layout again. The final frame uses the saved target context and tick layout.

Unique point IDs take precedence; otherwise all points must have unique X values. Ambiguous or crossing matches crossfade. Multiple series require unique IDs. Plot rectangle changes, axis changes, reversed domains, excessive displacement, reduced motion and resource limits cause static convergence. Entry clipping includes both line and markers and preserves dash patterns.

The controller separates manual and document-hidden pause reasons. Batch callbacks run after terminal cleanup, and newer commits invalidate older notifications. Synchronous SVG export finishes the current target before serialization and defers completion callbacks to a microtask. Destroy releases the observer, frame, environment listeners, subscriptions, views and element mapping before abort callbacks.

## Events and Demo

`RenderScheduler` coalesces reentrant drawing while preserving synchronous updates. `EventEmitter` isolates listener errors; layout notifications are coalesced into a microtask. `ActionDispatcher` routes mouse, keyboard and API series toggles through one implementation.

The Vue Demo creates charts after template refs mount and destroys only instances it owns. Its form reads `getOptions()` but writes minimal patches through an explicit-options draft. Array replacements are built from that draft so editing a color does not freeze derived title or axis defaults.
