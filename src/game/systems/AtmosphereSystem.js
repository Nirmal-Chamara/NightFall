import Phaser from "phaser";

export default class AtmosphereSystem {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;

    // Indoor zones where rain is attenuated
    this.indoorZones = [
      { start: 0, end: 610 },       // Shelter
      { start: 2000, end: 3180 },   // Apartment Interior
      { start: 3180, end: 3830 },   // Mira's Apartment
      { start: 4670, end: 4930 },   // Emergency Terminal Station
    ];

    this.rainDrops = [];
    this.rainSplashes = [];
    this.rainCount = 85;
    this.targetRainAlpha = 0.45;
    this.currentRainAlpha = 0.45;

    this.createParallaxBackground();
    this.createFogLayers();
    this.createRainSystem();
    this.createLightingGradients();
    this.createForegroundSilhouettes();
    this.createScreenVignette();

    this.onPowerRestored = () => this.liftInteriorDarkness();
    this.scene.events.on("power:restored", this.onPowerRestored);
  }

  /**
   * Parallax background layers: Deep silhouettes of a dead blackout city against a stormy night sky.
   */
  createParallaxBackground() {
    const worldW = 5760;

    // 0. Distant Storm Sky & Lightning Sheet (scrollFactor: 0, depth: -12)
    this.lightningOverlay = this.scene.add
      .rectangle(640, 360, 1280, 720, 0x334155, 0)
      .setScrollFactor(0)
      .setDepth(-12)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.scheduleNextLightning();

    // 1. Far Skyline Layer (scrollFactor: 0.08, depth: -11)
    // Towering brutalist blocks, cooling towers, and jagged factory silhouettes in total blackout
    this.farSkyline = this.scene.add.container(0, 0).setScrollFactor(0.08).setDepth(-11);

    for (let x = 0; x < worldW * 0.45; x += 140) {
      const bh = Phaser.Math.Between(220, 420);
      const bw = Phaser.Math.Between(80, 160);
      const topY = 700 - bh;

      // Dark monolithic structure
      const building = this.scene.add.rectangle(x + bw / 2, 700 - bh / 2, bw, bh, 0x070b10);
      this.farSkyline.add(building);

      // Jagged rooftop water tower or cooling vent silhouette
      if (x % 280 === 0) {
        const vent = this.scene.add.rectangle(x + bw / 2, topY - 16, 28, 32, 0x05080d);
        this.farSkyline.add(vent);
      }

      // Lonely battery-backed emergency red spire beacon on rare antenna
      if (x % 560 === 0) {
        const spire = this.scene.add.rectangle(x + bw / 2, topY - 24, 2, 48, 0x06090e);
        const beacon = this.scene.add.circle(x + bw / 2, topY - 48, 2, 0xd94441);
        this.scene.tweens.add({
          targets: beacon,
          alpha: 0.15,
          duration: 1200 + (x % 400),
          yoyo: true,
          repeat: -1,
        });
        this.farSkyline.add([spire, beacon]);
      }
    }

    // Distant jagged mountain ridgeline behind Sector 7 railway overlook (Area 8)
    for (let mx = worldW * 0.45; mx < worldW * 0.9; mx += 140) {
      const peakH = Phaser.Math.Between(260, 420);
      const peak = this.scene.add.triangle(
        mx, 700 - peakH / 2,
        -110, peakH / 2,
        0, -peakH / 2,
        110, peakH / 2,
        0x05070a
      );
      this.farSkyline.add(peak);
    }

    // 2. Mid Industrial Layer (scrollFactor: 0.22, depth: -8)
    // Decaying apartment tenements, industrial trusses, and elevated train trestle
    this.midIndustrial = this.scene.add.container(0, 0).setScrollFactor(0.22).setDepth(-8);

    // Abandoned elevated train tracks crossing the midground
    this.midIndustrial.add(this.scene.add.rectangle(worldW * 0.3, 520, worldW * 0.7, 8, 0x0a0f16));
    for (let rx = 100; rx < worldW * 0.6; rx += 160) {
      this.midIndustrial.add(this.scene.add.rectangle(rx, 650, 10, 260, 0x080d14));
      // Trestle diagonal cross-brace
      this.midIndustrial.add(this.scene.add.line(0, 0, rx - 40, 520, rx + 40, 600, 0x080d14).setOrigin(0));
    }

    for (let x = 0; x < worldW * 0.55; x += 190) {
      const ph = Phaser.Math.Between(140, 260);
      const pw = Phaser.Math.Between(90, 170);
      const roof = this.scene.add.rectangle(x + pw / 2, 780 - ph / 2, pw, ph, 0x0c121a);
      this.midIndustrial.add(roof);

      // Dead utility poles and dead transformer canisters
      const pole = this.scene.add.rectangle(x + 24, 780 - ph - 25, 4, 60, 0x090e16);
      const crossbar = this.scene.add.rectangle(x + 24, 780 - ph - 50, 26, 3, 0x101722);
      this.midIndustrial.add([pole, crossbar]);
    }
  }

  /**
   * Schedule periodic distant atmospheric lightning flashes with rolling thunder.
   */
  scheduleNextLightning() {
    if (!this.scene) return;
    const delay = Phaser.Math.Between(14000, 24000);
    this.lightningTimer = this.scene.time?.delayedCall(delay, () => {
      this.triggerLightning();
    });
  }

  triggerLightning() {
    if (!this.lightningOverlay || !this.scene) return;

    // Double flash sequence (quick pulse, brief lull, second stronger flash)
    this.scene.tweens.add({
      targets: this.lightningOverlay,
      alpha: 0.18,
      duration: 50,
      yoyo: true,
      repeat: 0,
      onComplete: () => {
        this.scene.time?.delayedCall(60, () => {
          this.scene.tweens.add({
            targets: this.lightningOverlay,
            alpha: 0.32,
            duration: 80,
            yoyo: true,
            repeat: 0,
            ease: "Quad.easeOut",
            onComplete: () => {
              // Rolling thunder audio delay
              this.scene.time?.delayedCall(300, () => {
                this.scene.soundSystem?.playThunder();
              });
              this.scheduleNextLightning();
            },
          });
        });
      },
    });
  }

  /**
   * Floating mist and atmospheric fog bands.
   */
  createFogLayers() {
    // Ground-level creeping mist (depth -1, scrolls with player)
    this.mistBands = [];
    for (let x = 400; x < 5760; x += 800) {
      const mist = this.scene.add.rectangle(x, 860, 600, 40, 0x3d4e63, 0.12).setDepth(-1);
      this.scene.tweens.add({
        targets: mist,
        x: x + 60,
        alpha: 0.05,
        duration: 4000 + (x % 1500),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.mistBands.push(mist);
    }
  }

  /**
   * Viewport-fixed angled rain particle lines.
   */
  createRainSystem() {
    this.rainContainer = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(150);

    for (let i = 0; i < this.rainCount; i++) {
      const rx = Phaser.Math.Between(0, 1340);
      const ry = Phaser.Math.Between(-40, 740);
      const len = Phaser.Math.Between(12, 22);

      // Slanted falling rain streak
      const drop = this.scene.add.line(0, 0, 0, 0, -4, len, 0x829bb5, 0.45);
      drop.setPosition(rx, ry);
      drop.speedX = -2.5 - Math.random() * 1.5;
      drop.speedY = 16 + Math.random() * 8;

      this.rainDrops.push(drop);
      this.rainContainer.add(drop);
    }

    // Subtle ground rain splash ticks along wet pavement
    this.splashLayer = this.scene.add.container(0, 0).setDepth(2);
    for (let i = 0; i < 18; i++) {
      const splash = this.scene.add.rectangle(
        Phaser.Math.Between(650, 1600),
        879,
        Phaser.Math.Between(3, 6),
        1,
        0x9bb8d4,
        0.35
      );
      splash.life = Phaser.Math.Between(0, 12);
      this.rainSplashes.push(splash);
      this.splashLayer.add(splash);
    }
  }

  /**
   * Volumetric additive lighting, wet pavement reflections, and interior darkness veil.
   */
  createLightingGradients() {
    const hasRadial = this.scene.textures.exists("fx_radial_glow");
    const hasCone = this.scene.textures.exists("fx_light_cone");
    const hasGlint = this.scene.textures.exists("fx_puddle_glint");

    // Streetlamps are dead in the blackout (zero electric grid power).
    // Terminal glow pool & pavement reflection in Area 7 (energizes when terminal boots)
    const termGlow = hasRadial
      ? this.scene.add
          .image(4800, 836, "fx_radial_glow")
          .setDisplaySize(160, 120)
          .setTint(0x38bdf8)
          .setAlpha(0)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(-2)
      : this.scene.add.circle(4800, 840, 70, 0x38bdf8, 0).setDepth(-2);
    this.termGlow = termGlow;

    this.scene.events.on("terminal:activated", () => {
      this.activateTerminalGlow();
    });

    this.scene.tweens.add({
      targets: termGlow,
      scaleX: 1.12,
      scaleY: 1.12,
      alpha: 0.12,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    if (hasGlint) {
      this.scene.add
        .image(4800, 886, "fx_puddle_glint")
        .setDisplaySize(90, 10)
        .setTint(0x38bdf8)
        .setAlpha(0.26)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(0);
    }

    // Overlook signal tower beam (Area 8) — apex aligned to signalLight at (5660, 680)
    const signalBeam = this.scene.add.polygon(
      5660,
      680,
      [
        { x: 350, y: 75 },
        { x: 0, y: 0 },
        { x: 0, y: 150 },
      ],
      0xd94441,
      0.1
    );
    signalBeam.setOrigin(1, 0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(-3);
    this.signalBeam = signalBeam;

    // Subtle dark overlay for unlit Apartment 04 & Mira's room before power restoration
    this.aptDarkness = this.scene.add
      .rectangle(2915, 685, 1830, 390, 0x05080d, 0.42)
      .setDepth(8);

    // Personal subtle courier rim light (helps visibility in unlit interiors)
    if (hasRadial) {
      this.playerGlow = this.scene.add
        .image(180, 780, "fx_radial_glow")
        .setDisplaySize(130, 130)
        .setTint(0xd9a441)
        .setAlpha(0.14)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(9);
    }
  }

  /**
   * Out-of-focus foreground parallax silhouettes for cinematic depth.
   */
  createForegroundSilhouettes() {
    this.foregroundLayer = this.scene.add.container(0, 0).setScrollFactor(1.24).setDepth(65);

    const cableStops = [740, 1460, 4120, 5200];
    cableStops.forEach((fx) => {
      const pole = this.scene.add.rectangle(fx, 560, 10, 680, 0x070a0f, 0.85);
      const brace = this.scene.add.rectangle(fx + 14, 280, 36, 6, 0x070a0f, 0.85);
      this.foregroundLayer.add([pole, brace]);
    });

    // Overhead dark utility wire crossing outdoor sky
    const wire = this.scene.add.line(0, 0, 740, 280, 5200, 280, 0x070a0f, 0.7);
    wire.setLineWidth(2);
    this.foregroundLayer.add(wire);
  }

  liftInteriorDarkness(instant = false) {
    if (!this.aptDarkness) return;
    if (instant) {
      this.aptDarkness.setAlpha(0);
      return;
    }
    this.scene.tweens.add({
      targets: this.aptDarkness,
      alpha: 0,
      duration: 650,
      ease: "Quad.easeOut",
    });
  }

  /**
   * Screen vignette border for cinematic mood.
   */
  createScreenVignette() {
    this.vignette = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(220);

    // Vignette edge shadows
    const topGrad = this.scene.add.rectangle(640, 20, 1280, 40, 0x05080c, 0.65);
    const btmGrad = this.scene.add.rectangle(640, 700, 1280, 40, 0x05080c, 0.65);
    const leftGrad = this.scene.add.rectangle(20, 360, 40, 720, 0x05080c, 0.65);
    const rightGrad = this.scene.add.rectangle(1260, 360, 40, 720, 0x05080c, 0.65);

    this.vignette.add([topGrad, btmGrad, leftGrad, rightGrad]);
  }

  /**
   * Update rain positions and evaluate indoor/outdoor audio-visual attenuation.
   * @param {Phaser.GameObjects.GameObject} player
   */
  update(player) {
    if (!player) return;

    // Check if player is indoors
    const px = player.x;
    const isIndoors = this.indoorZones.some((z) => px >= z.start && px <= z.end);

    this.targetRainAlpha = isIndoors ? 0.06 : 0.45;

    // Smooth transition
    this.currentRainAlpha += (this.targetRainAlpha - this.currentRainAlpha) * 0.05;
    this.rainContainer.setAlpha(this.currentRainAlpha);

    // Keep personal rim glow anchored gently around player
    if (this.playerGlow) {
      this.playerGlow.setPosition(player.x, player.y - 6);
      this.playerGlow.setAlpha(player.isHiding ? 0.03 : 0.14);
    }

    // Update individual falling raindrops
    for (let i = 0; i < this.rainDrops.length; i++) {
      const drop = this.rainDrops[i];
      drop.x += drop.speedX;
      drop.y += drop.speedY;

      if (drop.y > 730 || drop.x < -20) {
        drop.y = Phaser.Math.Between(-30, -5);
        drop.x = Phaser.Math.Between(0, 1320);
      }
    }

    // Rain splashes on wet pavement in active camera outdoor zones
    const camLeft = this.scene.cameras.main.scrollX;
    for (let i = 0; i < this.rainSplashes.length; i++) {
      const splash = this.rainSplashes[i];
      splash.life -= 1;
      if (splash.life <= 0) {
        const sx = Math.floor(camLeft + Phaser.Math.Between(20, 1260));
        const inRoof = this.indoorZones.some((z) => sx >= z.start && sx <= z.end);
        splash.setVisible(!inRoof);
        if (!inRoof) {
          splash.setPosition(sx, 879);
          splash.setAlpha(0.45);
        }
        splash.life = Phaser.Math.Between(6, 16);
      } else {
        splash.setAlpha(Math.max(0, splash.alpha - 0.04));
      }
    }
  }

  /**
   * Signal beam color transition when chapter completes.
   */
  setSignalBeamColor(color) {
    if (this.signalBeam) {
      this.signalBeam.setFillStyle(color, 0.12);
    }
  }

  /**
   * Energize Area 7 terminal CRT reflection when booted.
   */
  activateTerminalGlow(instant = false) {
    if (!this.termGlow) return;
    if (instant) {
      this.termGlow.setAlpha(0.24);
      return;
    }
    this.scene.tweens.add({
      targets: this.termGlow,
      alpha: 0.24,
      duration: 600,
      ease: "Quad.easeOut",
    });
  }

  destroy() {
    if (this.lightningTimer) {
      this.lightningTimer.remove(false);
      this.lightningTimer = null;
    }
    if (this.onPowerRestored) {
      this.scene?.events?.off("power:restored", this.onPowerRestored);
    }
    if (this.rainContainer) this.rainContainer.destroy();
    if (this.splashLayer) this.splashLayer.destroy();
    if (this.foregroundLayer) this.foregroundLayer.destroy();
    if (this.vignette) this.vignette.destroy();
    this.rainDrops = [];
    this.rainSplashes = [];
  }
}

