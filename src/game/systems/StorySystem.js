export const STORY_FLAGS = {
  C1_START: "C1_START",
  RADIO_OPENING: "RADIO_OPENING",
  PACKAGE_FOUND: "PACKAGE_FOUND",
  GATE_OPEN: "GATE_OPEN",
  STREET_ENTERED: "STREET_ENTERED",
  APARTMENT_ENTERED: "APARTMENT_ENTERED",
  FUSE_COLLECTED: "FUSE_COLLECTED",
  CIRCUIT_PATCHED: "CIRCUIT_PATCHED",
  POWER_RESTORED: "POWER_RESTORED",
  TRANSIT_CARD_FOUND: "TRANSIT_CARD_FOUND",
  ALLEY_DOOR_OPEN: "ALLEY_DOOR_OPEN",
  MIRA_CLUE_FOUND: "MIRA_CLUE_FOUND",
  WANDERER_ALERT: "WANDERER_ALERT",
  CHAIN_DISTRACTED: "CHAIN_DISTRACTED",
  RELAY_BATTERY_CONNECTED: "RELAY_BATTERY_CONNECTED",
  TERMINAL_ACTIVATED: "TERMINAL_ACTIVATED",
  RAILWAY_VIEWPOINT: "RAILWAY_VIEWPOINT",
  C1_COMPLETE: "C1_COMPLETE",

  // Chapter 2 Story Flags
  C2_START: "C2_START",
  C2_NOTE_READ: "C2_NOTE_READ",
  C2_SLUICE_DRAINED: "C2_SLUICE_DRAINED",
  C2_CRATE_FLOATED: "C2_CRATE_FLOATED",
  C2_CIRCUIT_ISOLATED: "C2_CIRCUIT_ISOLATED",
  C2_ACOUSTIC_DISTRACTED: "C2_ACOUSTIC_DISTRACTED",
  C2_DIESEL_VALVE_OPEN: "C2_DIESEL_VALVE_OPEN",
  C2_DIESEL_PUMP_STARTED: "C2_DIESEL_PUMP_STARTED",
  C2_FLOODGATE_OPEN: "C2_FLOODGATE_OPEN",
  C2_ROWAN_CONTACTED: "C2_ROWAN_CONTACTED",
  C2_COMPLETE: "C2_COMPLETE",
};

export default class StorySystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {import("./DialogueSystem.js").default} dialogueSystem
   * @param {import("./ObjectiveSystem.js").default} objectiveSystem
   */
  constructor(scene, dialogueSystem, objectiveSystem) {
    this.scene = scene;
    this.dialogueSystem = dialogueSystem;
    this.objectiveSystem = objectiveSystem;

    // Persistent story flags (separated from temporary physics/animation state)
    this.flags = new Set();
    this.clues = new Set();
    this.inventory = new Set();

    this.bindEvents();
  }

  /**
   * Set progression flag.
   * @param {string} flag
   */
  setFlag(flag) {
    if (this.flags.has(flag)) return;
    this.flags.add(flag);
    this.scene.events.emit("story:flag_set", flag);
  }

  /**
   * Check if flag is set.
   * @param {string} flag
   * @returns {boolean}
   */
  hasFlag(flag) {
    return this.flags.has(flag);
  }

  /**
   * Record a discovered story clue (such as Mira's drawing).
   * @param {string} clueId
   */
  addClue(clueId) {
    this.clues.add(clueId);
    this.scene.events.emit("story:clue_found", clueId);
  }

  hasClue(clueId) {
    return this.clues.has(clueId);
  }

  /**
   * Inventory tracking for key story items.
   * @param {string} item
   */
  addItem(item) {
    this.inventory.add(item);
    this.scene.events.emit("inventory:added", item);
  }

  removeItem(item) {
    this.inventory.delete(item);
    this.scene.events.emit("inventory:removed", item);
  }

  hasItem(item) {
    return this.inventory.has(item);
  }

  /**
   * Export persistent state for SaveSystem.
   */
  getStoryState() {
    return {
      flags: Array.from(this.flags),
      clues: Array.from(this.clues),
      inventory: Array.from(this.inventory),
    };
  }

  /**
   * Restore state.
   */
  loadStoryState(state) {
    if (!state) return;
    this.flags = new Set(state.flags || []);
    this.clues = new Set(state.clues || []);
    this.inventory = new Set(state.inventory || []);
  }

  /**
   * Connect story event listeners to handle progression beats.
   */
  bindEvents() {
    // Package pickup sequence
    this.onPackageCollected = () => {
      this.setFlag(STORY_FLAGS.PACKAGE_FOUND);
      this.addItem("package_relay_key");

      // Play pickup dialogue sequence then set objective
      this.dialogueSystem.start("C1_PACKAGE_FOUND", () => {
        this.objectiveSystem.setObjective("C1_STREET_GATE");
      });
    };
    this.scene.events.on("package:collected", this.onPackageCollected);

    // Fuse pickup
    this.onFuseCollected = () => {
      this.setFlag(STORY_FLAGS.FUSE_COLLECTED);
      this.addItem("fuse_30a");
      this.objectiveSystem.setObjective("C1_ACTIVATE_SWITCH");
    };
    this.scene.events.on("fuse:collected", this.onFuseCollected);

    // Switch installed fuse
    this.onSwitchFuseInstalled = () => {
      this.objectiveSystem.setObjective("C1_ACTIVATE_SWITCH");
    };
    this.scene.events.on("switch:fuse_installed", this.onSwitchFuseInstalled);

    // Power restored
    this.onPowerRestored = () => {
      this.setFlag(STORY_FLAGS.POWER_RESTORED);

      // Play emergency radio broadcast followed by new objective
      this.dialogueSystem.start("C1_POWER_RESTORED", () => {
        this.objectiveSystem.setObjective("C1_SEARCH_MIRA");
      });
    };
    this.scene.events.on("power:restored", this.onPowerRestored);

    // Breaker panel missing fuse inspection
    this.onSwitchMissingFuse = () => {
      if (!this.hasFlag(STORY_FLAGS.FUSE_COLLECTED)) {
        this.dialogueSystem.start("C1_PANEL_EMPTY", () => {
          this.objectiveSystem.setObjective("C1_RESTORE_POWER");
        });
      }
    };
    this.scene.events.on("switch:missing_fuse", this.onSwitchMissingFuse);

    // Locked door inspection
    this.onDoorLockedInspected = () => {
      if (!this.hasFlag(STORY_FLAGS.POWER_RESTORED)) {
        this.objectiveSystem.setObjective("C1_RESTORE_POWER");
      }
    };
    this.scene.events.on("door:locked_inspected", this.onDoorLockedInspected);
  }

  /**
   * Starts the opening chapter sequence with synchronized audio & cinematic camera framing.
   */
  startChapter1Opening() {
    this.setFlag(STORY_FLAGS.C1_START);
    this.objectiveSystem.setObjective("C1_START");

    // Hold player stationary during initial shelter atmosphere setup
    if (this.scene.player) {
      this.scene.player.setInputEnabled(false);
      this.scene.player.body?.setVelocity(0, 0);
    }

    // Play initial shelter radio broadcast after a short atmospheric pause
    this.scene.time.delayedCall(700, () => {
      this.dialogueSystem.start("C1_RADIO_OPENING", () => {
        this.setFlag(STORY_FLAGS.RADIO_OPENING);

        // Three knuckles rapping on the shelter door
        this.scene.soundSystem?.playDoorKnock();

        if (this.scene.cameras?.main) {
          const cam = this.scene.cameras.main;
          cam.stopFollow();
          cam.pan(590, cam.centerY, 800, "Sine.easeInOut");
          this.scene.time.delayedCall(850, () => {
            this.dialogueSystem.start("C1_DOOR_KNOCK", () => {
              this.objectiveSystem.setObjective("C1_PACKAGE");
              cam.startFollow(this.scene.player, true, 0.08, 0.08);
              this.scene.player?.setInputEnabled(true);
            });
          });
        } else {
          this.dialogueSystem.start("C1_DOOR_KNOCK", () => {
            this.objectiveSystem.setObjective("C1_PACKAGE");
            this.scene.player?.setInputEnabled(true);
          });
        }
      });
    });
  }

  /**
   * Starts the opening sequence for Chapter 2: The Drowned Depths.
   */
  startChapter2Opening() {
    this.setFlag(STORY_FLAGS.C2_START);
    this.objectiveSystem.setObjective("C2_START");

    if (this.scene.player) {
      this.scene.player.setInputEnabled(false);
      this.scene.player.body?.setVelocity(0, 0);
    }

    this.scene.time.delayedCall(600, () => {
      this.dialogueSystem.start("C2_OPENING", () => {
        this.objectiveSystem.setObjective("C2_READ_LOG");
        this.scene.player?.setInputEnabled(true);
      });
    });
  }

  destroy() {
    if (this.scene) {
      this.scene.events.off("package:collected", this.onPackageCollected);
      this.scene.events.off("fuse:collected", this.onFuseCollected);
      this.scene.events.off("switch:fuse_installed", this.onSwitchFuseInstalled);
      this.scene.events.off("power:restored", this.onPowerRestored);
      this.scene.events.off("switch:missing_fuse", this.onSwitchMissingFuse);
      this.scene.events.off("door:locked_inspected", this.onDoorLockedInspected);
    }
    this.flags.clear();
    this.clues.clear();
    this.inventory.clear();
  }
}

