import { TurnCamp, TurnGameConfig, TurnPhase, TURN_GAME_CONFIG, getBuildSecondsByObstacleTotal, getRoundBuildSeconds } from "../config/TurnGame";

export interface TurnStateSnapshot {
    phase: TurnPhase;
    roundIndex: number;
    attackRoundIndex: number;
    attackTurnIndex: number;
    actionCamp: TurnCamp;
    winnerCamp: TurnCamp;
    phaseTimeLeft: number;
    elapsedInPhase: number;
    isFirstRound: boolean;
}

export interface TurnStateMachineListener {
    onTurnPhaseChanged?: (snapshot: TurnStateSnapshot) => void;
    onTurnTimer?: (snapshot: TurnStateSnapshot) => void;
}

export class TurnStateMachine {
    private _config: TurnGameConfig = TURN_GAME_CONFIG;
    private _listener: TurnStateMachineListener = null;
    private _phase: TurnPhase = "init";
    private _roundIndex = 1;
    private _attackStep = 0;
    private _phaseElapsed = 0;
    private _phaseDuration = 0;
    private _running = false;
    private _winnerCamp: TurnCamp = null;
    private _buildResourceTotal = 0;

    init(config?: TurnGameConfig, listener?: TurnStateMachineListener) {
        this._config = config || TURN_GAME_CONFIG;
        this._listener = listener || null;
        this.reset();
    }

    reset() {
        this._phase = "init";
        this._roundIndex = 1;
        this._attackStep = 0;
        this._phaseElapsed = 0;
        this._phaseDuration = 0;
        this._running = false;
        this._winnerCamp = null;
        this._buildResourceTotal = 0;
    }

    startMatch() {
        this._running = true;
        this.enterPhase("build");
    }

    stopMatch() {
        this._running = false;
        this.enterPhase("finish");
    }

    finishMatch(winnerCamp: TurnCamp) {
        if (this._phase === "finish") {
            return;
        }

        this._winnerCamp = winnerCamp;
        this._running = false;
        this.enterPhase("finish");
    }

    update(dt: number) {
        if (!this._running || this._phase === "finish") {
            return;
        }

        this._phaseElapsed += dt;
        this.emitTimer();

        if (this._phaseDuration > 0 && this._phaseElapsed >= this._phaseDuration) {
            this.advancePhase();
        }
    }

    completeAttackAction() {
        if (!this._running || this._phase !== "attack") {
            return;
        }

        this.enterPhase("waitBullet");
    }

    notifyBulletsClear() {
        if (!this._running || this._phase !== "waitBullet") {
            return;
        }

        this.advancePhase();
    }

    completeUpgradeAction() {
        if (!this._running || this._phase !== "upgrade") {
            return;
        }

        this.advancePhase();
    }

    setBuildResourceTotal(total: number) {
        this._buildResourceTotal = Math.max(0, Math.round(Number(total) || 0));
        if (this._phase === "build") {
            this._phaseDuration = getBuildSecondsByObstacleTotal(this._buildResourceTotal, this._config);
            this.emitTimer();
        }
    }

    getSnapshot(): TurnStateSnapshot {
        let left = Math.max(0, this._phaseDuration - this._phaseElapsed);
        return {
            phase: this._phase,
            roundIndex: this._roundIndex,
            attackRoundIndex: this._phase === "attack" || this._phase === "waitBullet" ? 1 : 0,
            attackTurnIndex: this._phase === "attack" || this._phase === "waitBullet" ? this._attackStep + 1 : 0,
            actionCamp: this.getActionCamp(),
            winnerCamp: this._winnerCamp,
            phaseTimeLeft: left,
            elapsedInPhase: this._phaseElapsed,
            isFirstRound: this._roundIndex === 1,
        };
    }

    private advancePhase() {
        switch (this._phase) {
            case "build":
                this._attackStep = 0;
                this.enterPhase("attack");
                break;
            case "attack":
                this.enterPhase("waitBullet");
                break;
            case "waitBullet":
                this._attackStep += 1;
                if (this._attackStep < 2) {
                    this.enterPhase("attack");
                }
                else {
                    this.enterPhase("settle");
                }
                break;
            case "settle":
                this._roundIndex += 1;
                this.enterPhase("build");
                break;
            case "upgrade":
                this._roundIndex += 1;
                this.enterPhase("build");
                break;
        }
    }

    private enterPhase(phase: TurnPhase) {
        this._phase = phase;
        this._phaseElapsed = 0;

        if (phase === "build") {
            this._phaseDuration = this._buildResourceTotal > 0
                ? getBuildSecondsByObstacleTotal(this._buildResourceTotal, this._config)
                : getRoundBuildSeconds(this._roundIndex, this._config);
        }
        else if (phase === "attack") {
            this._phaseDuration = this._config.attackSeconds;
        }
        else if (phase === "waitBullet") {
            this._phaseDuration = this._config.waitBulletSeconds;
        }
        else if (phase === "settle") {
            this._phaseDuration = this._config.settleSeconds;
        }
        else {
            this._phaseDuration = 0;
        }

        if (this._listener && this._listener.onTurnPhaseChanged) {
            this._listener.onTurnPhaseChanged(this.getSnapshot());
        }
        this.emitTimer();
    }

    private emitTimer() {
        if (this._listener && this._listener.onTurnTimer) {
            this._listener.onTurnTimer(this.getSnapshot());
        }
    }

    private getActionCamp(): TurnCamp {
        if (this._phase !== "attack" && this._phase !== "waitBullet") {
            return this._actionCampForNonAttackPhase();
        }
        return this._attackStep % 2 === 0 ? "A" : "B";
    }

    private _actionCampForNonAttackPhase(): TurnCamp {
        return this._attackStep % 2 === 0 ? "A" : "B";
    }
}
