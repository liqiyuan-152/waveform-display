import * as d3 from 'd3'
import type { AxisOptions } from '../types/options'
import type { RenderContext } from './context'

function formatTick(axis: AxisOptions, value: d3.NumberValue): string {
  const number = Number(value)
  if (typeof axis.tickFormat === 'function') return axis.tickFormat(number)
  if (axis.tickFormat) return d3.format(axis.tickFormat)(number)
  return `${number}${axis.unit ? ` ${axis.unit}` : ''}`
}

function renderYAxis(ctx: RenderContext, axisOptions: AxisOptions, scale: d3.ScaleLinear<number, number>, position: 'left' | 'right') {
  const { plot, svg, innerWidth, innerHeight, options } = ctx
  const axis = position === 'right' ? d3.axisRight(scale) : d3.axisLeft(scale)
  axis.ticks(axisOptions.tickCount)
    .tickSize(axisOptions.tickSize)
    .tickPadding(axisOptions.tickPadding)
    .tickFormat(v => formatTick(axisOptions, v))

  plot.append('g')
    .attr('transform', position === 'right' ? `translate(${innerWidth},0)` : null)
    .call(axis)
    .call(g => g.selectAll('path,line').attr('stroke', axisOptions.color).attr('stroke-width', axisOptions.width))
    .call(g => g.selectAll('text').attr('fill', axisOptions.fontColor).attr('font-size', axisOptions.fontSize))

  const titleText = axisOptions.title?.text || axisOptions.label
  if (axisOptions.title?.visible && titleText) {
    const xPos = position === 'right'
      ? options.padding.left + innerWidth + (axisOptions.title.offset || 52)
      : options.padding.left - (axisOptions.title.offset || 52)
    svg.append('text')
      .attr('transform', `translate(${xPos},${options.padding.top + innerHeight / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .attr('fill', axisOptions.title.color)
      .attr('font-size', axisOptions.title.fontSize)
      .attr('font-weight', axisOptions.title.fontWeight)
      .text(`${titleText}${axisOptions.title.unit ? ` (${axisOptions.title.unit})` : ''}`)
  }
}

export function renderAxes(ctx: RenderContext) {
  const { plot, svg, x, y, yRight, innerHeight, innerWidth, options } = ctx
  const p = options.padding

  if (options.xAxis.visible) {
    const axis = d3.axisBottom(x)
      .ticks(options.xAxis.tickCount)
      .tickSize(options.xAxis.tickSize)
      .tickPadding(options.xAxis.tickPadding)
      .tickFormat(v => formatTick(options.xAxis, v))

    plot.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(axis)
      .call(g => g.selectAll('path,line').attr('stroke', options.xAxis.color).attr('stroke-width', options.xAxis.width))
      .call(g => g.selectAll('text').attr('fill', options.xAxis.fontColor).attr('font-size', options.xAxis.fontSize))
  }

  if (options.yAxis.visible) renderYAxis(ctx, options.yAxis, y, options.yAxis.position)
  if (options.secondaryYAxis.visible && yRight) renderYAxis(ctx, options.secondaryYAxis, yRight, 'right')

  const xTitleText = options.xAxis.title.text || options.xAxis.label
  if (options.xAxis.title.visible && xTitleText) {
    svg.append('text')
      .attr('x', p.left + innerWidth / 2)
      .attr('y', p.top + innerHeight + options.xAxis.title.offset)
      .attr('text-anchor', 'middle')
      .attr('fill', options.xAxis.title.color)
      .attr('font-size', options.xAxis.title.fontSize)
      .attr('font-weight', options.xAxis.title.fontWeight)
      .text(`${xTitleText}${options.xAxis.title.unit ? ` (${options.xAxis.title.unit})` : ''}`)
  }
}
