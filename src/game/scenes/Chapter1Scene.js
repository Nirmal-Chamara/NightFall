import Phaser from "phaser";
import Player from "../entities/Player.js";
import Wanderer from "../entities/Wanderer.js";
import InteractionSystem from "../systems/InteractionSystem.js";
import DialogueSystem from "../systems/DialogueSystem.js";
import ObjectiveSystem from "../systems/ObjectiveSystem.js";
import StorySystem, { STORY_FLAGS } from "../systems/StorySystem.js";
import AtmosphereSystem from "../systems/AtmosphereSystem.js";
import SaveSystem from "../systems/SaveSystem.js";
import SoundSystem from "../systems/SoundSystem.js";
import Package from "../objects/Package.js";
import Crate from "../objects/Crate.js";
import Fuse from "../objects/Fuse.js";
import Switch from "../objects/Switch.js";
import Door from "../objects/Door.js";
import Newspaper from "../objects/Newspaper.js";
import MiraClue from "../objects/MiraClue.js";
import Terminal from "../objects/Terminal.js";
import HidingSpot from "../objects/HidingSpot.js";
import Radio from "../objects/Radio.js";
import InspectableProp from "../objects/InspectableProp.js";
import { AREAS, GROUND_TOP, puzzleConfig, blockoutConfig } from "../data/chapter1.js";
import { WORLD_WIDTH, WORLD_HEIGHT } from "../constants.js";

export default class Chapter1Scene extends Phaser.Scene {
  constructor() {
    super("Chapter1Scene");
  }

  init(data) {
    this.launchOptions = data || {};
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Camera initial configuration & smooth fade-in from blackout transition
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor("#0c1118");
    this.cameras.main.fadeIn(500);

    // State tracking
    this.viewpointTriggered = false;
    this.viewpointDarkPromptShown = false;
    this.chapterCompleted = false;
    this.wandererSightingTriggered = false;
    this.isResetting = false;
    this.checkpoint = { x: 200, y: GROUND_TOP - 100 };
    this.currentZone = "Shelter";
    this.roomWalls = this.physics.add.staticGroup();
    this.interiorLights = [];
    this.interiorWalls = [];

    // ==========================================
    // AREA BANDS & LABELS (All 8 areas)
    // ==========================================
    AREAS.forEach((area, i) => {
      const w = area.end - area.start;
      this.add
        .rectangle(area.start + w / 2, WORLD_HEIGHT / 2, w, WORLD_HEIGHT, i % 2 ? 0x18212c : 0x141b24)
        .setDepth(-5);
      this.add
        .text(area.start + 16, 16, `${i + 1}. ${area.name.toUpperCase()}`, {
          fontFamily: "monospace",
          fontSize: "15px",
          color: "#4f6378",
          letterSpacing: 1,
        })
        .setDepth(-4);
    });

    // Solid continuous ground across entire world + textured pixel wet asphalt
    const ground = this.add.rectangle(WORLD_WIDTH / 2, GROUND_TOP + 40, WORLD_WIDTH, 80, 0x222d3a);
    this.physics.add.existing(ground, true);
    if (this.textures.exists("tex_asphalt_tile")) {
      ground.setVisible(false);
      this.add.tileSprite(WORLD_WIDTH / 2, GROUND_TOP + 40, WORLD_WIDTH, 80, "tex_asphalt_tile").setDepth(-1);
    }

    // ==========================================
    // AREA 1: SHELTER (0 – 640)
    // ==========================================
    this.add.rectangle(315, 480, 630, 20, 0x12171f).setDepth(-3);
    const shelterBackWall = this.add.rectangle(315, 685, 630, 390, 0x141b24).setDepth(-4);
    this.interiorWalls.push(shelterBackWall);
    if (this.textures.exists("tex_concrete_bunker")) {
      this.add.tileSprite(315, 685, 630, 390, "tex_concrete_bunker").setAlpha(0.65).setDepth(-4);
    } else if (this.textures.exists("tex_brick_tile")) {
      this.add.tileSprite(315, 685, 630, 390, "tex_brick_tile").setAlpha(0.35).setDepth(-4);
    }

    // Heavy reinforced concrete ceiling arch ribs (bunker architecture)
    [80, 280, 480].forEach((ax) => {
      this.add.rectangle(ax, 685, 22, 390, 0x18212b).setStrokeStyle(1, 0x273545).setDepth(-3);
      this.add.triangle(ax + 11, 490, 0, 0, 0, 24, 20, 0, 0x18212b).setStrokeStyle(1, 0x273545).setDepth(-3);
      this.add.triangle(ax - 11, 490, 0, 0, 0, 24, -20, 0, 0x18212b).setStrokeStyle(1, 0x273545).setDepth(-3);
    });

    // Heavy overhead galvanized air ventilation duct running along upper wall
    this.add.rectangle(315, 512, 630, 18, 0x1a232f).setStrokeStyle(1, 0x2c3b4e).setDepth(-3);
    const fanHousing = this.add.circle(440, 512, 16, 0x121820).setStrokeStyle(1, 0x3d4e63).setDepth(-3);
    for (let fa = -10; fa <= 10; fa += 5) {
      this.add.line(0, 0, 440 + fa, 502, 440 + fa, 522, 0x2a3848).setOrigin(0).setDepth(-3);
    }

    // Wall Stencil: Emergency Civil Defense designation
    this.add
      .text(220, 550, "CIVIL DEFENSE // BUNKER 01 // SECTOR 7", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#475c70",
        letterSpacing: 2,
      })
      .setOrigin(0.5)
      .setDepth(-3);

    // Chained Emergency Oxygen Cylinders (x = 60)
    this.add.rectangle(55, GROUND_TOP - 32, 10, 60, 0x233829).setDepth(-2).setStrokeStyle(1, 0x385240);
    this.add.rectangle(68, GROUND_TOP - 32, 10, 60, 0x233829).setDepth(-2).setStrokeStyle(1, 0x385240);
    this.add.rectangle(61, GROUND_TOP - 36, 28, 2, 0x475b70).setDepth(-2);
    this.add.circle(55, GROUND_TOP - 64, 3, 0xd9a441).setDepth(-2);
    this.add.circle(68, GROUND_TOP - 64, 3, 0xd9a441).setDepth(-2);

    // Emergency Survival Supplies Rack (x = 180 to 240)
    this.add.rectangle(205, GROUND_TOP - 35, 60, 70, 0x18202b).setStrokeStyle(1, 0x2e3d4f).setDepth(-2);
    this.add.rectangle(190, GROUND_TOP - 16, 22, 14, 0x2e382b).setStrokeStyle(1, 0x445340).setDepth(-2);
    this.add.rectangle(218, GROUND_TOP - 16, 22, 14, 0x2e382b).setStrokeStyle(1, 0x445340).setDepth(-2);
    this.add.rectangle(192, GROUND_TOP - 46, 20, 14, 0xded5be).setStrokeStyle(1, 0x8a2020).setDepth(-2);
    this.add.rectangle(192, GROUND_TOP - 46, 8, 3, 0xd94441).setDepth(-2);
    this.add.rectangle(192, GROUND_TOP - 46, 3, 8, 0xd94441).setDepth(-2);
    this.add.rectangle(220, GROUND_TOP - 46, 16, 16, 0x253b4d, 0.7).setStrokeStyle(1, 0x4a6a88).setDepth(-2);

    // Shelter radio workbench
    const workbench = this.add.rectangle(120, GROUND_TOP - 18, 70, 36, 0x18202b).setDepth(-2);
    workbench.setStrokeStyle(1, 0x273546);
    this.add.rectangle(110, GROUND_TOP - 40, 16, 8, 0x2c3b4e).setDepth(-2);
    this.add.rectangle(135, GROUND_TOP - 38, 18, 4, 0x4a5d72).setDepth(-2);

    // Bunker observation embrasure window
    const windowFrame = this.add.rectangle(420, GROUND_TOP - 70, 48, 28, 0x0f151c).setDepth(-3);
    windowFrame.setStrokeStyle(2, 0x2c3d4f);
    this.add.line(0, 0, 420, GROUND_TOP - 84, 420, GROUND_TOP - 56, 0x2c3d4f).setOrigin(0).setDepth(-3);
    this.add.line(0, 0, 396, GROUND_TOP - 70, 444, GROUND_TOP - 70, 0x2c3d4f).setOrigin(0).setDepth(-3);

    const table = this.add.rectangle(300, GROUND_TOP - 20, 90, 40, 0x1b2430).setDepth(-2);
    table.setStrokeStyle(1, 0x2c3b4e);

    this.shelterRadio = new Radio(this, 280, GROUND_TOP - 47, {
      dialogueKey: "C1_SHELTER_RADIO",
      promptText: "Tune emergency radio",
      isDamaged: false,
    });

    // Shelter has the ONE working emergency 12V battery-backed bulb
    this.createRoomCeilingLight(310, 490, { color: 0xf5d487, coneWidth: 220, lit: true });
    this.createDoorway(610, 490, "SHELTER EXIT", 48, 0x0e141c);

    // ==========================================
    // AREA 2: STREET (640 – 1600)
    // ==========================================
    // Tiered background cityscape facades
    // Building 1: Victorian/Dystopian 4-story tenement (640 - 1050)
    this.add.rectangle(845, 665, 410, 430, 0x121720).setDepth(-4);
    if (this.textures.exists("tex_brick_tile")) {
      this.add.tileSprite(845, 665, 410, 430, "tex_brick_tile").setAlpha(0.4).setDepth(-4);
    }
    // Concrete decorative stringcourses
    [530, 610, 690, 770].forEach((sy) => {
      this.add.rectangle(845, sy, 410, 6, 0x1b2430).setDepth(-3);
    });
    // Multi-tier dark shuttered windows
    for (let wy = 565; wy <= 725; wy += 80) {
      for (let wx = 690; wx <= 1010; wx += 64) {
        this.add.rectangle(wx, wy, 26, 38, 0x0a0e14).setStrokeStyle(1, 0x232e3c).setDepth(-3);
        this.add.rectangle(wx, wy + 19, 30, 4, 0x1c2633).setDepth(-3);
      }
    }
    // Dead unlit neon marquee sign: "HOTEL AURA" (rusted metal backing, unlit tubes)
    this.add.rectangle(860, 620, 110, 32, 0x161c24).setStrokeStyle(1, 0x334455).setDepth(-2);
    this.add.text(860, 620, "HOTEL AURA", {
      fontFamily: "monospace",
      fontSize: "12px",
      fontStyle: "bold",
      color: "#2f3e50",
      letterSpacing: 3,
    }).setOrigin(0.5).setDepth(-2);

    // Building 2: Commercial industrial building (1070 - 1580)
    this.add.rectangle(1325, 665, 510, 430, 0x10151c).setDepth(-4);
    if (this.textures.exists("tex_brick_tile")) {
      this.add.tileSprite(1325, 665, 510, 430, "tex_brick_tile").setAlpha(0.35).setDepth(-4);
    }
    // Ground-level commercial roll-up corrugated steel shutters
    this.add.rectangle(1180, 815, 160, 120, 0x18202a).setDepth(-3);
    if (this.textures.exists("tex_corrugated_metal")) {
      this.add.tileSprite(1180, 815, 160, 120, "tex_corrugated_metal").setAlpha(0.55).setDepth(-3);
    }
    // Weathered billboard sign: "DISTRICT 7 CONDUIT // POWER GRID"
    this.add.rectangle(1360, 610, 180, 48, 0x1a222d).setStrokeStyle(2, 0x2c3b4d).setDepth(-3);
    this.add.text(1360, 610, "DISTRICT 7 CONDUIT\n[SUBSTATION OFFLINE]", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#475a6e",
      align: "center",
      letterSpacing: 1,
    }).setOrigin(0.5).setDepth(-3);

    // Curbside stormwater drainage grates with wet reflections
    [820, 1080, 1360].forEach((dx) => {
      const grate = this.add.rectangle(dx, GROUND_TOP - 2, 32, 4, 0x0d1218).setStrokeStyle(1, 0x253342).setDepth(-1);
      for (let g = -10; g <= 10; g += 5) {
        this.add.line(0, 0, dx + g, GROUND_TOP - 4, dx + g, GROUND_TOP, 0x253342).setOrigin(0).setDepth(-1);
      }
      if (this.textures.exists("fx_puddle_glint")) {
        this.add.image(dx, GROUND_TOP + 4, "fx_puddle_glint").setDisplaySize(48, 8).setAlpha(0.4).setDepth(-1);
      }
    });

    // Dead, shattered streetlamps in the blackout
    [780, 1140, 1480].forEach((lx) => {
      this.add.rectangle(lx, GROUND_TOP - 80, 6, 160, 0x1e2733).setDepth(-3);
      this.add.rectangle(lx + 8, GROUND_TOP - 160, 22, 6, 0x2a3746).setDepth(-3);
      this.add.rectangle(lx + 16, GROUND_TOP - 158, 12, 4, 0x334455).setDepth(-2);
      this.add.circle(lx + 16, GROUND_TOP - 154, 3, 0x121820).setStrokeStyle(1, 0x2b3848).setDepth(-2);
      // Tangled cut electrical wire dangling loose
      this.add.line(0, 0, lx + 8, GROUND_TOP - 160, lx - 12, GROUND_TOP - 80, 0x151c24).setOrigin(0).setDepth(-2);
    });

    // Rusted bicycle resting under rain
    this.add.circle(904, GROUND_TOP - 11, 11, 0x000000, 0).setStrokeStyle(2, 0x4b3b34).setDepth(-2);
    this.add.circle(936, GROUND_TOP - 11, 11, 0x000000, 0).setStrokeStyle(2, 0x4b3b34).setDepth(-2);
    this.add.line(0, 0, 904, GROUND_TOP - 11, 920, GROUND_TOP - 22, 0x5c4338).setOrigin(0).setDepth(-2);
    this.add.line(0, 0, 920, GROUND_TOP - 22, 936, GROUND_TOP - 11, 0x5c4338).setOrigin(0).setDepth(-2);
    this.add.line(0, 0, 936, GROUND_TOP - 11, 930, GROUND_TOP - 29, 0x5c4338).setOrigin(0).setDepth(-2);

    // Real-world sized abandoned sedan (visual vehicle with stepped hood/roof/trunk climbing boxes)
    const carCfg = blockoutConfig.street.car;
    this.car = this.add.rectangle(carCfg.x, carCfg.y, carCfg.width, carCfg.height, 0x1c2530);
    if (this.textures.exists("prop_car")) {
      this.car.setVisible(false);
      this.add.image(carCfg.x, GROUND_TOP, "prop_car").setOrigin(0.5, 1).setDepth(0);
    } else {
      this.car.setStrokeStyle(2, 0x344457);
      this.add.circle(carCfg.x - 70, carCfg.y + 24, 14, 0x11161d);
      this.add.circle(carCfg.x + 70, carCfg.y + 24, 14, 0x11161d);
      this.add.rectangle(carCfg.x, carCfg.y - 18, 120, 32, 0x2b3846);
    }
    this.add
      .text(carCfg.x, carCfg.y - 48, "ABANDONED VEHICLE", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#54687d",
      })
      .setOrigin(0.5);

    // Stepped collision boxes for hood, roof, and trunk for climb navigation (player cannot walk through)
    this.carHood = this.add.rectangle(puzzleConfig.car.hood.x, puzzleConfig.car.hood.y, puzzleConfig.car.hood.width, puzzleConfig.car.hood.height, 0x000000, 0);
    this.physics.add.existing(this.carHood, true);
    if (this.carHood.body) {
      this.carHood.body.checkCollision.left = true;
      this.carHood.body.checkCollision.right = false;
      this.carHood.body.checkCollision.down = false;
      this.carHood.body.checkCollision.up = true;
    }

    this.carRoof = this.add.rectangle(puzzleConfig.car.roof.x, puzzleConfig.car.roof.y, puzzleConfig.car.roof.width, puzzleConfig.car.roof.height, 0x000000, 0);
    this.physics.add.existing(this.carRoof, true);
    if (this.carRoof.body) {
      this.carRoof.body.checkCollision.left = true;
      this.carRoof.body.checkCollision.right = true;
      this.carRoof.body.checkCollision.down = false;
      this.carRoof.body.checkCollision.up = true;
    }

    this.carTrunk = this.add.rectangle(puzzleConfig.car.trunk.x, puzzleConfig.car.trunk.y, puzzleConfig.car.trunk.width, puzzleConfig.car.trunk.height, 0x000000, 0);
    this.physics.add.existing(this.carTrunk, true);
    if (this.carTrunk.body) {
      this.carTrunk.body.checkCollision.left = false;
      this.carTrunk.body.checkCollision.right = true;
      this.carTrunk.body.checkCollision.down = false;
      this.carTrunk.body.checkCollision.up = true;
    }

    // Fire escape platform above street
    this.fireEscape = this.add.rectangle(puzzleConfig.fireEscape.x, puzzleConfig.fireEscape.y, puzzleConfig.fireEscape.width, puzzleConfig.fireEscape.height, 0x223040);
    this.physics.add.existing(this.fireEscape, true);
    this.fireEscape.setStrokeStyle(1, 0x3d4f66).setDepth(-2);
    if (this.fireEscape.body) {
      this.fireEscape.body.checkCollision.down = false; // jump through from below
    }

    // Street security gate (bars the street passage until winch is turned)
    this.streetGate = new Door(this, puzzleConfig.streetGate.x, puzzleConfig.streetGate.y, {
      id: "door_street_gate",
      label: "STREET GATE",
      height: puzzleConfig.streetGate.height,
      width: puzzleConfig.streetGate.width,
    });
    this.streetGate.interactionText = "Street gate locked (Manual counterweight on fire escape)";

    // Counterweight winch on fire escape awning
    this.gateWinchProp = new InspectableProp(this, puzzleConfig.gateWinch.x, puzzleConfig.gateWinch.y, {
      promptText: "Turn gate winch",
      dialogueKey: "C1_WINCH_ACTIVATE",
      range: 52,
      onInteract: () => {
        this.streetGate.unlock();
        this.streetGate.open();
        this.storySystem.setFlag(STORY_FLAGS.GATE_OPEN);
        this.objectiveSystem.setObjective("C1_ENTER_APARTMENT");
        this.soundSystem?.playLever?.();
        this.saveGame();
      },
    });

    this.newspaper = new Newspaper(this, blockoutConfig.street.newspaper.x, blockoutConfig.street.newspaper.y);

    // ==========================================
    // AREA 3 & 4: APARTMENT (1600 – 3200)
    // ==========================================
    // Foyer Exterior Steps & Awning (1600 - 2000)
    this.add.rectangle(1820, GROUND_TOP - 100, 340, 200, 0x141b22).setDepth(-4);
    this.add.rectangle(1820, GROUND_TOP - 205, 360, 14, 0x1b2430).setDepth(-3);
    for (let s = 0; s < 3; s++) {
      this.add.rectangle(1940 + s * 16, GROUND_TOP - 8 - s * 8, 20, 16 + s * 16, 0x222c37).setDepth(-3);
    }
    // Apartment entrance intercom panel
    const intercomBox = this.add.rectangle(1680, GROUND_TOP - 55, 14, 26, 0x1f2b38).setDepth(-2);
    intercomBox.setStrokeStyle(1, 0x3b4e63);
    this.add.rectangle(1680, GROUND_TOP - 58, 8, 14, 0x121a22).setDepth(-2);

    // Foyer wall-mounted brass mailbox bank (APT 1A - 8F)
    const mailboxBank = this.add.rectangle(1760, GROUND_TOP - 60, 48, 36, 0x241d14).setStrokeStyle(1, 0x423422).setDepth(-3);
    for (let mx = -16; mx <= 16; mx += 16) {
      for (let my = -10; my <= 10; my += 10) {
        this.add.rectangle(1760 + mx, GROUND_TOP - 60 + my, 10, 4, 0xd9a441, 0.7).setDepth(-3);
      }
    }
    this.add.text(1760, GROUND_TOP - 84, "MAIL", { fontFamily: "monospace", fontSize: "8px", color: "#6b8096" }).setOrigin(0.5).setDepth(-3);

    // Apartment 04 Interior structure (2000 – 3200)
    this.add.rectangle(2590, 480, 1180, 20, 0x12171f).setDepth(-3);
    const aptBackWall = this.add.rectangle(2590, 685, 1180, 390, 0x141b24).setDepth(-4);
    this.interiorWalls.push(aptBackWall);

    // Authentic two-tone wall: top teal plaster, middle mahogany dado rail, bottom wood wainscoting
    if (this.textures.exists("tex_tenement_hallway")) {
      this.add.tileSprite(2590, 685, 1180, 390, "tex_tenement_hallway").setAlpha(0.85).setDepth(-4);
    } else if (this.textures.exists("tex_brick_tile")) {
      this.add.tileSprite(2590, 685, 1180, 390, "tex_brick_tile").setAlpha(0.32).setDepth(-4);
    }

    // Numbered background apartment doors along corridor (APT 4A, 4B, 4C)
    const hallwayDoors = [
      { x: 2190, num: "4A" },
      { x: 2470, num: "4B" },
      { x: 2790, num: "4C" },
    ];
    hallwayDoors.forEach(({ x, num }) => {
      // Dark walnut door panel
      this.add.rectangle(x, GROUND_TOP - 56, 42, 112, 0x16110c).setStrokeStyle(2, 0x2e2116).setDepth(-3);
      // Moulded recessed inner door panels
      this.add.rectangle(x, GROUND_TOP - 84, 30, 42, 0x1c1510).setStrokeStyle(1, 0x241a12).setDepth(-3);
      this.add.rectangle(x, GROUND_TOP - 34, 30, 44, 0x1c1510).setStrokeStyle(1, 0x241a12).setDepth(-3);
      // Brass doorknob & keyhole
      this.add.circle(x + 14, GROUND_TOP - 56, 2.5, 0xd9a441).setDepth(-3);
      // Brass apartment unit number plate
      this.add.text(x, GROUND_TOP - 94, num, { fontFamily: "monospace", fontSize: "9px", fontStyle: "bold", color: "#d9a441" }).setOrigin(0.5).setDepth(-3);
      // Transom window overhead
      this.add.rectangle(x, GROUND_TOP - 120, 38, 12, 0x141e24).setStrokeStyle(1, 0x2a3744).setDepth(-3);
    });

    // Overhead industrial steam and conduit pipes running near ceiling
    this.add.rectangle(2590, 502, 1180, 6, 0x25323e).setStrokeStyle(1, 0x19222c).setDepth(-3);
    for (let px = 2060; px <= 3120; px += 130) {
      this.add.rectangle(px, 496, 4, 16, 0x3d4e61).setDepth(-3); // pipe hanger brackets
    }
    // Red circular valve wheel at x = 2320
    const valveWheel = this.add.circle(2320, 502, 8, 0x000000, 0).setStrokeStyle(2, 0x8a2020).setDepth(-3);
    this.add.circle(2320, 502, 2, 0xd9a441).setDepth(-3);

    // Wall-mounted cast iron radiator at x = 2360
    const radiator = this.add.rectangle(2360, GROUND_TOP - 22, 46, 42, 0x1a232d).setStrokeStyle(1, 0x2a3848).setDepth(-2);
    for (let rx = -18; rx <= 18; rx += 6) {
      this.add.rectangle(2360 + rx, GROUND_TOP - 22, 2, 38, 0x2c3b4d).setDepth(-2);
    }

    // Wall-mounted emergency fire extinguisher cabinet at x = 2240
    this.add.rectangle(2240, GROUND_TOP - 70, 24, 34, 0x5a1818).setStrokeStyle(1, 0x8a2222).setDepth(-2);
    this.add.rectangle(2240, GROUND_TOP - 70, 16, 24, 0x200808).setDepth(-2);
    this.add.rectangle(2240, GROUND_TOP - 70, 6, 18, 0xd94441).setDepth(-2); // fire canister
    this.add.text(2240, GROUND_TOP - 92, "FIRE", { fontFamily: "monospace", fontSize: "7px", color: "#d94441" }).setOrigin(0.5).setDepth(-2);

    // Subterranean floor drainage grate (foreshadowing Chapter 2)
    const drainGrate = this.add.rectangle(2120, GROUND_TOP - 2, 34, 4, 0x0f151e).setDepth(-1);
    drainGrate.setStrokeStyle(1, 0x253342);
    for (let g = -12; g <= 12; g += 6) {
      this.add.line(0, 0, 2120 + g, GROUND_TOP - 4, 2120 + g, GROUND_TOP, 0x253342).setOrigin(0).setDepth(-1);
    }

    this.createDoorway(2000, 490, "APT 04 ENTRANCE", 56, 0x0b1016);

    // In blackout, dead broken fixtures at 2280 and 2950; only ONE industrial light at 2650 turns on with breaker
    this.createDeadCeilingLight(2280, 490);
    this.interiorLights.push(
      this.createRoomCeilingLight(2650, 490, { color: 0xf5d487, coneWidth: 220, lit: false })
    );
    this.createDeadCeilingLight(2950, 490);

    // Security partition wall bulkhead above door_01
    const secBulkhead = this.add.rectangle(puzzleConfig.door.x, 625, 36, 270, 0x161f29).setDepth(2);
    secBulkhead.setStrokeStyle(1, 0x2c3b4d);

    this.add.rectangle(2080, GROUND_TOP - 70, 28, 34, 0x1e2833).setStrokeStyle(1, 0x334455).setDepth(-2);
    const notePaper = this.add.rectangle(2080, GROUND_TOP - 70, 18, 24, 0xded5be).setDepth(-2);
    notePaper.setStrokeStyle(1, 0x9b9079);
    this.add
      .text(2080, GROUND_TOP - 102, "MAINTENANCE NOTICE", {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#7e93a6",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(-2);

    this.maintenanceNote = {
      x: 2080,
      y: GROUND_TOP - 70,
      enabled: true,
      canInteract: () => this.maintenanceNote.enabled,
      interact: () => { this.dialogueSystem.start("C1_MAINTENANCE_NOTE"); },
      getInteractionText: () => "Read maintenance notice",
      getInteractionPosition: () => ({ x: 2080, y: GROUND_TOP - 70 }),
      setEnabled: (v) => { this.maintenanceNote.enabled = v; },
      destroy: () => { this.events.emit("object:destroyed", this.maintenanceNote); },
    };

    // High industrial overhead wall rack (one-way platform: jump up from crate)
    this.shelf = this.add.rectangle(
      puzzleConfig.shelf.x,
      puzzleConfig.shelf.y,
      puzzleConfig.shelf.width,
      puzzleConfig.shelf.height,
      0x253342
    );
    this.physics.add.existing(this.shelf, true);
    if (this.shelf.body) {
      this.shelf.body.checkCollision.down = false; // Player can jump up through rack
      this.shelf.body.checkCollision.left = false;
      this.shelf.body.checkCollision.right = false;
      this.shelf.body.checkCollision.up = true;    // Land firmly on top
    }
    this.shelf.setStrokeStyle(1, 0x475e75).setDepth(-2);

    // Hazard warning stripes along rack lip
    for (let hx = puzzleConfig.shelf.x - 60; hx <= puzzleConfig.shelf.x + 50; hx += 16) {
      this.add.line(0, 0, hx, puzzleConfig.shelf.y - 4, hx + 8, puzzleConfig.shelf.y + 4, 0xd9a441).setOrigin(0).setDepth(-2);
    }
    // Heavy industrial triangular wall brackets anchoring to wall
    this.add.triangle(
      puzzleConfig.shelf.x - 52, puzzleConfig.shelf.y + 14,
      0, 0, 0, 24, 14, 0,
      0x1a2430
    ).setDepth(-3).setStrokeStyle(1, 0x3d4f66);
    this.add.triangle(
      puzzleConfig.shelf.x + 52, puzzleConfig.shelf.y + 14,
      0, 0, 0, 24, -14, 0,
      0x1a2430
    ).setDepth(-3).setStrokeStyle(1, 0x3d4f66);

    this.add
      .text(puzzleConfig.shelf.x, puzzleConfig.shelf.y - 18, "OVERHEAD STORAGE // RACK-04", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#6b8096",
      })
      .setOrigin(0.5)
      .setDepth(-2);

    // ==========================================
    // AREA 5: MIRA'S APARTMENT (3200 – 3840)
    // ==========================================
    this.add.rectangle(3510, 480, 660, 20, 0x12171f).setDepth(-3);
    const miraBackWall = this.add.rectangle(3510, 685, 660, 390, 0x1a1614).setDepth(-4);
    this.interiorWalls.push(miraBackWall);
    // Warm acoustic timber paneling
    if (this.textures.exists("tex_mira_room")) {
      this.add.tileSprite(3510, 685, 660, 390, "tex_mira_room").setAlpha(0.75).setDepth(-4);
    } else if (this.textures.exists("tex_brick_tile")) {
      this.add.tileSprite(3510, 685, 660, 390, "tex_brick_tile").setAlpha(0.3).setDepth(-4);
    }

    // Exposed timber ceiling beams
    for (let bx = 3240; bx <= 3800; bx += 80) {
      this.add.rectangle(bx, 492, 14, 24, 0x241a12).setStrokeStyle(1, 0x38291c).setDepth(-3);
    }

    // Large rainy apartment window looking out onto dark stormy city skyline
    const winX = 3360;
    const winY = 620;
    this.add.rectangle(winX, winY, 82, 104, 0x0c1117).setStrokeStyle(2, 0x241a12).setDepth(-3);
    // Window glass panes with rain streaks
    for (let px = -22; px <= 22; px += 44) {
      for (let py = -32; py <= 32; py += 32) {
        this.add.rectangle(winX + px, winY + py, 38, 28, 0x121b25).setStrokeStyle(1, 0x212e3c).setDepth(-3);
        // Rain trickles on glass
        this.add.line(0, 0, winX + px - 8, winY + py - 10, winX + px - 12, winY + py + 8, 0x3d4e61, 0.4).setOrigin(0).setDepth(-3);
      }
    }
    this.add.rectangle(winX, winY + 54, 90, 6, 0x2c1f16).setDepth(-3); // wooden sill

    // Giant Investigation Corkboard with blueprints, notes, and red string connections
    const boardX = 3530;
    const boardY = 620;
    this.add.rectangle(boardX, boardY, 134, 72, 0x382a1d).setStrokeStyle(2, 0x221810).setDepth(-3);
    // Center railway blueprint
    this.add.rectangle(boardX + 10, boardY, 46, 32, 0x162c3e).setStrokeStyle(1, 0x2e4f6d).setDepth(-3);
    this.add.line(0, 0, boardX - 8, boardY, boardX + 28, boardY, 0x4a7a9e, 0.7).setOrigin(0).setDepth(-3);
    this.add.line(0, 0, boardX + 6, boardY - 10, boardX + 6, boardY + 10, 0x4a7a9e, 0.7).setOrigin(0).setDepth(-3);
    // Yellow schematic note tags & red pushpins
    const pinNotes = [
      { x: boardX - 44, y: boardY - 18, c: 0xd9a441 },
      { x: boardX - 38, y: boardY + 16, c: 0xded5be },
      { x: boardX + 46, y: boardY - 14, c: 0xd9a441 },
      { x: boardX + 42, y: boardY + 18, c: 0xded5be },
    ];
    pinNotes.forEach((n) => {
      this.add.rectangle(n.x, n.y, 14, 12, n.c).setDepth(-3);
      this.add.circle(n.x, n.y - 4, 1.5, 0xd94441).setDepth(-3); // red pin
    });
    // Red connecting yarn lines crisscrossing on the board
    this.add.line(0, 0, boardX - 44, boardY - 18, boardX + 10, boardY, 0xd94441, 0.8).setOrigin(0).setDepth(-3);
    this.add.line(0, 0, boardX + 10, boardY, boardX + 46, boardY - 14, 0xd94441, 0.8).setOrigin(0).setDepth(-3);
    this.add.line(0, 0, boardX - 38, boardY + 16, boardX + 42, boardY + 18, 0xd94441, 0.8).setOrigin(0).setDepth(-3);

    // Sleeping cot in corner (x = 3270)
    this.add.rectangle(3270, GROUND_TOP - 16, 76, 28, 0x181e26).setStrokeStyle(1, 0x2c3744).setDepth(-2);
    this.add.rectangle(3270, GROUND_TOP - 22, 70, 14, 0x2b3846).setDepth(-2); // woolen blanket
    this.add.rectangle(3240, GROUND_TOP - 26, 18, 8, 0xded5be).setDepth(-2); // pillow

    // Bookshelf with technical manuals (x = 3630)
    const bShelf = this.add.rectangle(3630, GROUND_TOP - 50, 36, 90, 0x221810).setStrokeStyle(1, 0x362518).setDepth(-2);
    for (let by = GROUND_TOP - 80; by <= GROUND_TOP - 20; by += 28) {
      this.add.rectangle(3630, by, 32, 2, 0x362518).setDepth(-2);
      for (let bx = -12; bx <= 12; bx += 6) {
        const bookH = 12 + ((bx * 7) % 6);
        const bookCol = ((bx + by) % 2 === 0) ? 0x4a3222 : 0x2c3b4a;
        this.add.rectangle(3630 + bx, by - bookH / 2, 4, bookH, bookCol).setDepth(-2);
      }
    }

    // Floor runner rug under desk
    this.add.rectangle(3520, GROUND_TOP - 2, 180, 4, 0x3a281c).setDepth(-2);

    this.interiorLights.push(
      this.createRoomCeilingLight(3480, 490, { color: 0xf5d487, coneWidth: 210, lit: false })
    );
    this.add
      .text(3520, GROUND_TOP - 220, "MIRA'S ROOM", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#3d5064",
        letterSpacing: 2,
      })
      .setOrigin(0.5)
      .setDepth(-3);

    const deskCfg = blockoutConfig.miraApartment.desk;
    if (this.textures.exists("prop_desk")) {
      this.add.image(deskCfg.x + 2, GROUND_TOP, "prop_desk").setOrigin(0.5, 1).setDepth(-2);
      if (this.textures.exists("fx_radial_glow")) {
        const lampGlow = this.add
          .image(deskCfg.x + 26, GROUND_TOP - 52, "fx_radial_glow")
          .setDisplaySize(72, 72)
          .setTint(0xf5d487)
          .setAlpha(0)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(-1);
        this.interiorLights.push({
          halo: lampGlow,
          cone: null,
          pool: null,
          haloAlpha: 0.24,
          color: 0xf5d487,
        });
      }
    } else {
      const miraDesk = this.add.rectangle(deskCfg.x, deskCfg.y, deskCfg.width, deskCfg.height, 0x202b37).setDepth(-2);
      miraDesk.setStrokeStyle(1, 0x334455);
      this.add.rectangle(deskCfg.x - 48, deskCfg.y + 6, 16, 28, 0x182029).setDepth(-2);
    }
    this.add.rectangle(blockoutConfig.miraApartment.notebook.x, deskCfg.y, 44, deskCfg.height, 0x1c2530).setDepth(-2);

    this.miraPhoto = new MiraClue(this, blockoutConfig.miraApartment.photo.x, blockoutConfig.miraApartment.photo.y, {
      id: "mira_photo",
      dialogueKey: "C1_MIRA_PHOTO",
      interactionText: "Examine framed photo",
      visualType: "photo",
    });

    this.miraDrawing = new MiraClue(this, blockoutConfig.miraApartment.drawing.x, blockoutConfig.miraApartment.drawing.y, {
      id: "mira_drawing",
      dialogueKey: "C1_MIRA_DRAWING",
      interactionText: "Examine child's drawing",
      clueFlag: STORY_FLAGS.MIRA_CLUE_FOUND,
      visualType: "drawing",
    });

    this.miraNotebook = new MiraClue(this, blockoutConfig.miraApartment.notebook.x, blockoutConfig.miraApartment.notebook.y, {
      id: "mira_notebook",
      dialogueKey: "C1_MIRA_NOTEBOOK",
      interactionText: "Read handwritten notebook",
      visualType: "notebook",
    });

    // Mira's electronics workbench with glowing oscilloscope & radio chassis
    const miraBench = this.add.rectangle(3720, GROUND_TOP - 18, 64, 36, 0x1b232e).setDepth(-2);
    miraBench.setStrokeStyle(1, 0x2f3e50);
    // Oscilloscope monitor with phosphor wave
    this.add.rectangle(3710, GROUND_TOP - 44, 22, 16, 0x0c1410).setStrokeStyle(1, 0x1d3625).setDepth(-2);
    this.add.line(0, 0, 3701, GROUND_TOP - 44, 3719, GROUND_TOP - 44, 0x22c55e, 0.7).setOrigin(0).setDepth(-2);
    // Radio chassis with warm vacuum tubes
    this.add.rectangle(3736, GROUND_TOP - 40, 20, 10, 0x263342).setDepth(-2);
    this.add.circle(3732, GROUND_TOP - 48, 2, 0xd9a441, 0.6).setDepth(-2);
    this.add.circle(3740, GROUND_TOP - 48, 2, 0xd9a441, 0.6).setDepth(-2);

    // Searchable desk drawer for Mira's rail transit pass
    this.miraDeskDrawer = new InspectableProp(this, puzzleConfig.miraDeskDrawer.x, puzzleConfig.miraDeskDrawer.y, {
      promptText: "Search desk drawers",
      dialogueKey: "C1_MIRA_DESK_SEARCH",
      range: 52,
      onInteract: () => {
        this.storySystem.setFlag(STORY_FLAGS.TRANSIT_CARD_FOUND);
        this.storySystem.addItem("transit_pass");
        this.objectiveSystem.setObjective("C1_UNLOCK_ALLEY");
        this.soundSystem?.playPickup?.();
        this.saveGame();
      },
    });

    // Sealed airlock door into alley/rail yard
    this.airlockDoor = new Door(this, puzzleConfig.airlockDoor.x, puzzleConfig.airlockDoor.y, {
      id: "door_alley",
      label: "YARD AIRLOCK",
      height: 130,
      width: 24,
    });
    this.airlockDoor.interactionText = "Airlock locked (Rail transit pass required)";

    // Airlock security swipe console
    this.airlockConsole = new InspectableProp(this, puzzleConfig.airlockConsole.x, puzzleConfig.airlockConsole.y, {
      promptText: "Swipe rail transit pass",
      range: 52,
      onInteract: () => {
        if (this.storySystem.hasFlag(STORY_FLAGS.TRANSIT_CARD_FOUND)) {
          this.soundSystem?.playKeycardSwipe?.();
          this.airlockDoor.unlock();
          this.airlockDoor.open();
          this.storySystem.setFlag(STORY_FLAGS.ALLEY_DOOR_OPEN);
          this.dialogueSystem.start("C1_ALLEY_DOOR_UNLOCKED", () => {
            this.objectiveSystem.setObjective("C1_NAVIGATE_YARD");
          });
          this.saveGame();
        } else {
          this.dialogueSystem.start("C1_ALLEY_DOOR_LOCKED");
        }
      },
    });

    this.createDoorway(3830, 490, "TO ALLEY", 44, 0x0b1016);

    // ==========================================
    // AREA 6: ALLEY & RAIL YARD (3840 – 4480) & STEALTH
    // ==========================================
    // Corrugated iron warehouse back-walls with vertical ridges & rust
    this.add.rectangle(4160, 680, 640, 400, 0x161e27).setDepth(-4);
    if (this.textures.exists("tex_corrugated_metal")) {
      this.add.tileSprite(4160, 680, 640, 400, "tex_corrugated_metal").setAlpha(0.65).setDepth(-4);
    }
    this.add.rectangle(4160, GROUND_TOP - 200, 640, 14, 0x1f2936).setDepth(-3);

    // Authentic Railway Track Foundation across the yard (ballast, wooden ties, steel rails)
    if (this.textures.exists("tex_rail_ballast")) {
      this.add.tileSprite(4160, GROUND_TOP - 8, 640, 18, "tex_rail_ballast").setDepth(-1);
    }
    // Wooden railroad cross-ties
    for (let rx = 3845; rx <= 4475; rx += 22) {
      this.add.rectangle(rx, GROUND_TOP - 6, 16, 8, 0x1c1510).setDepth(-1);
    }
    // Twin steel rails with specular gleam
    this.add.rectangle(4160, GROUND_TOP - 10, 640, 3, 0x475b70).setDepth(-1);
    this.add.rectangle(4160, GROUND_TOP - 11, 640, 1, 0x8fa3ba).setDepth(-1);

    // Massive Rusted Freight Train Boxcar (4260, y = 785)
    const boxcarX = 4270;
    const boxcarY = 785;
    const boxcarW = 240;
    const boxcarH = 130;
    const boxcarBody = this.add.rectangle(boxcarX, boxcarY, boxcarW, boxcarH, 0x221717).setStrokeStyle(2, 0x382323).setDepth(-3);
    // Vertical corrugated iron panel lines on boxcar
    for (let px = -boxcarW / 2 + 16; px <= boxcarW / 2 - 16; px += 24) {
      this.add.line(0, 0, boxcarX + px, boxcarY - boxcarH / 2, boxcarX + px, boxcarY + boxcarH / 2, 0x160f0f).setOrigin(0).setDepth(-3);
    }
    // Boxcar sliding cargo door frame
    this.add.rectangle(boxcarX, boxcarY + 10, 70, boxcarH - 20, 0x1a1212).setStrokeStyle(2, 0x442a2a).setDepth(-3);
    // Stenciled railway boxcar markings
    this.add.text(boxcarX - 50, boxcarY - 44, "NORTHERN PACIFIC RAIL // 842-X", {
      fontFamily: "monospace",
      fontSize: "8px",
      fontStyle: "bold",
      color: "#6b4a3a",
      letterSpacing: 1,
    }).setOrigin(0.5).setDepth(-3);

    // Steel train bogie wheel trucks resting on rails
    [-70, 70].forEach((ox) => {
      this.add.rectangle(boxcarX + ox, boxcarY + boxcarH / 2 + 6, 44, 12, 0x11161d).setDepth(-2);
      this.add.circle(boxcarX + ox - 14, boxcarY + boxcarH / 2 + 10, 8, 0x2c3b4e).setStrokeStyle(2, 0x475b70).setDepth(-2);
      this.add.circle(boxcarX + ox + 14, boxcarY + boxcarH / 2 + 10, 8, 0x2c3b4e).setStrokeStyle(2, 0x475b70).setDepth(-2);
    });

    // Perimeter chain-link security fence with barbed wire outriggers
    for (let fx = 3880; fx <= 4440; fx += 80) {
      this.add.rectangle(fx, GROUND_TOP - 90, 4, 180, 0x222d3a).setDepth(-3);
      this.add.line(0, 0, fx, GROUND_TOP - 180, fx + 12, GROUND_TOP - 194, 0x3d4e61).setOrigin(0).setDepth(-3); // angled outrigger
    }
    // Barbed wire strands
    for (let wy = GROUND_TOP - 192; wy <= GROUND_TOP - 180; wy += 6) {
      this.add.line(0, 0, 3880, wy, 4440, wy, 0x3d4e61, 0.7).setOrigin(0).setDepth(-3);
    }
    // Yellow high-voltage warning sign
    this.add.rectangle(3960, GROUND_TOP - 120, 24, 18, 0xd9a441).setStrokeStyle(1, 0x221100).setDepth(-2);
    this.add.text(3960, GROUND_TOP - 120, "DANGER\n3RD RAIL", { fontFamily: "monospace", fontSize: "5px", color: "#11161d", align: "center" }).setOrigin(0.5).setDepth(-2);

    // Towering dead floodlight mast (blackout)
    this.add.rectangle(4380, GROUND_TOP - 140, 8, 280, 0x161e27).setDepth(-3);
    this.add.rectangle(4380, GROUND_TOP - 280, 48, 6, 0x253242).setDepth(-3);
    [-16, -6, 6, 16].forEach((lx) => {
      this.add.circle(4380 + lx, GROUND_TOP - 286, 5, 0x12171f).setStrokeStyle(1, 0x2b3848).setDepth(-3);
    });

    const obs = blockoutConfig.alley.obstacle;
    this.alleyObstacle = this.add.rectangle(obs.x, obs.y, obs.width, obs.height, 0x263340);
    this.physics.add.existing(this.alleyObstacle, true);
    if (this.textures.exists("prop_dumpster")) {
      this.alleyObstacle.setVisible(false);
      this.add.image(obs.x, GROUND_TOP, "prop_dumpster").setOrigin(0.5, 1).setDepth(0);
    } else {
      this.alleyObstacle.setStrokeStyle(2, 0x3d4e61);
    }
    this.add.text(obs.x, obs.y - 38, "DUMPSTER", { fontFamily: "monospace", fontSize: "9px", color: "#54687d" }).setOrigin(0.5);

    this.coverSpots = blockoutConfig.alley.coverSpots.map((cfg) => {
      return new HidingSpot(this, cfg.x, cfg.y, cfg.label);
    });

    const wCfg = blockoutConfig.alley.wanderer;
    this.wanderer = new Wanderer(this, wCfg.x, wCfg.y, wCfg.minX, wCfg.maxX);
    this.physics.add.collider(this.wanderer, ground);

    // Hanging chain pulley noise distraction over stacked rusted iron pipes
    const craneArm = this.add.rectangle(puzzleConfig.chainDistraction.x - 10, puzzleConfig.chainDistraction.y - 80, 36, 6, 0x253342).setDepth(-2);
    const dropChain = this.add.line(0, 0, puzzleConfig.chainDistraction.x, puzzleConfig.chainDistraction.y - 80, puzzleConfig.chainDistraction.x, puzzleConfig.chainDistraction.y, 0x6b7f94).setOrigin(0).setDepth(-2);
    // Stacked iron pipes beneath the chain
    for (let py = 0; py < 3; py++) {
      for (let px = 0; px < 4 - py; px++) {
        this.add.circle(puzzleConfig.chainDistraction.x - 20 + px * 12 + py * 6, GROUND_TOP - 8 - py * 10, 6, 0x2e3b48).setStrokeStyle(1, 0x4a5d70).setDepth(-2);
      }
    }

    this.chainDistraction = new InspectableProp(this, puzzleConfig.chainDistraction.x, puzzleConfig.chainDistraction.y, {
      promptText: "Pull chain pulley",
      dialogueKey: "C1_CHAIN_DISTRACT",
      range: 52,
      onInteract: () => {
        this.soundSystem?.playMetalClatter?.();
        this.storySystem.setFlag(STORY_FLAGS.CHAIN_DISTRACTED);
        if (this.wanderer) {
          this.wanderer.distract(4100, 6000);
        }
        this.objectiveSystem.setObjective("C1_CONNECT_BATTERY");
        this.saveGame();
      },
    });

    this.alleyRadio = new Radio(this, blockoutConfig.alley.radio.x, blockoutConfig.alley.radio.y, {
      dialogueKey: "C1_ALLEY_RADIO",
      promptText: "Inspect damaged radio",
      isDamaged: true,
    });

    // ==========================================
    // AREA 7: EMERGENCY TERMINAL (4480 – 5120)
    // ==========================================
    this.add.rectangle(4800, 669, 260, 422, 0x111720).setDepth(-4);
    // High-tech vintage mainframe server rack paneling
    if (this.textures.exists("tex_relay_server")) {
      this.add.tileSprite(4800, 669, 260, 422, "tex_relay_server").setAlpha(0.85).setDepth(-4);
    } else if (this.textures.exists("tex_brick_tile")) {
      this.add.tileSprite(4800, 669, 260, 422, "tex_brick_tile").setAlpha(0.32).setDepth(-4);
    }
    this.add.rectangle(4800, 450, 280, 16, 0x1a232e).setDepth(-3);

    // Overhead yellow industrial cable trays with cable bundles
    this.add.rectangle(4800, 474, 260, 6, 0xd9a441, 0.6).setStrokeStyle(1, 0x5a4214).setDepth(-3);
    for (let cy = 478; cy <= GROUND_TOP - 60; cy += 40) {
      this.add.line(0, 0, 4710, 474, 4710, GROUND_TOP - 50, 0x121720).setOrigin(0).setLineWidth(3).setDepth(-3);
    }

    // Illuminated Northern Railway Continuity Network Schematic Display Board (4800, y = 570)
    const netBoard = this.add.rectangle(4800, 560, 150, 64, 0x090e14).setStrokeStyle(2, 0x203244).setDepth(-3);
    this.add.text(4800, 536, "SECTOR 7 RELAY GRID", { fontFamily: "monospace", fontSize: "7px", color: "#38bdf8", letterSpacing: 1 }).setOrigin(0.5).setDepth(-3);
    // Schematic grid circuit paths
    this.add.line(0, 0, 4740, 565, 4770, 565, 0x22445e).setOrigin(0).setDepth(-3);
    this.add.line(0, 0, 4770, 565, 4800, 550, 0x22445e).setOrigin(0).setDepth(-3);
    this.add.line(0, 0, 4800, 550, 4830, 570, 0x22445e).setOrigin(0).setDepth(-3);
    this.add.line(0, 0, 4830, 570, 4860, 570, 0x22445e).setOrigin(0).setDepth(-3);
    // Track node indicators
    [4740, 4770, 4800, 4830, 4860].forEach((nx, i) => {
      this.add.circle(nx, (i % 2 === 0 ? 565 : 550), 2.5, i === 2 ? 0x22c55e : 0x38bdf8).setDepth(-3);
    });

    this.createRoomCeilingLight(4800, 458, { color: 0x38bdf8, coneWidth: 180, lit: true });
    this.createDoorway(4675, 458, "RELAY IN", 36, 0x0b1016);
    this.createDoorway(4925, 458, "RELAY OUT", 36, 0x0b1016);
    this.add
      .text(4800, GROUND_TOP - 160, "CONTINUITY RELAY STATION 09", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#4a5d70",
      })
      .setOrigin(0.5)
      .setDepth(-3);

    // Heavy lead-acid battery bank outside Station 09 with copper busbars and analog voltmeter
    const batRack = this.add.rectangle(puzzleConfig.relayBattery.x, GROUND_TOP - 20, 68, 40, 0x151d26).setStrokeStyle(1, 0x2b3b4c).setDepth(-2);
    // 3 glass battery jars with electrolyte & copper busbars
    [-20, 0, 20].forEach((bx) => {
      this.add.rectangle(puzzleConfig.relayBattery.x + bx, GROUND_TOP - 20, 16, 26, 0x1e2e3d, 0.8).setStrokeStyle(1, 0x3a526b).setDepth(-2);
      this.add.rectangle(puzzleConfig.relayBattery.x + bx, GROUND_TOP - 20, 4, 18, 0x475b70).setDepth(-2); // lead plate
      this.add.rectangle(puzzleConfig.relayBattery.x + bx, GROUND_TOP - 34, 14, 2, 0xd9a441).setDepth(-2); // copper strap
    });
    // Analog voltmeter dial
    this.add.circle(puzzleConfig.relayBattery.x + 24, GROUND_TOP - 44, 7, 0xded5be).setStrokeStyle(1, 0x221100).setDepth(-2);
    this.add.line(0, 0, puzzleConfig.relayBattery.x + 24, GROUND_TOP - 44, puzzleConfig.relayBattery.x + 28, GROUND_TOP - 47, 0xd94441).setOrigin(0).setDepth(-2); // needle

    this.relayBattery = new InspectableProp(this, puzzleConfig.relayBattery.x, puzzleConfig.relayBattery.y, {
      promptText: "Reconnect battery ground clamp",
      dialogueKey: "C1_RELAY_BATTERY_FIX",
      range: 54,
      onInteract: () => {
        this.soundSystem?.playSparks?.();
        this.storySystem.setFlag(STORY_FLAGS.RELAY_BATTERY_CONNECTED);
        this.objectiveSystem.setObjective("C1_INVESTIGATE_TERMINAL");
        this.saveGame();
      },
    });

    this.terminal = new Terminal(this, blockoutConfig.terminal.console.x, blockoutConfig.terminal.console.y);

    // Track access security gate leading to Viewpoint
    this.trackGate = new Door(this, puzzleConfig.trackGate.x, puzzleConfig.trackGate.y, {
      id: "door_track",
      label: "TRACK ACCESS",
      height: 130,
      width: 20,
    });
    this.trackGate.interactionText = "Track gate locked (Continuity terminal offline)";

    // Terminal data rack unit
    const terminalRack = this.add.rectangle(4920, GROUND_TOP - 30, 24, 60, 0x141b24).setDepth(-2);
    terminalRack.setStrokeStyle(1, 0x283748);
    this.add.rectangle(4920, GROUND_TOP - 40, 16, 4, 0x22c55e, 0.7).setDepth(-2);

    // ==========================================
    // AREA 8: RAILWAY VIEWPOINT (5120 – 5760)
    // ==========================================
    // Massive steel bridge truss girders framing the chasm
    const trussX = 5440;
    // Overhead bridge gantry beam
    this.add.rectangle(trussX, 480, 560, 16, 0x18212c).setStrokeStyle(2, 0x2c3b4e).setDepth(-3);
    // Diagonal cross-brace bridge trusses
    for (let tx = 5180; tx <= 5700; tx += 120) {
      this.add.rectangle(tx, 680, 12, 400, 0x141b24).setStrokeStyle(1, 0x253444).setDepth(-3);
      this.add.line(0, 0, tx - 50, 480, tx + 50, 880, 0x182330).setOrigin(0).setLineWidth(3).setDepth(-3);
      this.add.line(0, 0, tx + 50, 480, tx - 50, 880, 0x182330).setOrigin(0).setLineWidth(3).setDepth(-3);
    }

    // Railway tracks extending out toward the cliff edge
    for (let rx = 5120; rx <= 5580; rx += 22) {
      this.add.rectangle(rx, GROUND_TOP - 6, 16, 8, 0x1c1510).setDepth(-1);
    }
    this.add.rectangle(5350, GROUND_TOP - 10, 460, 3, 0x475b70).setDepth(-1);
    this.add.rectangle(5350, GROUND_TOP - 11, 460, 1, 0x8fa3ba).setDepth(-1);

    const railCfg = blockoutConfig.viewpoint.railing;
    const railing = this.add.rectangle(railCfg.x, railCfg.y, railCfg.width, railCfg.height, 0x1b242e).setDepth(-2);
    railing.setStrokeStyle(2, 0x334455);
    this.add
      .text(railCfg.x, railCfg.y - 36, "RAILWAY DISTRICT OVERLOOK", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#6b8096",
      })
      .setOrigin(0.5);

    const towerX = blockoutConfig.viewpoint.signalTower.x;
    const towerY = blockoutConfig.viewpoint.signalTower.y;
    // Structural signal tower with ladder and microwave dish
    this.add.rectangle(towerX, towerY + 60, 20, 140, 0x182029).setDepth(-4);
    this.add.rectangle(towerX, towerY + 30, 48, 6, 0x222d38).setDepth(-4);
    this.add.rectangle(towerX, towerY + 80, 56, 6, 0x222d38).setDepth(-4);
    // Maintenance ladder rungs
    for (let ly = towerY - 10; ly <= towerY + 120; ly += 14) {
      this.add.rectangle(towerX, ly, 14, 2, 0x3a4c60).setDepth(-3);
    }
    // Microwave transceiver drum
    this.add.circle(towerX - 18, towerY + 30, 12, 0x18212b).setStrokeStyle(2, 0x384a5e).setDepth(-3);
    this.add.rectangle(towerX, towerY - 20, 32, 48, 0x0f151c).setDepth(-3);

    this.signalLight = this.add.circle(towerX, towerY - 20, 10, 0xd94441).setDepth(-2);
    this.signalLight.setStrokeStyle(2, 0x221111);

    this.signalTween = this.tweens.add({
      targets: this.signalLight,
      alpha: 0.4,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // ==========================================
    // PLAYER & COLLIDERS
    // ==========================================
    this.player = new Player(this, 180, GROUND_TOP - 100);
    this.player.isHiding = false;

    this.physics.add.collider(this.player, ground);
    this.physics.add.collider(this.player, this.carHood);
    this.physics.add.collider(this.player, this.carRoof);
    this.physics.add.collider(this.player, this.carTrunk);
    this.physics.add.collider(this.player, this.fireEscape);
    this.physics.add.collider(this.player, this.streetGate.barrier);
    this.physics.add.collider(this.player, this.shelf);
    this.physics.add.collider(this.player, this.airlockDoor.barrier);
    this.physics.add.collider(this.player, this.alleyObstacle);
    this.physics.add.collider(this.player, this.trackGate.barrier);
    this.physics.add.collider(this.player, this.roomWalls);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // ==========================================
    // ATMOSPHERE SYSTEM (Rain, Mist, Parallax, Vignette)
    // ==========================================
    this.atmosphereSystem = new AtmosphereSystem(this);

    // ==========================================
    // SYSTEMS INITIALIZATION
    // ==========================================
    this.soundSystem = new SoundSystem(this);
    this.interactionSystem = new InteractionSystem(this, this.player);
    this.objectiveSystem = new ObjectiveSystem(this);
    this.dialogueSystem = new DialogueSystem(this, this.player);
    this.storySystem = new StorySystem(this, this.dialogueSystem, this.objectiveSystem);
    this.saveSystem = new SaveSystem();

    this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.completionEKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Save notification HUD indicator (top-right)
    this.saveIndicator = this.add
      .text(1256, 24, "● SAVED", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#d9a441",
        letterSpacing: 2,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(300)
      .setAlpha(0);

    this.chapterState = {
      get packageCollected() { return this._story.hasFlag(STORY_FLAGS.PACKAGE_FOUND); },
      get fuseCollected() { return this._story.hasFlag(STORY_FLAGS.FUSE_COLLECTED); },
      get fuseInstalled() { return this._fuseInstalled; },
      set fuseInstalled(v) { this._fuseInstalled = v; },
      get powerRestored() {
        return this._powerRestored || this._story.hasFlag(STORY_FLAGS.POWER_RESTORED);
      },
      set powerRestored(v) {
        this._powerRestored = Boolean(v);
      },
      _story: this.storySystem,
      _fuseInstalled: false,
      _powerRestored: false,
    };

    // ==========================================
    // REGISTER INTERACTABLES
    // ==========================================
    this.shelterPhoto = {
      x: 324,
      y: GROUND_TOP - 46,
      enabled: true,
      canInteract: () => this.shelterPhoto.enabled,
      interact: () => { this.dialogueSystem.start("C1_PHOTO_THOUGHT"); },
      getInteractionText: () => "Examine framed photo",
      getInteractionPosition: () => ({ x: 324, y: GROUND_TOP - 46 }),
      setEnabled: (v) => { this.shelterPhoto.enabled = v; },
      destroy: () => { this.events.emit("object:destroyed", this.shelterPhoto); },
    };
    this.interactionSystem.register(this.shelterRadio);
    this.interactionSystem.register(this.shelterPhoto);

    this.package = new Package(this, 600, GROUND_TOP - 9);
    this.interactionSystem.register(this.package);

    this.interactionSystem.register(this.newspaper);
    this.interactionSystem.register(this.gateWinchProp);
    this.interactionSystem.register(this.streetGate);
    this.interactionSystem.register(this.maintenanceNote);

    this.crate = new Crate(this, puzzleConfig.crate.x, puzzleConfig.crate.y, puzzleConfig.crate.width, puzzleConfig.crate.height);
    this.interactionSystem.register(this.crate);
    this.physics.add.collider(this.crate, ground);
    this.physics.add.collider(this.crate, this.roomWalls);
    this.physics.add.collider(this.player, this.crate, null, () => !this.crate.isGrabbed);

    this.fuse = new Fuse(this, puzzleConfig.fuse.x, puzzleConfig.fuse.y);
    this.interactionSystem.register(this.fuse);

    this.breakerSwitch = new Switch(this, puzzleConfig.switch.x, puzzleConfig.switch.y, puzzleConfig.switch.id);
    this.interactionSystem.register(this.breakerSwitch);

    this.door = new Door(this, puzzleConfig.door.x, puzzleConfig.door.y, puzzleConfig.door);
    this.interactionSystem.register(this.door);
    this.physics.add.collider(this.player, this.door.barrier);
    this.physics.add.collider(this.crate, this.door.barrier);

    this.interactionSystem.register(this.miraPhoto);
    this.interactionSystem.register(this.miraDrawing);
    this.interactionSystem.register(this.miraNotebook);
    this.interactionSystem.register(this.miraDeskDrawer);
    this.interactionSystem.register(this.airlockConsole);
    this.interactionSystem.register(this.airlockDoor);

    this.coverSpots.forEach((spot) => {
      this.interactionSystem.register(spot);
    });

    this.interactionSystem.register(this.chainDistraction);
    this.interactionSystem.register(this.alleyRadio);
    this.interactionSystem.register(this.relayBattery);
    this.interactionSystem.register(this.terminal);
    this.interactionSystem.register(this.trackGate);

    // Environmental lore & character introspection props
    this.shelterWorkbench = new InspectableProp(this, 120, GROUND_TOP - 26, {
      promptText: "Inspect workbench",
      dialogueKey: "C1_SHELTER_WORKBENCH",
    });
    this.interactionSystem.register(this.shelterWorkbench);

    this.shelterWindow = new InspectableProp(this, 420, GROUND_TOP - 60, {
      promptText: "Look through window",
      dialogueKey: "C1_SHELTER_WINDOW",
    });
    this.interactionSystem.register(this.shelterWindow);

    this.bicycleProp = new InspectableProp(this, 920, GROUND_TOP - 22, {
      promptText: "Examine rusted bicycle",
      dialogueKey: "C1_BICYCLE",
    });
    this.interactionSystem.register(this.bicycleProp);

    this.carProp = new InspectableProp(this, blockoutConfig.street.car.x, GROUND_TOP - 28, {
      promptText: "Search abandoned car",
      dialogueKey: "C1_CAR_INSPECT",
      range: 95,
    });
    this.interactionSystem.register(this.carProp);

    this.intercomProp = new InspectableProp(this, 1680, GROUND_TOP - 55, {
      promptText: "Read intercom roster",
      dialogueKey: "C1_INTERCOM",
    });
    this.interactionSystem.register(this.intercomProp);

    this.drainageProp = new InspectableProp(this, 2120, GROUND_TOP - 10, {
      promptText: "Inspect floor drain",
      dialogueKey: "C1_DRAINAGE_GRATE",
    });
    this.interactionSystem.register(this.drainageProp);

    this.miraWorkbenchProp = new InspectableProp(this, 3720, GROUND_TOP - 35, {
      promptText: "Examine radio workbench",
      dialogueKey: "C1_MIRA_WORKBENCH",
    });
    this.interactionSystem.register(this.miraWorkbenchProp);

    this.dumpsterProp = new InspectableProp(this, 4180, GROUND_TOP - 35, {
      promptText: "Examine damaged dumpster",
      dialogueKey: "C1_DUMPSTER_CLAW",
    });
    this.interactionSystem.register(this.dumpsterProp);

    this.terminalLogProp = new InspectableProp(this, 4920, GROUND_TOP - 35, {
      promptText: "Read terminal log",
      dialogueKey: "C1_TERMINAL_LOG",
    });
    this.interactionSystem.register(this.terminalLogProp);

    this.events.on("object:destroyed", (obj) => {
      this.interactionSystem.unregister(obj);
    });

    this.events.on("wanderer:detected", () => {
      this.handleWandererDetected();
    });

    // Unlocking track gate on terminal activation
    this.events.on("terminal:activated", () => {
      if (this.trackGate) {
        this.trackGate.unlock();
        this.trackGate.open();
      }
      this.storySystem.setFlag(STORY_FLAGS.TERMINAL_ACTIVATED);
      this.objectiveSystem.setObjective("C1_REACH_VIEWPOINT");
      this.saveGame();
    });

    // Auto-save listeners & lighting response on key story milestones
    const onSaveMilestone = () => this.saveGame();
    const onPowerRestored = () => this.activateInteriorLights(false);
    this.events.on("package:collected", onSaveMilestone);
    this.events.on("fuse:collected", onSaveMilestone);
    this.events.on("switch:fuse_installed", onSaveMilestone);
    this.events.on("power:restored", onPowerRestored);
    this.events.on("power:restored", onSaveMilestone);
    this.events.on("story:clue_found", onSaveMilestone);
    this.events.on("terminal:activated", onSaveMilestone);

    // Check for saved session or start fresh opening
    const existingSave = this.launchOptions?.newGame ? null : this.saveSystem.load();
    if (existingSave) {
      this.restoreSaveState(existingSave);
    } else {
      // Start Chapter 1 Opening with cinematic audio synchronization
      this.storySystem.startChapter1Opening();
    }

    // Setup Completion UI
    this.setupCompletionCard();

    // Scene teardown
    this.events.once("shutdown", () => {
      this.events.off("package:collected", onSaveMilestone);
      this.events.off("fuse:collected", onSaveMilestone);
      this.events.off("switch:fuse_installed", onSaveMilestone);
      this.events.off("power:restored", onPowerRestored);
      this.events.off("power:restored", onSaveMilestone);
      this.events.off("story:clue_found", onSaveMilestone);
      this.events.off("terminal:activated", onSaveMilestone);
      this.events.off("object:destroyed");
      this.events.off("wanderer:detected");
      if (this.signalTween) this.signalTween.stop();
      if (this.saveIndicator) this.tweens.killTweensOf(this.saveIndicator);
      if (this.soundSystem) this.soundSystem.destroy();
      this.atmosphereSystem.destroy();
      this.interactionSystem.destroy();
      this.dialogueSystem.destroy();
      this.objectiveSystem.destroy();
      this.storySystem.destroy();
    });
  }

  saveGame() {
    if (this.chapterCompleted) return;

    const storyData = this.storySystem ? this.storySystem.getStoryState() : { flags: [], clues: [], inventory: [] };
    const currentObjectiveId = this.objectiveSystem?.currentObjective?.id || null;

    this.saveSystem.save({
      chapter: 1,
      checkpoint: this.checkpoint,
      currentObjectiveId,
      story: storyData,
      world: {
        packageCollected: this.chapterState?.packageCollected ?? false,
        fuseCollected: this.chapterState?.fuseCollected ?? false,
        fuseInstalled: this.chapterState?.fuseInstalled ?? false,
        powerRestored: this.chapterState?.powerRestored ?? false,
        cratePosition: this.crate ? { x: Math.round(this.crate.x), y: Math.round(this.crate.y) } : null,
        gateOpen: this.storySystem.hasFlag(STORY_FLAGS.GATE_OPEN),
        alleyDoorOpen: this.storySystem.hasFlag(STORY_FLAGS.ALLEY_DOOR_OPEN),
        trackGateOpen: this.storySystem.hasFlag(STORY_FLAGS.TERMINAL_ACTIVATED),
        terminalActivated: this.terminal?.activated ?? false,
        miraDrawingDiscovered: this.miraDrawing?.discovered ?? false,
        miraPhotoDiscovered: this.miraPhoto?.discovered ?? false,
        miraNotebookDiscovered: this.miraNotebook?.discovered ?? false,
      },
    });

    this.showSaveNotification();
  }

  showSaveNotification() {
    if (!this.saveIndicator) return;
    this.tweens.killTweensOf(this.saveIndicator);
    this.saveIndicator.setAlpha(0);
    this.tweens.add({
      targets: this.saveIndicator,
      alpha: 1,
      duration: 250,
      yoyo: true,
      hold: 1100,
      ease: "Quad.easeInOut",
    });
  }

  restoreSaveState(save) {
    if (!save) return;

    // 1. Restore persistent story flags, clues, and inventory
    if (save.story) {
      this.storySystem.loadStoryState(save.story);
    }

    // 2. Restore safe checkpoint and player coordinates
    if (save.checkpoint) {
      this.checkpoint = { x: save.checkpoint.x, y: save.checkpoint.y };
      this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
    }

    // 3. Restore active objective
    if (save.currentObjectiveId) {
      this.objectiveSystem.setObjective(save.currentObjectiveId);
    }

    // 4. Restore world states
    if (save.world) {
      if (save.world.packageCollected && this.package) {
        this.package.destroy();
        this.package = null;
      }

      if (save.world.gateOpen && this.streetGate) {
        this.streetGate.unlock();
        this.streetGate.open(true);
      }

      if ((save.world.fuseCollected || save.world.fuseInstalled) && this.fuse) {
        this.fuse.destroy();
        this.fuse = null;
      }

      if (save.world.fuseInstalled && this.breakerSwitch) {
        this.chapterState.fuseInstalled = true;
        this.breakerSwitch.setRestoredState(true, false);
      }

      if (save.world.powerRestored && this.breakerSwitch && this.door) {
        this.chapterState.fuseInstalled = true;
        this.chapterState.powerRestored = true;
        this.breakerSwitch.setRestoredState(true, true);
        this.door.unlock();
        this.door.open(true);
        this.activateInteriorLights(true);
      }

      if (save.world.alleyDoorOpen && this.airlockDoor) {
        this.airlockDoor.unlock();
        this.airlockDoor.open(true);
      }

      if (save.world.cratePosition && this.crate) {
        this.crate.setPosition(save.world.cratePosition.x, save.world.cratePosition.y);
      }

      if (save.world.terminalActivated && this.terminal) {
        this.terminal.setRestoredState(true);
      }

      if (save.world.trackGateOpen && this.trackGate) {
        this.trackGate.unlock();
        this.trackGate.open(true);
      }

      if (save.world.miraDrawingDiscovered && this.miraDrawing) {
        this.miraDrawing.discovered = true;
        this.miraDrawing.sparkle.setVisible(true);
      }
      if (save.world.miraPhotoDiscovered && this.miraPhoto) {
        this.miraPhoto.discovered = true;
        this.miraPhoto.sparkle.setVisible(true);
      }
      if (save.world.miraNotebookDiscovered && this.miraNotebook) {
        this.miraNotebook.discovered = true;
        this.miraNotebook.sparkle.setVisible(true);
      }
    }

    if (this.player.x > blockoutConfig.alley.sightingX) {
      this.wandererSightingTriggered = true;
    }

    this.showSaveNotification();
  }

  handleWandererDetected() {
    if (this.isResetting) return;
    this.isResetting = true;

    this.player.setInputEnabled(false);
    this.player.body.setVelocity(0, 0);

    this.cameras.main.fadeOut(350, 8, 12, 18);

    this.time.delayedCall(400, () => {
      this.coverSpots.forEach((spot) => {
        if (spot.occupant === this.player) {
          spot.exitCover(this.player);
        }
      });

      this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
      this.player.body.setVelocity(0, 0);

      this.wanderer.resetPatrol();

      this.cameras.main.fadeIn(400);

      this.time.delayedCall(400, () => {
        this.player.setInputEnabled(true);
        this.isResetting = false;
      });
    });
  }

  setupCompletionCard() {
    this.completionContainer = this.add.container(640, 360).setScrollFactor(0).setDepth(500).setVisible(false);

    const overlay = this.add.rectangle(0, 0, 1280, 720, 0x070b10, 0.95);
    const box = this.add.rectangle(0, 0, 720, 320, 0x0f151e);
    box.setStrokeStyle(2, 0xd9a441);

    const label = this.add
      .text(0, -100, "NIGHTFALL: THE LAST DELIVERY", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#d9a441",
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    const title = this.add
      .text(0, -50, "CHAPTER 1 COMPLETE", {
        fontFamily: "monospace",
        fontSize: "28px",
        fontStyle: "bold",
        color: "#f8fafc",
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(0, -10, "THE SILENT CROSSING", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#7dd3fc",
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.clueStatusText = this.add
      .text(0, 45, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#94a3b8",
        align: "center",
      })
      .setOrigin(0.5);

    // Primary Interactive Button: Proceed to Chapter 2
    this.btnProceedToC2 = this.add.rectangle(0, 85, 380, 44, 0x162c3d).setStrokeStyle(2, 0x38bdf8);
    this.btnProceedText = this.add
      .text(0, 85, "▶ PROCEED TO CHAPTER 2 [E]", {
        fontFamily: "monospace",
        fontSize: "13px",
        fontStyle: "bold",
        color: "#38bdf8",
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.btnProceedToC2.setInteractive({ useHandCursor: true });
    this.btnProceedToC2.on("pointerover", () => {
      this.btnProceedToC2.setFillStyle(0x22435d);
      this.btnProceedText.setColor("#f8fafc");
    });
    this.btnProceedToC2.on("pointerout", () => {
      this.btnProceedToC2.setFillStyle(0x162c3d);
      this.btnProceedText.setColor("#38bdf8");
    });
    this.btnProceedToC2.on("pointerdown", () => {
      this.goToChapter2();
    });

    this.btnProceedText.setInteractive({ useHandCursor: true });
    this.btnProceedText.on("pointerover", () => {
      this.btnProceedToC2.setFillStyle(0x22435d);
      this.btnProceedText.setColor("#f8fafc");
    });
    this.btnProceedText.on("pointerout", () => {
      this.btnProceedToC2.setFillStyle(0x162c3d);
      this.btnProceedText.setColor("#38bdf8");
    });
    this.btnProceedText.on("pointerdown", () => {
      this.goToChapter2();
    });

    const restartPrompt = this.add
      .text(0, 135, "[M] Main Menu   |   [R] Replay Chapter 1", {
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
      this.btnProceedToC2,
      this.btnProceedText,
      restartPrompt,
    ]);
  }

  goToChapter2() {
    if (this.isTransitioningToC2) return;
    this.isTransitioningToC2 = true;

    // Persist progression to Chapter 2 so Continue button directly opens Chapter 2
    const storyData = this.storySystem ? this.storySystem.getStoryState() : { flags: [], clues: [], inventory: [] };
    this.saveSystem.save({
      chapter: 2,
      checkpoint: { x: 180, y: 810 },
      story: storyData,
      world: {},
    });

    this.cameras.main.fadeOut(400, 8, 13, 20);
    this.time.delayedCall(420, () => {
      this.scene.start("Chapter2Scene", { fromChapter1: true, newGame: false });
    });
  }

  triggerViewpointEnding() {
    if (this.viewpointTriggered) return;
    this.viewpointTriggered = true;

    this.player.setInputEnabled(false);
    this.player.body.setVelocityX(0);

    // Cinematic pan per GDD: stop follow and reveal railway skyline
    this.cameras.main.stopFollow();
    this.cameras.main.pan(5580, 700, 1800, "Sine.easeInOut");

    this.dialogueSystem.start("C1_VIEWPOINT_ENDING", () => {
      if (this.signalTween) this.signalTween.stop();
      this.signalLight.setFillStyle(0xd9a441);
      this.signalLight.setAlpha(1);

      if (this.atmosphereSystem) {
        this.atmosphereSystem.setSignalBeamColor(0xd9a441);
      }

      this.soundSystem?.playSignalChime();
      this.time.delayedCall(400, () => {
        this.soundSystem?.playMiraMotif();
      });

      this.tweens.add({
        targets: this.signalLight,
        scaleX: 2.2,
        scaleY: 2.2,
        duration: 350,
        yoyo: true,
        repeat: 2,
      });

      this.storySystem.setFlag(STORY_FLAGS.C1_COMPLETE);
      this.objectiveSystem.complete();
      this.saveGame();

      this.time.delayedCall(1200, () => {
        this.cameras.main.fadeOut(1000);
        this.time.delayedCall(1100, () => {
          this.showChapterCompleteScreen();
        });
      });
    });
  }

  showChapterCompleteScreen() {
    this.chapterCompleted = true;
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(600);
    const hasDrawingClue = this.storySystem.hasFlag(STORY_FLAGS.MIRA_CLUE_FOUND);

    this.clueStatusText.setText(
      hasDrawingClue
        ? "★ Hidden Ending Clue Preserved:\nMira's Drawing (\"When the lights come back...\")"
        : "○ Chapter completed without finding Mira's drawing clue."
    );

    this.completionContainer.setVisible(true);
    this.completionContainer.setAlpha(0);

    this.tweens.add({
      targets: this.completionContainer,
      alpha: 1,
      duration: 600,
      ease: "Quad.easeOut",
    });

    // Dedicated keydown handler guaranteeing transition on E, Space, or Enter
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
        this.goToChapter2();
      } else if (event.code === "KeyM" || event.key === "m" || event.key === "M") {
        this.input.keyboard.off("keydown", onCompletionKey);
        this.scene.start("MenuScene");
      } else if (event.code === "KeyR" || event.key === "r" || event.key === "R") {
        this.input.keyboard.off("keydown", onCompletionKey);
        this.scene.restart({ newGame: true });
      }
    };
    this.input.keyboard.on("keydown", onCompletionKey);
  }

  update(time, delta) {
    this.player.update(time, delta);
    this.interactionSystem.update();
    this.dialogueSystem.update();

    // Atmosphere update (Rain, fog, attenuation)
    if (this.atmosphereSystem) {
      this.atmosphereSystem.update(this.player);
      if (this.soundSystem) {
        const px = this.player.x;
        const isIndoors = this.atmosphereSystem.indoorZones.some((z) => px >= z.start && px <= z.end);
        this.soundSystem.setIndoorState(isIndoors);
      }
    }

    // Dynamic Camera Framing per Area
    if (!this.viewpointTriggered) {
      const px = this.player.x;
      if (px >= 3200 && px < 3840) {
        // Mira's Room: Slower framing to give clues room to register
        this.cameras.main.setLerp(0.04, 0.04);
      } else {
        this.cameras.main.setLerp(0.08, 0.08);
      }
    }

    // Update Wanderer stealth and detection
    if (this.wanderer && !this.isResetting) {
      this.wanderer.updateStealth(this.player, delta);
    }

    // Check for Alley entry & checkpoint
    if (this.player.x >= 3860 && this.checkpoint.x < 3000) {
      this.checkpoint = {
        x: blockoutConfig.alley.checkpoint.x,
        y: blockoutConfig.alley.checkpoint.y,
      };
      this.saveGame();
    }

    // Check for Wanderer initial sighting beat
    if (!this.wandererSightingTriggered && this.player.x >= blockoutConfig.alley.sightingX) {
      this.wandererSightingTriggered = true;
      this.storySystem.setFlag(STORY_FLAGS.WANDERER_ALERT);
      this.dialogueSystem.start("C1_WANDERER_GLIMPSE");
    }

    // Check for railway viewpoint trigger in Area 8
    if (!this.viewpointTriggered && this.player.x >= blockoutConfig.viewpoint.triggerX) {
      if (this.storySystem.hasFlag(STORY_FLAGS.TERMINAL_ACTIVATED)) {
        this.triggerViewpointEnding();
      } else if (!this.viewpointDarkPromptShown) {
        this.viewpointDarkPromptShown = true;
        this.dialogueSystem.start("C1_VIEWPOINT_DARK", () => {
          this.objectiveSystem.setObjective("C1_INVESTIGATE_TERMINAL");
        });
      }
    }

    // Completion screen navigation ([E] Chapter 2, [M] Menu, [R] Replay Ch 1)
    if (this.chapterCompleted) {
      if (this.mKey && Phaser.Input.Keyboard.JustDown(this.mKey)) {
        this.scene.start("MenuScene");
        return;
      }

      if (this.rKey && Phaser.Input.Keyboard.JustDown(this.rKey)) {
        this.scene.restart({ newGame: true });
        return;
      }

      if (this.completionEKey && Phaser.Input.Keyboard.JustDown(this.completionEKey)) {
        this.goToChapter2();
        return;
      }
    }
  }

  /**
   * Build an enterable room doorway with an upper solid wall header and pass-through archway.
   */
  createDoorway(x, wallTopY, label, width = 48, portalColor = 0x0b1016) {
    const doorHeight = 130;
    const doorTopY = GROUND_TOP - doorHeight;
    const bulkheadH = Math.max(20, doorTopY - wallTopY);
    const bulkheadY = wallTopY + bulkheadH / 2;

    const bulkhead = this.add.rectangle(x, bulkheadY, width + 14, bulkheadH, 0x151e28).setDepth(-2);
    bulkhead.setStrokeStyle(1, 0x263547);

    // Hazard top trim on industrial bulkheads
    this.add.rectangle(x, doorTopY - 2, width + 10, 3, 0xd9a441).setDepth(-2);

    // Open portal depth & background
    const portal = this.add.rectangle(x, GROUND_TOP - doorHeight / 2, width, doorHeight, portalColor, 0.95).setDepth(-3);
    portal.setStrokeStyle(1, 0x2b3a4a);

    // Steel side jambs and header architrave
    this.add.rectangle(x - width / 2 - 2, GROUND_TOP - doorHeight / 2, 6, doorHeight, 0x243140).setDepth(-2);
    this.add.rectangle(x + width / 2 + 2, GROUND_TOP - doorHeight / 2, 6, doorHeight, 0x243140).setDepth(-2);
    // Partially visible ajar door leaf
    this.add.rectangle(x - width / 2 + 7, GROUND_TOP - doorHeight / 2 + 2, 10, doorHeight - 6, 0x1a232e)
      .setStrokeStyle(1, 0x334455)
      .setDepth(-2);
    // Industrial threshold sill
    this.add.rectangle(x, GROUND_TOP - 2, width + 8, 4, 0x334455).setDepth(-2);

    // Stencil directional signage plate overhead
    const signPlate = this.add.rectangle(x, doorTopY - 14, width + 4, 14, 0x111720).setStrokeStyle(1, 0x334455).setDepth(-1);
    this.add
      .text(x, doorTopY - 14, label, {
        fontFamily: "monospace",
        fontSize: "8px",
        fontStyle: "bold",
        color: "#7e97b0",
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setDepth(-1);
  }

  /**
   * Create a dead broken ceiling light fixture (no electricity / broken in blackout).
   */
  createDeadCeilingLight(x, ceilingBottomY) {
    const dropLen = 22;
    const bulbY = ceilingBottomY + dropLen;
    this.add.rectangle(x, ceilingBottomY + dropLen / 2, 2, dropLen, 0x243140).setDepth(-2);
    this.add.rectangle(x, bulbY - 4, 12, 4, 0x2e3c4e).setDepth(-2);
    this.add.circle(x, bulbY, 3, 0x141b24).setStrokeStyle(1, 0x273646).setDepth(-2);
  }

  /**
   * Create a ceiling bulb fixture and normalized light cone aligned directly to the bulb center.
   */
  createRoomCeilingLight(x, ceilingBottomY, options = {}) {
    const color = options.color ?? 0xf5d487;
    const coneWidth = options.coneWidth ?? 200;
    const lit = Boolean(options.lit);
    const dropLen = 22;
    const bulbY = ceilingBottomY + dropLen;
    const coneHeight = GROUND_TOP - bulbY;

    this.add.rectangle(x, ceilingBottomY + dropLen / 2, 2, dropLen, 0x2e3b4a).setDepth(-2);
    this.add.rectangle(x, bulbY - 4, 12, 4, 0x3d4f63).setDepth(-2);

    const hasGlow = this.textures.exists("fx_radial_glow");
    const hasCone = this.textures.exists("fx_light_cone");
    const hasGlint = this.textures.exists("fx_puddle_glint");

    const haloAlpha = hasGlow ? 0.24 : 0.14;
    const coneAlpha = hasCone ? 0.18 : 0.06;
    const poolAlpha = hasGlint ? 0.22 : 0.08;

    const halo = hasGlow
      ? this.add
          .image(x, bulbY, "fx_radial_glow")
          .setDisplaySize(54, 54)
          .setTint(color)
          .setAlpha(lit ? haloAlpha : 0)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(-2)
      : this.add.circle(x, bulbY, 13, color, lit ? haloAlpha : 0).setDepth(-2);

    const bulb = this.add.circle(x, bulbY, 4, lit ? color : 0x522528).setDepth(-2);

    const cone = hasCone
      ? this.add
          .image(x, bulbY, "fx_light_cone")
          .setOrigin(0.5, 0)
          .setDisplaySize(coneWidth, coneHeight)
          .setTint(color)
          .setAlpha(lit ? coneAlpha : 0)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(-2)
      : this.add
          .polygon(
            x,
            bulbY,
            [
              { x: coneWidth / 2, y: 0 },
              { x: 0, y: coneHeight },
              { x: coneWidth, y: coneHeight },
            ],
            color,
            lit ? coneAlpha : 0
          )
          .setOrigin(0.5, 0)
          .setDepth(-2);

    const pool = hasGlint
      ? this.add
          .image(x, GROUND_TOP + 4, "fx_puddle_glint")
          .setDisplaySize(coneWidth * 0.85, 10)
          .setTint(color)
          .setAlpha(lit ? poolAlpha : 0)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(-2)
      : this.add.ellipse(x, GROUND_TOP, coneWidth * 0.9, 10, color, lit ? poolAlpha : 0).setDepth(-2);

    return { bulb, halo, cone, pool, haloAlpha, coneAlpha, poolAlpha, color };
  }

  /**
   * Energize Apartment 04 & Mira's Room lights once the main breaker restores power.
   */
  activateInteriorLights(instant = false) {
    this.atmosphereSystem?.liftInteriorDarkness(instant);
    this.interiorWalls.forEach((wall) => {
      wall.setFillStyle(0x16202b);
    });

    this.interiorLights.forEach((light, idx) => {
      if (light.bulb) light.bulb.setFillStyle(light.color);
      const targetHalo = light.haloAlpha ?? 0.14;
      const targetCone = light.coneAlpha ?? 0.06;
      const targetPool = light.poolAlpha ?? 0.08;

      if (instant) {
        if (light.halo) light.halo.setAlpha(targetHalo);
        if (light.cone) light.cone.setAlpha(targetCone);
        if (light.pool) light.pool.setAlpha(targetPool);
        return;
      }

      const delay = idx * 140;
      if (light.halo) this.tweens.add({ targets: light.halo, alpha: targetHalo, duration: 280, delay });
      if (light.cone) this.tweens.add({ targets: light.cone, alpha: targetCone, duration: 320, delay });
      if (light.pool) this.tweens.add({ targets: light.pool, alpha: targetPool, duration: 320, delay });
    });
  }
}
