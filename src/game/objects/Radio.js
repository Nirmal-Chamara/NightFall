import Phaser from "phaser";

/**
 * Interactive emergency/field radio object.
 * Follows standard interactable contract: canInteract, interact,
 * getInteractionText, getInteractionPosition, setEnabled, destroy.
 */
export default class Radio extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} [config]
   */
  constructor(scene, x, y, config = {}) {
    super(scene, x, y);

    this.dialogueKey = config.dialogueKey || "C1_SHELTER_RADIO";
    this.promptText = config.promptText || "Inspect radio";
    this.isDamaged = Boolean(config.isDamaged);
    this.enabled = true;

    // Radio housing
    const bodyColor = this.isDamaged ? 0x242e38 : 0x2f3e4f;
    const strokeColor = this.isDamaged ? 0x3b4a59 : 0x4f647d;
    const casing = scene.add.rectangle(0, 0, 24, 14, bodyColor);
    casing.setStrokeStyle(1, strokeColor);

    // Speaker grille / tuner dial
    const dial = scene.add.rectangle(-4, 0, 10, 6, 0x111720);
    const ledColor = this.isDamaged ? 0xd94441 : 0xd9a441;
    this.led = scene.add.circle(6, -2, 2, ledColor);

    // Whip antenna (bent slightly if damaged)
    const antenna = scene.add.rectangle(8, -12, 2, 12, 0x6e849e);
    if (this.isDamaged) {
      antenna.setAngle(22);
    }

    this.add([antenna, casing, dial, this.led]);

    // Ambient signal pulse
    this.ledTween = scene.tweens.add({
      targets: this.led,
      alpha: this.isDamaged ? 0.15 : 0.45,
      duration: this.isDamaged ? 450 : 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    scene.add.existing(this);
    this.setDepth(1);
  }

  canInteract() {
    return this.enabled;
  }

  interact() {
    if (!this.canInteract()) return;
    this.scene.dialogueSystem.start(this.dialogueKey);
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
    if (this.ledTween) {
      this.ledTween.stop();
      this.ledTween = null;
    }
    this.scene?.events?.emit("object:destroyed", this);
    super.destroy(fromScene);
  }
}

