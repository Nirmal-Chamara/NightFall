import Phaser from "phaser";

export default class Fuse extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    super(scene, x, y);

    this.id = "fuse_01";
    this.enabled = true;
    this.collected = false;

    // Visuals: Industrial ceramic cartridge fuse (pixel art sprite with fallback)
    if (scene.textures.exists("prop_fuse")) {
      this.fuseSprite = scene.add.image(0, 0, "prop_fuse");
      this.add(this.fuseSprite);
    } else {
      // 1. Central glass/ceramic cylinder
      this.cylinder = scene.add.rectangle(0, 0, 12, 22, 0x3a88b5);
      this.cylinder.setStrokeStyle(1, 0x245775);

      // 2. Metallic end caps
      const topCap = scene.add.rectangle(0, -9, 14, 5, 0xd0dae3);
      const bottomCap = scene.add.rectangle(0, 9, 14, 5, 0xd0dae3);

      // 3. Copper internal element line
      const element = scene.add.rectangle(0, 0, 2, 12, 0xd9a441);

      this.add([this.cylinder, topCap, bottomCap, element]);
    }

    scene.add.existing(this);
    this.setDepth(2);

    // Gentle floating idle tween to catch player's attention on shelf
    this.idleTween = scene.tweens.add({
      targets: this,
      y: y - 4,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  /**
   * Contract: Availability check.
   * @param {Phaser.GameObjects.GameObject} player
   * @returns {boolean}
   */
  canInteract(player) {
    return this.enabled && !this.collected;
  }

  /**
   * Contract: Collect fuse.
   * @param {Phaser.GameObjects.GameObject} player
   */
  interact(player) {
    if (!this.canInteract(player)) return;

    this.collected = true;
    this.setEnabled(false);

    // Audio feedback
    this.scene.soundSystem?.playPickup();

    if (this.idleTween) {
      this.idleTween.stop();
      this.idleTween = null;
    }

    // Notify scene/systems of fuse collection
    this.scene.events.emit("fuse:collected", this);

    // Pickup animation
    this.scene.tweens.add({
      targets: this,
      y: this.y - 24,
      alpha: 0,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 250,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.destroy();
      },
    });
  }

  /**
   * Contract: Prompt text.
   * @returns {string}
   */
  getInteractionText() {
    return "Take fuse (30A)";
  }

  /**
   * Contract: Position anchor.
   * @returns {{x: number, y: number}}
   */
  getInteractionPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Contract: Enable/disable interaction.
   * @param {boolean} value
   */
  setEnabled(value) {
    this.enabled = Boolean(value);
  }

  /**
   * Contract: Cleanup and destroy.
   */
  destroy(fromScene) {
    if (this.idleTween) {
      this.idleTween.stop();
      this.idleTween = null;
    }
    this.scene?.events?.emit("object:destroyed", this);
    super.destroy(fromScene);
  }
}

