// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

describe('demo data selection', () => {
  it('switches the preview and series controls between datasets', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    await import('../../src/demo/main')

    const original = document.querySelector<HTMLButtonElement>('[data-dataset="original"]')!
    const scientific = document.querySelector<HTMLButtonElement>('[data-dataset="scientific"]')!
    scientific.click()

    expect(scientific.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('.waveform-axis-y--left .waveform-axis-y-header')?.textContent)
      .toBe('ms\u00a0\u00a0E-03')
    const seriesTab = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
      .find(button => button.textContent === '曲线')!
    seriesTab.click()
    expect(document.querySelector<HTMLSelectElement>('select[aria-label="选择曲线"]')?.options.length).toBe(1)

    original.click()
    expect(original.getAttribute('aria-pressed')).toBe('true')
    expect(scientific.getAttribute('aria-pressed')).toBe('false')
    expect(document.querySelector('.waveform-axis-y--left .waveform-axis-y-header')?.textContent)
      .not.toContain('E-03')
    const originalSeriesTab = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
      .find(button => button.textContent === '曲线')!
    originalSeriesTab.click()
    expect(document.querySelector<HTMLSelectElement>('select[aria-label="选择曲线"]')?.options.length).toBe(4)
  })
})
