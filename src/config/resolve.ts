import { defaultOptions } from './defaults'
import type { AxisLabelOptions, ValueAxisOptions, WaveformOptions } from '../types/options'

export interface ResolvedValueAxisOptions extends ValueAxisOptions {
  visible: boolean
  position: 'left' | 'right'
  title: Required<AxisLabelOptions>
}

function resolveValueAxes(options: WaveformOptions): ResolvedValueAxisOptions[] {
  const configured = options.yAxes === undefined
    ? [
        { id: 'left', ...options.yAxis },
        { id: 'right', ...options.secondaryYAxis, position: 'right' as const },
      ]
    : options.yAxes
  const seen = new Set<string>()
  const axes: ResolvedValueAxisOptions[] = []

  for (const axis of configured) {
    const id = axis.id?.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    const legacyDefaults = options.yAxes === undefined && id === 'right'
      ? defaultOptions.secondaryYAxis
      : defaultOptions.yAxis
    axes.push({
      ...legacyDefaults,
      ...axis,
      id,
      title: { ...legacyDefaults.title, ...axis.title },
    })
  }

  if (axes.length) return axes
  return [{ ...defaultOptions.yAxis, id: 'left', title: { ...defaultOptions.yAxis.title } }]
}

export function resolveOptions(options: WaveformOptions = {}) {
  const yAxes = resolveValueAxes(options)
  return {
    ...defaultOptions,
    ...options,
    responsive: { ...defaultOptions.responsive, ...options.responsive },
    layout: { ...defaultOptions.layout, ...options.layout },
    padding: { ...defaultOptions.padding, ...options.padding },
    frame: {
      ...defaultOptions.frame,
      ...options.frame,
    },
    frameNumberStyle: { ...defaultOptions.frameNumberStyle, ...options.frameNumberStyle },
    line: { ...defaultOptions.line, ...options.line },
    point: { ...defaultOptions.point, ...options.point },
    xDomainStrategy: { ...defaultOptions.xDomainStrategy, ...options.xDomainStrategy },
    xAxis: { ...defaultOptions.xAxis, ...options.xAxis, title: { ...defaultOptions.xAxis.title, ...options.xAxis?.title } },
    yAxis: { ...defaultOptions.yAxis, ...options.yAxis, title: { ...defaultOptions.yAxis.title, ...options.yAxis?.title } },
    secondaryYAxis: { ...defaultOptions.secondaryYAxis, ...options.secondaryYAxis, title: { ...defaultOptions.secondaryYAxis.title, ...options.secondaryYAxis?.title } },
    yAxes,
    grid: {
      ...defaultOptions.grid,
      ...options.grid,
      x: { ...defaultOptions.grid.x, ...options.grid?.x },
      y: { ...defaultOptions.grid.y, ...options.grid?.y },
    },
    zeroLine: { ...defaultOptions.zeroLine, ...options.zeroLine },
    title: { ...defaultOptions.title, ...options.title },
    shot: { ...defaultOptions.shot, ...options.shot },
    legend: { ...defaultOptions.legend, ...options.legend },
    emptyState: { ...defaultOptions.emptyState, ...options.emptyState },
  }
}
