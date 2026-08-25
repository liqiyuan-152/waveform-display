// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { Waveform } from './Waveform'
import type { WaveformOptions } from '../types/options'

const points = [
  { x: 0, y: 0 },
  { x: 1, y: 1 },
]

afterEach(() => {
  document.body.replaceChildren()
})

function createChart(options: WaveformOptions = {}) {
  const container = document.createElement('div')
  Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true })
  document.body.append(container)
  const chart = new Waveform(container, [
    { name: 'Left', data: points },
    { name: 'Right', yAxis: 'right', data: points },
  ], {
    responsive: { enabled: false },
    ...options,
  })
  return { chart, container, svg: container.querySelector('svg')! }
}

describe('Waveform typography', () => {
  it('applies independent font sizes to axes, axis titles, legend, and chart title', () => {
    const { svg } = createChart({
      xAxis: { fontSize: 13, showEndValues: true, title: { visible: true, text: 'Time', fontSize: 17 } },
      yAxis: { fontSize: 14, title: { visible: true, text: 'Left axis', fontSize: 18 } },
      secondaryYAxis: { visible: true, fontSize: 15, title: { visible: true, text: 'Right axis', fontSize: 19 } },
      legend: { fontSize: 16 },
      title: { visible: true, text: 'Waveform title', fontSize: 20 },
    })

    expect(svg.querySelector('.waveform-axis-x .tick text')?.getAttribute('font-size')).toBe('13')
    expect(svg.querySelector('.waveform-axis-x-endpoints')?.getAttribute('font-size')).toBe('13')
    expect(svg.querySelector('.waveform-axis-y--left .tick text')?.getAttribute('font-size')).toBe('14')
    expect(svg.querySelector('.waveform-axis-y--right .tick text')?.getAttribute('font-size')).toBe('15')
    expect(svg.querySelector('.waveform-legend text')?.getAttribute('font-size')).toBe('16')

    const rootTexts = Array.from(svg.querySelectorAll(':scope > text'))
    expect(rootTexts.find(node => node.textContent === 'Time')?.getAttribute('font-size')).toBe('17')
    expect(rootTexts.find(node => node.textContent === 'Left axis')?.getAttribute('font-size')).toBe('18')
    expect(rootTexts.find(node => node.textContent === 'Right axis')?.getAttribute('font-size')).toBe('19')
    expect(rootTexts.find(node => node.textContent === 'Waveform title')?.getAttribute('font-size')).toBe('20')
  })

  it('does not render a shot by default', () => {
    const { svg } = createChart()

    expect(svg.querySelector('.waveform-shot')).toBeNull()
  })

  it('renders the shot and x-axis title in one right-side vertical lane', () => {
    const { svg } = createChart({
      layout: { autoPadding: false },
      padding: { top: 40, right: 70 },
      xAxis: { title: { visible: true, text: 'Time', unit: 'ms' } },
      shot: { visible: true, text: '10001', color: '#123456', fontSize: 21, fontWeight: 700 },
    })
    const shot = svg.querySelector('.waveform-shot')!
    const xAxisTitle = svg.querySelector('.waveform-axis-x-title')!

    expect(shot.textContent).toBe('10001')
    expect(xAxisTitle.textContent).toBe('Time (ms)')
    expect(shot.tagName.toLowerCase()).toBe('text')
    expect(shot.getAttribute('x')).toBe(xAxisTitle.getAttribute('x'))
    expect(shot.getAttribute('transform')).toMatch(/^rotate\(-90 /)
    expect(xAxisTitle.getAttribute('transform')).toMatch(/^rotate\(-90 /)
    expect(shot.getAttribute('text-anchor')).toBe('end')
    expect(xAxisTitle.getAttribute('text-anchor')).toBe('start')
    expect(shot.getAttribute('dominant-baseline')).toBe('middle')
    expect(xAxisTitle.getAttribute('dominant-baseline')).toBe('middle')
    expect(Number(shot.getAttribute('y'))).toBeLessThan(Number(xAxisTitle.getAttribute('y')))
    expect(shot.getAttribute('fill')).toBe('#123456')
    expect(shot.getAttribute('font-size')).toBe('21')
    expect(shot.getAttribute('font-weight')).toBe('700')
    expect(new XMLSerializer().serializeToString(svg)).toContain('class="waveform-shot"')
  })

  it('preserves shot settings when updateOptions changes only its font size', () => {
    const { chart, container } = createChart({
      shot: { visible: true, text: '10001', color: '#123456', fontSize: 11 },
    })

    chart.updateOptions({ shot: { fontSize: 24 } })
    const updatedShot = container.querySelector('.waveform-shot')!

    expect(updatedShot.textContent).toBe('10001')
    expect(updatedShot.getAttribute('fill')).toBe('#123456')
    expect(updatedShot.getAttribute('font-size')).toBe('24')
    expect(updatedShot.getAttribute('transform')).toMatch(/^rotate\(-90 /)
    expect(updatedShot.getAttribute('text-anchor')).toBe('end')
  })

  it('reserves right-side space without increasing bottom padding', () => {
    const sharedOptions: WaveformOptions = {
      padding: { right: 0, bottom: 0 },
      legend: { visible: false },
      secondaryYAxis: { visible: true },
    }
    const withoutMetadata = createChart(sharedOptions).svg
    const withMetadata = createChart({
      ...sharedOptions,
      xAxis: { title: { visible: true, text: 'Time', fontSize: 20, offset: 8 } },
      shot: { visible: true, text: '10001', fontSize: 21 },
    }).svg
    const plainFrame = withoutMetadata.querySelector('.waveform-frame-border')!
    const metadataFrame = withMetadata.querySelector('.waveform-frame-border')!

    expect(Number(plainFrame.getAttribute('width')) - Number(metadataFrame.getAttribute('width'))).toBe(23)
    expect(metadataFrame.getAttribute('height')).toBe(plainFrame.getAttribute('height'))
  })

  it('shrinks long metadata labels to keep the upper and lower lanes separate', () => {
    const { svg } = createChart({
      height: 120,
      layout: { autoPadding: false },
      padding: { top: 10, right: 80, bottom: 10, left: 20 },
      xAxis: { title: { visible: true, text: 'Very long time axis', unit: 'milliseconds', fontSize: 24 } },
      shot: { visible: true, text: 'SHOT-123456789', fontSize: 24 },
    })
    const title = svg.querySelector('.waveform-axis-x-title')!
    const shot = svg.querySelector('.waveform-shot')!
    const availableLength = 42

    expect(Number(title.getAttribute('font-size'))).toBeLessThan(24)
    expect(Number(shot.getAttribute('font-size'))).toBeLessThan(24)
    expect(title.textContent!.length * Number(title.getAttribute('font-size')) * 0.6).toBeLessThanOrEqual(availableLength)
    expect(shot.textContent!.length * Number(shot.getAttribute('font-size')) * 0.6).toBeLessThanOrEqual(availableLength)
  })
})
