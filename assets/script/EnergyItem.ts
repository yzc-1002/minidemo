import {BaseComponent} from "./base/BaseComponent";
import {Utils} from "./base/Utils";

const {ccclass, property} = cc._decorator;

@ccclass
export class EnergyItem extends BaseComponent {

    _value = 10;       //能量值
    _lifeTime = 12;    //存在时间
    _time = 0;

    onLoad () {
        this._initUI();
    }

    _initUI() {
        this.node.setContentSize(42, 42);
        if (this.node.children.length > 0) {
            return;
        }

        let bg = new cc.Node("_spEnergy");
        bg.parent = this.node;
        bg.setContentSize(42, 42);

        let graphics = bg.addComponent(cc.Graphics);
        graphics.lineWidth = 3;
        graphics.strokeColor = cc.color(88, 255, 135, 255);
        graphics.fillColor = cc.color(35, 220, 120, 210);
        graphics.circle(0, 0, 17);
        graphics.fill();
        graphics.stroke();

        let core = new cc.Node("_spCore");
        core.parent = this.node;
        core.setContentSize(18, 18);

        let coreGraphics = core.addComponent(cc.Graphics);
        coreGraphics.fillColor = cc.color(255, 255, 255, 245);
        coreGraphics.circle(0, 0, 7);
        coreGraphics.fill();

        this.node.runAction(cc.repeatForever(cc.sequence(
            cc.scaleTo(0.45, 1.12),
            cc.scaleTo(0.45, 1)
        )));
    }

    init(value, lifeTime) {
        this._value = value;
        this._lifeTime = lifeTime;
    }

    update(dt) {
        this._time += dt;
        if (this._time >= this._lifeTime) {
            this.node.destroy();
        }
    }

    getValue() {
        return this._value;
    }

    getEnergyBoundingBox() {
        return Utils.getWorldBoundingBox(this.node, 0.85);
    }
}
