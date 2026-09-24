import type { WaveformSeries } from '../types/data'

export const scientificSeries: WaveformSeries[] = [{
  id: 'scientific-sample',
  name: '小数值测试',
  unit: 'ms',
  yAxis: 'left',
  data: [
    { x: 0, y: 0.002 },
    { x: 1, y: 0.0032 },
    { x: 2, y: 0.0048 },
    { x: 3, y: 0.0041 },
    { x: 4, y: 0.0063 },
    { x: 5, y: 0.008 },
    { x: 6, y: 0.0069 },
    { x: 7, y: 0.0054 },
    { x: 8, y: 0.0061 },
    { x: 9, y: 0.0038 },
    { x: 10, y: 0.0027 },
  ],
  style: { color: '#2dd4bf', lineWidth: 3 },
}]
