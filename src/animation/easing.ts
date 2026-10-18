export const easings = {
  linear: (value: number) => value,
  cubicInOut: (value: number) => value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2,
}

export type AnimationEasing = keyof typeof easings | ((progress: number) => number)

export function ease(easing: AnimationEasing, progress: number): number {
  const result = (typeof easing === 'function' ? easing : easings[easing])(progress)
  if (!Number.isFinite(result)) throw new Error('Animation easing must return a finite number')
  return result
}

export function clampProgress(progress: number) { return Math.max(0, Math.min(1, progress)) }
