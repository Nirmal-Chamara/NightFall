import Phaser from "phaser";
import { VIEW_WIDTH, VIEW_HEIGHT } from "../constants.js";

/**
 * PreloadScene generates crisp procedural pixel/lighting textures and
 * provides a brief loading transition into MenuScene.
 */
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    const cx = VIEW_WIDTH / 2;
    const cy = VIEW_HEIGHT / 2;

    this.cameras.main.setBackgroundColor("#0c1118");

    this.add
      .text(cx, cy - 36, "INITIALIZING FREQUENCY...", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#6b8096",
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    const barWidth = 320;
    const barBg = this.add.rectangle(cx, cy, barWidth, 8, 0x161e29);
    barBg.setStrokeStyle(1, 0x2c3b4d);

    this.progressBar = this.add
      .rectangle(cx - barWidth / 2 + 2, cy, 4, 4, 0xd9a441)
      .setOrigin(0, 0.5);

    this.load.spritesheet("courier", "assets/images/courier_sheet.png", {
      frameWidth: 88,
      frameHeight: 96,
    });
    this.load.spritesheet("wanderer", "assets/images/wanderer_sheet.png", {
      frameWidth: 88,
      frameHeight: 104,
    });
    this.load.image("prop_car", "assets/images/prop_car.png");
    this.load.image("prop_crate", "assets/images/prop_crate.png");
    this.load.image("prop_terminal", "assets/images/prop_terminal.png");
    this.load.image("prop_desk", "assets/images/prop_desk.png");
    this.load.image("prop_breaker", "assets/images/prop_breaker.png");
    this.load.image("prop_door", "assets/images/prop_door.png");
    this.load.image("prop_package", "assets/images/prop_package.png");
    this.load.image("prop_fuse", "assets/images/prop_fuse.png");
    this.load.image("prop_dumpster", "assets/images/prop_dumpster.png");
    this.load.image("prop_shelf", "assets/images/prop_shelf.png");

    this.load.on("progress", (value) => {
      const targetW = Math.max(4, Math.floor((barWidth - 4) * value));
      this.progressBar.setSize(targetW, 4);
    });
  }

  create() {
    this.createProceduralTextures();
    this.configurePixelTextures();
    this.createAnimations();

    const barWidth = 316;
    this.tweens.add({
      targets: this.progressBar,
      displayWidth: barWidth,
      duration: 240,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.scene.start("MenuScene");
      },
    });
  }

  configurePixelTextures() {
    [
      "courier",
      "wanderer",
      "prop_car",
      "prop_crate",
      "prop_terminal",
      "prop_desk",
      "prop_breaker",
      "prop_door",
      "prop_package",
      "prop_fuse",
      "prop_dumpster",
      "prop_shelf",
    ].forEach((key) => {
      if (this.textures.exists(key)) {
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    });
  }

  createAnimations() {
    if (this.textures.exists("courier") && !this.anims.exists("courier_walk")) {
      this.anims.create({
        key: "courier_idle",
        frames: [{ key: "courier", frame: 0 }],
        frameRate: 1,
      });
      this.anims.create({
        key: "courier_walk",
        frames: this.anims.generateFrameNumbers("courier", { start: 1, end: 5 }),
        frameRate: 9,
        repeat: -1,
      });
      this.anims.create({
        key: "courier_jump",
        frames: [{ key: "courier", frame: 6 }],
        frameRate: 1,
      });
      this.anims.create({
        key: "courier_fall",
        frames: [{ key: "courier", frame: 7 }],
        frameRate: 1,
      });
      this.anims.create({
        key: "courier_push",
        frames: [{ key: "courier", frame: 8 }],
        frameRate: 1,
      });
    }

    if (this.textures.exists("wanderer") && !this.anims.exists("wanderer_walk")) {
      this.anims.create({
        key: "wanderer_idle",
        frames: [{ key: "wanderer", frame: 0 }],
        frameRate: 1,
      });
      this.anims.create({
        key: "wanderer_walk",
        frames: [
          { key: "wanderer", frame: 1 },
          { key: "wanderer", frame: 2 },
          { key: "wanderer", frame: 3 },
          { key: "wanderer", frame: 2 },
        ],
        frameRate: 5,
        repeat: -1,
      });
      this.anims.create({
        key: "wanderer_alert",
        frames: [{ key: "wanderer", frame: 4 }],
        frameRate: 1,
      });
    }
  }

  createProceduralTextures() {
    this.buildRadialGlowTexture("fx_radial_glow", 128);
    this.buildLightConeTexture("fx_light_cone", 160, 180);
    this.buildPuddleGlintTexture("fx_puddle_glint", 96, 16);
    this.buildAsphaltTileTexture("tex_asphalt_tile", 64);
    this.buildBrickTileTexture("tex_brick_tile", 64);
    this.buildConcreteBunkerTexture("tex_concrete_bunker", 64);
    this.buildTenementHallwayTexture("tex_tenement_hallway", 64, 96);
    this.buildMiraRoomTexture("tex_mira_room", 64);
    this.buildCorrugatedMetalTexture("tex_corrugated_metal", 64);
    this.buildRelayServerTexture("tex_relay_server", 64);
    this.buildRailBallastTexture("tex_rail_ballast", 64, 32);
    this.buildHazardStripesTexture("tex_hazard_stripes", 32);
    this.buildDrainageCulvertTexture("tex_drainage_culvert", 64);
    this.buildSluiceGateTexture("tex_sluice_gate", 64);
    this.buildSubterraneanWaterTexture("tex_subterranean_water", 64, 32);
    this.buildDieselPumpTexture("tex_diesel_pump", 64);
    this.buildSubwayTilesTexture("tex_subway_tiles", 64);
    this.buildRustedGratingTexture("tex_rusted_grating", 32);
  }

  buildRadialGlowTexture(key, size) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, size, size);
    const ctx = tex.getContext();
    const half = size / 2;
    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0, "rgba(255,255,255,1.0)");
    grad.addColorStop(0.25, "rgba(255,255,255,0.55)");
    grad.addColorStop(0.6, "rgba(255,255,255,0.16)");
    grad.addColorStop(1, "rgba(255,255,255,0.0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
  }

  buildLightConeTexture(key, width, height) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, width, height);
    const ctx = tex.getContext();
    const cx = width / 2;
    const img = ctx.createImageData(width, height);
    const data = img.data;

    for (let y = 0; y < height; y++) {
      const vFrac = y / height;
      const halfSpan = 3 + vFrac * (width * 0.48);
      const verticalFade = Math.pow(1 - vFrac * 0.85, 1.35);

      for (let x = 0; x < width; x++) {
        const dx = Math.abs(x - cx);
        if (dx > halfSpan) continue;
        const edgeFade = Math.pow(1 - dx / halfSpan, 1.5);
        // Subtle pixel-scanline texture for cinematic pixel atmosphere
        const scan = y % 2 === 0 ? 1.0 : 0.88;
        const alpha = Math.max(0, Math.min(255, Math.floor(verticalFade * edgeFade * scan * 255)));
        const idx = (y * width + x) * 4;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = alpha;
      }
    }

    ctx.putImageData(img, 0, 0);
    tex.refresh();
  }

  buildPuddleGlintTexture(key, width, height) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, width, height);
    const ctx = tex.getContext();

    for (let row = 0; row < height; row += 2) {
      const t = row / height;
      const span = Math.floor(width * (1 - t * 0.65));
      const startX = Math.floor((width - span) / 2);
      const alpha = (1 - t) * 0.72;
      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
      for (let x = startX; x < startX + span; x += 2) {
        if ((x + row) % 4 !== 0) {
          ctx.fillRect(x, row, 2, 1);
        }
      }
    }

    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    tex.refresh();
  }

  buildAsphaltTileTexture(key, size) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, size, size);
    const ctx = tex.getContext();

    ctx.fillStyle = "#19222d";
    ctx.fillRect(0, 0, size, size);

    // Top curb edge highlight
    ctx.fillStyle = "#2d3c4e";
    ctx.fillRect(0, 0, size, 2);
    ctx.fillStyle = "#222e3c";
    ctx.fillRect(0, 2, size, 2);

    // Pixel asphalt grain & wet specular spots
    for (let y = 4; y < size; y += 2) {
      for (let x = 0; x < size; x += 2) {
        const hash = ((x * 73856093) ^ (y * 19349663)) >>> 0;
        if (hash % 17 === 0) {
          ctx.fillStyle = "#2a3848";
          ctx.fillRect(x, y, 2, 1);
        } else if (hash % 11 === 0) {
          ctx.fillStyle = "#121922";
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }

    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    tex.refresh();
  }

  buildBrickTileTexture(key, size) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, size, size);
    const ctx = tex.getContext();

    ctx.fillStyle = "#121822";
    ctx.fillRect(0, 0, size, size);

    const brickH = 8;
    const brickW = 16;
    for (let row = 0; row < size / brickH; row++) {
      const y = row * brickH;
      const offset = (row % 2) * (brickW / 2);
      ctx.fillStyle = "#0e131b";
      ctx.fillRect(0, y, size, 1);

      for (let x = -brickW + offset; x < size; x += brickW) {
        const shade = ((row * 31 + x * 17) & 3) === 0 ? "#18212e" : "#141b26";
        ctx.fillStyle = shade;
        ctx.fillRect(x + 1, y + 1, brickW - 2, brickH - 1);
      }
    }

    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    tex.refresh();
  }

  buildConcreteBunkerTexture(key, size) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, size, size);
    const ctx = tex.getContext();

    ctx.fillStyle = "#141b24";
    ctx.fillRect(0, 0, size, size);

    // Formwork seam lines
    ctx.fillStyle = "#0c1016";
    ctx.fillRect(0, 0, size, 1);
    ctx.fillRect(0, size / 2, size, 1);
    ctx.fillStyle = "#1e2733";
    ctx.fillRect(0, 1, size, 1);
    ctx.fillRect(0, size / 2 + 1, size, 1);

    // Formwork tie-rod indents with washer rings
    const tiePoints = [
      [16, 16],
      [48, 16],
      [16, 48],
      [48, 48],
    ];
    tiePoints.forEach(([tx, ty]) => {
      ctx.fillStyle = "#0a0d12";
      ctx.fillRect(tx - 2, ty - 2, 4, 4);
      ctx.fillStyle = "#1e2733";
      ctx.fillRect(tx - 1, ty - 1, 2, 2);
      ctx.fillStyle = "#080b0f";
      ctx.fillRect(tx, ty, 1, 1);
    });

    // Concrete aggregate grain & mineral drip streaks
    for (let y = 2; y < size; y += 2) {
      for (let x = 0; x < size; x += 2) {
        const hash = ((x * 48271) ^ (y * 31337)) >>> 0;
        if (hash % 19 === 0) {
          ctx.fillStyle = "#1c2532";
          ctx.fillRect(x, y, 2, 1);
        } else if (hash % 13 === 0) {
          ctx.fillStyle = "#0d1219";
          ctx.fillRect(x, y, 1, 2);
        }
      }
    }

    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    tex.refresh();
  }

  buildTenementHallwayTexture(key, width, height) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, width, height);
    const ctx = tex.getContext();

    // 1. Top half: aged muted teal/grey plaster
    ctx.fillStyle = "#162128";
    ctx.fillRect(0, 0, width, 48);

    for (let y = 0; y < 48; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const hash = ((x * 65537) ^ (y * 224737)) >>> 0;
        if (hash % 17 === 0) {
          ctx.fillStyle = "#1b2830";
          ctx.fillRect(x, y, 2, 1);
        } else if (hash % 23 === 0) {
          ctx.fillStyle = "#10191f";
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }

    // 2. Middle: decorative wooden dado rail moulding (y = 48 to 54)
    ctx.fillStyle = "#3d2b1f"; // top bevel highlight
    ctx.fillRect(0, 48, width, 1);
    ctx.fillStyle = "#2c1e15"; // main rail body
    ctx.fillRect(0, 49, width, 4);
    ctx.fillStyle = "#150d08"; // bottom drop shadow
    ctx.fillRect(0, 53, width, 1);

    // 3. Bottom half: vertical wooden tongue-and-groove wainscoting slats (y = 54 to 96)
    ctx.fillStyle = "#18120d";
    ctx.fillRect(0, 54, width, height - 54);

    const slatW = 8;
    for (let x = 0; x < width; x += slatW) {
      // Slat groove shadow
      ctx.fillStyle = "#0d0906";
      ctx.fillRect(x, 54, 1, height - 54);
      // Slat bevel highlight
      ctx.fillStyle = "#261c14";
      ctx.fillRect(x + 1, 54, 1, height - 54);
      // Subtle vertical wood grain
      for (let gy = 56; gy < height - 6; gy += 4) {
        if (((x * 13 + gy * 7) % 5) === 0) {
          ctx.fillStyle = "#201710";
          ctx.fillRect(x + 3, gy, 2, 2);
        }
      }
    }

    // Skirting baseboard at bottom
    ctx.fillStyle = "#241911";
    ctx.fillRect(0, height - 4, width, 1);
    ctx.fillStyle = "#120c08";
    ctx.fillRect(0, height - 3, width, 3);

    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    tex.refresh();
  }

  buildMiraRoomTexture(key, size) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, size, size);
    const ctx = tex.getContext();

    // Warm acoustic wood paneling
    ctx.fillStyle = "#1c1815";
    ctx.fillRect(0, 0, size, size);

    // Horizontal plank seams
    const plankH = 16;
    for (let y = 0; y < size; y += plankH) {
      ctx.fillStyle = "#100d0b";
      ctx.fillRect(0, y, size, 1);
      ctx.fillStyle = "#26211c";
      ctx.fillRect(0, y + 1, size, 1);

      // Fine wood grain lines
      for (let x = 0; x < size; x += 4) {
        const hash = ((x * 8831) ^ (y * 4421)) >>> 0;
        if (hash % 3 === 0) {
          ctx.fillStyle = "#221d18";
          ctx.fillRect(x, y + 4 + (hash % 8), 3, 1);
        }
      }
    }

    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    tex.refresh();
  }

  buildCorrugatedMetalTexture(key, size) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, size, size);
    const ctx = tex.getContext();

    ctx.fillStyle = "#1a222c";
    ctx.fillRect(0, 0, size, size);

    // Vertical corrugated ridges (8px wavelength)
    const waveW = 8;
    for (let x = 0; x < size; x += waveW) {
      // Dark trough
      ctx.fillStyle = "#10151c";
      ctx.fillRect(x, 0, 2, size);
      // Mid-slope
      ctx.fillStyle = "#1e2834";
      ctx.fillRect(x + 2, 0, 2, size);
      // Crest highlight
      ctx.fillStyle = "#293646";
      ctx.fillRect(x + 4, 0, 2, size);
      // Down-slope
      ctx.fillStyle = "#1c2530";
      ctx.fillRect(x + 6, 0, 2, size);
    }

    // Horizontal rivet seams
    [0, size / 2].forEach((sy) => {
      ctx.fillStyle = "#12171e";
      ctx.fillRect(0, sy, size, 2);
      for (let rx = 4; rx < size; rx += 8) {
        ctx.fillStyle = "#3a4c62";
        ctx.fillRect(rx, sy, 2, 2);
      }
    });

    // Weathered rust stains
    for (let y = 6; y < size; y += 4) {
      for (let x = 0; x < size; x += 4) {
        const hash = ((x * 2971) ^ (y * 65537)) >>> 0;
        if (hash % 29 === 0) {
          ctx.fillStyle = "#3e271a";
          ctx.fillRect(x, y, 3, 2);
        }
      }
    }

    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    tex.refresh();
  }

  buildRelayServerTexture(key, size) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, size, size);
    const ctx = tex.getContext();

    // Brushed steel server chassis
    ctx.fillStyle = "#111721";
    ctx.fillRect(0, 0, size, size);

    // Modular server unit racks (16px high per bay)
    const bayH = 16;
    for (let y = 0; y < size; y += bayH) {
      // Rack frame border
      ctx.fillStyle = "#090d13";
      ctx.fillRect(0, y, size, 1);
      ctx.fillStyle = "#1f2a3a";
      ctx.fillRect(0, y + 1, size, 1);

      // Horizontal cooling louvers
      for (let ly = y + 4; ly <= y + 12; ly += 2) {
        ctx.fillStyle = "#0c1118";
        ctx.fillRect(8, ly, size - 24, 1);
      }

      // Small status diodes on left panel
      const diodeColor = (y / bayH) % 2 === 0 ? "#22c55e" : "#38bdf8";
      ctx.fillStyle = diodeColor;
      ctx.fillRect(size - 10, y + 5, 2, 2);
      ctx.fillStyle = "#d9a441";
      ctx.fillRect(size - 6, y + 5, 2, 2);
    }

    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    tex.refresh();
  }

  buildRailBallastTexture(key, width, height) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, width, height);
    const ctx = tex.getContext();

    // Dark crushed gravel foundation
    ctx.fillStyle = "#0f141a";
    ctx.fillRect(0, 0, width, height);

    // Random angular stone pebbles
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const hash = ((x * 7919) ^ (y * 65539)) >>> 0;
        const col = hash % 5;
        if (col === 0) ctx.fillStyle = "#1b232e";
        else if (col === 1) ctx.fillStyle = "#253140";
        else if (col === 2) ctx.fillStyle = "#141a22";
        else if (col === 3) ctx.fillStyle = "#0a0e13";
        else ctx.fillStyle = "#2e3c4e";
        ctx.fillRect(x, y, 2, 2);
      }
    }

    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    tex.refresh();
  }

  buildHazardStripesTexture(key, size) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, size, size);
    const ctx = tex.getContext();

    ctx.fillStyle = "#141a22";
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = "#d9a441";
    const stripeW = 8;
    for (let offset = -size; offset < size * 2; offset += stripeW * 2) {
      ctx.beginPath();
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset + stripeW, 0);
      ctx.lineTo(offset + stripeW + size, size);
      ctx.lineTo(offset + size, size);
      ctx.closePath();
      ctx.fill();
    }

    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    tex.refresh();
  }

  buildDrainageCulvertTexture(key, size) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, size, size);
    const ctx = tex.getContext();

    // Dark damp concrete base
    ctx.fillStyle = "#121922";
    ctx.fillRect(0, 0, size, size);

    // Subtle horizontal expansion joint
    ctx.fillStyle = "#090d12";
    ctx.fillRect(0, size / 2, size, 2);
    ctx.fillStyle = "#1e2a38";
    ctx.fillRect(0, size / 2 + 2, size, 1);

    // Vertical weeping water stains & efflorescence
    [10, 26, 42, 54].forEach((wx, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? "#0d141c" : "#17232f";
      ctx.fillRect(wx, 0, 3, size);
      // Algae / mineral deposits along trickle
      ctx.fillStyle = "#142526";
      ctx.fillRect(wx + 1, 8, 2, size - 16);
    });

    // Concrete pitting and grain
    for (let y = 0; y < size; y += 3) {
      for (let x = 0; x < size; x += 3) {
        const hash = ((x * 4153) ^ (y * 7919)) >>> 0;
        if (hash % 17 === 0) {
          ctx.fillStyle = "#1c2633";
          ctx.fillRect(x, y, 2, 2);
        } else if (hash % 23 === 0) {
          ctx.fillStyle = "#0c1015";
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    tex.refresh();
  }

  buildSluiceGateTexture(key, size) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, size, size);
    const ctx = tex.getContext();

    // Rusted iron backing plate
    ctx.fillStyle = "#14171a";
    ctx.fillRect(0, 0, size, size);

    // Heavy vertical iron grating bars
    const barSpacing = 10;
    for (let x = 4; x < size; x += barSpacing) {
      // Dark shadow edge
      ctx.fillStyle = "#080a0c";
      ctx.fillRect(x, 0, 2, size);
      // Main steel bar
      ctx.fillStyle = "#262f38";
      ctx.fillRect(x + 2, 0, 3, size);
      // Highlight edge
      ctx.fillStyle = "#3a4755";
      ctx.fillRect(x + 5, 0, 1, size);
    }

    // Heavy horizontal riveted cross-flanges
    [0, size / 2 - 4, size - 8].forEach((fy) => {
      ctx.fillStyle = "#182028";
      ctx.fillRect(0, fy, size, 8);
      ctx.fillStyle = "#334150";
      ctx.fillRect(0, fy, size, 1);
      ctx.fillStyle = "#0b0e12";
      ctx.fillRect(0, fy + 7, size, 1);

      // Iron rivets
      for (let rx = 5; rx < size; rx += barSpacing) {
        ctx.fillStyle = "#5c6d80";
        ctx.fillRect(rx, fy + 3, 2, 2);
      }
    });

    // Rust streaks
    for (let x = 0; x < size; x += 6) {
      const hash = (x * 37) % 7;
      if (hash === 0) {
        ctx.fillStyle = "#3f2819";
        ctx.fillRect(x, 12, 2, 18);
      }
    }

    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    tex.refresh();
  }

  buildSubterraneanWaterTexture(key, width, height) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, width, height);
    const ctx = tex.getContext();

    // Deep murky canal water
    ctx.fillStyle = "#091218";
    ctx.fillRect(0, 0, width, height);

    // Subterranean ripples with teal-emerald chemical tint
    for (let y = 2; y < height; y += 4) {
      for (let x = 0; x < width; x += 8) {
        const hash = ((x * 13) ^ (y * 29)) % 5;
        if (hash === 0) {
          ctx.fillStyle = "#0e2329";
          ctx.fillRect(x, y, 6, 1);
        } else if (hash === 1) {
          ctx.fillStyle = "#133139";
          ctx.fillRect(x + 2, y, 4, 1);
        } else if (hash === 2) {
          ctx.fillStyle = "#07161b";
          ctx.fillRect(x, y, 7, 2);
        }
      }
    }

    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    tex.refresh();
  }

  buildDieselPumpTexture(key, size) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, size, size);
    const ctx = tex.getContext();

    // Heavy cast industrial iron engine housing
    ctx.fillStyle = "#161c22";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#242e39";
    ctx.fillRect(2, 2, size - 4, size - 4);

    // Horizontal cooling fins on engine block
    for (let y = 8; y < size - 12; y += 6) {
      ctx.fillStyle = "#0f1317";
      ctx.fillRect(6, y, size - 12, 2);
      ctx.fillStyle = "#323f4e";
      ctx.fillRect(6, y + 2, size - 12, 1);
    }

    // Heavy round flywheel housing / pressure dial mount
    const cx = size / 2;
    const cy = size / 2;
    ctx.fillStyle = "#11161c";
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#47596c";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Brass pressure needle
    ctx.strokeStyle = "#d9a441";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 8, cy - 6);
    ctx.stroke();

    // Oil leak stain on bottom
    ctx.fillStyle = "#080b0e";
    ctx.fillRect(10, size - 8, size - 20, 6);

    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    tex.refresh();
  }

  buildSubwayTilesTexture(key, size) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, size, size);
    const ctx = tex.getContext();

    // Dark vaulted masonry mortar
    ctx.fillStyle = "#0a0e13";
    ctx.fillRect(0, 0, size, size);

    // Underground subway glazed bricks (staggered bond)
    const tileH = 12;
    const tileW = 24;

    for (let y = 0; y < size; y += tileH) {
      const row = Math.floor(y / tileH);
      const offsetX = (row % 2) * (tileW / 2);

      for (let x = -tileW; x < size + tileW; x += tileW) {
        const bx = x + offsetX;
        // Glazed brick surface
        ctx.fillStyle = "#16202a";
        ctx.fillRect(bx + 1, y + 1, tileW - 2, tileH - 2);

        // Brick top highlight
        ctx.fillStyle = "#223140";
        ctx.fillRect(bx + 2, y + 2, tileW - 4, 1);

        // Random soot / mineral staining
        const hash = ((bx * 97) ^ (y * 193)) % 7;
        if (hash === 0) {
          ctx.fillStyle = "#0e151c";
          ctx.fillRect(bx + 3, y + 3, tileW - 6, tileH - 4);
        } else if (hash === 1) {
          ctx.fillStyle = "#111a22";
          ctx.fillRect(bx + 2, y + 2, tileW - 4, tileH - 3);
        }
      }
    }

    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    tex.refresh();
  }

  buildRustedGratingTexture(key, size) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, size, size);
    const ctx = tex.getContext();

    ctx.fillStyle = "#1a222c";
    ctx.fillRect(0, 0, size, size);

    // Perforated mesh holes
    for (let y = 2; y < size; y += 4) {
      for (let x = 2; x < size; x += 4) {
        ctx.fillStyle = "#090d12";
        ctx.fillRect(x, y, 2, 2);
      }
    }

    // Grid wire highlights
    ctx.fillStyle = "#2e3b4d";
    for (let i = 0; i < size; i += 8) {
      ctx.fillRect(i, 0, 1, size);
      ctx.fillRect(0, i, size, 1);
    }

    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    tex.refresh();
  }
}
