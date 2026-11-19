import Phaser from "phaser";
import { OBJECTIVES } from "../data/objectives.js";

export default class ObjectiveSystem {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.currentObjective = null;

    // HUD Container in screen space
    this.container = scene.add.container(24, 24).setScrollFactor(0).setDepth(250).setVisible(false);

    // Dark sleek atmospheric frame
    this.bg = scene.add.rectangle(0, 0, 480, 58, 0x0f151e, 0.92).setOrigin(0, 0);
    this.bg.setStrokeStyle(1, 0x2e3d50);

    // Amber status badge dot
    this.badge = scene.add.circle(16, 18, 4, 0xd9a441);

    // Title label
    this.titleText = scene.add.text(28, 11, "CURRENT OBJECTIVE", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#d9a441",
      letterSpacing: 1,
    });

    // Objective description
    this.descText = scene.add.text(28, 28, "", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#e6ecf0",
      wordWrap: { width: 440 },
    });

    this.container.add([this.bg, this.badge, this.titleText, this.descText]);
  }

  /**
   * Set and display the active objective.
   * @param {string|object} objectiveKeyOrConfig
   */
  setObjective(objectiveKeyOrConfig) {
    let objData = null;

    if (typeof objectiveKeyOrConfig === "string") {
      objData = OBJECTIVES[objectiveKeyOrConfig] || {
        id: objectiveKeyOrConfig,
        title: "CURRENT OBJECTIVE",
        text: objectiveKeyOrConfig,
      };
    } else if (typeof objectiveKeyOrConfig === "object" && objectiveKeyOrConfig !== null) {
      objData = objectiveKeyOrConfig;
    }

    if (!objData) return;

    this.currentObjective = objData;

    this.titleText.setText(objData.title || "CURRENT OBJECTIVE");
    this.descText.setText(objData.text || "");

    this.container.setVisible(true);
    this.container.setAlpha(0);

    // Smooth arrival transition
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 350,
      ease: "Quad.easeOut",
    });

    // Badge flash effect to draw player focus
    this.scene.tweens.add({
      targets: this.badge,
      scaleX: 1.8,
      scaleY: 1.8,
      duration: 180,
      yoyo: true,
      repeat: 1,
    });

    this.scene.events.emit("objective:set", objData);
  }

  /**
   * Mark current objective as completed with visual feedback.
   * @param {string} [id]
   */
  complete(id = null) {
    if (!this.currentObjective) return;

    this.badge.setFillStyle(0x44d977); // Green check
    this.titleText.setColor("#44d977");
    this.titleText.setText("OBJECTIVE COMPLETED");

    this.scene.events.emit("objective:completed", this.currentObjective);

    // Fade out after completion showcase
    this.scene.time.delayedCall(1600, () => {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          this.container.setVisible(false);
          this.badge.setFillStyle(0xd9a441);
          this.titleText.setColor("#d9a441");
        },
      });
    });
  }

  /**
   * Clear active objective display.
   */
  clear() {
    this.container.setVisible(false);
    this.currentObjective = null;
  }

  /**
   * Retrieve current objective object.
   * @returns {object|null}
   */
  getCurrentObjective() {
    return this.currentObjective;
  }

  destroy() {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }
}

