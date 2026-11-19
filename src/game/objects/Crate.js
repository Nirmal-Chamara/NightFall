import Phaser from "phaser";

const CRATE_FLOOR_Y = 856; // Firmly rested on GROUND_TOP = 880 (880 - 48/2 = 856)

export default class Crate extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {object} [options]
   */
  constructor(scene, x, y, width = 48, height = 48, options = {}) {
    const defaultY = (y !== undefined && y !== null) ? y : CRATE_FLOOR_Y;
    super(scene, x, defaultY);

    this.floorY = options.floorY !== undefined ? options.floorY : defaultY;
    this.minX = options.minX !== undefined ? options.minX : (scene.scene?.key === "Chapter2Scene" ? 1600 : 2050);
    this.maxX = options.maxX !== undefined ? options.maxX : (scene.scene?.key === "Chapter2Scene" ? 2200 : 3140);
    this.width = width;
    this.height = height;
    this.enabled = true;
    this.isGrabbed = false;
    this.grabbedPlayer = null;
    this.grabSide = 0; // -1: player is on left, 1: player is on right
    this.pushSpeed = 120;

    // Visuals: Sturdy wooden warehouse crate on steel casters
    if (scene.textures.exists("prop_crate")) {
      this.crateVisual = scene.add.image(0, 0, "prop_crate").setDisplaySize(width, height);
      this.highlight = scene.add.rectangle(0, 0, width + 4, height + 4);
      this.highlight.setStrokeStyle(2, 0xd9a441, 0.9);
      this.highlight.setVisible(false);
      this.add([this.crateVisual, this.highlight]);
    } else {
      this.bg = scene.add.rectangle(0, 0, width, height, 0x6e4e2e);
      this.bg.setStrokeStyle(2, 0x422f1c);
      const brace1 = scene.add.line(0, 0, -width / 2 + 4, -height / 2 + 4, width / 2 - 4, height / 2 - 4, 0x4a341e);
      const brace2 = scene.add.line(0, 0, -width / 2 + 4, height / 2 - 4, width / 2 - 4, -height / 2 + 4, 0x4a341e);
      brace1.setLineWidth(2);
      brace2.setLineWidth(2);
      this.highlight = scene.add.rectangle(0, 0, width + 4, height + 4);
      this.highlight.setStrokeStyle(2, 0xd9a441, 0.9);
      this.highlight.setVisible(false);
      this.add([this.bg, brace1, brace2, this.highlight]);
    }

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(1);

    // Physics configuration:
    this.body.setSize(width, height);
    this.body.setOffset(-width / 2, -height / 2);
    this.body.setCollideWorldBounds(true);
    this.body.setImmovable(true);
    this.body.pushable = false;
    this.body.allowGravity = false;
    this.body.setVelocity(0, 0);
    if (this.body.friction) {
      this.body.friction.x = 0;
    }

    this.lastReleaseTime = 0;

    // Update loop for smooth grab control
    this.onSceneUpdate = () => this.handleGrabUpdate();
    this.scene.events.on("update", this.onSceneUpdate);
  }

  setPosition(x, y) {
    if (this._isSettingPosition) {
      return super.setPosition(x, y);
    }
    this._isSettingPosition = true;
    try {
      if (y !== undefined && y !== null) {
        this.floorY = y;
      }
      const currentY = this.floorY !== undefined ? this.floorY : CRATE_FLOOR_Y;
      super.setPosition(x, currentY);
      if (this.body) {
        this.body.reset(x, currentY);
        this.body.setVelocity(0, 0);
      }
      return this;
    } finally {
      this._isSettingPosition = false;
    }
  }

  /**
   * Contract: Determine if player can grab/interact with the crate.
   * @param {Phaser.GameObjects.GameObject} player
   * @returns {boolean}
   */
  canInteract(player) {
    if (!this.enabled) return false;
    if (this.isGrabbed) return true; // Can always release when grabbed

    if (this.scene && this.scene.time && this.scene.time.now - this.lastReleaseTime < 250) {
      return false;
    }

    // Player cannot grab while standing on top of the crate
    const crateTop = this.y - this.height / 2;
    if (player.body && player.body.bottom <= crateTop + 6) {
      return false;
    }

    // Must be adjacent horizontally and roughly level with crate
    const dy = Math.abs(player.y - this.y);
    const dx = Math.abs(player.x - this.x);
    const maxHorizontal = this.width / 2 + 42;

    return dy < 56 && dx <= maxHorizontal && dx >= this.width / 2 - 8;
  }

  /**
   * Contract: Interaction handler (toggles grab state).
   * @param {Phaser.GameObjects.GameObject} player
   */
  interact(player) {
    if (this.isGrabbed) {
      this.release();
    } else {
      this.grab(player);
    }
  }

  /**
   * Attach player to crate in pushing/pulling state.
   * @param {Phaser.GameObjects.GameObject} player
   */
  grab(player) {
    this.isGrabbed = true;
    this.grabbedPlayer = player;
    this.grabSide = player.x < this.x ? -1 : 1;

    // Anchor player directly alongside the crate face
    const playerHalfW = 16;
    const targetPlayerX = this.x + this.grabSide * (this.width / 2 + playerHalfW + 2);
    const targetPlayerY = this.floorY - 24;
    player.setPosition(targetPlayerX, targetPlayerY);
    player.body.setVelocity(0, 0);
    player.facing = -this.grabSide;
    player.isPushing = true;

    this.body.setImmovable(false);
    player.setInputEnabled(false);
    this.highlight.setVisible(true);

    this.scene.events.emit("crate:grabbed", this);
  }

  /**
   * Release player from pushing/pulling state.
   */
  release() {
    this.isGrabbed = false;
    this.highlight.setVisible(false);
    this.body.setVelocity(0, 0);
    this.body.setImmovable(true);
    this.body.pushable = false;
    const currentY = this.floorY !== undefined ? this.floorY : CRATE_FLOOR_Y;
    this.y = currentY;
    if (this.body) {
      this.body.y = currentY - this.height / 2;
      this.body.setVelocity(0, 0);
    }

    if (this.scene && this.scene.time) {
      this.lastReleaseTime = this.scene.time.now;
    }

    if (this.grabbedPlayer) {
      this.grabbedPlayer.isPushing = false;
      this.grabbedPlayer.setInputEnabled(true);
      this.grabbedPlayer.playAnimationSafe?.("courier_idle");
      this.grabbedPlayer = null;
    }

    this.scene.events.emit("crate:released", this);
  }

  /**
   * Synchronized update while grabbed.
   */
  handleGrabUpdate() {
    if (!this.isGrabbed || !this.grabbedPlayer) {
      return;
    }

    // Keep Y locked strictly to current floor level
    const currentFloorY = this.floorY !== undefined ? this.floorY : CRATE_FLOOR_Y;
    this.y = currentFloorY;
    if (this.body) {
      this.body.y = currentFloorY - this.height / 2;
      this.body.setVelocityY(0);
    }

    const p = this.grabbedPlayer;
    const cursors = p.cursors;
    const keys = p.keys;
    const eKey = this.scene.interactionSystem?.eKey;

    // E key releases cleanly
    if (eKey && Phaser.Input.Keyboard.JustDown(eKey)) {
      this.release();
      return;
    }

    // Jump releases crate and jumps upward
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(cursors.up) ||
      Phaser.Input.Keyboard.JustDown(keys.up) ||
      (keys.jump && Phaser.Input.Keyboard.JustDown(keys.jump));

    if (jumpPressed) {
      this.release();
      p.body.setVelocityY(-520);
      return;
    }

    // Horizontal movement input
    const left = cursors.left.isDown || keys.left.isDown;
    const right = cursors.right.isDown || keys.right.isDown;

    let moveX = 0;
    if (left && !right) {
      moveX = -1;
    } else if (right && !left) {
      moveX = 1;
    }

    // Boundaries configurable per chapter
    const minCrateX = this.minX !== undefined ? this.minX : 2050;
    const maxCrateX = this.maxX !== undefined ? this.maxX : 3140;

    if (moveX < 0 && (this.x - this.width / 2 <= minCrateX || p.x - 16 <= minCrateX - 20)) {
      moveX = 0;
    }
    if (moveX > 0 && (this.x + this.width / 2 >= maxCrateX || p.x + 16 >= maxCrateX + 20)) {
      moveX = 0;
    }

    const vx = moveX * this.pushSpeed;
    this.body.setVelocityX(vx);
    p.body.setVelocityX(vx);

    if (moveX !== 0) {
      p.playAnimationSafe?.("courier_push");
      if (this.scene.time && this.scene.soundSystem) {
        this.scene.soundSystem.playFootstep(this.scene.time.now);
      }
    } else {
      p.playAnimationSafe?.("courier_idle");
    }

    // Facing & tethering
    p.facing = -this.grabSide;
    p.setFlipX(p.facing === -1);

    const playerHalfW = 16;
    const targetPlayerX = this.x + this.grabSide * (this.width / 2 + playerHalfW + 2);
    p.setX(targetPlayerX);
    p.setY(currentFloorY - 24);
  }

  /**
   * Contract: Prompt text.
   * @returns {string}
   */
  getInteractionText() {
    return this.isGrabbed ? "Release crate" : "Push crate";
  }

  /**
   * Contract: Position anchor for interaction prompt.
   * @returns {{x: number, y: number}}
   */
  getInteractionPosition() {
    return { x: this.x, y: this.y - 12 };
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
  }

  destroy(fromScene) {
    if (this.scene) {
      this.scene.events.off("update", this.onSceneUpdate);
      this.scene.events.emit("object:destroyed", this);
    }
    if (this.isGrabbed) {
      this.release();
    }
    super.destroy(fromScene);
  }
}
