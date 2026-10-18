import { describe, expect, it } from 'vitest'
import { Animation } from '../../src/animation/Animation'
import { entryClip } from '../../src/animation/presentation/clip'

describe('animation timing and entry clipping', () => {
  it('holds through delay and completes on long frames', () => {
    const animation = new Animation({ duration: 100, delay: 50, easing: 'linear' })
    expect(animation.sample(25)).toEqual({ done: false, value: 0 })
    expect(animation.sample(100)).toEqual({ done: false, value: 0.5 })
    expect(animation.sample(1000)).toEqual({ done: true, value: 1 })
  })

  it('ignores delay for zero duration and snapshots timing', () => {
    const timing = { duration: 0, delay: 100, easing: 'linear' as const }
    const animation = new Animation(timing)
    timing.duration = 500
    expect(animation.sample(0)).toEqual({ done: true, value: 1 })
  })

  it('limits clip geometry for all directions including easing overshoot', () => {
    expect(entryClip(100, 0.5, 'left-to-right')).toEqual({ x: 0, width: 50 })
    expect(entryClip(100, 0.5, 'right-to-left')).toEqual({ x: 50, width: 50 })
    expect(entryClip(100, 0.5, 'center-out')).toEqual({ x: 25, width: 50 })
    expect(entryClip(100, 2, 'center-out')).toEqual({ x: 0, width: 100 })
    expect(entryClip(100, -1, 'right-to-left')).toEqual({ x: 100, width: 0 })
  })
})
