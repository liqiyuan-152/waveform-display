import { dashFor } from './helpers'
import type { WaveformSeries } from '../types/data'
import type { RenderContext } from './context'

interface LegendSeries {
  key: string
  series: WaveformSeries
  visible: boolean
}

function normalizeShot(shot: WaveformSeries['shot']): string | undefined {
  if (typeof shot === 'number') return Number.isFinite(shot) ? String(shot) : undefined
  const value = shot?.trim()
  return value || undefined
}

export function renderLegend(ctx: RenderContext, legendSeries: LegendSeries[], onToggle: (key: string) => void) {
  const { svg, options, width, height } = ctx
  if (!options.legend.visible || !legendSeries.length) return

  const p = options.padding
  const lineLength = options.legend.lineLength
  const itemGap = options.legend.itemGap
  const rowHeight = options.legend.fontSize + 10
  const isRight = options.legend.position.includes('right')
  const isBottom = options.legend.position.includes('bottom')
  const horizontal = options.legend.orientation === 'horizontal'
  const group = svg.append('g').attr('class', 'waveform-legend')
  const shots = legendSeries.map(item => normalizeShot(item.series.shot))
  const multipleShots = new Set(shots.filter((shot): shot is string => shot !== undefined)).size > 1
  const labels = legendSeries.map((item, index) => {
    const name = item.series.name || `Series ${index + 1}`
    return multipleShots && shots[index] ? `${name} (${shots[index]})` : name
  })

  let cursorX = isRight ? width - p.right : p.left
  let cursorY = isBottom ? height - 18 : options.title.visible && options.title.text && horizontal ? 46 : 22

  if (horizontal && isRight) {
    const estimated = legendSeries.reduce((sum, _item, index) => {
      const label = labels[index]
      return sum + label.length * options.legend.fontSize * 0.6 + lineLength + 34 + itemGap
    }, 0)
    cursorX = Math.max(p.left, width - p.right - estimated)
  }

  legendSeries.forEach(({ key, series: s, visible }, index) => {
    const color = s.style?.color || options.line.color
    const lineWidth = s.style?.lineWidth || options.line.width
    const lineStyle = s.style?.lineStyle || options.line.style
    const label = labels[index]
    const estimatedWidth = label.length * options.legend.fontSize * 0.6 + lineLength + 16
    const item = group.append('g')
      .attr('class', 'waveform-legend-item')
      .attr('data-series-key', key)
      .attr('transform', `translate(${cursorX},${cursorY})`)
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('aria-label', label)
      .attr('aria-pressed', visible ? 'true' : 'false')
      .style('cursor', 'pointer')
      .style('outline', 'none')
      .on('click', () => onToggle(key))
      .on('keydown', (event: KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        onToggle(key)
      })

    item.append('rect')
      .attr('x', -4)
      .attr('y', -rowHeight + 4)
      .attr('width', estimatedWidth + 8)
      .attr('height', rowHeight)
      .attr('fill', 'transparent')

    item.append('line')
      .attr('x1', 0).attr('x2', lineLength)
      .attr('y1', -4).attr('y2', -4)
      .attr('stroke', color)
      .attr('stroke-width', lineWidth)
      .attr('stroke-dasharray', dashFor(lineStyle))
      .attr('opacity', visible ? 1 : 0.35)

    item.append('text')
      .attr('x', lineLength + 8)
      .attr('fill', options.legend.color)
      .attr('font-size', options.legend.fontSize)
      .attr('opacity', visible ? 1 : 0.35)
      .text(label)

    if (horizontal) {
      cursorX += estimatedWidth + itemGap
    } else {
      cursorY += rowHeight + itemGap
    }
  })
}
