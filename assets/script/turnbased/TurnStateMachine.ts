import { TurnCamp, TurnGameConfig, TurnPhase, TURN_GAME_CONFIG } from "../config/TurnGame";

export interface TurnStateSnapshot {
    phase: TurnPhase;
    roundIndex: number;
    attackRoundIndex: number;
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

    getSnapshot(): TurnStateSnapshot {
        let left = Math.max(0, this._phaseDuration - this._phaseElapsed);
        return {
            phase: this._phase,
            roundIndex: this._roundIndex,
            attackRoundIndex: Math.floor(this._attackStep / 2) + 1,
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
                if (this._roundIndex === 1) {
                    this._attackStep = 0;
                    this.enterPhase("attack");
                }
                else {
                    this.enterPhase("zone");
                }
                break;
            case "zone":
                this._attackStep = 0;
                this.enterPhase("attack");
                break;
            case "attack":
                this.enterPhase("waitBullet");
                break;
            case "waitBullet":
                this._attackStep += 1;
                if (this._attackStep < this._config.attackRounds * 2) {
                    this.enterPhase("attack");
                }
                else {
                    this.enterPhase("upgrade");
                }
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
            this._phaseDuration = this._config.buildSeconds;
        }
        else if (phase === "zone") {
            this._phaseDuration = this._config.zoneSeconds;
        }
        else if (phase === "attack") {
            this._phaseDuration = this._config.attackSeconds;
        }
        else if (phase === "waitBullet") {
            this._phaseDuration = this._config.waitBulletSeconds;
        }
        else if (phase === "upgrade") {
            this._phaseDuration = 0;
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
        return this._attackStep % 2 === 0 ? "A" : "B";
    }
}
