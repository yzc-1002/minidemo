const {ccclass} = cc._decorator;

@ccclass
export default class RippleShockwave extends cc.Component {

    _mapNode = null;
    _sprite = null;
    _material = null;
    _duration = 0.46;
    _elapsed = 0;
    _center = cc.v2(0.5, 0.5);
    _viewportSize = cc.size(1280, 720);
    _spriteFrame = null;
    _renderTexture = null;

    init(mapNode, sprite, material, center, viewportSize, spriteFrame = null, renderTexture = null, duration = 0.46) {
        this._mapNode = mapNode;
        this._sprite = sprite;
        this._material = material;
        this._center = center ? cc.v2(center) : cc.v2(0.5, 0.5);
        this._viewportSize = viewportSize || cc.size(1280, 720);
        this._spriteFrame = spriteFrame;
        this._renderTexture = renderTexture;
        this._duration = Math.max(0.01, duration);
        this._elapsed = 0;
        this._syncScreenLockedPosition();
        this._applyMaterial(0);
    }

    update(dt) {
        if (!this._material || !cc.isValid(this.node)) {
            return;
        }

        this._elapsed += dt;
        let progress = this._elapsed / this._duration;
        if (progress > 1) {
            progress = 1;
        }

        this._syncScreenLockedPosition();
        this._applyMaterial(progress);

        this.node.opacity = Math.floor(255 * Math.max(0, 1 - progress * progress));
        if (progress >= 1) {
            this.node.destroy();
        }
    }

    _syncScreenLockedPosition() {
        if (!this._mapNode || !cc.isValid(this._mapNode)) {
            return;
        }
        this.node.setPosition(-this._mapNode.x, -this._mapNode.y);
    }

    _applyMaterial(progress) {
        let energy = 1 - progress;
        this._material.setProperty("center", this._center);
        this._material.setProperty("progress", progress);
        this._material.setProperty("amplitude", 0.012 * energy + 0.0015);
        this._material.setProperty("bandWidth", 0.038 + 0.009 * energy);
        this._material.setProperty("brightness", 0.1 * energy + 0.015);
        this._material.setProperty("aspect", this._viewportSize.width / Math.max(1, this._viewportSize.height));
        if (this._sprite && cc.isValid(this._sprite)) {
            this._sprite.setMaterial(0, this._material);
        }
    }

    onDestroy() {
        if (this._sprite && cc.isValid(this._sprite)) {
            this._sprite.spriteFrame = null;
        }
        if (this._spriteFrame && this._spriteFrame.destroy) {
            this._spriteFrame.destroy();
        }
        if (this._renderTexture && this._renderTexture.destroy) {
            this._renderTexture.destroy();
        }
        this._spriteFrame = null;
        this._renderTexture = null;
        this._material = null;
        this._sprite = null;
        this._mapNode = null;
    }
}
