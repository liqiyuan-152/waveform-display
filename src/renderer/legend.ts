import type { RenderContext } from './context'

export function renderLegend(ctx: RenderContext) {
  const { svg, series, options, width } = ctx
  if (!options.legend.visible || !series.length) return

  const p = options.padding
  const itemGap = options.legend.itemGap
  const rowHeight = options.legend.fontSize + 8
  const group = svg.append('g')
  let x = options.legend.position.includes('right') ? width - p.right : p.left
  let y = options.legend.position.includes('bottom') ? ctx.height - 16 : 18

  if (options.legend.position.includes('right')) group.attr('text-anchor', 'end')

  series.forEach((s, index) => {
    const color = s.style?.color || options.line.color
    const label = `${s.name || `Series ${index + 1}`}${s.unit ? ` (${s.unit})` : ''}`
    const item = group.append('g').attr('transform', `translate(${x},${y + index * rowHeight})`)

    if (options.legend.position.includes('right')) {
      item.append('line').attr('x1', -28).attr('x2', -8).attr('y1', -4).attr('y2', -4).attr('stroke', color).attr('stroke-width', 2)
      item.append('text').attr('x', -34).attr('fill', options.legend.color).attr('font-size', options.legend.fontSize).text(label)
    } else {
      item.append('line').attr('x1', 0).attr('x2', 20).attr('y1', -4).attr('y2', -4).attr('stroke', color).attr('stroke-width', 2)
      item.append('text').attr('x', 26 + itemGap).attr('fill', options.legend.color).attr('font-size', options.legend.fontSize).text(label)
    }
  })
}
