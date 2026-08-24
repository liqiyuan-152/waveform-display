import * as d3 from 'd3'
import { curveFor, dashFor } from './helpers'
import type { WaveformPoint, WaveformPointType } from '../types/data'
import type { RenderContext } from './context'

function symbolType(type: WaveformPointType) {
  if (type === 'square') return d3.symbolSquare
  if (type === 'triangle') return d3.symbolTriangle
  if (type === 'diamond') return d3.symbolDiamond
  return d3.symbolCircle
}

export function renderSeries(ctx: RenderContext) {
  const { plot, series, x, y, yRight, yDomain, yRightDomain, options, clipId } = ctx
  const layer = plot.append('g').attr('clip-path', `url(#${clipId})`)

  series.forEach(s => {
    const useRight = s.yAxis === 'right' && yRight && yRightDomain
    const yScale = useRight ? yRight : y
    const domain = useRight ? yRightDomain : yDomain
    const lineStyle = {
      color: options.line.color,
      lineWidth: options.line.width,
      lineType: options.line.type,
      lineStyle: options.line.style,
      opacity: options.line.opacity,
      ...s.style,
    }
    const areaStyle = { ...options.area, ...s.style?.area }

    if (areaStyle.visible) {
      const baseline = Math.min(domain[1], Math.max(domain[0], areaStyle.baseline))
      const area = d3.area<WaveformPoint>()
        .defined(d => Number.isFinite(d.x) && Number.isFinite(d.y))
        .x(d => x(d.x))
        .y0(yScale(baseline))
        .y1(d => yScale(d.y))
        .curve(curveFor(lineStyle.lineType))

      layer.append('path')
        .datum(s.data)
        .attr('d', area)
        .attr('fill', areaStyle.color || lineStyle.color)
        .attr('fill-opacity', areaStyle.opacity)
    }

    if (options.line.visible) {
      const line = d3.line<WaveformPoint>()
        .defined(d => Number.isFinite(d.x) && Number.isFinite(d.y))
        .x(d => x(d.x))
        .y(d => yScale(d.y))
        .curve(curveFor(lineStyle.lineType))

      layer.append('path')
        .datum(s.data)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', lineStyle.color)
        .attr('stroke-width', lineStyle.lineWidth)
        .attr('stroke-opacity', lineStyle.opacity)
        .attr('stroke-dasharray', dashFor(lineStyle.lineStyle))
        .attr('vector-effect', 'non-scaling-stroke')
    }

    const pointStyle = { ...options.point, ...s.style?.point }
    if (pointStyle.visible) {
      const symbol = d3.symbol().type(symbolType(pointStyle.type)).size(pointStyle.size * pointStyle.size * 4)
      layer.append('g')
        .selectAll('path')
        .data(s.data.filter(d => Number.isFinite(d.x) && Number.isFinite(d.y)))
        .join('path')
        .attr('transform', d => `translate(${x(d.x)},${yScale(d.y)})`)
        .attr('d', symbol)
        .attr('fill', pointStyle.color || lineStyle.color)
        .attr('stroke', pointStyle.borderColor)
        .attr('stroke-width', pointStyle.borderWidth)
    }
  })
}
