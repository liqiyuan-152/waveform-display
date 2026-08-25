import { defaultOptions } from './defaults'
import type { WaveformOptions } from '../types/options'

export function resolveOptions(options: WaveformOptions = {}) {
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
    line: { ...defaultOptions.line, ...options.line },
    point: { ...defaultOptions.point, ...options.point },
    xAxis: { ...defaultOptions.xAxis, ...options.xAxis, title: { ...defaultOptions.xAxis.title, ...options.xAxis?.title } },
    yAxis: { ...defaultOptions.yAxis, ...options.yAxis, title: { ...defaultOptions.yAxis.title, ...options.yAxis?.title } },
    secondaryYAxis: { ...defaultOptions.secondaryYAxis, ...options.secondaryYAxis, title: { ...defaultOptions.secondaryYAxis.title, ...options.secondaryYAxis?.title } },
    grid: {
      ...defaultOptions.grid,
      ...options.grid,
      x: { ...defaultOptions.grid.x, ...options.grid?.x },
      y: { ...defaultOptions.grid.y, ...options.grid?.y },
    },
    zeroLine: { ...defaultOptions.zeroLine, ...options.zeroLine },
    title: { ...defaultOptions.title, ...options.title },
    legend: { ...defaultOptions.legend, ...options.legend },
    emptyState: { ...defaultOptions.emptyState, ...options.emptyState },
  }
}
