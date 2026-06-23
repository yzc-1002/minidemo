const WebSocket = require('ws');
const http = require('http');

const PORT = 2567;
const TICK_RATE = 20;
const TICK_INTERVAL = 1000 / TICK_RATE;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;
const START_DELAY = 6;
const MAX_PENDING_INPUTS = 10;
const SPAWN_SLOT_COUNT = 4;
const ENERGY_BORN_INTERVAL = 4;
const ENERGY_MAX_COUNT = 6;
const ENERGY_VALUE = 12;
const ENERGY_EGG_MIDGAME_SECONDS = 15;
const ENERGY_EGG_MATURE_TIME = 20;
const ENERGY_EGG_RADIUS = 34;
const ENERGY_EGG_ATTACH_DISTANCE = 110;
const ENERGY_EGG_ATTACH_MIN_OFFSET = 60;
const ENERGY_EGG_ATTACH_MAX_OFFSET = 84;
const ENERGY_EGG_MAX_COUNT = 2;
const ENERGY_EGG_MIDGAME_SPAWN_TOTAL_MIN = 1;
const ENERGY_EGG_MIDGAME_SPAWN_TOTAL_MAX = 2;
const ENERGY_EGG_BURST_COUNT = 12;
const ENERGY_EGG_BURST_SCATTER_RADIUS = 136;
const PLAYER_DEFAULT_RADIUS = 38;
const PLAYER_DIR_FALLBACK = { x: 1, y: 0 };
const PLAYER_SHOOT_INTERVAL = 0.35;
const PLAYER_FREE_BULLET_MAX = 3;
const PLAYER_FREE_BULLET_RECOVER_DELAY = 0.8;
const PLAYER_FREE_BULLET_RECOVER_INTERVAL = 0.6;
const PLAYER_PAID_SHOT_HP_COST = 5 * (1 - 0.1);
const MULTIPLAYER_DEFAULT_TANK_TYPE = 1;
const MULTIPLAYER_FIXED_PLAYER_LEVEL = 1;
const MULTIPLAYER_FIXED_BASE_HP = 100;
const MULTIPLAYER_FIXED_BASE_ATK = 10;
const MULTIPLAYER_FIXED_BASE_SPEED = 5;
const MULTIPLAYER_FIXED_ATTACK_RADIUS = 400;
const PLAYER_EXP_BASE = 30;
const PLAYER_EXP_STEP = 15;
const PLAYER_LEVEL_HP_ADD = 5;
const PLAYER_LEVEL_DAMAGE_ADD = 0.5;
const PLAYER_LEVEL_SPEED_ADD = 18;
const PLAYER_BOUNCE_UNLOCK_ENERGY_LEVEL = 2;
const PLAYER_BOUNCE_MAX_COUNT = 5;
const PLAYER_BOUNCE_DAMAGE_MULTIPLIER = 2;
const SPECIAL_EVENT_START_DELAY = 8;
const SPECIAL_EVENT_RESPAWN_MIN = 12;
const SPECIAL_EVENT_RESPAWN_MAX = 20;
const SPECIAL_EVENT_DURATION = 60;
const SPECIAL_EVENT_MIN_PLAYER_DISTANCE = 180;
const SPECIAL_EVENT_MIN_ENERGY_DISTANCE = 170;
const SPECIAL_EVENT_MIN_EGG_DISTANCE = 220;
const SPECIAL_EVENT_PORTAL_RADIUS = 44;
const SPECIAL_EVENT_PORTAL_PAIR_MIN = 360;
const SPECIAL_EVENT_PORTAL_PAIR_MAX = 780;
const SPECIAL_EVENT_DAMAGE_RADIUS = 60;
const SPECIAL_EVENT_SPEED_RADIUS = 60;
const SPECIAL_EVENT_BLACK_HOLE_RADIUS = 100;
const SPECIAL_EVENT_BLACK_HOLE_DESTROY_RADIUS = 14;
const TAR_PICKUP_MAX_COUNT = 1;
const TAR_PICKUP_START_DELAY = 15;
const TAR_PICKUP_RESPAWN_MIN = 10;
const TAR_PICKUP_RESPAWN_MAX = 16;
const TAR_PICKUP_RADIUS = 42;
const TAR_PICKUP_TOUCH_RADIUS = 92;
const TAR_PICKUP_LIFETIME = 120;
const TAR_SPILL_DURATION = 20;
const TAR_SPILL_RADIUS = 120;
const TAR_SPILL_SLOW_FACTOR = 0.52;
const BLACK_HOLE_PICKUP_MAX_COUNT = 1;
const BLACK_HOLE_PICKUP_START_DELAY = 8;
const BLACK_HOLE_PICKUP_RESPAWN_MIN = 14;
const BLACK_HOLE_PICKUP_RESPAWN_MAX = 20;
const BLACK_HOLE_PICKUP_RADIUS = 42;
const BLACK_HOLE_PICKUP_TOUCH_RADIUS = 92;
const BLACK_HOLE_PICKUP_LIFETIME = 120;
const BLACK_HOLE_ZONE_DURATION = 20;
const BLACK_HOLE_ZONE_RADIUS = 100;
const BLACK_HOLE_ZONE_DESTROY_RADIUS = 14;
const BLACK_HOLE_ZONE_GRAVITY = 160;
const CONFIG_PICKUP_LIFETIME = 60;
const CONFIG_SMALL_ENERGY_LIFETIME = 60;
const SMALL_ENERGY_CHECK_INTERVAL = 10;
const SMALL_ENERGY_MIN_COUNT = 24;
const SMALL_ENERGY_TARGET_COUNT = 30;
const SMALL_ENERGY_CLUSTER_RADIUS = 180;
const SMALL_ENERGY_MIN_GAP = 58;
const SMALL_ENERGY_PLAYER_SAFE_DISTANCE = 96;
const ENERGY_WELL_BURST_INTERVAL = 10;
const ENERGY_WELL_BURST_COUNT = 5;
const ENERGY_WELL_BURST_SMALL_ENERGY_COUNT = 5;
const ENERGY_WELL_RADIUS = 46;
const CONFIG_PICKUP_TOUCH_RADIUS = 92;
const CONFIG_PICKUP_USE_DURATION = 20;
const CONFIG_PICKUP_MAX_COUNT = 1;
const MULTIPLAYER_ENABLE_PICKUP_SPAWNS = false;
const SERVER_CHILD_BULLET_SPEED_SCALE = 1.05;
const SERVER_CHILD_BULLET_DAMAGE_SCALE = 0.8;
const SERVER_CHILD_BULLET_GUNSHOT_SCALE = 0.55;
const SERVER_CHILD_BULLET_GUNSHOT_MIN = 90;
const SPECIAL_EVENT_CENTRIFUGAL_RADIUS = 86;
const SPECIAL_EVENT_SPREAD_BULLET_RADIUS = 60;
const SPECIAL_EVENT_CENTRIFUGAL_DAMAGE_MULTIPLIER = 1.7;
const SPECIAL_EVENT_CENTRIFUGAL_SPEED_MULTIPLIER = 1.85;
const SPECIAL_EVENT_CENTRIFUGAL_ROTATE_ANGLE = Math.PI * 0.5;
const SPECIAL_EVENT_CENTRIFUGAL_ANGULAR_SPEED = Math.PI * 4.2;
const SPECIAL_EVENT_SPREAD_BULLET_COUNT = 2;
const SPECIAL_EVENT_SPREAD_BULLET_ANGLE = 20;
const SAFE_ZONE_START_PADDING = -40;
const SAFE_ZONE_FIXED_RADIUS_RATIO = 1;
const SAFE_ZONE_MIN_RADIUS = 140;
const SAFE_ZONE_DAMAGE_INTERVAL = 1;
const SAFE_ZONE_DAMAGE_PER_TICK = 4;
const SAFE_ZONE_POISON_START_SECONDS = 270;
const SAFE_ZONE_POISON_DAMAGE_PERCENT = 0.05;
const SAFE_ZONE_WARNING_SECONDS = 10;
const FINAL_STAGE_ALIVE_THRESHOLD = 2;
const MULTIPLAYER_BUSH_COUNT = 10;
const MULTIPLAYER_BUSH_RADIUS = 94;
const MULTIPLAYER_BUSH_MIN_GAP = 220;
const MULTIPLAYER_BUSH_SPAWN_PADDING = 120;
const MULTIPLAYER_BUSH_MIN_SPAWN_DISTANCE = 210;
const MULTIPLAYER_INITIAL_PICKUP_COUNT = 5;
const MULTIPLAYER_INITIAL_SPECIAL_EVENT_COUNT = 5;
const MULTIPLAYER_COVER_COUNT = 6;
const MULTIPLAYER_COVER_RADIUS = 34;
const MULTIPLAYER_COVER_HP = 5;
const MULTIPLAYER_COVER_MIN_GAP = 86;
const MULTIPLAYER_COVER_MIN_PLAYER_DISTANCE = 120;
const MULTIPLAYER_COVER_ATTACH_DISTANCE = 110;
const MULTIPLAYER_COVER_ATTACH_MIN_OFFSET = 60;
const MULTIPLAYER_COVER_ATTACH_MAX_OFFSET = 84;

const ROOM_STATE = {
  WAITING: 'waiting',
  COUNTDOWN: 'countdown',
  RUNNING: 'running',
  ENDED: 'ended',
};

const PICKUP_TYPE = {
  TAR: 'tar',
  BLACK_HOLE: 'blackHole',
  PORTAL: 'portal',
  SPEED_DOUBLE: 'speedDouble',
  DAMAGE_DOUBLE: 'damageDouble',
};

const SPECIAL_EVENT_TYPES = [
  'portal',
  'damageDouble',
  'speedDouble',
  'blackHole',
  'centrifugal',
  'spreadBullet',
];

const RESOURCE_WAVE_CONFIG = [
  {
    time: 0,
    resources: [],
    specialZones: [
      { specialType: 'blackHole', areaSlot: 'northWest' },
      { specialType: 'speedDouble', areaSlot: 'southEast' },
      { specialType: 'portal', entryX: -880, entryY: 520, exitX: 880, exitY: -520 },
      { specialType: 'damageDouble', areaSlot: 'northEast' },
      { specialType: 'centrifugal', areaSlot: 'southWest' },
    ],
  },
  {
    time: 60,
    resources: [],
    specialZones: [
      { specialType: 'centrifugal', areaSlot: 'northEast' },
      { specialType: 'damageDouble', areaSlot: 'southWest' },
      { specialType: 'portal', entryX: -920, entryY: -500, exitX: 920, exitY: 500 },
      { specialType: 'speedDouble', areaSlot: 'northWest' },
      { specialType: 'blackHole', areaSlot: 'southEast' },
    ],
  },
  {
    time: 120,
    resources: [],
    specialZones: [
      { specialType: 'damageDouble', areaSlot: 'northWest' },
      { specialType: 'blackHole', areaSlot: 'southEast' },
      { specialType: 'portal', entryX: -160, entryY: 580, exitX: 160, exitY: -580 },
      { specialType: 'centrifugal', areaSlot: 'northEast' },
    ],
  },
  {
    time: 180,
    resources: [],
    specialZones: [
      { specialType: 'speedDouble', areaSlot: 'northEast' },
      { specialType: 'centrifugal', areaSlot: 'southWest' },
      { specialType: 'damageDouble', areaSlot: 'northWest' },
      { specialType: 'speedDouble', areaSlot: 'southEast' },
      { specialType: 'blackHole', x: 0, y: 520 },
    ],
  },
  {
    time: 240,
    resources: [],
    specialZones: [
      { specialType: 'blackHole', areaSlot: 'northEast' },
      { specialType: 'speedDouble', areaSlot: 'southWest' },
      { specialType: 'centrifugal', areaSlot: 'northWest' },
      { specialType: 'damageDouble', areaSlot: 'southEast' },
    ],
  },
];

// ---------- Room (single room) ----------
const room = {
  id: 'room1',
  state: ROOM_STATE.WAITING,
  players: [],
  currentFrame: 0,
  tickTimer: null,
  startCountdown: null,
  countdownRemaining: 0,
  bullets: {},
  winnerPlayerId: -1,
  spawnSlots: [],
  energies: [],
  nextEnergyId: 1,
  energySpawnCd: 0,
  energySpawnPoints: [],
  bushSpawnPoints: [],
  bushes: [],
  mapBounds: {
    halfWidth: 1400,
    halfHeight: 900,
  },
  spawnCandidates: [],
  energyEggs: [],
  nextEnergyEggId: 1,
  elapsedSeconds: 0,
  energyEggMidgamePlan: 0,
  energyEggMidgameSpawned: 0,
  nextSpecialEventId: 1,
  specialEventSpawnCd: 0,
  activeSpecialEvents: [],
  pickups: [],
  nextPickupId: 1,
  energyWells: [],
  nextEnergyWellId: 1,
  tarPickups: [],
  nextTarPickupId: 1,
  tarPickupSpawnCd: 0,
  tarSpills: [],
  nextTarSpillId: 1,
  blackHolePickups: [],
  nextBlackHolePickupId: 1,
  blackHolePickupSpawnCd: 0,
  blackHoleZones: [],
  nextBlackHoleZoneId: 1,
  nextServerBulletId: 1,
  covers: [],
  nextCoverId: 1,
  safeZone: null,
  matchFlow: null,
  waveState: null,
  waveAreaSlots: null,
  smallEnergyNextCheckTime: 0,
  smallEnergyHubSlotIds: [],
};

const TURN_MAX_PLAYERS = 2;
const TURN_MAP_BOUNDS = {
  halfWidth: 320,
  halfHeight: 480,
};
const TURN_MAP_LAYOUT = {
  // Sync with `assets/map1/turn_defense_01.tmx` object layer `_tmLayerTurnAreas`.
  mapRect: { minX: -320, maxX: 320, minY: -480, maxY: 480 },
  buildAreas: {
    // Must match client's `deriveLayerAreas()` when roads sit on the map edges.
    A: { minX: -320, maxX: 320, minY: -448, maxY: -224 },
    B: { minX: -320, maxX: 320, minY: 224, maxY: 448 },
  },
  roadRects: {
    A: { minX: -320, maxX: 320, minY: -480, maxY: -448 },
    B: { minX: -320, maxX: 320, minY: 448, maxY: 480 },
  },
  assistArea: {
    minX: -320,
    maxX: 320,
    minY: -224,
    maxY: 224,
  },
  assistStaticObstacleCandidates: [
    { key: 'qiang_352_384', name: 'qiang', x: 32, y: 64, width: 32, height: 32 },
    { key: 'qiang_256_320', name: 'qiang', x: -64, y: 128, width: 32, height: 32 },
    { key: 'qiang_224_448', name: 'qiang', x: -96, y: 0, width: 32, height: 32 },
    { key: 'qiang_448_448', name: 'qiang', x: 128, y: 0, width: 32, height: 32 },
    { key: 'qiang_96_512', name: 'qiang', x: -224, y: -64, width: 32, height: 32 },
    { key: 'qiang_64_352', name: 'qiang', x: -256, y: 96, width: 32, height: 32 },
    { key: 'qiang_576_512', name: 'qiang', x: 256, y: -64, width: 32, height: 32 },
    { key: 'qiang_352_576', name: 'qiang', x: 32, y: -128, width: 32, height: 32 },
  ],
};

function getTurnRoadRect(camp) {
  return TURN_MAP_LAYOUT.roadRects[camp === 'B' ? 'B' : 'A'] || TURN_MAP_LAYOUT.roadRects.A;
}

function getTurnRoadCenterY(camp) {
  const road = getTurnRoadRect(camp);
  return Math.round((road.minY + road.maxY) / 2);
}

function getTurnRoadMoveMinX(camp) {
  return getTurnRoadRect(camp).minX + 18;
}

function getTurnRoadMoveMaxX(camp) {
  return getTurnRoadRect(camp).maxX - 18;
}

function getTurnActiveStaticObstacles(roomState) {
  return Array.isArray(roomState && roomState.activeStaticObstacles) ? roomState.activeStaticObstacles : [];
}

function randomizeTurnAssistStaticObstacles(roomState) {
  const candidates = Array.isArray(TURN_MAP_LAYOUT.assistStaticObstacleCandidates)
    ? TURN_MAP_LAYOUT.assistStaticObstacleCandidates.slice()
    : [];
  if (!roomState) {
    return [];
  }
  if (candidates.length <= 0) {
    roomState.activeStaticObstacles = [];
    return roomState.activeStaticObstacles;
  }
  // const count = Math.min(candidates.length, 4 + Math.floor(Math.random() * 5));
  const count = Math.min(candidates.length, 8);
  roomState.activeStaticObstacles = shuffle(candidates).slice(0, count).map((item) => ({ ...item }));
  return roomState.activeStaticObstacles;
}

function circleRectIntersects(circle, radius, rect) {
  if (!circle || !rect) {
    return false;
  }
  const nearestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const nearestY = clamp(circle.y, rect.y, rect.y + rect.height);
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy <= radius * radius;
}

function distanceBetweenPoints(a, b) {
  if (!a || !b) {
    return 0;
  }
  const dx = (Number(a.x) || 0) - (Number(b.x) || 0);
  const dy = (Number(a.y) || 0) - (Number(b.y) || 0);
  return Math.sqrt(dx * dx + dy * dy);
}

function isPointInTurnBuildArea(camp, point) {
  const area = TURN_MAP_LAYOUT.buildAreas[camp === 'B' ? 'B' : 'A'];
  return !!(
    point
    && area
    && point.x >= area.minX
    && point.x <= area.maxX
    && point.y >= area.minY
    && point.y <= area.maxY
  );
}

function getTurnTankHitCamp(roomState, bullet) {
  if (!roomState || !bullet || !roomState.tankPoses) {
    return '';
  }
  const bulletRadius = Number(TURN_CONFIG.bulletRadius) || 10;
  const tankRadius = 38;
  for (let i = 0; i < TURN_CAMPS.length; i++) {
    const camp = TURN_CAMPS[i];
    if (camp === bullet.camp && !canTurnBulletDamageOwnCamp(bullet)) {
      continue;
    }
    const pose = roomState.tankPoses[camp];
    if (pose && distanceBetweenPoints(bullet.position, pose) <= tankRadius + bulletRadius) {
      return camp;
    }
  }
  return '';
}

function canTurnBulletDamageOwnCamp(bullet) {
  return !!(bullet && bullet.hasBounced && bullet.passedOwnBuildArea);
}

function updateTurnBulletOwnBuildAreaPass(bullet, previousPosition = null) {
  if (!bullet || bullet.passedOwnBuildArea) {
    return;
  }
  bullet.passedOwnBuildArea = isPointInTurnBuildArea(bullet.camp, bullet.position)
    || (!!previousPosition && doesTurnSegmentCrossBuildArea(bullet.camp, previousPosition, bullet.position));
}

function doesTurnSegmentCrossBuildArea(camp, from, to) {
  const area = TURN_MAP_LAYOUT.buildAreas[camp === 'B' ? 'B' : 'A'];
  if (!area || !from || !to) {
    return false;
  }
  if (isPointInTurnBuildArea(camp, from) || isPointInTurnBuildArea(camp, to)) {
    return true;
  }
  const left = area.minX;
  const right = area.maxX;
  const bottom = area.minY;
  const top = area.maxY;
  return turnSegmentsIntersect(from, to, { x: left, y: bottom }, { x: right, y: bottom })
    || turnSegmentsIntersect(from, to, { x: right, y: bottom }, { x: right, y: top })
    || turnSegmentsIntersect(from, to, { x: right, y: top }, { x: left, y: top })
    || turnSegmentsIntersect(from, to, { x: left, y: top }, { x: left, y: bottom });
}

function turnSegmentsIntersect(a, b, c, d) {
  const abx = (Number(b && b.x) || 0) - (Number(a && a.x) || 0);
  const aby = (Number(b && b.y) || 0) - (Number(a && a.y) || 0);
  const acx = (Number(c && c.x) || 0) - (Number(a && a.x) || 0);
  const acy = (Number(c && c.y) || 0) - (Number(a && a.y) || 0);
  const adx = (Number(d && d.x) || 0) - (Number(a && a.x) || 0);
  const ady = (Number(d && d.y) || 0) - (Number(a && a.y) || 0);
  const cdx = (Number(d && d.x) || 0) - (Number(c && c.x) || 0);
  const cdy = (Number(d && d.y) || 0) - (Number(c && c.y) || 0);
  const cax = (Number(a && a.x) || 0) - (Number(c && c.x) || 0);
  const cay = (Number(a && a.y) || 0) - (Number(c && c.y) || 0);
  const cbx = (Number(b && b.x) || 0) - (Number(c && c.x) || 0);
  const cby = (Number(b && b.y) || 0) - (Number(c && c.y) || 0);
  const cross1 = abx * acy - aby * acx;
  const cross2 = abx * ady - aby * adx;
  const cross3 = cdx * cay - cdy * cax;
  const cross4 = cdx * cby - cdy * cbx;
  return cross1 * cross2 <= 0 && cross3 * cross4 <= 0;
}

const TURN_CONFIG = {
  buildSeconds: 30,
  attackSeconds: 25,
  waitBulletSeconds: 5,
  settleSeconds: 1,
  upgradeSeconds: 0,
  attackRounds: 1,
  crystalHp: 100,
  initialRoundResourceTotal: 3,
  roundResourceGrowth: 1,
  maxRoundResourceTotal: 12,
  slotCountPerRound: 3,
  slotMinResource: 1,
  slotMaxResource: 4,
  baseExp: 0,
  obstacleHitExp: 0,
  expWallDestroyExp: 0,
  energyWallRoundHeal: 10,
  bloodBlockHealPerStack: 1,
  crystalHitExp: 0,
  expNeed: 0,
  baseBulletCount: 1,
  bulletDamage: 10,
  baseBulletBounce: 0,
  roundBulletBounceGrowth: 1,
  roundBulletBounceMilestones: [2, 5, 10, 17],
  maxRoundBulletBounce: 4,
  baseFireInterval: 0,
  bulletBlockExtraShotInterval: 0.5,
  bulletMaxLifeSeconds: 30,
  bulletSimStepSeconds: 1 / 60,
  maxBulletResultDamage: 80,
  resourceMerge: {
    maxLevel: 5,
    levelValues: [1, 3, 6, 10, 15],
    typeLevels: {
      normal: [{ hp: 10 }, { hp: 20 }, { hp: 30 }, { hp: 40 }, { hp: 50 }],
      mirror: [{ hp: 10 }, { hp: 20 }, { hp: 30 }, { hp: 40 }, { hp: 50 }],
      missile_silo: [{ hp: 10, missileDamage: 10 }, { hp: 20, missileDamage: 15 }, { hp: 30, missileDamage: 20 }, { hp: 40, missileDamage: 25 }, { hp: 50, missileDamage: 30 }],
      bullet: [{ hp: 10 }, { hp: 20 }, { hp: 30 }, { hp: 40 }, { hp: 50 }],
      attack: [{ hp: 10, attack: 1 }, { hp: 20, attack: 2 }, { hp: 30, attack: 4 }, { hp: 40, attack: 8 }, { hp: 50, attack: 10 }],
      coin: [{ hp: 10, coin: 1 }, { hp: 20, coin: 2 }, { hp: 30, coin: 4 }, { hp: 40, coin: 8 }, { hp: 50, coin: 10 }],
      energy: [{ hp: 10, heal: 2 }, { hp: 20, heal: 4 }, { hp: 30, heal: 6 }, { hp: 40, heal: 10 }, { hp: 50, heal: 12 }],
      bleed: [{ hp: 10, healBlock: 1 }, { hp: 20, healBlock: 2 }, { hp: 30, healBlock: 3 }, { hp: 40, healBlock: 5 }, { hp: 50, healBlock: 6 }],
    },
  },
  assistZones: {
    spawnRule: {
      round1: 1,
      round2: 2,
      round3Plus: 3,
      maxSimultaneous: 3,
    },
    maxPlacementRetries: 24,
    enabledTypes: ['spread', 'damageBoost'],
    allowOverlap: false,
    types: {
      blackHole: {
        name: '黑洞',
        minRadius: 64,
        maxRadius: 92,
        blackHoleStrength: 9,
        blackHoleCurvePower: 1.0,
        blackHoleMaxOffsetPerTick: 8,
      },
      spread: {
        name: '扩散',
        minRadius: 58,
        maxRadius: 84,
        spreadSplitCount: 3,
        spreadSplitStepAngle: 15,
      },
      damageBoost: {
        name: '增伤',
        minRadius: 52,
        maxRadius: 78,
        damageBoostMaxMultiplier: 3,
      },
    },
  },
  obstacleGrid: 32,
  obstacleBaseHp: 10,
  obstacleMaxHp: 50,
  obstacleHpRules: {
    normal: {
      baseHp: 10,
      maxHp: 50,
    },
    mirror: {
      baseHp: 10,
      maxHp: 10,
    },
    exp: {
      baseHp: 10,
      maxHp: 30,
    },
    energy: {
      baseHp: 10,
      maxHp: 30,
    },
    bleed: {
      baseHp: 10,
      maxHp: 30,
    },
    bullet: {
      baseHp: 10,
      maxHp: 30,
    },
    attack: {
      baseHp: 10,
      maxHp: 30,
    },
    missile_silo: {
      baseHp: 10,
      maxHp: 10,
    },
    coin: {
      baseHp: 10,
      maxHp: 30,
    },
  },
  missileSilo: {
    directDamage: 10,
    explosionRadiusCells: 1,
    mainCannonChance: 0,
  },
  coinEconomy: {
    initialCoins: 0,
    baseRoundReward: 10,
    slotCost: 10,
    refreshCost: 5,
    refreshCostMultiplier: 2,
    destroyedEnemyResourceCoinReward: 1,
    enemyTankHitCoinReward: 1,
    perDestroyedEnemyCell: 1,
    perCoinBlockSettlement: 1,
  },
  settlementResourceRules: {
    exp: {
      expPerBlock: 5,
      baseMultiplier: 1,
    },
    energy: {
      healPerBlock: 2,
      baseMultiplier: 1,
      bloodBlockPerStack: 1,
    },
    bleed: {
      blockPerBlock: 1,
      baseMultiplier: 1,
    },
  },
  bulletSynergy: {
    blocksPerExtraShot: 4,
  },
  attackSynergy: {
    damagePerBlock: 1,
    tiers: [
      { minCount: 12, multiplier: 6 },
      { minCount: 8, multiplier: 4 },
      { minCount: 4, multiplier: 2 },
      { minCount: 0, multiplier: 1 },
    ],
  },
  bondRules: {
    maxLevel: 5,
    valueThresholds: [4, 10, 18, 28, 40],
    displayOrder: ['mirror', 'bullet', 'attack', 'coin', 'energy', 'bleed', 'missile_silo'],
    display: {
      mirror: {
        name: '反弹块羁绊',
        shortLabel: '削',
        description: '反弹块会削弱命中的弹体伤害。',
        levelDescriptions: ['弹体伤害降低70%', '弹体伤害降低60%', '弹体伤害降低50%', '弹体伤害降低40%', '弹体伤害降低30%'],
      },
      bullet: {
        name: '子弹块羁绊',
        shortLabel: '连',
        description: '子弹块会让攻击额外连射。',
        levelDescriptions: ['额外发射1发', '额外发射2发', '额外发射3发', '额外发射4发', '额外发射5发'],
      },
      attack: {
        name: '攻击块羁绊',
        shortLabel: '火',
        description: '攻击块会提升子弹伤害。',
        levelDescriptions: ['攻击价值x1.2', '攻击价值x1.5', '攻击价值x1.8', '攻击价值x2', '攻击价值x3'],
      },
      coin: {
        name: '金币块羁绊',
        shortLabel: '财',
        description: '金币块会提升摧毁敌方资源获得的金币。',
        levelDescriptions: ['金币奖励x1.2', '金币奖励x1.5', '金币奖励x1.8', '金币奖励x2', '金币奖励x3'],
      },
      energy: {
        name: '能量块羁绊',
        shortLabel: '愈',
        description: '能量块会在回合结算时回复基地生命。',
        levelDescriptions: ['治疗价值x1.2', '治疗价值x1.5', '治疗价值x1.8', '治疗价值x2', '治疗价值x3'],
      },
      bleed: {
        name: '滴血块羁绊',
        shortLabel: '枯',
        description: '滴血块会削减敌方回合结算治疗。',
        levelDescriptions: ['禁疗价值x1.2', '禁疗价值x1.5', '禁疗价值x1.8', '禁疗价值x2', '禁疗价值x3'],
      },
      missile_silo: {
        name: '导弹块羁绊',
        shortLabel: '锁',
        description: '导弹块会提高导弹锁定敌方坦克的概率。',
        levelDescriptions: ['锁定坦克概率+10%', '锁定坦克概率+30%', '锁定坦克概率+50%', '锁定坦克概率+75%', '锁定坦克概率+100%'],
      },
    },
    bullet: {
      blocksPerExtraShot: 4,
    },
    missile_silo: {
      amountPerBlock: 0,
      tiers: [],
      attributeMultipliers: [1.2, 1.5, 1.8, 2, 3],
      hitTankChanceBonuses: [0.1, 0.3, 0.5, 0.75, 1],
    },
    mirror: {
      amountPerBlock: 0,
      tiers: [],
      damageReductionRatios: [0.7, 0.6, 0.5, 0.4, 0.3],
    },
    attack: {
      amountPerBlock: 1,
      tiers: [
        { multiplier: 1.2 },
        { multiplier: 1.5 },
        { multiplier: 1.8 },
        { multiplier: 2 },
        { multiplier: 3 },
      ],
    },
    exp: {
      amountPerBlock: 5,
      tiers: [
        { multiplier: 1.2 },
        { multiplier: 1.5 },
        { multiplier: 1.8 },
        { multiplier: 2 },
        { multiplier: 3 },
      ],
    },
    energy: {
      amountPerBlock: 2,
      tiers: [
        { multiplier: 1.2 },
        { multiplier: 1.5 },
        { multiplier: 1.8 },
        { multiplier: 2 },
        { multiplier: 3 },
      ],
    },
    coin: {
      amountPerBlock: 1,
      tiers: [],
      attributeMultipliers: [1.2, 1.5, 1.8, 2, 3],
      bountyMultipliers: [1.2, 1.5, 1.8, 2, 3],
    },
    bleed: {
      amountPerBlock: 1,
      tiers: [
        { multiplier: 1.2 },
        { multiplier: 1.5 },
        { multiplier: 1.8 },
        { multiplier: 2 },
        { multiplier: 3 },
      ],
    },
  },
  obstacleSlotMaxResources: 4,
  obstacleSlots: [
    { type: 'normal', name: '普通方块', weight: 15 },
    { type: 'mirror', name: '反弹块', weight: 15 },
    { type: 'coin', name: '金币块', weight: 15 },
    { type: 'energy', name: '能量墙', weight: 15 },
    { type: 'bleed', name: '滴血块', weight: 15 },
    { type: 'bullet', name: '子弹块', weight: 10 },
    { type: 'attack', name: '攻击块', weight: 10 },
    { type: 'missile_silo', name: '导弹井', weight: 5 },
  ],
};
const TURN_PHASE = {
  WAITING: 'waiting',
  BUILD: 'build',
  ATTACK: 'attack',
  WAIT_BULLET: 'waitBullet',
  SETTLE: 'settle',
  UPGRADE: 'upgrade',
  FINISH: 'finish',
};
const TURN_CAMPS = ['A', 'B'];
const TURN_UPGRADE_POOL = [];
const TURN_OBSTACLE_SLOT_TYPES = ['normal', 'mirror', 'energy', 'bleed', 'bullet', 'attack', 'missile_silo', 'coin'];
const TURN_OBSTACLE_LAYOUT_LIBRARY = {
  1: [
    [{ x: 0, y: 0 }],
  ],
  2: [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }],
  ],
  3: [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
    [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  ],
  4: [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 0 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 0 }, { x: 2, y: 1 }],
  ],
};

const turnRooms = {};
let nextTurnRoomId = 1;

function sendJson(ws, payload) {
  if (isSocketOpen(ws)) {
    ws.send(JSON.stringify(payload));
  }
}

function logTurn(roomState, message, extra) {
  const suffix = extra == null ? '' : ` ${JSON.stringify(extra)}`;
  console.log(`[TurnRoom:${roomState.id}] ${message}${suffix}`);
}

function isSocketOpen(ws) {
  return ws && ws.readyState === WebSocket.OPEN;
}

function getTurnViewCamp(player, camp) {
  if (!player || !camp) {
    return camp || '';
  }
  if (camp === 'N') {
    return 'N';
  }
  return camp === player.camp ? 'A' : 'B';
}

function toCanonicalCamp(player, camp) {
  if (!player || !camp) {
    return camp || '';
  }
  if (camp === 'N') {
    return 'N';
  }
  return camp === 'A' ? player.camp : getEnemyCamp(player.camp);
}

function toPlayerViewPoint(player, point) {
  if (!point) {
    return point;
  }
  if (!player || player.camp === 'A') {
    return {
      x: point.x,
      y: point.y,
    };
  }
  return {
    x: point.x,
    y: -point.y,
  };
}

function toCanonicalPoint(player, point) {
  if (!point) {
    return point;
  }
  if (!player || player.camp === 'A') {
    return {
      x: point.x,
      y: point.y,
    };
  }
  return {
    x: point.x,
    y: -point.y,
  };
}

function mapZoneTypeToClient(zoneType) {
  if (zoneType === 'blackHole') return 'black_hole';
  if (zoneType === 'damageBoost') return 'damage_boost';
  return zoneType;
}

function mapZoneTypeFromClient(zoneType) {
  if (zoneType === 'black_hole') return 'blackHole';
  if (zoneType === 'damage_boost') return 'damageBoost';
  return zoneType;
}

function toPlayerViewLayout(player, layout) {
  if (!Array.isArray(layout)) {
    return layout;
  }
  if (!player || player.camp === 'A') {
    return layout.map((cell) => ({ x: Math.round(Number(cell && cell.x) || 0), y: Math.round(Number(cell && cell.y) || 0) }));
  }
  return layout.map((cell) => ({
    x: Math.round(Number(cell && cell.x) || 0),
    y: -Math.round(Number(cell && cell.y) || 0),
  }));
}

function mapUpgradeIdFromClient(optionId) {
  // 兼容旧客户端/旧存量升级 ID；主逻辑只使用新的 snake_case ID。
  // 没有一一等价关系的旧 ID 不做硬映射，避免把旧效果误套到新升级上。
  if (optionId === 'cover_resource_up' || optionId === 'coverResourceUp') return 'round_resource_add';
  if (optionId === 'bullet_bounce' || optionId === 'bulletBounce') return 'bullet_bounce_add';
  return optionId;
}

function getTurnUpgradeConfig(upgradeId) {
  return TURN_UPGRADE_POOL.find((option) => option && option.id === upgradeId) || null;
}

function getTurnUpgradeConfigsByEffect(type, targetResourceType) {
  return TURN_UPGRADE_POOL.filter((option) => {
    const effect = option && option.effect;
    if (!effect || effect.type !== type) {
      return false;
    }
    return !targetResourceType || effect.targetResourceType === targetResourceType;
  });
}

function getTurnUpgradeStackFromStacks(stacks, upgradeId) {
  return Math.max(0, Math.floor(Number(stacks && stacks[upgradeId]) || 0));
}

function getTurnUpgradeAddValue(stacks, type, targetResourceType) {
  return getTurnUpgradeConfigsByEffect(type, targetResourceType).reduce((total, option) => {
    const effect = option.effect || {};
    const stack = getTurnUpgradeStackFromStacks(stacks, option.id);
    if (stack <= 0 || effect.stackMode !== 'add') {
      return total;
    }
    const effectiveStack = option.maxStacks == null ? stack : Math.min(stack, Math.max(0, Number(option.maxStacks) || 0));
    return total + effectiveStack * (Number(effect.value) || 0);
  }, 0);
}

function getTurnUpgradeMultiplyValue(stacks, type, targetResourceType) {
  return getTurnUpgradeConfigsByEffect(type, targetResourceType).reduce((multiplier, option) => {
    const effect = option.effect || {};
    const stack = getTurnUpgradeStackFromStacks(stacks, option.id);
    if (stack <= 0) {
      return multiplier;
    }
    const effectiveStack = option.maxStacks == null ? stack : Math.min(stack, Math.max(0, Number(option.maxStacks) || 0));
    if (effect.stackMode === 'multiply') {
      return multiplier * Math.pow(Math.max(0, Number(effect.value) || 1), effectiveStack);
    }
    if (effect.stackMode === 'add') {
      return multiplier * (1 + effectiveStack * (Number(effect.value) || 0));
    }
    return multiplier;
  }, 1);
}

function buildTurnDerivedUpgradeState(stacks) {
  return {
    bulletBounceBonus: Math.max(0, Math.floor(getTurnUpgradeAddValue(stacks, 'bullet_bounce'))),
    firstBounceDamageMultiplier: Math.max(1, getTurnUpgradeMultiplyValue(stacks, 'first_bounce_damage')),
    roundResourceBonus: Math.max(0, Math.floor(getTurnUpgradeAddValue(stacks, 'round_resource'))),
    resourceHpBonusByType: {
      normal: Math.max(0, Math.floor(getTurnUpgradeAddValue(stacks, 'resource_hp', 'normal'))),
      exp: Math.max(0, Math.floor(getTurnUpgradeAddValue(stacks, 'resource_hp', 'exp'))),
      energy: Math.max(0, Math.floor(getTurnUpgradeAddValue(stacks, 'resource_hp', 'energy'))),
      bullet: Math.max(0, Math.floor(getTurnUpgradeAddValue(stacks, 'resource_hp', 'bullet'))),
      bleed: Math.max(0, Math.floor(getTurnUpgradeAddValue(stacks, 'resource_hp', 'bleed'))),
    },
    spreadExtraSplit: Math.max(0, Math.floor(getTurnUpgradeAddValue(stacks, 'spread_extra_split'))),
    damageBoostTempAttack: Math.max(0, Math.floor(getTurnUpgradeAddValue(stacks, 'damage_boost_temp_attack'))),
    blackHoleStrengthMultiplier: Math.max(1, getTurnUpgradeMultiplyValue(stacks, 'black_hole_strength')),
    missileExplosionRadiusBonus: Math.max(0, Math.floor(getTurnUpgradeAddValue(stacks, 'missile_explosion_radius'))),
    missileDamageBonus: Math.max(0, Math.floor(getTurnUpgradeAddValue(stacks, 'missile_damage'))),
    missileMainCannonChanceBonus: clamp(getTurnUpgradeAddValue(stacks, 'missile_main_cannon_chance'), 0, 1),
    coinDropMultiplier: Math.max(1, 1 + Math.max(0, getTurnUpgradeAddValue(stacks, 'coin_drop'))),
    expDropMultiplier: Math.max(1, 1 + Math.max(0, getTurnUpgradeAddValue(stacks, 'exp_drop'))),
  };
}

function refreshTurnDerivedUpgradeState(player) {
  if (!player) {
    return buildTurnDerivedUpgradeState({});
  }
  player.upgrades = player.upgrades || {};
  player.upgrades.stacks = player.upgrades.stacks || {};
  const derived = buildTurnDerivedUpgradeState(player.upgrades.stacks);
  player.upgrades.derived = derived;
  player.upgrades.bulletBounce = derived.bulletBounceBonus;
  player.upgrades.roundResourceBonus = derived.roundResourceBonus;
  return derived;
}

function buildTurnViewPayload(player, payload) {
  if (!payload || !player) {
    return payload;
  }
  const next = JSON.parse(JSON.stringify(payload));
  if (next.camp) {
    next.camp = getTurnViewCamp(player, next.camp);
  }
  if (next.actionCamp) {
    next.actionCamp = getTurnViewCamp(player, next.actionCamp);
  }
  if (next.winnerCamp) {
    next.winnerCamp = getTurnViewCamp(player, next.winnerCamp);
  }
  if (next.targetCamp) {
    next.targetCamp = getTurnViewCamp(player, next.targetCamp);
  }
  if (next.pose) {
    const posePoint = toPlayerViewPoint(player, next.pose);
    const aimPoint = toPlayerViewPoint(player, {
      x: next.pose.aimX,
      y: next.pose.aimY,
    });
    next.pose = {
      ...next.pose,
      x: Math.round(posePoint.x),
      y: Math.round(posePoint.y),
      aimX: Math.round(aimPoint.x),
      aimY: Math.round(aimPoint.y),
    };
  }
  if (next.crystals) {
    const crystals = {};
    Object.keys(next.crystals).forEach((camp) => {
      crystals[getTurnViewCamp(player, camp)] = {
        ...next.crystals[camp],
        camp: getTurnViewCamp(player, camp),
      };
    });
    next.crystals = crystals;
  }
  if (next.exp) {
    const exp = {};
    Object.keys(next.exp).forEach((camp) => {
      exp[getTurnViewCamp(player, camp)] = { ...next.exp[camp] };
    });
    next.exp = exp;
  }
  if (next.economy) {
    const economy = {};
    Object.keys(next.economy).forEach((camp) => {
      economy[getTurnViewCamp(player, camp)] = { ...next.economy[camp] };
    });
    next.economy = economy;
  }
  if (next.inventories) {
    const inventories = {};
    Object.keys(next.inventories).forEach((camp) => {
      const src = next.inventories[camp] || {};
      const slots = cloneTurnObstacleSlots(src.roundSlots).map((slot) => ({
        ...slot,
        layout: toPlayerViewLayout(player, normalizeObstacleLayout(slot.type, slot.layout, slot.count)),
        mirrorDir: '',
      }));
      inventories[getTurnViewCamp(player, camp)] = {
        ...src,
        roundSlots: slots,
      };
    });
    next.inventories = inventories;
  }
  if (next.upgrades) {
    const upgrades = {};
    Object.keys(next.upgrades).forEach((camp) => {
      upgrades[getTurnViewCamp(player, camp)] = { ...next.upgrades[camp] };
    });
    next.upgrades = upgrades;
  }
  if (Array.isArray(next.obstacles)) {
    next.obstacles = next.obstacles.map((obstacle) => {
      const point = toPlayerViewPoint(player, obstacle);
      return {
        ...obstacle,
        camp: getTurnViewCamp(player, obstacle.camp),
        x: Math.round(point.x),
        y: Math.round(point.y),
        layout: toPlayerViewLayout(player, normalizeObstacleLayout(obstacle.slotType || 'normal', obstacle.layout, obstacle.resourceCount)),
        mirrorDir: '',
      };
    });
  }
  if (Array.isArray(next.zones)) {
    next.zones = next.zones.map((zone) => {
      const point = toPlayerViewPoint(player, zone);
      return {
        ...zone,
        camp: getTurnViewCamp(player, zone.camp),
        zoneType: mapZoneTypeToClient(zone.zoneType),
        x: Math.round(point.x),
        y: Math.round(point.y),
      };
    });
  }
  if (Array.isArray(next.staticObstacles)) {
    next.staticObstacles = next.staticObstacles.map((obstacle) => {
      const point = toPlayerViewPoint(player, obstacle);
      return {
        ...obstacle,
        x: Math.round(point.x),
        y: Math.round(point.y),
      };
    });
  }
  if (next.tankPoses) {
    const tankPoses = {};
    Object.keys(next.tankPoses).forEach((camp) => {
      const pose = next.tankPoses[camp];
      const from = toPlayerViewPoint(player, pose);
      const aim = toPlayerViewPoint(player, {
        x: pose.aimX,
        y: pose.aimY,
      });
      tankPoses[getTurnViewCamp(player, camp)] = {
        x: Math.round(from.x),
        y: Math.round(from.y),
        aimX: Math.round(aim.x),
        aimY: Math.round(aim.y),
      };
    });
    next.tankPoses = tankPoses;
  }
  if (next.action) {
    const action = { ...next.action };
    if (Number.isFinite(action.x) || Number.isFinite(action.y)) {
      const point = toPlayerViewPoint(player, { x: Number(action.x) || 0, y: Number(action.y) || 0 });
      action.x = Math.round(point.x);
      action.y = Math.round(point.y);
    }
    if (Number.isFinite(action.fromX) || Number.isFinite(action.fromY)) {
      const point = toPlayerViewPoint(player, {
        x: Number(action.fromX) || 0,
        y: Number(action.fromY || (player.camp === 'A' ? -330 : -330)) || 0,
      });
      action.fromX = Math.round(point.x);
      action.fromY = Math.round(point.y);
    }
    if (Number.isFinite(action.aimX) || Number.isFinite(action.aimY)) {
      const point = toPlayerViewPoint(player, { x: Number(action.aimX) || 0, y: Number(action.aimY) || 0 });
      action.aimX = Math.round(point.x);
      action.aimY = Math.round(point.y);
    }
    next.action = action;
  }
  if (next.zone) {
    const point = toPlayerViewPoint(player, next.zone);
    next.zone = {
      ...next.zone,
      camp: getTurnViewCamp(player, next.zone.camp),
      zoneType: mapZoneTypeToClient(next.zone.zoneType),
      x: Math.round(point.x),
      y: Math.round(point.y),
    };
  }
  if (next.result && next.result.targetCamp) {
    next.result.targetCamp = getTurnViewCamp(player, next.result.targetCamp);
  }
  if (next.result && Array.isArray(next.result.missileEvents)) {
    next.result.missileEvents = next.result.missileEvents.map((event) => {
      const from = toPlayerViewPoint(player, event.from);
      const target = toPlayerViewPoint(player, event.target);
      const nextEvent = {
        ...event,
        triggerCamp: getTurnViewCamp(player, event.triggerCamp),
        targetCamp: getTurnViewCamp(player, event.targetCamp),
        from: from ? { x: Math.round(from.x), y: Math.round(from.y) } : from,
        target: target ? { x: Math.round(target.x), y: Math.round(target.y) } : target,
      };
      if (Array.isArray(event.damagedObstacles)) {
        nextEvent.damagedObstacles = event.damagedObstacles.map((item) => ({
          ...item,
          camp: getTurnViewCamp(player, item.camp),
        }));
      }
      if (Array.isArray(event.damagedCrystals)) {
        nextEvent.damagedCrystals = event.damagedCrystals.map((item) => ({
          ...item,
          camp: getTurnViewCamp(player, item.camp),
        }));
      }
      return nextEvent;
    });
  }
  if (Array.isArray(next.options)) {
    next.options = next.options.map((option) => ({
      ...option,
      id: option.id,
      desc: option.desc || option.title || '',
      name: option.name || option.title || option.id,
    }));
  }
  if (next.option) {
    next.option = {
      ...next.option,
      id: next.option.id,
      desc: next.option.desc || next.option.title || '',
      name: next.option.name || next.option.title || next.option.id,
    };
  }
  return next;
}

function createTurnPlayer(ws, camp, index) {
  const canonicalCamp = camp || 'A';
  const roadY = getTurnRoadCenterY(canonicalCamp);
  const defaultAimY = canonicalCamp === 'A' ? roadY + 120 : roadY - 120;
  const coinEconomy = TURN_CONFIG.coinEconomy || {};
  return {
    socket: ws,
    playerId: index,
    camp: canonicalCamp,
    disconnected: false,
    exp: 0,
    expNeed: TURN_CONFIG.expNeed,
    coins: Math.max(0, Math.floor(Number(coinEconomy.initialCoins) || 0)),
    placedThisRound: false,
    refreshCountThisRound: 0,
    inventory: {
      roundResourceTotal: TURN_CONFIG.initialRoundResourceTotal,
      roundSlots: [],
    },
    upgrades: {
      bulletBounce: 0,
      multiShot: 0,
      damageAdd: 0,
      roundResourceBonus: 0,
      stacks: {},
      derived: buildTurnDerivedUpgradeState({}),
    },
    pendingUpgradeOptions: [],
    tankPose: {
      x: 0,
      y: roadY,
      aimX: 0,
      aimY: defaultAimY,
    },
  };
}

function createTurnObstacleSlots() {
  return [];
}

function cloneTurnObstacleSlots(source) {
  if (!Array.isArray(source)) {
    return [];
  }
  return source.map((slot, index) => {
    const rawType = String(slot && slot.type || '');
    const normalizedType = rawType === 'blood' ? 'bleed' : rawType;
    const type = TURN_OBSTACLE_SLOT_TYPES.indexOf(normalizedType) >= 0 ? normalizedType : 'normal';
    const count = clamp(Math.round(Number(slot && slot.count) || 1), 1, TURN_CONFIG.slotMaxResource);
    const layout = normalizeObstacleLayout(type, slot && slot.layout, count);
    return {
      slotId: String(slot && slot.slotId ? slot.slotId : `slot_${index}`),
      type,
      count,
      layout,
      shapeKey: String(slot && slot.shapeKey ? slot.shapeKey : getObstacleLayoutKey(layout)),
      mirrorDir: '',
      placed: !!(slot && slot.placed),
      placedObstacleId: slot && slot.placedObstacleId ? String(slot.placedObstacleId) : '',
    };
  });
}

function buildObstacleLayout(type, count) {
  const safeCount = clamp(Math.round(Number(count) || 1), 1, TURN_CONFIG.obstacleSlotMaxResources);
  const candidates = TURN_OBSTACLE_LAYOUT_LIBRARY[safeCount] || TURN_OBSTACLE_LAYOUT_LIBRARY[1];
  const picked = candidates[Math.floor(Math.random() * candidates.length)] || TURN_OBSTACLE_LAYOUT_LIBRARY[1][0];
  return picked.map((cell) => ({ x: cell.x, y: cell.y }));
}

function normalizeObstacleLayout(type, layout, count) {
  if (type === 'blood') {
    type = 'bleed';
  }
  if (!Array.isArray(layout) || layout.length <= 0) {
    return buildObstacleLayout(type, count);
  }
  return layout.map((cell) => ({
    x: Math.round(Number(cell && cell.x) || 0),
    y: Math.round(Number(cell && cell.y) || 0),
  }));
}

function getObstacleLayoutKey(layout) {
  return (Array.isArray(layout) ? layout : [{ x: 0, y: 0 }])
    .map((cell) => `${Math.round(Number(cell.x) || 0)}:${Math.round(Number(cell.y) || 0)}`)
    .join('|');
}

function getResourceHpBaseAndMax(slotType) {
  const rule = TURN_CONFIG.obstacleHpRules && TURN_CONFIG.obstacleHpRules[slotType];
  const baseHp = Math.max(1, Number(rule && rule.baseHp) || (slotType === 'mirror' ? 10 : TURN_CONFIG.obstacleBaseHp));
  const maxHp = Math.max(baseHp, Number(rule && rule.maxHp) || (slotType === 'mirror' ? baseHp : TURN_CONFIG.obstacleMaxHp));
  return { baseHp, maxHp };
}

function getResourceMergeMaxLevel() {
  return Math.max(1, Math.floor(Number(TURN_CONFIG.resourceMerge && TURN_CONFIG.resourceMerge.maxLevel) || 1));
}

function getResourceLevelValue(resourceLevel) {
  const values = TURN_CONFIG.resourceMerge && Array.isArray(TURN_CONFIG.resourceMerge.levelValues)
    ? TURN_CONFIG.resourceMerge.levelValues
    : [1];
  const level = clamp(Math.floor(Number(resourceLevel) || 1), 1, getResourceMergeMaxLevel());
  const value = Math.max(1, Math.floor(Number(values[level - 1]) || 0));
  return value > 0 ? value : level;
}

function getResourceLevelConfig(slotType, resourceLevel) {
  const typeLevels = TURN_CONFIG.resourceMerge && TURN_CONFIG.resourceMerge.typeLevels;
  const list = typeLevels && Array.isArray(typeLevels[slotType]) ? typeLevels[slotType] : null;
  const level = clamp(Math.floor(Number(resourceLevel) || 1), 1, getResourceMergeMaxLevel());
  return list && list[level - 1] ? list[level - 1] : { hp: level * 10 };
}

function getResourceLevelHp(slotType, resourceLevel) {
  const config = getResourceLevelConfig(slotType, resourceLevel);
  return Math.max(1, Math.floor(Number(config.hp) || 1));
}

function getResourcePropertyValue(slotType, resourceLevel) {
  const config = getResourceLevelConfig(slotType, resourceLevel);
  if (slotType === 'attack') {
    return Math.max(0, Number(config.attack) || 0);
  }
  if (slotType === 'coin') {
    return Math.max(0, Number(config.coin) || 0);
  }
  if (slotType === 'energy') {
    return Math.max(0, Number(config.heal) || 0);
  }
  if (slotType === 'bleed') {
    return Math.max(0, Number(config.healBlock) || 0);
  }
  if (slotType === 'missile_silo') {
    return Math.max(0, Number(config.missileDamage) || 0);
  }
  return 0;
}

function normalizeObstacleCellLevels(obstacle) {
  const cellCount = Math.max(1, Array.isArray(obstacle && obstacle.layout) ? obstacle.layout.length : Math.floor(Number(obstacle && obstacle.resourceCount) || 1));
  const source = Array.isArray(obstacle && obstacle.cellLevels)
    ? obstacle.cellLevels
    : Array.isArray(obstacle && obstacle.levels)
      ? obstacle.levels
      : null;
  const fallback = clamp(Math.floor(Number((obstacle && (obstacle.resourceLevel || obstacle.level)) || 1)), 1, getResourceMergeMaxLevel());
  const result = [];
  for (let i = 0; i < cellCount; i++) {
    result.push(clamp(Math.floor(Number(source && source[i]) || fallback), 1, getResourceMergeMaxLevel()));
  }
  return result;
}

function getObstacleCellMaxHpForLevel(slotType, level, roomState = null, camp = '', derivedOverride = null) {
  return getResourceLevelHp(slotType, level);
}

function getObstacleMaxHpForLevels(slotType, cellLevels, roomState = null, camp = '', derivedOverride = null) {
  const levels = Array.isArray(cellLevels) && cellLevels.length > 0 ? cellLevels : [1];
  return levels.reduce((total, level) => total + getObstacleCellMaxHpForLevel(slotType, level, roomState, camp, derivedOverride), 0);
}

function getTurnPlayerByCamp(roomState, camp) {
  return roomState && Array.isArray(roomState.players)
    ? roomState.players.find((player) => player && player.camp === camp)
    : null;
}

function getResourceHpUpgradeBonus(roomState, camp, slotType, derivedOverride = null) {
  if (!camp || slotType === 'mirror' || slotType === 'attack' || slotType === 'missile_silo' || slotType === 'coin') {
    return 0;
  }
  const player = getTurnPlayerByCamp(roomState, camp);
  const derived = derivedOverride || refreshTurnDerivedUpgradeState(player);
  const bonusMap = derived && derived.resourceHpBonusByType;
  return Math.max(0, Math.floor(Number(bonusMap && bonusMap[slotType]) || 0));
}

function getObstacleMaxHp(slotType, resourceCount, roomState = null, camp = '', derivedOverride = null) {
  if (slotType === 'normal') {
    const rule = getResourceHpBaseAndMax(slotType);
    const baseHp = Math.min(rule.maxHp, rule.baseHp + getResourceHpUpgradeBonus(roomState, camp, slotType, derivedOverride));
    return baseHp * Math.max(1, Math.round(Number(resourceCount) || 1));
  }
  if (slotType === 'mirror') {
    const rule = getResourceHpBaseAndMax(slotType);
    return rule.baseHp * Math.max(1, Math.round(Number(resourceCount) || 1));
  }
  if (slotType === 'exp') {
    const rule = getResourceHpBaseAndMax(slotType);
    const baseHp = Math.min(rule.maxHp, rule.baseHp + getResourceHpUpgradeBonus(roomState, camp, slotType, derivedOverride));
    return baseHp * Math.max(1, Math.round(Number(resourceCount) || 1));
  }
  if (slotType === 'energy') {
    const rule = getResourceHpBaseAndMax(slotType);
    const baseHp = Math.min(rule.maxHp, rule.baseHp + getResourceHpUpgradeBonus(roomState, camp, slotType, derivedOverride));
    return baseHp * Math.max(1, Math.round(Number(resourceCount) || 1));
  }
  if (slotType === 'bleed') {
    const rule = getResourceHpBaseAndMax(slotType);
    const baseHp = Math.min(rule.maxHp, rule.baseHp + getResourceHpUpgradeBonus(roomState, camp, slotType, derivedOverride));
    return baseHp * Math.max(1, Math.round(Number(resourceCount) || 1));
  }
  if (slotType === 'bullet') {
    const rule = getResourceHpBaseAndMax(slotType);
    const baseHp = Math.min(rule.maxHp, rule.baseHp + getResourceHpUpgradeBonus(roomState, camp, slotType, derivedOverride));
    return baseHp * Math.max(1, Math.round(Number(resourceCount) || 1));
  }
  if (slotType === 'attack') {
    const rule = getResourceHpBaseAndMax(slotType);
    return rule.baseHp * Math.max(1, Math.round(Number(resourceCount) || 1));
  }
  if (slotType === 'missile_silo') {
    const rule = getResourceHpBaseAndMax(slotType);
    return rule.baseHp * Math.max(1, Math.round(Number(resourceCount) || 1));
  }
  if (slotType === 'coin') {
    const rule = getResourceHpBaseAndMax(slotType);
    return rule.baseHp * Math.max(1, Math.round(Number(resourceCount) || 1));
  }
  return Math.min(TURN_CONFIG.obstacleMaxHp, TURN_CONFIG.obstacleBaseHp * Math.max(1, Math.round(Number(resourceCount) || 1)));
}

function getObstacleCellMaxHp(slotType, roomState = null, camp = '', derivedOverride = null) {
  if (slotType === 'mirror') {
    return getResourceHpBaseAndMax(slotType).baseHp;
  }
  if (slotType === 'normal') {
    const rule = getResourceHpBaseAndMax(slotType);
    return Math.min(rule.maxHp, rule.baseHp + getResourceHpUpgradeBonus(roomState, camp, slotType, derivedOverride));
  }
  if (slotType === 'energy') {
    const rule = getResourceHpBaseAndMax(slotType);
    return Math.min(rule.maxHp, rule.baseHp + getResourceHpUpgradeBonus(roomState, camp, slotType, derivedOverride));
  }
  if (slotType === 'bleed') {
    const rule = getResourceHpBaseAndMax(slotType);
    return Math.min(rule.maxHp, rule.baseHp + getResourceHpUpgradeBonus(roomState, camp, slotType, derivedOverride));
  }
  if (slotType === 'bullet') {
    const rule = getResourceHpBaseAndMax(slotType);
    return Math.min(rule.maxHp, rule.baseHp + getResourceHpUpgradeBonus(roomState, camp, slotType, derivedOverride));
  }
  if (slotType === 'attack') {
    return getResourceHpBaseAndMax(slotType).baseHp;
  }
  if (slotType === 'missile_silo') {
    return getResourceHpBaseAndMax(slotType).baseHp;
  }
  if (slotType === 'coin') {
    return getResourceHpBaseAndMax(slotType).baseHp;
  }
  return getObstacleMaxHp(slotType, 1, roomState, camp, derivedOverride);
}

function buildExpCellHpList(resourceCount, cellCount, roomState = null, camp = '', derivedOverride = null) {
  const safeCells = Math.max(1, Math.floor(Number(cellCount) || 1));
  const maxHp = getObstacleMaxHp('exp', resourceCount, roomState, camp, derivedOverride);
  const basePerCell = Math.floor(maxHp / safeCells);
  const remainder = maxHp % safeCells;
  const result = [];
  for (let i = 0; i < safeCells; i++) {
    result.push(basePerCell + (i < remainder ? 1 : 0));
  }
  return result;
}

function buildObstacleCellHp(slotType, resourceCount, cellCount, source, roomState = null, camp = '', derivedOverride = null, cellLevels = null) {
  if (slotType !== 'exp') {
    const defaultHp = getObstacleCellMaxHp(slotType, roomState, camp, derivedOverride);
    return Array.from({ length: Math.max(1, Math.floor(Number(cellCount) || 1)) }, (_, index) => {
      const level = Array.isArray(cellLevels) ? cellLevels[index] : 1;
      const fallbackHp = getResourceLevelHp(slotType, level);
      const hp = Array.isArray(source) ? Math.max(0, Number(source[index]) || 0) : fallbackHp;
      return hp > 0 ? hp : fallbackHp;
    });
  }
  const defaults = buildExpCellHpList(resourceCount, cellCount, roomState, camp, derivedOverride);
  return defaults.map((fallbackHp, index) => {
    const hp = Array.isArray(source) ? Math.max(0, Number(source[index]) || 0) : fallbackHp;
    return hp > 0 ? hp : fallbackHp;
  });
}

function sumObstacleCellHp(obstacle) {
  if (!obstacle || !Array.isArray(obstacle.cellHp)) {
    return 0;
  }
  return obstacle.cellHp.reduce((total, hp) => total + Math.max(0, Number(hp) || 0), 0);
}

function applyObstacleDamage(roomState, obstacleId, cellIndex, damage) {
  const obstacle = obstacleId ? roomState.obstacles[obstacleId] : null;
  if (!obstacle || !Array.isArray(obstacle.cellHp) || !Array.isArray(obstacle.layout)) {
    return null;
  }
  if (cellIndex < 0 || cellIndex >= obstacle.cellHp.length || cellIndex >= obstacle.layout.length) {
    return null;
  }
  const safeDamage = Math.max(0, Math.floor(Number(damage) || 0));
  const before = Math.max(0, Number(obstacle.cellHp[cellIndex]) || 0);
  const after = Math.max(0, before - safeDamage);
  const appliedDamage = before - after;
  obstacle.cellHp[cellIndex] = after;
  obstacle.cellHpList = obstacle.cellHp.slice();
  obstacle.hp = sumObstacleCellHp(obstacle);
  obstacle.cellLevels = normalizeObstacleCellLevels(obstacle);
  obstacle.resourceLevel = Math.max(1, ...obstacle.cellLevels);
  obstacle.level = obstacle.resourceLevel;
  obstacle.maxHp = getObstacleMaxHpForLevels(obstacle.slotType || 'normal', obstacle.cellLevels, roomState, obstacle.camp);
  if (after > 0) {
    return { obstacle, appliedDamage, destroyedCell: false, destroyedObstacle: false };
  }
  obstacle.layout.splice(cellIndex, 1);
  obstacle.cellHp.splice(cellIndex, 1);
  if (Array.isArray(obstacle.cellLevels)) {
    obstacle.cellLevels.splice(cellIndex, 1);
  }
  obstacle.levels = obstacle.cellLevels ? obstacle.cellLevels.slice() : [];
  obstacle.resourceCount = Math.max(0, obstacle.layout.length);
  obstacle.cellLevels = normalizeObstacleCellLevels(obstacle);
  obstacle.levels = obstacle.cellLevels.slice();
  obstacle.resourceLevel = obstacle.cellLevels.length > 0 ? Math.max(1, ...obstacle.cellLevels) : 1;
  obstacle.level = obstacle.resourceLevel;
  obstacle.shapeKey = getObstacleLayoutKey(obstacle.layout);
  obstacle.hp = sumObstacleCellHp(obstacle);
  obstacle.cellHpList = obstacle.cellHp.slice();
  obstacle.maxHp = getObstacleMaxHpForLevels(obstacle.slotType || 'normal', obstacle.cellLevels, roomState, obstacle.camp);
  if (obstacle.hp > 0) {
    return { obstacle, appliedDamage, destroyedCell: true, destroyedObstacle: false };
  }
  const owner = roomState.players.find((item) => item.camp === obstacle.camp);
  const slot = owner ? findTurnRoundSlot(owner, obstacle.originSlotId) : null;
  if (slot && slot.placedObstacleId === obstacleId) {
    slot.placedObstacleId = '';
    slot.placed = false;
  }
  delete roomState.obstacles[obstacleId];
  return { obstacle, appliedDamage, destroyedCell: true, destroyedObstacle: true };
}

function getTurnUpgradeStack(player, upgradeId) {
  return Math.max(0, Number(player && player.upgrades && player.upgrades.stacks && player.upgrades.stacks[upgradeId]) || 0);
}

function getTurnRoundResourceTotal(player, displayRound) {
  const round = Math.max(1, Number(displayRound) || 1);
  const derived = refreshTurnDerivedUpgradeState(player);
  const bonus = Math.max(0, Number(derived && derived.roundResourceBonus) || 0);
  const total = TURN_CONFIG.initialRoundResourceTotal + (round - 1) * TURN_CONFIG.roundResourceGrowth + bonus;
  return clamp(total, TURN_CONFIG.slotCountPerRound, TURN_CONFIG.maxRoundResourceTotal);
}

function randomTurnObstacleType() {
  const slots = Array.isArray(TURN_CONFIG.obstacleSlots) ? TURN_CONFIG.obstacleSlots : [];
  let totalWeight = 0;
  for (let i = 0; i < slots.length; i++) {
    totalWeight += Math.max(0, Number(slots[i] && slots[i].weight) || 0);
  }
  if (totalWeight <= 0) {
    return TURN_OBSTACLE_SLOT_TYPES[Math.floor(Math.random() * TURN_OBSTACLE_SLOT_TYPES.length)] || 'normal';
  }
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const type = slot && TURN_OBSTACLE_SLOT_TYPES.indexOf(slot.type) >= 0 ? slot.type : '';
    const weight = Math.max(0, Number(slot && slot.weight) || 0);
    if (!type || weight <= 0) {
      continue;
    }
    roll -= weight;
    if (roll < 0) {
      return type;
    }
  }
  return 'normal';
}

function splitTurnRoundResources(totalResources) {
  const remainingStart = clamp(Math.floor(Number(totalResources) || 0), TURN_CONFIG.slotCountPerRound, TURN_CONFIG.maxRoundResourceTotal);
  let remaining = remainingStart;
  const result = [];
  for (let i = 0; i < TURN_CONFIG.slotCountPerRound; i++) {
    const left = TURN_CONFIG.slotCountPerRound - i;
    const minAllowed = Math.max(TURN_CONFIG.slotMinResource, remaining - (left - 1) * TURN_CONFIG.slotMaxResource);
    const maxAllowed = Math.min(TURN_CONFIG.slotMaxResource, remaining - (left - 1) * TURN_CONFIG.slotMinResource);
    const picked = i === TURN_CONFIG.slotCountPerRound - 1 ? remaining : Math.floor(randomBetween(minAllowed, maxAllowed + 0.999));
    result.push(picked);
    remaining -= picked;
  }
  return result;
}

function createTurnRoundSlots(player, roomState, displayRound) {
  const totalResources = getTurnRoundResourceTotal(player, displayRound);
  const counts = splitTurnRoundResources(totalResources);
  player.inventory = player.inventory || {};
  player.inventory.roundResourceTotal = totalResources;
  player.inventory.roundSlots = counts.map((count, index) => createTurnRoundSlot(player, displayRound, index, count));
  return player.inventory.roundSlots;
}

function createTurnRoundSlot(player, displayRound, index, count) {
  const type = randomTurnObstacleType();
  const layout = buildObstacleLayout(type, count);
  const shapeKey = getObstacleLayoutKey(layout);
  return {
    slotId: `${player.camp}_r${displayRound}_s${index}`,
    type,
    count,
    layout,
    shapeKey,
    mirrorDir: '',
    placed: false,
    placedObstacleId: '',
  };
}

function findTurnRoundSlot(player, slotId) {
  const slots = player && player.inventory && Array.isArray(player.inventory.roundSlots) ? player.inventory.roundSlots : [];
  return slots.find((slot) => slot && slot.slotId === slotId) || null;
}

function countTurnLivingResource(roomState, camp, slotType) {
  return Object.keys(roomState.obstacles).reduce((total, id) => {
    const obstacle = roomState.obstacles[id];
    if (!obstacle || obstacle.camp !== camp || obstacle.slotType !== slotType) {
      return total;
    }
    const levels = normalizeObstacleCellLevels(obstacle);
    return total + levels.reduce((sum, level) => sum + getResourceLevelValue(level), 0);
  }, 0);
}

function createTurnBondCountMap(source) {
  return {
    bullet: Math.max(0, Math.floor(Number(source && source.bullet) || 0)),
    attack: Math.max(0, Math.floor(Number(source && source.attack) || 0)),
    exp: Math.max(0, Math.floor(Number(source && source.exp) || 0)),
    energy: Math.max(0, Math.floor(Number(source && source.energy) || 0)),
    bleed: Math.max(0, Math.floor(Number(source && source.bleed) || 0)),
    coin: Math.max(0, Math.floor(Number(source && source.coin) || 0)),
    missile_silo: Math.max(0, Math.floor(Number(source && source.missile_silo) || 0)),
    mirror: Math.max(0, Math.floor(Number(source && source.mirror) || 0)),
  };
}

function buildTurnBondCountsFromRoom(roomState, camp) {
  return createTurnBondCountMap({
    bullet: countTurnLivingResource(roomState, camp, 'bullet'),
    attack: countTurnLivingResource(roomState, camp, 'attack'),
    exp: countTurnLivingResource(roomState, camp, 'exp'),
    energy: countTurnLivingResource(roomState, camp, 'energy'),
    bleed: countTurnLivingResource(roomState, camp, 'bleed'),
    coin: countTurnLivingResource(roomState, camp, 'coin'),
    missile_silo: countTurnLivingResource(roomState, camp, 'missile_silo'),
    mirror: countTurnLivingResource(roomState, camp, 'mirror'),
  });
}

function sumTurnLivingResourceProperty(roomState, camp, slotType) {
  return Object.keys(roomState.obstacles).reduce((total, id) => {
    const obstacle = roomState.obstacles[id];
    if (!obstacle || obstacle.camp !== camp || obstacle.slotType !== slotType) {
      return total;
    }
    const levels = normalizeObstacleCellLevels(obstacle);
    return total + levels.reduce((sum, level) => sum + getResourcePropertyValue(slotType, level), 0);
  }, 0);
}

function buildTurnBondPropertiesFromRoom(roomState, camp) {
  return createTurnBondCountMap({
    bullet: 0,
    attack: sumTurnLivingResourceProperty(roomState, camp, 'attack'),
    exp: 0,
    energy: sumTurnLivingResourceProperty(roomState, camp, 'energy'),
    bleed: sumTurnLivingResourceProperty(roomState, camp, 'bleed'),
    coin: sumTurnLivingResourceProperty(roomState, camp, 'coin'),
    missile_silo: sumTurnLivingResourceProperty(roomState, camp, 'missile_silo'),
    mirror: 0,
  });
}

function getTurnCoinSettlementGain(roomState, camp) {
  const counts = buildTurnBondCountsFromRoom(roomState, camp);
  const safeCount = Math.max(0, Math.floor(Number(counts.coin) || 0));
  if (safeCount <= 0) {
    return 0;
  }
  const economy = TURN_CONFIG.coinEconomy || {};
  const perBlock = Math.max(0, Number(economy.perCoinBlockSettlement) || 0);
  const properties = buildTurnBondPropertiesFromRoom(roomState, camp);
  const baseCoin = Number.isFinite(properties.coin) && Number(properties.coin) > 0 ? Math.max(0, Number(properties.coin) || 0) : safeCount * perBlock;
  return getTurnBondValue('coin', safeCount, baseCoin);
}

function getTurnPlayerEconomy(player) {
  const economy = TURN_CONFIG.coinEconomy || {};
  const refreshCost = getTurnRefreshCost(player);
  return {
    coins: Math.max(0, Math.floor(Number(player && player.coins) || 0)),
    placedThisRound: !!(player && player.placedThisRound),
    slotCost: getTurnSlotCost(),
    refreshCost,
    canRefresh: canTurnPlayerRefreshAndStillBuy(player),
  };
}

function getTurnSlotCost() {
  const economy = TURN_CONFIG.coinEconomy || {};
  return Math.max(0, Math.floor(Number(economy.slotCost) || 0));
}

function getTurnRefreshCost(player) {
  const economy = TURN_CONFIG.coinEconomy || {};
  const baseCost = Math.max(0, Math.floor(Number(economy.refreshCost) || 0));
  const multiplier = Math.max(1, Number(economy.refreshCostMultiplier) || 1);
  const refreshCount = Math.max(0, Math.floor(Number(player && player.refreshCountThisRound) || 0));
  return Math.floor(baseCost * Math.pow(multiplier, refreshCount));
}

function canTurnPlayerRefreshAndStillBuy(player) {
  if (!player) {
    return false;
  }
  const coins = Math.max(0, Math.floor(Number(player.coins) || 0));
  return coins >= getTurnRefreshCost(player) + getTurnSlotCost();
}

function getTurnBondMultiplier(type, count) {
  const level = getTurnBondLevel(count);
  if (level <= 0) {
    return 0;
  }
  const rule = TURN_CONFIG.bondRules && TURN_CONFIG.bondRules[type];
  const tiers = rule && Array.isArray(rule.tiers) ? rule.tiers : [];
  const tier = tiers[Math.min(level - 1, tiers.length - 1)];
  return Math.max(0, Number(tier && tier.multiplier) || 0);
}

function getTurnBondAttributeMultiplier(type, count) {
  const level = getTurnBondLevel(count);
  if (level <= 0) {
    return 1;
  }
  const rule = TURN_CONFIG.bondRules && TURN_CONFIG.bondRules[type];
  let values = rule && Array.isArray(rule.attributeMultipliers) ? rule.attributeMultipliers : [];
  if (values.length <= 0 && rule && Array.isArray(rule.tiers)) {
    values = rule.tiers.map((tier) => Number(tier && tier.multiplier) || 0);
  }
  if (values.length <= 0 && rule && Array.isArray(rule.bountyMultipliers)) {
    values = rule.bountyMultipliers;
  }
  return Math.max(1, Number(values[Math.min(level - 1, Math.max(0, values.length - 1))]) || 1);
}

function getTurnBondLevel(count) {
  const safeCount = Math.max(0, Math.floor(Number(count) || 0));
  if (safeCount <= 0) {
    return 0;
  }
  const thresholds = TURN_CONFIG.bondRules && Array.isArray(TURN_CONFIG.bondRules.valueThresholds)
    ? TURN_CONFIG.bondRules.valueThresholds
    : [];
  const maxLevel = Math.max(1, Math.floor(Number(TURN_CONFIG.bondRules && TURN_CONFIG.bondRules.maxLevel) || thresholds.length || 1));
  let tierIndex = -1;
  for (let i = 0; i < thresholds.length && i < maxLevel; i++) {
    if (safeCount >= Math.max(0, Number(thresholds[i]) || 0)) {
      tierIndex = i;
    }
  }
  if (tierIndex < 0) {
    return 0;
  }
  return tierIndex + 1;
}

function getTurnBulletBondExtraShots(count) {
  return getTurnBondLevel(count);
}

function getTurnBondBountyMultiplier(type, count) {
  const level = getTurnBondLevel(count);
  if (level <= 0) {
    return 1;
  }
  const rule = TURN_CONFIG.bondRules && TURN_CONFIG.bondRules[type];
  const values = rule && Array.isArray(rule.bountyMultipliers) ? rule.bountyMultipliers : [];
  return Math.max(1, Number(values[Math.min(level - 1, values.length - 1)]) || 1);
}

function getTurnMissileSiloHitTankChanceBonus(count) {
  const level = getTurnBondLevel(count);
  const rule = TURN_CONFIG.bondRules && TURN_CONFIG.bondRules.missile_silo;
  const values = rule && Array.isArray(rule.hitTankChanceBonuses) ? rule.hitTankChanceBonuses : [];
  return level > 0 ? clamp(Number(values[Math.min(level - 1, values.length - 1)]) || 0, 0, 1) : 0;
}

function getTurnMirrorDamageReductionRatio(count) {
  const level = getTurnBondLevel(count);
  const rule = TURN_CONFIG.bondRules && TURN_CONFIG.bondRules.mirror;
  const values = rule && Array.isArray(rule.damageReductionRatios) ? rule.damageReductionRatios : [];
  return level > 0 ? clamp(Number(values[Math.min(level - 1, values.length - 1)]) || 0, 0, 1) : 0;
}

function getTurnBondValue(type, count, propertyValue) {
  const safeCount = Math.max(0, Math.floor(Number(count) || 0));
  if (safeCount <= 0) {
    return 0;
  }
  const rule = TURN_CONFIG.bondRules && TURN_CONFIG.bondRules[type];
  const amountPerBlock = Math.max(0, Number(rule && rule.amountPerBlock) || 0);
  const effectiveMultiplier = getTurnBondAttributeMultiplier(type, safeCount);
  const baseValue = Number.isFinite(propertyValue) && Number(propertyValue) > 0 ? Math.max(0, Number(propertyValue) || 0) : safeCount * amountPerBlock;
  return Math.floor(baseValue * effectiveMultiplier);
}

function getTurnAttackBondBulletDamage(baseDamage, upgradeDamage, attackCount, propertyValue) {
  const safeCount = Math.max(0, Math.floor(Number(attackCount) || 0));
  const base = Math.max(1, Math.floor(Number(baseDamage) || 1)) + Math.max(0, Math.floor(Number(upgradeDamage) || 0));
  const rule = TURN_CONFIG.bondRules && TURN_CONFIG.bondRules.attack;
  const amountPerBlock = Math.max(0, Number(rule && rule.amountPerBlock) || 0);
  const attackProperty = Number.isFinite(propertyValue) && Number(propertyValue) > 0 ? Math.max(0, Number(propertyValue) || 0) : safeCount * amountPerBlock;
  if (attackProperty <= 0) {
    return base;
  }
  const effectiveMultiplier = getTurnBondAttributeMultiplier('attack', safeCount);
  return Math.max(base + attackProperty, Math.floor((base + attackProperty) * effectiveMultiplier));
}

function getTurnRoundBulletBounce(roundIndex) {
  const round = Math.max(1, Math.floor(Number(roundIndex) || 1));
  const baseBounce = Math.max(0, Math.floor(Number(TURN_CONFIG.baseBulletBounce) || 0));
  const maxBounce = Math.max(baseBounce, Math.floor(Number(TURN_CONFIG.maxRoundBulletBounce) || baseBounce));
  const milestones = Array.isArray(TURN_CONFIG.roundBulletBounceMilestones)
    ? TURN_CONFIG.roundBulletBounceMilestones
      .map((value) => Math.max(1, Math.floor(Number(value) || 0)))
      .filter((value) => value > 0)
      .sort((a, b) => a - b)
    : [];
  if (milestones.length > 0) {
    let milestoneBounce = 0;
    for (let i = 0; i < milestones.length; i++) {
      if (round >= milestones[i]) {
        milestoneBounce += 1;
      }
    }
    return Math.min(maxBounce, baseBounce + milestoneBounce);
  }
  const growth = Math.max(0, Math.floor(Number(TURN_CONFIG.roundBulletBounceGrowth) || 0));
  return Math.min(maxBounce, baseBounce + Math.max(0, round - 1) * growth);
}

function buildTurnAttackSnapshotFromCounts(counts, player, roundIndex, properties = null) {
  const baseBulletDamage = Math.max(1, Number(TURN_CONFIG.bulletDamage) || 20);
  const safeCounts = createTurnBondCountMap(counts);
  const derived = refreshTurnDerivedUpgradeState(player);
  const extraShotsFromUpgrade = Math.max(0, Number(player.upgrades.multiShot) || 0);
  const extraShotsFromBulletBlock = getTurnBulletBondExtraShots(safeCounts.bullet);
  const bonusDamageFromUpgrade = Math.max(0, Number(player.upgrades.damageAdd) || 0);
  const attackMultiplier = getTurnBondMultiplier('attack', safeCounts.attack);
  const bulletDamage = getTurnAttackBondBulletDamage(baseBulletDamage, bonusDamageFromUpgrade, safeCounts.attack, properties && properties.attack);
  const bonusDamageFromAttackBlock = Math.max(0, bulletDamage - baseBulletDamage - bonusDamageFromUpgrade);
  const bulletBounce = Math.max(0, Number(derived.bulletBounceBonus) || 0);
  const baseBulletCount = Math.max(1, Math.floor(Number(TURN_CONFIG.baseBulletCount) || 1));
  const totalShots = Math.max(1, baseBulletCount + extraShotsFromUpgrade + extraShotsFromBulletBlock);
  return {
    bulletBlockCount: safeCounts.bullet,
    attackBlockCount: safeCounts.attack,
    attackMultiplier,
    totalShots,
    extraShotsFromUpgrade,
    extraShotsFromBulletBlock,
    bonusDamageFromUpgrade,
    bonusDamageFromAttackBlock,
    bulletDamage,
    bulletBounce: getTurnRoundBulletBounce(roundIndex) + bulletBounce,
    firstBounceDamageMultiplier: Math.max(1, Number(derived.firstBounceDamageMultiplier) || 1),
    spreadExtraSplit: Math.max(0, Number(derived.spreadExtraSplit) || 0),
    damageBoostTempAttack: Math.max(0, Number(derived.damageBoostTempAttack) || 0),
    blackHoleStrengthMultiplier: Math.max(1, Number(derived.blackHoleStrengthMultiplier) || 1),
    shotsLeft: totalShots,
  };
}

function buildTurnAttackSnapshot(roomState, player) {
  return buildTurnAttackSnapshotFromCounts(buildTurnBondCountsFromRoom(roomState, player.camp), player, roomState ? roomState.roundIndex : 1, buildTurnBondPropertiesFromRoom(roomState, player.camp));
}

function createTurnServerBullet(roomState, camp, pose, attackSnapshot) {
  const from = {
    x: Number(pose && pose.x) || 0,
    y: Number(pose && pose.y) || 0,
  };
  const aim = {
    x: Number(pose && pose.aimX) || from.x,
    y: Number(pose && pose.aimY) || from.y,
  };
  const dir = normalizeVec({
    x: aim.x - from.x,
    y: aim.y - from.y,
  }, { x: 0, y: camp === 'A' ? 1 : -1 });
  const start = addVec(from, mulVec(dir, 44));
  return cloneTurnBulletState({
    position: start,
    dir,
    remainingDamage: Math.max(1, Number(attackSnapshot && attackSnapshot.bulletDamage) || Number(TURN_CONFIG.bulletDamage) || 1),
    baseDamage: Math.max(1, Number(attackSnapshot && attackSnapshot.bulletDamage) || Number(TURN_CONFIG.bulletDamage) || 1),
    damageMultiplier: 1,
    damageBoostLevel: 1,
    remainingBounce: Math.max(0, Number(attackSnapshot && attackSnapshot.bulletBounce) || 0),
    hasBounced: false,
    passedOwnBuildArea: isPointInTurnBuildArea(camp, start),
    currentSpreadZoneIds: [],
    currentDamageBoostZoneIds: [],
    damageBoostAppliedZoneIds: [],
    spreadTriggeredZoneIds: [],
    hasTriggeredSpread: false,
    firstBounceDamageBoostApplied: false,
    firstBounceDamageMultiplier: Math.max(1, Number(attackSnapshot && attackSnapshot.firstBounceDamageMultiplier) || 1),
    spreadExtraSplit: Math.max(0, Number(attackSnapshot && attackSnapshot.spreadExtraSplit) || 0),
    damageBoostTempAttack: Math.max(0, Number(attackSnapshot && attackSnapshot.damageBoostTempAttack) || 0),
    blackHoleStrengthMultiplier: Math.max(1, Number(attackSnapshot && attackSnapshot.blackHoleStrengthMultiplier) || 1),
    attackSnapshot: attackSnapshot ? { ...attackSnapshot } : null,
    camp,
    lifeLeft: Math.max(0.1, Number(TURN_CONFIG.bulletMaxLifeSeconds) || 30),
  });
}

function buildTurnSettlementSnapshot(roomState, camp) {
  const ownCounts = buildTurnBondCountsFromRoom(roomState, camp);
  const enemyCounts = buildTurnBondCountsFromRoom(roomState, getEnemyCamp(camp));
  const ownProperties = buildTurnBondPropertiesFromRoom(roomState, camp);
  const enemyProperties = buildTurnBondPropertiesFromRoom(roomState, getEnemyCamp(camp));
  const expMultiplier = getTurnBondMultiplier('exp', ownCounts.exp);
  const energyMultiplier = getTurnBondMultiplier('energy', ownCounts.energy);
  const bleedMultiplier = getTurnBondMultiplier('bleed', ownCounts.bleed);
  const totalHeal = getTurnBondValue('energy', ownCounts.energy, ownProperties.energy);
  const blockedHealByEnemy = getTurnBondValue('bleed', enemyCounts.bleed, enemyProperties.bleed);
  return {
    expBlockCount: ownCounts.exp,
    expMultiplier,
    expGain: 0,
    energyBlockCount: ownCounts.energy,
    energyMultiplier,
    totalHeal,
    blockedHealByEnemy,
    finalHeal: Math.max(0, totalHeal - blockedHealByEnemy),
    bleedBlockCount: ownCounts.bleed,
    bleedMultiplier,
    blockedHeal: getTurnBondValue('bleed', ownCounts.bleed, ownProperties.bleed),
  };
}

function refreshTurnObstacleSlotShape(slot, playerId = 0, roomState = null) {
  if (!slot) {
    return;
  }
  slot.layout = buildObstacleLayout(slot.type, slot.count);
  slot.shapeKey = getObstacleLayoutKey(slot.layout);
  if (slot.type === 'mirror') {
    slot.mirrorDir = '';
  }
}

function getTurnObstacleInventoryTotal(player) {
  if (!player || !player.inventory || !Array.isArray(player.inventory.roundSlots)) {
    return 0;
  }
  return player.inventory.roundSlots.reduce((total, slot) => total + Math.max(0, Number(slot && slot.count) || 0), 0);
}

function createTurnRoom() {
  const id = `turn_${nextTurnRoomId++}`;
  return {
    id,
    players: [],
    seed: Date.now() ^ Math.floor(Math.random() * 1000000),
    phase: TURN_PHASE.WAITING,
    roundIndex: 1,
    attackRoundIndex: 1,
    attackTurnIndex: 0,
    actionCamp: '',
    phaseEndAt: 0,
    phaseTimer: null,
    timerSync: null,
    waitingForBulletCamp: '',
    actionSubmitted: false,
    currentAttack: null,
    roundAttackSnapshots: {
      A: null,
      B: null,
    },
    settlementSnapshots: {
      A: null,
      B: null,
    },
    crystals: {
      A: { camp: 'A', hp: TURN_CONFIG.crystalHp, maxHp: TURN_CONFIG.crystalHp },
      B: { camp: 'B', hp: TURN_CONFIG.crystalHp, maxHp: TURN_CONFIG.crystalHp },
    },
    obstacles: {},
    zones: [],
    activeStaticObstacles: [],
    tankPoses: {
      A: {
        x: 0,
        y: getTurnRoadCenterY('A'),
        aimX: 0,
        aimY: getTurnRoadCenterY('A') + 120,
      },
      B: {
        x: 0,
        y: getTurnRoadCenterY('B'),
        aimX: 0,
        aimY: getTurnRoadCenterY('B') - 120,
      },
    },
    nextObstacleId: 1,
    nextZoneId: 1,
    finished: false,
  };
}

function getTurnRoom(ws) {
  if (!ws || !ws.turnRoomId) {
    return null;
  }
  return turnRooms[ws.turnRoomId] || null;
}

function getTurnPlayer(roomState, ws) {
  if (!roomState || !ws) {
    return null;
  }
  return roomState.players.find((player) => player.socket === ws) || null;
}

function findJoinableTurnRoom() {
  const rooms = Object.keys(turnRooms).map((id) => turnRooms[id]);
  for (let i = 0; i < rooms.length; i++) {
    const roomState = rooms[i];
    if (roomState && roomState.phase === TURN_PHASE.WAITING && roomState.players.length < TURN_MAX_PLAYERS) {
      return roomState;
    }
  }
  const roomState = createTurnRoom();
  turnRooms[roomState.id] = roomState;
  return roomState;
}

function clearTurnTimers(roomState) {
  if (!roomState) {
    return;
  }
  if (roomState.phaseTimer) {
    clearTimeout(roomState.phaseTimer);
    roomState.phaseTimer = null;
  }
  if (roomState.timerSync) {
    clearInterval(roomState.timerSync);
    roomState.timerSync = null;
  }
}

function broadcastTurn(roomState, payload) {
  if (!roomState) {
    return;
  }
  roomState.players.forEach((player) => {
    if (isSocketOpen(player.socket)) {
      player.socket.send(JSON.stringify(buildTurnViewPayload(player, payload)));
    }
  });
}

function sendTurnError(ws, message, code = 'turnError') {
  const roomState = getTurnRoom(ws);
  const player = roomState ? getTurnPlayer(roomState, ws) : null;
  const payload = {
    type: 'turnError',
    code,
    message,
  };
  sendJson(ws, player ? buildTurnViewPayload(player, payload) : payload);
}

function getTurnStateSnapshot(roomState) {
  return {
    type: 'stateSnapshot',
    roomId: roomState.id,
    phase: roomState.phase,
    roundIndex: roomState.roundIndex,
    attackRoundIndex: roomState.attackRoundIndex,
    attackTurnIndex: roomState.attackTurnIndex || 0,
    actionCamp: roomState.actionCamp,
    endAt: roomState.phaseEndAt,
    crystals: {
      A: { ...roomState.crystals.A },
      B: { ...roomState.crystals.B },
    },
    staticObstacles: getTurnActiveStaticObstacles(roomState).map((item) => ({ ...item })),
    obstacles: Object.keys(roomState.obstacles).map((id) => ({ ...roomState.obstacles[id] })),
    zones: roomState.zones.map((zone) => ({ ...zone })),
    tankPoses: {
      A: { ...roomState.tankPoses.A },
      B: { ...roomState.tankPoses.B },
    },
    exp: roomState.players.reduce((result, player) => {
      result[player.camp] = {
        exp: 0,
        expNeed: 0,
        level: 1,
      };
      return result;
    }, {}),
    economy: roomState.players.reduce((result, player) => {
      result[player.camp] = getTurnPlayerEconomy(player);
      return result;
    }, {}),
    inventories: roomState.players.reduce((result, player) => {
      result[player.camp] = {
        ...player.inventory,
        roundSlots: cloneTurnObstacleSlots(player.inventory.roundSlots),
      };
      return result;
    }, {}),
    upgrades: roomState.players.reduce((result, player) => {
      const derived = refreshTurnDerivedUpgradeState(player);
      result[player.camp] = {
        bulletBounce: derived.bulletBounceBonus,
        multiShot: player.upgrades.multiShot,
        damageAdd: player.upgrades.damageAdd,
        roundResourceBonus: derived.roundResourceBonus,
        resourceHpBonusByType: { ...derived.resourceHpBonusByType },
        firstBounceDamageMultiplier: derived.firstBounceDamageMultiplier,
        spreadExtraSplit: derived.spreadExtraSplit,
        damageBoostTempAttack: derived.damageBoostTempAttack,
        blackHoleStrengthMultiplier: derived.blackHoleStrengthMultiplier,
        missileExplosionRadiusBonus: derived.missileExplosionRadiusBonus,
        missileDamageBonus: derived.missileDamageBonus,
        missileMainCannonChanceBonus: derived.missileMainCannonChanceBonus,
        derived: JSON.parse(JSON.stringify(derived)),
        stacks: { ...(player.upgrades.stacks || {}) },
      };
      return result;
    }, {}),
    attackSnapshots: roomState.currentAttack
      ? {
          [roomState.currentAttack.camp]: { ...roomState.currentAttack.snapshot },
        }
      : {},
    settlementSnapshots: roomState.settlementSnapshots
      ? {
          A: roomState.settlementSnapshots.A ? { ...roomState.settlementSnapshots.A } : null,
          B: roomState.settlementSnapshots.B ? { ...roomState.settlementSnapshots.B } : null,
        }
      : {},
  };
}

function broadcastTurnSnapshot(roomState) {
  broadcastTurn(roomState, getTurnStateSnapshot(roomState));
}

function getRoundBuildSeconds(displayRound) {
  return TURN_CONFIG.buildSeconds;
}

function getTurnPhaseDurationSeconds(phase, displayRound) {
  if (phase === TURN_PHASE.BUILD) {
    return getRoundBuildSeconds(displayRound || 1);
  }
  if (phase === TURN_PHASE.ATTACK) {
    return TURN_CONFIG.attackSeconds;
  }
  if (phase === TURN_PHASE.WAIT_BULLET) {
    return TURN_CONFIG.waitBulletSeconds;
  }
  if (phase === TURN_PHASE.SETTLE) {
    return TURN_CONFIG.settleSeconds;
  }
  if (phase === TURN_PHASE.UPGRADE) {
    return TURN_CONFIG.upgradeSeconds;
  }
  return 0;
}

function getTurnAssistZoneTypeConfig(zoneType) {
  const types = TURN_CONFIG.assistZones && TURN_CONFIG.assistZones.types;
  return (types && types[zoneType]) || (types && types.blackHole) || {};
}

function getTurnAssistZoneEnabledTypes() {
  const configured = TURN_CONFIG.assistZones && Array.isArray(TURN_CONFIG.assistZones.enabledTypes)
    ? TURN_CONFIG.assistZones.enabledTypes
    : ['spread', 'damageBoost'];
  const types = TURN_CONFIG.assistZones && TURN_CONFIG.assistZones.types ? TURN_CONFIG.assistZones.types : {};
  return configured
    .map((type) => mapZoneTypeFromClient(String(type || '')))
    .filter((type, index, list) => type && type !== 'blackHole' && !!types[type] && list.indexOf(type) === index);
}

function getTurnAssistZoneSpawnCount(roundIndex) {
  const rule = TURN_CONFIG.assistZones && TURN_CONFIG.assistZones.spawnRule;
  const round = Math.max(1, Math.floor(Number(roundIndex) || 1));
  const count = round <= 1
    ? Math.max(0, Number(rule && rule.round1) || 0)
    : round === 2
      ? Math.max(0, Number(rule && rule.round2) || 0)
      : Math.max(0, Number(rule && rule.round3Plus) || 0);
  const maxSimultaneous = Math.max(0, Number(rule && rule.maxSimultaneous) || 0);
  return maxSimultaneous > 0 ? Math.min(maxSimultaneous, count) : count;
}

function randomTurnAssistZoneType() {
  const candidates = getTurnAssistZoneEnabledTypes();
  if (candidates.length <= 0) {
    return '';
  }
  return candidates[Math.floor(Math.random() * candidates.length)] || '';
}

function randomTurnAssistZoneRadius(zoneType) {
  const config = getTurnAssistZoneTypeConfig(zoneType);
  const minRadius = Math.max(1, Number(config.minRadius) || 1);
  const maxRadius = Math.max(minRadius, Number(config.maxRadius) || minRadius);
  return Math.round(randomBetween(minRadius, maxRadius));
}

function getTurnZoneCenter(zone) {
  return {
    x: Number(zone && zone.x) || 0,
    y: Number(zone && zone.y) || 0,
  };
}

function vecLength(value) {
  const x = Number(value && value.x) || 0;
  const y = Number(value && value.y) || 0;
  return Math.sqrt(x * x + y * y);
}

function normalizeVec(value, fallback) {
  const x = Number(value && value.x) || 0;
  const y = Number(value && value.y) || 0;
  const length = Math.sqrt(x * x + y * y);
  if (length <= 0.0001) {
    return fallback ? { x: fallback.x, y: fallback.y } : { x: 1, y: 0 };
  }
  return {
    x: x / length,
    y: y / length,
  };
}

function addVec(a, b) {
  return {
    x: (Number(a && a.x) || 0) + (Number(b && b.x) || 0),
    y: (Number(a && a.y) || 0) + (Number(b && b.y) || 0),
  };
}

function mulVec(value, scalar) {
  return {
    x: (Number(value && value.x) || 0) * scalar,
    y: (Number(value && value.y) || 0) * scalar,
  };
}

function cloneTurnBulletState(bullet) {
  return {
    position: { x: Number(bullet && bullet.position && bullet.position.x) || 0, y: Number(bullet && bullet.position && bullet.position.y) || 0 },
    dir: normalizeVec(bullet && bullet.dir, { x: 1, y: 0 }),
    remainingDamage: Math.max(0, Number(bullet && bullet.remainingDamage) || 0),
    baseDamage: Math.max(0, Number(bullet && bullet.baseDamage) || 0),
    damageMultiplier: Math.max(1, Number(bullet && bullet.damageMultiplier) || 1),
    damageBoostLevel: Math.max(1, Math.floor(Number(bullet && bullet.damageBoostLevel) || 1)),
    remainingBounce: Math.max(0, Math.floor(Number(bullet && bullet.remainingBounce) || 0)),
    hasBounced: !!(bullet && bullet.hasBounced),
    passedOwnBuildArea: !!(bullet && bullet.passedOwnBuildArea),
    currentSpreadZoneIds: Array.isArray(bullet && bullet.currentSpreadZoneIds) ? bullet.currentSpreadZoneIds.slice() : [],
    currentDamageBoostZoneIds: Array.isArray(bullet && bullet.currentDamageBoostZoneIds) ? bullet.currentDamageBoostZoneIds.slice() : [],
    damageBoostAppliedZoneIds: Array.isArray(bullet && bullet.damageBoostAppliedZoneIds) ? bullet.damageBoostAppliedZoneIds.slice() : [],
    spreadTriggeredZoneIds: Array.isArray(bullet && bullet.spreadTriggeredZoneIds) ? bullet.spreadTriggeredZoneIds.slice() : [],
    hasTriggeredSpread: !!(bullet && bullet.hasTriggeredSpread),
    firstBounceDamageBoostApplied: !!(bullet && bullet.firstBounceDamageBoostApplied),
    firstBounceDamageMultiplier: Math.max(1, Number(bullet && bullet.firstBounceDamageMultiplier) || 1),
    spreadExtraSplit: Math.max(0, Math.floor(Number(bullet && bullet.spreadExtraSplit) || 0)),
    damageBoostTempAttack: Math.max(0, Math.floor(Number(bullet && bullet.damageBoostTempAttack) || 0)),
    blackHoleStrengthMultiplier: Math.max(1, Number(bullet && bullet.blackHoleStrengthMultiplier) || 1),
    attackSnapshot: bullet && bullet.attackSnapshot ? { ...bullet.attackSnapshot } : null,
    camp: bullet && bullet.camp ? bullet.camp : 'A',
    lifeLeft: Number.isFinite(Number(bullet && bullet.lifeLeft)) ? Number(bullet.lifeLeft) : Math.max(0.1, Number(TURN_CONFIG.bulletMaxLifeSeconds) || 30),
  };
}

function rotateDirection(dir, degrees) {
  const radians = degrees * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return normalizeVec({
    x: dir.x * cos - dir.y * sin,
    y: dir.x * sin + dir.y * cos,
  }, dir);
}

function isTurnAssistZonePositionValid(roomState, point, radius) {
  if (!roomState || !point || !Number.isFinite(radius) || radius <= 0) {
    return false;
  }
  const assistArea = TURN_MAP_LAYOUT.assistArea;
  const mapRect = TURN_MAP_LAYOUT.mapRect;
  if (
    point.x - radius < assistArea.minX
    || point.x + radius > assistArea.maxX
    || point.y - radius < assistArea.minY
    || point.y + radius > assistArea.maxY
    || point.x - radius < mapRect.minX
    || point.x + radius > mapRect.maxX
    || point.y - radius < mapRect.minY
    || point.y + radius > mapRect.maxY
  ) {
    return false;
  }
  const roadA = TURN_MAP_LAYOUT.roadRects.A;
  const roadB = TURN_MAP_LAYOUT.roadRects.B;
  if (
    circleRectIntersects(point, radius, { x: roadA.minX, y: roadA.minY, width: roadA.maxX - roadA.minX, height: roadA.maxY - roadA.minY })
    || circleRectIntersects(point, radius, { x: roadB.minX, y: roadB.minY, width: roadB.maxX - roadB.minX, height: roadB.maxY - roadB.minY })
  ) {
    return false;
  }
  const tankPadding = 12;
  const tankA = roomState.tankPoses && roomState.tankPoses.A ? { ...roomState.tankPoses.A, radius: 38 } : { x: 0, y: getTurnRoadCenterY('A'), radius: 38 };
  const tankB = roomState.tankPoses && roomState.tankPoses.B ? { ...roomState.tankPoses.B, radius: 38 } : { x: 0, y: getTurnRoadCenterY('B'), radius: 38 };
  if (
    distanceBetweenPoints(point, tankA) < radius + tankA.radius + tankPadding
    || distanceBetweenPoints(point, tankB) < radius + tankB.radius + tankPadding
  ) {
    return false;
  }
  const noBuildAreas = [
    TURN_MAP_LAYOUT.roadRects.A,
    TURN_MAP_LAYOUT.roadRects.B,
  ];
  for (let i = 0; i < noBuildAreas.length; i++) {
    const rect = noBuildAreas[i];
    if (circleRectIntersects(point, radius, { x: rect.minX, y: rect.minY, width: rect.maxX - rect.minX, height: rect.maxY - rect.minY })) {
      return false;
    }
  }
  if (getTurnActiveStaticObstacles(roomState).some((obstacle) => circleRectIntersects(point, radius, obstacle))) {
    return false;
  }
  if (!(TURN_CONFIG.assistZones && TURN_CONFIG.assistZones.allowOverlap)) {
    const zones = Array.isArray(roomState.zones) ? roomState.zones : [];
    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i];
      const zoneRadius = Math.max(0, Number(zone && zone.radius) || 0);
      if (distanceBetweenPoints(point, zone) < zoneRadius + radius + 16) {
        return false;
      }
    }
  }
  return true;
}

function setTurnPhase(roomState, phase, durationSeconds, onTimeout) {
  clearTurnTimers(roomState);
  if (roomState.finished) {
    return;
  }
  roomState.phase = phase;
  roomState.phaseEndAt = durationSeconds > 0 ? Date.now() + durationSeconds * 1000 : 0;
  broadcastTurn(roomState, {
    type: 'phaseChanged',
    roomId: roomState.id,
    phase: roomState.phase,
    roundIndex: roomState.roundIndex,
    attackRoundIndex: roomState.attackRoundIndex,
    attackTurnIndex: roomState.attackTurnIndex || 0,
    actionCamp: roomState.actionCamp,
    endAt: roomState.phaseEndAt,
  });
  broadcastTurnSnapshot(roomState);
  if (durationSeconds > 0) {
    roomState.timerSync = setInterval(() => {
      broadcastTurn(roomState, {
        type: 'timerSync',
        roomId: roomState.id,
        phase: roomState.phase,
        endAt: roomState.phaseEndAt,
        remainingMs: Math.max(0, roomState.phaseEndAt - Date.now()),
      });
    }, 1000);
    roomState.phaseTimer = setTimeout(() => {
      roomState.phaseTimer = null;
      if (roomState.timerSync) {
        clearInterval(roomState.timerSync);
        roomState.timerSync = null;
      }
      onTimeout();
    }, durationSeconds * 1000);
  }
}

function startTurnBuildPhase(roomState) {
  roomState.actionCamp = '';
  roomState.attackRoundIndex = 1;
  roomState.attackTurnIndex = 0;
  roomState.waitingForBulletCamp = '';
  roomState.actionSubmitted = false;
  roomState.currentAttack = null;
  roomState.roundAttackSnapshots = {
    A: null,
    B: null,
  };
  roomState.settlementSnapshots = {
    A: null,
    B: null,
  };
  roomState.zones = [];
  randomizeTurnAssistStaticObstacles(roomState);
  spawnTurnAssistZones(roomState);
  const coinReward = Math.max(0, Math.floor(Number(TURN_CONFIG.coinEconomy && TURN_CONFIG.coinEconomy.baseRoundReward) || 0));
  roomState.players.forEach((player) => {
    player.placedThisRound = false;
    player.refreshCountThisRound = 0;
    player.coins = Math.max(0, Math.floor(Number(player.coins) || 0)) + coinReward;
    createTurnRoundSlots(player, roomState, roomState.roundIndex);
  });
  logTurn(roomState, `phase build round=${roomState.roundIndex} buildSeconds=${TURN_CONFIG.buildSeconds}`);
  setTurnPhase(roomState, TURN_PHASE.BUILD, TURN_CONFIG.buildSeconds, () => {
    roomState.players.forEach((player) => {
      roomState.roundAttackSnapshots[player.camp] = buildTurnAttackSnapshot(roomState, player);
    });
    startTurnAttackPhase(roomState, 'A');
  });
}

function isTurnBuildPlayerDone(player) {
  if (!player) {
    return false;
  }
  const slots = player.inventory && Array.isArray(player.inventory.roundSlots)
    ? player.inventory.roundSlots
    : [];
  const slotCost = getTurnSlotCost();
  const coins = Math.max(0, Math.floor(Number(player.coins) || 0));
  const hasAffordableUnplacedSlot = slots.some((slot) => (
    slot
    && !slot.placed
    && !slot.placedObstacleId
    && Math.max(0, Number(slot.count) || 0) > 0
    && (slotCost <= 0 || coins >= slotCost)
  ));
  const canRefresh = canTurnPlayerRefreshAndStillBuy(player);
  return !hasAffordableUnplacedSlot && !canRefresh;
}

function tryCompleteTurnBuildPhaseEarly(roomState) {
  if (!roomState || roomState.finished || roomState.phase !== TURN_PHASE.BUILD) {
    return false;
  }
  if (!roomState.players || roomState.players.length <= 0 || !roomState.players.every((player) => isTurnBuildPlayerDone(player))) {
    return false;
  }

  clearTurnTimers(roomState);
  roomState.players.forEach((player) => {
    roomState.roundAttackSnapshots[player.camp] = buildTurnAttackSnapshot(roomState, player);
  });
  logTurn(roomState, `phase build early complete round=${roomState.roundIndex}`);
  startTurnAttackPhase(roomState, 'A');
  return true;
}

function startTurnAttackPhase(roomState, camp) {
  roomState.actionCamp = camp;
  roomState.attackTurnIndex = camp === 'A' ? 1 : 2;
  roomState.waitingForBulletCamp = '';
  roomState.actionSubmitted = false;
  roomState.currentAttack = null;
  logTurn(roomState, `phase attack camp=${camp} turn=${roomState.attackTurnIndex}`);
  setTurnPhase(roomState, TURN_PHASE.ATTACK, TURN_CONFIG.attackSeconds, () => {
    advanceTurnAttack(roomState);
  });
}

function startTurnWaitBulletPhase(roomState, camp) {
  roomState.actionCamp = camp;
  roomState.waitingForBulletCamp = camp;
  logTurn(roomState, `phase waitBullet camp=${camp}`);
  setTurnPhase(roomState, TURN_PHASE.WAIT_BULLET, TURN_CONFIG.waitBulletSeconds, () => {
    advanceTurnAttack(roomState);
  });
}

function advanceTurnAttack(roomState) {
  if (roomState.finished) {
    return;
  }
  if (roomState.currentAttack && roomState.currentAttack.timer) {
    clearTimeout(roomState.currentAttack.timer);
    roomState.currentAttack.timer = null;
  }
  roomState.currentAttack = null;
  roomState.waitingForBulletCamp = '';
  roomState.actionSubmitted = false;
  if (roomState.actionCamp === 'A') {
    startTurnAttackPhase(roomState, 'B');
    return;
  }
  startTurnSettlePhase(roomState);
}

function broadcastTurnAttackShot(roomState) {
  if (!roomState || !roomState.currentAttack) {
    return;
  }
  const attack = roomState.currentAttack;
  const shotIndex = Math.max(0, attack.nextShotIndex || 0);
  attack.snapshot.shotsLeft = Math.max(0, attack.snapshot.totalShots - shotIndex - 1);
  broadcastTurn(roomState, {
    type: 'attackAction',
    roomId: roomState.id,
    camp: attack.camp,
    playerId: attack.playerId,
    attackRoundIndex: roomState.attackRoundIndex,
    action: {
      fromX: attack.pose.x,
      fromY: attack.pose.y,
      aimX: attack.pose.aimX,
      aimY: attack.pose.aimY,
      shotIndex,
      bulletBlockCount: attack.snapshot.bulletBlockCount,
      attackBlockCount: attack.snapshot.attackBlockCount,
      attackMultiplier: attack.snapshot.attackMultiplier,
      totalShots: attack.snapshot.totalShots,
      extraShotsFromUpgrade: attack.snapshot.extraShotsFromUpgrade,
      extraShotsFromBulletBlock: attack.snapshot.extraShotsFromBulletBlock,
      bonusDamageFromUpgrade: attack.snapshot.bonusDamageFromUpgrade,
      bonusDamageFromAttackBlock: attack.snapshot.bonusDamageFromAttackBlock,
      bulletDamage: attack.snapshot.bulletDamage,
      bulletBounce: attack.snapshot.bulletBounce,
      firstBounceDamageMultiplier: attack.snapshot.firstBounceDamageMultiplier,
      spreadExtraSplit: attack.snapshot.spreadExtraSplit,
      damageBoostTempAttack: attack.snapshot.damageBoostTempAttack,
      blackHoleStrengthMultiplier: attack.snapshot.blackHoleStrengthMultiplier,
      shotsLeft: attack.snapshot.shotsLeft,
    },
  });
  attack.nextShotIndex += 1;
  if (attack.nextShotIndex >= attack.snapshot.totalShots) {
    startTurnWaitBulletPhase(roomState, attack.camp);
    return;
  }
  const shotInterval = attack.snapshot.extraShotsFromBulletBlock > 0
    ? Math.max(0, Number(TURN_CONFIG.bulletBlockExtraShotInterval) || 0.5)
    : Math.max(0, Number(TURN_CONFIG.baseFireInterval) || 0);
  attack.timer = setTimeout(() => {
    attack.timer = null;
    broadcastTurnAttackShot(roomState);
  }, shotInterval * 1000);
}

function startTurnSettlePhase(roomState) {
  roomState.actionCamp = '';
  applyTurnRoundSettlement(roomState);
  logTurn(roomState, `phase settle round=${roomState.roundIndex}`);
  setTurnPhase(roomState, TURN_PHASE.SETTLE, TURN_CONFIG.settleSeconds, () => {
    roomState.roundIndex += 1;
    startTurnBuildPhase(roomState);
  });
}

function spawnTurnAssistZones(roomState) {
  if (!roomState) {
    return [];
  }
  const zones = [];
  const assistArea = TURN_MAP_LAYOUT.assistArea;
  const spawnCount = getTurnAssistZoneSpawnCount(roomState.roundIndex);
  const maxRetries = Math.max(1, Number(TURN_CONFIG.assistZones && TURN_CONFIG.assistZones.maxPlacementRetries) || 1);
  for (let i = 0; i < spawnCount; i++) {
    const zoneType = randomTurnAssistZoneType();
    if (!zoneType) {
      continue;
    }
    const radius = randomTurnAssistZoneRadius(zoneType);
    const minX = assistArea.minX + radius + 8;
    const maxX = assistArea.maxX - radius - 8;
    const minY = assistArea.minY + radius + 8;
    const maxY = assistArea.maxY - radius - 8;
    if (minX > maxX || minY > maxY) {
      continue;
    }
    let point = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const nextPoint = {
        x: Math.round(randomBetween(minX, maxX)),
        y: Math.round(randomBetween(minY, maxY)),
      };
      if (isTurnAssistZonePositionValid(roomState, nextPoint, radius)) {
        point = nextPoint;
        break;
      }
    }
    if (!point) {
      continue;
    }
    const zone = {
      id: `system_zone_${roomState.nextZoneId++}`,
      camp: 'N',
      zoneType,
      x: point.x,
      y: point.y,
      radius,
      extra: {
        source: 'system',
        roundIndex: roomState.roundIndex,
      },
    };
    roomState.zones.push(zone);
    zones.push(zone);
    broadcastTurn(roomState, {
      type: 'zoneAction',
      roomId: roomState.id,
      camp: zone.camp,
      playerId: 0,
      zone,
    });
  }
  broadcastTurnSnapshot(roomState);
  return zones;
}

function clampTurnTankAim(camp, fromPoint, aimPoint) {
  const canonicalCamp = camp === 'B' ? 'B' : 'A';
  const fallbackY = canonicalCamp === 'A' ? fromPoint.y + 120 : fromPoint.y - 120;
  const nextAim = {
    x: clamp(Number(aimPoint && aimPoint.x), -TURN_MAP_BOUNDS.halfWidth, TURN_MAP_BOUNDS.halfWidth),
    y: clamp(Number(aimPoint && aimPoint.y), -TURN_MAP_BOUNDS.halfHeight, TURN_MAP_BOUNDS.halfHeight),
  };
  if (!Number.isFinite(nextAim.x)) {
    nextAim.x = fromPoint.x;
  }
  if (!Number.isFinite(nextAim.y)) {
    nextAim.y = fallbackY;
  }
  if (canonicalCamp === 'A') {
    nextAim.y = Math.max(fromPoint.y, nextAim.y);
  } else {
    nextAim.y = Math.min(fromPoint.y, nextAim.y);
  }
  if (Math.abs(nextAim.x - fromPoint.x) < 1 && Math.abs(nextAim.y - fromPoint.y) < 1) {
    nextAim.y = canonicalCamp === 'A' ? fromPoint.y + 60 : fromPoint.y - 60;
  }
  return nextAim;
}

function translateTurnTankAimWithMove(prevPose, nextPose) {
  if (!prevPose || !nextPose) {
    return {
      x: nextPose ? nextPose.x : 0,
      y: nextPose ? nextPose.y : 0,
    };
  }
  const dx = (nextPose.x || 0) - (prevPose.x || 0);
  const dy = (nextPose.y || 0) - (prevPose.y || 0);
  return {
    x: (prevPose.aimX || nextPose.x || 0) + dx,
    y: (prevPose.aimY || nextPose.y || 0) + dy,
  };
}

function updateTurnTankPose(roomState, camp, x, aimX, aimY) {
  const canonicalCamp = camp === 'B' ? 'B' : 'A';
  const roadY = getTurnRoadCenterY(canonicalCamp);
  const clampedX = clamp(Number(x) || 0, getTurnRoadMoveMinX(canonicalCamp), getTurnRoadMoveMaxX(canonicalCamp));
  const pose = roomState.tankPoses[canonicalCamp] || {
    x: 0,
    y: roadY,
    aimX: 0,
    aimY: canonicalCamp === 'A' ? roadY + 120 : roadY - 120,
  };
  const prevPose = {
    x: pose.x,
    y: pose.y,
    aimX: pose.aimX,
    aimY: pose.aimY,
  };
  pose.x = Math.round(clampedX);
  pose.y = roadY;
  const fallbackAim = translateTurnTankAimWithMove(prevPose, pose);
  const hasExplicitAim = Number.isFinite(Number(aimX)) && Number.isFinite(Number(aimY));
  const nextAim = clampTurnTankAim(canonicalCamp, pose, hasExplicitAim ? { x: aimX, y: aimY } : fallbackAim);
  pose.aimX = Math.round(nextAim.x);
  pose.aimY = Math.round(nextAim.y);
  roomState.tankPoses[canonicalCamp] = pose;
  return pose;
}

function getTurnUpgradeOptions(roomState, player) {
  if (player.pendingUpgradeOptions.length > 0) {
    return player.pendingUpgradeOptions;
  }
  const pool = TURN_UPGRADE_POOL.filter((option) => {
    if (option.maxStacks == null) {
      return true;
    }
    return getTurnUpgradeStack(player, option.id) < option.maxStacks;
  }).map((option) => ({ ...option, currentStacks: getTurnUpgradeStack(player, option.id) }));
  const shuffled = shuffle(pool);
  const options = [];
  for (let i = 0; i < shuffled.length && options.length < 3; i++) {
    options.push(shuffled[i]);
  }
  player.pendingUpgradeOptions = options;
  return options;
}

function sendTurnUpgradeOptions(roomState, player) {
  if (!roomState || !player || player.exp < player.expNeed) {
    return false;
  }
  sendJson(player.socket, buildTurnViewPayload(player, {
    type: 'upgradeOptions',
    roomId: roomState.id,
    camp: player.camp,
    options: getTurnUpgradeOptions(roomState, player),
  }));
  return true;
}

function canTurnPlayerUpgrade(player) {
  return !!(player && Math.max(0, Number(player.exp) || 0) >= Math.max(0, Number(player.expNeed) || 0));
}

function startTurnUpgradePhase(roomState) {
  roomState.actionCamp = '';
  roomState.players.forEach((player) => {
    player.pendingUpgradeOptions = [];
  });
  logTurn(roomState, `skip upgrade round=${roomState.roundIndex}: upgrade module disabled`);
  roomState.roundIndex += 1;
  startTurnBuildPhase(roomState);
}

function startTurnRoom(roomState) {
  roomState.phase = TURN_PHASE.BUILD;
  randomizeTurnAssistStaticObstacles(roomState);
  roomState.players.forEach((player) => {
    const ws = player.socket;
    ws.turnPlayerId = player.playerId;
    ws.turnCamp = player.camp;
    sendJson(ws, buildTurnViewPayload(player, {
      type: 'turnGameStart',
      roomId: roomState.id,
      playerId: player.playerId,
      camp: player.camp,
      opponentCamp: getEnemyCamp(player.camp),
      viewCamp: 'A',
      seed: roomState.seed,
      config: TURN_CONFIG,
    }));
  });
  logTurn(roomState, 'game start');
  startTurnBuildPhase(roomState);
}

function removeFromLegacyWaitingRoom(ws) {
  if (room.players.indexOf(ws) < 0) {
    return;
  }
  if (room.state === ROOM_STATE.WAITING || room.state === ROOM_STATE.COUNTDOWN) {
    removeWaitingPlayer(ws);
  }
}

function handleJoinTurnRoom(ws) {
  if (ws.turnRoomId) {
    const existing = getTurnRoom(ws);
    if (existing) {
      sendJson(ws, {
        type: 'turnJoined',
        roomId: existing.id,
        playerId: ws.turnPlayerId,
        camp: ws.turnCamp,
        viewCamp: 'A',
        playerCount: existing.players.length,
        maxPlayers: TURN_MAX_PLAYERS,
        config: TURN_CONFIG,
      });
      return;
    }
  }

  removeFromLegacyWaitingRoom(ws);
  const roomState = findJoinableTurnRoom();
  const camp = TURN_CAMPS[roomState.players.length];
  const player = createTurnPlayer(ws, camp, roomState.players.length);
  roomState.players.push(player);
  ws.turnRoomId = roomState.id;
  ws.turnPlayerId = player.playerId;
  ws.turnCamp = player.camp;

  sendJson(ws, {
    type: 'turnJoined',
    roomId: roomState.id,
    playerId: player.playerId,
    camp: player.camp,
    viewCamp: 'A',
    playerCount: roomState.players.length,
    maxPlayers: TURN_MAX_PLAYERS,
    config: TURN_CONFIG,
  });
  broadcastTurn(roomState, {
    type: 'turnPlayerCount',
    roomId: roomState.id,
    count: roomState.players.length,
    max: TURN_MAX_PLAYERS,
  });
  logTurn(roomState, `player joined camp=${player.camp}`);

  if (roomState.players.length >= TURN_MAX_PLAYERS) {
    startTurnRoom(roomState);
  }
}

function sanitizeTurnPoint(payload, prefix = '') {
  const xKey = prefix ? `${prefix}X` : 'x';
  const yKey = prefix ? `${prefix}Y` : 'y';
  const fallbackXKey = prefix ? `${prefix}x` : 'x';
  const fallbackYKey = prefix ? `${prefix}y` : 'y';
  const x = Number(payload && (payload[xKey] != null ? payload[xKey] : payload[fallbackXKey]));
  const y = Number(payload && (payload[yKey] != null ? payload[yKey] : payload[fallbackYKey]));
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return {
    x: clamp(x, -TURN_MAP_BOUNDS.halfWidth, TURN_MAP_BOUNDS.halfWidth),
    y: clamp(y, -TURN_MAP_BOUNDS.halfHeight, TURN_MAP_BOUNDS.halfHeight),
  };
}

function sanitizeTurnPointForPlayer(player, payload, prefix = '') {
  const point = sanitizeTurnPoint(payload, prefix);
  if (!point) {
    return null;
  }
  return toCanonicalPoint(player, point);
}

function getTurnActionPayload(msg) {
  if (msg && msg.payload && typeof msg.payload === 'object') {
    return msg.payload;
  }
  return msg || {};
}

function isTurnObstaclePositionFree(roomState, x, y, ignoreId) {
  const grid = TURN_CONFIG.obstacleGrid || 32;
  const gridX = Math.round(x / grid);
  const gridY = Math.round(y / grid);
  return !Object.keys(roomState.obstacles).some((id) => {
    if (id === ignoreId) {
      return false;
    }
    const obstacle = roomState.obstacles[id];
    return Math.round(obstacle.x / grid) === gridX && Math.round(obstacle.y / grid) === gridY;
  });
}

function getTurnObstacleRectsAt(x, y, layout) {
  const grid = TURN_CONFIG.obstacleGrid || 32;
  const cells = Array.isArray(layout) && layout.length > 0 ? layout : [{ x: 0, y: 0 }];
  return cells.map((cell) => ({
    x: Math.round(x + (Number(cell.x) || 0) * grid - grid / 2),
    y: Math.round(y + (Number(cell.y) || 0) * grid - grid / 2),
    width: grid,
    height: grid,
  }));
}

function rectOverlaps(a, b) {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

function isTurnBuildPlacementValid(roomState, camp, x, y, layout, ignoreId, slotType = 'normal') {
  return !!analyzeTurnBuildPlacement(roomState, camp, x, y, layout, slotType, ignoreId).valid;
}

function analyzeTurnBuildPlacement(roomState, camp, x, y, layout, slotType, ignoreId) {
  const buildBounds = TURN_MAP_LAYOUT.buildAreas[camp === 'B' ? 'B' : 'A'];
  const mapBounds = TURN_MAP_LAYOUT.mapRect;
  const roadA = TURN_MAP_LAYOUT.roadRects.A;
  const roadB = TURN_MAP_LAYOUT.roadRects.B;
  const sourceLayout = Array.isArray(layout) && layout.length > 0 ? layout : [{ x: 0, y: 0 }];
  const rects = getTurnObstacleRectsAt(x, y, layout);
  const result = {
    valid: false,
    blankCells: [],
    mergeTargets: [],
  };
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    if (
      rect.x < buildBounds.minX
      || rect.y < buildBounds.minY
      || rect.x + rect.width > buildBounds.maxX
      || rect.y + rect.height > buildBounds.maxY
    ) {
      return result;
    }
    if (
      rect.x < mapBounds.minX
      || rect.y < mapBounds.minY
      || rect.x + rect.width > mapBounds.maxX
      || rect.y + rect.height > mapBounds.maxY
    ) {
      return result;
    }
    if (rectOverlaps(rect, { x: roadA.minX, y: roadA.minY, width: roadA.maxX - roadA.minX, height: roadA.maxY - roadA.minY })) {
      return result;
    }
    if (rectOverlaps(rect, { x: roadB.minX, y: roadB.minY, width: roadB.maxX - roadB.minX, height: roadB.maxY - roadB.minY })) {
      return result;
    }
    if (getTurnActiveStaticObstacles(roomState).some((obstacle) => rectOverlaps(rect, obstacle))) {
      return result;
    }
    if (roomState.zones.some((zone) => circleRectIntersects(zone, Math.max(0, Number(zone && zone.radius) || 0), rect))) {
      return result;
    }
    const overlaps = [];
    Object.keys(roomState.obstacles).forEach((id) => {
      if (id === ignoreId) {
        return;
      }
      const obstacle = roomState.obstacles[id];
      const existingRects = getTurnObstacleRectsAt(obstacle.x, obstacle.y, obstacle.layout);
      for (let cellIndex = 0; cellIndex < existingRects.length; cellIndex++) {
        if (rectOverlaps(existingRects[cellIndex], rect)) {
          overlaps.push({ obstacle, cellIndex });
        }
      }
    });
    if (overlaps.length <= 0) {
      result.blankCells.push(sourceLayout[i] || { x: 0, y: 0 });
      continue;
    }
    if (overlaps.length > 1) {
      return result;
    }
    const target = overlaps[0];
    if (!target.obstacle || target.obstacle.camp !== camp || target.obstacle.slotType !== slotType) {
      return result;
    }
    target.obstacle.cellLevels = normalizeObstacleCellLevels(target.obstacle);
    const currentLevel = clamp(Math.floor(Number(target.obstacle.cellLevels[target.cellIndex]) || 1), 1, getResourceMergeMaxLevel());
    if (currentLevel >= getResourceMergeMaxLevel()) {
      return result;
    }
    result.mergeTargets.push({ obstacleId: target.obstacle.id, cellIndex: target.cellIndex });
  }
  result.valid = result.blankCells.length > 0 || result.mergeTargets.length > 0;
  return result;
}

function handleTurnBuildAction(ws, msg) {
  const roomState = getTurnRoom(ws);
  const player = getTurnPlayer(roomState, ws);
  if (!roomState || !player || roomState.phase !== TURN_PHASE.BUILD) {
    if (roomState) {
      logTurn(roomState, `buildAction reject: invalid phase, currentPhase=${roomState.phase}`);
    }
    sendTurnError(ws, '当前不是改造期', 'invalidPhase');
    return;
  }
  const payload = getTurnActionPayload(msg);
  const op = payload.op === 'move' || payload.op === 'remove' ? payload.op : 'place';
  const point = sanitizeTurnPointForPlayer(player, payload);
  const obstacleId = String(payload.obstacleId || '');
  const slotId = String(payload.slotId || '');
  const slots = Array.isArray(player.inventory.roundSlots) ? player.inventory.roundSlots : [];

  if (op === 'place') {
    if (!point) {
      sendTurnError(ws, '建造坐标无效', 'invalidPoint');
      return;
    }
    const slot = findTurnRoundSlot(player, slotId);
    if (!slot) {
      logTurn(roomState, `buildAction reject: slot not found, camp=${player.camp} slotId="${slotId}" availableSlots=${(player.inventory.roundSlots || []).map((s) => s.slotId).join(',')}`);
      sendTurnError(ws, '掩体库存不足', 'noInventory');
      return;
    }
    if (slot.count <= 0) {
      logTurn(roomState, `buildAction reject: slot count<=0, camp=${player.camp} slotId="${slotId}"`);
      sendTurnError(ws, '掩体库存不足', 'noInventory');
      return;
    }
    if (slot.placed || slot.placedObstacleId) {
      logTurn(roomState, `buildAction reject: slot already placed, camp=${player.camp} slotId="${slotId}" placed=${slot.placed} placedObstacleId=${slot.placedObstacleId}`);
      sendTurnError(ws, '该资源已放置', 'slotAlreadyPlaced');
      return;
    }
    const slotCost = Math.max(0, Math.floor(Number(TURN_CONFIG.coinEconomy && TURN_CONFIG.coinEconomy.slotCost) || 0));
    if (slotCost > 0 && Math.max(0, Math.floor(Number(player.coins) || 0)) < slotCost) {
      logTurn(roomState, `buildAction reject: not enough coins, camp=${player.camp} coins=${player.coins} cost=${slotCost}`);
      sendTurnError(ws, '金币不足', 'notEnoughCoins');
      return;
    }
    const placement = analyzeTurnBuildPlacement(roomState, player.camp, point.x, point.y, slot.layout, slot.type, '');
    if (!placement.valid) {
      logTurn(roomState, `buildAction reject: position invalid, camp=${player.camp} slotId="${slotId}" point=${point.x},${point.y}`);
      sendTurnError(ws, '该位置不可放置', 'occupied');
      return;
    }
    const id = obstacleId || `${player.camp}_${roomState.nextObstacleId++}`;
    const slotType = slot.type;
    for (let i = 0; i < placement.mergeTargets.length; i++) {
      const target = placement.mergeTargets[i];
      const obstacle = roomState.obstacles[target.obstacleId];
      if (!obstacle || !Array.isArray(obstacle.layout) || target.cellIndex < 0 || target.cellIndex >= obstacle.layout.length) {
        continue;
      }
      obstacle.cellLevels = normalizeObstacleCellLevels(obstacle);
      obstacle.cellLevels[target.cellIndex] = Math.min(getResourceMergeMaxLevel(), Math.max(1, Math.floor(Number(obstacle.cellLevels[target.cellIndex]) || 1)) + 1);
      obstacle.resourceLevel = Math.max(1, ...obstacle.cellLevels);
      obstacle.level = obstacle.resourceLevel;
      obstacle.cellHp[target.cellIndex] = getObstacleCellMaxHpForLevel(obstacle.slotType, obstacle.cellLevels[target.cellIndex], roomState, obstacle.camp);
      obstacle.cellHpList = obstacle.cellHp.slice();
      obstacle.levels = obstacle.cellLevels.slice();
      obstacle.maxHp = getObstacleMaxHpForLevels(obstacle.slotType, obstacle.cellLevels, roomState, obstacle.camp);
      obstacle.hp = sumObstacleCellHp(obstacle);
    }
    if (placement.blankCells.length > 0) {
      const resourceCount = clamp(Math.round(Number(placement.blankCells.length) || 1), 1, TURN_CONFIG.slotMaxResource);
      const layout = normalizeObstacleLayout(slotType, placement.blankCells, resourceCount);
      const cellLevels = Array.from({ length: layout.length }, () => 1);
      const cellHp = buildObstacleCellHp(slotType, resourceCount, layout.length, null, roomState, player.camp, null, cellLevels);
      const maxHp = getObstacleMaxHpForLevels(slotType, cellLevels, roomState, player.camp);
      roomState.obstacles[id] = {
        id,
        camp: player.camp,
        originSlotId: slot.slotId,
        x: Math.round(point.x),
        y: Math.round(point.y),
        hp: sumObstacleCellHp({ cellHp }),
        maxHp,
        slotType,
        resourceCount,
        resourceLevel: 1,
        level: 1,
        cellLevels,
        levels: cellLevels.slice(),
        layout,
        cellHp,
        cellHpList: cellHp.slice(),
        shapeKey: getObstacleLayoutKey(layout),
        mirrorDir: '',
        placedByCamp: player.camp,
      };
    }
    slot.placed = true;
    slot.placedObstacleId = placement.blankCells.length > 0 ? id : `merge_${roomState.nextObstacleId++}`;
    player.coins = Math.max(0, Math.floor(Number(player.coins) || 0) - slotCost);
    player.placedThisRound = true;
    logTurn(roomState, `buildAction place ok: camp=${player.camp} slotId="${slot.slotId}" obstacleId=${placement.blankCells.length > 0 ? id : ''} mergeCells=${placement.mergeTargets.length} type=${slotType} at ${Math.round(point.x)},${Math.round(point.y)} coins=${player.coins}`);
  } else if (op === 'move') {
    sendTurnError(ws, '已放置资源不能移动', 'moveDisabled');
    return;
  } else if (op === 'remove') {
    if (!obstacleId || !roomState.obstacles[obstacleId]) {
      sendTurnError(ws, '移除掩体参数无效', 'invalidObstacle');
      return;
    }
    const obstacle = roomState.obstacles[obstacleId];
    if (obstacle.camp !== player.camp) {
      sendTurnError(ws, '不能移除对方掩体', 'notOwner');
      return;
    }
    delete roomState.obstacles[obstacleId];
    const slot = findTurnRoundSlot(player, obstacle.originSlotId);
    if (slot && slot.placedObstacleId === obstacleId) {
      slot.placedObstacleId = '';
    }
  }

  broadcastTurn(roomState, {
    type: 'buildAction',
    roomId: roomState.id,
    camp: player.camp,
    playerId: player.playerId,
    action: {
      op,
      obstacleId: obstacleId || undefined,
      slotId: op === 'place' ? slotId : undefined,
      x: point ? Math.round(point.x) : undefined,
      y: point ? Math.round(point.y) : undefined,
    },
  });
  broadcastTurnSnapshot(roomState);
  tryCompleteTurnBuildPhaseEarly(roomState);
}

function handleTurnZoneAction(ws, msg) {
  sendTurnError(ws, '辅助区域由系统自动生成', 'zoneAutoManaged');
}

function handleTurnRefreshSlots(ws, msg) {
  const roomState = getTurnRoom(ws);
  const player = getTurnPlayer(roomState, ws);
  if (!roomState || !player || roomState.phase !== TURN_PHASE.BUILD) {
    sendTurnError(ws, '当前不能刷新', 'invalidPhase');
    return;
  }
  const refreshCost = getTurnRefreshCost(player);
  const coins = Math.max(0, Math.floor(Number(player.coins) || 0));
  if (!canTurnPlayerRefreshAndStillBuy(player)) {
    sendTurnError(ws, '金币不足，刷新后无法购买资源', 'notEnoughCoins');
    return;
  }
  player.coins = coins - refreshCost;
  player.refreshCountThisRound = Math.max(0, Math.floor(Number(player.refreshCountThisRound) || 0)) + 1;

  const totalResources = getTurnRoundResourceTotal(player, roomState.roundIndex);
  const counts = splitTurnRoundResources(totalResources);
  const previousSlots = player.inventory && Array.isArray(player.inventory.roundSlots) ? player.inventory.roundSlots : [];
  player.inventory = player.inventory || {};
  player.inventory.roundResourceTotal = totalResources;
  player.inventory.roundSlots = counts.map((count, index) => {
    const previousSlot = previousSlots[index];
    if (previousSlot && (previousSlot.placed || previousSlot.placedObstacleId)) {
      return previousSlot;
    }
    return createTurnRoundSlot(player, roomState.roundIndex, index, count);
  });
  logTurn(roomState, `refreshSlots ok: camp=${player.camp} cost=${refreshCost} refreshCount=${player.refreshCountThisRound} coins=${player.coins}`);
  broadcastTurnSnapshot(roomState);
  tryCompleteTurnBuildPhaseEarly(roomState);
}

function handleTurnTankPose(ws, msg) {
  const roomState = getTurnRoom(ws);
  const player = getTurnPlayer(roomState, ws);
  if (!roomState || !player || roomState.phase !== TURN_PHASE.ATTACK || roomState.actionCamp !== player.camp) {
    return;
  }
  const payload = getTurnActionPayload(msg);
  const posePoint = sanitizeTurnPointForPlayer(player, { x: payload.x, y: payload.y });
  const aimPoint = sanitizeTurnPointForPlayer(player, { x: payload.aimX, y: payload.aimY });
  const pose = updateTurnTankPose(
    roomState,
    player.camp,
    posePoint ? posePoint.x : roomState.tankPoses[player.camp].x,
    aimPoint ? aimPoint.x : roomState.tankPoses[player.camp].aimX,
    aimPoint ? aimPoint.y : roomState.tankPoses[player.camp].aimY,
  );
  broadcastTurn(roomState, {
    type: 'tankPose',
    roomId: roomState.id,
    camp: player.camp,
    playerId: player.playerId,
    pose,
  });
}

function handleTurnAttackAction(ws, msg) {
  const roomState = getTurnRoom(ws);
  const player = getTurnPlayer(roomState, ws);
  if (!roomState || !player || roomState.phase !== TURN_PHASE.ATTACK || roomState.actionCamp !== player.camp) {
    sendTurnError(ws, '当前不能攻击', 'invalidPhase');
    return;
  }
  if (roomState.actionSubmitted) {
    sendTurnError(ws, '本行动已提交攻击', 'alreadyActed');
    return;
  }
  const payload = getTurnActionPayload(msg);
  const fromPoint = sanitizeTurnPointForPlayer(player, payload, 'from');
  const aimPoint = sanitizeTurnPointForPlayer(player, payload, 'aim');
  if (!fromPoint || !aimPoint) {
    sendTurnError(ws, '攻击参数无效', 'invalidAttack');
    return;
  }
  if (isPointInTurnBuildArea(player.camp, aimPoint)) {
    sendTurnError(ws, '不能点击自己建造区发射', 'attackInOwnBuildArea');
    return;
  }
  const pose = updateTurnTankPose(roomState, player.camp, fromPoint.x, aimPoint.x, aimPoint.y);
  const snapshot = roomState.roundAttackSnapshots && roomState.roundAttackSnapshots[player.camp]
    ? { ...roomState.roundAttackSnapshots[player.camp] }
    : buildTurnAttackSnapshot(roomState, player);
  roomState.actionSubmitted = true;
  roomState.currentAttack = {
    camp: player.camp,
    playerId: player.playerId,
    pose,
    snapshot,
    nextShotIndex: 0,
    timer: null,
  };
  broadcastTurnSnapshot(roomState);
  broadcastTurnAttackShot(roomState);
}

function getEnemyCamp(camp) {
  return camp === 'A' ? 'B' : 'A';
}

function finishTurnRoom(roomState, winnerCamp) {
  if (!roomState || roomState.finished) {
    return;
  }
  roomState.finished = true;
  clearTurnTimers(roomState);
  roomState.phase = TURN_PHASE.FINISH;
  roomState.actionCamp = '';
  broadcastTurnSnapshot(roomState);
  broadcastTurn(roomState, {
    type: 'turnGameEnded',
    roomId: roomState.id,
    winnerCamp,
    crystals: roomState.crystals,
  });
  logTurn(roomState, `game ended winner=${winnerCamp}`);
}

function evaluateTurnGameEnd(roomState) {
  const aDead = roomState.crystals.A.hp <= 0;
  const bDead = roomState.crystals.B.hp <= 0;
  if (!aDead && !bDead) {
    return false;
  }
  let winnerCamp = '';
  if (aDead && !bDead) {
    winnerCamp = 'B';
  } else if (bDead && !aDead) {
    winnerCamp = 'A';
  }
  finishTurnRoom(roomState, winnerCamp);
  return true;
}

function applyTurnRoundSettlement(roomState) {
  if (!roomState || !roomState.players) {
    return;
  }
  roomState.settlementSnapshots = roomState.settlementSnapshots || { A: null, B: null };
  roomState.players.forEach((player) => {
    const settlement = buildTurnSettlementSnapshot(roomState, player.camp);
    const coinGain = getTurnCoinSettlementGain(roomState, player.camp);
    settlement.coinGain = coinGain;
    settlement.expGain = 0;
    roomState.settlementSnapshots[player.camp] = settlement;
    if (coinGain > 0) {
      player.coins = Math.max(0, Math.floor(Number(player.coins) || 0)) + coinGain;
    }
    const crystal = roomState.crystals[player.camp];
    if (!crystal || settlement.finalHeal <= 0) {
      return;
    }
    crystal.hp = Math.min(crystal.maxHp, crystal.hp + settlement.finalHeal);
  });
}

function isPointInsideTurnAssistZone(point, zone) {
  if (!point || !zone) {
    return false;
  }
  const radius = Math.max(0, Number(zone.radius) || 0);
  if (radius <= 0) {
    return false;
  }
  return distanceBetweenPoints(point, getTurnZoneCenter(zone)) <= radius;
}

function applyTurnAssistZonesToBullet(roomState, bullet, dt, bulletQueue) {
  let nextSpreadZoneIds = [];
  let nextDamageBoostZoneIds = [];
  const zones = Array.isArray(roomState && roomState.zones) ? roomState.zones : [];
  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i];
    if (!zone) {
      continue;
    }
    const radius = Math.max(0, Number(zone.radius) || 0);
    if (radius <= 0 || !isPointInsideTurnAssistZone(bullet.position, zone)) {
      continue;
    }
    if (zone.zoneType === 'blackHole') {
      // 黑洞区域已从回合制联网玩法中关闭，保留分支仅兼容旧快照。
      continue;
    }
    if (zone.zoneType === 'damageBoost') {
      nextDamageBoostZoneIds.push(zone.id);
      continue;
    }
    if (zone.zoneType === 'spread') {
      nextSpreadZoneIds.push(zone.id);
    }
  }
  for (let i = 0; i < bullet.currentSpreadZoneIds.length; i++) {
    const zoneId = bullet.currentSpreadZoneIds[i];
    if (nextSpreadZoneIds.indexOf(zoneId) >= 0) {
      continue;
    }
    if (bullet.hasTriggeredSpread || bullet.spreadTriggeredZoneIds.length > 0) {
      continue;
    }
    const zone = zones.find((item) => item && item.id === zoneId && item.zoneType === 'spread');
    if (zone) {
      bullet.spreadTriggeredZoneIds.push(zoneId);
      bullet.hasTriggeredSpread = true;
      spawnTurnSpreadBullets(bullet, zone, bulletQueue);
      break;
    }
  }
  for (let i = 0; i < bullet.currentDamageBoostZoneIds.length; i++) {
    const zoneId = bullet.currentDamageBoostZoneIds[i];
    if (nextDamageBoostZoneIds.indexOf(zoneId) >= 0) {
      continue;
    }
    applyTurnDamageBoostPassThrough(bullet, zoneId);
  }
  bullet.currentSpreadZoneIds = nextSpreadZoneIds;
  bullet.currentDamageBoostZoneIds = nextDamageBoostZoneIds;
}

function spawnTurnSpreadBullets(sourceBullet, zone, bulletQueue) {
  const config = getTurnAssistZoneTypeConfig('spread');
  const safeExtraSplit = Math.min(8, Math.max(0, Math.floor(Number(sourceBullet.spreadExtraSplit) || 0)));
  const splitCount = Math.min(12, Math.max(1, Math.floor(Number(config.spreadSplitCount) || 1) + safeExtraSplit));
  const stepAngle = Math.max(0, Number(config.spreadSplitStepAngle) || 0);
  if (splitCount <= 1) {
    return;
  }
  const centerIndex = (splitCount - 1) * 0.5;
  for (let i = 0; i < splitCount; i++) {
    const nextBullet = cloneTurnBulletState(sourceBullet);
    nextBullet.dir = rotateDirection(sourceBullet.dir, (i - centerIndex) * stepAngle);
    nextBullet.currentSpreadZoneIds = [];
    nextBullet.currentDamageBoostZoneIds = [];
    nextBullet.position = {
      x: sourceBullet.position.x + nextBullet.dir.x * 10,
      y: sourceBullet.position.y + nextBullet.dir.y * 10,
    };
    bulletQueue.push(nextBullet);
  }
}

function applyTurnDamageBoostPassThrough(bullet, zoneId) {
  const config = getTurnAssistZoneTypeConfig('damageBoost');
  const maxMultiplier = Math.max(1, Math.floor(Number(config.damageBoostMaxMultiplier) || 1));
  const previousMultiplier = Math.max(1, Number(bullet.damageMultiplier) || 1);
  const nextLevel = Math.min(maxMultiplier, Math.max(1, Math.floor(Number(bullet.damageBoostLevel) || 1)) + 1);
  bullet.damageBoostLevel = nextLevel;
  bullet.damageMultiplier = nextLevel;
  bullet.baseDamage += Math.max(0, Math.floor(Number(bullet.damageBoostTempAttack) || 0));
  bullet.remainingDamage = Math.max(0, Math.round((Number(bullet.remainingDamage) || 0) * (bullet.damageMultiplier / previousMultiplier)));
  if (bullet.damageBoostAppliedZoneIds.indexOf(zoneId) < 0) {
    bullet.damageBoostAppliedZoneIds.push(zoneId);
  }
}

function applyTurnFirstBounceDamageBoostIfNeeded(bullet) {
  const multiplier = Math.max(1, Number(bullet && bullet.firstBounceDamageMultiplier) || 1);
  if (!bullet || bullet.firstBounceDamageBoostApplied || multiplier <= 1) {
    return;
  }
  bullet.baseDamage = Math.max(0, Math.round((Number(bullet.baseDamage) || 0) * multiplier));
  bullet.remainingDamage = Math.max(0, Math.round((Number(bullet.remainingDamage) || 0) * multiplier));
  bullet.firstBounceDamageBoostApplied = true;
}

function consumeTurnBulletDamage(bullet, appliedDamage) {
  bullet.remainingDamage = Math.max(0, Math.floor(Number(bullet.remainingDamage) || 0) - Math.max(0, Math.floor(Number(appliedDamage) || 0)));
}

function applyTurnMirrorDamageReduction(roomState, bullet, mirrorCamp) {
  if (!bullet || Math.max(0, Number(bullet.remainingDamage) || 0) < 1) {
    return;
  }
  const counts = buildTurnBondCountsFromRoom(roomState, mirrorCamp);
  const reductionRatio = getTurnMirrorDamageReductionRatio(counts.mirror);
  if (reductionRatio <= 0) {
    return;
  }
  bullet.remainingDamage = Math.max(0, Math.floor(Number(bullet.remainingDamage) || 0) * (1 - reductionRatio));
}

function getTurnDynamicObstacleHit(roomState, point, radius) {
  const obstacleIds = Object.keys(roomState && roomState.obstacles ? roomState.obstacles : {});
  for (let i = 0; i < obstacleIds.length; i++) {
    const obstacle = roomState.obstacles[obstacleIds[i]];
    const rects = getTurnObstacleRectsAt(obstacle.x, obstacle.y, obstacle.layout);
    for (let j = 0; j < rects.length; j++) {
      if (circleRectIntersects(point, radius, rects[j])) {
        return {
          obstacle,
          cellIndex: j,
          rect: rects[j],
        };
      }
    }
  }
  return null;
}

function getTurnObstacleCellCenter(obstacle, cellIndex) {
  const grid = TURN_CONFIG.obstacleGrid || 32;
  const layout = Array.isArray(obstacle && obstacle.layout) && obstacle.layout.length > 0 ? obstacle.layout : [{ x: 0, y: 0 }];
  const cell = layout[Math.max(0, Math.min(layout.length - 1, Math.floor(Number(cellIndex) || 0)))] || { x: 0, y: 0 };
  return {
    x: Math.round((Number(obstacle && obstacle.x) || 0) + (Number(cell.x) || 0) * grid),
    y: Math.round((Number(obstacle && obstacle.y) || 0) + (Number(cell.y) || 0) * grid),
  };
}

function getTurnCampOccupiedCellCenters(roomState, camp) {
  const result = [];
  Object.keys(roomState && roomState.obstacles ? roomState.obstacles : {}).forEach((id) => {
    const obstacle = roomState.obstacles[id];
    if (!obstacle || obstacle.camp !== camp) {
      return;
    }
    const layout = Array.isArray(obstacle.layout) && obstacle.layout.length > 0 ? obstacle.layout : [{ x: 0, y: 0 }];
    for (let i = 0; i < layout.length; i++) {
      result.push(getTurnObstacleCellCenter(obstacle, i));
    }
  });
  const pose = roomState && roomState.tankPoses ? roomState.tankPoses[camp] : null;
  if (pose) {
    result.push({ x: Math.round(Number(pose.x) || 0), y: Math.round(Number(pose.y) || 0) });
  }
  return result;
}

function getRandomTurnPointInBuildArea(camp) {
  const area = TURN_MAP_LAYOUT.buildAreas[camp === 'B' ? 'B' : 'A'];
  const grid = TURN_CONFIG.obstacleGrid || 32;
  if (!area) {
    return { x: 0, y: camp === 'B' ? 320 : -320 };
  }
  const minX = Math.ceil(area.minX / grid);
  const maxX = Math.floor(area.maxX / grid);
  const minY = Math.ceil(area.minY / grid);
  const maxY = Math.floor(area.maxY / grid);
  return {
    x: clamp(Math.round(randomBetween(minX, maxX + 1)) * grid, area.minX, area.maxX),
    y: clamp(Math.round(randomBetween(minY, maxY + 1)) * grid, area.minY, area.maxY),
  };
}

function pickTurnMissileTarget(roomState, targetCamp, mainCannonChance = 0) {
  const safeMainCannonChance = clamp(Number(mainCannonChance) || 0, 0, 1);
  const targetPose = roomState && roomState.tankPoses ? roomState.tankPoses[targetCamp] : null;
  if (targetPose && Math.random() < safeMainCannonChance) {
    return { x: Math.round(Number(targetPose.x) || 0), y: Math.round(Number(targetPose.y) || 0) };
  }
  const occupied = getTurnCampOccupiedCellCenters(roomState, targetCamp);
  if (occupied.length > 0) {
    return occupied[Math.floor(randomBetween(0, occupied.length))] || occupied[0];
  }
  return getRandomTurnPointInBuildArea(targetCamp);
}

function applyTurnMissileExplosion(roomState, triggerObstacle, triggerCellIndex, result) {
  const targetCamp = getEnemyCamp(triggerObstacle.camp);
  const config = TURN_CONFIG.missileSilo || {};
  const levels = normalizeObstacleCellLevels(triggerObstacle);
  const triggerLevel = clamp(Math.floor(Number(levels[triggerCellIndex]) || Number(triggerObstacle.resourceLevel) || 1), 1, getResourceMergeMaxLevel());
  const missileCounts = buildTurnBondCountsFromRoom(roomState, triggerObstacle.camp);
  const missileBaseDamage = Math.max(1, Math.floor(getResourcePropertyValue('missile_silo', triggerLevel) || Number(config.directDamage) || 10));
  const damage = Math.max(1, getTurnBondValue('missile_silo', missileCounts.missile_silo, missileBaseDamage));
  const radiusCells = Math.max(0, Math.floor(Number(config.explosionRadiusCells) || 1));
  const mainCannonChance = clamp((Number(config.mainCannonChance) || 0) + getTurnMissileSiloHitTankChanceBonus(missileCounts.missile_silo), 0, 1);
  const target = pickTurnMissileTarget(roomState, targetCamp, mainCannonChance);
  const grid = TURN_CONFIG.obstacleGrid || 32;
  const maxCellDistance = radiusCells * grid + grid * 0.5;
  const event = {
    triggerObstacleId: triggerObstacle.id,
    triggerCamp: triggerObstacle.camp,
    targetCamp,
    from: getTurnObstacleCellCenter(triggerObstacle, triggerCellIndex),
    target,
    damage,
    radiusCells,
    mainCannonChance,
    damagedObstacles: [],
    damagedCrystals: [],
  };

  const obstacleIds = Object.keys(roomState && roomState.obstacles ? roomState.obstacles : {});
  obstacleIds.forEach((id) => {
    const obstacle = roomState.obstacles[id];
    if (!obstacle || obstacle.camp !== targetCamp || !Array.isArray(obstacle.layout)) {
      return;
    }
    for (let i = obstacle.layout.length - 1; i >= 0; i--) {
      const center = getTurnObstacleCellCenter(obstacle, i);
      if (distanceBetweenPoints(center, target) > maxCellDistance) {
        continue;
      }
      const applied = applyObstacleDamage(roomState, id, i, damage);
      if (!applied || applied.appliedDamage <= 0) {
        continue;
      }
      result.hitType = result.hitType || 'obstacle';
      result.obstacleHits.push({ obstacleId: id, cellIndex: i, damage: applied.appliedDamage, source: 'missile_silo' });
      if (applied.destroyedCell) {
        result.destroyedCells.push({ obstacleId: id, cellIndex: i, camp: obstacle.camp, slotType: obstacle.slotType });
      }
      if (applied.destroyedObstacle && result.destroyedIds.indexOf(id) < 0) {
        result.destroyedIds.push(id);
      }
      event.damagedObstacles.push({
        obstacleId: id,
        camp: obstacle.camp,
        cellIndex: i,
        damage: applied.appliedDamage,
      });
    }
  });

  const targetPose = roomState && roomState.tankPoses ? roomState.tankPoses[targetCamp] : null;
  const targetCrystal = roomState && roomState.crystals ? roomState.crystals[targetCamp] : null;
  if (targetPose && targetCrystal && distanceBetweenPoints(targetPose, target) <= maxCellDistance + 38) {
    const appliedDamage = Math.min(Math.max(0, Number(targetCrystal.hp) || 0), damage);
    if (appliedDamage > 0) {
      targetCrystal.hp = Math.max(0, targetCrystal.hp - appliedDamage);
      event.damagedCrystals.push({ camp: targetCamp, damage: appliedDamage });
    }
  }

  result.missileEvents.push(event);
}

function reflectTurnBulletDir(bullet, rect) {
  const position = bullet.position;
  const nearestX = clamp(position.x, rect.x, rect.x + rect.width);
  const nearestY = clamp(position.y, rect.y, rect.y + rect.height);
  const dx = position.x - nearestX;
  const dy = position.y - nearestY;
  let nextDir = { x: bullet.dir.x, y: bullet.dir.y };
  if (dx === 0 && dy === 0) {
    const leftDist = Math.abs(position.x - rect.x);
    const rightDist = Math.abs(rect.x + rect.width - position.x);
    const bottomDist = Math.abs(position.y - rect.y);
    const topDist = Math.abs(rect.y + rect.height - position.y);
    const minDist = Math.min(leftDist, rightDist, bottomDist, topDist);
    if (minDist === leftDist || minDist === rightDist) {
      nextDir.x *= -1;
    } else {
      nextDir.y *= -1;
    }
  } else if (Math.abs(dx) >= Math.abs(dy)) {
    nextDir.x *= -1;
  } else {
    nextDir.y *= -1;
  }
  bullet.dir = normalizeVec(nextDir, bullet.dir);
  if (dx !== 0 || dy !== 0) {
    let nx = dx;
    let ny = dy;
    const len = Math.sqrt(nx * nx + ny * ny);
    if (len > 0) {
      const pushDist = (Number(TURN_CONFIG.bulletRadius) || 10) + 1;
      nx /= len;
      ny /= len;
      bullet.position.x = nearestX + nx * pushDist;
      bullet.position.y = nearestY + ny * pushDist;
    }
  }
}

function getTurnBuildCampAt(point) {
  const areaA = TURN_MAP_LAYOUT.buildAreas.A;
  const areaB = TURN_MAP_LAYOUT.buildAreas.B;
  if (point && point.x >= areaA.minX && point.x <= areaA.maxX && point.y >= areaA.minY && point.y <= areaA.maxY) {
    return 'A';
  }
  if (point && point.x >= areaB.minX && point.x <= areaB.maxX && point.y >= areaB.minY && point.y <= areaB.maxY) {
    return 'B';
  }
  return '';
}

function shouldTurnBulletIgnoreOwnResource(bullet, obstacle) {
  return !!(bullet && obstacle && obstacle.camp === bullet.camp && !canTurnBulletDamageOwnCamp(bullet));
}

function resolveTurnBulletHit(roomState, bullet, result) {
  const dynamicHit = getTurnDynamicObstacleHit(roomState, bullet.position, Number(TURN_CONFIG.bulletRadius) || 10);
  if (dynamicHit) {
    if (shouldTurnBulletIgnoreOwnResource(bullet, dynamicHit.obstacle)) {
      return false;
    }
    const isMirror = dynamicHit.obstacle.slotType === 'mirror';
    const rawDamageForCell = isMirror
      ? Math.max(0, Number(dynamicHit.obstacle.cellHp && dynamicHit.obstacle.cellHp[dynamicHit.cellIndex]) || 0)
      : bullet.remainingDamage;
    const applied = applyObstacleDamage(roomState, dynamicHit.obstacle.id, dynamicHit.cellIndex, rawDamageForCell);
    if (applied) {
      if (!isMirror) {
        consumeTurnBulletDamage(bullet, applied.appliedDamage);
      }
      result.hitType = result.hitType || 'obstacle';
      result.obstacleHits.push({
        obstacleId: dynamicHit.obstacle.id,
        cellIndex: dynamicHit.cellIndex,
        damage: applied.appliedDamage,
      });
      if (applied.destroyedCell) {
        result.destroyedCells.push({
          obstacleId: dynamicHit.obstacle.id,
          cellIndex: dynamicHit.cellIndex,
          camp: dynamicHit.obstacle.camp,
          slotType: dynamicHit.obstacle.slotType,
        });
      }
      if (applied.destroyedObstacle && result.destroyedIds.indexOf(dynamicHit.obstacle.id) < 0) {
        result.destroyedIds.push(dynamicHit.obstacle.id);
      }
      if (dynamicHit.obstacle.slotType === 'missile_silo' && applied.appliedDamage > 0 && dynamicHit.obstacle.camp !== bullet.camp) {
        applyTurnMissileExplosion(roomState, dynamicHit.obstacle, dynamicHit.cellIndex, result);
      }
    }
    if (isMirror) {
      reflectTurnBulletDir(bullet, dynamicHit.rect);
      bullet.hasBounced = true;
      applyTurnMirrorDamageReduction(roomState, bullet, dynamicHit.obstacle.camp);
      applyTurnFirstBounceDamageBoostIfNeeded(bullet);
      return false;
    }
    return bullet.remainingDamage <= 0;
  }

  const staticObstacles = getTurnActiveStaticObstacles(roomState);
  for (let i = 0; i < staticObstacles.length; i++) {
    const obstacle = staticObstacles[i];
    if (!circleRectIntersects(bullet.position, Number(TURN_CONFIG.bulletRadius) || 10, obstacle)) {
      continue;
    }
    if (bullet.remainingBounce <= 0) {
      return true;
    }
    reflectTurnBulletDir(bullet, obstacle);
    bullet.remainingBounce = Math.max(0, bullet.remainingBounce - 1);
    bullet.hasBounced = true;
    applyTurnFirstBounceDamageBoostIfNeeded(bullet);
    return false;
  }

  const targetCamp = getTurnTankHitCamp(roomState, bullet);
  if (!targetCamp) {
    return false;
  }
  const crystal = roomState && roomState.crystals ? roomState.crystals[targetCamp] : null;
  if (crystal) {
    const appliedDamage = Math.min(Math.max(0, Number(crystal.hp) || 0), Math.max(0, Math.floor(Number(bullet.remainingDamage) || 0)));
    result.hitType = 'crystal';
    result.targetCamp = targetCamp;
    result.damage += appliedDamage;
    if (targetCamp !== bullet.camp && appliedDamage > 0) {
      result.enemyTankHitCount = Math.max(0, Math.floor(Number(result.enemyTankHitCount) || 0)) + 1;
    }
    consumeTurnBulletDamage(bullet, appliedDamage);
    return bullet.remainingDamage <= 0;
  }
  return false;
}

function keepTurnBulletInMap(bullet) {
  const rect = TURN_MAP_LAYOUT.mapRect;
  const radius = Number(TURN_CONFIG.bulletRadius) || 10;
  const minX = rect.minX + radius;
  const maxX = rect.maxX - radius;
  const minY = rect.minY + radius;
  const maxY = rect.maxY - radius;
  let bounced = false;
  if (bullet.position.x < minX || bullet.position.x > maxX) {
    if (bullet.remainingBounce <= 0) {
      return false;
    }
    bullet.dir.x *= -1;
    bullet.position.x = clamp(bullet.position.x, minX, maxX);
    bounced = true;
  }
  if (bullet.position.y < minY || bullet.position.y > maxY) {
    if (bullet.remainingBounce <= 0) {
      return false;
    }
    bullet.dir.y *= -1;
    bullet.position.y = clamp(bullet.position.y, minY, maxY);
    bounced = true;
  }
  if (bounced) {
    bullet.remainingBounce = Math.max(0, bullet.remainingBounce - 1);
    bullet.hasBounced = true;
    applyTurnFirstBounceDamageBoostIfNeeded(bullet);
    bullet.dir = normalizeVec(bullet.dir, bullet.dir);
  }
  return true;
}

function simulateTurnBulletResults(roomState, player) {
  const attack = roomState && roomState.currentAttack;
  if (!roomState || !player || !attack || !attack.pose || !attack.snapshot) {
    return {
      hitType: '',
      targetCamp: '',
      targetId: '',
      damage: 0,
      obstacleHits: [],
      destroyedIds: [],
      destroyedCells: [],
      missileEvents: [],
      expGain: 0,
      enemyTankHitCount: 0,
    };
  }
  const bulletQueue = [];
  const totalShots = Math.max(1, Number(attack.snapshot.totalShots) || 1);
  for (let i = 0; i < totalShots; i++) {
    bulletQueue.push(createTurnServerBullet(roomState, player.camp, attack.pose, attack.snapshot));
  }
  const result = {
    hitType: '',
    targetCamp: '',
    targetId: '',
    damage: 0,
    obstacleHits: [],
    destroyedIds: [],
    destroyedCells: [],
    missileEvents: [],
    expGain: 0,
    enemyTankHitCount: 0,
  };
  const dt = Math.max(0.001, Number(TURN_CONFIG.bulletSimStepSeconds) || (1 / 60));
  const bulletSpeed = Math.max(1, Number(TURN_CONFIG.bulletSpeed) || 620);
  const maxTicks = Math.ceil((Math.max(0.1, Number(TURN_CONFIG.bulletMaxLifeSeconds) || 30) + 1) / dt);
  while (bulletQueue.length > 0) {
    const bullet = bulletQueue.shift();
    for (let tick = 0; tick < maxTicks; tick++) {
      bullet.lifeLeft -= dt;
      if (bullet.lifeLeft <= 0 || bullet.remainingDamage <= 0) {
        break;
      }
      applyTurnAssistZonesToBullet(roomState, bullet, dt, bulletQueue);
      const previousPosition = { x: bullet.position.x, y: bullet.position.y };
      bullet.position = addVec(bullet.position, mulVec(bullet.dir, bulletSpeed * dt));
      updateTurnBulletOwnBuildAreaPass(bullet, previousPosition);
      if (!keepTurnBulletInMap(bullet)) {
        break;
      }
      if (resolveTurnBulletHit(roomState, bullet, result)) {
        break;
      }
    }
  }
  return result;
}

function handleTurnBulletResult(ws, msg) {
  const roomState = getTurnRoom(ws);
  const player = getTurnPlayer(roomState, ws);
  if (!roomState || !player || roomState.phase !== TURN_PHASE.WAIT_BULLET || roomState.waitingForBulletCamp !== player.camp) {
    sendTurnError(ws, '当前不能提交弹道结果', 'invalidPhase');
    return;
  }
  const simulated = simulateTurnBulletResults(roomState, player);
  let awardedCoins = 0;
  let destroyedEnemyCellCount = 0;
  if (simulated.hitType === 'crystal' && simulated.targetCamp && roomState.crystals[simulated.targetCamp]) {
    roomState.crystals[simulated.targetCamp].hp = Math.max(0, roomState.crystals[simulated.targetCamp].hp - simulated.damage);
  }
  if (simulated.obstacleHits.length > 0) {
    if (Array.isArray(simulated.destroyedCells)) {
      for (let i = 0; i < simulated.destroyedCells.length; i++) {
        const cell = simulated.destroyedCells[i];
        if (cell && cell.camp && cell.camp !== player.camp) {
          destroyedEnemyCellCount += 1;
        }
      }
    }
  }
  const coinEconomy = TURN_CONFIG.coinEconomy || {};
  const coinPerCell = Math.max(0, Number(
    coinEconomy.destroyedEnemyResourceCoinReward != null
      ? coinEconomy.destroyedEnemyResourceCoinReward
      : coinEconomy.perDestroyedEnemyCell,
  ) || 0);
  const attackerCounts = buildTurnBondCountsFromRoom(roomState, player.camp);
  const bountyMultiplier = getTurnBondBountyMultiplier('coin', attackerCounts.coin);
  const coinPerEnemyTankHit = Math.max(0, Number(coinEconomy.enemyTankHitCoinReward) || 0);
  const hitEnemyTankCount = Math.max(0, Math.floor(Number(simulated.enemyTankHitCount) || 0));
  awardedCoins = Math.floor(destroyedEnemyCellCount * coinPerCell * bountyMultiplier + hitEnemyTankCount * coinPerEnemyTankHit);
  if (awardedCoins > 0) {
    player.coins = Math.max(0, Math.floor(Number(player.coins) || 0)) + awardedCoins;
  }

  broadcastTurn(roomState, {
    type: 'bulletResult',
    roomId: roomState.id,
    camp: player.camp,
    playerId: player.playerId,
    result: {
      hitType: simulated.hitType,
      targetId: simulated.targetId,
      targetCamp: simulated.targetCamp,
      damage: simulated.damage,
      expGain: 0,
      coinGain: awardedCoins,
      enemyTankHitCount: hitEnemyTankCount,
      destroyedIds: simulated.destroyedIds,
      missileEvents: simulated.missileEvents,
    },
  });
  broadcastTurnSnapshot(roomState);
  if (!evaluateTurnGameEnd(roomState)) {
    advanceTurnAttack(roomState);
  }
}

function applyTurnUpgrade(player, option) {
  if (!option) {
    return;
  }
  const previousStacks = { ...(player.upgrades.stacks || {}) };
  player.upgrades.stacks[option.id] = getTurnUpgradeStack(player, option.id) + 1;
  const derived = refreshTurnDerivedUpgradeState(player);
  player.upgrades.bulletBounce = derived.bulletBounceBonus;
  player.upgrades.roundResourceBonus = derived.roundResourceBonus;
  const effect = option.effect || {};
  if (effect.type === 'resource_hp') {
    const roomState = getTurnRoom(player.socket);
    refreshTurnCampResourceHpByUpgrade(roomState, player.camp, effect.targetResourceType, previousStacks);
  }
}

function refreshTurnCampResourceHpByUpgrade(roomState, camp, targetResourceType, previousStacks = null) {
  if (!roomState || !roomState.obstacles || !targetResourceType || targetResourceType === 'mirror' || targetResourceType === 'attack') {
    return;
  }
  const player = getTurnPlayerByCamp(roomState, camp);
  const currentDerived = player && player.upgrades ? player.upgrades.derived : null;
  const previousDerived = buildTurnDerivedUpgradeState(previousStacks || {});
  Object.keys(roomState.obstacles).forEach((id) => {
    const obstacle = roomState.obstacles[id];
    if (!obstacle || obstacle.camp !== camp || obstacle.slotType !== targetResourceType || !Array.isArray(obstacle.cellHp)) {
      return;
    }
    obstacle.cellLevels = normalizeObstacleCellLevels(obstacle);
    const previousCellHp = buildObstacleCellHp(obstacle.slotType, obstacle.resourceCount, obstacle.layout.length, null, roomState, camp, previousDerived, obstacle.cellLevels);
    const nextCellHp = buildObstacleCellHp(obstacle.slotType, obstacle.resourceCount, obstacle.layout.length, null, roomState, camp, currentDerived, obstacle.cellLevels);
    for (let i = 0; i < obstacle.cellHp.length && i < nextCellHp.length; i++) {
      const delta = Math.max(0, nextCellHp[i] - (Number(previousCellHp[i]) || 0));
      obstacle.cellHp[i] = Math.min(nextCellHp[i], Math.max(0, Number(obstacle.cellHp[i]) || 0) + delta);
    }
    obstacle.maxHp = getObstacleMaxHpForLevels(obstacle.slotType, obstacle.cellLevels, roomState, camp);
    obstacle.hp = sumObstacleCellHp(obstacle);
    obstacle.cellHpList = obstacle.cellHp.slice();
    obstacle.levels = obstacle.cellLevels.slice();
  });
}

function handleTurnUpgradePick(ws, msg) {
  sendTurnError(ws, '升级模块已关闭', 'upgradeDisabled');
}

function handleTurnDisconnect(ws) {
  const roomState = getTurnRoom(ws);
  if (!roomState) {
    return false;
  }
  const player = getTurnPlayer(roomState, ws);
  if (player) {
    player.disconnected = true;
  }
  ws.turnRoomId = '';
  ws.turnCamp = '';
  ws.turnPlayerId = -1;

  if (roomState.phase === TURN_PHASE.WAITING) {
    roomState.players = roomState.players.filter((item) => item.socket !== ws);
    broadcastTurn(roomState, {
      type: 'turnPlayerCount',
      roomId: roomState.id,
      count: roomState.players.length,
      max: TURN_MAX_PLAYERS,
    });
  } else if (!roomState.finished && player) {
    finishTurnRoom(roomState, getEnemyCamp(player.camp));
  }

  if (roomState.players.filter((item) => isSocketOpen(item.socket)).length <= 0) {
    clearTurnTimers(roomState);
    delete turnRooms[roomState.id];
    logTurn(roomState, 'removed empty room');
  }
  return true;
}

function getConnectedPlayers() {
  return room.players.filter((p) => !p.disconnected && isSocketOpen(p));
}

function getAlivePlayers() {
  return room.players.filter((p) => !p.dead && !p.disconnected && isSocketOpen(p));
}

function getRoomStatePayload(extra = {}) {
  return {
    type: 'roomState',
    roomId: room.id,
    state: room.state,
    playerCount: getConnectedPlayers().length,
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,
    countdown: room.countdownRemaining,
    currentFrame: room.currentFrame,
    winnerPlayerId: room.winnerPlayerId,
    ...extra,
  };
}

function broadcast(json) {
  const data = JSON.stringify(json);
  room.players.forEach((p) => {
    if (isSocketOpen(p)) {
      p.send(data);
    }
  });
}

function broadcastRoomState(extra = {}) {
  const payload = getRoomStatePayload(extra);
  broadcast(payload);
  if (room.state === ROOM_STATE.WAITING || room.state === ROOM_STATE.COUNTDOWN) {
    broadcast({
      type: 'playerCount',
      count: payload.playerCount,
      max: MAX_PLAYERS,
      min: MIN_PLAYERS,
    });
  }
  if (room.state === ROOM_STATE.COUNTDOWN) {
    broadcast({
      type: 'countdown',
      seconds: room.countdownRemaining,
    });
  }
}

function syncLobbyPlayerIds() {
  room.players.forEach((p, index) => {
    p.playerId = index;
  });
}

function shuffle(array) {
  const list = array.slice();
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = list[i];
    list[i] = list[j];
    list[j] = temp;
  }
  return list;
}

function assignSpawnSlots(playerCount) {
  const slots = [0, 1, 2, 3];
  return shuffle(slots).slice(0, Math.min(playerCount, slots.length));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getPlayerEnergyNeedExp(player) {
  return PLAYER_EXP_BASE + Math.max(0, (player.energyLevel || 1) - 1) * PLAYER_EXP_STEP;
}

function getPlayerBulletBounceCount(player) {
  const energyLevel = player && Number.isFinite(player.energyLevel) ? player.energyLevel : 1;
  if (energyLevel < PLAYER_BOUNCE_UNLOCK_ENERGY_LEVEL) {
    return 0;
  }
  return clamp(energyLevel - PLAYER_BOUNCE_UNLOCK_ENERGY_LEVEL + 1, 1, PLAYER_BOUNCE_MAX_COUNT);
}

function createPlayerState(setup = {}) {
  const tankType = MULTIPLAYER_DEFAULT_TANK_TYPE;
  const playerLevel = MULTIPLAYER_FIXED_PLAYER_LEVEL;
  const baseHp = MULTIPLAYER_FIXED_BASE_HP;
  const baseAtk = MULTIPLAYER_FIXED_BASE_ATK;
  const baseSpeed = MULTIPLAYER_FIXED_BASE_SPEED;
  return {
    tankType,
    playerLevel,
    baseHp,
    baseAtk,
    baseSpeed,
    baseAttackRadius: MULTIPLAYER_FIXED_ATTACK_RADIUS,
    hp: baseHp,
    maxHp: baseHp,
    atk: baseAtk,
    moveSpeedScale: 1,
    energyLevel: 1,
    energyExp: 0,
    energyNeedExp: PLAYER_EXP_BASE,
    bulletBounceCount: 0,
    tarAmmoCount: 0,
    blackHoleAmmoCount: 0,
    activePickupType: '',
    freeBulletCount: PLAYER_FREE_BULLET_MAX,
    stopFireTime: 0,
    freeBulletRecoverTime: 0,
    shotCooldownRemaining: 0,
  };
}

function applyPlayerSetup(player, setup = {}) {
  const state = createPlayerState(setup);
  player.tankType = state.tankType;
  player.playerLevel = state.playerLevel;
  player.baseHp = state.baseHp;
  player.baseAtk = state.baseAtk;
  player.baseSpeed = state.baseSpeed;
  player.baseAttackRadius = state.baseAttackRadius;
  player.hp = state.hp;
  player.maxHp = state.maxHp;
  player.atk = state.atk;
  player.moveSpeedScale = state.moveSpeedScale;
  player.energyLevel = state.energyLevel;
  player.energyExp = state.energyExp;
  player.energyNeedExp = state.energyNeedExp;
  player.bulletBounceCount = getPlayerBulletBounceCount(player);
  player.tarAmmoCount = state.tarAmmoCount;
  player.blackHoleAmmoCount = state.blackHoleAmmoCount;
  player.activePickupType = state.activePickupType || '';
  player.freeBulletCount = state.freeBulletCount;
  player.stopFireTime = state.stopFireTime;
  player.freeBulletRecoverTime = state.freeBulletRecoverTime;
  player.shotCooldownRemaining = state.shotCooldownRemaining;
}

function resetPlayerRuntimeState(player) {
  const state = createPlayerState({
    tankType: player.tankType,
    playerLevel: player.playerLevel,
    baseHp: player.baseHp,
    baseAtk: player.baseAtk,
    baseSpeed: player.baseSpeed,
    baseAttackRadius: player.baseAttackRadius,
  });
  player.hp = state.hp;
  player.maxHp = state.maxHp;
  player.atk = state.atk;
  player.moveSpeedScale = state.moveSpeedScale;
  player.energyLevel = state.energyLevel;
  player.energyExp = state.energyExp;
  player.energyNeedExp = state.energyNeedExp;
  player.bulletBounceCount = getPlayerBulletBounceCount(player);
  player.tarAmmoCount = state.tarAmmoCount;
  player.blackHoleAmmoCount = state.blackHoleAmmoCount;
  player.activePickupType = state.activePickupType || '';
  player.freeBulletCount = state.freeBulletCount;
  player.stopFireTime = state.stopFireTime;
  player.freeBulletRecoverTime = state.freeBulletRecoverTime;
  player.shotCooldownRemaining = state.shotCooldownRemaining;
}

function sanitizeSpawnPoints(points) {
  if (!Array.isArray(points)) {
    return [];
  }
  const result = [];
  const used = {};
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (!point) {
      continue;
    }
    const x = Number(point.x);
    const y = Number(point.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }
    const key = `${Math.round(x)}_${Math.round(y)}`;
    if (used[key]) {
      continue;
    }
    used[key] = true;
    result.push({
      x,
      y,
    });
    if (result.length >= 512) {
      break;
    }
  }
  return result;
}

function sanitizeMapBounds(bounds) {
  if (!bounds || typeof bounds !== 'object') {
    return null;
  }
  const halfWidth = Number(bounds.halfWidth);
  const halfHeight = Number(bounds.halfHeight);
  if (!Number.isFinite(halfWidth) || !Number.isFinite(halfHeight) || halfWidth <= 0 || halfHeight <= 0) {
    return null;
  }
  return {
    halfWidth,
    halfHeight,
  };
}

function sanitizeBushes(list) {
  if (!Array.isArray(list)) {
    return [];
  }
  const result = [];
  const used = {};
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item || typeof item !== 'object') {
      continue;
    }
    const id = item.id == null ? result.length + 1 : Number(item.id);
    const x = Number(item.x);
    const y = Number(item.y);
    const radius = Number(item.radius);
    const width = Number(item.width);
    const height = Number(item.height);
    if (!Number.isFinite(id) || !Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }
    const key = `${Math.round(x)}:${Math.round(y)}`;
    if (used[key]) {
      continue;
    }
    used[key] = true;
    const point = clampPointToBounds({ x, y }, MULTIPLAYER_BUSH_SPAWN_PADDING);
    const rects = Array.isArray(item.rects)
      ? item.rects.map((rect) => {
        if (!rect || typeof rect !== 'object') {
          return null;
        }
        const rectX = Number(rect.x);
        const rectY = Number(rect.y);
        const rectWidth = Number(rect.width);
        const rectHeight = Number(rect.height);
        if (!Number.isFinite(rectX) || !Number.isFinite(rectY) || !Number.isFinite(rectWidth) || !Number.isFinite(rectHeight)) {
          return null;
        }
        return {
          x: Math.round(rectX),
          y: Math.round(rectY),
          width: Math.max(1, Math.round(rectWidth)),
          height: Math.max(1, Math.round(rectHeight)),
        };
      }).filter(Boolean)
      : [];
    result.push({
      id,
      x: Math.round(point.x),
      y: Math.round(point.y),
      width: Number.isFinite(width) && width > 0 ? Math.round(width) : 0,
      height: Number.isFinite(height) && height > 0 ? Math.round(height) : 0,
      radius: Number.isFinite(radius) && radius > 24 ? Math.round(radius) : MULTIPLAYER_BUSH_RADIUS,
      rects,
    });
  }
  return result;
}

function sanitizePlayerSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return null;
  }
  const x = Number(snapshot.x);
  const y = Number(snapshot.y);
  const dirX = Number(snapshot.dirX);
  const dirY = Number(snapshot.dirY);
  const speed = Number(snapshot.speed);
  const radius = Number(snapshot.radius);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  const dirLen = Math.sqrt((Number.isFinite(dirX) ? dirX : 0) ** 2 + (Number.isFinite(dirY) ? dirY : 0) ** 2);
  return {
    x,
    y,
    dirX: dirLen > 0.001 ? dirX / dirLen : PLAYER_DIR_FALLBACK.x,
    dirY: dirLen > 0.001 ? dirY / dirLen : PLAYER_DIR_FALLBACK.y,
    speed: Number.isFinite(speed) ? Math.max(0, speed) : 0,
    radius: Number.isFinite(radius) ? Math.max(16, radius) : PLAYER_DEFAULT_RADIUS,
  };
}

function sanitizeAimInput(aim) {
  if (!aim || typeof aim !== 'object') {
    return null;
  }
  const x = Number(aim.x);
  const y = Number(aim.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  const len = Math.sqrt(x * x + y * y);
  if (len <= 0.001) {
    return null;
  }
  return {
    x: x / len,
    y: y / len,
  };
}

function sanitizeCoverActionInput(action) {
  if (!action || typeof action !== 'object') {
    return null;
  }
  if (action.coverId == null) {
    return null;
  }
  const seq = Number(action.seq);
  const coverId = Number(action.coverId);
  const actionType = action.action === 'detach' ? 'detach' : 'attach';
  if (!Number.isFinite(seq) || seq <= 0 || !Number.isFinite(coverId)) {
    return null;
  }
  return {
    seq: Math.floor(seq),
    coverId: Math.floor(coverId),
    action: actionType,
  };
}

function sanitizeEnergyEggActionInput(action) {
  if (!action || typeof action !== 'object') {
    return null;
  }
  if (action.eggId == null) {
    return null;
  }
  const seq = Number(action.seq);
  const eggId = Number(action.eggId);
  const actionType = action.action === 'detach' ? 'detach' : 'attach';
  if (!Number.isFinite(seq) || seq <= 0 || !Number.isFinite(eggId)) {
    return null;
  }
  return {
    seq: Math.floor(seq),
    eggId: Math.floor(eggId),
    action: actionType,
  };
}

function createMatchFlowState() {
  return {
    openingAnnounced: false,
    energyEggAnnounced: false,
    poisonWarningAnnounced: false,
    poisonStartedAnnounced: false,
    finalCircleAnnounced: false,
  };
}

function distanceSqr(a, b) {
  const dx = (a.x || 0) - (b.x || 0);
  const dy = (a.y || 0) - (b.y || 0);
  return dx * dx + dy * dy;
}

function clampPointToBounds(point, padding = 0) {
  const bounds = room.mapBounds || { halfWidth: 1400, halfHeight: 900 };
  return {
    x: clamp(point.x, -bounds.halfWidth + padding, bounds.halfWidth - padding),
    y: clamp(point.y, -bounds.halfHeight + padding, bounds.halfHeight - padding),
  };
}

function getSpawnPositionBySlot(slot) {
  const list = room.spawnCandidates || [];
  if (list.length <= 0) {
    return { x: 0, y: 0 };
  }
  const index = slot == null ? 0 : slot % list.length;
  return list[index] || list[0];
}

function syncPlayerSpawnPosition(player) {
  const pos = getSpawnPositionBySlot(player.spawnSlot);
  player.posX = pos.x;
  player.posY = pos.y;
  player.dirX = PLAYER_DIR_FALLBACK.x;
  player.dirY = PLAYER_DIR_FALLBACK.y;
  player.lastSnapshot = null;
}

function getPlayerRuntimePosition(player) {
  if (!player) {
    return { x: 0, y: 0 };
  }
  if (player.lastSnapshot) {
    return {
      x: player.lastSnapshot.x,
      y: player.lastSnapshot.y,
    };
  }
  return {
    x: Number.isFinite(player.posX) ? player.posX : 0,
    y: Number.isFinite(player.posY) ? player.posY : 0,
  };
}

function createSafeZoneState(bounds = room.mapBounds) {
  const halfWidth = Math.max(0, Number(bounds && bounds.halfWidth) || 0);
  const halfHeight = Math.max(0, Number(bounds && bounds.halfHeight) || 0);
  const startRadiusBase = Math.min(halfWidth, halfHeight);
  const startRadius = Math.max(
    SAFE_ZONE_MIN_RADIUS,
    Math.floor(Math.max(0, startRadiusBase - SAFE_ZONE_START_PADDING))
  );
  const targetRadius = Math.max(
    SAFE_ZONE_MIN_RADIUS,
    Math.floor(startRadius * SAFE_ZONE_FIXED_RADIUS_RATIO)
  );
  return {
    centerX: 0,
    centerY: 0,
    startRadius,
    targetRadius: Math.min(startRadius, targetRadius),
    radius: Math.min(startRadius, targetRadius),
    startDelay: 0,
    shrinkDuration: 0,
    damageInterval: SAFE_ZONE_DAMAGE_INTERVAL,
    damagePerTick: SAFE_ZONE_DAMAGE_PER_TICK,
    damagePercent: 0,
    damageMode: 'outsideFlat',
    poisonStartTime: SAFE_ZONE_POISON_START_SECONDS,
    poisonActive: false,
    active: true,
    shrinking: false,
    finished: false,
    progress: 1,
    phase: 'safe',
  };
}

function buildSafeZoneStateCommand() {
  if (!room.safeZone) {
    room.safeZone = createSafeZoneState();
  }
  const safeZone = room.safeZone;
  const elapsed = Math.max(0, room.elapsedSeconds);
  const poisonRemaining = Math.max(0, (safeZone.poisonStartTime || 0) - elapsed);
  return {
    type: 'safeZoneState',
    safeZone: {
      centerX: safeZone.centerX,
      centerY: safeZone.centerY,
      startRadius: safeZone.startRadius,
      targetRadius: safeZone.targetRadius,
      radius: safeZone.radius,
      startDelay: safeZone.startDelay,
      shrinkDuration: safeZone.shrinkDuration,
      damageInterval: safeZone.damageInterval,
      damagePerTick: safeZone.damagePerTick,
      damagePercent: safeZone.damagePercent || 0,
      damageMode: safeZone.damageMode || 'outsideFlat',
      poisonStartTime: safeZone.poisonStartTime || 0,
      poisonRemaining,
      poisonActive: !!safeZone.poisonActive,
      active: !!safeZone.active,
      shrinking: !!safeZone.shrinking,
      finished: !!safeZone.finished,
      progress: safeZone.progress,
      waitRemaining: 0,
      shrinkRemaining: 0,
      phase: safeZone.phase || 'safe',
    },
  };
}

function getPreferredSpawnSafeZone() {
  if (!room.safeZone) {
    room.safeZone = createSafeZoneState();
  }
  const safeZone = room.safeZone;
  let radius = 0;
  if (safeZone.active && Number.isFinite(safeZone.radius) && safeZone.radius > 0) {
    radius = safeZone.radius;
  } else if (Number.isFinite(safeZone.targetRadius) && safeZone.targetRadius > 0) {
    radius = safeZone.targetRadius;
  } else if (Number.isFinite(safeZone.startRadius) && safeZone.startRadius > 0) {
    radius = safeZone.startRadius;
  }
  if (!Number.isFinite(radius) || radius <= 0) {
    return null;
  }
  return {
    centerX: Number.isFinite(safeZone.centerX) ? safeZone.centerX : 0,
    centerY: Number.isFinite(safeZone.centerY) ? safeZone.centerY : 0,
    radius,
  };
}

function isPointInsidePreferredSafeZone(point, padding = 0) {
  if (!point) {
    return false;
  }
  const zone = getPreferredSpawnSafeZone();
  if (!zone) {
    return true;
  }
  const allowRadius = zone.radius - Math.max(0, padding);
  if (allowRadius <= 0) {
    return false;
  }
  const dx = (point.x || 0) - zone.centerX;
  const dy = (point.y || 0) - zone.centerY;
  return dx * dx + dy * dy <= allowRadius * allowRadius;
}

function filterPointsInsidePreferredSafeZone(points, padding = 0) {
  if (!Array.isArray(points) || points.length <= 0) {
    return [];
  }
  const preferred = points.filter((point) => isPointInsidePreferredSafeZone(point, padding));
  return preferred.length > 0 ? preferred : points.slice();
}

function chooseRandomPreferredSafePoint(padding = 0) {
  const zone = getPreferredSpawnSafeZone();
  if (!zone) {
    return clampPointToBounds({
      x: Math.floor(Math.random() * 2800) - 1400,
      y: Math.floor(Math.random() * 1800) - 900,
    }, padding);
  }
  const limitRadius = Math.max(0, zone.radius - Math.max(0, padding));
  if (limitRadius <= 1) {
    return clampPointToBounds({ x: zone.centerX, y: zone.centerY }, padding);
  }
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.sqrt(Math.random()) * limitRadius;
  return clampPointToBounds({
    x: zone.centerX + Math.cos(angle) * distance,
    y: zone.centerY + Math.sin(angle) * distance,
  }, padding);
}

function appendAnnouncement(frameCommands, payload) {
  if (!payload || !payload.text) {
    return;
  }
  appendFrameCommand(frameCommands, {
    type: 'announcement',
    id: payload.id || '',
    text: payload.text,
    subText: payload.subText || '',
    style: payload.style || 'info',
    duration: Number.isFinite(payload.duration) ? payload.duration : 2.2,
  });
}

function logWaveSkip(reason, extra = {}) {
  console.warn('[WaveConfig]', reason, extra);
}

function getWaveState() {
  if (!room.waveState) {
    room.waveState = {
      nextWaveIndex: 0,
      triggered: {},
    };
  }
  return room.waveState;
}

function getResourceWaveCycleDuration() {
  if (!Array.isArray(RESOURCE_WAVE_CONFIG) || RESOURCE_WAVE_CONFIG.length <= 0) {
    return 0;
  }
  if (RESOURCE_WAVE_CONFIG.length === 1) {
    const singleTime = Math.max(0, Number(RESOURCE_WAVE_CONFIG[0].time) || 0);
    return Math.max(60, singleTime + 60);
  }
  const lastWave = RESOURCE_WAVE_CONFIG[RESOURCE_WAVE_CONFIG.length - 1] || {};
  const prevWave = RESOURCE_WAVE_CONFIG[RESOURCE_WAVE_CONFIG.length - 2] || {};
  const lastTime = Math.max(0, Number(lastWave.time) || 0);
  const prevTime = Math.max(0, Number(prevWave.time) || 0);
  const interval = Math.max(1, lastTime - prevTime || 60);
  return lastTime + interval;
}

function getWaveScheduleBySequence(sequenceIndex) {
  if (!Array.isArray(RESOURCE_WAVE_CONFIG) || RESOURCE_WAVE_CONFIG.length <= 0 || sequenceIndex < 0) {
    return null;
  }
  const configIndex = sequenceIndex % RESOURCE_WAVE_CONFIG.length;
  const cycleIndex = Math.floor(sequenceIndex / RESOURCE_WAVE_CONFIG.length);
  const waveConfig = RESOURCE_WAVE_CONFIG[configIndex];
  if (!waveConfig) {
    return null;
  }
  const cycleDuration = getResourceWaveCycleDuration();
  return {
    config: waveConfig,
    scheduledTime: cycleDuration * cycleIndex + Math.max(0, Number(waveConfig.time) || 0),
  };
}

function clonePoint(point) {
  if (!point) {
    return null;
  }
  return {
    x: Number(point.x) || 0,
    y: Number(point.y) || 0,
  };
}

function getPreferredSafeRadiusWithPadding(padding = 0) {
  const zone = getPreferredSpawnSafeZone();
  if (!zone) {
    return null;
  }
  return Math.max(0, zone.radius - Math.max(0, padding));
}

function projectPointToPreferredSafeZone(point, padding = 0) {
  if (!point) {
    return null;
  }
  const zone = getPreferredSpawnSafeZone();
  const clamped = clampPointToBounds(point, padding);
  if (!zone) {
    return clamped;
  }
  const allowRadius = getPreferredSafeRadiusWithPadding(padding);
  if (!Number.isFinite(allowRadius) || allowRadius <= 0) {
    return null;
  }
  const dx = clamped.x - zone.centerX;
  const dy = clamped.y - zone.centerY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist <= allowRadius) {
    return clamped;
  }
  if (dist <= 0.0001) {
    return clampPointToBounds({ x: zone.centerX + allowRadius, y: zone.centerY }, padding);
  }
  return clampPointToBounds({
    x: zone.centerX + (dx / dist) * allowRadius,
    y: zone.centerY + (dy / dist) * allowRadius,
  }, padding);
}

function resolveConfiguredSpawnPoint(rawPoint, padding = 0, label = 'point', validator = null) {
  if (!rawPoint) {
    logWaveSkip('missing point config', { label });
    return null;
  }
  const x = Number(rawPoint.x);
  const y = Number(rawPoint.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    logWaveSkip('invalid point config', { label, point: rawPoint });
    return null;
  }
  const source = { x, y };
  const inside = isPointInsidePreferredSafeZone(source, padding);
  const point = inside ? clampPointToBounds(source, padding) : projectPointToPreferredSafeZone(source, padding);
  if (!point) {
    logWaveSkip('safe zone projection failed', { label, point: source, padding });
    return null;
  }
  if (validator && !validator(point)) {
    if (inside) {
      const projected = projectPointToPreferredSafeZone(source, padding);
      if (projected && validator(projected)) {
        return projected;
      }
    }
    const sources = filterPointsInsidePreferredSafeZone(getSpecialEventSpawnSources(), padding);
    for (let i = 0; i < sources.length; i++) {
      const candidate = clampPointToBounds(sources[i], padding);
      if (validator(candidate)) {
        return candidate;
      }
    }
    for (let i = 0; i < 24; i++) {
      const candidate = chooseRandomPreferredSafePoint(padding);
      if (validator(candidate)) {
        return candidate;
      }
    }
    logWaveSkip('no legal safe point after projection', { label, point: source, padding });
    return null;
  }
  return point;
}

function normalizePickupType(type) {
  if (type === PICKUP_TYPE.TAR || type === 'oil') {
    return PICKUP_TYPE.TAR;
  }
  if (type === PICKUP_TYPE.BLACK_HOLE) {
    return PICKUP_TYPE.BLACK_HOLE;
  }
  if (type === PICKUP_TYPE.PORTAL) {
    return PICKUP_TYPE.PORTAL;
  }
  if (type === PICKUP_TYPE.SPEED_DOUBLE) {
    return PICKUP_TYPE.SPEED_DOUBLE;
  }
  if (type === PICKUP_TYPE.DAMAGE_DOUBLE) {
    return PICKUP_TYPE.DAMAGE_DOUBLE;
  }
  return '';
}

function buildHudStateCommand() {
  if (!room.safeZone) {
    room.safeZone = createSafeZoneState();
  }
  if (!room.matchFlow) {
    room.matchFlow = createMatchFlowState();
  }
  const aliveCount = getAlivePlayers().length;
  const totalPlayers = room.players.filter((player) => player && !player.disconnected).length;
  const safeZone = room.safeZone;
  const energyEggWaitRemaining = room.energyEggMidgameSpawned < room.energyEggMidgamePlan
    ? Math.max(0, ENERGY_EGG_MIDGAME_SECONDS - Math.max(0, room.elapsedSeconds))
    : 0;
  const poisonRemaining = Math.max(0, (safeZone.poisonStartTime || 0) - Math.max(0, room.elapsedSeconds));
  let phaseKey = 'opening';
  let phaseText = '开局发育';
  let secondaryText = '';

  if (aliveCount <= 1) {
    phaseKey = 'settlement';
    phaseText = '本局结束';
  } else if (safeZone.poisonActive) {
    phaseKey = 'poison';
    phaseText = '毒区爆发';
    secondaryText = `全图掉血 ${Math.max(1, Math.round((safeZone.damagePercent || 0) * 100))}%/s`;
  } else if (safeZone.active) {
    phaseKey = 'safe';
    phaseText = aliveCount <= FINAL_STAGE_ALIVE_THRESHOLD ? '中心决战' : '中心安全区';
    secondaryText = `毒区爆发 ${Math.max(0, Math.ceil(poisonRemaining))}s`;
  } else {
    secondaryText = energyEggWaitRemaining > 0
      ? `能量蛋刷新 ${Math.max(0, Math.ceil(energyEggWaitRemaining))}s`
      : `毒区爆发 ${Math.max(0, Math.ceil(poisonRemaining))}s`;
  }

  if (!secondaryText && !safeZone.poisonActive) {
    secondaryText = `毒区爆发 ${Math.max(0, Math.ceil(poisonRemaining))}s`;
  }

  return {
    type: 'hudState',
    hud: {
      elapsedSeconds: room.elapsedSeconds,
      aliveCount,
      totalPlayers,
      phaseKey,
      phaseText,
      secondaryText,
      energyEggWaitRemaining,
      safeZone: {
        active: !!safeZone.active,
        shrinking: !!safeZone.shrinking,
        finished: !!safeZone.finished,
        poisonActive: !!safeZone.poisonActive,
        waitRemaining: 0,
        shrinkRemaining: 0,
        poisonRemaining,
        radius: safeZone.radius,
        targetRadius: safeZone.targetRadius,
      },
    },
  };
}

function updateMatchAnnouncements(frameCommands) {
  if (!room.matchFlow) {
    room.matchFlow = createMatchFlowState();
  }
  if (!room.safeZone) {
    room.safeZone = createSafeZoneState();
  }
  const flow = room.matchFlow;
  const safeZone = room.safeZone;
  const aliveCount = getAlivePlayers().length;

  if (!flow.openingAnnounced) {
    flow.openingAnnounced = true;
    appendAnnouncement(frameCommands, {
      id: 'opening',
      text: '战斗开始',
      subText: '中心安全区已锁定，尽快向地图中央集结',
      style: 'notice',
      duration: 2.2,
    });
  }

  if (!flow.energyEggAnnounced && room.energyEggMidgameSpawned > 0) {
    flow.energyEggAnnounced = true;
    appendAnnouncement(frameCommands, {
      id: 'energyEgg',
      text: '能量蛋已刷新',
      subText: '吸附携带，成熟后会爆出大量能量',
      style: 'event',
      duration: 2.6,
    });
  }

  const poisonRemaining = Math.max(0, (safeZone.poisonStartTime || 0) - Math.max(0, room.elapsedSeconds));
  if (!flow.poisonWarningAnnounced && !safeZone.poisonActive && poisonRemaining > 0 && poisonRemaining <= SAFE_ZONE_WARNING_SECONDS) {
    flow.poisonWarningAnnounced = true;
    appendAnnouncement(frameCommands, {
      id: 'poisonWarning',
      text: '毒区预警',
      subText: `${Math.max(0, Math.ceil(poisonRemaining))} 秒后安全区消失`,
      style: 'warning',
      duration: 2.3,
    });
  }

  if (!flow.poisonStartedAnnounced && safeZone.poisonActive) {
    flow.poisonStartedAnnounced = true;
    appendAnnouncement(frameCommands, {
      id: 'poisonStart',
      text: '毒区爆发',
      subText: `所有玩家每秒损失 ${Math.max(1, Math.round((safeZone.damagePercent || 0) * 100))}% 最大生命`,
      style: 'warning',
      duration: 2.4,
    });
  }

  if (!flow.finalCircleAnnounced && !safeZone.poisonActive && safeZone.active && aliveCount <= FINAL_STAGE_ALIVE_THRESHOLD) {
    flow.finalCircleAnnounced = true;
    appendAnnouncement(frameCommands, {
      id: 'finalCircle',
      text: '决胜阶段',
      subText: aliveCount > 0 ? `剩余 ${aliveCount} 名玩家，准备决胜` : '所有玩家已出局',
      style: 'danger',
      duration: 2.8,
    });
  }
}

function buildMatchResultCommand(winnerPlayerId) {
  return {
    type: 'matchResult',
    winnerPlayerId,
    text: winnerPlayerId >= 0 ? `玩家 ${winnerPlayerId + 1} 获胜` : '本局平局',
    duration: 3,
  };
}

function updateSafeZoneState(frameCommands) {
  if (!room.safeZone) {
    room.safeZone = createSafeZoneState();
  }
  const safeZone = room.safeZone;
  const elapsed = Math.max(0, room.elapsedSeconds);
  const wasPoisonActive = !!safeZone.poisonActive;
  if (elapsed >= (safeZone.poisonStartTime || 0)) {
    safeZone.poisonActive = true;
    safeZone.active = false;
    safeZone.shrinking = false;
    safeZone.finished = false;
    safeZone.progress = 1;
    safeZone.radius = 0;
    safeZone.damagePerTick = 0;
    safeZone.damagePercent = SAFE_ZONE_POISON_DAMAGE_PERCENT;
    safeZone.damageMode = 'globalPercentMaxHp';
    safeZone.phase = 'poison';
  } else {
    safeZone.poisonActive = false;
    safeZone.active = true;
    safeZone.shrinking = false;
    safeZone.finished = false;
    safeZone.progress = 1;
    safeZone.radius = safeZone.targetRadius;
    safeZone.damagePerTick = SAFE_ZONE_DAMAGE_PER_TICK;
    safeZone.damagePercent = 0;
    safeZone.damageMode = 'outsideFlat';
    safeZone.phase = 'safe';
  }
  if (!wasPoisonActive && safeZone.poisonActive) {
    room.players.forEach((player) => {
      if (player) {
        player.safeZoneDamageCd = safeZone.damageInterval || SAFE_ZONE_DAMAGE_INTERVAL;
      }
    });
  }
  appendFrameCommand(frameCommands, buildSafeZoneStateCommand());
}

function getPlayerRuntimeRadius(player) {
  if (player && player.lastSnapshot && Number.isFinite(player.lastSnapshot.radius)) {
    return Math.max(16, player.lastSnapshot.radius);
  }
  return PLAYER_DEFAULT_RADIUS;
}

function getBushById(bushId) {
  if (bushId == null) {
    return null;
  }
  for (let i = 0; i < room.bushes.length; i++) {
    const bush = room.bushes[i];
    if (bush && bush.id === bushId) {
      return bush;
    }
  }
  return null;
}

function findBushContainingPlayer(player) {
  if (!player || player.dead || player.disconnected) {
    return null;
  }
  const pos = getPlayerRuntimePosition(player);
  const playerRadius = getPlayerRuntimeRadius(player);
  for (let i = 0; i < room.bushes.length; i++) {
    const bush = room.bushes[i];
    if (!bush) {
      continue;
    }
    if (Array.isArray(bush.rects) && bush.rects.length > 0) {
      for (let j = 0; j < bush.rects.length; j++) {
        const rect = bush.rects[j];
        if (!rect) {
          continue;
        }
        const halfWidth = Math.max(0, (rect.width || 0) / 2 - playerRadius * 0.22);
        const halfHeight = Math.max(0, (rect.height || 0) / 2 - playerRadius * 0.22);
        if (halfWidth <= 0 || halfHeight <= 0) {
          continue;
        }
        const dx = Math.abs((pos.x || 0) - (rect.x || 0));
        const dy = Math.abs((pos.y || 0) - (rect.y || 0));
        if (dx <= halfWidth && dy <= halfHeight) {
          return bush;
        }
      }
      continue;
    }
    const hideRadius = Math.max(24, (bush.radius || MULTIPLAYER_BUSH_RADIUS) - playerRadius * 0.22);
    if (distanceSqr(pos, bush) <= hideRadius * hideRadius) {
      return bush;
    }
  }
  return null;
}

function buildInitialBushes() {
  if (Array.isArray(room.bushes) && room.bushes.length > 0) {
    return sanitizeBushes(room.bushes);
  }
  const source = Array.isArray(room.bushSpawnPoints) && room.bushSpawnPoints.length > 0
    ? shuffle(filterPointsInsidePreferredSafeZone(room.bushSpawnPoints, MULTIPLAYER_BUSH_RADIUS + 12))
    : [];
  const result = [];
  const spawnPositions = room.players.map((player) => getSpawnPositionBySlot(player.spawnSlot));
  for (let i = 0; i < source.length; i++) {
    const point = source[i];
    if (!point) {
      continue;
    }

    let blocked = false;
    for (let j = 0; j < spawnPositions.length; j++) {
      const spawnPos = spawnPositions[j];
      if (spawnPos && Math.sqrt(distanceSqr(spawnPos, point)) < MULTIPLAYER_BUSH_MIN_SPAWN_DISTANCE) {
        blocked = true;
        break;
      }
    }
    if (blocked) {
      continue;
    }

    for (let j = 0; j < result.length; j++) {
      const bush = result[j];
      if (Math.sqrt(distanceSqr(bush, point)) < MULTIPLAYER_BUSH_MIN_GAP) {
        blocked = true;
        break;
      }
    }
    if (blocked) {
      continue;
    }

    const pos = clampPointToBounds(point, MULTIPLAYER_BUSH_SPAWN_PADDING);
    result.push({
      id: result.length + 1,
      x: Math.round(pos.x),
      y: Math.round(pos.y),
      radius: MULTIPLAYER_BUSH_RADIUS,
    });
    if (result.length >= MULTIPLAYER_BUSH_COUNT) {
      break;
    }
  }
  return result;
}

function createCoverState(point) {
  if (!point) {
    return null;
  }
  const pos = clampPointToBounds(point, MULTIPLAYER_COVER_RADIUS + 10);
  return {
    id: room.nextCoverId++,
    x: Math.round(pos.x),
    y: Math.round(pos.y),
    radius: MULTIPLAYER_COVER_RADIUS,
    hp: MULTIPLAYER_COVER_HP,
    maxHp: MULTIPLAYER_COVER_HP,
    attached: false,
    ownerPlayerId: null,
    attachOffsetX: 0,
    attachOffsetY: 0,
  };
}

function getCoverById(coverId) {
  if (coverId == null) {
    return null;
  }
  for (let i = 0; i < room.covers.length; i++) {
    const cover = room.covers[i];
    if (cover && cover.id === coverId) {
      return cover;
    }
  }
  return null;
}

function getAttachedCoverByPlayer(player) {
  if (!player) {
    return null;
  }
  for (let i = 0; i < room.covers.length; i++) {
    const cover = room.covers[i];
    if (cover && cover.attached && cover.ownerPlayerId === player.playerId) {
      return cover;
    }
  }
  return null;
}

function buildCoverSyncCommand(cover) {
  if (!cover) {
    return null;
  }
  return {
    type: 'coverSync',
    cover: {
      id: cover.id,
      x: cover.x,
      y: cover.y,
      radius: cover.radius,
      hp: cover.hp,
      maxHp: cover.maxHp,
      attached: !!cover.attached,
      ownerPlayerId: cover.ownerPlayerId == null ? null : cover.ownerPlayerId,
      attachOffsetX: Number.isFinite(cover.attachOffsetX) ? cover.attachOffsetX : 0,
      attachOffsetY: Number.isFinite(cover.attachOffsetY) ? cover.attachOffsetY : 0,
    },
  };
}

function buildCoverActionResultCommand(player, action, accepted) {
  if (!player || !action) {
    return null;
  }
  return {
    type: 'coverActionResult',
    playerId: player.playerId,
    seq: action.seq,
    coverId: action.coverId,
    action: action.action,
    accepted: !!accepted,
  };
}

function appendAllCoverSyncCommands(frameCommands) {
  for (let i = 0; i < room.covers.length; i++) {
    appendFrameCommand(frameCommands, buildCoverSyncCommand(room.covers[i]));
  }
}

function isCoverSpawnPointAvailable(point, result) {
  if (!point || !isPointInsidePreferredSafeZone(point, MULTIPLAYER_COVER_RADIUS + 8)) {
    return false;
  }
  for (let i = 0; i < room.players.length; i++) {
    const player = room.players[i];
    if (!player) {
      continue;
    }
    const spawnPos = getSpawnPositionBySlot(player.spawnSlot);
    if (spawnPos && Math.sqrt(distanceSqr(spawnPos, point)) < MULTIPLAYER_COVER_MIN_PLAYER_DISTANCE) {
      return false;
    }
  }
  const covers = Array.isArray(result) ? result : [];
  for (let i = 0; i < covers.length; i++) {
    const cover = covers[i];
    if (cover && Math.sqrt(distanceSqr(cover, point)) < MULTIPLAYER_COVER_MIN_GAP) {
      return false;
    }
  }
  return true;
}

function buildInitialCovers() {
  const source = Array.isArray(room.energySpawnPoints) && room.energySpawnPoints.length > 0
    ? shuffle(filterPointsInsidePreferredSafeZone(room.energySpawnPoints, MULTIPLAYER_COVER_RADIUS + 12))
    : shuffle(filterPointsInsidePreferredSafeZone(room.spawnCandidates || [], MULTIPLAYER_COVER_RADIUS + 12));
  const result = [];
  for (let i = 0; i < source.length; i++) {
    const point = source[i];
    if (!isCoverSpawnPointAvailable(point, result)) {
      continue;
    }
    const cover = createCoverState(point);
    if (cover) {
      result.push(cover);
      if (result.length >= MULTIPLAYER_COVER_COUNT) {
        return result;
      }
    }
  }
  let attempts = 0;
  while (result.length < MULTIPLAYER_COVER_COUNT && attempts < MULTIPLAYER_COVER_COUNT * 12) {
    attempts++;
    const point = chooseRandomPreferredSafePoint(MULTIPLAYER_COVER_RADIUS + 12);
    if (!isCoverSpawnPointAvailable(point, result)) {
      continue;
    }
    const cover = createCoverState(point);
    if (cover) {
      result.push(cover);
    }
  }
  return result;
}

function syncAttachedCoversFromPlayers() {
  for (let i = 0; i < room.covers.length; i++) {
    const cover = room.covers[i];
    if (!cover || !cover.attached || cover.ownerPlayerId == null) {
      continue;
    }
    const player = room.players[cover.ownerPlayerId];
    if (!player || player.dead || player.disconnected) {
      cover.attached = false;
      cover.ownerPlayerId = null;
      cover.attachOffsetX = 0;
      cover.attachOffsetY = 0;
      continue;
    }
    const playerPos = getPlayerRuntimePosition(player);
    const pos = clampPointToBounds({
      x: playerPos.x + (cover.attachOffsetX || 0),
      y: playerPos.y + (cover.attachOffsetY || 0),
    }, (cover.radius || MULTIPLAYER_COVER_RADIUS) + 6);
    cover.x = pos.x;
    cover.y = pos.y;
  }
}

function tryToggleCoverByPlayer(player, frameCommands) {
  if (!player || player.dead || player.disconnected) {
    return false;
  }
  const attached = getAttachedCoverByPlayer(player);
  if (attached) {
    attached.attached = false;
    attached.ownerPlayerId = null;
    attached.attachOffsetX = 0;
    attached.attachOffsetY = 0;
    appendFrameCommand(frameCommands, buildCoverSyncCommand(attached));
    return true;
  }
  const playerPos = getPlayerRuntimePosition(player);
  let nearest = null;
  let nearestLen = 0;
  for (let i = 0; i < room.covers.length; i++) {
    const cover = room.covers[i];
    if (!cover || cover.attached || cover.hp <= 0) {
      continue;
    }
    const len = Math.sqrt(distanceSqr(playerPos, cover));
    if (len <= MULTIPLAYER_COVER_ATTACH_DISTANCE && (nearest == null || len < nearestLen)) {
      nearest = cover;
      nearestLen = len;
    }
  }
  if (!nearest) {
    return false;
  }
  let offsetX = nearest.x - playerPos.x;
  let offsetY = nearest.y - playerPos.y;
  let len = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
  if (!Number.isFinite(len) || len <= 5) {
    const dir = getPlayerRuntimeDir(player);
    offsetX = dir.x;
    offsetY = dir.y;
    len = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
  }
  if (!Number.isFinite(len) || len <= 0.0001) {
    offsetX = 1;
    offsetY = 0;
    len = 1;
  }
  const offsetDistance = clamp(len, MULTIPLAYER_COVER_ATTACH_MIN_OFFSET, MULTIPLAYER_COVER_ATTACH_MAX_OFFSET);
  nearest.attachOffsetX = Number(((offsetX / len) * offsetDistance).toFixed(3));
  nearest.attachOffsetY = Number(((offsetY / len) * offsetDistance).toFixed(3));
  nearest.attached = true;
  nearest.ownerPlayerId = player.playerId;
  syncAttachedCoversFromPlayers();
  appendFrameCommand(frameCommands, buildCoverSyncCommand(nearest));
  return true;
}

function tryCoverActionByPlayer(player, action, frameCommands) {
  if (!player || player.dead || player.disconnected || !action) {
    return false;
  }
  if (action.seq <= (player.lastCoverActionSeq || 0)) {
    return false;
  }
  player.lastCoverActionSeq = action.seq;

  const cover = getCoverById(action.coverId);
  if (!cover || cover.hp <= 0) {
    appendFrameCommand(frameCommands, buildCoverActionResultCommand(player, action, false));
    return false;
  }

  if (action.action === 'detach') {
    if (!cover.attached || cover.ownerPlayerId !== player.playerId) {
      appendFrameCommand(frameCommands, buildCoverSyncCommand(cover));
      appendFrameCommand(frameCommands, buildCoverActionResultCommand(player, action, false));
      return false;
    }
    cover.attached = false;
    cover.ownerPlayerId = null;
    cover.attachOffsetX = 0;
    cover.attachOffsetY = 0;
    appendFrameCommand(frameCommands, buildCoverSyncCommand(cover));
    appendFrameCommand(frameCommands, buildCoverActionResultCommand(player, action, true));
    return true;
  }

  if (cover.attached || getAttachedEnergyEggByPlayer(player)) {
    appendFrameCommand(frameCommands, buildCoverSyncCommand(cover));
    appendFrameCommand(frameCommands, buildCoverActionResultCommand(player, action, false));
    return false;
  }

  const playerPos = getPlayerRuntimePosition(player);
  const lenToCover = Math.sqrt(distanceSqr(playerPos, cover));
  if (!Number.isFinite(lenToCover) || lenToCover > MULTIPLAYER_COVER_ATTACH_DISTANCE) {
    appendFrameCommand(frameCommands, buildCoverSyncCommand(cover));
    appendFrameCommand(frameCommands, buildCoverActionResultCommand(player, action, false));
    return false;
  }

  let offsetX = cover.x - playerPos.x;
  let offsetY = cover.y - playerPos.y;
  let len = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
  if (!Number.isFinite(len) || len <= 5) {
    const dir = getPlayerRuntimeDir(player);
    offsetX = dir.x;
    offsetY = dir.y;
    len = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
  }
  if (!Number.isFinite(len) || len <= 0.0001) {
    offsetX = 1;
    offsetY = 0;
    len = 1;
  }
  const offsetDistance = clamp(len, MULTIPLAYER_COVER_ATTACH_MIN_OFFSET, MULTIPLAYER_COVER_ATTACH_MAX_OFFSET);
  cover.attachOffsetX = Number(((offsetX / len) * offsetDistance).toFixed(3));
  cover.attachOffsetY = Number(((offsetY / len) * offsetDistance).toFixed(3));
  cover.attached = true;
  cover.ownerPlayerId = player.playerId;
  syncAttachedCoversFromPlayers();
  appendFrameCommand(frameCommands, buildCoverSyncCommand(cover));
  appendFrameCommand(frameCommands, buildCoverActionResultCommand(player, action, true));
  return true;
}

function applySafeZoneDamageToPlayer(player, frameCommands) {
  if (!player || player.dead || player.disconnected || !room.safeZone) {
    if (player) {
      player.safeZoneDamageCd = SAFE_ZONE_DAMAGE_INTERVAL;
    }
    return;
  }
  const safeZone = room.safeZone;
  let shouldDamage = false;
  if (safeZone.poisonActive) {
    shouldDamage = true;
  } else if (safeZone.active && safeZone.radius > 0) {
    const pos = getPlayerRuntimePosition(player);
    const playerRadius = getPlayerRuntimeRadius(player);
    const dx = pos.x - safeZone.centerX;
    const dy = pos.y - safeZone.centerY;
    const allowedRadius = Math.max(0, safeZone.radius - playerRadius * 0.35);
    shouldDamage = dx * dx + dy * dy > allowedRadius * allowedRadius;
  }
  if (!shouldDamage) {
    player.safeZoneDamageCd = SAFE_ZONE_DAMAGE_INTERVAL;
    return;
  }

  if (!Number.isFinite(player.safeZoneDamageCd) || player.safeZoneDamageCd <= 0) {
    player.safeZoneDamageCd = SAFE_ZONE_DAMAGE_INTERVAL;
  }
  player.safeZoneDamageCd -= TICK_INTERVAL / 1000;
  while (player.safeZoneDamageCd <= 0 && !player.dead) {
    player.safeZoneDamageCd += SAFE_ZONE_DAMAGE_INTERVAL;
    let damage = safeZone.damagePerTick;
    if (safeZone.poisonActive) {
      const maxHp = Number.isFinite(player.maxHp) && player.maxHp > 0
        ? player.maxHp
        : MULTIPLAYER_FIXED_BASE_HP;
      damage = Math.max(1, Math.ceil(maxHp * (safeZone.damagePercent || SAFE_ZONE_POISON_DAMAGE_PERCENT)));
    }
    if (!Number.isFinite(damage) || damage <= 0) {
      continue;
    }
    player.hp -= damage;
    if (player.hp < 0) {
      player.hp = 0;
    }
    appendFrameCommand(frameCommands, {
      type: 'safeZoneDamage',
      playerId: player.playerId,
      damage,
      hp: player.hp,
      damageMode: safeZone.damageMode || 'outsideFlat',
    });
    if (player.hp <= 0) {
      player.dead = true;
    }
  }
}

function getPlayerRuntimeDir(player) {
  if (player && player.lastSnapshot) {
    return {
      x: player.lastSnapshot.dirX,
      y: player.lastSnapshot.dirY,
    };
  }
  return {
    x: Number.isFinite(player && player.dirX) ? player.dirX : PLAYER_DIR_FALLBACK.x,
    y: Number.isFinite(player && player.dirY) ? player.dirY : PLAYER_DIR_FALLBACK.y,
  };
}

function chooseEnergySpawnPoint(minMargin = 520, avoidEggs = true) {
  if (room.energySpawnPoints.length > 0) {
    const safeCandidates = filterPointsInsidePreferredSafeZone(room.energySpawnPoints, 42);
    const available = safeCandidates.filter((point) => {
      for (let i = 0; i < room.energies.length; i++) {
        const energy = room.energies[i];
        if (energy && Math.sqrt(distanceSqr(energy, point)) < minMargin) {
          return false;
        }
      }
      if (avoidEggs) {
        for (let i = 0; i < room.energyEggs.length; i++) {
          const egg = room.energyEggs[i];
          if (egg && !egg.removed && Math.sqrt(distanceSqr(egg, point)) < minMargin * 0.85) {
            return false;
          }
        }
      }
      return true;
    });
    const source = available.length > 0 ? available : safeCandidates;
    return source[Math.floor(Math.random() * source.length)] || null;
  }
  return chooseRandomPreferredSafePoint(42);
}

function isTarPickupPointAvailable(point) {
  if (!point) {
    return false;
  }
  for (let i = 0; i < room.tarPickups.length; i++) {
    const pickup = room.tarPickups[i];
    if (pickup && !pickup.removed && Math.sqrt(distanceSqr(pickup, point)) < 180) {
      return false;
    }
  }
  for (let i = 0; i < room.blackHolePickups.length; i++) {
    const pickup = room.blackHolePickups[i];
    if (pickup && !pickup.removed && Math.sqrt(distanceSqr(pickup, point)) < 180) {
      return false;
    }
  }
  for (let i = 0; i < room.tarSpills.length; i++) {
    const spill = room.tarSpills[i];
    if (spill && !spill.removed && Math.sqrt(distanceSqr(spill, point)) < spill.radius + 90) {
      return false;
    }
  }
  for (let i = 0; i < room.energies.length; i++) {
    const energy = room.energies[i];
    if (energy && Math.sqrt(distanceSqr(energy, point)) < 130) {
      return false;
    }
  }
  for (let i = 0; i < room.energyEggs.length; i++) {
    const egg = room.energyEggs[i];
    if (egg && !egg.removed && Math.sqrt(distanceSqr(egg, point)) < 160) {
      return false;
    }
  }
  for (let i = 0; i < room.players.length; i++) {
    const player = room.players[i];
    if (!player || player.dead || player.disconnected) {
      continue;
    }
    if (Math.sqrt(distanceSqr(getPlayerRuntimePosition(player), point)) < 160) {
      return false;
    }
  }
  return true;
}

function chooseTarPickupSpawnPoint() {
  const candidates = getSpecialEventSpawnSources();
  const safeCandidates = filterPointsInsidePreferredSafeZone(candidates, TAR_PICKUP_RADIUS + 12);
  const preferred = [];
  const fallback = [];
  for (let i = 0; i < safeCandidates.length; i++) {
    const point = clampPointToBounds(safeCandidates[i], TAR_PICKUP_RADIUS + 12);
    if (isTarPickupPointAvailable(point)) {
      preferred.push(point);
    } else {
      fallback.push(point);
    }
  }
  const source = preferred.length > 0 ? preferred : fallback;
  if (source.length > 0) {
    return pickOne(source);
  }
  return chooseRandomPreferredSafePoint(TAR_PICKUP_RADIUS + 12);
}

function createTarPickup(point) {
  if (!point) {
    return null;
  }
  const pos = clampPointToBounds(point, TAR_PICKUP_RADIUS + 12);
  return {
    id: room.nextTarPickupId++,
    x: pos.x,
    y: pos.y,
    radius: TAR_PICKUP_RADIUS,
    remainTime: TAR_PICKUP_LIFETIME,
    removed: false,
  };
}

function createBlackHolePickup(point) {
  if (!point) {
    return null;
  }
  const pos = clampPointToBounds(point, BLACK_HOLE_PICKUP_RADIUS + 12);
  return {
    id: room.nextBlackHolePickupId++,
    x: pos.x,
    y: pos.y,
    radius: BLACK_HOLE_PICKUP_RADIUS,
    remainTime: BLACK_HOLE_PICKUP_LIFETIME,
    removed: false,
  };
}

function createConfiguredPickup(point, pickupType) {
  const normalizedType = normalizePickupType(pickupType);
  if (!point || !normalizedType) {
    return null;
  }
  const pos = clampPointToBounds(point, 46);
  return {
    id: room.nextPickupId++,
    x: pos.x,
    y: pos.y,
    radius: 42,
    touchRadius: CONFIG_PICKUP_TOUCH_RADIUS,
    pickupType: normalizedType,
    remainTime: CONFIG_PICKUP_LIFETIME,
    removed: false,
  };
}

function buildConfiguredPickupPayload(pickup) {
  if (!pickup) {
    return null;
  }
  return {
    id: pickup.id,
    x: pickup.x,
    y: pickup.y,
    radius: pickup.radius,
    touchRadius: pickup.touchRadius,
    pickupType: pickup.pickupType,
    remainTime: pickup.remainTime,
  };
}

function spawnConfiguredPickupInFrame(frameCommands, point, pickupType) {
  const normalizedType = normalizePickupType(pickupType);
  if (!normalizedType) {
    return null;
  }
  const aliveCount = room.pickups.filter((pickup) => pickup && !pickup.removed).length;
  if (aliveCount >= CONFIG_PICKUP_MAX_COUNT * 8) {
    return null;
  }
  const pickup = createConfiguredPickup(point, normalizedType);
  if (!pickup) {
    return null;
  }
  room.pickups.push(pickup);
  appendFrameCommand(frameCommands, {
    type: 'pickupSpawn',
    pickup: buildConfiguredPickupPayload(pickup),
  });
  return pickup;
}

function removeConfiguredPickupInFrame(pickupId, frameCommands, reason = 'pickup') {
  const index = room.pickups.findIndex((item) => item && item.id === pickupId && !item.removed);
  if (index < 0) {
    return null;
  }
  const pickup = room.pickups[index];
  pickup.removed = true;
  room.pickups.splice(index, 1);
  appendFrameCommand(frameCommands, {
    type: 'pickupRemove',
    pickupId,
    pickupType: pickup.pickupType,
    reason,
  });
  return pickup;
}

function getPlayerActivePickupType(player) {
  return player && player.activePickupType ? normalizePickupType(player.activePickupType) : '';
}

function clearPlayerActivePickup(player) {
  if (!player) {
    return;
  }
  player.activePickupType = '';
}

function assignPlayerActivePickup(player, pickupType) {
  if (!player) {
    return;
  }
  player.activePickupType = normalizePickupType(pickupType);
}

function spawnTarPickupInFrame(frameCommands) {
  const aliveCount = room.tarPickups.filter((pickup) => pickup && !pickup.removed).length;
  if (aliveCount >= TAR_PICKUP_MAX_COUNT) {
    return null;
  }
  const pickup = createTarPickup(chooseTarPickupSpawnPoint());
  if (!pickup) {
    return null;
  }
  room.tarPickups.push(pickup);
  appendFrameCommand(frameCommands, {
    type: 'tarPickupSpawn',
    pickup: {
      id: pickup.id,
      x: pickup.x,
      y: pickup.y,
      radius: pickup.radius,
      remainTime: pickup.remainTime,
    },
  });
  return pickup;
}

function spawnBlackHolePickupInFrame(frameCommands) {
  const aliveCount = room.blackHolePickups.filter((pickup) => pickup && !pickup.removed).length;
  if (aliveCount >= BLACK_HOLE_PICKUP_MAX_COUNT) {
    return null;
  }
  const pickup = createBlackHolePickup(chooseTarPickupSpawnPoint());
  if (!pickup) {
    return null;
  }
  room.blackHolePickups.push(pickup);
  appendFrameCommand(frameCommands, {
    type: 'blackHolePickupSpawn',
    pickup: {
      id: pickup.id,
      x: pickup.x,
      y: pickup.y,
      radius: pickup.radius,
      remainTime: pickup.remainTime,
    },
  });
  return pickup;
}

function removeTarPickupInFrame(pickupId, frameCommands, reason = 'pickup') {
  const index = room.tarPickups.findIndex((item) => item && item.id === pickupId && !item.removed);
  if (index < 0) {
    return null;
  }
  const pickup = room.tarPickups[index];
  pickup.removed = true;
  room.tarPickups.splice(index, 1);
  appendFrameCommand(frameCommands, {
    type: 'tarPickupRemove',
    pickupId,
    reason,
  });
  return pickup;
}

function removeBlackHolePickupInFrame(pickupId, frameCommands, reason = 'pickup') {
  const index = room.blackHolePickups.findIndex((item) => item && item.id === pickupId && !item.removed);
  if (index < 0) {
    return null;
  }
  const pickup = room.blackHolePickups[index];
  pickup.removed = true;
  room.blackHolePickups.splice(index, 1);
  appendFrameCommand(frameCommands, {
    type: 'blackHolePickupRemove',
    pickupId,
    reason,
  });
  return pickup;
}

function tryConsumeTarPickup(player, pickupId, frameCommands) {
  if (!player || player.dead || player.disconnected || pickupId == null) {
    return false;
  }
  if ((player.tarAmmoCount || 0) >= 1) {
    return false;
  }
  const pickup = room.tarPickups.find((item) => item && item.id === pickupId && !item.removed);
  if (!pickup) {
    return false;
  }
  const playerPos = getPlayerRuntimePosition(player);
  if (Math.sqrt(distanceSqr(playerPos, pickup)) > TAR_PICKUP_TOUCH_RADIUS) {
    return false;
  }
  if (!removeTarPickupInFrame(pickupId, frameCommands, 'pickup')) {
    return false;
  }
  player.tarAmmoCount = 1;
  room.tarPickupSpawnCd = randomBetween(TAR_PICKUP_RESPAWN_MIN, TAR_PICKUP_RESPAWN_MAX);
  return true;
}

function tryConsumeBlackHolePickup(player, pickupId, frameCommands) {
  if (!player || player.dead || player.disconnected || pickupId == null) {
    return false;
  }
  if ((player.blackHoleAmmoCount || 0) >= 1) {
    return false;
  }
  const pickup = room.blackHolePickups.find((item) => item && item.id === pickupId && !item.removed);
  if (!pickup) {
    return false;
  }
  const playerPos = getPlayerRuntimePosition(player);
  if (Math.sqrt(distanceSqr(playerPos, pickup)) > BLACK_HOLE_PICKUP_TOUCH_RADIUS) {
    return false;
  }
  if (!removeBlackHolePickupInFrame(pickupId, frameCommands, 'pickup')) {
    return false;
  }
  player.blackHoleAmmoCount = 1;
  room.blackHolePickupSpawnCd = randomBetween(BLACK_HOLE_PICKUP_RESPAWN_MIN, BLACK_HOLE_PICKUP_RESPAWN_MAX);
  return true;
}

function tryConsumeConfiguredPickup(player, pickupId, frameCommands) {
  if (!player || player.dead || player.disconnected || pickupId == null) {
    return false;
  }
  const pickup = room.pickups.find((item) => item && item.id === pickupId && !item.removed);
  if (!pickup) {
    return false;
  }
  const pickupType = normalizePickupType(pickup.pickupType);
  if (!pickupType) {
    return false;
  }
  if (pickupType === PICKUP_TYPE.TAR) {
    if ((player.tarAmmoCount || 0) >= 1) {
      return false;
    }
  } else if (pickupType === PICKUP_TYPE.BLACK_HOLE) {
    if ((player.blackHoleAmmoCount || 0) >= 1) {
      return false;
    }
  } else if (getPlayerActivePickupType(player)) {
    return false;
  }
  const playerPos = getPlayerRuntimePosition(player);
  if (Math.sqrt(distanceSqr(playerPos, pickup)) > (pickup.touchRadius || CONFIG_PICKUP_TOUCH_RADIUS)) {
    return false;
  }
  if (!removeConfiguredPickupInFrame(pickupId, frameCommands, 'pickup')) {
    return false;
  }
  if (pickupType === PICKUP_TYPE.TAR) {
    player.tarAmmoCount = 1;
  } else if (pickupType === PICKUP_TYPE.BLACK_HOLE) {
    player.blackHoleAmmoCount = 1;
  } else {
    assignPlayerActivePickup(player, pickupType);
  }
  appendFrameCommand(frameCommands, {
    type: 'pickupActionResult',
    playerId: player.playerId,
    pickupType,
    accepted: true,
    action: 'pickup',
  });
  return true;
}

function tryUseConfiguredPickupByPlayer(player, payload, frameCommands) {
  if (!player || player.dead || player.disconnected || !payload) {
    return false;
  }
  const activePickupType = getPlayerActivePickupType(player);
  if (!activePickupType || activePickupType !== payload.pickupType) {
    return false;
  }
  const playerPos = getPlayerRuntimePosition(player);
  const point = resolveConfiguredSpawnPoint({
    x: playerPos.x + payload.dirX * (140 + 260 * payload.ratio),
    y: playerPos.y + payload.dirY * (140 + 260 * payload.ratio),
  }, 90, 'usePickup');
  if (!point) {
    return false;
  }
  const pickupEvent = buildPickupUseEventPayload(activePickupType, point);
  if (!pickupEvent) {
    return false;
  }
  pickupEvent.remainTime = pickupEvent.duration;
  room.activeSpecialEvents.push(pickupEvent);
  clearPlayerActivePickup(player);
  appendFrameCommand(frameCommands, {
    type: 'pickupUse',
    playerId: player.playerId,
    pickupType: activePickupType,
    x: point.x,
    y: point.y,
  });
  appendFrameCommand(frameCommands, {
    type: 'specialEventSpawn',
    event: pickupEvent,
  });
  appendFrameCommand(frameCommands, {
    type: 'pickupActionResult',
    playerId: player.playerId,
    pickupType: activePickupType,
    accepted: true,
    action: 'use',
  });
  return true;
}

function sanitizeThrowTarPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const dirX = Number(payload.dirX);
  const dirY = Number(payload.dirY);
  const ratio = Number(payload.ratio);
  if (!Number.isFinite(dirX) || !Number.isFinite(dirY)) {
    return null;
  }
  const len = Math.sqrt(dirX * dirX + dirY * dirY);
  if (len <= 0.0001) {
    return null;
  }
  return {
    dirX: dirX / len,
    dirY: dirY / len,
    ratio: Number.isFinite(ratio) ? clamp(ratio, 0, 1) : 1,
  };
}

function sanitizeUsePickupPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const pickupType = normalizePickupType(payload.pickupType);
  const dirX = Number(payload.dirX);
  const dirY = Number(payload.dirY);
  const ratio = Number(payload.ratio);
  if (!pickupType || !Number.isFinite(dirX) || !Number.isFinite(dirY)) {
    return null;
  }
  const len = Math.sqrt(dirX * dirX + dirY * dirY);
  if (len <= 0.0001) {
    return null;
  }
  return {
    pickupType,
    dirX: dirX / len,
    dirY: dirY / len,
    ratio: Number.isFinite(ratio) ? clamp(ratio, 0, 1) : 1,
  };
}

function createTarSpill(point) {
  if (!point) {
    return null;
  }
  const pos = clampPointToBounds(point, TAR_SPILL_RADIUS * 0.55);
  return {
    id: room.nextTarSpillId++,
    x: pos.x,
    y: pos.y,
    radius: TAR_SPILL_RADIUS,
    duration: TAR_SPILL_DURATION,
    remainTime: TAR_SPILL_DURATION,
    slowFactor: TAR_SPILL_SLOW_FACTOR,
    removed: false,
  };
}

function createBlackHoleZone(point) {
  if (!point) {
    return null;
  }
  const pos = clampPointToBounds(point, BLACK_HOLE_ZONE_RADIUS + 20);
  return {
    id: room.nextBlackHoleZoneId++,
    x: pos.x,
    y: pos.y,
    radius: BLACK_HOLE_ZONE_RADIUS,
    destroyRadius: BLACK_HOLE_ZONE_DESTROY_RADIUS,
    gravityStrength: BLACK_HOLE_ZONE_GRAVITY,
    duration: BLACK_HOLE_ZONE_DURATION,
    remainTime: BLACK_HOLE_ZONE_DURATION,
    removed: false,
  };
}

function createEnergyWell(point) {
  if (!point) {
    return null;
  }
  const pos = clampPointToBounds(point, ENERGY_WELL_RADIUS + 16);
  return {
    id: room.nextEnergyWellId++,
    x: pos.x,
    y: pos.y,
    radius: ENERGY_WELL_RADIUS,
    burstInterval: ENERGY_WELL_BURST_INTERVAL,
    burstCountTotal: ENERGY_WELL_BURST_COUNT,
    burstCountDone: 0,
    nextBurstDelay: ENERGY_WELL_BURST_INTERVAL,
    removed: false,
  };
}

function buildEnergyWellPayload(well) {
  if (!well) {
    return null;
  }
  return {
    id: well.id,
    x: well.x,
    y: well.y,
    radius: well.radius,
    burstInterval: well.burstInterval,
    burstCountTotal: well.burstCountTotal,
    burstCountDone: well.burstCountDone,
    nextBurstDelay: well.nextBurstDelay,
  };
}

function spawnEnergyWellInFrame(frameCommands, point) {
  const well = createEnergyWell(point);
  if (!well) {
    return null;
  }
  room.energyWells.push(well);
  appendFrameCommand(frameCommands, {
    type: 'energyWellSpawn',
    well: buildEnergyWellPayload(well),
  });
  return well;
}

function removeEnergyWellInFrame(wellId, frameCommands, reason = 'complete') {
  const index = room.energyWells.findIndex((item) => item && item.id === wellId && !item.removed);
  if (index < 0) {
    return null;
  }
  const well = room.energyWells[index];
  well.removed = true;
  room.energyWells.splice(index, 1);
  appendFrameCommand(frameCommands, {
    type: 'energyWellRemove',
    wellId,
    reason,
  });
  return well;
}

function spawnTarSpillInFrame(spill, player, frameCommands) {
  if (!spill) {
    return null;
  }
  room.tarSpills.push(spill);
  appendFrameCommand(frameCommands, {
    type: 'tarSpillSpawn',
    spill: {
      id: spill.id,
      x: spill.x,
      y: spill.y,
      radius: spill.radius,
      duration: spill.duration,
      remainTime: spill.remainTime,
      slowFactor: spill.slowFactor,
      ownerPlayerId: player ? player.playerId : -1,
    },
  });
  return spill;
}

function spawnBlackHoleZoneInFrame(zone, player, frameCommands) {
  if (!zone) {
    return null;
  }
  room.blackHoleZones.push(zone);
  appendFrameCommand(frameCommands, {
    type: 'blackHoleZoneSpawn',
    zone: {
      id: zone.id,
      x: zone.x,
      y: zone.y,
      radius: zone.radius,
      destroyRadius: zone.destroyRadius,
      gravityStrength: zone.gravityStrength,
      duration: zone.duration,
      remainTime: zone.remainTime,
      ownerPlayerId: player ? player.playerId : -1,
    },
  });
  return zone;
}

function removeTarSpillInFrame(spillId, frameCommands, reason = 'timeout') {
  const spill = room.tarSpills.find((item) => item && item.id === spillId && !item.removed);
  if (!spill) {
    return;
  }
  spill.removed = true;
  appendFrameCommand(frameCommands, {
    type: 'tarSpillRemove',
    spillId,
    reason,
  });
}

function removeBlackHoleZoneInFrame(zoneId, frameCommands, reason = 'timeout') {
  const zone = room.blackHoleZones.find((item) => item && item.id === zoneId && !item.removed);
  if (!zone) {
    return;
  }
  zone.removed = true;
  appendFrameCommand(frameCommands, {
    type: 'blackHoleZoneRemove',
    zoneId,
    reason,
  });
}

function tryThrowTarByPlayer(player, throwTar, frameCommands) {
  if (!player || player.dead || player.disconnected || !throwTar) {
    return false;
  }
  const hasTarAmmo = (player.tarAmmoCount || 0) > 0;
  const hasActiveTarPickup = getPlayerActivePickupType(player) === PICKUP_TYPE.TAR;
  if (!hasTarAmmo && !hasActiveTarPickup) {
    return false;
  }
  const playerPos = getPlayerRuntimePosition(player);
  const attackRadius = Number.isFinite(player.baseAttackRadius) && player.baseAttackRadius > 0
    ? player.baseAttackRadius
    : 420;
  const runtimeDir = getPlayerRuntimeDir(player);
  const normalized = Number.isFinite(throwTar.dirX) && Number.isFinite(throwTar.dirY)
    ? { x: throwTar.dirX, y: throwTar.dirY }
    : runtimeDir;
  const ratio = Number.isFinite(throwTar.ratio) ? clamp(throwTar.ratio, 0, 1) : 1;
  const throwDistance = Math.max(30, attackRadius * ratio);
  const target = clampPointToBounds({
    x: playerPos.x + normalized.x * throwDistance,
    y: playerPos.y + normalized.y * throwDistance,
  }, TAR_SPILL_RADIUS * 0.55);
  const spill = createTarSpill(target);
  if (!spill) {
    return false;
  }
  player.tarAmmoCount = 0;
  if (hasActiveTarPickup) {
    clearPlayerActivePickup(player);
  }
  appendFrameCommand(frameCommands, {
    type: 'tarThrow',
    playerId: player.playerId,
    from: {
      x: playerPos.x,
      y: playerPos.y,
    },
    to: {
      x: spill.x,
      y: spill.y,
    },
    spillId: spill.id,
    flightTime: 0.28,
  });
  spawnTarSpillInFrame(spill, player, frameCommands);
  return true;
}

function tryThrowBlackHoleByPlayer(player, throwPayload, frameCommands) {
  if (!player || player.dead || player.disconnected || !throwPayload) {
    return false;
  }
  const hasBlackHoleAmmo = (player.blackHoleAmmoCount || 0) > 0;
  const hasActiveBlackHolePickup = getPlayerActivePickupType(player) === PICKUP_TYPE.BLACK_HOLE;
  if (!hasBlackHoleAmmo && !hasActiveBlackHolePickup) {
    return false;
  }
  const playerPos = getPlayerRuntimePosition(player);
  const attackRadius = Number.isFinite(player.baseAttackRadius) && player.baseAttackRadius > 0
    ? player.baseAttackRadius
    : 420;
  const runtimeDir = getPlayerRuntimeDir(player);
  const normalized = Number.isFinite(throwPayload.dirX) && Number.isFinite(throwPayload.dirY)
    ? { x: throwPayload.dirX, y: throwPayload.dirY }
    : runtimeDir;
  const ratio = Number.isFinite(throwPayload.ratio) ? clamp(throwPayload.ratio, 0, 1) : 1;
  const throwDistance = Math.max(30, attackRadius * ratio);
  const target = clampPointToBounds({
    x: playerPos.x + normalized.x * throwDistance,
    y: playerPos.y + normalized.y * throwDistance,
  }, BLACK_HOLE_ZONE_RADIUS + 20);
  const zone = createBlackHoleZone(target);
  if (!zone) {
    return false;
  }
  player.blackHoleAmmoCount = 0;
  if (hasActiveBlackHolePickup) {
    clearPlayerActivePickup(player);
  }
  appendFrameCommand(frameCommands, {
    type: 'blackHoleThrow',
    playerId: player.playerId,
    from: {
      x: playerPos.x,
      y: playerPos.y,
    },
    to: {
      x: zone.x,
      y: zone.y,
    },
    zoneId: zone.id,
    flightTime: 0.28,
  });
  spawnBlackHoleZoneInFrame(zone, player, frameCommands);
  return true;
}

function updateTarPickupSpawns(frameCommands) {
  for (let i = room.tarPickups.length - 1; i >= 0; i--) {
    const pickup = room.tarPickups[i];
    if (!pickup || pickup.removed) {
      continue;
    }
    if (Number.isFinite(pickup.remainTime)) {
      pickup.remainTime -= TICK_INTERVAL / 1000;
      if (pickup.remainTime <= 0) {
        pickup.remainTime = 0;
        removeTarPickupInFrame(pickup.id, frameCommands, 'timeout');
      }
    }
  }
  const aliveCount = room.tarPickups.filter((pickup) => pickup && !pickup.removed).length;
  if (aliveCount >= TAR_PICKUP_MAX_COUNT) {
    return;
  }
  if (room.elapsedSeconds < TAR_PICKUP_START_DELAY) {
    return;
  }
  if (room.tarPickupSpawnCd > 0) {
    room.tarPickupSpawnCd -= TICK_INTERVAL / 1000;
    return;
  }
  spawnTarPickupInFrame(frameCommands);
  room.tarPickupSpawnCd = randomBetween(TAR_PICKUP_RESPAWN_MIN, TAR_PICKUP_RESPAWN_MAX);
}

function updateBlackHolePickupSpawns(frameCommands) {
  for (let i = room.blackHolePickups.length - 1; i >= 0; i--) {
    const pickup = room.blackHolePickups[i];
    if (!pickup || pickup.removed) {
      continue;
    }
    if (Number.isFinite(pickup.remainTime)) {
      pickup.remainTime -= TICK_INTERVAL / 1000;
      if (pickup.remainTime <= 0) {
        pickup.remainTime = 0;
        removeBlackHolePickupInFrame(pickup.id, frameCommands, 'timeout');
      }
    }
  }
  const aliveCount = room.blackHolePickups.filter((pickup) => pickup && !pickup.removed).length;
  if (aliveCount >= BLACK_HOLE_PICKUP_MAX_COUNT) {
    return;
  }
  if (room.elapsedSeconds < BLACK_HOLE_PICKUP_START_DELAY) {
    return;
  }
  if (room.blackHolePickupSpawnCd > 0) {
    room.blackHolePickupSpawnCd -= TICK_INTERVAL / 1000;
    return;
  }
  spawnBlackHolePickupInFrame(frameCommands);
  room.blackHolePickupSpawnCd = randomBetween(BLACK_HOLE_PICKUP_RESPAWN_MIN, BLACK_HOLE_PICKUP_RESPAWN_MAX);
}

function updateTarSpills(frameCommands) {
  for (let i = 0; i < room.tarSpills.length; i++) {
    const spill = room.tarSpills[i];
    if (!spill || spill.removed) {
      continue;
    }
    spill.remainTime -= TICK_INTERVAL / 1000;
    if (spill.remainTime <= 0) {
      spill.remainTime = 0;
      removeTarSpillInFrame(spill.id, frameCommands, 'timeout');
    }
  }
  room.tarSpills = room.tarSpills.filter((spill) => spill && !spill.removed);
}

function updateBlackHoleZones(frameCommands) {
  for (let i = 0; i < room.blackHoleZones.length; i++) {
    const zone = room.blackHoleZones[i];
    if (!zone || zone.removed) {
      continue;
    }
    zone.remainTime -= TICK_INTERVAL / 1000;
    if (zone.remainTime <= 0) {
      zone.remainTime = 0;
      removeBlackHoleZoneInFrame(zone.id, frameCommands, 'timeout');
    }
  }
  room.blackHoleZones = room.blackHoleZones.filter((zone) => zone && !zone.removed);
}

function createRandomEnergy() {
  const margin = 520;
  const spawnPoint = chooseEnergySpawnPoint(margin, true);
  return {
    id: room.nextEnergyId++,
    x: spawnPoint ? spawnPoint.x : Math.floor(Math.random() * 2800) - 1400,
    y: spawnPoint ? spawnPoint.y : Math.floor(Math.random() * 1800) - 900,
    value: ENERGY_VALUE,
    radius: 36,
    margin,
  };
}

function spawnEnergy() {
  if (room.energies.length >= ENERGY_MAX_COUNT) {
    return null;
  }
  const energy = createRandomEnergy();
  room.energies.push(energy);
  return energy;
}

function appendFrameCommand(frameCommands, command) {
  if (!frameCommands || !command) {
    return;
  }
  frameCommands.push(command);
}

function randomBetween(min, max) {
  if (max <= min) {
    return min;
  }
  return min + Math.random() * (max - min);
}

function pickOne(list) {
  if (!Array.isArray(list) || list.length <= 0) {
    return null;
  }
  return list[Math.floor(Math.random() * list.length)] || null;
}

function getSpecialEventSpawnSources() {
  if (Array.isArray(room.energySpawnPoints) && room.energySpawnPoints.length > 0) {
    return room.energySpawnPoints;
  }
  if (Array.isArray(room.spawnCandidates) && room.spawnCandidates.length > 0) {
    return room.spawnCandidates;
  }
  return [];
}

function getWaveAreaSlotTarget(slotId, padding = 0) {
  const zone = getPreferredSpawnSafeZone();
  const bounds = room.mapBounds || { halfWidth: 1400, halfHeight: 900 };
  const defs = {
    northWest: { dirX: -1, dirY: 1 },
    northEast: { dirX: 1, dirY: 1 },
    southWest: { dirX: -1, dirY: -1 },
    southEast: { dirX: 1, dirY: -1 },
  };
  const def = defs[slotId] || defs.northWest;
  if (zone) {
    const usableRadius = Math.max(160, zone.radius - Math.max(0, padding) - 90);
    return clampPointToBounds({
      x: zone.centerX + def.dirX * usableRadius * 0.5,
      y: zone.centerY + def.dirY * usableRadius * 0.42,
    }, padding);
  }
  return clampPointToBounds({
    x: def.dirX * bounds.halfWidth * 0.45,
    y: def.dirY * bounds.halfHeight * 0.4,
  }, padding);
}

function doesPointMatchWaveAreaSlot(point, slotId) {
  if (!point) {
    return false;
  }
  const zone = getPreferredSpawnSafeZone();
  const centerX = zone ? zone.centerX : 0;
  const centerY = zone ? zone.centerY : 0;
  if (slotId === 'northWest') {
    return point.x <= centerX && point.y >= centerY;
  }
  if (slotId === 'northEast') {
    return point.x >= centerX && point.y >= centerY;
  }
  if (slotId === 'southWest') {
    return point.x <= centerX && point.y <= centerY;
  }
  if (slotId === 'southEast') {
    return point.x >= centerX && point.y <= centerY;
  }
  return true;
}

function chooseBestWaveAreaSlotPoint(candidates, target, usedPoints, padding = 0) {
  if (!Array.isArray(candidates) || candidates.length <= 0) {
    return null;
  }
  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let i = 0; i < candidates.length; i++) {
    const point = clampPointToBounds(candidates[i], padding);
    let minUsedDistance = Number.POSITIVE_INFINITY;
    for (let j = 0; j < usedPoints.length; j++) {
      minUsedDistance = Math.min(minUsedDistance, Math.sqrt(distanceSqr(point, usedPoints[j])));
    }
    if (minUsedDistance < 220) {
      continue;
    }
    const score = Math.sqrt(distanceSqr(point, target));
    if (score < bestScore) {
      bestScore = score;
      best = point;
    }
  }
  if (best) {
    return best;
  }
  return clampPointToBounds(pickOne(candidates), padding);
}

function buildWaveAreaSlots() {
  const padding = SPECIAL_EVENT_BLACK_HOLE_RADIUS + 40;
  const source = filterPointsInsidePreferredSafeZone(getSpecialEventSpawnSources(), padding);
  const slotIds = ['northWest', 'northEast', 'southWest', 'southEast'];
  const slots = {};
  const usedPoints = [];
  for (let i = 0; i < slotIds.length; i++) {
    const slotId = slotIds[i];
    const target = getWaveAreaSlotTarget(slotId, padding);
    const quadrantCandidates = source.filter((point) => doesPointMatchWaveAreaSlot(point, slotId));
    const preferred = quadrantCandidates.length > 0 ? quadrantCandidates : source;
    const picked = chooseBestWaveAreaSlotPoint(preferred, target, usedPoints, padding) || target;
    if (picked) {
      const point = clampPointToBounds(picked, padding);
      slots[slotId] = point;
      usedPoints.push(point);
    }
  }
  return slots;
}

function getWaveAreaSlots() {
  if (!room.waveAreaSlots || typeof room.waveAreaSlots !== 'object') {
    room.waveAreaSlots = buildWaveAreaSlots();
  }
  return room.waveAreaSlots || {};
}

function getWaveAreaSlotPoint(slotId, padding = 0, validator = null) {
  const slots = getWaveAreaSlots();
  const point = slots[slotId] || getWaveAreaSlotTarget(slotId, padding);
  if (point) {
    const resolved = resolveConfiguredSpawnPoint(point, padding, `areaSlot:${slotId}`, validator);
    if (resolved) {
      return resolved;
    }
  }
  return chooseSpecialEventPoint(padding);
}

function getSmallEnergyHubSlotIds() {
  if (Array.isArray(room.smallEnergyHubSlotIds) && room.smallEnergyHubSlotIds.length >= 2) {
    return room.smallEnergyHubSlotIds.slice(0, 2);
  }
  const slots = getWaveAreaSlots();
  const slotIds = Object.keys(slots);
  let bestPair = null;
  let bestDistance = -1;
  for (let i = 0; i < slotIds.length; i++) {
    for (let j = i + 1; j < slotIds.length; j++) {
      const pointA = slots[slotIds[i]];
      const pointB = slots[slotIds[j]];
      if (!pointA || !pointB) {
        continue;
      }
      const dist = distanceSqr(pointA, pointB);
      if (dist > bestDistance) {
        bestDistance = dist;
        bestPair = [slotIds[i], slotIds[j]];
      }
    }
  }
  room.smallEnergyHubSlotIds = bestPair || ['northWest', 'southEast'];
  return room.smallEnergyHubSlotIds.slice(0, 2);
}

function getSpecialEventOccupiedPoints(eventData) {
  if (!eventData) {
    return [];
  }
  const result = [];
  if (eventData.center) {
    result.push(eventData.center);
  }
  if (eventData.entryPos) {
    result.push(eventData.entryPos);
  }
  if (eventData.exitPos) {
    result.push(eventData.exitPos);
  }
  return result;
}

function isSpecialEventPointAvailable(point, padding = 90) {
  if (!point) {
    return false;
  }
  for (let i = 0; i < room.players.length; i++) {
    const player = room.players[i];
    if (!player || player.dead || player.disconnected) {
      continue;
    }
    if (Math.sqrt(distanceSqr(getPlayerRuntimePosition(player), point)) < SPECIAL_EVENT_MIN_PLAYER_DISTANCE) {
      return false;
    }
  }
  for (let i = 0; i < room.energies.length; i++) {
    const energy = room.energies[i];
    if (energy && Math.sqrt(distanceSqr(energy, point)) < SPECIAL_EVENT_MIN_ENERGY_DISTANCE) {
      return false;
    }
  }
  for (let i = 0; i < room.energyEggs.length; i++) {
    const egg = room.energyEggs[i];
    if (egg && !egg.removed && Math.sqrt(distanceSqr(egg, point)) < SPECIAL_EVENT_MIN_EGG_DISTANCE) {
      return false;
    }
  }
  for (let i = 0; i < room.activeSpecialEvents.length; i++) {
    const eventData = room.activeSpecialEvents[i];
    if (!eventData) {
      continue;
    }
    const occupiedPoints = getSpecialEventOccupiedPoints(eventData);
    const avoidRadius = Math.max(120, Number(eventData.radius) || 0, padding * 0.9);
    for (let j = 0; j < occupiedPoints.length; j++) {
      if (Math.sqrt(distanceSqr(occupiedPoints[j], point)) < avoidRadius) {
        return false;
      }
    }
  }
  const clamped = clampPointToBounds(point, padding);
  return Math.abs(clamped.x - point.x) < 0.01 && Math.abs(clamped.y - point.y) < 0.01;
}

function chooseSpecialEventPoint(padding = 90) {
  const points = filterPointsInsidePreferredSafeZone(getSpecialEventSpawnSources(), padding);
  if (points.length > 0) {
    const preferred = points.filter((point) => isSpecialEventPointAvailable(point, padding));
    const source = preferred.length > 0 ? preferred : points;
    const picked = pickOne(source);
    if (picked) {
      return clampPointToBounds({ x: picked.x, y: picked.y }, padding);
    }
  }
  return chooseRandomPreferredSafePoint(padding);
}

function choosePortalPair() {
  const entry = chooseSpecialEventPoint(SPECIAL_EVENT_PORTAL_RADIUS + 40);
  const points = filterPointsInsidePreferredSafeZone(getSpecialEventSpawnSources(), SPECIAL_EVENT_PORTAL_RADIUS + 40);
  const candidates = [];
  for (let i = 0; i < points.length; i++) {
    const point = clampPointToBounds(points[i], SPECIAL_EVENT_PORTAL_RADIUS + 40);
    const dist = Math.sqrt(distanceSqr(entry, point));
    if (dist >= SPECIAL_EVENT_PORTAL_PAIR_MIN && dist <= SPECIAL_EVENT_PORTAL_PAIR_MAX) {
      candidates.push(point);
    }
  }
  let exit = candidates.length > 0 ? pickOne(candidates) : null;
  if (!exit) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = randomBetween(SPECIAL_EVENT_PORTAL_PAIR_MIN, SPECIAL_EVENT_PORTAL_PAIR_MAX);
      const point = clampPointToBounds({
        x: entry.x + Math.cos(angle) * distance,
        y: entry.y + Math.sin(angle) * distance,
      }, SPECIAL_EVENT_PORTAL_RADIUS + 40);
      if (isPointInsidePreferredSafeZone(point, SPECIAL_EVENT_PORTAL_RADIUS + 40)) {
        exit = point;
        break;
      }
    }
  }
  if (!exit) {
    exit = chooseRandomPreferredSafePoint(SPECIAL_EVENT_PORTAL_RADIUS + 40);
  }
  return {
    entryPos: entry,
    exitPos: exit,
  };
}

function buildSpecialEventPayload(eventType) {
  const id = `evt_${room.nextSpecialEventId++}`;
  if (eventType === 'portal') {
    const pair = choosePortalPair();
    return {
      id,
      type: eventType,
      duration: SPECIAL_EVENT_DURATION,
      radius: SPECIAL_EVENT_PORTAL_RADIUS,
      entryPos: pair.entryPos,
      exitPos: pair.exitPos,
    };
  }
  if (eventType === 'damageDouble') {
    return {
      id,
      type: eventType,
      duration: SPECIAL_EVENT_DURATION,
      center: chooseSpecialEventPoint(SPECIAL_EVENT_DAMAGE_RADIUS + 40),
      radius: SPECIAL_EVENT_DAMAGE_RADIUS,
      damageMultiplier: 2,
      scaleMultiplier: 1.5,
    };
  }
  if (eventType === 'speedDouble') {
    return {
      id,
      type: eventType,
      duration: SPECIAL_EVENT_DURATION,
      center: chooseSpecialEventPoint(SPECIAL_EVENT_SPEED_RADIUS + 40),
      radius: SPECIAL_EVENT_SPEED_RADIUS,
      speedMultiplier: 3,
    };
  }
  if (eventType === 'centrifugal') {
    return {
      id,
      type: eventType,
      duration: SPECIAL_EVENT_DURATION,
      center: chooseSpecialEventPoint(SPECIAL_EVENT_CENTRIFUGAL_RADIUS + 40),
      radius: SPECIAL_EVENT_CENTRIFUGAL_RADIUS,
      triggerRadius: SPECIAL_EVENT_CENTRIFUGAL_RADIUS - 10,
      orbitRadius: SPECIAL_EVENT_CENTRIFUGAL_RADIUS + 10,
      rotateAngle: SPECIAL_EVENT_CENTRIFUGAL_ROTATE_ANGLE,
      angularSpeed: SPECIAL_EVENT_CENTRIFUGAL_ANGULAR_SPEED,
      speedBoost: SPECIAL_EVENT_CENTRIFUGAL_SPEED_MULTIPLIER,
      damageBoost: SPECIAL_EVENT_CENTRIFUGAL_DAMAGE_MULTIPLIER,
      directionSign: -1,
    };
  }
  if (eventType === 'spreadBullet') {
    return {
      id,
      type: eventType,
      duration: SPECIAL_EVENT_DURATION,
      center: chooseSpecialEventPoint(SPECIAL_EVENT_SPREAD_BULLET_RADIUS + 40),
      radius: SPECIAL_EVENT_SPREAD_BULLET_RADIUS,
      spreadCount: SPECIAL_EVENT_SPREAD_BULLET_COUNT,
      spreadAngle: SPECIAL_EVENT_SPREAD_BULLET_ANGLE,
    };
  }
  return {
    id,
    type: 'blackHole',
    duration: SPECIAL_EVENT_DURATION,
    center: chooseSpecialEventPoint(SPECIAL_EVENT_BLACK_HOLE_RADIUS + 40),
    radius: SPECIAL_EVENT_BLACK_HOLE_RADIUS,
    destroyRadius: SPECIAL_EVENT_BLACK_HOLE_DESTROY_RADIUS,
    gravityStrength: 160,
  };
}

function spawnSpecialEventInFrame(frameCommands, maxActiveCount = 1, preferredType = '') {
  if (room.activeSpecialEvents.length >= maxActiveCount) {
    return null;
  }
  const eventTypes = ['portal', 'damageDouble', 'speedDouble', 'blackHole', 'centrifugal', 'spreadBullet'];
  const eventType = preferredType && eventTypes.indexOf(preferredType) >= 0
    ? preferredType
    : pickOne(eventTypes);
  const eventData = buildSpecialEventPayload(eventType);
  eventData.remainTime = eventData.duration;
  room.activeSpecialEvents.push(eventData);
  appendFrameCommand(frameCommands, {
    type: 'specialEventSpawn',
    event: eventData,
  });
  return eventData;
}

function removeSpecialEventInFrame(eventId, frameCommands, reason = 'timeout') {
  const index = room.activeSpecialEvents.findIndex((item) => item && item.id === eventId);
  if (index < 0) {
    return;
  }
  const active = room.activeSpecialEvents[index];
  room.activeSpecialEvents.splice(index, 1);
  if (room.activeSpecialEvents.length <= 0) {
    room.specialEventSpawnCd = randomBetween(SPECIAL_EVENT_RESPAWN_MIN, SPECIAL_EVENT_RESPAWN_MAX);
  }
  appendFrameCommand(frameCommands, {
    type: 'specialEventRemove',
    eventId: active.id,
    eventType: active.type,
    reason,
  });
}

function applyBulletEventToServerState(player, bulletEvent) {
  if (!player || !bulletEvent || !bulletEvent.bulletId) {
    return null;
  }
  const bullet = room.bullets[bulletEvent.bulletId];
  if (!bullet || bullet.playerId !== player.playerId) {
    return null;
  }
  if (!bullet.eventStates) {
    bullet.eventStates = {};
  }
  const eventType = bulletEvent.type;
  const stateKey = eventType + ':' + (bulletEvent.eventId || '');
  if (bullet.eventStates[stateKey]) {
    return null;
  }
  bullet.eventStates[stateKey] = true;
  if (eventType === 'damageDouble') {
    bullet.damage *= 2;
  } else if (eventType === 'speedDouble') {
    bullet.speedScale = (bullet.speedScale || 1) * 3;
  } else if (eventType === 'centrifugal') {
    bullet.damage *= SPECIAL_EVENT_CENTRIFUGAL_DAMAGE_MULTIPLIER;
    bullet.speedScale = (bullet.speedScale || 1) * SPECIAL_EVENT_CENTRIFUGAL_SPEED_MULTIPLIER;
  } else if (eventType === 'spreadBullet') {
    bullet.splitTriggered = true;
  } else if (eventType === 'blackHole') {
    bullet.destroyed = true;
  } else if (eventType === 'bounce') {
    if ((bullet.bounceLeft || 0) <= 0 || bullet.destroyed) {
      return null;
    }
    bullet.bounceLeft = Math.max(0, (bullet.bounceLeft || 0) - 1);
    bullet.bounced = true;
    return {
      type: 'bulletBounce',
      bulletId: bullet.id,
      bounceLeft: bullet.bounceLeft,
    };
  }
  return null;
}

function updateSpecialEvents(frameCommands) {
  for (let i = room.activeSpecialEvents.length - 1; i >= 0; i--) {
    const eventData = room.activeSpecialEvents[i];
    if (!eventData) {
      room.activeSpecialEvents.splice(i, 1);
      continue;
    }
    eventData.remainTime -= TICK_INTERVAL / 1000;
    if (eventData.remainTime <= 0) {
      eventData.remainTime = 0;
      removeSpecialEventInFrame(eventData.id, frameCommands, 'timeout');
    }
  }
}

function spawnInitialMatchPickups() {
}

function spawnInitialSpecialEvents() {
}

function buildPlayerStateCommand(player) {
  const bush = findBushContainingPlayer(player);
  const pos = getPlayerRuntimePosition(player);
  const dir = getPlayerRuntimeDir(player);
  player.inBush = !!bush;
  player.bushId = bush ? bush.id : null;
  return {
    type: 'playerState',
    playerId: player.playerId,
    hp: player.hp,
    maxHp: player.maxHp,
    atk: player.atk,
    moveSpeedScale: player.moveSpeedScale,
    energyLevel: player.energyLevel,
    energyExp: player.energyExp,
    energyNeedExp: player.energyNeedExp,
    bulletBounceCount: clamp(Math.round(player.bulletBounceCount || 0), 0, PLAYER_BOUNCE_MAX_COUNT),
    tarAmmoCount: player.tarAmmoCount || 0,
    blackHoleAmmoCount: player.blackHoleAmmoCount || 0,
    activePickupType: getPlayerActivePickupType(player),
    freeBulletCount: clamp(Math.round(player.freeBulletCount || 0), 0, PLAYER_FREE_BULLET_MAX),
    stopFireTime: Math.max(0, player.stopFireTime || 0),
    freeBulletRecoverTime: Math.max(0, player.freeBulletRecoverTime || 0),
    shotCooldownRemaining: Math.max(0, player.shotCooldownRemaining || 0),
    x: Math.round(pos.x),
    y: Math.round(pos.y),
    dirX: Number(dir.x.toFixed(4)),
    dirY: Number(dir.y.toFixed(4)),
    speed: Number((((player.lastSnapshot && player.lastSnapshot.speed) || 0)).toFixed(3)),
    inBush: !!player.inBush,
    bushId: player.bushId == null ? null : player.bushId,
    dead: !!player.dead,
    disconnected: !!player.disconnected,
  };
}

function buildPickupUseEventPayload(pickupType, point) {
  const normalizedType = normalizePickupType(pickupType);
  if (!normalizedType || !point) {
    return null;
  }
  if (normalizedType === PICKUP_TYPE.PORTAL) {
    const exit = resolveConfiguredSpawnPoint({
      x: point.x + 220,
      y: point.y,
    }, SPECIAL_EVENT_PORTAL_RADIUS + 40, 'pickupPortalExit');
    if (!exit) {
      return null;
    }
    return {
      id: `pickup_portal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'portal',
      duration: CONFIG_PICKUP_USE_DURATION,
      radius: SPECIAL_EVENT_PORTAL_RADIUS,
      entryPos: clonePoint(point),
      exitPos: clonePoint(exit),
      source: 'pickup',
    };
  }
  if (normalizedType === PICKUP_TYPE.SPEED_DOUBLE) {
    return {
      id: `pickup_speed_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'speedDouble',
      duration: CONFIG_PICKUP_USE_DURATION,
      radius: SPECIAL_EVENT_SPEED_RADIUS,
      center: clonePoint(point),
      speedMultiplier: 3,
      source: 'pickup',
    };
  }
  if (normalizedType === PICKUP_TYPE.DAMAGE_DOUBLE) {
    return {
      id: `pickup_damage_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'damageDouble',
      duration: CONFIG_PICKUP_USE_DURATION,
      radius: SPECIAL_EVENT_DAMAGE_RADIUS,
      center: clonePoint(point),
      damageMultiplier: 2,
      scaleMultiplier: 1.5,
      source: 'pickup',
    };
  }
  return null;
}

function buildSpecialEventFromConfig(item) {
  if (!item || !item.specialType) {
    return null;
  }
  const eventType = SPECIAL_EVENT_TYPES.indexOf(item.specialType) >= 0 ? item.specialType : '';
  if (!eventType) {
    logWaveSkip('unknown special type', item);
    return null;
  }
  const id = `evt_${room.nextSpecialEventId++}`;
  const duration = Number.isFinite(Number(item.duration)) ? Math.max(1, Number(item.duration)) : SPECIAL_EVENT_DURATION;
  const eventPadding = eventType === 'blackHole'
    ? SPECIAL_EVENT_BLACK_HOLE_RADIUS + 40
    : eventType === 'centrifugal'
      ? SPECIAL_EVENT_CENTRIFUGAL_RADIUS + 40
      : SPECIAL_EVENT_DAMAGE_RADIUS + 40;
  if (eventType === 'portal') {
    const entryPos = resolveConfiguredSpawnPoint({
      x: item.entryX,
      y: item.entryY,
    }, SPECIAL_EVENT_PORTAL_RADIUS + 40, 'portalEntry');
    const exitPos = resolveConfiguredSpawnPoint({
      x: item.exitX,
      y: item.exitY,
    }, SPECIAL_EVENT_PORTAL_RADIUS + 40, 'portalExit');
    if (!entryPos || !exitPos) {
      return null;
    }
    return {
      id,
      type: 'portal',
      duration,
      remainTime: duration,
      radius: SPECIAL_EVENT_PORTAL_RADIUS,
      entryPos,
      exitPos,
      source: 'wave',
    };
  }
  const center = item.areaSlot
    ? getWaveAreaSlotPoint(item.areaSlot, eventPadding, (point) => isSpecialEventPointAvailable(point, eventPadding))
    : resolveConfiguredSpawnPoint({
      x: item.x,
      y: item.y,
    }, eventPadding, `special:${eventType}`, (point) => isSpecialEventPointAvailable(point, eventPadding));
  if (!center) {
    return null;
  }
  if (eventType === 'damageDouble') {
    return {
      id,
      type: eventType,
      duration,
      remainTime: duration,
      center,
      radius: SPECIAL_EVENT_DAMAGE_RADIUS,
      damageMultiplier: 2,
      scaleMultiplier: 1.5,
      source: 'wave',
    };
  }
  if (eventType === 'speedDouble') {
    return {
      id,
      type: eventType,
      duration,
      remainTime: duration,
      center,
      radius: SPECIAL_EVENT_SPEED_RADIUS,
      speedMultiplier: 3,
      source: 'wave',
    };
  }
  if (eventType === 'centrifugal') {
    return {
      id,
      type: eventType,
      duration,
      remainTime: duration,
      center,
      radius: SPECIAL_EVENT_CENTRIFUGAL_RADIUS,
      triggerRadius: SPECIAL_EVENT_CENTRIFUGAL_RADIUS - 10,
      orbitRadius: SPECIAL_EVENT_CENTRIFUGAL_RADIUS + 10,
      rotateAngle: SPECIAL_EVENT_CENTRIFUGAL_ROTATE_ANGLE,
      angularSpeed: SPECIAL_EVENT_CENTRIFUGAL_ANGULAR_SPEED,
      speedBoost: SPECIAL_EVENT_CENTRIFUGAL_SPEED_MULTIPLIER,
      damageBoost: SPECIAL_EVENT_CENTRIFUGAL_DAMAGE_MULTIPLIER,
      directionSign: -1,
      source: 'wave',
    };
  }
  if (eventType === 'spreadBullet') {
    return {
      id,
      type: eventType,
      duration,
      remainTime: duration,
      center,
      radius: SPECIAL_EVENT_SPREAD_BULLET_RADIUS,
      spreadCount: SPECIAL_EVENT_SPREAD_BULLET_COUNT,
      spreadAngle: SPECIAL_EVENT_SPREAD_BULLET_ANGLE,
      source: 'wave',
    };
  }
  return {
    id,
    type: 'blackHole',
    duration,
    remainTime: duration,
    center,
    radius: SPECIAL_EVENT_BLACK_HOLE_RADIUS,
    destroyRadius: SPECIAL_EVENT_BLACK_HOLE_DESTROY_RADIUS,
    gravityStrength: BLACK_HOLE_ZONE_GRAVITY,
    source: 'wave',
  };
}

function spawnConfiguredSpecialEventInFrame(frameCommands, item) {
  const eventData = buildSpecialEventFromConfig(item);
  if (!eventData) {
    return null;
  }
  room.activeSpecialEvents.push(eventData);
  appendFrameCommand(frameCommands, {
    type: 'specialEventSpawn',
    event: eventData,
  });
  return eventData;
}

function isSmallEnergyPointAvailable(point) {
  if (!point) {
    return false;
  }
  for (let i = 0; i < room.energies.length; i++) {
    const energy = room.energies[i];
    if (energy && Math.sqrt(distanceSqr(energy, point)) < SMALL_ENERGY_MIN_GAP) {
      return false;
    }
  }
  for (let i = 0; i < room.players.length; i++) {
    const player = room.players[i];
    if (!player || player.dead || player.disconnected) {
      continue;
    }
    if (Math.sqrt(distanceSqr(getPlayerRuntimePosition(player), point)) < SMALL_ENERGY_PLAYER_SAFE_DISTANCE) {
      return false;
    }
  }
  for (let i = 0; i < room.energyEggs.length; i++) {
    const egg = room.energyEggs[i];
    if (egg && !egg.removed && Math.sqrt(distanceSqr(egg, point)) < 110) {
      return false;
    }
  }
  const clamped = clampPointToBounds(point, 42);
  return Math.abs(clamped.x - point.x) < 0.01 && Math.abs(clamped.y - point.y) < 0.01;
}

function spawnMaintainedSmallEnergiesInFrame(frameCommands, targetCount) {
  const total = Math.max(0, Math.floor(Number(targetCount) || 0));
  if (total <= 0) {
    return 0;
  }
  const hubSlotIds = getSmallEnergyHubSlotIds();
  const created = [];
  for (let i = 0; i < total; i++) {
    const hubSlotId = hubSlotIds[i % Math.max(1, hubSlotIds.length)] || 'northWest';
    const hubCenter = getWaveAreaSlotPoint(hubSlotId, 42, null);
    let resolved = null;
    for (let attempt = 0; attempt < 16; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * SMALL_ENERGY_CLUSTER_RADIUS;
      const candidate = hubCenter
        ? {
          x: hubCenter.x + Math.cos(angle) * distance,
          y: hubCenter.y + Math.sin(angle) * distance,
        }
        : chooseRandomPreferredSafePoint(42);
      resolved = resolveConfiguredSpawnPoint(candidate, 42, `smallEnergyHub:${hubSlotId}`, isSmallEnergyPointAvailable);
      if (resolved) {
        break;
      }
    }
    if (!resolved) {
      continue;
    }
    const energy = createEnergyAtPosition(resolved.x, resolved.y, ENERGY_VALUE);
    energy.lifeTime = CONFIG_SMALL_ENERGY_LIFETIME;
    energy.spawnType = 'smallEnergy';
    created.push(energy);
    appendFrameCommand(frameCommands, {
      type: 'energySpawn',
      energy,
    });
  }
  return created.length;
}

function spawnConfiguredSmallEnergyInFrame(frameCommands, point, count) {
  const total = Math.max(1, Math.floor(Number(count) || 1));
  const created = [];
  for (let i = 0; i < total; i++) {
    const angle = Math.PI * 2 * i / total;
    const offsetDistance = total <= 1 ? 0 : 28 + (i % 3) * 16;
    const resolved = resolveConfiguredSpawnPoint({
      x: point.x + Math.cos(angle) * offsetDistance,
      y: point.y + Math.sin(angle) * offsetDistance,
    }, 42, 'smallEnergy');
    if (!resolved) {
      continue;
    }
    const energy = createEnergyAtPosition(resolved.x, resolved.y, ENERGY_VALUE);
    energy.lifeTime = CONFIG_SMALL_ENERGY_LIFETIME;
    energy.spawnType = 'smallEnergy';
    created.push(energy);
    appendFrameCommand(frameCommands, {
      type: 'energySpawn',
      energy,
    });
  }
  return created;
}

function spawnConfiguredEnergyEggInFrame(frameCommands, point) {
  const egg = createEnergyEgg(point);
  if (!egg) {
    return null;
  }
  room.energyEggs.push(egg);
  room.energyEggMidgameSpawned += 1;
  appendFrameCommand(frameCommands, {
    type: 'energyEggSpawn',
    egg: {
      id: egg.id,
      x: egg.x,
      y: egg.y,
      radius: egg.radius,
      remainTime: egg.remainTime,
      mature: false,
      attached: false,
      ownerPlayerId: null,
      attachOffsetX: 0,
      attachOffsetY: 0,
      energyCount: egg.energyCount,
      energyScatterRadius: egg.energyScatterRadius,
    },
  });
  appendAnnouncement(frameCommands, {
    id: `energyEgg_${egg.id}`,
    text: '能量蛋已刷新',
    subText: '小地图 marker 接口已预留，当前先使用公告提示',
    style: 'info',
    duration: 2.2,
  });
  appendFrameCommand(frameCommands, {
    type: 'resourceMarkerHint',
    markerType: 'energyEgg',
    targetId: egg.id,
    x: egg.x,
    y: egg.y,
  });
  return egg;
}

function spawnConfiguredResourceInFrame(frameCommands, item) {
  if (!item || !item.resourceType) {
    return null;
  }
  const resourceType = item.resourceType;
  const point = resolveConfiguredSpawnPoint(item.position, resourceType === 'energyWell' ? ENERGY_WELL_RADIUS + 16 : 46, resourceType);
  if (!point) {
    return null;
  }
  if (resourceType === 'energyEgg') {
    return spawnConfiguredEnergyEggInFrame(frameCommands, point);
  }
  if (resourceType === 'energyWell') {
    const well = spawnEnergyWellInFrame(frameCommands, point);
    if (well) {
      appendAnnouncement(frameCommands, {
        id: `energyWell_${well.id}`,
        text: '能量井已刷新',
        subText: '小地图 marker 接口已预留，当前先使用公告提示',
        style: 'info',
        duration: 2.2,
      });
      appendFrameCommand(frameCommands, {
        type: 'resourceMarkerHint',
        markerType: 'energyWell',
        targetId: well.id,
        x: well.x,
        y: well.y,
      });
    }
    return well;
  }
  if (resourceType === 'smallEnergy') {
    return spawnConfiguredSmallEnergyInFrame(frameCommands, point, item.count);
  }
  if (resourceType === 'pickup') {
    if (!MULTIPLAYER_ENABLE_PICKUP_SPAWNS) {
      return null;
    }
    return spawnConfiguredPickupInFrame(frameCommands, point, item.pickupType);
  }
  logWaveSkip('unknown resource type', item);
  return null;
}

function triggerConfiguredWave(frameCommands, waveIndex, waveConfig) {
  if (!waveConfig) {
    return;
  }
  const resources = Array.isArray(waveConfig.resources) ? waveConfig.resources : [];
  const specialZones = Array.isArray(waveConfig.specialZones) ? waveConfig.specialZones : [];
  for (let i = 0; i < resources.length; i++) {
    spawnConfiguredResourceInFrame(frameCommands, resources[i]);
  }
  for (let i = 0; i < specialZones.length; i++) {
    spawnConfiguredSpecialEventInFrame(frameCommands, specialZones[i]);
  }
  appendAnnouncement(frameCommands, {
    id: `wave_${waveIndex}`,
    text: `第 ${waveIndex + 1} 波系统区域刷新`,
    subText: `时间点 ${waveConfig.time}s，刷新 2 个系统区域`,
    style: 'info',
    duration: 2.4,
  });
}

function updateConfiguredWaveSpawns(frameCommands) {
  const state = getWaveState();
  while (true) {
    const scheduledWave = getWaveScheduleBySequence(state.nextWaveIndex);
    if (!scheduledWave || room.elapsedSeconds + 0.0001 < scheduledWave.scheduledTime) {
      break;
    }
    triggerConfiguredWave(frameCommands, state.nextWaveIndex, scheduledWave.config);
    state.nextWaveIndex++;
  }
}

function updateConfiguredPickups(frameCommands) {
  for (let i = room.pickups.length - 1; i >= 0; i--) {
    const pickup = room.pickups[i];
    if (!pickup || pickup.removed) {
      room.pickups.splice(i, 1);
      continue;
    }
    pickup.remainTime -= TICK_INTERVAL / 1000;
    if (pickup.remainTime <= 0) {
      removeConfiguredPickupInFrame(pickup.id, frameCommands, 'timeout');
    }
  }
}

function updateConfiguredEnergyWells(frameCommands) {
  for (let i = room.energyWells.length - 1; i >= 0; i--) {
    const well = room.energyWells[i];
    if (!well || well.removed) {
      room.energyWells.splice(i, 1);
      continue;
    }
    well.nextBurstDelay -= TICK_INTERVAL / 1000;
    if (well.nextBurstDelay > 0) {
      continue;
    }
    const burstEnergies = [];
    for (let energyIndex = 0; energyIndex < ENERGY_WELL_BURST_SMALL_ENERGY_COUNT; energyIndex++) {
      const angle = (Math.PI * 2 * energyIndex) / ENERGY_WELL_BURST_SMALL_ENERGY_COUNT + Math.random() * 0.24;
      const landing = resolveConfiguredSpawnPoint({
        x: well.x + Math.cos(angle) * (well.radius + 28 + Math.random() * 54),
        y: well.y + Math.sin(angle) * (well.radius + 28 + Math.random() * 54),
      }, 42, 'energyWellBurst');
      if (!landing) {
        continue;
      }
      const energy = createEnergyAtPosition(landing.x, landing.y, ENERGY_VALUE);
      energy.lifeTime = CONFIG_SMALL_ENERGY_LIFETIME;
      energy.spawnType = 'smallEnergy';
      burstEnergies.push(energy);
    }
    well.burstCountDone += 1;
    well.nextBurstDelay = ENERGY_WELL_BURST_INTERVAL;
    appendFrameCommand(frameCommands, {
      type: 'energyWellBurst',
      wellId: well.id,
      burstIndex: well.burstCountDone,
      energies: burstEnergies,
    });
    if (well.burstCountDone >= well.burstCountTotal) {
      removeEnergyWellInFrame(well.id, frameCommands, 'complete');
    }
  }
}

function updateTimedEnergies(frameCommands) {
  for (let i = room.energies.length - 1; i >= 0; i--) {
    const energy = room.energies[i];
    if (!energy) {
      room.energies.splice(i, 1);
      continue;
    }
    if (!Number.isFinite(energy.lifeTime) || energy.lifeTime <= 0) {
      continue;
    }
    energy.lifeTime -= TICK_INTERVAL / 1000;
    if (energy.lifeTime <= 0) {
      const removed = removeEnergyById(energy.id);
      if (removed) {
        appendFrameCommand(frameCommands, {
          type: 'energyRemove',
          energyId: removed.id,
          reason: 'timeout',
        });
      }
    }
  }
}

function tickPlayerFireState(player) {
  if (!player) {
    return;
  }
  player.shotCooldownRemaining = Math.max(0, (player.shotCooldownRemaining || 0) - TICK_INTERVAL / 1000);
  if ((player.freeBulletCount || 0) >= PLAYER_FREE_BULLET_MAX) {
    player.stopFireTime = 0;
    player.freeBulletRecoverTime = 0;
    player.freeBulletCount = PLAYER_FREE_BULLET_MAX;
    return;
  }
  player.stopFireTime = Math.max(0, (player.stopFireTime || 0) + TICK_INTERVAL / 1000);
  if (player.stopFireTime < PLAYER_FREE_BULLET_RECOVER_DELAY) {
    player.freeBulletRecoverTime = 0;
    return;
  }
  player.freeBulletRecoverTime = Math.max(0, (player.freeBulletRecoverTime || 0) + TICK_INTERVAL / 1000);
  while (player.freeBulletRecoverTime >= PLAYER_FREE_BULLET_RECOVER_INTERVAL
    && player.freeBulletCount < PLAYER_FREE_BULLET_MAX) {
    player.freeBulletRecoverTime -= PLAYER_FREE_BULLET_RECOVER_INTERVAL;
    player.freeBulletCount += 1;
  }
  if (player.freeBulletCount >= PLAYER_FREE_BULLET_MAX) {
    player.freeBulletCount = PLAYER_FREE_BULLET_MAX;
    player.freeBulletRecoverTime = 0;
  }
}

function buildPlayerFireStateCommand(player, paidShot = false) {
  return {
    type: 'playerFireState',
    playerId: player.playerId,
    hp: player.hp,
    maxHp: player.maxHp,
    freeBulletCount: clamp(Math.round(player.freeBulletCount || 0), 0, PLAYER_FREE_BULLET_MAX),
    stopFireTime: Math.max(0, player.stopFireTime || 0),
    freeBulletRecoverTime: Math.max(0, player.freeBulletRecoverTime || 0),
    shotCooldownRemaining: Math.max(0, player.shotCooldownRemaining || 0),
    paidShot: !!paidShot,
  };
}

function canPlayerAffordPaidBullet(player) {
  return !!player && Number(player.hp) > PLAYER_PAID_SHOT_HP_COST;
}

function tryFireByPlayer(player, fireInput, frameCommands) {
  if (!player || player.dead || player.disconnected || !fireInput || !fireInput.id) {
    return null;
  }
  if ((player.shotCooldownRemaining || 0) > 0) {
    return null;
  }
  if ((player.freeBulletCount || 0) <= 0 && !canPlayerAffordPaidBullet(player)) {
    return null;
  }

  let paidShot = false;
  if ((player.freeBulletCount || 0) > 0) {
    player.freeBulletCount -= 1;
  } else {
    paidShot = true;
    player.hp -= PLAYER_PAID_SHOT_HP_COST;
    if (player.hp < 0) {
      player.hp = 0;
    }
  }
  player.stopFireTime = 0;
  player.freeBulletRecoverTime = 0;
  player.shotCooldownRemaining = PLAYER_SHOOT_INTERVAL;

  room.bullets[fireInput.id] = {
    id: fireInput.id,
    playerId: player.playerId,
    damage: player.atk == null ? 5 : player.atk,
    bounceLeft: clamp(
      Math.round(
        Number.isFinite(fireInput.bounceCount)
          ? fireInput.bounceCount
          : (player.bulletBounceCount || 0)
      ),
      0,
      PLAYER_BOUNCE_MAX_COUNT
    ),
    bounced: false,
    destroyed: false,
    eventStates: {},
  };

  appendFrameCommand(frameCommands, buildPlayerFireStateCommand(player, paidShot));
  return {
    id: fireInput.id,
    type: fireInput.type,
  };
}

function spawnEnergyInFrame(frameCommands) {
  const energy = spawnEnergy();
  if (energy) {
    appendFrameCommand(frameCommands, {
      type: 'energySpawn',
      energy,
    });
  }
  return energy;
}

function createEnergyAtPosition(x, y, value = ENERGY_VALUE) {
  const point = clampPointToBounds({ x, y }, 42);
  const energy = {
    id: room.nextEnergyId++,
    x: point.x,
    y: point.y,
    value,
    radius: 36,
    margin: 520,
  };
  room.energies.push(energy);
  return energy;
}

function createEnergyEgg(point) {
  if (!point) {
    return null;
  }
  const pos = clampPointToBounds(point, ENERGY_EGG_RADIUS + 8);
  return {
    id: room.nextEnergyEggId++,
    x: pos.x,
    y: pos.y,
    radius: ENERGY_EGG_RADIUS,
    remainTime: ENERGY_EGG_MATURE_TIME,
    mature: false,
    removed: false,
    attached: false,
    ownerPlayerId: null,
    attachOffsetX: 0,
    attachOffsetY: 0,
    energyCount: ENERGY_EGG_BURST_COUNT,
    energyScatterRadius: ENERGY_EGG_BURST_SCATTER_RADIUS,
  };
}

function isEggSpawnPointAvailable(point) {
  if (!point) {
    return false;
  }
  for (let i = 0; i < room.energies.length; i++) {
    const energy = room.energies[i];
    if (energy && Math.sqrt(distanceSqr(energy, point)) < 180) {
      return false;
    }
  }
  for (let i = 0; i < room.energyEggs.length; i++) {
    const egg = room.energyEggs[i];
    if (egg && !egg.removed && Math.sqrt(distanceSqr(egg, point)) < 220) {
      return false;
    }
  }
  for (let i = 0; i < room.players.length; i++) {
    const player = room.players[i];
    if (!player || player.dead || player.disconnected) {
      continue;
    }
    const pos = getPlayerRuntimePosition(player);
    if (Math.sqrt(distanceSqr(pos, point)) < 160) {
      return false;
    }
  }
  return true;
}

function chooseEnergyEggSpawnPoint() {
  const candidates = filterPointsInsidePreferredSafeZone(room.energySpawnPoints || [], ENERGY_EGG_RADIUS + 8);
  const preferred = [];
  const fallback = [];
  for (let i = 0; i < candidates.length; i++) {
    const point = candidates[i];
    if (!point) {
      continue;
    }
    if (isEggSpawnPointAvailable(point)) {
      preferred.push(point);
    } else {
      fallback.push(point);
    }
  }
  const source = preferred.length > 0 ? preferred : fallback;
  if (source.length > 0) {
    return source[Math.floor(Math.random() * source.length)];
  }
  return chooseRandomPreferredSafePoint(ENERGY_EGG_RADIUS + 8);
}

function spawnEnergyEggInFrame(frameCommands) {
  const aliveEggCount = room.energyEggs.filter((egg) => egg && !egg.removed).length;
  if (aliveEggCount >= ENERGY_EGG_MAX_COUNT) {
    return null;
  }
  if (room.energyEggMidgameSpawned >= room.energyEggMidgamePlan) {
    return null;
  }
  const egg = createEnergyEgg(chooseEnergyEggSpawnPoint());
  if (!egg) {
    return null;
  }
  room.energyEggs.push(egg);
  room.energyEggMidgameSpawned += 1;
  appendFrameCommand(frameCommands, {
    type: 'energyEggSpawn',
    egg: {
      id: egg.id,
      x: egg.x,
      y: egg.y,
      radius: egg.radius,
      remainTime: egg.remainTime,
      mature: false,
      attached: !!egg.attached,
      ownerPlayerId: egg.ownerPlayerId == null ? null : egg.ownerPlayerId,
      attachOffsetX: Number.isFinite(egg.attachOffsetX) ? egg.attachOffsetX : 0,
      attachOffsetY: Number.isFinite(egg.attachOffsetY) ? egg.attachOffsetY : 0,
      energyCount: egg.energyCount,
      energyScatterRadius: egg.energyScatterRadius,
    },
  });
  return egg;
}

function buildEnergyEggMoveCommand(egg) {
  if (!egg) {
    return null;
  }
  return {
    type: 'energyEggMove',
    eggId: egg.id,
    x: egg.x,
    y: egg.y,
    attached: !!egg.attached,
    ownerPlayerId: egg.ownerPlayerId == null ? null : egg.ownerPlayerId,
    attachOffsetX: Number.isFinite(egg.attachOffsetX) ? egg.attachOffsetX : 0,
    attachOffsetY: Number.isFinite(egg.attachOffsetY) ? egg.attachOffsetY : 0,
  };
}

function buildEnergyEggActionResultCommand(player, action, accepted) {
  if (!player || !action) {
    return null;
  }
  return {
    type: 'energyEggActionResult',
    playerId: player.playerId,
    seq: action.seq,
    eggId: action.eggId,
    action: action.action,
    accepted: !!accepted,
  };
}

function getEnergyEggById(eggId) {
  if (eggId == null) {
    return null;
  }
  for (let i = 0; i < room.energyEggs.length; i++) {
    const egg = room.energyEggs[i];
    if (egg && egg.id === eggId && !egg.removed) {
      return egg;
    }
  }
  return null;
}

function getAttachedEnergyEggByPlayer(player) {
  if (!player) {
    return null;
  }
  for (let i = 0; i < room.energyEggs.length; i++) {
    const egg = room.energyEggs[i];
    if (egg && !egg.removed && egg.attached && egg.ownerPlayerId === player.playerId) {
      return egg;
    }
  }
  return null;
}

function syncAttachedEnergyEggsFromPlayers(frameCommands = null) {
  for (let i = 0; i < room.energyEggs.length; i++) {
    const egg = room.energyEggs[i];
    if (!egg || egg.removed || !egg.attached || egg.ownerPlayerId == null) {
      continue;
    }
    const player = room.players[egg.ownerPlayerId];
    if (!player || player.dead || player.disconnected) {
      egg.attached = false;
      egg.ownerPlayerId = null;
      egg.attachOffsetX = 0;
      egg.attachOffsetY = 0;
      appendFrameCommand(frameCommands, buildEnergyEggMoveCommand(egg));
      continue;
    }
    const pos = clampPointToBounds({
      x: getPlayerRuntimePosition(player).x + (Number.isFinite(egg.attachOffsetX) ? egg.attachOffsetX : 0),
      y: getPlayerRuntimePosition(player).y + (Number.isFinite(egg.attachOffsetY) ? egg.attachOffsetY : 0),
    }, egg.radius + 8);
    if (Math.abs(pos.x - egg.x) > 0.01 || Math.abs(pos.y - egg.y) > 0.01) {
      egg.x = pos.x;
      egg.y = pos.y;
      appendFrameCommand(frameCommands, buildEnergyEggMoveCommand(egg));
    }
  }
}

function tryEnergyEggActionByPlayer(player, action, frameCommands) {
  if (!player || player.dead || player.disconnected || !action) {
    return false;
  }
  if (action.seq <= (player.lastEnergyEggActionSeq || 0)) {
    return false;
  }
  player.lastEnergyEggActionSeq = action.seq;

  const egg = getEnergyEggById(action.eggId);
  if (!egg) {
    appendFrameCommand(frameCommands, buildEnergyEggActionResultCommand(player, action, false));
    return false;
  }

  if (action.action === 'detach') {
    if (!egg.attached || egg.ownerPlayerId !== player.playerId) {
      appendFrameCommand(frameCommands, buildEnergyEggMoveCommand(egg));
      appendFrameCommand(frameCommands, buildEnergyEggActionResultCommand(player, action, false));
      return false;
    }
    egg.attached = false;
    egg.ownerPlayerId = null;
    egg.attachOffsetX = 0;
    egg.attachOffsetY = 0;
    appendFrameCommand(frameCommands, buildEnergyEggMoveCommand(egg));
    appendFrameCommand(frameCommands, buildEnergyEggActionResultCommand(player, action, true));
    return true;
  }

  if (egg.attached || getAttachedEnergyEggByPlayer(player) || getAttachedCoverByPlayer(player)) {
    appendFrameCommand(frameCommands, buildEnergyEggMoveCommand(egg));
    appendFrameCommand(frameCommands, buildEnergyEggActionResultCommand(player, action, false));
    return false;
  }

  const playerPos = getPlayerRuntimePosition(player);
  const distance = Math.sqrt(distanceSqr(playerPos, egg));
  if (!Number.isFinite(distance) || distance > ENERGY_EGG_ATTACH_DISTANCE) {
    appendFrameCommand(frameCommands, buildEnergyEggMoveCommand(egg));
    appendFrameCommand(frameCommands, buildEnergyEggActionResultCommand(player, action, false));
    return false;
  }

  let offsetX = egg.x - playerPos.x;
  let offsetY = egg.y - playerPos.y;
  let len = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
  if (!Number.isFinite(len) || len <= 5) {
    const dir = getPlayerRuntimeDir(player);
    offsetX = dir.x;
    offsetY = dir.y;
    len = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
  }
  if (!Number.isFinite(len) || len <= 0.0001) {
    offsetX = 1;
    offsetY = 0;
    len = 1;
  }
  const offsetDistance = clamp(len, ENERGY_EGG_ATTACH_MIN_OFFSET, ENERGY_EGG_ATTACH_MAX_OFFSET);
  egg.attachOffsetX = Number(((offsetX / len) * offsetDistance).toFixed(3));
  egg.attachOffsetY = Number(((offsetY / len) * offsetDistance).toFixed(3));
  egg.attached = true;
  egg.ownerPlayerId = player.playerId;
  syncAttachedEnergyEggsFromPlayers(frameCommands);
  appendFrameCommand(frameCommands, buildEnergyEggMoveCommand(egg));
  appendFrameCommand(frameCommands, buildEnergyEggActionResultCommand(player, action, true));
  return true;
}

function burstEnergyEggInFrame(egg, frameCommands) {
  if (!egg || egg.removed || egg.mature) {
    return;
  }
  egg.mature = true;
  const origin = { x: egg.x, y: egg.y };
  const energies = [];
  for (let i = 0; i < egg.energyCount; i++) {
    const angle = Math.PI * 2 * i / egg.energyCount + Math.random() * 0.42;
    const distance = 40 + Math.random() * egg.energyScatterRadius;
    const point = clampPointToBounds({
      x: origin.x + Math.cos(angle) * distance,
      y: origin.y + Math.sin(angle) * distance,
    }, 42);
    energies.push(createEnergyAtPosition(point.x, point.y, ENERGY_VALUE));
  }
  appendFrameCommand(frameCommands, {
    type: 'energyEggMature',
    eggId: egg.id,
    x: origin.x,
    y: origin.y,
    radius: egg.radius,
    energyCount: egg.energyCount,
    energyScatterRadius: egg.energyScatterRadius,
    energies,
  });
  egg.removed = true;
  appendFrameCommand(frameCommands, {
    type: 'energyEggRemove',
    eggId: egg.id,
  });
}

function updateEnergyEggs(frameCommands) {
  syncAttachedEnergyEggsFromPlayers(frameCommands);

  for (let i = 0; i < room.energyEggs.length; i++) {
    const egg = room.energyEggs[i];
    if (!egg || egg.removed) {
      continue;
    }
    egg.remainTime -= TICK_INTERVAL / 1000;
    if (egg.remainTime <= 0) {
      egg.remainTime = 0;
      burstEnergyEggInFrame(egg, frameCommands);
    }
  }

  room.energyEggs = room.energyEggs.filter((egg) => egg && !egg.removed);
}

function removeEnergyById(energyId) {
  const index = room.energies.findIndex((item) => item && item.id === energyId);
  if (index < 0) {
    return null;
  }
  const energy = room.energies[index];
  room.energies.splice(index, 1);
  return energy;
}

function removeEnergyInFrame(energyId, frameCommands) {
  const energy = removeEnergyById(energyId);
  if (energy) {
    appendFrameCommand(frameCommands, {
      type: 'energyRemove',
      energyId,
      reason: 'consume',
    });
  }
  return energy;
}

function buildBounceUpgrade(player) {
  const bounceCount = getPlayerBulletBounceCount(player);
  return {
    id: 'bounce',
    amount: bounceCount,
  };
}

function addPlayerEnergy(player, value) {
  if (!player || value <= 0) {
    return null;
  }

  let remain = value;
  const upgrades = [];
  const recoverHp = Math.max(0, player.maxHp - player.hp);
  if (recoverHp > 0) {
    const addHp = Math.min(recoverHp, remain);
    player.hp += addHp;
    remain -= addHp;
  }

  if (remain > 0) {
    player.energyExp += remain;
    while (player.energyExp >= player.energyNeedExp) {
      player.energyExp -= player.energyNeedExp;
      player.energyLevel += 1;
      player.bulletBounceCount = getPlayerBulletBounceCount(player);
      const upgrade = buildBounceUpgrade(player);
      upgrades.push({
        playerId: player.playerId,
        type: upgrade.id,
        amount: upgrade.amount,
        energyLevel: player.energyLevel,
      });
      player.energyNeedExp = getPlayerEnergyNeedExp(player);
    }
  }

  return upgrades;
}

function tryConsumeEnergy(player, energyId, frameCommands) {
  if (!player || player.dead || player.disconnected || energyId == null) {
    return false;
  }
  const energy = removeEnergyInFrame(energyId, frameCommands);
  if (!energy) {
    return false;
  }
  appendFrameCommand(frameCommands, {
    type: 'energyConsume',
    playerId: player.playerId,
    energyId,
    value: energy.value,
  });
  const upgrades = addPlayerEnergy(player, energy.value) || [];
  if (upgrades.length > 0) {
    upgrades.forEach((upgrade) => {
      appendFrameCommand(frameCommands, {
        type: 'playerUpgrade',
        ...upgrade,
      });
    });
  }
  return true;
}

function updateEnergySpawns(frameCommands) {
  const now = Math.max(0, room.elapsedSeconds);
  if (now + 0.0001 < (room.smallEnergyNextCheckTime || 0)) {
    return;
  }
  room.smallEnergyNextCheckTime = now + SMALL_ENERGY_CHECK_INTERVAL;
  const aliveCount = room.energies.filter(Boolean).length;
  if (aliveCount >= SMALL_ENERGY_MIN_COUNT) {
    return;
  }
  spawnMaintainedSmallEnergiesInFrame(frameCommands, SMALL_ENERGY_TARGET_COUNT - aliveCount);
}

function initMatchEnergyEggPlan() {
  let count = 0;
  for (let i = 0; i < RESOURCE_WAVE_CONFIG.length; i++) {
    const wave = RESOURCE_WAVE_CONFIG[i];
    const resources = Array.isArray(wave && wave.resources) ? wave.resources : [];
    for (let j = 0; j < resources.length; j++) {
      if (resources[j] && resources[j].resourceType === 'energyEgg') {
        count++;
      }
    }
  }
  room.energyEggMidgamePlan = count;
  room.energyEggMidgameSpawned = 0;
}

function stopTickLoop() {
  if (room.tickTimer) {
    clearInterval(room.tickTimer);
    room.tickTimer = null;
  }
}

function stopCountdown() {
  if (room.startCountdown) {
    clearInterval(room.startCountdown);
    room.startCountdown = null;
  }
  room.countdownRemaining = 0;
}

function maybeResetRoomWhenEmpty() {
  if (getConnectedPlayers().length === 0) {
    resetRoom();
  }
}

function cancelCountdown() {
  if (room.state !== ROOM_STATE.COUNTDOWN) {
    return;
  }
  stopCountdown();
  room.state = ROOM_STATE.WAITING;
  room.winnerPlayerId = -1;
  console.log('[Room] Countdown cancelled, back to waiting');
  broadcastRoomState();
}

function maybeStartCountdown() {
  if (room.state !== ROOM_STATE.WAITING) {
    return;
  }
  if (getConnectedPlayers().length < MIN_PLAYERS) {
    return;
  }
  startGameCountdown();
}

// ---------- Tick ----------
function tick() {
  if (room.state !== ROOM_STATE.RUNNING) {
    return;
  }

  const frame = ++room.currentFrame;
  const frameCommands = [];
  const playerInputCommands = [];
  const eventCommands = [];
  const stateCommands = [];
  room.elapsedSeconds += TICK_INTERVAL / 1000;
  updateSafeZoneState(frameCommands);
  updateEnergySpawns(frameCommands);
  updateConfiguredWaveSpawns(frameCommands);

  room.players.forEach((p) => {
    let inputs = {
      up: false,
      down: false,
      left: false,
      right: false,
      aim: null,
      fire: false,
      hit: false,
      pickupId: null,
      throwTar: false,
      throwBlackHole: false,
      usePickup: false,
      toggleCover: false,
      coverAction: null,
      energyEggAction: null,
    };

    if (p.dead || p.disconnected) {
      p.pendingInputs.length = 0;
      p.lastInputs = {
        up: false,
        down: false,
        left: false,
        right: false,
        aim: null,
      };
      appendFrameCommand(playerInputCommands, {
        type: 'playerInput',
        playerId: p.playerId,
        inputs,
      });
      appendFrameCommand(stateCommands, buildPlayerStateCommand(p));
      return;
    }

    tickPlayerFireState(p);
    inputs.up = !!(p.lastInputs && p.lastInputs.up);
    inputs.down = !!(p.lastInputs && p.lastInputs.down);
    inputs.left = !!(p.lastInputs && p.lastInputs.left);
    inputs.right = !!(p.lastInputs && p.lastInputs.right);
    inputs.aim = p.lastInputs && p.lastInputs.aim ? p.lastInputs.aim : null;
    let pendingFire = null;

    for (let i = 0; i < p.pendingInputs.length; i++) {
      const entry = p.pendingInputs[i];
      if (!entry || !entry.inputs) {
        continue;
      }

      const src = entry.inputs;
      inputs.up = !!src.up;
      inputs.down = !!src.down;
      inputs.left = !!src.left;
      inputs.right = !!src.right;
      const aim = sanitizeAimInput(src.aim);
      if (aim) {
        inputs.aim = aim;
      }
      if (src.fire && src.fire.id) {
        pendingFire = src.fire;
      }

      if (src.playerSnapshot) {
        p.lastSnapshot = sanitizePlayerSnapshot(src.playerSnapshot);
        if (p.lastSnapshot) {
          p.posX = p.lastSnapshot.x;
          p.posY = p.lastSnapshot.y;
          p.dirX = p.lastSnapshot.dirX;
          p.dirY = p.lastSnapshot.dirY;
        }
      }

      if (src.hit) {
        inputs.hit = src.hit;
      }

      if (Array.isArray(src.bulletEvents) && src.bulletEvents.length > 0) {
        for (let eventIndex = 0; eventIndex < src.bulletEvents.length; eventIndex++) {
          const bulletCommand = applyBulletEventToServerState(p, src.bulletEvents[eventIndex]);
          if (bulletCommand) {
            appendFrameCommand(eventCommands, bulletCommand);
          }
        }
      }

      if (src.pickupEnergyId != null) {
        tryConsumeEnergy(p, src.pickupEnergyId, eventCommands);
      }
      if (src.pickupTarId != null) {
        tryConsumeTarPickup(p, src.pickupTarId, eventCommands);
      }
      if (src.pickupBlackHoleId != null) {
        tryConsumeBlackHolePickup(p, src.pickupBlackHoleId, eventCommands);
      }
      if (src.pickupId != null) {
        inputs.pickupId = src.pickupId;
      }
      if (src.throwTar) {
        inputs.throwTar = src.throwTar;
      }
      if (src.throwBlackHole) {
        inputs.throwBlackHole = src.throwBlackHole;
      }
      if (src.usePickup) {
        inputs.usePickup = src.usePickup;
      }
      if (src.toggleCover) {
        inputs.toggleCover = true;
      }
      const coverAction = sanitizeCoverActionInput(src.coverAction);
      if (coverAction && (!inputs.coverAction || coverAction.seq > inputs.coverAction.seq)) {
        inputs.coverAction = coverAction;
      }
      const energyEggAction = sanitizeEnergyEggActionInput(src.energyEggAction);
      if (energyEggAction && (!inputs.energyEggAction || energyEggAction.seq > inputs.energyEggAction.seq)) {
        inputs.energyEggAction = energyEggAction;
      }
      if (src.hit && src.hit.id) {
        const bullet = room.bullets[src.hit.id];
        const targetPlayer = room.players[src.hit.tgid];
        if (!bullet || bullet.destroyed || !targetPlayer || targetPlayer.dead) {
          continue;
        }
        let finalDamage = bullet.damage;
        if (bullet.bounced) {
          finalDamage *= PLAYER_BOUNCE_DAMAGE_MULTIPLIER;
        }
        targetPlayer.hp -= finalDamage;
        if (targetPlayer.hp < 0) {
          targetPlayer.hp = 0;
        }
        const hitCommand = {
          type: 'playerHit',
          id: src.hit.id,
          tgid: src.hit.tgid,
          damage: finalDamage,
          hp: targetPlayer.hp,
        };
        if (targetPlayer.hp <= 0) {
          targetPlayer.dead = true;
        }
        delete room.bullets[src.hit.id];
        appendFrameCommand(eventCommands, hitCommand);
      }
    }

    const acceptedFire = tryFireByPlayer(p, pendingFire, eventCommands);
    if (acceptedFire) {
      inputs.fire = acceptedFire;
    }

    if (inputs.throwTar) {
      tryThrowTarByPlayer(p, sanitizeThrowTarPayload(inputs.throwTar), eventCommands);
    }
    if (inputs.throwBlackHole) {
      tryThrowBlackHoleByPlayer(p, sanitizeThrowTarPayload(inputs.throwBlackHole), eventCommands);
    }
    if (inputs.pickupId != null) {
      tryConsumeConfiguredPickup(p, inputs.pickupId, eventCommands);
    }
    if (inputs.usePickup) {
      tryUseConfiguredPickupByPlayer(p, sanitizeUsePickupPayload(inputs.usePickup), eventCommands);
    }
    syncAttachedCoversFromPlayers();
    if (inputs.coverAction) {
      tryCoverActionByPlayer(p, inputs.coverAction, eventCommands);
    }
    if (inputs.energyEggAction) {
      tryEnergyEggActionByPlayer(p, inputs.energyEggAction, eventCommands);
    }
    else if (!inputs.coverAction && inputs.toggleCover) {
      tryToggleCoverByPlayer(p, eventCommands);
    }
    applySafeZoneDamageToPlayer(p, eventCommands);

    p.lastInputs = {
      up: inputs.up,
      down: inputs.down,
      left: inputs.left,
      right: inputs.right,
      aim: inputs.aim,
    };
    p.pendingInputs.length = 0;
    appendFrameCommand(playerInputCommands, {
      type: 'playerInput',
      playerId: p.playerId,
      inputs,
    });
    appendFrameCommand(stateCommands, buildPlayerStateCommand(p));
  });

  updateEnergyEggs(frameCommands);
  updateConfiguredEnergyWells(frameCommands);
  if (MULTIPLAYER_ENABLE_PICKUP_SPAWNS) {
    updateConfiguredPickups(frameCommands);
  }
  updateTimedEnergies(frameCommands);
  appendAllCoverSyncCommands(frameCommands);
  updateSpecialEvents(frameCommands);
  if (MULTIPLAYER_ENABLE_PICKUP_SPAWNS) {
    updateTarPickupSpawns(frameCommands);
    updateBlackHolePickupSpawns(frameCommands);
  }
  updateTarSpills(frameCommands);
  updateBlackHoleZones(frameCommands);
  updateMatchAnnouncements(frameCommands);
  appendFrameCommand(frameCommands, buildHudStateCommand());
  const winnerPlayerId = getMatchWinnerPlayerId();
  if (winnerPlayerId !== null) {
    appendFrameCommand(eventCommands, buildMatchResultCommand(winnerPlayerId));
  }

  broadcast({
    type: 'frame',
    frame,
    commands: frameCommands.concat(playerInputCommands, eventCommands, stateCommands),
  });
  if (winnerPlayerId !== null) {
    endMatch(winnerPlayerId);
  }
}

function getMatchWinnerPlayerId() {
  if (room.state !== ROOM_STATE.RUNNING) {
    return null;
  }

  const alivePlayers = getAlivePlayers();
  if (alivePlayers.length > 1) {
    return null;
  }

  return alivePlayers.length === 1 ? alivePlayers[0].playerId : -1;
}

function endMatch(winnerPlayerId) {
  if (room.state !== ROOM_STATE.RUNNING) {
    return;
  }

  stopTickLoop();
  room.state = ROOM_STATE.ENDED;
  room.winnerPlayerId = winnerPlayerId;

  const payload = {
    type: 'gameEnded',
    roomId: room.id,
    winnerPlayerId,
    players: room.players.map((p) => ({
      playerId: p.playerId,
      hp: p.hp,
      maxHp: p.maxHp,
      dead: p.dead,
      disconnected: !!p.disconnected,
      spawnSlot: p.spawnSlot,
    })),
  };

  broadcastRoomState();
  broadcast(payload);
  console.log(`[Room] Game ended. winner=${winnerPlayerId}`);
}

// ---------- Start game countdown ----------
function startGameCountdown() {
  if (room.state !== ROOM_STATE.WAITING) {
    return;
  }

  syncLobbyPlayerIds();
  room.state = ROOM_STATE.COUNTDOWN;
  room.currentFrame = 0;
  room.winnerPlayerId = -1;
  room.countdownRemaining = START_DELAY;
  broadcastRoomState();
  console.log(`[Room] Game starting in ${room.countdownRemaining}s`);

  room.startCountdown = setInterval(() => {
    if (getConnectedPlayers().length < MIN_PLAYERS) {
      cancelCountdown();
      return;
    }

    room.countdownRemaining--;
    if (room.countdownRemaining > 0) {
      broadcastRoomState();
      console.log(`[Room] ${room.countdownRemaining}...`);
      return;
    }

    stopCountdown();
    startGame();
  }, 1000);
}

function startGame() {
  syncLobbyPlayerIds();
  room.currentFrame = 0;
  room.state = ROOM_STATE.RUNNING;
  room.bullets = {};
  room.winnerPlayerId = -1;
  room.spawnSlots = assignSpawnSlots(room.players.length);
  room.energies = [];
  room.nextEnergyId = 1;
  room.energySpawnCd = 0;
  room.energyEggs = [];
  room.nextEnergyEggId = 1;
  room.elapsedSeconds = 0;
  room.nextSpecialEventId = 1;
  room.specialEventSpawnCd = 0;
  room.activeSpecialEvents = [];
  room.pickups = [];
  room.nextPickupId = 1;
  room.energyWells = [];
  room.nextEnergyWellId = 1;
  room.tarPickups = [];
  room.nextTarPickupId = 1;
  room.tarPickupSpawnCd = 0;
  room.tarSpills = [];
  room.nextTarSpillId = 1;
  room.blackHolePickups = [];
  room.nextBlackHolePickupId = 1;
  room.blackHolePickupSpawnCd = 0;
  room.blackHoleZones = [];
  room.nextBlackHoleZoneId = 1;
  room.nextServerBulletId = 1;
  room.safeZone = createSafeZoneState(room.mapBounds);
  room.matchFlow = createMatchFlowState();
  room.waveState = {
    nextWaveIndex: 0,
    triggered: {},
  };
  room.waveAreaSlots = buildWaveAreaSlots();
  room.smallEnergyNextCheckTime = 0;
  room.smallEnergyHubSlotIds = getSmallEnergyHubSlotIds();
  initMatchEnergyEggPlan();

  room.players.forEach((p, index) => {
    p.pendingInputs = [];
    p.lastInputs = { up: false, down: false, left: false, right: false, aim: null };
    p.disconnected = false;
    p.dead = false;
    p.safeZoneDamageCd = SAFE_ZONE_DAMAGE_INTERVAL;
    resetPlayerRuntimeState(p);
    p.spawnSlot = room.spawnSlots[index];
    syncPlayerSpawnPosition(p);
  });
  room.bushes = buildInitialBushes();
  room.covers = buildInitialCovers();

  const initialFrameCommands = [];
  updateEnergySpawns(initialFrameCommands);
  updateConfiguredWaveSpawns(initialFrameCommands);

  broadcastRoomState({ spawnSlots: room.spawnSlots });
  room.players.forEach((p) => {
    if (!isSocketOpen(p)) {
      return;
    }
    p.send(JSON.stringify({
      type: 'gameStart',
      playerId: p.playerId,
      roomId: room.id,
      tickRate: TICK_RATE,
      playerCount: room.players.length,
      spawnSlots: room.spawnSlots,
      energies: room.energies,
      energyWells: room.energyWells,
      specialEvents: room.activeSpecialEvents.slice(),
      pickups: room.pickups.slice(),
      tarPickups: room.tarPickups,
      tarSpills: room.tarSpills,
      blackHolePickups: room.blackHolePickups,
      blackHoleZones: room.blackHoleZones,
      bushes: room.bushes,
      covers: room.covers,
      safeZone: room.safeZone,
      players: room.players.map((player) => ({
        playerId: player.playerId,
        tankType: player.tankType,
        playerLevel: player.playerLevel,
        hp: player.hp,
        maxHp: player.maxHp,
        atk: player.atk,
        moveSpeedScale: player.moveSpeedScale,
        energyLevel: player.energyLevel,
        energyExp: player.energyExp,
        energyNeedExp: player.energyNeedExp,
        tarAmmoCount: player.tarAmmoCount || 0,
        blackHoleAmmoCount: player.blackHoleAmmoCount || 0,
        activePickupType: getPlayerActivePickupType(player),
        freeBulletCount: clamp(Math.round(player.freeBulletCount || 0), 0, PLAYER_FREE_BULLET_MAX),
        stopFireTime: Math.max(0, player.stopFireTime || 0),
        freeBulletRecoverTime: Math.max(0, player.freeBulletRecoverTime || 0),
        shotCooldownRemaining: Math.max(0, player.shotCooldownRemaining || 0),
        dead: !!player.dead,
      })),
    }));
  });

  console.log(`[Room] Game started with ${room.players.length} players`);
  room.tickTimer = setInterval(tick, TICK_INTERVAL);
}

function removeWaitingPlayer(ws) {
  room.players = room.players.filter((p) => p !== ws);
  syncLobbyPlayerIds();
  broadcastRoomState();
  if (getConnectedPlayers().length < MIN_PLAYERS) {
    cancelCountdown();
  }
}

// ---------- WebSocket ----------
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('MiniTank Frame Sync Server v3');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log(`[Server] New connection (current state: ${room.state})`);

  ws.pendingInputs = [];
  ws.lastInputs = { up: false, down: false, left: false, right: false, aim: null };
  ws.disconnected = false;
  ws.dead = false;
  ws.playerId = -1;
  applyPlayerSetup(ws);
  ws.spawnSlot = -1;
  ws.posX = 0;
  ws.posY = 0;
  ws.dirX = PLAYER_DIR_FALLBACK.x;
  ws.dirY = PLAYER_DIR_FALLBACK.y;
  ws.lastSnapshot = null;
  ws.lastCoverActionSeq = 0;
  ws.lastEnergyEggActionSeq = 0;
  ws.safeZoneDamageCd = SAFE_ZONE_DAMAGE_INTERVAL;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      handleMessage(ws, msg);
    } catch (e) {
      console.warn('[Server] Invalid message:', e.message);
    }
  });

  ws.on('close', () => {
    console.log(`[Server] Player ${ws.playerId} disconnected`);
    ws.disconnected = true;

    if (handleTurnDisconnect(ws)) {
      maybeResetRoomWhenEmpty();
      return;
    }

    if (room.state === ROOM_STATE.WAITING || room.state === ROOM_STATE.COUNTDOWN) {
      removeWaitingPlayer(ws);
      maybeResetRoomWhenEmpty();
      return;
    }

    if (room.state === ROOM_STATE.RUNNING) {
      ws.dead = true;
      evaluateMatchEnd();
    }

    maybeResetRoomWhenEmpty();
  });

  if (room.state === ROOM_STATE.RUNNING || room.state === ROOM_STATE.ENDED) {
    ws.send(JSON.stringify({ type: 'error', message: 'Room is not joinable right now' }));
    // Keep the socket alive so a client can still opt into the independent turn-based room.
    return;
  }

  if (room.players.length >= MAX_PLAYERS) {
    ws.send(JSON.stringify({ type: 'error', message: 'Room full' }));
    // Turn-based matchmaking is separate from the legacy realtime room capacity.
    return;
  }

  room.players.push(ws);
  syncLobbyPlayerIds();

  ws.send(JSON.stringify({
    type: 'joined',
    roomId: room.id,
    playerId: ws.playerId,
    playerCount: getConnectedPlayers().length,
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,
    state: room.state,
  }));

  console.log(`[Room] Player ${ws.playerId} joined (${getConnectedPlayers().length}/${MAX_PLAYERS})`);
  broadcastRoomState();
  maybeStartCountdown();
});

function handleMessage(ws, msg) {
  switch (msg.type) {
    case 'joinTurnRoom': {
      handleJoinTurnRoom(ws);
      break;
    }
    case 'buildAction': {
      handleTurnBuildAction(ws, msg);
      break;
    }
    case 'refreshSlots': {
      handleTurnRefreshSlots(ws, msg);
      break;
    }
    case 'zoneAction': {
      handleTurnZoneAction(ws, msg);
      break;
    }
    case 'tankPose': {
      handleTurnTankPose(ws, msg);
      break;
    }
    case 'attackAction': {
      handleTurnAttackAction(ws, msg);
      break;
    }
    case 'bulletResult': {
      handleTurnBulletResult(ws, msg);
      break;
    }
    case 'upgradePick': {
      handleTurnUpgradePick(ws, msg);
      break;
    }
    case 'input': {
      if (room.state !== ROOM_STATE.RUNNING || ws.dead || ws.disconnected) {
        return;
      }
      ws.pendingInputs.push({
        frame: msg.frame || 0,
        inputs: msg.inputs || {},
      });
      while (ws.pendingInputs.length > MAX_PENDING_INPUTS) {
        ws.pendingInputs.shift();
      }
      break;
    }
    case 'playerSetup': {
      applyPlayerSetup(ws, msg.payload || {});
      if (Array.isArray(msg.payload && msg.payload.energySpawnPoints) && msg.payload.energySpawnPoints.length > 0) {
        room.energySpawnPoints = sanitizeSpawnPoints(msg.payload.energySpawnPoints);
      }
      if (Array.isArray(msg.payload && msg.payload.bushSpawnPoints) && msg.payload.bushSpawnPoints.length > 0) {
        room.bushSpawnPoints = sanitizeSpawnPoints(msg.payload.bushSpawnPoints);
      }
      if (Array.isArray(msg.payload && msg.payload.bushes) && msg.payload.bushes.length > 0) {
        room.bushes = sanitizeBushes(msg.payload.bushes);
      }
      if (Array.isArray(msg.payload && msg.payload.spawnCandidates) && msg.payload.spawnCandidates.length > 0) {
        room.spawnCandidates = sanitizeSpawnPoints(msg.payload.spawnCandidates);
      }
      const bounds = sanitizeMapBounds(msg.payload && msg.payload.mapBounds);
      if (bounds) {
        room.mapBounds = bounds;
      }
      const attackRadius = Number(msg.payload && msg.payload.baseAttackRadius);
      if (Number.isFinite(attackRadius) && attackRadius > 0) {
        ws.baseAttackRadius = attackRadius;
      }
      break;
    }
    case 'ping': {
      if (isSocketOpen(ws)) {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
      break;
    }
  }
}

function resetRoom() {
  stopTickLoop();
  stopCountdown();
  room.players = [];
  room.state = ROOM_STATE.WAITING;
  room.currentFrame = 0;
  room.bullets = {};
  room.winnerPlayerId = -1;
  room.spawnSlots = [];
  room.energies = [];
  room.nextEnergyId = 1;
  room.energySpawnCd = 0;
  room.energySpawnPoints = [];
  room.bushSpawnPoints = [];
  room.bushes = [];
  room.covers = [];
  room.nextCoverId = 1;
  room.spawnCandidates = [];
  room.mapBounds = {
    halfWidth: 1400,
    halfHeight: 900,
  };
  room.energyEggs = [];
  room.nextEnergyEggId = 1;
  room.elapsedSeconds = 0;
  room.energyEggMidgamePlan = 0;
  room.energyEggMidgameSpawned = 0;
  room.nextSpecialEventId = 1;
  room.specialEventSpawnCd = 0;
  room.activeSpecialEvents = [];
  room.pickups = [];
  room.nextPickupId = 1;
  room.energyWells = [];
  room.nextEnergyWellId = 1;
  room.tarPickups = [];
  room.nextTarPickupId = 1;
  room.tarPickupSpawnCd = 0;
  room.tarSpills = [];
  room.nextTarSpillId = 1;
  room.blackHolePickups = [];
  room.nextBlackHolePickupId = 1;
  room.blackHolePickupSpawnCd = 0;
  room.blackHoleZones = [];
  room.nextBlackHoleZoneId = 1;
  room.nextServerBulletId = 1;
  room.safeZone = createSafeZoneState(room.mapBounds);
  room.matchFlow = createMatchFlowState();
  room.waveState = {
    nextWaveIndex: 0,
    triggered: {},
  };
  room.waveAreaSlots = null;
  room.smallEnergyNextCheckTime = 0;
  room.smallEnergyHubSlotIds = [];
  console.log('[Room] Reset');
}

server.listen(PORT, () => {
  console.log('MiniTank Frame Sync Server v3');
  console.log(`Port: ${PORT}`);
  console.log(`Tick rate: ${TICK_RATE}Hz (${TICK_INTERVAL}ms)`);
  console.log(`Players: ${MIN_PLAYERS}-${MAX_PLAYERS}`);
  console.log(`Start delay: ${START_DELAY}s`);
});
