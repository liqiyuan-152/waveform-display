# waveform-display

A pure-display, configuration-driven waveform component built with Vite, TypeScript, D3 and SVG.

## Features

- No interaction dependencies: focused on waveform presentation
- Single or multiple waveform series
- Responsive SVG rendering with `ResizeObserver`
- Automatic padding for axes, titles and legends
- Independent top/right/bottom/left frame borders
- Waveform color, width, line type, dash style and opacity
- Global and per-series point styles: circle, square, triangle and diamond
- X/Y domain, tick count, tick size, padding and D3 number format
- Optional automatic readable X-domain boundaries
- Shared scientific notation for very large or very small Y-axis values
- Primary and secondary Y axes
- Axis titles and units
- Horizontal or vertical legends with line-style previews
- X/Y grid styling
- Zero reference line
- Configurable empty-data state
- SVG string/export API
- Chart title
- Per-series style overrides
- Runtime `updateData()`, `updateOptions()` and `destroy()`

## Development

```bash
pnpm install
pnpm dev
```

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
})
```

## Multiple series and dual Y axes

```ts
new Waveform('#chart', [
  {
    name: 'Voltage',
    unit: 'V',
    yAxis: 'left',
    data: voltageData,
    style: {
      color: '#2563eb',
      lineWidth: 2,
    },
  },
  {
    name: 'Current',
    unit: 'mA',
    yAxis: 'right',
    data: currentData,
    style: {
      color: '#dc2626',
      lineStyle: 'dashed',
      point: { visible: true, type: 'diamond', size: 3 },
    },
  },
], {
  legend: {
    visible: true,
    position: 'top-left',
    orientation: 'horizontal',
  },
  yAxis: {
    title: { visible: true, text: 'Voltage', unit: 'V' },
  },
  secondaryYAxis: {
    visible: true,
    tickFormat: '.0f',
    title: { visible: true, text: 'Current', unit: 'mA' },
  },
})
```

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

Font sizes are numeric pixel values. Axis tick labels use `xAxis.fontSize`, `yAxis.fontSize`, and `secondaryYAxis.fontSize`; axis titles keep their independent `title.fontSize` setting. The chart title, legend, and shot number use `title.fontSize`, `legend.fontSize`, and `shot.fontSize` respectively.

## Axis domain and number formatting

By default, the X domain uses the exact data extent. Set `xDomainStrategy.type` to `nice` to expand it to stable, readable boundaries. `bounds: 'end'` preserves the data minimum and expands only the maximum. Explicit `xAxis.min`/`max` values are preserved unless `includeExplicit` is enabled.

The final X-domain start and end values are pinned to the left and right frame edges by default. They use the same `tickFormat` and `unit` as the other X-axis labels. Set `xAxis.showEndValues` to `false` to render only regular ticks.

By default, every visible Y axis uses the exact global minimum and maximum across all valid points in every series, without expanding the domain to rounded boundaries. `yAxis.min`/`max` and `secondaryYAxis.min`/`max` override their respective bounds. When every Y value is equal, the domain expands by one unit on each side to keep the scale usable.

Y-axis labels automatically share a scientific exponent when the largest absolute domain value is below `0.001` or at least `1000`. The exponent is prefixed to the top tick, for example `E+03 3`. An explicit `tickFormat` continues to take precedence.
