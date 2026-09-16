// Operation Kurup: Web Audio API Procedural Synthesizer
// Generates authentic 1980s retro thriller sounds and iconic Kerala vehicle audio
class KurupAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.engineOsc = null;
    this.engineGain = null;
    this.bgmPlaying = false;
    this.bgmTimer = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // =====================================
  // Iconic Vehicle Horns & Sounds
  // =====================================
  playHorn(type) {
    if (this.muted) return;
    this.ensureContext();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    if (type === 'ksrtc') {
      // Classic Kerala KSRTC Two-Tone Musical Air Horn
      const notes = [
        { freq: 440, time: 0, dur: 0.12 },
        { freq: 554.37, time: 0.14, dur: 0.14 },
        { freq: 659.25, time: 0.30, dur: 0.28 },
        { freq: 554.37, time: 0.60, dur: 0.25 }
      ];

      notes.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        gain.gain.setValueAtTime(0, now + n.time);
        gain.gain.linearRampToValueAtTime(0.25, now + n.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);
      });
    } else if (type === 'siren') {
      // Police Wail Siren
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(1050, now + 0.4);
      osc.frequency.linearRampToValueAtTime(650, now + 0.8);
      osc.frequency.linearRampToValueAtTime(1050, now + 1.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.3);
    } else if (type === 'thump') {
      // Royal Enfield Bullet 350 Heavy Cast-Iron Stroke Thump
      for (let i = 0; i < 4; i++) {
        const t = now + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(90, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
      }
    } else if (type === 'peep') {
      // Chetak / Autorickshaw beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(780, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } else {
      // Classic Ambassador Dual Horn (440Hz + 550Hz)
      [440, 550].forEach(f => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      });
    }
  }

  // Clue discovery chime
  playClueFound() {
    if (this.muted) return;
    this.ensureContext();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.08);
      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
    });
  }

  // Thunder sound during monsoon
  playThunder() {
    if (this.muted) return;
    this.ensureContext();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const bufferSize = ctx.sampleRate * 2.0;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.linearRampToValueAtTime(60, now + 1.8);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 2.0);
  }

  // Ability activate whoosh / whistle
  playAbility() {
    if (this.muted) return;
    this.ensureContext();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(1400, now + 0.15);
    osc.frequency.linearRampToValueAtTime(700, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Continuous vehicle engine sound
  startEngine(type = 'car') {
    if (this.muted || this.engineOsc) return;
    this.ensureContext();
    const ctx = this.ctx;

    this.engineOsc = ctx.createOscillator();
    this.engineGain = ctx.createGain();

    this.engineOsc.type = type === 'bullet' ? 'triangle' : 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(type === 'bullet' ? 45 : 65, ctx.currentTime);
    this.engineGain.gain.setValueAtTime(0.06, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, ctx.currentTime);

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(ctx.destination);

    this.engineOsc.start();
  }

  updateEngine(speed, maxSpeed) {
    if (!this.engineOsc || this.muted) return;
    const ratio = Math.min(1, Math.abs(speed) / (maxSpeed || 6));
    const targetFreq = 50 + ratio * 140;
    this.engineOsc.frequency.linearRampToValueAtTime(targetFreq, this.ctx.currentTime + 0.05);
  }

  stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch (e) {}
      this.engineOsc = null;
    }
  }

  // 1980s Retro Kerala Thriller Synth BGM
  startBgm() {
    if (this.bgmPlaying || this.muted) return;
    this.ensureContext();
    this.bgmPlaying = true;
    const bassline = [110, 110, 130.81, 110, 98, 110, 146.83, 130.81]; // A2 bass riff
    let step = 0;

    const playStep = () => {
      if (!this.bgmPlaying || this.muted) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const freq = bassline[step % bassline.length];

      // Bass synth
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);

      // Percussion Chenda thump on beat 1 and 5
      if (step % 4 === 0) {
        const drumOsc = ctx.createOscillator();
        const drumGain = ctx.createGain();
        drumOsc.type = 'sine';
        drumOsc.frequency.setValueAtTime(140, now);
        drumOsc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

        drumGain.gain.setValueAtTime(0.2, now);
        drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        drumOsc.connect(drumGain);
        drumGain.connect(ctx.destination);
        drumOsc.start(now);
        drumOsc.stop(now + 0.15);
      }

      step++;
      this.bgmTimer = setTimeout(playStep, 240);
    };

    playStep();
  }

  stopBgm() {
    this.bgmPlaying = false;
    if (this.bgmTimer) clearTimeout(this.bgmTimer);
  }
}

window.kurupAudio = new KurupAudioEngine();
