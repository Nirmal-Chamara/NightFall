import Phaser from "phaser";

/**
 * BootScene initializes core registry defaults and transitions to PreloadScene.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#0c1118");
    this.scene.start("PreloadScene");
  }
}

