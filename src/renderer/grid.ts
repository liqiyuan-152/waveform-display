import * as d3 from 'd3'
import type { RenderContext } from './context'

export function renderGrid(ctx: RenderContext) {
  const { plot, x, y, innerWidth, innerHeight, options } = ctx
  if (!options.grid.visible) return

  if (options.grid.x.visible) {
    plot.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(options.xAxis.tickCount).tickSize(-innerHeight).tickFormat(() => ''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('line')
        .attr('stroke', options.grid.x.color)
        .attr('stroke-width', options.grid.x.width)
        .attr('stroke-dasharray', options.grid.x.dash))
  }

  if (options.grid.y.visible) {
    plot.append('g')
      .call(d3.axisLeft(y).ticks(options.yAxis.tickCount).tickSize(-innerWidth).tickFormat(() => ''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('line')
        .attr('stroke', options.grid.y.color)
        .attr('stroke-width', options.grid.y.width)
        .attr('stroke-dasharray', options.grid.y.dash))
  }
}
