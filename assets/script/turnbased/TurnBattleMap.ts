import {
    buildTurnAttackBondSnapshot,
    buildTurnSettlementBondSnapshot,
    getTurnAssistZoneSpawnCount,
    getTurnAssistZoneTypeConfig,
    TurnAssistZoneType,
    TurnAttackBondSnapshot,
    TurnBondCountMap,
    TurnCamp,
    TurnDerivedUpgradeState,
    TurnGameConfig,
    TurnObstacleResourceType,
    TurnPhase,
    TurnResourceHpBonusByType,
    TurnUpgradeConfig,
    TurnSettlementBondSnapshot,
    TurnUpgradeEffectType,
    TurnUpgradeId,
    TURN_GAME_CONFIG,
} from "../config/TurnGame";
import { GameMap } from "../GameMap";
import { TurnStateSnapshot } from "./TurnStateMachine";

const { ccclass, property } = cc._decorator;

const TURN_POINT_ALIAS: { [name: string]: string } = {
    crystalA: "crystalA",
    baseA: "crystalA",
    aCrystal: "crystalA",
    crystalB: "crystalB",
    baseB: "crystalB",
    bCrystal: "crystalB",
    tankA: "tankA",
    playerA: "tankA",
    spawnA: "tankA",
    tankB: "tankB",
    playerB: "tankB",
    spawnB: "tankB",
};

const STATIC_OBSTACLE_NAME_RE = /qiang|mountain|tree|wall/i;
const KEY_LEFT_SET = [cc.macro.KEY.left, cc.macro.KEY.a];
const KEY_RIGHT_SET = [cc.macro.KEY.right, cc.macro.KEY.d];
const OBSTACLE_LAYOUT_LIBRARY: { [count: number]: cc.Vec2[][] } = {
    1: [
        [cc.v2(0, 0)],
    ],
    2: [
        [cc.v2(0, 0), cc.v2(1, 0)],
        [cc.v2(0, 0), cc.v2(0, 1)],
    ],
    3: [
        [cc.v2(0, 0), cc.v2(1, 0), cc.v2(2, 0)],
        [cc.v2(0, 0), cc.v2(0, 1), cc.v2(0, 2)],
        [cc.v2(0, 0), cc.v2(1, 0), cc.v2(0, 1)],
        [cc.v2(0, 0), cc.v2(-1, 0), cc.v2(0, 1)],
        [cc.v2(0, 0), cc.v2(1, 0), cc.v2(1, 1)],
        [cc.v2(0, 0), cc.v2(0, 1), cc.v2(1, 1)],
    ],
    4: [
        [cc.v2(0, 0), cc.v2(1, 0), cc.v2(2, 0), cc.v2(3, 0)],
        [cc.v2(0, 0), cc.v2(0, 1), cc.v2(0, 2), cc.v2(0, 3)],
        [cc.v2(0, 0), cc.v2(1, 0), cc.v2(0, 1), cc.v2(1, 1)],
        [cc.v2(0, 0), cc.v2(1, 0), cc.v2(2, 0), cc.v2(0, 1)],
        [cc.v2(0, 0), cc.v2(1, 0), cc.v2(2, 0), cc.v2(2, 1)],
        [cc.v2(0, 0), cc.v2(0, 1), cc.v2(0, 2), cc.v2(1, 2)],
        [cc.v2(0, 0), cc.v2(0, 1), cc.v2(0, 2), cc.v2(1, 0)],
        [cc.v2(0, 0), cc.v2(1, 0), cc.v2(2, 0), cc.v2(1, 1)],
        [cc.v2(0, 0), cc.v2(0, 1), cc.v2(0, 2), cc.v2(1, 1)],
        [cc.v2(0, 0), cc.v2(1, 0), cc.v2(1, 1), cc.v2(2, 1)],
        [cc.v2(0, 1), cc.v2(1, 1), cc.v2(1, 0), cc.v2(2, 0)],
        [cc.v2(0, 0), cc.v2(1, 0), cc.v2(1, 1), cc.v2(2, 0)],
        [cc.v2(0, 1), cc.v2(1, 1), cc.v2(1, 0), cc.v2(2, 1)],
    ],
};

interface TurnCrystalState {
    node: cc.Node;
    hp: number;
    maxHp: number;
    hpLabel: cc.Label;
    radius: number;
}

interface TurnTankState {
    root: cc.Node;
    body: cc.Node;
    turret: cc.Node;
    preview: cc.Node;
    aim: cc.Vec2;
    campLabel: cc.Label;
}

interface TurnObstacleState {
    id: string;
    camp: TurnCamp;
    originSlotId: string;
    slotType: TurnObstacleResourceType;
    node: cc.Node;
    radius: number;
    width: number;
    height: number;
    hp: number;
    maxHp: number;
    resourceCount: number;
    layout: cc.Vec2[];
    cellHp: number[];
    shapeKey: string;
    mirrorDir: "";
    placedByCamp: TurnCamp;
}

interface TurnBuildPreviewState {
    camp: TurnCamp;
    slotId: string;
    slotType: TurnObstacleResourceType;
    node: cc.Node;
    tile: cc.Vec2;
    snappedPosition: cc.Vec2;
    valid: boolean;
}

interface TurnObstacleSlotState {
    slotId: string;
    type: TurnObstacleResourceType;
    name: string;
    count: number;
    layout: cc.Vec2[];
    shapeKey: string;
    mirrorDir: "";
    placed: boolean;
    placedObstacleId: string;
}

interface TurnStaticObstacleState {
    id: number;
    name: string;
    rect: cc.Rect;
}

interface TurnBulletState {
    node: cc.Node;
    camp: TurnCamp;
    dir: cc.Vec2;
    damage: number;
    remainingDamage: number;
    baseDamage: number;
    damageMultiplier: number;
    damageBoostLevel: number;
    speed: number;
    radius: number;
    lifeLeft: number;
    bounceLeft: number;
    hasBounced: boolean;
    hasTriggeredSpread: boolean;
    currentSpreadZoneIds: string[];
    currentDamageBoostZoneIds: string[];
    damageBoostAppliedZoneIds: string[];
    spreadTriggeredZoneIds: string[];
    firstBounceDamageBoostApplied: boolean;
    firstBounceDamageMultiplier: number;
    spreadExtraSplit: number;
    damageBoostTempAttack: number;
    blackHoleStrengthMultiplier: number;
}

interface TurnAssistZoneState {
    id: string;
    type: TurnAssistZoneType;
    node: cc.Node;
    radius: number;
    position: cc.Vec2;
    extra?: any;
}

interface TurnCampStats {
    exp: number;
    expNeed: number;
    level: number;
    damageBonus: number;
    extraShots: number;
    bulletBounce: number;
    energyTowers: number;
    roundResourceBonus: number;
    upgradeStacks: { [id: string]: number };
    derivedUpgrades: TurnDerivedUpgradeState;
    coins: number;
    placedThisRound: boolean;
    slotCost: number;
    refreshCost: number;
    canRefresh: boolean;
}

type TurnAttackSnapshotState = TurnAttackBondSnapshot;

@ccclass
export default class TurnBattleMap extends cc.Component {
    @property(cc.Node)
    contentRoot: cc.Node = null;

    @property(cc.Prefab)
    tiledMapPrefab: cc.Prefab = null;

    onStatsChanged: () => void = null;
    onAttackFired: () => void = null;
    onBulletsCleared: () => void = null;
    onGameFinished: (winnerCamp: TurnCamp) => void = null;
    onBuildIntent: (action: { op: string; obstacleId?: string; slotId?: string; slotType?: TurnObstacleResourceType; x: number; y: number; }) => void = null;
    onAttackIntent: (action: { fromX: number; fromY: number; aimX: number; aimY: number; shotIndex: number; }) => void = null;
    onTankPoseIntent: (action: { x: number; y: number; aimX: number; aimY: number; }) => void = null;

    private _config: TurnGameConfig = TURN_GAME_CONFIG;
    private _crystals: { [camp: string]: TurnCrystalState } = {};
    private _tanks: { [camp: string]: TurnTankState } = {};
    private _obstacleInventory: { [camp: string]: TurnObstacleSlotState[] } = { A: null, B: null };
    private _obstacles: TurnObstacleState[] = [];
    private _staticObstacleSeeds: TurnStaticObstacleState[] = [];
    private _staticObstacles: TurnStaticObstacleState[] = [];
    private _bullets: TurnBulletState[] = [];
    private _assistZones: TurnAssistZoneState[] = [];
    private _campStats: { [camp: string]: TurnCampStats } = null;
    private _phase: TurnPhase = "init";
    private _roundIndex = 1;
    private _actionCamp: TurnCamp = "A";
    private _hasFiredInAction = false;
    private _shotsLeftInAction = 0;
    private _attackSnapshot: TurnAttackSnapshotState = null;
    private _settlementSnapshots: { [camp: string]: TurnSettlementBondSnapshot } = { A: null, B: null };
    private _dragObstacle: TurnObstacleState = null;
    private _dragStartPosition: cc.Vec2 = null;
    private _palettePreview: TurnBuildPreviewState = null;
    private _nextObstacleId = 1;
    private _nextStaticObstacleId = 1;
    private _nextAssistZoneId = 1;
    private _gameFinished = false;
    private _serverMode = false;
    private _pendingBulletResult = {
        hitType: "",
        targetCamp: "",
        targetId: "",
        damage: 0,
        obstacleHits: [] as { obstacleId: string; cellIndex: number; damage: number }[],
        destroyedIds: [] as string[],
        destroyedCells: [] as { obstacleId: string; cellIndex: number }[],
        expGain: 0,
    };

    private _mapNode: cc.Node = null;
    private _tiledMap: cc.TiledMap = null;
    private _mapPixelSize: cc.Size = cc.size(TURN_GAME_CONFIG.mapWidth, TURN_GAME_CONFIG.mapHeight);
    private _tileSize: cc.Size = cc.size(1, 1);
    private _mapTileSize: cc.Size = cc.size(1, 1);

    private _staticObstacleLayer: cc.Node = null;
    private _obstacleLayer: cc.Node = null;
    private _bulletLayer: cc.Node = null;
    private _zoneLayer: cc.Node = null;
    private _effectLayer: cc.Node = null;
    private _buildOverlayLayer: cc.Node = null;
    private _buildHighlightLayer: cc.Node = null;
    private _buildPreviewLayer: cc.Node = null;

    private _roads: { [camp: string]: cc.Rect } = { A: null, B: null };
    private _buildAreas: { [camp: string]: cc.Rect } = { A: null, B: null };
    private _assistArea: cc.Rect = null;
    private _noBuildAreas: cc.Rect[] = [];
    private _spawnPoints: { [name: string]: cc.Vec2 } = {};
    private _pointSource = "fallback";
    private _roadSource = "fallback";
    private _buildSource = "fallback";
    private _moveLeftPressed = false;
    private _moveRightPressed = false;
    private _pointerAim: cc.Vec2 = null;
    private _attackTouchActive = false;
    private _lastSentTankPoseAt = 0;
    private _localCamp: TurnCamp = "A";
    private _selectedBuildSlotType: TurnObstacleResourceType = "normal";

    private readonly _dynamicObstacleSize = cc.size(32, 32);

    onEnable() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDisable() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        this._moveLeftPressed = false;
        this._moveRightPressed = false;
    }

    initMap(config?: TurnGameConfig) {
        this._config = config || TURN_GAME_CONFIG;
        this.node.removeAllChildren();
        this.contentRoot = this.node;
        this.node.setContentSize(this._config.mapWidth, this._config.mapHeight);

        this._crystals = {};
        this._tanks = {};
        this._obstacles = [];
        this._staticObstacleSeeds = [];
        this._staticObstacles = [];
        this._bullets = [];
        this._assistZones = [];
        this._roads = { A: null, B: null };
        this._buildAreas = { A: null, B: null };
        this._assistArea = null;
        this._noBuildAreas = [];
        this._spawnPoints = {};
        this._pointSource = "fallback";
        this._roadSource = "fallback";
        this._buildSource = "fallback";
        this._campStats = {
            A: this.createCampStats(),
            B: this.createCampStats(),
        };
        this._phase = "init";
        this._actionCamp = "A";
        this._hasFiredInAction = false;
        this._shotsLeftInAction = 0;
        this._attackSnapshot = null;
        this._dragObstacle = null;
        this._dragStartPosition = null;
        this._palettePreview = null;
        this._settlementSnapshots = { A: null, B: null };
        this._nextObstacleId = 1;
        this._nextStaticObstacleId = 1;
        this._nextAssistZoneId = 1;
        this._pointerAim = null;
        this._attackTouchActive = false;
        this._lastSentTankPoseAt = 0;
        this._gameFinished = false;
        this._pendingBulletResult = {
            hitType: "",
            targetCamp: "",
            targetId: "",
            damage: 0,
            obstacleHits: [],
            destroyedIds: [],
            destroyedCells: [],
            expGain: 0,
        };
        this._mapNode = null;
        this._tiledMap = null;
        this._mapPixelSize = cc.size(this._config.mapWidth, this._config.mapHeight);
        this._tileSize = cc.size(1, 1);
        this._mapTileSize = cc.size(1, 1);
        this._staticObstacleLayer = null;
        this._obstacleLayer = null;
        this._bulletLayer = null;
        this._zoneLayer = null;
        this._effectLayer = null;
        this._buildOverlayLayer = null;
        this._buildHighlightLayer = null;
        this._buildPreviewLayer = null;
        this._moveLeftPressed = false;
        this._moveRightPressed = false;
        this._pointerAim = null;
        this._attackTouchActive = false;
        this._lastSentTankPoseAt = 0;
        this._obstacleInventory = {
            A: [],
            B: [],
        };

        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);

        if (!this.initTiledMap()) {
            this.initDebugFallback();
        }

        this.createCampView("A");
        this.createCampView("B");
        this.refreshBuildInteractionView();
    }

    update(dt: number) {
        this.updateKeyboardTankMove(dt);
        this.updateBullets(dt);
    }

    setServerMode(enabled: boolean) {
        this._serverMode = !!enabled;
        this.refreshBuildInteractionView();
    }

    setLocalCamp(camp: TurnCamp) {
        this._localCamp = camp || "A";
        this.refreshBuildInteractionView();
    }

    refreshForNewRound(roundIndex: number) {
        this._roundIndex = Math.max(1, Math.floor(Number(roundIndex) || 1));
        this.generateRoundState("A", roundIndex);
        this.generateRoundState("B", roundIndex);
        this.refreshBuildInteractionView();
    }

    setTurnSnapshot(snapshot: TurnStateSnapshot) {
        let previousPhase = this._phase;
        this._phase = snapshot.phase;
        this._roundIndex = Math.max(1, Math.floor(Number(snapshot.roundIndex) || this._roundIndex || 1));
        this.setActionCamp(snapshot.actionCamp);
        this.handlePhaseChanged(previousPhase, snapshot.phase);
        this.refreshBuildInteractionView();

        if (snapshot.phase === "attack") {
            this._hasFiredInAction = false;
            this._attackSnapshot = this._serverMode ? null : this.buildAttackSnapshotForCamp(this._actionCamp);
            this._shotsLeftInAction = this._attackSnapshot ? this._attackSnapshot.totalShots : (this._serverMode ? 1 : 0);
            if (this._serverMode && this._actionCamp === "A") {
                this.resetPendingBulletResult();
            }
        }
        else if (snapshot.phase === "settle" && !this._serverMode) {
            this._settlementSnapshots = {
                A: this.buildSettlementSnapshotForCamp("A"),
                B: this.buildSettlementSnapshotForCamp("B"),
            };
        }
        else if (snapshot.phase === "waitBullet" && !this.hasActiveBullets()) {
            this.scheduleOnce(this.emitBulletsCleared, 0);
        }
        else {
            this._attackSnapshot = null;
            this._shotsLeftInAction = 0;
            if (snapshot.phase !== "settle") {
                this._settlementSnapshots = { A: null, B: null };
            }
        }
    }

    applyServerState(snapshot: any) {
        if (!snapshot) {
            return;
        }

        let expA = snapshot.exp && snapshot.exp.A ? snapshot.exp.A : {};
        let expB = snapshot.exp && snapshot.exp.B ? snapshot.exp.B : {};
        let inventoriesA = snapshot.inventories && snapshot.inventories.A ? snapshot.inventories.A : {};
        let inventoriesB = snapshot.inventories && snapshot.inventories.B ? snapshot.inventories.B : {};
        let upgradesA = snapshot.upgrades && snapshot.upgrades.A ? snapshot.upgrades.A : {};
        let upgradesB = snapshot.upgrades && snapshot.upgrades.B ? snapshot.upgrades.B : {};
        let statsA = this.getCampStats("A");
        let statsB = this.getCampStats("B");

        this.applyObstacleInventorySnapshot("A", inventoriesA);
        this.applyObstacleInventorySnapshot("B", inventoriesB);

        let economy = snapshot.economy || {};
        let economyA = economy.A || {};
        let economyB = economy.B || {};
        statsA.coins = Math.max(0, Math.floor(Number(economyA.coins) || 0));
        statsB.coins = Math.max(0, Math.floor(Number(economyB.coins) || 0));
        statsA.placedThisRound = !!economyA.placedThisRound;
        statsB.placedThisRound = !!economyB.placedThisRound;
        statsA.slotCost = Math.max(0, Math.floor(Number(economyA.slotCost) || 0));
        statsB.slotCost = Math.max(0, Math.floor(Number(economyB.slotCost) || 0));
        statsA.refreshCost = Math.max(0, Math.floor(Number(economyA.refreshCost) || 0));
        statsB.refreshCost = Math.max(0, Math.floor(Number(economyB.refreshCost) || 0));
        statsA.canRefresh = !!economyA.canRefresh;
        statsB.canRefresh = !!economyB.canRefresh;

        statsA.exp = Math.max(0, Number(expA.exp) || 0);
        statsB.exp = Math.max(0, Number(expB.exp) || 0);
        statsA.expNeed = Math.max(1, Number(expA.expNeed) || this._config.levelUpExp);
        statsB.expNeed = Math.max(1, Number(expB.expNeed) || this._config.levelUpExp);
        statsA.level = Math.max(1, Number(expA.level) || 1);
        statsB.level = Math.max(1, Number(expB.level) || 1);
        statsA.damageBonus = Math.max(0, Number(upgradesA.damageAdd) || 0);
        statsB.damageBonus = Math.max(0, Number(upgradesB.damageAdd) || 0);
        statsA.extraShots = Math.max(0, Number(upgradesA.multiShot) || 0);
        statsB.extraShots = Math.max(0, Number(upgradesB.multiShot) || 0);
        statsA.upgradeStacks = upgradesA.stacks || {};
        statsB.upgradeStacks = upgradesB.stacks || {};
        statsA.derivedUpgrades = upgradesA.derived || this.buildDerivedUpgradeState(statsA.upgradeStacks);
        statsB.derivedUpgrades = upgradesB.derived || this.buildDerivedUpgradeState(statsB.upgradeStacks);
        statsA.bulletBounce = upgradesA.bulletBounce != null ? Math.max(0, Number(upgradesA.bulletBounce) || 0) : statsA.derivedUpgrades.bulletBounceBonus;
        statsB.bulletBounce = upgradesB.bulletBounce != null ? Math.max(0, Number(upgradesB.bulletBounce) || 0) : statsB.derivedUpgrades.bulletBounceBonus;
        statsA.roundResourceBonus = upgradesA.roundResourceBonus != null ? Math.max(0, Number(upgradesA.roundResourceBonus) || 0) : statsA.derivedUpgrades.roundResourceBonus;
        statsB.roundResourceBonus = upgradesB.roundResourceBonus != null ? Math.max(0, Number(upgradesB.roundResourceBonus) || 0) : statsB.derivedUpgrades.roundResourceBonus;
        statsA.energyTowers = this.countPlacedEnergyTowers("A");
        statsB.energyTowers = this.countPlacedEnergyTowers("B");
        if (snapshot.attackSnapshots) {
            let attackSnapshot = snapshot.attackSnapshots[this._actionCamp || "A"];
            if (snapshot.phase === "attack" && attackSnapshot) {
                this._attackSnapshot = this.buildAttackSnapshotFromServer(attackSnapshot);
                this._shotsLeftInAction = Math.max(0, Number(attackSnapshot.shotsLeft) || this._attackSnapshot.totalShots);
            }
        }
        if (snapshot.settlementSnapshots) {
            this._settlementSnapshots = {
                A: this.buildSettlementSnapshotFromServer(snapshot.settlementSnapshots.A),
                B: this.buildSettlementSnapshotFromServer(snapshot.settlementSnapshots.B),
            };
        }

        this.syncCrystalState("A", snapshot.crystals && snapshot.crystals.A);
        this.syncCrystalState("B", snapshot.crystals && snapshot.crystals.B);
        if (Array.isArray(snapshot.staticObstacles)) {
            this.applyServerStaticObstacleState(snapshot.staticObstacles);
        }
        this.syncObstacleState(snapshot.obstacles || []);
        this.syncAssistZoneState(snapshot.zones || []);
        this.syncTankPoseState(snapshot.tankPoses || {});
        this.emitStatsChanged();
    }

    applyServerAttackAction(payload: any) {
        if (!payload || !payload.action) {
            return;
        }

        let camp = (payload.camp || this._actionCamp || "A") as TurnCamp;
        let action = payload.action;
        let tankState = this._tanks[camp];
        if (!tankState) {
            return;
        }

        let fromX = Number(action.fromX);
        let fromY = Number(action.fromY);
        if (Number.isFinite(fromX)) {
            tankState.root.x = fromX;
        }
        if (Number.isFinite(fromY)) {
            tankState.root.y = fromY;
        }

        let startPosition = this.getNodePosition(tankState.root);
        let target = cc.v2(Number(action.aimX) || startPosition.x, Number(action.aimY) || startPosition.y);
        let dir = this.clampAimDirection(camp, startPosition, target);
        this.applyTankAim(camp, startPosition.add(dir.mul(120)), false);
        this.createBullet(camp, startPosition.add(dir.normalize().mul(44)), dir.normalize(), this.buildAttackSnapshotFromServer(action));
    }

    applyServerBulletResult(payload: any) {
        let result = payload && payload.result;
        let missileEvents = result && Array.isArray(result.missileEvents) ? result.missileEvents : [];
        for (let i = 0; i < missileEvents.length; i++) {
            this.playMissileSiloEvent(missileEvents[i]);
        }
    }

    consumePendingBulletResult() {
        let result = {
            hitType: this._pendingBulletResult.hitType,
            targetCamp: this._pendingBulletResult.targetCamp,
            targetId: this._pendingBulletResult.targetId,
            damage: this._pendingBulletResult.damage,
            obstacleHits: this._pendingBulletResult.obstacleHits.slice(),
            destroyedIds: this._pendingBulletResult.destroyedIds.slice(),
            destroyedCells: this._pendingBulletResult.destroyedCells.slice(),
            expGain: this._pendingBulletResult.expGain,
        };
        this.resetPendingBulletResult();
        return result;
    }

    setActionCamp(camp: TurnCamp) {
        this._actionCamp = camp || "A";
        this.updateTankState("A", this._phase === "attack" && this._actionCamp === "A");
        this.updateTankState("B", this._phase === "attack" && this._actionCamp === "B");
    }

    getTankPose(camp: TurnCamp): { x: number; y: number; aimX: number; aimY: number } | null {
        let tankState = this._tanks[camp];
        if (!tankState || !tankState.root) {
            return null;
        }
        let pos = this.getNodePosition(tankState.root);
        let aim = tankState.aim ? tankState.aim : cc.v2(pos.x, pos.y);
        return { x: pos.x, y: pos.y, aimX: aim.x, aimY: aim.y };
    }

    applyServerTankPose(payload: any) {
        if (!payload || !payload.pose) {
            return;
        }
        let camp = (payload.camp || this._actionCamp || "A") as TurnCamp;
        let tankState = this._tanks[camp];
        if (!tankState) {
            return;
        }
        let pose = payload.pose;
        if (Number.isFinite(Number(pose.x))) {
            tankState.root.x = Number(pose.x);
        }
        if (Number.isFinite(Number(pose.y))) {
            tankState.root.y = Number(pose.y);
        }
        if (Number.isFinite(Number(pose.aimX)) && Number.isFinite(Number(pose.aimY))) {
            this.applyTankAim(camp, cc.v2(Number(pose.aimX), Number(pose.aimY)), false);
        }
    }

    hasActiveBullets(): boolean {
        return this._bullets.length > 0;
    }

    getObstacleInventory(camp: TurnCamp): number {
        return this.getRoundResourceTotal(camp);
    }

    getRoundResourceTotal(camp: TurnCamp): number {
        let slots = this._obstacleInventory[camp] || [];
        let total = 0;
        for (let i = 0; i < slots.length; i++) {
            total += Math.max(0, Number(slots[i].count) || 0);
        }
        return total;
    }

    getObstacleSlotTotal(camp: TurnCamp): number {
        return this.getRoundResourceTotal(camp);
    }

    getObstacleSlotStates(camp: TurnCamp): TurnObstacleSlotState[] {
        return (this._obstacleInventory[camp] || []).slice();
    }

    getObstacleSlotHpPreview(slotType: TurnObstacleResourceType, count: number): string {
        let safeCount = Math.max(1, Math.floor(Number(count) || 1));
        if (slotType === "normal") {
            let maxHp = this.getObstacleMaxHp(slotType, safeCount);
            let perCell = this.getObstacleCellMaxHp(slotType);
            return "(" + perCell + "HP/格)";
        }
        if (slotType === "exp") {
            let maxHp = this.getObstacleMaxHp(slotType, safeCount);
            let settlement = buildTurnSettlementBondSnapshot({ exp: safeCount }, null, this._config);
            return "结算+" + settlement.expGain + "EXP x" + settlement.expMultiplier;
        }
        if (slotType === "energy") {
            let maxHp = this.getObstacleMaxHp(slotType, safeCount);
            let settlement = buildTurnSettlementBondSnapshot({ energy: safeCount }, null, this._config);
            return "结算+" + settlement.totalHeal + "HP x" + settlement.energyMultiplier;
        }
        if (slotType === "bleed") {
            let maxHp = this.getObstacleMaxHp(slotType, safeCount);
            let settlement = buildTurnSettlementBondSnapshot({ bleed: safeCount }, null, this._config);
            return "禁疗" + settlement.blockedHeal + " x" + settlement.bleedMultiplier;
        }
        if (slotType === "mirror") {
            let maxHp = this.getObstacleCellMaxHp(slotType);
            return "命中反弹并销毁";
        }
        if (slotType === "bullet") {
            let maxHp = this.getObstacleMaxHp(slotType, safeCount);
            let attack = buildTurnAttackBondSnapshot({ bullet: safeCount }, null, this._config);
            let extraShots = attack.extraShotsFromBulletBlock;
            return "额外+" + extraShots + "发";
        }
        if (slotType === "attack") {
            let maxHp = this.getObstacleMaxHp(slotType, safeCount);
            let attack = buildTurnAttackBondSnapshot({ attack: safeCount }, null, this._config);
            return "伤害+" + attack.bonusDamageFromAttackBlock + " x" + attack.attackMultiplier;
        }
        if (slotType === "missile_silo") {
            let maxHp = this.getObstacleMaxHp(slotType, safeCount);
            let rule = this._config.missileSilo;
            let damage = Math.max(1, Math.floor(Number(rule && rule.directDamage) || 10));
            let radiusCells = Math.max(0, Math.floor(Number(rule && rule.explosionRadiusCells) || 1));
            let mainCannonChance = Math.max(0, Math.min(1, Number(rule && rule.mainCannonChance) || 0));
            return "导弹" + damage + " 范围" + radiusCells + "格 主炮" + Math.round(mainCannonChance * 100) + "%";
        }
        if (slotType === "coin") {
            let maxHp = this.getObstacleMaxHp(slotType, safeCount);
            let economy = this._config.coinEconomy || {} as any;
            let perBlock = Math.max(0, Math.floor(Number(economy.perCoinBlockSettlement) || 0));
            return "结算+" + (safeCount * perBlock) + "金币/格";
        }
        return "";
    }

    getCrystalHp(camp: TurnCamp): number {
        let crystal = this._crystals[camp];
        return crystal ? crystal.hp : this._config.crystalHp;
    }

    getCampExp(camp: TurnCamp): number {
        return this.getCampStats(camp).exp;
    }

    getCampLevel(camp: TurnCamp): number {
        return this.getCampStats(camp).level;
    }

    getCampExpNeed(camp: TurnCamp): number {
        return this.getCampStats(camp).expNeed;
    }

    getCampCoins(camp: TurnCamp): number {
        return this.getCampStats(camp).coins;
    }

    getCampSlotCost(camp: TurnCamp): number {
        return this.getCampStats(camp).slotCost;
    }

    getCampRefreshCost(camp: TurnCamp): number {
        return this.getCampStats(camp).refreshCost;
    }

    getCampCanRefresh(camp: TurnCamp): boolean {
        let stats = this.getCampStats(camp);
        return !!stats.canRefresh && stats.coins >= stats.refreshCost;
    }

    getCampPlacedThisRound(camp: TurnCamp): boolean {
        return this.getCampStats(camp).placedThisRound;
    }

    getActiveAssistZoneCount(): number {
        return this._assistZones.length;
    }

    getBondHudText(camp: TurnCamp): string {
        let attack = this._attackSnapshot && this._actionCamp === camp ? this._attackSnapshot : this.buildAttackSnapshotForCamp(camp);
        let settlement = this._settlementSnapshots[camp] || this.buildSettlementSnapshotForCamp(camp);
        return [
            camp + " 攻击: 子弹" + attack.extraShotsFromBulletBlock + " 攻击+" + attack.bonusDamageFromAttackBlock,
            "结算: EXP+" + settlement.expGain + " 回血" + settlement.finalHeal + " 禁疗" + settlement.blockedHeal,
        ].join("  |  ");
    }

    getAssistAreaBottomLeft(): cc.Vec2 {
        if (!this._assistArea) {
            return cc.v2(0, 0);
        }
        return cc.v2(this._assistArea.x, this._assistArea.y);
    }

    screenToMapPosition(screenPos: cc.Vec2): cc.Vec2 {
        let root = this.contentRoot || this.node;
        return root.convertToNodeSpaceAR(screenPos);
    }

    isBuildPhaseActiveForCamp(camp: TurnCamp): boolean {
        return this._phase === "build" && this.canControlCamp(camp);
    }

    grantRoundBaseExp() {
        this.addExp("A", this._config.baseExpPerRound, cc.v2(-160, 0));
        this.addExp("B", this._config.baseExpPerRound, cc.v2(160, 0));
    }

    settleRound() {
        this.grantRoundBaseExp();
        this.applyRoundSettlementForCamp("A");
        this.applyRoundSettlementForCamp("B");
        this.emitStatsChanged();
    }

    canCampUpgrade(camp: TurnCamp): boolean {
        let stats = this.getCampStats(camp);
        return stats.exp >= stats.expNeed && this.getUpgradeOptions(camp).length > 0;
    }

    getUpgradeOptions(camp: TurnCamp): TurnUpgradeConfig[] {
        let stats = this.getCampStats(camp);
        let pool: TurnUpgradeConfig[] = [];
        for (let i = 0; i < this._config.upgradePool.length; i++) {
            let option = this._config.upgradePool[i];
            let stacks = Math.max(0, Number(stats.upgradeStacks[option.id]) || 0);
            if (option.maxStacks != null && stacks >= option.maxStacks) {
                continue;
            }
            pool.push(Object.assign({}, option, { currentStacks: stacks }));
        }

        let options: TurnUpgradeConfig[] = [];
        let shuffled = pool.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            let swapIndex = Math.floor(Math.random() * (i + 1));
            let temp = shuffled[i];
            shuffled[i] = shuffled[swapIndex];
            shuffled[swapIndex] = temp;
        }
        for (let i = 0; i < shuffled.length && options.length < 3; i++) {
            options.push(shuffled[i]);
        }
        return options;
    }

    applyUpgrade(camp: TurnCamp, upgradeId: TurnUpgradeId) {
        let stats = this.getCampStats(camp);
        if (stats.exp < stats.expNeed) {
            return;
        }
        let option = this.getUpgradeConfig(upgradeId);
        if (!option) {
            return;
        }
        let previousStacks = Object.assign({}, stats.upgradeStacks);

        stats.exp -= stats.expNeed;
        stats.expNeed += 20;
        stats.level += 1;
        stats.upgradeStacks[upgradeId] = Math.max(0, Number(stats.upgradeStacks[upgradeId]) || 0) + 1;
        this.refreshDerivedUpgradeState(camp);
        if (option.effect && option.effect.type === "resource_hp") {
            this.refreshCampResourceHpByUpgrade(camp, option.effect.targetResourceType, previousStacks);
        }

        this.showFloatText("阵营 " + camp + " 升级", cc.v2(camp === "A" ? -150 : 150, 0), cc.Color.YELLOW);
        this.emitStatsChanged();
    }

    getMapRect(): cc.Rect {
        return cc.rect(
            -this._mapPixelSize.width / 2,
            -this._mapPixelSize.height / 2,
            this._mapPixelSize.width,
            this._mapPixelSize.height,
        );
    }

    isBuildPositionValid(camp: TurnCamp, position: cc.Vec2, ignoreObstacleId?: string, slotId?: string, slotType: TurnObstacleResourceType = "normal"): boolean {
        let buildArea = this.getBuildArea(camp);
        let slot = slotId ? this.getObstacleSlotState(camp, slotId) : null;
        let obstacleRects = this.getDynamicObstacleRectsAt(position, slot ? slot.layout : null, slotType);
        if (!buildArea || obstacleRects.length <= 0) {
            return false;
        }
        for (let r = 0; r < obstacleRects.length; r++) {
            let obstacleRect = obstacleRects[r];
            if (!this.rectContainsRect(buildArea, obstacleRect) || !this.rectContainsRect(this.getMapRect(), obstacleRect)) {
                return false;
            }

            let roadA = this.getRoadRect("A");
            let roadB = this.getRoadRect("B");
            if ((roadA && this.rectOverlaps(roadA, obstacleRect)) || (roadB && this.rectOverlaps(roadB, obstacleRect))) {
                return false;
            }

            for (let i = 0; i < this._noBuildAreas.length; i++) {
                if (this.rectOverlaps(this._noBuildAreas[i], obstacleRect)) {
                    return false;
                }
            }

            for (let j = 0; j < this._staticObstacles.length; j++) {
                if (this.rectOverlaps(this._staticObstacles[j].rect, obstacleRect)) {
                    return false;
                }
            }

            for (let zoneIndex = 0; zoneIndex < this._assistZones.length; zoneIndex++) {
                let zone = this._assistZones[zoneIndex];
                if (this.circleRectIntersects(this.getNodePosition(zone.node), zone.radius, obstacleRect)) {
                    return false;
                }
            }

            let crystalA = this._crystals.A;
            let crystalB = this._crystals.B;
            if ((crystalA && this.circleRectIntersects(this.getNodePosition(crystalA.node), crystalA.radius, obstacleRect))
                || (crystalB && this.circleRectIntersects(this.getNodePosition(crystalB.node), crystalB.radius, obstacleRect))) {
                return false;
            }

            for (let k = 0; k < this._obstacles.length; k++) {
                let obstacle = this._obstacles[k];
                if (obstacle.id === ignoreObstacleId) {
                    continue;
                }
                if (this.rectsOverlapAny(this.getDynamicObstacleRects(obstacle), obstacleRect)) {
                    return false;
                }
            }
        }
        return true;
    }

    beginPaletteBuildDrag(camp: TurnCamp, position: cc.Vec2, slotId?: string): boolean {
        let slot = slotId ? this.getObstacleSlotState(camp, slotId) : this.getFirstAvailableObstacleSlot(camp);
        this._selectedBuildSlotType = slot ? slot.type : this._selectedBuildSlotType || "normal";
        if (!this.isBuildPhaseActiveForCamp(camp) || !slot || !this.canPlaceFromSlot(slot)) {
            return false;
        }
        this.cancelPaletteBuildDrag(camp);
        this.ensureBuildOverlayLayers();
        this._palettePreview = {
            camp: camp,
            slotId: slot.slotId,
            slotType: slot.type,
            node: this.createBuildPreviewNode(camp, slot.type),
            tile: null,
            snappedPosition: cc.v2(position),
            valid: false,
        };
        this._palettePreview.node.parent = this._buildPreviewLayer || this._effectLayer || this.contentRoot;
        this.updatePaletteBuildDrag(camp, position);
        this.refreshBuildInteractionView();
        return true;
    }

    updatePaletteBuildDrag(camp: TurnCamp, position: cc.Vec2, slotId?: string) {
        if (!this._palettePreview || this._palettePreview.camp !== camp) {
            return;
        }
        if (slotId) {
            let slot = this.getObstacleSlotState(camp, slotId);
            if (slot) {
                this._palettePreview.slotId = slot.slotId;
                this._palettePreview.slotType = slot.type;
                this._selectedBuildSlotType = slot.type;
            }
        }

        let snappedPosition = this.snapBuildPosition(position);
        let tile = this.worldToTile(snappedPosition);
        let valid = !!tile && this.isBuildPositionValid(camp, snappedPosition, undefined, this._palettePreview.slotId, this._palettePreview.slotType);
        this._palettePreview.tile = tile;
        this._palettePreview.snappedPosition = snappedPosition;
        this._palettePreview.valid = valid;
        this._palettePreview.node.setPosition(snappedPosition.x, snappedPosition.y);
        this._palettePreview.node.opacity = valid ? 228 : 168;
        this.updatePreviewNodeView(this._palettePreview.node, camp, valid, this._palettePreview.slotType, this._palettePreview.slotId);
        this.refreshBuildInteractionView();
    }

    finishPaletteBuildDrag(camp: TurnCamp, position: cc.Vec2, slotId?: string) {
        let finalSlotId = slotId || (this._palettePreview ? this._palettePreview.slotId : this.getFirstAvailableObstacleSlotId(camp));
        this.cancelPaletteBuildDrag(camp);
        this.placeBuildObstacleAt(camp, position, finalSlotId);
    }

    private placeBuildObstacleAt(camp: TurnCamp, position: cc.Vec2, slotId?: string) {
        if (!camp || !this.canControlCamp(camp)) {
            this.showFloatText("只能放在可操作阵营建造区", position, cc.Color.RED);
            return;
        }
        let slot = slotId ? this.getObstacleSlotState(camp, slotId) : this.getFirstAvailableObstacleSlot(camp);
        if (!slot || slot.count <= 0) {
            this.showFloatText("掩体库存不足", position, cc.Color.RED);
            return;
        }
        if (!this.canPlaceFromSlot(slot)) {
            this.showFloatText("该资源已放置", position, cc.Color.RED);
            return;
        }
        let targetCamp = this.getBuildCampAt(position);
        if (targetCamp !== camp) {
            this.showFloatText("只能放在可操作阵营建造区", position, cc.Color.RED);
            return;
        }
        let snappedPosition = this.snapBuildPosition(position);
        if (!this.isBuildPositionValid(camp, snappedPosition, undefined, slot.slotId, slot.type)) {
            this.showFloatText("位置不可用", position, cc.Color.RED);
            return;
        }

        if (this._serverMode) {
            if (this.onBuildIntent) {
                this.onBuildIntent({
                    op: "place",
                    slotId: slot.slotId,
                    slotType: slot.type,
                    x: snappedPosition.x,
                    y: snappedPosition.y,
                });
            }
            return;
        }

        this.createBuildObstacle(camp, snappedPosition, undefined, slot.slotId, slot.type);
        this.emitStatsChanged();
        this.refreshBuildInteractionView();
    }

    cancelPaletteBuildDrag(camp?: TurnCamp) {
        if (!this._palettePreview) {
            this.refreshBuildInteractionView();
            return;
        }
        if (camp && this._palettePreview.camp !== camp) {
            return;
        }
        if (this._palettePreview.node) {
            this._palettePreview.node.destroy();
        }
        this._palettePreview = null;
        this.refreshBuildInteractionView();
    }

    private onTouchStart(event: cc.Event.EventTouch) {
        let position = this.getLocalTouchPosition(event);
        if (this._phase === "build") {
            this._dragObstacle = this.findObstacleAt(position);
            if (this._dragObstacle && !this.canControlCamp(this._dragObstacle.camp)) {
                this._dragObstacle = null;
            }
            if (this._dragObstacle) {
                this._dragStartPosition = this.getNodePosition(this._dragObstacle.node);
                this._dragObstacle.node.opacity = 180;
            }
            return;
        }

        if (this._phase === "attack") {
            if (!this.canControlCamp(this._actionCamp)) {
                return;
            }
            this._attackTouchActive = !this.isPointInOwnBuildArea(position);
            if (this._attackTouchActive) {
                this.updateAimPreview(position, true);
            }
        }
    }

    private onTouchMove(event: cc.Event.EventTouch) {
        let position = this.getLocalTouchPosition(event);
        if (this._phase === "build" && this._dragObstacle) {
            let snappedPosition = this.snapBuildPosition(position);
            this._dragObstacle.node.setPosition(snappedPosition.x, snappedPosition.y);
            this.updateObstacleValidView(this._dragObstacle, this.isBuildPositionValid(this._dragObstacle.camp, snappedPosition, this._dragObstacle.id, this._dragObstacle.originSlotId, this._dragObstacle.slotType));
            this.refreshBuildInteractionView();
            return;
        }

        if (this._phase === "attack") {
            if (!this.canControlCamp(this._actionCamp)) {
                return;
            }
            if (this._attackTouchActive && !this.isPointInOwnBuildArea(position)) {
                this.updateAimPreview(position, true);
            }
        }
    }

    private onTouchEnd(event: cc.Event.EventTouch) {
        let position = this.getLocalTouchPosition(event);
        if (this._phase === "build") {
            this.finishBuildTouch(position);
            return;
        }

        if (this._phase === "attack") {
            if (!this.canControlCamp(this._actionCamp)) {
                return;
            }
            if (this.isPointInOwnBuildArea(position)) {
                this._attackTouchActive = false;
                this.showFloatText("不能点击自己改造区发射", position, cc.Color.RED);
                return;
            }
            this.updateAimPreview(position, true);
            this._attackTouchActive = false;
            this.fireActionTank(position);
        }
    }

    private onTouchCancel() {
        this._attackTouchActive = false;
        if (!this._dragObstacle) {
            return;
        }

        this._dragObstacle.node.setPosition(this._dragStartPosition.x, this._dragStartPosition.y);
        this._dragObstacle.node.opacity = 255;
        this.updateObstacleValidView(this._dragObstacle, true);
        this._dragObstacle = null;
        this._dragStartPosition = null;
        this.refreshBuildInteractionView();
    }

    private finishBuildTouch(position: cc.Vec2) {
        if (this._dragObstacle) {
            let obstacle = this._dragObstacle;
            let snappedPosition = this.snapBuildPosition(position);
            let valid = this.isBuildPositionValid(obstacle.camp, snappedPosition, obstacle.id, obstacle.originSlotId, obstacle.slotType);
            obstacle.node.opacity = 255;
            if (valid) {
                obstacle.node.setPosition(snappedPosition.x, snappedPosition.y);
                this.updateObstacleValidView(obstacle, true);
                if (this._serverMode && this.onBuildIntent) {
                    this.onBuildIntent({
                        op: "move",
                        obstacleId: obstacle.id,
                        x: snappedPosition.x,
                        y: snappedPosition.y,
                    });
                }
            }
            else {
                obstacle.node.setPosition(this._dragStartPosition.x, this._dragStartPosition.y);
                this.updateObstacleValidView(obstacle, true);
                this.showFloatText("位置不可用", position, cc.Color.RED);
            }
            this._dragObstacle = null;
            this._dragStartPosition = null;
            this.refreshBuildInteractionView();
            return;
        }
    }

    private finishZoneTouch(position: cc.Vec2) {
        this.showFloatText("黑洞区域会在辅助期自动生成", position, cc.Color.YELLOW);
    }

    private moveActionTank(position: cc.Vec2) {
        let tank = this._tanks[this._actionCamp];
        if (!tank) {
            return;
        }

        let road = this.getRoadRect(this._actionCamp);
        if (road) {
            let minX = road.x + 18;
            let maxX = road.x + road.width - 18;
            tank.root.x = Math.max(minX, Math.min(maxX, position.x));
            tank.root.y = road.y + road.height / 2;
            return;
        }

        let halfWidth = this._config.mapWidth / 2 - 40;
        let x = Math.max(-halfWidth, Math.min(halfWidth, position.x));
        tank.root.x = x;
        tank.root.y = this._config.roadY[this._actionCamp];
    }

    private fireActionTank(targetPosition: cc.Vec2) {
        if (this._gameFinished) {
            return;
        }
        if (!this._serverMode && this._shotsLeftInAction <= 0) {
            return;
        }

        let tank = this._tanks[this._actionCamp];
        if (!tank) {
            return;
        }
        if (!this.isPointInOwnBuildArea(targetPosition)) {
            this.applyTankAim(this._actionCamp, targetPosition, true);
        }

        if (this._serverMode) {
            let startPosition = this.getNodePosition(tank.root);
            if (this._hasFiredInAction) {
                return;
            }
            this._hasFiredInAction = true;
            if (this.onAttackIntent) {
                this.onAttackIntent({
                    fromX: startPosition.x,
                    fromY: startPosition.y,
                    aimX: targetPosition.x,
                    aimY: targetPosition.y,
                    shotIndex: 0,
                });
            }
            return;
        }

        this.fireNextShotInAction();
    }

    private fireNextShotInAction() {
        if (this._shotsLeftInAction <= 0 || this._gameFinished || !this._attackSnapshot) {
            if (this._shotsLeftInAction <= 0 && this.onAttackFired) {
                this.onAttackFired();
            }
            return;
        }
        let tank = this._tanks[this._actionCamp];
        if (!tank) {
            return;
        }
        let startPosition = this.getNodePosition(tank.root);
        let dir = this.clampAimDirection(this._actionCamp, startPosition, tank.aim);
        this._hasFiredInAction = true;
        this._shotsLeftInAction = Math.max(0, this._shotsLeftInAction - 1);
        this.createBullet(this._actionCamp, startPosition.add(dir.mul(44)), dir, this._attackSnapshot);
        this.showFloatText("剩余开火 " + this._shotsLeftInAction, startPosition.add(cc.v2(0, 46)), new cc.Color(255, 255, 255, 255));
        this.emitTurnEvent("turn-attack-fired", {
            camp: this._actionCamp,
            from: startPosition,
            dir: dir,
        });
        if (this._shotsLeftInAction <= 0) {
            if (this.onAttackFired) {
                this.onAttackFired();
            }
            return;
        }
        this.scheduleOnce(this.fireNextShotInAction.bind(this), this.getAttackShotInterval(this._attackSnapshot));
    }

    private createBullet(camp: TurnCamp, position: cc.Vec2, dir: cc.Vec2, attackSnapshot?: TurnAttackSnapshotState) {
        let node = new cc.Node("TurnBullet" + camp);
        node.parent = this._bulletLayer || this.contentRoot;
        node.setPosition(position.x, position.y);
        node.angle = this.vectorToAngle(dir) - 90;

        let graphics = node.addComponent(cc.Graphics);
        graphics.fillColor = camp === "A" ? new cc.Color(255, 230, 96, 255) : new cc.Color(130, 220, 255, 255);
        graphics.circle(0, 0, this._config.bulletRadius);
        graphics.fill();

        let stats = this.getCampStats(camp);
        let snapshot = attackSnapshot || this._attackSnapshot;
        let damage = snapshot ? snapshot.bulletDamage : (this._config.bulletDamage + stats.damageBonus);
        let bounceLeft = snapshot ? snapshot.bulletBounce : stats.bulletBounce;
        let derived = stats.derivedUpgrades || this.buildDerivedUpgradeState(stats.upgradeStacks);
        this._bullets.push({
            node: node,
            camp: camp,
            dir: dir,
            damage: damage,
            remainingDamage: damage,
            baseDamage: damage,
            damageMultiplier: 1,
            damageBoostLevel: 1,
            speed: this._config.bulletSpeed,
            radius: this._config.bulletRadius,
            lifeLeft: Math.max(0.1, Number(this._config.bulletMaxLifeSeconds) || 30),
            bounceLeft: bounceLeft,
            hasBounced: false,
            hasTriggeredSpread: false,
            currentSpreadZoneIds: [],
            currentDamageBoostZoneIds: [],
            damageBoostAppliedZoneIds: [],
            spreadTriggeredZoneIds: [],
            firstBounceDamageBoostApplied: false,
            firstBounceDamageMultiplier: snapshot ? snapshot.firstBounceDamageMultiplier : derived.firstBounceDamageMultiplier,
            spreadExtraSplit: snapshot ? snapshot.spreadExtraSplit : derived.spreadExtraSplit,
            damageBoostTempAttack: snapshot ? snapshot.damageBoostTempAttack : derived.damageBoostTempAttack,
            blackHoleStrengthMultiplier: snapshot ? snapshot.blackHoleStrengthMultiplier : derived.blackHoleStrengthMultiplier,
        });
    }

    private updateBullets(dt: number) {
        if (this._bullets.length <= 0) {
            return;
        }

        for (let i = this._bullets.length - 1; i >= 0; i--) {
            let bullet = this._bullets[i];
            bullet.lifeLeft -= dt;
            this.applyAssistZones(bullet, dt);
            let nextPosition = this.getNodePosition(bullet.node).add(bullet.dir.mul(bullet.speed * dt));
            bullet.node.setPosition(nextPosition.x, nextPosition.y);

            if (bullet.remainingDamage <= 0
                || !this.keepBulletInMap(bullet)
                || this.tryHitDynamicObstacle(bullet)
                || this.tryHitStaticObstacle(bullet)
                || this.tryHitCrystal(bullet)
                || bullet.lifeLeft <= 0) {
                bullet.node.destroy();
                this._bullets.splice(i, 1);
            }
        }

        if (this._phase === "waitBullet" && this._bullets.length <= 0) {
            this.emitBulletsCleared();
        }
    }

    private getAttackShotInterval(snapshot: TurnAttackSnapshotState): number {
        if (!snapshot || snapshot.extraShotsFromBulletBlock <= 0) {
            return Math.max(0, Number(this._config.baseFireInterval) || 0);
        }
        return Math.max(0, Number(this._config.bulletBlockExtraShotInterval) || 0.5);
    }

    private tryHitDynamicObstacle(bullet: TurnBulletState): boolean {
        for (let i = 0; i < this._obstacles.length; i++) {
            let obstacle = this._obstacles[i];
            if (this.shouldIgnoreOwnResourceHit(bullet, obstacle.camp)) {
                continue;
            }
            let hitInfo = this.getHitDynamicObstacleCell(obstacle, this.getNodePosition(bullet.node), bullet.radius);
            if (!hitInfo) {
                continue;
            }
            if (obstacle.slotType === "mirror") {
                let cellIndex = hitInfo.cellIndex;
                let cellHp = Math.max(0, Number(obstacle.cellHp[cellIndex]) || 0);
                let appliedDamage = this.applyObstacleCellDamage(obstacle, cellIndex, cellHp);
                this.reflectBulletOffRect(bullet, hitInfo.rect);
                bullet.hasBounced = true;
                this.applyFirstBounceDamageBoostIfNeeded(bullet);
                this.recordPendingObstacleHitIfNeeded(bullet, obstacle, cellIndex, appliedDamage);
                this.resolveObstacleCellAfterHit(bullet, obstacle, i, cellIndex);
                return false;
            }
            let cellIndex = hitInfo.cellIndex;
            let appliedDamage = this.applyObstacleCellDamage(obstacle, cellIndex, bullet.remainingDamage);
            this.consumeBulletDamage(bullet, appliedDamage);
            if (this._serverMode && bullet.camp === "A" && appliedDamage > 0) {
                this._pendingBulletResult.hitType = this._pendingBulletResult.hitType || "obstacle";
                this._pendingBulletResult.obstacleHits.push({
                    obstacleId: obstacle.id,
                    cellIndex: cellIndex,
                    damage: appliedDamage,
                });
            }
            if (obstacle.cellHp[cellIndex] <= 0) {
                obstacle.layout.splice(cellIndex, 1);
                obstacle.cellHp.splice(cellIndex, 1);
                obstacle.shapeKey = this.getLayoutKey(obstacle.layout);
                obstacle.width = this.getDynamicObstacleRect(obstacle).width;
                obstacle.height = this.getDynamicObstacleRect(obstacle).height;
                if (this._serverMode && bullet.camp === "A") {
                    this._pendingBulletResult.destroyedCells.push({ obstacleId: obstacle.id, cellIndex: cellIndex });
                }
            }
            this.redrawObstacle(obstacle);
            this.refreshObstacleHpLabel(obstacle);
            if (obstacle.hp > 0) {
                return bullet.remainingDamage <= 0;
            }
            let expGain = this.getObstacleDestroyExp(obstacle);
            obstacle.node.destroy();
            this._obstacles.splice(i, 1);
            this.clearObstaclePlacedSlot(obstacle);
            if (expGain > 0) {
                this.addExp(bullet.camp, expGain, this.getNodePosition(bullet.node));
            }
            if (this._serverMode && bullet.camp === "A" && this._pendingBulletResult.destroyedIds.indexOf(obstacle.id) < 0) {
                this._pendingBulletResult.hitType = this._pendingBulletResult.hitType || "obstacle";
                this._pendingBulletResult.destroyedIds.push(obstacle.id);
            }
            this.emitTurnEvent("turn-obstacle-hit", {
                camp: bullet.camp,
                obstacleCamp: obstacle.camp,
                obstacleId: obstacle.id,
                expGain: expGain,
            });
            this.getCampStats(obstacle.camp).energyTowers = this.countPlacedEnergyTowers(obstacle.camp);
            this.emitStatsChanged();
            return bullet.remainingDamage <= 0;
        }

        return false;
    }

    private consumeBulletDamage(bullet: TurnBulletState, appliedDamage: number) {
        bullet.remainingDamage = Math.max(0, bullet.remainingDamage - Math.max(0, Math.floor(Number(appliedDamage) || 0)));
    }

    private shouldIgnoreOwnResourceHit(bullet: TurnBulletState, obstacleCamp: TurnCamp): boolean {
        return obstacleCamp === bullet.camp && !bullet.hasBounced;
    }

    private recordPendingObstacleHitIfNeeded(bullet: TurnBulletState, obstacle: TurnObstacleState, cellIndex: number, appliedDamage: number) {
        if (this._serverMode && bullet.camp === "A" && appliedDamage > 0) {
            this._pendingBulletResult.hitType = this._pendingBulletResult.hitType || "obstacle";
            this._pendingBulletResult.obstacleHits.push({
                obstacleId: obstacle.id,
                cellIndex: cellIndex,
                damage: appliedDamage,
            });
        }
    }

    private resolveObstacleCellAfterHit(bullet: TurnBulletState, obstacle: TurnObstacleState, obstacleIndex: number, cellIndex: number) {
        if (obstacle.cellHp[cellIndex] <= 0) {
            obstacle.layout.splice(cellIndex, 1);
            obstacle.cellHp.splice(cellIndex, 1);
            obstacle.shapeKey = this.getLayoutKey(obstacle.layout);
            obstacle.width = this.getDynamicObstacleRect(obstacle).width;
            obstacle.height = this.getDynamicObstacleRect(obstacle).height;
            if (this._serverMode && bullet.camp === "A") {
                this._pendingBulletResult.destroyedCells.push({ obstacleId: obstacle.id, cellIndex: cellIndex });
            }
        }
        this.redrawObstacle(obstacle);
        this.refreshObstacleHpLabel(obstacle);
        if (obstacle.hp > 0) {
            return;
        }
        let expGain = this.getObstacleDestroyExp(obstacle);
        obstacle.node.destroy();
        this._obstacles.splice(obstacleIndex, 1);
        this.clearObstaclePlacedSlot(obstacle);
        if (expGain > 0) {
            this.addExp(bullet.camp, expGain, this.getNodePosition(bullet.node));
        }
        if (this._serverMode && bullet.camp === "A" && this._pendingBulletResult.destroyedIds.indexOf(obstacle.id) < 0) {
            this._pendingBulletResult.hitType = this._pendingBulletResult.hitType || "obstacle";
            this._pendingBulletResult.destroyedIds.push(obstacle.id);
        }
        this.emitTurnEvent("turn-obstacle-hit", {
            camp: bullet.camp,
            obstacleCamp: obstacle.camp,
            obstacleId: obstacle.id,
            expGain: expGain,
        });
        this.getCampStats(obstacle.camp).energyTowers = this.countPlacedEnergyTowers(obstacle.camp);
        this.emitStatsChanged();
    }

    private tryHitStaticObstacle(bullet: TurnBulletState): boolean {
        let position = this.getNodePosition(bullet.node);
        for (let i = 0; i < this._staticObstacles.length; i++) {
            let obstacle = this._staticObstacles[i];
            if (!this.circleRectIntersects(position, bullet.radius, obstacle.rect)) {
                continue;
            }
            this.emitTurnEvent("turn-static-obstacle-hit", {
                camp: bullet.camp,
                obstacleId: obstacle.id,
                obstacleName: obstacle.name,
            });
            return this.tryConsumeBounce(bullet, obstacle.rect);
        }
        return false;
    }

    private reflectBulletOffRect(bullet: TurnBulletState, rect: cc.Rect) {
        let position = this.getNodePosition(bullet.node);
        let nearestX = Math.max(rect.x, Math.min(position.x, rect.x + rect.width));
        let nearestY = Math.max(rect.y, Math.min(position.y, rect.y + rect.height));
        let dx = position.x - nearestX;
        let dy = position.y - nearestY;
        if (dx === 0 && dy === 0) {
            let leftDist = Math.abs(position.x - rect.x);
            let rightDist = Math.abs(rect.x + rect.width - position.x);
            let bottomDist = Math.abs(position.y - rect.y);
            let topDist = Math.abs(rect.y + rect.height - position.y);
            let minDist = Math.min(leftDist, rightDist, bottomDist, topDist);
            if (minDist === leftDist || minDist === rightDist) {
                bullet.dir.x *= -1;
            }
            else {
                bullet.dir.y *= -1;
            }
        }
        else if (Math.abs(dx) >= Math.abs(dy)) {
            bullet.dir.x *= -1;
        }
        else {
            bullet.dir.y *= -1;
        }
        bullet.dir = bullet.dir.normalize();
        let pushDist = bullet.radius + 1;
        if (dx !== 0 || dy !== 0) {
            let nx = dx;
            let ny = dy;
            let len = Math.sqrt(nx * nx + ny * ny);
            if (len > 0) {
                nx /= len;
                ny /= len;
                bullet.node.x = nearestX + nx * pushDist;
                bullet.node.y = nearestY + ny * pushDist;
            }
        }
        bullet.node.angle = this.vectorToAngle(bullet.dir) - 90;
    }

    private tryHitCrystal(bullet: TurnBulletState): boolean {
        let bulletPosition = this.getNodePosition(bullet.node);
        let targetCamp = this.getTankHitCamp(bullet, bulletPosition);
        if (!targetCamp) {
            return false;
        }
        let crystal = this._crystals[targetCamp];
        let appliedDamage = Math.min(crystal.hp, Math.max(0, Math.floor(Number(bullet.remainingDamage) || 0)));
        crystal.hp = Math.max(0, crystal.hp - appliedDamage);
        this.consumeBulletDamage(bullet, appliedDamage);
        this.refreshCrystalView(targetCamp);
        this.showFloatText("-" + appliedDamage, this.getNodePosition(crystal.node).add(cc.v2(0, 44)), cc.Color.RED);
        this.addExp(bullet.camp, this._config.crystalHitExp, this.getNodePosition(crystal.node).add(cc.v2(0, 76)));
        this.emitStatsChanged();
        if (this._serverMode && bullet.camp === "A") {
            this._pendingBulletResult.hitType = "crystal";
            this._pendingBulletResult.targetCamp = targetCamp;
            this._pendingBulletResult.damage += appliedDamage;
        }
        this.emitTurnEvent("turn-crystal-hit", {
            camp: bullet.camp,
            targetCamp: targetCamp,
            damage: appliedDamage,
            hp: crystal.hp,
            expGain: this._config.crystalHitExp,
        });

        if (crystal.hp <= 0) {
            this.finishGame(bullet.camp);
        }
        return bullet.remainingDamage <= 0;
    }

    private getTankHitCamp(bullet: TurnBulletState, bulletPosition: cc.Vec2): TurnCamp {
        let camps: TurnCamp[] = ["A", "B"];
        for (let i = 0; i < camps.length; i++) {
            let camp = camps[i];
            if (!bullet.hasBounced && camp === bullet.camp) {
                continue;
            }
            let target = this._crystals[camp];
            if (target && this.getNodePosition(target.node).sub(bulletPosition).mag() <= target.radius + bullet.radius) {
                return camp;
            }
        }
        return null;
    }

    private finishGame(winnerCamp: TurnCamp) {
        if (this._gameFinished) {
            return;
        }

        this._gameFinished = true;
        for (let i = 0; i < this._bullets.length; i++) {
            this._bullets[i].node.destroy();
        }
        this._bullets = [];

        if (this.onGameFinished) {
            this.onGameFinished(winnerCamp);
        }
    }

    private createBuildObstacle(camp: TurnCamp, position: cc.Vec2, forcedId?: string, slotId?: string, slotType: TurnObstacleResourceType = "normal", snapshot?: any) {
        let slot = slotId ? this.getObstacleSlotState(camp, slotId) : this.getFirstAvailableObstacleSlot(camp);
        if (!slot && snapshot && snapshot.originSlotId) {
            slot = this.getObstacleSlotState(camp, String(snapshot.originSlotId));
        }
        let layout = snapshot && snapshot.layout ? this.buildLayoutFromSnapshot(slotType, snapshot.layout, Number(snapshot.resourceCount) || slot.count) : slot.layout;
        let mirrorDir: "" = "";
        let resourceCount = Math.max(1, Number(snapshot && snapshot.resourceCount) || slot.count);
        let bounds = this.getLayoutBounds(layout);
        let node = new cc.Node("BuildObstacle" + this._nextObstacleId);
        node.parent = this._obstacleLayer || this.contentRoot;
        node.setPosition(position.x, position.y);

        let graphics = node.addComponent(cc.Graphics);
        this.drawObstacleGraphics(graphics, camp, true, slotType, layout, mirrorDir);

        let maxHp = this.resolveObstacleMaxHp(slotType, resourceCount, Number(snapshot && snapshot.maxHp), camp);
        let cellHp = this.buildObstacleCellHp(slotType, resourceCount, layout.length, snapshot && snapshot.cellHp, camp);
        let hp = this.resolveObstacleHp(slotType, layout.length, Number(snapshot && snapshot.hp), cellHp, maxHp);

        let id = forcedId || String(this._nextObstacleId++);
        if (slot) {
            slot.placed = true;
            slot.placedObstacleId = id;
        }

        this._obstacles.push({
            id: id,
            camp: camp,
            originSlotId: slot ? slot.slotId : (slotId || ""),
            slotType: slotType,
            node: node,
            radius: Math.max((bounds.maxX - bounds.minX + 1) * this._dynamicObstacleSize.width, (bounds.maxY - bounds.minY + 1) * this._dynamicObstacleSize.height) * 0.5,
            width: (bounds.maxX - bounds.minX + 1) * this._dynamicObstacleSize.width,
            height: (bounds.maxY - bounds.minY + 1) * this._dynamicObstacleSize.height,
            hp: hp,
            maxHp: maxHp,
            resourceCount: resourceCount,
            layout: layout,
            cellHp: cellHp,
            shapeKey: this.getLayoutKey(layout),
            mirrorDir: mirrorDir,
            placedByCamp: camp,
        });
        this.refreshObstacleHpLabel(this._obstacles[this._obstacles.length - 1]);
        this.getCampStats(camp).energyTowers = this.countPlacedEnergyTowers(camp);
        this.refreshBuildInteractionView();
    }

    private createAssistZone(_camp: TurnCamp, type: TurnAssistZoneType, position: cc.Vec2, forcedId?: string, forcedRadius?: number, extra?: any) {
        let zoneId = forcedId || String(this._nextAssistZoneId++);
        let typeConfig = getTurnAssistZoneTypeConfig(type, this._config);
        let radius = Math.max(1, Number(forcedRadius) || Number(typeConfig.minRadius) || 1);
        let node = new cc.Node("AssistZone" + zoneId);
        node.parent = this._zoneLayer || this.contentRoot;
        node.setPosition(position.x, position.y);

        let graphics = node.addComponent(cc.Graphics);
        let style = this.getAssistZoneStyle(type);
        graphics.fillColor = style.fill;
        graphics.circle(0, 0, radius);
        graphics.fill();
        graphics.strokeColor = style.stroke;
        graphics.lineWidth = 3;
        graphics.circle(0, 0, radius);
        graphics.stroke();

        let label = this.createLabel(typeConfig.name || "区域", 18);
        label.node.parent = node;
        label.node.color = new cc.Color(220, 230, 255, 255);

        this._assistZones.push({
            id: zoneId,
            type: type,
            node: node,
            radius: radius,
            position: cc.v2(position.x, position.y),
            extra: extra || null,
        });
    }

    private isZonePositionValid(_type: TurnAssistZoneType, position: cc.Vec2, radius: number): boolean {
        let zoneRect = cc.rect(
            position.x - radius,
            position.y - radius,
            radius * 2,
            radius * 2,
        );
        if (!this._assistArea || !this.rectContainsRect(this._assistArea, zoneRect) || !this.rectContainsRect(this.getMapRect(), zoneRect)) {
            return false;
        }

        let roadA = this.getRoadRect("A");
        let roadB = this.getRoadRect("B");
        if ((roadA && this.circleRectIntersects(position, radius, roadA))
            || (roadB && this.circleRectIntersects(position, radius, roadB))) {
            return false;
        }

        let crystalA = this._crystals.A;
        let crystalB = this._crystals.B;
        if ((crystalA && position.sub(this.getNodePosition(crystalA.node)).mag() < radius + crystalA.radius + 12)
            || (crystalB && position.sub(this.getNodePosition(crystalB.node)).mag() < radius + crystalB.radius + 12)) {
            return false;
        }

        for (let i = 0; i < this._noBuildAreas.length; i++) {
            if (this.circleRectIntersects(position, radius, this._noBuildAreas[i])) {
                return false;
            }
        }
        for (let j = 0; j < this._staticObstacles.length; j++) {
            if (this.circleRectIntersects(position, radius, this._staticObstacles[j].rect)) {
                return false;
            }
        }
        if (!(this._config.assistZones && this._config.assistZones.allowOverlap)) {
            for (let k = 0; k < this._assistZones.length; k++) {
                let zone = this._assistZones[k];
                if (zone.position.sub(position).mag() < zone.radius + radius + 16) {
                    return false;
                }
            }
        }
        return true;
    }

    private updateObstacleValidView(obstacle: TurnObstacleState, valid: boolean) {
        let graphics = obstacle.node.getComponent(cc.Graphics);
        if (!graphics) {
            return;
        }

        graphics.clear();
        this.drawObstacleGraphics(graphics, obstacle.camp, valid, obstacle.slotType, obstacle.layout, obstacle.mirrorDir);
    }

    private drawObstacleGraphics(
        graphics: cc.Graphics,
        camp: TurnCamp,
        valid: boolean,
        slotType: TurnObstacleResourceType,
        layout?: cc.Vec2[],
        mirrorDir?: "",
    ) {
        let cells = this.normalizeObstacleLayout(slotType, layout);
        let cellSize = this._dynamicObstacleSize.width;
        for (let i = 0; i < cells.length; i++) {
            let cell = cells[i];
            let x = cell.x * cellSize - cellSize / 2;
            let y = cell.y * cellSize - cellSize / 2;
            graphics.fillColor = this.getObstacleFillColor(camp, valid, slotType);
            graphics.roundRect(x, y, cellSize, cellSize, 8);
            graphics.fill();
            graphics.strokeColor = new cc.Color(240, 240, 240, 180);
            graphics.lineWidth = 2;
            graphics.roundRect(x, y, cellSize, cellSize, 8);
            graphics.stroke();
            if (slotType === "exp" || slotType === "energy" || slotType === "mirror" || slotType === "missile_silo" || slotType === "coin") {
                this.drawObstacleIcon(graphics, slotType, x, y, cellSize);
            }
        }
    }

    private updatePreviewNodeView(node: cc.Node, camp: TurnCamp, valid: boolean, slotType: TurnObstacleResourceType, slotId?: string) {
        let graphics = node.getComponent(cc.Graphics);
        if (!graphics) {
            graphics = node.addComponent(cc.Graphics);
        }
        graphics.clear();
        let slot = slotId ? this.getObstacleSlotState(camp, slotId) : this.getObstacleSlotByType(camp, slotType);
        this.drawObstacleGraphics(graphics, camp, valid, slotType, slot ? slot.layout : null, slot ? slot.mirrorDir : "");
    }

    private drawBoard() {
        let board = new cc.Node("TurnBoard");
        board.parent = this.contentRoot;
        let graphics = board.addComponent(cc.Graphics);
        graphics.fillColor = new cc.Color(36, 44, 54, 255);
        graphics.rect(-this._config.mapWidth / 2, -this._config.mapHeight / 2, this._config.mapWidth, this._config.mapHeight);
        graphics.fill();

        this.drawArea("BuildAreaA", this._config.buildArea.A, new cc.Color(54, 93, 62, 110));
        this.drawArea("BuildAreaB", this._config.buildArea.B, new cc.Color(93, 54, 62, 110));
        this.drawRoad("A");
        this.drawRoad("B");
        this.drawCenterLine();
    }

    private drawArea(name: string, rect: cc.Rect, color: cc.Color) {
        let node = new cc.Node(name);
        node.parent = this.contentRoot;
        let graphics = node.addComponent(cc.Graphics);
        graphics.fillColor = color;
        graphics.rect(rect.x, rect.y, rect.width, rect.height);
        graphics.fill();
    }

    private drawRoad(camp: TurnCamp) {
        let node = new cc.Node("Road" + camp);
        node.parent = this.contentRoot;
        let graphics = node.addComponent(cc.Graphics);
        graphics.fillColor = camp === "A" ? new cc.Color(76, 143, 92, 180) : new cc.Color(143, 76, 92, 180);
        graphics.rect(-this._config.mapWidth / 2, this._config.roadY[camp] - 18, this._config.mapWidth, 36);
        graphics.fill();
    }

    private drawCenterLine() {
        let node = new cc.Node("CenterLine");
        node.parent = this.contentRoot;
        let graphics = node.addComponent(cc.Graphics);
        graphics.strokeColor = new cc.Color(210, 210, 210, 80);
        graphics.lineWidth = 2;
        graphics.moveTo(-this._config.mapWidth / 2, 0);
        graphics.lineTo(this._config.mapWidth / 2, 0);
        graphics.stroke();
    }

    private createCampView(camp: TurnCamp) {
        let tankPosition = this.getSpawnPosition("tank" + camp, this.getRoadCenterPosition(camp));
        let tank = this.createTank(camp, tankPosition);
        this._crystals[camp] = {
            node: tank.root,
            hp: this._config.crystalHp,
            maxHp: this._config.crystalHp,
            hpLabel: tank.campLabel,
            radius: 38,
        };
        this._tanks[camp] = tank;
        this.refreshCrystalView(camp);
    }

    private createCrystal(camp: TurnCamp, position: cc.Vec2): { node: cc.Node; label: cc.Label } {
        let node = new cc.Node("Crystal" + camp);
        node.parent = this._obstacleLayer || this.contentRoot;
        node.setPosition(position.x, position.y);

        let graphics = node.addComponent(cc.Graphics);
        graphics.fillColor = camp === "A" ? new cc.Color(72, 180, 109, 255) : new cc.Color(208, 92, 104, 255);
        graphics.circle(0, 0, 32);
        graphics.fill();

        let label = this.createLabel("", 18);
        label.node.name = "CrystalHp" + camp;
        label.node.parent = node;
        label.node.y = -54;
        return { node: node, label: label };
    }

    private createTank(camp: TurnCamp, position: cc.Vec2): TurnTankState {
        let root = new cc.Node("TurnTank" + camp);
        root.parent = this._obstacleLayer || this.contentRoot;
        root.setPosition(position.x, position.y);

        let body = new cc.Node("Body");
        body.parent = root;
        let bodyGraphics = body.addComponent(cc.Graphics);
        bodyGraphics.fillColor = camp === "A" ? new cc.Color(92, 214, 124, 255) : new cc.Color(224, 96, 112, 255);
        bodyGraphics.roundRect(-34, -18, 68, 36, 8);
        bodyGraphics.fill();

        let turret = new cc.Node("Turret");
        turret.parent = root;
        let turretGraphics = turret.addComponent(cc.Graphics);
        turretGraphics.fillColor = new cc.Color(235, 235, 235, 255);
        turretGraphics.rect(-4, 0, 8, 42);
        turretGraphics.fill();

        let preview = new cc.Node("Preview");
        preview.parent = root;
        let label = this.createLabel(camp, 18);
        label.node.name = "TankHp" + camp;
        label.node.parent = root;
        label.node.y = -54;

        let tankState: TurnTankState = {
            root: root,
            body: body,
            turret: turret,
            preview: preview,
            aim: cc.v2(position.x, position.y + (camp === "A" ? 120 : -120)),
            campLabel: label,
        };
        this.applyTankAim(camp, tankState.aim, false);
        this.updateTankState(camp, false);
        return tankState;
    }

    private refreshCrystalView(camp: TurnCamp) {
        let crystal = this._crystals[camp];
        if (!crystal || !crystal.hpLabel) {
            return;
        }

        crystal.hpLabel.string = camp + " HP " + crystal.hp + "/" + crystal.maxHp;
    }

    private updateTankState(camp: TurnCamp, active: boolean) {
        let tank = this._tanks[camp];
        if (!tank) {
            return;
        }

        tank.root.active = true;
        tank.preview.active = true;
        tank.root.opacity = active ? 255 : 100;
        tank.root.scale = active ? 1.08 : 1;
        tank.preview.opacity = active ? 210 : 90;
    }

    private createCampStats(): TurnCampStats {
        let economy = this._config.coinEconomy || {} as any;
        return {
            exp: 0,
            expNeed: this._config.levelUpExp,
            level: 1,
            damageBonus: 0,
            extraShots: 0,
            bulletBounce: 0,
            energyTowers: 0,
            roundResourceBonus: 0,
            upgradeStacks: {},
            derivedUpgrades: this.buildDerivedUpgradeState({}),
            coins: Math.max(0, Math.floor(Number(economy.initialCoins) || 0)),
            placedThisRound: false,
            slotCost: Math.max(0, Math.floor(Number(economy.slotCost) || 0)),
            refreshCost: Math.max(0, Math.floor(Number(economy.refreshCost) || 0)),
            canRefresh: false,
        };
    }

    private getUpgradeConfig(upgradeId: string): TurnUpgradeConfig {
        for (let i = 0; i < this._config.upgradePool.length; i++) {
            if (this._config.upgradePool[i].id === upgradeId) {
                return this._config.upgradePool[i];
            }
        }
        return null;
    }

    private getUpgradeConfigsByEffect(type: TurnUpgradeEffectType, targetResourceType?: TurnObstacleResourceType): TurnUpgradeConfig[] {
        let result: TurnUpgradeConfig[] = [];
        for (let i = 0; i < this._config.upgradePool.length; i++) {
            let option = this._config.upgradePool[i];
            let effect = option && option.effect;
            if (!effect || effect.type !== type) {
                continue;
            }
            if (targetResourceType && effect.targetResourceType !== targetResourceType) {
                continue;
            }
            result.push(option);
        }
        return result;
    }

    private getUpgradeStack(stacks: { [id: string]: number }, id: string): number {
        return Math.max(0, Math.floor(Number(stacks && stacks[id]) || 0));
    }

    private getUpgradeAddValue(stacks: { [id: string]: number }, type: TurnUpgradeEffectType, targetResourceType?: TurnObstacleResourceType): number {
        let total = 0;
        let options = this.getUpgradeConfigsByEffect(type, targetResourceType);
        for (let i = 0; i < options.length; i++) {
            let option = options[i];
            let effect = option.effect;
            let stack = this.getUpgradeStack(stacks, option.id);
            if (stack <= 0 || !effect || effect.stackMode !== "add") {
                continue;
            }
            let effectiveStack = option.maxStacks == null ? stack : Math.min(stack, Math.max(0, Number(option.maxStacks) || 0));
            total += effectiveStack * (Number(effect.value) || 0);
        }
        return total;
    }

    private getUpgradeMultiplyValue(stacks: { [id: string]: number }, type: TurnUpgradeEffectType, targetResourceType?: TurnObstacleResourceType): number {
        let multiplier = 1;
        let options = this.getUpgradeConfigsByEffect(type, targetResourceType);
        for (let i = 0; i < options.length; i++) {
            let option = options[i];
            let effect = option.effect;
            let stack = this.getUpgradeStack(stacks, option.id);
            if (stack <= 0 || !effect) {
                continue;
            }
            let effectiveStack = option.maxStacks == null ? stack : Math.min(stack, Math.max(0, Number(option.maxStacks) || 0));
            if (effect.stackMode === "multiply") {
                multiplier *= Math.pow(Math.max(0, Number(effect.value) || 1), effectiveStack);
            }
            else if (effect.stackMode === "add") {
                multiplier *= 1 + effectiveStack * (Number(effect.value) || 0);
            }
        }
        return Math.max(1, multiplier);
    }

    private buildDerivedUpgradeState(stacks: { [id: string]: number }): TurnDerivedUpgradeState {
        let resourceHpBonusByType: TurnResourceHpBonusByType = {
            normal: Math.max(0, Math.floor(this.getUpgradeAddValue(stacks, "resource_hp", "normal"))),
            exp: Math.max(0, Math.floor(this.getUpgradeAddValue(stacks, "resource_hp", "exp"))),
            energy: Math.max(0, Math.floor(this.getUpgradeAddValue(stacks, "resource_hp", "energy"))),
            bullet: Math.max(0, Math.floor(this.getUpgradeAddValue(stacks, "resource_hp", "bullet"))),
            bleed: Math.max(0, Math.floor(this.getUpgradeAddValue(stacks, "resource_hp", "bleed"))),
        };
        return {
            bulletBounceBonus: Math.max(0, Math.floor(this.getUpgradeAddValue(stacks, "bullet_bounce"))),
            firstBounceDamageMultiplier: this.getUpgradeMultiplyValue(stacks, "first_bounce_damage"),
            roundResourceBonus: Math.max(0, Math.floor(this.getUpgradeAddValue(stacks, "round_resource"))),
            resourceHpBonusByType: resourceHpBonusByType,
            spreadExtraSplit: Math.max(0, Math.floor(this.getUpgradeAddValue(stacks, "spread_extra_split"))),
            damageBoostTempAttack: Math.max(0, Math.floor(this.getUpgradeAddValue(stacks, "damage_boost_temp_attack"))),
            blackHoleStrengthMultiplier: this.getUpgradeMultiplyValue(stacks, "black_hole_strength"),
            missileExplosionRadiusBonus: Math.max(0, Math.floor(this.getUpgradeAddValue(stacks, "missile_explosion_radius"))),
            missileDamageBonus: Math.max(0, Math.floor(this.getUpgradeAddValue(stacks, "missile_damage"))),
            missileMainCannonChanceBonus: Math.max(0, Math.min(1, this.getUpgradeAddValue(stacks, "missile_main_cannon_chance"))),
            coinDropMultiplier: Math.max(1, 1 + Math.max(0, this.getUpgradeAddValue(stacks, "coin_drop"))),
            expDropMultiplier: Math.max(1, 1 + Math.max(0, this.getUpgradeAddValue(stacks, "exp_drop"))),
        };
    }

    private refreshDerivedUpgradeState(camp: TurnCamp) {
        let stats = this.getCampStats(camp);
        stats.derivedUpgrades = this.buildDerivedUpgradeState(stats.upgradeStacks || {});
        stats.bulletBounce = stats.derivedUpgrades.bulletBounceBonus;
        stats.roundResourceBonus = stats.derivedUpgrades.roundResourceBonus;
    }

    private getObstacleSlotState(camp: TurnCamp, slotId: string): TurnObstacleSlotState {
        let slots = this._obstacleInventory[camp] || [];
        for (let i = 0; i < slots.length; i++) {
            if (slots[i].slotId === slotId) {
                return slots[i];
            }
        }
        return null;
    }

    private getObstacleSlotByType(camp: TurnCamp, type: TurnObstacleResourceType): TurnObstacleSlotState {
        let slots = this._obstacleInventory[camp] || [];
        for (let i = 0; i < slots.length; i++) {
            if (slots[i].type === type) {
                return slots[i];
            }
        }
        return null;
    }

    private getFirstAvailableObstacleSlot(camp: TurnCamp): TurnObstacleSlotState {
        let slots = this.getObstacleSlotStates(camp);
        for (let i = 0; i < slots.length; i++) {
            if (this.canPlaceFromSlot(slots[i])) {
                return slots[i];
            }
        }
        return null;
    }

    private getFirstAvailableObstacleSlotId(camp: TurnCamp): string {
        let slot = this.getFirstAvailableObstacleSlot(camp);
        return slot ? slot.slotId : "";
    }

    private canPlaceFromSlot(slot: TurnObstacleSlotState): boolean {
        if (!slot || slot.count <= 0) {
            return false;
        }
        this.reconcileSlotPlacementState(slot);
        return !slot.placedObstacleId;
    }

    private applyObstacleInventorySnapshot(camp: TurnCamp, inventory: any) {
        let slots = inventory && Array.isArray(inventory.roundSlots)
            ? inventory.roundSlots
            : (inventory && Array.isArray(inventory.obstacleSlots) ? inventory.obstacleSlots : []);
        this._obstacleInventory[camp] = slots.map((source: any, index: number) => {
            let type = (source && source.type ? source.type : "normal") as TurnObstacleResourceType;
            let count = Math.max(1, Math.min(this._config.slotMaxResource, Number(source && source.count) || 1));
            let layout = this.buildLayoutFromSnapshot(type, source && source.layout, count);
            let placedObstacleId = String(source && source.placedObstacleId ? source.placedObstacleId : "");
            return {
                slotId: String(source && source.slotId ? source.slotId : (camp + "_slot_" + index)),
                type: type,
                name: this.getSlotDisplayName(type),
                count: count,
                layout: layout,
                shapeKey: String(source && source.shapeKey ? source.shapeKey : this.getLayoutKey(layout)),
                mirrorDir: "",
                placed: !!placedObstacleId,
                placedObstacleId: placedObstacleId,
            };
        });
    }

    private reconcileSlotPlacementState(slot: TurnObstacleSlotState) {
        if (!slot) {
            return;
        }
        if (!slot.placedObstacleId) {
            slot.placed = false;
            return;
        }
        let exists = false;
        for (let i = 0; i < this._obstacles.length; i++) {
            if (this._obstacles[i] && this._obstacles[i].id === slot.placedObstacleId) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            slot.placed = false;
            slot.placedObstacleId = "";
            return;
        }
        slot.placed = true;
    }

    private refreshObstacleSlotShape(slot: TurnObstacleSlotState) {
        if (!slot) {
            return;
        }
        slot.layout = this.buildLayoutForSlot(slot.type, slot.count);
        slot.shapeKey = this.getLayoutKey(slot.layout);
        if (slot.type === "mirror") {
            slot.mirrorDir = "";
        }
    }

    private getSlotDisplayName(type: TurnObstacleResourceType): string {
        if (type === "mirror") {
            return "反弹块";
        }
        if (type === "exp") {
            return "经验墙";
        }
        if (type === "energy") {
            return "能量墙";
        }
        if (type === "bleed") {
            return "滴血块";
        }
        if (type === "bullet") {
            return "子弹块";
        }
        if (type === "attack") {
            return "攻击块";
        }
        if (type === "missile_silo") {
            return "导弹井";
        }
        return "普通方块";
    }

    private generateRoundState(camp: TurnCamp, roundIndex: number) {
        let total = this.getNaturalRoundResourceTotal(camp, roundIndex);
        this._obstacleInventory[camp] = this.createRoundSlots(camp, roundIndex, total);
    }

    private getNaturalRoundResourceTotal(camp: TurnCamp, roundIndex: number): number {
        let stats = this.getCampStats(camp);
        let natural = this._config.initialRoundResourceTotal + Math.max(0, roundIndex - 1) * this._config.roundResourceGrowth;
        natural += Math.max(0, stats.roundResourceBonus || 0);
        return Math.max(this._config.slotCountPerRound, Math.min(this._config.maxRoundResourceTotal, natural));
    }

    private createRoundSlots(camp: TurnCamp, roundIndex: number, totalResources: number): TurnObstacleSlotState[] {
        let counts = this.splitRoundResources(totalResources);
        let result: TurnObstacleSlotState[] = [];
        for (let i = 0; i < counts.length; i++) {
            let type = this.randomSlotType();
            let layout = this.buildLayoutForSlot(type, counts[i]);
            result.push({
                slotId: camp + "_r" + roundIndex + "_s" + i,
                type: type,
                name: this.getSlotDisplayName(type),
                count: counts[i],
                layout: layout,
                shapeKey: this.getLayoutKey(layout),
                mirrorDir: "",
                placed: false,
                placedObstacleId: "",
            });
        }
        return result;
    }

    private splitRoundResources(totalResources: number): number[] {
        let slotCount = this._config.slotCountPerRound;
        let minValue = this._config.slotMinResource;
        let maxValue = this._config.slotMaxResource;
        let remaining = Math.max(slotCount * minValue, Math.min(this._config.maxRoundResourceTotal, Math.floor(totalResources)));
        let result: number[] = [];
        for (let i = 0; i < slotCount; i++) {
            let slotsLeft = slotCount - i;
            let minAllowed = Math.max(minValue, remaining - (slotsLeft - 1) * maxValue);
            let maxAllowed = Math.min(maxValue, remaining - (slotsLeft - 1) * minValue);
            let picked = i === slotCount - 1 ? remaining : Math.floor(Math.random() * (maxAllowed - minAllowed + 1)) + minAllowed;
            result.push(picked);
            remaining -= picked;
        }
        return result;
    }

    private randomSlotType(): TurnObstacleResourceType {
        let slots = this._config.obstacleSlots || [];
        let index = Math.floor(Math.random() * Math.max(1, slots.length));
        let picked = slots[index];
        return picked ? picked.type : "normal";
    }

    private findLatestObstacleBySlot(camp: TurnCamp, slotType: TurnObstacleResourceType): TurnObstacleState {
        for (let i = this._obstacles.length - 1; i >= 0; i--) {
            let obstacle = this._obstacles[i];
            if (obstacle.camp === camp && obstacle.slotType === slotType) {
                return obstacle;
            }
        }
        return null;
    }

    private normalizeObstacleLayout(slotType: TurnObstacleResourceType, layout?: cc.Vec2[]): cc.Vec2[] {
        if (layout && layout.length > 0) {
            return layout;
        }
        return [cc.v2(0, 0)];
    }

    private buildLayoutFromSnapshot(slotType: TurnObstacleResourceType, layout: any, count: number): cc.Vec2[] {
        if (!Array.isArray(layout) || layout.length <= 0) {
            return this.buildLayoutForSlot(slotType, count);
        }
        let result: cc.Vec2[] = [];
        for (let i = 0; i < layout.length; i++) {
            let cell = layout[i];
            let x = Math.round(Number(cell && cell.x) || 0);
            let y = Math.round(Number(cell && cell.y) || 0);
            result.push(cc.v2(x, y));
        }
        return result.length > 0 ? result : this.buildLayoutForSlot(slotType, count);
    }

    private buildLayoutForSlot(slotType: TurnObstacleResourceType, count: number): cc.Vec2[] {
        let safeCount = Math.max(1, Math.min(this._config.obstacleSlotMaxResources, count));
        let candidates = OBSTACLE_LAYOUT_LIBRARY[safeCount] || OBSTACLE_LAYOUT_LIBRARY[1];
        if (!candidates || candidates.length <= 0) {
            return [cc.v2(0, 0)];
        }
        let picked = candidates[Math.floor(Math.random() * candidates.length)];
        return picked.map((item) => cc.v2(item.x, item.y));
    }

    private getLayoutKey(layout: cc.Vec2[]): string {
        let cells = layout && layout.length > 0 ? layout : [cc.v2(0, 0)];
        return cells.map((cell) => `${cell.x}:${cell.y}`).join("|");
    }

    private buildCellHpFromSnapshot(source: any, count: number, defaultHp: number): number[] {
        let result: number[] = [];
        for (let i = 0; i < count; i++) {
            let hp = Array.isArray(source) ? Math.max(0, Number(source[i]) || 0) : defaultHp;
            result.push(hp > 0 ? hp : defaultHp);
        }
        return result;
    }

    private buildObstacleCellHp(slotType: TurnObstacleResourceType, resourceCount: number, count: number, source: any, camp?: TurnCamp): number[] {
        if (slotType !== "exp") {
            return this.buildCellHpFromSnapshot(source, count, this.getObstacleCellMaxHp(slotType, camp));
        }
        let defaultHpList = this.buildExpCellHpList(resourceCount, count, camp);
        let result: number[] = [];
        for (let i = 0; i < count; i++) {
            let fallbackHp = defaultHpList[i] || 1;
            let hp = Array.isArray(source) ? Math.max(0, Number(source[i]) || 0) : fallbackHp;
            result.push(hp > 0 ? hp : fallbackHp);
        }
        return result;
    }

    private countLivingResource(camp: TurnCamp, slotType: TurnObstacleResourceType): number {
        let total = 0;
        for (let i = 0; i < this._obstacles.length; i++) {
            let obstacle = this._obstacles[i];
            if (obstacle.camp === camp && obstacle.slotType === slotType) {
                total += Math.max(1, obstacle.resourceCount);
            }
        }
        return total;
    }

    private buildBondCountMap(camp: TurnCamp): TurnBondCountMap {
        return {
            bullet: this.countLivingResource(camp, "bullet"),
            attack: this.countLivingResource(camp, "attack"),
            exp: this.countLivingResource(camp, "exp"),
            energy: this.countLivingResource(camp, "energy"),
            bleed: this.countLivingResource(camp, "bleed"),
            coin: this.countLivingResource(camp, "coin"),
        };
    }

    private buildAttackSnapshotForCamp(camp: TurnCamp): TurnAttackSnapshotState {
        let stats = this.getCampStats(camp);
        return buildTurnAttackBondSnapshot(this.buildBondCountMap(camp), {
            extraShots: stats.extraShots,
            damageBonus: stats.damageBonus,
            bulletBounce: stats.bulletBounce,
            firstBounceDamageMultiplier: stats.derivedUpgrades.firstBounceDamageMultiplier,
            spreadExtraSplit: stats.derivedUpgrades.spreadExtraSplit,
            damageBoostTempAttack: stats.derivedUpgrades.damageBoostTempAttack,
            blackHoleStrengthMultiplier: stats.derivedUpgrades.blackHoleStrengthMultiplier,
        }, this._config);
    }

    private buildSettlementSnapshotForCamp(camp: TurnCamp): TurnSettlementBondSnapshot {
        let enemyCamp: TurnCamp = camp === "A" ? "B" : "A";
        return buildTurnSettlementBondSnapshot(this.buildBondCountMap(camp), this.buildBondCountMap(enemyCamp), this._config);
    }

    private buildAttackSnapshotFromServer(source: any): TurnAttackSnapshotState {
        if (!source) {
            return null;
        }
        return {
            bulletBlockCount: Math.max(0, Number(source.bulletBlockCount) || 0),
            attackBlockCount: Math.max(0, Number(source.attackBlockCount) || 0),
            attackMultiplier: Math.max(0, Number(source.attackMultiplier) || 0),
            totalShots: Math.max(1, Number(source.totalShots) || 1),
            extraShotsFromUpgrade: Math.max(0, Number(source.extraShotsFromUpgrade) || 0),
            extraShotsFromBulletBlock: Math.max(0, Number(source.extraShotsFromBulletBlock) || 0),
            bonusDamageFromUpgrade: Math.max(0, Number(source.bonusDamageFromUpgrade) || 0),
            bonusDamageFromAttackBlock: Math.max(0, Number(source.bonusDamageFromAttackBlock) || 0),
            bulletDamage: Math.max(1, Number(source.bulletDamage) || this._config.bulletDamage),
            bulletBounce: Math.max(0, Number(source.bulletBounce) || 0),
            firstBounceDamageMultiplier: Math.max(1, Number(source.firstBounceDamageMultiplier) || 1),
            spreadExtraSplit: Math.max(0, Number(source.spreadExtraSplit) || 0),
            damageBoostTempAttack: Math.max(0, Number(source.damageBoostTempAttack) || 0),
            blackHoleStrengthMultiplier: Math.max(1, Number(source.blackHoleStrengthMultiplier) || 1),
            shotsLeft: Math.max(0, Number(source.shotsLeft) || 0),
        };
    }

    private buildSettlementSnapshotFromServer(source: any): TurnSettlementBondSnapshot {
        if (!source) {
            return null;
        }
        return {
            expBlockCount: Math.max(0, Number(source.expBlockCount) || 0),
            expMultiplier: Math.max(0, Number(source.expMultiplier) || 0),
            expGain: Math.max(0, Number(source.expGain) || 0),
            energyBlockCount: Math.max(0, Number(source.energyBlockCount) || 0),
            energyMultiplier: Math.max(0, Number(source.energyMultiplier) || 0),
            totalHeal: Math.max(0, Number(source.totalHeal) || 0),
            blockedHealByEnemy: Math.max(0, Number(source.blockedHealByEnemy) || 0),
            finalHeal: Math.max(0, Number(source.finalHeal) || 0),
            bleedBlockCount: Math.max(0, Number(source.bleedBlockCount) || 0),
            bleedMultiplier: Math.max(0, Number(source.bleedMultiplier) || 0),
            blockedHeal: Math.max(0, Number(source.blockedHeal) || 0),
        };
    }

    private buildExpCellHpList(resourceCount: number, cellCount: number, camp?: TurnCamp): number[] {
        let safeCells = Math.max(1, Math.floor(Number(cellCount) || 1));
        let maxHp = this.getObstacleMaxHp("exp", resourceCount, camp);
        let basePerCell = Math.floor(maxHp / safeCells);
        let remainder = maxHp % safeCells;
        let result: number[] = [];
        for (let i = 0; i < safeCells; i++) {
            result.push(basePerCell + (i < remainder ? 1 : 0));
        }
        return result;
    }

    private refreshCampResourceHpByUpgrade(camp: TurnCamp, targetResourceType?: TurnObstacleResourceType, previousStacks?: { [id: string]: number }) {
        if (!targetResourceType || targetResourceType === "mirror" || targetResourceType === "attack") {
            return;
        }
        let stats = this.getCampStats(camp);
        let currentDerived = stats.derivedUpgrades;
        let previousDerived = this.buildDerivedUpgradeState(previousStacks || {});
        for (let i = 0; i < this._obstacles.length; i++) {
            let obstacle = this._obstacles[i];
            if (!obstacle || obstacle.camp !== camp || obstacle.slotType !== targetResourceType) {
                continue;
            }
            stats.derivedUpgrades = previousDerived;
            let previousCellHp = this.buildObstacleCellHp(obstacle.slotType, obstacle.resourceCount, obstacle.layout.length, null, camp);
            stats.derivedUpgrades = currentDerived;
            let nextCellHp = this.buildObstacleCellHp(obstacle.slotType, obstacle.resourceCount, obstacle.layout.length, null, camp);
            for (let j = 0; j < obstacle.cellHp.length && j < nextCellHp.length; j++) {
                let delta = Math.max(0, nextCellHp[j] - (previousCellHp[j] || 0));
                obstacle.cellHp[j] = Math.min(nextCellHp[j], Math.max(0, obstacle.cellHp[j]) + delta);
            }
            obstacle.maxHp = this.getObstacleMaxHp(obstacle.slotType, obstacle.resourceCount, camp);
            obstacle.hp = this.sumObstacleCellHp(obstacle);
            this.refreshObstacleHpLabel(obstacle);
        }
        stats.derivedUpgrades = currentDerived;
    }

    private getObstacleFillColor(camp: TurnCamp, valid: boolean, slotType: TurnObstacleResourceType): cc.Color {
        if (!valid) {
            return new cc.Color(210, 60, 60, 255);
        }
        if (slotType === "exp") {
            return new cc.Color(223, 173, 62, 255);
        }
        if (slotType === "energy") {
            return new cc.Color(72, 168, 228, 255);
        }
        if (slotType === "bleed") {
            return new cc.Color(224, 98, 98, 255);
        }
        if (slotType === "bullet") {
            return new cc.Color(166, 140, 255, 255);
        }
        if (slotType === "attack") {
            return new cc.Color(255, 146, 86, 255);
        }
        if (slotType === "missile_silo") {
            return new cc.Color(104, 132, 154, 255);
        }
        if (slotType === "coin") {
            return new cc.Color(247, 205, 66, 255);
        }
        return camp === "A" ? new cc.Color(99, 156, 106, 255) : new cc.Color(161, 96, 108, 255);
    }

    private drawObstacleIcon(graphics: cc.Graphics, slotType: TurnObstacleResourceType, x: number, y: number, size: number) {
        graphics.strokeColor = new cc.Color(245, 245, 245, 210);
        graphics.lineWidth = 2;
        let cx = x + size / 2;
        let cy = y + size / 2;
        if (slotType === "exp") {
            graphics.moveTo(cx - 6, cy);
            graphics.lineTo(cx + 6, cy);
            graphics.moveTo(cx, cy - 6);
            graphics.lineTo(cx, cy + 6);
        }
        else if (slotType === "energy") {
            graphics.moveTo(cx - 5, cy + 8);
            graphics.lineTo(cx + 1, cy + 1);
            graphics.lineTo(cx - 2, cy + 1);
            graphics.lineTo(cx + 5, cy - 8);
        }
        else if (slotType === "mirror") {
            graphics.moveTo(cx - 8, cy - 8);
            graphics.lineTo(cx + 8, cy + 8);
            graphics.moveTo(cx - 8, cy + 8);
            graphics.lineTo(cx + 8, cy - 8);
        }
        else if (slotType === "bleed") {
            graphics.circle(cx, cy, 6);
        }
        else if (slotType === "bullet") {
            graphics.circle(cx, cy, 5);
            graphics.moveTo(cx - 8, cy);
            graphics.lineTo(cx + 8, cy);
        }
        else if (slotType === "attack") {
            graphics.moveTo(cx - 7, cy + 7);
            graphics.lineTo(cx + 7, cy - 7);
            graphics.moveTo(cx - 7, cy - 7);
            graphics.lineTo(cx + 7, cy + 7);
        }
        else if (slotType === "missile_silo") {
            graphics.rect(cx - 7, cy - 7, 14, 14);
            graphics.moveTo(cx, cy + 9);
            graphics.lineTo(cx, cy - 9);
            graphics.moveTo(cx - 5, cy + 4);
            graphics.lineTo(cx, cy + 9);
            graphics.lineTo(cx + 5, cy + 4);
        }
        else if (slotType === "coin") {
            graphics.circle(cx, cy, 7);
            graphics.moveTo(cx - 3, cy - 4);
            graphics.lineTo(cx - 3, cy + 4);
            graphics.moveTo(cx + 3, cy - 4);
            graphics.lineTo(cx + 3, cy + 4);
        }
        graphics.stroke();
    }

    private countPlacedEnergyTowers(camp: TurnCamp): number {
        return this.countLivingResource(camp, "energy");
    }

    private countPlacedBleedBlocks(camp: TurnCamp): number {
        return this.countLivingResource(camp, "bleed");
    }

    private countPlacedExpBlocks(camp: TurnCamp): number {
        return this.countLivingResource(camp, "exp");
    }

    private applyRoundSettlementForCamp(camp: TurnCamp) {
        let settlement = this.buildSettlementSnapshotForCamp(camp);
        this._settlementSnapshots[camp] = settlement;
        if (settlement.expGain > 0) {
            this.addExp(camp, settlement.expGain, cc.v2(camp === "A" ? -120 : 120, camp === "A" ? -70 : 70));
        }
        if (settlement.totalHeal <= 0) {
            return;
        }
        if (settlement.finalHeal <= 0) {
            return;
        }
        let crystal = this._crystals[camp];
        if (!crystal) {
            return;
        }
        crystal.hp = Math.min(crystal.maxHp, crystal.hp + settlement.finalHeal);
        this.refreshCrystalView(camp);
        this.showFloatText("+" + settlement.finalHeal + " HP", this.getNodePosition(crystal.node).add(cc.v2(0, 52)), new cc.Color(120, 240, 160, 255));
    }

    private getCampStats(camp: TurnCamp): TurnCampStats {
        if (!this._campStats) {
            this._campStats = {
                A: this.createCampStats(),
                B: this.createCampStats(),
            };
        }
        return this._campStats[camp];
    }

    private addExp(camp: TurnCamp, amount: number, position: cc.Vec2) {
        let stats = this.getCampStats(camp);
        stats.exp += amount;
        if (this._serverMode && camp === "A") {
            this._pendingBulletResult.expGain += amount;
        }
        this.showFloatText("+" + amount + " EXP", position, cc.Color.YELLOW);
        this.emitStatsChanged();
    }

    private increaseCrystalHp(camp: TurnCamp, amount: number) {
        let crystal = this._crystals[camp];
        if (!crystal) {
            return;
        }

        crystal.maxHp += amount;
        crystal.hp += amount;
        this.refreshCrystalView(camp);
    }

    private applyAssistZones(bullet: TurnBulletState, dt: number) {
        let bulletPosition = this.getNodePosition(bullet.node);
        bullet.damage = bullet.baseDamage;
        let nextSpreadZoneIds: string[] = [];
        let nextDamageBoostZoneIds: string[] = [];
        for (let i = 0; i < this._assistZones.length; i++) {
            let zone = this._assistZones[i];
            let zonePosition = zone.position || this.getNodePosition(zone.node);
            let offset = zonePosition.sub(bulletPosition);
            let distance = offset.mag();
            if (distance <= 1 || distance > zone.radius) {
                continue;
            }
            if (zone.type === "black_hole") {
                let zoneConfig = getTurnAssistZoneTypeConfig(zone.type, this._config);
                let ratio = 1 - distance / zone.radius;
                let strength = Math.max(0, Number(zoneConfig.blackHoleStrength) || 0) * Math.max(1, Number(bullet.blackHoleStrengthMultiplier) || 1);
                let curvePower = Math.max(0.1, Number(zoneConfig.blackHoleCurvePower) || 1);
                let maxOffsetPerTick = Math.max(0, Number(zoneConfig.blackHoleMaxOffsetPerTick) || 0);
                let curvedRatio = Math.pow(Math.max(0, ratio), curvePower);
                let offsetStep = strength * curvedRatio * dt;
                if (maxOffsetPerTick > 0) {
                    offsetStep = Math.min(offsetStep, maxOffsetPerTick);
                }
                bullet.dir = bullet.dir.add(offset.normalize().mul(offsetStep)).normalize();
                bullet.node.angle = this.vectorToAngle(bullet.dir) - 90;
            }
            else if (zone.type === "damage_boost") {
                nextDamageBoostZoneIds.push(zone.id);
            }
            else if (zone.type === "spread") {
                nextSpreadZoneIds.push(zone.id);
            }
        }
        for (let i = 0; i < bullet.currentSpreadZoneIds.length; i++) {
            let zoneId = bullet.currentSpreadZoneIds[i];
            if (nextSpreadZoneIds.indexOf(zoneId) >= 0) {
                continue;
            }
            if (bullet.hasTriggeredSpread || bullet.spreadTriggeredZoneIds.length > 0) {
                continue;
            }
            let spreadZone = this._assistZones.find((zone) => zone.id === zoneId && zone.type === "spread");
            if (spreadZone) {
                bullet.spreadTriggeredZoneIds.push(zoneId);
                bullet.hasTriggeredSpread = true;
                this.spawnSpreadBulletsFromZone(bullet, spreadZone);
                break;
            }
        }
        for (let i = 0; i < bullet.currentDamageBoostZoneIds.length; i++) {
            let zoneId = bullet.currentDamageBoostZoneIds[i];
            if (nextDamageBoostZoneIds.indexOf(zoneId) >= 0) {
                continue;
            }
            this.applyDamageBoostPassThrough(bullet, zoneId);
        }
        bullet.currentSpreadZoneIds = nextSpreadZoneIds;
        bullet.currentDamageBoostZoneIds = nextDamageBoostZoneIds;
        bullet.damage = Math.max(bullet.remainingDamage, Math.round(bullet.baseDamage * bullet.damageMultiplier));
    }

    private applyFirstBounceDamageBoostIfNeeded(bullet: TurnBulletState) {
        let multiplier = Math.max(1, Number(bullet.firstBounceDamageMultiplier) || 1);
        if (!bullet || bullet.firstBounceDamageBoostApplied || multiplier <= 1) {
            return;
        }
        bullet.baseDamage = Math.max(0, Math.round((Number(bullet.baseDamage) || 0) * multiplier));
        bullet.damage = Math.max(0, Math.round(bullet.baseDamage * Math.max(1, Number(bullet.damageMultiplier) || 1)));
        bullet.remainingDamage = Math.max(0, Math.round(bullet.remainingDamage * multiplier));
        bullet.firstBounceDamageBoostApplied = true;
    }

    private keepBulletInMap(bullet: TurnBulletState): boolean {
        let rect = this.getMapRect();
        let position = this.getNodePosition(bullet.node);
        if (rect.contains(position)) {
            return true;
        }
        if (bullet.bounceLeft <= 0) {
            return false;
        }

        let minX = rect.x + bullet.radius;
        let maxX = rect.x + rect.width - bullet.radius;
        let minY = rect.y + bullet.radius;
        let maxY = rect.y + rect.height - bullet.radius;
        let bounced = false;
        if (position.x < minX || position.x > maxX) {
            bullet.dir.x *= -1;
            position.x = Math.max(minX, Math.min(maxX, position.x));
            bounced = true;
        }
        if (position.y < minY || position.y > maxY) {
            bullet.dir.y *= -1;
            position.y = Math.max(minY, Math.min(maxY, position.y));
            bounced = true;
        }

        if (bounced) {
            bullet.bounceLeft -= 1;
            bullet.hasBounced = true;
            this.applyFirstBounceDamageBoostIfNeeded(bullet);
            bullet.node.setPosition(position.x, position.y);
            bullet.node.angle = this.vectorToAngle(bullet.dir) - 90;
        }
        return true;
    }

    private tryConsumeBounce(bullet: TurnBulletState, rect: cc.Rect): boolean {
        if (bullet.bounceLeft <= 0) {
            return true;
        }
        this.reflectBulletOffRect(bullet, rect);
        bullet.bounceLeft = Math.max(0, bullet.bounceLeft - 1);
        bullet.hasBounced = true;
        this.applyFirstBounceDamageBoostIfNeeded(bullet);
        return false;
    }

    private getBuildCampAt(position: cc.Vec2): TurnCamp {
        let areaA = this.getBuildArea("A");
        let areaB = this.getBuildArea("B");
        if (areaA && areaA.contains(position)) {
            return "A";
        }
        if (areaB && areaB.contains(position)) {
            return "B";
        }
        return null;
    }

    private findObstacleAt(position: cc.Vec2): TurnObstacleState {
        for (let i = this._obstacles.length - 1; i >= 0; i--) {
            let obstacle = this._obstacles[i];
            if (this.getHitDynamicObstacleCell(obstacle, position, 1)) {
                return obstacle;
            }
        }
        return null;
    }

    private getNodePosition(node: cc.Node): cc.Vec2 {
        return cc.v2(node.x, node.y);
    }

    private getLocalTouchPosition(event: cc.Event.EventTouch): cc.Vec2 {
        let root = this.contentRoot || this.node;
        return root.convertToNodeSpaceAR(event.getLocation());
    }

    private vectorToAngle(dir: cc.Vec2): number {
        let radian = cc.v2(dir).signAngle(cc.v2(1, 0));
        return -cc.misc.radiansToDegrees(radian);
    }

    private showFloatText(text: string, position: cc.Vec2, color: cc.Color) {
        let label = this.createLabel(text, 18);
        label.node.parent = this._effectLayer || this.contentRoot;
        label.node.setPosition(position);
        label.node.color = color;
        label.node.opacity = 230;
        label.node.runAction(cc.sequence(
            cc.spawn(cc.moveBy(0.55, 0, 34), cc.fadeOut(0.55)),
            cc.removeSelf(),
        ));
    }

    private playMissileSiloEvent(event: any) {
        if (!event || !event.target) {
            return;
        }
        let target = cc.v2(Number(event.target.x) || 0, Number(event.target.y) || 0);
        let from = event.from ? cc.v2(Number(event.from.x) || target.x, Number(event.from.y) || target.y) : target.add(cc.v2(0, 180));
        let layer = this._effectLayer || this.contentRoot;
        if (!layer) {
            return;
        }

        let trail = new cc.Node("MissileTrail");
        trail.parent = layer;
        trail.setPosition(from.x, from.y);
        let trailGraphics = trail.addComponent(cc.Graphics);
        trailGraphics.strokeColor = new cc.Color(255, 214, 120, 220);
        trailGraphics.lineWidth = 3;
        trailGraphics.moveTo(0, 0);
        trailGraphics.lineTo(target.x - from.x, target.y - from.y);
        trailGraphics.stroke();
        trail.runAction(cc.sequence(cc.delayTime(0.18), cc.fadeOut(0.18), cc.removeSelf()));

        let explosion = new cc.Node("MissileExplosion");
        explosion.parent = layer;
        explosion.setPosition(target.x, target.y);
        let graphics = explosion.addComponent(cc.Graphics);
        let cellSize = this._dynamicObstacleSize.width || this._config.obstacleRadius || 32;
        let radiusCells = Math.max(0, Math.floor(Number(event.radiusCells) || 1));
        let radius = Math.max(cellSize * 0.5, (radiusCells + 0.5) * cellSize);
        graphics.fillColor = new cc.Color(255, 96, 48, 95);
        graphics.circle(0, 0, radius);
        graphics.fill();
        graphics.strokeColor = new cc.Color(255, 226, 120, 230);
        graphics.lineWidth = 3;
        graphics.circle(0, 0, radius);
        graphics.stroke();
        explosion.runAction(cc.sequence(cc.spawn(cc.scaleTo(0.28, 1.35), cc.fadeOut(0.28)), cc.removeSelf()));
        this.showFloatText("导弹爆炸 -" + (Number(event.damage) || 10), target.add(cc.v2(0, 28)), cc.Color.ORANGE);
    }

    private createLabel(text: string, size: number): cc.Label {
        let node = new cc.Node("Label");
        let label = node.addComponent(cc.Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size + 4;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        return label;
    }

    private emitStatsChanged() {
        if (this.onStatsChanged) {
            this.onStatsChanged();
        }
    }

    private emitBulletsCleared() {
        if (this.onBulletsCleared) {
            this.onBulletsCleared();
        }
    }

    private syncCrystalState(camp: TurnCamp, state: any) {
        let crystal = this._crystals[camp];
        if (!crystal || !state) {
            return;
        }
        crystal.hp = Math.max(0, Number(state.hp) || 0);
        crystal.maxHp = Math.max(crystal.hp, Number(state.maxHp) || crystal.hp);
        this.refreshCrystalView(camp);
    }

    private syncObstacleState(obstacles: any[]) {
        this.clearAllDynamicObstacles();
        let camps: TurnCamp[] = ["A", "B"];
        for (let campIndex = 0; campIndex < camps.length; campIndex++) {
            let campSlots = this._obstacleInventory[camps[campIndex]] || [];
            for (let slotIndex = 0; slotIndex < campSlots.length; slotIndex++) {
                campSlots[slotIndex].placed = false;
                campSlots[slotIndex].placedObstacleId = "";
            }
        }
        let maxId = this._nextObstacleId;
        for (let j = 0; j < obstacles.length; j++) {
            let obstacle = obstacles[j];
            if (!obstacle) {
                continue;
            }
            let id = String(obstacle.id);
            this.createBuildObstacle(
                obstacle.camp,
                cc.v2(Number(obstacle.x) || 0, Number(obstacle.y) || 0),
                id,
                String(obstacle.originSlotId || obstacle.slotId || ""),
                (obstacle.slotType || "normal") as TurnObstacleResourceType,
                obstacle,
            );
            let numericId = parseInt(id, 10);
            if (Number.isFinite(numericId)) {
                maxId = Math.max(maxId, numericId + 1);
            }
        }
        this._nextObstacleId = maxId;
        this.getCampStats("A").energyTowers = this.countPlacedEnergyTowers("A");
        this.getCampStats("B").energyTowers = this.countPlacedEnergyTowers("B");
    }

    private clearAllDynamicObstacles() {
        for (let i = 0; i < this._obstacles.length; i++) {
            this._obstacles[i].node.destroy();
        }
        this._obstacles = [];
        this.getCampStats("A").energyTowers = 0;
        this.getCampStats("B").energyTowers = 0;
    }

    private syncAssistZoneState(zones: any[]) {
        for (let i = 0; i < this._assistZones.length; i++) {
            this._assistZones[i].node.destroy();
        }
        this._assistZones = [];
        let maxId = this._nextAssistZoneId;
        for (let j = 0; j < zones.length; j++) {
            let zone = zones[j];
            if (!zone) {
                continue;
            }
            let id = String(zone.id);
            this.createAssistZone(
                "A",
                (zone.zoneType || zone.type || "black_hole") as TurnAssistZoneType,
                cc.v2(Number(zone.x) || 0, Number(zone.y) || 0),
                id,
                Number(zone.radius) || 0,
                zone.extra || null,
            );
            let numericId = parseInt(id, 10);
            if (Number.isFinite(numericId)) {
                maxId = Math.max(maxId, numericId + 1);
            }
        }
        this._nextAssistZoneId = maxId;
    }

    private syncTankPoseState(tankPoses: any) {
        if (!tankPoses) {
            return;
        }
        let camps: TurnCamp[] = ["A", "B"];
        for (let i = 0; i < camps.length; i++) {
            let camp = camps[i];
            let pose = tankPoses[camp];
            if (!pose) {
                continue;
            }
            this.applyServerTankPose({
                camp: camp,
                pose: pose,
            });
        }
    }

    private resetPendingBulletResult() {
        this._pendingBulletResult.hitType = "";
        this._pendingBulletResult.targetCamp = "";
        this._pendingBulletResult.targetId = "";
        this._pendingBulletResult.damage = 0;
        this._pendingBulletResult.obstacleHits = [];
        this._pendingBulletResult.destroyedIds = [];
        this._pendingBulletResult.destroyedCells = [];
        this._pendingBulletResult.expGain = 0;
    }

    private emitTurnEvent(eventName: string, data: any) {
        if (typeof yyp !== "undefined" && yyp.eventCenter) {
            yyp.eventCenter.emit(eventName, data);
        }
    }

    private initTiledMap(): boolean {
        if (!this.tiledMapPrefab) {
            cc.error("[TurnBattleMap] tiledMapPrefab is null, cannot init turn battle map.");
            return false;
        }

        let mapNode = cc.instantiate(this.tiledMapPrefab);
        if (!mapNode) {
            return false;
        }

        this.stripLegacyGameMapComponent(mapNode);
        mapNode.name = "TurnTiledMap";
        mapNode.parent = this.node;
        mapNode.setPosition(0, 0);
        this.contentRoot = mapNode;
        this._mapNode = mapNode;
        this._tiledMap = this.findTiledMapComponent(mapNode);
        if (!this._tiledMap) {
            mapNode.destroy();
            this.contentRoot = this.node;
            this._mapNode = null;
            return false;
        }

        let mapSize = this._tiledMap.getMapSize();
        let tileSize = this._tiledMap.getTileSize();
        this._mapTileSize = cc.size(mapSize.width, mapSize.height);
        this._tileSize = cc.size(tileSize.width, tileSize.height);
        this._mapPixelSize = cc.size(mapSize.width * tileSize.width, mapSize.height * tileSize.height);
        this.contentRoot.setContentSize(this._mapPixelSize);
        this.node.setContentSize(this._mapPixelSize);
        this.node.scale = 1;

        this.parseTurnPoints();
        this.parseTurnAreas();
        this.parseStaticObstacles();
        this.refreshStaticObstacleSelection();
        this.ensureRuntimeLayers();
        this.renderStaticObstacles();
        this.fitMapToView();
        this.logMapInitResult();
        return true;
    }

    private initDebugFallback() {
        this.contentRoot = this.node;
        this._mapNode = this.node;
        this._mapPixelSize = cc.size(this._config.mapWidth, this._config.mapHeight);
        this.node.setContentSize(this._mapPixelSize);
        this.node.scale = 1;
        this.ensureRuntimeLayers();
        this.drawBoard();
        this.renderStaticObstacles();
        this.fitMapToView();
    }

    private ensureRuntimeLayers() {
        this._staticObstacleLayer = this.ensureLayerNode("TurnStaticObstacleLayer", 5);
        this._obstacleLayer = this.ensureLayerNode("TurnObstacleLayer", 10);
        this._bulletLayer = this.ensureLayerNode("TurnBulletLayer", 20);
        this._zoneLayer = this.ensureLayerNode("TurnZoneLayer", 30);
        this._effectLayer = this.ensureLayerNode("TurnEffectLayer", 40);
        this.ensureBuildOverlayLayers();
    }

    private ensureBuildOverlayLayers() {
        this._buildOverlayLayer = this.ensureLayerNode("TurnBuildOverlayLayer", 12);
        this._buildHighlightLayer = this.ensureChildLayer(this._buildOverlayLayer, "TurnBuildHighlightLayer", 0);
        this._buildPreviewLayer = this.ensureChildLayer(this._buildOverlayLayer, "TurnBuildPreviewLayer", 5);
    }

    private ensureChildLayer(parent: cc.Node, name: string, zIndex: number): cc.Node {
        if (!parent) {
            return null;
        }
        let node = parent.getChildByName(name);
        if (!node) {
            node = new cc.Node(name);
            node.parent = parent;
        }
        node.zIndex = zIndex;
        node.setPosition(0, 0);
        return node;
    }

    private ensureLayerNode(name: string, zIndex: number): cc.Node {
        let node = this.contentRoot.getChildByName(name);
        if (!node) {
            node = new cc.Node(name);
            node.parent = this.contentRoot;
        }
        node.zIndex = zIndex;
        node.setPosition(0, 0);
        return node;
    }

    private renderStaticObstacles() {
        if (!this._staticObstacleLayer) {
            return;
        }
        this._staticObstacleLayer.removeAllChildren();
        for (let i = 0; i < this._staticObstacles.length; i++) {
            let obstacle = this._staticObstacles[i];
            let node = new cc.Node("StaticObstacle" + obstacle.id);
            node.parent = this._staticObstacleLayer;
            node.setPosition(obstacle.rect.x + obstacle.rect.width / 2, obstacle.rect.y + obstacle.rect.height / 2);

            let graphics = node.addComponent(cc.Graphics);
            graphics.fillColor = new cc.Color(84, 92, 104, 255);
            graphics.rect(-obstacle.rect.width / 2, -obstacle.rect.height / 2, obstacle.rect.width, obstacle.rect.height);
            graphics.fill();
            graphics.strokeColor = new cc.Color(190, 198, 214, 180);
            graphics.lineWidth = 2;
            graphics.rect(-obstacle.rect.width / 2, -obstacle.rect.height / 2, obstacle.rect.width, obstacle.rect.height);
            graphics.stroke();
        }
    }

    private findTiledMapComponent(root: cc.Node): cc.TiledMap {
        let tiledMap = root.getComponent(cc.TiledMap);
        if (tiledMap) {
            return tiledMap;
        }

        for (let i = 0; i < root.childrenCount; i++) {
            let childMap = this.findTiledMapComponent(root.children[i]);
            if (childMap) {
                return childMap;
            }
        }
        return null;
    }

    private stripLegacyGameMapComponent(root: cc.Node) {
        let legacyGameMap = root.getComponent(GameMap);
        if (legacyGameMap) {
            legacyGameMap.enabled = false;
            root.removeComponent(legacyGameMap);
        }
        for (let i = 0; i < root.childrenCount; i++) {
            this.stripLegacyGameMapComponent(root.children[i]);
        }
    }

    private parseTurnPoints() {
        let objectGroup = this.findObjectGroupByTrimmedName("_tmLayerTurnPoints");
        if (objectGroup) {
            this._pointSource = "_tmLayerTurnPoints";
            this.readSpawnPointsFromGroup(objectGroup);
        }
        else {
            objectGroup = this.findObjectGroupByTrimmedName("_tmLayerBorn");
            if (objectGroup) {
                this._pointSource = "_tmLayerBorn";
                this.readSpawnPointsFromGroup(objectGroup);
            }
        }
        this.ensureFallbackSpawnPoint("crystalA");
        this.ensureFallbackSpawnPoint("crystalB");
        this.ensureFallbackSpawnPoint("tankA");
        this.ensureFallbackSpawnPoint("tankB");
        this.normalizeCampSpawnPointOrder("tank");
        this.normalizeCampSpawnPointOrder("crystal");
    }

    private parseTurnAreas() {
        let objectGroup = this.findObjectGroupByTrimmedName("_tmLayerTurnAreas");
        let areaRects: { [name: string]: cc.Rect[] } = {
            roadA: [],
            roadB: [],
            buildA: [],
            buildB: [],
        };
        if (objectGroup) {
            let objects = this.getObjectGroupObjects(objectGroup);
            for (let i = 0; i < objects.length; i++) {
                let item: any = objects[i];
                if (!item || !item.name) {
                    continue;
                }
                let rect = this.tiledObjectToGameRect(item);
                if (rect.width <= 0 || rect.height <= 0) {
                    continue;
                }
                if (item.name === "noBuild") {
                    this._noBuildAreas.push(rect);
                    continue;
                }
                if (areaRects[item.name]) {
                    areaRects[item.name].push(rect);
                }
            }
        }

        let explicitRoadA = areaRects.roadA.length > 0 ? this.pickClosestRect(areaRects.roadA, this._config.roadY.A) : null;
        let explicitRoadB = areaRects.roadB.length > 0 ? this.pickClosestRect(areaRects.roadB, this._config.roadY.B) : null;
        let roadRects = areaRects.roadA.concat(areaRects.roadB);
        this._roads.A = explicitRoadA || this.pickClosestRect(roadRects, this._config.roadY.A) || this.deriveRoadRect("A");
        this._roads.B = explicitRoadB || this.pickClosestRect(roadRects, this._config.roadY.B, this._roads.A) || this.deriveRoadRect("B");
        this.normalizeRoadOrder();
        this.deriveLayerAreas();

        if (areaRects.buildA.length > 0) {
            this._buildAreas.A = this.pickClosestRect(areaRects.buildA, this._buildAreas.A ? this._buildAreas.A.y : this._config.crystalY.A) || this._buildAreas.A;
        }
        if (areaRects.buildB.length > 0) {
            this._buildAreas.B = this.pickClosestRect(areaRects.buildB, this._buildAreas.B ? this._buildAreas.B.y : this._config.crystalY.B) || this._buildAreas.B;
        }

        let hasRoadObjects = areaRects.roadA.length + areaRects.roadB.length > 0;
        let hasBuildObjects = areaRects.buildA.length + areaRects.buildB.length > 0;
        this._roadSource = hasRoadObjects ? "_tmLayerTurnAreas" : "derived";
        this._buildSource = hasBuildObjects ? "_tmLayerTurnAreas override + derived bands" : "derived bands";
        if (hasRoadObjects && (!this._roads.A || !this._roads.B)) {
            this._roadSource = "partial _tmLayerTurnAreas + derived";
        }
    }

    private parseStaticObstacles() {
        let objectGroup = this.findObjectGroupByTrimmedName("_tmLayerObstacle");
        if (objectGroup) {
            let objects = this.getObjectGroupObjects(objectGroup);
            for (let i = 0; i < objects.length; i++) {
                let item: any = objects[i];
                if (!item || !this.isStaticObstacleObject(item)) {
                    continue;
                }
                let rect = this.tiledObjectToGameRect(item);
                if (rect.width <= 0 || rect.height <= 0) {
                    continue;
                }
                this._staticObstacleSeeds.push({
                    id: this._nextStaticObstacleId++,
                    name: item && item.name ? item.name : "obstacle",
                    rect: rect,
                });
            }
            if (this._staticObstacleSeeds.length > 0) {
                return;
            }
        }

        let tileLayer = this.findLayerByTrimmedName("_tmLayerObstacle");
        if (!tileLayer) {
            return;
        }

        let mapSize = this._tiledMap.getMapSize();
        for (let x = 0; x < mapSize.width; x++) {
            for (let y = 0; y < mapSize.height; y++) {
                if (!tileLayer.getTileGIDAt(x, y)) {
                    continue;
                }
                let center = this.tileToGamePos(cc.v2(x, y));
                this._staticObstacleSeeds.push({
                    id: this._nextStaticObstacleId++,
                    name: "tileObstacle",
                    rect: cc.rect(
                        center.x - this._tileSize.width / 2,
                        center.y - this._tileSize.height / 2,
                        this._tileSize.width,
                        this._tileSize.height,
                    ),
                });
            }
        }
    }

    private refreshStaticObstacleSelection() {
        let fixedObstacles: TurnStaticObstacleState[] = [];
        let candidateObstacles: TurnStaticObstacleState[] = [];
        for (let i = 0; i < this._staticObstacleSeeds.length; i++) {
            let obstacle = this._staticObstacleSeeds[i];
            if (this.isAssistRandomStaticObstacleCandidate(obstacle)) {
                candidateObstacles.push(obstacle);
            }
            else {
                fixedObstacles.push(this.cloneStaticObstacleState(obstacle));
            }
        }
        this._staticObstacles = fixedObstacles.concat(this.pickRandomStaticObstacleCandidates(candidateObstacles));
    }

    private applyServerStaticObstacleState(staticObstacles: any[]) {
        let fixedObstacles: TurnStaticObstacleState[] = [];
        for (let i = 0; i < this._staticObstacleSeeds.length; i++) {
            let obstacle = this._staticObstacleSeeds[i];
            if (!this.isAssistRandomStaticObstacleCandidate(obstacle)) {
                fixedObstacles.push(this.cloneStaticObstacleState(obstacle));
            }
        }

        let activeAssistObstacles: TurnStaticObstacleState[] = [];
        for (let j = 0; j < staticObstacles.length; j++) {
            let item = staticObstacles[j];
            let rect = cc.rect(
                Number(item && item.x) || 0,
                Number(item && item.y) || 0,
                Math.max(0, Number(item && item.width) || 0),
                Math.max(0, Number(item && item.height) || 0),
            );
            if (rect.width <= 0 || rect.height <= 0) {
                continue;
            }
            activeAssistObstacles.push({
                id: 10000 + j,
                name: String(item && item.name ? item.name : "qiang"),
                rect: rect,
            });
        }
        this._staticObstacles = fixedObstacles.concat(activeAssistObstacles);
        this.renderStaticObstacles();
    }

    private isAssistRandomStaticObstacleCandidate(obstacle: TurnStaticObstacleState): boolean {
        if (!obstacle || !this._assistArea) {
            return false;
        }
        if (obstacle.name !== "qiang") {
            return false;
        }
        return this.rectContainsRect(this._assistArea, obstacle.rect);
    }

    private pickRandomStaticObstacleCandidates(candidates: TurnStaticObstacleState[]): TurnStaticObstacleState[] {
        if (!candidates || candidates.length <= 0) {
            return [];
        }
        let shuffled = candidates.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            let swapIndex = Math.floor(Math.random() * (i + 1));
            let temp = shuffled[i];
            shuffled[i] = shuffled[swapIndex];
            shuffled[swapIndex] = temp;
        }
        // let count = Math.min(shuffled.length, 4 + Math.floor(Math.random() * 5));
        let count = Math.min(shuffled.length, 8);
        let result: TurnStaticObstacleState[] = [];
        for (let i = 0; i < count; i++) {
            result.push(this.cloneStaticObstacleState(shuffled[i]));
        }
        return result;
    }

    private cloneStaticObstacleState(obstacle: TurnStaticObstacleState): TurnStaticObstacleState {
        return {
            id: obstacle.id,
            name: obstacle.name,
            rect: cc.rect(obstacle.rect.x, obstacle.rect.y, obstacle.rect.width, obstacle.rect.height),
        };
    }

    private getSpawnPosition(name: string, fallback: cc.Vec2): cc.Vec2 {
        return this._spawnPoints[name] ? cc.v2(this._spawnPoints[name]) : fallback;
    }

    private getBuildArea(camp: TurnCamp): cc.Rect {
        return this._buildAreas[camp] || this._config.buildArea[camp];
    }

    private getRoadRect(camp: TurnCamp): cc.Rect {
        if (this._roads[camp]) {
            return this._roads[camp];
        }
        return cc.rect(-this._config.mapWidth / 2, this._config.roadY[camp] - 18, this._config.mapWidth, 36);
    }

    private getRoadCenterY(camp: TurnCamp): number {
        let road = this.getRoadRect(camp);
        return road.y + road.height / 2;
    }

    private getRoadCenterPosition(camp: TurnCamp): cc.Vec2 {
        let road = this.getRoadRect(camp);
        return cc.v2(road.x + road.width / 2, road.y + road.height / 2);
    }

    private snapBuildPosition(position: cc.Vec2): cc.Vec2 {
        let tile = this.worldToTile(position);
        if (!tile) {
            return cc.v2(position);
        }
        return this.tileToGamePos(tile);
    }

    private getDynamicObstacleRectsAt(position: cc.Vec2, layout?: cc.Vec2[], slotType: TurnObstacleResourceType = "normal"): cc.Rect[] {
        let cells = this.normalizeObstacleLayout(slotType, layout);
        let cellSize = this._dynamicObstacleSize.width;
        let result: cc.Rect[] = [];
        for (let i = 0; i < cells.length; i++) {
            let cell = cells[i];
            result.push(cc.rect(
                position.x + cell.x * cellSize - cellSize / 2,
                position.y + cell.y * cellSize - cellSize / 2,
                cellSize,
                cellSize,
            ));
        }
        return result;
    }

    private getDynamicObstacleRects(obstacle: TurnObstacleState): cc.Rect[] {
        return this.getDynamicObstacleRectsAt(this.getNodePosition(obstacle.node), obstacle.layout, obstacle.slotType);
    }

    private getDynamicObstacleRectAt(position: cc.Vec2, layout?: cc.Vec2[], slotType: TurnObstacleResourceType = "normal"): cc.Rect {
        return this.getRectsBounds(this.getDynamicObstacleRectsAt(position, layout, slotType));
    }

    private getDynamicObstacleRect(obstacle: TurnObstacleState): cc.Rect {
        return this.getRectsBounds(this.getDynamicObstacleRects(obstacle));
    }

    private rectOverlaps(a: cc.Rect, b: cc.Rect): boolean {
        return a.x < b.x + b.width
            && a.x + a.width > b.x
            && a.y < b.y + b.height
            && a.y + a.height > b.y;
    }

    private rectContainsRect(container: cc.Rect, child: cc.Rect): boolean {
        return child.x >= container.x
            && child.y >= container.y
            && child.x + child.width <= container.x + container.width
            && child.y + child.height <= container.y + container.height;
    }

    private rectsOverlapAny(rects: cc.Rect[], target: cc.Rect): boolean {
        for (let i = 0; i < rects.length; i++) {
            if (this.rectOverlaps(rects[i], target)) {
                return true;
            }
        }
        return false;
    }

    private getRectsBounds(rects: cc.Rect[]): cc.Rect {
        if (!rects || rects.length <= 0) {
            return cc.rect(0, 0, this._dynamicObstacleSize.width, this._dynamicObstacleSize.height);
        }
        let minX = rects[0].x;
        let minY = rects[0].y;
        let maxX = rects[0].x + rects[0].width;
        let maxY = rects[0].y + rects[0].height;
        for (let i = 1; i < rects.length; i++) {
            minX = Math.min(minX, rects[i].x);
            minY = Math.min(minY, rects[i].y);
            maxX = Math.max(maxX, rects[i].x + rects[i].width);
            maxY = Math.max(maxY, rects[i].y + rects[i].height);
        }
        return cc.rect(minX, minY, maxX - minX, maxY - minY);
    }

    private getLayoutBounds(layout: cc.Vec2[]): { minX: number; minY: number; maxX: number; maxY: number } {
        let cells = layout && layout.length > 0 ? layout : [cc.v2(0, 0)];
        let minX = cells[0].x;
        let minY = cells[0].y;
        let maxX = cells[0].x;
        let maxY = cells[0].y;
        for (let i = 1; i < cells.length; i++) {
            minX = Math.min(minX, cells[i].x);
            minY = Math.min(minY, cells[i].y);
            maxX = Math.max(maxX, cells[i].x);
            maxY = Math.max(maxY, cells[i].y);
        }
        return { minX, minY, maxX, maxY };
    }

    private circleRectIntersects(center: cc.Vec2, radius: number, rect: cc.Rect): boolean {
        let nearestX = Math.max(rect.x, Math.min(center.x, rect.x + rect.width));
        let nearestY = Math.max(rect.y, Math.min(center.y, rect.y + rect.height));
        let dx = center.x - nearestX;
        let dy = center.y - nearestY;
        return dx * dx + dy * dy <= radius * radius;
    }

    private getHitDynamicObstacleCell(obstacle: TurnObstacleState, center: cc.Vec2, radius: number): { cellIndex: number; rect: cc.Rect } {
        let rects = this.getDynamicObstacleRects(obstacle);
        for (let i = 0; i < rects.length; i++) {
            if (this.circleRectIntersects(center, radius, rects[i])) {
                return { cellIndex: i, rect: rects[i] };
            }
        }
        return null;
    }

    private sumObstacleCellHp(obstacle: TurnObstacleState): number {
        let total = 0;
        for (let i = 0; i < obstacle.cellHp.length; i++) {
            total += Math.max(0, obstacle.cellHp[i] || 0);
        }
        return total;
    }

    private applyObstacleCellDamage(obstacle: TurnObstacleState, cellIndex: number, rawDamage: number): number {
        if (!obstacle || cellIndex < 0 || cellIndex >= obstacle.cellHp.length) {
            return 0;
        }
        let damage = Math.max(0, Math.floor(Number(rawDamage) || 0));
        if (damage <= 0) {
            return 0;
        }
        let before = Math.max(0, Number(obstacle.cellHp[cellIndex]) || 0);
        let after = Math.max(0, before - damage);
        obstacle.cellHp[cellIndex] = after;
        obstacle.hp = this.sumObstacleCellHp(obstacle);
        obstacle.maxHp = this.resolveObstacleMaxHp(obstacle.slotType, obstacle.resourceCount, obstacle.maxHp, obstacle.camp);
        return before - after;
    }

    private redrawObstacle(obstacle: TurnObstacleState) {
        let graphics = obstacle.node.getComponent(cc.Graphics);
        if (graphics) {
            graphics.clear();
            this.drawObstacleGraphics(graphics, obstacle.camp, true, obstacle.slotType, obstacle.layout, obstacle.mirrorDir);
        }
    }

    private getResourceHpBaseAndMax(slotType: TurnObstacleResourceType): { baseHp: number; maxHp: number } {
        let rule = this._config.obstacleHpRules && this._config.obstacleHpRules[slotType];
        let baseHp = Math.max(1, Number(rule && rule.baseHp) || (slotType === "mirror" ? 10 : this._config.obstacleBaseHp));
        let maxHp = Math.max(baseHp, Number(rule && rule.maxHp) || (slotType === "mirror" ? baseHp : this._config.obstacleMaxHp));
        return { baseHp: baseHp, maxHp: maxHp };
    }

    private getResourceHpUpgradeBonus(camp: TurnCamp, slotType: TurnObstacleResourceType): number {
        if (!camp || slotType === "mirror" || slotType === "attack" || slotType === "missile_silo" || slotType === "coin") {
            return 0;
        }
        let stats = this.getCampStats(camp);
        let bonusMap = stats.derivedUpgrades && stats.derivedUpgrades.resourceHpBonusByType;
        return Math.max(0, Math.floor(Number(bonusMap && bonusMap[slotType]) || 0));
    }

    private getObstacleMaxHp(slotType: TurnObstacleResourceType, resourceCount: number, camp?: TurnCamp): number {
        if (slotType === "normal") {
            let rule = this.getResourceHpBaseAndMax(slotType);
            let baseHp = Math.min(rule.maxHp, rule.baseHp + this.getResourceHpUpgradeBonus(camp, slotType));
            return baseHp * Math.max(1, resourceCount);
        }
        if (slotType === "mirror") {
            let rule = this.getResourceHpBaseAndMax(slotType);
            return rule.baseHp * Math.max(1, resourceCount);
        }
        if (slotType === "exp") {
            let rule = this.getResourceHpBaseAndMax(slotType);
            let baseHp = Math.min(rule.maxHp, rule.baseHp + this.getResourceHpUpgradeBonus(camp, slotType));
            return baseHp * Math.max(1, resourceCount);
        }
        if (slotType === "energy") {
            let rule = this.getResourceHpBaseAndMax(slotType);
            let baseHp = Math.min(rule.maxHp, rule.baseHp + this.getResourceHpUpgradeBonus(camp, slotType));
            return baseHp * Math.max(1, resourceCount);
        }
        if (slotType === "bleed") {
            let rule = this.getResourceHpBaseAndMax(slotType);
            let baseHp = Math.min(rule.maxHp, rule.baseHp + this.getResourceHpUpgradeBonus(camp, slotType));
            return baseHp * Math.max(1, resourceCount);
        }
        if (slotType === "bullet") {
            let rule = this.getResourceHpBaseAndMax(slotType);
            let baseHp = Math.min(rule.maxHp, rule.baseHp + this.getResourceHpUpgradeBonus(camp, slotType));
            return baseHp * Math.max(1, resourceCount);
        }
        if (slotType === "attack") {
            let rule = this.getResourceHpBaseAndMax(slotType);
            return rule.baseHp * Math.max(1, resourceCount);
        }
        if (slotType === "missile_silo") {
            let rule = this.getResourceHpBaseAndMax(slotType);
            return rule.baseHp * Math.max(1, resourceCount);
        }
        if (slotType === "coin") {
            let rule = this.getResourceHpBaseAndMax(slotType);
            return rule.baseHp * Math.max(1, resourceCount);
        }
        return Math.min(this._config.obstacleMaxHp, this._config.obstacleBaseHp * Math.max(1, resourceCount));
    }

    private getObstacleCellMaxHp(slotType: TurnObstacleResourceType, camp?: TurnCamp): number {
        if (slotType === "mirror") {
            return this.getResourceHpBaseAndMax(slotType).baseHp;
        }
        if (slotType === "normal") {
            let rule = this.getResourceHpBaseAndMax(slotType);
            return Math.min(rule.maxHp, rule.baseHp + this.getResourceHpUpgradeBonus(camp, slotType));
        }
        if (slotType === "energy") {
            let rule = this.getResourceHpBaseAndMax(slotType);
            return Math.min(rule.maxHp, rule.baseHp + this.getResourceHpUpgradeBonus(camp, slotType));
        }
        if (slotType === "bleed") {
            let rule = this.getResourceHpBaseAndMax(slotType);
            return Math.min(rule.maxHp, rule.baseHp + this.getResourceHpUpgradeBonus(camp, slotType));
        }
        if (slotType === "bullet") {
            let rule = this.getResourceHpBaseAndMax(slotType);
            return Math.min(rule.maxHp, rule.baseHp + this.getResourceHpUpgradeBonus(camp, slotType));
        }
        if (slotType === "attack") {
            return this.getResourceHpBaseAndMax(slotType).baseHp;
        }
        if (slotType === "missile_silo") {
            return this.getResourceHpBaseAndMax(slotType).baseHp;
        }
        if (slotType === "coin") {
            return this.getResourceHpBaseAndMax(slotType).baseHp;
        }
        return this.getObstacleMaxHp(slotType, 1, camp);
    }

    private resolveObstacleMaxHp(slotType: TurnObstacleResourceType, resourceCount: number, snapshotMaxHp?: number, camp?: TurnCamp): number {
        let configMax = this.getObstacleMaxHp(slotType, resourceCount, camp);
        if (!Number.isFinite(snapshotMaxHp)) {
            return configMax;
        }
        return Math.max(1, Math.min(configMax, Math.floor(snapshotMaxHp)));
    }

    private resolveObstacleHp(slotType: TurnObstacleResourceType, cellCount: number, snapshotHp: number, cellHp: number[], maxHp: number): number {
        let hpFromCells = 0;
        for (let i = 0; i < cellHp.length; i++) {
            hpFromCells += Math.max(0, Number(cellHp[i]) || 0);
        }
        if (!Number.isFinite(snapshotHp)) {
            return Math.max(0, Math.min(maxHp, hpFromCells));
        }
        let safeSnapshotHp = Math.max(0, Math.floor(snapshotHp));
        if (slotType === "normal") {
            return Math.max(0, Math.min(maxHp, hpFromCells));
        }
        if (slotType === "exp") {
            return Math.max(0, Math.min(maxHp, hpFromCells));
        }
        if (slotType === "energy") {
            return Math.max(0, Math.min(maxHp, hpFromCells));
        }
        if (slotType === "bleed") {
            return Math.max(0, Math.min(maxHp, hpFromCells));
        }
        if (slotType === "bullet") {
            return Math.max(0, Math.min(maxHp, hpFromCells));
        }
        if (slotType === "attack") {
            return Math.max(0, Math.min(maxHp, hpFromCells));
        }
        if (slotType === "mirror") {
            return Math.max(0, Math.min(maxHp, hpFromCells));
        }
        if (slotType === "missile_silo") {
            return Math.max(0, Math.min(maxHp, hpFromCells));
        }
        let minHp = cellCount > 0 ? 1 : 0;
        return Math.max(minHp, Math.min(maxHp, safeSnapshotHp));
    }

    private refreshObstacleHpLabel(obstacle: TurnObstacleState) {
        if (!obstacle || !obstacle.node) {
            return;
        }
        let children = obstacle.node.children ? obstacle.node.children.slice() : [];
        for (let i = 0; i < children.length; i++) {
            if (children[i].getComponent(cc.Label)) {
                children[i].destroy();
            }
        }
        let cellSize = this._dynamicObstacleSize.width;
        let layout = obstacle.layout && obstacle.layout.length > 0 ? obstacle.layout : [cc.v2(0, 0)];
        for (let i = 0; i < layout.length && i < obstacle.cellHp.length; i++) {
            let cell = layout[i];
            let hp = Math.max(0, Math.floor(Number(obstacle.cellHp[i]) || 0));
            let label = this.createLabel(String(hp), 14);
            label.node.name = "ObstacleCellHpLabel";
            label.node.parent = obstacle.node;
            label.node.setPosition(cell.x * cellSize, cell.y * cellSize);
            label.node.zIndex = 5;
            label.node.color = new cc.Color(255, 248, 220, 255);
        }
    }

    private getObstacleDestroyExp(obstacle: TurnObstacleState): number {
        return this._config.obstacleHitExp;
    }

    private clearObstaclePlacedSlot(obstacle: TurnObstacleState) {
        let slot = this.getObstacleSlotState(obstacle.camp, obstacle.originSlotId);
        if (slot && slot.placedObstacleId === obstacle.id) {
            slot.placed = false;
            slot.placedObstacleId = "";
        }
    }

    private tiledTopLeftToGamePos(tiledPos: cc.Vec2): cc.Vec2 {
        let pos = cc.v2(tiledPos.x, this._mapPixelSize.height - tiledPos.y);
        pos.x = pos.x - this._mapPixelSize.width / 2;
        pos.y = pos.y - this._mapPixelSize.height / 2;
        return pos;
    }

    private tileToGamePos(tile: cc.Vec2): cc.Vec2 {
        let x = tile.x * this._tileSize.width + this._tileSize.width / 2;
        let y = tile.y * this._tileSize.height + this._tileSize.height / 2;
        return this.tiledTopLeftToGamePos(cc.v2(x, y));
    }

    private worldToTile(position: cc.Vec2): cc.Vec2 {
        if (!position || this._tileSize.width <= 0 || this._tileSize.height <= 0 || this._mapTileSize.width <= 0 || this._mapTileSize.height <= 0) {
            return null;
        }
        let topLeftX = position.x + this._mapPixelSize.width / 2;
        let topLeftY = this._mapPixelSize.height / 2 - position.y;
        let tileX = Math.floor(topLeftX / this._tileSize.width);
        let tileY = Math.floor(topLeftY / this._tileSize.height);
        tileX = Math.max(0, Math.min(this._mapTileSize.width - 1, tileX));
        tileY = Math.max(0, Math.min(this._mapTileSize.height - 1, tileY));
        return cc.v2(tileX, tileY);
    }

    private tiledObjectToGameCenter(item: any): cc.Vec2 {
        let bounds = this.getTiledObjectBounds(item);
        return this.tiledTopLeftToGamePos(cc.v2(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2));
    }

    private tiledObjectToGameRect(item: any): cc.Rect {
        let bounds = this.getTiledObjectBounds(item);
        let center = this.tiledTopLeftToGamePos(cc.v2(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2));
        return cc.rect(center.x - bounds.width / 2, center.y - bounds.height / 2, bounds.width, bounds.height);
    }

    private getTiledObjectBounds(item: any): cc.Rect {
        let base = this.getTiledObjectOrigin(item);
        let minX = base.x;
        let maxX = base.x + (item && item.width ? item.width : 0);
        let minY = base.y;
        let maxY = base.y + (item && item.height ? item.height : 0);

        let points = item && item.polylinePoints && item.polylinePoints.length > 0
            ? item.polylinePoints
            : (item && item.polygonPoints ? item.polygonPoints : null);
        if (points && points.length > 0) {
            minX = base.x + points[0].x;
            maxX = minX;
            minY = base.y + points[0].y;
            maxY = minY;
            for (let i = 1; i < points.length; i++) {
                let px = base.x + points[i].x;
                let py = base.y + points[i].y;
                minX = Math.min(minX, px);
                maxX = Math.max(maxX, px);
                minY = Math.min(minY, py);
                maxY = Math.max(maxY, py);
            }
        }

        return cc.rect(minX, minY, Math.max(0, maxX - minX), Math.max(0, maxY - minY));
    }

    private getTiledObjectOrigin(item: any): cc.Vec2 {
        if (!item) {
            return cc.v2();
        }
        if (item.offset) {
            return cc.v2(item.offset.x || 0, item.offset.y || 0);
        }
        if (item.x != null && item.y != null) {
            return cc.v2(Number(item.x) || 0, Number(item.y) || 0);
        }
        return cc.v2();
    }

    private findObjectGroupByTrimmedName(name: string): cc.TiledObjectGroup {
        if (this._tiledMap) {
            let group = this._tiledMap.getObjectGroup(name);
            if (group) {
                return group;
            }
        }
        if (!this._mapNode) {
            return null;
        }
        let node = this.findChildByTrimmedName(this._mapNode, name);
        if (!node) {
            return null;
        }
        return node.getComponent(cc.TiledObjectGroup);
    }

    private findLayerByTrimmedName(name: string): cc.TiledLayer {
        if (!this._mapNode) {
            return null;
        }
        let node = this.findChildByTrimmedName(this._mapNode, name);
        if (!node) {
            return null;
        }
        return node.getComponent(cc.TiledLayer);
    }

    private findChildByTrimmedName(root: cc.Node, name: string): cc.Node {
        if (!root) {
            return null;
        }
        if (root.name && root.name.trim() === name) {
            return root;
        }
        for (let i = 0; i < root.childrenCount; i++) {
            let result = this.findChildByTrimmedName(root.children[i], name);
            if (result) {
                return result;
            }
        }
        return null;
    }

    private readSpawnPointsFromGroup(objectGroup: cc.TiledObjectGroup) {
        let objects = this.getObjectGroupObjects(objectGroup);
        for (let i = 0; i < objects.length; i++) {
            let item: any = objects[i];
            if (!item || !item.name) {
                continue;
            }
            let key = TURN_POINT_ALIAS[item.name];
            if (!key) {
                continue;
            }
            this._spawnPoints[key] = this.tiledObjectToGameCenter(item);
        }
    }

    private getObjectGroupObjects(objectGroup: cc.TiledObjectGroup): any[] {
        if (!objectGroup) {
            return [];
        }
        let groupAny: any = objectGroup as any;
        let objects = typeof groupAny.getObjects === "function" ? groupAny.getObjects() : null;
        if (Array.isArray(objects)) {
            return objects;
        }
        if (Array.isArray(groupAny._objects)) {
            return groupAny._objects;
        }
        cc.warn("[TurnBattleMap] object group has no readable objects array", objectGroup.node ? objectGroup.node.name : "unknown");
        return [];
    }

    private ensureFallbackSpawnPoint(name: string) {
        if (this._spawnPoints[name]) {
            return;
        }
        let fallback = this.createFallbackSpawnPoint(name);
        this._spawnPoints[name] = fallback;
        cc.warn("[TurnBattleMap] missing point " + name + ", using fallback point at", fallback);
    }

    private createFallbackSpawnPoint(name: string): cc.Vec2 {
        let mapRect = this.getMapRect();
        let centerX = 0;
        let crystalInset = Math.max(72, Math.min(128, this._mapPixelSize.height * 0.1));
        let tankInset = crystalInset + 96;
        if (name === "crystalA") {
            return cc.v2(centerX, mapRect.y + crystalInset);
        }
        if (name === "crystalB") {
            return cc.v2(centerX, mapRect.y + mapRect.height - crystalInset);
        }
        if (name === "tankA") {
            return cc.v2(centerX, mapRect.y + tankInset);
        }
        if (name === "tankB") {
            return cc.v2(centerX, mapRect.y + mapRect.height - tankInset);
        }
        return cc.v2();
    }

    private normalizeCampSpawnPointOrder(prefix: string) {
        let pointA = this._spawnPoints[prefix + "A"];
        let pointB = this._spawnPoints[prefix + "B"];
        if (!pointA || !pointB || pointA.y <= pointB.y) {
            return;
        }
        this._spawnPoints[prefix + "A"] = pointB;
        this._spawnPoints[prefix + "B"] = pointA;
    }

    private pickClosestRect(rects: cc.Rect[], targetY: number, usedRect?: cc.Rect): cc.Rect {
        let picked: cc.Rect = null;
        let minDistance = Number.MAX_VALUE;
        for (let i = 0; i < rects.length; i++) {
            let rect = rects[i];
            if (!rect) {
                continue;
            }
            if (usedRect && this.rectEquals(rect, usedRect)) {
                continue;
            }
            let centerY = rect.y + rect.height / 2;
            let distance = Math.abs(centerY - targetY);
            if (distance < minDistance) {
                minDistance = distance;
                picked = rect;
            }
        }
        return picked;
    }

    private deriveRoadRect(camp: TurnCamp): cc.Rect {
        let tankPosition = this.getSpawnPosition("tank" + camp, this.createFallbackSpawnPoint("tank" + camp));
        let bounds = this.getInteriorHorizontalBounds();
        let height = 48;
        return cc.rect(bounds.minX, tankPosition.y - height / 2, bounds.maxX - bounds.minX, height);
    }

    private deriveBuildRect(camp: TurnCamp): cc.Rect {
        let crystal = this.getSpawnPosition("crystal" + camp, this.createFallbackSpawnPoint("crystal" + camp));
        let mapRect = this.getMapRect();
        let bounds = this.getInteriorHorizontalBounds();
        let margin = 44;
        let minY = 0;
        let maxY = 0;
        if (crystal.y <= 0) {
            minY = Math.max(mapRect.y + 24, crystal.y + margin);
            maxY = -8;
        }
        else {
            minY = 8;
            maxY = Math.min(mapRect.y + mapRect.height - 24, crystal.y - margin);
        }
        if (maxY < minY) {
            let centerY = crystal.y <= 0 ? crystal.y + 100 : crystal.y - 100;
            minY = centerY - 60;
            maxY = centerY + 60;
        }
        return cc.rect(bounds.minX, minY, bounds.maxX - bounds.minX, Math.max(24, maxY - minY));
    }

    private normalizeRoadOrder() {
        if (!this._roads.A || !this._roads.B) {
            return;
        }
        let centerYA = this._roads.A.y + this._roads.A.height / 2;
        let centerYB = this._roads.B.y + this._roads.B.height / 2;
        if (centerYA > centerYB) {
            let tmp = this._roads.A;
            this._roads.A = this._roads.B;
            this._roads.B = tmp;
        }
    }

    private deriveLayerAreas() {
        let mapRect = this.getMapRect();
        let bounds = this.getInteriorHorizontalBounds();
        let roadA = this.getRoadRect("A");
        let roadB = this.getRoadRect("B");
        let assistMinY = roadA.y + roadA.height;
        let assistMaxY = roadB.y;
        if (assistMaxY <= assistMinY) {
            let thirdHeight = mapRect.height / 3;
            this._buildAreas.A = cc.rect(bounds.minX, mapRect.y, bounds.maxX - bounds.minX, thirdHeight);
            this._assistArea = cc.rect(bounds.minX, mapRect.y + thirdHeight, bounds.maxX - bounds.minX, thirdHeight);
            this._buildAreas.B = cc.rect(bounds.minX, mapRect.y + thirdHeight * 2, bounds.maxX - bounds.minX, thirdHeight);
            return;
        }

        let defaultBuildDepth = this._config.buildArea && this._config.buildArea.A
            ? this._config.buildArea.A.height
            : Math.max(24, (assistMaxY - assistMinY) / 4);
        let buildDepth = Math.max(24, Math.min(defaultBuildDepth, (assistMaxY - assistMinY) / 2));
        let roadAOnBottomEdge = roadA.y <= mapRect.y + 1;
        let roadBOnTopEdge = roadB.y + roadB.height >= mapRect.y + mapRect.height - 1;
        if (roadAOnBottomEdge || roadBOnTopEdge) {
            let buildAMinY = roadAOnBottomEdge ? roadA.y + roadA.height : mapRect.y;
            let buildAMaxY = Math.min(assistMaxY, buildAMinY + buildDepth);
            let buildBMaxY = roadBOnTopEdge ? roadB.y : mapRect.y + mapRect.height;
            let buildBMinY = Math.max(assistMinY, buildBMaxY - buildDepth);
            this._buildAreas.A = cc.rect(bounds.minX, buildAMinY, bounds.maxX - bounds.minX, Math.max(24, buildAMaxY - buildAMinY));
            this._assistArea = cc.rect(bounds.minX, buildAMaxY, bounds.maxX - bounds.minX, Math.max(24, buildBMinY - buildAMaxY));
            this._buildAreas.B = cc.rect(bounds.minX, buildBMinY, bounds.maxX - bounds.minX, Math.max(24, buildBMaxY - buildBMinY));
            return;
        }

        this._buildAreas.A = cc.rect(bounds.minX, mapRect.y, bounds.maxX - bounds.minX, Math.max(24, roadA.y - mapRect.y));
        this._assistArea = cc.rect(bounds.minX, assistMinY, bounds.maxX - bounds.minX, Math.max(24, assistMaxY - assistMinY));
        this._buildAreas.B = cc.rect(bounds.minX, roadB.y + roadB.height, bounds.maxX - bounds.minX, Math.max(24, mapRect.y + mapRect.height - (roadB.y + roadB.height)));
    }

    private getInteriorHorizontalBounds(): { minX: number; maxX: number } {
        let mapRect = this.getMapRect();
        let inset = Math.max(this._tileSize.width, 24);
        let minX = mapRect.x + inset;
        let maxX = mapRect.x + mapRect.width - inset;
        for (let i = 0; i < this._staticObstacles.length; i++) {
            let rect = this._staticObstacles[i].rect;
            if (rect.x <= mapRect.x + inset * 1.5) {
                minX = Math.max(minX, rect.x + rect.width);
            }
            if (rect.x + rect.width >= mapRect.x + mapRect.width - inset * 1.5) {
                maxX = Math.min(maxX, rect.x);
            }
        }
        if (maxX - minX < 120) {
            minX = mapRect.x + inset;
            maxX = mapRect.x + mapRect.width - inset;
        }
        return { minX: minX, maxX: maxX };
    }

    private isStaticObstacleObject(item: any): boolean {
        let name = item && item.name ? String(item.name) : "";
        if (!name) {
            return false;
        }
        if (name.toLowerCase() === "grass") {
            return false;
        }
        if (STATIC_OBSTACLE_NAME_RE.test(name)) {
            return true;
        }
        return true;
    }

    private rectEquals(a: cc.Rect, b: cc.Rect): boolean {
        return !!a && !!b
            && Math.abs(a.x - b.x) < 0.01
            && Math.abs(a.y - b.y) < 0.01
            && Math.abs(a.width - b.width) < 0.01
            && Math.abs(a.height - b.height) < 0.01;
    }

    private fitMapToView() {
        let visibleSize = cc.view.getVisibleSize();
        if (!visibleSize || visibleSize.width <= 0 || visibleSize.height <= 0) {
            return;
        }
        let fitScale = Math.min(1, visibleSize.width / this._mapPixelSize.width, visibleSize.height / this._mapPixelSize.height);
        this.node.scale = fitScale > 0 ? fitScale : 1;
    }

    private logMapInitResult() {
        let runtimeLayerReady = !!(this._staticObstacleLayer && this._obstacleLayer && this._bulletLayer && this._zoneLayer && this._effectLayer);
        let prefabName = this.tiledMapPrefab ? (this.tiledMapPrefab.name || "unknown") : "null";
        let isGameMapPrefab = prefabName === "GameMap";
        cc.log(
            "[TurnBattleMap] initTiledMap ok",
            "useGameMapPrefab=" + (isGameMapPrefab ? "true" : "false"),
            "prefab=" + prefabName,
            "size=" + this._mapPixelSize.width + "x" + this._mapPixelSize.height,
            "pointSource=" + this._pointSource,
            "roadSource=" + this._roadSource,
            "buildSource=" + this._buildSource,
            "staticObstacleCount=" + this._staticObstacles.length,
            "runtimeLayers=" + (runtimeLayerReady ? "ok" : "missing"),
        );
        cc.log(
            "[TurnBattleMap] points",
            "crystalA=" + this.formatVec2(this._spawnPoints.crystalA),
            "crystalB=" + this.formatVec2(this._spawnPoints.crystalB),
            "tankA=" + this.formatVec2(this._spawnPoints.tankA),
            "tankB=" + this.formatVec2(this._spawnPoints.tankB),
        );
    }

    private formatVec2(value: cc.Vec2): string {
        if (!value) {
            return "null";
        }
        return "(" + value.x.toFixed(1) + ", " + value.y.toFixed(1) + ")";
    }

    private handlePhaseChanged(previousPhase: TurnPhase, nextPhase: TurnPhase) {
        if (previousPhase === nextPhase) {
            return;
        }
        this.cancelPaletteBuildDrag();
        this.refreshBuildInteractionView();
        if (!this._serverMode) {
            if (nextPhase === "build") {
                this.refreshStaticObstacleSelection();
                this.renderStaticObstacles();
                this.spawnRoundAssistZone();
            }
            else if (nextPhase === "settle") {
                this.settleRound();
            }
            else if (nextPhase === "upgrade" || nextPhase === "finish" || nextPhase === "init") {
                this.clearAssistZones();
            }
        }
    }

    private spawnRoundAssistZone() {
        this.clearAssistZones();
        let spawnCount = getTurnAssistZoneSpawnCount(this.getRoundIndexForAssistZones(), this._config);
        for (let i = 0; i < spawnCount; i++) {
            let type = this.pickRandomAssistZoneType();
            let radius = this.randomAssistZoneRadius(type);
            let point = this.findAssistZoneSpawnPoint(type, radius);
            if (!point) {
                cc.warn("[TurnBattleMap] failed to find assist zone spawn point", type, radius);
                continue;
            }
            this.createAssistZone("A", type, point, null, radius);
            let zoneConfig = getTurnAssistZoneTypeConfig(type, this._config);
            this.showFloatText("生成" + (zoneConfig.name || "辅助区"), point.add(cc.v2(0, radius + 18)), new cc.Color(255, 255, 255, 255));
        }
    }

    private clearAssistZones() {
        for (let i = 0; i < this._assistZones.length; i++) {
            this._assistZones[i].node.destroy();
        }
        this._assistZones = [];
    }

    private findAssistZoneSpawnPoint(type: TurnAssistZoneType, radius: number): cc.Vec2 {
        if (!this._assistArea) {
            return null;
        }
        let minX = this._assistArea.x + radius + 8;
        let maxX = this._assistArea.x + this._assistArea.width - radius - 8;
        let minY = this._assistArea.y + radius + 8;
        let maxY = this._assistArea.y + this._assistArea.height - radius - 8;
        if (minX > maxX || minY > maxY) {
            return null;
        }
        let retryCount = Math.max(1, Number(this._config.assistZones && this._config.assistZones.maxPlacementRetries) || 1);
        for (let i = 0; i < retryCount; i++) {
            let point = cc.v2(
                this.randomRange(minX, maxX),
                this.randomRange(minY, maxY),
            );
            if (this.isZonePositionValid(type, point, radius)) {
                return point;
            }
        }
        return null;
    }

    private getRoundIndexForAssistZones(): number {
        return Math.max(1, Math.floor(Number(this._roundIndex) || 1));
    }

    private pickRandomAssistZoneType(): TurnAssistZoneType {
        let candidates: TurnAssistZoneType[] = ["black_hole", "spread", "damage_boost"];
        return candidates[Math.floor(Math.random() * candidates.length)] || "black_hole";
    }

    private randomAssistZoneRadius(type: TurnAssistZoneType): number {
        let typeConfig = getTurnAssistZoneTypeConfig(type, this._config);
        let minRadius = Math.max(1, Number(typeConfig.minRadius) || 1);
        let maxRadius = Math.max(minRadius, Number(typeConfig.maxRadius) || minRadius);
        return Math.round(this.randomRange(minRadius, maxRadius));
    }

    private randomRange(min: number, max: number): number {
        if (max <= min) {
            return min;
        }
        return min + Math.random() * (max - min);
    }

    private getAssistZoneStyle(type: TurnAssistZoneType): { fill: cc.Color; stroke: cc.Color } {
        if (type === "spread") {
            return {
                fill: new cc.Color(44, 112, 150, 92),
                stroke: new cc.Color(126, 224, 255, 210),
            };
        }
        if (type === "damage_boost") {
            return {
                fill: new cc.Color(136, 58, 48, 92),
                stroke: new cc.Color(255, 170, 92, 210),
            };
        }
        return {
            fill: new cc.Color(66, 60, 120, 92),
            stroke: new cc.Color(190, 140, 255, 210),
        };
    }

    private spawnSpreadBulletsFromZone(sourceBullet: TurnBulletState, zone: TurnAssistZoneState) {
        let zoneConfig = getTurnAssistZoneTypeConfig("spread", this._config);
        let safeExtraSplit = Math.min(8, Math.max(0, Math.floor(Number(sourceBullet.spreadExtraSplit) || 0)));
        let splitCount = Math.min(12, Math.max(1, Math.floor(Number(zoneConfig.spreadSplitCount) || 1) + safeExtraSplit));
        let spreadStepAngle = Math.max(0, Number(zoneConfig.spreadSplitStepAngle) || 0);
        if (splitCount <= 1) {
            return;
        }
        let sourceAngle = this.vectorToAngle(sourceBullet.dir);
        let sourcePos = this.getNodePosition(sourceBullet.node);
        let centerIndex = (splitCount - 1) * 0.5;
        for (let i = 0; i < splitCount; i++) {
            let angle = sourceAngle + (i - centerIndex) * spreadStepAngle;
            let dir = this.angleToVector(angle);
            this.createBullet(sourceBullet.camp, sourcePos.add(dir.mul(10)), dir, {
                bulletBlockCount: 0,
                attackBlockCount: 0,
                attackMultiplier: 1,
                totalShots: 1,
                extraShotsFromUpgrade: 0,
                extraShotsFromBulletBlock: 0,
                bonusDamageFromUpgrade: 0,
                bonusDamageFromAttackBlock: 0,
                bulletDamage: Math.max(1, Math.round(sourceBullet.baseDamage)),
                bulletBounce: sourceBullet.bounceLeft,
                firstBounceDamageMultiplier: sourceBullet.firstBounceDamageMultiplier,
                spreadExtraSplit: sourceBullet.spreadExtraSplit,
                damageBoostTempAttack: sourceBullet.damageBoostTempAttack,
                blackHoleStrengthMultiplier: sourceBullet.blackHoleStrengthMultiplier,
                shotsLeft: 0,
            });
            let child = this._bullets[this._bullets.length - 1];
            if (child) {
                child.lifeLeft = Math.min(child.lifeLeft, Math.max(0.6, sourceBullet.lifeLeft * 0.7));
                child.damage = sourceBullet.damage;
                child.remainingDamage = sourceBullet.remainingDamage;
                child.baseDamage = sourceBullet.baseDamage;
                child.damageMultiplier = sourceBullet.damageMultiplier;
                child.damageBoostLevel = sourceBullet.damageBoostLevel;
                child.bounceLeft = sourceBullet.bounceLeft;
                child.hasBounced = sourceBullet.hasBounced;
                child.hasTriggeredSpread = sourceBullet.hasTriggeredSpread;
                child.currentSpreadZoneIds = [];
                child.currentDamageBoostZoneIds = [];
                child.damageBoostAppliedZoneIds = sourceBullet.damageBoostAppliedZoneIds.slice();
                child.spreadTriggeredZoneIds = sourceBullet.spreadTriggeredZoneIds.slice();
                child.firstBounceDamageBoostApplied = sourceBullet.firstBounceDamageBoostApplied;
                child.firstBounceDamageMultiplier = sourceBullet.firstBounceDamageMultiplier;
                child.spreadExtraSplit = sourceBullet.spreadExtraSplit;
                child.damageBoostTempAttack = sourceBullet.damageBoostTempAttack;
                child.blackHoleStrengthMultiplier = sourceBullet.blackHoleStrengthMultiplier;
            }
        }
    }

    private applyDamageBoostPassThrough(bullet: TurnBulletState, zoneId: string) {
        let zoneConfig = getTurnAssistZoneTypeConfig("damage_boost", this._config);
        let maxMultiplier = Math.max(1, Math.floor(Number(zoneConfig.damageBoostMaxMultiplier) || 1));
        let previousMultiplier = Math.max(1, Number(bullet.damageMultiplier) || 1);
        let nextLevel = Math.min(maxMultiplier, Math.max(1, Math.floor(Number(bullet.damageBoostLevel) || 1)) + 1);
        bullet.damageBoostLevel = nextLevel;
        bullet.damageMultiplier = nextLevel;
        bullet.baseDamage += Math.max(0, Math.floor(Number(bullet.damageBoostTempAttack) || 0));
        bullet.damage = Math.max(0, Math.round(bullet.baseDamage * bullet.damageMultiplier));
        bullet.remainingDamage = Math.max(0, Math.round(bullet.remainingDamage * (bullet.damageMultiplier / previousMultiplier)));
        if (bullet.damageBoostAppliedZoneIds.indexOf(zoneId) < 0) {
            bullet.damageBoostAppliedZoneIds.push(zoneId);
        }
    }

    private angleToVector(angle: number): cc.Vec2 {
        let radians = angle * Math.PI / 180;
        return cc.v2(Math.cos(radians), Math.sin(radians)).normalize();
    }

    private updateKeyboardTankMove(dt: number) {
        if (this._phase !== "attack" || !this.canControlCamp(this._actionCamp)) {
            return;
        }
        let tank = this._tanks[this._actionCamp];
        if (!tank) {
            return;
        }
        let moveDir = 0;
        if (this._moveLeftPressed) {
            moveDir -= 1;
        }
        if (this._moveRightPressed) {
            moveDir += 1;
        }
        if (moveDir === 0) {
            return;
        }
        let previousPosition = this.getNodePosition(tank.root);
        let currentDir = tank.aim.sub(previousPosition);
        if (currentDir.magSqr() < 1) {
            currentDir = this._actionCamp === "A" ? cc.v2(0, 1) : cc.v2(0, -1);
        }
        currentDir = currentDir.normalize();
        let road = this.getRoadRect(this._actionCamp);
        let minX = road.x + 18;
        let maxX = road.x + road.width - 18;
        tank.root.x = Math.max(minX, Math.min(maxX, tank.root.x + moveDir * this._config.tankMoveSpeed * dt));
        tank.root.y = road.y + road.height / 2;
        let nextPosition = this.getNodePosition(tank.root);
        tank.aim = nextPosition.add(currentDir.mul(120));
        this.drawPreviewLine(tank.preview, currentDir);
        this.sendTankPoseIfNeeded(false, false);
    }

    private updateAimPreview(position: cc.Vec2, notifyServer: boolean) {
        this._pointerAim = cc.v2(position);
        this.applyTankAim(this._actionCamp, this._pointerAim, notifyServer);
    }

    private applyTankAim(camp: TurnCamp, target: cc.Vec2, notifyServer: boolean) {
        let tank = this._tanks[camp];
        if (!tank) {
            return;
        }
        let start = this.getNodePosition(tank.root);
        let dir = this.clampAimDirection(camp, start, target);
        tank.aim = start.add(dir.mul(120));
        tank.turret.angle = this.vectorToAngle(dir) - 90;
        this.drawPreviewLine(tank.preview, dir);
        if (notifyServer) {
            this.sendTankPoseIfNeeded(true, true);
        }
    }

    private clampAimDirection(camp: TurnCamp, start: cc.Vec2, target: cc.Vec2): cc.Vec2 {
        let dir = target.sub(start);
        if (dir.magSqr() < 1) {
            dir = camp === "A" ? cc.v2(0, 1) : cc.v2(0, -1);
        }
        if (camp === "A") {
            dir.y = Math.max(0.0001, dir.y);
        }
        else {
            dir.y = Math.min(-0.0001, dir.y);
        }
        return dir.normalize();
    }

    private drawPreviewLine(node: cc.Node, dir: cc.Vec2) {
        let graphics = node.getComponent(cc.Graphics);
        if (!graphics) {
            graphics = node.addComponent(cc.Graphics);
        }
        graphics.clear();
        graphics.strokeColor = new cc.Color(255, 240, 160, 210);
        graphics.lineWidth = 2;
        graphics.moveTo(0, 0);
        graphics.lineTo(dir.x * 94, dir.y * 94);
        graphics.stroke();
    }

    private sendTankPoseIfNeeded(force: boolean, includeAim: boolean) {
        if (!this._serverMode || !this.canControlCamp(this._actionCamp) || !this.onTankPoseIntent) {
            return;
        }
        let now = Date.now();
        if (!force && now - this._lastSentTankPoseAt < 50) {
            return;
        }
        let tank = this._tanks[this._actionCamp];
        if (!tank) {
            return;
        }
        this._lastSentTankPoseAt = now;
        this.onTankPoseIntent({
            x: tank.root.x,
            y: tank.root.y,
            aimX: includeAim ? tank.aim.x : undefined,
            aimY: includeAim ? tank.aim.y : undefined,
        });
    }

    private isPointInAssistArea(position: cc.Vec2): boolean {
        return !!(position && this._assistArea && this._assistArea.contains(position));
    }

    private isPointInOwnBuildArea(position: cc.Vec2): boolean {
        if (!position) {
            return false;
        }
        let camp = this._actionCamp;
        if (!camp) {
            return false;
        }
        let area = this.getBuildArea(camp);
        return !!(area && area.contains(position));
    }

    private onKeyDown(event: cc.Event.EventKeyboard) {
        if (KEY_LEFT_SET.indexOf(event.keyCode) >= 0) {
            this._moveLeftPressed = true;
        }
        else if (KEY_RIGHT_SET.indexOf(event.keyCode) >= 0) {
            this._moveRightPressed = true;
        }
    }

    private onKeyUp(event: cc.Event.EventKeyboard) {
        if (KEY_LEFT_SET.indexOf(event.keyCode) >= 0) {
            this._moveLeftPressed = false;
        }
        else if (KEY_RIGHT_SET.indexOf(event.keyCode) >= 0) {
            this._moveRightPressed = false;
        }
    }

    private canControlCamp(camp: TurnCamp): boolean {
        return !this._serverMode || camp === this._localCamp;
    }

    private refreshBuildInteractionView() {
        this.ensureBuildOverlayLayers();
        if (!this._buildHighlightLayer) {
            return;
        }

        this._buildHighlightLayer.removeAllChildren();
        if (this._phase !== "build") {
            if (this._buildOverlayLayer) {
                this._buildOverlayLayer.active = false;
            }
            return;
        }

        this._buildOverlayLayer.active = true;
        let camp = this._palettePreview ? this._palettePreview.camp : this._localCamp;
        let slotType = this._palettePreview ? this._palettePreview.slotType : this._selectedBuildSlotType;
        if (!this.canControlCamp(camp)) {
            return;
        }

        let buildArea = this.getBuildArea(camp);
        if (!buildArea || this._tileSize.width <= 0 || this._tileSize.height <= 0) {
            return;
        }

        let activeTileKey = this._palettePreview && this._palettePreview.tile
            ? this._palettePreview.tile.x + ":" + this._palettePreview.tile.y
            : null;
        let mapSize = this._mapTileSize.width > 0 && this._mapTileSize.height > 0
            ? this._mapTileSize
            : cc.size(
                Math.max(1, Math.round(this._mapPixelSize.width / this._tileSize.width)),
                Math.max(1, Math.round(this._mapPixelSize.height / this._tileSize.height)),
            );

        for (let tx = 0; tx < mapSize.width; tx++) {
            for (let ty = 0; ty < mapSize.height; ty++) {
                let tile = cc.v2(tx, ty);
                let center = this.tileToGamePos(tile);
                let tileRect = cc.rect(
                    center.x - this._tileSize.width / 2,
                    center.y - this._tileSize.height / 2,
                    this._tileSize.width,
                    this._tileSize.height,
                );
                if (!this.rectContainsRect(buildArea, tileRect)) {
                    continue;
                }
                let valid = this.isBuildPositionValid(camp, center, this._dragObstacle ? this._dragObstacle.id : undefined, this._dragObstacle ? this._dragObstacle.slotType : slotType);
                if (!valid) {
                    continue;
                }
                let node = new cc.Node("BuildTile" + tx + "_" + ty);
                node.parent = this._buildHighlightLayer;
                node.setPosition(center.x, center.y);
                let graphics = node.addComponent(cc.Graphics);
                let isActive = activeTileKey === tx + ":" + ty;
                graphics.fillColor = isActive
                    ? new cc.Color(255, 238, 120, 145)
                    : new cc.Color(120, 230, 140, 72);
                graphics.rect(-this._tileSize.width / 2, -this._tileSize.height / 2, this._tileSize.width, this._tileSize.height);
                graphics.fill();
                graphics.strokeColor = isActive
                    ? new cc.Color(255, 248, 190, 220)
                    : new cc.Color(175, 255, 190, 84);
                graphics.lineWidth = isActive ? 2 : 1;
                graphics.rect(-this._tileSize.width / 2, -this._tileSize.height / 2, this._tileSize.width, this._tileSize.height);
                graphics.stroke();
            }
        }
    }

    private createBuildPreviewNode(camp: TurnCamp, slotType: TurnObstacleResourceType): cc.Node {
        let node = new cc.Node("BuildPreview" + camp);
        this.updatePreviewNodeView(node, camp, false, slotType);
        return node;
    }
}
