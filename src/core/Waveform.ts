import * as d3 from 'd3'
import { resolveOptions, type ResolvedValueAxisOptions } from '../config/resolve'
import { normalizeData } from './normalize'
import { applyXDomainStrategy } from './domain'
import { renderFrameBackground, renderFrameBorder } from '../renderer/frame'
import { renderGrid } from '../renderer/grid'
import { renderSeries } from '../renderer/series'
import { estimateYAxisFootprint, renderAxes } from '../renderer/axes'
import { renderLegend } from '../renderer/legend'
import { renderXMetadata, xMetadataWidth } from '../renderer/xMetadata'
import type { RenderContext, ResolvedValueAxis } from '../renderer/context'
import type { WaveformData, WaveformSeries } from '../types/data'
import type { PaddingOptions, WaveformOptions } from '../types/options'

let instanceCounter = 0
const VALUE_AXIS_GAP = 0

interface KeyedSeries {
  key: string
  series: WaveformSeries
}

export class Waveform {
  private container: HTMLElement
  private data: WaveformData
  private rawOptions: WaveformOptions
  private readonly hiddenSeriesKeys = new Set<string>()
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
      frame: { ...base.frame, ...next.frame },
      line: { ...base.line, ...next.line },
      point: { ...base.point, ...next.point },
      xDomainStrategy: {
        ...base.xDomainStrategy,
        ...next.xDomainStrategy,
        type: next.xDomainStrategy?.type ?? base.xDomainStrategy?.type ?? 'data',
      },
      xAxis: { ...base.xAxis, ...next.xAxis, title: { ...base.xAxis?.title, ...next.xAxis?.title } },
      yAxis: { ...base.yAxis, ...next.yAxis, title: { ...base.yAxis?.title, ...next.yAxis?.title } },
      secondaryYAxis: { ...base.secondaryYAxis, ...next.secondaryYAxis, title: { ...base.secondaryYAxis?.title, ...next.secondaryYAxis?.title } },
      yAxes: next.yAxes ?? base.yAxes,
      grid: { ...base.grid, ...next.grid, x: { ...base.grid?.x, ...next.grid?.x }, y: { ...base.grid?.y, ...next.grid?.y } },
      zeroLine: { ...base.zeroLine, ...next.zeroLine },
      title: { ...base.title, ...next.title },
      shot: { ...base.shot, ...next.shot },
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

  private resolvePadding(
    options: ReturnType<typeof resolveOptions>,
    valueAxes: Array<{ options: ResolvedValueAxisOptions; offset: number; footprint: number }>,
  ): Required<PaddingOptions> {
    const p = { ...options.padding }
    if (!options.layout.autoPadding) return p

    if (options.title.visible && options.title.text) p.top = Math.max(p.top, 42)
    if (
      options.title.visible && options.title.text &&
      options.legend.visible && options.legend.orientation === 'horizontal' &&
      options.legend.position.startsWith('top')
    ) p.top = Math.max(p.top, 64)
    if (options.xAxis.visible) p.bottom = Math.max(p.bottom, 42)
    const leftExtent = Math.max(0, ...valueAxes
      .filter(axis => axis.options.visible && axis.options.position === 'left')
      .map(axis => axis.offset + axis.footprint))
    const rightExtent = Math.max(0, ...valueAxes
      .filter(axis => axis.options.visible && axis.options.position === 'right')
      .map(axis => axis.offset + axis.footprint))
    if (leftExtent) p.left = Math.max(p.left, Math.ceil(leftExtent + 8))
    if (rightExtent) p.right = Math.max(p.right, Math.ceil(rightExtent + 8))
    const rightLegendExtent = options.legend.visible && options.legend.orientation === 'vertical' && options.legend.position.includes('right')
      ? 96
      : 0
    const metadataWidth = xMetadataWidth(options)
    if (metadataWidth) {
      const rightContentExtent = Math.max(rightExtent, rightLegendExtent)
      p.right = Math.max(
        p.right,
        Math.ceil(rightContentExtent + options.xAxis.title.offset + metadataWidth + 2),
      )
    }
    if (options.legend.visible && options.legend.orientation === 'vertical') {
      if (options.legend.position.includes('right')) p.right = Math.max(p.right, 96)
      else p.left = Math.max(p.left, 96)
    }
    return p
  }

  private resolveDomain(values: number[], min?: number, max?: number): [number, number] {
    if (!values.length) {
      if (Number.isFinite(min) && Number.isFinite(max)) {
        if (min === max) return [min! - 1, max! + 1]
        return [min!, max!]
      }
      if (Number.isFinite(min)) return [min!, min! + 1]
      if (Number.isFinite(max)) return [max! - 1, max!]
      return [0, 1]
    }
    const extent = d3.extent(values) as [number | undefined, number | undefined]
    let start = Number.isFinite(min) ? min! : (extent[0] ?? 0)
    let end = Number.isFinite(max) ? max! : (extent[1] ?? 1)
    if (start === end) { start -= 1; end += 1 }
    return [start, end]
  }

  private resolveValueAxes(series: WaveformSeries[], options: ReturnType<typeof resolveOptions>) {
    const primaryId = options.yAxes[0].id
    const axisIds = new Set(options.yAxes.map(axis => axis.id))
    const valuesByAxis = new Map(options.yAxes.map(axis => [axis.id, [] as number[]]))

    for (const item of series) {
      const axisId = item.yAxis && axisIds.has(item.yAxis) ? item.yAxis : primaryId
      valuesByAxis.get(axisId)!.push(...item.data.map(point => point.y))
    }

    const offsets = { left: 0, right: 0 }
    return options.yAxes.map((axis) => {
      const domain = this.resolveDomain(valuesByAxis.get(axis.id) ?? [], axis.min, axis.max)
      const footprint = estimateYAxisFootprint(axis, domain)
      const offset = axis.visible ? offsets[axis.position] : 0
      if (axis.visible) offsets[axis.position] += footprint + VALUE_AXIS_GAP
      return { options: axis, domain, offset, footprint }
    })
  }

  private keySeries(series: WaveformSeries[]): KeyedSeries[] {
    const idOccurrences = new Map<string, number>()

    return series.map((item, index) => {
      const id = item.id?.trim()
      if (!id) return { key: `index:${index}`, series: item }

      const occurrence = idOccurrences.get(id) ?? 0
      idOccurrences.set(id, occurrence + 1)
      return { key: `id:${id}:${occurrence}`, series: item }
    })
  }

  private toggleSeries(key: string) {
    if (this.hiddenSeriesKeys.has(key)) this.hiddenSeriesKeys.delete(key)
    else this.hiddenSeriesKeys.add(key)
    this.render()
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
    const keyedSeries = this.keySeries(series)
    const currentSeriesKeys = new Set(keyedSeries.map(item => item.key))
    for (const key of this.hiddenSeriesKeys) {
      if (!currentSeriesKeys.has(key)) this.hiddenSeriesKeys.delete(key)
    }
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

    const visibleSeries = keyedSeries
      .filter(item => !this.hiddenSeriesKeys.has(item.key))
      .map(item => item.series)

    const primaryAxisId = options.yAxes[0].id
    const axisById = new Map(options.yAxes.map(axis => [axis.id, axis]))
    const seriesAxisId = (item: WaveformSeries) => item.yAxis && axisById.has(item.yAxis) ? item.yAxis : primaryAxisId
    const visibleAxisIds = new Set(visibleSeries.map(seriesAxisId))
    const displayedAxisByPosition = new Map<'left' | 'right', string>()
    for (const axis of options.yAxes) {
      if (!axis.visible || !visibleAxisIds.has(axis.id) || displayedAxisByPosition.has(axis.position)) continue
      displayedAxisByPosition.set(axis.position, axis.id)
    }
    const axisAliases = new Map<string, string>()
    for (const axis of options.yAxes) {
      if (!axis.visible || !visibleAxisIds.has(axis.id)) continue
      const displayedAxisId = displayedAxisByPosition.get(axis.position)
      if (displayedAxisId) axisAliases.set(axis.id, displayedAxisId)
    }
    const plottedSeries = visibleSeries.map((item) => {
      const displayedAxisId = axisAliases.get(seriesAxisId(item))
      return displayedAxisId && displayedAxisId !== item.yAxis ? { ...item, yAxis: displayedAxisId } : item
    })
    const displayedAxisIds = new Set(displayedAxisByPosition.values())
    const effectiveOptions = {
      ...options,
      yAxes: options.yAxes.map(axis => ({
        ...axis,
        visible: displayedAxisIds.has(axis.id),
      })),
      legend: { ...options.legend, visible: options.legend.visible && series.length > 1 },
    }
    const valueAxisLayouts = this.resolveValueAxes(plottedSeries, effectiveOptions)
    const p = this.resolvePadding(effectiveOptions, valueAxisLayouts)
    const innerWidth = Math.max(1, width - p.left - p.right)
    const innerHeight = Math.max(1, height - p.top - p.bottom)
    const points = visibleSeries.flatMap(s => s.data)
    const rawXDomain = this.resolveDomain(points.map(d => d.x), options.xAxis.min, options.xAxis.max)
    const hasExplicitXDomain = Number.isFinite(options.xAxis.min) || Number.isFinite(options.xAxis.max)
    const xDomain = applyXDomainStrategy(rawXDomain, options.xDomainStrategy, hasExplicitXDomain)

    const x = d3.scaleLinear().domain(xDomain).range([0, innerWidth])
    const yAxes: ResolvedValueAxis[] = valueAxisLayouts.map(axis => ({
      ...axis,
      scale: d3.scaleLinear().domain(axis.domain).range([innerHeight, 0]),
    }))
    const yAxisById = new Map(yAxes.map(axis => [axis.options.id, axis]))
    for (const [axisId, displayedAxisId] of axisAliases) {
      const displayedAxis = yAxisById.get(displayedAxisId)
      if (displayedAxis) yAxisById.set(axisId, displayedAxis)
    }
    const primaryYAxis = yAxes.find(axis => axis.options.visible) ?? yAxes[0]
    const clipId = `waveform-clip-${this.instanceId}`
    svg.append('defs').append('clipPath').attr('id', clipId).append('rect').attr('width', innerWidth).attr('height', innerHeight)
    const plot = svg.append('g').attr('transform', `translate(${p.left},${p.top})`)

    const resolvedOptions = { ...effectiveOptions, padding: p }
    const ctx: RenderContext = {
      svg, plot, series: plottedSeries, options: resolvedOptions, width, height, innerWidth, innerHeight,
      x, yAxes, yAxisById, primaryYAxis, xDomain, clipId,
    }

    renderFrameBackground(ctx)
    renderGrid(ctx)

    const zeroAxis = yAxisById.get(options.zeroLine.axisId ?? '') ?? primaryYAxis
    if (options.zeroLine.visible && zeroAxis.domain[0] <= 0 && zeroAxis.domain[1] >= 0) {
      plot.append('line')
        .attr('class', 'waveform-zero-line')
        .attr('data-axis-id', zeroAxis.options.id)
        .attr('x1', 0).attr('x2', innerWidth)
        .attr('y1', zeroAxis.scale(0)).attr('y2', zeroAxis.scale(0))
        .attr('stroke', options.zeroLine.color)
        .attr('stroke-width', options.zeroLine.width)
        .attr('stroke-dasharray', options.zeroLine.dash)
    }

    renderAxes(ctx)
    renderFrameBorder(ctx)
    renderSeries(ctx)
    renderLegend(
      ctx,
      keyedSeries.map(item => ({
        ...item,
        visible: !this.hiddenSeriesKeys.has(item.key),
      })),
      key => this.toggleSeries(key),
    )
    renderXMetadata(ctx)

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
