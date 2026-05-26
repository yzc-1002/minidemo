import {BaseComponent} from "./base/BaseComponent";
import {Utils} from "./base/Utils";

const {ccclass, property} = cc._decorator;

@ccclass
export class JoyStick extends BaseComponent {

    _moveDir = cc.v2(0, 1);         //移动摇杆方向(向上)
    _shootDir = cc.v2(1, 0);        //射击摇杆方向
    _moveTouchPos = cc.v2(0, 0);    //移动摇杆初始位置
    _shootTouchPos = cc.v2(0, 0);   //射击摇杆初始位置
    _skillTouchPos = cc.v2(0, 0);   //焦油按钮拖拽初始位置
    _free = true;                   //自由移动摇杆位置
    _moveTouchId = null;
    _shootTouchId = null;
    _skillTouchId = null;
    _sacrificeTouchId = null;
    _coverTouchId = null;
    _sacrificeEnabled = false;
    _coverButtonVisible = false;
    _coverButtonMode = "attach";
    _skillMode = "charge";
    _oilAimDir = cc.v2(1, 0);
    _chargeProgressValue = 0;
    _chargeProgressColor = cc.color(255, 90, 55, 255);

    onLoad () {
        this._moveTouchPos = this._fire._sprBg.position.clone();
        this._shootTouchPos = this._fire._sprBg02.position.clone();
        let oilBtn = this._fire._skilloilBtn || this._fire._skillBtn;
        this._skillTouchPos = oilBtn ? oilBtn.position.clone() : cc.v2(0, 0);
        this._initSkillButton();
        this._setSkillButtonMode("charge");
        this._initSacrificeButton();
        this._initCoverButton();
        yyp.eventCenter.on("charge-cannon-progress", this._onChargeProgress, this);
        yyp.eventCenter.on("charge-cannon-cooldown", this._onChargeCooldown, this);
        yyp.eventCenter.on("charge-cannon-ready", this._onChargeReady, this);
        yyp.eventCenter.on("charge-cannon-clear", this._onChargeClear, this);
        yyp.eventCenter.on("skill-button-mode", this._onSkillButtonMode, this);
        yyp.eventCenter.on("sacrifice-button-visible", this._onSacrificeButtonVisible, this);
        yyp.eventCenter.on("cover-button-state", this._onCoverButtonState, this);
        this.node.on(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
        yyp.eventCenter.off("charge-cannon-progress", this._onChargeProgress, this);
        yyp.eventCenter.off("charge-cannon-cooldown", this._onChargeCooldown, this);
        yyp.eventCenter.off("charge-cannon-ready", this._onChargeReady, this);
        yyp.eventCenter.off("charge-cannon-clear", this._onChargeClear, this);
        yyp.eventCenter.off("skill-button-mode", this._onSkillButtonMode, this);
        yyp.eventCenter.off("sacrifice-button-visible", this._onSacrificeButtonVisible, this);
        yyp.eventCenter.off("cover-button-state", this._onCoverButtonState, this);
    }

    _onTouchStart(event) {
        let pos = this.node.convertToNodeSpaceAR(event.getLocation());
        let touchId = event.getID();
        let controlType = this._getControlType(pos);
        if (controlType == "skill" && this._skillTouchId == null) {
            this._skillTouchId = touchId;
            if (this._isDragSkillMode()) {
                this._updateSkillDrag(pos, true);
                if (this._skillMode == "charge") {
                    yyp.eventCenter.emit("charge-cannon-press", { pressed: true });
                }
                else{
                    yyp.eventCenter.emit("oil-shell-trigger", { pressed: true });
                }
            }
            return;
        }
        if (controlType == "sacrifice" && this._sacrificeEnabled && this._sacrificeTouchId == null) {
            this._sacrificeTouchId = touchId;
            this._setSacrificeButtonPressed(true);
            return;
        }
        if (controlType == "cover" && this._coverButtonVisible && this._coverTouchId == null) {
            this._coverTouchId = touchId;
            this._setCoverButtonPressed(true);
            return;
        }

        if (controlType == "move" && this._moveTouchId == null) {
            this._moveTouchId = touchId;
            this._updateMoveStick(pos, true);
            return;
        }
        if (controlType == "shoot" && this._shootTouchId == null) {
            this._shootTouchId = touchId;
            this._pressShootButton(pos);
            return;
        }

        if (this._isLeftHalfControlArea(pos) && this._moveTouchId == null) {
            this._moveTouchId = touchId;
            this._updateMoveStick(pos, true);
        }
        else if (!this._isLeftHalfControlArea(pos) && this._shootTouchId == null) {
            this._shootTouchId = touchId;
            this._pressShootButton(pos);
        }
    }

    _onTouchMove(event) {
        let pos = this.node.convertToNodeSpaceAR(event.getLocation());
        let touchId = event.getID();
        if (touchId == this._moveTouchId) {
            this._updateMoveStick(pos, false);
        }
        else if (touchId == this._shootTouchId) {
            this._updateShootStick(pos);
        }
        else if (touchId == this._skillTouchId && this._isDragSkillMode()) {
            this._updateSkillDrag(pos, false);
            if (this._skillMode == "charge") {
                yyp.eventCenter.emit("charge-cannon-press", {
                    aiming: true,
                    dir: cc.v2(this._oilAimDir),
                    ratio: this._getCurrentSkillDragRatio(pos),
                });
            }
        }
    }

    _onTouchEnd(event) {
        let touchId = event.getID();
        if (touchId == this._moveTouchId) {
            this._moveTouchId = null;
            this._resetMoveStick();
            yyp.eventCenter.emit("joy-stick",{dir:this._moveDir, ratio:0});
        }
        else if (touchId == this._shootTouchId) {
            this._shootTouchId = null;
            this._resetShootStick();
            yyp.eventCenter.emit("joy-stick-shoot",{fire:true});
        }
        else if (touchId == this._skillTouchId) {
            this._skillTouchId = null;
            this._resetSkillButtonPosition();
            if (this._skillMode != "charge") {
                yyp.eventCenter.emit("oil-shell-trigger", { pressed: false, release: true });
            }
            else if (this._skillMode == "charge") {
                yyp.eventCenter.emit("charge-cannon-release", { release: true });
            }
        }
        else if (touchId == this._sacrificeTouchId) {
            this._sacrificeTouchId = null;
            this._setSacrificeButtonPressed(false);
            yyp.eventCenter.emit("trigger-sacrifice", {});
        }
        else if (touchId == this._coverTouchId) {
            this._coverTouchId = null;
            this._setCoverButtonPressed(false);
            yyp.eventCenter.emit("trigger-cover-action", {});
        }
    }

    update (dt) {
        let moveRatio = this._limitStickRange(this._fire._sprBg, this._fire._sprJoystick, this._moveTouchPos, this._moveDir);
        if (moveRatio > 0) {
            yyp.eventCenter.emit("joy-stick",{dir:this._moveDir, ratio:moveRatio});
        }
        let shootRatio = this._limitStickRange(this._fire._sprBg02, this._fire._sprJoystick02, this._shootTouchPos, this._shootDir);
        if (this._shootTouchId != null && shootRatio > 0 && this._shootDir.magSqr() > 0) {
            yyp.eventCenter.emit("joy-stick-shoot",{dir:this._shootDir, ratio:shootRatio});
        }
    }

    onDisable(){
        this._moveTouchId = null;
        this._shootTouchId = null;
        this._skillTouchId = null;
        this._sacrificeTouchId = null;
        this._coverTouchId = null;
        this._resetMoveStick();
        this._resetShootStick();
        this._resetSkillButtonPosition();
        this._refreshChargeProgress(this._chargeProgressValue, this._chargeProgressColor);
        this._setSacrificeButtonPressed(false);
        this._setCoverButtonPressed(false);
        if (this._skillMode != "charge") {
            yyp.eventCenter.emit("oil-shell-trigger", { pressed: false, cancelled: true });
        }
        yyp.eventCenter.emit("joy-stick",{dir:this._moveDir, ratio:0});
    }

    _getCurrentSkillButton() {
        if (this._skillMode != "charge" && this._fire._skilloilBtn) {
            return this._fire._skilloilBtn;
        }
        return this._fire._skillBtn;
    }

    _getControlType(pos) {
        if (this._sacrificeEnabled && this._fire._sacrificeBtn && this._fire._sacrificeBtn.active) {
            let sacrificeDistance = pos.sub(this._fire._sacrificeBtn.position).mag();
            if (sacrificeDistance <= this._fire._sacrificeBtn.width / 2) {
                return "sacrifice";
            }
        }
        if (this._coverButtonVisible && this._fire._fenli_xifu && this._fire._fenli_xifu.active) {
            let coverDistance = pos.sub(this._fire._fenli_xifu.position).mag();
            if (coverDistance <= this._fire._fenli_xifu.width / 2) {
                return "cover";
            }
        }
        let skillBtn = this._getCurrentSkillButton();
        if (skillBtn && skillBtn.active) {
            let skillDistance = pos.sub(skillBtn.position).mag();
            if (skillDistance <= skillBtn.width / 2) {
                return "skill";
            }
        }

        return this._isLeftHalfControlArea(pos) ? "move" : "shoot";
    }

    _isLeftHalfControlArea(pos) {
        return pos.x <= 0;
    }

    _updateMoveStick(pos, isStart) {
        this._fire._sprJoystick.setPosition(pos);
        if (isStart && this._free) {
            this._fire._sprBg.setPosition(pos);
            this._moveTouchPos = pos;
        }

        this._moveDir = pos.sub(this._moveTouchPos);
        if (this._moveDir.magSqr() > 0) {
            this._moveDir = this._moveDir.normalize();
        }
    }

    _pressShootButton(pos) {
        if (pos) {
            this._updateShootStick(pos);
            return;
        }
        this._fire._sprJoystick02.setPosition(this._shootTouchPos);
    }

    _updateShootStick(pos) {
        this._fire._sprJoystick02.setPosition(pos);
        this._shootDir = pos.sub(this._shootTouchPos);
        if (this._shootDir.magSqr() > 0) {
            this._shootDir = this._shootDir.normalize();
        }

        let shootRatio = this._limitStickRange(this._fire._sprBg02, this._fire._sprJoystick02, this._shootTouchPos, this._shootDir);
        if (shootRatio > 0) {
            yyp.eventCenter.emit("joy-stick-shoot",{dir:this._shootDir, ratio:shootRatio});
        }
    }

    _resetMoveStick() {
        this._fire._sprJoystick.setPosition(this._moveTouchPos);
    }

    _resetShootStick() {
        this._fire._sprJoystick02.setPosition(this._shootTouchPos);
    }

    _resetSkillButtonPosition() {
        let skillBtn = this._getCurrentSkillButton();
        if (!skillBtn) {
            return;
        }
        skillBtn.setPosition(this._skillTouchPos);
    }

    _isDragSkillMode() {
        return true;
    }

    _getSkillDragMaxLen(skillBtn) {
        return Math.max(skillBtn.width * 0.95, 56);
    }

    _getCurrentSkillDragRatio(pos) {
        let skillBtn = this._getCurrentSkillButton();
        if (!skillBtn) {
            return 0;
        }
        let delta = pos.sub(this._skillTouchPos);
        let maxLen = this._getSkillDragMaxLen(skillBtn);
        if (maxLen <= 0) {
            return 0;
        }
        return Math.max(0, Math.min(1, delta.mag() / maxLen));
    }

    _updateSkillDrag(pos, isStart) {
        let skillBtn = this._getCurrentSkillButton();
        if (!skillBtn) {
            return;
        }
        if (isStart) {
            this._skillTouchPos = skillBtn.position.clone();
        }
        let delta = pos.sub(this._skillTouchPos);
        let len = delta.mag();
        if (len > 0.001) {
            this._oilAimDir = delta.normalize();
        }
        let maxLen = this._getSkillDragMaxLen(skillBtn);
        let ratio = maxLen > 0 ? len / maxLen : 0;
        if (ratio > 1) {
            ratio = 1;
            delta = this._oilAimDir.mul(maxLen);
        }
        skillBtn.setPosition(this._skillTouchPos.add(delta));
        if (this._skillMode != "charge") {
            yyp.eventCenter.emit("oil-shell-trigger", {
                aiming: true,
                dir: cc.v2(this._oilAimDir),
                ratio: ratio,
            });
        }
    }

    _limitStickRange(bgNode, joystickNode, touchPos, dir) {
        // 限定摇杆在范围内移动
        let len = joystickNode.position.sub(touchPos).mag();   // 返回向量的长度
        let maxLen = bgNode.width / 2;                         // 获取最大可移动距离
        let ratio = maxLen > 0 ? len / maxLen : 0;             // 当前位置和最大可移动距离比率

        // 比率大于1,说明已经超出最大可移动距离了
        if (len > maxLen) {
            joystickNode.setPosition(touchPos.add(dir.mul(maxLen)));
            ratio = 1;
        }

        return ratio;
    }

    _initSkillButton() {
        if (!this._fire._skillBtn) {
            return;
        }

        let bgNode = new cc.Node("_chargeProgressBg");
        bgNode.parent = this._fire._skillBtn;
        bgNode.zIndex = 9;
        let bgGraphics = bgNode.addComponent(cc.Graphics);
        let bgRadius = this._fire._skillBtn.width / 2 - 8;
        bgGraphics.lineWidth = 6;
        bgGraphics.strokeColor = cc.color(70, 70, 70, 180);
        bgGraphics.circle(0, 0, bgRadius);
        bgGraphics.stroke();
        this._fire._chargeProgressBg = bgNode;

        let progressNode = new cc.Node("_chargeProgress");
        progressNode.parent = this._fire._skillBtn;
        progressNode.zIndex = 10;
        progressNode.setContentSize(this._fire._skillBtn.getContentSize());
        let graphics = progressNode.addComponent(cc.Graphics);
        progressNode["$Graphics"] = graphics;
        this._fire._chargeProgress = progressNode;
        this._refreshChargeProgress(0);
    }

    _setSkillButtonMode(mode) {
        let nextMode = "charge";
        if (mode == "oil" || mode == "blackHole" || mode == "portal" || mode == "speedDouble" || mode == "damageDouble") {
            nextMode = mode;
        }
        let prevMode = this._skillMode;
        this._skillMode = nextMode;
        if (prevMode != this._skillMode) {
            this._skillTouchId = null;
            this._resetSkillButtonPosition();
        }
        if (this._fire._skillBtn) {
            this._fire._skillBtn.active = this._skillMode == "charge";
        }
        if (this._fire._skilloilBtn) {
            this._fire._skilloilBtn.active = this._skillMode != "charge";
            if (this._skillMode == "blackHole") {
                this._fire._skilloilBtn.color = cc.color(166, 120, 255, 255);
            }
            else if (this._skillMode == "portal") {
                this._fire._skilloilBtn.color = cc.color(120, 220, 255, 255);
            }
            else if (this._skillMode == "speedDouble") {
                this._fire._skilloilBtn.color = cc.color(110, 210, 255, 255);
            }
            else if (this._skillMode == "damageDouble") {
                this._fire._skilloilBtn.color = cc.color(255, 140, 100, 255);
            }
            else{
                this._fire._skilloilBtn.color = cc.color(255, 255, 255, 255);
            }
        }
        let skillBtn = this._getCurrentSkillButton();
        if (skillBtn && this._skillTouchId == null) {
            this._skillTouchPos = skillBtn.position.clone();
        }
        if (this._fire._chargeProgressBg) {
            this._fire._chargeProgressBg.active = this._skillMode == "charge";
        }
        if (this._fire._chargeProgress) {
            this._fire._chargeProgress.active = this._skillMode == "charge";
        }
        this._refreshChargeProgress(this._chargeProgressValue, this._chargeProgressColor);
    }

    _initSacrificeButton() {
        if (!this._fire._skillBtn || this._fire._sacrificeBtn) {
            return;
        }

        let btn = new cc.Node("_sacrificeBtn");
        btn.parent = this.node;
        btn.zIndex = this._fire._skillBtn.zIndex || 0;
        btn.setContentSize(this._fire._skillBtn.getContentSize());
        btn.setPosition(this._fire._skillBtn.position.add(cc.v3(0, 118, 0)));
        this._fire._sacrificeBtn = btn;

        let outer = btn.addComponent(cc.Graphics);
        btn["$Graphics"] = outer;

        let inner = new cc.Node("_sacrificeInner");
        inner.parent = btn;
        let innerGraphics = inner.addComponent(cc.Graphics);
        inner["$Graphics"] = innerGraphics;
        btn["$Inner"] = inner;

        let labelNode = new cc.Node("_sacrificeLabel");
        labelNode.parent = btn;
        labelNode.setContentSize(btn.width - 12, btn.height - 12);
        let label = labelNode.addComponent(cc.Label);
        label.string = "祭";
        label.fontSize = 34;
        label.lineHeight = 38;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        labelNode.color = cc.color(255, 245, 232, 255);
        btn["$LabelNode"] = labelNode;

        let tipNode = new cc.Node("_sacrificeTip");
        tipNode.parent = btn;
        tipNode.setPosition(0, -58);
        tipNode.setContentSize(120, 28);
        let tipLabel = tipNode.addComponent(cc.Label);
        tipLabel.string = "献祭";
        tipLabel.fontSize = 18;
        tipLabel.lineHeight = 22;
        tipLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        tipLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
        tipNode.color = cc.color(255, 184, 160, 235);

        this._setSacrificeButtonPressed(false);
        this._setSacrificeButtonVisible(false);
    }

    _initCoverButton() {
        if (!this._fire._fenli_xifu) {
            return;
        }

        this._fire._fenli_xifu.opacity = 255;
        this._fire._fenli_xifu.scale = 1;
        this._setCoverButtonMode("attach");
        this._setCoverButtonVisible(false);
    }

    _setSacrificeButtonPressed(pressed) {
        if (!this._fire._sacrificeBtn || !this._fire._sacrificeBtn.$Graphics) {
            return;
        }

        let btn = this._fire._sacrificeBtn;
        let graphics = btn.$Graphics;
        let radius = btn.width / 2;
        graphics.clear();
        graphics.fillColor = pressed ? cc.color(135, 20, 35, 245) : cc.color(95, 22, 30, 230);
        graphics.circle(0, 0, radius);
        graphics.fill();
        graphics.lineWidth = 6;
        graphics.strokeColor = pressed ? cc.color(255, 190, 175, 255) : cc.color(255, 126, 108, 255);
        graphics.circle(0, 0, radius - 3);
        graphics.stroke();

        if (btn.$Inner && btn.$Inner.$Graphics) {
            let innerGraphics = btn.$Inner.$Graphics;
            innerGraphics.clear();
            innerGraphics.fillColor = pressed ? cc.color(255, 106, 92, 255) : cc.color(220, 72, 66, 245);
            innerGraphics.circle(0, 0, radius - 13);
            innerGraphics.fill();
        }

        if (btn.$LabelNode) {
            btn.$LabelNode.scale = pressed ? 0.94 : 1;
        }
        btn.scale = pressed ? 0.96 : 1;
    }

    _setSacrificeButtonVisible(visible) {
        this._sacrificeEnabled = !!visible;
        if (!this._fire._sacrificeBtn) {
            return;
        }

        this._fire._sacrificeBtn.active = this._sacrificeEnabled;
        if (!this._sacrificeEnabled) {
            this._sacrificeTouchId = null;
            this._setSacrificeButtonPressed(false);
        }
    }

    _setCoverButtonPressed(pressed) {
        if (!this._fire._fenli_xifu) {
            return;
        }
        this._fire._fenli_xifu.scale = pressed ? 0.94 : 1;
        this._fire._fenli_xifu.opacity = pressed ? 215 : 255;
    }

    _setCoverButtonMode(mode) {
        this._coverButtonMode = mode == "detach" ? "detach" : "attach";
        if (this._fire._btnLabel && this._fire._btnLabel.$Label) {
            this._fire._btnLabel.$Label.string = this._coverButtonMode == "detach" ? "分离" : "吸附";
        }
    }

    _setCoverButtonVisible(visible) {
        this._coverButtonVisible = !!visible;
        if (!this._fire._fenli_xifu) {
            return;
        }

        this._fire._fenli_xifu.active = this._coverButtonVisible;
        if (!this._coverButtonVisible) {
            this._coverTouchId = null;
            this._setCoverButtonPressed(false);
        }
    }

    _onSacrificeButtonVisible(event) {
        this._setSacrificeButtonVisible(event && event.visible === true);
    }

    _onCoverButtonState(event) {
        this._setCoverButtonMode(event && event.mode ? event.mode : "attach");
        this._setCoverButtonVisible(event && event.visible === true);
    }

    _refreshChargeProgress(progress, color = cc.color(255, 90, 55, 255)) {
        this._chargeProgressValue = progress || 0;
        this._chargeProgressColor = color;
        if (!this._fire._chargeProgress || !this._fire._chargeProgress.$Graphics) {
            return;
        }
        if (this._skillMode != "charge") {
            this._fire._chargeProgress.$Graphics.clear();
            return;
        }

        let graphics = this._fire._chargeProgress.$Graphics;
        let radius = this._fire._skillBtn.width / 2 - 6;
        graphics.clear();
        if (this._chargeProgressValue <= 0) {
            return;
        }

        graphics.lineWidth = 8;
        graphics.strokeColor = color;
        graphics.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this._chargeProgressValue, false);
        graphics.stroke();

        graphics.lineWidth = 3;
        graphics.strokeColor = cc.color(255, 220, 200, 180);
        graphics.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this._chargeProgressValue, false);
        graphics.stroke();
    }

    _onSkillButtonMode(event) {
        this._setSkillButtonMode(event && event.mode ? event.mode : "charge");
    }

    _onChargeProgress(event) {
        this._refreshChargeProgress(event.progress || 0, cc.color(255, 90, 55, 255));
    }

    _onChargeCooldown(event) {
        this._refreshChargeProgress(event.progress || 0, cc.color(120, 160, 255, 220));
    }

    _onChargeReady() {
        this._refreshChargeProgress(1, cc.color(255, 40, 25, 255));
    }

    _onChargeClear() {
        this._refreshChargeProgress(0);
    }
}
