import type * as d3 from 'd3'
import type { WaveformSeries } from '../types/data'
import type { ReturnTypeOfResolveOptions } from '../types/internal'
import type { ResolvedValueAxisOptions } from '../config/resolve'

export interface ResolvedValueAxis {
  options: ResolvedValueAxisOptions
  domain: [number, number]
  scale: d3.ScaleLinear<number, number>
  offset: number
  footprint: number
}

export interface RenderContext {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
  plot: d3.Selection<SVGGElement, unknown, null, undefined>
  series: WaveformSeries[]
  options: ReturnTypeOfResolveOptions
  width: number
  height: number
  innerWidth: number
  innerHeight: number
  x: d3.ScaleLinear<number, number>
  yAxes: ResolvedValueAxis[]
  yAxisById: Map<string, ResolvedValueAxis>
  primaryYAxis: ResolvedValueAxis
  xDomain: [number, number]
  clipId: string
}
