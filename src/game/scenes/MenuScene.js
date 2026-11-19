import Phaser from "phaser";
import SaveSystem from "../systems/SaveSystem.js";
import { VIEW_WIDTH, VIEW_HEIGHT } from "../constants.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    this.saveSystem = new SaveSystem();
    this.hasSave = this.saveSystem.hasSave();
    this.saveSummary = this.hasSave ? this.saveSystem.getSaveSummary() : null;
    this.isTransitioning = false;
    this.selectedIndex = 0;

    this.cameras.main.setBackgroundColor("#0c1118");
    this.createBackdrop();
    this.createHeader();
    this.createMenuButtons();
    this.createControlsHint();

    const kb = this.input.keyboard;
    this.upKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.wKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.downKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.sKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.enterKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.eKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.events.once("shutdown", () => {
      this.tweens.killAll();
    });
  }

  createBackdrop() {
    const cx = VIEW_WIDTH / 2;

    // Distant city silhouette
    for (let x = 40; x < VIEW_WIDTH; x += 120) {
      const h = Phaser.Math.Between(140, 320);
      this.add.rectangle(x, VIEW_HEIGHT - h / 2, 86, h, 0x101720);
    }

    // Signal beacon glow on right horizon
    const beacon = this.add.circle(1060, 260, 5, 0xd94441);
    this.tweens.add({
      targets: beacon,
      alpha: 0.2,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    const beam = this.add.polygon(
      1060,
      260,
      [
        { x: 260, y: 55 },
        { x: 0, y: 0 },
        { x: 0, y: 110 },
      ],
      0xd94441,
      0.07
    );
    beam.setOrigin(1, 0.5);

    // Ambient rain streaks
    this.rainDrops = [];
    for (let i = 0; i < 45; i++) {
      const drop = this.add
        .line(0, 0, 0, 0, -2, 14, 0x7ea2c7, 0.22)
        .setPosition(
          Phaser.Math.Between(0, VIEW_WIDTH),
          Phaser.Math.Between(0, VIEW_HEIGHT)
        );
      drop.setData("speed", Phaser.Math.Between(5, 9));
      this.rainDrops.push(drop);
    }

    // Center frame card
    const panel = this.add.rectangle(cx, 390, 560, 380, 0x0f1620, 0.86);
    panel.setStrokeStyle(1, 0x243242);
  }

  createHeader() {
    const cx = VIEW_WIDTH / 2;

    this.add
      .text(cx, 150, "NIGHTFALL", {
        fontFamily: "monospace",
        fontSize: "52px",
        fontStyle: "bold",
        color: "#f1f5f9",
        letterSpacing: 10,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 198, "THE LAST DELIVERY", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#d9a441",
        letterSpacing: 5,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 240, "CHAPTER 1 // THE SILENT CROSSING", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#6b8096",
        letterSpacing: 2,
      })
      .setOrigin(0.5);
  }

  createMenuButtons() {
    const cx = VIEW_WIDTH / 2;
    this.menuItems = [];

    const options = [];
    if (this.hasSave) {
      const savedCh = this.saveSummary?.chapter || 1;
      options.push({
        label: `CONTINUE (CH. ${savedCh})`,
        action: () => this.launchChapter(false, savedCh),
      });
    }
    options.push({
      label: "CH. 1 // THE SILENT CROSSING",
      action: () => this.launchChapter(true, 1),
    });
    options.push({
      label: "CH. 2 // THE DROWNED DEPTHS",
      action: () => this.launchChapter(false, 2),
    });

    const startY = this.hasSave ? 295 : 325;
    options.forEach((opt, idx) => {
      const y = startY + idx * 56;
      const bg = this.add.rectangle(cx, y, 380, 44, 0x16202c).setStrokeStyle(1, 0x314357);
      const label = this.add
        .text(cx, y, opt.label, {
          fontFamily: "monospace",
          fontSize: "14px",
          fontStyle: "bold",
          color: "#cbd5e1",
          letterSpacing: 2,
        })
        .setOrigin(0.5);

      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerover", () => {
        this.selectedIndex = idx;
        this.refreshSelection();
      });
      bg.on("pointerdown", () => {
        opt.action();
      });

      this.menuItems.push({ bg, label, action: opt.action });
    });

    if (this.saveSummary) {
      const clueTag = this.saveSummary.hasMiraClue ? " | Clue Found" : "";
      this.add
        .text(cx, 470, `Saved Session: Ch. ${this.saveSummary.chapter || 1} • ${this.saveSummary.dateFormatted}${clueTag}`, {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#7dd3fc",
        })
        .setOrigin(0.5);
    }

    this.refreshSelection();
  }

  createControlsHint() {
    const cx = VIEW_WIDTH / 2;
    this.add
      .text(
        cx,
        540,
        "[A / D] Move   |   [W / SPACE] Jump\n[E] Interact / Push Crate / Advance Dialogue",
        {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#6b8096",
          align: "center",
          lineSpacing: 6,
        }
      )
      .setOrigin(0.5);
  }

  refreshSelection() {
    this.menuItems.forEach((item, idx) => {
      const active = idx === this.selectedIndex;
      item.bg.setFillStyle(active ? 0x1e2c3d : 0x141d28);
      item.bg.setStrokeStyle(active ? 2 : 1, active ? 0xd9a441 : 0x2b3b4e);
      item.label.setColor(active ? "#f8fafc" : "#94a3b8");
    });
  }

  launchChapter(newGame, chapter = 1) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    if (newGame) {
      this.saveSystem.clear();
    }

    const sceneKey = chapter === 2 ? "Chapter2Scene" : "Chapter1Scene";

    this.cameras.main.fadeOut(350, 8, 12, 18);
    this.time.delayedCall(360, () => {
      this.scene.start(sceneKey, { newGame });
    });
  }

  update() {
    for (let i = 0; i < this.rainDrops.length; i++) {
      const drop = this.rainDrops[i];
      const spd = drop.getData("speed");
      drop.x -= spd * 0.15;
      drop.y += spd;
      if (drop.y > VIEW_HEIGHT + 20) {
        drop.x = Phaser.Math.Between(0, VIEW_WIDTH + 60);
        drop.y = -20;
      }
    }

    if (this.isTransitioning || !this.menuItems.length) return;

    if (
      Phaser.Input.Keyboard.JustDown(this.upKey) ||
      Phaser.Input.Keyboard.JustDown(this.wKey)
    ) {
      this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
      this.refreshSelection();
    } else if (
      Phaser.Input.Keyboard.JustDown(this.downKey) ||
      Phaser.Input.Keyboard.JustDown(this.sKey)
    ) {
      this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
      this.refreshSelection();
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.enterKey) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
      Phaser.Input.Keyboard.JustDown(this.eKey)
    ) {
      this.menuItems[this.selectedIndex].action();
    }
  }
}
