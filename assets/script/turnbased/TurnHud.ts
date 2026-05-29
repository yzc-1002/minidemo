import { TurnCamp, TurnUpgradeConfig, TurnUpgradeId } from "../config/TurnGame";
import { TurnStateSnapshot } from "./TurnStateMachine";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TurnHud extends cc.Component {
    @property(cc.Label)
    phaseLabel: cc.Label = null;

    @property(cc.Label)
    timerLabel: cc.Label = null;

    @property(cc.Label)
    crystalLabel: cc.Label = null;

    @property(cc.Label)
    inventoryLabel: cc.Label = null;

    @property(cc.Label)
    expLabel: cc.Label = null;

    @property(cc.Label)
    zoneLabel: cc.Label = null;

    private _lastPhase = "";
    private _upgradeRoot: cc.Node = null;
    private _upgradeHintRoot: cc.Node = null;
    private _settlementRoot: cc.Node = null;
    private _buildPaletteRoot: cc.Node = null;
    private _buildPaletteBlock: cc.Node = null;
    private _buildPaletteCountLabel: cc.Label = null;
    private _buildPaletteHintLabel: cc.Label = null;
    private _buildPaletteCamp: TurnCamp = "A";
    private _buildPaletteCount = 0;
    private _buildPaletteEnabled = false;
    private _buildDragNode: cc.Node = null;
    private _lastBuildDragWorldPos: cc.Vec2 = null;

    onBuildDragStart: (camp: TurnCamp, worldPos: cc.Vec2) => boolean = null;
    onBuildDragMove: (camp: TurnCamp, worldPos: cc.Vec2) => void = null;
    onBuildDragEnd: (camp: TurnCamp, worldPos: cc.Vec2) => void = null;
    onBuildDragCancel: (camp: TurnCamp) => void = null;

    onMoveLeft: () => void = null;
    onMoveRight: () => void = null;

    private _moveButtonsRoot: cc.Node = null;
    private _moveLeftBtn: cc.Node = null;
    private _moveRightBtn: cc.Node = null;
    private _moveButtonsEnabled = false;

    initHud() {
        this.node.removeAllChildren();
        this.phaseLabel = this.createLabel("回合制塔防", 26, 0, 20);
        this.timerLabel = this.createLabel("倒计时 0.0", 22, 0, -20);
        this.crystalLabel = this.createLabel("A HP: 100  |  B HP: 100", 20, -200, 130);
        this.expLabel = this.createLabel("A: 0  |  B: 0", 20, -200, 100);
        this.inventoryLabel = this.createLabel("掩体 A: 3  |  B: 3", 20, -210, 70);
        this.zoneLabel = this.createLabel("场上黑洞区: 0", 20, -210, -11125);
        this._upgradeRoot = null;
        this._upgradeHintRoot = null;
        this._settlementRoot = null;
        this._buildPaletteRoot = null;
        this._buildPaletteBlock = null;
        this._buildPaletteCountLabel = null;
        this._buildPaletteHintLabel = null;
        this._buildDragNode = null;
        this._lastBuildDragWorldPos = null;
        this._moveButtonsRoot = null;
        this._moveLeftBtn = null;
        this._moveRightBtn = null;
        this.ensureBuildPalette();
        this.refreshBuildPalette("A", 0, false);
        this.ensureMoveButtons();
        this.setMoveButtonsEnabled(false);
    }

    refreshState(snapshot: TurnStateSnapshot) {
        if (!this.phaseLabel) {
            this.initHud();
        }

        let phaseText = this.getPhaseText(snapshot);
        if (this._lastPhase !== phaseText) {
            this._lastPhase = phaseText;
            this.phaseLabel.string = phaseText;
        }
        this.refreshTimer(snapshot);
    }

    refreshTimer(snapshot: TurnStateSnapshot) {
        if (!this.timerLabel) {
            return;
        }

        this.timerLabel.string = "倒计时 " + snapshot.phaseTimeLeft.toFixed(1) + "s";
    }

    refreshCrystals(aHp: number, bHp: number) {
        if (!this.crystalLabel) {
            return;
        }

        this.crystalLabel.string = "A HP: " + aHp + "  |  B HP: " + bHp;
    }

    refreshInventory(aCount: number, bCount: number) {
        if (!this.inventoryLabel) {
            return;
        }

        this.inventoryLabel.string = "掩体 A: " + aCount + "  |  B: " + bCount;
    }

    refreshBuildPalette(camp: TurnCamp, count: number, enabled: boolean) {
        this.ensureBuildPalette();
        this._buildPaletteCamp = camp || "A";
        this._buildPaletteCount = Math.max(0, count || 0);
        this._buildPaletteEnabled = !!enabled;
        this.refreshBuildPaletteView();
        if (!this._buildPaletteEnabled) {
            this.cancelBuildDrag();
        }
    }

    setBuildPalettePosition(position: cc.Vec2) {
        this.ensureBuildPalette();
        if (!position || !this._buildPaletteRoot) {
            return;
        }
        this._buildPaletteRoot.setPosition(position.x + 28, position.y + 22);
    }

    refreshExp(aExp: number, aLevel: number, aExpNeed: number, bExp: number, bLevel: number, bExpNeed: number) {
        if (!this.expLabel) {
            return;
        }

        this.expLabel.string = "A Lv." + aLevel + ": " + aExp + "/" + aExpNeed + "  |  B Lv." + bLevel + ": " + bExp + "/" + bExpNeed;
    }

    refreshZones(aBlackHole: number, bBlackHole: number) {
        if (!this.zoneLabel) {
            return;
        }

        this.zoneLabel.string = "场上黑洞区: " + Math.max(aBlackHole, bBlackHole);
    }

    showUpgradeOptions(camp: TurnCamp, options: TurnUpgradeConfig[], onPick: (id: TurnUpgradeId) => void) {
        this.hideUpgradeOptions();
        this._upgradeRoot = new cc.Node("TurnUpgradePanel");
        this._upgradeRoot.parent = this.node;
        this._upgradeRoot.setPosition(0, 20);

        let bg = this._upgradeRoot.addComponent(cc.Graphics);
        bg.fillColor = new cc.Color(24, 30, 42, 225);
        bg.roundRect(-250, -142, 500, 284, 14);
        bg.fill();
        bg.strokeColor = new cc.Color(230, 230, 230, 160);
        bg.lineWidth = 2;
        bg.roundRect(-250, -142, 500, 284, 14);
        bg.stroke();

        let title = this.createLabel("阵营 " + camp + " 选择升级", 24, 0, 104);
        title.node.parent = this._upgradeRoot;
        for (let i = 0; i < options.length; i++) {
            this.createUpgradeButton(options[i], i, onPick);
        }
    }

    hideUpgradeOptions() {
        if (this._upgradeRoot) {
            this._upgradeRoot.destroy();
            this._upgradeRoot = null;
        }
        this.hideUpgradeHint();
    }

    showUpgradeHint(text: string) {
        this.hideUpgradeHint();
        this._upgradeHintRoot = new cc.Node("TurnUpgradeHint");
        this._upgradeHintRoot.parent = this.node;
        this._upgradeHintRoot.setPosition(0, 20);

        let bg = this._upgradeHintRoot.addComponent(cc.Graphics);
        bg.fillColor = new cc.Color(24, 30, 42, 205);
        bg.roundRect(-220, -42, 440, 84, 14);
        bg.fill();
        bg.strokeColor = new cc.Color(230, 230, 230, 120);
        bg.lineWidth = 2;
        bg.roundRect(-220, -42, 440, 84, 14);
        bg.stroke();

        let label = this.createLabel(text, 22, 0, 0);
        label.node.parent = this._upgradeHintRoot;
    }

    hideUpgradeHint() {
        if (this._upgradeHintRoot) {
            this._upgradeHintRoot.destroy();
            this._upgradeHintRoot = null;
        }
    }

    showSettlement(winnerCamp: TurnCamp, onRestart: () => void) {
        this.hideSettlement();
        this.hideUpgradeOptions();

        this._settlementRoot = new cc.Node("TurnSettlementPanel");
        this._settlementRoot.parent = this.node;
        this._settlementRoot.setPosition(0, 0);
        this._settlementRoot.zIndex = 100;

        let bg = this._settlementRoot.addComponent(cc.Graphics);
        bg.fillColor = new cc.Color(10, 16, 24, 210);
        bg.rect(-360, -640, 720, 1280);
        bg.fill();

        let panel = new cc.Node("Panel");
        panel.parent = this._settlementRoot;
        panel.setPosition(0, 20);

        let panelGraphics = panel.addComponent(cc.Graphics);
        panelGraphics.fillColor = new cc.Color(24, 30, 42, 240);
        panelGraphics.roundRect(-220, -150, 440, 300, 16);
        panelGraphics.fill();
        panelGraphics.strokeColor = new cc.Color(235, 235, 235, 160);
        panelGraphics.lineWidth = 2;
        panelGraphics.roundRect(-220, -150, 440, 300, 16);
        panelGraphics.stroke();

        let title = this.createLabel("战斗结算", 30, 0, 88);
        title.node.parent = panel;

        let result = this.createLabel("阵营 " + winnerCamp + " 获胜", 28, 0, 28);
        result.node.parent = panel;
        result.node.color = winnerCamp === "A" ? new cc.Color(120, 230, 150, 255) : new cc.Color(255, 120, 140, 255);

        let hint = this.createLabel("点击按钮重新开始新一局", 20, 0, -20);
        hint.node.parent = panel;
        hint.node.color = new cc.Color(220, 220, 220, 255);

        this.createSettlementButton(panel, "重新开始", 0, -92, onRestart);
    }

    hideSettlement() {
        if (this._settlementRoot) {
            this._settlementRoot.destroy();
            this._settlementRoot = null;
        }
    }

    setMoveButtonsEnabled(enabled: boolean) {
        this.ensureMoveButtons();
        this._moveButtonsEnabled = !!enabled;
        this.refreshMoveButtonsView();
    }

    private ensureMoveButtons() {
        if (this._moveButtonsRoot) {
            return;
        }

        this._moveButtonsRoot = new cc.Node("TurnMoveButtons");
        this._moveButtonsRoot.parent = this.node;
        this._moveButtonsRoot.setPosition(-280, -380);
        this._moveButtonsRoot.zIndex = 25;

        this._moveLeftBtn = this.createMoveButton("◀", -10, 0, () => {
            if (this._moveButtonsEnabled && this.onMoveLeft) {
                this.onMoveLeft();
            }
        });
        this._moveLeftBtn.parent = this._moveButtonsRoot;

        this._moveRightBtn = this.createMoveButton("▶", 60, 0, () => {
            if (this._moveButtonsEnabled && this.onMoveRight) {
                this.onMoveRight();
            }
        });
        this._moveRightBtn.parent = this._moveButtonsRoot;

        // let hint = this.createLabel("移动", 26, 0, 36);
        // hint.node.parent = this._moveButtonsRoot;
        // hint.node.color = new cc.Color(210, 220, 235, 255);
    }

    private createMoveButton(text: string, x: number, y: number, onClick: () => void): cc.Node {
        let node = new cc.Node("TurnMoveButton");
        node.setPosition(x, y);
        node.setContentSize(64, 64);

        let graphics = node.addComponent(cc.Graphics);
        graphics.fillColor = new cc.Color(40, 56, 84, 235);
        graphics.roundRect(-32, -32, 64, 64, 10);
        graphics.fill();
        graphics.strokeColor = new cc.Color(215, 225, 240, 200);
        graphics.lineWidth = 2;
        graphics.roundRect(-32, -32, 64, 64, 10);
        graphics.stroke();

        let label = this.createLabel(text, 28, 0, -2);
        label.node.parent = node;

        node.on(cc.Node.EventType.TOUCH_END, function (event: cc.Event.EventTouch) {
            event.stopPropagation();
            onClick();
        }, this);
        return node;
    }

    private refreshMoveButtonsView() {
        if (!this._moveButtonsRoot) {
            return;
        }
        this._moveButtonsRoot.opacity = this._moveButtonsEnabled ? 255 : 130;
    }

    cancelBuildDrag() {
        if (!this._buildDragNode) {
            return;
        }
        this._buildDragNode.destroy();
        this._buildDragNode = null;
        this._lastBuildDragWorldPos = null;
    }

    private getPhaseText(snapshot: TurnStateSnapshot): string {
        if (snapshot.phase === "build") {
            return "第 " + snapshot.roundIndex + " 轮：改造期";
        }
        if (snapshot.phase === "zone") {
            return "第 " + snapshot.roundIndex + " 轮：辅助区域放置期";
        }
        if (snapshot.phase === "attack") {
            return "进攻 " + snapshot.attackRoundIndex + "/3：阵营 " + snapshot.actionCamp + " 行动";
        }
        if (snapshot.phase === "waitBullet") {
            return "等待阵营 " + snapshot.actionCamp + " 子弹结束";
        }
        if (snapshot.phase === "upgrade") {
            return "回合结算与升级检查";
        }
        if (snapshot.phase === "finish") {
            if (snapshot.winnerCamp) {
                return "战斗结束：阵营 " + snapshot.winnerCamp + " 获胜";
            }
            return "战斗结束";
        }
        return "初始化";
    }

    private createLabel(text: string, size: number, x: number, y: number): cc.Label {
        let node = new cc.Node("TurnHudLabel");
        node.parent = this.node;
        node.setPosition(x, y);
        node.color = new cc.Color(245, 245, 245, 255);

        let label = node.addComponent(cc.Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size + 6;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        return label;
    }

    private ensureBuildPalette() {
        if (this._buildPaletteRoot) {
            return;
        }

        this._buildPaletteRoot = new cc.Node("TurnBuildPalette");
        this._buildPaletteRoot.parent = this.node;
        this._buildPaletteRoot.setPosition(-220, -235);
        this._buildPaletteRoot.setContentSize(180, 104);
        this._buildPaletteRoot.zIndex = 20;

        let bg = this._buildPaletteRoot.addComponent(cc.Graphics);
        bg.fillColor = new cc.Color(24, 30, 42, 220);
        bg.roundRect(-90, -52, 180, 104, 12);
        bg.fill();
        bg.strokeColor = new cc.Color(215, 225, 240, 140);
        bg.lineWidth = 2;
        bg.roundRect(-90, -52, 180, 104, 12);
        bg.stroke();

        let title = this.createLabel("己方掩体", 20, 0, 30);
        title.node.parent = this._buildPaletteRoot;

        this._buildPaletteBlock = new cc.Node("BuildPaletteBlock");
        this._buildPaletteBlock.parent = this._buildPaletteRoot;
        this._buildPaletteBlock.setPosition(-40, -4);

        this._buildPaletteCountLabel = this.createLabel("x0", 22, 30, -3);
        this._buildPaletteCountLabel.node.parent = this._buildPaletteRoot;
        this._buildPaletteHintLabel = this.createLabel("等待改造期", 15, 0, -34);
        this._buildPaletteHintLabel.node.parent = this._buildPaletteRoot;
        this._buildPaletteHintLabel.node.color = new cc.Color(190, 200, 220, 255);

        this._buildPaletteRoot.on(cc.Node.EventType.TOUCH_START, this.onBuildPaletteTouchStart, this);
        this._buildPaletteRoot.on(cc.Node.EventType.TOUCH_MOVE, this.onBuildPaletteTouchMove, this);
        this._buildPaletteRoot.on(cc.Node.EventType.TOUCH_END, this.onBuildPaletteTouchEnd, this);
        this._buildPaletteRoot.on(cc.Node.EventType.TOUCH_CANCEL, this.onBuildPaletteTouchCancel, this);
    }

    private refreshBuildPaletteView() {
        if (!this._buildPaletteBlock || !this._buildPaletteCountLabel || !this._buildPaletteHintLabel || !this._buildPaletteRoot) {
            return;
        }

        this.drawBuildBlock(this._buildPaletteBlock, this._buildPaletteCamp, this.isBuildPaletteAvailable());
        this._buildPaletteCountLabel.string = "x" + this._buildPaletteCount;
        this._buildPaletteCountLabel.node.color = this.isBuildPaletteAvailable()
            ? new cc.Color(245, 245, 245, 255)
            : new cc.Color(150, 160, 178, 255);
        if (this.isBuildPaletteAvailable()) {
            this._buildPaletteHintLabel.string = "拖到己方建造区";
        }
        else if (this._buildPaletteCount <= 0) {
            this._buildPaletteHintLabel.string = "掩体库存不足";
        }
        else {
            this._buildPaletteHintLabel.string = "等待改造期";
        }
        this._buildPaletteRoot.opacity = this.isBuildPaletteAvailable() ? 255 : 170;
    }

    private drawBuildBlock(target: cc.Node, camp: TurnCamp, enabled: boolean) {
        let graphics = target.getComponent(cc.Graphics);
        if (!graphics) {
            graphics = target.addComponent(cc.Graphics);
        }
        graphics.clear();
        graphics.fillColor = enabled
            ? (camp === "A" ? new cc.Color(98, 158, 110, 255) : new cc.Color(168, 96, 112, 255))
            : new cc.Color(96, 104, 120, 210);
        graphics.rect(-16, -16, 32, 32);
        graphics.fill();
        graphics.strokeColor = new cc.Color(232, 236, 242, 210);
        graphics.lineWidth = 2;
        graphics.rect(-16, -16, 32, 32);
        graphics.stroke();
    }

    private isBuildPaletteAvailable(): boolean {
        return this._buildPaletteEnabled && this._buildPaletteCount > 0;
    }

    private createBuildDragNode(worldPos: cc.Vec2) {
        this.cancelBuildDrag();
        this._buildDragNode = new cc.Node("TurnBuildDragNode");
        this._buildDragNode.parent = this.node;
        this._buildDragNode.zIndex = 999;
        let localPos = this.node.convertToNodeSpaceAR(worldPos);
        this._buildDragNode.setPosition(localPos);
        this._buildDragNode.opacity = 220;
        this.drawBuildBlock(this._buildDragNode, this._buildPaletteCamp, true);
    }

    private updateBuildDragNode(worldPos: cc.Vec2) {
        if (!this._buildDragNode) {
            return;
        }
        let localPos = this.node.convertToNodeSpaceAR(worldPos);
        this._buildDragNode.setPosition(localPos);
    }

    private onBuildPaletteTouchStart(event: cc.Event.EventTouch) {
        event.stopPropagation();
        if (!this.isBuildPaletteAvailable()) {
            return;
        }
        let worldPos = cc.v2(event.getLocation());
        this._lastBuildDragWorldPos = cc.v2(worldPos);
        if (this.onBuildDragStart && this.onBuildDragStart(this._buildPaletteCamp, worldPos) === false) {
            this._lastBuildDragWorldPos = null;
            return;
        }
        this.createBuildDragNode(worldPos);
    }

    private onBuildPaletteTouchMove(event: cc.Event.EventTouch) {
        if (!this._buildDragNode) {
            return;
        }
        event.stopPropagation();
        let worldPos = cc.v2(event.getLocation());
        this._lastBuildDragWorldPos = cc.v2(worldPos);
        this.updateBuildDragNode(worldPos);
        if (this.onBuildDragMove) {
            this.onBuildDragMove(this._buildPaletteCamp, worldPos);
        }
    }

    private onBuildPaletteTouchEnd(event: cc.Event.EventTouch) {
        if (!this._buildDragNode) {
            return;
        }
        event.stopPropagation();
        let worldPos = cc.v2(event.getLocation());
        this._lastBuildDragWorldPos = cc.v2(worldPos);
        if (this.onBuildDragEnd) {
            this.onBuildDragEnd(this._buildPaletteCamp, worldPos);
        }
        this.cancelBuildDrag();
    }

    private onBuildPaletteTouchCancel(event: cc.Event.EventTouch) {
        if (!this._buildDragNode) {
            return;
        }
        event.stopPropagation();
        let worldPos = event && event.getLocation ? cc.v2(event.getLocation()) : this._lastBuildDragWorldPos;
        if (worldPos && this.onBuildDragEnd) {
            this.onBuildDragEnd(this._buildPaletteCamp, worldPos);
        }
        else if (this.onBuildDragCancel) {
            this.onBuildDragCancel(this._buildPaletteCamp);
        }
        this.cancelBuildDrag();
    }

    private createUpgradeButton(option: TurnUpgradeConfig, index: number, onPick: (id: TurnUpgradeId) => void) {
        let node = new cc.Node("UpgradeButton" + option.id);
        node.parent = this._upgradeRoot;
        node.setPosition(0, 42 - index * 74);
        node.setContentSize(410, 56);

        let graphics = node.addComponent(cc.Graphics);
        graphics.fillColor = new cc.Color(58, 74, 100, 255);
        graphics.roundRect(-205, -28, 410, 56, 8);
        graphics.fill();
        graphics.strokeColor = new cc.Color(210, 230, 255, 180);
        graphics.lineWidth = 2;
        graphics.roundRect(-205, -28, 410, 56, 8);
        graphics.stroke();

        let label = this.createLabel(option.name + "  " + option.desc, 18, 0, -3);
        label.node.parent = node;
        node.on(cc.Node.EventType.TOUCH_END, function (event: cc.Event.EventTouch) {
            event.stopPropagation();
            onPick(option.id);
        }, this);
    }

    private createSettlementButton(parent: cc.Node, text: string, x: number, y: number, onClick: () => void) {
        let node = new cc.Node("SettlementButton");
        node.parent = parent;
        node.setPosition(x, y);
        node.setContentSize(220, 60);

        let graphics = node.addComponent(cc.Graphics);
        graphics.fillColor = new cc.Color(64, 110, 196, 255);
        graphics.roundRect(-110, -30, 220, 60, 10);
        graphics.fill();
        graphics.strokeColor = new cc.Color(220, 235, 255, 220);
        graphics.lineWidth = 2;
        graphics.roundRect(-110, -30, 220, 60, 10);
        graphics.stroke();

        let label = this.createLabel(text, 24, 0, -2);
        label.node.parent = node;

        node.on(cc.Node.EventType.TOUCH_END, function (event: cc.Event.EventTouch) {
            event.stopPropagation();
            onClick();
        }, this);
    }
}
