import Phaser from "phaser";
import { DIALOGUE } from "../data/dialogue.js";

export default class DialogueSystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {Phaser.GameObjects.GameObject} player
   */
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    this.isOpen = false;
    this.currentSequence = [];
    this.currentIndex = 0;
    this.onCompleteCallback = null;
    this.activeSequenceId = null;

    // Key to advance dialogue (strictly E only)
    const kb = scene.input.keyboard;
    this.advanceKeyE = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Root UI container positioned in screen space at bottom-center
    this.container = scene.add.container(640, 620).setScrollFactor(0).setDepth(300).setVisible(false);

    // 1. Box Background
    this.bg = scene.add.rectangle(0, 0, 840, 140, 0x101722, 0.94);
    this.bg.setStrokeStyle(2, 0x2e3d50);

    // 2. Type Accent Bar (top indicator strip)
    this.accentBar = scene.add.rectangle(0, -68, 836, 4, 0xd9a441);

    // 3. Header / Speaker Label
    this.headerText = scene.add.text(-390, -50, "", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#d9a441",
      letterSpacing: 1,
    });

    // 4. Main Dialogue Body
    this.bodyText = scene.add.text(-390, -22, "", {
      fontFamily: "monospace",
      fontSize: "15px",
      color: "#f1f5f9",
      wordWrap: { width: 780 },
      lineSpacing: 4,
    });

    // 5. Advance prompt indicator
    this.promptText = scene.add.text(390, 50, "[E] Continue ▾", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#6b8096",
    }).setOrigin(1, 1);

    this.container.add([this.bg, this.accentBar, this.headerText, this.bodyText, this.promptText]);

    // Make dialogue container clickable to advance as a reliable fallback
    this.bg.setInteractive({ useHandCursor: true });
    this.bg.on("pointerdown", () => {
      if (this.isOpen) {
        const now = this.scene.time ? this.scene.time.now : Date.now();
        if (this.openedAt && now - this.openedAt < 160) return;
        this.advance();
      }
    });

    // Also add explicit keyboard event listener for 'E', 'Space', 'Enter'
    this.onKeyDown = (event) => {
      if (!this.isOpen) return;
      if (
        event.code === "KeyE" ||
        event.key === "e" ||
        event.key === "E" ||
        event.code === "Space" ||
        event.code === "Enter"
      ) {
        const now = this.scene.time ? this.scene.time.now : Date.now();
        if (this.openedAt && now - this.openedAt < 160) return;
        this.advance();
      }
    };
    scene.input.keyboard.on("keydown", this.onKeyDown);

    // Pulsing continue indicator
    scene.tweens.add({
      targets: this.promptText,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Start a dialogue sequence by ID (from data/dialogue.js) or direct array.
   * @param {string|Array} sequenceOrId
   * @param {Function} [onComplete]
   */
  start(sequenceOrId, onComplete = null) {
    let sequence = [];
    if (typeof sequenceOrId === "string") {
      this.activeSequenceId = sequenceOrId;
      sequence = DIALOGUE[sequenceOrId] || [];
    } else if (Array.isArray(sequenceOrId)) {
      this.activeSequenceId = null;
      sequence = sequenceOrId;
    }

    if (!sequence.length) {
      onComplete?.();
      return;
    }

    if (this.onCompleteCallback) {
      const prevCb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      prevCb();
    }

    this.currentSequence = sequence;
    this.currentIndex = 0;
    this.onCompleteCallback = onComplete;
    this.isOpen = true;
    this.openedAt = this.scene.time ? this.scene.time.now : Date.now();
    this.lastAdvanceTime = this.openedAt;

    // Halt and disable player movement while reading
    if (this.player && typeof this.player.setInputEnabled === "function") {
      this.player.setInputEnabled(false);
    }

    this.container.setVisible(true);
    this.displayCurrentLine();

    this.scene.events.emit("dialogue:started", this.activeSequenceId);
  }

  /**
   * Render current line with appropriate aesthetic style.
   */
  displayCurrentLine() {
    const line = this.currentSequence[this.currentIndex];
    if (!line) return;

    const type = line.type || "speech";

    // Audio typewriter/radio/terminal beep
    this.scene.soundSystem?.playDialogueBeep(type);

    switch (type) {
      case "thought":
        // Thought: Muted slate, soft lavender header, reflective body
        this.bg.setFillStyle(0x0c121a, 0.92);
        this.bg.setStrokeStyle(1, 0x334155);
        this.accentBar.setFillStyle(0x64748b);
        this.headerText.setText(line.header || "[THOUGHT]");
        this.headerText.setColor("#94a3b8");
        this.bodyText.setColor("#cbd5e1");
        this.promptText.setText("[E] Continue ▾");
        break;

      case "radio":
        // Radio: Dark CRT phosphor green, broadcast header
        this.bg.setFillStyle(0x09140c, 0.96);
        this.bg.setStrokeStyle(2, 0x1b4d27);
        this.accentBar.setFillStyle(0x22c55e);
        this.headerText.setText(line.header || "RADIO // BROADCAST FREQUENCY");
        this.headerText.setColor("#4ade80");
        this.bodyText.setColor("#86efac");
        this.promptText.setText("[E] Next ▾");
        break;

      case "terminal":
        // Terminal: Phosphor cyan digital monitor display
        this.bg.setFillStyle(0x08131d, 0.96);
        this.bg.setStrokeStyle(2, 0x0284c7);
        this.accentBar.setFillStyle(0x38bdf8);
        this.headerText.setText(line.header || "SYSTEM TERMINAL // PROTOCOL");
        this.headerText.setColor("#38bdf8");
        this.bodyText.setColor("#7dd3fc");
        this.promptText.setText("[E] Acknowledge ▾");
        break;

      case "speech":
      default:
        // Speech: Clean charcoal slate with amber speaker badge
        this.bg.setFillStyle(0x101722, 0.94);
        this.bg.setStrokeStyle(2, 0x2e3d50);
        this.accentBar.setFillStyle(0xd9a441);
        const speaker = line.speaker ? `${line.speaker}:` : "SPEECH:";
        this.headerText.setText(line.header || speaker);
        this.headerText.setColor("#d9a441");
        this.bodyText.setColor("#f1f5f9");
        this.promptText.setText("[E] Continue ▾");
        break;
    }

    this.bodyText.setText(line.text);
  }

  /**
   * Advance dialogue line or close if finished.
   */
  advance() {
    const now = this.scene.time ? this.scene.time.now : Date.now();
    if (this.lastAdvanceTime && now - this.lastAdvanceTime < 140) {
      return;
    }
    this.lastAdvanceTime = now;

    this.currentIndex++;
    if (this.currentIndex < this.currentSequence.length) {
      this.displayCurrentLine();
    } else {
      this.close();
    }
  }

  /**
   * Close dialogue and restore player controls.
   */
  close() {
    this.isOpen = false;
    this.container.setVisible(false);

    // Re-enable player movement
    if (this.player && typeof this.player.setInputEnabled === "function") {
      this.player.setInputEnabled(true);
    }

    const completedId = this.activeSequenceId;
    const cb = this.onCompleteCallback;

    this.currentSequence = [];
    this.currentIndex = 0;
    this.onCompleteCallback = null;
    this.activeSequenceId = null;

    if (cb) cb();
    this.scene.events.emit("dialogue:completed", completedId);
  }

  /**
   * Per-frame update checking for advance inputs.
   */
  update() {
    if (!this.isOpen) return;

    const now = this.scene.time ? this.scene.time.now : Date.now();
    if (this.openedAt && now - this.openedAt < 160) {
      return; // Debounce so initial interaction 'E' press does not skip line 0!
    }

    const pressed = Phaser.Input.Keyboard.JustDown(this.advanceKeyE);

    if (pressed) {
      this.advance();
    }
  }

  destroy() {
    if (this.scene && this.scene.input && this.scene.input.keyboard && this.onKeyDown) {
      this.scene.input.keyboard.off("keydown", this.onKeyDown);
    }
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    this.currentSequence = [];
  }
}

