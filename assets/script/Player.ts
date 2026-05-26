import {Tank} from "./TankE";
import {Utils} from "./base/Utils";
import {Bullet} from "./BulletE";
import { MusicManager } from "./base/MusicManager";
import SDKManager from "./sdk/sdk/SDKManager";

const {ccclass, property} = cc._decorator;
const PLAYER_SHOOT_INTERVAL = 0.35;
const PLAYER_FREE_BULLET_MAX = 3;
const PLAYER_FREE_BULLET_RECOVER_DELAY = 0.8;
const PLAYER_FREE_BULLET_RECOVER_INTERVAL = 0.6;
const PLAYER_PAID_SHOT_HP_COST = 5 * (1 - 0.1);
const PLAYER_EXP_BASE = 30;
const PLAYER_EXP_STEP = 15;
const PLAYER_BOUNCE_UNLOCK_ENERGY_LEVEL = 2;
const PLAYER_BOUNCE_MAX_COUNT = 5;
const CHARGE_CANNON_BULLET_TYPE = 99;
const OIL_SHELL_BULLET_TYPE = 100;
const OIL_SHELL_MAX_COUNT = 1;
const BLACK_HOLE_SHELL_MAX_COUNT = 1;
const OIL_THROW_PREVIEW_ARC_HEIGHT = 110;
const OIL_THROW_AREA_RADIUS = 120;
const LOW_HP_SCREEN_FLASH_IN = 0.2;
const LOW_HP_SCREEN_FLASH_OUT = 0.5;
const LOW_HP_SCREEN_FLASH_LOOP = 3;
const SHOOT_RECOIL_DISTANCE = 10;
const SHOOT_RECOIL_OUT_TIME = 0.04;
const SHOOT_RECOIL_RETURN_TIME = 0.11;
const SHOOT_FLASH_FADE_IN = 0.02;
const SHOOT_FLASH_FADE_OUT = 0.07;
const SACRIFICE_HP_RATIO = 0.5;
const MULTIPLAYER_REMOTE_POSITION_EPSILON = 6;
const MULTIPLAYER_REMOTE_POSITION_SNAP_DISTANCE = 80;
const MULTIPLAYER_LOCAL_POSITION_EPSILON = 24;
const MULTIPLAYER_LOCAL_POSITION_SNAP_DISTANCE = 120;
const MULTIPLAYER_REMOTE_POSITION_BLEND = 0.35;
const MULTIPLAYER_LOCAL_POSITION_BLEND = 0.2;

@ccclass
export class Player extends Tank {

    //内部变量
    _level          = 1;        //玩家等级

    _bulletCodeTime = 0;        //射击冷却时间

    _isHighBullet   = false;    //三发高频子弹

    _skill2Time     = 0;        //技能2(超级子弹)剩余时间
    _skill3Time     = 0;        //技能3(无敌防御)剩余时间

    _inGame         = false;    //在游戏中中使用
    _viewMode       = false;    //展示模式
    _freeBulletCount = PLAYER_FREE_BULLET_MAX;  //当前免费子弹数量
    _stopFireTime = 0;          //停火计时
    _freeBulletRecoverTime = 0; //免费子弹恢复计时
    _moveInputDir = cc.v2(1, 0); //移动摇杆目标方向
    _moveInputRatio = 0;        //移动摇杆目标速率
    _moveSpeedScale = 1;        //局内移速倍率
    _energyLevel = 1;           //局内能量等级
    _energyExp = 0;             //当前经验
    _energyNeedExp = PLAYER_EXP_BASE; //升级所需经验
    _chargeCannonTime = 0;      //蓄力炮蓄力时间
    _chargeCannonCdTime = 0;    //蓄力炮冷却
    _chargeCannonCooldown = 0;  //蓄力炮冷却总时长
    _chargeCannonCharging = false;
    _chargeCannonReady = false;
    _chargeEffectNode = null;
    _oilShellCount = 0;
    _blackHoleShellCount = 0;
    _activePickupType = "";
    _oilShellPreviewing = false;
    _oilShellPreviewTarget = null;
    _oilShellAimDir = cc.v2(1, 0);
    _oilShellAimRatio = 1;
    _activeThrowSkillType = "";
    _bulletMutationType = "";
    _bulletMutationData = null;
    _bulletMutationEffectNode = null;
    _moveEffectId = -1;
    _lowHpHeartbeatEffectId = -1;
    _lowHpScreenEffect = null;
    _shootInputDir = cc.v2(1, 0);   //射击摇杆目标方向
    _localPreviewBarrelDir = null;   //本地联机玩家炮管预览方向(仅表现层)
    _frameInput = null;             //网络帧输入(多人)
    _multiplayerMode = false;       //多人模式(禁用本地摇杆)
    _multiplayerRemote = false;     //多人远端玩家
    _multiplayerPlayerId = -1;      //多人玩家ID
    _multiplayerInBush = false;
    _multiplayerBushId = null;
    _multiplayerSyncPosition = null;
    _multiplayerSyncDir = null;
    _multiplayerSyncSpeed = 0;
    _bushVisibilityMode = "normal";
    _bulletBounceCount = 0;

    onLoad () {
        super.onLoad();
        
        //初始化变量
        this._initVariable();

        //初始化UI
        this._initUI();

        //初始化接收事件
        this._initEvent();
    }

    //初始化变量
    _initVariable() {
        this._camp = "player";  //阵营
        this._radius = this._radius * 2;    //玩家的碰撞检测范围*2
        this._bulletCodeTime = PLAYER_SHOOT_INTERVAL;
        this._freeBulletCount = PLAYER_FREE_BULLET_MAX;
        this._stopFireTime = 0;
        this._freeBulletRecoverTime = 0;
        this._currentSpeed = 0;
        this._moveInputDir = this._dir;
        this._moveInputRatio = 0;
        this._moveSpeedScale = 1;
        this._energyLevel = 1;
        this._energyExp = 0;
        this._energyNeedExp = this._getEnergyNeedExp();
        this._chargeCannonTime = 0;
        this._chargeCannonCdTime = 0;
        this._chargeCannonCooldown = 0;
        this._chargeCannonCharging = false;
        this._chargeCannonReady = false;
        this._oilShellCount = 0;
        this._blackHoleShellCount = 0;
        this._activePickupType = "";
        this._oilShellPreviewing = false;
        this._oilShellPreviewTarget = null;
        this._oilShellAimDir = this._barrelDir && this._barrelDir.magSqr() > 0 ? cc.v2(this._barrelDir).normalize() : cc.v2(1, 0);
        this._oilShellAimRatio = 1;
        this._activeThrowSkillType = "";
        this._bulletMutationType = "";
        this._bulletMutationData = null;
        this._bulletMutationEffectNode = null;
        this._moveEffectId = -1;
        this._lowHpHeartbeatEffectId = -1;
        this._lowHpScreenEffect = null;
        this._shootInputDir = this._barrelDir;
        this._localPreviewBarrelDir = null;
        this._multiplayerInBush = false;
        this._multiplayerBushId = null;
        this._multiplayerSyncPosition = null;
        this._multiplayerSyncDir = null;
        this._multiplayerSyncSpeed = 0;
        this._bushVisibilityMode = "normal";
        this._bulletBounceCount = 0;
    }

    //设置坦克类型
    setPlayerType(tankType,playerLevel) {
        super.setTankType(tankType);
        
        //计算玩家血量 攻击
        this._level = playerLevel;
        this._hp = this._maxHp = this._config.HP * (this._level+1);
        this._atk = this._config.ATK * (this._level+1);
        this._refreshEnergyUI();
        this._syncBulletBounceState(false);
    }

    getMultiplayerSetupPayload() {
        return {
            tankType: this._tankType,
            playerLevel: this._level,
            baseHp: this._maxHp,
            baseAtk: this._atk,
            baseSpeed: this._getConfigValue("Speed", 0),
        };
    }

    //初始化UI
    _initUI(){
        this._fire._lifebar.active = false;
        this._fire._spArmour.active = false;
        this._fire._spSkill2.active = false;
        this._fire._spSkill3.active = false;
        this._refreshFreeBulletBar();
        this._initEnergyUI();
        this._refreshEnergyUI();
    }

    //初始化接收事件
    _initEvent() {
        yyp.eventCenter.on('joy-stick',this._doJoyStick,this);      //摇杆事件
        yyp.eventCenter.on('joy-stick-shoot',this._doShootJoyStick,this); //射击摇杆事件
        yyp.eventCenter.on('charge-cannon-press',this._doChargeCannonPress,this); //蓄力炮按下
        yyp.eventCenter.on('charge-cannon-release',this._doChargeCannonRelease,this); //蓄力炮松开
        yyp.eventCenter.on('oil-shell-trigger',this._doOilShellTrigger,this); //焦油弹发射
        yyp.eventCenter.on('trigger-sacrifice',this._doSacrifice,this); //献祭按钮
        yyp.eventCenter.on('trigger-cover-action',this._doCoverAction,this); //掩体吸附/分离
        yyp.eventCenter.on('trigger-skill',this._doSkill,this);     //触发技能
    }
       
    //销毁事件
    _destroyEvent() {
        yyp.eventCenter.off('joy-stick',this._doJoyStick,this);     //摇杆事件
        yyp.eventCenter.off('joy-stick-shoot',this._doShootJoyStick,this); //射击摇杆事件
        yyp.eventCenter.off('charge-cannon-press',this._doChargeCannonPress,this); //蓄力炮按下
        yyp.eventCenter.off('charge-cannon-release',this._doChargeCannonRelease,this); //蓄力炮松开
        yyp.eventCenter.off('oil-shell-trigger',this._doOilShellTrigger,this); //焦油弹发射
        yyp.eventCenter.off('trigger-sacrifice',this._doSacrifice,this); //献祭按钮
        yyp.eventCenter.off('trigger-cover-action',this._doCoverAction,this); //掩体吸附/分离
        yyp.eventCenter.off('trigger-skill',this._doSkill,this);    //触发技能
    }
    
    //摇杆事件
    _doJoyStick(event) {
        if (this._multiplayerMode) return;
        if (this._inGame) {
            if (event.dir && event.dir.magSqr() > 0) {
                this._moveInputDir = event.dir;      //方向
            }
            this._moveInputRatio = event.ratio;  //速率
        }
    }

    //射击摇杆事件
    _doShootJoyStick(event) {
        if (this._multiplayerMode) return;
        if (this._inGame == false) return;
        if (this._oilShellPreviewing) return;
        if (event.dir && event.dir.magSqr() > 0) {
            this._shootInputDir = event.dir;
            this._barrelDir = event.dir;
        }
        if (event.fire === true) {
            this._tryFireOnce();
        }
    }

    updateMultiplayerLocalAimPreview(dir) {
        if (!this._multiplayerMode || this._multiplayerRemote) {
            return;
        }
        if (!dir || dir.magSqr() <= 0) {
            return;
        }
        this._localPreviewBarrelDir = cc.v2(dir).normalize();
    }

    //网络帧输入(多人模式)
    setFrameInput(inputs) {
        this._frameInput = inputs;
        if (inputs && inputs.throwTar) {
            this._oilShellAimRatio = Number.isFinite(inputs.throwTar.ratio) ? Math.max(0, Math.min(1, inputs.throwTar.ratio)) : this._oilShellAimRatio;
            if (Number.isFinite(inputs.throwTar.dirX) && Number.isFinite(inputs.throwTar.dirY)) {
                let tarDir = cc.v2(inputs.throwTar.dirX, inputs.throwTar.dirY);
                if (tarDir.magSqr() > 0.0001) {
                    this._oilShellAimDir = tarDir.normalize();
                }
            }
        }
        let dir = cc.v2(0, 0);
        if (inputs.up) dir.y += 1;
        if (inputs.down) dir.y -= 1;
        if (inputs.left) dir.x -= 1;
        if (inputs.right) dir.x += 1;
        if (dir.magSqr() > 0) {
            this._moveInputDir = dir.normalize();
            this._moveInputRatio = 1;
        } else {
            this._moveInputRatio = 0;
        }
        if (inputs.aim && Number.isFinite(inputs.aim.x) && Number.isFinite(inputs.aim.y)) {
            let aimDir = cc.v2(inputs.aim.x, inputs.aim.y);
            if (aimDir.magSqr() > 0.0001) {
                this._shootInputDir = aimDir.normalize();
                this._barrelDir = this._shootInputDir;
            }
        }
        // console.log("setFrameInput---inputs",inputs)
        if (inputs.fire) {
            this._fireByMultiplayerCommand(inputs.fire);
        }
    }

    getMultiplayerFireType() {
        return (this._skill2Time > 0) ? this._config.BType2 : this._config.BType1;
    }

    _doChargeCannonPress(event) {
        if (this._multiplayerMode && this._multiplayerRemote) {
            return;
        }
        if (this._inGame == false || this._chargeCannonCdTime > 0) {
            return;
        }
        let aiming = !!(event && event.aiming === true);
        if (aiming) {
            if (!this._chargeCannonCharging) {
                return;
            }
            if (event.dir && event.dir.magSqr && event.dir.magSqr() > 0.0001) {
                this._shootInputDir = cc.v2(event.dir).normalize();
                this._barrelDir = cc.v2(this._shootInputDir);
            }
            return;
        }
        if (this._chargeCannonCharging) {
            return;
        }

        this._chargeCannonTime = 0;
        this._chargeCannonCharging = true;
        this._chargeCannonReady = false;
        this._hideChargeEffect();
        yyp.eventCenter.emit("charge-cannon-progress", {progress: 0});
        MusicManager.playEffect("chargeCannon");
    }

    _doChargeCannonRelease(event) {
        if (this._multiplayerMode && this._multiplayerRemote) {
            return;
        }
        if (this._inGame == false || this._chargeCannonCharging == false) {
            return;
        }

        if (this._chargeCannonReady) {
            this._fireChargeCannon();
        }

        this._resetChargeCannon();
    }

    _doSacrifice() {
        if (this._inGame == false) {
            return;
        }

        this._trySacrificeHpForEnergy();
    }

    _doOilShellTrigger(event = null) {
        if (this._inGame == false) {
            return;
        }
        if (this._oilShellCount <= 0 && this._blackHoleShellCount <= 0 && !this._activePickupType) {
            this._refreshSkillButtonMode();
            return;
        }
        let pressed = !!(event && event.pressed === true);
        let aiming = !!(event && event.aiming === true);
        let release = !!(event && event.release === true);
        let cancelled = !!(event && event.cancelled === true);
        if (pressed) {
            this._startOilShellPreview();
            return;
        }
        if (aiming) {
            this._updateOilShellAim(event);
            return;
        }
        if (release) {
            this._commitOilShellThrow();
            return;
        }
        if (cancelled) {
            this._cancelOilShellPreview();
        }
    }

    _doCoverAction() {
        if (this._multiplayerMode && this._multiplayerRemote) {
            return;
        }
        if (this._inGame == false || !this._map) {
            return;
        }
        if (this._map.isMultiplayerMode && this._map.isMultiplayerMode()) {
            yyp.eventCenter.emit("multiplayer-cover-action", {
                playerId: this._multiplayerPlayerId,
            });
            return;
        }
        if (!this._map.tryToggleCoverTestAttachment) {
            return;
        }
        this._map.tryToggleCoverTestAttachment(this);
    }
    
    //触发技能
    _doSkill(event) {
        if (this._inGame) {
            let skillId = event.skillId;    //方向
            // cc.log("触发了技能 ",skillId);
            if (skillId == 0) {
                yyp.eventCenter.emit('add-coin',{count:this._config.Coin/10,position:Utils.getWorldPosition(this.node)});
            }
            else if (skillId == 1) {
                this.addEnergy(this._maxHp / 2);
            }
            else if (skillId == 2) {
                this._skill2Time += 15;
            }
            else if (skillId == 3) {
                this._skill3Time += 15;
            }
            else if (skillId == 4) {
                this._gainOilShell();
            }
            else if (skillId == 5) {
                this._gainBlackHoleShell();
            }
            else if (skillId == 6) {
                this._gainConfiguredPickup("portal");
            }
            else if (skillId == 7) {
                this._gainConfiguredPickup("speedDouble");
            }
            else if (skillId == 8) {
                this._gainConfiguredPickup("damageDouble");
            }
        }
    }

    onDestroy() {
        //销毁事件
        this._destroyEvent();
        this._stopMoveEffect();
        this._stopLowHpPlayerFeedback();
        this._hideBulletMutationEffect();
    }

    //刷新玩家位置
    _refreshPosition(dt) {
        //多人模式：在setFrameInput显式调用前拒绝一切移动
        if (this._multiplayerMode) {
            if (this._frameInput === null) return;
            if (!this._frameInput.up && !this._frameInput.down && !this._frameInput.left && !this._frameInput.right) {
                this._moveInputRatio = 0;
                this._currentSpeed = 0;
            }
        }
        this._refreshMoveSpeed(dt);
        if (this._currentSpeed <= 0) {
            return;
        }

        if (this._moveInputRatio > 0) {
            this._turnDirTo(this._moveInputDir, dt);
        }

        let currPosition = this.node.position;

        //碰撞测试
        let willPosition = this._getWillPosition(currPosition, this._dir, this._currentSpeed);
        let colliderItems = this._map.testColliders(willPosition, this._radius);
        if (colliderItems.length > 0){
            let testDir = this._getTestDir(currPosition, this._radius, this._dir, colliderItems);
            if (testDir) {
                willPosition = this._getWillPosition(currPosition, testDir, this._currentSpeed);
            }
            else{
                this._currentSpeed = 0;
                return;
            }
        }

        willPosition = this._map.clampMapInnerPosition(willPosition, this._radius);
        this.node.setPosition(willPosition);
    }

    _refreshMoveSpeed(dt) {
        let terrainFactor = this._map && this._map.getTerrainSpeedFactor
            ? this._map.getTerrainSpeedFactor(this.node.position, this._radius)
            : 1;
        let maxSpeed = this._getConfigValue("Speed", 0) * this._moveSpeedScale * terrainFactor;
        let targetSpeed = this._moveInputRatio > 0 ? maxSpeed * this._moveInputRatio : 0;

        if (this._currentSpeed < targetSpeed) {
            this._currentSpeed += this._getFrameValue("Acceleration", maxSpeed, dt);
            if (this._currentSpeed > targetSpeed) {
                this._currentSpeed = targetSpeed;
            }
        }
        else if (this._currentSpeed > targetSpeed) {
            this._currentSpeed -= this._getFrameValue("Deceleration", maxSpeed, dt);
            if (this._currentSpeed < targetSpeed) {
                this._currentSpeed = targetSpeed;
            }
        }
    }

    addEnergy(value) {
        if (value <= 0) {
            return;
        }

        let recoverHp = this._maxHp - this._hp;
        if (recoverHp > 0) {
            let addHp = Math.min(recoverHp, value);
            this._hp += addHp;
            value -= addHp;
            this.refreshHp();
        }

        if (value > 0) {
            this._addEnergyExp(value);
        }

        this._refreshEnergyUI();
    }

    _trySacrificeHpForEnergy() {
        if (this._hp <= 1) {
            this._showSacrificeTip("血量过低,无法献祭");
            return;
        }

        let maxSacrificeHp = this._hp - 1;
        let sacrificeHp = Math.min(this._hp * SACRIFICE_HP_RATIO, maxSacrificeHp);
        if (sacrificeHp <= 0) {
            this._showSacrificeTip("当前无法献祭");
            return;
        }

        this._hp -= sacrificeHp;
        this.refreshHp();

        this._addEnergyExp(sacrificeHp);
        this._refreshEnergyUI();
        this._playSacrificeFeedback();
    }

    _addEnergyExp(exp) {
        this._energyExp += exp;
        while (this._energyExp >= this._energyNeedExp) {
            this._energyExp -= this._energyNeedExp;
            this._energyLevel++;
            this._energyNeedExp = this._getEnergyNeedExp();
            this._levelUpByEnergy();
        }
    }

    _getEnergyNeedExp() {
        let config = yyp.config.Energy || {};
        let base = config.ExpBase == null ? PLAYER_EXP_BASE : config.ExpBase;
        let step = config.ExpStep == null ? PLAYER_EXP_STEP : config.ExpStep;
        return base + (this._energyLevel - 1) * step;
    }

    _levelUpByEnergy() {
        this._syncBulletBounceState(true);
    }

    _initEnergyUI() {
        if (!this._fire._lifebar || this._fire._lbHpLevel) {
            return;
        }

        let levelNode = new cc.Node("_lbHpLevel");
        levelNode.parent = this._fire._lifebar;
        levelNode.setPosition(-34, 0);
        levelNode.setContentSize(36, 24);
        levelNode.zIndex = 10;
        let levelLabel = levelNode.addComponent(cc.Label);
        levelLabel.fontSize = 18;
        levelLabel.lineHeight = 20;
        levelLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        levelLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
        levelNode["$Label"] = levelLabel;
        this._fire._lbHpLevel = levelNode;

        let expNode = new cc.Node("_expBar");
        expNode.parent = this._fire._lifebar;
        expNode.setPosition(-34, 0);
        expNode.setContentSize(44, 44);
        expNode.zIndex = 0;

        let bg = new cc.Node("_expBg");
        bg.parent = expNode;
        let bgGraphics = bg.addComponent(cc.Graphics);
        bgGraphics.lineWidth = 5;
        bgGraphics.strokeColor = cc.color(50, 68, 75, 220);
        bgGraphics.circle(0, 0, 18);
        bgGraphics.stroke();

        let bar = new cc.Node("_expProgress");
        bar.parent = expNode;
        let barGraphics = bar.addComponent(cc.Graphics);
        barGraphics.lineWidth = 5;
        barGraphics.strokeColor = cc.color(90, 255, 140, 255);
        this._fire._expBar = expNode;
        this._fire._expProgress = bar;
        bar["$Graphics"] = barGraphics;
    }

    _refreshEnergyUI() {
        if (this._fire._lbHpLevel && this._fire._lbHpLevel.$Label) {
            this._fire._lbHpLevel.$Label.string = this._energyLevel.toString();
        }

        if (this._fire._expProgress && this._fire._expProgress.$Graphics) {
            let progress = this._energyNeedExp > 0 ? this._energyExp / this._energyNeedExp : 0;
            let graphics = this._fire._expProgress.$Graphics;
            graphics.clear();
            graphics.lineWidth = 5;
            graphics.strokeColor = cc.color(90, 255, 140, 255);
            graphics.arc(0, 0, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false);
            graphics.stroke();
        }
        else if (this._fire._expBar && this._fire._expBar.$ProgressBar) {
            this._fire._expBar.$ProgressBar.progress = this._energyNeedExp > 0 ? this._energyExp / this._energyNeedExp : 0;
        }
    }

    _ensureMultiplayerNameUI() {
        if (!this._fire._lifebar || this._fire._lbPlayerName) {
            return;
        }

        let nameNode = new cc.Node("_lbPlayerName");
        nameNode.parent = this._fire._lifebar;
        nameNode.setPosition(0, 26);
        nameNode.setContentSize(120, 24);
        nameNode.zIndex = 12;
        let nameLabel = nameNode.addComponent(cc.Label);
        nameLabel.fontSize = 18;
        nameLabel.lineHeight = 20;
        nameLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        nameLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
        nameNode.color = cc.color(255, 255, 255, 255);
        nameNode["$Label"] = nameLabel;
        this._fire._lbPlayerName = nameNode;
    }

    setMultiplayerDisplayName(name, isLocal = false) {
        this._ensureMultiplayerNameUI();
        if (!this._fire._lbPlayerName || !this._fire._lbPlayerName.$Label) {
            return;
        }

        let showName = name || "";
        this._fire._lbPlayerName.$Label.string = showName;
        this._fire._lbPlayerName.color = isLocal ? cc.color(180, 255, 180, 255) : cc.color(210, 230, 255, 255);
        this._fire._lbPlayerName.active = showName.length > 0;
    }

    setBushVisibilityMode(mode = "normal") {
        let nextMode = mode == "hidden" ? "hidden" : (mode == "selfBush" ? "selfBush" : "normal");
        if (this._bushVisibilityMode === nextMode) {
            return;
        }
        this._bushVisibilityMode = nextMode;
        this._refreshBushVisibilityState();
    }

    _refreshBushVisibilityState() {
        let mode = this._bushVisibilityMode || "normal";
        let bodyOpacity = mode == "hidden" ? 0 : (mode == "selfBush" ? 120 : 255);
        let barrelOpacity = mode == "hidden" ? 0 : (mode == "selfBush" ? 120 : 255);
        let hudVisible = mode != "hidden";
        this.node.opacity = bodyOpacity;
        if (this._fire && this._fire._lyBarrel && cc.isValid(this._fire._lyBarrel)) {
            this._fire._lyBarrel.opacity = barrelOpacity;
        }
        if (this._fire && this._fire._lifebar && cc.isValid(this._fire._lifebar)) {
            this._fire._lifebar.active = hudVisible && this._inGame;
            this._fire._lifebar.opacity = mode == "selfBush" ? 168 : 255;
        }
    }

    _showSacrificeTip(text) {
        let channel = SDKManager.getChannel();
        if (channel && channel.showToast) {
            channel.showToast(text);
        }
        else{
            cc.log(text);
        }
    }

    _playSacrificeFeedback() {
        MusicManager.playEffect("playerHit");
        Utils.vibrate();

        let wave = new cc.Node("_sacrificeWave");
        wave.parent = this.node;
        wave.setPosition(0, 0);
        wave.zIndex = 286;
        wave.opacity = 210;
        wave.scale = 0.72;
        let waveGraphics = wave.addComponent(cc.Graphics);
        waveGraphics.lineWidth = 7;
        waveGraphics.strokeColor = cc.color(255, 88, 82, 235);
        waveGraphics.circle(0, 0, this._radius + 16);
        waveGraphics.stroke();
        wave.runAction(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.26, 2.3),
                cc.fadeOut(0.26)
            ),
            cc.removeSelf()
        ));

        let glow = new cc.Node("_sacrificeGlow");
        glow.parent = this.node;
        glow.setPosition(0, 0);
        glow.zIndex = 285;
        glow.opacity = 0;
        let glowGraphics = glow.addComponent(cc.Graphics);
        glowGraphics.fillColor = cc.color(255, 72, 68, 70);
        glowGraphics.circle(0, 0, this._radius + 20);
        glowGraphics.fill();
        glow.runAction(cc.sequence(
            cc.spawn(
                cc.fadeTo(0.1, 190),
                cc.scaleTo(0.1, 1.22)
            ),
            cc.spawn(
                cc.fadeOut(0.18),
                cc.scaleTo(0.18, 1.78)
            ),
            cc.removeSelf()
        ));
    }

    update(dt){

        if (this._inGame) {
            //多人模式：未有帧输入前，完全不处理任何逻辑
            if (this._multiplayerMode && this._frameInput === null) {
                this._bulletCodeTime += dt; // 仍需累计冷却避免首帧就能连射
                return;
            }
            if (this._map._pause) {
                this._stopMoveEffect();
                return;
            }
            this._bulletCodeTime += dt;
            this._updateFreeBulletRecover(dt);
            this._updateChargeCannon(dt);
            this.updateLowHpVisual(dt);
            this._updateLowHpPlayerFeedback();
            
            //玩家和技能icon,碰撞检测
            this._map.playerSkillIconCollisionTest();

            this._refreshPosition(dt);
            this._applyMultiplayerPositionCorrection();
            if (this._oilShellPreviewing) {
                this._refreshOilShellPreview();
            }
            this._refreshMoveEffect();
            this._refreshBarrelDir();
            this._refreshAngle(dt, false);
            this._refreshDisplayBarrelAngle(dt);
            if (this._map && this._map.syncAttachedCoverTestCover) {
                this._map.syncAttachedCoverTestCover(this);
            }
            if (this._map && this._map.refreshCoverTestButton) {
                if (!this._multiplayerMode || !this._multiplayerRemote) {
                    this._map.refreshCoverTestButton(this);
                }
            }
    
            // 技能2(超级子弹)
            this._skill2Time -= dt;
            this._skill2Time = this._skill2Time < 0 ? 0 : this._skill2Time;
            this._fire._spSkill2.active = this._skill2Time > 0;
            
            // 技能3(无敌防御)
            this._skill3Time -= dt;
            this._skill3Time = this._skill3Time < 0 ? 0 : this._skill3Time;
            this._fire._spSkill3.active = this._skill3Time > 0;
    
            //显示铠甲
            this._fire._spArmour.active = this._skill3Time > 0;
            this._def = this._skill3Time > 0 ? 10000000 : 0;

            this.node.zIndex = this._map.judgezIndex(this.node.y);
        }
        else if(this._viewMode){
            this._stopLowHpPlayerFeedback();
            this._stopMoveEffect();
            this._dir = Utils.vectorsRotateDegress(this._dir,-0.5);
            this.node.angle = Utils.vectorsToDegress(this._dir);
            this._barrelDir = this._dir;
            this.shooting(dt);
        }
        else{
            this._stopLowHpPlayerFeedback();
            this._stopMoveEffect();
        }
        
    }

    _buildEnergyUpgradeChoices() {
        let config = yyp.config.Energy || {};
        let hpAdd = config.LevelHpAdd == null ? Math.max(25, Math.round(this._maxHp * 0.22)) : config.LevelHpAdd;
        let atkAdd = config.LevelDamageAdd == null
            ? (config.LevelAtkAdd == null ? Math.max(8, Math.round(this._atk * 0.18)) : config.LevelAtkAdd)
            : config.LevelDamageAdd;
        let speedAdd = config.LevelSpeedAdd == null ? 18 : config.LevelSpeedAdd;

        return [
            {
                id: "hp",
                title: "装甲强化",
                desc: "生命上限提升并立刻回满",
                shortLabel: "HP",
                valueText: "+" + hpAdd,
                amount: hpAdd,
                color: cc.color(120, 255, 170, 255),
            },
            {
                id: "atk",
                title: "火力强化",
                desc: "攻击力提升, 输出更高",
                shortLabel: "ATK",
                valueText: "+" + atkAdd,
                amount: atkAdd,
                color: cc.color(255, 185, 90, 255),
            },
            {
                id: "speed",
                title: "推进强化",
                desc: "移动速度提升, 走位更灵活",
                shortLabel: "SPD",
                valueText: "+" + speedAdd + "%",
                amount: speedAdd,
                color: cc.color(110, 210, 255, 255),
            },
        ];
    }

    getTestUpgradeChoices() {
        return this._buildEnergyUpgradeChoices();
    }

    getTestBulletMutationChoices() {
        return [
            {
                id: "bounce",
                title: "反弹子弹",
                desc: "碰墙后自动反弹1次",
                shortLabel: "反",
                valueText: "x1",
                bounceCount: 1,
                color: cc.color(90, 180, 255, 255),
                effectColor: cc.color(90, 180, 255, 210),
            },
            {
                id: "penetrate",
                title: "穿透子弹",
                desc: "连续穿透3个目标后消失",
                shortLabel: "穿",
                valueText: "x3",
                penetrateCount: 3,
                color: cc.color(255, 92, 92, 255),
                effectColor: cc.color(255, 92, 92, 210),
            },
            {
                id: "heavy",
                title: "重炮子弹",
                desc: "伤害提升60%, 子弹更大",
                shortLabel: "重",
                valueText: "+60%",
                damageRatio: 1.6,
                scale: 1.35,
                color: cc.color(255, 210, 90, 255),
                effectColor: cc.color(255, 210, 90, 210),
            },
        ];
    }

    applyTestUpgradeChoice(choice) {
        if (!choice || !choice.id) {
            return;
        }

        if (choice.id == "hp") {
            this._maxHp += choice.amount;
            this._hp = this._maxHp;
            this.refreshHp();
        }
        else if (choice.id == "atk") {
            this._atk += choice.amount;
        }
        else if (choice.id == "speed") {
            this._moveSpeedScale += choice.amount / 100;
        }

        this._showUpgradeFloat(choice);
        this._playUpgradeSelectFeedback(choice);
    }

    applyTestBulletMutationChoice(choice) {
        if (!choice || !choice.id) {
            return;
        }

        this._bulletMutationType = choice.id;
        this._bulletMutationData = {
            id: choice.id,
            title: choice.title,
            shortLabel: choice.shortLabel,
            valueText: choice.valueText,
            bounceCount: choice.bounceCount || 0,
            penetrateCount: choice.penetrateCount || 0,
            damageRatio: choice.damageRatio || 1,
            scale: choice.scale || 1,
            color: choice.color,
            effectColor: choice.effectColor || choice.color,
        };

        this._showBulletMutationMedal(this._bulletMutationData);
        this._refreshBulletMutationEffect();
        this._playUpgradeSelectFeedback(this._bulletMutationData);
    }

    _getCurrentBulletMutationData() {
        let bounceCount = this.getCurrentBulletBounceCount();
        if (bounceCount > 0) {
            return {
                id: "bounce",
                title: "反弹子弹",
                desc: "碰墙后自动反弹, 反弹后命中伤害翻倍",
                shortLabel: "反",
                valueText: "x" + bounceCount,
                bounceCount: bounceCount,
                penetrateCount: 0,
                damageRatio: 1,
                scale: 1,
                color: cc.color(90, 180, 255, 255),
                effectColor: cc.color(90, 180, 255, 210),
            };
        }

        if (!this._bulletMutationData) {
            return null;
        }

        let data = Object.assign({}, this._bulletMutationData);
        data.color = this._bulletMutationData.color;
        data.effectColor = this._bulletMutationData.effectColor;
        return data;
    }

    _getBounceCountByEnergyLevel(energyLevel = null) {
        let level = energyLevel == null ? this._energyLevel : energyLevel;
        if (level < PLAYER_BOUNCE_UNLOCK_ENERGY_LEVEL) {
            return 0;
        }
        return Math.min(PLAYER_BOUNCE_MAX_COUNT, level - PLAYER_BOUNCE_UNLOCK_ENERGY_LEVEL + 1);
    }

    getCurrentBulletBounceCount() {
        return Math.max(0, this._bulletBounceCount || this._getBounceCountByEnergyLevel());
    }

    _syncBulletBounceState(showFeedback = false) {
        let prevBounceCount = this._bulletBounceCount || 0;
        let nextBounceCount = this._getBounceCountByEnergyLevel();
        this._bulletBounceCount = nextBounceCount;

        if (nextBounceCount > 0) {
            let choice = this._getCurrentBulletMutationData();
            if (choice) {
                if (showFeedback && nextBounceCount > prevBounceCount) {
                    this._showBulletMutationMedal(choice);
                    this._playUpgradeSelectFeedback(choice);
                    this.showUpgradeToast(choice);
                }
                this._refreshBulletMutationEffect();
            }
        }
        else{
            this._hideBulletMutationEffect();
        }
    }

    _showUpgradeFloat(choice) {
        if (!this.node.parent || !cc.isValid(this.node.parent)) {
            return;
        }

        let floatNode = new cc.Node("_upgradeFloat");
        floatNode.parent = this.node.parent;
        floatNode.setPosition(cc.v3(this.node.x, this.node.y + 110, 0));
        floatNode.zIndex = 6500;
        floatNode.opacity = 0;
        floatNode.scale = 0.82;

        let badge = new cc.Node("_upgradeBadge");
        badge.parent = floatNode;
        badge.setPosition(-44, 4);
        let badgeGraphics = badge.addComponent(cc.Graphics);
        badgeGraphics.fillColor = choice.color;
        badgeGraphics.circle(0, 0, 24);
        badgeGraphics.fill();
        badgeGraphics.lineWidth = 3;
        badgeGraphics.strokeColor = cc.color(255, 255, 255, 220);
        badgeGraphics.circle(0, 0, 24);
        badgeGraphics.stroke();

        let badgeLabelNode = new cc.Node("_upgradeBadgeLabel");
        badgeLabelNode.parent = badge;
        badgeLabelNode.setContentSize(54, 32);
        let badgeLabel = badgeLabelNode.addComponent(cc.Label);
        badgeLabel.string = choice.shortLabel;
        badgeLabel.fontSize = choice.shortLabel.length > 2 ? 15 : 18;
        badgeLabel.lineHeight = 20;
        badgeLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        badgeLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;

        let valueNode = new cc.Node("_upgradeValue");
        valueNode.parent = floatNode;
        valueNode.setPosition(22, 8);
        valueNode.color = choice.color;
        valueNode.setContentSize(170, 38);
        let valueLabel = valueNode.addComponent(cc.Label);
        valueLabel.string = choice.valueText;
        valueLabel.fontSize = 34;
        valueLabel.lineHeight = 38;
        valueLabel.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
        valueLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;

        let titleNode = new cc.Node("_upgradeTitle");
        titleNode.parent = floatNode;
        titleNode.setPosition(16, -24);
        titleNode.color = cc.color(255, 255, 255, 220);
        titleNode.setContentSize(220, 28);
        let titleLabel = titleNode.addComponent(cc.Label);
        titleLabel.string = choice.title;
        titleLabel.fontSize = 20;
        titleLabel.lineHeight = 24;
        titleLabel.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
        titleLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;

        floatNode.runAction(cc.sequence(
            cc.spawn(
                cc.fadeIn(0.12),
                cc.scaleTo(0.12, 1.04),
                cc.moveBy(0.12, 0, 18)
            ),
            cc.spawn(
                cc.moveBy(0.55, 0, 72),
                cc.fadeOut(0.55)
            ),
            cc.removeSelf()
        ));
    }

    showUpgradeToast(choice) {
        if (!choice || !this.node || !cc.isValid(this.node)) {
            return;
        }

        let toast = new cc.Node("_upgradeToast");
        toast.parent = this.node;
        toast.setPosition(0, this._radius + 76);
        toast.zIndex = 360;
        toast.opacity = 0;
        toast.scale = 0.88;

        let bg = toast.addComponent(cc.Graphics);
        bg.fillColor = cc.color(20, 24, 34, 228);
        bg.roundRect(-110, -20, 220, 40, 14);
        bg.fill();
        bg.lineWidth = 3;
        bg.strokeColor = choice.color;
        bg.roundRect(-110, -20, 220, 40, 14);
        bg.stroke();

        let labelNode = new cc.Node("_upgradeToastLabel");
        labelNode.parent = toast;
        labelNode.setContentSize(204, 30);
        labelNode.color = cc.color(255, 255, 255, 255);
        let label = labelNode.addComponent(cc.Label);
        label.string = choice.title + " " + choice.valueText;
        label.fontSize = 18;
        label.lineHeight = 22;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;

        toast.runAction(cc.sequence(
            cc.spawn(
                cc.fadeIn(0.12),
                cc.scaleTo(0.12, 1),
                cc.moveBy(0.12, 0, 10)
            ),
            cc.delayTime(0.7),
            cc.spawn(
                cc.fadeOut(0.22),
                cc.moveBy(0.22, 0, 18)
            ),
            cc.removeSelf()
        ));
    }

    _showOilPickupFeedback() {
        let badge = new cc.Node("_oilPickupReady");
        badge.parent = this.node;
        badge.setPosition(0, this._radius + 48);
        badge.opacity = 0;
        badge.scale = 0.7;
        badge.zIndex = 320;

        let graphics = badge.addComponent(cc.Graphics);
        graphics.fillColor = cc.color(78, 52, 26, 235);
        graphics.roundRect(-68, -18, 136, 36, 12);
        graphics.fill();
        graphics.lineWidth = 3;
        graphics.strokeColor = cc.color(255, 205, 122, 235);
        graphics.roundRect(-68, -18, 136, 36, 12);
        graphics.stroke();

        let labelNode = new cc.Node("_oilPickupReadyLabel");
        labelNode.parent = badge;
        labelNode.setContentSize(124, 28);
        labelNode.color = cc.color(255, 232, 172, 255);
        let label = labelNode.addComponent(cc.Label);
        label.string = "焦油弹就绪";
        label.fontSize = 20;
        label.lineHeight = 24;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;

        badge.runAction(cc.sequence(
            cc.spawn(
                cc.fadeIn(0.12),
                cc.scaleTo(0.12, 1.02),
                cc.moveBy(0.12, 0, 12)
            ),
            cc.delayTime(0.6),
            cc.spawn(
                cc.fadeOut(0.2),
                cc.moveBy(0.2, 0, 16)
            ),
            cc.removeSelf()
        ));
    }

    _showBlackHolePickupFeedback() {
        let badge = new cc.Node("_blackHolePickupReady");
        badge.parent = this.node;
        badge.setPosition(0, this._radius + 48);
        badge.opacity = 0;
        badge.scale = 0.7;
        badge.zIndex = 320;

        let graphics = badge.addComponent(cc.Graphics);
        graphics.fillColor = cc.color(42, 24, 88, 235);
        graphics.roundRect(-74, -18, 148, 36, 12);
        graphics.fill();
        graphics.lineWidth = 3;
        graphics.strokeColor = cc.color(198, 138, 255, 235);
        graphics.roundRect(-74, -18, 148, 36, 12);
        graphics.stroke();

        let labelNode = new cc.Node("_blackHolePickupReadyLabel");
        labelNode.parent = badge;
        labelNode.setContentSize(136, 28);
        labelNode.color = cc.color(234, 214, 255, 255);
        let label = labelNode.addComponent(cc.Label);
        label.string = "黑洞弹就绪";
        label.fontSize = 20;
        label.lineHeight = 24;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;

        badge.runAction(cc.sequence(
            cc.spawn(
                cc.fadeIn(0.12),
                cc.scaleTo(0.12, 1.02),
                cc.moveBy(0.12, 0, 12)
            ),
            cc.delayTime(0.6),
            cc.spawn(
                cc.fadeOut(0.2),
                cc.moveBy(0.2, 0, 16)
            ),
            cc.removeSelf()
        ));
    }

    _playUpgradeSelectFeedback(choice) {
        let wave = new cc.Node("_upgradeWave");
        wave.parent = this.node;
        wave.setPosition(0, 0);
        wave.zIndex = 280;
        wave.opacity = 220;
        wave.scale = 0.55;
        let waveGraphics = wave.addComponent(cc.Graphics);
        waveGraphics.lineWidth = 8;
        waveGraphics.strokeColor = choice.color;
        waveGraphics.circle(0, 0, this._radius + 18);
        waveGraphics.stroke();
        wave.runAction(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.3, 3.2),
                cc.fadeOut(0.3)
            ),
            cc.removeSelf()
        ));

        let glow = new cc.Node("_upgradeGlow");
        glow.parent = this.node;
        glow.setPosition(0, 0);
        glow.zIndex = 275;
        glow.opacity = 0;
        glow.scale = 0.75;
        let glowGraphics = glow.addComponent(cc.Graphics);
        glowGraphics.fillColor = cc.color(choice.color.r, choice.color.g, choice.color.b, 90);
        glowGraphics.circle(0, 0, this._radius + 26);
        glowGraphics.fill();
        glow.runAction(cc.sequence(
            cc.spawn(
                cc.fadeTo(0.12, 180),
                cc.scaleTo(0.12, 1.28)
            ),
            cc.spawn(
                cc.fadeOut(0.18),
                cc.scaleTo(0.18, 1.8)
            ),
            cc.removeSelf()
        ));

        this.node.stopActionByTag(9301);
        let punch = cc.sequence(
            cc.scaleTo(0.1, 1.08),
            cc.scaleTo(0.2, 1)
        );
        punch.setTag(9301);
        this.node.runAction(punch);

        if (this._map && this._map.playLightScreenShake) {
            this._map.playLightScreenShake();
        }
    }

    _showBulletMutationMedal(choice) {
        if (!this.node.parent || !cc.isValid(this.node.parent)) {
            return;
        }

        let medal = new cc.Node("_bulletMutationMedal");
        medal.parent = this.node.parent;
        medal.setPosition(cc.v3(this.node.x, this.node.y + 112, 0));
        medal.zIndex = 6600;
        medal.opacity = 0;
        medal.scale = 0.88;

        let badge = new cc.Node("_medalBadge");
        badge.parent = medal;
        let badgeGraphics = badge.addComponent(cc.Graphics);
        badgeGraphics.fillColor = choice.color;
        badgeGraphics.circle(0, 0, 28);
        badgeGraphics.fill();
        badgeGraphics.lineWidth = 3;
        badgeGraphics.strokeColor = cc.color(255, 255, 255, 220);
        badgeGraphics.circle(0, 0, 28);
        badgeGraphics.stroke();

        let badgeLabelNode = new cc.Node("_medalBadgeLabel");
        badgeLabelNode.parent = badge;
        badgeLabelNode.setContentSize(52, 32);
        let badgeLabel = badgeLabelNode.addComponent(cc.Label);
        badgeLabel.string = choice.shortLabel;
        badgeLabel.fontSize = 22;
        badgeLabel.lineHeight = 26;
        badgeLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        badgeLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;

        let titleNode = new cc.Node("_medalTitle");
        titleNode.parent = medal;
        titleNode.setPosition(0, -48);
        titleNode.color = cc.color(255, 255, 255, 235);
        titleNode.setContentSize(220, 32);
        let titleLabel = titleNode.addComponent(cc.Label);
        titleLabel.string = choice.title;
        titleLabel.fontSize = 22;
        titleLabel.lineHeight = 26;
        titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        titleLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;

        medal.runAction(cc.sequence(
            cc.spawn(
                cc.fadeIn(0.12),
                cc.scaleTo(0.12, 1.02),
                cc.moveBy(0.12, 0, 16)
            ),
            cc.delayTime(1.88),
            cc.spawn(
                cc.fadeOut(0.35),
                cc.moveBy(0.35, 0, 34)
            ),
            cc.removeSelf()
        ));
    }

    _refreshBulletMutationEffect() {
        this._hideBulletMutationEffect();
        if (!this._bulletMutationData) {
            return;
        }

        let barrelNode = this._currentBg || this._fire._lyBarrel;
        let effect = new cc.Node("_bulletMutationMuzzleEffect");
        effect.parent = barrelNode;
        effect.setPosition(cc.v3(this._getBarrelMuzzleLocalPosition(-2)));
        effect.zIndex = 96;
        this._bulletMutationEffectNode = effect;

        let outer = new cc.Node("_muzzleOuter");
        outer.parent = effect;
        let outerGraphics = outer.addComponent(cc.Graphics);
        outerGraphics.fillColor = cc.color(this._bulletMutationData.effectColor.r, this._bulletMutationData.effectColor.g, this._bulletMutationData.effectColor.b, 90);
        outerGraphics.circle(0, 0, 16);
        outerGraphics.fill();

        let inner = new cc.Node("_muzzleInner");
        inner.parent = effect;
        let innerGraphics = inner.addComponent(cc.Graphics);
        innerGraphics.fillColor = this._bulletMutationData.effectColor;
        innerGraphics.circle(0, 0, 8);
        innerGraphics.fill();

        effect.runAction(cc.repeatForever(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.22, 1.22),
                cc.fadeTo(0.22, 220)
            ),
            cc.spawn(
                cc.scaleTo(0.22, 0.9),
                cc.fadeTo(0.22, 150)
            )
        )));
    }

    _hideBulletMutationEffect() {
        if (this._bulletMutationEffectNode && cc.isValid(this._bulletMutationEffectNode)) {
            this._bulletMutationEffectNode.stopAllActions();
            this._bulletMutationEffectNode.destroy();
        }
        this._bulletMutationEffectNode = null;
    }

    _refreshMoveEffect() {
        if (this._currentSpeed > 0) {
            if (this._moveEffectId < 0) {
                this._moveEffectId = MusicManager.playLoopEffect("tankMove");
            }
        }
        else{
            this._stopMoveEffect();
        }
    }

    _stopMoveEffect() {
        if (this._moveEffectId >= 0) {
            MusicManager.stopEffect(this._moveEffectId);
            this._moveEffectId = -1;
        }
    }
    // 炮管只跟随右侧发射摇杆方向
    _refreshBarrelDir() {
        if (this._shootInputDir && this._shootInputDir.magSqr() > 0) {
            this._barrelDir = this._shootInputDir;
        }
    }

    _getDisplayBarrelDir() {
        if (this._multiplayerMode && !this._multiplayerRemote && this._localPreviewBarrelDir && this._localPreviewBarrelDir.magSqr() > 0) {
            return this._localPreviewBarrelDir;
        }
        return this._barrelDir;
    }

    _refreshDisplayBarrelAngle(dt = 1 / 60) {
        if (!this._multiplayerMode || this._multiplayerRemote) {
            return;
        }
        let displayDir = this._getDisplayBarrelDir();
        if (!displayDir || displayDir.magSqr() <= 0) {
            return;
        }

        let fromAngle = this._fire._lyBarrel.angle;
        let toAngle = Utils.vectorsToDegress(displayDir);
        let disAngle = toAngle - fromAngle;
        if (disAngle > 180) {
            fromAngle = fromAngle + 360;
            disAngle = toAngle - fromAngle;
        }
        else if (disAngle < -180) {
            fromAngle = fromAngle - 360;
            disAngle = toAngle - fromAngle;
        }

        let maxTurnAngle = this._getFrameValue("AngularSpeed", 10, dt) * 1.6;
        if (maxTurnAngle <= 0 || Math.abs(disAngle) <= maxTurnAngle) {
            this._fire._lyBarrel.angle = toAngle;
        }
        else{
            this._fire._lyBarrel.angle = this._fire._lyBarrel.angle + (disAngle > 0 ? maxTurnAngle : -maxTurnAngle);
        }
        this._fire._lyBarrel.angle = Utils.correctionAngle(this._fire._lyBarrel.angle);
    }

    // 右侧按钮抬起时直接发射一发, 不走按住持续发射逻辑
    fireOnce() {
        let type = (this._viewMode || this._skill2Time > 0) ? this._config.BType2 : this._config.BType1;
        let attackRadius = this._viewMode ? this._config.AttackRadius * 0.8 :this._config.AttackRadius;
        let mutationData = this._viewMode ? null : this._getCurrentBulletMutationData();
        Bullet.createBulletEx(type,this.node.position,this._barrelDir,this._fire._lyBarrel.height+20,attackRadius,this._atk,this._camp,this.node.parent,this._map,16,mutationData);
        if (this._map && this._map.isShootEffectTestMode && this._map.isShootEffectTestMode()) {
            this._playShootFeedback(type, mutationData);
        }
        
        // if (this._viewMode == false && this._map.enemyCount() > 0) {
        if (this._viewMode == false) {
            MusicManager.playEffect("shoot");
        }
    }

    _fireByMultiplayerCommand(fireData) {
        if (!fireData) {
            return;
        }

        let type = fireData.type || this.getMultiplayerFireType();
        let attackRadius = this._config.AttackRadius;
        let mutationData = this._getCurrentBulletMutationData();
        if (mutationData && mutationData.id == "bounce" && Number.isFinite(fireData.bounceCount)) {
            mutationData.bounceCount = Math.max(0, Math.min(PLAYER_BOUNCE_MAX_COUNT, fireData.bounceCount));
            mutationData.valueText = "x" + mutationData.bounceCount;
        }
        let networkMeta = {
            bulletId: fireData.id,
            ownerPlayerId: this._multiplayerPlayerId,
        };
        Bullet.createBulletEx(
            type,
            this.node.position,
            this._barrelDir,
            this._fire._lyBarrel.height + 20,
            attackRadius,
            this._atk,
            this._camp,
            this.node.parent,
            this._map,
            16,
            mutationData,
            networkMeta
        );

        if (!this._multiplayerRemote) {
            this._playShootFeedback(type, mutationData);
            MusicManager.playEffect("shoot");
        }
    }

    canAffordMultiplayerFire() {
        if (!this._multiplayerMode || this._multiplayerRemote) {
            return true;
        }
        if (this._bulletCodeTime < PLAYER_SHOOT_INTERVAL) {
            return false;
        }
        if (this._freeBulletCount > 0) {
            return true;
        }
        return !this._canNotAffordPaidBullet();
    }

    _playShootFeedback(bulletType, mutationData) {
        this._playBarrelRecoil();
        this._playMuzzleFlash(bulletType, mutationData);
        this._playShootGlow(bulletType, mutationData);
        this._playShootShake();
    }

    _playBarrelRecoil() {
        let recoilNode = this._currentBg || (this._fire && this._fire._lyBarrel);
        if (!recoilNode || !cc.isValid(recoilNode)) {
            return;
        }
        let parentNode = recoilNode.parent;
        if (!parentNode || !cc.isValid(parentNode)) {
            return;
        }

        let basePos = recoilNode["_shootBasePos"];
        if (!basePos) {
            basePos = cc.v3(recoilNode.position);
            recoilNode["_shootBasePos"] = cc.v3(basePos);
        }

        let baseWorldPos = parentNode.convertToWorldSpaceAR(basePos);
        let recoilDir = this._barrelDir && this._barrelDir.magSqr() > 0 ? this._barrelDir.normalize() : cc.v2(1, 0);
        let recoilWorldPos = cc.v2(baseWorldPos).sub(recoilDir.mul(SHOOT_RECOIL_DISTANCE));
        let recoilLocalPos = parentNode.convertToNodeSpaceAR(recoilWorldPos);

        recoilNode.stopActionByTag(9004);
        recoilNode.setPosition(basePos);
        let action = cc.sequence(
            cc.moveTo(SHOOT_RECOIL_OUT_TIME, recoilLocalPos.x, recoilLocalPos.y),
            cc.moveTo(SHOOT_RECOIL_RETURN_TIME, basePos.x, basePos.y)
        );
        action.setTag(9004);
        recoilNode.runAction(action);
    }

    _playMuzzleFlash(bulletType, mutationData) {
        let barrelNode = this._currentBg || this._fire._lyBarrel;
        if (!barrelNode || !cc.isValid(barrelNode)) {
            return;
        }

        let effectColor = this._getShootEffectColor(bulletType, mutationData);
        let flash = new cc.Node("_shootMuzzleFlash");
        flash.parent = barrelNode;
        flash.setPosition(cc.v3(this._getBarrelMuzzleLocalPosition(6)));
        flash.zIndex = 115;
        flash.opacity = 0;
        flash.scaleX = 0.28;
        flash.scaleY = 0.72;

        let cone = new cc.Node("_flashCone");
        cone.parent = flash;
        let coneGraphics = cone.addComponent(cc.Graphics);
        coneGraphics.fillColor = cc.color(effectColor.r, effectColor.g, effectColor.b, 210);
        coneGraphics.moveTo(0, 36);
        coneGraphics.lineTo(-17, 8);
        coneGraphics.lineTo(-7, -8);
        coneGraphics.lineTo(0, 4);
        coneGraphics.lineTo(7, -8);
        coneGraphics.lineTo(17, 8);
        coneGraphics.close();
        coneGraphics.fill();

        let core = new cc.Node("_flashCore");
        core.parent = flash;
        let coreGraphics = core.addComponent(cc.Graphics);
        coreGraphics.fillColor = cc.color(255, 250, 220, 235);
        coreGraphics.circle(0, 0, 11);
        coreGraphics.fill();

        flash.runAction(cc.sequence(
            cc.spawn(
                cc.fadeTo(SHOOT_FLASH_FADE_IN, 255),
                cc.scaleTo(SHOOT_FLASH_FADE_IN, 1.1, 1.18)
            ),
            cc.spawn(
                cc.fadeOut(SHOOT_FLASH_FADE_OUT),
                cc.scaleTo(SHOOT_FLASH_FADE_OUT, 0.55, 1.65)
            ),
            cc.removeSelf()
        ));
    }

    _playShootGlow(bulletType, mutationData) {
        let effectColor = this._getShootEffectColor(bulletType, mutationData);

        if (!this.node.parent || !cc.isValid(this.node.parent)) {
            return;
        }

        let muzzleGlow = new cc.Node("_shootMuzzleGlow");
        muzzleGlow.parent = this.node.parent;
        muzzleGlow.setPosition(cc.v3(this._getBarrelMuzzlePosition(0)));
        muzzleGlow.zIndex = 285;
        muzzleGlow.opacity = 0;
        muzzleGlow.scale = 0.5;
        let muzzleGlowGraphics = muzzleGlow.addComponent(cc.Graphics);
        muzzleGlowGraphics.fillColor = cc.color(effectColor.r, effectColor.g, effectColor.b, 95);
        muzzleGlowGraphics.circle(0, 0, 28);
        muzzleGlowGraphics.fill();
        muzzleGlow.runAction(cc.sequence(
            cc.spawn(
                cc.fadeTo(0.03, 210),
                cc.scaleTo(0.03, 1.05)
            ),
            cc.spawn(
                cc.fadeOut(0.1),
                cc.scaleTo(0.1, 1.65)
            ),
            cc.removeSelf()
        ));

        let bodyGlow = new cc.Node("_shootBodyGlow");
        bodyGlow.parent = this.node;
        bodyGlow.setPosition(0, 0);
        bodyGlow.zIndex = 260;
        bodyGlow.opacity = 0;
        bodyGlow.scale = 0.75;
        let bodyGlowGraphics = bodyGlow.addComponent(cc.Graphics);
        bodyGlowGraphics.fillColor = cc.color(effectColor.r, effectColor.g, effectColor.b, 70);
        bodyGlowGraphics.circle(0, 0, this._radius + 28);
        bodyGlowGraphics.fill();
        bodyGlow.runAction(cc.sequence(
            cc.spawn(
                cc.fadeTo(0.04, 150),
                cc.scaleTo(0.04, 1.08)
            ),
            cc.spawn(
                cc.fadeOut(0.12),
                cc.scaleTo(0.12, 1.38)
            ),
            cc.removeSelf()
        ));
    }

    _playShootShake() {
        if (this._map && this._map.playLightScreenShake) {
            this._map.playLightScreenShake();
        }
    }

    _getShootEffectColor(bulletType, mutationData) {
        if (mutationData && mutationData.effectColor) {
            return mutationData.effectColor;
        }
        if (bulletType == OIL_SHELL_BULLET_TYPE) {
            return cc.color(130, 92, 52, 220);
        }
        if (bulletType == this._config.BType2) {
            return cc.color(120, 225, 255, 230);
        }
        return cc.color(255, 205, 95, 230);
    }

    _updateChargeCannon(dt) {
        if (this._chargeCannonCdTime > 0) {
            this._chargeCannonCdTime -= dt;
            if (this._chargeCannonCdTime < 0) {
                this._chargeCannonCdTime = 0;
            }

            if (this._chargeCannonCooldown > 0) {
                let cooldownProgress = 1 - this._chargeCannonCdTime / this._chargeCannonCooldown;
                yyp.eventCenter.emit("charge-cannon-cooldown", {progress: cooldownProgress});
            }
            if (this._chargeCannonCdTime == 0) {
                this._chargeCannonCooldown = 0;
                yyp.eventCenter.emit("charge-cannon-clear", {});
            }
        }

        if (this._chargeCannonCharging == false) {
            return;
        }

        this._chargeCannonTime += dt;
        let needTime = this._getChargeConfig("Time", 5);
        let progress = this._chargeCannonTime / needTime;
        if (progress > 1) {
            progress = 1;
        }
        yyp.eventCenter.emit("charge-cannon-progress", {progress: progress});

        if (this._chargeCannonReady == false && this._chargeCannonTime >= needTime) {
            this._chargeCannonReady = true;
            this._showChargeEffect();
            yyp.eventCenter.emit("charge-cannon-ready", {});
        }
    }

    _fireChargeCannon() {
        let attackRadius = this._getChargeConfig("AttackRadius", this._config.AttackRadius * 1.4);
        let atkRatio = this._getChargeConfig("AtkRatio", 3);
        let speed = this._getChargeConfig("Speed", 12);
        let wipeLen = this._getBarrelMuzzleDistance(12);
        Bullet.createBulletEx(CHARGE_CANNON_BULLET_TYPE, this.node.position, this._barrelDir, wipeLen, attackRadius, this._atk * atkRatio, this._camp, this.node.parent, this._map, speed);
        MusicManager.playEffect("chargeShoot");
        this._shakeScreen();
        this._chargeCannonCooldown = this._getChargeConfig("Cooldown", 8);
        this._chargeCannonCdTime = this._chargeCannonCooldown;
    }

    _gainOilShell() {
        if (this._chargeCannonCharging) {
            this._resetChargeCannon();
        }
        this._oilShellCount = Math.min(OIL_SHELL_MAX_COUNT, this._oilShellCount + 1);
        this._refreshSkillButtonMode();
        this._showOilPickupFeedback();
    }

    _gainBlackHoleShell() {
        if (this._chargeCannonCharging) {
            this._resetChargeCannon();
        }
        this._blackHoleShellCount = Math.min(BLACK_HOLE_SHELL_MAX_COUNT, this._blackHoleShellCount + 1);
        this._refreshSkillButtonMode();
        this._showBlackHolePickupFeedback();
    }

    _gainConfiguredPickup(type) {
        if (!type) {
            return;
        }
        if (this._chargeCannonCharging) {
            this._resetChargeCannon();
        }
        this._activePickupType = type;
        this._refreshSkillButtonMode();
    }

    _fireOilShell() {
        let wipeLen = this._getBarrelMuzzleDistance(8);
        Bullet.createBulletEx(OIL_SHELL_BULLET_TYPE, this.node.position, this._barrelDir, wipeLen, this._config.AttackRadius * 1.8, 0, this._camp, this.node.parent, this._map, 10);
        this._oilShellCount = Math.max(0, this._oilShellCount - 1);
        this._refreshSkillButtonMode();
        this._playShootGlow(OIL_SHELL_BULLET_TYPE, {effectColor: cc.color(130, 92, 52, 220)});
        if (this._map && this._map.playLightScreenShake) {
            this._map.playLightScreenShake();
        }
        MusicManager.playEffect("shoot");
    }

    _startOilShellPreview() {
        if ((this._oilShellCount <= 0 && this._blackHoleShellCount <= 0 && !this._activePickupType) || !this._map) {
            return;
        }
        this._activeThrowSkillType = this._activePickupType || (this._oilShellCount > 0 ? "oil" : "blackHole");
        this._oilShellPreviewing = true;
        let defaultDir = this._barrelDir && this._barrelDir.magSqr() > 0 ? cc.v2(this._barrelDir).normalize() : cc.v2(1, 0);
        this._oilShellAimDir = defaultDir;
        this._oilShellAimRatio = 1;
        this._refreshOilShellPreview();
    }

    _cancelOilShellPreview() {
        this._oilShellPreviewing = false;
        this._oilShellPreviewTarget = null;
        this._activeThrowSkillType = "";
        if (this._map && this._map.hideOilShellPreview) {
            this._map.hideOilShellPreview();
        }
    }

    _commitOilShellThrow() {
        if (!this._oilShellPreviewing) {
            this._cancelOilShellPreview();
            return;
        }
        let target = this._oilShellPreviewTarget || this._getOilShellThrowTarget();
        let activeThrowSkillType = this._activeThrowSkillType || this._activePickupType || (this._blackHoleShellCount > 0 && this._oilShellCount <= 0 ? "blackHole" : "oil");
        if (activeThrowSkillType == "tar") {
            activeThrowSkillType = "oil";
        }
        let aimDir = cc.v2(this._oilShellAimDir || this._barrelDir || cc.v2(1, 0));
        if (aimDir.magSqr() > 0) {
            aimDir = aimDir.normalize();
        }
        else{
            aimDir = cc.v2(1, 0);
        }
        let aimRatio = Math.max(0, Math.min(1, this._oilShellAimRatio == null ? 1 : this._oilShellAimRatio));
        this._cancelOilShellPreview();
        if (!target) {
            return;
        }
        if (this._multiplayerMode && !this._multiplayerRemote) {
            if (activeThrowSkillType == "blackHole" || activeThrowSkillType == "oil") {
                let throwEventName = activeThrowSkillType == "blackHole" ? "multiplayer-throw-black-hole" : "multiplayer-throw-tar";
                yyp.eventCenter.emit(throwEventName, {
                    dirX: Number(aimDir.x.toFixed(4)),
                    dirY: Number(aimDir.y.toFixed(4)),
                    ratio: Number(aimRatio.toFixed(4)),
                });
            }
            else{
                yyp.eventCenter.emit("multiplayer-use-pickup", {
                    pickupType: activeThrowSkillType,
                    dirX: Number(aimDir.x.toFixed(4)),
                    dirY: Number(aimDir.y.toFixed(4)),
                    ratio: Number(aimRatio.toFixed(4)),
                });
            }
            return;
        }
        if (activeThrowSkillType == "blackHole") {
            this._throwBlackHoleShellAt(target);
        }
        else if (activeThrowSkillType == "portal" || activeThrowSkillType == "speedDouble" || activeThrowSkillType == "damageDouble") {
            this._useConfiguredPickupAt(target, activeThrowSkillType);
        }
        else{
            this._throwOilShellAt(target);
        }
    }

    _getOilShellThrowTarget() {
        let attackRadius = this._config && this._config.AttackRadius != null ? this._config.AttackRadius : 420;
        let dir = this._oilShellAimDir && this._oilShellAimDir.magSqr() > 0 ? cc.v2(this._oilShellAimDir).normalize() : cc.v2(1, 0);
        let ratio = Math.max(0, Math.min(1, this._oilShellAimRatio == null ? 1 : this._oilShellAimRatio));
        let target = cc.v2(this.node.position).add(dir.mul(attackRadius * ratio));
        return this._map && this._map.clampMapInnerPosition
            ? this._map.clampMapInnerPosition(target, OIL_THROW_AREA_RADIUS * 0.55)
            : target;
    }

    _updateOilShellAim(event) {
        if (!this._oilShellPreviewing) {
            return;
        }
        if (event && event.dir && event.dir.magSqr && event.dir.magSqr() > 0.0001) {
            this._oilShellAimDir = cc.v2(event.dir).normalize();
        }
        if (event && Number.isFinite(event.ratio)) {
            this._oilShellAimRatio = Math.max(0, Math.min(1, Number(event.ratio)));
        }
        this._refreshOilShellPreview();
    }

    _refreshOilShellPreview() {
        if (!this._oilShellPreviewing || !this._map) {
            return;
        }
        this._oilShellPreviewTarget = this._getOilShellThrowTarget();
        if (this._map.showOilShellPreview && this._oilShellPreviewTarget) {
            this._map.showOilShellPreview(this.node.position, this._oilShellPreviewTarget, {
                radius: OIL_THROW_PREVIEW_ARC_HEIGHT,
                areaRadius: OIL_THROW_AREA_RADIUS,
            });
        }
    }

    _throwBlackHoleShellAt(target) {
        if (!target || this._blackHoleShellCount <= 0) {
            return;
        }
        this._blackHoleShellCount = Math.max(0, this._blackHoleShellCount - 1);
        this._refreshSkillButtonMode();
        if (this._map && this._map.playOilShellThrow) {
            this._map.playOilShellThrow(this.node.position, target, {
                areaRadius: OIL_THROW_AREA_RADIUS,
                arcHeight: OIL_THROW_PREVIEW_ARC_HEIGHT,
                onLand: () => {
                    if (this._map && this._map.spawnBlackHoleZone) {
                        this._map.spawnBlackHoleZone(target);
                    }
                }
            });
        }
        this._playShootGlow(OIL_SHELL_BULLET_TYPE, {effectColor: cc.color(130, 92, 180, 220)});
        if (this._map && this._map.playLightScreenShake) {
            this._map.playLightScreenShake();
        }
        MusicManager.playEffect("shoot");
    }

    _throwOilShellAt(target) {
        if (!target || this._oilShellCount <= 0) {
            return;
        }
        this._oilShellCount = Math.max(0, this._oilShellCount - 1);
        this._refreshSkillButtonMode();
        if (this._map && this._map.playOilShellThrow) {
            this._map.playOilShellThrow(this.node.position, target, {
                areaRadius: OIL_THROW_AREA_RADIUS,
                arcHeight: OIL_THROW_PREVIEW_ARC_HEIGHT,
                onLand: () => {
                    if (this._map && this._map.spawnOilSpill) {
                        this._map.spawnOilSpill(target);
                    }
                }
            });
        }
        else{
            this._fireOilShell();
        }
        this._playShootGlow(OIL_SHELL_BULLET_TYPE, {effectColor: cc.color(130, 92, 52, 220)});
        if (this._map && this._map.playLightScreenShake) {
            this._map.playLightScreenShake();
        }
        MusicManager.playEffect("shoot");
    }

    _useConfiguredPickupAt(target, pickupType) {
        if (!target || !pickupType || this._activePickupType != pickupType) {
            return;
        }
        this._activePickupType = "";
        this._refreshSkillButtonMode();
    }

    _refreshSkillButtonMode() {
        if (this._multiplayerMode && this._multiplayerRemote) {
            return;
        }
        let mode = "charge";
        if (this._oilShellCount > 0) {
            mode = "oil";
        }
        else if (this._blackHoleShellCount > 0) {
            mode = "blackHole";
        }
        else if (this._activePickupType) {
            mode = this._activePickupType;
        }
        yyp.eventCenter.emit("skill-button-mode", {mode: mode});
    }

    _getChargeConfig(key, defaultValue) {
        let fullKey = "Charge" + key;
        let value = this._config ? this._config[fullKey] : null;
        return value == null ? defaultValue : value;
    }

    _resetChargeCannon() {
        this._chargeCannonTime = 0;
        this._chargeCannonCharging = false;
        this._chargeCannonReady = false;
        this._hideChargeEffect();
        if (this._chargeCannonCdTime <= 0) {
            yyp.eventCenter.emit("charge-cannon-clear", {});
        }
    }

    _showChargeEffect() {
        if (this._chargeEffectNode && cc.isValid(this._chargeEffectNode)) {
            this._chargeEffectNode.active = true;
            return;
        }

        let barrelNode = this._currentBg || this._fire._lyBarrel;
        let effect = new cc.Node("_chargeMuzzleEffect");
        effect.parent = barrelNode;
        effect.setPosition(cc.v3(this._getBarrelMuzzleLocalPosition(4)));
        effect.zIndex = 100;

        let graphics = effect.addComponent(cc.Graphics);
        graphics.fillColor = cc.color(255, 40, 20, 180);
        graphics.circle(0, 0, 18);
        graphics.fill();

        effect.runAction(cc.repeatForever(cc.sequence(
            cc.scaleTo(0.25, 1.35),
            cc.scaleTo(0.25, 0.9)
        )));
        this._chargeEffectNode = effect;
    }

    _hideChargeEffect() {
        if (this._chargeEffectNode && cc.isValid(this._chargeEffectNode)) {
            this._chargeEffectNode.stopAllActions();
            this._chargeEffectNode.destroy();
        }
        this._chargeEffectNode = null;
    }

    _shakeScreen() {
        if (!this._map || !this._map.node) {
            return;
        }

        let mapNode = this._map.node;
        let origin = mapNode.position;
        mapNode.stopActionByTag(9001);
        let action = cc.sequence(
            cc.moveBy(0.03, 4, 0),
            cc.moveBy(0.03, -8, 0),
            cc.moveBy(0.03, 4, 3),
            cc.moveBy(0.03, 0, -3),
            cc.callFunc(function(){
                mapNode.setPosition(origin);
            })
        );
        action.setTag(9001);
        mapNode.runAction(action);
        Utils.vibrate();
    }

    _getBarrelMuzzleLocalPosition(extraOffset = 0) {
        let barrelNode = this._currentBg || this._fire._lyBarrel;
        let anchorY = barrelNode.anchorY == null ? 0.5 : barrelNode.anchorY;
        return cc.v2(0, barrelNode.height * (1 - anchorY) + extraOffset);
    }

    _getBarrelMuzzlePosition(extraOffset = 0) {
        let barrelNode = this._currentBg || this._fire._lyBarrel;
        let localPos = this._getBarrelMuzzleLocalPosition(extraOffset);
        let worldPos = barrelNode.convertToWorldSpaceAR(localPos);
        return this.node.parent.convertToNodeSpaceAR(worldPos);
    }

    _getBarrelMuzzleDistance(extraOffset = 0) {
        let muzzlePos = this._getBarrelMuzzlePosition(extraOffset);
        return muzzlePos.sub(this.node.position).mag();
    }

    _tryFireOnce() {
        if (this._bulletCodeTime < PLAYER_SHOOT_INTERVAL) {
            return;
        }

        if (this._freeBulletCount <= 0 && this._canNotAffordPaidBullet()) {
            this._showLowHpShootTip();
            return;
        }

        this._bulletCodeTime = 0;
        this._stopFireTime = 0;
        this._freeBulletRecoverTime = 0;
        this.fireOnce();

        if (this._freeBulletCount > 0) {
            this._freeBulletCount--;
            this._refreshFreeBulletBar();
            return;
        }

        this._consumeHpForPaidBullet();
    }

    _canNotAffordPaidBullet() {
        return this._hp <= PLAYER_PAID_SHOT_HP_COST;
    }

    _showLowHpShootTip() {
        let channel = SDKManager.getChannel();
        if (channel && channel.showToast) {
            channel.showToast("血量过低,无法发射子弹");
        }
        else{
            cc.log("血量过低,无法发射子弹");
        }
    }

    _consumeHpForPaidBullet() {
        this._hp -= PLAYER_PAID_SHOT_HP_COST;
        if (this._hp < 0) {
            this._hp = 0;
        }

        this.refreshHp();
        if (this._hp <= 0) {
            this.doDeath();
        }
    }

    applyMultiplayerFireState(command: any) {
        if (!this._multiplayerMode || !command) {
            return;
        }

        if (command.maxHp != null && command.maxHp > 0) {
            this._maxHp = command.maxHp;
        }
        if (command.hp != null) {
            let nextHp = Math.max(0, command.hp);
            if (this._maxHp > 0 && nextHp > this._maxHp) {
                nextHp = this._maxHp;
            }
            this._hp = nextHp;
        }
        if (command.freeBulletCount != null) {
            this._freeBulletCount = Math.max(0, Math.min(PLAYER_FREE_BULLET_MAX, command.freeBulletCount));
        }
        if (command.stopFireTime != null) {
            this._stopFireTime = Math.max(0, command.stopFireTime);
        }
        if (command.freeBulletRecoverTime != null) {
            this._freeBulletRecoverTime = Math.max(0, command.freeBulletRecoverTime);
        }
        if (command.shotCooldownRemaining != null) {
            let nextCooldown = Math.max(0, command.shotCooldownRemaining);
            this._bulletCodeTime = Math.max(0, PLAYER_SHOOT_INTERVAL - nextCooldown);
        }
        this.refreshHp();
        this._refreshFreeBulletBar();
        if (this._hp == 0) {
            this.doDeath();
        }
    }

    //玩家受击不飘伤害数字, 用区别于敌人的蓝色闪光表现
    beHit(damage){
        damage = damage - this._def;
        if (damage < 0) {
            damage = 0;
        }

        this._hp -= damage;
        if (this._hp < 0) {
            this._hp = 0;
        }

        this.refreshHp();
        this._showPlayerHitEffect();
        Utils.vibrate();
        MusicManager.playEffect("playerHit");

        if (this._hp == 0) {
            this.doDeath();
        }
    }

    applyMultiplayerHit(damage, hp) {
        if (!this._multiplayerMode) {
            this.beHit(damage);
            return;
        }

        let nextHp = hp;
        if (nextHp == null || nextHp < 0) {
            nextHp = this._hp - Math.max(0, damage || 0);
        }
        if (nextHp < 0) {
            nextHp = 0;
        }

        let didTakeDamage = nextHp < this._hp;
        this._hp = nextHp;
        this.refreshHp();

        if (didTakeDamage) {
            this._showPlayerHitEffect();
            if (!this._multiplayerRemote) {
                Utils.vibrate();
                MusicManager.playEffect("playerHit");
            }
        }

        if (this._hp == 0) {
            this.doDeath();
        }
    }

    syncMultiplayerHp(hp, maxHp = null) {
        if (!this._multiplayerMode) {
            return;
        }

        if (maxHp != null && maxHp > 0) {
            this._maxHp = maxHp;
        }

        if (hp == null) {
            return;
        }

        let nextHp = hp;
        if (nextHp < 0) {
            nextHp = 0;
        }
        if (this._maxHp > 0 && nextHp > this._maxHp) {
            nextHp = this._maxHp;
        }

        let didTakeDamage = nextHp < this._hp;
        this._hp = nextHp;
        this.refreshHp();

        if (didTakeDamage) {
            this._showPlayerHitEffect();
            if (!this._multiplayerRemote) {
                Utils.vibrate();
                MusicManager.playEffect("playerHit");
            }
        }

        if (this._hp == 0) {
            this.doDeath();
        }
    }

    syncMultiplayerState(state: any) {
        if (!this._multiplayerMode || !state) {
            return;
        }

        if (Number.isFinite(state.x) && Number.isFinite(state.y)) {
            this._multiplayerSyncPosition = cc.v2(state.x, state.y);
        }
        if (Number.isFinite(state.dirX) && Number.isFinite(state.dirY)) {
            let syncDir = cc.v2(state.dirX, state.dirY);
            if (syncDir.magSqr() > 0.0001) {
                this._multiplayerSyncDir = syncDir.normalize();
            }
        }
        if (Number.isFinite(state.speed)) {
            this._multiplayerSyncSpeed = Math.max(0, state.speed);
        }

        let prevHp = this._hp;
        let prevMaxHp = this._maxHp;
        let prevAtk = this._atk;
        let prevMoveSpeedScale = this._moveSpeedScale;
        let prevEnergyLevel = this._energyLevel;
        if (state.maxHp != null && state.maxHp > 0) {
            this._maxHp = state.maxHp;
        }
        if (state.hp != null) {
            let nextHp = state.hp;
            if (nextHp < 0) {
                nextHp = 0;
            }
            if (this._maxHp > 0 && nextHp > this._maxHp) {
                nextHp = this._maxHp;
            }
            this._hp = nextHp;
        }
        if (state.atk != null) {
            this._atk = state.atk;
        }
        if (state.moveSpeedScale != null && state.moveSpeedScale > 0) {
            this._moveSpeedScale = state.moveSpeedScale;
        }
        if (state.tarAmmoCount != null) {
            let nextTarAmmoCount = Math.max(0, state.tarAmmoCount);
            if (nextTarAmmoCount != this._oilShellCount) {
                this._oilShellCount = nextTarAmmoCount;
                this._refreshSkillButtonMode();
            }
        }
        if (state.blackHoleAmmoCount != null) {
            let nextBlackHoleAmmoCount = Math.max(0, state.blackHoleAmmoCount);
            if (nextBlackHoleAmmoCount != this._blackHoleShellCount) {
                this._blackHoleShellCount = nextBlackHoleAmmoCount;
                this._refreshSkillButtonMode();
            }
        }
        if (state.activePickupType !== undefined) {
            let nextActivePickupType = state.activePickupType || "";
            if (nextActivePickupType == "tar") {
                nextActivePickupType = "oil";
            }
            if (nextActivePickupType != this._activePickupType) {
                this._activePickupType = nextActivePickupType;
                this._refreshSkillButtonMode();
            }
        }
        if (state.freeBulletCount != null) {
            this._freeBulletCount = Math.max(0, Math.min(PLAYER_FREE_BULLET_MAX, state.freeBulletCount));
        }
        if (state.stopFireTime != null) {
            this._stopFireTime = Math.max(0, state.stopFireTime);
        }
        if (state.freeBulletRecoverTime != null) {
            this._freeBulletRecoverTime = Math.max(0, state.freeBulletRecoverTime);
        }
        if (state.shotCooldownRemaining != null) {
            let nextCooldown = Math.max(0, state.shotCooldownRemaining);
            this._bulletCodeTime = Math.max(0, PLAYER_SHOOT_INTERVAL - nextCooldown);
        }
        if (state.energyLevel != null && state.energyLevel > 0) {
            this._energyLevel = state.energyLevel;
        }
        if (state.energyExp != null) {
            this._energyExp = Math.max(0, state.energyExp);
        }
        if (state.energyNeedExp != null && state.energyNeedExp > 0) {
            this._energyNeedExp = state.energyNeedExp;
        }
        if (state.bulletBounceCount != null) {
            this._bulletBounceCount = Math.max(0, Math.min(PLAYER_BOUNCE_MAX_COUNT, state.bulletBounceCount));
        }
        else{
            this._bulletBounceCount = this._getBounceCountByEnergyLevel(this._energyLevel);
        }
        this._multiplayerInBush = !!state.inBush;
        this._multiplayerBushId = state.bushId == null ? null : state.bushId;
        this._syncBulletBounceState(false);

        if (this._energyLevel > prevEnergyLevel) {
            let choice = this._buildUpgradeChoiceFromStateDelta(prevMaxHp, prevAtk, prevMoveSpeedScale);
            if (choice) {
                this._showUpgradeFloat(choice);
                this._playUpgradeSelectFeedback(choice);
                this.showUpgradeToast(choice);
            }
        }

        let didTakeDamage = this._hp < prevHp;
        this.refreshHp();
        this._refreshEnergyUI();
        this._refreshFreeBulletBar();

        if (didTakeDamage) {
            this._showPlayerHitEffect();
            if (!this._multiplayerRemote) {
                Utils.vibrate();
                MusicManager.playEffect("playerHit");
            }
        }

        if (this._hp == 0) {
            this.doDeath();
        }
        this._refreshBushVisibilityState();
    }

    _applyMultiplayerPositionCorrection() {
        if (!this._multiplayerMode || !this._multiplayerSyncPosition || !this.node || !cc.isValid(this.node)) {
            return;
        }

        let currPosition = cc.v2(this.node.position);
        let targetPosition = cc.v2(this._multiplayerSyncPosition);
        let offset = targetPosition.sub(currPosition);
        let distance = offset.mag();
        let epsilon = this._multiplayerRemote ? MULTIPLAYER_REMOTE_POSITION_EPSILON : MULTIPLAYER_LOCAL_POSITION_EPSILON;
        if (distance <= epsilon) {
            return;
        }

        let snapDistance = this._multiplayerRemote ? MULTIPLAYER_REMOTE_POSITION_SNAP_DISTANCE : MULTIPLAYER_LOCAL_POSITION_SNAP_DISTANCE;
        if (distance >= snapDistance) {
            this.node.setPosition(targetPosition);
            if (this._multiplayerSyncDir && this._multiplayerSyncDir.magSqr() > 0.0001) {
                this._dir = cc.v2(this._multiplayerSyncDir);
                if (this._multiplayerRemote) {
                    this._barrelDir = cc.v2(this._multiplayerSyncDir);
                }
            }
            if (!this._multiplayerRemote) {
                this._currentSpeed = this._multiplayerSyncSpeed || 0;
            }
            return;
        }

        if (!this._multiplayerRemote) {
            return;
        }

        let blend = this._multiplayerRemote ? MULTIPLAYER_REMOTE_POSITION_BLEND : MULTIPLAYER_LOCAL_POSITION_BLEND;
        let nextPosition = currPosition.add(offset.mul(blend));
        this.node.setPosition(nextPosition);

        if (this._multiplayerRemote && this._multiplayerSyncDir && this._multiplayerSyncDir.magSqr() > 0.0001) {
            this._dir = cc.v2(this._multiplayerSyncDir);
            this._barrelDir = cc.v2(this._multiplayerSyncDir);
        }
    }

    _buildUpgradeChoiceFromStateDelta(prevMaxHp, prevAtk, prevMoveSpeedScale) {
        let hpDelta = this._maxHp - prevMaxHp;
        let atkDelta = this._atk - prevAtk;
        let speedRatioDelta = this._moveSpeedScale - prevMoveSpeedScale;
        let speedDelta = Math.round(speedRatioDelta * 100);
        let bounceCount = this.getCurrentBulletBounceCount();
        let prevBounceCount = this._getBounceCountByEnergyLevel(this._energyLevel - 1);

        if (bounceCount > prevBounceCount) {
            return {
                id: "bounce",
                title: "反弹子弹",
                desc: "碰墙后自动反弹, 反弹后命中伤害翻倍",
                shortLabel: "反",
                valueText: "x" + bounceCount,
                amount: bounceCount,
                color: cc.color(90, 180, 255, 255),
            };
        }

        if (hpDelta > 0) {
            return {
                id: "hp",
                title: "装甲强化",
                desc: "生命上限提升并立刻回满",
                shortLabel: "HP",
                valueText: "+" + hpDelta,
                amount: hpDelta,
                color: cc.color(120, 255, 170, 255),
            };
        }
        if (atkDelta > 0) {
            return {
                id: "atk",
                title: "火力强化",
                desc: "攻击力提升, 输出更高",
                shortLabel: "ATK",
                valueText: "+" + atkDelta,
                amount: atkDelta,
                color: cc.color(255, 185, 90, 255),
            };
        }
        if (speedDelta > 0) {
            return {
                id: "speed",
                title: "推进强化",
                desc: "移动速度提升, 走位更灵活",
                shortLabel: "SPD",
                valueText: "+" + speedDelta + "%",
                amount: speedDelta,
                color: cc.color(110, 210, 255, 255),
            };
        }
        return null;
    }

    _showPlayerHitEffect() {
        let effect = new cc.Node("_playerHitEffect");
        effect.parent = this.node;
        effect.setPosition(0, 0);
        effect.zIndex = 300;

        let graphics = effect.addComponent(cc.Graphics);
        graphics.lineWidth = 8;
        graphics.strokeColor = cc.color(80, 210, 255, 230);
        graphics.circle(0, 0, this._radius + 16);
        graphics.stroke();
        graphics.fillColor = cc.color(70, 170, 255, 55);
        graphics.circle(0, 0, this._radius + 10);
        graphics.fill();

        effect.opacity = 255;
        effect.scale = 0.65;
        effect.runAction(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.18, 1.25),
                cc.fadeTo(0.18, 60)
            ),
            cc.fadeOut(0.1),
            cc.removeSelf()
        ));
    }

    _updateLowHpPlayerFeedback() {
        let shouldAlertLowHp = this._inGame
            && this.isLowHp()
            && (!this._multiplayerMode || !this._multiplayerRemote);
        if (!shouldAlertLowHp) {
            this._stopLowHpPlayerFeedback();
            return;
        }

        this._startLowHpScreenEffect();
        this._startLowHpHeartbeatSound();
    }

    _startLowHpHeartbeatSound() {
        if (this._lowHpHeartbeatEffectId >= 0) {
            return;
        }

        this._lowHpHeartbeatEffectId = MusicManager.playLoopEffect("heartbeat");
    }

    _stopLowHpHeartbeatSound() {
        if (this._lowHpHeartbeatEffectId >= 0) {
            MusicManager.stopEffect(this._lowHpHeartbeatEffectId);
            this._lowHpHeartbeatEffectId = -1;
        }
    }

    _startLowHpScreenEffect() {
        if (this._lowHpScreenEffect && cc.isValid(this._lowHpScreenEffect)) {
            return;
        }

        let effectRoot = new cc.Node("_lowHpScreenEffect");
        let parentNode = this._map && this._map.node && this._map.node.parent ? this._map.node.parent : this.node.parent;
        effectRoot.parent = parentNode;
        effectRoot.setPosition(0, 0);
        effectRoot.zIndex = 1600;
        this._lowHpScreenEffect = effectRoot;

        let borderNode = new cc.Node("_lowHpBorder");
        borderNode.parent = effectRoot;
        borderNode.opacity = 0;

        let createEdge = function(name, x, y, width, height) {
            let edge = new cc.Node(name);
            edge.parent = borderNode;
            edge.setPosition(x, y);
            let graphics = edge.addComponent(cc.Graphics);
            graphics.fillColor = cc.color(255, 60, 60, 255);
            graphics.rect(-width / 2, -height / 2, width, height);
            graphics.fill();
            return edge;
        };

        createEdge("_topEdge", 0, 351, 1280, 18);
        createEdge("_bottomEdge", 0, -351, 1280, 18);
        createEdge("_leftEdge", -631, 0, 18, 720);
        createEdge("_rightEdge", 631, 0, 18, 720);

        let idleTime = Math.max(0, LOW_HP_SCREEN_FLASH_LOOP - LOW_HP_SCREEN_FLASH_IN - LOW_HP_SCREEN_FLASH_OUT);
        borderNode.runAction(
            cc.repeatForever(
                cc.sequence(
                    cc.fadeTo(LOW_HP_SCREEN_FLASH_IN, 210),
                    cc.fadeTo(LOW_HP_SCREEN_FLASH_OUT, 0),
                    cc.delayTime(idleTime)
                )
            )
        );
    }

    _destroyLowHpScreenEffect() {
        if (this._lowHpScreenEffect && cc.isValid(this._lowHpScreenEffect)) {
            this._lowHpScreenEffect.destroy();
        }
        this._lowHpScreenEffect = null;
    }

    _stopLowHpPlayerFeedback() {
        this._stopLowHpHeartbeatSound();
        this._destroyLowHpScreenEffect();
    }

    _updateFreeBulletRecover(dt) {
        if (this._freeBulletCount >= PLAYER_FREE_BULLET_MAX) {
            this._stopFireTime = 0;
            this._freeBulletRecoverTime = 0;
            this._refreshFreeBulletBar();
            return;
        }

        this._stopFireTime += dt;
        if (this._stopFireTime < PLAYER_FREE_BULLET_RECOVER_DELAY) {
            this._freeBulletRecoverTime = 0;
            this._refreshFreeBulletBar();
            return;
        }

        this._freeBulletRecoverTime += dt;
        while (this._freeBulletRecoverTime >= PLAYER_FREE_BULLET_RECOVER_INTERVAL
            && this._freeBulletCount < PLAYER_FREE_BULLET_MAX) {
            this._freeBulletRecoverTime -= PLAYER_FREE_BULLET_RECOVER_INTERVAL;
            this._freeBulletCount++;
        }

        if (this._freeBulletCount >= PLAYER_FREE_BULLET_MAX) {
            this._freeBulletRecoverTime = 0;
        }

        this._refreshFreeBulletBar();
    }

    _refreshFreeBulletBar() {
        let bulletBars = [
            this._fire._zidanbar1,
            this._fire._zidanbar2,
            this._fire._zidanbar3,
        ];
        let recoverProgress = 0;

        if (this._freeBulletCount < PLAYER_FREE_BULLET_MAX
            && this._stopFireTime >= PLAYER_FREE_BULLET_RECOVER_DELAY) {
            recoverProgress = this._freeBulletRecoverTime / PLAYER_FREE_BULLET_RECOVER_INTERVAL;
            if (recoverProgress > 1) {
                recoverProgress = 1;
            }
        }

        bulletBars.forEach((barNode, index) => {
            if (!barNode || !barNode.$ProgressBar) {
                return;
            }

            if (index < this._freeBulletCount) {
                barNode.$ProgressBar.progress = 1;
            }
            else if (index == this._freeBulletCount && recoverProgress > 0) {
                barNode.$ProgressBar.progress = recoverProgress;
            }
            else{
                barNode.$ProgressBar.progress = 0;
            }
        });
    }

    //射击
    shooting(dt){
        let judgeCD = this._skill2Time > 0 ? this._config.BulletCodeTime/4 : this._config.BulletCodeTime;

        this._bulletCodeTime += dt;
        if (this._bulletCodeTime >= judgeCD) {
            this._bulletCodeTime = 0;

            this.fireOnce();
        }
    }
    
    //执行死亡
    doDeath(){
        if (this._map && this._map.forceDetachCoverTestFromPlayer) {
            this._map.forceDetachCoverTestFromPlayer(this);
        }
        this._stopLowHpPlayerFeedback();
        this._stopMoveEffect();
        this._oilShellCount = 0;
        this._activePickupType = "";
        this._cancelOilShellPreview();
        this._refreshSkillButtonMode();
        super.doDeath();
        if (this._multiplayerMode) {
            yyp.eventCenter.emit("multiplayer-player-death", {
                playerId: this._multiplayerPlayerId,
                isLocal: !this._multiplayerRemote
            });
        }
        else{
            yyp.eventCenter.emit("player-death",{});
        }
        this.node.destroy(); 
        // 爆炸效果
        // 显示结束界面
    }

    debugSetLowHp() {
        let hp = Math.max(1, Math.floor(this._maxHp * 0.12));
        if (hp >= this._maxHp) {
            hp = Math.max(1, this._maxHp - 1);
        }
        this._hp = hp;
        this.refreshHp();
    }

    setInGame(){
        this._inGame = true;
        this._fire._lifebar.active = true;
        this._refreshSkillButtonMode();
        this._refreshBushVisibilityState();
    }
    
    //获取碰撞框
    getPlayerBoundingBox(){
        return Utils.getWorldBoundingBox(this._currentBg);
    }

    setViewMode(){
        this._viewMode = true;
    }

}
