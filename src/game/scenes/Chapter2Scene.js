import Phaser from "phaser";
import Player from "../entities/Player.js";
import Wanderer from "../entities/Wanderer.js";
import InteractionSystem from "../systems/InteractionSystem.js";
import DialogueSystem from "../systems/DialogueSystem.js";
import ObjectiveSystem from "../systems/ObjectiveSystem.js";
import StorySystem, { STORY_FLAGS } from "../systems/StorySystem.js";
import SaveSystem from "../systems/SaveSystem.js";
import SoundSystem from "../systems/SoundSystem.js";
import Crate from "../objects/Crate.js";
import Switch from "../objects/Switch.js";
import Door from "../objects/Door.js";
import HidingSpot from "../objects/HidingSpot.js";
import InspectableProp from "../objects/InspectableProp.js";
import { AREAS, GROUND_TOP, puzzleConfig, blockoutConfig } from "../data/chapter2.js";
import { WORLD_WIDTH, WORLD_HEIGHT, VIEW_WIDTH, VIEW_HEIGHT } from "../constants.js";

export default class Chapter2Scene extends Phaser.Scene {
  constructor() {
    super("Chapter2Scene");
  }

  init(data) {
    this.launchOptions = data || {};
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Camera initial setup & fade-in (industrial deep slate, not pitch black)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor("#0c131c");
    this.cameras.main.fadeIn(500);

    // Chapter 2 State Tracking
    this.chapterCompleted = false;
    this.isResetting = false;
    this.checkpoint = { x: puzzleConfig.viaductDescent.startPos.x, y: puzzleConfig.viaductDescent.startPos.y };
    this.currentZone = "Viaduct Descent";

    // Puzzle State
    this.chapterState = {
      noteRead: false,
      sluiceDrained: false,
      crateFloated: false,
      circuitIsolated: false,
      acousticDistracted: false,
      dieselValveOpen: false,
      pumpStarted: false,
      floodgateOpen: false,
      rowanMet: false,
    };

    // Subterranean visual and collision groups
    this.roomWalls = this.physics.add.staticGroup();
    this.solidPlatforms = this.physics.add.staticGroup();
    this.ladders = [];
    this.waterZones = [];
    this.waterDrips = [];
    this.chemLights = [];
    this.mistBands = [];

    // Check for existing save state for Chapter 2
    this.saveSystem = new SaveSystem();
    const existingSave = this.launchOptions?.newGame ? null : this.saveSystem.load();
    if (existingSave && existingSave.chapter === 2) {
      if (existingSave.checkpoint) {
        this.checkpoint = { x: existingSave.checkpoint.x, y: existingSave.checkpoint.y };
      }
      if (existingSave.world) {
        Object.assign(this.chapterState, existingSave.world);
      }
    }

    // 1. Build Background Architecture for all 7 areas
    this.createAreaBands();
    this.createSubterraneanAtmosphere();
    this.createWorldGround();

    // 2. Build Specific Environmental Areas
    this.createArea1_ViaductDescent();
    this.createArea2_SluiceBasin();
    this.createArea3_GeneratorBay();
    this.createArea4_ElectrifiedSump();
    this.createArea5_EchoingAqueduct();
    this.createArea6_PumpingStation();
    this.createArea7_Sector7MarshallingYard();

    // 3. Systems Initialization
    this.soundSystem = new SoundSystem(this);
    this.soundSystem.setIndoorState(true);

    this.player = new Player(this, this.checkpoint.x, this.checkpoint.y);
    this.physics.add.collider(this.player, this.solidPlatforms);
    this.physics.add.collider(this.player, this.roomWalls);

    // Personal subtle courier rim light for unlit subterranean drainage tunnels
    if (this.textures.exists("fx_radial_glow")) {
      this.playerGlow = this.add
        .image(this.player.x, this.player.y - 10, "fx_radial_glow")
        .setDisplaySize(180, 180)
        .setTint(0x38bdf8)
        .setAlpha(0.32)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(9);
    }

    // Interactive object colliders
    if (this.bayCrate) {
      this.physics.add.collider(this.player, this.bayCrate);
    }
    if (this.floodgate && this.floodgate.barrier) {
      this.physics.add.collider(this.player, this.floodgate.barrier);
      this.interactionSystem?.register(this.floodgate);
    }
    if (this.wanderer) {
      this.physics.add.collider(this.wanderer, this.solidPlatforms);
    }

    this.interactionSystem = new InteractionSystem(this, this.player);
    this.dialogueSystem = new DialogueSystem(this, this.player);
    this.objectiveSystem = new ObjectiveSystem(this);
    this.storySystem = new StorySystem(this, this.dialogueSystem, this.objectiveSystem);

    // Make sure floodgate is registered in interaction system
    if (this.floodgate) {
      this.interactionSystem.register(this.floodgate);
    }

    // Immediate camera centering on player so there is never a black lerp gap
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // 4. Register Interactive Objects
    this.setupInteractions();

    // 5. Completion Screen
    this.setupCompletionCard();

    // 6. Audio Unlock & Opening Sequence
    this.input.keyboard.on("keydown", () => {
      this.soundSystem?.ensureContext();
    });

    this.storySystem.startChapter2Opening();

    this.events.on("wanderer:detected", () => {
      this.handleWandererDetected();
    });

    // Keybindings for completion screen
    const kb = this.input.keyboard;
    this.mKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.oneKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.completionEKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  createAreaBands() {
    const bandThemes = [
      { name: "VIADUCT DESCENT & CULVERT ENTRANCE", color: 0x0f1722, altColor: 0x141f2d, sign: "SECTOR 07 // CULVERT INTAKE" },
      { name: "SLUICE BASIN & DRAINAGE WHEEL", color: 0x111c28, altColor: 0x162332, sign: "SLUICE GATE 02 // RETENTION BASIN" },
      { name: "SUBMERGED GENERATOR BAY & FLOATING CRATE", color: 0x0d1520, altColor: 0x131e2c, sign: "TURBINE GENERATOR BAY // DEEP SUMP" },
      { name: "ELECTRIFIED SUMP & CIRCUIT ISOLATOR", color: 0x101a24, altColor: 0x15212e, sign: "FEEDER VAULT 03 // HIGH VOLTAGE" },
      { name: "ECHOING AQUEDUCT & ACOUSTIC PATROL", color: 0x0e1721, altColor: 0x131f2b, sign: "VAULTED AQUEDUCT // SILENT ZONE" },
      { name: "PUMPING STATION 07 & FLOODGATE", color: 0x121c27, altColor: 0x172433, sign: "PUMP STATION 07 // HYDRAULIC CONTROL" },
      { name: "SECTOR 7 MARSHALLING YARD & CABIN", color: 0x0f1620, altColor: 0x151e2a, sign: "SECTOR 07 YARD // SIGNAL CABIN" },
    ];

    AREAS.forEach((area, i) => {
      const w = area.end - area.start;
      const theme = bandThemes[i] || { color: 0x0f151e, altColor: 0x151e29, sign: area.name };

      // Base background tone
      this.add
        .rectangle(area.start + w / 2, WORLD_HEIGHT / 2, w, WORLD_HEIGHT, theme.color)
        .setDepth(-6);

      // Vaulted subterranean architectural ribs and arches
      for (let ax = area.start + 60; ax < area.end; ax += 180) {
        this.add.rectangle(ax, 380, 16, 600, theme.altColor, 0.6).setDepth(-5);
        this.add.rectangle(ax, 82, 32, 16, theme.altColor, 0.75).setDepth(-5);
      }

      // Industrial header conduit tray
      this.add.rectangle(area.start + w / 2, 88, w, 6, 0x1c2838).setDepth(-5);

      // Area designation stenciled signage
      this.add
        .text(area.start + 24, 28, `CH.2 // ${i + 1}. ${theme.sign}`, {
          fontFamily: "monospace",
          fontSize: "12px",
          fontStyle: "bold",
          color: "#475e75",
          letterSpacing: 2,
        })
        .setDepth(-5);
    });
  }

  createSubterraneanAtmosphere() {
    // Overhead massive concrete ceiling girder spanning across the tunnels
    const ceiling = this.add.rectangle(WORLD_WIDTH / 2, 50, WORLD_WIDTH, 100, 0x090e14).setDepth(-3);
    this.roomWalls.add(ceiling);

    // Overhead heavy conduit runs
    [-12, 8, 26].forEach((py) => {
      this.add.rectangle(WORLD_WIDTH / 2, 100 + py, WORLD_WIDTH, 6, 0x182230).setDepth(-3);
    });

    // Subterranean weeping moisture drips falling from ceiling
    for (let i = 0; i < 40; i++) {
      const drip = this.add.line(0, 0, 0, 0, 0, 7, 0x688fa8, 0.55);
      drip.setPosition(Phaser.Math.Between(40, WORLD_WIDTH - 40), Phaser.Math.Between(100, 780));
      drip.setData("speedY", Phaser.Math.Between(3, 6));
      drip.setData("originY", 100);
      drip.setData("targetY", Phaser.Math.Between(840, 878));
      this.waterDrips.push(drip);
    }

    // Creeping cold humidity mist bands drifting along the canal floor
    this.mistBands = [];
    for (let x = 300; x < WORLD_WIDTH; x += 600) {
      const mist = this.add.rectangle(x, 866, 500, 32, 0x243547, 0.16).setDepth(-2);
      this.tweens.add({
        targets: mist,
        x: x + 40,
        alpha: 0.08,
        duration: 3500 + (x % 1200),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.mistBands.push(mist);
    }

    // Periodic distant storm thunder & faint lightning sheet flashes through storm grates
    this.lightningOverlay = this.add
      .rectangle(640, 360, 1280, 720, 0x334455, 0)
      .setScrollFactor(0)
      .setDepth(-10)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.time.addEvent({
      delay: 16000,
      loop: true,
      callback: () => {
        this.tweens.add({
          targets: this.lightningOverlay,
          alpha: 0.16,
          duration: 60,
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            this.time.delayedCall(400, () => {
              this.soundSystem?.playThunder();
            });
          },
        });
      },
    });

    // Subtle dark screen border vignette
    const vig = this.add.graphics().setScrollFactor(0).setDepth(200);
    vig.fillStyle(0x000000, 0.35);
    vig.fillRect(0, 0, VIEW_WIDTH, 14);
    vig.fillRect(0, VIEW_HEIGHT - 14, VIEW_WIDTH, 14);
    vig.fillRect(0, 0, 16, VIEW_HEIGHT);
    vig.fillRect(VIEW_WIDTH - 16, 0, 16, VIEW_HEIGHT);
  }

  createWorldGround() {
    // Solid base foundation
    const ground = this.add.rectangle(WORLD_WIDTH / 2, GROUND_TOP + 40, WORLD_WIDTH, 80, 0x18222d);
    this.physics.add.existing(ground, true);
    this.solidPlatforms.add(ground);

    if (this.textures.exists("tex_asphalt_tile")) {
      ground.setVisible(false);
      this.add.tileSprite(WORLD_WIDTH / 2, GROUND_TOP + 40, WORLD_WIDTH, 80, "tex_asphalt_tile").setDepth(-1);
    }

    // Concrete curb coping stone along top edge of ground
    this.add.rectangle(WORLD_WIDTH / 2, GROUND_TOP + 1, WORLD_WIDTH, 3, 0x36495d).setDepth(-1);

    // Hazard warning stripes at water drop-offs (generator pit & electric pool)
    const hazardSpots = [
      { startX: 1836, endX: 1844, label: "SUMP EDGE" },
      { startX: 2156, endX: 2164, label: "CATWALK SILL" },
      { startX: 2736, endX: 2744, label: "VOLTAGE BOUNDARY" },
      { startX: 3096, endX: 3104, label: "VOLTAGE BOUNDARY" },
    ];
    hazardSpots.forEach((h) => {
      this.add.rectangle(h.startX, GROUND_TOP, 10, 4, 0xd9a441).setDepth(0);
    });
  }

  createArea1_ViaductDescent() {
    const area = AREAS[0];
    const w = area.end - area.start;
    const cx = area.start + w / 2;

    // Weeping concrete background
    if (this.textures.exists("tex_drainage_culvert")) {
      this.add.tileSprite(cx, 500, w, 760, "tex_drainage_culvert").setAlpha(0.85).setDepth(-4);
    }

    // Vertical viaduct service ladder on far left
    const cfg = puzzleConfig.viaductDescent;
    this.createLadder(cfg.ladder.x, cfg.ladder.yTop, cfg.ladder.yBottom);

    // Massive viaduct pier pillars
    [80, 280, 520].forEach((px) => {
      this.add.rectangle(px, 500, 36, 760, 0x151e29).setStrokeStyle(1, 0x233142).setDepth(-3);
      // Pillar corbel bracket
      this.add.triangle(px + 18, 140, 0, 0, 0, 40, 24, 0, 0x151e29).setDepth(-3);
      this.add.triangle(px - 18, 140, 0, 0, 0, 40, -24, 0, 0x151e29).setDepth(-3);
    });

    // Emergency Phosphor Chemlight 01 (Vibrant green/emerald chemical light flare)
    const chemX = cfg.chemlight.x;
    const chemY = cfg.chemlight.y;
    const chemStick = this.add.rectangle(chemX, chemY, 6, 20, 0x34d399).setDepth(2);
    this.add.rectangle(chemX, chemY, 2, 16, 0xa7f3d0).setDepth(3);

    if (this.textures.exists("fx_radial_glow")) {
      const chemGlow = this.add
        .image(chemX, chemY, "fx_radial_glow")
        .setDisplaySize(260, 260)
        .setTint(0x10b981)
        .setAlpha(0.42)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(1);

      this.tweens.add({
        targets: chemGlow,
        alpha: 0.28,
        scaleX: 0.92,
        scaleY: 0.92,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      // Ground water puddle reflection
      if (this.textures.exists("fx_puddle_glint")) {
        this.add
          .image(chemX, GROUND_TOP - 2, "fx_puddle_glint")
          .setDisplaySize(90, 10)
          .setTint(0x34d399)
          .setAlpha(0.38)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(1);
      }
    }

    // Ladder foot marker: Amber chemical light near service ladder descent
    if (this.textures.exists("fx_radial_glow")) {
      this.add.rectangle(130, 860, 4, 16, 0xd9a441).setDepth(2);
      this.add
        .image(130, 860, "fx_radial_glow")
        .setDisplaySize(160, 160)
        .setTint(0xd9a441)
        .setAlpha(0.26)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(1);
    }

    this.chemLights.push(chemStick);

    // Broken overhead bulb socket (dead electricity theme)
    this.createBrokenBulb(240, 480);
    this.createBrokenBulb(460, 480);

    // Heavy iron culvert bulkhead wall dividing Area 1 and Area 2
    this.createDoorway(680, 360, "CULVERT PORTAL 01", 44, 0x080d12);
  }

  createArea2_SluiceBasin() {
    const cfg = puzzleConfig.sluiceBasin;
    const area = AREAS[1];
    const w = area.end - area.start;
    const cx = area.start + w / 2;

    // Subterranean brick tiles background
    if (this.textures.exists("tex_subway_tiles")) {
      this.add.tileSprite(cx, 500, w, 760, "tex_subway_tiles").setAlpha(0.55).setDepth(-4);
    }

    // Elevated iron catwalk where sluice wheel is mounted
    const cw = cfg.catwalk;
    const catwalkPlatform = this.add.rectangle(cw.x, cw.y, cw.width, cw.height, 0x1c2530).setDepth(1);
    catwalkPlatform.setStrokeStyle(1, 0x3d4e62);
    this.physics.add.existing(catwalkPlatform, true);
    this.solidPlatforms.add(catwalkPlatform);

    // Catwalk access ladder
    this.createLadder(cw.x - cw.width / 2 + 16, cw.y, GROUND_TOP);

    // Manual Sluice Wheel visual
    const wheel = this.add.circle(cfg.valveWheel.x, cfg.valveWheel.y, 18, 0x242e39).setStrokeStyle(3, 0xd9a441).setDepth(2);
    const spoke1 = this.add.line(0, 0, cfg.valveWheel.x - 14, cfg.valveWheel.y, cfg.valveWheel.x + 14, cfg.valveWheel.y, 0xd9a441).setDepth(2);
    const spoke2 = this.add.line(0, 0, cfg.valveWheel.x, cfg.valveWheel.y - 14, cfg.valveWheel.x, cfg.valveWheel.y + 14, 0xd9a441).setDepth(2);
    this.sluiceWheelGroup = [wheel, spoke1, spoke2];

    // High water basin rectangle (initially high)
    const waterW = cfg.waterEndX - cfg.waterStartX;
    const waterInitialH = GROUND_TOP - cfg.waterHighY;
    this.sluiceWater = this.add
      .rectangle(cfg.waterStartX + waterW / 2, cfg.waterHighY + waterInitialH / 2, waterW, waterInitialH, 0x0e2630, 0.75)
      .setDepth(2);

    // Low ceiling pipe bulkhead at x = 1440 (blocks player when water is high)
    this.pipeBulkhead = this.add.rectangle(cfg.pipeBulkhead.x, cfg.pipeBulkhead.y, cfg.pipeBulkhead.width, cfg.pipeBulkhead.height, 0x141c24).setDepth(1);
    this.pipeBulkhead.setStrokeStyle(2, 0x2c3b4d);
    this.physics.add.existing(this.pipeBulkhead, true);
    this.roomWalls.add(this.pipeBulkhead);

    // Submerged concrete stepping blocks (become accessible when water drains)
    this.sluiceBlocks = [];
    cfg.steppingBlocks.forEach((b) => {
      const block = this.add.rectangle(b.x, b.y, b.width, b.height, 0x222c38).setDepth(1);
      block.setStrokeStyle(1, 0x3a4b5d);
      this.physics.add.existing(block, true);
      this.solidPlatforms.add(block);
      this.sluiceBlocks.push(block);
    });

    // Dead lamps
    this.createBrokenBulb(880, 520);
    this.createBrokenBulb(1260, 520);
  }

  createArea3_GeneratorBay() {
    const cfg = puzzleConfig.generatorBay;
    const area = AREAS[2];
    const w = area.end - area.start;
    const cx = area.start + w / 2;

    // Weeping culvert & rusted grating texture
    if (this.textures.exists("tex_drainage_culvert")) {
      this.add.tileSprite(cx, 500, w, 760, "tex_drainage_culvert").setAlpha(0.6).setDepth(-4);
    }

    // Upper rail gantry platform on left (y = 728)
    const ug = cfg.upperGantry;
    const upperGantryPlat = this.add.rectangle(ug.x, ug.y, ug.width, ug.height, 0x1f2935).setDepth(1);
    upperGantryPlat.setStrokeStyle(1, 0x3d4e62);
    this.physics.add.existing(upperGantryPlat, true);
    this.solidPlatforms.add(upperGantryPlat);

    // Ladder leading to upper gantry
    this.createLadder(cfg.ladder.x, cfg.ladder.yTop, cfg.ladder.yBottom);

    // Collapsed Pit Water Basin (deep water gap x = 1840 to 2160)
    const pitW = cfg.pit.width;
    const pitCenterX = cfg.pit.x + pitW / 2;
    this.generatorPitWater = this.add
      .rectangle(pitCenterX, GROUND_TOP - 15, pitW, 30, 0x091c24, 0.85)
      .setDepth(2);

    // Watertight crate starting on upper gantry
    this.bayCrate = new Crate(this, cfg.crate.x, cfg.crate.y, cfg.crate.width, cfg.crate.height, {
      floorY: cfg.crate.y,
      minX: 1610,
      maxX: 1880,
    });
    this.bayCrate.floorY = cfg.crate.y;
    this.bayCrate.setPosition(cfg.crate.x, cfg.crate.y);

    // Custom crate pushing physics for upper gantry
    this.physics.add.collider(this.bayCrate, upperGantryPlat);

    // Right exit catwalk across the pit
    const eg = cfg.exitCatwalk;
    const exitCatwalkPlat = this.add.rectangle(eg.x, eg.y, eg.width, eg.height, 0x1c2530).setDepth(1);
    exitCatwalkPlat.setStrokeStyle(1, 0x3d4e62);
    this.physics.add.existing(exitCatwalkPlat, true);
    this.solidPlatforms.add(exitCatwalkPlat);

    // Dead lamps
    this.createBrokenBulb(1680, 510);
    this.createBrokenBulb(2080, 510);
  }

  createArea4_ElectrifiedSump() {
    const cfg = puzzleConfig.electricSump;
    const area = AREAS[3];
    const w = area.end - area.start;
    const cx = area.start + w / 2;

    if (this.textures.exists("tex_subway_tiles")) {
      this.add.tileSprite(cx, 500, w, 760, "tex_subway_tiles").setAlpha(0.5).setDepth(-4);
    }

    // Flooded sump water pool (electrified initially)
    const sw = cfg.sumpWater;
    this.electricPool = this.add.rectangle(sw.x + sw.width / 2, sw.y, sw.width, sw.height, 0x0b1f28, 0.8).setDepth(2);

    // Dangling severed high-voltage feeder cable
    const dc = cfg.danglingCable;
    this.cableLine = this.add.line(0, 0, dc.x, dc.y, dc.x, dc.y + dc.length, 0x222e3b).setLineWidth(3).setDepth(1);
    this.sparkGlow = this.add.circle(dc.x, dc.y + dc.length, 12, 0x38bdf8, 0.8).setDepth(3);

    // Spark particle effect loop
    this.sparkTimer = this.time.addEvent({
      delay: 450,
      loop: true,
      callback: () => {
        if (this.chapterState.circuitIsolated) return;
        this.sparkGlow.setVisible(true);
        this.soundSystem?.playElectricArc();
        this.tweens.add({
          targets: this.sparkGlow,
          scaleX: 1.8,
          scaleY: 1.8,
          alpha: 0.1,
          duration: 140,
          yoyo: true,
          onComplete: () => {
            this.sparkGlow.setScale(1);
          },
        });
      },
    });

    // Overhead maintenance catwalk & ladder
    const uc = cfg.upperCatwalk;
    const upperCatwalkPlat = this.add.rectangle(uc.x, uc.y, uc.width, uc.height, 0x1c2530).setDepth(1);
    upperCatwalkPlat.setStrokeStyle(1, 0x3d4e62);
    this.physics.add.existing(upperCatwalkPlat, true);
    this.solidPlatforms.add(upperCatwalkPlat);

    this.createLadder(cfg.ladder.x, cfg.ladder.yTop, cfg.ladder.yBottom);

    // Circuit Isolator Switch on upper catwalk
    this.isolatorSwitch = new Switch(this, cfg.switch.x, cfg.switch.y, cfg.switch.id, {
      requiresFuse: false,
      panelLabel: "FEEDER ISOLATOR",
      actionPrompt: "Pull circuit isolator lever",
      activatedPrompt: "Feeder #4 isolated",
    });

    // Dead lamps
    this.createBrokenBulb(2700, 500);
    this.createBrokenBulb(3100, 500);
  }

  createArea5_EchoingAqueduct() {
    const cfg = puzzleConfig.acousticYard;
    const area = AREAS[4];
    const w = area.end - area.start;
    const cx = area.start + w / 2;

    if (this.textures.exists("tex_subway_tiles")) {
      this.add.tileSprite(cx, 500, w, 760, "tex_subway_tiles").setAlpha(0.65).setDepth(-4);
    }

    // Overhead pipe scaffolding platforms for acoustic stealth bypass
    this.overheadPlatforms = [];
    cfg.overheadPipes.forEach((p) => {
      const plat = this.add.rectangle(p.x, p.y, p.width, p.height, 0x222d3b).setDepth(1);
      plat.setStrokeStyle(1, 0x3e5066);
      this.physics.add.existing(plat, true);
      this.solidPlatforms.add(plat);
      this.overheadPlatforms.push(plat);
    });

    cfg.pipeLadders.forEach((l) => {
      this.createLadder(l.x, l.yTop, l.yBottom);
    });

    // Wanderer Acoustic Patrol
    const wCfg = cfg.wanderer;
    this.wanderer = new Wanderer(this, wCfg.x, wCfg.y, wCfg.minX, wCfg.maxX);

    // Hiding alcoves
    this.coverSpots = [];
    cfg.coverSpots.forEach((spot) => {
      const cover = new HidingSpot(this, spot.x, spot.y, spot.label);
      this.coverSpots.push(cover);
    });

    // Dead lamps
    this.createBrokenBulb(3500, 480);
    this.createBrokenBulb(3850, 480);
  }

  createArea6_PumpingStation() {
    const cfg = puzzleConfig.pumpStation;
    const area = AREAS[5];
    const w = area.end - area.start;
    const cx = area.start + w / 2;

    if (this.textures.exists("tex_drainage_culvert")) {
      this.add.tileSprite(cx, 500, w, 760, "tex_drainage_culvert").setAlpha(0.6).setDepth(-4);
    }

    // Twin Diesel Backup Pump Units
    if (this.textures.exists("tex_diesel_pump")) {
      this.add.image(4520, 830, "tex_diesel_pump").setDisplaySize(120, 70).setDepth(0);
      this.add.image(4680, 830, "tex_diesel_pump").setDisplaySize(120, 70).setDepth(0);
    } else {
      const pumpBody = this.add.rectangle(4560, 830, 160, 70, 0x1b232c).setDepth(0);
      pumpBody.setStrokeStyle(2, 0x364656);
    }

    // Heavy copper overhead fuel & hydraulic lines
    this.add.rectangle(4600, 740, 260, 8, 0x8a542b).setDepth(-2);
    this.add.rectangle(4600, 760, 260, 6, 0x475b70).setDepth(-2);

    // Pressure Gauge Box
    const gaugeBox = this.add.rectangle(cfg.pressureGauge.x, cfg.pressureGauge.y, 36, 44, 0x141b22).setDepth(1);
    gaugeBox.setStrokeStyle(1, 0x384a5e);
    this.gaugeNeedle = this.add.line(0, 0, cfg.pressureGauge.x, cfg.pressureGauge.y, cfg.pressureGauge.x + 8, cfg.pressureGauge.y - 8, 0xd94441).setLineWidth(2).setDepth(2);

    // Hydraulic Floodgate 07
    this.floodgate = new Door(this, cfg.floodgate.x, cfg.floodgate.y, {
      id: cfg.floodgate.id,
      label: cfg.floodgate.label,
      width: cfg.floodgate.width,
      height: cfg.floodgate.height,
      requiredSwitch: "pump_started",
      locked: true,
      interactionText: "Floodgate 07 locked (0 Bar Hydraulic Pressure)",
    });

    // Single battery diode on pump station
    const diode = this.add.circle(4420, 810, 3, 0xd9a441).setDepth(1);
    this.tweens.add({
      targets: diode,
      alpha: 0.2,
      duration: 1200,
      yoyo: true,
      repeat: -1,
    });

    this.createBrokenBulb(4360, 500);
    this.createBrokenBulb(4800, 500);
  }

  createArea7_Sector7MarshallingYard() {
    const cfg = puzzleConfig.signalCabin;
    const area = AREAS[6];
    const w = area.end - area.start;
    const cx = area.start + w / 2;

    // Shattered glass skylights above letting in stormy rain
    for (let sx = area.start + 60; sx < area.end - 60; sx += 180) {
      const skylight = this.add.rectangle(sx, 120, 120, 24, 0x223040, 0.4).setDepth(-3);
      skylight.setStrokeStyle(1, 0x4a617a);
    }

    // Distant abandoned boxcar silhouette
    const boxcar = this.add.rectangle(5180, 820, 160, 80, 0x101720).setDepth(-2);
    boxcar.setStrokeStyle(1, 0x243242);

    // Signal Cabin 07 Structure on iron pilings
    const st = cfg.stairs;
    const stairsPlat = this.add.rectangle(st.x, st.y, st.width, st.height, 0x1c2532).setDepth(1);
    stairsPlat.setStrokeStyle(1, 0x3d4e62);
    this.physics.add.existing(stairsPlat, true);
    this.solidPlatforms.add(stairsPlat);

    const cp = cfg.cabinPlatform;
    const cabinPlat = this.add.rectangle(cp.x, cp.y, cp.width, cp.height, 0x1a232f).setDepth(1);
    cabinPlat.setStrokeStyle(1, 0x475b72);
    this.physics.add.existing(cabinPlat, true);
    this.solidPlatforms.add(cabinPlat);

    // Cabin building walls and roof
    const cabinWalls = this.add.rectangle(cp.x, cp.y - 70, 240, 120, 0x121a24).setDepth(-1);
    cabinWalls.setStrokeStyle(2, 0x2e3d50);

    // Illuminated cabin window (warm kerosene lantern inside)
    const cabinWindow = this.add.rectangle(cp.x - 30, cp.y - 70, 60, 40, 0xd9a441, 0.45).setDepth(0);
    cabinWindow.setStrokeStyle(2, 0x946b21);
    const lanternGlow = this.add.circle(cp.x - 30, cp.y - 70, 90, 0xd9a441, 0.12).setDepth(0);
    this.tweens.add({
      targets: lanternGlow,
      alpha: 0.08,
      duration: 1600,
      yoyo: true,
      repeat: -1,
    });

    // Rowan's silhouette in window
    this.add.rectangle(cp.x - 30, cp.y - 65, 18, 30, 0x0b1016).setDepth(1);
  }

  createLadder(x, topY, bottomY) {
    const h = bottomY - topY;
    const cy = topY + h / 2;

    if (!this.ladders) this.ladders = [];
    this.ladders.push({ x, yTop: topY, yBottom: bottomY });

    // Twin side rails
    this.add.rectangle(x - 10, cy, 3, h, 0x3a4f66).setDepth(0);
    this.add.rectangle(x + 10, cy, 3, h, 0x3a4f66).setDepth(0);

    // Rungs every 18px with highlighted grip face
    for (let y = topY + 8; y <= bottomY - 8; y += 18) {
      const isTopBottom = (y === topY + 8 || y >= bottomY - 20);
      const rungColor = isTopBottom ? 0xd9a441 : 0x5b7594;
      this.add.rectangle(x, y, 20, 3, rungColor).setDepth(0);
    }
  }

  createBrokenBulb(x, y) {
    // Ceiling conduit fixture
    this.add.rectangle(x, y - 8, 8, 6, 0x161e27).setDepth(0);
    // Broken filament socket
    this.add.circle(x, y, 4, 0x222a33).setStrokeStyle(1, 0x334050).setDepth(0);
  }

  createDoorway(x, wallTopY, label, width = 48, portalColor = 0x080d12) {
    const doorHeight = 130;
    const doorTopY = GROUND_TOP - doorHeight;
    const bulkheadH = Math.max(20, doorTopY - wallTopY);

    const upperSolid = this.add.rectangle(x, wallTopY + bulkheadH / 2, width + 8, bulkheadH, 0x141c26);
    upperSolid.setStrokeStyle(1, 0x283647);
    this.physics.add.existing(upperSolid, true);
    this.roomWalls.add(upperSolid);

    const portal = this.add.rectangle(x, doorTopY + doorHeight / 2, width, doorHeight, portalColor).setDepth(-1);
    portal.setStrokeStyle(1, 0x223040);
  }

  setupInteractions() {
    // 1. Engineer's Flood Warning Note (Area 1)
    const cfgA1 = puzzleConfig.viaductDescent;
    this.propNote = new InspectableProp(this, cfgA1.clipboard.x, cfgA1.clipboard.y, {
      promptText: "Read drainage log",
      dialogueKey: "C2_MAINTENANCE_NOTE",
      onInteract: () => {
        this.chapterState.noteRead = true;
        this.storySystem.setFlag(STORY_FLAGS.C2_NOTE_READ);
        this.objectiveSystem.setObjective("C2_DRAIN_SLUICE");
      },
      visualFn: (cont) => {
        const board = this.add.rectangle(0, 0, 18, 26, 0x332517).setStrokeStyle(1, 0x5a4128);
        const paper = this.add.rectangle(0, 2, 14, 20, 0x94a3b8);
        cont.add([board, paper]);
      },
    });
    this.interactionSystem.register(this.propNote);

    // 2. Sluice Gate Drainage Wheel (Area 2)
    const cfgA2 = puzzleConfig.sluiceBasin;
    this.propSluiceWheel = new InspectableProp(this, cfgA2.valveWheel.x, cfgA2.valveWheel.y, {
      promptText: "Turn sluice valve wheel",
      dialogueKey: "C2_SLUICE_DRAINED",
      onInteract: () => {
        if (this.chapterState.sluiceDrained) return;
        this.chapterState.sluiceDrained = true;
        this.storySystem.setFlag(STORY_FLAGS.C2_SLUICE_DRAINED);
        this.soundSystem?.playSluiceDrain();

        // Animate wheel spinning
        this.tweens.add({
          targets: this.sluiceWheelGroup,
          angle: 360,
          duration: 900,
          ease: "Cubic.easeOut",
        });

        // Drain water level down
        const newH = GROUND_TOP - cfgA2.waterLowY;
        this.tweens.add({
          targets: this.sluiceWater,
          y: cfgA2.waterLowY + newH / 2,
          displayHeight: newH,
          duration: 1200,
          ease: "Sine.easeInOut",
        });

        // Remove pipe bulkhead collision obstacle so player can pass through
        if (this.pipeBulkhead && this.pipeBulkhead.body) {
          this.pipeBulkhead.body.enable = false;
          this.pipeBulkhead.setAlpha(0.4);
        }

        this.propSluiceWheel.enabled = false;
        this.objectiveSystem.setObjective("C2_CROSS_BAY");
      },
    });
    this.interactionSystem.register(this.propSluiceWheel);

    // 3. Watertight Crate on Upper Gantry (Area 3)
    this.interactionSystem.register(this.bayCrate);

    // 4. Circuit Isolator Breaker (Area 4)
    this.interactionSystem.register(this.isolatorSwitch);
    this.events.on("switch:activated", (switchId) => {
      if (switchId === "switch_isolator") {
        this.chapterState.circuitIsolated = true;
        this.storySystem.setFlag(STORY_FLAGS.C2_CIRCUIT_ISOLATED);
        this.soundSystem?.playBreakerThrow();

        // Extinguish sparks & cable glow
        if (this.sparkGlow) this.sparkGlow.setVisible(false);
        if (this.sparkTimer) this.sparkTimer.remove(false);

        this.dialogueSystem.start("C2_CIRCUIT_CUT", () => {
          this.objectiveSystem.setObjective("C2_ACOUSTIC_EVASION");
        });
      }
    });

    // 5. Sound Distraction Valve / Wrench (Area 5)
    const cfgA5 = puzzleConfig.acousticYard;
    this.propDistraction = new InspectableProp(this, cfgA5.distractionValve.x, cfgA5.distractionValve.y, {
      promptText: "Drop heavy wrench into drain",
      dialogueKey: "C2_STEAM_DISTRACTION",
      onInteract: () => {
        if (this.chapterState.acousticDistracted) return;
        this.chapterState.acousticDistracted = true;
        this.storySystem.setFlag(STORY_FLAGS.C2_ACOUSTIC_DISTRACTED);
        this.soundSystem?.playMetalClatter();

        // Wanderer lured far to the left away from the exit
        if (this.wanderer) {
          this.wanderer.distract(3660, 4000);
        }
        this.propDistraction.enabled = false;
      },
      visualFn: (cont) => {
        const wrench = this.add.rectangle(0, 0, 22, 6, 0x47596e).setStrokeStyle(1, 0x687d96);
        cont.add(wrench);
      },
    });
    this.interactionSystem.register(this.propDistraction);

    // Cover spots
    this.coverSpots.forEach((spot) => this.interactionSystem.register(spot));

    // 6. Diesel Auxiliary Fuel Valve (Area 6)
    const cfgA6 = puzzleConfig.pumpStation;
    this.propFuelValve = new InspectableProp(this, cfgA6.fuelValve.x, cfgA6.fuelValve.y, {
      promptText: "Open diesel fuel petcock",
      dialogueKey: "C2_PUMP_VALVE_OPENED",
      onInteract: () => {
        this.chapterState.dieselValveOpen = true;
        this.storySystem.setFlag(STORY_FLAGS.C2_DIESEL_VALVE_OPEN);
        this.soundSystem?.playLever();
        this.propFuelValve.enabled = false;
      },
      visualFn: (cont) => {
        const valve = this.add.circle(0, 0, 10, 0xb8860b).setStrokeStyle(2, 0xd9a441);
        cont.add(valve);
      },
    });
    this.interactionSystem.register(this.propFuelValve);

    // 7. Diesel Flywheel Starter (Area 6)
    this.propFlywheel = new InspectableProp(this, cfgA6.flywheelStarter.x, cfgA6.flywheelStarter.y, {
      promptText: "Crank manual flywheel starter",
      dialogueKey: "C2_PUMP_STARTED",
      canInteract: (player) => {
        if (!this.chapterState.dieselValveOpen) return false;
        return Math.abs(player.x - cfgA6.flywheelStarter.x) < 56;
      },
      onInteract: () => {
        if (this.chapterState.pumpStarted) return;
        this.chapterState.pumpStarted = true;
        this.storySystem.setFlag(STORY_FLAGS.C2_DIESEL_PUMP_STARTED);
        this.soundSystem?.playDieselRumble();

        // Pressure gauge climbs into green
        if (this.gaugeNeedle) {
          this.tweens.add({
            targets: this.gaugeNeedle,
            angle: 90,
            duration: 800,
            ease: "Quad.easeOut",
          });
        }

        // Lift Floodgate 07
        this.time.delayedCall(900, () => {
          this.soundSystem?.playGateHydraulic();
          this.floodgate.unlock();
          this.floodgate.open();
          this.chapterState.floodgateOpen = true;
          this.storySystem.setFlag(STORY_FLAGS.C2_FLOODGATE_OPEN);
          this.objectiveSystem.setObjective("C2_MEET_ROWAN");
        });

        this.propFlywheel.enabled = false;
      },
      visualFn: (cont) => {
        const flywheel = this.add.circle(0, 0, 14, 0x1f2935).setStrokeStyle(2, 0x475b70);
        cont.add(flywheel);
      },
    });
    this.interactionSystem.register(this.propFlywheel);

    // 8. Rowan's Intercom Console (Area 7)
    const cfgA7 = puzzleConfig.signalCabin;
    this.propIntercom = new InspectableProp(this, cfgA7.intercom.x, cfgA7.intercom.y, {
      promptText: "Contact Rowan on cabin intercom",
      dialogueKey: "C2_ROWAN_INTERCOM",
      onInteract: () => {
        if (this.chapterState.rowanMet) return;
        this.chapterState.rowanMet = true;
        this.storySystem.setFlag(STORY_FLAGS.C2_ROWAN_CONTACTED);
        this.triggerChapter2Ending();
      },
      visualFn: (cont) => {
        const box = this.add.rectangle(0, 0, 24, 32, 0x141c24).setStrokeStyle(1, 0x3d4e62);
        const grill = this.add.rectangle(0, -4, 16, 10, 0x0a0e14);
        const led = this.add.circle(6, 8, 2, 0x22c55e);
        cont.add([box, grill, led]);
      },
    });
    this.interactionSystem.register(this.propIntercom);
  }

  setupCompletionCard() {
    this.completionContainer = this.add.container(640, 360).setScrollFactor(0).setDepth(500).setVisible(false);

    const overlay = this.add.rectangle(0, 0, 1280, 720, 0x070b10, 0.95);
    const box = this.add.rectangle(0, 0, 760, 360, 0x0f151e);
    box.setStrokeStyle(2, 0x38bdf8);

    const label = this.add
      .text(0, -125, "NIGHTFALL: THE LAST DELIVERY", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#38bdf8",
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    const title = this.add
      .text(0, -75, "CHAPTER 2 COMPLETE", {
        fontFamily: "monospace",
        fontSize: "28px",
        fontStyle: "bold",
        color: "#f8fafc",
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(0, -35, "THE DROWNED DEPTHS", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#7dd3fc",
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.clueStatusText = this.add
      .text(0, 15, "★ The Genesis Relay Key Decrypted.\nThe truth of The Quarantine has been revealed.\nProceeding to Sector 8 Viaduct Bridge...", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#94a3b8",
        align: "center",
        lineSpacing: 6,
      })
      .setOrigin(0.5);

    // Primary Interactive Button: Replay Chapter 2
    this.btnReplayC2 = this.add.rectangle(0, 85, 340, 42, 0x162c3d).setStrokeStyle(2, 0x38bdf8);
    this.btnReplayText = this.add
      .text(0, 85, "▶ REPLAY CHAPTER 2 [E]", {
        fontFamily: "monospace",
        fontSize: "13px",
        fontStyle: "bold",
        color: "#38bdf8",
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.btnReplayC2.setInteractive({ useHandCursor: true });
    this.btnReplayC2.on("pointerover", () => {
      this.btnReplayC2.setFillStyle(0x22435d);
      this.btnReplayText.setColor("#f8fafc");
    });
    this.btnReplayC2.on("pointerout", () => {
      this.btnReplayC2.setFillStyle(0x162c3d);
      this.btnReplayText.setColor("#38bdf8");
    });
    this.btnReplayC2.on("pointerdown", () => {
      this.scene.restart({ newGame: true });
    });

    const restartPrompt = this.add
      .text(0, 140, "[M] Main Menu   |   [1] Return to Chapter 1", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#6b8096",
      })
      .setOrigin(0.5);

    this.completionContainer.add([
      overlay,
      box,
      label,
      title,
      subtitle,
      this.clueStatusText,
      this.btnReplayC2,
      this.btnReplayText,
      restartPrompt,
    ]);
  }

  triggerChapter2Ending() {
    this.player.setInputEnabled(false);
    this.player.body.setVelocityX(0);

    this.time.delayedCall(800, () => {
      this.soundSystem?.playSignalChime();
      this.storySystem.setFlag(STORY_FLAGS.C2_COMPLETE);
      this.objectiveSystem.complete();
      this.saveGame();

      this.cameras.main.fadeOut(1000);
      this.time.delayedCall(1100, () => {
        this.showChapterCompleteScreen();
      });
    });
  }

  handleWandererDetected() {
    if (this.isResetting) return;
    this.isResetting = true;

    this.player.setInputEnabled(false);
    this.player.body.setVelocity(0, 0);

    this.cameras.main.fadeOut(350, 8, 12, 18);

    this.time.delayedCall(400, () => {
      this.coverSpots?.forEach((spot) => {
        if (spot.occupant === this.player) {
          spot.exitCover(this.player);
        }
      });

      this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
      this.player.body.setVelocity(0, 0);

      if (this.wanderer) {
        this.wanderer.resetPatrol();
      }

      this.cameras.main.fadeIn(400);

      this.time.delayedCall(400, () => {
        this.player.setInputEnabled(true);
        this.isResetting = false;
      });
    });
  }

  showChapterCompleteScreen() {
    this.chapterCompleted = true;
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(600);
    this.completionContainer.setVisible(true);
    this.completionContainer.setAlpha(0);

    this.tweens.add({
      targets: this.completionContainer,
      alpha: 1,
      duration: 600,
      ease: "Quad.easeOut",
    });

    // Dedicated keydown handler guaranteeing transition on E, Space, Enter, M, 1
    const onCompletionKey = (event) => {
      if (!this.chapterCompleted) return;
      if (
        event.code === "KeyE" ||
        event.key === "e" ||
        event.key === "E" ||
        event.code === "Space" ||
        event.code === "Enter"
      ) {
        this.input.keyboard.off("keydown", onCompletionKey);
        this.scene.restart({ newGame: true });
      } else if (event.code === "KeyM" || event.key === "m" || event.key === "M") {
        this.input.keyboard.off("keydown", onCompletionKey);
        this.scene.start("MenuScene");
      } else if (event.code === "Digit1" || event.key === "1") {
        this.input.keyboard.off("keydown", onCompletionKey);
        this.scene.start("Chapter1Scene", { newGame: true });
      }
    };
    this.input.keyboard.on("keydown", onCompletionKey);
  }

  saveGame() {
    if (this.chapterCompleted) return;

    this.saveSystem.save({
      chapter: 2,
      checkpoint: this.checkpoint,
      currentObjectiveId: this.objectiveSystem?.currentObjective?.id || null,
      story: this.storySystem ? this.storySystem.getStoryState() : { flags: [], clues: [], inventory: [] },
      world: {
        ...this.chapterState,
      },
    });
  }

  update(time, delta) {
    this.player.update(time, delta);
    this.interactionSystem.update();
    this.dialogueSystem.update();

    // Update courier shoulder rim light
    if (this.playerGlow && this.player) {
      this.playerGlow.setPosition(this.player.x, this.player.y - 10);
    }

    // Checkpoint updates per area
    const px = this.player.x;
    if (px > 760 && this.checkpoint.x < 700) {
      this.checkpoint = { x: 780, y: GROUND_TOP - 60 };
      this.saveGame();
    } else if (px > 2480 && this.checkpoint.x < 2400) {
      this.checkpoint = { x: 2520, y: GROUND_TOP - 60 };
      this.saveGame();
    } else if (px > 3360 && this.checkpoint.x < 3300) {
      this.checkpoint = { x: 3420, y: GROUND_TOP - 60 };
      this.saveGame();
    } else if (px > 4240 && this.checkpoint.x < 4200) {
      this.checkpoint = { x: 4280, y: GROUND_TOP - 60 };
      this.saveGame();
    }

    // Wanderer stealth updates
    if (this.wanderer && !this.isResetting) {
      this.wanderer.updateStealth(this.player, delta);
    }

    // Sluice basin high water obstruction (Area 2)
    if (!this.chapterState.sluiceDrained && px >= 860 && px <= 1440 && this.player.y >= GROUND_TOP - 40) {
      this.player.setX(840);
      this.player.body.setVelocityX(0);
      if (!this.dialogueSystem.isActive()) {
        this.dialogueSystem.start("C2_SLUICE_VALVE_INSPECT");
      }
    }

    // 1. Crate falling off upper gantry into generator pit (Area 3)
    const cfgBay = puzzleConfig.generatorBay;
    if (!this.chapterState.crateFloated && this.bayCrate) {
      // If player pushes crate past gantry edge (x >= 1840)
      if (this.bayCrate.x >= 1840) {
        this.chapterState.crateFloated = true;
        this.bayCrate.release();
        this.bayCrate.enabled = false;

        // Animate crate falling and splashing into flood basin
        this.tweens.add({
          targets: this.bayCrate,
          x: cfgBay.floatingSpot.x,
          y: cfgBay.floatingSpot.y,
          duration: 480,
          ease: "Quad.easeIn",
          onComplete: () => {
            this.soundSystem?.playWaterSplash();
            this.bayCrate.floorY = cfgBay.floatingSpot.y;
            this.bayCrate.setPosition(cfgBay.floatingSpot.x, cfgBay.floatingSpot.y);
            this.bayCrate.enabled = false;
            if (this.bayCrate.body) {
              this.bayCrate.body.setImmovable(true);
              this.bayCrate.body.setVelocity(0, 0);
            }

            // Bobbing animation on water
            this.tweens.add({
              targets: this.bayCrate,
              y: cfgBay.floatingSpot.y + 4,
              duration: 900,
              yoyo: true,
              repeat: -1,
              ease: "Sine.easeInOut",
            });

            this.dialogueSystem.start("C2_CRATE_FLOATED");
          },
        });
      }
    }

    // Generator pit water suction hazard before crate is floated
    if (!this.chapterState.crateFloated) {
      if (px >= 1840 && px <= 2160 && this.player.y >= GROUND_TOP - 30 && !this.isResetting) {
        this.isResetting = true;
        this.soundSystem?.playWaterSplash();
        this.dialogueSystem.start("C2_GENERATOR_BAY_LOOK", () => {
          this.player.setPosition(1660, 700);
          this.player.body.setVelocity(0, 0);
          this.isResetting = false;
        });
      }
    }

    // 2. Electrified water hazard detection in Area 4
    if (!this.chapterState.circuitIsolated) {
      const sw = puzzleConfig.electricSump.sumpWater;
      const inPool = px >= sw.x && px <= sw.x + sw.width && this.player.y >= GROUND_TOP - 40;
      if (inPool && !this.isResetting) {
        this.isResetting = true;
        this.soundSystem?.playElectricArc();
        this.cameras.main.flash(180, 56, 189, 248);
        this.dialogueSystem.start("C2_ELECTRIC_SHOCK", () => {
          this.player.setPosition(puzzleConfig.electricSump.safeResetX, GROUND_TOP - 60);
          this.player.body.setVelocity(0, 0);
          this.isResetting = false;
        });
      }
    }

    // 3. Subterranean water drips falling animation
    for (let i = 0; i < this.waterDrips.length; i++) {
      const drip = this.waterDrips[i];
      const spd = drip.getData("speedY");
      drip.y += spd;
      if (drip.y >= drip.getData("targetY")) {
        drip.y = drip.getData("originY");
        drip.x = Phaser.Math.Between(40, WORLD_WIDTH - 40);
      }
    }

    // 4. Keyboard handling on completion screen
    if (this.chapterCompleted) {
      if (this.mKey && Phaser.Input.Keyboard.JustDown(this.mKey)) {
        this.scene.start("MenuScene");
        return;
      }
      if (this.oneKey && Phaser.Input.Keyboard.JustDown(this.oneKey)) {
        this.scene.start("Chapter1Scene", { newGame: true });
        return;
      }
      if (this.completionEKey && Phaser.Input.Keyboard.JustDown(this.completionEKey)) {
        this.scene.restart({ newGame: true });
        return;
      }
    }
  }

  destroy() {
    this.events.off("wanderer:detected");
    if (this.sparkTimer) this.sparkTimer.remove(false);
    if (this.soundSystem) this.soundSystem.destroy();
    if (this.storySystem) this.storySystem.destroy();
    this.tweens.killAll();
  }
}
