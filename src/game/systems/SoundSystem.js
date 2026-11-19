/**
 * NIGHTFALL: The Last Delivery - SoundSystem
 *
 * Fully procedural cinematic sound effects and ambient rain generator
 * built directly with the Web Audio API. Requires zero external audio files.
 *
 * Handles browser audio unlock policies automatically on first interaction.
 */

export default class SoundSystem {
  constructor(scene) {
    this.scene = scene;
    this.ctx = null;
    this.isMuted = false;
    this.isUnlocked = false;

    // Ambient rain nodes
    this.rainSource = null;
    this.rainGain = null;
    this.rainFilter = null;
    this.rainActive = false;
    this.isIndoors = true;

    // Alert sound node
    this.alertOsc = null;
    this.alertGain = null;

    // Footstep pacing
    this.lastFootstepTime = 0;

    // Attach unlock handlers on scene input
    this.setupUnlockListeners();
  }

  setupUnlockListeners() {
    const unlock = () => {
      this.initContext();
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      this.isUnlocked = true;
      this.scene.input.off("pointerdown", unlock);
      this.scene.input.keyboard?.off("keydown", unlock);
    };

    this.scene.input.on("pointerdown", unlock);
    this.scene.input.keyboard?.on("keydown", unlock);
  }

  initContext() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.startRainAmbience();
  }

  ensureContext() {
    if (!this.ctx) {
      this.initContext();
    } else if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  /**
   * Continuous procedural rain ambience using filtered white noise buffer.
   */
  startRainAmbience() {
    if (!this.ctx || this.rainActive) return;

    // 2-second stereo pink/white noise loop buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = noiseBuffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Paul Kellet's filtered pink noise approximation
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }

    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = noiseBuffer;
    this.rainSource.loop = true;

    // Lowpass filter for acoustic indoor vs outdoor storm attenuation
    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = "lowpass";
    this.rainFilter.frequency.setValueAtTime(this.isIndoors ? 420 : 3200, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(this.isIndoors ? 0.08 : 0.28, this.ctx.currentTime);

    this.rainSource.connect(this.rainFilter);
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    this.rainSource.start(0);
    this.rainActive = true;
  }

  /**
   * Dynamically muffle or open rain audio based on player indoor/outdoor position.
   * @param {boolean} indoors
   */
  setIndoorState(indoors) {
    if (this.isIndoors === indoors || !this.rainFilter || !this.rainGain || !this.ctx) return;
    this.isIndoors = indoors;

    const t = this.ctx.currentTime;
    const targetFreq = indoors ? 420 : 3400;
    const targetGain = indoors ? 0.07 : 0.26;

    this.rainFilter.frequency.cancelScheduledValues(t);
    this.rainFilter.frequency.setTargetAtTime(targetFreq, t, 0.25);

    this.rainGain.gain.cancelScheduledValues(t);
    this.rainGain.gain.setTargetAtTime(targetGain, t, 0.25);
  }

  /**
   * Footstep acoustic click + wet pavement splash tick.
   */
  playFootstep(now = 0) {
    this.ensureContext();
    if (!this.ctx || now - this.lastFootstepTime < 240) return;
    this.lastFootstepTime = now;

    const t = this.ctx.currentTime;
    const pitchOffset = (Math.random() - 0.5) * 15;

    // 1. Boot sole click
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140 + pitchOffset, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.05);

    oscGain.gain.setValueAtTime(0.14, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.05);

    // 2. Wet puddle splash tick (if outdoors)
    if (!this.isIndoors) {
      const splash = this.ctx.createBufferSource();
      const splashBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.06), this.ctx.sampleRate);
      const data = splashBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
      }
      splash.buffer = splashBuffer;

      const splashFilter = this.ctx.createBiquadFilter();
      splashFilter.type = "bandpass";
      splashFilter.frequency.setValueAtTime(2200 + pitchOffset * 20, t);
      splashFilter.Q.setValueAtTime(2.5, t);

      const splashGain = this.ctx.createGain();
      splashGain.gain.setValueAtTime(0.08, t);
      splashGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      splash.connect(splashFilter);
      splashFilter.connect(splashGain);
      splashGain.connect(this.masterGain);
      splash.start(t);
      splash.stop(t + 0.06);
    }
  }

  /**
   * Heavy mechanical industrial knife breaker throw sound.
   */
  playBreakerThrow() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Heavy mechanical metal impact
    const clunk = this.ctx.createOscillator();
    const clunkGain = this.ctx.createGain();
    clunk.type = "square";
    clunk.frequency.setValueAtTime(90, t);
    clunk.frequency.exponentialRampToValueAtTime(25, t + 0.16);

    clunkGain.gain.setValueAtTime(0.35, t);
    clunkGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    clunk.connect(clunkGain);
    clunkGain.connect(this.masterGain);
    clunk.start(t);
    clunk.stop(t + 0.16);

    // Electrical arc sizzle burst
    const sizzle = this.ctx.createBufferSource();
    const len = Math.floor(this.ctx.sampleRate * 0.14);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    sizzle.buffer = buf;

    const sizzleFilter = this.ctx.createBiquadFilter();
    sizzleFilter.type = "bandpass";
    sizzleFilter.frequency.setValueAtTime(1400, t);

    const sizzleGain = this.ctx.createGain();
    sizzleGain.gain.setValueAtTime(0.18, t);
    sizzleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    sizzle.connect(sizzleFilter);
    sizzleFilter.connect(sizzleGain);
    sizzleGain.connect(this.masterGain);
    sizzle.start(t);
    sizzle.stop(t + 0.14);

    // Rising power grid hum
    const hum = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();
    hum.type = "sawtooth";
    hum.frequency.setValueAtTime(60, t + 0.1);
    humGain.gain.setValueAtTime(0.001, t + 0.1);
    humGain.gain.linearRampToValueAtTime(0.12, t + 0.35);
    humGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    const humFilter = this.ctx.createBiquadFilter();
    humFilter.type = "lowpass";
    humFilter.frequency.setValueAtTime(320, t);

    hum.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(this.masterGain);
    hum.start(t + 0.1);
    hum.stop(t + 1.2);
  }

  /**
   * Heavy blast door pneumatic sliding and latching sound.
   */
  playDoorSlide() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Pneumatic pressure hiss
    const hiss = this.ctx.createBufferSource();
    const len = Math.floor(this.ctx.sampleRate * 0.65);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
    }
    hiss.buffer = buf;

    const hissFilter = this.ctx.createBiquadFilter();
    hissFilter.type = "bandpass";
    hissFilter.frequency.setValueAtTime(1800, t);
    hissFilter.frequency.exponentialRampToValueAtTime(900, t + 0.65);

    const hissGain = this.ctx.createGain();
    hissGain.gain.setValueAtTime(0.14, t);
    hissGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    hiss.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(this.masterGain);
    hiss.start(t);
    hiss.stop(t + 0.65);

    // Mechanical runner hum
    const motor = this.ctx.createOscillator();
    const motorGain = this.ctx.createGain();
    motor.type = "sawtooth";
    motor.frequency.setValueAtTime(110, t);
    motor.frequency.linearRampToValueAtTime(80, t + 0.65);

    motorGain.gain.setValueAtTime(0.06, t);
    motorGain.gain.linearRampToValueAtTime(0.001, t + 0.65);

    const motorFilter = this.ctx.createBiquadFilter();
    motorFilter.type = "lowpass";
    motorFilter.frequency.setValueAtTime(260, t);

    motor.connect(motorFilter);
    motorFilter.connect(motorGain);
    motorGain.connect(this.masterGain);
    motor.start(t);
    motor.stop(t + 0.65);
  }

  /**
   * Ethereal mysterious harmonic chime for item pickup / clues.
   */
  playPickup() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const chord = [659.25, 987.77, 1318.51]; // E5, B5, E6
    chord.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + i * 0.04);

      gain.gain.setValueAtTime(0.001, t + i * 0.04);
      gain.gain.linearRampToValueAtTime(0.12, t + i * 0.04 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.55);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.55);
    });
  }

  /**
   * Dialogue typewriter / terminal / radio blip.
   * @param {string} [type="speech"]
   */
  playDialogueBeep(type = "speech") {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    if (type === "radio") {
      // Radio static chirp
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(420 + Math.random() * 80, t);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.04);
    } else if (type === "terminal") {
      // CRT data blip
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880 + Math.random() * 40, t);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.035);
    } else {
      // Subtle soft key press click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320 + Math.random() * 30, t);
      gain.gain.setValueAtTime(0.03, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.03);
    }
  }

  /**
   * Alias for playDialogueBeep to safely handle inspection blips.
   * @param {string} [type="thought"]
   */
  playDialogueBlip(type = "thought") {
    this.playDialogueBeep(type);
  }

  /**
   * CRT flyback transformer spooling up and terminal connect tone.
   */
  playTerminalBoot() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // High frequency flyback coil whine
    const whine = this.ctx.createOscillator();
    const whineGain = this.ctx.createGain();
    whine.type = "sine";
    whine.frequency.setValueAtTime(4000, t);
    whine.frequency.exponentialRampToValueAtTime(11500, t + 0.5);

    whineGain.gain.setValueAtTime(0.001, t);
    whineGain.gain.linearRampToValueAtTime(0.05, t + 0.35);
    whineGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    whine.connect(whineGain);
    whineGain.connect(this.masterGain);
    whine.start(t);
    whine.stop(t + 0.7);

    // Terminal handshake beep
    const beep = this.ctx.createOscillator();
    const beepGain = this.ctx.createGain();
    beep.type = "square";
    beep.frequency.setValueAtTime(1240, t + 0.4);
    beepGain.gain.setValueAtTime(0.06, t + 0.4);
    beepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1600, t + 0.4);

    beep.connect(filter);
    filter.connect(beepGain);
    beepGain.connect(this.masterGain);
    beep.start(t + 0.4);
    beep.stop(t + 0.65);
  }

  /**
   * Three atmospheric knuckles rapping on the shelter door.
   */
  playDoorKnock() {
    this.ensureContext();
    if (!this.ctx) return;
    const baseT = this.ctx.currentTime;

    [0, 0.22, 0.45].forEach((offset) => {
      const t = baseT + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(110 + Math.random() * 10, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.08);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.08);
    });
  }

  /**
   * Mira's signature three-note musical motif (GDD line 300).
   * Recurring ethereal chime (E5 -> G5 -> D5) with gentle harmonic decay and echo.
   */
  playMiraMotif() {
    this.ensureContext();
    if (!this.ctx) return;
    const baseT = this.ctx.currentTime + 0.05;

    const notes = [
      { freq: 659.25, time: 0 },
      { freq: 783.99, time: 0.36 },
      { freq: 587.33, time: 0.74 },
    ];

    notes.forEach((n) => {
      const noteTime = baseT + n.time;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(n.freq, noteTime);

      const harm = this.ctx.createOscillator();
      const harmGain = this.ctx.createGain();
      harm.type = "sine";
      harm.frequency.setValueAtTime(n.freq * 2, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.6);

      harmGain.gain.setValueAtTime(0.001, noteTime);
      harmGain.gain.linearRampToValueAtTime(0.03, noteTime + 0.015);
      harmGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2400, noteTime);

      osc.connect(gain);
      harm.connect(harmGain);
      gain.connect(filter);
      harmGain.connect(filter);
      filter.connect(this.masterGain);

      osc.start(noteTime);
      harm.start(noteTime);
      osc.stop(noteTime + 1.65);
      harm.stop(noteTime + 0.85);

      // Subtle delay echo tap
      const echoOsc = this.ctx.createOscillator();
      const echoGain = this.ctx.createGain();
      const echoTime = noteTime + 0.38;
      echoOsc.type = "sine";
      echoOsc.frequency.setValueAtTime(n.freq, echoTime);
      echoGain.gain.setValueAtTime(0.001, echoTime);
      echoGain.gain.linearRampToValueAtTime(0.035, echoTime + 0.02);
      echoGain.gain.exponentialRampToValueAtTime(0.0001, echoTime + 1.2);
      echoOsc.connect(echoGain);
      echoGain.connect(filter);
      echoOsc.start(echoTime);
      echoOsc.stop(echoTime + 1.25);
    });
  }

  /**
   * Resonant transmission harmonic when the signal beacon switches red -> amber.
   */
  playSignalChime() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(330, t + 0.8);

    sub.type = "sine";
    sub.frequency.setValueAtTime(110, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, t);

    osc.connect(gain);
    sub.connect(gain);
    gain.connect(filter);
    filter.connect(this.masterGain);

    osc.start(t);
    sub.start(t);
    osc.stop(t + 2.5);
    sub.stop(t + 2.5);
  }

  /**
   * Mechanical ratchet winch / lever crank sound.
   */
  playLever() {
    this.ensureContext();
    if (!this.ctx) return;
    const baseT = this.ctx.currentTime;

    [0, 0.12, 0.24].forEach((offset, idx) => {
      const t = baseT + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(160 + idx * 30, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.08);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(600, t);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.08);
    });
  }

  /**
   * Heavy rattling chain clatter / metal debris distraction sound.
   */
  playMetalClatter() {
    this.ensureContext();
    if (!this.ctx) return;
    const baseT = this.ctx.currentTime;

    for (let i = 0; i < 5; i++) {
      const t = baseT + i * 0.07 + Math.random() * 0.02;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800 + Math.random() * 600, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.12);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.12);
    }
  }

  /**
   * Electronic magnetic card swipe and pneumatic latch opening.
   */
  playKeycardSwipe() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // High affirmative swipe chime
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.setValueAtTime(1800, t + 0.08);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  /**
   * Distant low rolling thunder rumble during storm lightning.
   */
  playThunder() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    const len = Math.floor(this.ctx.sampleRate * 2.2);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.45));
    }
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(90, t);
    filter.frequency.exponentialRampToValueAtTime(45, t + 2.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);
    noise.stop(t + 2.2);
  }

  /**
   * Heavy subterranean water splash (e.g. crate landing in flood basin).
   */
  playWaterSplash() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Filtered noise burst for water spray
    const noise = this.ctx.createBufferSource();
    const len = Math.floor(this.ctx.sampleRate * 0.45);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.25));
    }
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(140, t + 0.45);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    // Deep sub-bass plunge thump
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(110, t);
    sub.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    subGain.gain.setValueAtTime(0.4, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    sub.connect(subGain);
    subGain.connect(this.masterGain);

    noise.start(t);
    sub.start(t);
    noise.stop(t + 0.46);
    sub.stop(t + 0.26);
  }

  /**
   * High-voltage electrical arc / spark sizzle.
   */
  playElectricArc() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.setValueAtTime(340, t + 0.04);
    osc.frequency.setValueAtTime(80, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1800, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  /**
   * Grinding sluice gate gears and draining water rush.
   */
  playSluiceDrain() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Grinding gear ratchet
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const ot = t + i * 0.18;
      osc.type = "square";
      osc.frequency.setValueAtTime(90 + i * 15, ot);
      g.gain.setValueAtTime(0.18, ot);
      g.gain.exponentialRampToValueAtTime(0.001, ot + 0.12);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(ot);
      osc.stop(ot + 0.13);
    }

    // Rushing water surge
    const noise = this.ctx.createBufferSource();
    const len = Math.floor(this.ctx.sampleRate * 1.8);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
    }
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.exponentialRampToValueAtTime(280, t + 1.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);
    noise.stop(t + 1.85);
  }

  /**
   * Heavy rhythmic diesel pump engine startup & chug.
   */
  playDieselRumble() {
    this.ensureContext();
    if (!this.ctx) return;
    const baseT = this.ctx.currentTime;

    // 4 rhythmic diesel compression combustion pulses
    for (let i = 0; i < 6; i++) {
      const t = baseT + i * 0.22;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(50, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.16);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(140, t);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.19);
    }
  }

  /**
   * Heavy hydraulic groan and gate lift.
   */
  playGateHydraulic() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(75, t);
    osc.frequency.linearRampToValueAtTime(110, t + 1.2);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(320, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 1.45);
  }

  /**
   * High-pressure steam hiss.
   */
  playSteamHiss() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    const len = Math.floor(this.ctx.sampleRate * 0.8);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.4));
    }
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2400, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.82);
  }

  /**
   * Ominous dark ambient sub-bass drone when Wanderer's detection meter rises.
   * @param {number} level (0.0 to 1.0)
   */
  updateAlertDrone(level) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    if (level > 0.1) {
      if (!this.alertOsc) {
        this.alertOsc = this.ctx.createOscillator();
        this.alertGain = this.ctx.createGain();
        this.alertOsc.type = "sawtooth";
        this.alertOsc.frequency.setValueAtTime(55, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(180, t);

        this.alertGain.gain.setValueAtTime(0.001, t);

        this.alertOsc.connect(filter);
        filter.connect(this.alertGain);
        this.alertGain.connect(this.masterGain);
        this.alertOsc.start(t);
      }

      const targetGain = Math.min(0.2, level * 0.2);
      this.alertGain.gain.setTargetAtTime(targetGain, t, 0.1);
    } else if (this.alertGain) {
      this.alertGain.gain.setTargetAtTime(0.0001, t, 0.15);
      if (this.alertOsc && level <= 0.02) {
        try {
          this.alertOsc.stop(t + 0.2);
        } catch (_) {}
        this.alertOsc = null;
        this.alertGain = null;
      }
    }
  }

  destroy() {
    if (this.rainSource) {
      try { this.rainSource.stop(); } catch (_) {}
      this.rainSource = null;
    }
    if (this.alertOsc) {
      try { this.alertOsc.stop(); } catch (_) {}
      this.alertOsc = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

