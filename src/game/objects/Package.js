import Phaser from "phaser";

export default class Package extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    super(scene, x, y);

    this.enabled = true;
    this.collected = false;

    // Visuals: Pixel art dispatch parcel with glowing LED (geometric fallback)
    if (scene.textures.exists("prop_package")) {
      this.box = scene.add.image(0, 0, "prop_package");
      this.indicator = scene.add.circle(-5, -6, 2, 0xd9a441);
      this.add([this.box, this.indicator]);

      scene.tweens.add({
        targets: this.indicator,
        alpha: 0.2,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
    } else {
      // 1. Package cardboard body
      this.box = scene.add.rectangle(0, 0, 28, 18, 0x8b653e);
      this.box.setStrokeStyle(1, 0x5a3e20);

      // 2. White delivery label/tape
      this.label = scene.add.rectangle(0, 0, 8, 18, 0xded5be);

      // 3. Faint amber indicator light (Continuity Relay Key indicator)
      this.indicator = scene.add.rectangle(7, -3, 3, 3, 0xd9a441);

      this.add([this.box, this.label, this.indicator]);
    }

    scene.add.existing(this);
    this.setDepth(1);
  }

  /**
   * Contract: Determine if player can interact with the package.
   * @param {Phaser.GameObjects.GameObject} player
   * @returns {boolean}
   */
  canInteract(player) {
    return this.enabled && !this.collected;
  }

  /**
   * Contract: Perform interaction.
   * @param {Phaser.GameObjects.GameObject} player
   */
  interact(player) {
    if (!this.canInteract(player)) return;

    this.collected = true;
    this.setEnabled(false);

    // Audio feedback
    this.scene.soundSystem?.playPickup();

    // Notify scene of package collection
    this.scene.events.emit("package:collected", this);

    // Pickup animation feedback then destroy
    this.scene.tweens.add({
      targets: this,
      y: this.y - 18,
      alpha: 0,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 220,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.destroy();
      },
    });
  }

  /**
   * Contract: Prompt text displayed above object.
   * @returns {string}
   */
  getInteractionText() {
    return "Take package";
  }

  /**
   * Contract: Interaction position anchor for distance checks and prompt display.
   * @returns {{x: number, y: number}}
   */
  getInteractionPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Contract: Enable or disable interaction availability.
   * @param {boolean} value
   */
  setEnabled(value) {
    this.enabled = Boolean(value);
  }

  /**
   * Contract: Cleanup and destroy.
   */
  destroy(fromScene) {
    this.scene.events.emit("object:destroyed", this);
    super.destroy(fromScene);
  }
}

