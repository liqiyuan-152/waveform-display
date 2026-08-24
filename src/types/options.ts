import type { WaveformLineStyle, WaveformLineType, WaveformPointType } from './data'

export type BorderStyle = 'solid' | 'dashed' | 'dotted'
export interface PaddingOptions { top?: number; right?: number; bottom?: number; left?: number }
export interface BorderSideOptions { visible?: boolean; color?: string; width?: number; style?: BorderStyle }
export interface FrameOptions {
  visible?: boolean
  borderColor?: string
  borderWidth?: number
  borderStyle?: BorderStyle
  backgroundColor?: string
  radius?: number
  top?: BorderSideOptions
  right?: BorderSideOptions
  bottom?: BorderSideOptions
  left?: BorderSideOptions
}
export interface LineOptions { visible?: boolean; color?: string; width?: number; type?: WaveformLineType; style?: WaveformLineStyle; opacity?: number }
export interface PointOptions { visible?: boolean; type?: WaveformPointType; size?: number; color?: string; borderColor?: string; borderWidth?: number }
export interface AreaOptions { visible?: boolean; color?: string; opacity?: number; baseline?: number }
export interface AxisLabelOptions { visible?: boolean; text?: string; unit?: string; color?: string; fontSize?: number; fontWeight?: number | string; offset?: number }
export interface AxisOptions {
  visible?: boolean
  position?: 'left' | 'right'
  min?: number
  max?: number
  tickCount?: number
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
export interface GridAxisOptions { visible?: boolean; color?: string; width?: number; dash?: string }
export interface GridOptions { visible?: boolean; x?: GridAxisOptions; y?: GridAxisOptions }
export interface ZeroLineOptions { visible?: boolean; color?: string; width?: number; dash?: string }
export interface TitleOptions { visible?: boolean; text?: string; align?: 'left' | 'center' | 'right'; color?: string; fontSize?: number; fontWeight?: number | string }
export interface ResponsiveOptions { enabled?: boolean; aspectRatio?: number; minHeight?: number; maxHeight?: number }
export interface LegendOptions {
  visible?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  color?: string
  fontSize?: number
  itemGap?: number
}

export interface WaveformOptions {
  width?: number | string
  height?: number | string
  responsive?: ResponsiveOptions
  padding?: PaddingOptions
  frame?: FrameOptions
  line?: LineOptions
  point?: PointOptions
  area?: AreaOptions
  xAxis?: AxisOptions
  yAxis?: AxisOptions
  grid?: GridOptions
  zeroLine?: ZeroLineOptions
  title?: TitleOptions
  legend?: LegendOptions
}
