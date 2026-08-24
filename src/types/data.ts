export interface WaveformPoint {
  x: number
  y: number
}

export type WaveformLineType = 'linear' | 'step-start' | 'step-middle' | 'step-end'
export type WaveformLineStyle = 'solid' | 'dashed' | 'dash-dot'
export type WaveformPointType = 'circle' | 'square' | 'triangle' | 'diamond'

export interface WaveformSeriesStyle {
  color?: string
  lineWidth?: number
  lineType?: WaveformLineType
  lineStyle?: WaveformLineStyle
  opacity?: number
}

export interface WaveformSeries {
  id?: string
  name?: string
  unit?: string
  data: WaveformPoint[]
  style?: WaveformSeriesStyle
}

export type WaveformData = WaveformPoint[] | WaveformSeries[]
