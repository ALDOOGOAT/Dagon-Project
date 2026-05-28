class SoundEngine {
  constructor() {
    this.storageKey = 'dagon_sound_enabled';
    this.volumeStorageKey = 'dagon_sound_volume';
    this.changeEvent = 'dagon:soundchange';
    this.audioContext = null;
    this.enabled = this.readStoredEnabled();
    this.initialized = false;
    this.bgMusicNodes = null;
    this.gameMusicNodes = null;
    this.twinkleTimeout = null;
    this.activeAssets = new Set();
    this.assetCooldown = new Map();
    this.masterVolume = this.readStoredVolume();
    
    // Migración para corregir el bug anterior donde el volumen se guardaba como 0
    if (typeof window !== 'undefined' && this.masterVolume === 0 && !window.localStorage.getItem('dagon_volume_migrated')) {
      this.masterVolume = 0.8;
      this.persistVolume();
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dagon_volume_migrated', 'true');
    }

    this.assetBase = `${process.env.PUBLIC_URL || ''}/assets/sounds/kenney-interface`;
    this.assetMap = {
      cinematic: 'open_001.ogg',
      confirm: 'confirmation_001.ogg',
      error: 'error_001.ogg',
      question: 'question_001.ogg',
      select: 'select_001.ogg',
      switch: 'switch_001.ogg',
      tick: 'tick_001.ogg',
    };
  }

  readStoredEnabled() {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(this.storageKey) !== 'false';
  }

  readStoredVolume() {
    if (typeof window === 'undefined') return 0.8;
    const item = window.localStorage.getItem(this.volumeStorageKey);
    if (item === null) return 0.8;
    const stored = Number(item);
    if (!Number.isFinite(stored)) return 0.8;
    return Math.min(1, Math.max(0, stored));
  }

  persistEnabled() {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(this.storageKey, this.enabled ? 'true' : 'false');
  }

  persistVolume() {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(this.volumeStorageKey, String(this.masterVolume));
  }

  emitSoundChange() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(this.changeEvent, { detail: { enabled: this.enabled, volume: this.masterVolume } }));
  }

  isEnabled() {
    return this.enabled;
  }

  getVolume() {
    return this.masterVolume;
  }

  setVolume(volume) {
    const next = Math.min(1, Math.max(0, Number(volume) || 0));
    const changed = this.masterVolume !== next;
    this.masterVolume = next;
    this.persistVolume();

    if (this.bgMusicNodes?.masterGain && this.audioContext) {
      this.bgMusicNodes.masterGain.gain.setTargetAtTime(0.06 * this.masterVolume, this.audioContext.currentTime, 0.08);
    }

    if (changed) this.emitSoundChange();
  }

  speechAllowed() {
    return this.enabled && this.masterVolume > 0 && typeof window !== 'undefined' && Boolean(window.speechSynthesis);
  }

  stopSpeech() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  speakTTS(text, options = {}) {
    if (!this.speechAllowed() || !text) return null;
    this.stopSpeech();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    utterance.rate = options.rate || 1.05; // Un poco más rápido y fluido
    utterance.pitch = options.pitch || 1.02; // Tono más natural
    utterance.volume = Math.min(1, Math.max(0, this.masterVolume));

    const voices = window.speechSynthesis.getVoices();
    
    // Retraso si las voces no han cargado (Chrome a veces tarda)
    if (voices.length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        this.speakTTS(text, options);
      }, { once: true });
      return null;
    }

    // Priorizar voces naturales o de alta calidad
    const bestVoice = voices.find(v => v.lang.includes('es') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium'))) 
                   || voices.find(v => v.lang.includes('es-MX'))
                   || voices.find(v => v.lang.startsWith('es'))
                   || voices[0];
    
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    if (options.onStart) utterance.onstart = options.onStart;
    if (options.onEnd) utterance.onend = options.onEnd;
    if (options.onError) utterance.onerror = options.onError;

    window.speechSynthesis.speak(utterance);
    return utterance;
  }

  stopActiveAssets() {
    this.activeAssets.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {}
    });
    this.activeAssets.clear();
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
      if (this.enabled) {
        this.startBackgroundMusic();
      }
    } catch (e) {}
  }

  resume() {
    if (!this.enabled) return Promise.resolve();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      return this.audioContext.resume();
    }
    return Promise.resolve();
  }

  playTone(frequency, duration = 0.1, type = 'sine', volume = 0.15) {
    if (!this.enabled || !this.audioContext || this.masterVolume <= 0) return;
    this.resume();
    try {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      gain.gain.setValueAtTime(volume * this.masterVolume, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      osc.start();
      osc.stop(this.audioContext.currentTime + duration);
    } catch (e) {}
  }

  playAsset(name, volume = 0.38) {
    if (!this.enabled || this.masterVolume <= 0 || typeof Audio === 'undefined') return false;
    const file = this.assetMap[name];
    if (!file) return false;

    const now = Date.now();
    const lastPlayed = this.assetCooldown.get(name) || 0;
    if (now - lastPlayed < 120) return true;
    this.assetCooldown.set(name, now);

    try {
      const audio = new Audio(`${this.assetBase}/${file}`);
      audio.volume = Math.min(1, Math.max(0, volume * this.masterVolume));
      const cleanup = () => this.activeAssets.delete(audio);
      audio.addEventListener('ended', cleanup, { once: true });
      audio.addEventListener('pause', cleanup, { once: true });
      this.activeAssets.add(audio);
      audio.play().catch(() => cleanup());
      return true;
    } catch (e) {
      return false;
    }
  }

  // --- EFECTOS DE SONIDO ---
  playClick() { if (!this.playAsset('select', 0.22)) this.playTone(1200, 0.07, 'sine', 0.25); }
  playStep() { if (!this.playAsset('switch', 0.24)) this.playTone(220, 0.1, 'triangle', 0.3); }
  playHover() { this.playTone(900, 0.03, 'sine', 0.12); }

  setEnabled(enabled, options = {}) {
    const { restart = true } = options;
    const next = Boolean(enabled);
    const changed = this.enabled !== next;
    this.enabled = next;
    this.persistEnabled();
    if (!next) {
      this.stopBackgroundMusic();
      this.stopGameMusic();
      this.stopActiveAssets();
      this.stopSpeech();
      if (this.twinkleTimeout) {
        clearTimeout(this.twinkleTimeout);
        this.twinkleTimeout = null;
      }
      if (changed) this.emitSoundChange();
      return;
    }
    if (changed) this.emitSoundChange();
    if (restart && this.initialized) {
      this.startBackgroundMusic();
    }
  }

  toggleEnabled(options = {}) {
    const next = !this.enabled;
    this.setEnabled(next, options);
    return next;
  }

  playError() {
    this.playAsset('error', 0.30);
    this.playTone(150, 0.4, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(100, 0.5, 'sawtooth', 0.1), 250);
  }

  playSuccess() {
    this.playAsset('confirm', 0.34);
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

  playSelect() {
    if (!this.playAsset('select', 0.22)) this.playTone(600, 0.1, 'sine', 0.15);
  }

  playCountdown(t) {
    const freq = 440 + (6 - t) * 100;
    this.playTone(freq, 0.2, 'triangle', 0.15);
  }

  playClockTicking() {
    this.playTone(800, 0.02, 'sine', 0.05);
  }

  stopTimerLoop() {
    // No-op for now as we use discrete tones
  }

  playTimeWarning() {
    this.playTone(200, 0.5, 'sawtooth', 0.1);
  }

  playSoftWarning() {
    this.playAsset('question', 0.24);
    this.playTone(330, 0.12, 'triangle', 0.08);
    setTimeout(() => this.playTone(260, 0.18, 'triangle', 0.06), 120);
  }

  playUnlock() {
    this.playAsset('confirm', 0.36);
    [392.0, 523.25, 659.25, 783.99].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.16, 'sine', 0.09), i * 75);
    });
  }

  playMissionStart() {
    this.playTone(246.94, 0.18, 'triangle', 0.08);
    setTimeout(() => this.playTone(369.99, 0.2, 'sine', 0.07), 120);
    setTimeout(() => this.playTone(493.88, 0.24, 'sine', 0.06), 240);
  }

  playCinematicPulse() {
    this.playAsset('cinematic', 0.28);
    this.playTone(130.81, 0.22, 'sine', 0.06);
    setTimeout(() => this.playTone(261.63, 0.28, 'triangle', 0.045), 160);
    setTimeout(() => this.playTone(392.0, 0.18, 'sine', 0.035), 360);
  }

  playCinematicCue(cue = 'mystic') {
    const assetByCue = {
      build: 'switch',
      challenge: 'question',
      focus: 'tick',
      mystic: 'cinematic',
      risk: 'question',
      safe: 'confirm',
    };
    const asset = assetByCue[cue] || 'cinematic';
    const played = this.playAsset(asset, cue === 'risk' ? 0.22 : 0.26);
    if (!played) this.playCinematicPulse();
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
      if (!this.enabled || this.bgMusicNodes) return;
      const masterGain = this.audioContext.createGain();
      masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.06 * this.masterVolume, this.audioContext.currentTime + 3);
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
    if (this.twinkleTimeout) {
      clearTimeout(this.twinkleTimeout);
      this.twinkleTimeout = null;
    }
    if (!this.bgMusicNodes) return;
    const { nodes, masterGain } = this.bgMusicNodes;
    if (!this.audioContext) {
      this.bgMusicNodes = null;
      return;
    }
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
