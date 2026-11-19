import Phaser from "phaser";

export default class InteractionSystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {Phaser.GameObjects.GameObject} player
   */
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.interactables = new Set();
    this.currentTarget = null;
    this.maxDistance = 72; // GDD specifies approx 64px interaction range

    // Interaction key (E)
    this.eKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Contextual prompt UI container (strictly triggered by E key)
    this.promptContainer = scene.add.container(0, 0).setDepth(100).setVisible(false);

    this.promptBg = scene.add.rectangle(0, 0, 140, 26, 0x101721, 0.9);
    this.promptBg.setStrokeStyle(1, 0xd9a441, 0.8);

    this.promptText = scene.add.text(0, 0, "", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#e6ecf0",
      align: "center",
    }).setOrigin(0.5);

    this.promptContainer.add([this.promptBg, this.promptText]);
  }

  /**
   * Register an interactable object conforming to the object contract.
   * @param {object} object
   */
  register(object) {
    this.interactables.add(object);
  }

  /**
   * Unregister an interactable object.
   * @param {object} object
   */
  unregister(object) {
    this.interactables.delete(object);
    if (this.currentTarget === object) {
      this.currentTarget = null;
      this.updatePrompt();
    }
  }

  /**
   * Locate the closest enabled interactable within range.
   * @returns {object|null}
   */
  findNearestInteractable() {
    let nearest = null;
    let minDistance = this.maxDistance;

    for (const obj of this.interactables) {
      if (!obj || (typeof obj.canInteract === "function" && !obj.canInteract(this.player))) {
        continue;
      }

      const pos = typeof obj.getInteractionPosition === "function"
        ? obj.getInteractionPosition()
        : { x: obj.x ?? 0, y: obj.y ?? 0 };

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, pos.x, pos.y);
      if (dist <= minDistance) {
        minDistance = dist;
        nearest = obj;
      }
    }

    return nearest;
  }

  /**
   * Update interaction state and prompt display.
   */
  update() {
    // If chapter completed screen is active, suspend interaction so E is reserved for chapter transition
    if (this.scene.chapterCompleted) {
      if (this.currentTarget) {
        this.currentTarget = null;
        this.updatePrompt();
      }
      return;
    }

    // If dialogue is active, suspend interaction input so E is reserved for dialogue advance
    if (this.scene.dialogueSystem && this.scene.dialogueSystem.isOpen) {
      if (this.currentTarget) {
        this.currentTarget = null;
        this.updatePrompt();
      }
      return;
    }

    const nearest = this.findNearestInteractable();

    if (nearest !== this.currentTarget) {
      this.currentTarget = nearest;
      this.updatePrompt();
    } else if (this.currentTarget) {
      this.updatePromptPosition();
    }

    this.handleInput();
  }

  /**
   * Updates prompt text and position.
   */
  updatePrompt() {
    if (!this.currentTarget) {
      this.promptContainer.setVisible(false);
      return;
    }

    const actionText = typeof this.currentTarget.getInteractionText === "function"
      ? this.currentTarget.getInteractionText()
      : "Interact";

    this.promptText.setText(`[E] ${actionText}`);
    const padding = 20;
    this.promptBg.setSize(this.promptText.width + padding, 26);

    this.updatePromptPosition();
    this.promptContainer.setVisible(true);
  }

  /**
   * Re-aligns prompt above target interaction position.
   */
  updatePromptPosition() {
    if (!this.currentTarget) return;

    const pos = typeof this.currentTarget.getInteractionPosition === "function"
      ? this.currentTarget.getInteractionPosition()
      : { x: this.currentTarget.x ?? 0, y: this.currentTarget.y ?? 0 };

    this.promptContainer.setPosition(pos.x, pos.y - 36);
  }

  /**
   * Check for user input and execute interaction.
   */
  handleInput() {
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      if (this.currentTarget && (typeof this.currentTarget.canInteract !== "function" || this.currentTarget.canInteract(this.player))) {
        this.interactWith(this.currentTarget);
      }
    }
  }

  /**
   * Interact with a specific target.
   * @param {object} object
   */
  interactWith(object) {
    if (!object) return;
    this.currentTarget = null;
    this.updatePrompt();
    if (typeof object.interact === "function") {
      object.interact(this.player);
    }
  }

  /**
   * Get current targeted object.
   * @returns {object|null}
   */
  getCurrentTarget() {
    return this.currentTarget;
  }

  /**
   * Cleanup prompt and event hooks.
   */
  destroy() {
    if (this.promptContainer) {
      this.promptContainer.destroy();
      this.promptContainer = null;
    }
    this.interactables.clear();
    this.currentTarget = null;
  }
}

