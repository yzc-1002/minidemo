import {BaseComponent} from "./base/BaseComponent";
import {Utils} from "./base/Utils";
import {LocalizedData} from "./base/LocalizedData";

const {ccclass, property} = cc._decorator;

//私有函数,请使用'_'开头
//请修改'NewClass' => 自己的类名
@ccclass
export class Bullet extends BaseComponent {

    _bulletType     = 1;            //子弹类型
    _bulletLevel    = 1;            //子弹等级
    _map            = null;         //tile map 节点
    _dir            = cc.v2(1,0);   //当前行进方向
    _speed          = 5;
    _gunshot        = 10;           //射程
    _damage         = 0;            //攻击力
    _destroyTime    = -1;           //销毁时间
    _camp           = "";           //阵营(player/enemy)
    _inGame         = false;
    _damageType     = "normal";     //伤害类型(normal/crit)
    _mutationType   = "";
    _mutationData   = null;
    _bounceLeft     = 0;
    _hasBounced     = false;
    _penetrateLeft  = 0;
    _hitTargetIds   = {};
    _portalIgnoreId = "";
    _portalIgnoreTime = 0;
    _centrifugalState = null;
    _centrifugalUsed = false;
    _damageDoubleUsed = false;
    _speedDoubleUsed = false;
    _spreadBulletUsed = false;
    _isClusterBomb = false;
    _clusterBombDistance = 0;
    _clusterBombSplitDistance = 0;
    _networkBulletId   = "";
    _ownerPlayerId     = -1;
    _multiplayerHitReported = false;
    _multiplayerEventReported = {};

    _currenBullet   = null;
    _isStop         = false;

    //加载完成
    onLoad () {
        //初始化变量
        this._initVariable();
        
        //初始化事件
        this._initEvent();
    }

    onDestroy() {
        if (this._map && this._map.unregisterMultiplayerBullet && this._networkBulletId) {
            this._map.unregisterMultiplayerBullet(this._networkBulletId, this.node);
        }
        //销毁事件
        this._destroyEvent();
    }

    //初始化变量
    _initVariable() {
        this._fire._sprBoom.active = false;
        this._fire._sprBoom.opacity = 0;
        this._fire._sprBoom.scale = 0;
    }

    //初始化事件
    _initEvent() {
    }

    //销毁事件
    _destroyEvent() {
    }

    //初始化子弹(方向/射程/伤害值/速度/阵营/当前关卡)
    initBullet(dir,gunshot,atk,speed,camp,levelId,bulletType = null, mutationData = null){
        this._dir = dir;
        this._gunshot = gunshot;
        this._speed = speed;
        this._damage = atk;
        this._camp = camp;
        this._damageType = "normal";
        this._destroyTime = this._gunshot/this._speed/60;
        this._mutationType = "";
        this._mutationData = null;
        this._bounceLeft = 0;
        this._hasBounced = false;
        this._penetrateLeft = 0;
        this._hitTargetIds = {};
        this._portalIgnoreId = "";
        this._portalIgnoreTime = 0;
        this._centrifugalState = null;
        this._centrifugalUsed = false;
        this._damageDoubleUsed = false;
        this._speedDoubleUsed = false;
        this._spreadBulletUsed = false;
        this._isClusterBomb = false;
        this._clusterBombDistance = 0;
        this._clusterBombSplitDistance = 0;
        this._networkBulletId = "";
        this._ownerPlayerId = -1;
        this._multiplayerHitReported = false;
        this._multiplayerEventReported = {};

        //子弹类型
        if (camp == "enemy") {
            this._bulletType = 0;
            this._bulletLevel = levelId;
        }
        else if (bulletType != null) {
            this._bulletType = bulletType;
            this._bulletLevel = LocalizedData.getIntItem(`_bullet_${this._bulletType}_`,1);
        }
        else{
            this._bulletType = LocalizedData.getIntItem("_current_bullet_type_",1);
            this._bulletLevel = LocalizedData.getIntItem(`_bullet_${this._bulletType}_`,1);
        }

        //子弹杀害加成（暴击概率）
        let bulletConfigs = yyp.config && yyp.config.Bullet ? yyp.config.Bullet : {};
        let config = bulletConfigs[this._bulletType];
        if (config && config.ATK != null) {
            this._damage += config.ATK * (this._bulletLevel + 1);
        }

        if (this._camp == "player" && Math.random() < 0.1) {
            this._damage *= 2;
            this._damageType = "crit";
        }

        this._inGame = true;
        this.setBulletType(this._bulletType);
        this._applyMutationData(mutationData);

        if (this._bulletType == 101) {
            this._isClusterBomb = true;
            this._clusterBombDistance = 0;
            this._clusterBombSplitDistance = this._gunshot * 0.65;
        }
    }

    setBulletType(type){
        this._bulletType = type;
        this._currenBullet = null;

        //子弹
        this.node.children.forEach((child) => {
            if (child.name != "_sprBullet" + this._bulletType) {
                child.active = false;
            }
            else{
                child.active = true;
                this._currenBullet = child;
            }
        });

        if (this._currenBullet == null) {
            this._currenBullet = this._createDefaultBullet(type);
        }

        if ((type == 99 || type == 100) && this._currenBullet) {
            if (type == 100) {
                this._currenBullet.setScale(1.05);
                this._currenBullet.color = cc.color(85, 58, 30, 255);
                this._currenBullet.opacity = 240;
            }
            else{
                this._currenBullet.setScale(0.85);
                this._currenBullet.color = cc.color(255, 90, 60, 255);
                this._currenBullet.opacity = 255;
            }
        }
        
        //调整子弹角度
        if (this._inGame){
            this.node.angle = Utils.vectorsToDegress(this._dir)-90;
        }
    }

    _applyMutationData(mutationData) {
        if (this._camp != "player" || !mutationData || !mutationData.id) {
            return;
        }

        this._mutationType = mutationData.id;
        this._mutationData = mutationData;
        this._bounceLeft = mutationData.bounceCount || 0;
        this._hasBounced = false;
        this._penetrateLeft = mutationData.penetrateCount || 0;

        if (mutationData.damageRatio && mutationData.damageRatio != 1) {
            this._damage *= mutationData.damageRatio;
        }

        this._refreshMutationVisual();
    }

    _refreshMutationVisual() {
        if (!this._currenBullet || !this._mutationData) {
            return;
        }

        let scale = this._mutationData.scale || 1;
        this._currenBullet.scaleX = Math.abs(this._currenBullet.scaleX) * scale;
        this._currenBullet.scaleY = Math.abs(this._currenBullet.scaleY) * scale;
        if (this._mutationData.color) {
            this._currenBullet.color = this._mutationData.color;
        }
    }

    _createDefaultBullet(type) {
        let bullet = new cc.Node("_sprBullet" + type);
        bullet.parent = this.node;
        bullet.setContentSize(70, 70);
        let graphics = bullet.addComponent(cc.Graphics);

        if (type == 99) {
            graphics.fillColor = cc.color(255, 55, 35, 240);
            graphics.circle(0, 0, 28);
            graphics.fill();
            graphics.fillColor = cc.color(255, 230, 120, 230);
            graphics.circle(0, 0, 13);
            graphics.fill();
            bullet.scale = 1.4;
        }
        else if (type == 100) {
            graphics.fillColor = cc.color(70, 48, 28, 235);
            graphics.circle(0, 0, 22);
            graphics.fill();
            graphics.fillColor = cc.color(24, 18, 14, 220);
            graphics.circle(-8, 3, 9);
            graphics.fill();
            graphics.circle(10, -4, 11);
            graphics.fill();
            bullet.scale = 1.2;
        }
        else if (type == 101) {
            graphics.fillColor = cc.color(200, 140, 30, 240);
            graphics.circle(0, 0, 22);
            graphics.fill();
            graphics.lineWidth = 3;
            graphics.strokeColor = cc.color(255, 200, 50, 220);
            graphics.circle(0, 0, 22);
            graphics.stroke();
            graphics.fillColor = cc.color(255, 180, 40, 200);
            graphics.circle(0, 0, 10);
            graphics.fill();
            bullet.scale = 1.3;
        }
        else{
            graphics.fillColor = cc.color(255, 240, 0, 240);
            graphics.circle(0, 0, 14);
            graphics.fill();
        }

        return bullet;
    }

    //设置tiled map
    setMap(map) {
        this._map = map;
    }

    start(){

    }

    setMultiplayerMeta(bulletId, ownerPlayerId) {
        this._networkBulletId = bulletId || "";
        this._ownerPlayerId = ownerPlayerId == null ? -1 : ownerPlayerId;
        this._multiplayerHitReported = false;
        this._multiplayerEventReported = {};
        if (this._map && this._map.registerMultiplayerBullet && this._networkBulletId) {
            this._map.registerMultiplayerBullet(this._networkBulletId, this.node);
        }
    }

    //每帧调用
    update (dt) {
        if (this._inGame == true && this._isStop == false) {
            if (this._destroyTime != -1) {
                this._destroyTime -= dt;
                
                if (this._destroyTime <= 0) {
                    if (this._bulletType == 100) {
                        this._landOilSpill(this.node.position);
                        this._destroyImmediately();
                    }
                    else if (this._isClusterBomb) {
                        this._spawnClusterSubBullets();
                        this._destroyImmediately();
                    }
                    else{
                        //销毁
                        this.doDestroy();
                    }
                }
                else{
                    if (this._centrifugalState) {
                        this._updateCentrifugalMotion(dt);
                        return;
                    }

                    if (this._portalIgnoreTime > 0) {
                        this._portalIgnoreTime -= dt;
                        if (this._portalIgnoreTime <= 0) {
                            this._portalIgnoreTime = 0;
                            this._portalIgnoreId = "";
                        }
                    }

                    //更新位置
                    let currPosition = this.node.position;
                    let willPosition = currPosition.add(cc.v3(this._dir.mul(this._speed)));
                    this.node.setPosition(willPosition);

                    //黑洞引力
                    if (this._map && this._map._blackHoleAreaData) {
                        let bhData = this._map._blackHoleAreaData;
                        let bulletPos = cc.v2(this.node.position);
                        let toCenter = bhData.center.sub(bulletPos);
                        let dist = toCenter.mag();
                        if (dist < bhData.radius) {
                            if (dist < bhData.destroyRadius) {
                                if (this._map.spawnBlackHoleSwallowFx) {
                                    this._map.spawnBlackHoleSwallowFx(cc.v2(this.node.position));
                                }
                                this._reportMultiplayerEvent("blackHole", bhData.eventId || "", "swallow");
                                this.doDestroy();
                                return;
                            }
                            else {
                                let pullDir = toCenter.normalize();
                                let strength = bhData.gravityStrength / Math.max(dist, 8);
                                this._dir = this._dir.add(pullDir.mul(strength * dt)).normalize();
                                this.node.angle = Utils.vectorsToDegress(this._dir) - 90;
                            }
                        }
                    }

                    //集束炸弹：飞行中不碰撞，到达距离后分裂
                    if (this._isClusterBomb) {
                        this._clusterBombDistance += this._speed * dt * 60;
                        if (this._clusterBombDistance >= this._clusterBombSplitDistance) {
                            this._spawnClusterSubBullets();
                            this._destroyImmediately();
                            return;
                        }
                    }
                    else if (this._map.isMap()) {
                        if (this._map.tryEnterDamageDoubleArea && this._map.tryEnterDamageDoubleArea(this, currPosition, willPosition)) {
                            return;
                        }

                        if (this._map.tryEnterSpeedDoubleArea && this._map.tryEnterSpeedDoubleArea(this, currPosition, willPosition)) {
                            return;
                        }

                        if (this._map.tryEnterSpreadBulletArea && this._map.tryEnterSpreadBulletArea(this, currPosition, willPosition)) {
                            return;
                        }

                        if (this._map.tryEnterCentrifugalRing && this._map.tryEnterCentrifugalRing(this, currPosition, willPosition)) {
                            return;
                        }

                        if (this._map.tryTeleportBullet && this._map.tryTeleportBullet(this, currPosition, willPosition)) {
                            willPosition = this.node.position;
                            currPosition = willPosition;
                        }

                        if (this._bulletType == 100) {
                            let colliderSegment = this._map.getBulletObstacleCollisionSegment
                                ? this._map.getBulletObstacleCollisionSegment(currPosition, willPosition)
                                : (this._map.bulletObstacleCollisionTest(currPosition,willPosition) ? {} : null);
                            if (colliderSegment){
                                this._landOilSpill(currPosition);
                                this._destroyImmediately();
                            }
                        }
                        else{
                            if (this._map.tryHandleCoverBulletCollision
                                && this._map.tryHandleCoverBulletCollision(currPosition, willPosition, this)) {
                                return;
                            }
                            //子弹和坦克检测
                            let hitTank = this._map.bulletEnemyCollisionTest(willPosition, this._camp, this._ownerPlayerId);
                            if (hitTank) {
                                this._handleHitTank(hitTank);
                            }
                            else{
                                //子弹和障碍物检测
                                let colliderSegment = this._map.getBulletObstacleCollisionSegment
                                    ? this._map.getBulletObstacleCollisionSegment(currPosition, willPosition)
                                    : (this._map.bulletObstacleCollisionTest(currPosition,willPosition) ? {} : null);
                                if (colliderSegment){
                                    this._handleObstacleCollision(currPosition, colliderSegment);
                                }
                                else if (this._map.tryBounceBulletOnObstacle
                                    && this._map.tryBounceBulletOnObstacle(this, currPosition, willPosition)) {
                                    // bounced off pink obstacle
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    //销毁
    doDestroy(){
        if (this._isStop) {
            return;
        }
        this._isStop = true;
        if (this._currenBullet) {
            this._currenBullet.active = false;
        }
        this._fire._sprBoom.active = true;
        //爆炸动画
        let self = this;
        this._fire._sprBoom.runAction(cc.sequence(
            cc.spawn(
                cc.fadeIn(0.2),
                cc.scaleTo(0.2,0.5,0.5)
            ),
            cc.callFunc(function(){
                //销毁
                self.node.destroy();
            })
        ));
    }

    _destroyImmediately() {
        if (this._isStop) {
            return;
        }
        this._isStop = true;
        this.node.destroy();
    }

    _handleHitTank(hitTank) {
        let targetId = hitTank.uuid || hitTank["_id"] || hitTank.name;
        if (this._map
            && this._map.isMultiplayerMode
            && this._map.isMultiplayerMode()
            && hitTank.script
            && hitTank.script._multiplayerMode) {
            let targetPlayerId = hitTank.script._multiplayerPlayerId;
            if (!this._multiplayerHitReported
                && this._networkBulletId
                && this._map.getLocalPlayerId
                && this._ownerPlayerId == this._map.getLocalPlayerId()
                && this._map.reportMultiplayerBulletHit
                && targetPlayerId != null
                && targetPlayerId >= 0) {
                this._multiplayerHitReported = true;
                this._map.reportMultiplayerBulletHit(this._networkBulletId, targetPlayerId);
            }
            this.doDestroy();
            return;
        }
        if (this._mutationType == "penetrate" && this._hitTargetIds[targetId]) {
            return;
        }

        let hitDamage = this._damage;
        if (this._hasBounced && hitTank.script && hitTank.script._camp == "player") {
            hitDamage *= 2;
        }
        hitTank.script.beHit(hitDamage, this._damageType);
        if (this._camp == "player" && this._damageType == "crit"
            && this._map.playPlayerCritFeedback) {
            this._map.playPlayerCritFeedback();
        }

        if (this._mutationType == "penetrate" && this._penetrateLeft > 0) {
            this._hitTargetIds[targetId] = true;
            this._penetrateLeft--;
            if (this._penetrateLeft > 0) {
                return;
            }
        }

        this.doDestroy();
    }

    _handleObstacleCollision(currPosition, colliderSegment) {
        if (this._mutationType == "bounce" && this._bounceLeft > 0 && colliderSegment && colliderSegment.A && colliderSegment.B) {
            this._bounceLeft--;
            this._hasBounced = true;
            this._dir = this._reflectDirectionBySegment(this._dir, colliderSegment.A, colliderSegment.B);
            this.node.angle = Utils.vectorsToDegress(this._dir) - 90;
            this.node.setPosition(currPosition.add(cc.v3(this._dir.mul(Math.max(6, this._speed * 0.75)))));
            this._reportMultiplayerEvent("bounce", String(this._bounceLeft));
            return;
        }

        this.doDestroy();
    }

    _landOilSpill(pos) {
        if (this._map && this._map.spawnOilSpill) {
            this._map.spawnOilSpill(cc.v2(pos));
        }
    }

    _reflectDirectionBySegment(dir, A, B) {
        let wallDir = B.sub(A).normalize();
        let normal = cc.v2(-wallDir.y, wallDir.x).normalize();
        let dot = dir.dot(normal);
        let reflectDir = dir.sub(normal.mul(2 * dot));
        if (reflectDir.magSqr() <= 0) {
            return dir.mul(-1);
        }
        return reflectDir.normalize();
    }

    getPortalIgnoreId() {
        return this._portalIgnoreId;
    }

    teleportByPortal(pos, ignorePortalId = "") {
        this.node.setPosition(cc.v3(pos));
        this._portalIgnoreId = ignorePortalId || "";
        this._portalIgnoreTime = 0.08;
        this._reportMultiplayerEvent("portal", ignorePortalId || "");
    }

    hasUsedCentrifugalRing() {
        return this._centrifugalUsed;
    }

    hasUsedDamageDoubleArea() {
        return this._damageDoubleUsed;
    }

    enterDamageDoubleArea(areaData) {
        if (this._damageDoubleUsed || !areaData) {
            return false;
        }

        this._damageDoubleUsed = true;
        this._damage *= (areaData.damageMultiplier || 2);

        let scaleUp = areaData.scaleMultiplier || 1.5;
        if (this._currenBullet) {
            this._currenBullet.scaleX = Math.abs(this._currenBullet.scaleX) * scaleUp;
            this._currenBullet.scaleY = Math.abs(this._currenBullet.scaleY) * scaleUp;
        }

        if (this._map && this._map.spawnDamageDoubleFx) {
            this._map.spawnDamageDoubleFx(cc.v2(this.node.position));
        }
        this._reportMultiplayerEvent("damageDouble", areaData.eventId || "");

        return true;
    }

    hasUsedSpeedDoubleArea() {
        return this._speedDoubleUsed;
    }

    enterSpeedDoubleArea(areaData) {
        if (this._speedDoubleUsed || !areaData) {
            return false;
        }

        this._speedDoubleUsed = true;
        let speedMul = areaData.speedMultiplier || 3;
        this._speed *= speedMul;

        if (this._currenBullet) {
            this._currenBullet.color = cc.color(80, 180, 255, 255);
        }

        if (this._map && this._map.spawnSpeedDoubleFx) {
            this._map.spawnSpeedDoubleFx(cc.v2(this.node.position));
        }
        this._reportMultiplayerEvent("speedDouble", areaData.eventId || "");

        return true;
    }

    _reportMultiplayerEvent(type, eventId = "", reason = "") {
        if (!this._networkBulletId || !type) {
            return;
        }
        let reportKey = type + ":" + (eventId || "");
        if (this._multiplayerEventReported[reportKey]) {
            return;
        }
        this._multiplayerEventReported[reportKey] = true;
        yyp.eventCenter.emit("multiplayer-bullet-event", {
            type: type,
            bulletId: this._networkBulletId,
            eventId: eventId || "",
            reason: reason || "",
        });
    }

    applyMultiplayerBounce(bounceLeft = null) {
        if (this._isStop || this._mutationType != "bounce") {
            return false;
        }
        if (bounceLeft != null && Number.isFinite(bounceLeft)) {
            this._bounceLeft = Math.max(0, bounceLeft);
        }
        else if (this._bounceLeft > 0) {
            this._bounceLeft--;
        }
        else{
            return false;
        }
        this._hasBounced = true;
        return true;
    }

    hasUsedSpreadBulletArea() {
        return this._spreadBulletUsed;
    }

    enterSpreadBulletArea(areaData) {
        if (this._spreadBulletUsed || !areaData) {
            return false;
        }

        this._spreadBulletUsed = true;
        let spreadAngle = areaData.spreadAngle || 20;
        let parentNode = this.node.parent;
        let map = this._map;

        for (let i = 0; i < 2; i++) {
            let angle = (i == 0 ? -1 : 1) * spreadAngle;
            let bdir = Utils.vectorsRotateDegress(this._dir, angle);
            let bpos = cc.v2(this.node.position).add(bdir.mul(12));
            Bullet.createBullet(bpos, bdir, this._gunshot, this._damage, this._speed, this._camp, parentNode, map, this._bulletType, this._mutationData);
        }

        if (this._map && this._map.spawnSpreadBulletFx) {
            this._map.spawnSpreadBulletFx(cc.v2(this.node.position));
        }

        return true;
    }

    enterCentrifugalRing(ringData) {
        if (this._centrifugalUsed || this._centrifugalState || !ringData || !ringData.center) {
            return false;
        }

        let center = cc.v2(ringData.center);
        let centerToBullet = cc.v2(this.node.position).sub(center);
        if (centerToBullet.magSqr() <= 1) {
            centerToBullet = this._dir && this._dir.magSqr() > 0
                ? this._dir.normalize().mul(-(ringData.orbitRadius || 72))
                : cc.v2(-(ringData.orbitRadius || 72), 0);
        }

        let startAngle = Math.atan2(centerToBullet.y, centerToBullet.x);
        let directionSign = ringData.directionSign == null ? -1 : ringData.directionSign;
        let rotateAngle = Math.abs(ringData.rotateAngle == null ? Math.PI * 0.5 : ringData.rotateAngle);
        let orbitRadius = ringData.orbitRadius || Math.max(64, centerToBullet.mag());
        let angularSpeed = ringData.angularSpeed || Math.PI * 4.2;

        this._centrifugalState = {
            center: center,
            orbitRadius: orbitRadius,
            startAngle: startAngle,
            currentAngle: startAngle,
            movedAngle: 0,
            rotateAngle: rotateAngle,
            directionSign: directionSign >= 0 ? 1 : -1,
            angularSpeed: angularSpeed,
            speedBoost: ringData.speedBoost || 1.85,
            damageBoost: ringData.damageBoost || 1.7,
            radiusExpand: ringData.radiusExpand || 18,
            color: ringData.color || cc.color(255, 165, 90, 255),
        };
        this._spawnCentrifugalEnterFx();
        return true;
    }

    _updateCentrifugalMotion(dt) {
        if (!this._centrifugalState) {
            return;
        }

        let state = this._centrifugalState;
        state.movedAngle += state.angularSpeed * dt;
        if (state.movedAngle > state.rotateAngle) {
            state.movedAngle = state.rotateAngle;
        }

        state.currentAngle = state.startAngle + state.directionSign * state.movedAngle;
        let angleProgress = state.rotateAngle > 0 ? state.movedAngle / state.rotateAngle : 1;
        let radius = state.orbitRadius + state.radiusExpand * angleProgress;
        let orbitPos = state.center.add(cc.v2(Math.cos(state.currentAngle), Math.sin(state.currentAngle)).mul(radius));
        this.node.setPosition(cc.v3(orbitPos));

        let tangentDir = state.directionSign > 0
            ? cc.v2(-Math.sin(state.currentAngle), Math.cos(state.currentAngle))
            : cc.v2(Math.sin(state.currentAngle), -Math.cos(state.currentAngle));
        if (tangentDir.magSqr() > 0) {
            this._dir = tangentDir.normalize();
            this.node.angle = Utils.vectorsToDegress(this._dir) - 90;
        }

        let orbitScale = 1 + 0.24 * angleProgress;
        if (this._currenBullet) {
            this._currenBullet.scaleX = orbitScale;
            this._currenBullet.scaleY = orbitScale;
            this._currenBullet.color = state.color;
        }

        if (state.movedAngle >= state.rotateAngle) {
            this._centrifugalState = null;
            this._centrifugalUsed = true;
            this._speed *= state.speedBoost;
            this._damage *= state.damageBoost;
            this._destroyTime *= 1.35;
            this.node.setPosition(cc.v3(orbitPos.add(this._dir.mul(Math.max(18, this._speed * 0.65)))));
            this._spawnCentrifugalReleaseFx(state.color);
        }
    }

    _spawnCentrifugalEnterFx() {
        if (!this._map || !this._map.spawnCentrifugalRingFx) {
            return;
        }
        this._map.spawnCentrifugalRingFx(cc.v2(this.node.position), false);
    }

    _spawnCentrifugalReleaseFx(color) {
        if (!this._map || !this._map.spawnCentrifugalRingFx) {
            return;
        }
        this._map.spawnCentrifugalRingFx(cc.v2(this.node.position), true, color, this._dir, this._speed);
    }

    _spawnClusterSubBullets() {
        if (!this._map) return;

        let count = 8;
        let spreadAngle = 45;
        let startAngle = -(spreadAngle / 2);
        let step = spreadAngle / (count - 1);
        let parentNode = this.node.parent;
        let pos = cc.v2(this.node.position);
        let subGunshot = this._gunshot * 0.4;
        let subDamage = this._damage * 0.5;
        let subSpeed = this._speed * 1.2;

        for (let i = 0; i < count; i++) {
            let angle = startAngle + i * step;
            let bdir = Utils.vectorsRotateDegress(this._dir, angle);
            let bpos = pos.add(bdir.mul(16));
            let offset = (i - (count - 1) / 2) * 6;
            bpos = bpos.add(cc.v2(-bdir.y, bdir.x).mul(offset));
            Bullet.createBullet(bpos, bdir, subGunshot, subDamage, subSpeed, this._camp, parentNode, this._map, null, null);
        }
    }

    //创建子弹
    static createBullet(pos,dir,gunshot,atk,speed,camp,parentNode,map,bulletType = null, mutationData = null, networkMeta = null){
        speed = (camp == "enemy") ? speed*0.8 : speed;

        let bullet = cc.instantiate(map.bulletPrefab);
        bullet.parent = parentNode;
        bullet.setPosition(cc.v3(pos));
        bullet.zIndex = 5000;
        bullet.script.initBullet(dir,gunshot,atk,speed,camp,map._levelId,bulletType,mutationData);
        bullet.script.setMap(map);
        if (networkMeta && bullet.script.setMultiplayerMeta) {
            bullet.script.setMultiplayerMeta(networkMeta.bulletId, networkMeta.ownerPlayerId);
        }

        return bullet;
    }


    //创建子弹(类型/位置/方向/炮管长度/射程/攻击力/目标阵营)
    static createBulletEx(bulletType,pos,dir,wipeLen,gunshot,atk,camp,parentNode,map,speed = 16,mutationData = null, networkMeta = null){
        gunshot = gunshot - wipeLen;
        let bdir = dir;
        let bpos = pos;
        let bullet = null;

        switch(bulletType){
            case 1:{
                bdir = bdir;
                bpos = cc.v2(pos).add(bdir.mul(wipeLen));
                bullet = Bullet.createBullet(bpos,bdir,gunshot,atk,speed,camp,parentNode,map,null,mutationData,networkMeta);

                break;
            }
            case 2:{
                for (let i = 0; i <= 1; i++) {
                    bdir = Utils.vectorsRotateDegress(dir,i*5 - 2.5);
                    bpos = cc.v2(pos).add(bdir.mul(wipeLen));
                    bullet = Bullet.createBullet(bpos,bdir,gunshot,atk,speed,camp,parentNode,map,null,mutationData,networkMeta);
                }
                break;
            }
            case 3:{
                for (let i = 0; i <= 2; i++) {
                    bdir = Utils.vectorsRotateDegress(dir,i*5 - 5);
                    bpos = cc.v2(pos).add(bdir.mul(wipeLen));
                    bullet = Bullet.createBullet(bpos,bdir,gunshot,atk,speed,camp,parentNode,map,null,mutationData,networkMeta);
                }
                break;
            }
            case 4:{
                for (let i = 0; i <= 3; i++) {
                    bdir = Utils.vectorsRotateDegress(dir,i*5 - 7.5);
                    bpos = cc.v2(pos).add(bdir.mul(wipeLen));
                    bullet = Bullet.createBullet(bpos,bdir,gunshot,atk,speed,camp,parentNode,map,null,mutationData,networkMeta);
                }
                break;
            }
            case 5:{
                for (let i = 0; i <= 5; i++) {
                    bdir = Utils.vectorsRotateDegress(dir,i*5 - 12.5);
                    bpos = cc.v2(pos).add(bdir.mul(wipeLen));
                    bullet = Bullet.createBullet(bpos,bdir,gunshot,atk,speed,camp,parentNode,map,null,mutationData,networkMeta);
                }
                break;
            }
            case 99:{
                bdir = bdir;
                bpos = cc.v2(pos).add(bdir.mul(wipeLen));
                bullet = Bullet.createBullet(bpos,bdir,gunshot,atk,speed,camp,parentNode,map,bulletType,mutationData,networkMeta);
                break;
            }
            case 100:{
                bdir = bdir;
                bpos = cc.v2(pos).add(bdir.mul(wipeLen));
                bullet = Bullet.createBullet(bpos,bdir,gunshot,atk,speed,camp,parentNode,map,bulletType,mutationData,networkMeta);
                break;
            }
            case 101:{
                bdir = bdir;
                bpos = cc.v2(pos).add(bdir.mul(wipeLen));
                bullet = Bullet.createBullet(bpos,bdir,gunshot,atk,speed,camp,parentNode,map,bulletType,mutationData,networkMeta);
                break;
            }
            case 11:{
                for (let i = 0; i <= 3; i++) {
                    bdir = Utils.vectorsRotateDegress(dir,i*90);
                    bpos = cc.v2(pos).add(bdir.mul(wipeLen));
                    bullet = Bullet.createBullet(bpos,bdir,gunshot,atk,3,camp,parentNode,map);
                }
                break;
            }
            case 12:{
                for (let i = 0; i < 10; i++) {
                    bdir = Utils.vectorsRotateDegress(dir,36*i);
                    bpos = cc.v2(pos).add(bdir.mul(wipeLen));
                    bullet = Bullet.createBullet(bpos,bdir,gunshot,atk,1.5,camp,parentNode,map);
                }
                break;
            }
        }
    }

}
