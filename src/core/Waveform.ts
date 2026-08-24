import * as d3 from 'd3'
import { resolveOptions } from '../config/resolve'
import { normalizeData } from './normalize'
import { renderFrame } from '../renderer/frame'
import { renderGrid } from '../renderer/grid'
import { renderSeries } from '../renderer/series'
import { renderAxes } from '../renderer/axes'
import { renderLegend } from '../renderer/legend'
import type { RenderContext } from '../renderer/context'
import type { WaveformData } from '../types/data'
import type { PaddingOptions, WaveformOptions } from '../types/options'

let instanceCounter = 0

export class Waveform {
  private container: HTMLElement
  private data: WaveformData
  private rawOptions: WaveformOptions
  private resizeObserver?: ResizeObserver
  private readonly instanceId = ++instanceCounter

  constructor(target: string | HTMLElement, data: WaveformData, options: WaveformOptions = {}) {
    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
    if (!el) throw new Error('Waveform container not found')
    this.container = el
    this.data = data
    this.rawOptions = options
    this.setupResponsive()
    this.render()
  }

  updateData(data: WaveformData) {
    this.data = data
    this.render()
  }

  updateOptions(options: WaveformOptions) {
    this.rawOptions = this.mergeRawOptions(this.rawOptions, options)
    this.setupResponsive()
    this.render()
  }

  toSVGString(): string {
    const svg = this.container.querySelector('svg')
    if (!svg) return ''
    return new XMLSerializer().serializeToString(svg)
  }

  downloadSVG(filename = 'waveform.svg') {
    const source = this.toSVGString()
    if (!source) return
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  destroy() {
    this.resizeObserver?.disconnect()
    this.container.replaceChildren()
  }

  private mergeRawOptions(base: WaveformOptions, next: WaveformOptions): WaveformOptions {
    return {
      ...base, ...next,
      responsive: { ...base.responsive, ...next.responsive },
      layout: { ...base.layout, ...next.layout },
      padding: { ...base.padding, ...next.padding },
      frame: {
        ...base.frame, ...next.frame,
        top: { ...base.frame?.top, ...next.frame?.top },
        right: { ...base.frame?.right, ...next.frame?.right },
        bottom: { ...base.frame?.bottom, ...next.frame?.bottom },
        left: { ...base.frame?.left, ...next.frame?.left },
      },
      line: { ...base.line, ...next.line },
      point: { ...base.point, ...next.point },
      area: { ...base.area, ...next.area },
      xAxis: { ...base.xAxis, ...next.xAxis, title: { ...base.xAxis?.title, ...next.xAxis?.title } },
      yAxis: { ...base.yAxis, ...next.yAxis, title: { ...base.yAxis?.title, ...next.yAxis?.title } },
      grid: { ...base.grid, ...next.grid, x: { ...base.grid?.x, ...next.grid?.x }, y: { ...base.grid?.y, ...next.grid?.y } },
      zeroLine: { ...base.zeroLine, ...next.zeroLine },
      title: { ...base.title, ...next.title },
      legend: { ...base.legend, ...next.legend },
      emptyState: { ...base.emptyState, ...next.emptyState },
    }
  }

  private setupResponsive() {
    this.resizeObserver?.disconnect()
    if (!resolveOptions(this.rawOptions).responsive.enabled || typeof ResizeObserver === 'undefined') return
    this.resizeObserver = new ResizeObserver(() => this.render())
    this.resizeObserver.observe(this.container)
  }

  private resolvePadding(options: ReturnType<typeof resolveOptions>): Required<PaddingOptions> {
    const p = { ...options.padding }
    if (!options.layout.autoPadding) return p

    if (options.title.visible && options.title.text) p.top = Math.max(p.top, 42)
    if (options.xAxis.visible) p.bottom = Math.max(p.bottom, options.xAxis.title.visible ? 62 : 42)
    if (options.yAxis.visible) {
      if (options.yAxis.position === 'right') p.right = Math.max(p.right, options.yAxis.title.visible ? 72 : 52)
      else p.left = Math.max(p.left, options.yAxis.title.visible ? 72 : 52)
    }
    if (options.legend.visible && options.legend.orientation === 'vertical') {
      if (options.legend.position.includes('right')) p.right = Math.max(p.right, 96)
      else p.left = Math.max(p.left, 96)
    }
    return p
  }

  render() {
    const options = resolveOptions(this.rawOptions)
    const measuredWidth = this.container.clientWidth || 800
    const width = typeof options.width === 'number' ? options.width : measuredWidth
    let height = typeof options.height === 'number' ? options.height : this.container.clientHeight || 320
    if (options.responsive.enabled && typeof options.width !== 'number') {
      height = Math.min(options.responsive.maxHeight, Math.max(options.responsive.minHeight, width / options.responsive.aspectRatio))
    }

    this.container.replaceChildren()
    const series = normalizeData(this.data)
    const svg = d3.select(this.container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('xmlns', 'http://www.w3.org/2000/svg')

    if (!series.length) {
      if (options.emptyState.visible) {
        svg.append('text')
          .attr('x', width / 2)
          .attr('y', height / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', options.emptyState.color)
          .attr('font-size', options.emptyState.fontSize)
          .text(options.emptyState.text)
      }
      return
    }

    const p = this.resolvePadding(options)
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
    const clipId = `waveform-clip-${this.instanceId}`
    svg.append('defs').append('clipPath').attr('id', clipId).append('rect').attr('width', innerWidth).attr('height', innerHeight)
    const plot = svg.append('g').attr('transform', `translate(${p.left},${p.top})`)

    const resolvedOptions = { ...options, padding: p }
    const ctx: RenderContext = { svg, plot, series, options: resolvedOptions, width, height, innerWidth, innerHeight, x, y, xDomain, yDomain, clipId }

    renderFrame(ctx)
    renderGrid(ctx)

    if (options.zeroLine.visible && yDomain[0] <= 0 && yDomain[1] >= 0) {
      plot.append('line')
        .attr('x1', 0).attr('x2', innerWidth)
        .attr('y1', y(0)).attr('y2', y(0))
        .attr('stroke', options.zeroLine.color)
        .attr('stroke-width', options.zeroLine.width)
        .attr('stroke-dasharray', options.zeroLine.dash)
    }

    renderSeries(ctx)
    renderAxes(ctx)
    renderLegend(ctx)

    if (options.title.visible && options.title.text) {
      const tx = options.title.align === 'left' ? p.left : options.title.align === 'right' ? width - p.right : width / 2
      svg.append('text')
        .attr('x', tx).attr('y', 24)
        .attr('text-anchor', options.title.align === 'left' ? 'start' : options.title.align === 'right' ? 'end' : 'middle')
        .attr('fill', options.title.color)
        .attr('font-size', options.title.fontSize)
        .attr('font-weight', options.title.fontWeight)
        .text(options.title.text)
    }
  }
}
