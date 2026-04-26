class SoundEngine {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.initialized = false;
    this.bgMusicNodes = null;
    this.gameMusicNodes = null;
    this.twinkleTimeout = null;
  }

  async init() {
    if (this.initialized) {
      await this.resume();
      return;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      this.initialized = true;
      console.log('🔊 SoundEngine initialized');
      this.startBackgroundMusic();
    } catch (e) {
      console.warn('Audio not supported:', e);
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      return this.audioContext.resume();
    }
    return Promise.resolve();
  }

  playTone(frequency, duration = 0.1, type = 'sine', volume = 0.15) {
    if (!this.enabled || !this.audioContext) return;
    this.resume();
    try {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      osc.start();
      osc.stop(this.audioContext.currentTime + duration);
    } catch (e) {}
  }

  // --- EFECTOS DE SONIDO ---
  playClick() { this.playTone(1200, 0.07, 'sine', 0.25); }
  playStep() { this.playTone(220, 0.1, 'triangle', 0.3); }
  playHover() { this.playTone(900, 0.03, 'sine', 0.12); }

  playError() {
    this.playTone(150, 0.4, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(100, 0.5, 'sawtooth', 0.1), 250);
  }

  playSuccess() {
    const notes = [523.25, 659.25, 783.99, 987.77];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.1), i * 60);
    });
  }

  playLevelComplete() {
    const fanfare = [
      { f: 523.25, d: 0.15, t: 0 },
      { f: 659.25, d: 0.15, t: 100 },
      { f: 783.99, d: 0.15, t: 200 },
      { f: 1046.50, d: 0.4, t: 300 },
      { f: 1318.51, d: 0.6, t: 450 },
    ];
    fanfare.forEach(n => {
      setTimeout(() => {
        this.playTone(n.f, n.d, 'sine', 0.12);
        this.playTone(n.f / 2, n.d, 'triangle', 0.05);
      }, n.t);
    });
  }

  playXP() {
    [880, 1320, 1760].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.1, 'sine', 0.08), i * 50);
    });
  }

  // --- NUEVOS MÉTODOS REQUERIDOS ---
  playTheoryOpen() {
    // Sonido de "apertura" suave y brillante
    this.playTone(440, 0.2, 'sine', 0.1);
    setTimeout(() => this.playTone(880, 0.3, 'sine', 0.08), 100);
  }

  playMagic() {
    // Efecto de brillo para advertencias o pistas
    [600, 800, 1000, 1200].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.1, 'sine', 0.05), i * 50);
    });
  }

  // --- MÚSICA AMBIENTAL ---
  startBackgroundMusic() {
    if (!this.enabled || !this.audioContext || this.bgMusicNodes) return;
    this.resume().then(() => {
      const masterGain = this.audioContext.createGain();
      masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.06, this.audioContext.currentTime + 3);
      const compressor = this.audioContext.createDynamicsCompressor();
      masterGain.connect(compressor);
      compressor.connect(this.audioContext.destination);

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.audioContext.currentTime);

      const baseNotes = [196.00, 246.94, 293.66, 440.00]; 
      const nodes = baseNotes.map((freq, i) => {
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const g = this.audioContext.createGain();
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, this.audioContext.currentTime);
        osc2.frequency.setValueAtTime(freq + 0.5, this.audioContext.currentTime);
        g.gain.setValueAtTime(0.02, this.audioContext.currentTime);
        osc1.connect(g);
        osc2.connect(g);
        g.connect(filter);
        osc1.start();
        osc2.start();
        return { osc1, osc2 };
      });

      filter.connect(masterGain);
      this.bgMusicNodes = { nodes, masterGain };
      this.playTwinkle();
    });
  }

  playTwinkle() {
    if (!this.bgMusicNodes || !this.enabled) return;
    const highNotes = [783.99, 880.00, 987.77, 1174.66, 1318.51];
    const freq = highNotes[Math.floor(Math.random() * highNotes.length)];
    this.playTone(freq, 1.5, 'sine', 0.015);
    this.twinkleTimeout = setTimeout(() => this.playTwinkle(), 3000 + Math.random() * 5000);
  }

  stopBackgroundMusic() {
    if (this.twinkleTimeout) clearTimeout(this.twinkleTimeout);
    if (!this.bgMusicNodes) return;
    const { nodes, masterGain } = this.bgMusicNodes;
    masterGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5);
    setTimeout(() => {
      try { nodes.forEach(n => { n.osc1.stop(); n.osc2.stop(); }); } catch (e) {}
    }, 1500);
    this.bgMusicNodes = null;
  }

  startGameMusic() { this.startBackgroundMusic(); }
  stopGameMusic() { this.stopBackgroundMusic(); }
}

export const sounds = new SoundEngine();
