import Phaser from "phaser";
import { STORY_FLAGS } from "../systems/StorySystem.js";

export default class Terminal extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    super(scene, x, y);

    this.enabled = true;
    this.activated = false;

    // Visuals: Industrial emergency communication station
    this.hasSprite = scene.textures.exists("prop_terminal");
    if (this.hasSprite) {
      this.sprite = scene.add.image(0, 0, "prop_terminal").setOrigin(0.5, 0.5);
      this.screenGlow = scene.add.rectangle(1, -18, 22, 16, 0x38bdf8, 0.25);
      this.sign = scene.add
        .text(0, -48, "CONTINUITY NODE", {
          fontFamily: "monospace",
          fontSize: "9px",
          color: "#6b8096",
        })
        .setOrigin(0.5);
      this.add([this.sprite, this.screenGlow, this.sign]);
    } else {
      // 1. Steel housing tower
      this.housing = scene.add.rectangle(0, 0, 48, 68, 0x18202a);
      this.housing.setStrokeStyle(2, 0x2e3c4e);

      // 2. CRT Terminal screen
      this.screen = scene.add.rectangle(0, -12, 36, 26, 0x0a1218);
      this.screen.setStrokeStyle(1, 0x1f3448);

      // 3. Status prompt line on screen
      this.screenGlow = scene.add.rectangle(0, -12, 28, 4, 0xd9a441);

      // 4. Keyboard / input tray
      const keyboard = scene.add.rectangle(0, 12, 38, 8, 0x283442);
      const cables = scene.add.rectangle(0, 26, 12, 12, 0x12171e);

      // 5. Overhead station sign
      this.sign = scene.add
        .text(0, -42, "CONTINUITY NODE", {
          fontFamily: "monospace",
          fontSize: "9px",
          color: "#6b8096",
        })
        .setOrigin(0.5);

      this.add([this.housing, this.screen, this.screenGlow, keyboard, cables, this.sign]);
    }

    scene.add.existing(this);
    this.setDepth(1);

    // Pulsing cursor / monitor sheen
    this.pulseTween = scene.tweens.add({
      targets: this.screenGlow,
      alpha: this.hasSprite ? 0.55 : 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }

  setRestoredState(activated) {
    if (!activated) return;
    this.activated = true;
    if (this.pulseTween) this.pulseTween.stop();
    if (this.screen) this.screen.setFillStyle(0x0e2a38);
    this.screenGlow.setFillStyle(0x38bdf8);
    if (!this.hasSprite) this.screenGlow.setSize(30, 20);
    this.screenGlow.setAlpha(this.hasSprite ? 0.45 : 0.85);
  }

  canInteract(player) {
    return this.enabled && !this.activated;
  }

  interact(player) {
    if (!this.canInteract(player)) return;

    if (this.scene.storySystem && !this.scene.storySystem.hasFlag(STORY_FLAGS.RELAY_BATTERY_CONNECTED)) {
      this.scene.dialogueSystem.start("C1_TERMINAL_OFFLINE");
      return;
    }

    this.activated = true;

    // Terminal spooling whine and data audio
    this.scene.soundSystem?.playTerminalBoot();

    // Screen boots up in phosphor cyan
    if (this.pulseTween) this.pulseTween.stop();
    if (this.screen) this.screen.setFillStyle(0x0e2a38);
    this.screenGlow.setFillStyle(0x38bdf8);
    if (!this.hasSprite) this.screenGlow.setSize(30, 20);
    this.screenGlow.setAlpha(this.hasSprite ? 0.45 : 0.85);

    // Trigger dialogue sequence
    this.scene.dialogueSystem.start("C1_TERMINAL_TRANSMISSION", () => {
      if (this.scene.storySystem) {
        this.scene.storySystem.setFlag(STORY_FLAGS.TERMINAL_ACTIVATED);
      }
      if (this.scene.objectiveSystem) {
        this.scene.objectiveSystem.setObjective("C1_REACH_VIEWPOINT");
      }
      this.scene.events.emit("terminal:activated", this);
    });
  }

  getInteractionText() {
    return this.activated ? "Terminal active" : "Boot emergency terminal";
  }

  getInteractionPosition() {
    return { x: this.x, y: this.y };
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
  }

  destroy(fromScene) {
    if (this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween = null;
    }
    this.scene?.events?.emit("object:destroyed", this);
    super.destroy(fromScene);
  }
}

