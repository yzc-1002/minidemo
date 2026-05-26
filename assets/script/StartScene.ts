const {ccclass, property} = cc._decorator;

@ccclass
export class StartScene extends cc.Component {
    private _loading = false;

    //加载完成
    onLoad () {
        this.node.on(cc.Node.EventType.TOUCH_END, this.enterGame, this);
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_END, this.enterGame, this);
    }

    private enterGame() {
        if (this._loading) {
            return;
        }
        this._loading = true;
        cc.director.loadScene("GameScene");
    }
}
