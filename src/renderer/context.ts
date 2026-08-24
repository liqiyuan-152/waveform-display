import type * as d3 from 'd3'
import type { WaveformSeries } from '../types/data'
import type { ReturnTypeOfResolveOptions } from '../types/internal'

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
  y: d3.ScaleLinear<number, number>
  yRight?: d3.ScaleLinear<number, number>
  xDomain: [number, number]
  yDomain: [number, number]
  yRightDomain?: [number, number]
  clipId: string
}
