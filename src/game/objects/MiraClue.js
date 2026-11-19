import Phaser from "phaser";

export default class MiraClue extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} config
   */
  constructor(scene, x, y, config) {
    super(scene, x, y);

    this.clueId = config.id;
    this.dialogueKey = config.dialogueKey;
    this.promptText = config.interactionText;
    this.clueFlag = config.clueFlag || null;
    this.enabled = true;
    this.discovered = false;

    // Visual placeholder based on type
    if (config.visualType === "drawing") {
      // Child's drawing sheet pinned to wall above desk
      const paper = scene.add.rectangle(0, 0, 20, 24, 0xeee8d5);
      paper.setStrokeStyle(1, 0xbab29b);
      // Small colorful crayon figures (two silhouettes under lights)
      const figure1 = scene.add.rectangle(-4, 2, 4, 10, 0xd9a441);
      const figure2 = scene.add.rectangle(4, 4, 3, 7, 0x4fa3d1);
      const lights = scene.add.rectangle(0, -7, 14, 2, 0xd9a441);
      this.add([paper, figure1, figure2, lights]);
    } else if (config.visualType === "notebook") {
      // Small open notebook with lined pages
      const cover = scene.add.rectangle(0, 0, 18, 22, 0x2b3846);
      const pages = scene.add.rectangle(0, 0, 16, 20, 0xe2ded4);
      const lines = scene.add.rectangle(0, 0, 10, 12, 0xa39c8e);
      this.add([cover, pages, lines]);
    } else {
      // Framed photograph
      const frame = scene.add.rectangle(0, 0, 16, 20, 0x4a3b2c);
      const pic = scene.add.rectangle(0, 0, 12, 16, 0xcfd6dc);
      this.add([frame, pic]);
    }

    // Glow highlight once examined
    this.sparkle = scene.add.circle(6, -8, 2, 0xd9a441).setVisible(false);
    this.add(this.sparkle);

    scene.add.existing(this);
    this.setDepth(1);
  }

  canInteract(player) {
    return this.enabled;
  }

  interact(player) {
    if (!this.canInteract(player)) return;

    this.discovered = true;
    this.sparkle.setVisible(true);

    // Play signature motif for Mira clues (GDD line 300) or standard pickup chime
    if (this.clueId && this.clueId.includes("mira") && this.scene.soundSystem?.playMiraMotif) {
      this.scene.soundSystem.playMiraMotif();
    } else {
      this.scene.soundSystem?.playPickup();
    }

    // Register clue and flag in StorySystem
    if (this.clueFlag && this.scene.storySystem) {
      this.scene.storySystem.addClue(this.clueId);
      this.scene.storySystem.setFlag(this.clueFlag);
    }

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
    this.scene?.events?.emit("object:destroyed", this);
    super.destroy(fromScene);
  }
}

