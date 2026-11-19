import Phaser from "phaser";

export default class Switch extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} id
   * @param {object} [config={}]
   */
  constructor(scene, x, y, id = "switch_01", config = {}) {
    super(scene, x, y);

    this.id = id;
    this.enabled = true;
    this.requiresFuse = config.requiresFuse !== undefined ? config.requiresFuse : id === "switch_01";
    this.fuseInstalled = !this.requiresFuse;
    this.activated = false;
    this.customPanelLabel = config.panelLabel || (this.requiresFuse ? "MAIN BREAKER" : "CIRCUIT ISOLATOR");
    this.customActionPrompt = config.actionPrompt || (this.requiresFuse ? "Throw main breaker" : "Pull circuit isolator lever");
    this.customActivePrompt = config.activatedPrompt || (this.requiresFuse ? "Power grid active" : "Circuit isolated");

    // Visuals: Wall-mounted industrial breaker panel (pixel art sprite with fallback)
    this.hasSprite = scene.textures.exists("prop_breaker");
    if (this.hasSprite) {
      this.panelSprite = scene.add.image(0, 0, "prop_breaker");
      this.indicator = scene.add.circle(-1, -22, 3, this.requiresFuse ? 0xd94441 : 0xd9a441);

      this.fuseGraphic = scene.add.rectangle(-1, -6, 12, 5, 0x3a88b5).setVisible(!this.requiresFuse);

      this.leverBase = scene.add.rectangle(12, 10, 6, 6, 0x303c4c);
      this.leverHandle = scene.add.rectangle(12, 6, 4, 14, 0xbf8e39);
      this.leverHandle.setOrigin(0.5, 1);

      this.panelLabel = scene.add
        .text(0, -42, this.customPanelLabel, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#6b8096",
        })
        .setOrigin(0.5);

      this.add([
        this.panelSprite,
        this.indicator,
        this.fuseGraphic,
        this.leverBase,
        this.leverHandle,
        this.panelLabel,
      ]);
    } else {
      // 1. Metal casing
      this.panel = scene.add.rectangle(0, 0, 40, 56, 0x1e2733);
      this.panel.setStrokeStyle(2, 0x3a4b60);

      // 2. Status indicator light (Red -> Amber -> Green)
      this.indicator = scene.add.circle(0, -18, 5, 0xd94441);
      this.indicator.setStrokeStyle(1, 0x221111);

      // 3. Fuse receptacle slot (empty initially)
      this.fuseSlot = scene.add.rectangle(0, -4, 18, 8, 0x11161d);
      this.fuseSlot.setStrokeStyle(1, 0x2a3645);

      this.fuseGraphic = scene.add.rectangle(0, -4, 14, 6, 0x3a88b5);
      this.fuseGraphic.setVisible(false);

      // 4. Knife breaker switch lever
      this.leverBase = scene.add.rectangle(0, 14, 8, 8, 0x303c4c);
      this.leverHandle = scene.add.rectangle(0, 8, 4, 16, 0xbf8e39);
      this.leverHandle.setOrigin(0.5, 1); // pivot at base

      // 5. Panel label text
      this.panelLabel = scene.add
        .text(0, -36, "MAIN BREAKER", {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#6b8096",
        })
        .setOrigin(0.5);

      this.add([
        this.panel,
        this.indicator,
        this.fuseSlot,
        this.fuseGraphic,
        this.leverBase,
        this.leverHandle,
        this.panelLabel,
      ]);
    }

    scene.add.existing(this);
    this.setDepth(1);
  }

  /**
   * Contract: Availability check.
   * @param {Phaser.GameObjects.GameObject} player
   * @returns {boolean}
   */
  canInteract(player) {
    if (!this.enabled) return false;
    if (this.activated) return false;
    return true;
  }

  /**
   * Contract: Prompt text based on puzzle progress.
   * @returns {string}
   */
  getInteractionText() {
    if (this.activated) {
      return this.customActivePrompt;
    }

    if (!this.fuseInstalled && this.requiresFuse) {
      const hasFuse = Boolean(this.scene.chapterState?.fuseCollected);
      return hasFuse ? "Install 30A fuse" : "Check panel (Blown fuse)";
    }

    return this.customActionPrompt;
  }

  /**
   * Contract: Execute step in the apartment power chain.
   * @param {Phaser.GameObjects.GameObject} player
   */
  interact(player) {
    if (!this.canInteract(player)) return;

    if (!this.fuseInstalled) {
      const hasFuse = Boolean(this.scene.chapterState?.fuseCollected);
      if (hasFuse) {
        this.installFuse();
      } else {
        this.flashWarning();
      }
      return;
    }

    if (!this.activated) {
      this.activate();
    }
  }

  /**
   * Restore switch state directly without re-triggering audio/tweens.
   * @param {boolean} fuseInstalled
   * @param {boolean} activated
   */
  setRestoredState(fuseInstalled, activated) {
    if (fuseInstalled) {
      this.fuseInstalled = true;
      this.fuseGraphic.setVisible(true);
      this.indicator.setFillStyle(0xd9a441);
    }
    if (activated) {
      this.activated = true;
      this.leverHandle.setAngle(180);
      this.indicator.setFillStyle(0x44d977);
    }
  }

  /**
   * Install the collected fuse into the panel.
   */
  installFuse() {
    this.fuseInstalled = true;
    if (this.scene.chapterState) {
      this.scene.chapterState.fuseInstalled = true;
    }

    // Visual updates
    this.fuseGraphic.setVisible(true);
    this.indicator.setFillStyle(0xd9a441); // Amber status

    // Sound/feedback tween
    this.scene.soundSystem?.playPickup();
    this.scene.tweens.add({
      targets: this.fuseGraphic,
      scaleX: { from: 1.5, to: 1 },
      scaleY: { from: 1.5, to: 1 },
      duration: 200,
      ease: "Back.easeOut",
    });

    this.scene.events.emit("switch:fuse_installed", this);
  }

  /**
   * Activate breaker switch to restore power.
   */
  activate() {
    this.activated = true;
    if (this.scene.chapterState) {
      this.scene.chapterState.powerRestored = true;
    }

    // Flip knife lever down
    this.leverHandle.setAngle(180);
    this.indicator.setFillStyle(0x44d977); // Green status

    // Heavy mechanical breaker throw audio
    this.scene.soundSystem?.playBreakerThrow();

    // Pulsing power glow feedback
    this.scene.tweens.add({
      targets: this.indicator,
      scaleX: 1.6,
      scaleY: 1.6,
      duration: 150,
      yoyo: true,
      repeat: 2,
    });

    // Notify listeners (connected Door listens for this exact event)
    this.scene.events.emit("switch:activated", this.id);
    this.scene.events.emit("power:restored", this);
  }

  deactivate() {
    this.activated = false;
    this.leverHandle.setAngle(0);
    this.indicator.setFillStyle(this.fuseInstalled ? 0xd9a441 : 0xd94441);
  }

  toggle() {
    if (this.activated) this.deactivate();
    else if (this.fuseInstalled) this.activate();
  }

  isActivated() {
    return this.activated;
  }

  /**
   * Visual warning feedback when missing fuse is examined.
   */
  flashWarning() {
    this.scene.tweens.add({
      targets: this.indicator,
      alpha: 0.2,
      duration: 80,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.indicator.setAlpha(1);
      },
    });

    this.scene.events.emit("switch:missing_fuse", this);
  }

  /**
   * Contract: Position anchor.
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
   * Contract: Cleanup and destroy.
   */
  destroy(fromScene) {
    this.scene?.events?.emit("object:destroyed", this);
    super.destroy(fromScene);
  }
}

