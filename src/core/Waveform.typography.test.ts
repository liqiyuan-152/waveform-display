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

  it('renders the configured shot in the SVG at the top-right edge', () => {
    const { svg } = createChart({
      layout: { autoPadding: false },
      padding: { top: 40, right: 70 },
      shot: { visible: true, text: '10001', color: '#123456', fontSize: 21, fontWeight: 700 },
    })
    const shot = svg.querySelector('.waveform-shot')!

    expect(shot.textContent).toBe('10001')
    expect(shot.getAttribute('x')).toBe('734')
    expect(shot.getAttribute('y')).toBe('40')
    expect(shot.getAttribute('transform')).toBe('rotate(-90 734 40)')
    expect(shot.getAttribute('text-anchor')).toBe('end')
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
  })
})
