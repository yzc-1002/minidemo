export class NetworkManager {
    private ws: WebSocket = null;
    private _connected: boolean = false;
    private _playerId: number = -1;
    private _roomId: string = "";
    private _tickRate: number = 20;
    private _roomState: string = "waiting";
    private _frameCallbacks: Array<{ frame: number, inputs: Array<{ playerId: number, inputs: any }> }> = [];
    private _inputQueue: Array<{ frame: number, inputs: any }> = [];
    private _currentFrame: number = 0;
    private _expectingFrame: number = 1;
    private _disconnectCallback: () => void = null;
    private _connectedCallback: () => void = null;
    private _frameCallback: (frameData: any) => void = null;
    private _gameStartCallback: (playerId: number, playerCount: number, spawnSlots: number[], energies: any[], players?: any[], specialEvents?: any[], tarPickups?: any[], tarSpills?: any[], blackHolePickups?: any[], blackHoleZones?: any[], bushes?: any[], covers?: any[], safeZone?: any, pickups?: any[], energyWells?: any[]) => void = null;
    private _playerCountCallback: (count: number, max: number) => void = null;
    private _countdownCallback: (seconds: number) => void = null;
    private _roomStateCallback: (payload: any) => void = null;
    private _gameEndedCallback: (payload: any) => void = null;

    connect(url: string) {
        if (this.ws) {
            this.ws.close();
        }

        this._connected = false;
        this._playerId = -1;
        this._currentFrame = 0;
        this._expectingFrame = 1;
        this._inputQueue = [];
        this._frameCallbacks = [];

        try {
            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
                console.log("[Network] Connected to server");
                this._connected = true;
                this.ws.send(JSON.stringify({ type: "join" }));
                if (this._connectedCallback) {
                    this._connectedCallback();
                }
            };

            this.ws.onmessage = (evt) => {
                try {
                    const msg = JSON.parse(evt.data);
                    // console.log("onmessage", msg);
                    this._handleMessage(msg);
                } catch (e) {
                    console.warn("[Network] Invalid message:", e);
                }
            };

            this.ws.onclose = () => {
                console.log("[Network] Disconnected");
                this._connected = false;
                if (this._disconnectCallback) {
                    this._disconnectCallback();
                }
            };

            this.ws.onerror = (e) => {
                console.error("[Network] Error:", e);
            };
        } catch (e) {
            console.error("[Network] Connection failed:", e);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this._connected = false;
    }

    sendInput(inputs: any) {
        if (!this._connected || !this.ws) return;

        this._currentFrame++;
        // 必须发送“全 false”包，否则服务端会沿用 lastInputs，松手后坦克不会停
        const msg = {
            type: "input",
            frame: this._currentFrame,
            inputs: this._normalizeInputs(inputs),
        };
        this.ws.send(JSON.stringify(msg));
    }

    sendPlayerSetup(payload: any) {
        if (!this._connected || !this.ws) return;
        this.ws.send(JSON.stringify({
            type: "playerSetup",
            payload: payload || {},
        }));
    }

    get connected(): boolean { return this._connected; }
    get playerId(): number { return this._playerId; }
    get tickRate(): number { return this._tickRate; }
    get currentFrame(): number { return this._currentFrame; }
    get roomState(): string { return this._roomState; }

    set onDisconnect(cb: () => void) { this._disconnectCallback = cb; }
    set onConnected(cb: () => void) { this._connectedCallback = cb; }
    set onGameStart(cb: (playerId: number, playerCount: number, spawnSlots: number[], energies: any[], players?: any[], specialEvents?: any[], tarPickups?: any[], tarSpills?: any[], blackHolePickups?: any[], blackHoleZones?: any[], bushes?: any[], covers?: any[], safeZone?: any, pickups?: any[], energyWells?: any[]) => void) { this._gameStartCallback = cb; }
    set onFrame(cb: (frameData: any) => void) { this._frameCallback = cb; }
    set onPlayerCount(cb: (count: number, max: number) => void) { this._playerCountCallback = cb; }
    set onCountdown(cb: (seconds: number) => void) { this._countdownCallback = cb; }
    set onRoomState(cb: (payload: any) => void) { this._roomStateCallback = cb; }
    set onGameEnded(cb: (payload: any) => void) { this._gameEndedCallback = cb; }

    private _normalizeInputs(inputs: any) {
        const source = inputs || {};
        const snapshot = source.playerSnapshot || null;
        return {
            up: !!source.up,
            down: !!source.down,
            left: !!source.left,
            right: !!source.right,
            aim: source.aim && Number.isFinite(source.aim.x) && Number.isFinite(source.aim.y) ? {
                x: source.aim.x,
                y: source.aim.y,
            } : null,
            fire: source.fire && source.fire.id ? {
                id: source.fire.id,
                type: source.fire.type,
                bounceCount: Number.isFinite(source.fire.bounceCount) ? source.fire.bounceCount : 0,
            } : false,
            hit: source.hit ? source.hit : false,
            bulletEvents: Array.isArray(source.bulletEvents) ? source.bulletEvents : [],
            pickupEnergyId: source.pickupEnergyId == null ? null : source.pickupEnergyId,
            pickupTarId: source.pickupTarId == null ? null : source.pickupTarId,
            pickupBlackHoleId: source.pickupBlackHoleId == null ? null : source.pickupBlackHoleId,
            pickupId: source.pickupId == null ? null : source.pickupId,
            throwTar: source.throwTar && Number.isFinite(source.throwTar.dirX) && Number.isFinite(source.throwTar.dirY) ? {
                dirX: source.throwTar.dirX,
                dirY: source.throwTar.dirY,
                ratio: Number.isFinite(source.throwTar.ratio) ? source.throwTar.ratio : 1,
            } : false,
            throwBlackHole: source.throwBlackHole && Number.isFinite(source.throwBlackHole.dirX) && Number.isFinite(source.throwBlackHole.dirY) ? {
                dirX: source.throwBlackHole.dirX,
                dirY: source.throwBlackHole.dirY,
                ratio: Number.isFinite(source.throwBlackHole.ratio) ? source.throwBlackHole.ratio : 1,
            } : false,
            usePickup: source.usePickup && source.usePickup.pickupType && Number.isFinite(source.usePickup.dirX) && Number.isFinite(source.usePickup.dirY) ? {
                pickupType: source.usePickup.pickupType,
                dirX: source.usePickup.dirX,
                dirY: source.usePickup.dirY,
                ratio: Number.isFinite(source.usePickup.ratio) ? source.usePickup.ratio : 1,
            } : false,
            toggleCover: !!source.toggleCover,
            coverAction: source.coverAction && Number.isFinite(source.coverAction.seq) && source.coverAction.coverId != null ? {
                seq: source.coverAction.seq,
                coverId: source.coverAction.coverId,
                action: source.coverAction.action == "detach" ? "detach" : "attach",
            } : null,
            energyEggAction: source.energyEggAction && Number.isFinite(source.energyEggAction.seq) && source.energyEggAction.eggId != null ? {
                seq: source.energyEggAction.seq,
                eggId: source.energyEggAction.eggId,
                action: source.energyEggAction.action == "detach" ? "detach" : "attach",
            } : null,
            playerSnapshot: snapshot ? {
                x: snapshot.x,
                y: snapshot.y,
                dirX: snapshot.dirX,
                dirY: snapshot.dirY,
                speed: snapshot.speed,
                radius: snapshot.radius,
            } : null,
        };
    }

    private _handleMessage(msg: any) {
        switch (msg.type) {
            case "joined":
                console.log(`[Network] Joined room ${msg.roomId}`);
                this._roomId = msg.roomId || "";
                if (msg.state) {
                    this._roomState = msg.state;
                }
                break;

            case "playerCount":
                console.log(`[Network] Players: ${msg.count}/${msg.max}`);
                if (this._playerCountCallback) {
                    this._playerCountCallback(msg.count, msg.max);
                }
                break;

            case "countdown":
                console.log(`[Network] Countdown: ${msg.seconds}`);
                if (this._countdownCallback) {
                    this._countdownCallback(msg.seconds);
                }
                break;

            case "roomState":
                this._roomId = msg.roomId || this._roomId;
                this._roomState = msg.state || this._roomState;
                if (this._roomStateCallback) {
                    this._roomStateCallback(msg);
                }
                break;

            case "gameStart":
                this._playerId = msg.playerId;
                this._roomId = msg.roomId;
                this._tickRate = msg.tickRate || 20;
                this._currentFrame = 0;
                this._roomState = "running";
                console.log(`[Network] Game started as player ${this._playerId}`);
                if (this._gameStartCallback) {
                    this._gameStartCallback(this._playerId, msg.playerCount || 2, msg.spawnSlots || [], msg.energies || [], msg.players || [], msg.specialEvents || [], msg.tarPickups || [], msg.tarSpills || [], msg.blackHolePickups || [], msg.blackHoleZones || [], msg.bushes || [], msg.covers || [], msg.safeZone || null, msg.pickups || [], msg.energyWells || []);
                }
                break;

            case "frame":
                if (this._frameCallback) {
                    this._frameCallback(msg);
                }
                break;

            case "gameEnded":
                this._roomState = "ended";
                if (this._gameEndedCallback) {
                    this._gameEndedCallback(msg);
                }
                break;

            case "playerLeft":
                console.log(`[Network] Player ${msg.playerId} left`);
                break;

            case "pong":
                break;
        }
    }
}
