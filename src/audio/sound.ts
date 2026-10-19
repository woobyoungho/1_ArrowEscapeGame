/**
 * 효과음. 음원 파일 없이 Web Audio로 직접 합성한다.
 * 브라우저는 사용자가 화면을 누른 뒤에만 소리를 허용하므로, 첫 탭에서 AudioContext를 만든다.
 */
export class Sound {
  private ctx: AudioContext | null = null;

  constructor(public muted: boolean) {}

  private context(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType, volume: number, delay = 0, slideTo?: number): void {
    const ctx = this.context();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  /** 블록 탈출. 연속으로 뺄수록 음이 반음씩 올라간다 */
  escape(combo: number): void {
    const step = Math.min(combo - 1, 12);
    const freq = 520 * Math.pow(2, step / 12);
    this.tone(freq, 0.12, 'triangle', 0.22, 0, freq * 1.5);
  }

  blocked(): void {
    this.tone(140, 0.2, 'square', 0.12, 0, 90);
  }

  clear(): void {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.2, i * 0.09));
  }

  fail(): void {
    [392, 330, 262].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.18, i * 0.13));
  }
}
