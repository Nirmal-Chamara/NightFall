export const AREAS = [
  { name: "Shelter", start: 0, end: 640 },
  { name: "Street", start: 640, end: 1600 },
  { name: "Apartment entrance", start: 1600, end: 2000 },
  { name: "Apartment interior", start: 2000, end: 3200 },
  { name: "Mira's apartment", start: 3200, end: 3840 },
  { name: "Alley & rail yard", start: 3840, end: 4480 },
  { name: "Emergency terminal", start: 4480, end: 5120 },
  { name: "Railway viewpoint", start: 5120, end: 5760 },
];

export const GROUND_TOP = 880;

export const puzzleConfig = {
  // Area 2: Street obstacle & fire escape winch
  car: {
    hood: { x: 1220, y: 860, width: 60, height: 40 },
    roof: { x: 1300, y: 835, width: 100, height: 90 },
    trunk: { x: 1380, y: 860, width: 60, height: 40 },
  },
  fireEscape: { x: 1440, y: 745, width: 80, height: 12 },
  gateWinch: { x: 1440, y: 725 },
  streetGate: { x: 1560, y: 800, width: 14, height: 160 },

  // Area 4: Apartment 04 multi-stage power circuit
  crate: {
    id: "crate_01",
    x: 2320,
    y: 856,
    width: 48,
    height: 48,
  },
  shelf: {
    id: "shelf_01",
    x: 2650,
    y: 720,
    width: 140,
    height: 16,
  },
  fuse: {
    id: "fuse_01",
    x: 2650,
    y: 700,
  },
  switch: {
    id: "switch_01",
    x: 2950,
    y: 825,
  },
  door: {
    id: "door_01",
    x: 3180,
    y: 820,
    requiredSwitch: "switch_01",
  },

  // Area 5: Mira's room transit access
  miraDeskDrawer: {
    x: 3520,
    y: 852,
  },
  airlockConsole: {
    x: 3800,
    y: 835,
  },
  airlockDoor: {
    id: "door_alley",
    x: 3830,
    y: 820,
  },

  // Area 6: Yard stealth distraction
  chainDistraction: {
    x: 4100,
    y: 825,
  },

  // Area 7: Continuity Relay power patch & terminal
  relayBattery: {
    x: 4720,
    y: 852,
  },
  terminalConsole: {
    x: 4820,
    y: 844,
  },
  trackGate: {
    id: "door_track",
    x: 4940,
    y: 820,
  },
};

export const blockoutConfig = {
  street: {
    car: { x: 1300, y: 843, width: 220, height: 74 },
    newspaper: { x: 1050, y: 874 },
  },
  miraApartment: {
    desk: { x: 3450, y: 860, width: 84, height: 40 },
    photo: { x: 3380, y: 840 },
    drawing: { x: 3450, y: 824 },
    notebook: { x: 3650, y: 840 },
  },
  alley: {
    obstacle: { x: 4180, y: 852, width: 64, height: 56 },
    radio: { x: 4380, y: 864 },
    checkpoint: { x: 3920, y: 820 },
    sightingX: 3940,
    wanderer: { x: 4220, y: 845, minX: 4080, maxX: 4380 },
    coverSpots: [
      { id: "cover_1", x: 3980, y: 848, label: "SHADOW ALCOVE" },
      { id: "cover_2", x: 4320, y: 848, label: "STEEL PALLET" },
    ],
  },
  terminal: {
    console: { x: 4820, y: 844 },
  },
  viewpoint: {
    triggerX: 5440,
    railing: { x: 5500, y: 856, width: 120, height: 48 },
    signalTower: { x: 5660, y: 700 },
  },
};
