// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { Waveform } from './Waveform'
import type { WaveformData } from '../types/data'
import type { WaveformOptions } from '../types/options'

afterEach(() => {
  document.body.replaceChildren()
})

function render(data: WaveformData, options: WaveformOptions = {}) {
  const container = document.createElement('div')
  Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true })
  document.body.append(container)
  new Waveform(container, data, { responsive: { enabled: false }, ...options })
  return container.querySelector('svg')!
}

function labels(svg: SVGSVGElement, selector: string): string[] {
  return Array.from(svg.querySelectorAll(`${selector} .tick text`), node => node.textContent ?? '')
}

function seriesPathPoints(svg: SVGSVGElement, index = 0): Array<[number, number]> {
  const path = svg.querySelectorAll('g[clip-path] > path')[index]
  const data = path?.getAttribute('d') ?? ''
  return Array.from(data.matchAll(/[ML](-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?),(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)/gi), match => [
    Number(match[1]),
    Number(match[2]),
  ])
}

function frameHeight(svg: SVGSVGElement): number {
  return Number(svg.querySelector('.waveform-frame-border')?.getAttribute('height'))
}

function endpointLabels(svg: SVGSVGElement): [string, string] {
  return [
    svg.querySelector('.waveform-axis-x-endpoint--start')?.textContent ?? '',
    svg.querySelector('.waveform-axis-x-endpoint--end')?.textContent ?? '',
  ]
}

describe('Waveform axes', () => {
  it('pins the exact final X-domain values to both frame endpoints by default', () => {
    const svg = render([{ x: 0.125, y: 0 }, { x: 1.875, y: 1 }])
    const start = svg.querySelector('.waveform-axis-x-endpoint--start')!
    const end = svg.querySelector('.waveform-axis-x-endpoint--end')!
    const frameWidth = svg.querySelector('.waveform-frame-border')!.getAttribute('width')

    expect(endpointLabels(svg)).toEqual(['0.125', '1.875'])
    expect(start.getAttribute('x')).toBe('0')
    expect(start.getAttribute('text-anchor')).toBe('start')
    expect(end.getAttribute('x')).toBe(frameWidth)
    expect(end.getAttribute('text-anchor')).toBe('end')
    expect(start.getAttribute('y')).toBe(svg.querySelector('.waveform-axis-x .tick text')?.getAttribute('y'))
    expect(start.getAttribute('dy')).toBe(svg.querySelector('.waveform-axis-x .tick text')?.getAttribute('dy'))
  })

  it('renders a nice automatic X domain when configured', () => {
    const svg = render(
      [{ x: 0.123, y: 0 }, { x: 4.999999, y: 1 }],
      {
        xDomainStrategy: { type: 'nice', bounds: 'both', tickCount: 10 },
        xAxis: { hideEndTicks: false, tickCount: 10 },
      },
    )

    expect(endpointLabels(svg)).toEqual(['0', '5'])
    expect(labels(svg, '.waveform-axis-x')).not.toContain('5')
  })

  it('uses partial and complete explicit X domains', () => {
    const partial = render(
      [{ x: 1, y: 0 }, { x: 4, y: 1 }],
      { xAxis: { min: -5 } },
    )
    const complete = render(
      [{ x: 1, y: 0 }, { x: 4, y: 1 }],
      { xAxis: { min: -10, max: 20 } },
    )

    expect(endpointLabels(partial)).toEqual(['-5', '4'])
    expect(endpointLabels(complete)).toEqual(['-10', '20'])
  })

  it('expands a single-point domain before displaying its endpoints', () => {
    const svg = render([{ x: 5, y: 2 }])

    expect(endpointLabels(svg)).toEqual(['4', '6'])
  })

  it('formats endpoint values with D3 strings, custom functions, and units', () => {
    const formatted = render(
      [{ x: 0.125, y: 0 }, { x: 1.875, y: 1 }],
      { xAxis: { tickFormat: '.2f', unit: 'ms' } },
    )
    const custom = render(
      [{ x: 0.125, y: 0 }, { x: 1.875, y: 1 }],
      { xAxis: { tickFormat: value => `x:${value}` } },
    )

    expect(endpointLabels(formatted)).toEqual(['0.13', '1.88'])
    expect(endpointLabels(custom)).toEqual(['x:0.125', 'x:1.875'])
    expect(labels(formatted, '.waveform-axis-x').every(label => /^\d+\.\d{2}$/.test(label))).toBe(true)
  })

  it('appends units when no explicit formatter overrides the default', () => {
    const svg = render(
      [{ x: 0, y: 0 }, { x: 2, y: 1 }],
      { xAxis: { unit: 'ms' } },
    )

    expect(endpointLabels(svg)).toEqual(['0 ms', '2 ms'])
  })

  it('keeps middle ticks clear of endpoints without removing grid lines', () => {
    const svg = render(
      [{ x: 0, y: 0 }, { x: 100, y: 1 }],
      { xAxis: { tickCount: 10, tickFormat: value => `value:${value.toFixed(2)}` } },
    )
    const frameWidth = Number(svg.querySelector('.waveform-frame-border')!.getAttribute('width'))
    const tickPositions = Array.from(svg.querySelectorAll('.waveform-axis-x .tick'))
      .map(tick => Number(tick.getAttribute('transform')?.match(/translate\(([^,]+)/)?.[1]))
    const regularTickCount = svg.querySelectorAll('.waveform-axis-x .tick').length
    const gridLineCount = svg.querySelectorAll('.waveform-grid-x .tick line').length

    expect(tickPositions.every(position => position > 70 && position < frameWidth - 70)).toBe(true)
    expect(gridLineCount).toBeGreaterThan(regularTickCount)
  })

  it('supports hiding endpoint values or the complete X axis', () => {
    const endpointsHidden = render(
      [{ x: 0, y: 0 }, { x: 1, y: 1 }],
      { xAxis: { showEndValues: false, hideEndTicks: false } },
    )
    const axisHidden = render(
      [{ x: 0, y: 0 }, { x: 1, y: 1 }],
      { xAxis: { visible: false } },
    )

    expect(endpointsHidden.querySelector('.waveform-axis-x-endpoints')).toBeNull()
    expect(labels(endpointsHidden, '.waveform-axis-x')).toEqual(expect.arrayContaining(['0', '1']))
    expect(axisHidden.querySelector('.waveform-axis-x')).toBeNull()
    expect(axisHidden.querySelector('.waveform-axis-x-endpoints')).toBeNull()
  })

  it('updates endpoint values after data and option changes', () => {
    const container = document.createElement('div')
    Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true })
    document.body.append(container)
    const chart = new Waveform(container, [{ x: 0, y: 0 }, { x: 1, y: 1 }], {
      responsive: { enabled: false },
    })

    expect(endpointLabels(container.querySelector('svg')!)).toEqual(['0', '1'])
    chart.updateData([{ x: 10, y: 0 }, { x: 20, y: 1 }])
    expect(endpointLabels(container.querySelector('svg')!)).toEqual(['10', '20'])
    chart.updateOptions({ xAxis: { showEndValues: false } })
    expect(container.querySelector('.waveform-axis-x-endpoints')).toBeNull()
  })

  it('uses the exact data extent for the automatic Y domain', () => {
    const svg = render([{ x: 0, y: 1.1 }, { x: 1, y: 9.9 }])
    const points = seriesPathPoints(svg)

    expect(points[0][1]).toBe(frameHeight(svg))
    expect(points[1][1]).toBe(0)
  })

  it('uses the global Y extent for both visible Y axes', () => {
    const svg = render(
      [
        { name: 'left', data: [{ x: 0, y: -10 }, { x: 1, y: 0 }] },
        { name: 'right', yAxis: 'right', data: [{ x: 0, y: 10 }, { x: 1, y: 30 }] },
      ],
      { secondaryYAxis: { visible: true } },
    )
    const height = frameHeight(svg)
    const leftPoints = seriesPathPoints(svg, 0)
    const rightPoints = seriesPathPoints(svg, 1)

    expect(leftPoints[0][1]).toBe(height)
    expect(leftPoints[1][1]).toBeCloseTo(height * 0.75)
    expect(rightPoints[0][1]).toBeCloseTo(height * 0.5)
    expect(rightPoints[1][1]).toBe(0)
  })

  it('applies explicit Y bounds independently on top of the global extent', () => {
    const svg = render(
      [
        { name: 'left', data: [{ x: 0, y: -10 }, { x: 1, y: 0 }] },
        { name: 'right', yAxis: 'right', data: [{ x: 0, y: 10 }, { x: 1, y: 30 }] },
      ],
      { yAxis: { min: -20 }, secondaryYAxis: { visible: true, max: 50 } },
    )
    const height = frameHeight(svg)
    const leftPoints = seriesPathPoints(svg, 0)
    const rightPoints = seriesPathPoints(svg, 1)

    expect(leftPoints[0][1]).toBeCloseTo(height * 0.8)
    expect(leftPoints[1][1]).toBeCloseTo(height * 0.6)
    expect(rightPoints[0][1]).toBeCloseTo(height * (2 / 3))
    expect(rightPoints[1][1]).toBeCloseTo(height * (1 / 3))
  })

  it('keeps a usable Y domain when all values are equal', () => {
    const svg = render([{ x: 0, y: 7 }, { x: 1, y: 7 }])
    const height = frameHeight(svg)

    expect(seriesPathPoints(svg).map(point => point[1])).toEqual([height / 2, height / 2])
  })

  it('recomputes the Y domain after data updates', () => {
    const container = document.createElement('div')
    Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true })
    document.body.append(container)
    const chart = new Waveform(container, [{ x: 0, y: 0 }, { x: 1, y: 5 }, { x: 2, y: 10 }], {
      responsive: { enabled: false },
    })
    const initialSvg = container.querySelector('svg')!

    expect(seriesPathPoints(initialSvg)[1][1]).toBe(frameHeight(initialSvg) / 2)

    chart.updateData([{ x: 0, y: 0 }, { x: 1, y: 5 }, { x: 2, y: 20 }])
    const updatedSvg = container.querySelector('svg')!
    expect(seriesPathPoints(updatedSvg)[1][1]).toBe(frameHeight(updatedSvg) * 0.75)
  })

  it('uses one shared scientific exponent on each Y axis', () => {
    const svg = render(
      [
        { name: 'left', data: [{ x: 0, y: 1000 }, { x: 1, y: 3000 }] },
        { name: 'right', yAxis: 'right', data: [{ x: 0, y: 0.0001 }, { x: 1, y: 0.0003 }] },
      ],
      { secondaryYAxis: { visible: true } },
    )

    expect(labels(svg, '.waveform-axis-y--left').filter(label => label.startsWith('E'))).toHaveLength(1)
    expect(labels(svg, '.waveform-axis-y--right').filter(label => label.startsWith('E'))).toHaveLength(1)
  })

  it('keeps an explicit Y-axis tick formatter authoritative', () => {
    const svg = render(
      [{ x: 0, y: 1000 }, { x: 1, y: 3000 }],
      { yAxis: { tickFormat: value => `value:${value}` } },
    )

    const yLabels = labels(svg, '.waveform-axis-y--left')
    expect(yLabels.every(label => label.startsWith('value:'))).toBe(true)
    expect(yLabels.some(label => label.startsWith('E'))).toBe(false)
  })
})
