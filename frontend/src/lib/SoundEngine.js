class SoundEngine {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.initialized = false;
  }

  init() {
    if (this.initialized) {
      this.resume();
      return;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      this.initialized = true;
      console.log('🔊 SoundEngine initialized');
    } catch (e) {
      console.warn('Audio not supported:', e);
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        console.log('🔊 Audio resumed');
      });
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playTone(frequency, duration = 0.1, type = 'sine', volume = 0.15) {
    if (!this.enabled || !this.audioContext) {
      console.log('🔇 Sound disabled or no context');
      return;
    }
    
    this.resume();
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn('Error playing tone:', e);
    }
  }

  playClick() {
    console.log('🔔 playClick');
    this.playTone(880, 0.05, 'sine', 0.12);
  }

  playSuccess() {
    console.log('🎉 playSuccess');
    this.playTone(523.25, 0.12, 'sine', 0.15);
    setTimeout(() => this.playTone(659.25, 0.12, 'sine', 0.15), 100);
    setTimeout(() => this.playTone(783.99, 0.2, 'sine', 0.15), 200);
  }

  playError() {
    console.log('❌ playError');
    this.playTone(180, 0.25, 'square', 0.1);
    setTimeout(() => this.playTone(140, 0.35, 'square', 0.1), 200);
  }

  playHover() {
    this.playTone(600, 0.03, 'sine', 0.08);
  }

  playUnlock() {
    console.log('🔓 playUnlock');
    this.playTone(440, 0.1, 'sine', 0.15);
    setTimeout(() => this.playTone(554.37, 0.1, 'sine', 0.15), 80);
    setTimeout(() => this.playTone(659.25, 0.1, 'sine', 0.15), 160);
    setTimeout(() => this.playTone(880, 0.25, 'sine', 0.18), 240);
  }

  playMagic() {
    console.log('✨ playMagic');
    [300, 400, 500, 600, 700].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.1), i * 80);
    });
  }

  playStep() {
    this.playTone(220, 0.06, 'triangle', 0.1);
  }

  playVictory() {
    console.log('🏆 playVictory');
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.25, 'sine', 0.15), i * 150);
    });
  }

  playDagon() {
    const notes = [196, 220, 247, 261.63];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.15), i * 120);
    });
  }

  playXP() {
    console.log('💎 playXP');
    [660, 880, 1320].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.12), i * 60);
    });
  }

  playType() {
    this.playTone(440, 0.02, 'sine', 0.05);
  }
}

export const sounds = new SoundEngine();