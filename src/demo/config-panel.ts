import * as d3 from 'd3'
import type { WaveformSeries, WaveformSeriesStyle } from '../types/data'
import type { WaveformOptions } from '../types/options'

type FieldKind = 'boolean' | 'color' | 'number' | 'range' | 'select' | 'text'

interface FieldDefinition {
  kind: FieldKind
  label: string
  path: string
  min?: number
  max?: number
  step?: number
  optional?: boolean
  options?: ReadonlyArray<{ label: string; value: string }>
  parse?: (raw: string) => ParseResult<string | number | undefined>
  validate?: (raw: string) => boolean
}

interface SectionDefinition {
  title: string
  open?: boolean
  fields: FieldDefinition[]
}

export interface ParseResult<T> {
  valid: boolean
  value?: T
}

export interface ConfigPanelOptions {
  options: WaveformOptions
  series: WaveformSeries[]
  onOptionsChange: (options: WaveformOptions) => void
  onSeriesChange: (series: WaveformSeries[]) => void
  onEmptyPreviewChange: (enabled: boolean) => void
}

const boolean = (label: string, path: string): FieldDefinition => ({ kind: 'boolean', label, path })
const color = (label: string, path: string): FieldDefinition => ({ kind: 'color', label, path })
const text = (label: string, path: string, validate?: (raw: string) => boolean): FieldDefinition => ({ kind: 'text', label, path, validate })
const number = (label: string, path: string, min?: number, step = 1, optional = false, max?: number): FieldDefinition => (
  { kind: 'number', label, path, min, max, step, optional }
)
const range = (label: string, path: string, min: number, max: number, step: number): FieldDefinition => (
  { kind: 'range', label, path, min, max, step }
)
const select = (label: string, path: string, options: ReadonlyArray<{ label: string; value: string }>): FieldDefinition => (
  { kind: 'select', label, path, options }
)

const lineTypes = [
  { label: '直线', value: 'linear' },
  { label: '阶梯（起点）', value: 'step-start' },
  { label: '阶梯（中点）', value: 'step-middle' },
  { label: '阶梯（终点）', value: 'step-end' },
] as const
const lineStyles = [
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '点划线', value: 'dash-dot' },
] as const
const pointTypes = [
  { label: '圆形', value: 'circle' },
  { label: '方形', value: 'square' },
  { label: '三角形', value: 'triangle' },
  { label: '菱形', value: 'diamond' },
] as const

function axisFields(prefix: 'xAxis' | 'yAxis' | 'secondaryYAxis'): FieldDefinition[] {
  const isX = prefix === 'xAxis'
  return [
    boolean('显示坐标轴', `${prefix}.visible`),
    select('位置', `${prefix}.position`, [{ label: '左侧', value: 'left' }, { label: '右侧', value: 'right' }]),
    number('最小值', `${prefix}.min`, undefined, 0.1, true),
    number('最大值', `${prefix}.max`, undefined, 0.1, true),
    number('刻度数量', `${prefix}.tickCount`, 1, 1),
    ...(isX ? [boolean('隐藏端点刻度', `${prefix}.hideEndTicks`), boolean('显示端点值', `${prefix}.showEndValues`)] : []),
    number('刻度长度', `${prefix}.tickSize`, 0, 1),
    number('刻度间距', `${prefix}.tickPadding`, 0, 1),
    text('数字格式', `${prefix}.tickFormat`, isD3Format),
    color('轴线颜色', `${prefix}.color`),
    number('轴线宽度', `${prefix}.width`, 0, 0.1),
    number('刻度字号', `${prefix}.fontSize`, 1, 1),
    color('刻度文字颜色', `${prefix}.fontColor`),
    text('兼容标签', `${prefix}.label`),
    text('刻度单位', `${prefix}.unit`),
    boolean('显示轴标题', `${prefix}.title.visible`),
    text('轴标题', `${prefix}.title.text`),
    text('标题单位', `${prefix}.title.unit`),
    color('标题颜色', `${prefix}.title.color`),
    number('标题字号', `${prefix}.title.fontSize`, 1, 1),
    text('标题字重', `${prefix}.title.fontWeight`),
    number('标题偏移', `${prefix}.title.offset`, 0, 1),
  ]
}

const sections: SectionDefinition[] = [
  {
    title: '尺寸与布局', open: true, fields: [
      { kind: 'text', label: '宽度', path: 'width', parse: parseDimension },
      { kind: 'text', label: '高度', path: 'height', parse: parseDimension },
      boolean('响应式布局', 'responsive.enabled'),
      number('宽高比', 'responsive.aspectRatio', 0.1, 0.1),
      number('最小高度', 'responsive.minHeight', 1, 1),
      number('最大高度', 'responsive.maxHeight', 1, 1),
      boolean('自动留白', 'layout.autoPadding'),
      number('上留白', 'padding.top', 0),
      number('右留白', 'padding.right', 0),
      number('下留白', 'padding.bottom', 0),
      number('左留白', 'padding.left', 0),
    ],
  },
  {
    title: '边框', fields: [
      boolean('显示边框', 'frame.visible'), color('背景颜色', 'frame.backgroundColor'),
      color('边框颜色', 'frame.borderColor'), number('边框宽度', 'frame.borderWidth', 0, 0.1),
      select('边框样式', 'frame.borderStyle', [{ label: '实线', value: 'solid' }, { label: '虚线', value: 'dashed' }, { label: '点线', value: 'dotted' }]),
      number('圆角', 'frame.radius', 0),
    ],
  },
  {
    title: '全局线条与点', open: true, fields: [
      boolean('显示线条', 'line.visible'), color('线条颜色', 'line.color'), number('线条宽度', 'line.width', 0, 0.1),
      select('连线类型', 'line.type', lineTypes), select('线条样式', 'line.style', lineStyles), range('线条透明度', 'line.opacity', 0, 1, 0.05),
      boolean('显示数据点', 'point.visible'), select('数据点形状', 'point.type', pointTypes), number('数据点大小', 'point.size', 0, 0.5),
      color('数据点颜色', 'point.color'), color('数据点边框', 'point.borderColor'), number('点边框宽度', 'point.borderWidth', 0, 0.1),
    ],
  },
  {
    title: 'X 轴', fields: [
      select('范围策略', 'xDomainStrategy.type', [{ label: '数据范围', value: 'data' }, { label: '易读范围', value: 'nice' }]),
      select('扩展边界', 'xDomainStrategy.bounds', [{ label: '两端', value: 'both' }, { label: '仅终点', value: 'end' }]),
      number('策略刻度数', 'xDomainStrategy.tickCount', 1, 1), boolean('包含手动范围', 'xDomainStrategy.includeExplicit'),
      ...axisFields('xAxis'),
    ],
  },
  { title: '主 Y 轴', fields: axisFields('yAxis') },
  { title: '副 Y 轴', fields: axisFields('secondaryYAxis') },
  {
    title: '网格与零线', fields: [
      boolean('显示网格', 'grid.visible'), boolean('显示 X 网格', 'grid.x.visible'), color('X 网格颜色', 'grid.x.color'),
      number('X 网格宽度', 'grid.x.width', 0, 0.1), text('X 网格虚线', 'grid.x.dash'),
      boolean('显示 Y 网格', 'grid.y.visible'), color('Y 网格颜色', 'grid.y.color'), number('Y 网格宽度', 'grid.y.width', 0, 0.1),
      text('Y 网格虚线', 'grid.y.dash'), boolean('显示零线', 'zeroLine.visible'), color('零线颜色', 'zeroLine.color'),
      number('零线宽度', 'zeroLine.width', 0, 0.1), text('零线虚线', 'zeroLine.dash'),
    ],
  },
  {
    title: '标题、炮号与图例', fields: [
      boolean('显示图表标题', 'title.visible'), text('图表标题', 'title.text'),
      select('标题对齐', 'title.align', [{ label: '左对齐', value: 'left' }, { label: '居中', value: 'center' }, { label: '右对齐', value: 'right' }]),
      color('标题颜色', 'title.color'), number('标题字号', 'title.fontSize', 1), text('标题字重', 'title.fontWeight'),
      boolean('显示炮号', 'shot.visible'), text('炮号文字', 'shot.text'), color('炮号颜色', 'shot.color'),
      number('炮号字号', 'shot.fontSize', 1), text('炮号字重', 'shot.fontWeight'),
      boolean('显示图例', 'legend.visible'),
      select('图例位置', 'legend.position', [
        { label: '左上', value: 'top-left' }, { label: '右上', value: 'top-right' },
        { label: '左下', value: 'bottom-left' }, { label: '右下', value: 'bottom-right' },
      ]),
      select('图例方向', 'legend.orientation', [{ label: '横向', value: 'horizontal' }, { label: '纵向', value: 'vertical' }]),
      color('图例文字颜色', 'legend.color'), number('图例字号', 'legend.fontSize', 1), number('图例间距', 'legend.itemGap', 0),
      number('图例线长', 'legend.lineLength', 1),
    ],
  },
  {
    title: '空数据状态', fields: [
      boolean('显示空数据文字', 'emptyState.visible'), text('提示文字', 'emptyState.text'),
      color('提示颜色', 'emptyState.color'), number('提示字号', 'emptyState.fontSize', 1),
    ],
  },
]

export function parseNumberInput(raw: string, optional = false): ParseResult<number | undefined> {
  if (raw.trim() === '') return optional ? { valid: true, value: undefined } : { valid: false }
  const value = Number(raw)
  return Number.isFinite(value) ? { valid: true, value } : { valid: false }
}

export function parseDimension(raw: string): ParseResult<string | number> {
  const value = raw.trim()
  if (!value) return { valid: false }
  const numeric = Number(value)
  return Number.isFinite(numeric) ? { valid: true, value: numeric } : { valid: true, value }
}

export function colorPickerValue(value: unknown): string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'
}

export function getAtPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => (
    value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined
  ), source)
}

export function setAtPath<T>(source: T, path: string, value: unknown): T {
  const keys = path.split('.')
  const root = { ...(source as Record<string, unknown>) }
  let output = root
  let input = source as Record<string, unknown>
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      output[key] = value
      return
    }
    const nextInput = input?.[key]
    const nextOutput = nextInput && typeof nextInput === 'object'
      ? { ...(nextInput as Record<string, unknown>) }
      : {}
    output[key] = nextOutput
    output = nextOutput
    input = (nextInput ?? {}) as Record<string, unknown>
  })
  return root as T
}

function isD3Format(value: string): boolean {
  if (!value) return true
  try {
    d3.format(value)
    return true
  } catch {
    return false
  }
}

function isCssColor(value: string): boolean {
  if (!value) return false
  return typeof CSS === 'undefined' || typeof CSS.supports !== 'function' || CSS.supports('color', value)
}

function fieldShell(labelText: string): { shell: HTMLLabelElement; control: HTMLDivElement } {
  const shell = document.createElement('label')
  shell.className = 'config-field'
  const label = document.createElement('span')
  label.className = 'config-field__label'
  label.textContent = labelText
  const control = document.createElement('div')
  control.className = 'config-field__control'
  shell.append(label, control)
  return { shell, control }
}

function createField(field: FieldDefinition, read: () => unknown, commit: (value: unknown) => void): HTMLElement {
  const { shell, control } = fieldShell(field.label)
  const current = read()

  if (field.kind === 'boolean') {
    shell.classList.add('config-field--switch')
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.checked = Boolean(current)
    input.className = 'switch-input'
    const visual = document.createElement('span')
    visual.className = 'switch-visual'
    visual.setAttribute('aria-hidden', 'true')
    input.addEventListener('change', () => commit(input.checked))
    control.append(input, visual)
    return shell
  }

  if (field.kind === 'select') {
    const input = document.createElement('select')
    for (const option of field.options ?? []) {
      const element = document.createElement('option')
      element.value = option.value
      element.textContent = option.label
      input.append(element)
    }
    input.value = String(current ?? '')
    input.addEventListener('change', () => commit(input.value))
    control.append(input)
    return shell
  }

  if (field.kind === 'color') {
    const picker = document.createElement('input')
    picker.type = 'color'
    picker.className = 'color-picker'
    picker.value = colorPickerValue(current)
    picker.setAttribute('aria-label', `${field.label}色板`)
    const input = document.createElement('input')
    input.type = 'text'
    input.value = String(current ?? '')
    input.spellcheck = false
    picker.addEventListener('input', () => {
      input.value = picker.value
      input.removeAttribute('aria-invalid')
      commit(picker.value)
    })
    input.addEventListener('input', () => {
      const valid = isCssColor(input.value)
      input.setAttribute('aria-invalid', String(!valid))
      if (!valid) return
      picker.value = colorPickerValue(input.value)
      commit(input.value)
    })
    control.classList.add('color-control')
    control.append(picker, input)
    return shell
  }

  if (field.kind === 'range') {
    const slider = document.createElement('input')
    slider.type = 'range'
    slider.min = String(field.min)
    slider.max = String(field.max)
    slider.step = String(field.step)
    slider.value = String(current)
    slider.setAttribute('aria-label', field.label)
    const input = document.createElement('input')
    input.type = 'number'
    input.min = slider.min
    input.max = slider.max
    input.step = slider.step
    input.value = slider.value
    const apply = (raw: string, source: HTMLInputElement, target: HTMLInputElement) => {
      const parsed = parseNumberInput(raw)
      const valid = parsed.valid && parsed.value! >= field.min! && parsed.value! <= field.max!
      source.setAttribute('aria-invalid', String(!valid))
      if (!valid) return
      target.value = String(parsed.value)
      commit(parsed.value)
    }
    slider.addEventListener('input', () => apply(slider.value, slider, input))
    input.addEventListener('input', () => apply(input.value, input, slider))
    control.classList.add('range-control')
    control.append(slider, input)
    return shell
  }

  const input = document.createElement('input')
  input.type = field.kind === 'number' ? 'number' : 'text'
  input.value = current == null ? '' : String(current)
  if (field.min != null) input.min = String(field.min)
  if (field.max != null) input.max = String(field.max)
  if (field.step != null) input.step = String(field.step)
  input.addEventListener('input', () => {
    const parsed = field.parse
      ? field.parse(input.value)
      : field.kind === 'number'
        ? parseNumberInput(input.value, field.optional)
        : { valid: field.validate?.(input.value) ?? true, value: input.value }
    let valid = parsed.valid
    if (valid && typeof parsed.value === 'number') {
      valid = (field.min == null || parsed.value >= field.min) && (field.max == null || parsed.value <= field.max)
    }
    input.setAttribute('aria-invalid', String(!valid))
    if (valid) commit(parsed.value)
  })
  control.append(input)
  return shell
}

function cloneSeries(series: WaveformSeries[]): WaveformSeries[] {
  return series.map(item => ({
    ...item,
    data: item.data,
    style: item.style ? { ...item.style, point: item.style.point ? { ...item.style.point } : undefined } : undefined,
  }))
}

function seriesField(
  label: string,
  kind: FieldKind,
  value: unknown,
  onCommit: (value: unknown) => void,
  options?: FieldDefinition['options'],
  min?: number,
  max?: number,
  step?: number,
): HTMLElement {
  return createField({ label, kind, path: '', options, min, max, step }, () => value, onCommit)
}

function createOverrideField(
  label: string,
  value: unknown,
  inheritedValue: unknown,
  createControl: (value: unknown, commit: (value: unknown) => void) => HTMLElement,
  commit: (value: unknown) => void,
): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'series-override'
  const inheritLabel = document.createElement('label')
  inheritLabel.className = 'inherit-toggle'
  const inherit = document.createElement('input')
  inherit.type = 'checkbox'
  inherit.checked = value === undefined
  const caption = document.createElement('span')
  caption.textContent = '跟随全局'
  inheritLabel.append(inherit, caption)
  let control = createControl(value ?? inheritedValue, commit)
  control.classList.toggle('is-disabled', inherit.checked)
  control.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach(element => { element.disabled = inherit.checked })
  inherit.addEventListener('change', () => {
    if (inherit.checked) {
      commit(undefined)
    } else {
      commit(inheritedValue)
    }
    const replacement = createControl(inherit.checked ? inheritedValue : inheritedValue, commit)
    replacement.classList.toggle('is-disabled', inherit.checked)
    replacement.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach(element => { element.disabled = inherit.checked })
    control.replaceWith(replacement)
    control = replacement
  })
  const heading = document.createElement('div')
  heading.className = 'series-override__heading'
  const title = document.createElement('span')
  title.textContent = label
  heading.append(title, inheritLabel)
  wrapper.append(heading, control)
  return wrapper
}

function renderSeriesSection(
  parent: HTMLElement,
  getSeries: () => WaveformSeries[],
  getOptions: () => WaveformOptions,
  updateSeries: (index: number, path: string, value: unknown) => void,
) {
  const details = document.createElement('details')
  details.className = 'config-section'
  const summary = document.createElement('summary')
  summary.textContent = '曲线样式'
  const body = document.createElement('div')
  body.className = 'series-list'

  getSeries().forEach((item, index) => {
    const card = document.createElement('section')
    card.className = 'series-card'
    const title = document.createElement('h3')
    title.textContent = item.name || item.id || `曲线 ${index + 1}`
    const axis = seriesField('坐标轴', 'select', item.yAxis ?? 'left', value => updateSeries(index, 'yAxis', value), [
      { label: '主 Y 轴', value: 'left' }, { label: '副 Y 轴', value: 'right' },
    ])
    const overrides = document.createElement('div')
    overrides.className = 'series-overrides'
    const definitions: Array<{
      label: string
      path: string
      inherited: () => unknown
      control: (value: unknown, commit: (value: unknown) => void) => HTMLElement
    }> = [
      { label: '颜色', path: 'style.color', inherited: () => getOptions().line?.color, control: (value, commit) => seriesField('颜色', 'color', value, commit) },
      { label: '线宽', path: 'style.lineWidth', inherited: () => getOptions().line?.width, control: (value, commit) => seriesField('线宽', 'number', value, commit, undefined, 0, undefined, 0.1) },
      { label: '连线类型', path: 'style.lineType', inherited: () => getOptions().line?.type, control: (value, commit) => seriesField('连线类型', 'select', value, commit, lineTypes) },
      { label: '线条样式', path: 'style.lineStyle', inherited: () => getOptions().line?.style, control: (value, commit) => seriesField('线条样式', 'select', value, commit, lineStyles) },
      { label: '透明度', path: 'style.opacity', inherited: () => getOptions().line?.opacity, control: (value, commit) => seriesField('透明度', 'range', value, commit, undefined, 0, 1, 0.05) },
      { label: '显示数据点', path: 'style.point.visible', inherited: () => getOptions().point?.visible, control: (value, commit) => seriesField('显示数据点', 'boolean', value, commit) },
      { label: '数据点形状', path: 'style.point.type', inherited: () => getOptions().point?.type, control: (value, commit) => seriesField('数据点形状', 'select', value, commit, pointTypes) },
      { label: '数据点大小', path: 'style.point.size', inherited: () => getOptions().point?.size, control: (value, commit) => seriesField('数据点大小', 'number', value, commit, undefined, 0, undefined, 0.5) },
      { label: '数据点颜色', path: 'style.point.color', inherited: () => getOptions().point?.color, control: (value, commit) => seriesField('数据点颜色', 'color', value, commit) },
      { label: '点边框颜色', path: 'style.point.borderColor', inherited: () => getOptions().point?.borderColor, control: (value, commit) => seriesField('点边框颜色', 'color', value, commit) },
      { label: '点边框宽度', path: 'style.point.borderWidth', inherited: () => getOptions().point?.borderWidth, control: (value, commit) => seriesField('点边框宽度', 'number', value, commit, undefined, 0, undefined, 0.1) },
    ]
    for (const definition of definitions) {
      const current = getAtPath(item, definition.path)
      overrides.append(createOverrideField(
        definition.label,
        current,
        definition.inherited(),
        definition.control,
        value => updateSeries(index, definition.path, value),
      ))
    }
    card.append(title, axis, overrides)
    body.append(card)
  })
  details.append(summary, body)
  parent.append(details)
}

export function createConfigPanel(container: HTMLElement, config: ConfigPanelOptions) {
  let currentOptions = config.options
  let currentSeries = cloneSeries(config.series)
  container.replaceChildren()
  container.classList.add('config-panel')

  const heading = document.createElement('div')
  heading.className = 'config-panel__heading'
  const title = document.createElement('h2')
  title.textContent = '实时配置'
  heading.append(title)
  container.append(heading)

  for (const section of sections) {
    const details = document.createElement('details')
    details.className = 'config-section'
    details.open = Boolean(section.open)
    const summary = document.createElement('summary')
    summary.textContent = section.title
    const fields = document.createElement('div')
    fields.className = 'config-grid'
    for (const field of section.fields) {
      fields.append(createField(
        field,
        () => getAtPath(currentOptions, field.path),
        value => {
          currentOptions = setAtPath(currentOptions, field.path, value)
          config.onOptionsChange(currentOptions)
        },
      ))
    }
    if (section.title === '空数据状态') {
      fields.prepend(createField(
        boolean('预览空数据状态', '__emptyPreview'),
        () => false,
        value => config.onEmptyPreviewChange(Boolean(value)),
      ))
    }
    details.append(summary, fields)
    container.append(details)
  }

  renderSeriesSection(
    container,
    () => currentSeries,
    () => currentOptions,
    (index, path, value) => {
      const next = cloneSeries(currentSeries)
      next[index] = setAtPath(next[index], path, value)
      currentSeries = next
      config.onSeriesChange(cloneSeries(currentSeries))
    },
  )
}

export function setSeriesStyleOverride(
  style: WaveformSeriesStyle | undefined,
  path: string,
  value: unknown,
): WaveformSeriesStyle {
  return setAtPath(style ?? {}, path, value)
}
