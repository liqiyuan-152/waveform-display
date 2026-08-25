import type { RenderContext } from './context'

export function renderShot(ctx: RenderContext) {
  const { svg, options, width } = ctx
  if (!options.shot.visible || !options.shot.text) return

  const x = width - options.padding.right + 4
  const y = options.padding.top

  svg.append('text')
    .attr('class', 'waveform-shot')
    .attr('x', x)
    .attr('y', y)
    .attr('transform', `rotate(-90 ${x} ${y})`)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'hanging')
    .attr('fill', options.shot.color)
    .attr('font-size', options.shot.fontSize)
    .attr('font-weight', options.shot.fontWeight)
    .attr('aria-label', `Shot ${options.shot.text}`)
    .text(options.shot.text)
}
