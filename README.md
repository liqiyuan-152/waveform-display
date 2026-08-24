# waveform-display

A pure-display, configuration-driven waveform component built with Vite, TypeScript, D3 and SVG.

## Features

- No interaction dependencies: focused on waveform presentation
- Single or multiple waveform series
- Responsive SVG rendering with `ResizeObserver`
- Independent top/right/bottom/left frame borders
- Waveform color, width, line type, dash style and opacity
- Optional area fill with configurable baseline
- Global and per-series point styles: circle, square, triangle and diamond
- X/Y domain, tick count, tick size, padding and D3 number format
- Axis titles and units
- X/Y grid styling
- Zero reference line
- Chart title
- Per-series style overrides
- Runtime `updateData()`, `updateOptions()` and `destroy()`

## Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
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

## Multiple series

```ts
new Waveform('#chart', [
  {
    name: 'CH1',
    data: channel1,
    style: {
      color: '#2563eb',
      lineWidth: 2,
      area: { visible: true, opacity: 0.08 },
    },
  },
  {
    name: 'CH2',
    data: channel2,
    style: {
      color: '#dc2626',
      lineStyle: 'dashed',
      point: { visible: true, type: 'diamond', size: 3 },
    },
  },
])
```

`tickFormat` accepts either a D3 number-format string such as `.2f` or a custom `(value: number) => string` formatter.
