// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { Waveform } from './Waveform'
import type { WaveformOptions } from '../types/options'

const data = [{ x: 0, y: -1 }, { x: 1, y: 1 }]

afterEach(() => {
  document.body.replaceChildren()
})

function createChart(options: WaveformOptions = {}) {
  const container = document.createElement('div')
  Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true })
  document.body.append(container)
  const chart = new Waveform(container, data, { responsive: { enabled: false }, ...options })
  return { chart, container }
}

function firstGridLine(container: HTMLElement, axis: 'x' | 'y'): SVGLineElement {
  return container.querySelector(`.waveform-grid-${axis} .tick line`)!
}

describe('Waveform grid styling', () => {
  it('uses the shared dashed style, color, and width for both grid axes', () => {
    const { container } = createChart({ grid: { style: 'dashed', color: '#123456', width: 2.5 } })

    for (const axis of ['x', 'y'] as const) {
      expect(firstGridLine(container, axis).getAttribute('stroke')).toBe('#123456')
      expect(firstGridLine(container, axis).getAttribute('stroke-width')).toBe('2.5')
      expect(firstGridLine(container, axis).getAttribute('stroke-dasharray')).toBe('3 3')
    }
  })

  it('renders shared solid grid lines without a dash attribute', () => {
    const { container } = createChart({ grid: { style: 'solid' } })

    expect(firstGridLine(container, 'x').getAttribute('stroke-dasharray')).toBeNull()
    expect(firstGridLine(container, 'y').getAttribute('stroke-dasharray')).toBeNull()
  })

  it('keeps legacy per-axis color, width, and dash overrides authoritative', () => {
    const { container } = createChart({
      grid: {
        style: 'solid',
        color: '#123456',
        width: 2.5,
        x: { color: '#abcdef', width: 3, dash: '1 2' },
        y: { color: '#fedcba', width: 4, dash: '4 5' },
      },
    })

    expect(firstGridLine(container, 'x').getAttribute('stroke')).toBe('#abcdef')
    expect(firstGridLine(container, 'x').getAttribute('stroke-width')).toBe('3')
    expect(firstGridLine(container, 'x').getAttribute('stroke-dasharray')).toBe('1 2')
    expect(firstGridLine(container, 'y').getAttribute('stroke')).toBe('#fedcba')
    expect(firstGridLine(container, 'y').getAttribute('stroke-width')).toBe('4')
    expect(firstGridLine(container, 'y').getAttribute('stroke-dasharray')).toBe('4 5')
  })

  it('updates the shared style, color, and width at runtime', () => {
    const { chart, container } = createChart()

    chart.updateOptions({ grid: { style: 'solid', color: '#123456', width: 2 } })

    for (const axis of ['x', 'y'] as const) {
      expect(firstGridLine(container, axis).getAttribute('stroke')).toBe('#123456')
      expect(firstGridLine(container, axis).getAttribute('stroke-width')).toBe('2')
      expect(firstGridLine(container, axis).getAttribute('stroke-dasharray')).toBeNull()
    }

    chart.updateOptions({ grid: { style: 'dashed', color: '#654321', width: 1.5 } })

    for (const axis of ['x', 'y'] as const) {
      expect(firstGridLine(container, axis).getAttribute('stroke')).toBe('#654321')
      expect(firstGridLine(container, axis).getAttribute('stroke-width')).toBe('1.5')
      expect(firstGridLine(container, axis).getAttribute('stroke-dasharray')).toBe('3 3')
    }
  })
})
