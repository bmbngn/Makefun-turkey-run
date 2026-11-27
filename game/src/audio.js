// Gobble Run — sound: every effect is synthesised with WebAudio.
// No audio files, no network. Created lazily on the first user gesture
// (browsers block audio before one) and muted on demand.

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  try { muted = localStorage.getItem('gobble-muted') === '1'; } catch { /* storage off */ }

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq0, freq1, dur, type, vol, when = 0) {
    const c = ensure();
    if (!c || muted) return;
    const t = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, freq1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function thud() {
    const c = ensure();
    if (!c || muted) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.22);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.27);
  }

  return {
    unlock() { ensure(); },
    isMuted() { return muted; },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('gobble-muted', muted ? '1' : '0'); } catch { /* storage off */ }
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    click() { tone(700, 900, 0.06, 'sine', 0.25); },
    jump() { tone(280, 620, 0.16, 'sine', 0.35); },
    pickup() { tone(880, 880, 0.07, 'sine', 0.3); tone(1318, 1318, 0.1, 'sine', 0.3, 0.07); },
    feather() { [660, 880, 1108, 1318].forEach((f, i) => tone(f, f, 0.12, 'triangle', 0.3, i * 0.08)); },
    hit() { thud(); tone(220, 90, 0.25, 'square', 0.25); },
    gobble() {
      // Three quick descending "gob-gob-gob" blips with a wobble.
      [0, 0.14, 0.28].forEach((d, i) => {
        tone(520 - i * 60, 300 - i * 40, 0.12, 'sawtooth', 0.22, d);
      });
    },
    caught() { tone(600, 120, 0.7, 'sawtooth', 0.3); tone(300, 60, 0.8, 'triangle', 0.25, 0.1); },
    escaped() { [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.18, 'triangle', 0.3, i * 0.11)); },
  };
}
