class SoundEngine {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.initialized = false;
    this.bgMusicNodes = null;
    this.tensionInterval = null;
    this.tensionSpeed = 1000;
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

  startBackgroundMusic() {
    if (!this.enabled || !this.audioContext || this.bgMusicNodes) return;
    
    console.log('🎵 Starting background music');
    
    const masterGain = this.audioContext.createGain();
    masterGain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
    masterGain.connect(this.audioContext.destination);
    
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const osc3 = this.audioContext.createOscillator();
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(110, this.audioContext.currentTime);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(165, this.audioContext.currentTime);
    
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(220, this.audioContext.currentTime);
    
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.5, this.audioContext.currentTime);
    lfoGain.gain.setValueAtTime(10, this.audioContext.currentTime);
    
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);
    
    osc1.connect(masterGain);
    osc2.connect(masterGain);
    osc3.connect(masterGain);
    
    osc1.start();
    osc2.start();
    osc3.start();
    lfo.start();
    
    this.bgMusicNodes = { osc1, osc2, osc3, lfo, masterGain };
  }

  stopBackgroundMusic() {
    if (!this.bgMusicNodes) return;
    
    console.log('🎵 Stopping background music');
    
    const { osc1, osc2, osc3, lfo, masterGain } = this.bgMusicNodes;
    masterGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
    
    setTimeout(() => {
      osc1.stop();
      osc2.stop();
      osc3.stop();
      lfo.stop();
    }, 500);
    
    this.bgMusicNodes = null;
  }

  startTensionTimer(callback) {
    if (!this.enabled || !this.audioContext) return;
    
    console.log('⏱️ Starting tension timer');
    
    this.tensionSpeed = 1000;
    this.playTensionTick();
    
    this.tensionInterval = setInterval(() => {
      this.tensionSpeed = Math.max(200, this.tensionSpeed - 50);
      this.playTensionTick();
      if (callback) callback(this.tensionSpeed);
    }, this.tensionSpeed);
  }

  stopTensionTimer() {
    if (this.tensionInterval) {
      clearInterval(this.tensionInterval);
      this.tensionInterval = null;
      console.log('⏱️ Stopped tension timer');
    }
  }

  playTensionTick() {
    this.playTone(220, 0.08, 'square', 0.1);
    setTimeout(() => this.playTone(330, 0.04, 'sine', 0.05), 30);
  }

  playCountdown(seconds) {
    if (seconds <= 3) {
      this.playTone(440 * (4 - seconds), 0.15, 'sine', 0.2);
    } else {
      this.playTone(220, 0.1, 'triangle', 0.1);
    }
  }

  playStreakNewDay() {
    console.log('🔥 New streak day!');
    
    const notes = [
      { freq: 392, delay: 0 },
      { freq: 523.25, delay: 100 },
      { freq: 659.25, delay: 200 },
      { freq: 783.99, delay: 300 },
      { freq: 1046.50, delay: 450 },
    ];
    
    notes.forEach(({ freq, delay }) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'sine', 0.15);
      }, delay);
    });
  }

  playTimeWarning() {
    console.log('⚠️ Time warning!');
    
    [440, 520, 440, 520].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sawtooth', 0.12), i * 150);
    });
  }
}

export const sounds = new SoundEngine();