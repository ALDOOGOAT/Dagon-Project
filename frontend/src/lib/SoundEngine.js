class SoundEngine {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.initialized = false;
    this.bgMusicNodes = null;
    this.gameMusicNodes = null;
    this.tensionInterval = null;
    this.tensionSpeed = 1000;
    this.timerTickInterval = null;
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
    this.playTone(1200, 0.03, 'sine', 0.08);
  }

  playSuccess() {
    console.log('🎉 playSuccess');
    this.playTone(523.25, 0.12, 'sine', 0.15);
    setTimeout(() => this.playTone(659.25, 0.12, 'sine', 0.15), 100);
    setTimeout(() => this.playTone(783.99, 0.2, 'sine', 0.15), 200);
  }

  playError() {
    console.log('❌ playError');
    this.playTone(150, 0.3, 'sawtooth', 0.12);
    setTimeout(() => this.playTone(100, 0.4, 'sawtooth', 0.08), 250);
  }

  playHover() {
    this.playTone(800, 0.02, 'sine', 0.06);
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
    this.playTone(180, 0.05, 'triangle', 0.1);
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
    this.playTone(440, 0.015, 'sine', 0.04);
  }

  playTimerTick() {
    if (!this.enabled || !this.audioContext) return;
    this.resume();
    try {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
      
      gain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.04);
      
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.04);
    } catch (e) {}
  }

  startTimerLoop(intervalMs = 1000) {
    this.stopTimerLoop();
    this.playTimerTick();
    this.timerTickInterval = setInterval(() => {
      this.playTimerTick();
    }, intervalMs);
  }

  stopTimerLoop() {
    if (this.timerTickInterval) {
      clearInterval(this.timerTickInterval);
      this.timerTickInterval = null;
    }
  }

  startGameMusic() {
    if (!this.enabled || !this.audioContext || this.gameMusicNodes) return;
    
    console.log('🎮 Starting game music');
    
    const masterGain = this.audioContext.createGain();
    masterGain.gain.setValueAtTime(0.06, this.audioContext.currentTime);
    masterGain.connect(this.audioContext.destination);
    
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const osc3 = this.audioContext.createOscillator();
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
    filter.Q.setValueAtTime(2, this.audioContext.currentTime);
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, this.audioContext.currentTime);
    
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(110, this.audioContext.currentTime);
    
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(82.5, this.audioContext.currentTime);
    
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.2, this.audioContext.currentTime);
    lfoGain.gain.setValueAtTime(100, this.audioContext.currentTime);
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(masterGain);
    
    osc1.start();
    osc2.start();
    osc3.start();
    lfo.start();
    
    this.gameMusicNodes = { osc1, osc2, osc3, lfo, masterGain, filter };
  }

  stopGameMusic() {
    if (!this.gameMusicNodes) return;
    
    console.log('🎮 Stopping game music');
    
    const { osc1, osc2, osc3, lfo, masterGain, filter } = this.gameMusicNodes;
    masterGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);
    
    setTimeout(() => {
      osc1.stop();
      osc2.stop();
      osc3.stop();
      lfo.stop();
    }, 800);
    
    this.gameMusicNodes = null;
  }

  startBackgroundMusic() {
    if (!this.enabled || !this.audioContext || this.bgMusicNodes) return;
    
    console.log('🎵 Starting background music');
    
    const masterGain = this.audioContext.createGain();
    masterGain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
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
    this.playTone(220, 0.06, 'square', 0.12);
    setTimeout(() => this.playTone(330, 0.03, 'sine', 0.06), 25);
  }

  playCountdown(seconds) {
    if (seconds <= 3) {
      this.playTone(880, 0.1, 'sine', 0.18);
    } else {
      this.playTone(220, 0.08, 'triangle', 0.08);
    }
  }

  playClockTick() {
    this.playTone(1200, 0.05, 'square', 0.06);
  }

  playClockTicking() {
    this.playTone(800, 0.08, 'square', 0.08);
    setTimeout(() => this.playTone(600, 0.08, 'square', 0.06), 80);
  }

  playSelect() {
    console.log('🎯 playSelect');
    this.playTone(660, 0.08, 'sine', 0.12);
    setTimeout(() => this.playTone(880, 0.12, 'sine', 0.15), 60);
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
    
    [523, 659, 523, 659].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.12, 'sawtooth', 0.1), i * 120);
    });
  }

  playLevelComplete() {
    console.log('🏅 Level complete!');
    
    const notes = [392, 523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'sine', 0.14);
      }, i * 100);
    });
  }

  playTheoryOpen() {
    console.log('📖 Theory open');
    this.playTone(440, 0.15, 'sine', 0.1);
    setTimeout(() => this.playTone(550, 0.15, 'sine', 0.1), 100);
  }
}

export const sounds = new SoundEngine();