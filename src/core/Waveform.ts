import * as d3 from 'd3'
import { resolveOptions } from '../config/resolve'
import { normalizeData } from './normalize'
import { borderDash, curveFor, dashFor } from '../renderer/helpers'
import type { WaveformData, WaveformSeries } from '../types/data'
import type { WaveformOptions } from '../types/options'

export class Waveform {
  private container: HTMLElement
  private data: WaveformData
  private rawOptions: WaveformOptions

  constructor(target: string | HTMLElement, data: WaveformData, options: WaveformOptions = {}) {
    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
    if (!el) throw new Error('Waveform container not found')
    this.container = el
    this.data = data
    this.rawOptions = options
    this.render()
  }

  updateData(data: WaveformData) { this.data = data; this.render() }
  updateOptions(options: WaveformOptions) { this.rawOptions = { ...this.rawOptions, ...options }; this.render() }
  destroy() { this.container.replaceChildren() }

  render() {
    const options = resolveOptions(this.rawOptions)
    const series = normalizeData(this.data)
    this.container.replaceChildren()
    if (!series.length) return

    const width = typeof options.width === 'number' ? options.width : this.container.clientWidth || 800
    const height = typeof options.height === 'number' ? options.height : this.container.clientHeight || 320
    const p = options.padding
    const innerWidth = Math.max(0, width - p.left - p.right)
    const innerHeight = Math.max(0, height - p.top - p.bottom)
    const points = series.flatMap(s => s.data)
    const xExtent = d3.extent(points, d => d.x) as [number, number]
    const yExtent = d3.extent(points, d => d.y) as [number, number]
    const xDomain: [number, number] = [Number.isFinite(options.xAxis.min) ? options.xAxis.min : xExtent[0], Number.isFinite(options.xAxis.max) ? options.xAxis.max : xExtent[1]]
    const yDomain: [number, number] = [Number.isFinite(options.yAxis.min) ? options.yAxis.min : yExtent[0], Number.isFinite(options.yAxis.max) ? options.yAxis.max : yExtent[1]]
    if (xDomain[0] === xDomain[1]) { xDomain[0] -= 1; xDomain[1] += 1 }
    if (yDomain[0] === yDomain[1]) { yDomain[0] -= 1; yDomain[1] += 1 }

    const x = d3.scaleLinear().domain(xDomain).range([0, innerWidth])
    const y = d3.scaleLinear().domain(yDomain).nice().range([innerHeight, 0])
    const svg = d3.select(this.container).append('svg').attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`)
    const plot = svg.append('g').attr('transform', `translate(${p.left},${p.top})`)

    if (options.frame.visible) plot.append('rect').attr('width', innerWidth).attr('height', innerHeight).attr('fill', options.frame.backgroundColor).attr('stroke', options.frame.borderColor).attr('stroke-width', options.frame.borderWidth).attr('stroke-dasharray', borderDash(options.frame.borderStyle))

    if (options.grid.visible) {
      if (options.grid.x.visible) plot.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(options.xAxis.tickCount).tickSize(-innerHeight).tickFormat(() => '')).call(g => g.select('.domain').remove()).call(g => g.selectAll('line').attr('stroke', options.grid.x.color).attr('stroke-width', options.grid.x.width).attr('stroke-dasharray', options.grid.x.dash))
      if (options.grid.y.visible) plot.append('g').call(d3.axisLeft(y).ticks(options.yAxis.tickCount).tickSize(-innerWidth).tickFormat(() => '')).call(g => g.select('.domain').remove()).call(g => g.selectAll('line').attr('stroke', options.grid.y.color).attr('stroke-width', options.grid.y.width).attr('stroke-dasharray', options.grid.y.dash))
    }

    if (options.zeroLine.visible && yDomain[0] <= 0 && yDomain[1] >= 0) plot.append('line').attr('x1', 0).attr('x2', innerWidth).attr('y1', y(0)).attr('y2', y(0)).attr('stroke', options.zeroLine.color).attr('stroke-width', options.zeroLine.width).attr('stroke-dasharray', options.zeroLine.dash)

    if (options.line.visible) series.forEach((s: WaveformSeries) => {
      const style = { color: options.line.color, lineWidth: options.line.width, lineType: options.line.type, lineStyle: options.line.style, opacity: options.line.opacity, ...s.style }
      const line = d3.line<(typeof s.data)[number]>().x(d => x(d.x)).y(d => y(d.y)).curve(curveFor(style.lineType))
      plot.append('path').datum(s.data).attr('d', line).attr('fill', 'none').attr('stroke', style.color).attr('stroke-width', style.lineWidth).attr('stroke-opacity', style.opacity).attr('stroke-dasharray', dashFor(style.lineStyle)).attr('vector-effect', 'non-scaling-stroke')
    })

    if (options.point.visible) series.forEach(s => plot.append('g').selectAll('circle').data(s.data).join('circle').attr('cx', d => x(d.x)).attr('cy', d => y(d.y)).attr('r', options.point.size).attr('fill', options.point.color).attr('stroke', options.point.borderColor).attr('stroke-width', options.point.borderWidth))

    if (options.xAxis.visible) plot.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(options.xAxis.tickCount)).call(g => g.selectAll('path,line').attr('stroke', options.xAxis.color)).call(g => g.selectAll('text').attr('fill', options.xAxis.fontColor).attr('font-size', options.xAxis.fontSize))
    if (options.yAxis.visible) plot.append('g').call(d3.axisLeft(y).ticks(options.yAxis.tickCount)).call(g => g.selectAll('path,line').attr('stroke', options.yAxis.color)).call(g => g.selectAll('text').attr('fill', options.yAxis.fontColor).attr('font-size', options.yAxis.fontSize))

    if (options.title.visible && options.title.text) {
      const tx = options.title.align === 'left' ? p.left : options.title.align === 'right' ? width - p.right : width / 2
      svg.append('text').attr('x', tx).attr('y', 22).attr('text-anchor', options.title.align === 'left' ? 'start' : options.title.align === 'right' ? 'end' : 'middle').attr('fill', options.title.color).attr('font-size', options.title.fontSize).attr('font-weight', options.title.fontWeight).text(options.title.text)
    }
  }
}
