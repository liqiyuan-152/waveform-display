import { defaultOptions } from './defaults'
import type { WaveformOptions } from '../types/options'

export function resolveOptions(options: WaveformOptions = {}) {
  return {
    ...defaultOptions,
    ...options,
    responsive: { ...defaultOptions.responsive, ...options.responsive },
    padding: { ...defaultOptions.padding, ...options.padding },
    frame: {
      ...defaultOptions.frame,
      ...options.frame,
      top: { ...defaultOptions.frame.top, ...options.frame?.top },
      right: { ...defaultOptions.frame.right, ...options.frame?.right },
      bottom: { ...defaultOptions.frame.bottom, ...options.frame?.bottom },
      left: { ...defaultOptions.frame.left, ...options.frame?.left },
    },
    line: { ...defaultOptions.line, ...options.line },
    point: { ...defaultOptions.point, ...options.point },
    area: { ...defaultOptions.area, ...options.area },
    xAxis: { ...defaultOptions.xAxis, ...options.xAxis, title: { ...defaultOptions.xAxis.title, ...options.xAxis?.title } },
    yAxis: { ...defaultOptions.yAxis, ...options.yAxis, title: { ...defaultOptions.yAxis.title, ...options.yAxis?.title } },
    grid: {
      ...defaultOptions.grid,
      ...options.grid,
      x: { ...defaultOptions.grid.x, ...options.grid?.x },
      y: { ...defaultOptions.grid.y, ...options.grid?.y },
    },
    zeroLine: { ...defaultOptions.zeroLine, ...options.zeroLine },
    title: { ...defaultOptions.title, ...options.title },
  }
}
