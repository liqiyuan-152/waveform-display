# waveform-display

A pure-display, configuration-driven waveform component built with Vite, TypeScript, D3 and SVG.

## Features

- No interaction dependencies: focused on waveform presentation
- Single or multiple waveform series
- Responsive SVG rendering with `ResizeObserver`
- Automatic padding for axes, titles and legends
- Independent top/right/bottom/left frame borders
- Waveform color, width, line type, dash style and opacity
- Optional area fill with configurable baseline
- Global and per-series point styles: circle, square, triangle and diamond
- X/Y domain, tick count, tick size, padding and D3 number format
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
    top: { color: '#334155', width: 2 },
    right: { visible: false },
    bottom: { color: '#334155', width: 2 },
    left: { color: '#334155', width: 2 },
  },
  line: { color: '#2563eb', width: 2 },
  area: { visible: true, opacity: 0.1, baseline: 0 },
  xAxis: {
    tickFormat: '.1f',
    title: { visible: true, text: 'Time', unit: 's' },
  },
  yAxis: {
    tickFormat: '.2f',
    title: { visible: true, text: 'Amplitude', unit: 'V' },
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
      area: { visible: true, opacity: 0.08 },
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
