import * as d3 from 'd3'
import { resolveOptions } from '../config/resolve'
import { normalizeData } from './normalize'
import { borderDash, curveFor, dashFor } from '../renderer/helpers'
import type { WaveformData, WaveformPoint, WaveformSeries, WaveformPointType } from '../types/data'
import type { AxisOptions, WaveformOptions } from '../types/options'

export class Waveform {
  private container: HTMLElement
  private data: WaveformData
  private rawOptions: WaveformOptions
  private resizeObserver?: ResizeObserver

  constructor(target: string | HTMLElement, data: WaveformData, options: WaveformOptions = {}) {
    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
    if (!el) throw new Error('Waveform container not found')
    this.container = el
    this.data = data
    this.rawOptions = options
    this.setupResponsive()
    this.render()
  }

  updateData(data: WaveformData) { this.data = data; this.render() }
  updateOptions(options: WaveformOptions) { this.rawOptions = this.mergeRawOptions(this.rawOptions, options); this.setupResponsive(); this.render() }
  destroy() { this.resizeObserver?.disconnect(); this.container.replaceChildren() }

  private mergeRawOptions(base: WaveformOptions, next: WaveformOptions): WaveformOptions {
    return {
      ...base, ...next,
      responsive: { ...base.responsive, ...next.responsive }, padding: { ...base.padding, ...next.padding },
      frame: { ...base.frame, ...next.frame, top: { ...base.frame?.top, ...next.frame?.top }, right: { ...base.frame?.right, ...next.frame?.right }, bottom: { ...base.frame?.bottom, ...next.frame?.bottom }, left: { ...base.frame?.left, ...next.frame?.left } },
      line: { ...base.line, ...next.line }, point: { ...base.point, ...next.point }, area: { ...base.area, ...next.area },
      xAxis: { ...base.xAxis, ...next.xAxis, title: { ...base.xAxis?.title, ...next.xAxis?.title } },
      yAxis: { ...base.yAxis, ...next.yAxis, title: { ...base.yAxis?.title, ...next.yAxis?.title } },
      grid: { ...base.grid, ...next.grid, x: { ...base.grid?.x, ...next.grid?.x }, y: { ...base.grid?.y, ...next.grid?.y } },
      zeroLine: { ...base.zeroLine, ...next.zeroLine }, title: { ...base.title, ...next.title },
    }
  }

  private setupResponsive() {
    this.resizeObserver?.disconnect()
    if (!resolveOptions(this.rawOptions).responsive.enabled || typeof ResizeObserver === 'undefined') return
    this.resizeObserver = new ResizeObserver(() => this.render())
    this.resizeObserver.observe(this.container)
  }

  private formatTick(axis: AxisOptions, value: d3.NumberValue): string {
    const number = Number(value)
    if (typeof axis.tickFormat === 'function') return axis.tickFormat(number)
    if (axis.tickFormat) return d3.format(axis.tickFormat)(number)
    return `${number}${axis.unit ? ` ${axis.unit}` : ''}`
  }

  private symbolType(type: WaveformPointType) {
    if (type === 'square') return d3.symbolSquare
    if (type === 'triangle') return d3.symbolTriangle
    if (type === 'diamond') return d3.symbolDiamond
    return d3.symbolCircle
  }

  render() {
    const options = resolveOptions(this.rawOptions)
    const series = normalizeData(this.data).filter(s => s.data.length)
    this.container.replaceChildren()
    if (!series.length) return

    const measuredWidth = this.container.clientWidth || 800
    const width = typeof options.width === 'number' ? options.width : measuredWidth
    let height = typeof options.height === 'number' ? options.height : this.container.clientHeight || 320
    if (options.responsive.enabled && typeof options.width !== 'number') height = Math.min(options.responsive.maxHeight, Math.max(options.responsive.minHeight, width / options.responsive.aspectRatio))

    const p = options.padding
    const innerWidth = Math.max(1, width - p.left - p.right)
    const innerHeight = Math.max(1, height - p.top - p.bottom)
    const points = series.flatMap(s => s.data)
    const xExtent = d3.extent(points, d => d.x) as [number, number]
    const yExtent = d3.extent(points, d => d.y) as [number, number]
    const xDomain: [number, number] = [Number.isFinite(options.xAxis.min) ? options.xAxis.min! : xExtent[0], Number.isFinite(options.xAxis.max) ? options.xAxis.max! : xExtent[1]]
    const yDomain: [number, number] = [Number.isFinite(options.yAxis.min) ? options.yAxis.min! : yExtent[0], Number.isFinite(options.yAxis.max) ? options.yAxis.max! : yExtent[1]]
    if (xDomain[0] === xDomain[1]) { xDomain[0] -= 1; xDomain[1] += 1 }
    if (yDomain[0] === yDomain[1]) { yDomain[0] -= 1; yDomain[1] += 1 }

    const x = d3.scaleLinear().domain(xDomain).range([0, innerWidth])
    const y = d3.scaleLinear().domain(yDomain).nice().range([innerHeight, 0])
    const svg = d3.select(this.container).append('svg').attr('width', '100%').attr('height', height).attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMidYMid meet')
    const plot = svg.append('g').attr('transform', `translate(${p.left},${p.top})`)

    if (options.frame.visible) {
      plot.append('rect').attr('width', innerWidth).attr('height', innerHeight).attr('rx', options.frame.radius).attr('fill', options.frame.backgroundColor).attr('stroke', 'none')
      const sides = [
        ['top', 0, 0, innerWidth, 0], ['right', innerWidth, 0, innerWidth, innerHeight], ['bottom', 0, innerHeight, innerWidth, innerHeight], ['left', 0, 0, 0, innerHeight],
      ] as const
      sides.forEach(([name, x1, y1, x2, y2]) => {
        const side = options.frame[name]
        if (side.visible) plot.append('line').attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2).attr('stroke', side.color || options.frame.borderColor).attr('stroke-width', side.width ?? options.frame.borderWidth).attr('stroke-dasharray', borderDash(side.style || options.frame.borderStyle))
      })
    }

    if (options.grid.visible) {
      if (options.grid.x.visible) plot.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(options.xAxis.tickCount).tickSize(-innerHeight).tickFormat(() => '')).call(g => g.select('.domain').remove()).call(g => g.selectAll('line').attr('stroke', options.grid.x.color).attr('stroke-width', options.grid.x.width).attr('stroke-dasharray', options.grid.x.dash))
      if (options.grid.y.visible) plot.append('g').call(d3.axisLeft(y).ticks(options.yAxis.tickCount).tickSize(-innerWidth).tickFormat(() => '')).call(g => g.select('.domain').remove()).call(g => g.selectAll('line').attr('stroke', options.grid.y.color).attr('stroke-width', options.grid.y.width).attr('stroke-dasharray', options.grid.y.dash))
    }

    if (options.zeroLine.visible && yDomain[0] <= 0 && yDomain[1] >= 0) plot.append('line').attr('x1', 0).attr('x2', innerWidth).attr('y1', y(0)).attr('y2', y(0)).attr('stroke', options.zeroLine.color).attr('stroke-width', options.zeroLine.width).attr('stroke-dasharray', options.zeroLine.dash)

    series.forEach((s: WaveformSeries) => {
      const lineStyle = { color: options.line.color, lineWidth: options.line.width, lineType: options.line.type, lineStyle: options.line.style, opacity: options.line.opacity, ...s.style }
      const areaStyle = { ...options.area, ...s.style?.area }
      if (areaStyle.visible) {
        const baseline = Math.min(yDomain[1], Math.max(yDomain[0], areaStyle.baseline))
        const area = d3.area<WaveformPoint>().x(d => x(d.x)).y0(y(baseline)).y1(d => y(d.y)).curve(curveFor(lineStyle.lineType))
        plot.append('path').datum(s.data).attr('d', area).attr('fill', areaStyle.color || lineStyle.color).attr('fill-opacity', areaStyle.opacity)
      }
      if (options.line.visible) {
        const line = d3.line<WaveformPoint>().x(d => x(d.x)).y(d => y(d.y)).curve(curveFor(lineStyle.lineType))
        plot.append('path').datum(s.data).attr('d', line).attr('fill', 'none').attr('stroke', lineStyle.color).attr('stroke-width', lineStyle.lineWidth).attr('stroke-opacity', lineStyle.opacity).attr('stroke-dasharray', dashFor(lineStyle.lineStyle)).attr('vector-effect', 'non-scaling-stroke')
      }
      const pointStyle = { ...options.point, ...s.style?.point }
      if (pointStyle.visible) {
        const symbol = d3.symbol().type(this.symbolType(pointStyle.type)).size(pointStyle.size * pointStyle.size * 4)
        plot.append('g').selectAll('path').data(s.data).join('path').attr('transform', d => `translate(${x(d.x)},${y(d.y)})`).attr('d', symbol).attr('fill', pointStyle.color || lineStyle.color).attr('stroke', pointStyle.borderColor).attr('stroke-width', pointStyle.borderWidth)
      }
    })

    if (options.xAxis.visible) {
      const axis = d3.axisBottom(x).ticks(options.xAxis.tickCount).tickSize(options.xAxis.tickSize).tickPadding(options.xAxis.tickPadding).tickFormat(v => this.formatTick(options.xAxis, v))
      plot.append('g').attr('transform', `translate(0,${innerHeight})`).call(axis).call(g => g.selectAll('path,line').attr('stroke', options.xAxis.color).attr('stroke-width', options.xAxis.width)).call(g => g.selectAll('text').attr('fill', options.xAxis.fontColor).attr('font-size', options.xAxis.fontSize))
    }
    if (options.yAxis.visible) {
      const axis = d3.axisLeft(y).ticks(options.yAxis.tickCount).tickSize(options.yAxis.tickSize).tickPadding(options.yAxis.tickPadding).tickFormat(v => this.formatTick(options.yAxis, v))
      plot.append('g').call(axis).call(g => g.selectAll('path,line').attr('stroke', options.yAxis.color).attr('stroke-width', options.yAxis.width)).call(g => g.selectAll('text').attr('fill', options.yAxis.fontColor).attr('font-size', options.yAxis.fontSize))
    }

    const xTitleText = options.xAxis.title.text || options.xAxis.label
    if (options.xAxis.title.visible && xTitleText) svg.append('text').attr('x', p.left + innerWidth / 2).attr('y', p.top + innerHeight + options.xAxis.title.offset).attr('text-anchor', 'middle').attr('fill', options.xAxis.title.color).attr('font-size', options.xAxis.title.fontSize).attr('font-weight', options.xAxis.title.fontWeight).text(`${xTitleText}${options.xAxis.title.unit ? ` (${options.xAxis.title.unit})` : ''}`)
    const yTitleText = options.yAxis.title.text || options.yAxis.label
    if (options.yAxis.title.visible && yTitleText) svg.append('text').attr('transform', `translate(${p.left - options.yAxis.title.offset},${p.top + innerHeight / 2}) rotate(-90)`).attr('text-anchor', 'middle').attr('fill', options.yAxis.title.color).attr('font-size', options.yAxis.title.fontSize).attr('font-weight', options.yAxis.title.fontWeight).text(`${yTitleText}${options.yAxis.title.unit ? ` (${options.yAxis.title.unit})` : ''}`)

    if (options.title.visible && options.title.text) {
      const tx = options.title.align === 'left' ? p.left : options.title.align === 'right' ? width - p.right : width / 2
      svg.append('text').attr('x', tx).attr('y', 24).attr('text-anchor', options.title.align === 'left' ? 'start' : options.title.align === 'right' ? 'end' : 'middle').attr('fill', options.title.color).attr('font-size', options.title.fontSize).attr('font-weight', options.title.fontWeight).text(options.title.text)
    }
  }
}
