import {BaseComponent} from "./base/BaseComponent";
import {Utils} from "./base/Utils";
import { MusicManager } from "./base/MusicManager";
//电子邮件puhalskijsemen@gmail.com
//源码网站 开vpn全局模式打开 http://web3incubators.com/
//电报https://t.me/gamecode999
//网页客服 http://web3incubators.com/kefu.html
const {ccclass, property} = cc._decorator;
const LOW_HP_RATIO = 0.2;
const DEATH_AFTERMATH_DURATION = 5;
const DEATH_AFTERMATH_FADE_IN = 0.12;
const DEATH_AFTERMATH_FADE_OUT = 0.45;

@ccclass
export class Tank extends BaseComponent {

    @property(cc.Prefab)
    bulletPrefab: cc.Prefab = null;
    
    @property(cc.Prefab)
    boomPrefab: cc.Prefab = null;

    //移动,碰撞检测
    _camp       = "";           //阵营
    _radius     = 10;           //碰撞检测半径
    _dir        = cc.v2(1,0);   //当前行进方向
    _barrelDir  = cc.v2(1,0);   //炮管方向
    _ratio      = 0;            //当前速率
    _currentSpeed = 0;          //当前移动速度
    _map        = null;         //tile map 节点

    _hp         = 0;            //当前血量
    _maxHp      = 0;            //最大血量血量
    _atk        = 0;            //攻击力
    _def        = 0;            //防御
    _config:any = {};

    _tankType   = 1;            //坦克类型
    _currentBg  = null;
    _lowHpBarBasePosition = null;
    _lowHpBarFxPlaying = false;
    _lowHpSmokeRoot = null;
    _lowHpSmokeTime = 0;

    onLoad () {
        this._radius = this.node["$CircleCollider"].radius;
        this._dir = Utils.degressToVectors(this._fire._lyBg.angle);
        this._barrelDir = this._dir;
    }
    
    //设置tiled map
    setMap(map) {
        this._map = map;
    }
    
    //设置坦克类型
    setTankType(tankType) {
        this._tankType = tankType;
        this._config = yyp.config.Tank[this._tankType];
        console.log("this._config",this._config)

        //炮身
        this._fire._lyBg.children.forEach((child) => {
            if (child.name != "_sprBg" + this._tankType) {
                child.active = false;
            }
            else{
                child.active = true;
            }
        });
        
        //炮筒
        this._fire._lyBarrel.children.forEach((child) => {
            if (child.name != "_sprBarrel" + this._tankType) {
                child.active = false;
            }
            else{
                child.active = true;
                this._currentBg = child;
            }
        });
    }

    //获取碰撞检测半径
    getRadius() {
        return this._radius;
    }

    //获取玩家的新位置
    _getWillPosition(currPosition, dir, speed) {
        let dis = dir.mul(speed);
        return currPosition.add(dis);
    }

    _getConfigValue(key, defaultValue) {
        let value = this._config ? this._config[key] : null;
        return value == null ? defaultValue : value;
    }

    _getFrameValue(key, defaultValue, dt) {
        return this._getConfigValue(key, defaultValue) * dt * 60;
    }

    _turnDirTo(targetDir, dt) {
        if (!targetDir || targetDir.magSqr() <= 0) {
            return;
        }

        let fromAngle = Utils.vectorsToDegress(this._dir);
        let toAngle = Utils.vectorsToDegress(targetDir);
        let disAngle = toAngle - fromAngle;

        if (disAngle > 180) {
            fromAngle = fromAngle + 360;
            disAngle = toAngle - fromAngle;
        }
        else if (disAngle < -180) {
            fromAngle = fromAngle - 360;
            disAngle = toAngle - fromAngle;
        }

        let maxTurnAngle = this._getFrameValue("AngularSpeed", 10, dt);
        if (maxTurnAngle <= 0 || Math.abs(disAngle) <= maxTurnAngle) {
            this._dir = targetDir.normalize();
            return;
        }

        let nextAngle = fromAngle + (disAngle > 0 ? maxTurnAngle : -maxTurnAngle);
        this._dir = Utils.degressToVectors(Utils.correctionAngle(nextAngle));
    }
    
    // 获取碰撞后的尝试方向
    _getTestDir(P,radius,dir,colliderItems){
        let testDirs = [];

        //获取尝试方向
        if (this._camp == "enemy") {
            for (let i = 1; i < 6; i++) {
                let testDir = Utils.vectorsRotateDegress(dir, 30 * i);
                testDirs.push(testDir);
            }
            for (let i = 1; i < 7; i++) {
                let testDir = Utils.vectorsRotateDegress(dir, -30 * i);
                testDirs.push(testDir);
            }
        }
        else{
            //按最优获取
            for (let i = 0; i < colliderItems.length; i++) {
                let colliderItem = colliderItems[i];
                this._getTestDirs(P,dir,colliderItem,testDirs);
            }
        }

        //检测尝试方向
        for (let i = 0; i < testDirs.length; i++) { 
            let testDir = testDirs[i];
            if (this._circlePassColliderItems(P,radius,testDir,colliderItems) == false){
                return testDir;
            }
        }

        return null;
    }

    //点p为圆心,radius为半径,方向dir的圆,是否会经过colliderItems中的一条线段
    _circlePassColliderItems(P,radius,dir,colliderItems){
        for (let i = 0; i < colliderItems.length; i++) {
            let colliderItem = colliderItems[i];

            let A = colliderItem.collider.offset.add(colliderItem.collider.points[0]);
            let B = colliderItem.collider.offset.add(colliderItem.collider.points[1]);
            if (Utils.circlePassLine(P,radius,dir,A,B)){
                return true;
            }
        }

        return false;
    }
    
    //射线起始点P,方向dir,与线段AB(colliderItem组成)碰撞后的尝试方向列表
    _getTestDirs(P,dir,colliderItem,retDirs){
        let P1 = colliderItem.point;    //collider上距离P最近的点
        let dirPP1 = P1.sub(P).normalize();
        let radianPP1 = cc.v2(dirPP1).signAngle(dir);    // 求方向向量与对比向量间的弧度

        let baseDir = dir;
        let maxDir = radianPP1 > 0 ? Utils.vectorsRotateDegress(baseDir, 90) : Utils.vectorsRotateDegress(baseDir, -90);
        let parallelDegree = this._getParallelDegree(baseDir,maxDir,colliderItem.collider);
        let symbol = radianPP1 > 0 ? 1 : -1;

        for (let i = 1; i <= 6; i++) {
            let offsetDegree = i * 15 * symbol;
            if (parallelDegree) {
                if (symbol > 0 && parallelDegree < offsetDegree) {
                    let testDir = Utils.vectorsRotateDegress(baseDir, parallelDegree);
                    retDirs.push(testDir);
                    parallelDegree = null;
                }
                else if (symbol < 0 && parallelDegree > offsetDegree) {
                    let testDir = Utils.vectorsRotateDegress(baseDir, parallelDegree);
                    retDirs.push(testDir);
                    parallelDegree = null;
                }
            }
            let testDir = Utils.vectorsRotateDegress(baseDir, offsetDegree);
            retDirs.push(testDir);
        }

    }

    //获取平行于collider,且包含在baseDegree,maxDegree的角度(相对baseDir)
    _getParallelDegree(baseDir,maxDir,collider){
        let A = collider.offset.add(collider.points[0]);
        let B = collider.offset.add(collider.points[1]);
        let AB = B.sub(A).normalize();
        let BA = A.sub(B).normalize();

        let radianMax = maxDir.signAngle(baseDir);
        let radianAB = AB.signAngle(baseDir);
        let radianBA = BA.signAngle(baseDir);

        if (radianMax > 0) {
            if (radianAB > 0 && radianAB < radianMax) {
                return -cc.misc.radiansToDegrees(radianAB);
            }
            if (radianBA > 0 && radianBA < radianMax) {
                return -cc.misc.radiansToDegrees(radianBA);
            }
        }
        else if (radianMax < 0) {
            if (radianAB < 0 && radianAB > radianMax) {
                return -cc.misc.radiansToDegrees(radianAB);
            }
            if (radianBA < 0 && radianBA > radianMax) {
                return -cc.misc.radiansToDegrees(radianBA);
            }
        }

        return null;
    }

    //刷新玩家角度
    _refreshAngle(dt = 1 / 60, smoothBody = true){
        //动态修改player角度
        let fromAngle = this._fire._lyBg.angle;
        let toAngle = Utils.vectorsToDegress(this._dir);
        let disAngle = toAngle - fromAngle;

        //使当前角度和目标角度处于同一个维度,以便算出来的偏移角度是最小的
        if (disAngle > 180) {
            fromAngle = fromAngle + 360;
            disAngle = toAngle - fromAngle;
        }
        else if (disAngle < -180) {
            fromAngle = fromAngle - 360;
            disAngle = toAngle - fromAngle;
        }

        let maxTurnAngle = this._getFrameValue("AngularSpeed", 10, dt);
        if (smoothBody == false || maxTurnAngle <= 0) {
            this._fire._lyBg.angle = toAngle;
        }
        else if (disAngle > maxTurnAngle) {
            this._fire._lyBg.angle = this._fire._lyBg.angle + maxTurnAngle;
        }
        else if (disAngle < -maxTurnAngle) {
            this._fire._lyBg.angle = this._fire._lyBg.angle - maxTurnAngle;
        }
        else{
            this._fire._lyBg.angle = toAngle;
        }

        //修正角度在-180~180范围内
        this._fire._lyBg.angle = Utils.correctionAngle(this._fire._lyBg.angle);


        //调整炮管角度
        this._fire._lyBarrel.angle = Utils.vectorsToDegress(this._barrelDir);
        
    }
    
    //被攻击到()
    beHit(damage){
        // cc.log("enemy behit");

        if (this._camp == "player") {
            let a= 1;
            // damage = 10000000000000000;
        }
        else{
            let a= 1;
        }
        //计算伤害
        damage = damage - this._def;
        if (damage < 0) { damage = 0;}

        //计算最新血量
        this._hp -= damage;
        if (this._hp < 0) { this._hp = 0;}
        
        //计算血量条显示百分百
        this.refreshHp();
        
        //血量等于0,进入死亡逻辑
        if (this._hp == 0) {
            this.doDeath();
        }
    }
    
    //计算血量条显示百分百
    refreshHp(){
        let percent = this._hp/this._maxHp;
        this._fire._lifebar.$ProgressBar.progress = percent;
        this._syncLowHpVisualState();
    }

    isLowHp() {
        return this._hp > 0 && this._maxHp > 0 && this._hp / this._maxHp <= LOW_HP_RATIO;
    }

    updateLowHpVisual(dt) {
        this._syncLowHpVisualState();
        if (this.isLowHp()) {
            this._updateLowHpSmoke(dt);
        }
        else{
            this._clearLowHpSmoke();
        }
    }

    _syncLowHpVisualState() {
        if (this.isLowHp()) {
            this._startLowHpBarEffect();
        }
        else{
            this._stopLowHpBarEffect();
        }
    }

    _startLowHpBarEffect() {
        let lifebar = this._fire && this._fire._lifebar;
        if (!lifebar || !cc.isValid(lifebar) || this._lowHpBarFxPlaying) {
            return;
        }

        this._lowHpBarFxPlaying = true;
        this._lowHpBarBasePosition = cc.v3(lifebar.position);
        let basePos = this._lowHpBarBasePosition;
        lifebar.stopAllActions();
        lifebar.opacity = 255;
        lifebar.position = basePos;
        lifebar.runAction(
            cc.repeatForever(
                cc.sequence(
                    cc.spawn(
                        cc.fadeTo(0.2, 135),
                        cc.sequence(
                            cc.moveTo(0.05, basePos.x + 4, basePos.y + 1),
                            cc.moveTo(0.05, basePos.x - 4, basePos.y - 1),
                            cc.moveTo(0.05, basePos.x + 2, basePos.y),
                            cc.moveTo(0.05, basePos.x, basePos.y)
                        )
                    ),
                    cc.fadeTo(0.5, 255),
                    cc.delayTime(0.3)
                )
            )
        );
    }

    _stopLowHpBarEffect() {
        let lifebar = this._fire && this._fire._lifebar;
        if (!lifebar || !cc.isValid(lifebar)) {
            this._lowHpBarFxPlaying = false;
            return;
        }

        lifebar.stopAllActions();
        lifebar.opacity = 255;
        if (this._lowHpBarBasePosition) {
            lifebar.position = this._lowHpBarBasePosition;
        }
        this._lowHpBarFxPlaying = false;
    }

    _updateLowHpSmoke(dt) {
        this._lowHpSmokeTime += dt;
        if (this._lowHpSmokeTime < 0.32) {
            return;
        }

        this._lowHpSmokeTime = 0;
        let root = this._ensureLowHpSmokeRoot();
        if (!root) {
            return;
        }

        let smoke = new cc.Node("_lowHpSmoke");
        smoke.parent = root;
        smoke.zIndex = 80;
        smoke.opacity = 110;
        smoke.position = cc.v3((Math.random() - 0.5) * 18, 12 + Math.random() * 8);

        let graphics = smoke.addComponent(cc.Graphics);
        graphics.fillColor = cc.color(120, 120, 120, 170);
        graphics.circle(0, 0, 7 + Math.random() * 4);
        graphics.fill();

        let driftX = (Math.random() - 0.5) * 20;
        let driftY = 32 + Math.random() * 14;
        smoke.scale = 0.55 + Math.random() * 0.2;
        smoke.runAction(
            cc.sequence(
                cc.spawn(
                    cc.moveBy(1.1, driftX, driftY),
                    cc.scaleTo(1.1, 1.25 + Math.random() * 0.25),
                    cc.fadeOut(1.1)
                ),
                cc.removeSelf()
            )
        );
    }

    _ensureLowHpSmokeRoot() {
        if (this._lowHpSmokeRoot && cc.isValid(this._lowHpSmokeRoot)) {
            return this._lowHpSmokeRoot;
        }

        this._lowHpSmokeRoot = new cc.Node("_lowHpSmokeRoot");
        this._lowHpSmokeRoot.parent = this.node;
        this._lowHpSmokeRoot.setPosition(0, 4);
        this._lowHpSmokeRoot.zIndex = 90;
        return this._lowHpSmokeRoot;
    }

    _clearLowHpSmoke() {
        this._lowHpSmokeTime = 0;
        if (this._lowHpSmokeRoot && cc.isValid(this._lowHpSmokeRoot)) {
            this._lowHpSmokeRoot.destroy();
        }
        this._lowHpSmokeRoot = null;
    }

    _spawnDeathAftermathAt(pos, parentNode = null) {
        let targetParent = parentNode;
        if (!targetParent || !cc.isValid(targetParent)) {
            targetParent = this._getDeathAftermathParent();
        }
        if (!targetParent || !cc.isValid(targetParent)) {
            return;
        }

        let root = new cc.Node("_deathAftermath");
        root.parent = targetParent;
        root.setPosition(cc.v3(pos));
        root.zIndex = this._getDeathAftermathZIndex(pos.y);

        let scorch = this._createDeathScorchNode();
        scorch.parent = root;

        let flameRoot = new cc.Node("_deathFlameRoot");
        flameRoot.parent = root;
        flameRoot.zIndex = 2;
        for (let i = 0; i < 4; i++) {
            this._createDeathFlame(flameRoot, i);
        }

        let smokeRoot = new cc.Node("_deathSmokeRoot");
        smokeRoot.parent = root;
        smokeRoot.zIndex = 3;
        for (let i = 0; i < 3; i++) {
            this._createDeathSmoke(smokeRoot, i);
        }

        root.runAction(
            cc.sequence(
                cc.delayTime(DEATH_AFTERMATH_DURATION),
                cc.removeSelf()
            )
        );
    }

    _getDeathAftermathParent() {
        if (this._map && this._map._fire && this._map._fire._tmLayerObstacle
            && cc.isValid(this._map._fire._tmLayerObstacle)) {
            return this._map._fire._tmLayerObstacle;
        }
        if (this.node.parent && cc.isValid(this.node.parent)) {
            return this.node.parent;
        }
        return null;
    }

    _getDeathAftermathZIndex(y) {
        if (this._map && this._map.judgezIndex) {
            return this._map.judgezIndex(y) - 2;
        }
        return this.node.zIndex - 2;
    }

    _createDeathScorchNode() {
        let scorch = new cc.Node("_deathScorch");
        scorch.opacity = 0;
        scorch.angle = Math.random() * 360;

        let main = new cc.Node("_deathScorchMain");
        main.parent = scorch;
        main.scaleX = 1.9;
        main.scaleY = 0.95;
        let mainGraphics = main.addComponent(cc.Graphics);
        mainGraphics.fillColor = cc.color(28, 24, 24, 155);
        mainGraphics.circle(0, 0, 26);
        mainGraphics.fill();

        let side = new cc.Node("_deathScorchSide");
        side.parent = scorch;
        side.setPosition(18, -6);
        side.scaleX = 1.2;
        side.scaleY = 0.7;
        let sideGraphics = side.addComponent(cc.Graphics);
        sideGraphics.fillColor = cc.color(20, 18, 18, 100);
        sideGraphics.circle(0, 0, 18);
        sideGraphics.fill();

        scorch.runAction(
            cc.sequence(
                cc.fadeTo(DEATH_AFTERMATH_FADE_IN, 210),
                cc.delayTime(DEATH_AFTERMATH_DURATION - DEATH_AFTERMATH_FADE_IN - DEATH_AFTERMATH_FADE_OUT),
                cc.fadeOut(DEATH_AFTERMATH_FADE_OUT)
            )
        );
        return scorch;
    }

    _createDeathFlame(parentNode, index) {
        let wrapper = new cc.Node("_deathFlameWrap" + index);
        wrapper.parent = parentNode;
        wrapper.opacity = 0;
        wrapper.setPosition((index - 1.5) * 14 + (Math.random() - 0.5) * 8, -2 + Math.random() * 10);

        let flame = new cc.Node("_deathFlame" + index);
        flame.parent = wrapper;
        flame.scale = 0.8 + Math.random() * 0.3;

        let outer = flame.addComponent(cc.Graphics);
        outer.fillColor = cc.color(255, 110 + Math.floor(Math.random() * 40), 40, 220);
        outer.moveTo(0, 26);
        outer.bezierCurveTo(12, 14, 14, -2, 0, -16);
        outer.bezierCurveTo(-14, -2, -12, 14, 0, 26);
        outer.fill();
        outer.fillColor = cc.color(255, 220, 110, 235);
        outer.moveTo(0, 16);
        outer.bezierCurveTo(6, 10, 8, 0, 0, -10);
        outer.bezierCurveTo(-8, 0, -6, 10, 0, 16);
        outer.fill();

        let swayX = (Math.random() - 0.5) * 8;
        let baseScale = flame.scale;
        flame.runAction(
            cc.repeatForever(
                cc.sequence(
                    cc.spawn(
                        cc.moveTo(0.24, swayX, 3 + Math.random() * 4),
                        cc.scaleTo(0.24, baseScale * 1.08)
                    ),
                    cc.spawn(
                        cc.moveTo(0.28, -swayX * 0.45, -1),
                        cc.scaleTo(0.28, baseScale * 0.92)
                    )
                )
            )
        );

        wrapper.runAction(
            cc.sequence(
                cc.delayTime(index * 0.04),
                cc.fadeTo(0.1, 255),
                cc.delayTime(DEATH_AFTERMATH_DURATION - 0.8 - index * 0.04),
                cc.fadeOut(0.35)
            )
        );
    }

    _createDeathSmoke(parentNode, index) {
        let smoke = new cc.Node("_deathSmoke" + index);
        smoke.parent = parentNode;
        smoke.opacity = 0;
        smoke.scale = 0.55 + Math.random() * 0.15;
        smoke.setPosition((Math.random() - 0.5) * 16, 12 + index * 4);

        let graphics = smoke.addComponent(cc.Graphics);
        graphics.fillColor = cc.color(65, 65, 65, 120);
        graphics.circle(0, 0, 11 + Math.random() * 3);
        graphics.fill();

        let driftX = (Math.random() - 0.5) * 28;
        let driftY = 36 + Math.random() * 14;
        smoke.runAction(
            cc.sequence(
                cc.delayTime(index * 0.22),
                cc.spawn(
                    cc.fadeTo(0.12, 160),
                    cc.moveBy(0.12, cc.v2(0, 4))
                ),
                cc.spawn(
                    cc.moveBy(1.15 + Math.random() * 0.2, cc.v2(driftX, driftY)),
                    cc.scaleTo(1.15 + Math.random() * 0.2, smoke.scale * 1.7),
                    cc.fadeOut(1.15 + Math.random() * 0.2)
                ),
                cc.removeSelf()
            )
        );
    }

    //执行死亡
    doDeath(){
        this._stopLowHpBarEffect();
        this._clearLowHpSmoke();
        Utils.vibrate();
        if (this._map && this._map.playKillExplosionEffectAt) {
            this._map.playKillExplosionEffectAt(cc.v2(this.node.position));
        }
        else{
            MusicManager.playEffect("boom");
            if (this._map && this._map.playLightScreenShake) {
                this._map.playLightScreenShake();
            }
        }
        this._spawnDeathAftermathAt(this.node.position);
    }
}
