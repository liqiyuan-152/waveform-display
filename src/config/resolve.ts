import { defaultOptions } from './defaults'
import type { WaveformOptions } from '../types/options'

export function resolveOptions(options: WaveformOptions = {}): Required<WaveformOptions> {
  return {
    ...defaultOptions,
    ...options,
    padding: { ...defaultOptions.padding, ...options.padding },
    frame: { ...defaultOptions.frame, ...options.frame },
    line: { ...defaultOptions.line, ...options.line },
    point: { ...defaultOptions.point, ...options.point },
    xAxis: { ...defaultOptions.xAxis, ...options.xAxis },
    yAxis: { ...defaultOptions.yAxis, ...options.yAxis },
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
