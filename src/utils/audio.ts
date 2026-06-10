/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private lobbyNode: AudioWorkletNode | ScriptProcessorNode | OscillatorNode[] | null = null;
  private lobbyInterval: any = null;
  private musicPlaying = false;
  private isMuted = false;
  private currentVolume = 0.15;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopLobbyMusic();
    } else {
      this.initCtx();
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  // Plays a quirky bouncy retro melody for the Lobby/HomeScreen
  playLobbyMusic() {
    if (this.isMuted) return;
    this.initCtx();
    if (this.musicPlaying) return;

    this.musicPlaying = true;
    let step = 0;
    
    // Simple synthesized bouncy bass & synth drums
    const bassScale = [110, 110, 130, 146, 165, 165, 196, 220]; // A2, C3, D3, E3, G3, A3
    const melodyScale = [440, 494, 523, 587, 659, 784, 880]; // A4 scale

    this.lobbyInterval = setInterval(() => {
      if (!this.ctx || this.isMuted || !this.musicPlaying) return;
      
      const time = this.ctx.currentTime;
      
      // Quirky Bass Synth (clicks & bops)
      if (step % 2 === 0) {
        const bassFreq = bassScale[Math.floor(Math.sin(step) * 3 + 3) % bassScale.length];
        this.synthBop(bassFreq, 0.15, "triangle", 0.01, 0.12);
      }

      // Snare-like noise burst
      if (step % 4 === 2) {
        this.synthNoise(0.05, 0.08);
      }

      // Fun melody notes with some randomness
      if (step % 8 === 0 || step % 8 === 3 || step % 8 === 5) {
        if (Math.random() > 0.3) {
          const mFreq = melodyScale[Math.floor(Math.random() * melodyScale.length)];
          this.synthBop(mFreq, 0.1, "sine", 0.03, 0.2);
        }
      }

      step++;
    }, 200);
  }

  stopLobbyMusic() {
    this.musicPlaying = false;
    if (this.lobbyInterval) {
      clearInterval(this.lobbyInterval);
      this.lobbyInterval = null;
    }
  }

  // Synthesizes a bubbly frequency sweep
  private synthBop(freq: number, volume: number, type: OscillatorType, attack: number, duration: number) {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    // Frequency slide for cartoonishness
    if (type === "sine") {
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume * this.currentVolume, this.ctx.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Synthesizes white noise for drum sounds
  private synthNoise(volume: number, duration: number) {
    if (!this.ctx || this.isMuted) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * this.currentVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  // Play a quirky high pitch tick for normal ticking
  playTick() {
    this.initCtx();
    this.synthBop(1200, 0.15, "sine", 0.005, 0.05);
  }

  // Accelerated ticking sound near the end
  playTickingDown() {
    this.initCtx();
    this.synthBop(800, 0.25, "square", 0.01, 0.08);
  }

  // Celebratory triumphant fanfare
  playFanfare() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    // Standard triumphant chord: C4, E4, G4, C5
    const freqs = [261.63, 329.63, 392.00, 523.25];
    freqs.forEach((freq, idx) => {
      setTimeout(() => {
        this.synthBop(freq, 0.12, "triangle", 0.05, 0.6);
        this.synthBop(freq * 1.005, 0.08, "sine", 0.05, 0.6);
      }, idx * 100);
    });
  }

  // Fun bloop vote sound
  playVoteSfx() {
    this.initCtx();
    this.synthBop(440, 0.2, "sine", 0.02, 0.25);
    setTimeout(() => {
      this.synthBop(660, 0.2, "sine", 0.02, 0.3);
    }, 60);
  }

  // Different quirky synth reactions for emojis
  playReactionSfx(emoji: string) {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    switch (emoji) {
      case "🧠":
        // Big deep brain cell wiggle
        this.synthBop(180, 0.3, "sawtooth", 0.05, 0.4);
        break;
      case "💥":
        // Explosive white noise
        this.synthNoise(0.4, 0.3);
        break;
      case "😂":
        // Double pitch slide
        this.synthBop(600, 0.25, "sine", 0.02, 0.15);
        setTimeout(() => this.synthBop(750, 0.25, "sine", 0.02, 0.15), 100);
        break;
      case "💀":
        // Clunky bone sound
        this.synthBop(300, 0.3, "triangle", 0.01, 0.1);
        setTimeout(() => this.synthBop(250, 0.3, "triangle", 0.01, 0.1), 80);
        break;
      case "💩":
        // Low fart sound
        this.synthBop(85, 0.35, "sawtooth", 0.05, 0.3);
        break;
      case "🤡":
        // Fun cartoon horn
        this.synthBop(512, 0.22, "square", 0.01, 0.15);
        setTimeout(() => this.synthBop(512, 0.22, "square", 0.01, 0.15), 180);
        break;
      default:
        this.synthBop(440, 0.2, "sine", 0.02, 0.15);
    }
  }
}

export const soundSynthesizer = new SoundSynthesizer();
