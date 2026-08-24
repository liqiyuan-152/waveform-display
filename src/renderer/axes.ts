import * as d3 from 'd3'
import type { AxisOptions } from '../types/options'
import type { RenderContext } from './context'

function formatTick(axis: AxisOptions, value: d3.NumberValue): string {
  const number = Number(value)
  if (typeof axis.tickFormat === 'function') return axis.tickFormat(number)
  if (axis.tickFormat) return d3.format(axis.tickFormat)(number)
  return `${number}${axis.unit ? ` ${axis.unit}` : ''}`
}

export function renderAxes(ctx: RenderContext) {
  const { plot, svg, x, y, innerHeight, innerWidth, options } = ctx
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

  if (options.yAxis.visible) {
    const axis = options.yAxis.position === 'right' ? d3.axisRight(y) : d3.axisLeft(y)
    axis.ticks(options.yAxis.tickCount)
      .tickSize(options.yAxis.tickSize)
      .tickPadding(options.yAxis.tickPadding)
      .tickFormat(v => formatTick(options.yAxis, v))

    plot.append('g')
      .attr('transform', options.yAxis.position === 'right' ? `translate(${innerWidth},0)` : null)
      .call(axis)
      .call(g => g.selectAll('path,line').attr('stroke', options.yAxis.color).attr('stroke-width', options.yAxis.width))
      .call(g => g.selectAll('text').attr('fill', options.yAxis.fontColor).attr('font-size', options.yAxis.fontSize))
  }

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

  const yTitleText = options.yAxis.title.text || options.yAxis.label
  if (options.yAxis.title.visible && yTitleText) {
    const xPos = options.yAxis.position === 'right'
      ? p.left + innerWidth + options.yAxis.title.offset
      : p.left - options.yAxis.title.offset
    svg.append('text')
      .attr('transform', `translate(${xPos},${p.top + innerHeight / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .attr('fill', options.yAxis.title.color)
      .attr('font-size', options.yAxis.title.fontSize)
      .attr('font-weight', options.yAxis.title.fontWeight)
      .text(`${yTitleText}${options.yAxis.title.unit ? ` (${options.yAxis.title.unit})` : ''}`)
  }
}
