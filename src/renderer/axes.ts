import * as d3 from 'd3'
import type { AxisOptions } from '../types/options'
import type { RenderContext } from './context'
import { formatScientificAxisTick } from './formatters'
import { yAxisTickValues } from './helpers'

function formatTick(axis: AxisOptions, value: d3.NumberValue): string {
  const number = Number(value)
  if (typeof axis.tickFormat === 'function') return axis.tickFormat(number)
  if (axis.tickFormat) return d3.format(axis.tickFormat)(number)
  return `${number}${axis.unit ? ` ${axis.unit}` : ''}`
}

function isDomainEndpoint(value: number, domain: [number, number]): boolean {
  const tolerance = Math.max(1, Math.abs(domain[1] - domain[0])) * Number.EPSILON * 8
  return Math.abs(value - domain[0]) <= tolerance || Math.abs(value - domain[1]) <= tolerance
}

function estimateLabelWidth(label: string, fontSize: number): number {
  return Math.max(...label.split('\n').map(line => line.length * fontSize * 0.6))
}

function estimateYAxisLabelWidth(label: string, fontSize: number): number {
  return Math.max(...label.split('\n').map(line => line.length * fontSize * 0.5))
}

function renderMultilineTickLabels(axisGroup: d3.Selection<SVGGElement, unknown, null, undefined>) {
  axisGroup.selectAll<SVGTextElement, unknown>('.tick text').each(function () {
    const lines = (this.textContent ?? '').split('\n')
    if (lines.length < 2) return

    const text = d3.select(this)
    const x = text.attr('x') ?? '0'
    text.text(null)
    lines.forEach((line, index) => {
      text.append('tspan')
        .attr('x', x)
        .attr('dy', index === 0 ? '0em' : '1em')
        .text(line)
    })
  })
}

export function formatYAxisTick(axis: AxisOptions, value: number, domain: [number, number]): string {
  return axis.tickFormat
    ? formatTick(axis, value)
    : formatScientificAxisTick(
        value,
        domain,
        domain[1],
        axis.unit,
      )
}

export function estimateYAxisFootprint(axis: AxisOptions, domain: [number, number]): number {
  const labels = yAxisTickValues(domain, axis.tickCount ?? 6)
    .map(value => formatYAxisTick(axis, value, domain))
  const labelWidth = Math.max(0, ...labels.map(label => estimateYAxisLabelWidth(label, axis.fontSize ?? 11)))
  const tickFootprint = (axis.tickSize ?? 6) + (axis.tickPadding ?? 6) + labelWidth
  const titleFootprint = axis.title?.visible && (axis.title.text || axis.label)
    ? (axis.title.offset ?? 52) + (axis.title.fontSize ?? 12) / 2
    : 0
  return Math.max(tickFootprint, titleFootprint)
}

function renderYAxis(ctx: RenderContext, valueAxis: RenderContext['yAxes'][number]) {
  const { plot, svg, innerWidth, innerHeight, options } = ctx
  const { options: axisOptions, scale, domain, offset } = valueAxis
  const position = axisOptions.position
  const tickValues = yAxisTickValues(domain, axisOptions.tickCount ?? 6)
  const endTickValue = domain[1]
  const axis = position === 'right' ? d3.axisRight(scale) : d3.axisLeft(scale)
  axis.tickValues(tickValues)
    .tickSize(-(axisOptions.tickSize ?? 6))
    .tickPadding(axisOptions.tickPadding ?? 6)
    .tickFormat(v => formatYAxisTick(axisOptions, Number(v), domain))

  const axisX = position === 'right' ? innerWidth + offset : -offset

  const axisGroup = plot.append('g')
    .attr('class', `waveform-axis waveform-axis-y waveform-axis-y--${position}`)
    .attr('data-axis-id', axisOptions.id)
    .attr('transform', axisX === 0 ? null : `translate(${axisX},0)`)
    .call(axis)
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('path,line').attr('stroke', axisOptions.color ?? '#000000').attr('stroke-width', axisOptions.width ?? 1.3))
    .call(g => g.selectAll('text').attr('fill', axisOptions.fontColor ?? '#475569').attr('font-size', axisOptions.fontSize ?? 11))

  renderMultilineTickLabels(axisGroup)

  axisGroup.selectAll<SVGGElement, number>('.tick')
    .filter(value => value === endTickValue)
    .select('text')
    .classed('waveform-axis-y-end-value', true)

  const titleText = axisOptions.title?.text || axisOptions.label
  if (axisOptions.title?.visible && titleText) {
    const xPos = position === 'right'
      ? options.padding.left + innerWidth + offset + (axisOptions.title.offset ?? 52)
      : options.padding.left - offset - (axisOptions.title.offset ?? 52)
    svg.append('text')
      .attr('class', 'waveform-axis-y-title')
      .attr('data-axis-id', axisOptions.id)
      .attr('transform', `translate(${xPos},${options.padding.top + innerHeight / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .attr('fill', axisOptions.title.color ?? '#334155')
      .attr('font-size', axisOptions.title.fontSize ?? 12)
      .attr('font-weight', axisOptions.title.fontWeight ?? 500)
      .text(`${titleText}${axisOptions.title.unit ? ` (${axisOptions.title.unit})` : ''}`)
  }
}

export function renderAxes(ctx: RenderContext) {
  const { plot, x, yAxes, innerHeight, innerWidth, options } = ctx

  if (options.xAxis.visible) {
    const domain = x.domain() as [number, number]
    const xTicks = x.ticks(options.xAxis.tickCount ?? 8)
    const endpointLabels = {
      start: formatTick(options.xAxis, domain[0]),
      end: formatTick(options.xAxis, domain[1]),
    }
    const fontSize = options.xAxis.fontSize ?? 11
    const labelGap = options.xAxis.tickPadding ?? 6
    const leftClearance = estimateLabelWidth(endpointLabels.start, fontSize) + labelGap
    const rightClearance = estimateLabelWidth(endpointLabels.end, fontSize) + labelGap
    const visibleXTicks = xTicks.filter((tick) => {
      if (options.xAxis.hideEndTicks && isDomainEndpoint(tick, domain)) return false
      if (!options.xAxis.showEndValues) return true
      const position = x(tick)
      return position > leftClearance && position < innerWidth - rightClearance
    })
    const axis = d3.axisBottom(x)
      .tickValues(visibleXTicks)
      .tickSize(-(options.xAxis.tickSize ?? 6))
      .tickPadding(options.xAxis.tickPadding ?? 6)
      .tickFormat(v => formatTick(options.xAxis, v))

    plot.append('g')
      .attr('class', 'waveform-axis waveform-axis-x')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(axis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('path,line').attr('stroke', options.xAxis.color ?? '#000000').attr('stroke-width', options.xAxis.width ?? 1.3))
      .call(g => g.selectAll('text').attr('fill', options.xAxis.fontColor ?? '#475569').attr('font-size', options.xAxis.fontSize ?? 11))

    if (options.xAxis.showEndValues) {
      const endpointGroup = plot.append('g')
        .attr('class', 'waveform-axis-x-endpoints')
        .attr('transform', `translate(0,${innerHeight})`)
        .attr('font-family', 'sans-serif')
        .attr('font-size', fontSize)
        .attr('fill', options.xAxis.fontColor ?? '#475569')

      endpointGroup.append('text')
        .attr('class', 'waveform-axis-x-endpoint waveform-axis-x-endpoint--start')
        .attr('x', 0)
        .attr('y', labelGap)
        .attr('dy', '0.71em')
        .attr('text-anchor', 'start')
        .text(endpointLabels.start)

      endpointGroup.append('text')
        .attr('class', 'waveform-axis-x-endpoint waveform-axis-x-endpoint--end')
        .attr('x', innerWidth)
        .attr('y', labelGap)
        .attr('dy', '0.71em')
        .attr('text-anchor', 'end')
        .text(endpointLabels.end)
    }
  }

  yAxes.filter(axis => axis.options.visible).forEach(axis => renderYAxis(ctx, axis))
}
