import { dashFor } from './helpers'
import type { RenderContext } from './context'

export function renderLegend(ctx: RenderContext) {
  const { svg, series, options, width, height } = ctx
  if (!options.legend.visible || !series.length) return

  const p = options.padding
  const lineLength = options.legend.lineLength
  const itemGap = options.legend.itemGap
  const rowHeight = options.legend.fontSize + 10
  const isRight = options.legend.position.includes('right')
  const isBottom = options.legend.position.includes('bottom')
  const horizontal = options.legend.orientation === 'horizontal'
  const group = svg.append('g').attr('class', 'waveform-legend')

  let cursorX = isRight ? width - p.right : p.left
  let cursorY = isBottom ? height - 18 : options.title.visible && options.title.text && horizontal ? 46 : 22

  if (horizontal && isRight) {
    const estimated = series.reduce((sum, s, i) => sum + (s.name || `Series ${i + 1}`).length * options.legend.fontSize * 0.6 + lineLength + 34 + itemGap, 0)
    cursorX = Math.max(p.left, width - p.right - estimated)
  }

  series.forEach((s, index) => {
    const color = s.style?.color || options.line.color
    const lineWidth = s.style?.lineWidth || options.line.width
    const lineStyle = s.style?.lineStyle || options.line.style
    const label = `${s.name || `Series ${index + 1}`}${s.unit ? ` (${s.unit})` : ''}`
    const item = group.append('g').attr('transform', `translate(${cursorX},${cursorY})`)

    item.append('line')
      .attr('x1', 0).attr('x2', lineLength)
      .attr('y1', -4).attr('y2', -4)
      .attr('stroke', color)
      .attr('stroke-width', lineWidth)
      .attr('stroke-dasharray', dashFor(lineStyle))

    item.append('text')
      .attr('x', lineLength + 8)
      .attr('fill', options.legend.color)
      .attr('font-size', options.legend.fontSize)
      .text(label)

    if (horizontal) {
      const estimatedWidth = label.length * options.legend.fontSize * 0.6 + lineLength + 16 + itemGap
      cursorX += estimatedWidth
    } else {
      cursorY += rowHeight + itemGap
    }
  })
}
