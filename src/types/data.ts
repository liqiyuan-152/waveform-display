export interface WaveformPoint {
  x: number
  y: number
}

export type WaveformLineType = 'linear' | 'step-start' | 'step-middle' | 'step-end'
export type WaveformLineStyle = 'solid' | 'dashed' | 'dash-dot'
export type WaveformPointType = 'circle' | 'square' | 'triangle' | 'diamond'

export interface WaveformSeriesPointStyle {
  visible?: boolean
  type?: WaveformPointType
  size?: number
  color?: string
  borderColor?: string
  borderWidth?: number
}

export interface WaveformSeriesAreaStyle {
  visible?: boolean
  color?: string
  opacity?: number
  baseline?: number
}

export interface WaveformSeriesStyle {
  color?: string
  lineWidth?: number
  lineType?: WaveformLineType
  lineStyle?: WaveformLineStyle
  opacity?: number
  point?: WaveformSeriesPointStyle
  area?: WaveformSeriesAreaStyle
}

export interface WaveformSeries {
  id?: string
  name?: string
  unit?: string
  order?: number
  yAxis?: 'left' | 'right'
  data: WaveformPoint[]
  style?: WaveformSeriesStyle
}

export type WaveformData = WaveformPoint[] | WaveformSeries[]
