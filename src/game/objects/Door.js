import Phaser from "phaser";

export default class Door extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} config
   */
  constructor(scene, x, y, config = {}) {
    super(scene, x, y);

    this.id = config.id || "door_01";
    this.label = config.label || "SEC-04";
    this.requiredSwitch = config.requiredSwitch || "switch_01";
    this.locked = config.locked !== undefined ? config.locked : true;
    this.opened = false;
    this.enabled = true;
    this.interactionText = config.interactionText || "Door locked (No power)";

    this.doorWidth = config.width || config.doorWidth || 24;
    this.doorHeight = config.height || config.doorHeight || 120;

    this.panelGroup = scene.add.container(0, 0);
    this.buildDoorVisuals(scene);

    scene.add.existing(this);
    this.setDepth(1);

    // Physics barrier body
    this.barrier = scene.add.rectangle(x, y, this.doorWidth, this.doorHeight);
    scene.physics.add.existing(this.barrier, true); // static body
    this.barrier.setVisible(false);

    // Explicit event connection listening for activating switch
    this.onSwitchActivated = (switchId) => {
      if (switchId === this.requiredSwitch) {
        this.unlock();
        this.open();
      }
    };
    scene.events.on("switch:activated", this.onSwitchActivated);
  }

  buildDoorVisuals(scene) {
    const w = this.doorWidth;
    const h = this.doorHeight;

    if (this.id === "door_street_gate") {
      // 1. Street Security Portcullis Gate
      this.frame = scene.add.rectangle(0, 0, w + 16, h + 16, 0x161e27);
      this.frame.setStrokeStyle(2, 0x2b3848);

      // Top lintel with hazard warning striping
      const lintel = scene.add.rectangle(0, -h / 2 - 4, w + 16, 12, 0x1a2430);
      lintel.setStrokeStyle(1, 0x3d4e61);
      const hazardBar = scene.add.rectangle(0, -h / 2 - 4, w + 12, 4, 0xd9a441);

      // Twin counterweight lift chains rising to fire escape winch
      const chainL = scene.add.line(0, 0, -w / 2 + 3, -h / 2, -w / 2 + 3, -h / 2 - 70, 0x5a6d80).setOrigin(0);
      const chainR = scene.add.line(0, 0, w / 2 - 3, -h / 2, w / 2 - 3, -h / 2 - 70, 0x5a6d80).setOrigin(0);

      // Portcullis Gate Panel (moves up when opened)
      const gateBacking = scene.add.rectangle(0, 0, w, h, 0x0c1117, 0.7);
      this.panelGroup.add([gateBacking]);

      // Vertical rebar bars
      const barCount = 4;
      const barStep = w / (barCount + 1);
      for (let i = 1; i <= barCount; i++) {
        const bx = -w / 2 + i * barStep;
        const bar = scene.add.rectangle(bx, 0, 3, h, 0x2c3b4e);
        this.panelGroup.add(bar);
      }
      // Horizontal cross-ties & diamond lattice
      for (let y = -h / 2 + 16; y <= h / 2 - 16; y += 24) {
        const tie = scene.add.rectangle(0, y, w, 3, 0x3d4e62);
        this.panelGroup.add(tie);
      }
      // Heavy bottom spiked steel plate
      const shoe = scene.add.rectangle(0, h / 2 - 4, w, 8, 0x1a222c);
      shoe.setStrokeStyle(1, 0x475b70);
      this.panelGroup.add(shoe);

      this.statusLight = scene.add.circle(0, -h / 2 - 14, 4, 0xd94441);
      this.statusLight.setStrokeStyle(1, 0x111111);

      this.statusText = scene.add
        .text(0, -h / 2 - 28, `${this.label} LOCKED`, {
          fontFamily: "monospace",
          fontSize: "9px",
          color: "#d94441",
        })
        .setOrigin(0.5);

      this.add([this.frame, lintel, hazardBar, chainL, chainR, this.panelGroup, this.statusLight, this.statusText]);
    } else if (this.id === "door_01") {
      // 2. Heavy Blast Door SEC-04 (Apartment Partition)
      this.frame = scene.add.rectangle(0, 0, w + 18, h + 14, 0x141b24);
      this.frame.setStrokeStyle(2, 0x2d3a4c);

      // Side hydraulic piston cylinders
      const pistonL = scene.add.rectangle(-w / 2 - 7, 0, 6, h - 20, 0x222c3b).setStrokeStyle(1, 0x3d4e63);
      const pistonR = scene.add.rectangle(w / 2 + 7, 0, 6, h - 20, 0x222c3b).setStrokeStyle(1, 0x3d4e63);
      const shaftL = scene.add.rectangle(-w / 2 - 7, -h / 4, 2, h / 2, 0x8fa0b2);
      const shaftR = scene.add.rectangle(w / 2 + 7, -h / 4, 2, h / 2, 0x8fa0b2);

      // Blast door panel
      const blastPanel = scene.add.rectangle(0, 0, w + 4, h, 0x1e2733).setStrokeStyle(1, 0x475a70);
      this.panelGroup.add(blastPanel);

      // Horizontal interlocking armor slats
      for (let y = -h / 2 + 14; y <= h / 2 - 14; y += 18) {
        const slat = scene.add.rectangle(0, y, w, 4, 0x141b24);
        const rivetL = scene.add.circle(-w / 2 + 4, y, 1.5, 0x8fa0b2);
        const rivetR = scene.add.circle(w / 2 - 4, y, 1.5, 0x8fa0b2);
        this.panelGroup.add([slat, rivetL, rivetR]);
      }

      // Central solenoid deadbolt housing with yellow hazard tag
      const lockBox = scene.add.rectangle(0, 0, 16, 20, 0x0f151e).setStrokeStyle(1, 0x334457);
      const lockTag = scene.add.rectangle(0, -6, 12, 3, 0xd9a441);
      this.panelGroup.add([lockBox, lockTag]);

      this.statusLight = scene.add.circle(0, -h / 2 - 10, 4, 0xd94441);
      this.statusLight.setStrokeStyle(1, 0x111111);

      this.statusText = scene.add
        .text(0, -h / 2 - 24, `${this.label} LOCKED`, {
          fontFamily: "monospace",
          fontSize: "9px",
          color: "#d94441",
        })
        .setOrigin(0.5);

      this.add([this.frame, pistonL, pistonR, shaftL, shaftR, this.panelGroup, this.statusLight, this.statusText]);
    } else if (this.id === "door_alley") {
      // 3. Submarine/Bunker Airlock Hatch
      this.frame = scene.add.rectangle(0, 0, w + 16, h + 12, 0x182029);
      this.frame.setStrokeStyle(2, 0x364656);

      // Perimeter heavy hex bolts
      for (let y = -h / 2 + 6; y <= h / 2 - 6; y += 22) {
        this.frame.scene.add.circle(this.x - w / 2 - 5, this.y + y, 1.5, 0x607489);
        this.frame.scene.add.circle(this.x + w / 2 + 5, this.y + y, 1.5, 0x607489);
      }

      // Airtight hatch panel
      const hatch = scene.add.rectangle(0, 0, w + 2, h, 0x232c38).setStrokeStyle(1, 0x475b70);
      this.panelGroup.add(hatch);

      // Circular observation porthole (reinforced wire mesh glass)
      const portHole = scene.add.circle(0, -22, 11, 0x101720).setStrokeStyle(2, 0x4a6078);
      const portWireH = scene.add.line(0, 0, -8, -22, 8, -22, 0x2b3848).setOrigin(0);
      const portWireV = scene.add.line(0, 0, 0, -30, 0, -14, 0x2b3848).setOrigin(0);
      this.panelGroup.add([portHole, portWireH, portWireV]);

      // 6-spoke central airtight locking wheel
      const wheelHub = scene.add.circle(0, 18, 4, 0x3b4c5e);
      const wheelRim = scene.add.circle(0, 18, 12, 0x000000, 0).setStrokeStyle(2, 0x5a7086);
      this.panelGroup.add([wheelRim, wheelHub]);
      for (let a = 0; a < 360; a += 60) {
        const rad = (a * Math.PI) / 180;
        const spoke = scene.add.line(0, 0, 0, 18, Math.cos(rad) * 11, 18 + Math.sin(rad) * 11, 0x5a7086).setOrigin(0);
        this.panelGroup.add(spoke);
      }

      // Magnetic keycard swipe slot console attached to right jamb
      const cardConsole = scene.add.rectangle(w / 2 + 16, 0, 12, 28, 0x121820).setStrokeStyle(1, 0x334455);
      const swipeSlot = scene.add.rectangle(w / 2 + 16, 0, 2, 16, 0x05070a);
      const cardLED = scene.add.circle(w / 2 + 16, -9, 2, 0xd94441);
      this.cardLED = cardLED;

      this.statusLight = scene.add.circle(0, -h / 2 - 10, 4, 0xd94441);
      this.statusLight.setStrokeStyle(1, 0x111111);

      this.statusText = scene.add
        .text(0, -h / 2 - 24, `${this.label} LOCKED`, {
          fontFamily: "monospace",
          fontSize: "9px",
          color: "#d94441",
        })
        .setOrigin(0.5);

      this.add([this.frame, cardConsole, swipeSlot, cardLED, this.panelGroup, this.statusLight, this.statusText]);
    } else if (this.id === "door_floodgate") {
      // 5. Massive Hydraulic Floodgate 07
      this.frame = scene.add.rectangle(0, 0, w + 20, h + 18, 0x141a22);
      this.frame.setStrokeStyle(2, 0x2b3848);

      // Dual heavy overhead hydraulic cylinders
      const cylL = scene.add.rectangle(-w / 2 - 6, -h / 2 + 10, 8, 36, 0x202b38).setStrokeStyle(1, 0x3d4e62);
      const cylR = scene.add.rectangle(w / 2 + 6, -h / 2 + 10, 8, 36, 0x202b38).setStrokeStyle(1, 0x3d4e62);
      const ramL = scene.add.rectangle(-w / 2 - 6, -h / 2 + 34, 4, 20, 0x7e93a8);
      const ramR = scene.add.rectangle(w / 2 + 6, -h / 2 + 34, 4, 20, 0x7e93a8);

      // Heavy interlocking steel floodgate slab
      const gateSlab = scene.add.rectangle(0, 0, w + 6, h, 0x1c2530).setStrokeStyle(1, 0x47596e);
      this.panelGroup.add(gateSlab);

      // Horizontal hazard striping band in center
      const hazardBand = scene.add.rectangle(0, 0, w + 4, 18, 0xd9a441);
      const hazardStripe1 = scene.add.rectangle(-6, 0, 4, 18, 0x141a22);
      const hazardStripe2 = scene.add.rectangle(6, 0, 4, 18, 0x141a22);
      this.panelGroup.add([hazardBand, hazardStripe1, hazardStripe2]);

      // Steel reinforcement ribs
      [-h / 3, h / 3].forEach((ry) => {
        const rib = scene.add.rectangle(0, ry, w + 4, 6, 0x121820).setStrokeStyle(1, 0x334455);
        this.panelGroup.add(rib);
      });

      this.statusLight = scene.add.circle(0, -h / 2 - 14, 5, 0xd94441);
      this.statusLight.setStrokeStyle(1, 0x111111);

      this.statusText = scene.add
        .text(0, -h / 2 - 28, `${this.label} LOCKED (0 BAR)`, {
          fontFamily: "monospace",
          fontSize: "9px",
          color: "#d94441",
        })
        .setOrigin(0.5);

      this.add([this.frame, cylL, cylR, ramL, ramR, this.panelGroup, this.statusLight, this.statusText]);
    } else {
      // 4. Perimeter Chain-Link / Security Turnstile Gate (Station 09 Track Access)
      this.frame = scene.add.rectangle(0, 0, w + 14, h + 14, 0x1b232c);
      this.frame.setStrokeStyle(2, 0x334252);

      // Overhead coiled razor wire loops
      for (let rx = -w / 2 - 2; rx <= w / 2 + 2; rx += 8) {
        const coil = scene.add.circle(rx, -h / 2 - 4, 6, 0x000000, 0).setStrokeStyle(1, 0x5a6d80);
        this.add(coil);
      }

      // Security chain-link panel
      const gateBody = scene.add.rectangle(0, 0, w, h, 0x141b22, 0.8).setStrokeStyle(2, 0x3f5164);
      this.panelGroup.add(gateBody);

      // Diamond fence wire mesh
      for (let y = -h / 2 + 12; y <= h / 2 - 12; y += 14) {
        const wire1 = scene.add.line(0, 0, -w / 2, y - 6, w / 2, y + 6, 0x2b3846, 0.7).setOrigin(0);
        const wire2 = scene.add.line(0, 0, -w / 2, y + 6, w / 2, y - 6, 0x2b3846, 0.7).setOrigin(0);
        this.panelGroup.add([wire1, wire2]);
      }

      // Warning placard in center
      const placard = scene.add.rectangle(0, 0, 16, 12, 0xd9a441).setStrokeStyle(1, 0x221100);
      const signIcon = scene.add.text(0, 0, "▲", { fontSize: "8px", color: "#11161d" }).setOrigin(0.5);
      this.panelGroup.add([placard, signIcon]);

      this.statusLight = scene.add.circle(0, -h / 2 - 12, 4, 0xd94441);
      this.statusLight.setStrokeStyle(1, 0x111111);

      this.statusText = scene.add
        .text(0, -h / 2 - 26, `${this.label} LOCKED`, {
          fontFamily: "monospace",
          fontSize: "9px",
          color: "#d94441",
        })
        .setOrigin(0.5);

      this.add([this.frame, this.panelGroup, this.statusLight, this.statusText]);
    }
  }

  /**
   * Contract: Determine if interaction is available.
   * @param {Phaser.GameObjects.GameObject} player
   * @returns {boolean}
   */
  canInteract(player) {
    if (!this.enabled || this.opened) return false;
    return this.locked;
  }

  /**
   * Contract: Contextual prompt text.
   * @returns {string}
   */
  getInteractionText() {
    return this.interactionText || "Door locked (No power)";
  }

  /**
   * Contract: Interaction handler.
   * @param {Phaser.GameObjects.GameObject} player
   */
  interact(player) {
    if (!this.canInteract(player)) return;

    // Flash locked indicator
    this.scene.tweens.add({
      targets: this.statusLight,
      alpha: 0.1,
      duration: 70,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.statusLight.setAlpha(1);
      },
    });

    this.scene.events.emit("door:locked_inspected", this);
  }

  /**
   * Unlock the door.
   */
  unlock() {
    this.locked = false;
    this.statusLight.setFillStyle(0x44d977);
    if (this.cardLED) this.cardLED.setFillStyle(0x44d977);
    this.statusText.setText(`${this.label} UNLOCKED`);
    this.statusText.setColor("#44d977");
  }

  /**
   * Lock the door.
   */
  lock() {
    this.locked = true;
    this.statusLight.setFillStyle(0xd94441);
    if (this.cardLED) this.cardLED.setFillStyle(0xd94441);
    this.statusText.setText(`${this.label} LOCKED`);
    this.statusText.setColor("#d94441");
    if (this.barrier && this.barrier.body) {
      this.barrier.body.enable = true;
    }
  }

  /**
   * Open the door (slides panel up and disables physics collision).
   * @param {boolean} [instant=false]
   */
  open(instant = false) {
    if (this.opened) return;
    this.opened = true;

    // Disable physics barrier so player can pass through
    if (this.barrier && this.barrier.body) {
      this.barrier.body.enable = false;
    }

    if (instant) {
      this.panelGroup.y = -this.doorHeight;
      this.panelGroup.alpha = 0.25;
      this.scene.events.emit("door:opened", this);
      return;
    }

    // Heavy blast door pneumatic sliding audio
    this.scene.soundSystem?.playDoorSlide();

    // Door sliding animation
    this.scene.tweens.add({
      targets: this.panelGroup,
      y: -this.doorHeight,
      alpha: 0.25,
      duration: 650,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        this.scene.events.emit("door:opened", this);
      },
    });
  }

  /**
   * Close the door.
   */
  close() {
    if (!this.opened) return;
    this.opened = false;

    if (this.barrier && this.barrier.body) {
      this.barrier.body.enable = true;
    }

    this.scene.tweens.add({
      targets: this.panelGroup,
      y: 0,
      alpha: 1,
      duration: 500,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        this.scene.events.emit("door:closed", this);
      },
    });
  }

  isOpen() {
    return this.opened;
  }

  isLocked() {
    return this.locked;
  }

  /**
   * Contract: Anchor position.
   * @returns {{x: number, y: number}}
   */
  getInteractionPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Contract: Set availability.
   * @param {boolean} value
   */
  setEnabled(value) {
    this.enabled = Boolean(value);
  }

  /**
   * Contract: Explicit cleanup of event listeners and GameObjects.
   */
  destroy(fromScene) {
    if (this.scene && this.onSwitchActivated) {
      this.scene.events.off("switch:activated", this.onSwitchActivated);
    }
    if (this.barrier) {
      this.barrier.destroy();
      this.barrier = null;
    }
    this.scene?.events?.emit("object:destroyed", this);
    super.destroy(fromScene);
  }
}

