/**
 * NIGHTFALL: The Last Delivery - SaveSystem
 *
 * Handles versioned persistence for story progression, inventory, objectives,
 * checkpoints, and optional hidden ending clues (e.g. Mira's drawing).
 *
 * Strict Rule: No localStorage-dependent logic outside SaveSystem.js.
 */

const STORAGE_KEY = "nightfall_c1_save_data";
const CURRENT_SAVE_VERSION = 1;

export default class SaveSystem {
  constructor(storageKey = STORAGE_KEY) {
    this.storageKey = storageKey;
    this.version = CURRENT_SAVE_VERSION;
  }

  /**
   * Check if a valid save exists in storage.
   * @returns {boolean}
   */
  hasSave() {
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return Boolean(data && typeof data === "object" && data.version);
    } catch (err) {
      console.warn("SaveSystem.hasSave check failed:", err);
      return false;
    }
  }

  /**
   * Save game state with version stamp and timestamp.
   * @param {object} payload
   * @returns {boolean} Success status
   */
  save(payload) {
    try {
      if (!payload || typeof payload !== "object") {
        throw new Error("Invalid save payload");
      }

      const saveData = {
        version: this.version,
        timestamp: Date.now(),
        chapter: payload.chapter ?? 1,
        checkpoint: payload.checkpoint ?? { x: 200, y: 780 },
        currentObjectiveId: payload.currentObjectiveId ?? null,
        story: {
          flags: Array.isArray(payload.story?.flags) ? payload.story.flags : [],
          clues: Array.isArray(payload.story?.clues) ? payload.story.clues : [],
          inventory: Array.isArray(payload.story?.inventory) ? payload.story.inventory : [],
        },
        world: {
          packageCollected: Boolean(payload.world?.packageCollected),
          fuseCollected: Boolean(payload.world?.fuseCollected),
          fuseInstalled: Boolean(payload.world?.fuseInstalled),
          powerRestored: Boolean(payload.world?.powerRestored),
          cratePosition: payload.world?.cratePosition ?? null,
          terminalActivated: Boolean(payload.world?.terminalActivated),
          miraDrawingDiscovered: Boolean(payload.world?.miraDrawingDiscovered),
          miraPhotoDiscovered: Boolean(payload.world?.miraPhotoDiscovered),
          miraNotebookDiscovered: Boolean(payload.world?.miraNotebookDiscovered),
        },
      };

      const serialized = JSON.stringify(saveData);
      window.localStorage.setItem(this.storageKey, serialized);
      return true;
    } catch (err) {
      console.warn("SaveSystem.save failed to write to localStorage:", err);
      return false;
    }
  }

  /**
   * Load and validate save data.
   * @returns {object|null} Deserialized save object or null
   */
  load() {
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return null;

      const data = JSON.parse(raw);
      if (!data || typeof data !== "object") return null;

      // Always pass through migrateSaveData to guarantee clean schema defaults
      return this.migrateSaveData(data);
    } catch (err) {
      console.warn("SaveSystem.load failed:", err);
      return null;
    }
  }

  /**
   * Migration hook and schema sanitizer.
   * @param {object} oldData
   * @returns {object} Migrated data
   */
  migrateSaveData(oldData) {
    return {
      version: this.version,
      timestamp: oldData.timestamp || Date.now(),
      chapter: oldData.chapter || 1,
      checkpoint: oldData.checkpoint || { x: 200, y: 780 },
      currentObjectiveId: oldData.currentObjectiveId || null,
      story: {
        flags: Array.isArray(oldData.story?.flags) ? oldData.story.flags : [],
        clues: Array.isArray(oldData.story?.clues) ? oldData.story.clues : [],
        inventory: Array.isArray(oldData.story?.inventory) ? oldData.story.inventory : [],
      },
      world: {
        packageCollected: Boolean(oldData.world?.packageCollected),
        fuseCollected: Boolean(oldData.world?.fuseCollected),
        fuseInstalled: Boolean(oldData.world?.fuseInstalled),
        powerRestored: Boolean(oldData.world?.powerRestored),
        cratePosition: oldData.world?.cratePosition || null,
        terminalActivated: Boolean(oldData.world?.terminalActivated),
        miraDrawingDiscovered: Boolean(oldData.world?.miraDrawingDiscovered),
        miraPhotoDiscovered: Boolean(oldData.world?.miraPhotoDiscovered),
        miraNotebookDiscovered: Boolean(oldData.world?.miraNotebookDiscovered),
        ...oldData.world,
      },
    };
  }

  /**
   * Remove save data from storage (for clean restart).
   */
  clear() {
    try {
      window.localStorage.removeItem(this.storageKey);
      return true;
    } catch (err) {
      console.warn("SaveSystem.clear failed:", err);
      return false;
    }
  }

  /**
   * Get metadata summary of save data for UI or debugging.
   * @returns {object|null}
   */
  getSaveSummary() {
    try {
      const data = this.load();
      if (!data) return null;

      const clues = Array.isArray(data.story?.clues) ? data.story.clues : [];
      const flags = Array.isArray(data.story?.flags) ? data.story.flags : [];
      const inventory = Array.isArray(data.story?.inventory) ? data.story.inventory : [];

      return {
        version: data.version,
        timestamp: data.timestamp,
        dateFormatted: data.timestamp ? new Date(data.timestamp).toLocaleString() : "Unknown",
        chapter: data.chapter || 1,
        checkpoint: data.checkpoint || { x: 200, y: 780 },
        currentObjectiveId: data.currentObjectiveId || null,
        hasMiraClue: clues.includes("mira_drawing"),
        flagsCount: flags.length,
        inventory,
      };
    } catch (err) {
      console.warn("SaveSystem.getSaveSummary failed:", err);
      return null;
    }
  }
}

