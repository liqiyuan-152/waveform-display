import { borderDash } from './helpers'
import type { RenderContext } from './context'

export function renderFrame(ctx: RenderContext) {
  const { plot, innerWidth, innerHeight, options } = ctx
  if (!options.frame.visible) return

  plot.append('rect')
    .attr('width', innerWidth)
    .attr('height', innerHeight)
    .attr('rx', options.frame.radius)
    .attr('fill', options.frame.backgroundColor)
    .attr('stroke', 'none')

  const sides = [
    ['top', 0, 0, innerWidth, 0],
    ['right', innerWidth, 0, innerWidth, innerHeight],
    ['bottom', 0, innerHeight, innerWidth, innerHeight],
    ['left', 0, 0, 0, innerHeight],
  ] as const

  sides.forEach(([name, x1, y1, x2, y2]) => {
    const side = options.frame[name]
    if (!side.visible) return
    plot.append('line')
      .attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2)
      .attr('stroke', side.color || options.frame.borderColor)
      .attr('stroke-width', side.width ?? options.frame.borderWidth)
      .attr('stroke-dasharray', borderDash(side.style || options.frame.borderStyle))
  })
}
