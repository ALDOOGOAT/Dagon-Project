class SoundEngine {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Audio not supported');
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playTone(frequency, duration = 0.1, type = 'sine', volume = 0.1) {
    if (!this.enabled || !this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playClick() {
    this.playTone(800, 0.05, 'sine', 0.08);
  }

  playSuccess() {
    this.playTone(523.25, 0.1, 'sine', 0.1);
    setTimeout(() => this.playTone(659.25, 0.1, 'sine', 0.1), 100);
    setTimeout(() => this.playTone(783.99, 0.15, 'sine', 0.1), 200);
  }

  playError() {
    this.playTone(200, 0.2, 'sawtooth', 0.08);
    setTimeout(() => this.playTone(150, 0.3, 'sawtooth', 0.08), 200);
  }

  playHover() {
    this.playTone(600, 0.03, 'sine', 0.05);
  }

  playUnlock() {
    this.playTone(440, 0.1, 'sine', 0.1);
    setTimeout(() => this.playTone(554.37, 0.1, 'sine', 0.1), 80);
    setTimeout(() => this.playTone(659.25, 0.1, 'sine', 0.1), 160);
    setTimeout(() => this.playTone(880, 0.2, 'sine', 0.12), 240);
  }

  playMagic() {
    [300, 400, 500, 600, 700].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.06), i * 60);
    });
  }

  playStep() {
    this.playTone(220, 0.05, 'triangle', 0.06);
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.1), i * 120);
    });
  }

  playDagon() {
    const notes = [196, 220, 247, 261.63];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.1), i * 100);
    });
  }
}

export const sounds = new SoundEngine();