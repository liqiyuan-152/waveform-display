// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { Waveform } from './Waveform'
import type { WaveformData } from '../types/data'
import type { WaveformOptions } from '../types/options'

const points = [
  { x: 0, y: 0 },
  { x: 1, y: 1 },
]

afterEach(() => {
  document.body.replaceChildren()
})

function createChart(data: WaveformData, options: WaveformOptions = {}) {
  const container = document.createElement('div')
  Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true })
  document.body.append(container)
  const chart = new Waveform(container, data, {
    responsive: { enabled: false },
    title: { visible: true, text: 'Waveform title' },
    legend: { visible: true, position: 'top-left', orientation: 'horizontal' },
    ...options,
  })
  return { chart, container }
}

function plotTransform(container: HTMLElement) {
  return container.querySelector('svg > g')?.getAttribute('transform')
}

function legendItems(container: HTMLElement) {
  return Array.from(container.querySelectorAll<SVGGElement>('.waveform-legend-item'))
}

function legendLabels(container: HTMLElement) {
  return legendItems(container).map(item => item.querySelector('text')?.textContent)
}

function lineColors(container: HTMLElement) {
  return Array.from(container.querySelectorAll('g[clip-path] > path'))
    .map(path => path.getAttribute('stroke'))
}

function pointColors(container: HTMLElement) {
  return Array.from(container.querySelectorAll('g[clip-path] > g > path'))
    .map(path => path.getAttribute('fill'))
}

function xEndpoints(container: HTMLElement) {
  return [
    container.querySelector('.waveform-axis-x-endpoint--start')?.textContent,
    container.querySelector('.waveform-axis-x-endpoint--end')?.textContent,
  ]
}

function yEndValue(container: HTMLElement, axisId = 'left') {
  return container.querySelector(`[data-axis-id="${axisId}"] .waveform-axis-y-end-value`)?.textContent
}

describe('Waveform legend', () => {
  it('hides the legend and reclaims its padding for one effective series', () => {
    const { container } = createChart([
      { name: 'Visible', data: points },
      { name: 'Empty', data: [] },
    ])

    expect(container.querySelector('.waveform-legend')).toBeNull()
    expect(plotTransform(container)).toBe('translate(72,42)')
  })

  it('shows the legend and reserves its padding for multiple series', () => {
    const { container } = createChart([
      { name: 'First', data: points },
      { name: 'Second', data: points },
    ])

    expect(container.querySelectorAll('.waveform-legend > g')).toHaveLength(2)
    expect(plotTransform(container)).toBe('translate(72,64)')
  })

  it('appends normalized shot numbers only when multiple shots are present', () => {
    const { chart, container } = createChart([
      { id: 'first', name: 'First', shot: 10001, data: points },
      { id: 'second', name: 'Second', shot: ' 10001 ', data: points },
    ])

    expect(legendLabels(container)).toEqual(['First', 'Second'])
    const singleShotWidth = Number(legendItems(container)[0].querySelector('rect')?.getAttribute('width'))

    chart.updateData([
      { id: 'first', name: 'First', shot: 10001, data: points },
      { id: 'second', name: 'Second', shot: ' 10002 ', data: points },
      { id: 'missing', name: 'Missing', data: points },
      { id: 'empty', name: 'Empty', shot: '   ', data: points },
      { id: 'invalid', name: 'Invalid', shot: Number.NaN, data: points },
    ])

    expect(legendLabels(container)).toEqual([
      'First (10001)',
      'Second (10002)',
      'Missing',
      'Empty',
      'Invalid',
    ])
    expect(legendItems(container).map(item => item.getAttribute('aria-label'))).toEqual(legendLabels(container))
    expect(Number(legendItems(container)[0].querySelector('rect')?.getAttribute('width'))).toBeGreaterThan(singleShotWidth)

    legendItems(container)[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(legendLabels(container)).toEqual([
      'First (10001)',
      'Second (10002)',
      'Missing',
      'Empty',
      'Invalid',
    ])
  })

  it('keeps the legend hidden when explicitly disabled for multiple series', () => {
    const { container } = createChart(
      [
        { name: 'First', data: points },
        { name: 'Second', data: points },
      ],
      { legend: { visible: false } },
    )

    expect(container.querySelector('.waveform-legend')).toBeNull()
    expect(plotTransform(container)).toBe('translate(72,42)')
  })

  it('updates legend visibility and padding when the series count changes', () => {
    const { chart, container } = createChart([{ name: 'First', data: points }])

    expect(container.querySelector('.waveform-legend')).toBeNull()
    expect(plotTransform(container)).toBe('translate(72,42)')

    chart.updateData([
      { name: 'First', data: points },
      { name: 'Second', data: points },
    ])
    expect(container.querySelectorAll('.waveform-legend > g')).toHaveLength(2)
    expect(plotTransform(container)).toBe('translate(72,64)')

    chart.updateData([{ name: 'First', data: points }])
    expect(container.querySelector('.waveform-legend')).toBeNull()
    expect(plotTransform(container)).toBe('translate(72,42)')
  })

  it('toggles the related line and points while keeping the legend item available', () => {
    const { container } = createChart([
      { id: 'first', name: 'First', data: points, style: { color: '#dc2626', point: { visible: true, color: '#dc2626' } } },
      { id: 'second', name: 'Second', data: points, style: { color: '#2563eb', point: { visible: true, color: '#2563eb' } } },
    ])

    expect(lineColors(container)).toEqual(['#dc2626', '#2563eb'])
    expect(pointColors(container)).toEqual(['#dc2626', '#dc2626', '#2563eb', '#2563eb'])

    legendItems(container)[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(lineColors(container)).toEqual(['#2563eb'])
    expect(pointColors(container)).toEqual(['#2563eb', '#2563eb'])
    expect(legendItems(container)).toHaveLength(2)
    expect(legendItems(container)[0].getAttribute('aria-pressed')).toBe('false')
    expect(legendItems(container)[0].querySelector('line')?.getAttribute('opacity')).toBe('0.35')
    expect(legendItems(container)[0].querySelector('text')?.getAttribute('opacity')).toBe('0.35')

    legendItems(container)[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(lineColors(container)).toEqual(['#dc2626', '#2563eb'])
    expect(legendItems(container)[0].getAttribute('aria-pressed')).toBe('true')
  })

  it('hides a value axis when none of its corresponding series are visible', () => {
    const { container } = createChart(
      [
        { id: 'left', name: 'Left', data: points },
        { id: 'right', name: 'Right', yAxis: 'right', data: points },
      ],
      { secondaryYAxis: { visible: true } },
    )

    expect(container.querySelector('.waveform-axis-y[data-axis-id="left"]')).not.toBeNull()
    expect(container.querySelector('.waveform-axis-y[data-axis-id="right"]')).not.toBeNull()

    legendItems(container)[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(container.querySelector('.waveform-axis-y[data-axis-id="left"]')).toBeNull()
    expect(container.querySelector('.waveform-axis-y[data-axis-id="right"]')).not.toBeNull()
  })

  it('exposes an accessible hit target and supports keyboard toggling', () => {
    const { container } = createChart([
      { id: 'first', name: 'First', data: points },
      { id: 'second', name: 'Second', data: points },
    ])
    const firstItem = legendItems(container)[0]

    expect(firstItem.getAttribute('role')).toBe('button')
    expect(firstItem.getAttribute('tabindex')).toBe('0')
    expect(firstItem.getAttribute('aria-label')).toBe('First')
    expect(firstItem.style.cursor).toBe('pointer')
    expect(Number(firstItem.querySelector('rect')?.getAttribute('width'))).toBeGreaterThan(24)

    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    firstItem.dispatchEvent(space)
    expect(space.defaultPrevented).toBe(true)
    expect(lineColors(container)).toHaveLength(1)

    legendItems(container)[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(lineColors(container)).toHaveLength(2)
  })

  it('recalculates X and independent Y domains from visible series', () => {
    const { container } = createChart([
      {
        id: 'wide', name: 'Wide', yAxis: 'left',
        data: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
      },
      {
        id: 'narrow', name: 'Narrow', yAxis: 'left',
        data: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
      },
      {
        id: 'right', name: 'Right', yAxis: 'right',
        data: [{ x: 10, y: 100 }, { x: 20, y: 200 }],
      },
    ], {
      yAxes: [
        { id: 'left', position: 'left' },
        { id: 'right', position: 'right' },
      ],
    })

    expect(xEndpoints(container)).toEqual(['0', '100'])
    expect(yEndValue(container, 'left')).toBe('100.00')
    expect(yEndValue(container, 'right')).toBe('200.00')

    legendItems(container)[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(xEndpoints(container)).toEqual(['10', '20'])
    expect(yEndValue(container, 'left')).toBe('20.00')
    expect(yEndValue(container, 'right')).toBe('200.00')
  })

  it('keeps the legend usable and falls back to empty domains when all series are hidden', () => {
    const { container } = createChart([
      { id: 'first', name: 'First', data: points },
      { id: 'second', name: 'Second', data: points },
    ])

    legendItems(container)[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    legendItems(container)[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(lineColors(container)).toHaveLength(0)
    expect(legendItems(container)).toHaveLength(2)
    expect(legendItems(container).every(item => item.getAttribute('aria-pressed') === 'false')).toBe(true)
    expect(xEndpoints(container)).toEqual(['0', '1'])
    expect(container.querySelector('.waveform-axis-y')).toBeNull()
    expect(container.textContent).not.toContain('No waveform data')
  })

  it('preserves hidden state across updates by id and normalized position', () => {
    const identified = createChart([
      { id: 'first', name: 'First', order: 1, data: points, style: { color: '#dc2626' } },
      { id: 'second', name: 'Second', order: 2, data: points, style: { color: '#2563eb' } },
    ])
    legendItems(identified.container)[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))

    identified.chart.updateData([
      { id: 'second', name: 'Second', order: 1, data: points, style: { color: '#2563eb' } },
      { id: 'first', name: 'First', order: 2, data: points, style: { color: '#dc2626' } },
    ])

    expect(lineColors(identified.container)).toEqual(['#2563eb'])
    expect(legendItems(identified.container).map(item => item.getAttribute('aria-pressed'))).toEqual(['true', 'false'])

    const positional = createChart([
      { name: 'First', data: points, style: { color: '#16a34a' } },
      { name: 'Second', data: points, style: { color: '#9333ea' } },
    ])
    legendItems(positional.container)[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    positional.chart.updateData([
      { name: 'Replacement', data: points, style: { color: '#f97316' } },
      { name: 'Second', data: points, style: { color: '#9333ea' } },
    ])

    expect(lineColors(positional.container)).toEqual(['#9333ea'])
    expect(legendItems(positional.container)[0].getAttribute('aria-pressed')).toBe('false')
  })

  it('distinguishes duplicate ids and preserves selection through option updates', () => {
    const { chart, container } = createChart([
      { id: 'duplicate', name: 'First', data: points, style: { color: '#dc2626' } },
      { id: 'duplicate', name: 'Second', data: points, style: { color: '#2563eb' } },
    ])

    expect(legendItems(container).map(item => item.getAttribute('data-series-key'))).toEqual([
      'id:duplicate:0',
      'id:duplicate:1',
    ])
    legendItems(container)[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    chart.updateOptions({ legend: { color: '#111827' } })

    expect(lineColors(container)).toEqual(['#dc2626'])
    expect(legendItems(container).map(item => item.getAttribute('aria-pressed'))).toEqual(['true', 'false'])
    expect(legendItems(container)[1].querySelector('text')?.getAttribute('fill')).toBe('#111827')
  })

  it('clears hidden state for series that disappear from updateData', () => {
    const { chart, container } = createChart([
      { id: 'first', name: 'First', data: points, style: { color: '#dc2626' } },
      { id: 'second', name: 'Second', data: points, style: { color: '#2563eb' } },
    ])
    legendItems(container)[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))

    chart.updateData([{ id: 'second', name: 'Second', data: points, style: { color: '#2563eb' } }])
    chart.updateData([
      { id: 'first', name: 'First', data: points, style: { color: '#dc2626' } },
      { id: 'second', name: 'Second', data: points, style: { color: '#2563eb' } },
    ])

    expect(lineColors(container)).toEqual(['#dc2626', '#2563eb'])
    expect(legendItems(container).every(item => item.getAttribute('aria-pressed') === 'true')).toBe(true)

    legendItems(container)[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    chart.updateData([])
    chart.updateData([
      { id: 'first', name: 'First', data: points, style: { color: '#dc2626' } },
      { id: 'second', name: 'Second', data: points, style: { color: '#2563eb' } },
    ])

    expect(lineColors(container)).toEqual(['#dc2626', '#2563eb'])
  })
})
