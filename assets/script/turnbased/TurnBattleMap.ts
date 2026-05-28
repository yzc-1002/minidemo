import { TurnAssistZoneType, TurnCamp, TurnGameConfig, TurnPhase, TurnUpgradeConfig, TurnUpgradeId, TURN_GAME_CONFIG } from "../config/TurnGame";
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

interface TurnCrystalState {
    node: cc.Node;
    hp: number;
    maxHp: number;
    hpLabel: cc.Label;
    radius: number;
}

interface TurnObstacleState {
    id: string;
    camp: TurnCamp;
    node: cc.Node;
    radius: number;
    width: number;
    height: number;
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
    level: number;
    damageBonus: number;
    extraShots: number;
    bulletBounce: number;
    blackHoleUnlocked: boolean;
    zoneInventory: { [type: string]: number };
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
    onBuildIntent: (action: { op: string; obstacleId?: string; x: number; y: number; }) => void = null;
    onZoneIntent: (action: { zoneType: string; x: number; y: number; }) => void = null;
    onAttackIntent: (action: { fromX: number; fromY: number; aimX: number; aimY: number; shotIndex: number; }) => void = null;

    private _config: TurnGameConfig = TURN_GAME_CONFIG;
    private _crystals: { [camp: string]: TurnCrystalState } = {};
    private _tanks: { [camp: string]: cc.Node } = {};
    private _obstacleInventory: { [camp: string]: number } = { A: 0, B: 0 };
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
        expGain: 0,
    };

    private _mapNode: cc.Node = null;
    private _tiledMap: cc.TiledMap = null;
    private _mapPixelSize: cc.Size = cc.size(TURN_GAME_CONFIG.mapWidth, TURN_GAME_CONFIG.mapHeight);
    private _tileSize: cc.Size = cc.size(1, 1);
    private _mapTileSize: cc.Size = cc.size(1, 1);

    private _obstacleLayer: cc.Node = null;
    private _bulletLayer: cc.Node = null;
    private _zoneLayer: cc.Node = null;
    private _effectLayer: cc.Node = null;

    private _roads: { [camp: string]: cc.Rect } = { A: null, B: null };
    private _buildAreas: { [camp: string]: cc.Rect } = { A: null, B: null };
    private _noBuildAreas: cc.Rect[] = [];
    private _spawnPoints: { [name: string]: cc.Vec2 } = {};
    private _pointSource = "fallback";
    private _roadSource = "fallback";
    private _buildSource = "fallback";

    private readonly _dynamicObstacleSize = cc.size(56, 44);

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
        this._nextObstacleId = 1;
        this._nextStaticObstacleId = 1;
        this._nextAssistZoneId = 1;
        this._gameFinished = false;
        this._pendingBulletResult = {
            hitType: "",
            targetCamp: "",
            targetId: "",
            damage: 0,
            destroyedIds: [],
            expGain: 0,
        };
        this._mapNode = null;
        this._tiledMap = null;
        this._mapPixelSize = cc.size(this._config.mapWidth, this._config.mapHeight);
        this._tileSize = cc.size(1, 1);
        this._mapTileSize = cc.size(1, 1);
        this._obstacleLayer = null;
        this._bulletLayer = null;
        this._zoneLayer = null;
        this._effectLayer = null;
        this._obstacleInventory = {
            A: this._config.initialObstacles,
            B: this._config.initialObstacles,
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
    }

    update(dt: number) {
        this.updateBullets(dt);
    }

    setServerMode(enabled: boolean) {
        this._serverMode = !!enabled;
    }

    refreshForNewRound(roundIndex: number) {
        if (roundIndex > 1) {
            this._obstacleInventory.A += this._config.obstacleGainPerRound;
            this._obstacleInventory.B += this._config.obstacleGainPerRound;
            if (this.getCampStats("A").blackHoleUnlocked) {
                this.getCampStats("A").zoneInventory.black_hole += 1;
            }
            if (this.getCampStats("B").blackHoleUnlocked) {
                this.getCampStats("B").zoneInventory.black_hole += 1;
            }
        }
    }

    setTurnSnapshot(snapshot: TurnStateSnapshot) {
        this._phase = snapshot.phase;
        this.setActionCamp(snapshot.actionCamp);

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

        this._obstacleInventory.A = Math.max(0, Number(inventoriesA.obstacles) || 0);
        this._obstacleInventory.B = Math.max(0, Number(inventoriesB.obstacles) || 0);

        statsA.exp = Math.max(0, Number(expA.exp) || 0);
        statsB.exp = Math.max(0, Number(expB.exp) || 0);
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

        this.syncCrystalState("A", snapshot.crystals && snapshot.crystals.A);
        this.syncCrystalState("B", snapshot.crystals && snapshot.crystals.B);
        this.syncObstacleState(snapshot.obstacles || []);
        this.syncAssistZoneState(snapshot.zones || []);
        this.emitStatsChanged();
    }

    applyServerAttackAction(payload: any) {
        if (!payload || !payload.action) {
            return;
        }

        let camp = (payload.camp || this._actionCamp || "A") as TurnCamp;
        let action = payload.action;
        let tank = this._tanks[camp];
        if (!tank) {
            return;
        }

        let fromX = Number(action.fromX);
        let fromY = Number(action.fromY);
        if (Number.isFinite(fromX)) {
            tank.x = fromX;
        }
        if (Number.isFinite(fromY)) {
            tank.y = fromY;
        }

        let startPosition = this.getNodePosition(tank);
        let target = cc.v2(Number(action.aimX) || startPosition.x, Number(action.aimY) || startPosition.y);
        let dir = target.sub(startPosition);
        if (dir.magSqr() < 1) {
            dir = camp === "A" ? cc.v2(0, 1) : cc.v2(0, -1);
        }
        this.createBullet(camp, startPosition.add(dir.normalize().mul(44)), dir.normalize());
    }

    consumePendingBulletResult() {
        let result = {
            hitType: this._pendingBulletResult.hitType,
            targetCamp: this._pendingBulletResult.targetCamp,
            targetId: this._pendingBulletResult.targetId,
            damage: this._pendingBulletResult.damage,
            destroyedIds: this._pendingBulletResult.destroyedIds.slice(),
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

    hasActiveBullets(): boolean {
        return this._bullets.length > 0;
    }

    getObstacleInventory(camp: TurnCamp): number {
        return this._obstacleInventory[camp] || 0;
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

    getBlackHoleInventory(camp: TurnCamp): number {
        return this.getCampStats(camp).zoneInventory.black_hole || 0;
    }

    grantRoundBaseExp() {
        this.addExp("A", this._config.baseExpPerRound, cc.v2(-160, 0));
        this.addExp("B", this._config.baseExpPerRound, cc.v2(160, 0));
    }

    canCampUpgrade(camp: TurnCamp): boolean {
        return this.getCampStats(camp).exp >= this._config.levelUpExp && this.getUpgradeOptions(camp).length > 0;
    }

    getUpgradeOptions(camp: TurnCamp): TurnUpgradeConfig[] {
        let stats = this.getCampStats(camp);
        let pool: TurnUpgradeConfig[] = [];
        for (let i = 0; i < this._config.upgradePool.length; i++) {
            let option = this._config.upgradePool[i];
            if (option.id === "unlock_black_hole" && stats.blackHoleUnlocked) {
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
        if (stats.exp < this._config.levelUpExp) {
            return;
        }

        stats.exp -= this._config.levelUpExp;
        stats.level += 1;
        if (upgradeId === "bullet_bounce") {
            stats.bulletBounce += 1;
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

    isBuildPositionValid(camp: TurnCamp, position: cc.Vec2, ignoreObstacleId?: string): boolean {
        let buildArea = this.getBuildArea(camp);
        let obstacleRect = this.getDynamicObstacleRectAt(position);
        if (!buildArea || !this.rectContainsRect(buildArea, obstacleRect) || !this.rectContainsRect(this.getMapRect(), obstacleRect)) {
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
            if (this.rectOverlaps(this.getDynamicObstacleRect(obstacle), obstacleRect)) {
                return false;
            }
        }

        return true;
    }

    private onTouchStart(event: cc.Event.EventTouch) {
        let position = this.getLocalTouchPosition(event);
        if (this._phase === "build") {
            this._dragObstacle = this.findObstacleAt(position);
            if (this._dragObstacle && this._dragObstacle.camp !== "A") {
                this._dragObstacle = null;
            }
            if (this._dragObstacle) {
                this._dragStartPosition = this.getNodePosition(this._dragObstacle.node);
                this._dragObstacle.node.opacity = 180;
            }
            return;
        }

        if (this._phase === "attack") {
            if (this._actionCamp !== "A") {
                return;
            }
            this.moveActionTank(position);
        }
    }

    private onTouchMove(event: cc.Event.EventTouch) {
        let position = this.getLocalTouchPosition(event);
        if (this._phase === "build" && this._dragObstacle) {
            this._dragObstacle.node.setPosition(position.x, position.y);
            this.updateObstacleValidView(this._dragObstacle, this.isBuildPositionValid(this._dragObstacle.camp, position, this._dragObstacle.id));
            return;
        }

        if (this._phase === "attack") {
            if (this._actionCamp !== "A") {
                return;
            }
            this.moveActionTank(position);
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
            if (this._actionCamp !== "A") {
                return;
            }
            this.moveActionTank(position);
            this.fireActionTank(position);
        }
    }

    private onTouchCancel() {
        if (!this._dragObstacle) {
            return;
        }

        this._dragObstacle.node.setPosition(this._dragStartPosition.x, this._dragStartPosition.y);
        this._dragObstacle.node.opacity = 255;
        this.updateObstacleValidView(this._dragObstacle, true);
        this._dragObstacle = null;
        this._dragStartPosition = null;
    }

    private finishBuildTouch(position: cc.Vec2) {
        if (this._dragObstacle) {
            let obstacle = this._dragObstacle;
            let valid = this.isBuildPositionValid(obstacle.camp, position, obstacle.id);
            obstacle.node.opacity = 255;
            if (valid) {
                obstacle.node.setPosition(position.x, position.y);
                this.updateObstacleValidView(obstacle, true);
                if (this._serverMode && this.onBuildIntent) {
                    this.onBuildIntent({
                        op: "move",
                        obstacleId: obstacle.id,
                        x: position.x,
                        y: position.y,
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
            return;
        }

        let camp = this.getBuildCampAt(position);
        if (!camp || camp !== "A") {
            this.showFloatText("只能放在己方建造区", position, cc.Color.RED);
            return;
        }
        if (this.getObstacleInventory(camp) <= 0) {
            this.showFloatText("掩体库存不足", position, cc.Color.RED);
            return;
        }
        if (!this.isBuildPositionValid(camp, position)) {
            this.showFloatText("位置不可用", position, cc.Color.RED);
            return;
        }

        if (this._serverMode) {
            if (this.onBuildIntent) {
                this.onBuildIntent({
                    op: "place",
                    x: position.x,
                    y: position.y,
                });
            }
            return;
        }

        this.createBuildObstacle(camp, position);
        this._obstacleInventory[camp] -= 1;
        this.emitStatsChanged();
    }

    private finishZoneTouch(position: cc.Vec2) {
        let camp = this.getBuildCampAt(position);
        if (!camp || camp !== "A") {
            this.showFloatText("只能放在己方区域", position, cc.Color.RED);
            return;
        }

        let stats = this.getCampStats(camp);
        if (!stats.blackHoleUnlocked) {
            this.showFloatText("尚未解锁黑洞区", position, cc.Color.RED);
            return;
        }
        if (this.getBlackHoleInventory(camp) <= 0) {
            this.showFloatText("黑洞区库存不足", position, cc.Color.RED);
            return;
        }
        if (!this.isZonePositionValid(camp, position)) {
            this.showFloatText("位置不可用", position, cc.Color.RED);
            return;
        }

        if (this._serverMode) {
            if (this.onZoneIntent) {
                this.onZoneIntent({
                    zoneType: "black_hole",
                    x: position.x,
                    y: position.y,
                });
            }
            return;
        }

        this.createAssistZone(camp, "black_hole", position);
        stats.zoneInventory.black_hole -= 1;
        this.emitStatsChanged();
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
            tank.x = Math.max(minX, Math.min(maxX, position.x));
            tank.y = road.y + road.height / 2;
            return;
        }

        let halfWidth = this._config.mapWidth / 2 - 40;
        let x = Math.max(-halfWidth, Math.min(halfWidth, position.x));
        tank.x = x;
        tank.y = this._config.roadY[this._actionCamp];
    }

    private fireActionTank(targetPosition: cc.Vec2) {
        if (this._shotsLeftInAction <= 0 || this._gameFinished) {
            return;
        }

        let tank = this._tanks[this._actionCamp];
        if (!tank) {
            return;
        }

        if (this._serverMode) {
            let startPosition = this.getNodePosition(tank);
            let totalShots = 1 + this.getCampStats(this._actionCamp).extraShots;
            let shotIndex = Math.max(0, totalShots - this._shotsLeftInAction);
            this._shotsLeftInAction = Math.max(0, this._shotsLeftInAction - 1);
            if (this.onAttackIntent) {
                this.onAttackIntent({
                    fromX: startPosition.x,
                    fromY: startPosition.y,
                    aimX: targetPosition.x,
                    aimY: targetPosition.y,
                    shotIndex: shotIndex,
                });
            }
            return;
        }

        let startPosition = this.getNodePosition(tank);
        let dir = targetPosition.sub(startPosition);
        if (dir.magSqr() < 1) {
            dir = this._actionCamp === "A" ? cc.v2(0, 1) : cc.v2(0, -1);
        }
        dir = dir.normalize();

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
            if (!this.circleRectIntersects(this.getNodePosition(bullet.node), bullet.radius, this.getDynamicObstacleRect(obstacle))) {
                continue;
            }

            obstacle.node.destroy();
            this._obstacles.splice(i, 1);
            this.addExp(bullet.camp, this._config.obstacleHitExp, this.getNodePosition(bullet.node));
            if (this._serverMode && bullet.camp === "A" && this._pendingBulletResult.destroyedIds.indexOf(obstacle.id) < 0) {
                this._pendingBulletResult.hitType = this._pendingBulletResult.hitType || "obstacle";
                this._pendingBulletResult.destroyedIds.push(obstacle.id);
            }
            this.emitTurnEvent("turn-obstacle-hit", {
                camp: bullet.camp,
                obstacleCamp: obstacle.camp,
                obstacleId: obstacle.id,
                expGain: this._config.obstacleHitExp,
            });
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
            return true;
        }
        return false;
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

    private createBuildObstacle(camp: TurnCamp, position: cc.Vec2, forcedId?: string) {
        let node = new cc.Node("BuildObstacle" + this._nextObstacleId);
        node.parent = this._obstacleLayer || this.contentRoot;
        node.setPosition(position.x, position.y);

        let graphics = node.addComponent(cc.Graphics);
        this.drawObstacleGraphics(graphics, camp, true);

        let label = this.createLabel(camp, 16);
        label.node.parent = node;
        label.node.y = -8;

        this._obstacles.push({
            id: forcedId || String(this._nextObstacleId++),
            camp: camp,
            node: node,
            radius: Math.max(this._dynamicObstacleSize.width, this._dynamicObstacleSize.height) * 0.5,
            width: this._dynamicObstacleSize.width,
            height: this._dynamicObstacleSize.height,
        });
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
        this.showFloatText("放置黑洞区", position.add(cc.v2(0, this._config.assistZoneRadius + 18)), new cc.Color(255, 255, 255, 255));
    }

    private isZonePositionValid(camp: TurnCamp, position: cc.Vec2): boolean {
        let buildArea = this.getBuildArea(camp);
        let zoneRect = cc.rect(
            position.x - this._config.assistZoneRadius,
            position.y - this._config.assistZoneRadius,
            this._config.assistZoneRadius * 2,
            this._config.assistZoneRadius * 2,
        );
        if (!buildArea || !this.rectContainsRect(buildArea, zoneRect) || !this.rectContainsRect(this.getMapRect(), zoneRect)) {
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
        this.drawObstacleGraphics(graphics, obstacle.camp, valid);
    }

    private drawObstacleGraphics(graphics: cc.Graphics, camp: TurnCamp, valid: boolean) {
        graphics.fillColor = valid
            ? (camp === "A" ? new cc.Color(99, 156, 106, 255) : new cc.Color(161, 96, 108, 255))
            : new cc.Color(210, 60, 60, 255);
        graphics.roundRect(
            -this._dynamicObstacleSize.width / 2,
            -this._dynamicObstacleSize.height / 2,
            this._dynamicObstacleSize.width,
            this._dynamicObstacleSize.height,
            8,
        );
        graphics.fill();
        graphics.strokeColor = new cc.Color(240, 240, 240, 180);
        graphics.lineWidth = 2;
        graphics.roundRect(
            -this._dynamicObstacleSize.width / 2,
            -this._dynamicObstacleSize.height / 2,
            this._dynamicObstacleSize.width,
            this._dynamicObstacleSize.height,
            8,
        );
        graphics.stroke();
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
        let tankPosition = this.getSpawnPosition("tank" + camp, cc.v2(0, this.getRoadCenterY(camp)));
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

    private createTank(camp: TurnCamp, position: cc.Vec2): cc.Node {
        let node = new cc.Node("TurnTank" + camp);
        node.parent = this._obstacleLayer || this.contentRoot;
        node.setPosition(position.x, position.y);

        let graphics = node.addComponent(cc.Graphics);
        graphics.fillColor = camp === "A" ? new cc.Color(92, 214, 124, 255) : new cc.Color(224, 96, 112, 255);
        graphics.roundRect(-34, -18, 68, 36, 8);
        graphics.fill();
        graphics.fillColor = new cc.Color(235, 235, 235, 255);
        graphics.rect(-6, camp === "A" ? 0 : -36, 12, 36);
        graphics.fill();

        let label = this.createLabel(camp, 18);
        label.node.parent = node;
        label.node.y = -2;
        this.updateTankState(camp, false);
        return node;
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

        tank.opacity = active ? 255 : 100;
        tank.scale = active ? 1.08 : 1;
    }

    private createCampStats(): TurnCampStats {
        return {
            exp: 0,
            level: 1,
            damageBonus: 0,
            extraShots: 0,
            bulletBounce: 0,
            blackHoleUnlocked: false,
            zoneInventory: {
                black_hole: 0,
            },
        };
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
            if (this.circleRectIntersects(position, 1, this.getDynamicObstacleRect(obstacle))) {
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
        for (let i = 0; i < this._obstacles.length; i++) {
            this._obstacles[i].node.destroy();
        }
        this._obstacles = [];
        let maxId = this._nextObstacleId;
        for (let j = 0; j < obstacles.length; j++) {
            let obstacle = obstacles[j];
            if (!obstacle) {
                continue;
            }
            let id = String(obstacle.id);
            this.createBuildObstacle(obstacle.camp, cc.v2(Number(obstacle.x) || 0, Number(obstacle.y) || 0), id);
            let numericId = parseInt(id, 10);
            if (Number.isFinite(numericId)) {
                maxId = Math.max(maxId, numericId + 1);
            }
        }
        this._nextObstacleId = maxId;
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

    private resetPendingBulletResult() {
        this._pendingBulletResult.hitType = "";
        this._pendingBulletResult.targetCamp = "";
        this._pendingBulletResult.targetId = "";
        this._pendingBulletResult.damage = 0;
        this._pendingBulletResult.destroyedIds = [];
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
        this.fitMapToView();
    }

    private ensureRuntimeLayers() {
        this._obstacleLayer = this.ensureLayerNode("TurnObstacleLayer", 10);
        this._bulletLayer = this.ensureLayerNode("TurnBulletLayer", 20);
        this._zoneLayer = this.ensureLayerNode("TurnZoneLayer", 30);
        this._effectLayer = this.ensureLayerNode("TurnEffectLayer", 40);
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

        let tankA = this.getSpawnPosition("tankA", cc.v2(0, this._config.roadY.A));
        let tankB = this.getSpawnPosition("tankB", cc.v2(0, this._config.roadY.B));
        let crystalA = this.getSpawnPosition("crystalA", cc.v2(0, this._config.crystalY.A));
        let crystalB = this.getSpawnPosition("crystalB", cc.v2(0, this._config.crystalY.B));
        this._roads.A = this.pickClosestRect(areaRects.roadA.concat(areaRects.roadB), tankA.y) || this.deriveRoadRect("A");
        this._roads.B = this.pickClosestRect(areaRects.roadA.concat(areaRects.roadB), tankB.y, this._roads.A) || this.deriveRoadRect("B");
        this._buildAreas.A = this.pickClosestRect(areaRects.buildA.concat(areaRects.buildB), crystalA.y) || this.deriveBuildRect("A");
        this._buildAreas.B = this.pickClosestRect(areaRects.buildA.concat(areaRects.buildB), crystalB.y, this._buildAreas.A) || this.deriveBuildRect("B");

        let hasRoadObjects = areaRects.roadA.length + areaRects.roadB.length > 0;
        let hasBuildObjects = areaRects.buildA.length + areaRects.buildB.length > 0;
        this._roadSource = hasRoadObjects ? "_tmLayerTurnAreas" : "derived";
        this._buildSource = hasBuildObjects ? "_tmLayerTurnAreas" : "derived";
        if (hasRoadObjects && (!this._roads.A || !this._roads.B)) {
            this._roadSource = "partial _tmLayerTurnAreas + derived";
        }
        if (hasBuildObjects && (!this._buildAreas.A || !this._buildAreas.B)) {
            this._buildSource = "partial _tmLayerTurnAreas + derived";
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

    private getDynamicObstacleRectAt(position: cc.Vec2): cc.Rect {
        return cc.rect(
            position.x - this._dynamicObstacleSize.width / 2,
            position.y - this._dynamicObstacleSize.height / 2,
            this._dynamicObstacleSize.width,
            this._dynamicObstacleSize.height,
        );
    }

    private getDynamicObstacleRect(obstacle: TurnObstacleState): cc.Rect {
        return cc.rect(
            obstacle.node.x - obstacle.width / 2,
            obstacle.node.y - obstacle.height / 2,
            obstacle.width,
            obstacle.height,
        );
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

    private circleRectIntersects(center: cc.Vec2, radius: number, rect: cc.Rect): boolean {
        let nearestX = Math.max(rect.x, Math.min(center.x, rect.x + rect.width));
        let nearestY = Math.max(rect.y, Math.min(center.y, rect.y + rect.height));
        let dx = center.x - nearestX;
        let dy = center.y - nearestY;
        return dx * dx + dy * dy <= radius * radius;
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
        if (item.x != null && item.y != null) {
            return cc.v2(item.x, item.y);
        }
        if (item.offset) {
            return cc.v2(item.offset.x || 0, item.offset.y || 0);
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
        let runtimeLayerReady = !!(this._obstacleLayer && this._bulletLayer && this._zoneLayer && this._effectLayer);
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
}
