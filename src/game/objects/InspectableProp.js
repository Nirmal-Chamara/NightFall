import Phaser from "phaser";

export default class InspectableProp extends Phaser.GameObjects.Container {
  /**
   * Reusable environmental inspection prop conforming to InteractionSystem.
   *
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} config
   *   - promptText: string (e.g. "Examine rusted bicycle")
   *   - dialogueKey: string (e.g. "C1_BICYCLE")
   *   - range: number (optional max distance, default 68)
   *   - onInteract: function (optional callback)
   *   - visualFn: function(container) (optional custom visual builder)
   */
  constructor(scene, x, y, config = {}) {
    super(scene, x, y);

    this.promptText = config.promptText || "Inspect";
    this.dialogueKey = config.dialogueKey || null;
    this.range = config.range || 76;
    this.onInteract = config.onInteract || null;
    this.enabled = true;
    this.examined = false;

    if (typeof config.visualFn === "function") {
      config.visualFn(this);
    }

    // Subtle amber glint indicator
    this.sparkle = scene.add.circle(0, -10, 2, 0xd9a441, 0.7);
    this.add(this.sparkle);
    scene.tweens.add({
      targets: this.sparkle,
      alpha: 0.15,
      scaleX: 0.7,
      scaleY: 0.7,
      duration: 1100,
      yoyo: true,
      repeat: -1,
    });

    scene.add.existing(this);
    this.setDepth(1);
    this.setSize(56, 56);
  }

  canInteract(player) {
    if (!this.enabled) return false;
    if (this.scene.dialogueSystem && this.scene.dialogueSystem.isOpen) return false;
    const dist = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);
    return dist <= this.range;
  }

  interact(player) {
    if (!this.canInteract(player)) return;

    this.examined = true;
    if (this.sparkle) {
      this.sparkle.setVisible(false);
    }

    // Play subtle inspection sound safely
    this.scene.soundSystem?.playDialogueBeep("thought");

    if (this.dialogueKey && this.scene.dialogueSystem) {
      this.scene.dialogueSystem.start(this.dialogueKey, () => {
        if (typeof this.onInteract === "function") {
          this.onInteract();
        }
      });
    } else if (typeof this.onInteract === "function") {
      this.onInteract();
    }
  }

  getInteractionText() {
    return this.promptText;
  }

  getInteractionPosition() {
    return { x: this.x, y: this.y };
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
  }

  destroy(fromScene) {
    this.scene?.events?.emit("object:destroyed", this);
    super.destroy(fromScene);
  }
}

