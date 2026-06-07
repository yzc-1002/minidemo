import { TurnCamp, TurnObstacleResourceType, TurnUpgradeConfig, TurnUpgradeId } from "../config/TurnGame";
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
    private _buildPaletteSlots: { slotId: string; type: TurnObstacleResourceType; name: string; count: number; placed: boolean; shapeKey?: string; hpText?: string }[] = [];
    private _selectedBuildSlotId = "";
    private _buildSlotInfoNodes: cc.Node[] = [];
    private _buildDragNode: cc.Node = null;
    private _lastBuildDragWorldPos: cc.Vec2 = null;
    private _activeBuildDragSlotId = "";
    private _buildDragCommitted = false;

    onBuildDragStart: (camp: TurnCamp, slotId: string, worldPos: cc.Vec2) => boolean = null;
    onBuildDragMove: (camp: TurnCamp, slotId: string, worldPos: cc.Vec2) => void = null;
    onBuildDragEnd: (camp: TurnCamp, slotId: string, worldPos: cc.Vec2) => void = null;
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
        this.crystalLabel = this.createLabel("A HP: 100  |  B HP: 100", 20, -200, 190);
        this.expLabel = this.createLabel("A: 0  |  B: 0", 20, -200, 160);
        this.inventoryLabel = this.createLabel("掩体 A: 3  |  B: 3", 20, -210, 130);
        this.zoneLabel = this.createLabel("场上黑洞区: 0", 20, -210, -11125);
        this._upgradeRoot = null;
        this._upgradeHintRoot = null;
        this._settlementRoot = null;
        this._buildPaletteRoot = null;
        this._buildPaletteBlock = null;
        this._buildPaletteCountLabel = null;
        this._buildPaletteHintLabel = null;
        this._buildPaletteSlots = [];
        this._buildDragNode = null;
        this._lastBuildDragWorldPos = null;
        this._activeBuildDragSlotId = "";
        this._buildDragCommitted = false;
        this._moveButtonsRoot = null;
        this._moveLeftBtn = null;
        this._moveRightBtn = null;
        this.ensureBuildPalette();
        this.refreshBuildPalette("A", [], false);
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

    refreshBuildPalette(camp: TurnCamp, slots: { slotId: string; type: TurnObstacleResourceType; name: string; count: number; placed: boolean; shapeKey?: string; hpText?: string }[], enabled: boolean) {
        this.ensureBuildPalette();
        this._buildPaletteCamp = camp || "A";
        this._buildPaletteSlots = Array.isArray(slots) ? slots.slice() : [];
        this._buildPaletteCount = this._buildPaletteSlots.reduce((total, item) => total + Math.max(0, item.count || 0), 0);
        this._buildPaletteEnabled = !!enabled;
        if (!this.getSelectedBuildSlot()) {
            let firstUsable = this._buildPaletteSlots.find((item) => item.count > 0 && !item.placed);
            this._selectedBuildSlotId = firstUsable ? firstUsable.slotId : "";
        }
        this.refreshBuildPaletteView();
        if (!this._buildPaletteEnabled) {
            this.cancelBuildDrag();
        }
    }

    getSelectedBuildSlotId(): string {
        return this._selectedBuildSlotId;
    }

    setBuildPalettePosition(position: cc.Vec2) {
        this.ensureBuildPalette();
        if (!position || !this._buildPaletteRoot) {
            return;
        }
        this._buildPaletteRoot.setPosition(position.x + 80, position.y + 80);
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
            this._activeBuildDragSlotId = "";
            this._buildDragCommitted = false;
            return;
        }
        this._buildDragNode.destroy();
        this._buildDragNode = null;
        this._lastBuildDragWorldPos = null;
        this._activeBuildDragSlotId = "";
        this._buildDragCommitted = false;
    }

    private getPhaseText(snapshot: TurnStateSnapshot): string {
        if (snapshot.phase === "build") {
            return "第 " + snapshot.roundIndex + " 轮：放置期";
        }
        if (snapshot.phase === "attack") {
            return "第 " + snapshot.roundIndex + " 轮：攻击期 - 阵营 " + snapshot.actionCamp + " 第 " + snapshot.attackTurnIndex + "/2 次行动";
        }
        if (snapshot.phase === "waitBullet") {
            return "等待阵营 " + snapshot.actionCamp + " 攻击效果结束";
        }
        if (snapshot.phase === "settle") {
            return "第 " + snapshot.roundIndex + " 轮：结算期";
        }
        if (snapshot.phase === "upgrade") {
            return "第 " + snapshot.roundIndex + " 轮：升级期";
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
        this._buildPaletteRoot.setContentSize(220, 156);
        this._buildPaletteRoot.zIndex = 20;

        let bg = this._buildPaletteRoot.addComponent(cc.Graphics);
        bg.fillColor = new cc.Color(24, 30, 42, 220);
        bg.roundRect(-110, -78, 220, 156, 12);
        bg.fill();
        bg.strokeColor = new cc.Color(215, 225, 240, 140);
        bg.lineWidth = 2;
        bg.roundRect(-110, -78, 220, 156, 12);
        bg.stroke();

        let title = this.createLabel("己方掩体", 20, 0, 45);
        title.node.parent = this._buildPaletteRoot;

        this._buildPaletteBlock = new cc.Node("BuildPaletteBlock");
        this._buildPaletteBlock.parent = this._buildPaletteRoot;
        this._buildPaletteBlock.setPosition(0, 18);

        this._buildPaletteCountLabel = this.createLabel("总数 x0", 20, 0, -48);
        this._buildPaletteCountLabel.node.parent = this._buildPaletteRoot;
        this._buildPaletteHintLabel = this.createLabel("等待改造期", 15, 0, -66);
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
        this._buildPaletteRoot.active = !!this._buildPaletteEnabled;
        if (!this._buildPaletteRoot.active) {
            return;
        }

        this.drawBuildSlots(this._buildPaletteBlock);
        this._buildPaletteCountLabel.string = "总数 x" + this._buildPaletteCount;
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

    private drawBuildSlots(target: cc.Node) {
        let graphics = target.getComponent(cc.Graphics);
        if (!graphics) {
            graphics = target.addComponent(cc.Graphics);
        }
        graphics.clear();
        this.clearBuildSlotInfoNodes();
        let slots = this._buildPaletteSlots;
        let width = 34;
        let gap = 16;
        let startX = -((slots.length - 1) * (width + gap)) / 2;
        for (let i = 0; i < slots.length; i++) {
            let slot = slots[i];
            let x = startX + i * (width + gap);
            let y = 0;
            graphics.fillColor = this.getSlotColor(slot.type, slot.placed);
            graphics.roundRect(x - width / 2, y - width / 2, width, width, 6);
            graphics.fill();
            graphics.strokeColor = new cc.Color(240, 240, 240, slot.placed ? 120 : 220);
            graphics.lineWidth = 2;
            graphics.roundRect(x - width / 2, y - width / 2, width, width, 6);
            graphics.stroke();
            this.drawSlotMark(graphics, slot.type, x, y);
            if (slot.slotId === this._selectedBuildSlotId) {
                graphics.strokeColor = new cc.Color(255, 235, 120, 255);
                graphics.lineWidth = 3;
                graphics.roundRect(x - width / 2 - 3, y - width / 2 - 3, width + 6, width + 6, 8);
                graphics.stroke();
            }
            this.createBuildSlotInfo(slot, x, y - 28);
        }
    }

    private clearBuildSlotInfoNodes() {
        for (let i = 0; i < this._buildSlotInfoNodes.length; i++) {
            if (this._buildSlotInfoNodes[i]) {
                this._buildSlotInfoNodes[i].destroy();
            }
        }
        this._buildSlotInfoNodes = [];
    }

    private createBuildSlotInfo(slot: { slotId: string; type: TurnObstacleResourceType; name: string; count: number; placed: boolean; shapeKey?: string; hpText?: string }, x: number, y: number) {
        let root = new cc.Node("BuildSlotInfo");
        root.parent = this._buildPaletteBlock;
        root.setPosition(x, y);
        this._buildSlotInfoNodes.push(root);

        let name = this.createChildLabel(root, this.getSlotDisplayName(slot.type, slot.name), 11, 0, 0);
        name.node.color = slot.slotId === this._selectedBuildSlotId
            ? new cc.Color(255, 235, 120, 255)
            : new cc.Color(225, 230, 238, 255);

        let status = this.createChildLabel(root, "x" + Math.max(0, slot.count || 0) + " " + (slot.placed ? "已放置" : "未放置"), 10, 0, -14);
        status.node.color = slot.placed
            ? new cc.Color(180, 188, 200, 255)
            : new cc.Color(170, 240, 180, 255);
        if (slot.hpText) {
            let hp = this.createChildLabel(root, slot.hpText, 9, 0, -27);
            hp.node.color = new cc.Color(255, 221, 132, 255);
        }
        if (slot.shapeKey) {
            let shape = this.createChildLabel(root, this.summarizeShape(slot.shapeKey), 9, 0, slot.hpText ? -40 : -27);
            shape.node.color = new cc.Color(180, 196, 220, 255);
        }
    }

    private createChildLabel(parent: cc.Node, text: string, size: number, x: number, y: number): cc.Label {
        let node = new cc.Node("TurnHudChildLabel");
        node.parent = parent;
        node.setPosition(x, y);
        node.color = new cc.Color(245, 245, 245, 255);
        let label = node.addComponent(cc.Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size + 2;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        return label;
    }

    private summarizeShape(shapeKey: string): string {
        let key = String(shapeKey || "");
        if (!key) {
            return "";
        }
        let cells = key.split("|").filter(Boolean);
        return "形状 " + cells.length + " 格";
    }

    private getSlotDisplayName(type: TurnObstacleResourceType, fallback?: string): string {
        if (type === "mirror") {
            return "镜面墙";
        }
        if (type === "exp") {
            return "经验墙";
        }
        if (type === "energy") {
            return "能量墙";
        }
        if (type === "bleed") {
            return "滴血块";
        }
        return fallback || "普通方块";
    }

    private getSlotColor(type: TurnObstacleResourceType, placed: boolean): cc.Color {
        if (type === "mirror") {
            return placed ? new cc.Color(126, 140, 170, 200) : new cc.Color(180, 196, 236, 255);
        }
        if (type === "exp") {
            return placed ? new cc.Color(144, 126, 78, 200) : new cc.Color(223, 173, 62, 255);
        }
        if (type === "energy") {
            return placed ? new cc.Color(76, 120, 155, 200) : new cc.Color(72, 168, 228, 255);
        }
        if (type === "bleed") {
            return placed ? new cc.Color(140, 78, 78, 200) : new cc.Color(224, 98, 98, 255);
        }
        return placed ? new cc.Color(90, 104, 92, 200) : new cc.Color(99, 156, 106, 255);
    }

    private drawSlotMark(graphics: cc.Graphics, type: TurnObstacleResourceType, x: number, y: number) {
        graphics.strokeColor = new cc.Color(250, 250, 250, 220);
        graphics.lineWidth = 2;
        if (type === "mirror") {
            graphics.moveTo(x - 10, y - 10);
            graphics.lineTo(x + 10, y + 10);
        }
        else if (type === "exp") {
            graphics.moveTo(x - 7, y);
            graphics.lineTo(x + 7, y);
            graphics.moveTo(x, y - 7);
            graphics.lineTo(x, y + 7);
        }
        else if (type === "energy") {
            graphics.moveTo(x - 5, y + 8);
            graphics.lineTo(x + 1, y + 1);
            graphics.lineTo(x - 2, y + 1);
            graphics.lineTo(x + 5, y - 8);
        }
        else if (type === "bleed") {
            graphics.circle(x, y, 7);
        }
        else {
            graphics.rect(x - 8, y - 8, 16, 16);
        }
        graphics.stroke();
    }

    private isBuildPaletteAvailable(): boolean {
        return this._buildPaletteEnabled && !!this.getSelectedBuildSlot() && this._buildPaletteCount > 0;
    }

    private getSelectedBuildSlot() {
        for (let i = 0; i < this._buildPaletteSlots.length; i++) {
            let slot = this._buildPaletteSlots[i];
            if (slot.slotId === this._selectedBuildSlotId) {
                return slot;
            }
        }
        return null;
    }

    private getSlotIdAtWorldPos(worldPos: cc.Vec2): string {
        if (!this._buildPaletteBlock || !worldPos) {
            return null;
        }
        let local = this._buildPaletteBlock.convertToNodeSpaceAR(worldPos);
        let slots = this._buildPaletteSlots;
        let width = 34;
        let gap = 8;
        let startX = -((slots.length - 1) * (width + gap)) / 2;
        for (let i = 0; i < slots.length; i++) {
            let x = startX + i * (width + gap);
            if (local.x >= x - width / 2 && local.x <= x + width / 2 && local.y >= -width / 2 && local.y <= width / 2) {
                return slots[i].slotId;
            }
        }
        return null;
    }

    private selectBuildSlot(slotId: string) {
        if (!slotId) {
            return;
        }
        this._selectedBuildSlotId = slotId;
        this.refreshBuildPaletteView();
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
        this._buildDragCommitted = false;
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
        let worldPos = cc.v2(event.getLocation());
        let touchedSlotId = this.getSlotIdAtWorldPos(worldPos);
        if (touchedSlotId) {
            this.selectBuildSlot(touchedSlotId);
        }
        if (!this.isBuildPaletteAvailable()) {
            return;
        }
        let selected = this.getSelectedBuildSlot();
        if (!selected || selected.count <= 0 || selected.placed) {
            return;
        }
        this._lastBuildDragWorldPos = cc.v2(worldPos);
        this._activeBuildDragSlotId = selected.slotId;
        this._buildDragCommitted = false;
        if (this.onBuildDragStart && this.onBuildDragStart(this._buildPaletteCamp, selected.slotId, worldPos) === false) {
            this._lastBuildDragWorldPos = null;
            this._activeBuildDragSlotId = "";
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
            this.onBuildDragMove(this._buildPaletteCamp, this._activeBuildDragSlotId, worldPos);
        }
    }

    private onBuildPaletteTouchEnd(event: cc.Event.EventTouch) {
        if (!this._buildDragNode) {
            return;
        }
        event.stopPropagation();
        let worldPos = cc.v2(event.getLocation());
        this._lastBuildDragWorldPos = cc.v2(worldPos);
        if (!this._buildDragCommitted && this.onBuildDragEnd) {
            this._buildDragCommitted = true;
            this.onBuildDragEnd(this._buildPaletteCamp, this._activeBuildDragSlotId, worldPos);
        }
        this.cancelBuildDrag();
    }

    private onBuildPaletteTouchCancel(event: cc.Event.EventTouch) {
        if (!this._buildDragNode) {
            return;
        }
        event.stopPropagation();
        let worldPos = event && event.getLocation ? cc.v2(event.getLocation()) : this._lastBuildDragWorldPos;
        if (worldPos && !this._buildDragCommitted && this.onBuildDragEnd) {
            this._buildDragCommitted = true;
            this.onBuildDragEnd(this._buildPaletteCamp, this._activeBuildDragSlotId, worldPos);
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
