import type { WaveformLineStyle, WaveformLineType, WaveformPointType } from './data'

export type BorderStyle = 'solid' | 'dashed' | 'dotted'
export type GridLineStyle = 'solid' | 'dashed'
export interface PaddingOptions { top?: number; right?: number; bottom?: number; left?: number }
export interface FrameOptions {
  visible?: boolean
  borderColor?: string
  borderWidth?: number
  borderStyle?: BorderStyle
  backgroundColor?: string
  radius?: number
}
export interface LineOptions { visible?: boolean; color?: string; width?: number; type?: WaveformLineType; style?: WaveformLineStyle; opacity?: number }
export interface PointOptions { visible?: boolean; type?: WaveformPointType; size?: number; color?: string; borderColor?: string; borderWidth?: number }
export interface AxisLabelOptions { visible?: boolean; text?: string; unit?: string; color?: string; fontSize?: number; fontWeight?: number | string; offset?: number }
export interface AxisOptions {
  visible?: boolean
  position?: 'left' | 'right'
  min?: number
  max?: number
  tickCount?: number
  hideEndTicks?: boolean
  showEndValues?: boolean
  tickSize?: number
  tickPadding?: number
  tickFormat?: string | ((value: number) => string)
  color?: string
  width?: number
  fontSize?: number
  fontColor?: string
  label?: string
  unit?: string
  title?: AxisLabelOptions
}
export interface ValueAxisOptions extends AxisOptions { id: string }
export interface GridAxisOptions { visible?: boolean; color?: string; width?: number; dash?: string }
export interface ValueGridAxisOptions extends GridAxisOptions { axisId?: string }
export interface GridOptions { visible?: boolean; color?: string; style?: GridLineStyle; x?: GridAxisOptions; y?: ValueGridAxisOptions }
export interface ZeroLineOptions { visible?: boolean; color?: string; width?: number; dash?: string; axisId?: string }
export interface TitleOptions { visible?: boolean; text?: string; align?: 'left' | 'center' | 'right'; color?: string; fontSize?: number; fontWeight?: number | string }
export interface ShotOptions { visible?: boolean; text?: string; color?: string; fontSize?: number; fontWeight?: number | string }
export interface ResponsiveOptions { enabled?: boolean; aspectRatio?: number; minHeight?: number; maxHeight?: number }
export interface LegendOptions {
  visible?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  orientation?: 'vertical' | 'horizontal'
  color?: string
  fontSize?: number
  itemGap?: number
  lineLength?: number
  maxItemWidth?: number
}
export interface EmptyStateOptions {
  visible?: boolean
  text?: string
  color?: string
  fontSize?: number
}
export interface LayoutOptions {
  autoPadding?: boolean
}

export interface XDomainStrategy {
  type: 'data' | 'nice'
  /** Selects which bounds are expanded when type is `nice`. Defaults to `both`. */
  bounds?: 'both' | 'end'
  /** Stable tick count used to calculate nice bounds. Defaults to 10. */
  tickCount?: number
  /** Also applies the strategy when xAxis.min or xAxis.max is set. Defaults to false. */
  includeExplicit?: boolean
}

export interface WaveformOptions {
  width?: number | string
  height?: number | string
  responsive?: ResponsiveOptions
  layout?: LayoutOptions
  padding?: PaddingOptions
  frame?: FrameOptions
  line?: LineOptions
  point?: PointOptions
  xDomainStrategy?: XDomainStrategy
  xAxis?: AxisOptions
  yAxis?: AxisOptions
  secondaryYAxis?: AxisOptions
  yAxes?: ValueAxisOptions[]
  grid?: GridOptions
  zeroLine?: ZeroLineOptions
  title?: TitleOptions
  shot?: ShotOptions
  legend?: LegendOptions
  emptyState?: EmptyStateOptions
}
