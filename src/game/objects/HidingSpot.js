import Phaser from "phaser";

export default class HidingSpot extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} [label="COVER"]
   */
  constructor(scene, x, y, label = "COVER") {
    super(scene, x, y);

    this.enabled = true;
    this.occupant = null;

    // Visuals: Shadowy alcove / pallet stack to duck behind
    // 1. Dark silhouette backdrop shadow
    this.shadow = scene.add.rectangle(0, 0, 40, 64, 0x0c1117, 0.95);
    this.shadow.setStrokeStyle(1, 0x1f2c3b);

    // 2. Cover pallet / crate foreground slats
    const slat1 = scene.add.rectangle(0, 12, 36, 18, 0x1a2430);
    const slat2 = scene.add.rectangle(0, 24, 38, 10, 0x141d27);

    // 3. Cover label
    this.coverTag = scene.add
      .text(0, -38, `[ ${label} ]`, {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#54687d",
      })
      .setOrigin(0.5);

    this.add([this.shadow, slat1, slat2, this.coverTag]);

    scene.add.existing(this);
    this.setDepth(0); // Sits behind player when not in cover, or player slips into it

    // Update listener to auto-exit if player walks away
    this.onSceneUpdate = () => {
      if (this.occupant) {
        const left = this.occupant.cursors.left.isDown || this.occupant.keys.left.isDown;
        const right = this.occupant.cursors.right.isDown || this.occupant.keys.right.isDown;
        const jump =
          Phaser.Input.Keyboard.JustDown(this.occupant.cursors.up) ||
          Phaser.Input.Keyboard.JustDown(this.occupant.keys.up) ||
          Phaser.Input.Keyboard.JustDown(this.occupant.keys.jump);

        if (left || right || jump) {
          this.exitCover(this.occupant);
        }
      }
    };
    scene.events.on("update", this.onSceneUpdate);
  }

  canInteract(player) {
    if (!this.enabled) return false;
    if (this.occupant === player) return true;
    return Math.abs(player.x - this.x) < 40 && Math.abs(player.y - this.y) < 50;
  }

  interact(player) {
    if (this.occupant === player) {
      this.exitCover(player);
    } else {
      this.takeCover(player);
    }
  }

  takeCover(player) {
    this.occupant = player;
    player.isHiding = true;

    // Center player in cover
    player.setX(this.x);

    // Visual cues: Player dims into shadow
    player.setAlpha(0.35);

    this.coverTag.setColor("#d9a441");
    this.scene.events.emit("cover:entered", this);
  }

  exitCover(player) {
    if (!this.occupant) return;

    this.occupant.isHiding = false;
    this.occupant.setAlpha(1.0);
    this.occupant = null;

    this.coverTag.setColor("#54687d");
    this.scene.events.emit("cover:exited", this);
  }

  getInteractionText() {
    return this.occupant ? "Step out of cover" : "Take cover [Hide]";
  }

  getInteractionPosition() {
    return { x: this.x, y: this.y };
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
    if (!this.enabled && this.occupant) {
      this.exitCover(this.occupant);
    }
  }

  destroy(fromScene) {
    if (this.occupant) {
      this.exitCover(this.occupant);
    }
    if (this.scene && this.onSceneUpdate) {
      this.scene.events.off("update", this.onSceneUpdate);
    }
    this.scene?.events?.emit("object:destroyed", this);
    super.destroy(fromScene);
  }
}

