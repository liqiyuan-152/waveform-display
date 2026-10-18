import type { AnimationDirection } from '../../types/animation.js'
import { clampProgress } from '../easing.js'

export function entryClip(width: number, progress: number, direction: AnimationDirection) {
  const visible = width * clampProgress(progress)
  return {
    x: direction === 'right-to-left' ? width - visible : direction === 'center-out' ? (width - visible) / 2 : 0,
    width: visible,
  }
}
