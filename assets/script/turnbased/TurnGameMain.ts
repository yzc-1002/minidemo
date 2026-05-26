import { TURN_GAME_CONFIG, TurnCamp, TurnGameConfig, TurnUpgradeId } from "../config/TurnGame";
import TurnBattleMap from "./TurnBattleMap";
import TurnHud from "./TurnHud";
import { TurnStateMachine, TurnStateSnapshot } from "./TurnStateMachine";

const { ccclass, property } = cc._decorator;

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

    private _config: TurnGameConfig = TURN_GAME_CONFIG;
    private _stateMachine: TurnStateMachine = new TurnStateMachine();
    private _battleMap: TurnBattleMap = null;
    private _hud: TurnHud = null;
    private _lastRoundIndex = 0;
    private _upgradeQueue: TurnCamp[] = [];
    private _currentUpgradeCamp: TurnCamp = null;
    private _upgradeHintToken = 0;

    onLoad() {
        this.ensureRoots();
        this.ensureMapPrefab();
        this._battleMap.onStatsChanged = this.refreshHudNumbers.bind(this);
        this._battleMap.onAttackFired = this.completeCurrentAttack.bind(this);
        this._battleMap.onBulletsCleared = this.notifyBulletsClear.bind(this);
        this._battleMap.onGameFinished = this.finishMatch.bind(this);
        this._stateMachine.init(this._config, {
            onTurnPhaseChanged: this.onTurnPhaseChanged.bind(this),
            onTurnTimer: this.onTurnTimer.bind(this),
        });
    }

    start() {
        this._battleMap.initMap(this._config);
        this._hud.initHud();
        this.refreshHudNumbers();

        if (this.autoStart) {
            this.startMatch();
        }
    }

    update(dt: number) {
        this._stateMachine.update(dt);
    }

    startMatch() {
        this._lastRoundIndex = 0;
        this._upgradeHintToken += 1;
        this._stateMachine.startMatch();
    }

    stopMatch() {
        this._stateMachine.stopMatch();
    }

    finishMatch(winnerCamp: TurnCamp) {
        this._stateMachine.finishMatch(winnerCamp);
        this.refreshHudNumbers();
        this.emitTurnEvent("turn-game-ended", { winnerCamp: winnerCamp });
    }

    completeCurrentAttack() {
        this._stateMachine.completeAttackAction();
    }

    notifyBulletsClear() {
        this._stateMachine.notifyBulletsClear();
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

        this._battleMap = this.mapRoot.getComponent(TurnBattleMap);
        if (!this._battleMap) {
            this._battleMap = this.mapRoot.addComponent(TurnBattleMap);
        }

        this._hud = this.hudRoot.getComponent(TurnHud);
        if (!this._hud) {
            this._hud = this.hudRoot.addComponent(TurnHud);
        }
    }

    private ensureMapPrefab() {
        if (this.gameMapPrefab) {
            this._battleMap.tiledMapPrefab = this.gameMapPrefab;
            return;
        }

        if (this._battleMap.tiledMapPrefab) {
            return;
        }

        cc.loader.loadRes("prefab/GameMap", cc.Prefab, function (err: Error, prefab: cc.Prefab) {
            if (err) {
                cc.error("[TurnGame] load GameMap prefab failed", err);
                return;
            }
            this.gameMapPrefab = prefab;
            if (this._battleMap) {
                this._battleMap.tiledMapPrefab = prefab;
            }
        }.bind(this));
    }

    private onTurnPhaseChanged(snapshot: TurnStateSnapshot) {
        if (snapshot.phase === "build" && this._lastRoundIndex !== snapshot.roundIndex) {
            this._lastRoundIndex = snapshot.roundIndex;
            this._battleMap.refreshForNewRound(snapshot.roundIndex);
            this.refreshHudNumbers();
        }

        this._battleMap.setTurnSnapshot(snapshot);

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
        this._hud.refreshTimer(snapshot);
    }

    private refreshHudNumbers() {
        this._hud.refreshCrystals(this._battleMap.getCrystalHp("A"), this._battleMap.getCrystalHp("B"));
        this._hud.refreshInventory(this._battleMap.getObstacleInventory("A"), this._battleMap.getObstacleInventory("B"));
        this._hud.refreshExp(
            this._battleMap.getCampExp("A"),
            this._battleMap.getCampLevel("A"),
            this._battleMap.getCampExp("B"),
            this._battleMap.getCampLevel("B"),
            this._config.levelUpExp,
        );
        this._hud.refreshZones(this._battleMap.getBlackHoleInventory("A"), this._battleMap.getBlackHoleInventory("B"));
    }

    private beginUpgradePhase() {
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
}
