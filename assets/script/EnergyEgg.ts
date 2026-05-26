import {BaseComponent} from "./base/BaseComponent";
import {Utils} from "./base/Utils";

const {ccclass} = cc._decorator;

@ccclass
export class EnergyEgg extends BaseComponent {

    _lifeTime = 10;
    _remainTime = 10;
    _radius = 34;
    _autoMature = true;
    _mature = false;
    _matureCallback = null;
    _shellSprite = null;
    _shellFallback = null;
    _glowNode = null;
    _countdownLabel = null;
    _statusLabel = null;
    _hiddenInBush = false;

    onLoad() {
        this._initUI();
        this._refreshState();
    }

    _initUI() {
        this.node.setContentSize(92, 110);
        if (this.node.childrenCount > 0) {
            return;
        }

        let shadow = new cc.Node("_eggShadow");
        shadow.parent = this.node;
        shadow.setPosition(0, -18);
        let shadowGraphics = shadow.addComponent(cc.Graphics);
        shadowGraphics.fillColor = cc.color(0, 0, 0, 72);
        shadowGraphics.ellipse(0, 0, 30, 12);
        shadowGraphics.fill();

        this._glowNode = new cc.Node("_eggGlow");
        this._glowNode.parent = this.node;
        this._glowNode.opacity = 110;
        let glowGraphics = this._glowNode.addComponent(cc.Graphics);
        glowGraphics.fillColor = cc.color(120, 255, 168, 110);
        glowGraphics.circle(0, -2, 34);
        glowGraphics.fill();

        let spriteNode = new cc.Node("_eggShell");
        spriteNode.parent = this.node;
        spriteNode.setContentSize(80, 88);
        spriteNode.setPosition(0, 4);
        this._shellSprite = spriteNode.addComponent(cc.Sprite);
        this._shellSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;

        this._shellFallback = new cc.Node("_eggFallback");
        this._shellFallback.parent = spriteNode;
        let shellGraphics = this._shellFallback.addComponent(cc.Graphics);
        shellGraphics.fillColor = cc.color(120, 214, 125, 255);
        shellGraphics.strokeColor = cc.color(52, 112, 64, 255);
        shellGraphics.lineWidth = 4;
        shellGraphics.ellipse(0, 0, 28, 34);
        shellGraphics.fill();
        shellGraphics.stroke();
        shellGraphics.fillColor = cc.color(240, 255, 204, 150);
        shellGraphics.circle(-8, 10, 7);
        shellGraphics.fill();

        let timerNode = new cc.Node("_eggCountdown");
        timerNode.parent = this.node;
        timerNode.setPosition(0, 56);
        timerNode.color = cc.color(255, 251, 228, 255);
        this._countdownLabel = timerNode.addComponent(cc.Label);
        this._countdownLabel.fontSize = 22;
        this._countdownLabel.lineHeight = 24;
        this._countdownLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        this._countdownLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;

        let statusNode = new cc.Node("_eggStatus");
        statusNode.parent = this.node;
        statusNode.setPosition(0, -48);
        statusNode.color = cc.color(205, 246, 205, 255);
        this._statusLabel = statusNode.addComponent(cc.Label);
        this._statusLabel.fontSize = 18;
        this._statusLabel.lineHeight = 20;
        this._statusLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        this._statusLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
    }

    init(options: any = {}) {
        this._lifeTime = options.lifeTime == null ? 10 : options.lifeTime;
        this._remainTime = this._lifeTime;
        this._radius = options.radius == null ? 34 : options.radius;
        this._autoMature = options.autoMature === false ? false : true;
        this._mature = false;
        this._hiddenInBush = false;
        this._matureCallback = options.onMature || null;
        this._refreshState();
    }

    setSpriteFrame(spriteFrame) {
        if (!this._shellSprite) {
            return;
        }
        this._shellSprite.spriteFrame = spriteFrame || null;
        if (this._shellFallback) {
            this._shellFallback.active = !spriteFrame;
        }
    }

    setMatureCallback(callback) {
        this._matureCallback = callback;
    }

    setHiddenInBush(hidden) {
        this._hiddenInBush = !!hidden;
        this._refreshState();
    }

    isMature() {
        return this._mature;
    }

    getRadius() {
        return this._radius;
    }

    getBoundingBox() {
        return Utils.getWorldBoundingBox(this.node, 0.88);
    }

    update(dt) {
        if (this._mature) {
            return;
        }

        this._remainTime -= dt;
        if (this._remainTime <= 0) {
            this._remainTime = 0;
            if (this._autoMature) {
                this._becomeMature();
                return;
            }
        }

        this._refreshCountdown();
    }

    forceMature() {
        this._remainTime = 0;
        this._becomeMature();
    }

    _becomeMature() {
        if (this._mature) {
            return;
        }

        this._mature = true;
        this._refreshState();
        this._playMatureEffect();
        if (this._matureCallback) {
            this._matureCallback(this);
        }
    }

    _playMatureEffect() {
        let pulse = new cc.Node("_eggPulse");
        pulse.parent = this.node;
        pulse.opacity = 185;
        pulse.scale = 0.45;
        let graphics = pulse.addComponent(cc.Graphics);
        graphics.lineWidth = 5;
        graphics.strokeColor = cc.color(140, 255, 180, 220);
        graphics.circle(0, 0, 34);
        graphics.stroke();
        pulse.runAction(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.28, 1.45),
                cc.fadeOut(0.28)
            ),
            cc.removeSelf()
        ));
    }

    _refreshState() {
        this.node.opacity = this._hiddenInBush ? 55 : 255;
        this.node.scale = this._mature ? 1.06 : 1;
        if (this._glowNode) {
            this._glowNode.opacity = this._mature ? 180 : (this._hiddenInBush ? 60 : 110);
            this._glowNode.scale = this._mature ? 1.18 : 1;
        }
        if (this._statusLabel) {
            this._statusLabel.string = this._hiddenInBush ? "已藏进草丛" : (this._mature ? "成熟爆能中" : "等待成熟");
            this._statusLabel.node.color = this._mature
                ? cc.color(255, 243, 153, 255)
                : cc.color(205, 246, 205, 255);
        }
        this._refreshCountdown();
    }

    _refreshCountdown() {
        if (!this._countdownLabel) {
            return;
        }

        if (this._mature) {
            this._countdownLabel.string = "成熟";
            this._countdownLabel.node.color = cc.color(255, 242, 160, 255);
            return;
        }

        this._countdownLabel.string = Math.max(0, Math.ceil(this._remainTime)) + "s";
        this._countdownLabel.node.color = this._hiddenInBush
            ? cc.color(204, 245, 204, 255)
            : cc.color(255, 251, 228, 255);
    }
}
