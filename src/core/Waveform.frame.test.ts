// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { Waveform } from './Waveform'
import type { WaveformData } from '../types/data'

const data = [
  { x: 0, y: 0 },
  { x: 1, y: 1 },
]

afterEach(() => {
  document.body.replaceChildren()
})

function render(options = {}, chartData: WaveformData = data) {
  const container = document.createElement('div')
  Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true })
  document.body.append(container)
  new Waveform(container, chartData, {
    responsive: { enabled: false },
    ...options,
  })
  return container.querySelector('svg')!
}

describe('Waveform frame', () => {
  it('renders a single border rect after axes and before waveform paths', () => {
    const svg = render()
    const plot = svg.querySelector('svg > g')!
    const background = plot.querySelector('.waveform-frame-background')!
    const border = plot.querySelector('.waveform-frame-border')!
    const children = Array.from(plot.children)
    const axisIndex = children.findIndex(child => child.querySelector('.domain'))
    const borderIndex = children.indexOf(border)
    const seriesIndex = children.findIndex(child => child.getAttribute('clip-path') !== null)

    expect(plot.querySelectorAll('.waveform-frame-border')).toHaveLength(1)
    expect(background.getAttribute('stroke')).toBe('none')
    expect(border.getAttribute('fill')).toBe('none')
    expect(borderIndex).toBeGreaterThan(axisIndex)
    expect(borderIndex).toBeLessThan(seriesIndex)
  })

  it('uses the reference frame defaults and supports dashed, dotted, and rounded frames', () => {
    const defaultFrame = render().querySelector('.waveform-frame-border')!
    expect(defaultFrame.getAttribute('stroke')).toBe('#000000')
    expect(defaultFrame.getAttribute('stroke-width')).toBe('1.3')
    expect(defaultFrame.getAttribute('stroke-dasharray')).toBeNull()

    const dashedFrame = render({ frame: { borderStyle: 'dashed', borderWidth: 2 } })
      .querySelector('.waveform-frame-border')!
    expect(dashedFrame.getAttribute('stroke-dasharray')).toBe('6 4')
    expect(dashedFrame.getAttribute('stroke-width')).toBe('2')

    const dottedFrame = render({ frame: { borderStyle: 'dotted', radius: 8 } })
      .querySelector('.waveform-frame-border')!
    expect(dottedFrame.getAttribute('stroke-dasharray')).toBe('1 3')
    expect(dottedFrame.getAttribute('stroke-linecap')).toBe('round')
    expect(dottedFrame.getAttribute('rx')).toBe('8')
  })

  it('draws x and y tick marks inside the plot frame', () => {
    const svg = render(
      { secondaryYAxis: { visible: true } },
      [
        { name: 'left', data },
        { name: 'right', yAxis: 'right', data },
      ],
    )
    const ticks = Array.from(svg.querySelectorAll('.tick line'))

    expect(ticks.some(tick => Number(tick.getAttribute('y2')) < 0)).toBe(true)
    expect(ticks.some(tick => Number(tick.getAttribute('x2')) > 0)).toBe(true)
    expect(ticks.some(tick => Number(tick.getAttribute('x2')) < 0)).toBe(true)
  })

  it('hides x-axis ticks at both frame endpoints by default', () => {
    const svg = render()
    const plot = svg.querySelector('svg > g')!
    const frame = plot.querySelector('.waveform-frame-border')!
    const width = Number(frame.getAttribute('width'))
    const xAxis = Array.from(plot.children).find(child => child.getAttribute('transform') === `translate(0,${frame.getAttribute('height')})`)!
    const xTickPositions = Array.from(xAxis.querySelectorAll('.tick'))
      .map(tick => Number((tick as SVGGElement).getAttribute('transform')?.match(/translate\(([^,]+)/)?.[1]))

    expect(xTickPositions).not.toContain(0)
    expect(xTickPositions).not.toContain(width)
  })

  it('uses the frame as the only plot boundary', () => {
    const svg = render()

    expect(svg.querySelectorAll('.waveform-frame-border')).toHaveLength(1)
    expect(svg.querySelectorAll('.domain')).toHaveLength(0)
  })
})
