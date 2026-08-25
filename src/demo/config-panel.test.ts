// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
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

afterEach(() => document.body.replaceChildren())

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

function clickButton(container: HTMLElement, label: string, selector = 'button') {
  const button = Array.from(container.querySelectorAll<HTMLButtonElement>(selector))
    .find(element => element.textContent === label)
  if (!button) throw new Error(`Button not found: ${label}`)
  button.click()
  return button
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
  const baseSeries: WaveformSeries[] = [
    { name: 'CH1', data: [{ x: 0, y: 1 }] },
    { name: 'CH2', data: [{ x: 0, y: 2 }], style: { color: '#dc2626' } },
  ]

  function setup() {
    const container = document.createElement('div')
    container.className = 'workspace__inner'
    document.body.append(container)
    const options = resolveOptions({ line: { color: '#2563eb', width: 2 } })
    const onOptionsChange = vi.fn()
    const onSeriesChange = vi.fn()
    const onEmptyPreviewChange = vi.fn()
    createConfigPanel(container, { options, series: baseSeries, onOptionsChange, onSeriesChange, onEmptyPreviewChange })
    return { container, onOptionsChange, onSeriesChange, onEmptyPreviewChange }
  }

  it('renders accessible tabs and supports keyboard activation', () => {
    const { container } = setup()
    const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
    expect(tabs).toHaveLength(6)
    expect(tabs.map(tab => tab.textContent)).toEqual(['布局', '线点', '坐标轴', '网格', '文字', '曲线'])
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')
    expect(tabs[0].getAttribute('aria-controls')).toBeTruthy()
    expect(container.querySelectorAll<HTMLElement>('[role="tabpanel"]:not([hidden])')).toHaveLength(1)

    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(tabs[1].getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(tabs[1])
  })

  it('commits live option edits without dropping sibling values or tab state', () => {
    const { container, onOptionsChange } = setup()
    expect(container.classList.contains('workspace__inner')).toBe(true)
    clickButton(container, '线点', '[role="tab"]')
    const input = findField(container, '线条宽度').querySelector<HTMLInputElement>('input[type="number"]')!
    fireInput(input, '4.5')
    const updated = onOptionsChange.mock.lastCall?.[0] as WaveformOptions
    expect(updated.line).toMatchObject({ color: '#2563eb', width: 4.5 })

    clickButton(container, '布局', '[role="tab"]')
    clickButton(container, '线点', '[role="tab"]')
    expect(findField(container, '线条宽度').querySelector<HTMLInputElement>('input')?.value).toBe('4.5')
  })

  it('commits shared grid style and color without dropping axis settings', () => {
    const { container, onOptionsChange } = setup()
    clickButton(container, '网格', '[role="tab"]')

    const style = findField(container, '辅助线样式').querySelector<HTMLSelectElement>('select')!
    style.value = 'solid'
    style.dispatchEvent(new Event('change', { bubbles: true }))

    const color = findField(container, '辅助线颜色').querySelector<HTMLInputElement>('input[type="text"]')!
    fireInput(color, '#123456')

    const updated = onOptionsChange.mock.lastCall?.[0] as WaveformOptions
    expect(updated.grid).toMatchObject({
      style: 'solid',
      color: '#123456',
      x: { visible: true, width: 1 },
      y: { visible: true, width: 1 },
    })
    expect(container.textContent).not.toContain('X 网格颜色')
    expect(container.textContent).not.toContain('Y 网格虚线')
  })

  it('clears optional axis bounds and blocks invalid D3 formats', () => {
    const { container, onOptionsChange } = setup()
    clickButton(container, '坐标轴', '[role="tab"]')
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
    clickButton(container, '文字', '[role="tab"]')
    clickButton(container, '空状态', '.segment-button')
    const input = findField(container, '预览空数据状态').querySelector<HTMLInputElement>('input[type="checkbox"]')!
    input.checked = true
    input.dispatchEvent(new Event('change', { bubbles: true }))
    expect(onEmptyPreviewChange).toHaveBeenLastCalledWith(true)
  })

  it('turns inherited series values into overrides and clears them again', () => {
    const { container, onSeriesChange } = setup()
    clickButton(container, '曲线', '[role="tab"]')
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

  it('switches subsections and series while preserving their current selections', () => {
    const { container } = setup()
    clickButton(container, '线点', '[role="tab"]')
    clickButton(container, '数据点', '.segment-button')
    expect(findField(container, '数据点大小')).toBeTruthy()
    clickButton(container, '布局', '[role="tab"]')
    clickButton(container, '线点', '[role="tab"]')
    expect(container.querySelector<HTMLButtonElement>('.config-tabpanel:not([hidden]) .segment-button[aria-pressed="true"]')?.textContent).toBe('数据点')

    clickButton(container, '曲线', '[role="tab"]')
    clickButton(container, '数据点', '.series-segment-control .segment-button')
    expect(container.querySelector<HTMLButtonElement>('.series-segment-control .segment-button[aria-pressed="true"]')?.textContent).toBe('数据点')
    expect(findField(container, '显示数据点')).toBeTruthy()
    const selector = container.querySelector<HTMLSelectElement>('[aria-label="选择曲线"]')!
    selector.value = '1'
    selector.dispatchEvent(new Event('change', { bubbles: true }))
    expect(container.querySelector<HTMLSelectElement>('[aria-label="选择曲线"]')?.value).toBe('1')
    clickButton(container, '线条', '.series-segment-control .segment-button')
    const inherit = Array.from(container.querySelectorAll<HTMLElement>('.series-override'))
      .find(element => element.querySelector('.series-override__heading > span')?.textContent === '颜色')
      ?.querySelector<HTMLInputElement>('.inherit-toggle input')
    expect(inherit?.checked).toBe(false)
  })

  it('adds, renames, deletes, and rebinds value axes', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const onOptionsChange = vi.fn()
    const onSeriesChange = vi.fn()
    createConfigPanel(container, {
      options: resolveOptions({
        yAxes: [{ id: 'left' }, { id: 'right', position: 'right' }],
        grid: { y: { axisId: 'right' } },
        zeroLine: { axisId: 'right' },
      }),
      series: [
        { name: 'CH1', yAxis: 'left', data: [{ x: 0, y: 1 }] },
        { name: 'CH2', yAxis: 'right', data: [{ x: 0, y: 2 }] },
      ],
      onOptionsChange,
      onSeriesChange,
      onEmptyPreviewChange: vi.fn(),
    })

    clickButton(container, '坐标轴', '[role="tab"]')
    clickButton(container, '值轴', '.segment-button')
    const selector = container.querySelector<HTMLSelectElement>('[aria-label="选择值轴"]')!
    selector.value = '1'
    selector.dispatchEvent(new Event('change', { bubbles: true }))

    const idInput = findField(container, '轴 ID').querySelector<HTMLInputElement>('input')!
    idInput.value = 'pressure'
    idInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect((onOptionsChange.mock.lastCall?.[0] as WaveformOptions).yAxes?.[1].id).toBe('pressure')
    expect((onSeriesChange.mock.lastCall?.[0] as WaveformSeries[])[1].yAxis).toBe('pressure')
    expect((onOptionsChange.mock.lastCall?.[0] as WaveformOptions).grid?.y?.axisId).toBe('pressure')
    expect((onOptionsChange.mock.lastCall?.[0] as WaveformOptions).zeroLine?.axisId).toBe('pressure')

    clickButton(container, '删除', '.axis-command')
    expect((onOptionsChange.mock.lastCall?.[0] as WaveformOptions).yAxes).toHaveLength(1)
    expect((onSeriesChange.mock.lastCall?.[0] as WaveformSeries[])[1].yAxis).toBe('left')
    expect(container.querySelector<HTMLButtonElement>('.axis-command--danger')?.disabled).toBe(true)

    container.querySelector<HTMLButtonElement>('[aria-label="新增值轴"]')?.click()
    expect((onOptionsChange.mock.lastCall?.[0] as WaveformOptions).yAxes).toHaveLength(2)
  })
})
