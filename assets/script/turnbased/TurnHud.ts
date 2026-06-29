import { getTurnObstacleShortLabel, TurnBondHudItem, TurnCamp, TurnObstacleResourceType, TurnUpgradeConfig, TurnUpgradeId } from "../config/TurnGame";
import { TurnStateSnapshot } from "./TurnStateMachine";

const { ccclass, property } = cc._decorator;

interface TurnBondListView {
    root: cc.Node;
    toggleButton: cc.Node;
    toggleLabel: cc.Label;
    viewport: cc.Node;
    content: cc.Node;
    titleLabel: cc.Label;
    emptyLabel: cc.Label;
    itemNodes: cc.Node[];
    items: TurnBondHudItem[];
    side: "left" | "right";
    width: number;
    height: number;
    scrollY: number;
    maxScrollY: number;
    isDragging: boolean;
    lastTouchY: number;
    dragDistance: number;
    visible: boolean;
}

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

    @property(cc.Label)
    bondLabel: cc.Label = null;

    @property(cc.Label)
    coinLabel: cc.Label = null;

    private _lastPhase = "";
    private _phaseLabelBackground: cc.Node = null;
    private _phaseLabelBackgroundWidth = 0;
    private _phaseLabelBackgroundHeight = 0;
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
    private _buildPaletteAttackMode = false;
    private _buildPaletteSlots: { slotId: string; type: TurnObstacleResourceType; name: string; count: number; placed: boolean; shapeKey?: string; hpText?: string; coinCost?: number; affordable?: boolean; layout?: { x: number; y: number }[]; cellLevels?: number[]; heroChar?: string }[] = [];
    private _refreshButton: cc.Node = null;
    private _refreshButtonLabel: cc.Label = null;
    private _refreshCoinLabel: cc.Label = null;
    private _refreshAvailable = false;
    private _refreshCost = 0;
    private _refreshLockedByPlacement = false;
    private _campCoins: { [camp: string]: number } = { A: 0, B: 0 };
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
    onBuildRefresh: (camp: TurnCamp) => void = null;

    private _moveButtonsRoot: cc.Node = null;
    private _moveLeftBtn: cc.Node = null;
    private _moveRightBtn: cc.Node = null;
    private _moveButtonsEnabled = false;
    private _ownBondList: TurnBondListView = null;
    private _enemyBondList: TurnBondListView = null;
    private _bondTooltipRoot: cc.Node = null;
    private _lastBondPhase = "";

    initHud() {
        this.node.removeAllChildren();
        this.phaseLabel = this.createLabel("回合制塔防", 26, 0, 140);
        this.phaseLabel.node.zIndex = 2;
        this.timerLabel = this.createLabel("倒计时 0", 22, 0, 100);
        this.timerLabel.node.zIndex = 2;
        this._phaseLabelBackground = null;
        this._phaseLabelBackgroundWidth = 0;
        this._phaseLabelBackgroundHeight = 0;
        this.refreshPhaseLabelBackground();
        // this.crystalLabel = this.createLabel("A HP: 100  |  B HP: 100", 20, -200, 190);
        this.expLabel = this.createLabel("A: 0  |  B: 0", 20, -200, 0);
        this.expLabel.node.color = new cc.Color(0, 0, 0, 0);
        this.expLabel.node.active = false;
        // this.inventoryLabel = this.createLabel("掩体 A: 3  |  B: 3", 20, -210, 130);
        // this.zoneLabel = this.createLabel("场上辅助区: 0", 20, -210, 100);
        // this.bondLabel = this.createLabel("A 羁绊: -", 18, -190, 70);
        // this.bondLabel.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
        // this.bondLabel.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
        // this.bondLabel.node.width = 580;
        this.coinLabel = this.createLabel("金币 A: 0  |  B: 0", 20, -200, 130);
        this.coinLabel.node.color = new cc.Color(0, 0, 0, 0);
        this.coinLabel.node.active = false;
        this._upgradeRoot = null;
        this._upgradeHintRoot = null;
        this._settlementRoot = null;
        this._buildPaletteRoot = null;
        this._buildPaletteBlock = null;
        this._buildPaletteCountLabel = null;
        this._buildPaletteHintLabel = null;
        this._refreshCoinLabel = null;
        this._campCoins = { A: 0, B: 0 };
        this._buildPaletteAttackMode = false;
        this._buildPaletteSlots = [];
        this._buildDragNode = null;
        this._lastBuildDragWorldPos = null;
        this._activeBuildDragSlotId = "";
        this._buildDragCommitted = false;
        this._moveButtonsRoot = null;
        this._moveLeftBtn = null;
        this._moveRightBtn = null;
        this._ownBondList = null;
        this._enemyBondList = null;
        this._bondTooltipRoot = null;
        this._lastBondPhase = "";
        this.ensureBuildPalette();
        this.refreshBuildPalette("A", [], false);
        this.ensureMoveButtons();
        this.setMoveButtonsEnabled(false);
        this.ensureBondLists();
        this.refreshBondItems([], []);
    }

    refreshState(snapshot: TurnStateSnapshot) {
        if (!this.phaseLabel) {
            this.initHud();
        }

        this.setBuildPaletteAttackMode(snapshot.phase === "attack");
        this.setPhaseHudVisible(snapshot.phase !== "attack" && snapshot.phase !== "waitBullet" && snapshot.phase !== "settle");
        this.refreshBondListPhaseVisibility(snapshot.phase);
        let phaseText = this.getPhaseText(snapshot);
        if (this._lastPhase !== phaseText) {
            this._lastPhase = phaseText;
            this.phaseLabel.string = phaseText;
        }
        this.refreshTimer(snapshot);
        this.refreshPhaseLabelBackground();
    }

    refreshTimer(snapshot: TurnStateSnapshot) {
        if (!this.timerLabel) {
            return;
        }

        this.timerLabel.string = "倒计时 " + Math.ceil(Math.max(0, snapshot.phaseTimeLeft)) + "s";
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

    refreshBuildPalette(camp: TurnCamp, slots: { slotId: string; type: TurnObstacleResourceType; name: string; count: number; placed: boolean; shapeKey?: string; hpText?: string; coinCost?: number; affordable?: boolean; layout?: { x: number; y: number }[]; cellLevels?: number[]; heroChar?: string }[], enabled: boolean) {
        this.ensureBuildPalette();
        this._buildPaletteCamp = camp || "A";
        this._buildPaletteSlots = Array.isArray(slots) ? slots.slice() : [];
        this._buildPaletteCount = this._buildPaletteSlots.reduce((total, item) => {
            return total + (!item.placed ? Math.max(0, item.count || 0) : 0);
        }, 0);
        this._buildPaletteEnabled = !!enabled;
        let selected = this.getSelectedBuildSlot();
        if (!selected || selected.placed || selected.count <= 0) {
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
        let paletteX = position.x + 120;
        let paletteY = position.y + 110;
        this._buildPaletteRoot.setPosition(paletteX, paletteY);
    }

    refreshExp(aExp: number, aLevel: number, aExpNeed: number, bExp: number, bLevel: number, bExpNeed: number) {
        if (!this.expLabel) {
            return;
        }

        this.expLabel.string = "";
        this.expLabel.node.active = false;
    }

    refreshZones(aZoneCount: number, bZoneCount: number) {
        if (!this.zoneLabel) {
            return;
        }

        this.zoneLabel.string = "场上辅助区: " + Math.max(aZoneCount, bZoneCount);
    }

    refreshBonds(aText: string, bText: string) {
        if (!this.bondLabel) {
            return;
        }
        this.bondLabel.string = aText + "\n" + bText;
    }

    refreshBondItems(ownItems: TurnBondHudItem[], enemyItems: TurnBondHudItem[]) {
        this.ensureBondLists();
        this.refreshBondList(this._ownBondList, Array.isArray(ownItems) ? ownItems : [], "我方");
        this.refreshBondList(this._enemyBondList, Array.isArray(enemyItems) ? enemyItems : [], "对方");
    }

    refreshCoins(aCoins: number, bCoins: number) {
        this._campCoins.A = Math.max(0, Math.floor(Number(aCoins) || 0));
        this._campCoins.B = Math.max(0, Math.floor(Number(bCoins) || 0));
        if (this.coinLabel) {
            this.coinLabel.string = "金币 A: " + this._campCoins.A + "  |  B: " + this._campCoins.B;
        }
        this.refreshBuildPaletteCoinView();
    }

    refreshRefreshButton(camp: TurnCamp, available: boolean, cost: number, lockedByPlacement: boolean) {
        this._buildPaletteCamp = camp || this._buildPaletteCamp || "A";
        this._refreshAvailable = !!available;
        this._refreshCost = Math.max(0, Math.floor(Number(cost) || 0));
        this._refreshLockedByPlacement = !!lockedByPlacement;
        this.refreshRefreshButtonView();
    }

    showUpgradeOptions(camp: TurnCamp, options: TurnUpgradeConfig[], onPick: (id: TurnUpgradeId) => void) {
        this.hideUpgradeOptions();
        this._upgradeRoot = new cc.Node("TurnUpgradePanel");
        this._upgradeRoot.parent = this.node;
        this._upgradeRoot.setPosition(0, -90);

        let bg = this._upgradeRoot.addComponent(cc.Graphics);
        bg.fillColor = new cc.Color(24, 30, 42, 225);
        bg.roundRect(-250, -142, 500, 284, 14);
        bg.fill();
        bg.strokeColor = new cc.Color(230, 230, 230, 160);
        bg.lineWidth = 2;
        bg.roundRect(-250, -142, 500, 284, 14);
        bg.stroke();

        let title = this.createLabel("选择升级", 24, 0, 104);
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

        let campStr  = winnerCamp == "A" ? "我方" : "敌方";
        let result = this.createLabel(campStr + " 获胜", 28, 0, 28);
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

    private ensureBondLists() {
        if (!this._ownBondList) {
            this._ownBondList = this.createBondListView("left", -292, 0, "我方");
        }
        if (!this._enemyBondList) {
            this._enemyBondList = this.createBondListView("right", 292, 0, "对方");
        }
    }

    private createBondListView(side: "left" | "right", x: number, y: number, title: string): TurnBondListView {
        let width = 96;
        let height = 390;
        let root = new cc.Node("TurnBondList" + side);
        root.parent = this.node;
        root.setPosition(x, y);
        root.setContentSize(width, height);
        root.zIndex = 18;

        let bg = root.addComponent(cc.Graphics);
        bg.fillColor = new cc.Color(16, 22, 32, 118);
        bg.roundRect(-width / 2, -height / 2, width, height, 14);
        bg.fill();
        bg.strokeColor = new cc.Color(210, 220, 240, 70);
        bg.lineWidth = 1;
        bg.roundRect(-width / 2, -height / 2, width, height, 14);
        bg.stroke();

        let titleLabel = this.createChildLabel(root, title, 15, 0, height / 2 - 18);
        titleLabel.node.color = new cc.Color(220, 230, 245, 230);

        let toggleButton = this.createBondListToggleButton(side, x, y + height / 2 + 24);
        let toggleLabel = toggleButton.getComponentInChildren(cc.Label);

        let viewport = new cc.Node("BondViewport");
        viewport.parent = root;
        viewport.setPosition(0, -12);
        viewport.setContentSize(width, height - 48);
        let mask = viewport.addComponent(cc.Mask);
        mask.type = cc.Mask.Type.RECT;

        let content = new cc.Node("BondContent");
        content.parent = viewport;
        content.setContentSize(width, height - 48);

        let emptyLabel = this.createChildLabel(viewport, "暂无", 14, 0, 0);
        emptyLabel.node.color = new cc.Color(185, 195, 210, 210);

        let view: TurnBondListView = {
            root: root,
            viewport: viewport,
            content: content,
            titleLabel: titleLabel,
            emptyLabel: emptyLabel,
            itemNodes: [],
            items: [],
            side: side,
            width: width,
            height: height - 48,
            scrollY: 0,
            maxScrollY: 0,
            isDragging: false,
            lastTouchY: 0,
            dragDistance: 0,
            visible: true,
            toggleButton: toggleButton,
            toggleLabel: toggleLabel,
        };

        viewport.on(cc.Node.EventType.TOUCH_START, (event: cc.Event.EventTouch) => {
            event.stopPropagation();
            view.isDragging = true;
            view.dragDistance = 0;
            view.lastTouchY = event.getLocation().y;
        }, this);
        viewport.on(cc.Node.EventType.TOUCH_MOVE, (event: cc.Event.EventTouch) => {
            event.stopPropagation();
            if (!view.isDragging) {
                return;
            }
            let y = event.getLocation().y;
            let delta = view.lastTouchY - y;
            view.lastTouchY = y;
            view.dragDistance += Math.abs(delta);
            view.scrollY = Math.max(0, Math.min(view.maxScrollY, view.scrollY + delta));
            this.updateBondListContentPosition(view);
        }, this);
        viewport.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
            event.stopPropagation();
            view.isDragging = false;
        }, this);
        viewport.on(cc.Node.EventType.TOUCH_CANCEL, (event: cc.Event.EventTouch) => {
            event.stopPropagation();
            view.isDragging = false;
        }, this);

        this.refreshBondListToggleView(view);
        return view;
    }

    private createBondListToggleButton(side: "left" | "right", x: number, y: number): cc.Node {
        let node = new cc.Node("TurnBondToggle" + side);
        node.parent = this.node;
        node.setPosition(x, y);
        node.setContentSize(82, 30);
        node.zIndex = 30;

        let graphics = node.addComponent(cc.Graphics);
        graphics.fillColor = new cc.Color(24, 30, 42, 225);
        graphics.roundRect(-41, -15, 82, 30, 9);
        graphics.fill();
        graphics.strokeColor = new cc.Color(220, 230, 245, 150);
        graphics.lineWidth = 1.5;
        graphics.roundRect(-41, -15, 82, 30, 9);
        graphics.stroke();

        let label = this.createChildLabel(node, "", 14, 0, 0);
        label.node.color = new cc.Color(245, 248, 255, 255);
        node.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
            event.stopPropagation();
            this.toggleBondList(side);
        }, this);
        return node;
    }

    private toggleBondList(side: "left" | "right") {
        let view = side === "left" ? this._ownBondList : this._enemyBondList;
        if (!view) {
            return;
        }
        this.setBondListVisible(view, !view.visible);
    }

    private setBondListVisible(view: TurnBondListView, visible: boolean) {
        if (!view || !view.root) {
            return;
        }
        view.visible = !!visible;
        view.root.active = view.visible;
        if (!view.visible) {
            this.hideBondTooltip();
        }
        this.refreshBondListToggleView(view);
    }

    private refreshBondListToggleView(view: TurnBondListView) {
        if (!view || !view.toggleLabel || !view.toggleButton) {
            return;
        }
        let title = view.side === "left" ? "我方" : "对方";
        view.toggleLabel.string = title + (view.visible ? "隐藏" : "显示");
        view.toggleButton.opacity = view.visible ? 255 : 210;
    }

    private refreshBondListPhaseVisibility(phase: string) {
        this.ensureBondLists();
        if (this._lastBondPhase === phase) {
            return;
        }
        this._lastBondPhase = phase;
        if (phase === "build") {
            this.setBondListVisible(this._ownBondList, true);
            this.setBondListVisible(this._enemyBondList, true);
            return;
        }
        if (phase === "attack" || phase === "waitBullet") {
            this.setBondListVisible(this._ownBondList, false);
            this.setBondListVisible(this._enemyBondList, false);
        }
    }

    private refreshBondList(view: TurnBondListView, items: TurnBondHudItem[], title: string) {
        if (!view || !view.content) {
            return;
        }
        this.hideBondTooltip();
        view.items = items.slice();
        view.titleLabel.string = title;
        this.clearBondListItems(view);
        let itemGap = 70;
        let topY = view.height / 2 - 42;
        for (let i = 0; i < view.items.length; i++) {
            let item = view.items[i];
            let node = this.createBondItemNode(view, item, i);
            node.parent = view.content;
            node.setPosition(0, topY - i * itemGap);
            view.itemNodes.push(node);
        }
        let contentHeight = view.items.length > 0 ? view.items.length * itemGap + 14 : 0;
        view.maxScrollY = Math.max(0, contentHeight - view.height);
        view.scrollY = Math.max(0, Math.min(view.maxScrollY, view.scrollY));
        view.emptyLabel.node.active = view.items.length <= 0;
        this.updateBondListContentPosition(view);
    }

    private clearBondListItems(view: TurnBondListView) {
        for (let i = 0; i < view.itemNodes.length; i++) {
            if (view.itemNodes[i]) {
                view.itemNodes[i].destroy();
            }
        }
        view.itemNodes = [];
    }

    private updateBondListContentPosition(view: TurnBondListView) {
        if (!view || !view.content) {
            return;
        }
        view.content.setPosition(0, -view.scrollY);
    }

    private createBondItemNode(view: TurnBondListView, item: TurnBondHudItem, index: number): cc.Node {
        let node = new cc.Node("BondItem" + item.type + index);
        node.setContentSize(72, 64);
        let color = this.getBondItemColor(item.type);
        this.drawBondItemRing(node, item, color);
        let fallbackShortLabel = item.shortLabel || getTurnObstacleShortLabel(item.type as TurnObstacleResourceType);
        let shortLabel = this.createChildLabel(node, fallbackShortLabel, 24, 0, 4);
        shortLabel.node.color = new cc.Color(245, 248, 255, 255);
        shortLabel.node.zIndex = 3;
        let valueLabel = this.createChildLabel(node, item.value + "/" + Math.max(0, item.nextValue), 12, 0, -26);
        valueLabel.verticalAlign = cc.Label.VerticalAlign.BOTTOM;
        valueLabel.node.setAnchorPoint(0.5, 0);
        valueLabel.node.color = new cc.Color(245, 248, 255, 245);
        valueLabel.node.zIndex = 3;

        node.on(cc.Node.EventType.MOUSE_ENTER, (event: cc.Event.EventMouse) => {
            event.stopPropagation();
            this.showBondTooltip(item, view.side, node);
        }, this);
        node.on(cc.Node.EventType.MOUSE_LEAVE, (event: cc.Event.EventMouse) => {
            event.stopPropagation();
            this.hideBondTooltip();
        }, this);
        return node;
    }

    private drawBondItemRing(node: cc.Node, item: TurnBondHudItem, color: cc.Color) {
        let graphics = node.getComponent(cc.Graphics);
        if (!graphics) {
            graphics = node.addComponent(cc.Graphics);
        }
        graphics.clear();
        graphics.fillColor = new cc.Color(30, 36, 48, 224);
        graphics.circle(0, 0, 28);
        graphics.fill();
        let maxLevel = Math.max(1, Math.floor(Number(item.maxLevel) || 5));
        let level = Math.max(0, Math.min(maxLevel, Math.floor(Number(item.level) || 0)));
        let segmentAngle = Math.PI * 2 / maxLevel;
        for (let i = 0; i < maxLevel; i++) {
            let start = -Math.PI / 2 + i * segmentAngle + 0.08;
            let end = -Math.PI / 2 + (i + 1) * segmentAngle - 0.08;
            graphics.strokeColor = i < level ? color : new cc.Color(110, 120, 138, 170);
            graphics.lineWidth = 6;
            this.drawArcStroke(graphics, 0, 0, 27, start, end);
        }
        graphics.strokeColor = new cc.Color(235, 240, 250, 150);
        graphics.lineWidth = 1;
        graphics.circle(0, 0, 18);
        graphics.stroke();
    }

    private drawArcStroke(graphics: cc.Graphics, centerX: number, centerY: number, radius: number, start: number, end: number) {
        let steps = 10;
        for (let i = 0; i <= steps; i++) {
            let angle = start + (end - start) * i / steps;
            let x = centerX + Math.cos(angle) * radius;
            let y = centerY + Math.sin(angle) * radius;
            if (i === 0) {
                graphics.moveTo(x, y);
            }
            else {
                graphics.lineTo(x, y);
            }
        }
        graphics.stroke();
    }

    private showBondTooltip(item: TurnBondHudItem, side: "left" | "right", sourceNode: cc.Node) {
        this.hideBondTooltip();
        let panelWidth = 286;
        let panelHeight = 270;
        this._bondTooltipRoot = new cc.Node("TurnBondTooltip");
        this._bondTooltipRoot.parent = this.node;
        this._bondTooltipRoot.zIndex = 90;
        let worldPos = sourceNode.convertToWorldSpaceAR(cc.v2(0, 0));
        let localPos = this.node.convertToNodeSpaceAR(worldPos);
        let panelX = side === "left" ? localPos.x + 176 : localPos.x - 176;
        let panelY = Math.max(-190, Math.min(190, localPos.y));
        this._bondTooltipRoot.setPosition(panelX, panelY);
        this._bondTooltipRoot.setContentSize(panelWidth, panelHeight);

        let bg = this._bondTooltipRoot.addComponent(cc.Graphics);
        bg.fillColor = new cc.Color(18, 24, 36, 238);
        bg.roundRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 12);
        bg.fill();
        bg.strokeColor = new cc.Color(230, 236, 248, 170);
        bg.lineWidth = 2;
        bg.roundRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 12);
        bg.stroke();

        let title = this.createChildLabel(this._bondTooltipRoot, item.name + "（" + item.shortLabel + "）", 18, 0, panelHeight / 2 - 26);
        title.node.color = this.getBondItemColor(item.type);
        this.createTooltipBody(this._bondTooltipRoot, this.buildBondTooltipBodyText(item), 14, 0, panelHeight / 2 - 54, panelWidth - 32, panelHeight - 72);

        this._bondTooltipRoot.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
            event.stopPropagation();
        }, this);
    }

    private hideBondTooltip() {
        if (this._bondTooltipRoot) {
            this._bondTooltipRoot.destroy();
            this._bondTooltipRoot = null;
        }
    }

    private buildBondTooltipBodyText(item: TurnBondHudItem): string {
        let lines: string[] = [];
        lines.push(item.description || "暂无功能描述");
        lines.push("当前等级：" + item.level + "/" + item.maxLevel + "，价值：" + item.value + "/" + item.nextValue);
        lines.push("等级加成数值：");
        let effects = item.effectDescriptions && item.effectDescriptions.length > 0 ? item.effectDescriptions : item.levelDescriptions;
        let maxLevel = Math.max(1, Math.floor(Number(item.maxLevel) || 5));
        for (let i = 0; i < maxLevel; i++) {
            lines.push(effects && effects[i] ? effects[i] : ("Lv." + (i + 1) + " -"));
        }
        return lines.join("\n");
    }

    private createTooltipBody(parent: cc.Node, text: string, size: number, x: number, y: number, width: number, height: number): cc.Label {
        let node = new cc.Node("TurnBondTooltipBody");
        node.parent = parent;
        node.setAnchorPoint(0.5, 1);
        node.setPosition(x, y);
        node.setContentSize(width, height);
        node.color = new cc.Color(232, 236, 245, 255);
        node.zIndex = 10;
        let label = node.addComponent(cc.Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size + 6;
        label.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
        label.verticalAlign = cc.Label.VerticalAlign.TOP;
        label.overflow = cc.Label.Overflow.NONE;
        return label;
    }

    private getBondItemColor(type: TurnObstacleResourceType | string): cc.Color {
        if (type === "mirror") {
            return new cc.Color(180, 196, 236, 255);
        }
        if (type === "bullet") {
            return new cc.Color(166, 140, 255, 255);
        }
        if (type === "attack") {
            return new cc.Color(255, 146, 86, 255);
        }
        if (type === "coin") {
            return new cc.Color(247, 205, 66, 255);
        }
        if (type === "energy") {
            return new cc.Color(72, 168, 228, 255);
        }
        if (type === "bleed") {
            return new cc.Color(224, 98, 98, 255);
        }
        if (type === "missile_silo") {
            return new cc.Color(104, 132, 154, 255);
        }
        return new cc.Color(99, 156, 106, 255);
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
        this._moveButtonsRoot.active = !!this._moveButtonsEnabled;
        this._moveButtonsRoot.opacity = 255;
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
        let campStr  = snapshot.actionCamp == "A" ? "我方" : "敌方";
        if (snapshot.phase === "attack") {
            return "第 " + snapshot.roundIndex + " 轮：攻击期 - " + campStr + " 第 " + snapshot.attackTurnIndex + "/2 次行动";
        }
        if (snapshot.phase === "waitBullet") {
            return "等待" + campStr + " 攻击效果结束";
        }
        if (snapshot.phase === "settle") {
            return "第 " + snapshot.roundIndex + " 轮：结算期";
        }
        if (snapshot.phase === "upgrade") {
            return "第 " + snapshot.roundIndex + " 轮：升级期";
        }
        let campStr1  = snapshot.winnerCamp == "A" ? "我方" : "敌方";
        if (snapshot.phase === "finish") {
            if (snapshot.winnerCamp) {
                return "战斗结束： " + campStr1 + " 获胜";
            }
            return "战斗结束";
        }
        return "初始化";
    }

    private createLabel(text: string, size: number, x: number, y: number): cc.Label {
        let node = new cc.Node("TurnHudLabel");
        node.parent = this.node;
        node.setPosition(x, y);
        node.color = new cc.Color(255, 255, 0, 255);
        let label = node.addComponent(cc.Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size + 6;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        return label;
    }

    private refreshPhaseLabelBackground() {
        if (!this.phaseLabel) {
            return;
        }
        if (!this._phaseLabelBackground) {
            this._phaseLabelBackground = new cc.Node("PhaseLabelBackground");
            this._phaseLabelBackground.parent = this.node;
            this._phaseLabelBackground.zIndex = 1;
        }

        let bounds = this.getLabelVisualBounds(this.phaseLabel);
        if (this.timerLabel) {
            let timerBounds = this.getLabelVisualBounds(this.timerLabel);
            bounds.minX = Math.min(bounds.minX, timerBounds.minX);
            bounds.maxX = Math.max(bounds.maxX, timerBounds.maxX);
            bounds.minY = Math.min(bounds.minY, timerBounds.minY);
            bounds.maxY = Math.max(bounds.maxY, timerBounds.maxY);
        }

        let centerX = (bounds.minX + bounds.maxX) / 2;
        let centerY = (bounds.minY + bounds.maxY) / 2;
        this._phaseLabelBackground.setPosition(centerX, centerY);

        let paddingX = 48;
        let paddingY = 20;
        let targetWidth = Math.ceil(bounds.maxX - bounds.minX + paddingX);
        let targetHeight = Math.ceil(bounds.maxY - bounds.minY + paddingY);
        this._phaseLabelBackgroundWidth = Math.max(this._phaseLabelBackgroundWidth, targetWidth);
        this._phaseLabelBackgroundHeight = Math.max(this._phaseLabelBackgroundHeight, targetHeight);
        this._phaseLabelBackground.setContentSize(this._phaseLabelBackgroundWidth, this._phaseLabelBackgroundHeight);

        let graphics = this._phaseLabelBackground.getComponent(cc.Graphics);
        if (!graphics) {
            graphics = this._phaseLabelBackground.addComponent(cc.Graphics);
        }
        graphics.clear();
        graphics.fillColor = new cc.Color(18, 24, 36, 210);
        graphics.roundRect(-this._phaseLabelBackgroundWidth / 2, -this._phaseLabelBackgroundHeight / 2, this._phaseLabelBackgroundWidth, this._phaseLabelBackgroundHeight, 12);
        graphics.fill();
        graphics.strokeColor = new cc.Color(220, 230, 245, 150);
        graphics.lineWidth = 2;
        graphics.roundRect(-this._phaseLabelBackgroundWidth / 2, -this._phaseLabelBackgroundHeight / 2, this._phaseLabelBackgroundWidth, this._phaseLabelBackgroundHeight, 12);
        graphics.stroke();
    }

    private setPhaseHudVisible(visible: boolean) {
        if (this.phaseLabel) {
            this.phaseLabel.node.active = !!visible;
        }
        if (this.timerLabel) {
            this.timerLabel.node.active = !!visible;
        }
        if (this._phaseLabelBackground) {
            this._phaseLabelBackground.active = !!visible;
        }
    }

    private getLabelVisualBounds(label: cc.Label): { minX: number; maxX: number; minY: number; maxY: number } {
        let node = label.node;
        let fontSize = Math.max(1, Number(label.fontSize) || 20);
        let lineHeight = Math.max(fontSize, Number(label.lineHeight) || fontSize + 6);
        let width = this.measureTextWidth(label.string || "", fontSize);
        return {
            minX: node.x - width / 2,
            maxX: node.x + width / 2,
            minY: node.y - lineHeight / 2,
            maxY: node.y + lineHeight / 2,
        };
    }

    private measureTextWidth(text: string, fontSize: number): number {
        let width = 0;
        for (let i = 0; i < text.length; i++) {
            width += text.charCodeAt(i) > 255 ? fontSize : fontSize * 0.56;
        }
        return width;
    }

    private ensureBuildPalette() {
        if (this._buildPaletteRoot) {
            return;
        }

        let paletteW = 300;
        let paletteH = 210;
        this._buildPaletteRoot = new cc.Node("TurnBuildPalette");
        this._buildPaletteRoot.parent = this.node;
        this._buildPaletteRoot.setPosition(-100, -300);
        this._buildPaletteRoot.setContentSize(paletteW, paletteH);
        this._buildPaletteRoot.zIndex = 20;

        let bg = this._buildPaletteRoot.addComponent(cc.Graphics);
        bg.fillColor = new cc.Color(24, 30, 42, 225);
        bg.roundRect(-paletteW / 2, -paletteH / 2, paletteW, paletteH, 12);
        bg.fill();
        bg.strokeColor = new cc.Color(215, 225, 240, 150);
        bg.lineWidth = 2;
        bg.roundRect(-paletteW / 2, -paletteH / 2, paletteW, paletteH, 12);
        bg.stroke();

        // let title = this.createLabel("己方掩体", 18, 0, paletteH / 2 - 16);
        // title.node.parent = this._buildPaletteRoot;

        this._buildPaletteBlock = new cc.Node("BuildPaletteBlock");
        this._buildPaletteBlock.parent = this._buildPaletteRoot;
        this._buildPaletteBlock.setPosition(0, paletteH / 2 - 56);

        this._buildPaletteCountLabel = this.createLabel("总数 x0", 16, 0, -paletteH / 2 + 30);
        this._buildPaletteCountLabel.node.parent = this._buildPaletteRoot;
        this._buildPaletteCountLabel.node.active = false
        this._buildPaletteHintLabel = this.createLabel("等待改造期", 13, 0, -paletteH / 2 + 12);
        this._buildPaletteHintLabel.node.parent = this._buildPaletteRoot;
        this._buildPaletteHintLabel.node.color = new cc.Color(190, 200, 220, 255);

        this._refreshButton = new cc.Node("BuildRefreshButton");
        this._refreshButton.parent = this._buildPaletteRoot;
        this._refreshButton.setPosition(paletteW / 2 - 150, -paletteH / 2 + 75);
        this._refreshButton.setContentSize(88, 40);
        this._refreshButton.zIndex = 21;
        let refreshGfx = this._refreshButton.addComponent(cc.Graphics);
        refreshGfx.fillColor = new cc.Color(58, 78, 110, 235);
        refreshGfx.roundRect(-44, -20, 88, 40, 8);
        refreshGfx.fill();
        refreshGfx.strokeColor = new cc.Color(220, 230, 245, 200);
        refreshGfx.lineWidth = 2;
        refreshGfx.roundRect(-44, -20, 88, 40, 8);
        refreshGfx.stroke();
        this._refreshButtonLabel = this.createChildLabel(this._refreshButton, "刷新 -5", 16, 0, 0);
        this._refreshButton.on(cc.Node.EventType.TOUCH_START, this.onRefreshButtonTouchStart, this);
        this._refreshButton.on(cc.Node.EventType.TOUCH_END, this.onRefreshButtonClicked, this);
        this._refreshButton.on(cc.Node.EventType.TOUCH_CANCEL, this.onRefreshButtonTouchCancel, this);
        this._refreshCoinLabel = this.createLabel("金币:0", 16, 0, 0);
        this._refreshCoinLabel.node.parent = this._buildPaletteRoot;
        this._refreshCoinLabel.node.setPosition(this._refreshButton.x, this._refreshButton.y - 40);
        this._refreshCoinLabel.node.color = new cc.Color(255, 218, 96, 255);

        this._buildPaletteRoot.on(cc.Node.EventType.TOUCH_START, this.onBuildPaletteTouchStart, this);
        this._buildPaletteRoot.on(cc.Node.EventType.TOUCH_MOVE, this.onBuildPaletteTouchMove, this);
        this._buildPaletteRoot.on(cc.Node.EventType.TOUCH_END, this.onBuildPaletteTouchEnd, this);
        this._buildPaletteRoot.on(cc.Node.EventType.TOUCH_CANCEL, this.onBuildPaletteTouchCancel, this);
    }

    private refreshBuildPaletteView() {
        if (!this._buildPaletteBlock || !this._buildPaletteCountLabel || !this._buildPaletteHintLabel || !this._buildPaletteRoot) {
            return;
        }
        this._buildPaletteRoot.active = !!this._buildPaletteEnabled && !this._buildPaletteAttackMode;
        if (!this._buildPaletteRoot.active) {
            this.setExpLabelVisible(false);
            return;
        }

        this._buildPaletteBlock.active = true;
        this.setExpLabelVisible(this._buildPaletteBlock.active);
        this._buildPaletteHintLabel.node.active = true;
        this.drawBuildSlots(this._buildPaletteBlock);
        // this._buildPaletteCountLabel.string = "总数 x" + this._buildPaletteCount;
        // this._buildPaletteCountLabel.node.color = this.isBuildPaletteAvailable()
        //     ? new cc.Color(245, 245, 245, 255)
        //     : new cc.Color(150, 160, 178, 255);
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
        this.refreshRefreshButtonView();
        this.refreshBuildPaletteCoinView();
    }

    private refreshRefreshButtonView() {
        if (!this._refreshButton || !this._refreshButtonLabel) {
            return;
        }
        this._refreshButton.active = !!this._buildPaletteEnabled;
        if (!this._refreshButton.active) {
            return;
        }
        let cost = Math.max(0, Math.floor(Number(this._refreshCost) || 0));
        this._refreshButtonLabel.string = "刷新 -" + cost;
        let usable = this._refreshAvailable;
        this._refreshButtonLabel.node.color = usable
            ? new cc.Color(255, 218, 96, 255)
            : new cc.Color(255, 120, 120, 255);
        this._refreshButton.opacity = usable ? 255 : 140;
    }

    private refreshBuildPaletteCoinView() {
        if (!this._refreshCoinLabel) {
            return;
        }
        let camp = this._buildPaletteCamp === "B" ? "B" : "A";
        this._refreshCoinLabel.string = "金币:" + Math.max(0, Math.floor(Number(this._campCoins[camp]) || 0));
        this._refreshCoinLabel.node.active = !!this._buildPaletteEnabled && !this._buildPaletteAttackMode;
    }

    private setBuildPaletteAttackMode(enabled: boolean) {
        if (this._buildPaletteAttackMode === !!enabled) {
            return;
        }
        this._buildPaletteAttackMode = !!enabled;
        this.refreshBuildPaletteView();
    }

    private setExpLabelVisible(visible: boolean) {
        if (this.expLabel) {
            this.expLabel.node.active = false;
        }
    }

    private onRefreshButtonTouchStart(event: cc.Event.EventTouch) {
        if (event) {
            event.stopPropagation();
        }
    }

    private onRefreshButtonTouchCancel(event: cc.Event.EventTouch) {
        if (event) {
            event.stopPropagation();
        }
    }

    private onRefreshButtonClicked(event: cc.Event.EventTouch) {
        if (event) {
            event.stopPropagation();
        }
        if (!this._buildPaletteEnabled || !this._refreshAvailable) {
            return;
        }
        if (this.onBuildRefresh) {
            this.onBuildRefresh(this._buildPaletteCamp);
        }
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
        let width = this.getBuildSlotWidth();
        let gap = this.getBuildSlotGap();
        let startX = -((slots.length - 1) * (width + gap)) / 2;
        for (let i = 0; i < slots.length; i++) {
            let slot = slots[i];
            let x = startX + i * (width + gap);
            let y = 0;

            graphics.fillColor = new cc.Color(48, 56, 76, 200);
            graphics.roundRect(x - width / 2, y - width / 2, width, width, 8);
            graphics.fill();
            graphics.strokeColor = new cc.Color(170, 180, 210, slot.placed ? 110 : 180);
            graphics.lineWidth = 1.5;
            graphics.roundRect(x - width / 2, y - width / 2, width, width, 8);
            graphics.stroke();

            if (slot.placed) {
                this.drawEmptyBuildSlot(target, x, y, width - 8);
            }
            else {
                this.drawSlotShape(target, graphics, slot, x, y, width - 8);
            }

            if (slot.slotId === this._selectedBuildSlotId) {
                graphics.strokeColor = new cc.Color(255, 235, 120, 255);
                graphics.lineWidth = 3;
                graphics.roundRect(x - width / 2 - 3, y - width / 2 - 3, width + 6, width + 6, 10);
                graphics.stroke();
            }
            this.createBuildSlotInfo(slot, x, y - width / 2 - 10);
        }
    }

    private drawEmptyBuildSlot(target: cc.Node, centerX: number, centerY: number, innerSize: number) {
        let label = this.createChildLabel(target, "空", Math.max(18, Math.floor(innerSize * 0.42)), centerX, centerY);
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        label.node.color = new cc.Color(150, 160, 178, 210);
        label.node.zIndex = 8;
        this._buildSlotInfoNodes.push(label.node);
    }

    private drawSlotShape(
        target: cc.Node,
        graphics: cc.Graphics,
        slot: { type: TurnObstacleResourceType; placed: boolean; count: number; layout?: { x: number; y: number }[]; shapeKey?: string; cellLevels?: number[]; heroChar?: string },
        centerX: number,
        centerY: number,
        innerSize: number,
    ) {
        let cells = this.getSlotLayoutCells(slot);
        if (cells.length <= 0) {
            cells = [{ x: 0, y: 0 }];
        }
        let minX = cells[0].x;
        let maxX = cells[0].x;
        let minY = cells[0].y;
        let maxY = cells[0].y;
        for (let i = 1; i < cells.length; i++) {
            let cell = cells[i];
            if (cell.x < minX) { minX = cell.x; }
            if (cell.x > maxX) { maxX = cell.x; }
            if (cell.y < minY) { minY = cell.y; }
            if (cell.y > maxY) { maxY = cell.y; }
        }
        let dimX = Math.max(1, maxX - minX + 1);
        let dimY = Math.max(1, maxY - minY + 1);
        let dim = Math.max(dimX, dimY);
        let cellGap = dim > 1 ? 2 : 0;
        let cellSize = Math.floor((innerSize - (dim - 1) * cellGap) / dim);
        if (cellSize < 6) {
            cellSize = 6;
        }
        let totalW = dimX * cellSize + (dimX - 1) * cellGap;
        let totalH = dimY * cellSize + (dimY - 1) * cellGap;
        let originX = centerX - totalW / 2 - minX * (cellSize + cellGap);
        let originY = centerY - totalH / 2 - minY * (cellSize + cellGap);
        let strokeAlpha = slot.placed ? 140 : 220;
        for (let i = 0; i < cells.length; i++) {
            let cell = cells[i];
            let cx = originX + cell.x * (cellSize + cellGap);
            let cy = originY + cell.y * (cellSize + cellGap);
            let level = Math.max(1, Math.floor(Number(slot.cellLevels && slot.cellLevels[i]) || 1));
            graphics.fillColor = this.getSlotColor(slot.type, slot.placed, level);
            graphics.roundRect(cx, cy, cellSize, cellSize, Math.max(2, Math.floor(cellSize * 0.18)));
            graphics.fill();
            graphics.strokeColor = new cc.Color(245, 248, 252, strokeAlpha);
            graphics.lineWidth = 1.5;
            graphics.roundRect(cx, cy, cellSize, cellSize, Math.max(2, Math.floor(cellSize * 0.18)));
            graphics.stroke();
            this.createSlotTextMark(target, slot, cx + cellSize / 2, cy + cellSize / 2, cellSize);
        }
    }

    private createSlotTextMark(parent: cc.Node, slot: { type: TurnObstacleResourceType; heroChar?: string }, x: number, y: number, cellSize: number) {
        let text = slot.type === "summon_wall" && slot.heroChar ? slot.heroChar : getTurnObstacleShortLabel(slot.type);
        if (!text) {
            return;
        }
        let fontSize = Math.max(12, Math.min(20, Math.floor(cellSize * 0.62)));
        let label = this.createChildLabel(parent, text, fontSize, x, y);
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        label.node.color = new cc.Color(255, 255, 255, 245);
        label.node.zIndex = 8;
        this._buildSlotInfoNodes.push(label.node);
    }

    private getSlotLayoutCells(slot: { layout?: { x: number; y: number }[]; shapeKey?: string; count?: number }): { x: number; y: number }[] {
        if (Array.isArray(slot.layout) && slot.layout.length > 0) {
            return slot.layout.map((cell) => ({
                x: Math.round(Number(cell.x) || 0),
                y: Math.round(Number(cell.y) || 0),
            }));
        }
        let key = String(slot.shapeKey || "");
        if (key) {
            let result: { x: number; y: number }[] = [];
            let parts = key.split("|");
            for (let i = 0; i < parts.length; i++) {
                let part = parts[i];
                if (!part) {
                    continue;
                }
                let xy = part.split(":");
                if (xy.length < 2) {
                    continue;
                }
                let cx = parseInt(xy[0], 10);
                let cy = parseInt(xy[1], 10);
                if (Number.isFinite(cx) && Number.isFinite(cy)) {
                    result.push({ x: cx, y: cy });
                }
            }
            if (result.length > 0) {
                return result;
            }
        }
        return [];
    }

    private getBuildSlotWidth(): number {
        return 52;
    }

    private getBuildSlotGap(): number {
        return 36;
    }

    private clearBuildSlotInfoNodes() {
        for (let i = 0; i < this._buildSlotInfoNodes.length; i++) {
            if (this._buildSlotInfoNodes[i]) {
                this._buildSlotInfoNodes[i].destroy();
            }
        }
        this._buildSlotInfoNodes = [];
    }

    private createBuildSlotInfo(slot: { slotId: string; type: TurnObstacleResourceType; name: string; count: number; placed: boolean; shapeKey?: string; hpText?: string; coinCost?: number; affordable?: boolean; layout?: { x: number; y: number }[] }, x: number, y: number) {
        let root = new cc.Node("BuildSlotInfo");
        root.parent = this._buildPaletteBlock;
        root.setPosition(x, y);
        this._buildSlotInfoNodes.push(root);

        let lineHeight = 10;
        let cursorY = 0;
        let name = this.createChildLabel(root, slot.placed ? "空槽" : this.getSlotDisplayName(slot.type, slot.name), 13, 0, 75);
        name.node.color = slot.slotId === this._selectedBuildSlotId
            ? new cc.Color(255, 235, 120, 255)
            : (slot.placed ? new cc.Color(150, 160, 178, 230) : new cc.Color(230, 235, 244, 255));
        cursorY -= lineHeight + 2;

        // if (slot.hpText) {
        //     let hp = this.createChildLabel(root, slot.hpText, 10, 0, cursorY);
        //     hp.node.color = new cc.Color(255, 221, 132, 255);
        //     cursorY -= lineHeight;
        // }

        let coinCost = slot.placed ? 0 : Math.max(0, Math.floor(Number(slot.coinCost) || 0));
        if (coinCost > 0) {
            let affordable = slot.affordable !== false;
            let costLabel = this.createChildLabel(root, "-" + coinCost + " 金币", 12, 0, cursorY);
            costLabel.node.color = affordable
                ? new cc.Color(255, 218, 96, 255)
                : new cc.Color(255, 96, 96, 255);
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
        if (type === "shovel") {
            return "铲子";
        }
        if (type === "summon_wall") {
            return "召唤墙";
        }
        if (type === "coin") {
            return "金币块";
        }
        if (type === "mirror") {
            return "反弹块";
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
        if (type === "bullet") {
            return "子弹块";
        }
        if (type === "attack") {
            return "攻击块";
        }
        if (type === "missile_silo") {
            return "导弹井";
        }
        return fallback || "普通方块";
    }

    private getSlotColor(_type: TurnObstacleResourceType, placed: boolean, level: number = 1): cc.Color {
        let alpha = placed ? 200 : 255;
        if (_type === "shovel") {
            return new cc.Color(164, 112, 58, alpha);
        }
        let palette = [
            new cc.Color(20, 20, 20, alpha),
            new cc.Color(58, 174, 84, alpha),
            new cc.Color(72, 136, 232, alpha),
            new cc.Color(154, 89, 220, alpha),
            new cc.Color(245, 150, 48, alpha),
        ];
        let index = Math.max(0, Math.min(palette.length - 1, Math.floor(Number(level) || 1) - 1));
        return palette[index];
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
        let width = this.getBuildSlotWidth();
        let gap = this.getBuildSlotGap();
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
        if (!touchedSlotId) {
            return;
        }
        this.selectBuildSlot(touchedSlotId);
        if (!this.isBuildPaletteAvailable()) {
            return;
        }
        let selected = this.getSelectedBuildSlot();
        if (!selected || selected.count <= 0 || selected.placed) {
            return;
        }
        if (selected.affordable === false) {
            this._buildPaletteHintLabel.string = "金币不足，无法拖动";
            this._buildPaletteHintLabel.node.color = new cc.Color(255, 120, 120, 255);
            return;
        }
        this._buildPaletteHintLabel.node.color = new cc.Color(190, 200, 220, 255);
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

        let currentStacks = Math.max(0, Math.floor(Number((option as any).currentStacks) || 0));
        let stackText = option.maxStacks == null
            ? "Lv." + currentStacks
            : "Lv." + currentStacks + "/" + option.maxStacks;
        // let label = this.createLabel("[" + stackText + "] " + option.name, 18, 0, -3);
        let label = this.createLabel(option.name, 18, 0, -3);
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
