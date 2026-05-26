import {BaseComponent} from "./base/BaseComponent";
import {Utils} from "./base/Utils";

const {ccclass} = cc._decorator;

@ccclass
export class OilPickup extends BaseComponent {

    _lifeTime = 12;
    _floatBaseY = 0;
    _floatTime = 0;
    _pickupType = "oil";

    onLoad() {
        this._buildView();
    }

    _buildView() {
        this.node.removeAllChildren();
        this.node.setContentSize(92, 92);
        let config = this._getPickupConfig();

        let outer = new cc.Node("_oilPickupOuter");
        outer.parent = this.node;
        let outerGraphics = outer.addComponent(cc.Graphics);
        outerGraphics.fillColor = config.outerColor;
        outerGraphics.circle(0, 0, 44);
        outerGraphics.fill();
        outerGraphics.lineWidth = 4;
        outerGraphics.strokeColor = config.ringColor;
        outerGraphics.circle(0, 0, 40);
        outerGraphics.stroke();

        let core = new cc.Node("_oilPickupCore");
        core.parent = this.node;
        let coreGraphics = core.addComponent(cc.Graphics);
        coreGraphics.fillColor = config.coreColor;
        coreGraphics.circle(0, 0, 28);
        coreGraphics.fill();

        let labelNode = new cc.Node("_oilPickupLabel");
        labelNode.parent = this.node;
        labelNode.setContentSize(84, 30);
        labelNode.setPosition(0, 0);
        labelNode.color = config.labelColor;
        let label = labelNode.addComponent(cc.Label);
        label.string = config.title;
        label.fontSize = 20;
        label.lineHeight = 24;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;

        let tipNode = new cc.Node("_oilPickupTip");
        tipNode.parent = this.node;
        tipNode.setContentSize(120, 24);
        tipNode.setPosition(0, -56);
        tipNode.color = config.tipColor;
        let tip = tipNode.addComponent(cc.Label);
        tip.string = config.tip;
        tip.fontSize = 16;
        tip.lineHeight = 20;
        tip.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        tip.verticalAlign = cc.Label.VerticalAlign.CENTER;

        this._floatBaseY = this.node.y;
    }

    _getPickupConfig() {
        if (this._pickupType == "blackHole") {
            return {
                title: "黑洞",
                tip: "拾取黑洞弹",
                outerColor: cc.color(28, 18, 58, 235),
                ringColor: cc.color(188, 126, 255, 220),
                coreColor: cc.color(6, 6, 14, 245),
                labelColor: cc.color(225, 204, 255, 255),
                tipColor: cc.color(214, 198, 245, 210),
                skillId: 5,
            };
        }
        if (this._pickupType == "portal") {
            return {
                title: "传送",
                tip: "拾取传送门",
                outerColor: cc.color(34, 70, 132, 235),
                ringColor: cc.color(90, 215, 255, 220),
                coreColor: cc.color(255, 120, 220, 220),
                labelColor: cc.color(230, 245, 255, 255),
                tipColor: cc.color(200, 228, 255, 210),
                skillId: 6,
            };
        }
        if (this._pickupType == "speedDouble") {
            return {
                title: "加速",
                tip: "拾取加速区",
                outerColor: cc.color(24, 72, 160, 235),
                ringColor: cc.color(110, 210, 255, 220),
                coreColor: cc.color(40, 140, 255, 240),
                labelColor: cc.color(228, 245, 255, 255),
                tipColor: cc.color(200, 228, 255, 210),
                skillId: 7,
            };
        }
        if (this._pickupType == "damageDouble") {
            return {
                title: "增伤",
                tip: "拾取增伤区",
                outerColor: cc.color(122, 34, 30, 235),
                ringColor: cc.color(255, 120, 95, 220),
                coreColor: cc.color(255, 78, 48, 240),
                labelColor: cc.color(255, 236, 228, 255),
                tipColor: cc.color(255, 220, 210, 210),
                skillId: 8,
            };
        }
        return {
            title: "焦油",
            tip: "拾取焦油弹",
            outerColor: cc.color(60, 42, 28, 235),
            ringColor: cc.color(255, 208, 122, 220),
            coreColor: cc.color(30, 20, 16, 245),
            labelColor: cc.color(255, 227, 164, 255),
            tipColor: cc.color(220, 220, 220, 210),
            skillId: 4,
        };
    }

    update(dt) {
        this._floatTime += dt;
        this.node.y = this._floatBaseY + Math.sin(this._floatTime * 2.8) * 6;

        let lifeProgress = this._lifeTime > 0 ? Math.min(1, this._floatTime / this._lifeTime) : 0;
        if (lifeProgress > 0.78) {
            let blink = Math.sin(this._floatTime * 16);
            this.node.opacity = blink > 0 ? 255 : 110;
        }
        else{
            this.node.opacity = 255;
        }

        if (this._floatTime >= this._lifeTime) {
            this.node.destroy();
        }
    }

    emitSkill() {
        let config = this._getPickupConfig();
        yyp.eventCenter.emit("trigger-skill", {skillId: config.skillId});
    }

    getSkillBoundingBox() {
        return Utils.getWorldBoundingBox(this.node, 0.85);
    }

    getPickupType() {
        return this._pickupType;
    }

    setPickupType(type = "oil") {
        let nextType = "oil";
        if (type == "tar" || type == "oil") {
            nextType = "oil";
        }
        else if (type == "blackHole" || type == "portal" || type == "speedDouble" || type == "damageDouble") {
            nextType = type;
        }
        this._pickupType = nextType;
        if (this.node && cc.isValid(this.node)) {
            this._buildView();
        }
    }

    setInGame(lifeTime = 12) {
        this._lifeTime = lifeTime;
        this._floatTime = 0;
        this._floatBaseY = this.node.y;
    }
}
