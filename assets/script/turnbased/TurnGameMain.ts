import { TURN_GAME_CONFIG, TurnCamp, TurnGameConfig, TurnUpgradeConfig, TurnUpgradeId } from "../config/TurnGame";
import { NetworkManager } from "../network/NetworkManager";
import TurnBattleMap from "./TurnBattleMap";
import TurnHud from "./TurnHud";
import { TurnStateMachine, TurnStateSnapshot } from "./TurnStateMachine";

const { ccclass, property } = cc._decorator;
const TURN_SERVER_URL = "ws://172.16.50.45:2567";

@ccclass
export default class TurnGameMain extends cc.Component {
    @property(cc.Prefab)
    gameMapPrefab: cc.Prefab = null;

    @property(cc.Node)
    mapRoot: cc.Node = null;

    @property(cc.Node)
    hudRoot: cc.Node = null;

    @property
    autoStart = true;

    @property
    useServer = true;

    private _config: TurnGameConfig = TURN_GAME_CONFIG;
    private _stateMachine: TurnStateMachine = new TurnStateMachine();
    private _battleMap: TurnBattleMap = null;
    private _hud: TurnHud = null;
    private _lastRoundIndex = 0;
    private _upgradeQueue: TurnCamp[] = [];
    private _currentUpgradeCamp: TurnCamp = null;
    private _upgradeHintToken = 0;
    private _netManager: NetworkManager = null;
    private _serverSnapshot: any = null;
    private _serverCamp: TurnCamp = "A";
    private _upgradeOptions: TurnUpgradeConfig[] = [];
    private _serverConnected = false;
    private _waitingForOwnUpgradeResult = false;
    private readonly _legacyNodeNames = [
        "_tiled",
        "_joystick",
        "_lyStart",
        "_ui",
        "_toggle",
        "_btnSetting",
        "_btnTest",
        "_btnWish",
        "_btnCircle",
        "_btnCube",
        "_preDefense",
        "_preBullet",
        "_recommendBtns",
        "_nUpdate",
    ];

    onLoad() {
        this.disableLegacyRealtimeNodes();
        this.ensureRoots();
        this.ensureMapPrefab();
        this._battleMap.onStatsChanged = this.refreshHudNumbers.bind(this);
        this._battleMap.onAttackFired = this.completeCurrentAttack.bind(this);
        this._battleMap.onBulletsCleared = this.notifyBulletsClear.bind(this);
        this._battleMap.onGameFinished = this.finishMatch.bind(this);
        this._battleMap.onBuildIntent = this.sendBuildIntent.bind(this);
        this._battleMap.onZoneIntent = this.sendZoneIntent.bind(this);
        this._battleMap.onAttackIntent = this.sendAttackIntent.bind(this);
        this._battleMap.onTankPoseIntent = this.sendTankPoseIntent.bind(this);
        this._hud.onBuildDragStart = this.onHudBuildDragStart.bind(this);
        this._hud.onBuildDragMove = this.onHudBuildDragMove.bind(this);
        this._hud.onBuildDragEnd = this.onHudBuildDragEnd.bind(this);
        this._hud.onBuildDragCancel = this.onHudBuildDragCancel.bind(this);
        this._hud.onMoveLeft = this.onHudMoveLeft.bind(this);
        this._hud.onMoveRight = this.onHudMoveRight.bind(this);
        this._stateMachine.init(this._config, {
            onTurnPhaseChanged: this.onTurnPhaseChanged.bind(this),
            onTurnTimer: this.onTurnTimer.bind(this),
        });
    }

    start() {
        this._hud.initHud();
        this.refreshHudNumbers();

        if (!this.ensureMapPrefab()) {
            return;
        }

        this._battleMap.initMap(this._config);
        this._battleMap.setServerMode(this.useServer);
        this.syncHudBuildPalettePosition();

        if (this.useServer) {
            this.connectTurnServer();
        }
        else if (this.autoStart) {
            this._battleMap.setLocalCamp("A");
            this.startMatch();
        }
    }

    update(dt: number) {
        if (!this.useServer) {
            this._stateMachine.update(dt);
        }
    }

    startMatch() {
        if (this.useServer) {
            this._waitingForOwnUpgradeResult = false;
            if (!this._serverConnected) {
                this.connectTurnServer();
                return;
            }
            this._hud.hideSettlement();
            this._hud.hideUpgradeOptions();
            this._hud.showUpgradeHint("正在等待匹配...");
            return;
        }
        this._lastRoundIndex = 0;
        this._upgradeHintToken += 1;
        this._hud.hideSettlement();
        this._hud.hideUpgradeOptions();
        this._stateMachine.startMatch();
    }

    stopMatch() {
        if (!this.useServer) {
            this._stateMachine.stopMatch();
        }
    }

    finishMatch(winnerCamp: TurnCamp) {
        if (!this.useServer) {
            this._stateMachine.finishMatch(winnerCamp);
        }
        this.refreshHudNumbers();
        this._hud.showSettlement(winnerCamp, this.restartMatch.bind(this));
        this.emitTurnEvent("turn-game-ended", { winnerCamp: winnerCamp });
    }

    restartMatch() {
        this.unscheduleAllCallbacks();
        this._upgradeHintToken += 1;
        this._upgradeQueue = [];
        this._currentUpgradeCamp = null;
        this._waitingForOwnUpgradeResult = false;
        this._hud.hideSettlement();
        this._hud.hideUpgradeOptions();
        this._battleMap.initMap(this._config);
        this._battleMap.setServerMode(this.useServer);
        this._battleMap.setLocalCamp(this.getLocalCamp());
        this.syncHudBuildPalettePosition();
        this.refreshHudNumbers();
        if (this.useServer) {
            this._serverSnapshot = null;
            this._upgradeOptions = [];
            this.connectTurnServer();
            return;
        }
        this._stateMachine.init(this._config, {
            onTurnPhaseChanged: this.onTurnPhaseChanged.bind(this),
            onTurnTimer: this.onTurnTimer.bind(this),
        });
        this.startMatch();
    }

    completeCurrentAttack() {
        if (!this.useServer) {
            this._stateMachine.completeAttackAction();
        }
    }

    notifyBulletsClear() {
        if (!this.useServer) {
            this._stateMachine.notifyBulletsClear();
            return;
        }
        let result = this._battleMap.consumePendingBulletResult();
        this.sendNetMessage("bulletResult", {
            hitType: result.hitType || "",
            targetCamp: result.targetCamp || "B",
            targetId: result.targetId || "",
            damage: result.damage || 0,
            destroyedIds: result.destroyedIds || [],
            expGain: result.expGain || 0,
        });
    }

    private ensureRoots() {
        if (!this.mapRoot) {
            this.mapRoot = new cc.Node("TurnBattleMap");
            this.mapRoot.parent = this.node;
        }
        if (!this.hudRoot) {
            this.hudRoot = new cc.Node("TurnHud");
            this.hudRoot.parent = this.node;
        }
        this.mapRoot.active = true;
        this.hudRoot.active = true;
        this.mapRoot.setPosition(0, 0);
        this.hudRoot.setPosition(0, 0);
        this.mapRoot.zIndex = 2000;
        this.hudRoot.zIndex = 3000;

        this._battleMap = this.mapRoot.getComponent(TurnBattleMap);
        if (!this._battleMap) {
            this._battleMap = this.mapRoot.addComponent(TurnBattleMap);
        }

        this._hud = this.hudRoot.getComponent(TurnHud);
        if (!this._hud) {
            this._hud = this.hudRoot.addComponent(TurnHud);
        }
    }

    private ensureMapPrefab(): boolean {
        if (this.gameMapPrefab) {
            this._battleMap.tiledMapPrefab = this.gameMapPrefab;
            cc.log("[TurnGame] using bound GameMap prefab", this.gameMapPrefab.name || "unknown");
            return true;
        }

        if (this._battleMap.tiledMapPrefab) {
            this.gameMapPrefab = this._battleMap.tiledMapPrefab;
            cc.log("[TurnGame] using TurnBattleMap tiledMapPrefab", this.gameMapPrefab.name || "unknown");
            return true;
        }

        cc.error("[TurnGame] gameMapPrefab is required. Please bind assets/prefab/GameMap.prefab on TurnGameMain.prefab.");
        return false;
    }

    private disableLegacyRealtimeNodes() {
        for (let i = 0; i < this._legacyNodeNames.length; i++) {
            let child = this.node.getChildByName(this._legacyNodeNames[i]);
            if (!child) {
                continue;
            }
            child.active = false;
        }
    }

    private onTurnPhaseChanged(snapshot: TurnStateSnapshot) {
        if (this.useServer) {
            return;
        }
        if (snapshot.phase === "build" && this._lastRoundIndex !== snapshot.roundIndex) {
            this._lastRoundIndex = snapshot.roundIndex;
            this._battleMap.refreshForNewRound(snapshot.roundIndex);
            this.refreshHudNumbers();
        }

        this._battleMap.setTurnSnapshot(snapshot);
        this.syncHudBuildPalettePosition();

        this._hud.refreshState(snapshot);
        this.refreshHudNumbers();
        if (snapshot.phase === "upgrade") {
            this.beginUpgradePhase();
        }
        else {
            this._hud.hideUpgradeOptions();
            this._upgradeHintToken += 1;
        }
        this.emitTurnEvent("turn-phase-changed", snapshot);
        cc.log("[TurnGame] phase", snapshot.phase, "round", snapshot.roundIndex, "camp", snapshot.actionCamp);
    }

    private onTurnTimer(snapshot: TurnStateSnapshot) {
        if (this.useServer) {
            return;
        }
        this._hud.refreshTimer(snapshot);
    }

    private refreshHudNumbers() {
        this._hud.refreshCrystals(this._battleMap.getCrystalHp("A"), this._battleMap.getCrystalHp("B"));
        this._hud.refreshInventory(this._battleMap.getObstacleInventory("A"), this._battleMap.getObstacleInventory("B"));
        this._hud.refreshExp(
            this._battleMap.getCampExp("A"),
            this._battleMap.getCampLevel("A"),
            this._battleMap.getCampExpNeed("A"),
            this._battleMap.getCampExp("B"),
            this._battleMap.getCampLevel("B"),
            this._battleMap.getCampExpNeed("B"),
        );
        let activeZones = this._battleMap.getActiveAssistZoneCount();
        this._hud.refreshZones(activeZones, activeZones);
        let localCamp = this.getLocalCamp();
        this._hud.refreshBuildPalette(
            localCamp,
            this._battleMap.getObstacleInventory(localCamp),
            this._battleMap.isBuildPhaseActiveForCamp(localCamp),
        );
        this.refreshMoveButtonsEnabled();
    }

    private beginUpgradePhase() {
        if (this.useServer) {
            if (this._upgradeOptions.length <= 0) {
                this._hud.hideUpgradeOptions();
                if (this._waitingForOwnUpgradeResult) {
                    this._hud.showUpgradeHint("已提交升级，等待服务端确认...");
                }
                else {
                    this._hud.showUpgradeHint("等待服务端下发升级选项...");
                }
                return;
            }
            this._currentUpgradeCamp = "A";
            this._waitingForOwnUpgradeResult = false;
            this._hud.hideUpgradeHint();
            this._hud.showUpgradeOptions("A", this._upgradeOptions, this.onUpgradePicked.bind(this));
            return;
        }
        this._upgradeHintToken += 1;
        this._battleMap.grantRoundBaseExp();
        this.refreshHudNumbers();
        this._upgradeQueue = [];
        if (this._battleMap.canCampUpgrade("A")) {
            this._upgradeQueue.push("A");
        }
        if (this._battleMap.canCampUpgrade("B")) {
            this._upgradeQueue.push("B");
        }
        this.showNextUpgrade();
    }

    private showNextUpgrade() {
        if (this._upgradeQueue.length <= 0) {
            this._currentUpgradeCamp = null;
            this._hud.hideUpgradeOptions();
            let hintToken = ++this._upgradeHintToken;
            this._hud.showUpgradeHint("无人可升级，1 秒后进入下一轮");
            this.scheduleOnce(function () {
                if (this._upgradeHintToken !== hintToken) {
                    return;
                }
                this._hud.hideUpgradeHint();
                this._stateMachine.completeUpgradeAction();
            }.bind(this), 1);
            return;
        }

        this._currentUpgradeCamp = this._upgradeQueue.shift();
        let options = this._battleMap.getUpgradeOptions(this._currentUpgradeCamp);
        if (options.length <= 0) {
            this.showNextUpgrade();
            return;
        }
        this._upgradeHintToken += 1;
        this._hud.hideUpgradeHint();
        this._hud.showUpgradeOptions(this._currentUpgradeCamp, options, this.onUpgradePicked.bind(this));
    }

    private onUpgradePicked(upgradeId: TurnUpgradeId) {
        if (!this._currentUpgradeCamp) {
            return;
        }

        if (this.useServer) {
            this.sendNetMessage("upgradePick", {
                optionId: upgradeId,
            });
            this._upgradeOptions = [];
            this._waitingForOwnUpgradeResult = true;
            this._currentUpgradeCamp = null;
            this._hud.hideUpgradeOptions();
            this._hud.showUpgradeHint("已提交升级，等待对手...");
            return;
        }

        let camp = this._currentUpgradeCamp;
        this._battleMap.applyUpgrade(camp, upgradeId);
        this.refreshHudNumbers();
        if (this._battleMap.canCampUpgrade(camp)) {
            this._upgradeQueue.push(camp);
        }
        this.showNextUpgrade();
    }

    private emitTurnEvent(eventName: string, data: any) {
        if (typeof yyp !== "undefined" && yyp.eventCenter) {
            yyp.eventCenter.emit(eventName, data);
        }
    }

    private connectTurnServer() {
        if (this._netManager) {
            this._netManager.onDisconnect = null;
            this._netManager.disconnect();
            this._netManager = null;
        }

        this._serverConnected = false;
        this._hud.showUpgradeHint("正在连接回合制服务器...");
        this._netManager = new NetworkManager();
        this._netManager.onTurnConnected = function () {
            this._serverConnected = true;
            this.sendNetMessage("joinTurnRoom", {});
        }.bind(this);
        this._netManager.onTurnMessage = this.handleTurnServerMessage.bind(this);
        this._netManager.onDisconnect = function () {
            this._serverConnected = false;
            this._upgradeOptions = [];
            this._waitingForOwnUpgradeResult = false;
            this._currentUpgradeCamp = null;
            this._hud.hideUpgradeOptions();
            this._hud.showUpgradeHint("连接断开，请点击重新开始重连");
        }.bind(this);
        this._netManager.connect(TURN_SERVER_URL);
    }

    private handleTurnServerMessage(msg: any) {
        if (!msg) {
            return;
        }

        if (msg.type === "turnJoined") {
            this._serverCamp = (msg.camp || "A") as TurnCamp;
            this._battleMap.setLocalCamp(this._serverCamp);
            this.refreshHudNumbers();
            this._hud.showUpgradeHint("已进入房间，等待另一名玩家...");
            return;
        }
        if (msg.type === "turnPlayerCount") {
            this._hud.showUpgradeHint("房间人数 " + (msg.count || 1) + "/" + (msg.max || 2));
            return;
        }
        if (msg.type === "turnGameStart") {
            this._serverCamp = (msg.camp || "A") as TurnCamp;
            this._battleMap.setLocalCamp(this._serverCamp);
            this._upgradeOptions = [];
            this._waitingForOwnUpgradeResult = false;
            this._hud.hideUpgradeHint();
            this.refreshHudNumbers();
            return;
        }
        if (msg.type === "phaseChanged") {
            this.applyServerPhase(msg);
            return;
        }
        if (msg.type === "timerSync") {
            this.applyServerTimer(msg);
            return;
        }
        if (msg.type === "stateSnapshot") {
            this._serverSnapshot = msg;
            this._battleMap.applyServerState(msg);
            this.refreshHudNumbers();
            return;
        }
        if (msg.type === "attackAction") {
            this._battleMap.applyServerAttackAction(msg);
            return;
        }
        if (msg.type === "tankPose") {
            this._battleMap.applyServerTankPose(msg);
            return;
        }
        if (msg.type === "upgradeOptions") {
            this._upgradeOptions = Array.isArray(msg.options) ? msg.options : [];
            this._waitingForOwnUpgradeResult = false;
            if (this._serverSnapshot && this._serverSnapshot.phase === "upgrade") {
                this.beginUpgradePhase();
            }
            return;
        }
        if (msg.type === "upgradePick") {
            if ((msg.camp || "B") === "A") {
                this._upgradeOptions = [];
                this._waitingForOwnUpgradeResult = false;
                this._currentUpgradeCamp = null;
                this._hud.hideUpgradeOptions();
                this._hud.showUpgradeHint("升级已确认");
            }
            else if (this._serverSnapshot && this._serverSnapshot.phase === "upgrade" && this._upgradeOptions.length <= 0) {
                this._hud.showUpgradeHint("对手已确认升级");
            }
            return;
        }
        if (msg.type === "turnGameEnded") {
            this.finishMatch((msg.winnerCamp || "A") as TurnCamp);
            return;
        }
        if (msg.type === "turnError") {
            this._hud.showUpgradeHint(msg.message || "服务器拒绝了当前操作");
        }
    }

    private applyServerPhase(msg: any) {
        let snapshot = this.buildSnapshotFromServer(msg);
        if (snapshot.phase === "build" && this._lastRoundIndex !== snapshot.roundIndex) {
            this._lastRoundIndex = snapshot.roundIndex;
        }
        if (this._serverSnapshot) {
            this._serverSnapshot.phase = snapshot.phase;
            this._serverSnapshot.actionCamp = snapshot.actionCamp;
            this._serverSnapshot.roundIndex = snapshot.roundIndex;
            this._serverSnapshot.attackRoundIndex = snapshot.attackRoundIndex;
        }
        else {
            this._serverSnapshot = {
                phase: snapshot.phase,
                actionCamp: snapshot.actionCamp,
                roundIndex: snapshot.roundIndex,
                attackRoundIndex: snapshot.attackRoundIndex,
            };
        }
        this._battleMap.setTurnSnapshot(snapshot);
        this._hud.refreshState(snapshot);
        this.refreshMoveButtonsEnabled();
        if (snapshot.phase !== "upgrade") {
            this._upgradeOptions = [];
            this._waitingForOwnUpgradeResult = false;
            this._currentUpgradeCamp = null;
            this._hud.hideUpgradeOptions();
        }
        if (snapshot.phase === "upgrade") {
            this.beginUpgradePhase();
        }
    }

    private applyServerTimer(msg: any) {
        let snapshot = this.buildSnapshotFromServer(msg);
        this._hud.refreshTimer(snapshot);
    }

    private buildSnapshotFromServer(msg: any): TurnStateSnapshot {
        let remainingMs = Number(msg.remainingMs);
        let endAt = Number(msg.endAt);
        let phaseTimeLeft = 0;
        if (Number.isFinite(remainingMs)) {
            phaseTimeLeft = Math.max(0, remainingMs / 1000);
        }
        else if (Number.isFinite(endAt) && endAt > 0) {
            phaseTimeLeft = Math.max(0, (endAt - Date.now()) / 1000);
        }
        let winnerCamp = msg.winnerCamp || (this._serverSnapshot ? this._serverSnapshot.winnerCamp : null);
        return {
            phase: msg.phase || (this._serverSnapshot ? this._serverSnapshot.phase : "init"),
            roundIndex: Number(msg.roundIndex || (this._serverSnapshot ? this._serverSnapshot.roundIndex : 0)),
            attackRoundIndex: Number(msg.attackRoundIndex || (this._serverSnapshot ? this._serverSnapshot.attackRoundIndex : 0)),
            actionCamp: (msg.actionCamp || (this._serverSnapshot ? this._serverSnapshot.actionCamp : "A")) as TurnCamp,
            winnerCamp: winnerCamp as TurnCamp,
            phaseTimeLeft: phaseTimeLeft,
            elapsedInPhase: 0,
            isFirstRound: Number(msg.roundIndex || 0) <= 1,
        };
    }

    private sendBuildIntent(action: { op: string; obstacleId?: string; x: number; y: number; }) {
        this.sendNetMessage("buildAction", action);
    }

    private sendZoneIntent(action: { zoneType: string; x: number; y: number; }) {
        this.sendNetMessage("zoneAction", action);
    }

    private sendAttackIntent(action: { fromX: number; fromY: number; aimX: number; aimY: number; shotIndex: number; }) {
        this.sendNetMessage("attackAction", action);
    }

    private sendTankPoseIntent(action: { x: number; y: number; aimX: number; aimY: number; }) {
        this.sendNetMessage("tankPose", action);
    }

    private sendNetMessage(type: string, payload: any) {
        if (!this._netManager) {
            return;
        }
        this._netManager.sendMessage(type, payload || {});
    }

    private getLocalCamp(): TurnCamp {
        return this.useServer ? this._serverCamp : "A";
    }

    private onHudBuildDragStart(camp: TurnCamp, worldPos: cc.Vec2): boolean {
        return this._battleMap.beginPaletteBuildDrag(camp, this.convertHudWorldToMapLocal(worldPos));
    }

    private onHudBuildDragMove(camp: TurnCamp, worldPos: cc.Vec2) {
        this._battleMap.updatePaletteBuildDrag(camp, this.convertHudWorldToMapLocal(worldPos));
    }

    private onHudBuildDragEnd(camp: TurnCamp, worldPos: cc.Vec2) {
        this._battleMap.finishPaletteBuildDrag(camp, this.convertHudWorldToMapLocal(worldPos));
        this.refreshHudNumbers();
    }

    private onHudBuildDragCancel(camp: TurnCamp) {
        this._battleMap.cancelPaletteBuildDrag(camp);
    }

    private onHudMoveLeft() {
        this.requestTankMove(-24);
    }

    private onHudMoveRight() {
        this.requestTankMove(24);
    }

    private requestTankMove(deltaX: number) {
        if (!this.useServer) {
            return;
        }
        if (!this.isLocalAttackTurn()) {
            return;
        }
        let pose = this._battleMap.getTankPose("A");
        if (!pose) {
            return;
        }
        let newX = pose.x + deltaX;
        if (newX < -302) {
            newX = -302;
        }
        if (newX > 302) {
            newX = 302;
        }
        if (Math.abs(newX - pose.x) < 0.5) {
            return;
        }
        this.sendTankPoseIntent({ x: newX, y: pose.y, aimX: pose.aimX, aimY: pose.aimY });
    }

    private isLocalAttackTurn(): boolean {
        let snapshot = this._serverSnapshot;
        if (!snapshot) {
            return false;
        }
        return snapshot.phase === "attack" && (snapshot.actionCamp || "") === "A";
    }

    private refreshMoveButtonsEnabled() {
        if (!this._hud) {
            return;
        }
        this._hud.setMoveButtonsEnabled(this.useServer && this.isLocalAttackTurn());
    }

    private convertHudWorldToMapLocal(worldPos: cc.Vec2): cc.Vec2 {
        return this._battleMap.screenToMapPosition(worldPos);
    }

    private syncHudBuildPalettePosition() {
        if (!this._hud || !this._battleMap || !this.hudRoot || !this.mapRoot) {
            return;
        }
        let mapBottomLeft = this._battleMap.getAssistAreaBottomLeft();
        let worldPos = this.mapRoot.convertToWorldSpaceAR(mapBottomLeft);
        let hudPos = this.hudRoot.convertToNodeSpaceAR(worldPos);
        this._hud.setBuildPalettePosition(hudPos);
    }
}
