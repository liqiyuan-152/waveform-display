# waveform-display

A pure-display, configuration-driven waveform component built with Vite, TypeScript, D3 and SVG.

## Features

- No interaction dependencies: focused on waveform presentation
- Single or multiple waveform series
- Responsive SVG rendering with `ResizeObserver`
- Automatic padding for axes, titles and legends
- Independent top/right/bottom/left frame borders
- Optional centered frame-number watermark with configurable typography
- Waveform color, width, line type, dash style and opacity
- Global and per-series point styles: circle, square, triangle and diamond
- X/Y domain, tick count, tick size, padding and D3 number format
- Optional automatic readable X-domain boundaries
- Shared scientific notation for very large or very small Y-axis values
- Arbitrary named Y value axes with independent scales
- Axis titles and units
- Horizontal or vertical legends with line-style previews
- X/Y grid styling
- Zero reference line
- Configurable empty-data state
- SVG string/export API
- Chart title
- Per-series style overrides
- Runtime `updateData()`, `updateOptions()` and `destroy()`

## Installation

```bash
npm install waveform-display
```

## Development

```bash
pnpm install
pnpm dev
```

## Demo value-axis modes

The demo opens in multiple-value-axis mode with one fixed axis on the left and one on the right. Open **坐标轴 → 值轴** and use the **单值轴 / 多值轴** control to switch modes:

- **单值轴** binds every series, the Y grid, and the zero line to the left axis.
- **多值轴** restores the previous left/right axis settings, per-series bindings, and grid/zero-line references.

In single-axis mode, axis-reference controls are hidden because only the left axis is available. The demo intentionally exposes a fixed left/right workflow; the library API remains unchanged and continues to support `yAxes` together with each series's `yAxis` binding.

## Build and checks

```bash
pnpm check
pnpm build
```

## Basic usage

```ts
import { Waveform } from 'waveform-display'

const chart = new Waveform('#chart', [
  { x: 0, y: 0.2 },
  { x: 1, y: 0.8 },
  { x: 2, y: -0.4 },
], {
  width: '100%',
  responsive: { enabled: true, aspectRatio: 2.5 },
  layout: { autoPadding: true },
  frame: {
    borderColor: '#334155',
    borderWidth: 2,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
  },
  line: { color: '#2563eb', width: 2 },
  frameNumber: 12,
  frameNumberStyle: { color: '#1677ff', opacity: 0.1 },
  shot: { visible: true, text: '10001', fontSize: 11 },
  title: { visible: true, text: 'Waveform', fontSize: 16 },
  legend: { fontSize: 12 },
  xDomainStrategy: { type: 'nice', bounds: 'both', tickCount: 10 },
  xAxis: {
    fontSize: 11,
    showEndValues: true,
    tickFormat: '.1f',
    title: { visible: true, text: 'Time', unit: 's', fontSize: 12 },
  },
  yAxis: {
    fontSize: 11,
    tickFormat: '.2f',
    title: { visible: true, text: 'Amplitude', unit: 'V', fontSize: 12 },
  },
  grid: { style: 'dashed', color: '#e2e8f0' },
})
```

`grid.style` accepts `solid` or `dashed`, and `grid.color` applies to both X and Y grid lines. Existing `grid.x.color`, `grid.x.dash`, `grid.y.color`, and `grid.y.dash` options remain supported and override the shared values for their respective axes.

## Frame number watermark

Set `frameNumber` to a string or number to render a centered watermark inside the plot frame. The value `0` is valid; omit the option or set it to `undefined` to hide the watermark.

```ts
const chart = new Waveform('#chart', data, {
  frameNumber: 'FRAME-12',
  frameNumberStyle: {
    color: '#1677ff',
    opacity: 0.1,
    fontSize: 72,
    fontFamily: "Consolas, Monaco, 'Courier New', monospace",
    fontWeight: 400,
  },
})
```

Without a custom `fontSize`, the watermark uses `min(120, 65% of the plot height)`. Long values and narrow frames are scaled down further to stay inside the plot. A configured font size is also treated as a maximum so responsive layouts cannot make the text overflow. The watermark is decorative, non-selectable, and does not reserve padding or intercept pointer input.

`frameNumber` is separate from `shot`: the frame number is a large centered watermark, while `shot` renders compact vertical metadata beside the right edge of the frame.

## Multiple series and value axes

```ts
new Waveform('#chart', [
  {
    name: 'Voltage',
    unit: 'V',
    yAxis: 'voltage',
    data: voltageData,
    style: {
      color: '#2563eb',
      lineWidth: 2,
    },
  },
  {
    name: 'Current', unit: 'mA', yAxis: 'current', data: currentData,
    style: {
      color: '#dc2626',
      lineStyle: 'dashed',
      point: { visible: true, type: 'diamond', size: 3 },
    },
  },
  {
    name: 'Temperature', unit: 'C', yAxis: 'temperature', data: temperatureData,
    style: { color: '#16a34a' },
  },
], {
  legend: {
    visible: true,
    position: 'top-left',
    orientation: 'horizontal',
    maxItemWidth: 200,
  },
  yAxes: [
    { id: 'voltage', position: 'left', title: { visible: true, text: 'Voltage', unit: 'V' } },
    { id: 'temperature', position: 'left', title: { visible: true, text: 'Temperature', unit: 'C' } },
    { id: 'current', position: 'right', tickFormat: '.0f', title: { visible: true, text: 'Current', unit: 'mA' } },
  ],
  grid: { y: { axisId: 'voltage' } },
  zeroLine: { axisId: 'voltage' },
})
```

For multiple effective series, click a legend item or focus it and press Enter/Space to hide or restore that series. Automatic X and Y domains are recalculated from the visible series. Legend selection survives redraws and `updateData()` calls while the series can still be matched; provide unique series `id` values when selection must remain stable across reordering.

Channel labeling changes automatically with the number of effective series. A single effective series does not render legend items or a Y-axis title; its `name` is shown above the horizontal center of the plot instead, independently of `legend.visible`. Multiple effective series do not render that centered name: they use the legend and Y-axis titles. An explicitly configured axis `title.text` takes precedence; otherwise the displayed axis uses the first visible series name. Derived axis titles are visible by default, while an explicit `title.visible: false` remains respected. Empty series do not affect the mode, and hiding series through the legend does not switch a multi-series chart into single-series mode.

### Legend item width

`legend.maxItemWidth` limits the layout width of each legend item in pixels. The width includes the line preview, the gap before the label, and the rendered label. It defaults to `200`.

```ts
const chart = new Waveform('#chart', series, {
  legend: {
    visible: true,
    position: 'top-left',
    orientation: 'horizontal',
    maxItemWidth: 160,
  },
})
```

Labels that exceed the configured width are rendered with an ellipsis. Their complete text remains available through the SVG `<title>` element and the legend item's `aria-label`. Horizontal legends use the limited item width when deciding where to wrap rows.

The value can also be changed after initialization:

```ts
chart.updateOptions({
  legend: { maxItemWidth: 240 },
})
```

Use a larger value when labels should remain visible in full, or a smaller value for compact and narrow layouts. Because the line preview is part of the limit, increasing `legend.lineLength` leaves less room for label text at the same `maxItemWidth`.

Set `shot` on each series when a chart can contain data from different shots. When all effective series share one shot, legend labels remain unchanged. When two or more distinct shots are present, each available shot is appended to its legend label, for example `Voltage (10001)`; series without a shot keep their original label.

At most one value axis is displayed on each side. When visible series are assigned to multiple configured axes on the same side, the first effective axis is displayed and those series share its combined automatic domain and scale. Grid and zero-line references to the additional axis IDs resolve to the displayed axis on that side, and `layout.autoPadding` reserves room for the displayed labels and titles.

Existing `yAxis`, `secondaryYAxis`, and series bindings to `left` or `right` remain supported. When `yAxes` is provided it is authoritative and the legacy options are ignored. Passing `yAxes` to `updateOptions()` replaces the complete array. Empty IDs are ignored, duplicate IDs keep their first occurrence, and unknown series or reference-axis IDs fall back to the first valid axis.

## SVG export

```ts
const svgSource = chart.toSVGString()
chart.downloadSVG('waveform.svg')
```

## Empty state

```ts
new Waveform('#chart', [], {
  emptyState: {
    visible: true,
    text: 'No data available',
  },
})
```

`tickFormat` accepts either a D3 number-format string such as `.2f` or a custom `(value: number) => string` formatter.

Font sizes are numeric pixel values. Axis tick labels use `xAxis.fontSize` and each value axis's `fontSize`; axis titles keep their independent `title.fontSize` setting. The chart title, legend, and shot number use `title.fontSize`, `legend.fontSize`, and `shot.fontSize` respectively.

## Axis domain and number formatting

By default, the X domain uses the exact data extent. Set `xDomainStrategy.type` to `nice` to expand it to stable, readable boundaries. `bounds: 'end'` preserves the data minimum and expands only the maximum. Explicit `xAxis.min`/`max` values are preserved unless `includeExplicit` is enabled.

The final X-domain start and end values are pinned to the left and right frame edges by default. They use the same `tickFormat` and `unit` as the other X-axis labels. Set `xAxis.showEndValues` to `false` to render only regular ticks.

Every Y value axis uses the exact minimum and maximum of the valid points assigned to it, without expanding the domain to rounded boundaries. Each axis's `min` and `max` independently override those bounds. An unassigned axis uses `[0, 1]`, with a single explicit bound completed by one unit. When every assigned Y value is equal, the domain expands by one unit on each side to keep the scale usable.

Y-axis ticks include both exact domain endpoints. Labels automatically share a scientific exponent when the largest absolute domain value is below `0.001` or at least `1000`; the exponent is prefixed to the Y-domain end value, for example `E+03 3`. An explicit `tickFormat` continues to take precedence.
