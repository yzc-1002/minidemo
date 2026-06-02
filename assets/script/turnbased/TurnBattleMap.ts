import { TurnAssistZoneType, TurnCamp, TurnGameConfig, TurnMirrorDirection, TurnObstacleResourceType, TurnPhase, TurnUpgradeConfig, TurnUpgradeId, TURN_GAME_CONFIG, getRoundObstacleGain } from "../config/TurnGame";
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
const MIRROR_DIRECTIONS: TurnMirrorDirection[] = ["bl", "br", "tl", "tr"];
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
}

interface TurnObstacleState {
    id: string;
    camp: TurnCamp;
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
    mirrorDir: TurnMirrorDirection | "";
    placedByCamp: TurnCamp;
}

interface TurnBuildPreviewState {
    camp: TurnCamp;
    slotType: TurnObstacleResourceType;
    node: cc.Node;
    tile: cc.Vec2;
    snappedPosition: cc.Vec2;
    valid: boolean;
}

interface TurnObstacleSlotState {
    type: TurnObstacleResourceType;
    count: number;
    layout: cc.Vec2[];
    shapeKey: string;
    mirrorDir: TurnMirrorDirection | "";
    placedObstacleId: string;
    placedObstacleShapeKey: string;
    placedCount: number;
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
    speed: number;
    radius: number;
    lifeLeft: number;
    bounceLeft: number;
}

interface TurnAssistZoneState {
    id: string;
    camp: TurnCamp;
    type: TurnAssistZoneType;
    node: cc.Node;
    radius: number;
}

interface TurnCampStats {
    exp: number;
    expNeed: number;
    level: number;
    damageBonus: number;
    extraShots: number;
    bulletBounce: number;
    blackHoleUnlocked: boolean;
    zoneInventory: { [type: string]: number };
    energyTowers: number;
}

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
    onBuildIntent: (action: { op: string; obstacleId?: string; slotType?: TurnObstacleResourceType; x: number; y: number; }) => void = null;
    onZoneIntent: (action: { zoneType: string; x: number; y: number; }) => void = null;
    onAttackIntent: (action: { fromX: number; fromY: number; aimX: number; aimY: number; shotIndex: number; }) => void = null;
    onTankPoseIntent: (action: { x: number; y: number; aimX: number; aimY: number; }) => void = null;

    private _config: TurnGameConfig = TURN_GAME_CONFIG;
    private _crystals: { [camp: string]: TurnCrystalState } = {};
    private _tanks: { [camp: string]: TurnTankState } = {};
    private _obstacleInventory: { [camp: string]: { [type: string]: TurnObstacleSlotState } } = { A: null, B: null };
    private _obstacles: TurnObstacleState[] = [];
    private _staticObstacles: TurnStaticObstacleState[] = [];
    private _bullets: TurnBulletState[] = [];
    private _assistZones: TurnAssistZoneState[] = [];
    private _campStats: { [camp: string]: TurnCampStats } = null;
    private _phase: TurnPhase = "init";
    private _actionCamp: TurnCamp = "A";
    private _hasFiredInAction = false;
    private _shotsLeftInAction = 0;
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
        this._dragObstacle = null;
        this._dragStartPosition = null;
        this._palettePreview = null;
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
            A: this.createObstacleInventory(),
            B: this.createObstacleInventory(),
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
        this.resetBuildSlotsForNewRound("A");
        this.resetBuildSlotsForNewRound("B");
        if (roundIndex > 1) {
            let gain = getRoundObstacleGain(roundIndex, this._config);
            for (let i = 0; i < gain; i++) {
                this.grantRandomObstacleResource("A");
                this.grantRandomObstacleResource("B");
            }
            if (this._serverMode && this.getCampStats("A").blackHoleUnlocked) {
                this.getCampStats("A").zoneInventory.black_hole += 1;
            }
            if (this._serverMode && this.getCampStats("B").blackHoleUnlocked) {
                this.getCampStats("B").zoneInventory.black_hole += 1;
            }
        }
        this.refreshBuildInteractionView();
    }

    setTurnSnapshot(snapshot: TurnStateSnapshot) {
        let previousPhase = this._phase;
        this._phase = snapshot.phase;
        this.setActionCamp(snapshot.actionCamp);
        this.handlePhaseChanged(previousPhase, snapshot.phase);
        this.refreshBuildInteractionView();

        if (snapshot.phase === "attack") {
            this._hasFiredInAction = false;
            this._shotsLeftInAction = 1 + this.getCampStats(this._actionCamp).extraShots;
            if (this._serverMode && this._actionCamp === "A") {
                this.resetPendingBulletResult();
            }
        }
        else if (snapshot.phase === "waitBullet" && !this.hasActiveBullets()) {
            this.scheduleOnce(this.emitBulletsCleared, 0);
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
        statsA.bulletBounce = Math.max(0, Number(upgradesA.bulletBounce) || 0);
        statsB.bulletBounce = Math.max(0, Number(upgradesB.bulletBounce) || 0);
        statsA.blackHoleUnlocked = !!(upgradesA.zones && upgradesA.zones.indexOf("black_hole") >= 0);
        statsB.blackHoleUnlocked = !!(upgradesB.zones && upgradesB.zones.indexOf("black_hole") >= 0);
        statsA.zoneInventory.black_hole = Math.max(0, Number(inventoriesA.black_hole) || 0);
        statsB.zoneInventory.black_hole = Math.max(0, Number(inventoriesB.black_hole) || 0);
        statsA.energyTowers = this.countPlacedEnergyTowers("A");
        statsB.energyTowers = this.countPlacedEnergyTowers("B");

        this.syncCrystalState("A", snapshot.crystals && snapshot.crystals.A);
        this.syncCrystalState("B", snapshot.crystals && snapshot.crystals.B);
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
        this.createBullet(camp, startPosition.add(dir.normalize().mul(44)), dir.normalize());
    }

    consumePendingBulletResult() {
        let result = {
            hitType: this._pendingBulletResult.hitType,
            targetCamp: this._pendingBulletResult.targetCamp,
            targetId: this._pendingBulletResult.targetId,
            damage: this._pendingBulletResult.damage,
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
        let inventory = this._obstacleInventory[camp];
        if (!inventory) {
            return 0;
        }
        let total = 0;
        let slots = this._config.obstacleSlots || [];
        for (let i = 0; i < slots.length; i++) {
            total += Math.max(0, inventory[slots[i].type] ? inventory[slots[i].type].count : 0);
        }
        return total;
    }

    getObstacleSlotStates(camp: TurnCamp): TurnObstacleSlotState[] {
        let inventory = this._obstacleInventory[camp] || this.createObstacleInventory();
        let slots = this._config.obstacleSlots || [];
        let result: TurnObstacleSlotState[] = [];
        for (let i = 0; i < slots.length; i++) {
            let state = inventory[slots[i].type];
            if (state) {
                result.push(state);
            }
        }
        return result;
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

    getBlackHoleInventory(camp: TurnCamp): number {
        return this.getCampStats(camp).zoneInventory.black_hole || 0;
    }

    getActiveAssistZoneCount(): number {
        return this._assistZones.length;
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

    canCampUpgrade(camp: TurnCamp): boolean {
        let stats = this.getCampStats(camp);
        return stats.exp >= stats.expNeed && this.getUpgradeOptions(camp).length > 0;
    }

    getUpgradeOptions(camp: TurnCamp): TurnUpgradeConfig[] {
        let stats = this.getCampStats(camp);
        let pool: TurnUpgradeConfig[] = [];
        for (let i = 0; i < this._config.upgradePool.length; i++) {
            let option = this._config.upgradePool[i];
            if (option.id === "unlock_black_hole") {
                continue;
            }
            pool.push(option);
        }

        let options: TurnUpgradeConfig[] = [];
        let start = (stats.level + (camp === "A" ? 0 : 2)) % Math.max(1, pool.length);
        for (let i = 0; i < pool.length && options.length < 3; i++) {
            options.push(pool[(start + i) % pool.length]);
        }
        return options;
    }

    applyUpgrade(camp: TurnCamp, upgradeId: TurnUpgradeId) {
        let stats = this.getCampStats(camp);
        if (stats.exp < stats.expNeed) {
            return;
        }

        stats.exp -= stats.expNeed;
        stats.expNeed += 20;
        stats.level += 1;
        if (upgradeId === "bullet_bounce") {
            stats.bulletBounce += 1;
        }
        else if (upgradeId === "cover_resource_up") {
            this.grantRandomObstacleResource(camp);
        }
        else if (upgradeId === "extra_shot") {
            stats.extraShots += 1;
        }
        else if (upgradeId === "damage_up") {
            stats.damageBonus += 10;
        }
        else if (upgradeId === "crystal_hp_up") {
            this.increaseCrystalHp(camp, 20);
        }
        else if (upgradeId === "unlock_black_hole") {
            stats.blackHoleUnlocked = true;
            stats.zoneInventory.black_hole += this._config.zoneInventoryOnUnlock;
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

    isBuildPositionValid(camp: TurnCamp, position: cc.Vec2, ignoreObstacleId?: string, slotType: TurnObstacleResourceType = "normal"): boolean {
        let buildArea = this.getBuildArea(camp);
        let slot = this.getObstacleSlotState(camp, slotType);
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

    beginPaletteBuildDrag(camp: TurnCamp, position: cc.Vec2, slotType?: TurnObstacleResourceType): boolean {
        this._selectedBuildSlotType = slotType || this._selectedBuildSlotType || "normal";
        let slot = slotType ? this.getObstacleSlotState(camp, slotType) : this.getFirstAvailableObstacleSlot(camp);
        if (!this.isBuildPhaseActiveForCamp(camp) || !slot || !this.canPlaceFromSlot(slot)) {
            return false;
        }
        this.cancelPaletteBuildDrag(camp);
        this.ensureBuildOverlayLayers();
        this._palettePreview = {
            camp: camp,
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

    updatePaletteBuildDrag(camp: TurnCamp, position: cc.Vec2, slotType?: TurnObstacleResourceType) {
        if (!this._palettePreview || this._palettePreview.camp !== camp) {
            return;
        }
        if (slotType) {
            this._palettePreview.slotType = slotType;
            this._selectedBuildSlotType = slotType;
        }

        let snappedPosition = this.snapBuildPosition(position);
        let tile = this.worldToTile(snappedPosition);
        let valid = !!tile && this.isBuildPositionValid(camp, snappedPosition, undefined, this._palettePreview.slotType);
        this._palettePreview.tile = tile;
        this._palettePreview.snappedPosition = snappedPosition;
        this._palettePreview.valid = valid;
        this._palettePreview.node.setPosition(snappedPosition.x, snappedPosition.y);
        this._palettePreview.node.opacity = valid ? 228 : 168;
        this.updatePreviewNodeView(this._palettePreview.node, camp, valid, this._palettePreview.slotType);
        this.refreshBuildInteractionView();
    }

    finishPaletteBuildDrag(camp: TurnCamp, position: cc.Vec2, slotType?: TurnObstacleResourceType) {
        let finalSlotType = slotType || (this._palettePreview ? this._palettePreview.slotType : this.getFirstAvailableObstacleSlotType(camp));
        this.cancelPaletteBuildDrag(camp);
        this.placeBuildObstacleAt(camp, position, finalSlotType);
    }

    private placeBuildObstacleAt(camp: TurnCamp, position: cc.Vec2, slotType?: TurnObstacleResourceType) {
        if (!camp || !this.canControlCamp(camp)) {
            this.showFloatText("只能放在可操作阵营建造区", position, cc.Color.RED);
            return;
        }
        let slot = slotType ? this.getObstacleSlotState(camp, slotType) : this.getFirstAvailableObstacleSlot(camp);
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
        if (!this.isBuildPositionValid(camp, snappedPosition, undefined, slot.type)) {
            this.showFloatText("位置不可用", position, cc.Color.RED);
            return;
        }

        if (this._serverMode) {
            if (this.onBuildIntent) {
                this.onBuildIntent({
                    op: "place",
                    slotType: slot.type,
                    x: snappedPosition.x,
                    y: snappedPosition.y,
                });
            }
            return;
        }

        this.createBuildObstacle(camp, snappedPosition, undefined, slot.type);
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
            this.updateObstacleValidView(this._dragObstacle, this.isBuildPositionValid(this._dragObstacle.camp, snappedPosition, this._dragObstacle.id, this._dragObstacle.slotType));
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

        if (this._phase === "zone") {
            this.finishZoneTouch(position);
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
            let valid = this.isBuildPositionValid(obstacle.camp, snappedPosition, obstacle.id, obstacle.slotType);
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
        if (this._shotsLeftInAction <= 0 || this._gameFinished) {
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
            let totalShots = 1 + this.getCampStats(this._actionCamp).extraShots;
            let shotIndex = Math.max(0, totalShots - this._shotsLeftInAction);
            this._shotsLeftInAction = Math.max(0, this._shotsLeftInAction - 1);
            if (this.onAttackIntent) {
                this.onAttackIntent({
                    fromX: startPosition.x,
                    fromY: startPosition.y,
                    aimX: tank.aim.x,
                    aimY: tank.aim.y,
                    shotIndex: shotIndex,
                });
            }
            return;
        }

        let startPosition = this.getNodePosition(tank.root);
        let dir = this.clampAimDirection(this._actionCamp, startPosition, tank.aim);

        this._hasFiredInAction = true;
        this._shotsLeftInAction -= 1;
        this.createBullet(this._actionCamp, startPosition.add(dir.mul(44)), dir);
        this.showFloatText("剩余开火 " + this._shotsLeftInAction, startPosition.add(cc.v2(0, 46)), new cc.Color(255, 255, 255, 255));
        this.emitTurnEvent("turn-attack-fired", {
            camp: this._actionCamp,
            from: startPosition,
            dir: dir,
        });
        if (this._shotsLeftInAction <= 0 && this.onAttackFired) {
            this.onAttackFired();
        }
    }

    private createBullet(camp: TurnCamp, position: cc.Vec2, dir: cc.Vec2) {
        let node = new cc.Node("TurnBullet" + camp);
        node.parent = this._bulletLayer || this.contentRoot;
        node.setPosition(position.x, position.y);
        node.angle = this.vectorToAngle(dir) - 90;

        let graphics = node.addComponent(cc.Graphics);
        graphics.fillColor = camp === "A" ? new cc.Color(255, 230, 96, 255) : new cc.Color(130, 220, 255, 255);
        graphics.circle(0, 0, this._config.bulletRadius);
        graphics.fill();

        let stats = this.getCampStats(camp);
        this._bullets.push({
            node: node,
            camp: camp,
            dir: dir,
            damage: this._config.bulletDamage + stats.damageBonus,
            speed: this._config.bulletSpeed,
            radius: this._config.bulletRadius,
            lifeLeft: 3.5,
            bounceLeft: stats.bulletBounce,
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

            if (!this.keepBulletInMap(bullet)
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

    private tryHitDynamicObstacle(bullet: TurnBulletState): boolean {
        for (let i = 0; i < this._obstacles.length; i++) {
            let obstacle = this._obstacles[i];
            let hitInfo = this.getHitDynamicObstacleCell(obstacle, this.getNodePosition(bullet.node), bullet.radius);
            if (!hitInfo) {
                continue;
            }
            let cellIndex = hitInfo.cellIndex;
            obstacle.cellHp[cellIndex] = Math.max(0, (obstacle.cellHp[cellIndex] || 0) - bullet.damage);
            obstacle.hp = this.sumObstacleCellHp(obstacle);
            if (obstacle.slotType === "mirror") {
                this.reflectBulletOffMirror(bullet, hitInfo.rect, obstacle.mirrorDir);
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
                return obstacle.slotType !== "mirror";
            }
            let expGain = this.getObstacleDestroyExp(obstacle);
            obstacle.node.destroy();
            this._obstacles.splice(i, 1);
            this.clearObstaclePlacedSlot(obstacle);
            if (expGain > 0) {
                this.addExp(obstacle.slotType === "exp" ? obstacle.placedByCamp : bullet.camp, expGain, this.getNodePosition(bullet.node));
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
            if (obstacle.slotType === "mirror") {
                return false;
            }
            return true;
        }

        return false;
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
            if (bullet.bounceLeft > 0) {
                this.reflectBulletOffRect(bullet, obstacle.rect);
                bullet.bounceLeft -= 1;
                return false;
            }
            return true;
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

    private reflectBulletOffMirror(bullet: TurnBulletState, rect: cc.Rect, direction: TurnMirrorDirection | "") {
        let dir = this.normalizeMirrorDirection(direction || "bl");
        if (dir === "bl" || dir === "tr") {
            bullet.dir = cc.v2(-bullet.dir.y, -bullet.dir.x).normalize();
        }
        else {
            bullet.dir = cc.v2(bullet.dir.y, bullet.dir.x).normalize();
        }
        let position = this.getNodePosition(bullet.node);
        let nearestX = Math.max(rect.x, Math.min(position.x, rect.x + rect.width));
        let nearestY = Math.max(rect.y, Math.min(position.y, rect.y + rect.height));
        bullet.node.setPosition(nearestX + bullet.dir.x * (bullet.radius + 2), nearestY + bullet.dir.y * (bullet.radius + 2));
        bullet.node.angle = this.vectorToAngle(bullet.dir) - 90;
    }

    private tryHitCrystal(bullet: TurnBulletState): boolean {
        let targetCamp: TurnCamp = bullet.camp === "A" ? "B" : "A";
        let crystal = this._crystals[targetCamp];
        if (!crystal || this.getNodePosition(crystal.node).sub(this.getNodePosition(bullet.node)).mag() > crystal.radius + bullet.radius) {
            return false;
        }

        crystal.hp = Math.max(0, crystal.hp - bullet.damage);
        this.refreshCrystalView(targetCamp);
        this.showFloatText("-" + bullet.damage, this.getNodePosition(crystal.node).add(cc.v2(0, 44)), cc.Color.RED);
        this.addExp(bullet.camp, this._config.crystalHitExp, this.getNodePosition(crystal.node).add(cc.v2(0, 76)));
        this.emitStatsChanged();
        if (this._serverMode && bullet.camp === "A") {
            this._pendingBulletResult.hitType = "crystal";
            this._pendingBulletResult.targetCamp = targetCamp;
            this._pendingBulletResult.damage += bullet.damage;
        }
        this.emitTurnEvent("turn-crystal-hit", {
            camp: bullet.camp,
            targetCamp: targetCamp,
            damage: bullet.damage,
            hp: crystal.hp,
            expGain: this._config.crystalHitExp,
        });

        if (crystal.hp <= 0) {
            this.finishGame(bullet.camp);
        }
        return true;
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

    private createBuildObstacle(camp: TurnCamp, position: cc.Vec2, forcedId?: string, slotType: TurnObstacleResourceType = "normal", snapshot?: any) {
        let slot = this.getObstacleSlotState(camp, slotType);
        let layout = snapshot && snapshot.layout ? this.buildLayoutFromSnapshot(slotType, snapshot.layout, Number(snapshot.resourceCount) || slot.count) : slot.layout;
        let mirrorDir = snapshot && snapshot.mirrorDir ? this.normalizeMirrorDirection(snapshot.mirrorDir) : slot.mirrorDir;
        let resourceCount = Math.max(1, Number(snapshot && snapshot.resourceCount) || slot.count);
        let bounds = this.getLayoutBounds(layout);
        let node = new cc.Node("BuildObstacle" + this._nextObstacleId);
        node.parent = this._obstacleLayer || this.contentRoot;
        node.setPosition(position.x, position.y);

        let graphics = node.addComponent(cc.Graphics);
        this.drawObstacleGraphics(graphics, camp, true, slotType, layout, mirrorDir);

        // let label = this.createLabel(camp, 16);
        // label.node.parent = node;
        // label.node.y = bounds.minY * this._dynamicObstacleSize.height - 18;
        // label.node.zIndex = 5;
        // label.node.color = new cc.Color(255, 248, 220, 255);
        let hp = Math.max(1, Number(snapshot && snapshot.hp) || this.getObstacleMaxHp(slotType, resourceCount));
        let maxHp = Math.max(hp, Number(snapshot && snapshot.maxHp) || this.getObstacleMaxHp(slotType, resourceCount));
        let cellMaxHp = slotType === "exp" || slotType === "energy"
            ? this._config.obstacleBaseHp
            : this.getObstacleMaxHp(slotType, 1);
        let cellHp = this.buildCellHpFromSnapshot(snapshot && snapshot.cellHp, layout.length, cellMaxHp);
        // label.string = String(hp);

        let id = forcedId || String(this._nextObstacleId++);
        if (!snapshot) {
            if (slotType === "mirror") {
                slot.placedCount += 1;
            }
            else {
                slot.placedObstacleId = id;
                slot.placedObstacleShapeKey = this.getLayoutKey(layout);
            }
        }

        this._obstacles.push({
            id: id,
            camp: camp,
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
        this.getCampStats(camp).energyTowers = this.countPlacedEnergyTowers(camp);
        this.refreshBuildInteractionView();
    }

    private createAssistZone(camp: TurnCamp, type: TurnAssistZoneType, position: cc.Vec2, forcedId?: string) {
        let node = new cc.Node("AssistZone" + this._nextAssistZoneId);
        node.parent = this._zoneLayer || this.contentRoot;
        node.setPosition(position.x, position.y);

        let graphics = node.addComponent(cc.Graphics);
        graphics.fillColor = new cc.Color(66, 60, 120, 92);
        graphics.circle(0, 0, this._config.assistZoneRadius);
        graphics.fill();
        graphics.strokeColor = camp === "A" ? new cc.Color(120, 210, 255, 180) : new cc.Color(220, 120, 255, 180);
        graphics.lineWidth = 3;
        graphics.circle(0, 0, this._config.assistZoneRadius);
        graphics.stroke();

        let label = this.createLabel(type === "black_hole" ? "黑洞" : "区域", 18);
        label.node.parent = node;
        label.node.color = new cc.Color(220, 230, 255, 255);

        this._assistZones.push({
            id: forcedId || String(this._nextAssistZoneId++),
            camp: camp,
            type: type,
            node: node,
            radius: this._config.assistZoneRadius,
        });
    }

    private isZonePositionValid(camp: TurnCamp, position: cc.Vec2): boolean {
        let zoneRect = cc.rect(
            position.x - this._config.assistZoneRadius,
            position.y - this._config.assistZoneRadius,
            this._config.assistZoneRadius * 2,
            this._config.assistZoneRadius * 2,
        );
        if (!this._assistArea || !this.rectContainsRect(this._assistArea, zoneRect) || !this.rectContainsRect(this.getMapRect(), zoneRect)) {
            return false;
        }

        let roadA = this.getRoadRect("A");
        let roadB = this.getRoadRect("B");
        if ((roadA && this.circleRectIntersects(position, this._config.assistZoneRadius, roadA))
            || (roadB && this.circleRectIntersects(position, this._config.assistZoneRadius, roadB))) {
            return false;
        }

        let crystalA = this._crystals.A;
        let crystalB = this._crystals.B;
        if ((crystalA && position.sub(this.getNodePosition(crystalA.node)).mag() < this._config.assistZoneRadius + crystalA.radius + 12)
            || (crystalB && position.sub(this.getNodePosition(crystalB.node)).mag() < this._config.assistZoneRadius + crystalB.radius + 12)) {
            return false;
        }

        for (let i = 0; i < this._noBuildAreas.length; i++) {
            if (this.circleRectIntersects(position, this._config.assistZoneRadius, this._noBuildAreas[i])) {
                return false;
            }
        }
        for (let j = 0; j < this._staticObstacles.length; j++) {
            if (this.circleRectIntersects(position, this._config.assistZoneRadius, this._staticObstacles[j].rect)) {
                return false;
            }
        }
        for (let k = 0; k < this._assistZones.length; k++) {
            let zone = this._assistZones[k];
            if (this.getNodePosition(zone.node).sub(position).mag() < zone.radius + this._config.assistZoneRadius + 16) {
                return false;
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
        mirrorDir?: TurnMirrorDirection | "",
    ) {
        let cells = this.normalizeObstacleLayout(slotType, layout);
        let cellSize = this._dynamicObstacleSize.width;
        for (let i = 0; i < cells.length; i++) {
            let cell = cells[i];
            let x = cell.x * cellSize - cellSize / 2;
            let y = cell.y * cellSize - cellSize / 2;
            if (slotType === "mirror") {
                this.drawMirrorCell(graphics, x, y, cellSize, valid, mirrorDir || "bl");
                continue;
            }
            graphics.fillColor = this.getObstacleFillColor(camp, valid, slotType);
            graphics.roundRect(x, y, cellSize, cellSize, 8);
            graphics.fill();
            graphics.strokeColor = new cc.Color(240, 240, 240, 180);
            graphics.lineWidth = 2;
            graphics.roundRect(x, y, cellSize, cellSize, 8);
            graphics.stroke();
            if (slotType === "exp" || slotType === "energy") {
                this.drawObstacleIcon(graphics, slotType, x, y, cellSize);
            }
        }
    }

    private updatePreviewNodeView(node: cc.Node, camp: TurnCamp, valid: boolean, slotType: TurnObstacleResourceType) {
        let graphics = node.getComponent(cc.Graphics);
        if (!graphics) {
            graphics = node.addComponent(cc.Graphics);
        }
        graphics.clear();
        let slot = this.getObstacleSlotState(camp, slotType);
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
        let crystalPosition = this.getSpawnPosition("crystal" + camp, cc.v2(0, this._config.crystalY[camp]));
        let tankPosition = this.getRoadCenterPosition(camp);
        let crystal = this.createCrystal(camp, crystalPosition);
        let tank = this.createTank(camp, tankPosition);
        this._crystals[camp] = {
            node: crystal.node,
            hp: this._config.crystalHp,
            maxHp: this._config.crystalHp,
            hpLabel: crystal.label,
            radius: 32,
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
        label.node.parent = root;
        label.node.y = -2;

        let tankState: TurnTankState = {
            root: root,
            body: body,
            turret: turret,
            preview: preview,
            aim: cc.v2(position.x, position.y + (camp === "A" ? 120 : -120)),
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

        crystal.hpLabel.string = "HP " + crystal.hp + "/" + crystal.maxHp;
    }

    private updateTankState(camp: TurnCamp, active: boolean) {
        let tank = this._tanks[camp];
        if (!tank) {
            return;
        }

        let shouldHide = this._phase === "attack" && this._actionCamp !== camp;
        tank.root.active = !shouldHide;
        tank.preview.active = !shouldHide;
        if (shouldHide) {
            return;
        }

        tank.root.opacity = active ? 255 : 100;
        tank.root.scale = active ? 1.08 : 1;
        tank.preview.opacity = active ? 210 : 90;
    }

    private createObstacleInventory(): { [type: string]: TurnObstacleSlotState } {
        let result: { [type: string]: TurnObstacleSlotState } = {};
        let slots = this._config.obstacleSlots || [];
        for (let i = 0; i < slots.length; i++) {
            let type = slots[i].type;
            result[type] = {
                type: type,
                count: 1,
                layout: this.buildLayoutForSlot(type, 1),
                shapeKey: "single",
                mirrorDir: type === "mirror" ? this.pickMirrorDirection(1) : "",
                placedObstacleId: "",
                placedObstacleShapeKey: "",
                placedCount: 0,
            };
        }
        return result;
    }

    private createCampStats(): TurnCampStats {
        return {
            exp: 0,
            expNeed: this._config.levelUpExp,
            level: 1,
            damageBonus: 0,
            extraShots: 0,
            bulletBounce: 0,
            blackHoleUnlocked: false,
            zoneInventory: {
                black_hole: 0,
            },
            energyTowers: 0,
        };
    }

    private getObstacleSlotState(camp: TurnCamp, type: TurnObstacleResourceType): TurnObstacleSlotState {
        if (!this._obstacleInventory[camp]) {
            this._obstacleInventory[camp] = this.createObstacleInventory();
        }
        return this._obstacleInventory[camp][type];
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

    private getFirstAvailableObstacleSlotType(camp: TurnCamp): TurnObstacleResourceType {
        let slot = this.getFirstAvailableObstacleSlot(camp);
        return slot ? slot.type : "normal";
    }

    private resetBuildSlotsForNewRound(camp: TurnCamp) {
        let slots = this.getObstacleSlotStates(camp);
        for (let i = 0; i < slots.length; i++) {
            let slot = slots[i];
            slot.placedObstacleId = "";
            slot.placedObstacleShapeKey = "";
            slot.placedCount = 0;
            this.refreshObstacleSlotShape(slot);
        }
    }

    private canPlaceFromSlot(slot: TurnObstacleSlotState): boolean {
        if (!slot || slot.count <= 0) {
            return false;
        }
        if (slot.type === "mirror") {
            return slot.placedCount < slot.count;
        }
        return !slot.placedObstacleId;
    }

    private grantRandomObstacleResource(camp: TurnCamp) {
        let slots = this.getObstacleSlotStates(camp).filter((slot) => slot && slot.count < this._config.obstacleSlotMaxResources);
        if (slots.length <= 0) {
            return;
        }
        let index = Math.floor(Math.random() * slots.length);
        let slot = slots[index];
        slot.count = Math.min(this._config.obstacleSlotMaxResources, slot.count + 1);
        this.refreshObstacleSlotShape(slot);
    }

    private applyObstacleInventorySnapshot(camp: TurnCamp, inventory: any) {
        this._obstacleInventory[camp] = this.createObstacleInventory();
        let resourceSlots = inventory && inventory.obstacleSlots ? inventory.obstacleSlots : {};
        let slotList = this._config.obstacleSlots || [];
        for (let i = 0; i < slotList.length; i++) {
            let type = slotList[i].type;
            let target = this._obstacleInventory[camp][type];
            let source = resourceSlots[type] || {};
            target.count = Math.max(1, Math.min(this._config.obstacleSlotMaxResources, Number(source.count) || 1));
            target.layout = this.buildLayoutFromSnapshot(type, source.layout, target.count);
            target.shapeKey = String(source.shapeKey || this.getLayoutKey(target.layout));
            target.mirrorDir = type === "mirror"
                ? this.normalizeMirrorDirection(source.mirrorDir || source.direction || "")
                : "";
            target.placedObstacleId = String(source.placedObstacleId || "");
            target.placedObstacleShapeKey = String(source.placedObstacleShapeKey || "");
            target.placedCount = Math.max(0, Number(source.placedCount) || 0);
        }
    }

    private refreshObstacleSlotShape(slot: TurnObstacleSlotState) {
        if (!slot) {
            return;
        }
        slot.layout = this.buildLayoutForSlot(slot.type, slot.count);
        slot.shapeKey = this.getLayoutKey(slot.layout);
        slot.placedObstacleShapeKey = "";
        if (slot.type === "mirror") {
            slot.mirrorDir = this.pickMirrorDirection(slot.count + Math.floor(Math.random() * 8));
        }
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
        if (slotType === "mirror") {
            return [cc.v2(0, 0)];
        }
        if (layout && layout.length > 0) {
            return layout;
        }
        return [cc.v2(0, 0)];
    }

    private buildLayoutFromSnapshot(slotType: TurnObstacleResourceType, layout: any, count: number): cc.Vec2[] {
        if (slotType === "mirror") {
            return [cc.v2(0, 0)];
        }
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
        if (slotType === "mirror") {
            return [cc.v2(0, 0)];
        }
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

    private normalizeMirrorDirection(value: string): TurnMirrorDirection {
        let dir = String(value || "").toLowerCase();
        if (MIRROR_DIRECTIONS.indexOf(dir as TurnMirrorDirection) >= 0) {
            return dir as TurnMirrorDirection;
        }
        return "bl";
    }

    private pickMirrorDirection(seed: number): TurnMirrorDirection {
        return MIRROR_DIRECTIONS[Math.abs(seed || 0) % MIRROR_DIRECTIONS.length];
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
        graphics.stroke();
    }

    private drawMirrorCell(graphics: cc.Graphics, x: number, y: number, size: number, valid: boolean, direction: TurnMirrorDirection) {
        graphics.fillColor = valid ? new cc.Color(180, 196, 236, 255) : new cc.Color(210, 60, 60, 255);
        if (direction === "bl") {
            graphics.moveTo(x, y);
            graphics.lineTo(x + size, y);
            graphics.lineTo(x, y + size);
        }
        else if (direction === "br") {
            graphics.moveTo(x, y);
            graphics.lineTo(x + size, y);
            graphics.lineTo(x + size, y + size);
        }
        else if (direction === "tl") {
            graphics.moveTo(x, y);
            graphics.lineTo(x, y + size);
            graphics.lineTo(x + size, y + size);
        }
        else {
            graphics.moveTo(x, y + size);
            graphics.lineTo(x + size, y + size);
            graphics.lineTo(x + size, y);
        }
        graphics.close();
        graphics.fill();
        graphics.strokeColor = new cc.Color(255, 255, 255, 220);
        graphics.lineWidth = 2;
        graphics.moveTo(x, y);
        graphics.lineTo(x + size, y + size);
        if (direction === "br" || direction === "tl") {
            graphics.moveTo(x, y + size);
            graphics.lineTo(x + size, y);
        }
        graphics.stroke();
    }

    private countPlacedEnergyTowers(camp: TurnCamp): number {
        let total = 0;
        for (let i = 0; i < this._obstacles.length; i++) {
            let obstacle = this._obstacles[i];
            if (obstacle.camp === camp && obstacle.slotType === "energy") {
                total += Math.max(1, obstacle.resourceCount);
            }
        }
        return total;
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
        for (let i = 0; i < this._assistZones.length; i++) {
            let zone = this._assistZones[i];
            if (zone.type !== "black_hole") {
                continue;
            }

            let zonePosition = this.getNodePosition(zone.node);
            let offset = zonePosition.sub(bulletPosition);
            let distance = offset.mag();
            if (distance <= 1 || distance > zone.radius) {
                continue;
            }

            let ratio = 1 - distance / zone.radius;
            bullet.dir = bullet.dir.add(offset.normalize().mul(this._config.blackHoleStrength * ratio * dt)).normalize();
            bullet.node.angle = this.vectorToAngle(bullet.dir) - 90;
        }
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
            bullet.node.setPosition(position.x, position.y);
            bullet.node.angle = this.vectorToAngle(bullet.dir) - 90;
        }
        return true;
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
        let slots = this._config.obstacleSlots || [];
        for (let s = 0; s < slots.length; s++) {
            this.getObstacleSlotState("A", slots[s].type).placedObstacleId = "";
            this.getObstacleSlotState("B", slots[s].type).placedObstacleId = "";
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
            this.createAssistZone(zone.camp, "black_hole", cc.v2(Number(zone.x) || 0, Number(zone.y) || 0), id);
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
        this.parseStaticObstacles();
        this.parseTurnAreas();
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
                this._staticObstacles.push({
                    id: this._nextStaticObstacleId++,
                    name: item && item.name ? item.name : "obstacle",
                    rect: rect,
                });
            }
            if (this._staticObstacles.length > 0) {
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
                this._staticObstacles.push({
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

    private redrawObstacle(obstacle: TurnObstacleState) {
        let graphics = obstacle.node.getComponent(cc.Graphics);
        if (graphics) {
            graphics.clear();
            this.drawObstacleGraphics(graphics, obstacle.camp, true, obstacle.slotType, obstacle.layout, obstacle.mirrorDir);
        }
    }

    private getObstacleMaxHp(slotType: TurnObstacleResourceType, resourceCount: number): number {
        if (slotType === "exp" || slotType === "energy") {
            return this._config.obstacleBaseHp;
        }
        return Math.min(this._config.obstacleMaxHp, this._config.obstacleBaseHp * Math.max(1, resourceCount));
    }

    private refreshObstacleHpLabel(obstacle: TurnObstacleState) {
        let labelNode = obstacle.node.children && obstacle.node.children.length > 0
            ? obstacle.node.children.filter((child) => child.getComponent(cc.Label))[0]
            : null;
        let label = labelNode ? labelNode.getComponent(cc.Label) : null;
        if (label) {
            label.string = String(obstacle.hp);
        }
    }

    private getObstacleDestroyExp(obstacle: TurnObstacleState): number {
        if (obstacle.slotType === "exp") {
            return this._config.expWallDestroyExp;
        }
        return this._config.obstacleHitExp;
    }

    private clearObstaclePlacedSlot(obstacle: TurnObstacleState) {
        let slot = this.getObstacleSlotState(obstacle.camp, obstacle.slotType);
        if (slot && slot.placedObstacleId === obstacle.id) {
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
            if (nextPhase === "zone") {
                this.spawnRoundAssistZone();
            }
            else if (nextPhase === "upgrade" || nextPhase === "build" || nextPhase === "finish" || nextPhase === "init") {
                this.clearAssistZones();
            }
        }
    }

    private spawnRoundAssistZone() {
        this.clearAssistZones();
        let point = this.findAssistZoneSpawnPoint();
        if (!point) {
            cc.warn("[TurnBattleMap] failed to find assist zone spawn point");
            return;
        }
        this.createAssistZone("A", "black_hole", point);
        this.showFloatText("放置黑洞区", point.add(cc.v2(0, this._config.assistZoneRadius + 18)), new cc.Color(255, 255, 255, 255));
    }

    private clearAssistZones() {
        for (let i = 0; i < this._assistZones.length; i++) {
            this._assistZones[i].node.destroy();
        }
        this._assistZones = [];
    }

    private findAssistZoneSpawnPoint(): cc.Vec2 {
        if (!this._assistArea) {
            return null;
        }
        let center = cc.v2(this._assistArea.x + this._assistArea.width / 2, this._assistArea.y + this._assistArea.height / 2);
        if (this.isZonePositionValid("A", center)) {
            return center;
        }
        let samples = [
            cc.v2(this._assistArea.x + this._assistArea.width * 0.25, center.y),
            cc.v2(this._assistArea.x + this._assistArea.width * 0.75, center.y),
            cc.v2(center.x, this._assistArea.y + this._assistArea.height * 0.3),
            cc.v2(center.x, this._assistArea.y + this._assistArea.height * 0.7),
        ];
        for (let i = 0; i < samples.length; i++) {
            if (this.isZonePositionValid("A", samples[i])) {
                return samples[i];
            }
        }
        return null;
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
        let camp = this._serverMode ? this._localCamp : this._actionCamp;
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
