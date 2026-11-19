export const AREAS = [
  { name: "Viaduct descent & culvert entrance", start: 0, end: 720 },
  { name: "Sluice basin & drainage wheel", start: 720, end: 1560 },
  { name: "Submerged generator bay & floating crate", start: 1560, end: 2480 },
  { name: "Electrified sump & circuit isolator", start: 2480, end: 3360 },
  { name: "Echoing aqueduct & acoustic wanderer", start: 3360, end: 4240 },
  { name: "Pumping station 07 & floodgate", start: 4240, end: 5040 },
  { name: "Sector 7 marshalling yard & signal cabin", start: 5040, end: 5760 },
];

export const GROUND_TOP = 880;

export const puzzleConfig = {
  // Area 1: Viaduct Descent
  viaductDescent: {
    startPos: { x: 180, y: 810 },
    ladder: { x: 120, yTop: 340, yBottom: 880 },
    clipboard: { x: 380, y: 852 },
    chemlight: { x: 320, y: 846 },
    entranceDoor: { id: "door_c2_entrance", x: 680, y: 820 },
  },

  // Area 2: Sluice Basin & Drainage Wheel
  sluiceBasin: {
    catwalk: { x: 1040, y: 824, width: 220, height: 16 },
    valveWheel: { x: 1040, y: 792 },
    waterHighY: 810,
    waterLowY: 870,
    waterStartX: 760,
    waterEndX: 1520,
    pipeBulkhead: { x: 1440, y: 780, width: 44, height: 100 },
    steppingBlocks: [
      { x: 1220, y: 852, width: 48, height: 28 },
      { x: 1360, y: 852, width: 48, height: 28 },
    ],
  },

  // Area 3: Submerged Generator Bay & Floating Crate
  generatorBay: {
    ladder: { x: 1610, yTop: 728, yBottom: 880 },
    upperGantry: { x: 1720, y: 728, width: 240, height: 16 },
    crate: {
      id: "crate_bay",
      x: 1720,
      y: 704,
      width: 48,
      height: 48,
    },
    pit: { x: 1840, width: 320, y: 840 },
    floatingSpot: { x: 2000, y: 856 },
    exitCatwalk: { x: 2260, y: 840, width: 180, height: 16 },
  },

  // Area 4: Electrified Sump & Circuit Isolation
  electricSump: {
    sumpWater: { x: 2740, width: 360, y: 854, height: 26 },
    danglingCable: { x: 2920, y: 640, length: 190 },
    ladder: { x: 2600, yTop: 708, yBottom: 880 },
    upperCatwalk: { x: 2740, y: 708, width: 260, height: 16 },
    switch: {
      id: "switch_isolator",
      x: 2740,
      y: 678,
    },
    safeResetX: 2710,
  },

  // Area 5: Echoing Aqueduct & Acoustic Wanderer Patrol
  acousticYard: {
    wanderer: { x: 3820, y: 845, minX: 3660, maxX: 4080 },
    pipeLadders: [
      { x: 3480, yTop: 720, yBottom: 880 },
      { x: 4120, yTop: 720, yBottom: 880 },
    ],
    overheadPipes: [
      { x: 3560, y: 720, width: 130, height: 14 },
      { x: 3760, y: 700, width: 170, height: 14 },
      { x: 4000, y: 720, width: 140, height: 14 },
    ],
    distractionValve: { x: 3520, y: 850 },
    coverSpots: [
      { id: "pipe_cover_1", x: 3650, y: 848, label: "SHADOW RECESS" },
      { id: "pipe_cover_2", x: 3960, y: 848, label: "DRAINAGE ALCOVE" },
    ],
  },

  // Area 6: High-Pressure Pumping Station 07
  pumpStation: {
    fuelValve: { x: 4420, y: 852 },
    flywheelStarter: { x: 4620, y: 844 },
    pressureGauge: { x: 4740, y: 820 },
    floodgate: {
      id: "door_floodgate",
      x: 4980,
      y: 810,
      width: 28,
      height: 140,
      label: "GATE 07",
      requiredSwitch: "pump_started",
    },
  },

  // Area 7: Sector 7 Marshalling Yard & Rowan's Signal Cabin
  signalCabin: {
    stairs: { x: 5320, y: 840, width: 80, height: 40 },
    cabinPlatform: { x: 5500, y: 790, width: 260, height: 24 },
    intercom: { x: 5500, y: 760 },
    pneumaticHatch: { x: 5560, y: 765 },
    endingTriggerX: 5460,
  },
};

export const blockoutConfig = {
  viaduct: {
    warningClipboard: { x: 380, y: 852 },
  },
  sluice: {
    wheel: { x: 1040, y: 792 },
  },
  generator: {
    desk: { x: 1680, y: 852, width: 64, height: 36 },
  },
  sump: {
    transformerBox: { x: 2540, y: 844, width: 44, height: 50 },
  },
  aqueduct: {
    distractionValve: { x: 3520, y: 850 },
  },
  pump: {
    dieselPumpUnit: { x: 4520, y: 830, width: 120, height: 70 },
  },
  yard: {
    boxcar: { x: 5180, y: 820, width: 160, height: 90 },
    lantern: { x: 5540, y: 750 },
  },
};
