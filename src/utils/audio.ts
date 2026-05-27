let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // Standard AudioContext or WebkitAudioContext fallback
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSynthNote(
  noteType: 'sine' | 'square' | 'triangle' | 'sawtooth' = 'sine',
  freq = 220,
  duration = 0.5,
  resonance = 0.4
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    
    // Main oscillator
    const osc = ctx.createOscillator();
    osc.type = noteType;
    osc.frequency.setValueAtTime(freq, now);
    
    // Smooth frequency slide (glide effect mimicking digital touch instruments)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + duration);

    // Harmonic helper oscillator for rich physical body
    let subOsc: OscillatorNode | null = null;
    if (noteType !== 'sine') {
      subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq / 2, now);
    }

    // ADSR style amplitude envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(resonance * 0.4, now + 0.04); // Fast attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // Smooth release

    // Highpass or Lowpass filter to keep sound warm and avoid clicks
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + duration * 0.8);

    // Dynamic spatial delay/echo node for rich spatial vibes
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.25;
    const delayGain = ctx.createGain();
    delayGain.gain.value = 0.35;

    // Connect nodes
    osc.connect(filter);
    if (subOsc) {
      subOsc.connect(filter);
    }
    filter.connect(gainNode);

    // Delay loop
    gainNode.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(delay); // Feedback
    delayGain.connect(ctx.destination); // Spatial delay route

    gainNode.connect(ctx.destination); // Direct dry route

    osc.start(now);
    if (subOsc) {
      subOsc.start(now);
    }

    osc.stop(now + duration + 0.5);
    if (subOsc) {
      subOsc.stop(now + duration + 0.5);
    }
  } catch (error) {
    console.warn('Audio Context trigger failed or was blocked by browser policies:', error);
  }
}

// Deep atmospheric bass kick for beat visualization pulses
export function playKickPulse() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.3); // Linear sub pitch drop

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {
    // Ignore context blocks
  }
}
