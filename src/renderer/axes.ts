import * as d3 from 'd3'
import type { AxisOptions } from '../types/options'
import type { RenderContext } from './context'
import { formatScientificAxisTick } from './formatters'

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
  return label.length * fontSize * 0.6
}

function renderYAxis(ctx: RenderContext, axisOptions: AxisOptions, scale: d3.ScaleLinear<number, number>, position: 'left' | 'right') {
  const { plot, svg, innerWidth, innerHeight, options } = ctx
  const tickValues = scale.ticks(axisOptions.tickCount ?? 6)
  const domain = scale.domain() as [number, number]
  const topTickValue = tickValues[tickValues.length - 1] ?? domain[1]
  const axis = position === 'right' ? d3.axisRight(scale) : d3.axisLeft(scale)
  axis.tickValues(tickValues)
    .tickSize(-(axisOptions.tickSize ?? 6))
    .tickPadding(axisOptions.tickPadding ?? 6)
    .tickFormat(v => axisOptions.tickFormat
      ? formatTick(axisOptions, v)
      : formatScientificAxisTick(Number(v), domain, topTickValue, axisOptions.unit))

  plot.append('g')
    .attr('class', `waveform-axis waveform-axis-y waveform-axis-y--${position}`)
    .attr('transform', position === 'right' ? `translate(${innerWidth},0)` : null)
    .call(axis)
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('path,line').attr('stroke', axisOptions.color ?? '#000000').attr('stroke-width', axisOptions.width ?? 1.3))
    .call(g => g.selectAll('text').attr('fill', axisOptions.fontColor ?? '#475569').attr('font-size', axisOptions.fontSize ?? 11))

  const titleText = axisOptions.title?.text || axisOptions.label
  if (axisOptions.title?.visible && titleText) {
    const xPos = position === 'right'
      ? options.padding.left + innerWidth + (axisOptions.title.offset || 52)
      : options.padding.left - (axisOptions.title.offset || 52)
    svg.append('text')
      .attr('transform', `translate(${xPos},${options.padding.top + innerHeight / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .attr('fill', axisOptions.title.color ?? '#334155')
      .attr('font-size', axisOptions.title.fontSize ?? 12)
      .attr('font-weight', axisOptions.title.fontWeight ?? 500)
      .text(`${titleText}${axisOptions.title.unit ? ` (${axisOptions.title.unit})` : ''}`)
  }
}

export function renderAxes(ctx: RenderContext) {
  const { plot, svg, x, y, yRight, innerHeight, innerWidth, options } = ctx
  const p = options.padding

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

  if (options.yAxis.visible) renderYAxis(ctx, options.yAxis, y, options.yAxis.position)
  if (options.secondaryYAxis.visible && yRight) renderYAxis(ctx, options.secondaryYAxis, yRight, 'right')

  const xTitleText = options.xAxis.title.text || options.xAxis.label
  if (options.xAxis.title.visible && xTitleText) {
    svg.append('text')
      .attr('x', p.left + innerWidth / 2)
      .attr('y', p.top + innerHeight + options.xAxis.title.offset)
      .attr('text-anchor', 'middle')
      .attr('fill', options.xAxis.title.color ?? '#334155')
      .attr('font-size', options.xAxis.title.fontSize ?? 12)
      .attr('font-weight', options.xAxis.title.fontWeight ?? 500)
      .text(`${xTitleText}${options.xAxis.title.unit ? ` (${options.xAxis.title.unit})` : ''}`)
  }
}
