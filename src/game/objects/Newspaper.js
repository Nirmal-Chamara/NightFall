import Phaser from "phaser";

export default class Newspaper extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    super(scene, x, y);

    this.enabled = true;

    // Visuals: Folded damp newspaper on pavement
    const paper = scene.add.rectangle(0, 0, 24, 12, 0xd0c8b6);
    paper.setStrokeStyle(1, 0x8a7f6c);

    // Headline and text lines
    const line1 = scene.add.rectangle(0, -2, 18, 2, 0x3d352b);
    const line2 = scene.add.rectangle(0, 2, 14, 2, 0x5e5344);

    this.add([paper, line1, line2]);

    scene.add.existing(this);
    this.setDepth(1);
  }

  canInteract(player) {
    return this.enabled;
  }

  interact(player) {
    if (!this.canInteract(player)) return;
    this.scene.dialogueSystem.start("C1_NEWSPAPER");
  }

  getInteractionText() {
    return "Read damp newspaper";
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

