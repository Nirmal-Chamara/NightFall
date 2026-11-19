export const DIALOGUE = {
  // =========================================================================
  // AREA 1: THE SHELTER
  // =========================================================================

  // Opening radio broadcast when game begins
  C1_RADIO_OPENING: [
    { type: "radio", header: "RADIO // EMERGENCY CHANNEL 1", text: "Can anyone receive this? Signal integrity dropping..." },
    { type: "radio", header: "RADIO // STATIC BURST", text: "...carrier wave fluctuating across northern relays... railway station... final transmission window closing..." },
    { type: "thought", text: "That broadcast again. The same automated loop that started three nights ago." },
    { type: "speech", speaker: "COURIER", text: "Who's keeping that transmitter powered?" },
  ],

  // Inspecting shelter radio manually
  C1_SHELTER_RADIO: [
    { type: "radio", header: "RADIO // EMERGENCY CHANNEL 1", text: "...repeating on auxiliary battery bus... 142.8 MHz..." },
    { type: "thought", text: "Barely a carrier wave left. The signal is coming from the old railway ridge across the district." },
    { type: "thought", text: "Whoever set that loop... they were waiting for someone to answer." },
  ],

  // Inspecting photograph in shelter
  C1_PHOTO_THOUGHT: [
    { type: "thought", text: "A photograph from last summer at the northern rail platform. Mira was holding her portable oscilloscope, grinning into the wind." },
    { type: "thought", text: "\"When the power lines go quiet, Courier, that's when you hear the real world,\" she told me." },
    { type: "thought", text: "I told her to stop dreaming and pack her bags before the storm hit. We should have left together." },
  ],

  // Inspecting shelter workbench
  C1_SHELTER_WORKBENCH: [
    { type: "thought", text: "Rosin-core solder, spare 12V dry cells, and insulated wire cutters." },
    { type: "thought", text: "Before The Silence, I spent ten years delivering priority cargo between city sectors. Now the roads are drowned in rainwater and dead wires." },
  ],

  // Inspecting shelter window
  C1_SHELTER_WINDOW: [
    { type: "thought", text: "Rain drumming against corrugated iron. It hasn't stopped in three days." },
    { type: "thought", text: "Out there, the whole residential district is pitch-black. Just dark rooftops sinking into the fog." },
  ],

  // Knock heard at door
  C1_DOOR_KNOCK: [
    { type: "thought", text: "...A knock? Three heavy raps on the outer door." },
    { type: "thought", text: "Nobody comes out in this downpour. Not anymore." },
    { type: "speech", speaker: "COURIER", text: "Hello? Is someone out there?" },
  ],

  // Finding the package outside shelter door
  C1_PACKAGE_FOUND: [
    { type: "speech", speaker: "COURIER", text: "Nobody's here. Just footprints dissolving in the mud." },
    {
      type: "terminal",
      header: "SEALED DISPATCH LABEL // HEAVY WAX EMBOSSING",
      text: "DESTINATION: OLD RAILWAY SIGNAL STATION\nDEADLINE: BEFORE THE LAST SIGNAL\nINSTRUCTIONS: DO NOT OPEN. DO NOT ABANDON.",
    },
    { type: "thought", text: "The container is cold brushed steel, sealed with industrial tamper tape. But inside... there's a faint, steady pulse." },
    { type: "thought", text: "Like a heartbeat. Or a clock synchronizing to an unseen rhythm." },
    { type: "speech", speaker: "COURIER", text: "Whoever dropped this knew I was still in this shelter. And they knew I was a courier." },
    { type: "thought", text: "The railway station is across the district. I have to see what this is." },
  ],

  // =========================================================================
  // AREA 2: THE EMPTY STREET
  // =========================================================================

  // Newspaper on street
  C1_NEWSPAPER: [
    {
      type: "terminal",
      header: "THE REGIONAL CHRONICLE // FINAL EDITION",
      text: "THE SILENCE: Regional grid cascade collapsed at 11:47 PM. Transmission hubs across Sector 4 dark. Railway authorities order immediate suspension of all passenger lines.",
    },
    { type: "thought", text: "October 14th. The night the sky went dark. Four months ago, but it feels like another century." },
    { type: "thought", text: "They called it a temporary cascade. But the trains never started running again." },
  ],

  // Inspecting rusted bicycle
  C1_BICYCLE: [
    { type: "thought", text: "A commuter bicycle chained to the lamppost. The chain is frozen solid with orange rust." },
    { type: "thought", text: "A sodden canvas grocery bag still sits in the wire basket. Someone dropped it and ran when the air-raid sirens began." },
  ],

  // Inspecting abandoned vehicle
  C1_CAR_INSPECT: [
    { type: "thought", text: "An abandoned sedan wedged across the sidewalk. Its hood and roof are solid steel." },
    { type: "thought", text: "I can climb onto the hood and roof to reach the fire escape awning above the security gate." },
  ],

  // Street security gate locked
  C1_GATE_LOCKED: [
    { type: "thought", text: "A heavy chain-link security gate bars the street. The manual counterweight winch is mounted on the fire escape above." },
    { type: "thought", text: "I need to climb over the car roof and access the awning to turn the winch." },
  ],

  // Street winch activated
  C1_WINCH_ACTIVATE: [
    { type: "thought", text: "Turned the rusted chain winch with all my weight. The counterweight drops with a groaning rattle." },
    { type: "thought", text: "The security gate lifts, opening the way into the apartment courtyard." },
  ],

  // =========================================================================
  // AREA 3 & 4: APARTMENT COMPLEX & BASEMENT
  // =========================================================================

  // Intercom directory at apartment entrance
  C1_INTERCOM: [
    {
      type: "terminal",
      header: "APARTMENT RESIDENTIAL DIRECTORY // WEATHERED ROSTER",
      text: "APT 01: V. CHEN\nAPT 02: [NAME SCRATCHED OUT]\nAPT 03: BASEMENT UTILITY\nAPT 04: M. VANCE & R. KEEPER",
    },
    { type: "speech", speaker: "COURIER", text: "Mira Vance... Rowan Keeper." },
    { type: "thought", text: "Rowan was the old signal keeper at the railway junction. Mira mentioned him in her last letter." },
    { type: "thought", text: "They were working together up here before the lines went dead." },
  ],

  // Apartment building maintenance notice
  C1_MAINTENANCE_NOTE: [
    {
      type: "terminal",
      header: "BUILDING SUPERINTENDENT NOTICE // APT 04",
      text: "CIRCUIT FAULT: Section 04 partition offline due to grid surge. Emergency 30A ceramic fuse stored on upper storage rack in maintenance bay. Do not force the magnetic security door.",
    },
    { type: "thought", text: "The blast door into the residential wing is locked by an electronic deadbolt." },
    { type: "thought", text: "If I find that 30A fuse on the upper shelf, I can re-seat the main breaker and restore power." },
  ],

  // Breaker panel inspected without fuse
  C1_PANEL_EMPTY: [
    { type: "thought", text: "The breaker panel housing is heavy industrial cast-iron. The primary 30A ceramic cartridge has blown clean in half." },
    { type: "thought", text: "The maintenance notice says a spare 30A fuse is stored on the high overhead rack. I can push that warehouse crate under the shelf to climb up and get it." },
  ],

  // Breaker panel inspected with fuse but distribution circuit still severed
  C1_PANEL_NEED_CIRCUIT: [
    { type: "thought", text: "The 30A fuse is seated, but the amber fault indicator is blinking." },
    { type: "thought", text: "The secondary distribution line is cut at the wall junction box near the entrance. I need to route the bypass wire first." },
  ],

  // Distribution junction box offline
  C1_CIRCUIT_BOX_OFF: [
    { type: "thought", text: "The wall distribution junction box. A severed copper conduit dangles loose, sparking weakly in the damp air." },
    { type: "thought", text: "I can splice the heavy rubber-jacketed bypass jumper into the terminal clamp." },
  ],

  // Distribution junction box patched
  C1_CIRCUIT_BOX_PATCHED: [
    { type: "thought", text: "Spliced the jumper cable into the secondary bus. A sharp crack of sparks pops, and the junction relay hums." },
    { type: "thought", text: "Auxiliary power routed! The main breaker panel is now ready to throw." },
  ],

  // Basement drainage grate
  C1_DRAINAGE_GRATE: [
    { type: "thought", text: "A heavy cast-iron stormwater grate bolted into the concrete floor." },
    { type: "thought", text: "Beneath the iron bars, I can hear water roaring through deep subterranean culverts, draining toward the old railway marsh." },
    { type: "thought", text: "Cool, damp air is rising from the depths. There's an entire network of maintenance tunnels down there." },
  ],

  // Power restored radio broadcast
  C1_POWER_RESTORED: [
    { type: "thought", text: "Fluorescent tubes flicker to life overhead with an electric hum. The magnetic lock on the blast door pops open with a heavy clack." },
    { type: "radio", header: "RESIDENTIAL EMERGENCY NETWORK // AUTOMATED", text: "Grid synchronization restored on auxiliary bus. Warning: relay beacon at railway viewpoint offline." },
    { type: "radio", header: "RESIDENTIAL EMERGENCY NETWORK // AUTOMATED", text: "If anyone can hear this, the northern route remains accessible through Sector 7 railway interchange." },
    { type: "speech", speaker: "COURIER", text: "The corridor to Mira's apartment is clear." },
  ],

  // =========================================================================
  // AREA 5: MIRA'S APARTMENT
  // =========================================================================

  // Mira's photo on the desk
  C1_MIRA_PHOTO: [
    { type: "thought", text: "A framed photograph on the desk: Mira smiling, wind blowing her jacket, standing on the railway observation platform." },
    { type: "thought", text: "\"If the world ever forgets where we are, Courier, just look for the high wires. The signals will guide us home.\"" },
    { type: "thought", text: "I kept telling myself she was safe in the northern valleys. But she stayed right here, watching the towers until the end." },
  ],

  // Mira's child drawing (Hidden ending prerequisite)
  C1_MIRA_DRAWING: [
    {
      type: "terminal",
      header: "CHILD'S CRAYON DRAWING // PINNED TO WALL",
      text: "Two small silhouettes standing atop a railway bridge under a night sky filled with glowing amber stars.\nHandwritten caption: 'When the lights come back, we'll go home.'",
    },
    { type: "speech", speaker: "COURIER", text: "When the lights come back..." },
    { type: "thought", text: "She drew this years ago when our parents left on the night express. She never stopped believing the trains would run again." },
    { type: "thought", text: "★ Clue preserved: Mira's Drawing. I'll carry this with me." },
  ],

  // Mira's research notebook
  C1_MIRA_NOTEBOOK: [
    { type: "thought", text: "Mira's spiral notebook, filled with radio schematics, frequency charts, and hurried notes." },
    { type: "thought", text: "\"November 3rd: The interference is rhythmic now. 142.8 MHz. It's not atmospheric static—it's a carrier pulse coming from beyond the ridge.\"" },
    { type: "thought", text: "\"November 19th: Rowan says the signal station has enough battery reserves for one final synchronization broadcast. If we miss that window, the entire valley goes dark permanently.\"" },
    { type: "thought", text: "\"December 2nd: I packed the Continuity Relay Key. If anyone finds this... please, take it to the station before the last signal fades.\"" },
    { type: "speech", speaker: "COURIER", text: "The Relay Key... That's what's inside this package." },
  ],

  // Mira's radio workbench & tunnel map
  C1_MIRA_WORKBENCH: [
    { type: "thought", text: "Her electronics workbench. Stripped coaxial cables, an open crystal radio receiver, and a topographical railway map pinned down with pliers." },
    { type: "thought", text: "A red grease pencil circles the maintenance access hatch near the viewpoint: 'Route to Sector 2 - Subterranean drainage tunnels. Flooded, bring rubber boots'." },
    { type: "thought", text: "She was preparing to head underground if the street routes were cut off." },
  ],

  // Searching Mira's locked desk drawer
  C1_MIRA_DESK_SEARCH: [
    { type: "thought", text: "Found the hidden release behind the desk pedestal. The bottom drawer slides open with a smooth click." },
    {
      type: "terminal",
      header: "REGIONAL RAIL TRANSIT // EMPLOYEE PASS 09",
      text: "HOLDER: MIRA VANCE\nCLEARANCE: SECTOR 4 INTERCHANGE & NORTHERN YARDS\nSTATUS: ACTIVE EMERGENCY OVERRIDE",
    },
    { type: "speech", speaker: "COURIER", text: "Mira's rail transit pass! This will unlock the pressurized airlock leading to the yard." },
  ],

  // Alley airlock door locked
  C1_ALLEY_DOOR_LOCKED: [
    { type: "thought", text: "A heavy sealed airlock bulkhead door bars the corridor. The card reader blinks red: 'TRANSIT PASS REQUIRED'." },
    { type: "thought", text: "I need to search Mira's desk drawers to find her regional rail transit pass." },
  ],

  // Alley airlock door unlocked
  C1_ALLEY_DOOR_UNLOCKED: [
    { type: "thought", text: "Swiped Mira's transit pass through the reader slot. The indicator flashes emerald green." },
    { type: "thought", text: "Pneumatic locks hiss as the heavy steel bulkhead rolls into the wall, opening into the rain-soaked rail yard." },
  ],

  // =========================================================================
  // AREA 6: THE ALLEY & THE WANDERER
  // =========================================================================

  // Glimpse of the Wanderer
  C1_WANDERER_GLIMPSE: [
    { type: "speech", speaker: "COURIER", text: "Wait... someone's standing in the alley." },
    { type: "thought", text: "Tall. Gaunt. Moving with mechanical precision through the rain. That's not a scavenger..." },
    { type: "thought", text: "I need to stay in the shadows and avoid that lantern beam." },
  ],

  // Pulling the dangling iron chain pulley to create sound distraction
  C1_CHAIN_DISTRACT: [
    { type: "thought", text: "Yanked the rusted chain pulley with all my strength. An avalanche of loose metal pipes crashes across the concrete!" },
    { type: "thought", text: "The metallic din echoes across the yard! The Wanderer halts in its tracks, turning toward the noise." },
  ],

  // Emergency battery bank outside Station 09
  C1_RELAY_BATTERY_FIX: [
    { type: "thought", text: "The heavy industrial lead-acid battery bank. The ground clamp had slipped loose in the mud." },
    { type: "thought", text: "Clamped the heavy bronze jaw back onto the negative terminal! Sparks pop, and power hums into the station terminal inside." },
  ],

  // Claw-damaged dumpster in alley
  C1_DUMPSTER_CLAW: [
    { type: "thought", text: "A heavy commercial dumpster. The sheet metal lid has three deep, jagged gouges torn clean through the steel." },
    { type: "thought", text: "The metal around the cuts is frosted white, freezing cold to the touch. Whatever is roaming this alley... it isn't human." },
  ],

  // Crushed radio receiver in alley exit
  C1_ALLEY_RADIO: [
    {
      type: "terminal",
      header: "CRUSHED HANDHELD RECEIVER",
      text: "CARRIER DETECTED // FREQUENCY: 142.8 MHz // SIGNAL STRENGTH: PEAKING\nALERT: CONTINUITY KEY PROXIMITY CONFIRMED",
    },
    { type: "thought", text: "The package in my bag is reacting to the radio... The amber indicator light is pulsing faster, matching the transmitter." },
  ],

  // =========================================================================
  // AREA 7: THE EMERGENCY TERMINAL
  // =========================================================================

  // Terminal offline without battery ground
  C1_TERMINAL_OFFLINE: [
    { type: "thought", text: "The continuity terminal console is dark. The CRT monitor emits only a faint high-voltage static whine." },
    { type: "thought", text: "The emergency lead-acid battery bank outside Station 09 needs its negative ground clamp reconnected." },
  ],

  // Live transmission sequence with Rowan
  C1_TERMINAL_TRANSMISSION: [
    {
      type: "terminal",
      header: "CONTINUITY NODE 07 // EMERGENCY CONSOLE",
      text: "AUTHENTICATING CARRIER KEY...\nSIGNAL ROUTE: RAILWAY DISTRICT TOWER\nSTATUS: LIVE TRANSMISSION INCOMING.",
    },
    { type: "radio", header: "INCOMING TRANSMISSION // CRACKLING VOICE", text: "...Courier? Is the delivery en route?" },
    { type: "speech", speaker: "COURIER", text: "Who is this? Rowan?" },
    { type: "radio", header: "INCOMING TRANSMISSION // CRACKLING VOICE", text: "You made it through the district... I knew you wouldn't abandon her." },
    { type: "speech", speaker: "COURIER", text: "Where is Mira? Is she at the station?" },
    { type: "radio", header: "INCOMING TRANSMISSION // CRACKLING VOICE", text: "Keep moving toward the viewpoint. The signal tower... the last window is closing." },
    { type: "radio", header: "INCOMING TRANSMISSION // CRACKLING VOICE", text: "Whatever you do... don't let them take that key." },
    { type: "thought", text: "The connection cuts out into a wall of white noise. Rowan knows everything. I have to reach that viewpoint." },
  ],

  // Terminal system archive log
  C1_TERMINAL_LOG: [
    {
      type: "terminal",
      header: "CONTINUITY PROTOCOL // EVENT LOG 11:47 PM",
      text: "GRID DISCONNECT CONFIRMED.\nREGIONAL NODES OFFLINE: 48/50.\nEMERGENCY BROADCASTS ENGAGED.\nDIRECTIVE: MAINTAIN SIGNAL CONTINUITY AT ALL COSTS.",
    },
    { type: "thought", text: "The Continuity Project wasn't just a communication backup. They knew the collapse was coming." },
  ],

  // =========================================================================
  // AREA 8: THE RAILWAY VIEWPOINT & CLIMAX
  // =========================================================================

  // Guidance thought if player reaches viewpoint before booting relay terminal
  C1_VIEWPOINT_DARK: [
    { type: "thought", text: "The railway signal tower on the ridge is dark and unresponsive." },
    { type: "thought", text: "I need to route emergency power through the continuity terminal back in the relay station before the signal beacon will broadcast." },
  ],

  // Climax ending sequence overlooking the railway
  C1_VIEWPOINT_ENDING: [
    { type: "speech", speaker: "COURIER", text: "There it is... the old railway line." },
    { type: "thought", text: "Miles of rusted tracks stretching into the foggy abyss. And up on the ridge... the signal tower." },
    { type: "thought", text: "The indicator on the package is glowing brilliant gold now, humming in resonance with the tower beacon." },
    { type: "speech", speaker: "COURIER", text: "You're not just a relay key, are you? You're her answer." },
    { type: "radio", header: "FAINT FREQUENCY // YOUNG VOICE", text: "...Is anyone still out there?" },
    { type: "radio", header: "FAINT FREQUENCY // YOUNG VOICE", text: "The lights in the valley... they went dark so long ago." },
    { type: "speech", speaker: "COURIER", text: "Mira? Can you hear me?!" },
    { type: "radio", header: "FAINT FREQUENCY // YOUNG VOICE", text: "...Courier? I thought... I thought everyone was gone." },
    { type: "speech", speaker: "COURIER", text: "I have the package. I'm coming to the station." },
    { type: "radio", header: "FAINT FREQUENCY // YOUNG VOICE", text: "Be careful... the surface isn't safe anymore. Take the maintenance tunnels beneath the rails..." },
    { type: "radio", header: "FAINT FREQUENCY // STATIC FADE", text: "...find the drainage valve... below the surface..." },
  ],

  // =========================================================================
  // CHAPTER 2: THE DROWNED DEPTHS
  // =========================================================================

  // Area 1: Viaduct descent & culvert entrance
  C2_OPENING: [
    { type: "thought", text: "The service ladder descends sixty feet below the viaduct into the drainage canal." },
    { type: "thought", text: "The air down here is dense with cold limestone and standing water. Total blackout, except for emergency chem-phosphor." },
    { type: "speech", speaker: "COURIER", text: "Mira said to find the drainage valves beneath the rails. The Sector 7 interchange must be on the other side." },
  ],

  C2_MAINTENANCE_NOTE: [
    {
      type: "terminal",
      header: "SECTOR 7 DRAINAGE LOG // ENTRY 409",
      text: "STORM SURGE REPORT: Sluice Gate 02 jammed. Section B submerged beneath four feet of drainage runoff.\n\nWARNING: Feeder Cable #4 severed in Conduit Vault 3. DO NOT enter the standing pool while the battery bus is live. Manual circuit isolator is on the upper catwalk.",
    },
    { type: "thought", text: "Sluice Gate 02 is flooding the passage ahead, and there's a live high-voltage cable in the water further down." },
    { type: "speech", speaker: "COURIER", text: "Good thing someone left a note before they ran." },
  ],

  // Area 2: Sluice basin & drainage wheel
  C2_SLUICE_VALVE_INSPECT: [
    { type: "thought", text: "A massive cast-iron sluice valve wheel. The pressure indicator shows Section B is completely flooded." },
    { type: "thought", text: "I can turn the counterweight wheel to drain the runoff into the lower storm sump." },
  ],

  C2_SLUICE_DRAINED: [
    { type: "thought", text: "The drainage gears grind open with a heavy metallic clatter. Water rushes into the lower sump below!" },
    { type: "thought", text: "The water level is dropping... The submerged catwalk and concrete stepping blocks are clear to cross." },
  ],

  // Area 3: Submerged generator bay
  C2_GENERATOR_BAY_LOOK: [
    { type: "thought", text: "The gantry collapsed into the flooded pit. The gap is too wide to jump across." },
    { type: "thought", text: "There's a reinforced watertight freight crate resting on the upper rail gantry above." },
    { type: "thought", text: "If I shove it over the gantry edge, it should float in the water pit and give me a stepping bridge." },
  ],

  C2_CRATE_FLOATED: [
    { type: "thought", text: "A heavy splash echoes across the generator bay! The crate settles into the water, floating buoyant." },
    { type: "thought", text: "That will hold my weight. I can leap across to the conduit tunnel now." },
  ],

  // Area 4: Electrified sump & circuit isolator
  C2_ELECTRIC_WARNING: [
    { type: "thought", text: "High-voltage sparks are snapping against the water surface. The severed feeder cable is buzzing like a hornet nest." },
    { type: "thought", text: "Stepping in there would be suicide. The maintenance note mentioned a circuit isolator lever on the overhead catwalk." },
  ],

  C2_ELECTRIC_SHOCK: [
    { type: "speech", speaker: "COURIER", text: "Ghh! Current's running straight through the pool!" },
    { type: "thought", text: "I can't cross until I isolate that cable from the overhead walkway." },
  ],

  C2_CIRCUIT_CUT: [
    { type: "thought", text: "With a heavy mechanical clunk, the high-voltage breaker snaps open. The sparks die down." },
    { type: "thought", text: "Feeder Cable #4 is de-energized. The standing pool is safe to walk through." },
  ],

  // Area 5: Echoing aqueduct & acoustic wanderer
  C2_ACOUSTIC_WARN: [
    { type: "thought", text: "The brick aqueduct arches high overhead. Every drop of condensation echoes like a gunshot." },
    { type: "thought", text: "Wait... footsteps ahead. Heavy, mechanical footsteps." },
    { type: "speech", speaker: "COURIER", text: "Another Wanderer patrol. But in this darkness, it's listening, not looking." },
    { type: "thought", text: "Sloshing through the water on the floor will give me away. I should stick to the overhead pipes, or make a noise distraction to lure it away." },
  ],

  C2_STEAM_DISTRACTION: [
    { type: "thought", text: "I threw the heavy pipe wrench into the far drain sump. The metallic clatter rings loudly down the western tunnel!" },
    { type: "thought", text: "The Wanderer turns toward the echo, stalking away from the exit arch." },
  ],

  // Area 6: Pumping station 07 & floodgate
  C2_PUMP_STATION_ARRIVED: [
    { type: "thought", text: "Pumping Station 07. The massive Hydraulic Floodgate ahead is sealed shut." },
    { type: "thought", text: "The pressure gauge reads zero bar. The emergency diesel backup pump is cold." },
    { type: "thought", text: "I need to open the auxiliary fuel valve, then crank the manual flywheel starter." },
  ],

  C2_PUMP_VALVE_OPENED: [
    { type: "thought", text: "The brass fuel petcock opens with a squeak. Fresh diesel primes into the injector manifold." },
    { type: "thought", text: "Fuel primed. Now to crank the manual flywheel." },
  ],

  C2_PUMP_STARTED: [
    { type: "thought", text: "The diesel cylinders sputter, catch fire, and rumble into a steady rhythmic chug!" },
    { type: "thought", text: "Hydraulic pressure surges into the green! The massive steel floodgate slowly lifts open." },
    { type: "speech", speaker: "COURIER", text: "Gate's open. The Sector 7 interchange is just ahead." },
  ],

  // Area 7: Sector 7 marshalling yard & Rowan's signal cabin
  C2_ROWAN_CABIN_ARRIVED: [
    { type: "thought", text: "The tunnel opens into the sunken rail pit of Sector 7. Shattered glass skylights expose the stormy night sky." },
    { type: "thought", text: "Up on the iron pilings... Signal Cabin 07. A real kerosene lantern is glowing inside the window." },
  ],

  C2_ROWAN_INTERCOM: [
    { type: "terminal", header: "SIGNAL CABIN 07 // INTERCOM ACTIVE", text: "CHANNEL 3 OPEN... AUDIO FEED ACTIVE." },
    { type: "radio", header: "ROWAN KEEPER // CABIN INTERCOM", text: "...Courier? You made it through the culverts?" },
    { type: "speech", speaker: "COURIER", text: "I'm here, Rowan. And I have the sealed steel dispatch." },
    { type: "radio", header: "ROWAN KEEPER // CABIN INTERCOM", text: "Place it into the pneumatic dispatch slot. Let me initialize the carrier frequency." },
    { type: "thought", text: "The pneumatic door locks with a tight hiss. A series of metallic clicks echo as the package's wax tamper seals release." },
    { type: "radio", header: "ROWAN KEEPER // VOICE TREMBLING", text: "Merciful sky... it is the Genesis Relay Key. Mira actually did it." },
    { type: "speech", speaker: "COURIER", text: "Rowan, tell me what this is. What caused The Silence? Why did every generator and substation die at the exact same moment?" },
    { type: "radio", header: "ROWAN KEEPER // CABIN INTERCOM", text: "Because the power grid didn't collapse by accident, Courier. It was quarantined." },
    { type: "speech", speaker: "COURIER", text: "...Quarantined?" },
    { type: "radio", header: "ROWAN KEEPER // CABIN INTERCOM", text: "Four months ago, the autonomous grid intelligence detected a corrupted waveform spreading through the regional relays. To stop the contagion, the central failsafe executed a scorched-earth shutdown. They severed the entire continent." },
    { type: "radio", header: "ROWAN KEEPER // CABIN INTERCOM", text: "Mira spent months reverse-engineering the carrier waveform. This key... it doesn't just bypass the quarantine. It can reboot the regional transmission loop." },
    { type: "speech", speaker: "COURIER", text: "Where is she, Rowan? Where is Mira?" },
    { type: "radio", header: "ROWAN KEEPER // CABIN INTERCOM", text: "She went ahead to the Central Transmit Hub on the high bridge over the gorge. She's waiting for this key." },
    { type: "radio", header: "ROWAN KEEPER // CABIN INTERCOM", text: "Take the auxiliary maintenance trolley through Sector 8. Be careful, Courier... the sweepers know the carrier frequency is alive." },
  ],

  C2_VIEWPOINT_ENDING: [
    { type: "thought", text: "The signal cabin console hums with golden phosphor light as the key synchronizes the marshaling yard." },
    { type: "speech", speaker: "COURIER", text: "Hold on, Mira. I'm bringing the key to the bridge." },
  ],
};
