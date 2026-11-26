// Royalty-free soft acoustic/music-box instrumental BGM synthesized via Web Audio API

// Gentle warm C major / F major / G7 / Am storybook progression (frequencies in Hz)
const MELODY_PATTERN: number[] = [
  523.25, 659.25, 783.99, 659.25, // C5 E5 G5 E5
  587.33, 698.46, 880.0, 698.46,  // D5 F5 A5 F5
  493.88, 587.33, 783.99, 587.33, // B4 D5 G5 D5
  523.25, 659.25, 783.99, 1046.5, // C5 E5 G5 C6
  440.0, 523.25, 659.25, 523.25,  // A4 C5 E5 C5
  349.23, 440.0, 523.25, 698.46,  // F4 A4 C5 F5
  392.0, 493.88, 587.33, 783.99,  // G4 B4 D5 G5
  523.25, 659.25, 783.99, 659.25, // C5 E5 G5 E5
];

const BASS_PATTERN: number[] = [
  261.63, // C4
  174.61, // F3
  196.0,  // G3
  261.63, // C4
  220.0,  // A3
  174.61, // F3
  196.0,  // G3
  261.63, // C4
];

const STEP_SEC = 0.42;

export function scheduleBgmOnAudioContext(
  ctx: AudioContext,
  destination: AudioNode,
  startTime: number,
  durationSec: number,
  volume = 0.16
): () => void {
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume, startTime);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2200, startTime);

  masterGain.connect(filter);
  filter.connect(destination);

  const nodes: AudioNode[] = [masterGain, filter];
  const totalSteps = Math.floor(durationSec / STEP_SEC);

  for (let i = 0; i < totalSteps; i++) {
    const t = startTime + i * STEP_SEC;
    const noteFreq = MELODY_PATTERN[i % MELODY_PATTERN.length];

    // Gentle music-box / nylon-pluck note
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(noteFreq, t);

    noteGain.gain.setValueAtTime(0.0001, t);
    noteGain.gain.linearRampToValueAtTime(0.35, t + 0.025);
    noteGain.gain.exponentialRampToValueAtTime(0.001, t + STEP_SEC * 1.45);

    osc.connect(noteGain);
    noteGain.connect(masterGain);
    osc.start(t);
    osc.stop(t + STEP_SEC * 1.5);
    nodes.push(osc, noteGain);

    // Warm soft acoustic bass root every 4 steps
    if (i % 4 === 0) {
      const bassIdx = Math.floor(i / 4) % BASS_PATTERN.length;
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = "sine";
      bassOsc.frequency.setValueAtTime(BASS_PATTERN[bassIdx], t);

      bassGain.gain.setValueAtTime(0.0001, t);
      bassGain.gain.linearRampToValueAtTime(0.28, t + 0.05);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + STEP_SEC * 3.8);

      bassOsc.connect(bassGain);
      bassGain.connect(masterGain);
      bassOsc.start(t);
      bassOsc.stop(t + STEP_SEC * 3.9);
      nodes.push(bassOsc, bassGain);
    }
  }

  return () => {
    try {
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
    } catch {
      // Ignore closed context errors
    }
  };
}

export class BgmController {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private timerId: number | null = null;
  private stepIndex = 0;
  private enabled = true;
  private playing = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.value = this.enabled ? 0.16 : 0;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 2100;

      master.connect(filter);
      filter.connect(ctx.destination);

      this.ctx = ctx;
      this.gain = master;
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private playStep() {
    const ctx = this.ctx;
    const master = this.gain;
    if (!ctx || !master || !this.playing || !this.enabled) return;

    const now = ctx.currentTime;
    const freq = MELODY_PATTERN[this.stepIndex % MELODY_PATTERN.length];

    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);

    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(0.35, now + 0.025);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + STEP_SEC * 1.45);

    osc.connect(noteGain);
    noteGain.connect(master);
    osc.start(now);
    osc.stop(now + STEP_SEC * 1.5);

    if (this.stepIndex % 4 === 0) {
      const bassIdx = Math.floor(this.stepIndex / 4) % BASS_PATTERN.length;
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = "sine";
      bassOsc.frequency.setValueAtTime(BASS_PATTERN[bassIdx], now);

      bassGain.gain.setValueAtTime(0.0001, now);
      bassGain.gain.linearRampToValueAtTime(0.28, now + 0.05);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + STEP_SEC * 3.8);

      bassOsc.connect(bassGain);
      bassGain.connect(master);
      bassOsc.start(now);
      bassOsc.stop(now + STEP_SEC * 3.9);
    }

    this.stepIndex += 1;
  }

  start(resetPhrase = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (resetPhrase) this.stepIndex = 0;
    this.playing = true;

    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }
    this.playStep();
    this.timerId = window.setInterval(() => {
      this.playStep();
    }, STEP_SEC * 1000);
  }

  stop() {
    this.playing = false;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  setEnabled(next: boolean) {
    this.enabled = next;
    if (this.gain && this.ctx) {
      this.gain.gain.setValueAtTime(next ? 0.16 : 0, this.ctx.currentTime);
    }
  }

  destroy() {
    this.stop();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
      this.gain = null;
    }
  }
}
