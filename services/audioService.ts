class AudioService {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  private init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public async startAlarm() {
    this.init();
    if (!this.audioContext) return;

    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (this.isPlaying) return;

    this.isPlaying = true;
    this.playBeepLoop();
  }

  private playBeepLoop() {
    if (!this.isPlaying || !this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.1);

    gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.5);

    // Schedule next beep
    setTimeout(() => {
      if (this.isPlaying) {
        this.playBeepLoop();
      }
    }, 1000);
  }

  public stopAlarm() {
    this.isPlaying = false;
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
      this.oscillator = null;
    }
  }

  // Helper to "unlock" audio context on first user interaction
  public async unlockAudio() {
    this.init();
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

export const audioService = new AudioService();