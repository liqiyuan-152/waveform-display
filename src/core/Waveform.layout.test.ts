// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Waveform } from './Waveform'
import type { WaveformData, WaveformLayoutChange, WaveformOptions } from '../index'

const points = [{ x: 0, y: 0 }, { x: 1, y: 1 }]

function createChart(data: WaveformData, options: WaveformOptions = {}) {
  const container = document.createElement('div')
  Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true })
  document.body.append(container)
  return { chart: new Waveform(container, data, { responsive: { enabled: false }, ...options }), container }
}

function plotLeft(container: HTMLElement): number {
  return Number(container.querySelector('svg > g')?.getAttribute('transform')?.match(/translate\(([\d.]+)/)?.[1])
}

async function flushLayoutChange() {
  await Promise.resolve()
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('Waveform horizontal padding coordination', () => {
  it('applies horizontal padding after natural measurement without changing the reported values', async () => {
    const onLayoutChange = vi.fn<(layout: WaveformLayoutChange) => void>()
    const { container } = createChart(
      [
        { name: 'First', data: points },
        { name: 'Second', data: points },
      ],
      {
        legend: { visible: false },
        layout: { horizontalPadding: { left: 100, right: 120 } },
        onLayoutChange,
      },
    )

    await flushLayoutChange()

    expect(onLayoutChange).toHaveBeenCalledWith({ naturalPadding: { left: 78, right: 72 } })
    expect(plotLeft(container)).toBe(100)
    expect(Number(container.querySelector('.waveform-frame-border')?.getAttribute('width'))).toBe(580)
  })

  it('ignores invalid minimums and lets runtime updates reduce or clear them', () => {
    const { chart, container } = createChart(
      [
        { name: 'First', data: points },
        { name: 'Second', data: points },
      ],
      { legend: { visible: false }, layout: { horizontalPadding: { left: 120 } } },
    )

    expect(plotLeft(container)).toBe(120)

    chart.updateOptions({ layout: { horizontalPadding: { left: 90, right: Number.NaN } } })
    expect(plotLeft(container)).toBe(90)

    chart.updateOptions({ layout: { horizontalPadding: undefined } })
    expect(plotLeft(container)).toBe(78)
  })

  it('reports initial, data, legend, and replacement-callback layout changes without reporting imposed minimums', async () => {
    const firstCallback = vi.fn<(layout: WaveformLayoutChange) => void>()
    const secondCallback = vi.fn<(layout: WaveformLayoutChange) => void>()
    const { chart, container } = createChart(
      [
        { id: 'left', name: 'Left', data: points },
        { id: 'right', name: 'Right', yAxis: 'right', data: points },
      ],
      {
        layout: { horizontalPadding: { left: 140 } },
        secondaryYAxis: { visible: true },
        onLayoutChange: firstCallback,
      },
    )

    await flushLayoutChange()
    expect(firstCallback).toHaveBeenLastCalledWith({ naturalPadding: { left: 78, right: 96 } })
    expect(plotLeft(container)).toBe(140)

    container.querySelector<SVGGElement>('.waveform-legend-item')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    await flushLayoutChange()
    expect(firstCallback).toHaveBeenLastCalledWith({ naturalPadding: { left: 72, right: 96 } })

    chart.updateOptions({ onLayoutChange: secondCallback })
    await flushLayoutChange()
    expect(secondCallback).toHaveBeenCalledWith({ naturalPadding: { left: 72, right: 96 } })

    chart.updateData([])
    await flushLayoutChange()
    expect(secondCallback).toHaveBeenLastCalledWith({ naturalPadding: { left: 72, right: 72 } })
  })

  it('rechecks layout through ResizeObserver without repeating an unchanged natural padding', async () => {
    const callbacks: ResizeObserverCallback[] = []
    class TestResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        callbacks.push(callback)
      }

      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', TestResizeObserver)

    const onLayoutChange = vi.fn<(layout: WaveformLayoutChange) => void>()
    const { container } = createChart(
      [{ x: 0, y: 0 }, { x: 1, y: 1 }],
      { responsive: { enabled: true }, onLayoutChange },
    )

    await flushLayoutChange()
    callbacks[0]!([], {} as ResizeObserver)
    await flushLayoutChange()

    expect(onLayoutChange).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
    expect(plotLeft(container)).toBe(72)
  })

  it('coalesces rapid natural padding changes to the latest rendered value', async () => {
    const onLayoutChange = vi.fn<(layout: WaveformLayoutChange) => void>()
    const { chart } = createChart([{ name: 'Only', data: points }], { onLayoutChange })

    await flushLayoutChange()
    chart.updateData([
      { name: 'First', data: points },
      { name: 'Second', data: points },
    ])
    chart.updateData([{ name: 'Only', data: points }])
    await flushLayoutChange()

    expect(onLayoutChange).toHaveBeenCalledTimes(1)
    expect(onLayoutChange).toHaveBeenLastCalledWith({ naturalPadding: { left: 72, right: 72 } })
  })

  it('does not notify after destruction when an initial callback is pending', async () => {
    const onLayoutChange = vi.fn<(layout: WaveformLayoutChange) => void>()
    const { chart } = createChart([{ x: 0, y: 0 }, { x: 1, y: 1 }], { onLayoutChange })

    chart.destroy()
    await flushLayoutChange()

    expect(onLayoutChange).not.toHaveBeenCalled()
  })

  it('does not force a stable callback and isolates cached padding from callback mutation', async () => {
    const onLayoutChange = vi.fn((layout: WaveformLayoutChange) => {
      layout.naturalPadding.left = 999
    })
    const { chart } = createChart([{ x: 0, y: 0 }, { x: 1, y: 1 }], { onLayoutChange })

    await flushLayoutChange()
    chart.updateOptions({ onLayoutChange })
    await flushLayoutChange()

    expect(onLayoutChange).toHaveBeenCalledTimes(1)
  })
})
