import type { WaveformLineStyle, WaveformLineType, WaveformPointType } from './data'

export interface PaddingOptions { top?: number; right?: number; bottom?: number; left?: number }
export interface FrameOptions { visible?: boolean; borderColor?: string; borderWidth?: number; borderStyle?: 'solid' | 'dashed' | 'dotted'; backgroundColor?: string }
export interface LineOptions { visible?: boolean; color?: string; width?: number; type?: WaveformLineType; style?: WaveformLineStyle; opacity?: number }
export interface PointOptions { visible?: boolean; type?: WaveformPointType; size?: number; color?: string; borderColor?: string; borderWidth?: number }
export interface AxisOptions { visible?: boolean; min?: number; max?: number; tickCount?: number; color?: string; width?: number; fontSize?: number; fontColor?: string; label?: string }
export interface GridAxisOptions { visible?: boolean; color?: string; width?: number; dash?: string }
export interface GridOptions { visible?: boolean; x?: GridAxisOptions; y?: GridAxisOptions }
export interface ZeroLineOptions { visible?: boolean; color?: string; width?: number; dash?: string }
export interface TitleOptions { visible?: boolean; text?: string; align?: 'left' | 'center' | 'right'; color?: string; fontSize?: number; fontWeight?: number | string }

export interface WaveformOptions {
  width?: number | string
  height?: number | string
  padding?: PaddingOptions
  frame?: FrameOptions
  line?: LineOptions
  point?: PointOptions
  xAxis?: AxisOptions
  yAxis?: AxisOptions
  grid?: GridOptions
  zeroLine?: ZeroLineOptions
  title?: TitleOptions
}
