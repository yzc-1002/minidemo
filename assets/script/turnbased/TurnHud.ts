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

    initHud() {
        this.node.removeAllChildren();
        this.phaseLabel = this.createLabel("回合制塔防", 26, 0, 420);
        this.timerLabel = this.createLabel("倒计时 0.0", 22, 0, 386);
        this.crystalLabel = this.createLabel("A HP: 100  |  B HP: 100", 20, -210, 40);
        this.inventoryLabel = this.createLabel("掩体 A: 3  |  B: 3", 20, -245,10);
        this.expLabel = this.createLabel("经验 A: 0  |  B: 0", 20, -240, -30);
        this.zoneLabel = this.createLabel("黑洞区 A: 0  |  B: 0", 20, -230, -60);
        this._upgradeRoot = null;
        this._upgradeHintRoot = null;
        this._settlementRoot = null;
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

    refreshExp(aExp: number, aLevel: number, bExp: number, bLevel: number, levelUpExp: number) {
        if (!this.expLabel) {
            return;
        }

        this.expLabel.string = "经验 A Lv." + aLevel + ": " + aExp + "/" + levelUpExp + "  |  B Lv." + bLevel + ": " + bExp + "/" + levelUpExp;
    }

    refreshZones(aBlackHole: number, bBlackHole: number) {
        if (!this.zoneLabel) {
            return;
        }

        this.zoneLabel.string = "黑洞区 A: " + aBlackHole + "  |  B: " + bBlackHole;
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
