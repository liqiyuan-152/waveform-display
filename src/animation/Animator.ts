export interface AnimationClock {
  now(): number
  request(callback: (time: number) => void): number
  cancel(handle: number): void
}

/** One frame source per chart; paused time never contributes to elapsed time. */
export class Animator {
  private handle?: number
  private callback?: (elapsed: number) => void
  private elapsed = 0
  private lastTime = 0
  private readonly pauses = new Set<string>()
  private version = 0

  constructor(private readonly clock: AnimationClock, private readonly onError: (error: unknown) => void) {}

  start(callback: (elapsed: number) => void) {
    this.stop()
    this.callback = callback
    this.lastTime = this.clock.now()
    this.schedule()
  }

  stop() {
    ++this.version
    if (this.handle !== undefined) this.clock.cancel(this.handle)
    this.handle = undefined
    this.callback = undefined
    this.elapsed = 0
  }

  pause(reason: string) {
    if (this.pauses.has(reason)) return
    if (!this.pauses.size && this.callback) this.elapsed += Math.max(0, this.clock.now() - this.lastTime)
    this.pauses.add(reason)
    if (this.handle !== undefined) this.clock.cancel(this.handle)
    this.handle = undefined
  }

  resume(reason: string) {
    if (!this.pauses.delete(reason) || this.pauses.size) return
    this.lastTime = this.clock.now()
    this.schedule()
  }

  isRunning() { return !!this.callback }

  private schedule() {
    if (this.handle !== undefined || !this.callback || this.pauses.size) return
    const version = this.version
    this.handle = this.clock.request(time => {
      if (version !== this.version) return
      this.handle = undefined
      this.elapsed += Math.max(0, time - this.lastTime)
      this.lastTime = time
      try { this.callback?.(this.elapsed) } catch (error) {
        // A callback may replace the active run before throwing.
        if (version === this.version) this.stop()
        this.onError(error)
      }
      if (version === this.version) this.schedule()
    })
  }
}
