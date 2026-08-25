// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { resolveOptions } from '../config/resolve'
import type { WaveformOptions } from '../types/options'
import type { WaveformSeries } from '../types/data'
import {
  colorPickerValue,
  createConfigPanel,
  parseDimension,
  parseNumberInput,
  setAtPath,
  setSeriesStyleOverride,
} from './config-panel'

function findField(container: HTMLElement, label: string): HTMLElement {
  const field = Array.from(container.querySelectorAll<HTMLElement>('.config-field'))
    .find(element => element.querySelector('.config-field__label')?.textContent === label)
  if (!field) throw new Error(`Field not found: ${label}`)
  return field
}

function fireInput(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('config panel utilities', () => {
  it('parses optional numbers and dimensions without accepting incomplete numbers', () => {
    expect(parseNumberInput('', true)).toEqual({ valid: true, value: undefined })
    expect(parseNumberInput('-', true)).toEqual({ valid: false })
    expect(parseNumberInput('2.5')).toEqual({ valid: true, value: 2.5 })
    expect(parseDimension('100%')).toEqual({ valid: true, value: '100%' })
    expect(parseDimension('640')).toEqual({ valid: true, value: 640 })
  })

  it('updates nested values immutably and preserves sibling settings', () => {
    const options: WaveformOptions = { line: { color: '#2563eb', width: 2 } }
    const updated = setAtPath(options, 'line.width', 4)
    expect(updated).not.toBe(options)
    expect(updated.line).not.toBe(options.line)
    expect(updated.line).toEqual({ color: '#2563eb', width: 4 })
    expect(options.line?.width).toBe(2)
  })

  it('uses a safe swatch fallback while preserving editable CSS color strings', () => {
    expect(colorPickerValue('#12aBcD')).toBe('#12aBcD')
    expect(colorPickerValue('transparent')).toBe('#000000')
  })

  it('adds and clears nested series overrides', () => {
    const withOverride = setSeriesStyleOverride(undefined, 'point.size', 5)
    expect(withOverride.point?.size).toBe(5)
    const cleared = setSeriesStyleOverride(withOverride, 'point.size', undefined)
    expect(cleared.point?.size).toBeUndefined()
  })
})

describe('createConfigPanel', () => {
  const baseSeries: WaveformSeries[] = [{ name: 'CH1', data: [{ x: 0, y: 1 }] }]

  function setup() {
    const container = document.createElement('div')
    container.className = 'workspace__inner'
    const options = resolveOptions({ line: { color: '#2563eb', width: 2 } })
    const onOptionsChange = vi.fn()
    const onSeriesChange = vi.fn()
    const onEmptyPreviewChange = vi.fn()
    createConfigPanel(container, { options, series: baseSeries, onOptionsChange, onSeriesChange, onEmptyPreviewChange })
    return { container, onOptionsChange, onSeriesChange, onEmptyPreviewChange }
  }

  it('commits live option edits without dropping sibling values', () => {
    const { container, onOptionsChange } = setup()
    expect(container.classList.contains('workspace__inner')).toBe(true)
    const input = findField(container, '线条宽度').querySelector<HTMLInputElement>('input[type="number"]')!
    fireInput(input, '4.5')
    const updated = onOptionsChange.mock.lastCall?.[0] as WaveformOptions
    expect(updated.line).toMatchObject({ color: '#2563eb', width: 4.5 })
  })

  it('clears optional axis bounds and blocks invalid D3 formats', () => {
    const { container, onOptionsChange } = setup()
    const minInput = findField(container, '最小值').querySelector<HTMLInputElement>('input')!
    fireInput(minInput, '10')
    fireInput(minInput, '')
    expect((onOptionsChange.mock.lastCall?.[0] as WaveformOptions).xAxis?.min).toBeUndefined()

    const callsBeforeInvalidFormat = onOptionsChange.mock.calls.length
    const formatInput = findField(container, '数字格式').querySelector<HTMLInputElement>('input')!
    fireInput(formatInput, 'invalid format')
    expect(formatInput.getAttribute('aria-invalid')).toBe('true')
    expect(onOptionsChange).toHaveBeenCalledTimes(callsBeforeInvalidFormat)
  })

  it('toggles empty-data preview independently of chart options', () => {
    const { container, onEmptyPreviewChange } = setup()
    const input = findField(container, '预览空数据状态').querySelector<HTMLInputElement>('input[type="checkbox"]')!
    input.checked = true
    input.dispatchEvent(new Event('change', { bubbles: true }))
    expect(onEmptyPreviewChange).toHaveBeenLastCalledWith(true)
  })

  it('turns inherited series values into overrides and clears them again', () => {
    const { container, onSeriesChange } = setup()
    const colorOverride = Array.from(container.querySelectorAll<HTMLElement>('.series-override'))
      .find(element => element.querySelector('.series-override__heading > span')?.textContent === '颜色')!
    const inherit = colorOverride.querySelector<HTMLInputElement>('.inherit-toggle input')!
    expect(inherit.checked).toBe(true)

    inherit.checked = false
    inherit.dispatchEvent(new Event('change', { bubbles: true }))
    expect((onSeriesChange.mock.lastCall?.[0] as WaveformSeries[])[0].style?.color).toBe('#2563eb')

    inherit.checked = true
    inherit.dispatchEvent(new Event('change', { bubbles: true }))
    expect((onSeriesChange.mock.lastCall?.[0] as WaveformSeries[])[0].style?.color).toBeUndefined()
  })
})
