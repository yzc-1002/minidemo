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

function isSocketOpen(ws) {
  return ws && ws.readyState === WebSocket.OPEN;
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
    ws.close();
    return;
  }

  if (room.players.length >= MAX_PLAYERS) {
    ws.send(JSON.stringify({ type: 'error', message: 'Room full' }));
    ws.close();
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
