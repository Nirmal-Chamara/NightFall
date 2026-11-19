import Phaser from "phaser";

export default class Wanderer extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {number} minX
   * @param {number} maxX
   */
  constructor(scene, x, y, minX = 4050, maxX = 4320) {
    super(scene, x, y);

    this.startX = x;
    this.startY = y;
    this.minX = minX;
    this.maxX = maxX;

    this.speed = 60;
    this.facing = 1; // 1 = right, -1 = left
    this.state = "PATROL"; // PATROL, PAUSE, ALERTED
    this.pauseTimer = 0;
    this.detectionLevel = 0; // 0.0 to 1.0
    this.detectionThreshold = 1.0;
    this.isAlerted = false;

    // Visuals: High-detail human trenchcoat silhouette aligned to bottom of 26x70 physics collider (+35)
    this.hasSprite = scene.textures.exists("wanderer");
    if (this.hasSprite) {
      this.sprite = scene.add.sprite(0, 35, "wanderer", 0).setOrigin(0.5, 1);
    } else {
      this.bodyShape = scene.add.rectangle(0, 0, 26, 70, 0x111720);
      this.bodyShape.setStrokeStyle(1, 0x223040);
      this.eyeSlit = scene.add.rectangle(8, -22, 6, 2, 0xd9a441);
    }

    // Ambient forward vision projection cone aligned directly to hood visor height
    const visorY = this.hasSprite ? -40 : -22;
    const visorOffsetX = this.hasSprite ? 6 : 8;
    this.visorOffsetX = visorOffsetX;

    this.visionCone = scene.add.polygon(
      visorOffsetX,
      visorY,
      [
        { x: 0, y: 30 },
        { x: 170, y: 0 },
        { x: 170, y: 60 },
      ],
      0xd9a441,
      0.08
    );
    this.visionCone.setOrigin(0, 0.5).setBlendMode(Phaser.BlendModes.ADD);

    // Detection Alert Meter UI (Above Wanderer hood)
    this.alertContainer = scene.add.container(0, this.hasSprite ? -68 : -50).setVisible(false);

    this.meterBg = scene.add.rectangle(0, 0, 38, 6, 0x070b10, 0.9);
    this.meterBg.setStrokeStyle(1, 0x2e3d50);

    this.meterFill = scene.add.rectangle(-18, 0, 0, 4, 0xd9a441).setOrigin(0, 0.5);

    this.alertIcon = scene.add
      .text(0, -14, "?", {
        fontFamily: "monospace",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#d9a441",
      })
      .setOrigin(0.5);

    this.alertContainer.add([this.meterBg, this.meterFill, this.alertIcon]);

    if (this.hasSprite) {
      this.add([this.visionCone, this.sprite, this.alertContainer]);
    } else {
      this.add([this.visionCone, this.bodyShape, this.eyeSlit, this.alertContainer]);
    }

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(26, 70);
    this.body.setCollideWorldBounds(true);
    this.body.setGravityY(1000);
    this.setDepth(1);
  }

  /**
   * Main per-frame update loop for patrol and detection.
   * @param {Phaser.GameObjects.GameObject} player
   * @param {number} delta
   */
  updateStealth(player, delta) {
    if (this.isAlerted) return;

    // 1. Patrol movement state machine
    if (this.state === "DISTRACTED") {
      this.body.setVelocityX(0);
      this.playAnimSafe("wanderer_idle");
      this.distractionTimer -= delta;
      if (this.distractionTimer <= 0) {
        this.alertContainer.setVisible(false);
        this.state = "PATROL";
      }
      return;
    } else if (this.state === "PATROL") {
      this.body.setVelocityX(this.facing * this.speed);
      this.playAnimSafe("wanderer_walk");

      if (this.facing === 1 && this.x >= this.maxX) {
        this.x = this.maxX;
        this.startPause(-1);
      } else if (this.facing === -1 && this.x <= this.minX) {
        this.x = this.minX;
        this.startPause(1);
      }
    } else if (this.state === "PAUSE") {
      this.body.setVelocityX(0);
      this.playAnimSafe("wanderer_idle");
      this.pauseTimer -= delta;
      if (this.pauseTimer <= 0) {
        this.facing = this.nextFacing;
        this.updateFacing();
        this.state = "PATROL";
      }
    }

    // 2. Player detection calculation
    this.updateDetection(player, delta);
  }

  playAnimSafe(key) {
    if (this.sprite && this.scene.anims.exists(key) && this.sprite.anims.currentAnim?.key !== key) {
      this.sprite.anims.play(key, true);
    }
  }

  startPause(nextFacing) {
    this.state = "PAUSE";
    this.nextFacing = nextFacing;
    this.pauseTimer = 1400; // 1.4s pause before turning
  }

  updateFacing() {
    if (this.sprite) {
      this.sprite.setFlipX(this.facing === -1);
    }
    if (this.eyeSlit) {
      this.eyeSlit.setX(this.facing * 8);
    }
    this.visionCone.setX(this.facing * this.visorOffsetX);
    this.visionCone.setScale(this.facing, 1);
  }

  /**
   * Line of sight and detection meter calculation.
   * @param {Phaser.GameObjects.GameObject} player
   * @param {number} delta
   */
  updateDetection(player, delta) {
    if (!player || this.isAlerted) return;

    // If player is in cover, line of sight is broken
    const isHidden = Boolean(player.isHiding);
    let canSeePlayer = false;

    if (!isHidden) {
      const dx = player.x - this.x;
      const dy = Math.abs(player.y - this.y);

      // Vertical proximity check (must be on similar ground level)
      if (dy < 64) {
        const inFront = (dx * this.facing) > 0;
        const dist = Math.abs(dx);

        // Sight cone detection (within 170px in front) OR immediate back proximity (touching within 32px)
        if ((inFront && dist <= 170) || dist <= 32) {
          canSeePlayer = true;
        }
      }
    }

    if (canSeePlayer) {
      // Takes 1.2 seconds of direct continuous exposure to fill
      this.detectionLevel += delta / 1200;
      if (this.detectionLevel >= this.detectionThreshold) {
        this.detectionLevel = this.detectionThreshold;
        this.triggerAlert(player);
        return;
      }
    } else {
      // Decays smoothly when line of sight is broken
      if (this.detectionLevel > 0) {
        this.detectionLevel -= delta / 1000;
        if (this.detectionLevel < 0) this.detectionLevel = 0;
      }
    }

    // Audio swell tracking detection level
    this.scene.soundSystem?.updateAlertDrone(this.detectionLevel);

    // Update detection meter UI
    if (this.detectionLevel > 0.05) {
      this.alertContainer.setVisible(true);
      const fillW = Math.min(34, Math.floor(this.detectionLevel * 34));
      this.meterFill.setSize(fillW, 4);

      if (this.detectionLevel > 0.65) {
        this.meterFill.setFillStyle(0xd97441);
        this.alertIcon.setText("!");
        this.alertIcon.setColor("#d97441");
      } else {
        this.meterFill.setFillStyle(0xd9a441);
        this.alertIcon.setText("?");
        this.alertIcon.setColor("#d9a441");
      }
    } else {
      this.alertContainer.setVisible(false);
    }
  }

  triggerAlert(player) {
    this.isAlerted = true;
    this.body.setVelocityX(0);
    this.playAnimSafe("wanderer_alert");

    // Visual alert feedback
    this.alertContainer.setVisible(true);
    this.meterFill.setSize(34, 4);
    this.meterFill.setFillStyle(0xd94441);
    this.alertIcon.setText("!");
    this.alertIcon.setColor("#d94441");

    this.scene.tweens.add({
      targets: this.alertContainer,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 150,
      yoyo: true,
      repeat: 2,
    });

    this.scene.events.emit("wanderer:detected", this);
  }

  /**
   * Distract the Wanderer with noise, forcing him to face the sound source.
   * @param {number} targetX
   * @param {number} [duration=4500]
   */
  distract(targetX, duration = 4500) {
    this.state = "DISTRACTED";
    this.distractionTimer = duration;
    this.facing = targetX < this.x ? -1 : 1;
    this.updateFacing();
    this.body.setVelocityX(0);
    this.playAnimSafe("wanderer_idle");
    this.detectionLevel = 0;
    this.alertContainer.setVisible(true);
    this.meterFill.setSize(18, 4);
    this.meterFill.setFillStyle(0x38bdf8);
    this.alertIcon.setText("?");
    this.alertIcon.setColor("#38bdf8");
  }

  /**
   * Reset Wanderer after a checkpoint reset.
   */
  resetPatrol() {
    this.x = this.startX;
    this.y = this.startY;
    this.facing = 1;
    this.updateFacing();
    this.state = "PATROL";
    this.isAlerted = false;
    this.detectionLevel = 0;
    this.alertContainer.setVisible(false);
    this.body.setVelocity(0, 0);
  }

  destroy(fromScene) {
    super.destroy(fromScene);
  }
}

