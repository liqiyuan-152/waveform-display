// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { Waveform } from './Waveform'
import type { WaveformData } from '../types/data'
import type { WaveformOptions } from '../types/options'

afterEach(() => document.body.replaceChildren())

function setup(data: WaveformData, options: WaveformOptions = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const chart = new Waveform(container, data, { width: 800, responsive: { enabled: false }, ...options })
  return { container, chart, svg: container.querySelector('svg')! }
}

function translation(node: Element): number[] {
  return node.getAttribute('transform')!.match(/-?[\d.]+/g)!.map(Number)
}

describe('axis headers and zero-line defaults', () => {
  it('aligns headers with the tick labels of visible axes and omits empty or custom-formatted headers', () => {
    const data = [
      { yAxis: 'a', data: [{ x: 0, y: -3000 }, { x: 1, y: 0 }] },
      { yAxis: 'b', data: [{ x: 0, y: 0.0001 }, { x: 1, y: 0.0003 }] },
    ]
    const { svg } = setup(data, {
      yAxes: [
        { id: 'a', unit: ' A ', position: 'left', tickPadding: 5 },
        { id: 'b', unit: 'V', position: 'right', tickPadding: 9 },
        { id: 'unused', unit: 'hidden', position: 'left' },
      ],
    })
    const headers = Array.from(svg.querySelectorAll('.waveform-axis-y-header'))
    expect(headers.map(node => node.textContent)).toEqual(['E+03 (A)', 'E-04 (V)'])
    for (const header of headers) {
      expect(header.getAttribute('x')).toBe(header.parentElement?.querySelector('.tick text')?.getAttribute('x'))
      expect(header.getAttribute('y')).toBe('-8')
      expect(header.getAttribute('text-anchor')).toBe(header.parentElement?.getAttribute('text-anchor'))
      expect(header.parentElement?.getAttribute('data-axis-id')).toBe(header.getAttribute('data-axis-id'))
    }
    expect(setup([{ x: 0, y: 0 }, { x: 1, y: 3 }]).svg.querySelector('.waveform-axis-y-header')).toBeNull()
    expect(setup(data, { yAxis: { unit: 'V', tickFormat: '.2f' } }).svg.querySelector('.waveform-axis-y-header')).toBeNull()
  })

  it('reserves full outer header widths without expanding narrow charts or adding a legend row', () => {
    const unit = 'millivolts / second'
    const { svg } = setup([
      { name: 'First long channel', yAxis: 'left', data: [{ x: 0, y: 0 }, { x: 1, y: 3000 }] },
      { name: 'Second long channel', yAxis: 'right', data: [{ x: 0, y: 0 }, { x: 1, y: 3000 }] },
    ], {
      width: 420,
      padding: { left: 0, right: 0, top: 0 },
      yAxis: { unit, title: { visible: false } },
      secondaryYAxis: { visible: true, unit, title: { visible: false } },
      legend: { orientation: 'horizontal', position: 'top-left' },
      title: { visible: true, text: 'Title' },
    })
    const [plotX, plotY] = translation(svg.querySelector('svg > g')!)
    const innerWidth = Number(svg.querySelector('.waveform-frame-border')!.getAttribute('width'))
    const width = Number(svg.getAttribute('viewBox')!.split(' ')[2])
    const headerWidth = 'E+03 (millivolts / second)'.split('').reduce((sum, char) => sum + 11 * (char === ' ' ? 0.33 : 0.6), 0)
    expect(width).toBe(420)
    expect(svg.getAttribute('width')).toBe('100%')
    expect(plotX).toBeGreaterThanOrEqual(headerWidth + 2 + 8)
    expect(width - plotX - innerWidth).toBeGreaterThanOrEqual(headerWidth + 2 + 8)
    expect(plotY).toBe(64)
    const legendRows = Array.from(svg.querySelectorAll('.waveform-legend-item'), node => translation(node)[1])
    expect(legendRows).toEqual([46, 76])
    expect(Number(svg.querySelector('.waveform-frame-border')!.getAttribute('height'))).toBeGreaterThan(0)
  })

  it('adds only missing header height and keeps legend positions stable through updates', () => {
    const { chart, container } = setup([
      { name: 'First', data: [{ x: 0, y: 0 }, { x: 1, y: 3 }] },
      { name: 'Second', data: [{ x: 0, y: 0 }, { x: 1, y: 3 }] },
    ], {
      padding: { top: 0, left: 300 },
      yAxis: { unit: 'V', fontSize: 20 },
      legend: { orientation: 'horizontal', position: 'top-left' },
    })
    const plotY = () => translation(container.querySelector('svg > g')!)[1]
    const legendPositions = () => Array.from(container.querySelectorAll('.waveform-legend-item'), node => node.getAttribute('transform'))
    const initialPositions = legendPositions()
    expect(plotY()).toBe(28)
    chart.updateOptions({ yAxis: { unit: 'millivolts / second' } })
    expect(plotY()).toBe(28)
    expect(legendPositions()).toEqual(initialPositions)
    expect(container.querySelector('.waveform-axis-y-header')?.getAttribute('text-anchor')).toBe('end')
    chart.updateOptions({ padding: { top: 32 }, yAxis: { fontSize: 11 } })
    expect(plotY()).toBe(32)
    expect(legendPositions()).toEqual(initialPositions)
    chart.updateOptions({ yAxis: { tickFormat: '.2f' } })
    expect(container.querySelector('.waveform-axis-y-header')).toBeNull()
    expect(plotY()).toBe(32)
    expect(legendPositions()).toEqual(initialPositions)
    chart.destroy()
  })

  it('preserves explicit padding and disables automatic header layout on request', () => {
    const data = [{ x: 0, y: 0 }, { x: 1, y: 3000 }]
    const explicit = setup(data, { padding: { left: 150 }, yAxis: { unit: 'V' } }).svg
    expect(translation(explicit.querySelector('svg > g')!)[0]).toBe(150)
    const fixed = setup(data, {
      width: 200, padding: { top: 20, left: 10 }, layout: { autoPadding: false }, yAxis: { unit: 'V' },
    }).svg
    expect(fixed.querySelector('svg > g')!.getAttribute('transform')).toBe('translate(10,20)')
    expect(fixed.getAttribute('viewBox')!.split(' ')[2]).toBe('200')
  })

  it('defaults the zero line to translucent red and supports independent runtime overrides', () => {
    const { container, chart } = setup([{ x: 0, y: -1 }, { x: 1, y: 1 }])
    const line = () => container.querySelector('.waveform-zero-line')!
    expect(line().getAttribute('stroke')).toBe('#ff0000')
    expect(line().getAttribute('stroke-opacity')).toBe('0.5')
    expect(line().getAttribute('stroke-width')).toBe('1')
    expect(line().getAttribute('stroke-dasharray')).toBe('4 4')
    chart.updateOptions({ zeroLine: { color: '#123456', opacity: 0 } })
    expect(line().getAttribute('stroke')).toBe('#123456')
    expect(line().getAttribute('stroke-opacity')).toBe('0')
    chart.updateOptions({ zeroLine: { opacity: 1 } })
    expect(line().getAttribute('stroke')).toBe('#123456')
    expect(line().getAttribute('stroke-opacity')).toBe('1')
    chart.updateOptions({ zeroLine: { visible: false } })
    expect(container.querySelector('.waveform-zero-line')).toBeNull()
    chart.updateOptions({ zeroLine: { visible: true } })
    chart.updateData([{ x: 0, y: 1 }, { x: 1, y: 2 }])
    expect(container.querySelector('.waveform-zero-line')).toBeNull()
    chart.destroy()
  })
})
