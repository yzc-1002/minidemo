import {BaseComponent} from "./base/BaseComponent";
import {Utils} from "./base/Utils";
import {LocalizedData} from "./base/LocalizedData";
import {EnergyItem} from "./EnergyItem";
import {EnergyEgg} from "./EnergyEgg";
import { MusicManager } from "./base/MusicManager";
import RippleShockwave from "./effect/RippleShockwave";
import {OilPickup} from "./OilPickup";
//电子邮件puhalskijsemen@gmail.com
//源码网站 开vpn全局模式打开 http://web3incubators.com/
//电报https://t.me/gamecode999
//网页客服 http://web3incubators.com/kefu.html
import {Analytics} from "./ad/Analytics";
const {ccclass, property} = cc._decorator;
const KILL_STREAK_WINDOW = 20;
const KILL_BROADCAST_MAX_VISIBLE = 3;
const KILL_BROADCAST_SLOT_HEIGHT = 64;
const KILL_BROADCAST_DURATION = 2.2;
const OIL_SPILL_DURATION = 10;
const OIL_SPILL_RADIUS = 120;
const OIL_SPILL_SLOW_FACTOR = 0.52;
const TAR_SPILL_RADIUS = 120;
const TAR_PICKUP_SINGLEPLAYER_INTERVAL = 6;
const BLACK_HOLE_PICKUP_SINGLEPLAYER_INTERVAL = 9;
const BLACK_HOLE_ZONE_DURATION = 8;
const BLACK_HOLE_ZONE_RADIUS = 100;
const BLACK_HOLE_ZONE_DESTROY_RADIUS = 14;
const BLACK_HOLE_ZONE_GRAVITY = 160;
const CONFIG_PICKUP_USE_DURATION = 20;
const OIL_SPILL_FRAME_UUID = "53a52397-be71-4b1e-bd93-96c5b9a7f2ce";
const COVER_TEST_FRAME_UUID = "f27215a4-32b0-4a3c-b87d-69a3dc03e37a";
const ENERGY_EGG_FRAME_UUID = "5c9b12c3-9fd1-4472-b633-d31d7ce29bf2";
const TREE_GREEN_LARGE_FRAME_UUID = "8d3f2edb-e27b-4029-af69-6c0bb54a056d";
const KILL_TEST_VICTIM_NAMES = ["疾风号", "黑虎机", "钢牙炮手", "赤焰战车", "重锤坦克"];
const KILL_BADGE_FRAME_UUIDS = {
    1: "91b6ef23-19f3-4d75-9e4c-4ee246eee6f7",
    2: "58a666b7-ae8d-4622-82c3-03d89b76627b",
    3: "e957568c-29a0-4e89-84d5-38cd02496537",
    4: "eff4de59-56d1-4ded-a05b-0fbe8c81adff",
    5: "fbdd351f-3d96-4823-9e4a-ea213085f9b7"
};
const KILL_BADGE_TINTS = {
    1: [255, 255, 255],
    2: [205, 127, 50],
    3: [220, 232, 242],
    4: [255, 215, 0],
    5: [186, 102, 255]
};
const MULTIPLAYER_SAFE_ZONE_START_PADDING = 80;
const MULTIPLAYER_SAFE_ZONE_FIXED_RADIUS_RATIO = 0.86;
const MULTIPLAYER_SAFE_ZONE_MIN_RADIUS = 140;
const MULTIPLAYER_SPAWN_EDGE_PADDING = 80;
const MULTIPLAYER_SPAWN_SAFE_PADDING = 56;
const MULTIPLAYER_BUSH_RADIUS = 94;
const MULTIPLAYER_BUSH_SAFE_PADDING = MULTIPLAYER_BUSH_RADIUS + 12;
const MULTIPLAYER_BUSH_MAP_PADDING = 120;
const MAP_GRASS_BUSH_MERGE_GAP = 6;
// 多人草丛默认布点，当前是东南西北中五个方位，后续可直接改这里的 x/y。
const MULTIPLAYER_BUSH_LAYOUT_POINTS = [
    { name: "east", x: 560, y: 0 },
    { name: "south", x: 0, y: -560 },
    { name: "west", x: -560, y: 0 },
    { name: "north", x: 0, y: 560 },
    { name: "center", x: 0, y: 0 },
];

//私有函数,请使用'_'开头
//请修改'NewClass' => 自己的类名
@ccclass
export class GameMap extends BaseComponent {

    @property(cc.Prefab)
    tree01Prefab: cc.Prefab = null;
    
    @property(cc.Prefab)
    tree02Prefab: cc.Prefab = null;

    @property(cc.Prefab)
    mountain01Prefab: cc.Prefab = null;
    
    @property(cc.Prefab)
    mountain02Prefab: cc.Prefab = null;
    
    @property(cc.Prefab)
    mountain03Prefab: cc.Prefab = null;
    
    @property(cc.Prefab)
    mountainPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    grassPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    bulletPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    private enemyPrefab: cc.Prefab = null;
    
    @property(cc.Prefab)
    private playerPrefab: cc.Prefab = null;
    
    @property(cc.Prefab)
    private skillPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    private energyPrefab: cc.Prefab = null;

    //内部变量
    _tiledMap   = null;     //Tiled Map
    _tmGroup    = null;     //普通层
    _tmObj      = null;     //对象层(障碍物)
    _tmBorn     = null;     //对象层(出生点)
    _tmDecal    = null;     //地表贴花层(地图与坦克之间)
    _tmSize     = null;     //地图尺寸
    _tileSize   = null;     //瓦片尺寸

    _colliders  = [];       //碰撞检测列表
    _checkList  = {};       //A*检测列表
    _logicArea  = [];       //逻辑碰撞分区

    _player             = null;     //玩家
    _enemys             = [];       //敌人列表
    _playerBornPos      = null;     //player出生点
    _enemyBornPos       = [];       //敌人出生点列表
    _bornCdTime         = 0;        //敌人生成间隔时间
    _bornEnemyCount     = 0;        //已经出生的敌人数量
    _deathEnemyCount    = 0;        //已经死亡的敌人数量
    _maxEnemyCount      = 0;        //最大敌人数量
    _timeMaxEnemyCount  = 0;        //同屏最大敌人数量
    _skills             = [];       //随机生成的技能
    _energys            = [];       //地图上的能量
    _energyCdTime       = 0;        //能量生成间隔时间
    _tarPickupCdTime    = 0;        //单机焦油拾取物生成间隔
    _blackHolePickupCdTime = 0;     //单机黑洞拾取物生成间隔

    _pause          = false;    //是否处于暂停状态
    _gaming         = false;    //是否处于游戏中 
    _killEffectTestMode = false; //击杀效果测试模式
    _killBroadcastTestMode = false; //击杀广播测试模式
    _playerHitTestMode = false; //受击测试模式
    _upgradeTestMode = false; //升级测试模式
    _shootEffectTestMode = false; //子弹射击测试模式
    _portalTestMode = false; //传送门测试模式
    _centrifugalRingTestMode = false; //离心力圈测试模式
    _coverTestMode = false; //掩体测试模式
    _energyEggTestMode = false; //能量蛋收藏测试模式
    _damageDoubleTestMode = false; //伤害翻倍区域测试模式
    _damageDoubleAreaData = null;
    _multiplayerDamageDoubleAreas = [];
    _speedDoubleTestMode = false; //速度翻倍区域测试模式
    _speedDoubleAreaData = null;
    _multiplayerSpeedDoubleAreas = [];
    _spreadBulletTestMode = false; //子弹扩散区域测试模式
    _spreadBulletAreaData = null;
    _bounceObstacleTestMode = false; //子弹反弹障碍测试模式
    _bounceObstacles = [];
    _blackHoleTestMode = false; //黑洞区域测试模式
    _blackHoleAreaData = null;
    _multiplayerBlackHoleAreas = [];
    _clusterBombTestMode = false; //集束炸弹测试模式
    _multiplayerMode = false; //多人模式
    _multiplayerPlayers = []; //多人玩家列表
    _multiplayerBullets = {}; //多人同步子弹
    _multiplayerEnergyMap = {}; //多人同步能量
    _multiplayerEnergyEggMap = {}; //多人同步能量蛋
    _multiplayerSpecialEventMap = {};
    _multiplayerTarPickupMap = {};
    _multiplayerTarSpillMap = {};
    _multiplayerBlackHolePickupMap = {};
    _multiplayerBlackHoleZoneMap = {};
    _multiplayerPickupMap = {};
    _multiplayerEnergyWellMap = {};
    _multiplayerSafeZone = null;
    _multiplayerSafeZoneNode = null;
    _multiplayerCoverMap = {};
    _pendingTarThrowMap = {};
    _pendingBlackHoleThrowMap = {};
    _multiplayerPendingCoverToggleId = null;
    _multiplayerCoverTogglePendingFrames = 0;
    _multiplayerPendingCoverAction = null;
    _multiplayerPendingInteraction = null;
    _localPlayerId = 0;       //本地玩家ID
    _multiplayerSpawnSlots = []; //多人出生槽位
    _levelId        = 1;        //当前关卡id
    _levelConfig    = null;     //当前关卡配置

    _roamFlg        = false;          //漫游标记
    _roamDir        = cc.v2(1,0);     //漫游方向

    _playerLastPos  = 0;
    _rippleDistortionEffect = null;
    _rippleCaptureCamera = null;
    _rippleCaptureCameraNode = null;
    _killBroadcastLayer = null;
    _killBroadcastEntries = [];
    _killBadgeLayer = null;
    _killBadgeActiveNode = null;
    _killBadgeFrames = {};
    _killBadgeLoading = {};
    _killStreakCount = 0;
    _killStreakRemain = 0;
    _portalPairs = [];
    _centrifugalRingData = null;
    _oilSpills = [];
    _oilShellPreviewNode = null;
    _oilSpillFrame = null;
    _oilSpillFrameLoading = false;
    _oilSpillFrameCallbacks = [];
    _coverTestCovers = [];
    _coverTestFrame = null;
    _coverTestFrameLoading = false;
    _coverTestFrameCallbacks = [];
    _coverTestEnemy = null;
    _energyEggFrame = null;
    _energyEggFrameLoading = false;
    _energyEggFrameCallbacks = [];
    _energyEggBushFrame = null;
    _energyEggBushFrameLoading = false;
    _energyEggBushFrameCallbacks = [];
    _energyEggs = [];
    _energyEggBushes = [];
    _multiplayerBushes = [];
    _mapGrassBushTiles = [];
    _mapGrassBushes = [];

    //加载完成
    onLoad () {
        //开启碰撞监听
        // cc.director.getCollisionManager().enabled = true;

        // //开启绘制碰撞组件的形状
        // cc.director.getCollisionManager().enabledDebugDraw  = true;

        // // 显示碰撞组件的包围盒
        // cc.director.getCollisionManager().enabledDrawBoundingBox = true;

        //初始化变量
        this._initVariable();

        //初始化事件
        this._initEvent();

        //初始化tiled map 的对象(障碍物)
        this._initTmObstacle();
        
        //初始化tiled map 的对象(出生点)
        this._initTmBorn();
        this._preloadRippleDistortionEffect();
        this._preloadKillBroadcastBadgeFrames();
        this._preloadOilSpillFrame();
        this._preloadCoverTestFrame();
        this._preloadEnergyEggFrame();
        this._preloadEnergyEggBushFrame();

    }

    onDestroy() {
        this._destroyRippleCaptureResources();
        this._destroyKillBroadcastUi();
        this._destroyKillBadgeUi();
        //销毁事件
        this._destroyEvent();
    }
    
    //初始化变量
    _initVariable() {
        this._tiledMap = this.node["$TiledMap"];
        this._tmGroup = this._fire._tmLayerGroup.$TiledLayer;
        // this._fire._tmLayerGroup.active = false;
        this._tmObj = this._fire._tmLayerObstacle.$TiledObjectGroup;
        this._tmBorn = this._fire._tmLayerBorn.$TiledObjectGroup;
        this._tmDecal = this._ensureDecalLayer();
        this._tmSize = this.node.getContentSize();
        // this._tmSize = new cc.Size(this._tiledMap.getMapSize().width * this._tiledMap.getTileSize().width, this._tiledMap.getMapSize().height * this._tiledMap.getTileSize().height);
        this._tileSize = this._tiledMap.getTileSize();
        this._mapGrassBushTiles = [];
        this._mapGrassBushes = [];
    }

    _ensureDecalLayer() {
        if (this._fire._tmLayerDecal && cc.isValid(this._fire._tmLayerDecal)) {
            return this._fire._tmLayerDecal;
        }

        let layer = new cc.Node("_tmLayerDecal");
        layer.parent = this.node;
        layer.setContentSize(this.node.getContentSize());
        layer.setAnchorPoint(0.5, 0.5);
        layer.setPosition(0, 0);

        let obstacleIndex = this._fire._tmLayerObstacle ? this._fire._tmLayerObstacle.getSiblingIndex() : this.node.childrenCount;
        layer.setSiblingIndex(Math.max(0, obstacleIndex));
        this._fire._tmLayerDecal = layer;
        return layer;
    }

    //初始化事件
    _initEvent() {
        this.node.on(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
    }

    //销毁事件
    _destroyEvent() {
        this.node.off(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
    }

    //初始化tiled map 的对象(障碍物)
    _initTmObstacle(){
        let _startTime = (new Date()).valueOf();
        let objects = this._tmObj.getObjects();
        console.log("objects11",objects)
        this._mapGrassBushTiles = [];
        this._mapGrassBushes = [];
        for (let i = 0; i < objects.length; i++) {
            let obj = objects[i];
            
            //获取位置
            let tiledPos = cc.v2(obj.offset.x + obj.width/2, obj.offset.y + obj.height/2);
            let offset = this._tilePosToGamePos(tiledPos);

            if (obj.name != "") {
                let obstacle;
                if (obj.name == "tree01") {
                    obstacle = cc.instantiate(this.tree01Prefab);
                }
                else if (obj.name == "tree02") {
                    obstacle = cc.instantiate(this.tree02Prefab);
                }
                else if (obj.name == "mountain01") {
                    obstacle = cc.instantiate(this.mountain01Prefab);
                }
                else if (obj.name == "mountain02") {
                    obstacle = cc.instantiate(this.mountain02Prefab);
                }
                else if (obj.name == "mountain03") {
                    obstacle = cc.instantiate(this.mountain03Prefab);
                }
                else if (obj.name == "mountain") {
                    obstacle = cc.instantiate(this.mountainPrefab);
                }
                else if (obj.name == "grass") {
                    obstacle = cc.instantiate(this.grassPrefab);
                }
                
                obstacle.parent = this._fire._tmLayerObstacle;
                obstacle.position = cc.v3(offset);
                obstacle.zIndex = this.judgezIndex(offset.y);
                if (obj.name == "grass") {
                    let grassTile = this._buildMapGrassBushTileData(obj, offset, obstacle);
                    if (grassTile) {
                        this._mapGrassBushTiles.push(grassTile);
                    }
                }
            }

            if (obj.name == "grass") {
                continue;
            }
            for (let j = 0; j < obj.polylinePoints.length - 1; j++) {
                let start = obj.polylinePoints[j];
                let end = obj.polylinePoints[j+1];
                
                //创建collider line
                let collider = this.node.addComponent(cc.PolygonCollider);
                collider.offset = offset;
                collider.tag = obj.name;
                collider.points[0] = cc.v2(start);
                collider.points[1] = cc.v2(end);
                collider.points.splice(2,2);
                this._colliders.push(collider);
            }

        }
        this._rebuildMapGrassBushes();

        let _endTime = (new Date()).valueOf();
        let cost = _endTime - _startTime;
        // cc.log("++++++++++++_initTmObstacle time1 ",cost);
        _startTime = (new Date()).valueOf();

        /////////////////////
        let logicWidth = this._tmSize.width/4;
        let logicHeight = this._tmSize.height/4;
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 6; y++) {
                
                let area:any = [];
                area.x = x*logicWidth-this._tmSize.width/2;
                area.y = y*logicHeight-this._tmSize.height/2;
                area.width = logicWidth;
                area.height = logicHeight;

                let rect = new cc.Rect(area.x-10,area.y-10,logicWidth+20,logicHeight+20);
                
                for (let i = 0; i < this._colliders.length; i++) {
                    let collider = this._colliders[i];

                    let A = collider.offset.add(collider.points[0]);
                    let B = collider.offset.add(collider.points[1]);
                    if (this._lineInRect(A,B,rect)) {
                        area.push({A:A,B:B});
                    }
                }
                this._logicArea.push(area);

            }
        }
        /////////////////////

        _endTime = (new Date()).valueOf();
        cost = _endTime - _startTime;
        // cc.log("++++++++++++_initTmObstacle time2 ",cost);

    }

    //初始化tiled map 的对象(出生点)
    _initTmBorn(){
        let objects = this._tmBorn.getObjects();
        for (let i = 0; i < objects.length; i++) {
            let obj = objects[i];
            let offset = this._tilePosToGamePos(obj.offset);
            if (obj.name == "player") {
                this._playerBornPos = offset;
            }
            else{
                let tile = this.gamePosToTile(offset);
                let pos = cc.v3(this.tileToGamePos(tile))
                this._enemyBornPos.push(pos);
                // this._tmGroup.setTileGIDAt(5, tile); 
            }
        }

    
    }

    start() {
        let _startTime = (new Date()).valueOf();
        this._checkList = this.initCheckList();
        let _endTime = (new Date()).valueOf();
        let cost = _endTime - _startTime;
        // cc.log("+cost time ",cost);
    }
    
    //生成player
    createPlayer() {
        let playerType = LocalizedData.getIntItem("_current_player_type_",1);
        let playerLevel = LocalizedData.getIntItem(`_player_${playerType}_`, 1);

        this._player = cc.instantiate(this.playerPrefab);
        this._player.parent = this._fire._tmLayerObstacle;
        this._player.position = this._playerBornPos;
        this._player.script.setMap(this);
        this._player.script.setPlayerType(playerType,playerLevel);
        this._player.script.setInGame();
    }

    //生成一个敌人
    createEnemy() {
        if (this.isTestMode()) {
            return;
        }

        //随机精英怪
        let ememyType = 11;
        let random = Math.random()*100;
        if (random < 4) { ememyType = 12; }
        if (random < 1)  { ememyType = 13; }

        let enemy = cc.instantiate(this.enemyPrefab);
        enemy.parent = this._fire._tmLayerObstacle;
        enemy.position = this._enemyBornPos[Math.floor(Math.random()*this._enemyBornPos.length)];
        enemy.script.setMap(this);
        enemy.script.setTarget(this._player);
        enemy.script.setEnemyType(ememyType,this._levelId);
        this._enemys.push(enemy);
    }

    //生成一个受击测试敌人
    createPlayerHitTestEnemy() {
        if (!this._player || !cc.isValid(this._player)) {
            return;
        }

        let enemy = cc.instantiate(this.enemyPrefab);
        enemy.parent = this._fire._tmLayerObstacle;
        let pos = cc.v2(this._player.position).add(cc.v2(230, 0));
        enemy.position = cc.v3(this.clampMapInnerPosition(pos, 80));
        enemy.script.setMap(this);
        enemy.script.setTarget(this._player);
        enemy.script.setEnemyType(11,this._levelId);
        enemy.script._config = Object.assign({}, enemy.script._config);
        enemy.script._config.AttackRadius = 520;
        enemy.script._config.BulletCodeTime = 0.45;
        enemy.script._bulletCodeTime = enemy.script._config.BulletCodeTime;
        enemy.zIndex = this.judgezIndex(enemy.y);
        this._enemys.push(enemy);
    }

    //生成一个残血测试敌人
    createKillEffectTestEnemy() {
        if (!this._player || !cc.isValid(this._player)) {
            return;
        }

        let enemy = cc.instantiate(this.enemyPrefab);
        enemy.parent = this._fire._tmLayerObstacle;
        let pos = cc.v2(this._player.position).add(cc.v2(260, 0));
        enemy.position = cc.v3(this.clampMapInnerPosition(pos, 80));
        enemy.script.setMap(this);
        enemy.script.setTarget(this._player);
        enemy.script.setEnemyType(11,this._levelId);
        enemy.script._hp = 1;
        enemy.script.refreshHp();
        enemy.zIndex = this.judgezIndex(enemy.y);
        this._enemys.push(enemy);
    }

    createKillBroadcastTestEnemies() {
        if (!this._player || !cc.isValid(this._player)) {
            return;
        }

        let count = 5;
        let radius = 260;
        for (let i = 0; i < count; i++) {
            let enemy = cc.instantiate(this.enemyPrefab);
            enemy.parent = this._fire._tmLayerObstacle;
            let angle = Math.PI * 2 * i / count - Math.PI * 0.5;
            let pos = cc.v2(this._player.position).add(cc.v2(Math.cos(angle) * radius, Math.sin(angle) * radius));
            enemy.position = cc.v3(this.clampMapInnerPosition(pos, 90));
            enemy.script.setMap(this);
            enemy.script.setTarget(this._player);
            enemy.script.setEnemyType(11, this._levelId);
            enemy.script._hp = 1;
            enemy.script.refreshHp();
            enemy.script.enabled = false;
            enemy["_killVictimName"] = KILL_TEST_VICTIM_NAMES[i] || ("敌方" + (i + 1) + "号");
            enemy.zIndex = this.judgezIndex(enemy.y);
            this._enemys.push(enemy);
        }
    }

    //生成一个残血状态展示敌人
    createLowHpTestEnemy() {
        if (!this._player || !cc.isValid(this._player)) {
            return;
        }

        let enemy = cc.instantiate(this.enemyPrefab);
        enemy.parent = this._fire._tmLayerObstacle;
        let pos = cc.v2(this._player.position).add(cc.v2(260, 0));
        enemy.position = cc.v3(this.clampMapInnerPosition(pos, 80));
        enemy.script.setMap(this);
        enemy.script.setTarget(this._player);
        enemy.script.setEnemyType(11,this._levelId);
        enemy.script._config = Object.assign({}, enemy.script._config);
        enemy.script._config.AttackRadius = 9999;
        enemy.script._config.BulletCodeTime = 1.2;
        enemy.script._bulletCodeTime = enemy.script._config.BulletCodeTime;
        enemy.script._hp = Math.max(1, Math.floor(enemy.script._maxHp * 0.18));
        if (enemy.script._hp >= enemy.script._maxHp) {
            enemy.script._hp = Math.max(1, enemy.script._maxHp - 1);
        }
        enemy.script.refreshHp();
        enemy.zIndex = this.judgezIndex(enemy.y);
        this._enemys.push(enemy);
    }

    //生成一个射击特效测试木桩
    createShootEffectTestEnemy() {
        if (!this._player || !cc.isValid(this._player)) {
            return;
        }

        let enemy = cc.instantiate(this.enemyPrefab);
        enemy.parent = this._fire._tmLayerObstacle;
        let pos = cc.v2(this._player.position).add(cc.v2(320, 0));
        enemy.position = cc.v3(this.clampMapInnerPosition(pos, 90));
        enemy.script.setMap(this);
        enemy.script.setTarget(this._player);
        enemy.script.setEnemyType(11, this._levelId);
        enemy.script._config = Object.assign({}, enemy.script._config);
        enemy.script._hp = 99999;
        enemy.script._maxHp = 99999;
        enemy.script.refreshHp();
        enemy.script.enabled = false;
        enemy.zIndex = this.judgezIndex(enemy.y);
        this._enemys.push(enemy);
    }

    createPortalTestEnemy(pos) {
        let enemy = cc.instantiate(this.enemyPrefab);
        enemy.parent = this._fire._tmLayerObstacle;
        enemy.position = cc.v3(this.clampMapInnerPosition(pos, 90));
        enemy.script.setMap(this);
        enemy.script.setTarget(this._player);
        enemy.script.setEnemyType(11, this._levelId);
        enemy.script._hp = 1;
        enemy.script._maxHp = 1;
        enemy.script.refreshHp();
        enemy.script.enabled = false;
        enemy.zIndex = this.judgezIndex(enemy.y);
        this._enemys.push(enemy);
        return enemy;
    }

    _clearPortalTestNodes() {
        this._portalPairs = [];
        let children = this._fire._tmLayerObstacle.children.slice();
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (!cc.isValid(child)) {
                continue;
            }
            if (child.name == "_portalGateA"
                || child.name == "_portalGateB"
                || child.name == "_portalLinkFx"
                || child.name == "_portalHintLabel"
                || child.name == "_portalWarpFx") {
                child.destroy();
            }
        }
    }

    _createPortalGate(name, pos, color, labelText) {
        let gate = new cc.Node(name);
        gate.parent = this._fire._tmLayerObstacle;
        gate.setPosition(cc.v3(pos));
        gate.zIndex = 5600;

        let ring = gate.addComponent(cc.Graphics);
        ring.lineWidth = 8;
        ring.strokeColor = color;
        ring.circle(0, 0, 42);
        ring.stroke();
        ring.lineWidth = 3;
        ring.strokeColor = cc.color(255, 255, 255, 180);
        ring.circle(0, 0, 26);
        ring.stroke();
        ring.fillColor = cc.color(color.r, color.g, color.b, 34);
        ring.circle(0, 0, 36);
        ring.fill();

        let glow = new cc.Node("_portalGlow");
        glow.parent = gate;
        let glowGraphics = glow.addComponent(cc.Graphics);
        glowGraphics.fillColor = cc.color(color.r, color.g, color.b, 72);
        glowGraphics.circle(0, 0, 54);
        glowGraphics.fill();
        glow.opacity = 140;
        glow.scale = 0.88;
        glow.runAction(cc.repeatForever(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.45, 1.08),
                cc.fadeTo(0.45, 225)
            ),
            cc.spawn(
                cc.scaleTo(0.45, 0.88),
                cc.fadeTo(0.45, 110)
            )
        )));

        let labelNode = new cc.Node("_portalLabel");
        labelNode.parent = gate;
        labelNode.setPosition(0, 0);
        labelNode.setContentSize(80, 48);
        let label = labelNode.addComponent(cc.Label);
        label.string = labelText;
        label.fontSize = 28;
        label.lineHeight = 32;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;

        return gate;
    }

    _createPortalHintLabel(pos) {
        let hint = new cc.Node("_portalHintLabel");
        hint.parent = this._fire._tmLayerObstacle;
        hint.setPosition(cc.v3(pos.x, pos.y + 74, 0));
        hint.zIndex = 5605;
        hint.opacity = 220;
        hint.color = cc.color(230, 245, 255, 255);
        hint.setContentSize(320, 34);
        let label = hint.addComponent(cc.Label);
        label.string = "向 A 门开火，子弹会从 B 门穿出";
        label.fontSize = 22;
        label.lineHeight = 26;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        return hint;
    }

    _createPortalLinkFx(fromPos, toPos) {
        let fx = new cc.Node("_portalLinkFx");
        fx.parent = this._fire._tmLayerObstacle;
        fx.zIndex = 5400;

        let graphics = fx.addComponent(cc.Graphics);
        graphics.lineWidth = 4;
        graphics.strokeColor = cc.color(110, 255, 245, 120);
        graphics.moveTo(fromPos.x, fromPos.y);
        graphics.lineTo(toPos.x, toPos.y);
        graphics.stroke();
        fx.opacity = 120;
        fx.runAction(cc.repeatForever(cc.sequence(
            cc.fadeTo(0.35, 210),
            cc.fadeTo(0.35, 90)
        )));
        return fx;
    }

    createPortalTestSetup() {
        if (!this._player || !cc.isValid(this._player)) {
            return;
        }

        this._clearPortalTestNodes();

        let playerPos = cc.v2(this._player.position);
        let entryPos = this.clampMapInnerPosition(playerPos.add(cc.v2(220, 0)), 90);
        let exitPos = this.clampMapInnerPosition(playerPos.add(cc.v2(-140, 180)), 90);
        let enemyPos = this.clampMapInnerPosition(exitPos.add(cc.v2(280, 0)), 90);

        this._createPortalGate("_portalGateA", entryPos, cc.color(90, 215, 255, 255), "A");
        this._createPortalGate("_portalGateB", exitPos, cc.color(255, 120, 220, 255), "B");
        this._createPortalLinkFx(entryPos, exitPos);
        this._createPortalHintLabel(entryPos);
        this.createPortalTestEnemy(enemyPos);

        this._portalPairs.push({
            id: "portalA",
            pos: entryPos,
            radius: 44,
            exitId: "portalB",
            exitPos: exitPos
        });
        this._portalPairs.push({
            id: "portalB",
            pos: exitPos,
            radius: 44,
            exitId: "portalA",
            exitPos: entryPos
        });
    }

    _spawnPortalWarpFx(pos, color) {
        let fx = new cc.Node("_portalWarpFx");
        fx.parent = this._fire._tmLayerObstacle;
        fx.setPosition(cc.v3(pos));
        fx.zIndex = 5700;
        fx.opacity = 220;
        fx.scale = 0.35;

        let graphics = fx.addComponent(cc.Graphics);
        graphics.lineWidth = 6;
        graphics.strokeColor = color;
        graphics.circle(0, 0, 26);
        graphics.stroke();
        graphics.lineWidth = 3;
        graphics.strokeColor = cc.color(255, 255, 255, 210);
        graphics.circle(0, 0, 14);
        graphics.stroke();

        fx.runAction(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.16, 1.7),
                cc.fadeOut(0.16)
            ),
            cc.removeSelf()
        ));
    }

    _clearCentrifugalRingTestNodes() {
        this._centrifugalRingData = null;
        let children = this._fire._tmLayerObstacle.children.slice();
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (!cc.isValid(child)) {
                continue;
            }
            if (child.name == "_centrifugalRing"
                || child.name == "_centrifugalRingHint"
                || child.name == "_centrifugalRingGuide"
                || child.name == "_centrifugalRingFx") {
                child.destroy();
            }
        }
    }

    _createCentrifugalRingNode(pos, radius, color) {
        let ring = new cc.Node("_centrifugalRing");
        ring.parent = this._fire._tmLayerObstacle;
        ring.setPosition(cc.v3(pos));
        ring.zIndex = 5650;

        let glow = new cc.Node("_ringGlow");
        glow.parent = ring;
        let glowGraphics = glow.addComponent(cc.Graphics);
        glowGraphics.fillColor = cc.color(color.r, color.g, color.b, 40);
        glowGraphics.circle(0, 0, radius + 26);
        glowGraphics.fill();
        glow.opacity = 160;
        glow.scale = 0.84;
        glow.runAction(cc.repeatForever(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.45, 1.06),
                cc.fadeTo(0.45, 220)
            ),
            cc.spawn(
                cc.scaleTo(0.45, 0.84),
                cc.fadeTo(0.45, 120)
            )
        )));

        let graphics = ring.addComponent(cc.Graphics);
        graphics.lineWidth = 8;
        graphics.strokeColor = color;
        graphics.circle(0, 0, radius);
        graphics.stroke();
        graphics.lineWidth = 4;
        graphics.strokeColor = cc.color(255, 246, 220, 180);
        graphics.circle(0, 0, radius - 15);
        graphics.stroke();
        graphics.fillColor = cc.color(color.r, color.g, color.b, 24);
        graphics.circle(0, 0, radius - 6);
        graphics.fill();

        for (let i = 0; i < 3; i++) {
            let arc = new cc.Node("_ringArc" + i);
            arc.parent = ring;
            arc.angle = i * 120;
            let arcGraphics = arc.addComponent(cc.Graphics);
            arcGraphics.lineWidth = 6;
            arcGraphics.strokeColor = cc.color(255, 255, 255, 220);
            arcGraphics.arc(0, 0, radius + 6, -Math.PI * 0.2, Math.PI * 0.32, false);
            arcGraphics.stroke();
        }
        ring.runAction(cc.repeatForever(cc.rotateBy(1.2, -180)));
        return ring;
    }

    _createCentrifugalRingGuide(fromPos, toPos) {
        let guide = new cc.Node("_centrifugalRingGuide");
        guide.parent = this._fire._tmLayerObstacle;
        guide.zIndex = 5500;

        let graphics = guide.addComponent(cc.Graphics);
        graphics.lineWidth = 4;
        graphics.strokeColor = cc.color(255, 184, 112, 120);
        graphics.moveTo(fromPos.x, fromPos.y);
        graphics.lineTo(toPos.x, toPos.y);
        graphics.stroke();
        guide.opacity = 120;
        guide.runAction(cc.repeatForever(cc.sequence(
            cc.fadeTo(0.3, 210),
            cc.fadeTo(0.3, 90)
        )));
        return guide;
    }

    _createCentrifugalRingHint(pos) {
        let hint = new cc.Node("_centrifugalRingHint");
        hint.parent = this._fire._tmLayerObstacle;
        hint.setPosition(cc.v3(pos.x, pos.y + 100, 0));
        hint.zIndex = 5660;
        hint.opacity = 225;
        hint.color = cc.color(255, 235, 205, 255);
        hint.setContentSize(420, 58);
        let label = hint.addComponent(cc.Label);
        label.string = "直线射入离心力圈，子弹会绕圈加速后甩出";
        label.fontSize = 22;
        label.lineHeight = 28;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        return hint;
    }

    createCentrifugalRingTestEnemy(pos) {
        let enemy = cc.instantiate(this.enemyPrefab);
        enemy.parent = this._fire._tmLayerObstacle;
        enemy.position = cc.v3(this.clampMapInnerPosition(pos, 90));
        enemy.script.setMap(this);
        enemy.script.setTarget(this._player);
        enemy.script.setEnemyType(11, this._levelId);
        enemy.script._hp = 99999;
        enemy.script._maxHp = 99999;
        enemy.script.refreshHp();
        enemy.script.enabled = false;
        enemy.zIndex = this.judgezIndex(enemy.y);
        this._enemys.push(enemy);
        return enemy;
    }

    createCentrifugalRingTestSetup() {
        if (!this._player || !cc.isValid(this._player)) {
            return;
        }

        this._clearCentrifugalRingTestNodes();

        let playerPos = cc.v2(this._player.position);
        let center = this.clampMapInnerPosition(playerPos.add(cc.v2(220, 0)), 120);
        let radius = 82;
        let enemyPos = this.clampMapInnerPosition(center.add(cc.v2(310, 92)), 100);
        let color = cc.color(255, 170, 96, 255);

        this._createCentrifugalRingNode(center, radius, color);
        this._createCentrifugalRingGuide(playerPos, center);
        this._createCentrifugalRingHint(center);
        this.createCentrifugalRingTestEnemy(enemyPos);

        this._centrifugalRingData = {
            id: "centrifugalA",
            center: center,
            triggerRadius: radius - 10,
            orbitRadius: radius + 2,
            rotateAngle: Math.PI * 0.52,
            angularSpeed: Math.PI * 5.2,
            directionSign: -1,
            speedBoost: 1.95,
            damageBoost: 1.8,
            radiusExpand: 24,
            color: color,
        };
    }

    spawnCentrifugalRingFx(pos, isRelease = false, color = null, dir = null, speed = 0) {
        let fx = new cc.Node("_centrifugalRingFx");
        fx.parent = this._fire._tmLayerObstacle;
        fx.setPosition(cc.v3(pos));
        fx.zIndex = 5690;
        fx.opacity = 220;
        fx.scale = isRelease ? 0.45 : 0.32;

        let effectColor = color || cc.color(255, 170, 96, 255);
        let graphics = fx.addComponent(cc.Graphics);
        graphics.lineWidth = isRelease ? 7 : 5;
        graphics.strokeColor = effectColor;
        graphics.circle(0, 0, isRelease ? 26 : 18);
        graphics.stroke();
        graphics.lineWidth = 3;
        graphics.strokeColor = cc.color(255, 255, 255, 210);
        graphics.circle(0, 0, isRelease ? 12 : 8);
        graphics.stroke();

        if (isRelease && dir && dir.magSqr() > 0) {
            let tail = new cc.Node("_centrifugalRingFxTail");
            tail.parent = fx;
            tail.angle = Utils.vectorsToDegress(dir) - 90;
            let tailGraphics = tail.addComponent(cc.Graphics);
            tailGraphics.fillColor = cc.color(effectColor.r, effectColor.g, effectColor.b, 160);
            tailGraphics.moveTo(0, 34 + Math.min(28, speed * 0.6));
            tailGraphics.lineTo(-10, 8);
            tailGraphics.lineTo(10, 8);
            tailGraphics.close();
            tailGraphics.fill();
        }

        fx.runAction(cc.sequence(
            cc.spawn(
                cc.scaleTo(isRelease ? 0.18 : 0.12, isRelease ? 1.8 : 1.35),
                cc.fadeOut(isRelease ? 0.18 : 0.12)
            ),
            cc.removeSelf()
        ));
    }

    _clearDamageDoubleTestNodes() {
        this._damageDoubleAreaData = null;
        this._multiplayerDamageDoubleAreas = [];
        let children = this._fire._tmLayerObstacle.children.slice();
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (!cc.isValid(child)) {
                continue;
            }
            if (child.name == "_damageDoubleArea" || child.name == "_damageDoubleFx") {
                child.destroy();
            }
        }
    }

    _createDamageDoubleAreaNode(pos, radius, color) {
        let area = new cc.Node("_damageDoubleArea");
        area.parent = this._fire._tmLayerObstacle;
        area.setPosition(cc.v3(pos));
        area.zIndex = 5650;

        let glow = new cc.Node("_damageDoubleGlow");
        glow.parent = area;
        let glowGraphics = glow.addComponent(cc.Graphics);
        glowGraphics.fillColor = cc.color(255, 0, 0, 35);
        glowGraphics.circle(0, 0, radius + 20);
        glowGraphics.fill();
        glow.opacity = 160;
        glow.scale = 0.85;
        glow.runAction(cc.repeatForever(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.5, 1.08),
                cc.fadeTo(0.5, 220)
            ),
            cc.spawn(
                cc.scaleTo(0.5, 0.85),
                cc.fadeTo(0.5, 120)
            )
        )));

        let graphics = area.addComponent(cc.Graphics);
        graphics.lineWidth = 6;
        graphics.strokeColor = cc.color(255, 30, 30, 255);
        graphics.circle(0, 0, radius);
        graphics.stroke();
        graphics.fillColor = cc.color(255, 0, 0, 30);
        graphics.circle(0, 0, radius - 4);
        graphics.fill();

        let innerRing = new cc.Node("_damageDoubleInnerRing");
        innerRing.parent = area;
        let innerGraphics = innerRing.addComponent(cc.Graphics);
        innerGraphics.lineWidth = 3;
        innerGraphics.strokeColor = cc.color(255, 100, 100, 150);
        let segments = 24;
        let dashLen = Math.PI * 2 / segments;
        for (let i = 0; i < segments; i += 2) {
            let startAngle = i * dashLen;
            let endAngle = (i + 1) * dashLen;
            innerGraphics.arc(0, 0, radius - 12, startAngle, endAngle, false);
            innerGraphics.stroke();
        }
        innerRing.runAction(cc.repeatForever(cc.rotateBy(2.0, 90)));

        let labelNode = new cc.Node("_damageDoubleLabel");
        labelNode.parent = area;
        labelNode.setContentSize(140, 48);
        labelNode.color = cc.color(255, 255, 60, 255);
        let label = labelNode.addComponent(cc.Label);
        label.string = "x2";
        label.fontSize = 34;
        label.lineHeight = 40;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;

        let hint = new cc.Node("_damageDoubleHint");
        hint.parent = area;
        hint.setPosition(cc.v2(0, radius + 36));
        hint.setContentSize(300, 40);
        hint.color = cc.color(255, 220, 220, 220);
        let hintLabel = hint.addComponent(cc.Label);
        hintLabel.string = "子弹穿过 伤害x2 体积增大";
        hintLabel.fontSize = 20;
        hintLabel.lineHeight = 26;
        hintLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        hintLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;

        return area;
    }

    createDamageDoubleTestEnemy(pos) {
        let enemy = cc.instantiate(this.enemyPrefab);
        enemy.parent = this._fire._tmLayerObstacle;
        enemy.position = cc.v3(this.clampMapInnerPosition(pos, 90));
        enemy.script.setMap(this);
        enemy.script.setTarget(this._player);
        enemy.script.setEnemyType(11, this._levelId);
        enemy.script._hp = 99999;
        enemy.script._maxHp = 99999;
        enemy.script.refreshHp();
        enemy.script.enabled = false;
        enemy.zIndex = this.judgezIndex(enemy.y);
        this._enemys.push(enemy);
        return enemy;
    }

    createDamageDoubleTestSetup() {
        if (!this._player || !cc.isValid(this._player)) {
            return;
        }

        this._clearDamageDoubleTestNodes();

        let playerPos = cc.v2(this._player.position);
        let center = this.clampMapInnerPosition(playerPos.add(cc.v2(220, 0)), 100);
        let radius = 60;
        let color = cc.color(255, 40, 40, 255);
        let enemyPos = this.clampMapInnerPosition(center.add(cc.v2(radius + 40, 0)), 90);

        this._createDamageDoubleAreaNode(center, radius, color);
        this.createDamageDoubleTestEnemy(enemyPos);

        this._damageDoubleAreaData = {
            center: center,
            radius: radius,
            damageMultiplier: 2,
            scaleMultiplier: 1.5,
        };
    }

    tryEnterDamageDoubleArea(bullet, fromPos, toPos) {
        let areaList = [];
        if (this._multiplayerMode) {
            areaList = this._multiplayerDamageDoubleAreas || [];
        }
        else if (this._damageDoubleTestMode && this._damageDoubleAreaData) {
            areaList = [this._damageDoubleAreaData];
        }
        if (!bullet || areaList.length == 0) {
            return false;
        }
        if (bullet.hasUsedDamageDoubleArea && bullet.hasUsedDamageDoubleArea()) {
            return false;
        }
        for (let i = 0; i < areaList.length; i++) {
            let area = areaList[i];
            if (!area) {
                continue;
            }
            if (this._distancePointToSegment(area.center, cc.v2(fromPos), cc.v2(toPos)) > area.radius) {
                continue;
            }
            return bullet.enterDamageDoubleArea ? bullet.enterDamageDoubleArea(area) : false;
        }
        return false;
    }

    spawnDamageDoubleFx(pos) {
        let fx = new cc.Node("_damageDoubleFx");
        fx.parent = this._fire._tmLayerObstacle;
        fx.setPosition(cc.v3(pos));
        fx.zIndex = 5700;
        fx.opacity = 220;
        fx.scale = 0.4;

        let graphics = fx.addComponent(cc.Graphics);
        graphics.fillColor = cc.color(255, 50, 50, 180);
        graphics.circle(0, 0, 20);
        graphics.fill();
        graphics.lineWidth = 4;
        graphics.strokeColor = cc.color(255, 200, 50, 220);
        graphics.circle(0, 0, 26);
        graphics.stroke();

        fx.runAction(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.2, 1.6),
                cc.fadeOut(0.2)
            ),
            cc.removeSelf()
        ));
    }

    _clearSpeedDoubleTestNodes() {
        this._speedDoubleAreaData = null;
        this._multiplayerSpeedDoubleAreas = [];
        let children = this._fire._tmLayerObstacle.children.slice();
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (!cc.isValid(child)) {
                continue;
            }
            if (child.name == "_speedDoubleArea" || child.name == "_speedDoubleFx") {
                child.destroy();
            }
        }
    }

    _createSpeedDoubleAreaNode(pos, radius, color) {
        let area = new cc.Node("_speedDoubleArea");
        area.parent = this._fire._tmLayerObstacle;
        area.setPosition(cc.v3(pos));
        area.zIndex = 5650;

        let glow = new cc.Node("_speedDoubleGlow");
        glow.parent = area;
        let glowGraphics = glow.addComponent(cc.Graphics);
        glowGraphics.fillColor = cc.color(0, 80, 255, 35);
        glowGraphics.circle(0, 0, radius + 20);
        glowGraphics.fill();
        glow.opacity = 160;
        glow.scale = 0.85;
        glow.runAction(cc.repeatForever(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.5, 1.08),
                cc.fadeTo(0.5, 220)
            ),
            cc.spawn(
                cc.scaleTo(0.5, 0.85),
                cc.fadeTo(0.5, 120)
            )
        )));

        let graphics = area.addComponent(cc.Graphics);
        graphics.lineWidth = 6;
        graphics.strokeColor = cc.color(30, 130, 255, 255);
        graphics.circle(0, 0, radius);
        graphics.stroke();
        graphics.fillColor = cc.color(0, 80, 255, 30);
        graphics.circle(0, 0, radius - 4);
        graphics.fill();

        let innerRing = new cc.Node("_speedDoubleInnerRing");
        innerRing.parent = area;
        let innerGraphics = innerRing.addComponent(cc.Graphics);
        innerGraphics.lineWidth = 3;
        innerGraphics.strokeColor = cc.color(100, 180, 255, 150);
        let segments = 24;
        let dashLen = Math.PI * 2 / segments;
        for (let i = 0; i < segments; i += 2) {
            let startAngle = i * dashLen;
            let endAngle = (i + 1) * dashLen;
            innerGraphics.arc(0, 0, radius - 12, startAngle, endAngle, false);
            innerGraphics.stroke();
        }
        innerRing.runAction(cc.repeatForever(cc.rotateBy(2.0, -90)));

        let labelNode = new cc.Node("_speedDoubleLabel");
        labelNode.parent = area;
        labelNode.setContentSize(140, 48);
        labelNode.color = cc.color(100, 200, 255, 255);
        let label = labelNode.addComponent(cc.Label);
        label.string = "x2";
        label.fontSize = 34;
        label.lineHeight = 40;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;

        let hint = new cc.Node("_speedDoubleHint");
        hint.parent = area;
        hint.setPosition(cc.v2(0, radius + 36));
        hint.setContentSize(300, 40);
        hint.color = cc.color(200, 220, 255, 220);
        let hintLabel = hint.addComponent(cc.Label);
        hintLabel.string = "子弹穿过 速度x3";
        hintLabel.fontSize = 20;
        hintLabel.lineHeight = 26;
        hintLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        hintLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;

        return area;
    }

    createSpeedDoubleTestEnemy(pos) {
        let enemy = cc.instantiate(this.enemyPrefab);
        enemy.parent = this._fire._tmLayerObstacle;
        enemy.position = cc.v3(this.clampMapInnerPosition(pos, 90));
        enemy.script.setMap(this);
        enemy.script.setTarget(this._player);
        enemy.script.setEnemyType(11, this._levelId);
        enemy.script._hp = 99999;
        enemy.script._maxHp = 99999;
        enemy.script.refreshHp();
        enemy.script.enabled = false;
        enemy.zIndex = this.judgezIndex(enemy.y);
        this._enemys.push(enemy);
        return enemy;
    }

    createSpeedDoubleTestSetup() {
        if (!this._player || !cc.isValid(this._player)) {
            return;
        }

        this._clearSpeedDoubleTestNodes();

        let playerPos = cc.v2(this._player.position);
        let center = this.clampMapInnerPosition(playerPos.add(cc.v2(220, 0)), 100);
        let radius = 60;
        let color = cc.color(30, 130, 255, 255);
        let enemyPos = this.clampMapInnerPosition(center.add(cc.v2(radius + 40, 0)), 90);

        this._createSpeedDoubleAreaNode(center, radius, color);
        this.createSpeedDoubleTestEnemy(enemyPos);

        this._speedDoubleAreaData = {
            center: center,
            radius: radius,
            speedMultiplier: 3,
        };
    }

    tryEnterSpeedDoubleArea(bullet, fromPos, toPos) {
        let areaList = [];
        if (this._multiplayerMode) {
            areaList = this._multiplayerSpeedDoubleAreas || [];
        }
        else if (this._speedDoubleTestMode && this._speedDoubleAreaData) {
            areaList = [this._speedDoubleAreaData];
        }
        if (!bullet || areaList.length == 0) {
            return false;
        }
        if (bullet.hasUsedSpeedDoubleArea && bullet.hasUsedSpeedDoubleArea()) {
            return false;
        }
        for (let i = 0; i < areaList.length; i++) {
            let area = areaList[i];
            if (!area) {
                continue;
            }
            if (this._distancePointToSegment(area.center, cc.v2(fromPos), cc.v2(toPos)) > area.radius) {
                continue;
            }
            return bullet.enterSpeedDoubleArea ? bullet.enterSpeedDoubleArea(area) : false;
        }
        return false;
    }

    spawnSpeedDoubleFx(pos) {
        let fx = new cc.Node("_speedDoubleFx");
        fx.parent = this._fire._tmLayerObstacle;
        fx.setPosition(cc.v3(pos));
        fx.zIndex = 5700;
        fx.opacity = 220;
        fx.scale = 0.4;

        let graphics = fx.addComponent(cc.Graphics);
        graphics.fillColor = cc.color(50, 150, 255, 180);
        graphics.circle(0, 0, 20);
        graphics.fill();
        graphics.lineWidth = 4;
        graphics.strokeColor = cc.color(100, 200, 255, 220);
        graphics.circle(0, 0, 26);
        graphics.stroke();

        fx.runAction(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.2, 1.6),
                cc.fadeOut(0.2)
            ),
            cc.removeSelf()
        ));
    }

    _clearSpreadBulletTestNodes() {
        this._spreadBulletAreaData = null;
        let children = this._fire._tmLayerObstacle.children.slice();
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (!cc.isValid(child)) {
                continue;
            }
            if (child.name == "_spreadBulletArea" || child.name == "_spreadBulletFx") {
                child.destroy();
            }
        }
    }

    _createSpreadBulletAreaNode(pos, radius, color) {
        let area = new cc.Node("_spreadBulletArea");
        area.parent = this._fire._tmLayerObstacle;
        area.setPosition(cc.v3(pos));
        area.zIndex = 5650;

        let glow = new cc.Node("_spreadBulletGlow");
        glow.parent = area;
        let glowGraphics = glow.addComponent(cc.Graphics);
        glowGraphics.fillColor = cc.color(0, 200, 80, 35);
        glowGraphics.circle(0, 0, radius + 20);
        glowGraphics.fill();
        glow.opacity = 160;
        glow.scale = 0.85;
        glow.runAction(cc.repeatForever(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.5, 1.08),
                cc.fadeTo(0.5, 220)
            ),
            cc.spawn(
                cc.scaleTo(0.5, 0.85),
                cc.fadeTo(0.5, 120)
            )
        )));

        let graphics = area.addComponent(cc.Graphics);
        graphics.lineWidth = 6;
        graphics.strokeColor = cc.color(30, 230, 100, 255);
        graphics.circle(0, 0, radius);
        graphics.stroke();
        graphics.fillColor = cc.color(0, 200, 80, 30);
        graphics.circle(0, 0, radius - 4);
        graphics.fill();

        let innerRing = new cc.Node("_spreadBulletInnerRing");
        innerRing.parent = area;
        let innerGraphics = innerRing.addComponent(cc.Graphics);
        innerGraphics.lineWidth = 3;
        innerGraphics.strokeColor = cc.color(100, 255, 150, 150);
        let segments = 24;
        let dashLen = Math.PI * 2 / segments;
        for (let i = 0; i < segments; i += 2) {
            let startAngle = i * dashLen;
            let endAngle = (i + 1) * dashLen;
            innerGraphics.arc(0, 0, radius - 12, startAngle, endAngle, false);
            innerGraphics.stroke();
        }
        innerRing.runAction(cc.repeatForever(cc.rotateBy(2.0, 60)));

        let labelNode = new cc.Node("_spreadBulletLabel");
        labelNode.parent = area;
        labelNode.setContentSize(140, 48);
        labelNode.color = cc.color(100, 255, 140, 255);
        let label = labelNode.addComponent(cc.Label);
        label.string = "x3";
        label.fontSize = 34;
        label.lineHeight = 40;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;

        let hint = new cc.Node("_spreadBulletHint");
        hint.parent = area;
        hint.setPosition(cc.v2(0, radius + 36));
        hint.setContentSize(300, 40);
        hint.color = cc.color(200, 255, 220, 220);
        let hintLabel = hint.addComponent(cc.Label);
        hintLabel.string = "子弹穿过 1变3";
        hintLabel.fontSize = 20;
        hintLabel.lineHeight = 26;
        hintLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        hintLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;

        return area;
    }

    createSpreadBulletTestEnemy(pos) {
        let enemy = cc.instantiate(this.enemyPrefab);
        enemy.parent = this._fire._tmLayerObstacle;
        enemy.position = cc.v3(this.clampMapInnerPosition(pos, 90));
        enemy.script.setMap(this);
        enemy.script.setTarget(this._player);
        enemy.script.setEnemyType(11, this._levelId);
        enemy.script._hp = 99999;
        enemy.script._maxHp = 99999;
        enemy.script.refreshHp();
        enemy.script.enabled = false;
        enemy.zIndex = this.judgezIndex(enemy.y);
        this._enemys.push(enemy);
        return enemy;
    }

    createSpreadBulletTestSetup() {
        if (!this._player || !cc.isValid(this._player)) {
            return;
        }

        this._clearSpreadBulletTestNodes();

        let playerPos = cc.v2(this._player.position);
        let center = this.clampMapInnerPosition(playerPos.add(cc.v2(220, 0)), 100);
        let radius = 60;
        let color = cc.color(30, 230, 100, 255);
        let enemyPos = this.clampMapInnerPosition(center.add(cc.v2(200, 0)), 90);

        this._createSpreadBulletAreaNode(center, radius, color);
        this.createSpreadBulletTestEnemy(enemyPos);

        this._spreadBulletAreaData = {
            center: center,
            radius: radius,
            spreadCount: 2,
            spreadAngle: 20,
            _splitTriggered: false,
        };
    }

    tryEnterSpreadBulletArea(bullet, fromPos, toPos) {
        if (!this._spreadBulletTestMode || !bullet || !this._spreadBulletAreaData) {
            return false;
        }

        let area = this._spreadBulletAreaData;
        if (area._splitTriggered) {
            return false;
        }
        if (this._distancePointToSegment(area.center, cc.v2(fromPos), cc.v2(toPos)) > area.radius) {
            return false;
        }

        area._splitTriggered = true;
        return bullet.enterSpreadBulletArea ? bullet.enterSpreadBulletArea(area) : false;
    }

    spawnSpreadBulletFx(pos) {
        let fx = new cc.Node("_spreadBulletFx");
        fx.parent = this._fire._tmLayerObstacle;
        fx.setPosition(cc.v3(pos));
        fx.zIndex = 5700;
        fx.opacity = 220;
        fx.scale = 0.4;

        let graphics = fx.addComponent(cc.Graphics);
        graphics.fillColor = cc.color(50, 230, 100, 180);
        graphics.circle(0, 0, 20);
        graphics.fill();
        graphics.lineWidth = 4;
        graphics.strokeColor = cc.color(100, 255, 150, 220);
        graphics.circle(0, 0, 26);
        graphics.stroke();

        fx.runAction(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.2, 1.6),
                cc.fadeOut(0.2)
            ),
            cc.removeSelf()
        ));
    }

    _clearBounceObstacleTestNodes() {
        this._bounceObstacles = [];
        let children = this._fire._tmLayerObstacle.children.slice();
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (!cc.isValid(child)) {
                continue;
            }
            if (child.name.indexOf("_bounceObstacle") == 0) {
                child.destroy();
            }
        }
    }

    _createBounceCircleObstacle(pos, radius) {
        let node = new cc.Node("_bounceObstacleCircle");
        node.parent = this._fire._tmLayerObstacle;
        node.setPosition(cc.v3(pos));
        node.zIndex = 5600;

        let graphics = node.addComponent(cc.Graphics);
        graphics.fillColor = cc.color(255, 120, 180, 60);
        graphics.circle(0, 0, radius);
        graphics.fill();
        graphics.lineWidth = 5;
        graphics.strokeColor = cc.color(255, 80, 180, 255);
        graphics.circle(0, 0, radius);
        graphics.stroke();

        this._bounceObstacles.push({
            type: "circle",
            center: cc.v2(pos),
            radius: radius,
            node: node,
        });

        return node;
    }

    _createBounceLineObstacle(fromPos, toPos) {
        let node = new cc.Node("_bounceObstacleLine");
        node.parent = this._fire._tmLayerObstacle;
        node.zIndex = 5600;

        let graphics = node.addComponent(cc.Graphics);
        graphics.lineWidth = 8;
        graphics.strokeColor = cc.color(255, 80, 180, 255);
        graphics.moveTo(fromPos.x, fromPos.y);
        graphics.lineTo(toPos.x, toPos.y);
        graphics.stroke();

        let A = cc.v2(fromPos);
        let B = cc.v2(toPos);
        let dir = B.sub(A).normalize();
        let normal = cc.v2(-dir.y, dir.x);

        this._bounceObstacles.push({
            type: "line",
            A: A,
            B: B,
            normal: normal,
            node: node,
        });

        return node;
    }

    createBounceObstacleTestSetup() {
        if (!this._player || !cc.isValid(this._player)) {
            return;
        }

        this._clearBounceObstacleTestNodes();

        let playerPos = cc.v2(this._player.position);

        this._createBounceCircleObstacle(this.clampMapInnerPosition(playerPos.add(cc.v2(180, 40)), 80), 36);
        this._createBounceCircleObstacle(this.clampMapInnerPosition(playerPos.add(cc.v2(180, -50)), 80), 28);
        this._createBounceLineObstacle(
            this.clampMapInnerPosition(playerPos.add(cc.v2(320, -80)), 60),
            this.clampMapInnerPosition(playerPos.add(cc.v2(320, 80)), 60)
        );

        let enemyPos = this.clampMapInnerPosition(playerPos.add(cc.v2(480, 0)), 90);
        this.createBounceObstacleTestEnemy(enemyPos);
    }

    createBounceObstacleTestEnemy(pos) {
        let enemy = cc.instantiate(this.enemyPrefab);
        enemy.parent = this._fire._tmLayerObstacle;
        enemy.position = cc.v3(this.clampMapInnerPosition(pos, 90));
        enemy.script.setMap(this);
        enemy.script.setTarget(this._player);
        enemy.script.setEnemyType(11, this._levelId);
        enemy.script._hp = 99999;
        enemy.script._maxHp = 99999;
        enemy.script.refreshHp();
        enemy.script.enabled = false;
        enemy.zIndex = this.judgezIndex(enemy.y);
        this._enemys.push(enemy);
        return enemy;
    }

    tryBounceBulletOnObstacle(bullet, fromPos, toPos) {
        if (!this._bounceObstacleTestMode || !bullet || this._bounceObstacles.length == 0) {
            return false;
        }

        let from = cc.v2(fromPos);
        let to = cc.v2(toPos);
        let dirBullet = to.sub(from);

        for (let i = 0; i < this._bounceObstacles.length; i++) {
            let obstacle = this._bounceObstacles[i];

            if (obstacle.type == "circle") {
                let center = obstacle.center;
                let radius = obstacle.radius;
                let AC = center.sub(from);
                let lenSqr = dirBullet.magSqr();
                if (lenSqr <= 0) continue;
                let t = AC.dot(dirBullet) / lenSqr;
                t = cc.misc.clampf(t, 0, 1);
                let closest = from.add(dirBullet.mul(t));
                let dist = center.sub(closest).mag();

                if (dist >= radius) continue;

                // Surface normal points from center outward to the hit point on circumference
                let surfaceNormal = closest.sub(center).normalize();
                if (surfaceNormal.magSqr() <= 0) {
                    surfaceNormal = cc.v2(1, 0);
                }

                // surfaceNormal should point toward the incoming bullet
                let dot = bullet._dir.dot(surfaceNormal);
                if (dot > 0) {
                    surfaceNormal = surfaceNormal.mul(-1);
                    dot = -dot;
                }

                let reflectDir = bullet._dir.sub(surfaceNormal.mul(2 * dot));
                bullet._dir = reflectDir.normalize();
                bullet.node.angle = Utils.vectorsToDegress(bullet._dir) - 90;

                // Place bullet on the circumference at the hit point, then push outward
                let hitPoint = center.add(closest.sub(center).normalize().mul(radius));
                bullet.node.setPosition(cc.v3(hitPoint.add(bullet._dir.mul(8))));
                return true;
            }
            else if (obstacle.type == "line") {
                let A = obstacle.A;
                let B = obstacle.B;
                let dirObstacle = B.sub(A);

                // Cross product to check segment intersection
                let denom = dirBullet.x * dirObstacle.y - dirBullet.y * dirObstacle.x;
                if (Math.abs(denom) < 0.0001) continue;

                let t1 = ((A.x - from.x) * dirObstacle.y - (A.y - from.y) * dirObstacle.x) / denom;
                let t2 = ((A.x - from.x) * dirBullet.y - (A.y - from.y) * dirBullet.x) / denom;

                if (t1 < 0 || t1 > 1 || t2 < 0 || t2 > 1) continue;

                let normal = obstacle.normal;
                let dot = bullet._dir.dot(normal);
                if (dot > 0) {
                    normal = normal.mul(-1);
                    dot = -dot;
                }

                let reflectDir = bullet._dir.sub(normal.mul(2 * dot));
                bullet._dir = reflectDir.normalize();
                bullet.node.angle = Utils.vectorsToDegress(bullet._dir) - 90;
                bullet.node.setPosition(cc.v3(from.add(bullet._dir.mul(8))));
                return true;
            }
        }

        return false;
    }

    _clearBlackHoleTestNodes() {
        this._blackHoleAreaData = null;
        this._multiplayerBlackHoleAreas = [];
        let children = this._fire._tmLayerObstacle.children.slice();
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (!cc.isValid(child)) {
                continue;
            }
            if (child.name == "_blackHoleArea" || child.name == "_blackHoleFx") {
                child.destroy();
            }
        }
    }

    spawnBlackHoleZone(pos, options: any = {}) {
        let center = this.clampMapInnerPosition(cc.v2(pos), BLACK_HOLE_ZONE_RADIUS + 20);
        this._clearBlackHoleTestNodes();
        let radius = options.radius == null ? BLACK_HOLE_ZONE_RADIUS : options.radius;
        let destroyRadius = options.destroyRadius == null ? BLACK_HOLE_ZONE_DESTROY_RADIUS : options.destroyRadius;
        let node = this._createBlackHoleAreaNode(center, radius, destroyRadius, cc.color(80, 30, 160, 200));
        this._blackHoleAreaData = {
            node: node,
            center: center,
            radius: radius,
            destroyRadius: destroyRadius,
            gravityStrength: options.gravityStrength == null ? BLACK_HOLE_ZONE_GRAVITY : options.gravityStrength,
            duration: options.duration == null ? BLACK_HOLE_ZONE_DURATION : options.duration,
            remainTime: options.duration == null ? BLACK_HOLE_ZONE_DURATION : options.duration,
            eventId: options.eventId || "",
        };
        return node;
    }

    _createBlackHoleAreaNode(pos, radius, destroyRadius, color) {
        let area = new cc.Node("_blackHoleArea");
        area.parent = this._fire._tmLayerObstacle;
        area.setPosition(cc.v3(pos));
        area.zIndex = 5650;

        // Outer glow
        let glow = new cc.Node("_blackHoleGlow");
        glow.parent = area;
        let glowGraphics = glow.addComponent(cc.Graphics);
        glowGraphics.fillColor = cc.color(60, 20, 100, 25);
        glowGraphics.circle(0, 0, radius + 30);
        glowGraphics.fill();
        glow.opacity = 140;
        glow.scale = 0.82;
        glow.runAction(cc.repeatForever(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.8, 1.12),
                cc.fadeTo(0.8, 210)
            ),
            cc.spawn(
                cc.scaleTo(0.8, 0.82),
                cc.fadeTo(0.8, 110)
            )
        )));

        // Outer ring
        let graphics = area.addComponent(cc.Graphics);
        graphics.lineWidth = 5;
        graphics.strokeColor = cc.color(100, 40, 180, 200);
        graphics.circle(0, 0, radius);
        graphics.stroke();
        graphics.fillColor = cc.color(40, 10, 80, 35);
        graphics.circle(0, 0, radius - 3);
        graphics.fill();

        // Inner accretion disk rings
        let ringCount = 4;
        for (let i = 0; i < ringCount; i++) {
            let ringRadius = radius - (radius - destroyRadius) * (i + 1) / (ringCount + 1);
            let ringNode = new cc.Node("_blackHoleRing" + i);
            ringNode.parent = area;
            let ringGraphics = ringNode.addComponent(cc.Graphics);
            ringGraphics.lineWidth = 3 - i * 0.5;
            let alpha = 180 - i * 35;
            ringGraphics.strokeColor = cc.color(120, 50, 200, alpha);
            ringGraphics.circle(0, 0, ringRadius);
            ringGraphics.stroke();
            ringNode.runAction(cc.repeatForever(cc.rotateBy(1.5 + i * 0.3, 90 + i * 30)));
        }

        // Dark core
        let core = new cc.Node("_blackHoleCore");
        core.parent = area;
        let coreGraphics = core.addComponent(cc.Graphics);
        coreGraphics.fillColor = cc.color(0, 0, 0, 220);
        coreGraphics.circle(0, 0, destroyRadius);
        coreGraphics.fill();
        coreGraphics.lineWidth = 2;
        coreGraphics.strokeColor = cc.color(180, 100, 255, 100);
        coreGraphics.circle(0, 0, destroyRadius);
        coreGraphics.stroke();

        // Label
        let labelNode = new cc.Node("_blackHoleLabel");
        labelNode.parent = area;
        labelNode.setContentSize(140, 48);
        labelNode.color = cc.color(180, 120, 255, 220);
        let label = labelNode.addComponent(cc.Label);
        label.string = "黑洞";
        label.fontSize = 30;
        label.lineHeight = 36;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;

        // Hint
        let hint = new cc.Node("_blackHoleHint");
        hint.parent = area;
        hint.setPosition(cc.v2(0, radius + 36));
        hint.setContentSize(320, 40);
        hint.color = cc.color(200, 180, 255, 200);
        let hintLabel = hint.addComponent(cc.Label);
        hintLabel.string = "子弹靠近会被吸引吞噬";
        hintLabel.fontSize = 20;
        hintLabel.lineHeight = 26;
        hintLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        hintLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;

        return area;
    }

    createBlackHoleTestEnemy(pos) {
        let enemy = cc.instantiate(this.enemyPrefab);
        enemy.parent = this._fire._tmLayerObstacle;
        enemy.position = cc.v3(this.clampMapInnerPosition(pos, 90));
        enemy.script.setMap(this);
        enemy.script.setTarget(this._player);
        enemy.script.setEnemyType(11, this._levelId);
        enemy.script._hp = 99999;
        enemy.script._maxHp = 99999;
        enemy.script.refreshHp();
        enemy.script.enabled = false;
        enemy.zIndex = this.judgezIndex(enemy.y);
        this._enemys.push(enemy);
        return enemy;
    }

    createBlackHoleTestSetup() {
        if (!this._player || !cc.isValid(this._player)) {
            return;
        }

        this._clearBlackHoleTestNodes();

        let playerPos = cc.v2(this._player.position);
        let center = this.clampMapInnerPosition(playerPos.add(cc.v2(300, 0)), 120);
        let radius = 100;
        let destroyRadius = 14;
        let color = cc.color(80, 30, 160, 200);
        let enemyPos = this.clampMapInnerPosition(center.add(cc.v2(280, 100)), 90);

        this._createBlackHoleAreaNode(center, radius, destroyRadius, color);
        this.createBlackHoleTestEnemy(enemyPos);

        this._blackHoleAreaData = {
            center: center,
            radius: radius,
            destroyRadius: destroyRadius,
            gravityStrength: 160,
        };
    }

    tryEnterBlackHoleArea(bullet, fromPos, toPos) {
        let areaList = [];
        if (this._multiplayerMode) {
            areaList = this._multiplayerBlackHoleAreas || [];
        }
        else if (this._blackHoleTestMode && this._blackHoleAreaData) {
            areaList = [this._blackHoleAreaData];
        }
        if (!bullet || areaList.length == 0) {
            return false;
        }

        let pos = cc.v2(bullet.node.position);
        for (let i = 0; i < areaList.length; i++) {
            let area = areaList[i];
            if (!area) {
                continue;
            }
            let dist = pos.sub(area.center).mag();
            if (dist < area.radius) {
                return true;
            }
        }
        return false;
    }

    spawnBlackHoleSwallowFx(pos) {
        let fx = new cc.Node("_blackHoleFx");
        fx.parent = this._fire._tmLayerObstacle;
        fx.setPosition(cc.v3(pos));
        fx.zIndex = 5700;
        fx.opacity = 220;

        let graphics = fx.addComponent(cc.Graphics);
        graphics.fillColor = cc.color(80, 30, 160, 180);
        graphics.circle(0, 0, 10);
        graphics.fill();
        graphics.lineWidth = 4;
        graphics.strokeColor = cc.color(180, 100, 255, 200);
        graphics.circle(0, 0, 18);
        graphics.stroke();

        fx.runAction(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.25, 0),
                cc.fadeOut(0.25)
            ),
            cc.removeSelf()
        ));
    }

    createClusterBombTestEnemies() {
        if (!this._player || !cc.isValid(this._player)) {
            return;
        }

        let playerPos = cc.v2(this._player.position);
        let startPos = playerPos.add(cc.v2(500, -120));
        let cols = 4;
        let rows = 3;
        let spacingX = 80;
        let spacingY = 70;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let pos = this.clampMapInnerPosition(cc.v2(startPos.x + c * spacingX, startPos.y + r * spacingY), 50);
                let enemy = cc.instantiate(this.enemyPrefab);
                enemy.parent = this._fire._tmLayerObstacle;
                enemy.position = cc.v3(pos);
                enemy.script.setMap(this);
                enemy.script.setTarget(this._player);
                enemy.script.setEnemyType(11, this._levelId);
                enemy.script._hp = 30;
                enemy.script._maxHp = 30;
                enemy.script.refreshHp();
                enemy.script.enabled = false;
                enemy.zIndex = this.judgezIndex(enemy.y);
                this._enemys.push(enemy);
            }
        }
    }

    createClusterBombTestSetup() {
        if (!this._player || !cc.isValid(this._player)) {
            return;
        }

        // Override player's bullet type to fire cluster bombs
        let playerScript = this._player.script;
        if (playerScript._config) {
            playerScript._config.BType1 = 101;
            playerScript._config.BType2 = 101;
        }

        this.createClusterBombTestEnemies();
    }

    _getTestEffectPreviewPos() {
        let basePos = this._player && cc.isValid(this._player)
            ? cc.v2(this._player.position)
            : (this._playerBornPos ? cc.v2(this._playerBornPos) : cc.v2(0, 0));
        return this.clampMapInnerPosition(basePos.add(cc.v2(180, 96)), 120);
    }

    _preloadRippleDistortionEffect() {
        if (cc.dynamicAtlasManager) {
            cc.dynamicAtlasManager.enabled = false;
        }
        cc.loader.loadRes("shader/ripple-distortion", cc.EffectAsset, (err, effectAsset) => {
            if (err) {
                console.warn("load ripple distortion effect failed", err);
                return;
            }
            this._rippleDistortionEffect = effectAsset;
        });
    }

    _destroyRippleCaptureResources() {
        if (this._rippleCaptureCamera) {
            this._rippleCaptureCamera.targetTexture = null;
        }
        if (this._rippleCaptureCameraNode && cc.isValid(this._rippleCaptureCameraNode)) {
            this._rippleCaptureCameraNode.destroy();
        }
        this._rippleCaptureCamera = null;
        this._rippleCaptureCameraNode = null;
    }

    _getRippleCaptureCamera() {
        if (this._rippleCaptureCamera && cc.isValid(this._rippleCaptureCamera.node)) {
            return this._rippleCaptureCamera;
        }

        let parentNode = this.node.parent;
        if (!parentNode || !cc.isValid(parentNode)) {
            return null;
        }

        let cameraNode = new cc.Node("_rippleCaptureCamera");
        cameraNode.parent = parentNode;
        cameraNode.setPosition(0, 0);
        cameraNode.zIndex = -9999;
        let camera = cameraNode.addComponent(cc.Camera);
        camera.enabled = true;
        camera.ortho = true;
        camera.alignWithScreen = true;
        camera.depth = -999;
        camera.cullingMask = 0xffffffff;
        camera.backgroundColor = cc.color(0, 0, 0, 0);
        camera.clearFlags = 0;

        this._rippleCaptureCameraNode = cameraNode;
        this._rippleCaptureCamera = camera;
        return camera;
    }

    _captureRippleScreenFrame() {
        let camera = this._getRippleCaptureCamera();
        if (!camera) {
            return null;
        }

        let viewportSize = this._getViewportSize();
        let renderTexture = new cc.RenderTexture();
        let gl = (cc.game as any)._renderContext;
        if (!gl) {
            return null;
        }
        renderTexture.initWithSize(Math.ceil(viewportSize.width), Math.ceil(viewportSize.height), gl.STENCIL_INDEX8);
        camera.targetTexture = renderTexture;
        camera.render(cc.director.getScene());

        let spriteFrame = new cc.SpriteFrame();
        spriteFrame.setTexture(renderTexture);
        return {
            spriteFrame: spriteFrame,
            renderTexture: renderTexture,
            viewportSize: viewportSize,
        };
    }

    _getRippleCenterUv(overlayNode, worldPos, viewportSize) {
        if (!overlayNode || !cc.isValid(overlayNode)) {
            return cc.v2(0.5, 0.5);
        }

        let localPos = overlayNode.convertToNodeSpaceAR(worldPos);
        let normalizedX = (localPos.x + viewportSize.width * 0.5) / Math.max(1, viewportSize.width);
        let normalizedY = (localPos.y + viewportSize.height * 0.5) / Math.max(1, viewportSize.height);
        return cc.v2(
            cc.misc.clampf(normalizedX, 0, 1),
            cc.misc.clampf(1 - normalizedY, 0, 1)
        );
    }

    _spawnDistortionRippleAt(pos) {
        if (!this._rippleDistortionEffect) {
            this._preloadRippleDistortionEffect();
            return;
        }

        let capture = this._captureRippleScreenFrame();
        if (!capture || !capture.spriteFrame || !capture.renderTexture) {
            return;
        }

        let screenParent = this.node.parent;
        if (!screenParent || !cc.isValid(screenParent)) {
            return;
        }

        let overlay = new cc.Node("_explosionDistortionRipple");
        overlay.parent = screenParent;
        overlay.setContentSize(capture.viewportSize);
        overlay.setPosition(0, 0);
        overlay.zIndex = 1500;

        let sprite = overlay.addComponent(cc.Sprite);
        sprite.spriteFrame = capture.spriteFrame;
        let material = cc.Material.create(this._rippleDistortionEffect, 0);
        material.define("USE_TEXTURE", true, 0);
        material.setProperty("texture", capture.renderTexture);

        let materialVariant = cc.MaterialVariant.create(material, sprite);
        sprite.setMaterial(0, materialVariant);

        let worldPos = this._fire._tmLayerObstacle.convertToWorldSpaceAR(cc.v2(pos));
        let center = this._getRippleCenterUv(overlay, worldPos, capture.viewportSize);

        let ripple = overlay.addComponent(RippleShockwave);
        ripple.init(
            null,
            sprite,
            materialVariant,
            center,
            capture.viewportSize,
            capture.spriteFrame,
            capture.renderTexture,
            0.34
        );
    }

    playKillExplosionEffectAt(pos) {
        this._spawnDistortionRippleAt(pos);
        this._spawnExplosionStarburstAt(pos);
        this._spawnExplosionGlowAt(pos, 0.36);
        this._spawnExplosionCoreBurstAt(pos, 0.22);
        this._spawnTransparentShockwaveAt(pos, 76, 380, 0, 0.34, 180, 10);
        this._spawnTransparentShockwaveAt(pos, 38, 220, 0.04, 0.24, 135, 6);
        MusicManager.playEffect("boom");
        this.playLightScreenShake();
    }

    _spawnExplosionStarburstAt(pos) {
        let burst = new cc.Node("_explosionStarburst");
        burst.parent = this._fire._tmLayerObstacle;
        burst.setPosition(cc.v3(pos));
        burst.zIndex = 6055;
        burst.opacity = 255;
        burst.scale = 0.45;

        let rayConfigs = [
            {angle: 0, length: 170, width: 18, alpha: 160},
            {angle: 45, length: 140, width: 14, alpha: 150},
            {angle: 90, length: 175, width: 18, alpha: 165},
            {angle: 135, length: 142, width: 14, alpha: 150},
        ];
        for (let i = 0; i < rayConfigs.length; i++) {
            let config = rayConfigs[i];
            let ray = new cc.Node("_explosionRay" + i);
            ray.parent = burst;
            ray.angle = config.angle;

            let graphics = ray.addComponent(cc.Graphics);
            graphics.fillColor = cc.color(255, 255, 255, config.alpha);
            graphics.moveTo(0, config.length);
            graphics.lineTo(-config.width, config.length * 0.24);
            graphics.lineTo(0, 12);
            graphics.lineTo(config.width, config.length * 0.24);
            graphics.close();
            graphics.fill();
        }

        let hotCross = new cc.Node("_explosionHotCross");
        hotCross.parent = burst;
        let crossGraphics = hotCross.addComponent(cc.Graphics);
        crossGraphics.fillColor = cc.color(255, 240, 180, 150);
        crossGraphics.rect(-112, -5, 224, 10);
        crossGraphics.rect(-5, -112, 10, 224);
        crossGraphics.fill();

        burst.runAction(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.08, 1.08),
                cc.fadeTo(0.08, 220)
            ),
            cc.spawn(
                cc.scaleTo(0.16, 1.55),
                cc.fadeOut(0.16)
            ),
            cc.removeSelf()
        ));
    }

    _spawnExplosionGlowAt(pos, strength = 0.3) {
        let glow = new cc.Node("_explosionGlow");
        glow.parent = this._fire._tmLayerObstacle;
        glow.setPosition(cc.v3(pos));
        glow.zIndex = 6050;
        glow.opacity = 0;
        glow.scale = 0.35;

        let graphics = glow.addComponent(cc.Graphics);
        graphics.fillColor = cc.color(255, 248, 220, Math.floor(125 * strength));
        graphics.circle(0, 0, 108);
        graphics.fill();
        graphics.fillColor = cc.color(255, 210, 120, Math.floor(95 * strength));
        graphics.circle(0, 0, 70);
        graphics.fill();

        glow.runAction(cc.sequence(
            cc.spawn(
                cc.fadeTo(0.04, 210),
                cc.scaleTo(0.04, 1)
            ),
            cc.spawn(
                cc.fadeOut(0.18),
                cc.scaleTo(0.18, 1.52)
            ),
            cc.removeSelf()
        ));
    }

    _spawnExplosionCoreBurstAt(pos, duration = 0.28) {
        let core = new cc.Node("_explosionCoreBurst");
        core.parent = this._fire._tmLayerObstacle;
        core.setPosition(cc.v3(pos));
        core.zIndex = 6060;
        core.opacity = 255;
        core.scale = 0.2;

        let outer = new cc.Node("_explosionOuterCore");
        outer.parent = core;
        let outerGraphics = outer.addComponent(cc.Graphics);
        outerGraphics.fillColor = cc.color(255, 244, 196, 170);
        outerGraphics.circle(0, 0, 76);
        outerGraphics.fill();

        let inner = new cc.Node("_explosionInnerCore");
        inner.parent = core;
        let innerGraphics = inner.addComponent(cc.Graphics);
        innerGraphics.fillColor = cc.color(255, 255, 255, 240);
        innerGraphics.circle(0, 0, 34);
        innerGraphics.fill();

        core.runAction(cc.sequence(
            cc.spawn(
                cc.scaleTo(duration * 0.42, 1.16),
                cc.fadeTo(duration * 0.42, 255)
            ),
            cc.spawn(
                cc.scaleTo(duration * 0.58, 1.85),
                cc.fadeOut(duration * 0.58)
            ),
            cc.removeSelf()
        ));
    }

    _spawnTransparentShockwaveAt(pos, startRadius = 72, endRadius = 340, delay = 0, duration = 0.42, alpha = 170, lineWidth = 8) {
        let wave = new cc.Node("_explosionShockwave");
        wave.parent = this._fire._tmLayerObstacle;
        wave.setPosition(cc.v3(pos));
        wave.zIndex = 6058;
        wave.opacity = alpha;
        wave.scale = 1;

        let graphics = wave.addComponent(cc.Graphics);
        graphics.lineWidth = lineWidth;
        graphics.strokeColor = cc.color(255, 255, 255, alpha);
        graphics.circle(0, 0, startRadius);
        graphics.stroke();

        let endScale = startRadius > 0 ? endRadius / startRadius : 1;
        let playAction = cc.sequence(
            cc.spawn(
                cc.scaleTo(duration, endScale),
                cc.fadeOut(duration)
            ),
            cc.removeSelf()
        );

        if (delay > 0) {
            wave.runAction(cc.sequence(cc.delayTime(delay), playAction));
        }
        else{
            wave.runAction(playAction);
        }
    }

    _playWhiteScreenFlash(maxOpacity = 180, fadeIn = 0.04, fadeOut = 0.2) {
        let parentNode = this.node.parent;
        if (!parentNode || !cc.isValid(parentNode)) {
            return;
        }

        let size = this._getViewportSize();
        let flash = new cc.Node("_screenFlashWhite");
        flash.parent = parentNode;
        flash.setContentSize(size);
        flash.setPosition(0, 0);
        flash.zIndex = 1700;
        flash.opacity = 0;

        let graphics = flash.addComponent(cc.Graphics);
        graphics.fillColor = cc.color(255, 255, 255, 255);
        graphics.rect(-size.width / 2, -size.height / 2, size.width, size.height);
        graphics.fill();

        flash.runAction(cc.sequence(
            cc.fadeTo(fadeIn, maxOpacity),
            cc.fadeOut(fadeOut),
            cc.removeSelf()
        ));
    }

    _getScreenOverlayRoot() {
        let parentNode = this.node.parent;
        if (parentNode && cc.isValid(parentNode)) {
            return parentNode;
        }
        return Utils.getCurrentSceneCanvas();
    }

    _ensureKillBroadcastLayer() {
        if (this._killBroadcastLayer && cc.isValid(this._killBroadcastLayer)) {
            return this._killBroadcastLayer;
        }

        let root = this._getScreenOverlayRoot();
        if (!root || !cc.isValid(root)) {
            return null;
        }

        let layer = new cc.Node("_killBroadcastLayer");
        layer.parent = root;
        layer.setContentSize(this._getViewportSize());
        layer.setPosition(0, 0);
        layer.zIndex = 1850;
        this._killBroadcastLayer = layer;
        return layer;
    }

    _ensureKillBadgeLayer() {
        if (this._killBadgeLayer && cc.isValid(this._killBadgeLayer)) {
            return this._killBadgeLayer;
        }

        let root = this._getScreenOverlayRoot();
        if (!root || !cc.isValid(root)) {
            return null;
        }

        let layer = new cc.Node("_killBadgeLayer");
        layer.parent = root;
        layer.setContentSize(this._getViewportSize());
        layer.setPosition(0, 0);
        layer.zIndex = 1860;
        this._killBadgeLayer = layer;
        return layer;
    }

    _destroyKillBroadcastUi() {
        this._killBroadcastEntries = [];
        if (this._killBroadcastLayer && cc.isValid(this._killBroadcastLayer)) {
            this._killBroadcastLayer.destroy();
        }
        this._killBroadcastLayer = null;
    }

    _destroyKillBadgeUi() {
        if (this._killBadgeLayer && cc.isValid(this._killBadgeLayer)) {
            this._killBadgeLayer.destroy();
        }
        this._killBadgeLayer = null;
        this._killBadgeActiveNode = null;
    }

    _resetKillBroadcastRuntime() {
        this._killStreakCount = 0;
        this._killStreakRemain = 0;
        this._destroyKillBroadcastUi();
        this._destroyKillBadgeUi();
    }

    _preloadKillBroadcastBadgeFrames() {
        for (let i = 1; i <= 5; i++) {
            this._loadKillBadgeFrame(i);
        }
    }

    _loadKillBadgeFrame(streak, callback = null) {
        let uuid = KILL_BADGE_FRAME_UUIDS[streak];
        if (!uuid || !cc.assetManager || !cc.assetManager.loadAny) {
            if (callback) {
                callback(null);
            }
            return;
        }

        if (this._killBadgeFrames[streak]) {
            if (callback) {
                callback(this._killBadgeFrames[streak]);
            }
            return;
        }

        if (this._killBadgeLoading[streak]) {
            if (callback) {
                this._killBadgeLoading[streak].push(callback);
            }
            return;
        }

        this._killBadgeLoading[streak] = callback ? [callback] : [];
        cc.assetManager.loadAny({uuid: uuid}, (err, asset) => {
            let spriteFrame = null;
            if (!err && asset) {
                spriteFrame = asset instanceof cc.SpriteFrame ? asset : asset;
                this._killBadgeFrames[streak] = spriteFrame;
            }
            let callbacks = this._killBadgeLoading[streak] || [];
            delete this._killBadgeLoading[streak];
            for (let i = 0; i < callbacks.length; i++) {
                callbacks[i](spriteFrame);
            }
        });
    }

    _preloadOilSpillFrame() {
        if (!OIL_SPILL_FRAME_UUID || !cc.assetManager || !cc.assetManager.loadAny) {
            return;
        }
        this._loadOilSpillFrame();
    }

    _loadOilSpillFrame(callback = null) {
        if (this._oilSpillFrame) {
            if (callback) {
                callback(this._oilSpillFrame);
            }
            return;
        }

        if (callback) {
            this._oilSpillFrameCallbacks.push(callback);
        }
        if (this._oilSpillFrameLoading) {
            return;
        }

        this._oilSpillFrameLoading = true;
        cc.assetManager.loadAny({uuid: OIL_SPILL_FRAME_UUID}, (err, asset) => {
            this._oilSpillFrameLoading = false;
            if (!err && asset) {
                this._oilSpillFrame = asset instanceof cc.SpriteFrame ? asset : asset;
            }
            let callbacks = this._oilSpillFrameCallbacks.slice();
            this._oilSpillFrameCallbacks = [];
            for (let i = 0; i < callbacks.length; i++) {
                callbacks[i](this._oilSpillFrame);
            }
        });
    }

    _preloadCoverTestFrame() {
        if (!COVER_TEST_FRAME_UUID || !cc.assetManager || !cc.assetManager.loadAny) {
            return;
        }
        this._loadCoverTestFrame();
    }

    _loadCoverTestFrame(callback = null) {
        if (this._coverTestFrame) {
            if (callback) {
                callback(this._coverTestFrame);
            }
            return;
        }

        if (callback) {
            this._coverTestFrameCallbacks.push(callback);
        }
        if (this._coverTestFrameLoading) {
            return;
        }

        this._coverTestFrameLoading = true;
        cc.assetManager.loadAny({uuid: COVER_TEST_FRAME_UUID}, (err, asset) => {
            this._coverTestFrameLoading = false;
            if (!err && asset) {
                this._coverTestFrame = asset instanceof cc.SpriteFrame ? asset : asset;
            }
            let callbacks = this._coverTestFrameCallbacks.slice();
            this._coverTestFrameCallbacks = [];
            for (let i = 0; i < callbacks.length; i++) {
                callbacks[i](this._coverTestFrame);
            }
        });
    }

    _preloadEnergyEggFrame() {
        if (!ENERGY_EGG_FRAME_UUID || !cc.assetManager || !cc.assetManager.loadAny) {
            return;
        }
        this._loadEnergyEggFrame();
    }

    _loadEnergyEggFrame(callback = null) {
        if (this._energyEggFrame) {
            if (callback) {
                callback(this._energyEggFrame);
            }
            return;
        }

        if (callback) {
            this._energyEggFrameCallbacks.push(callback);
        }
        if (this._energyEggFrameLoading) {
            return;
        }

        this._energyEggFrameLoading = true;
        cc.assetManager.loadAny({uuid: ENERGY_EGG_FRAME_UUID}, (err, asset) => {
            this._energyEggFrameLoading = false;
            if (!err && asset) {
                this._energyEggFrame = asset instanceof cc.SpriteFrame ? asset : asset;
            }
            let callbacks = this._energyEggFrameCallbacks.slice();
            this._energyEggFrameCallbacks = [];
            for (let i = 0; i < callbacks.length; i++) {
                callbacks[i](this._energyEggFrame);
            }
        });
    }

    _preloadEnergyEggBushFrame() {
        if (!TREE_GREEN_LARGE_FRAME_UUID || !cc.assetManager || !cc.assetManager.loadAny) {
            return;
        }
        this._loadEnergyEggBushFrame();
    }

    _loadEnergyEggBushFrame(callback = null) {
        if (this._energyEggBushFrame) {
            if (callback) {
                callback(this._energyEggBushFrame);
            }
            return;
        }

        if (callback) {
            this._energyEggBushFrameCallbacks.push(callback);
        }
        if (this._energyEggBushFrameLoading) {
            return;
        }

        this._energyEggBushFrameLoading = true;
        cc.assetManager.loadAny({uuid: TREE_GREEN_LARGE_FRAME_UUID}, (err, asset) => {
            this._energyEggBushFrameLoading = false;
            if (!err && asset) {
                this._energyEggBushFrame = asset instanceof cc.SpriteFrame ? asset : asset;
            }
            let callbacks = this._energyEggBushFrameCallbacks.slice();
            this._energyEggBushFrameCallbacks = [];
            for (let i = 0; i < callbacks.length; i++) {
                callbacks[i](this._energyEggBushFrame);
            }
        });
    }

    _getKillBadgeColor(streak) {
        let color = KILL_BADGE_TINTS[streak] || KILL_BADGE_TINTS[1];
        return cc.color(color[0], color[1], color[2], 255);
    }

    _createKillBroadcastEntry(text) {
        let layer = this._ensureKillBroadcastLayer();
        if (!layer) {
            return null;
        }

        let entry = new cc.Node("_killBroadcastEntry");
        entry.parent = layer;
        entry.setContentSize(438, 56);
        entry.opacity = 0;
        entry["_expireAt"] = Date.now() + Math.floor(KILL_BROADCAST_DURATION * 1000);
        entry["_isExiting"] = false;

        let bg = entry.addComponent(cc.Graphics);
        bg.fillColor = cc.color(16, 20, 28, 220);
        bg.roundRect(-219, -28, 438, 56, 16);
        bg.fill();
        bg.strokeColor = cc.color(255, 186, 82, 220);
        bg.lineWidth = 2;
        bg.roundRect(-219, -28, 438, 56, 16);
        bg.stroke();

        let tagNode = new cc.Node("_lbBroadcastTag");
        tagNode.parent = entry;
        tagNode.setContentSize(100, 40);
        tagNode.setPosition(-160, 0);
        let tagLabel = tagNode.addComponent(cc.Label);
        tagLabel.string = "房间广播";
        tagLabel.fontSize = 22;
        tagLabel.lineHeight = 26;
        tagLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        tagLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
        tagNode.color = cc.color(255, 214, 122, 255);

        let split = new cc.Node("_broadcastSplit");
        split.parent = entry;
        split.setPosition(-98, 0);
        let splitGraphics = split.addComponent(cc.Graphics);
        splitGraphics.lineWidth = 2;
        splitGraphics.strokeColor = cc.color(255, 255, 255, 60);
        splitGraphics.moveTo(0, -16);
        splitGraphics.lineTo(0, 16);
        splitGraphics.stroke();

        let labelNode = new cc.Node("_lbBroadcastText");
        labelNode.parent = entry;
        labelNode.setContentSize(236, 40);
        labelNode.setPosition(64, 0);
        let label = labelNode.addComponent(cc.Label);
        label.string = text;
        label.fontSize = 24;
        label.lineHeight = 28;
        label.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        labelNode.color = cc.color(255, 255, 255, 255);
        return entry;
    }

    _layoutKillBroadcastEntries(fast = false, newEntry = null) {
        let layer = this._ensureKillBroadcastLayer();
        if (!layer) {
            return;
        }

        let size = this._getViewportSize();
        layer.setContentSize(size);
        let topY = Math.min(size.height / 2 - 120, (yyp.safeTopBottom || size.height / 2) - 96);
        let rightX = size.width / 2 - 246;
        let duration = fast ? 0.12 : 0.2;

        for (let i = 0; i < this._killBroadcastEntries.length; i++) {
            let entry = this._killBroadcastEntries[i];
            if (!cc.isValid(entry)) {
                continue;
            }
            let slot = this._killBroadcastEntries.length - 1 - i;
            let targetX = rightX;
            let targetY = topY - slot * KILL_BROADCAST_SLOT_HEIGHT;
            entry.stopAllActions();
            if (entry == newEntry) {
                entry.setPosition(targetX + 24, targetY - 18);
                entry.runAction(cc.spawn(
                    cc.moveTo(duration, targetX, targetY),
                    cc.fadeTo(duration, 255)
                ));
            }
            else{
                entry.runAction(cc.spawn(
                    cc.moveTo(duration, targetX, targetY),
                    cc.fadeTo(duration, 255)
                ));
            }
        }
    }

    _removeKillBroadcastEntry(entry, fast = false) {
        if (!entry || !cc.isValid(entry) || entry["_isExiting"]) {
            return;
        }

        entry["_isExiting"] = true;
        let index = this._killBroadcastEntries.indexOf(entry);
        if (index >= 0) {
            this._killBroadcastEntries.splice(index, 1);
        }

        let duration = fast ? 0.12 : 0.18;
        entry.stopAllActions();
        entry.runAction(cc.sequence(
            cc.spawn(
                cc.moveBy(duration, 28, 18),
                cc.fadeOut(duration)
            ),
            cc.removeSelf()
        ));
        this._layoutKillBroadcastEntries(true);
    }

    _pushKillBroadcast(text) {
        let entry = this._createKillBroadcastEntry(text);
        if (!entry) {
            return;
        }

        let fastExpireAt = Date.now() + 900;
        for (let i = 0; i < this._killBroadcastEntries.length; i++) {
            let oldEntry = this._killBroadcastEntries[i];
            if (oldEntry && cc.isValid(oldEntry) && !oldEntry["_isExiting"]) {
                oldEntry["_expireAt"] = Math.min(oldEntry["_expireAt"], fastExpireAt);
            }
        }

        this._killBroadcastEntries.push(entry);
        while (this._killBroadcastEntries.length > KILL_BROADCAST_MAX_VISIBLE) {
            let removed = this._killBroadcastEntries.shift();
            this._removeKillBroadcastEntry(removed, true);
        }
        this._layoutKillBroadcastEntries(true, entry);
    }

    _updateKillBroadcastEntries() {
        if (this._killBroadcastEntries.length <= 0) {
            return;
        }

        let now = Date.now();
        let entries = this._killBroadcastEntries.slice();
        for (let i = 0; i < entries.length; i++) {
            let entry = entries[i];
            if (!cc.isValid(entry)) {
                let index = this._killBroadcastEntries.indexOf(entry);
                if (index >= 0) {
                    this._killBroadcastEntries.splice(index, 1);
                }
                continue;
            }
            if (!entry["_isExiting"] && now >= entry["_expireAt"]) {
                this._removeKillBroadcastEntry(entry, false);
            }
        }
    }

    _spawnKillBadgeLightning(parentNode, color) {
        for (let i = 0; i < 3; i++) {
            let lightning = new cc.Node("_killBadgeLightning" + i);
            lightning.parent = parentNode;
            lightning.setPosition(-80 + i * 80, 10 + Math.random() * 26);
            lightning.angle = -10 + Math.random() * 20;
            lightning.opacity = 0;
            let graphics = lightning.addComponent(cc.Graphics);
            graphics.lineWidth = 6;
            graphics.strokeColor = cc.color(color.r, color.g, color.b, 235);
            graphics.moveTo(-8, 42);
            graphics.lineTo(12, 10);
            graphics.lineTo(-2, 10);
            graphics.lineTo(14, -30);
            graphics.stroke();
            lightning.runAction(cc.sequence(
                cc.fadeTo(0.04, 255),
                cc.delayTime(0.08 + i * 0.03),
                cc.fadeOut(0.12)
            ));
        }
    }

    _showKillBadgeStamp(streak) {
        let layer = this._ensureKillBadgeLayer();
        if (!layer) {
            return;
        }

        if (this._killBadgeActiveNode && cc.isValid(this._killBadgeActiveNode)) {
            this._killBadgeActiveNode.stopAllActions();
            this._killBadgeActiveNode.runAction(cc.sequence(
                cc.spawn(
                    cc.scaleTo(0.08, 1.1),
                    cc.fadeOut(0.08)
                ),
                cc.removeSelf()
            ));
        }

        let badge = new cc.Node("_killBadgeStamp");
        badge.parent = layer;
        badge.setPosition(0, 12);
        badge.zIndex = 1;
        badge.opacity = 0;
        badge.scale = 1.42;
        badge.angle = -12;
        this._killBadgeActiveNode = badge;

        let color = this._getKillBadgeColor(streak);

        let glow = new cc.Node("_killBadgeGlow");
        glow.parent = badge;
        glow.opacity = 180;
        glow.scale = 0.8;
        let glowGraphics = glow.addComponent(cc.Graphics);
        glowGraphics.fillColor = cc.color(color.r, color.g, color.b, streak >= 5 ? 88 : 56);
        glowGraphics.circle(0, 0, 128);
        glowGraphics.fill();
        glowGraphics.strokeColor = cc.color(255, 255, 255, 145);
        glowGraphics.lineWidth = 6;
        glowGraphics.circle(0, 0, 114);
        glowGraphics.stroke();

        let flash = new cc.Node("_killBadgeFlash");
        flash.parent = badge;
        flash.opacity = 180;
        let flashGraphics = flash.addComponent(cc.Graphics);
        flashGraphics.fillColor = cc.color(255, 255, 255, 95);
        flashGraphics.rect(-150, -12, 300, 24);
        flashGraphics.rect(-12, -120, 24, 240);
        flashGraphics.fill();

        let spriteNode = new cc.Node("_killBadgeSprite");
        spriteNode.parent = badge;
        spriteNode.setContentSize(360, 240);
        let sprite = spriteNode.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        spriteNode.color = color;

        if (streak >= 5) {
            this._spawnKillBadgeLightning(badge, color);
        }

        this._loadKillBadgeFrame(streak, (spriteFrame) => {
            if (sprite && cc.isValid(sprite) && spriteFrame) {
                sprite.spriteFrame = spriteFrame;
            }
        });

        badge.runAction(cc.sequence(
            cc.spawn(
                cc.fadeTo(0.08, 255),
                cc.scaleTo(0.08, 0.92),
                cc.rotateTo(0.08, -2)
            ),
            cc.spawn(
                cc.scaleTo(0.14, 1.03),
                cc.rotateTo(0.14, 0)
            ),
            cc.delayTime(0.52),
            cc.spawn(
                cc.fadeOut(0.24),
                cc.scaleTo(0.24, 1.12)
            ),
            cc.callFunc(() => {
                if (this._killBadgeActiveNode == badge) {
                    this._killBadgeActiveNode = null;
                }
            }),
            cc.removeSelf()
        ));
    }

    _recordKillStreak() {
        if (this._killStreakRemain > 0) {
            this._killStreakCount += 1;
        }
        else{
            this._killStreakCount = 1;
        }
        this._killStreakCount = Math.min(5, this._killStreakCount);
        this._killStreakRemain = KILL_STREAK_WINDOW;
        return this._killStreakCount;
    }

    //生成一个敌人
    deleteEnemy(delEnemy) {
        for (let i = 0; i < this._enemys.length; i++) {
            let enemy = this._enemys[i];
            if (enemy == delEnemy) {
                if (this._killEffectTestMode || this._killBroadcastTestMode) {
                    this._deathEnemyCount +=1;
                    this._enemys.splice(i,1);
                    yyp.eventCenter.emit("current-enemycount",{enemycount:Math.max(0, this._maxEnemyCount - this._deathEnemyCount)});
                    break;
                }

                this.createSkillIcon(delEnemy.position);

                this._deathEnemyCount +=1;
                yyp.eventCenter.emit("current-enemycount",{enemycount:this._maxEnemyCount - this._deathEnemyCount});

                this._enemys.splice(i,1);
                break;
            }
        }
    }

    //获取敌人数量
    enemyCount() {
        return this._enemys.length;
    }

    //生成一个技能icon
    createSkillIcon(pos) {
        if (Math.random() < 0.06) {
            let skill = cc.instantiate(this.skillPrefab);
            skill.parent = this._fire._tmLayerObstacle;
            skill.position = pos;
            skill.script.setInGame();
            skill.zIndex = this.judgezIndex(skill.y);
            this._skills.push(skill);
        }
    }

    _getEnergyConfig(key, defaultValue) {
        let config = yyp.config.Energy || {};
        let value = config[key];
        return value == null ? defaultValue : value;
    }

    //随机生成一个能量
    createEnergy() {
        let tile = this._getRandomPassableTile();
        if (tile == null) {
            return;
        }

        let energy = this.energyPrefab ? cc.instantiate(this.energyPrefab) : this._createDefaultEnergy();
        energy.parent = this._fire._tmLayerObstacle;
        energy.position = cc.v3(this.tileToGamePos(tile));
        energy.zIndex = this.judgezIndex(energy.y);

        let energyScript = null;
        if (EnergyItem) {
            energyScript = energy.getComponent(EnergyItem) || energy.addComponent(EnergyItem);
        }
        let energyNode : any = energy;
        if (!energyScript && energyNode._components) {
            energyScript = energyNode._components.find((component) => {
                return component && component.__classname__ == "EnergyItem";
            }) || null;
        }
        let value = this._getEnergyConfig("Value", 10);
        let lifeTime = this._getEnergyConfig("LifeTime", 12);
        energyScript.init(value, lifeTime);

        this._energys.push(energy);
    }

    createEnergyAt(pos) {
        let energy = this.energyPrefab ? cc.instantiate(this.energyPrefab) : this._createDefaultEnergy();
        energy.parent = this._fire._tmLayerObstacle;
        energy.position = cc.v3(pos);
        energy.zIndex = this.judgezIndex(energy.y);

        let energyScript = null;
        if (EnergyItem) {
            energyScript = energy.getComponent(EnergyItem) || energy.addComponent(EnergyItem);
        }
        let energyNode : any = energy;
        if (!energyScript && energyNode._components) {
            energyScript = energyNode._components.find((component) => {
                return component && component.__classname__ == "EnergyItem";
            }) || null;
        }
        energyScript.init(this._getEnergyConfig("Value", 10), this._getEnergyConfig("LifeTime", 12));
        this._energys.push(energy);
        return energy;
    }

    createEnergyAtForMultiplayer(energyData) {
        if (!energyData) {
            return null;
        }
        let pos = cc.v2(energyData.x || 0, energyData.y || 0);
        let energy = this.energyPrefab ? cc.instantiate(this.energyPrefab) : this._createDefaultEnergy();
        energy.parent = this._fire._tmLayerObstacle;
        energy.position = cc.v3(pos);
        energy.zIndex = this.judgezIndex(energy.y);
        energy["__energyId"] = energyData.id;

        let energyScript = null;
        if (EnergyItem) {
            energyScript = energy.getComponent(EnergyItem) || energy.addComponent(EnergyItem);
        }
        let energyNode : any = energy;
        if (!energyScript && energyNode._components) {
            energyScript = energyNode._components.find((component) => {
                return component && component.__classname__ == "EnergyItem";
            }) || null;
        }
        energyScript.init(energyData.value == null ? this._getEnergyConfig("Value", 10) : energyData.value, 999999);
        this._energys.push(energy);
        this._multiplayerEnergyMap[energyData.id] = energy;
        return energy;
    }

    createEnergyEggTestSetup() {
        let setup = this._getEnergyEggTestSetupPositions();
        this.spawnEnergyEggBush(setup.bushPos, 94);
        this.spawnEnergyEggAt(setup.eggPos, {
            lifeTime: 10,
            radius: 34,
            energyCount: 18,
            energyScatterRadius: 136
        });
        this.node.runAction(cc.sequence(
            cc.delayTime(0.45),
            cc.callFunc(() => {
                this._showPlayerBubble("把能量蛋推进草丛");
            })
        ));
    }

    _getEnergyEggTestSetupPositions() {
        let basePos = this._player && cc.isValid(this._player)
            ? cc.v2(this._player.position)
            : cc.v2(this._playerBornPos || cc.v2(0, 0));
        let dirs = [
            cc.v2(1, 0),
            cc.v2(0.82, 0.32),
            cc.v2(0.82, -0.32),
            cc.v2(0.2, 1),
        ];
        for (let i = 0; i < dirs.length; i++) {
            let dir = dirs[i].normalize();
            let eggPos = this.clampMapInnerPosition(basePos.add(dir.mul(150)), 68);
            let bushPos = this.clampMapInnerPosition(basePos.add(dir.mul(300)), 96);
            if (this.testColliders(eggPos, 38).length > 0 || this.testColliders(bushPos, 52).length > 0) {
                continue;
            }
            return {
                eggPos: eggPos,
                bushPos: bushPos,
            };
        }

        return {
            eggPos: this.clampMapInnerPosition(basePos.add(cc.v2(150, 0)), 68),
            bushPos: this.clampMapInnerPosition(basePos.add(cc.v2(300, 0)), 96),
        };
    }

    spawnEnergyEggBush(pos, radius = 94) {
        if (!this._fire._tmLayerObstacle) {
            return null;
        }

        let root = new cc.Node("_energyEggBush");
        root.parent = this._fire._tmLayerObstacle;
        root.setPosition(cc.v3(pos));
        root.zIndex = this.judgezIndex(pos.y) + 2;

        let shadow = new cc.Node("_energyEggBushShadow");
        shadow.parent = root;
        shadow.setPosition(0, -14);
        let shadowGraphics = shadow.addComponent(cc.Graphics);
        shadowGraphics.fillColor = cc.color(0, 0, 0, 60);
        shadowGraphics.ellipse(0, 0, radius * 0.62, radius * 0.22);
        shadowGraphics.fill();

        let spriteNode = new cc.Node("_energyEggBushSprite");
        spriteNode.parent = root;
        spriteNode.setPosition(0, 8);
        spriteNode.setContentSize(radius * 1.95, radius * 1.95);
        let sprite = spriteNode.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        this._loadEnergyEggBushFrame((spriteFrame) => {
            if (sprite && cc.isValid(sprite) && spriteFrame) {
                sprite.spriteFrame = spriteFrame;
            }
        });

        let bush:any = {
            node: root,
            radius: radius,
        };
        this._energyEggBushes.push(bush);
        return bush;
    }

    spawnEnergyEggAt(pos, options: any = {}) {
        if (!this._fire._tmLayerObstacle) {
            return null;
        }

        let root = new cc.Node("EnergyEgg");
        root.parent = this._fire._tmLayerObstacle;
        root.setPosition(cc.v3(pos));
        root.zIndex = this.judgezIndex(pos.y) + 1;

        let eggScript = root.addComponent(EnergyEgg);
        let egg:any = {
            node: root,
            script: eggScript,
            eggId: options.eggId == null ? null : options.eggId,
            radius: options.radius == null ? 34 : options.radius,
            energyCount: options.energyCount == null ? 16 : options.energyCount,
            energyScatterRadius: options.energyScatterRadius == null ? 130 : options.energyScatterRadius,
            burstDone: false,
        };
        let matureCallback = options.hasOwnProperty("onMature")
            ? options.onMature
            : () => {
                this._handleEnergyEggMature(egg);
            };
        eggScript.init({
            lifeTime: options.lifeTime == null ? 10 : options.lifeTime,
            radius: egg.radius,
            autoMature: options.autoMature,
            onMature: matureCallback
        });
        this._loadEnergyEggFrame((spriteFrame) => {
            if (eggScript && cc.isValid(eggScript)) {
                eggScript.setSpriteFrame(spriteFrame);
            }
        });
        this._energyEggs.push(egg);
        return egg;
    }

    _createMultiplayerBurstEnergy(origin, energyData) {
        if (!energyData || energyData.id == null) {
            return null;
        }
        let energy = this.createEnergyAtForMultiplayer(energyData);
        if (!energy || !cc.isValid(energy)) {
            return null;
        }
        let fromPos = origin ? cc.v2(origin) : cc.v2(energy.position);
        energy.setPosition(cc.v3(fromPos));
        energy.scale = 0.18;
        energy.runAction(cc.spawn(
            cc.scaleTo(0.32, 1),
            cc.jumpTo(0.38, cc.v2(energyData.x, energyData.y), 42 + Math.random() * 18, 1)
        ));
        return energy;
    }

    _spawnMultiplayerEnergyEgg(eggData) {
        if (!eggData || eggData.id == null) {
            return null;
        }
        let exist = this._multiplayerEnergyEggMap[eggData.id];
        if (exist && exist.node && cc.isValid(exist.node)) {
            return exist;
        }
        let egg = this.spawnEnergyEggAt(cc.v2(eggData.x || 0, eggData.y || 0), {
            eggId: eggData.id,
            lifeTime: eggData.remainTime == null ? 10 : eggData.remainTime,
            radius: eggData.radius == null ? 34 : eggData.radius,
            energyCount: eggData.energyCount == null ? 16 : eggData.energyCount,
            energyScatterRadius: eggData.energyScatterRadius == null ? 130 : eggData.energyScatterRadius,
            autoMature: false,
            onMature: null,
        });
        if (!egg) {
            return null;
        }
        if (eggData.mature) {
            egg.script.forceMature();
            egg.burstDone = true;
        }
        egg.multiplayer = true;
        egg.attached = !!eggData.attached;
        egg.ownerPlayerId = eggData.ownerPlayerId == null ? null : eggData.ownerPlayerId;
        egg.attachOffset = cc.v2(eggData.attachOffsetX || 0, eggData.attachOffsetY || 0);
        egg.owner = egg.ownerPlayerId != null && this._multiplayerPlayers
            ? this._multiplayerPlayers[egg.ownerPlayerId] || null
            : null;
        this._multiplayerEnergyEggMap[eggData.id] = egg;
        return egg;
    }

    _moveMultiplayerEnergyEgg(payload) {
        if (!payload || payload.eggId == null) {
            return;
        }
        let egg = this._multiplayerEnergyEggMap[payload.eggId];
        if (!egg || !egg.node || !cc.isValid(egg.node)) {
            return;
        }
        egg.attached = !!payload.attached;
        egg.ownerPlayerId = payload.ownerPlayerId == null ? null : payload.ownerPlayerId;
        egg.attachOffset = cc.v2(payload.attachOffsetX || 0, payload.attachOffsetY || 0);
        egg.owner = egg.ownerPlayerId != null && this._multiplayerPlayers
            ? this._multiplayerPlayers[egg.ownerPlayerId] || null
            : null;
        let nextPos = cc.v2(payload.x || 0, payload.y || 0);
        if (egg.attached && egg.owner && cc.isValid(egg.owner)) {
            this._syncLocalMultiplayerInteractionPendingFromEnergyEgg(payload);
            return;
        }
        egg.node.setPosition(cc.v3(nextPos));
        egg.node.zIndex = this.judgezIndex(nextPos.y) + 1;
        this._syncLocalMultiplayerInteractionPendingFromEnergyEgg(payload);
    }

    _matureMultiplayerEnergyEgg(payload) {
        if (!payload || payload.eggId == null) {
            return;
        }
        let egg = this._multiplayerEnergyEggMap[payload.eggId];
        if (!egg) {
            egg = this._spawnMultiplayerEnergyEgg({
                id: payload.eggId,
                x: payload.x,
                y: payload.y,
                mature: true,
                radius: payload.radius,
                energyCount: payload.energyCount,
                energyScatterRadius: payload.energyScatterRadius,
                remainTime: 0,
            });
        }
        if (!egg || !egg.script) {
            return;
        }
        let origin = cc.v2(payload.x == null ? egg.node.x : payload.x, payload.y == null ? egg.node.y : payload.y);
        egg.node.setPosition(cc.v3(origin));
        if (!egg.script.isMature()) {
            egg.script.forceMature();
        }
        egg.burstDone = true;
        let energies = Array.isArray(payload.energies) ? payload.energies : [];
        for (let i = 0; i < energies.length; i++) {
            this._createMultiplayerBurstEnergy(origin, energies[i]);
        }
        this.playKillExplosionEffectAt(origin);
    }

    _removeMultiplayerEnergyEgg(eggId) {
        if (eggId == null) {
            return;
        }
        this._clearLocalMultiplayerCoverTogglePending(eggId, "energyEgg");
        let egg = this._multiplayerEnergyEggMap[eggId];
        delete this._multiplayerEnergyEggMap[eggId];
        if (!egg) {
            return;
        }
        for (let i = this._energyEggs.length - 1; i >= 0; i--) {
            if (this._energyEggs[i] === egg) {
                this._energyEggs.splice(i, 1);
                break;
            }
        }
        if (egg.node && cc.isValid(egg.node)) {
            egg.node.destroy();
        }
    }

    _handleEnergyEggMature(egg) {
        if (!egg || egg.burstDone || !egg.node || !cc.isValid(egg.node)) {
            return;
        }

        egg.burstDone = true;
        let origin = cc.v2(egg.node.position);
        let count = egg.energyCount || 16;
        let scatterRadius = egg.energyScatterRadius || 130;
        for (let i = 0; i < count; i++) {
            let angle = Math.PI * 2 * i / count + Math.random() * 0.42;
            let distance = 40 + Math.random() * scatterRadius;
            let targetPos = this.clampMapInnerPosition(origin.add(cc.v2(Math.cos(angle) * distance, Math.sin(angle) * distance)), 42);
            if (this.testColliders(targetPos, 18).length > 0) {
                targetPos = this.clampMapInnerPosition(origin.add(cc.v2(Math.cos(angle) * 42, Math.sin(angle) * 42)), 42);
            }
            let energy = this.createEnergyAt(origin);
            energy.scale = 0.18;
            energy.runAction(cc.spawn(
                cc.scaleTo(0.32, 1),
                cc.jumpTo(0.36 + Math.random() * 0.08, targetPos, 42 + Math.random() * 18, 1)
            ));
        }
        this.playKillExplosionEffectAt(origin);
        if (this._player && cc.isValid(this._player)) {
            this.node.runAction(cc.sequence(
                cc.delayTime(0.2),
                cc.callFunc(() => {
                    this._showPlayerBubble("成熟了, 回来收能量");
                })
            ));
        }
    }

    spawnOilTestPickup(pos = null) {
        if (!this._fire._tmLayerObstacle) {
            return null;
        }

        let pickup = new cc.Node("OilPickup");
        pickup.parent = this._fire._tmLayerObstacle;
        pickup.addComponent(OilPickup);
        pickup.position = cc.v3(pos || this._getOilTestPickupPos());
        pickup.zIndex = this.judgezIndex(pickup.y);
        pickup.script.setInGame(120);
        this._skills.push(pickup);
        return pickup;
    }

    spawnTarPickupAt(pos, pickupId = null, lifeTime = 120) {
        if (!this._fire._tmLayerObstacle) {
            return null;
        }
        let pickup = new cc.Node("OilPickup");
        pickup.parent = this._fire._tmLayerObstacle;
        pickup.addComponent(OilPickup);
        pickup.position = cc.v3(pos || this._getOilTestPickupPos());
        pickup.zIndex = this.judgezIndex(pickup.y);
        pickup.script.setPickupType("oil");
        pickup.script.setInGame(lifeTime);
        if (pickupId != null) {
            pickup["__tarPickupId"] = pickupId;
        }
        this._skills.push(pickup);
        return pickup;
    }

    spawnBlackHolePickupAt(pos, pickupId = null, lifeTime = 120) {
        if (!this._fire._tmLayerObstacle) {
            return null;
        }
        let pickup = new cc.Node("OilPickup");
        pickup.parent = this._fire._tmLayerObstacle;
        pickup.addComponent(OilPickup);
        pickup.position = cc.v3(pos || this._getOilTestPickupPos());
        pickup.zIndex = this.judgezIndex(pickup.y);
        pickup.script.setPickupType("blackHole");
        pickup.script.setInGame(lifeTime);
        if (pickupId != null) {
            pickup["__blackHolePickupId"] = pickupId;
        }
        this._skills.push(pickup);
        return pickup;
    }

    spawnConfiguredPickupAt(pos, pickupType = "portal", pickupId = null, lifeTime = 60) {
        if (!this._fire._tmLayerObstacle) {
            return null;
        }
        let pickup = new cc.Node("OilPickup");
        pickup.parent = this._fire._tmLayerObstacle;
        pickup.addComponent(OilPickup);
        pickup.position = cc.v3(pos || this._getOilTestPickupPos());
        pickup.zIndex = this.judgezIndex(pickup.y);
        pickup.script.setPickupType(pickupType);
        pickup.script.setInGame(lifeTime);
        if (pickupId != null) {
            pickup["__pickupId"] = pickupId;
        }
        this._skills.push(pickup);
        return pickup;
    }

    createCoverTestEnemy() {
        if (!this._player || !cc.isValid(this._player)) {
            return null;
        }

        let enemy = cc.instantiate(this.enemyPrefab);
        enemy.parent = this._fire._tmLayerObstacle;
        enemy.position = cc.v3(this._getCoverTestEnemyPos());
        enemy.script.setMap(this);
        enemy.script.setTarget(this._player);
        enemy.script.setEnemyType(11, this._levelId);
        enemy.script._config = Object.assign({}, enemy.script._config);
        enemy.script._config.AttackRadius = 880;
        enemy.script._config.BulletCodeTime = 0.32;
        enemy.script._config.Speed = 0;
        enemy.script._bulletCodeTime = enemy.script._config.BulletCodeTime;
        enemy.script._codeTime = 99999;
        enemy.script._walkPaths = [];
        enemy.script._willPos = null;
        enemy.stopAllActions();
        enemy.zIndex = this.judgezIndex(enemy.y);
        this._coverTestEnemy = enemy;
        this._enemys.push(enemy);
        return enemy;
    }

    _getCoverTestEnemyPos() {
        let playerPos = this._player && cc.isValid(this._player)
            ? cc.v2(this._player.position)
            : cc.v2(this._playerBornPos || cc.v2(0, 0));
        let dirs = [
            cc.v2(1, 0.12),
            cc.v2(1, -0.16),
            cc.v2(0.86, 0.38),
            cc.v2(0.86, -0.38),
        ];
        for (let i = 0; i < dirs.length; i++) {
            let dir = dirs[i].normalize();
            let pos = this.clampMapInnerPosition(playerPos.add(dir.mul(420 + i * 20)), 86);
            if (this.testColliders(pos, 52).length == 0 && this.lineLinePassColliders(pos, playerPos) == false) {
                return pos;
            }
        }
        return this.clampMapInnerPosition(playerPos.add(cc.v2(420, 0)), 86);
    }

    spawnCoverTestCovers(count = 6) {
        this._coverTestCovers = [];
        let playerPos = this._player && cc.isValid(this._player)
            ? cc.v2(this._player.position)
            : cc.v2(this._playerBornPos || cc.v2(0, 0));
        for (let i = 0; i < count; i++) {
            this._createCoverTestCover(this._getCoverTestCoverSpawnPos(playerPos, i, count));
        }
    }

    _getCoverTestCoverSpawnPos(playerPos, index, count) {
        for (let i = 0; i < 24; i++) {
            let baseAngle = Math.PI * 2 * ((index + i * 0.37) % count) / count;
            let angle = baseAngle + (Math.random() - 0.5) * 0.9;
            let distance = 110 + Math.random() * 180;
            let pos = cc.v2(playerPos).add(cc.v2(Math.cos(angle) * distance, Math.sin(angle) * distance));
            pos = this.clampMapInnerPosition(pos, 48);
            if (this.testColliders(pos, 38).length > 0) {
                continue;
            }
            if (pos.sub(playerPos).mag() < 90) {
                continue;
            }
            if (this._coverTestEnemy && cc.isValid(this._coverTestEnemy) && pos.sub(this._coverTestEnemy.position).mag() < 120) {
                continue;
            }

            let blocked = false;
            for (let j = 0; j < this._coverTestCovers.length; j++) {
                let cover = this._coverTestCovers[j];
                if (cover && cover.node && cc.isValid(cover.node) && pos.sub(cover.node.position).mag() < 86) {
                    blocked = true;
                    break;
                }
            }
            if (!blocked) {
                return pos;
            }
        }

        return this.clampMapInnerPosition(playerPos.add(cc.v2(140 + index * 18, index % 2 == 0 ? 90 : -90)), 48);
    }

    _createCoverTestCover(pos) {
        if (!this._fire._tmLayerObstacle) {
            return null;
        }

        let root = new cc.Node("_coverTestCrate");
        root.parent = this._fire._tmLayerObstacle;
        root.setPosition(cc.v3(pos));
        root.zIndex = this.judgezIndex(pos.y) + 1;

        let shadow = new cc.Node("_coverTestCrateShadow");
        shadow.parent = root;
        shadow.setPosition(0, -9);
        let shadowGraphics = shadow.addComponent(cc.Graphics);
        shadowGraphics.fillColor = cc.color(0, 0, 0, 68);
        shadowGraphics.ellipse(0, 0, 24, 12);
        shadowGraphics.fill();

        let spriteNode = new cc.Node("_coverSprite");
        spriteNode.parent = root;
        spriteNode.setContentSize(70, 70);
        let sprite = spriteNode.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        this._loadCoverTestFrame((spriteFrame) => {
            if (sprite && cc.isValid(sprite) && spriteFrame) {
                sprite.spriteFrame = spriteFrame;
            }
        });

        let crack = new cc.Node("_coverCrack");
        crack.parent = root;
        crack.zIndex = 2;
        crack["$Graphics"] = crack.addComponent(cc.Graphics);

        let hpNode = new cc.Node("_coverHp");
        hpNode.parent = root;
        hpNode.setPosition(0, 48);
        hpNode.color = cc.color(255, 243, 214, 255);
        let hpLabel = hpNode.addComponent(cc.Label);
        hpLabel.fontSize = 20;
        hpLabel.lineHeight = 22;
        hpLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        hpLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;

        let cover:any = {
            node: root,
            radius: 34,
            hp: 5,
            maxHp: 5,
            attached: false,
            owner: null,
            attachOffset: cc.v2(0, 0),
            ownerPlayerId: null,
            multiplayer: false,
            coverId: null,
        };
        root["__coverTestData"] = cover;
        root["$Crack"] = crack;
        root["$HpLabel"] = hpLabel;
        this._coverTestCovers.push(cover);
        this._refreshCoverTestCoverVisual(cover);
        return cover;
    }

    _refreshCoverTestCoverVisual(cover) {
        if (!cover || !cover.node || !cc.isValid(cover.node)) {
            return;
        }

        let lostHp = cover.maxHp - cover.hp;
        let spriteNode = cover.node.getChildByName("_coverSprite");
        if (spriteNode) {
            spriteNode.scale = 1 - lostHp * 0.03;
            spriteNode.color = cc.color(255, 255 - lostHp * 14, 255 - lostHp * 22, 255);
        }
        if (cover.node["$HpLabel"]) {
            cover.node["$HpLabel"].string = cover.hp + "/" + cover.maxHp;
        }
        if (cover.node["$Crack"] && cover.node["$Crack"]["$Graphics"]) {
            let graphics = cover.node["$Crack"]["$Graphics"];
            graphics.clear();
            if (lostHp > 0) {
                graphics.lineWidth = 2 + Math.min(2, lostHp * 0.35);
                graphics.strokeColor = cc.color(70, 42, 18, 220);
                graphics.moveTo(-10, 18);
                graphics.lineTo(-4, 7);
                graphics.lineTo(-11, -7);
                graphics.stroke();
                if (lostHp >= 2) {
                    graphics.moveTo(6, 17);
                    graphics.lineTo(1, 1);
                    graphics.lineTo(11, -12);
                    graphics.stroke();
                }
                if (lostHp >= 4) {
                    graphics.moveTo(-18, 2);
                    graphics.lineTo(-4, -5);
                    graphics.lineTo(8, -20);
                    graphics.stroke();
                }
            }
        }
    }

    _getOilTestPickupPos() {
        let basePos = this._player && cc.isValid(this._player)
            ? cc.v2(this._player.position)
            : cc.v2(this._playerBornPos || cc.v2(0, 0));
        let candidateDirs = [
            cc.v2(0, 1),
            cc.v2(1, 0),
            cc.v2(-1, 0),
            cc.v2(0, -1),
        ];
        for (let i = 0; i < candidateDirs.length; i++) {
            let pos = this.clampMapInnerPosition(basePos.add(candidateDirs[i].mul(150)), 70);
            if (this.testColliders(pos, 42).length == 0) {
                return pos;
            }
        }
        return this.clampMapInnerPosition(basePos.add(cc.v2(0, 120)), 70);
    }

    _createDefaultEnergy() {
        let energy = new cc.Node("EnergyItem");
        energy.addComponent(EnergyItem);
        return energy;
    }

    _getRandomPassableTile() {
        let keys = Object.keys(this._checkList);
        if (keys.length == 0) {
            return null;
        }

        for (let i = 0; i < 20; i++) {
            let item = this._checkList[keys[Math.floor(Math.random() * keys.length)]];
            if (item && this._isEnergyTileEmpty(item)) {
                return cc.v2(item.x, item.y);
            }
        }

        return null;
    }

    _isEnergyTileEmpty(tile) {
        let pos = this.tileToGamePos(tile);
        let minDistance = this._getEnergyConfig("MinDistance", 120);

        if (this._player && cc.isValid(this._player)) {
            let playerLen = pos.sub(this._player.position).mag();
            if (playerLen < minDistance) {
                return false;
            }
        }

        for (let i = 0; i < this._energys.length; i++) {
            let energy = this._energys[i];
            if (cc.isValid(energy)) {
                let len = pos.sub(energy.position).mag();
                if (len < minDistance) {
                    return false;
                }
            }
        }

        return true;
    }

    getMultiplayerEnergySpawnPoints(limit = 256) {
        let keys = Object.keys(this._checkList || {});
        if (keys.length <= 0) {
            return [];
        }

        let result = [];
        let step = Math.max(1, Math.floor(keys.length / limit));
        for (let i = 0; i < keys.length; i += step) {
            let item = this._checkList[keys[i]];
            if (!item) {
                continue;
            }
            let pos = this.tileToGamePos(cc.v2(item.x, item.y));
            result.push({
                x: Math.round(pos.x),
                y: Math.round(pos.y),
            });
            if (result.length >= limit) {
                break;
            }
        }
        return result;
    }

    getMultiplayerMapBounds() {
        return {
            halfWidth: Math.round(this._tmSize.width / 2),
            halfHeight: Math.round(this._tmSize.height / 2),
        };
    }

    getMultiplayerSpawnCandidates() {
        let candidates = this._getMultiplayerSpawnCandidates();
        let result = [];
        for (let i = 0; i < candidates.length; i++) {
            let pos = candidates[i];
            if (!pos) {
                continue;
            }
            result.push({
                x: Math.round(pos.x),
                y: Math.round(pos.y),
            });
        }
        return result;
    }

    _getMultiplayerPreferredSafeRadius() {
        if (!this._tmSize) {
            return 0;
        }
        let halfWidth = Math.max(0, this._tmSize.width / 2);
        let halfHeight = Math.max(0, this._tmSize.height / 2);
        let startRadiusBase = Math.min(halfWidth, halfHeight);
        let startRadius = Math.max(
            MULTIPLAYER_SAFE_ZONE_MIN_RADIUS,
            Math.floor(Math.max(0, startRadiusBase - MULTIPLAYER_SAFE_ZONE_START_PADDING))
        );
        let targetRadius = Math.max(
            MULTIPLAYER_SAFE_ZONE_MIN_RADIUS,
            Math.floor(startRadius * MULTIPLAYER_SAFE_ZONE_FIXED_RADIUS_RATIO)
        );
        return Math.min(startRadius, targetRadius);
    }

    _getMultiplayerBushPreferredSafeRadius() {
        return this._getMultiplayerPreferredSafeRadius();
    }

    _buildMapGrassBushTileData(obj, offset, node = null) {
        if (!obj) {
            return null;
        }
        let width = Number(obj.width);
        let height = Number(obj.height);
        return {
            x: Math.round(offset.x),
            y: Math.round(offset.y),
            width: Number.isFinite(width) && width > 0 ? Math.round(width) : 188,
            height: Number.isFinite(height) && height > 0 ? Math.round(height) : 188,
            node: node,
        };
    }

    _bushRectsTouchOrOverlap(rectA, rectB, gap = MAP_GRASS_BUSH_MERGE_GAP) {
        if (!rectA || !rectB) {
            return false;
        }
        let halfWidthA = Math.max(0, (rectA.width || 0) / 2);
        let halfHeightA = Math.max(0, (rectA.height || 0) / 2);
        let halfWidthB = Math.max(0, (rectB.width || 0) / 2);
        let halfHeightB = Math.max(0, (rectB.height || 0) / 2);
        let dx = Math.abs((rectA.x || 0) - (rectB.x || 0));
        let dy = Math.abs((rectA.y || 0) - (rectB.y || 0));
        return dx <= (halfWidthA + halfWidthB + gap) && dy <= (halfHeightA + halfHeightB + gap);
    }

    _rebuildMapGrassBushes() {
        let groups = [];
        let visited = {};
        for (let i = 0; i < this._mapGrassBushTiles.length; i++) {
            if (visited[i]) {
                continue;
            }
            let queue = [i];
            visited[i] = true;
            let groupTiles = [];
            while (queue.length > 0) {
                let index = queue.shift();
                let tile = this._mapGrassBushTiles[index];
                if (!tile) {
                    continue;
                }
                groupTiles.push(tile);
                for (let j = 0; j < this._mapGrassBushTiles.length; j++) {
                    if (visited[j]) {
                        continue;
                    }
                    let otherTile = this._mapGrassBushTiles[j];
                    if (!otherTile) {
                        continue;
                    }
                    if (this._bushRectsTouchOrOverlap(tile, otherTile)) {
                        visited[j] = true;
                        queue.push(j);
                    }
                }
            }
            if (groupTiles.length > 0) {
                groups.push(this._buildMergedMapGrassBush(groupTiles, groups.length + 1));
            }
        }
        this._mapGrassBushes = groups;
    }

    _buildMergedMapGrassBush(tiles, bushId) {
        if (!tiles || tiles.length <= 0) {
            return null;
        }
        let minX = 0;
        let maxX = 0;
        let minY = 0;
        let maxY = 0;
        let started = false;
        let nodes = [];
        let rects = [];
        for (let i = 0; i < tiles.length; i++) {
            let tile = tiles[i];
            if (!tile) {
                continue;
            }
            let halfWidth = Math.max(0, (tile.width || 0) / 2);
            let halfHeight = Math.max(0, (tile.height || 0) / 2);
            let left = (tile.x || 0) - halfWidth;
            let right = (tile.x || 0) + halfWidth;
            let bottom = (tile.y || 0) - halfHeight;
            let top = (tile.y || 0) + halfHeight;
            if (!started) {
                minX = left;
                maxX = right;
                minY = bottom;
                maxY = top;
                started = true;
            }
            else{
                minX = Math.min(minX, left);
                maxX = Math.max(maxX, right);
                minY = Math.min(minY, bottom);
                maxY = Math.max(maxY, top);
            }
            rects.push({
                x: Math.round(tile.x || 0),
                y: Math.round(tile.y || 0),
                width: Math.round(tile.width || 0),
                height: Math.round(tile.height || 0),
            });
            if (tile.node && cc.isValid(tile.node)) {
                nodes.push(tile.node);
            }
        }
        if (!started) {
            return null;
        }
        let width = Math.max(1, Math.round(maxX - minX));
        let height = Math.max(1, Math.round(maxY - minY));
        let centerX = Math.round((minX + maxX) / 2);
        let centerY = Math.round((minY + maxY) / 2);
        return {
            id: bushId,
            x: centerX,
            y: centerY,
            width: width,
            height: height,
            radius: Math.max(Math.round(Math.max(width, height) / 2), MULTIPLAYER_BUSH_RADIUS),
            rects: rects,
            nodes: nodes,
            node: nodes.length > 0 ? nodes[0] : null,
            fromMapGrass: true,
        };
    }

    getMultiplayerBushesFromMap() {
        let result = [];
        for (let i = 0; i < this._mapGrassBushes.length; i++) {
            let bush = this._mapGrassBushes[i];
            if (!bush) {
                continue;
            }
            result.push({
                id: bush.id == null ? i + 1 : bush.id,
                x: Math.round(bush.x || 0),
                y: Math.round(bush.y || 0),
                width: Math.round(bush.width || 0),
                height: Math.round(bush.height || 0),
                radius: Math.round(bush.radius || MULTIPLAYER_BUSH_RADIUS),
                rects: Array.isArray(bush.rects) ? bush.rects.map((rect) => ({
                    x: Math.round(rect.x || 0),
                    y: Math.round(rect.y || 0),
                    width: Math.round(rect.width || 0),
                    height: Math.round(rect.height || 0),
                })) : [],
            });
        }
        return result;
    }

    _getMapGrassBushById(bushId) {
        if (bushId == null) {
            return null;
        }
        for (let i = 0; i < this._mapGrassBushes.length; i++) {
            let bush = this._mapGrassBushes[i];
            if (bush && bush.id == bushId) {
                return bush;
            }
        }
        return null;
    }

    _normalizeMultiplayerBushSpawnPoint(rawPoint) {
        if (!rawPoint) {
            return null;
        }
        let x = Number(rawPoint.x);
        let y = Number(rawPoint.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return null;
        }

        let pos = this.clampMapInnerPosition(cc.v2(x, y), MULTIPLAYER_BUSH_MAP_PADDING);
        let safeRadius = this._getMultiplayerBushPreferredSafeRadius() - MULTIPLAYER_BUSH_SAFE_PADDING;
        if (safeRadius > 0) {
            let len = pos.mag();
            if (len > safeRadius) {
                pos = len > 0 ? pos.mul(safeRadius / len) : cc.v2(0, 0);
            }
        }
        pos = this.clampMapInnerPosition(pos, MULTIPLAYER_BUSH_MAP_PADDING);
        return {
            x: Math.round(pos.x),
            y: Math.round(pos.y),
        };
    }

    getMultiplayerBushSpawnPoints(limit = 24) {
        let mapBushes = this.getMultiplayerBushesFromMap();
        if (mapBushes.length > 0) {
            let result = [];
            let maxCount = Math.max(0, Math.floor(limit));
            for (let i = 0; i < mapBushes.length; i++) {
                if (maxCount > 0 && result.length >= maxCount) {
                    break;
                }
                result.push({
                    x: mapBushes[i].x,
                    y: mapBushes[i].y,
                });
            }
            return result;
        }
        let result = [];
        let used = {};
        let maxCount = Math.max(0, Math.floor(limit));
        for (let i = 0; i < MULTIPLAYER_BUSH_LAYOUT_POINTS.length; i++) {
            if (maxCount > 0 && result.length >= maxCount) {
                break;
            }
            let pos = this._normalizeMultiplayerBushSpawnPoint(MULTIPLAYER_BUSH_LAYOUT_POINTS[i]);
            if (!pos) {
                continue;
            }
            let key = pos.x + ":" + pos.y;
            if (used[key]) {
                continue;
            }
            used[key] = true;
            result.push(pos);
        }
        return result;
    }

    //获取最近的敌人
    getNearEnemy() {
        let ret = null;
        let retLen = 0;
        for (let i = 0; i < this._enemys.length; i++) {
            let enemy = this._enemys[i];
            
            let enemyPos = cc.v2(enemy.position);
            let playerPos = cc.v2(this._player.position);
            let len = enemyPos.sub(playerPos).mag()
            if (ret == null || len < retLen) {
                ret = enemy;
                retLen = len;
            }
        }

        return ret;
    }
    
    //在同一个tile,还有其他敌人
    isHaveOtherEnemy(enemy) {
        for (let i = 0; i < this._enemys.length; i++) {
            let otherEnemy = this._enemys[i];
            if (otherEnemy != enemy) {
                let tile = this.gamePosToTile(enemy.position);
                let otherTile = this.gamePosToTile(otherEnemy.position);
                if (tile.x == otherTile.x && tile.y == otherTile.y) {
                    return true;       
                }
            }
        }

        return false;
    }

    //按下
    _onTouchStart(event) {
        let a =1;
        // let point = this.node.convertToNodeSpaceAR(event.getLocation());
        // let tile = this.gamePosToTile(point);

    }
    
    resetMap() {

        for (let row = 0; row < this._tiledMap.getMapSize().width; row++) {
            
            for (let col = 0; col < this._tiledMap.getMapSize().height; col++) {
                this._tmGroup.setTileGIDAt(1, cc.v2(row,col));
            }
        }
    }

    //tiled map坐标转换为游戏坐标
    _tilePosToGamePos(tiledPos) {
        let pos = cc.v2(tiledPos.x, this._tmSize.height - tiledPos.y);
        pos.x = pos.x - this._tmSize.width/2;
        pos.y = pos.y - this._tmSize.height/2;

        return pos;
    }

    //tile坐标转换为游戏坐标
    tileToGamePos(tile) {
        let x = tile.x * this._tileSize.width + this._tileSize.width/2;
        let y = tile.y * this._tileSize.height + this._tileSize.height/2;

        return this._tilePosToGamePos(cc.v2(x,y));
    }

    //游戏坐标转换为tiled map坐标
    _gamePosToTilePos(gamePos) {
        let pos = cc.v2(gamePos);
        pos.x = pos.x + this._tmSize.width/2;
        pos.y = pos.y + this._tmSize.height/2;
        pos.y = this._tmSize.height - pos.y;

        return pos;
    }

    //游戏坐标转换为tile坐标
    gamePosToTile(gamePos) {
        let tilePos = this._gamePosToTilePos(gamePos);
        let x = Math.floor(tilePos.x / this._tileSize.width);
        let y = Math.floor(tilePos.y / this._tileSize.height);
        return cc.v2(x, y);
    }


    //初始化A*检测列表
    initCheckList () {
        let ret = {};
        for (let x = 0; x < this._tiledMap.getMapSize().width; x++) {
            for (let y = 0; y < this._tiledMap.getMapSize().height; y++) {
                
                let pos = this.tileToGamePos(cc.v2(x, y));
                if (this.testColliders(pos,50).length == 0) {
                    let item : any= {};
                    item.x = x;
                    item.y = y;
                    item.G = 0;
                    item.H = 0;
                    item.father = null;
                    item.passable = {};
                    ret[x+"_"+y] = item;
                    // this._tmGroup.setTileGIDAt(3, cc.v2(x,y));
                }
            }
        }

        
        for (let x = 0; x < this._tiledMap.getMapSize().width; x++) {
            for (let y = 0; y < this._tiledMap.getMapSize().height; y++) {
                let item = ret[x+"_"+y];
                let pos = this.tileToGamePos(cc.v2(x, y));
                if (item) {
                    
                    for (let newx = x-1; newx <= x+1; newx++){
                        for (let newy = y-1; newy <= y+1; newy++){
                            let newItem = ret[newx+"_"+newy];
                            let newPassableItem = item.passable[newx+"_"+newy];
                            if ((x != newx || y != newy) && newItem && newPassableItem == null){
                                let newpos = this.tileToGamePos(cc.v2(newx, newy));
                                if (this.circleCirclePassColliders(pos,newpos,50) == false) {
                                    item.passable[newx+"_"+newy] = 1;
                                    newItem.passable[x+"_"+y] = 1;
                                }
                            }

                        }
                    }
                }
            }
        }
        return ret;
    }

    //获取A*检测列表
    getCheckList () {
        var objString = JSON.stringify(this._checkList);
        return JSON.parse(objString);
    }
    
    //获取pos所在tile,最近的可通行tile
    getPassableTile (tile,referTile) {
        //判断自己
        // if (this._checkList[tile.x + "_" + tile.y]) {
        //     return tile;
        // }

        //判断一环
        let retTile = null;
        let retLen = 0;
        for (let x = -1; x <= 1; x++){
            for (let y = -1; y <= 1; y++){
                if (x != 0 || y!= 0) {
                    let newx = tile.x + x;
                    let newy = tile.y + y;
                    let newtile = this._checkList[newx + "_" + newy];
                    if (newtile){
                        let len = (referTile.x-newx)*(referTile.x-newx) + (referTile.y-newy)*(referTile.y-newy);
                        if (retTile == null || len < retLen) {
                            retTile = newtile;
                            retLen = len;
                        }
                    }
                    
                }
            }
        }
        if (retTile) {
            return retTile;
        }

        //判断二环
        retTile = null;
        retLen = 0;
        for (let x = -2; x <= 2; x++){
            for (let y = -2; y <= 2; y++){
                if (x == -2 || x == 2 || y == -2 || y == 2) {
                    let newx = tile.x + x;
                    let newy = tile.y + y;
                    let newtile = this._checkList[newx + "_" + newy];
                    if (newtile){
                        let len = (referTile.x-newx)*(referTile.x-newx) + (referTile.y-newy)*(referTile.y-newy);
                        if (retTile == null || len < retLen) {
                            retTile = newtile;
                            retLen = len;
                        }
                    }
                    
                }
            }
        }
        if (retTile) {
            return retTile;
        }

        return tile;
    }

    //获取pos所在tile,最近的可通行tile
    getPassableTileEx (tile) {
        //判断一环
        let retTiles = [];
        for (let x = -2; x <= 2; x++){
            for (let y = -2; y <= 2; y++){
                if (x != 0 || y!= 0) {
                    let newx = tile.x + x;
                    let newy = tile.y + y;
                    let newtile = this._checkList[newx + "_" + newy];
                    if (newtile){
                        retTiles.push(newtile);
                    }
                    
                }
            }
        }

        if (retTiles.length > 0) {
            let index = Math.floor(Math.random()*retTiles.length);
            return retTiles[index];
        }

        return tile;
    }

    // 线段PP1,是否会经过colliders中的一条线段
    lineLinePassColliders(P,P1){
        for (let i = 0; i < this._colliders.length; i++) {
            let collider = this._colliders[i];

            let A = collider.offset.add(collider.points[0]);
            let B = collider.offset.add(collider.points[1]);
            if (Utils.linePassLine(P,P1,A,B)){
                return true;
            }
        }

        return false;
    }

    // 点P,P1为圆心,radius为半径的圆,是否会经过colliders中的一条线段
    circleCirclePassColliders(P,P1,radius){
        for (let i = 0; i < this._colliders.length; i++) {
            let collider = this._colliders[i];

            let A = collider.offset.add(collider.points[0]);
            let B = collider.offset.add(collider.points[1]);
            if (Utils.circleCirclePassLine(P,P1,radius,A,B)){
                return true;
            }
        }

        return false;
    }

    //碰撞测试(以点P为圆心,半径为radius的圆,是否和colliders中的线段相交)
    testColliders(P, radius){
        let colliderItems = [];
        for (const key in this._colliders) {
            if (this._colliders.hasOwnProperty(key)) {
                let collider = this._colliders[key];
                
                let A = collider.offset.add(collider.points[0]);
                let B = collider.offset.add(collider.points[1]);
                let colliderItem = Utils.getPointLineShortestInfo(P, A, B);
                
                if (colliderItem.len <= radius) {
                    colliderItem.collider = collider;
                    colliderItems.push(colliderItem);
                }
            }
        }

        return colliderItems;
    }

    //每帧调用
    update(dt) {
        if (this._pause) return;

        this._updateKillBroadcastEntries();
        this._updateOilSpills(dt);
        this._updateBlackHoleArea(dt);
        this._updateEnergyEggTest();
        if (this._killStreakRemain > 0) {
            this._killStreakRemain -= dt;
            if (this._killStreakRemain <= 0) {
                this._killStreakRemain = 0;
                this._killStreakCount = 0;
            }
        }
        
        if (this._gaming) {
            this._bornCdTime += dt;
            if (this.isTestMode() == false &&
                this._bornCdTime > 1 &&
                this._enemys.length < this._timeMaxEnemyCount &&
                this._bornEnemyCount < this._maxEnemyCount) {

                this._bornCdTime = 0;
                this.createEnemy();
                this._bornEnemyCount += 1;
            }
    
            //地图滚动
            this.rollMap();

            if (this.isTestMode() == false) {
                this._updateEnergy(dt);
                this._updateSinglePlayerTarPickup(dt);
                this._updateSinglePlayerBlackHolePickup(dt);
            }

            if (this._player && cc.isValid(this._player)) {
                this._playerLastPos = this._player.position
            }
        }
        else{
            if (this._roamFlg) {
                let roamPosition = cc.v2(this.node.position).add(this._roamDir);
                roamPosition = this._correctMapPosition(roamPosition);
                if (roamPosition.x == this.node.x && roamPosition.y == this.node.y) {
                    this._roamDir.x = Math.floor(Math.random()*3)-1;
                    this._roamDir.y = Math.floor(Math.random()*3)-1;
                }
                else{
                    this.node.x = roamPosition.x;
                    this.node.y = roamPosition.y;
                }
            }
        }
    }

    _updateOilSpills(dt) {
        for (let i = this._oilSpills.length - 1; i >= 0; i--) {
            let spill = this._oilSpills[i];
            if (!spill || !spill.node || !cc.isValid(spill.node)) {
                this._oilSpills.splice(i, 1);
                continue;
            }

            spill.lifeTime -= dt;
            if (spill.lifeTime <= 0) {
                spill.node.destroy();
                this._oilSpills.splice(i, 1);
                continue;
            }

            let fadeStart = Math.min(2.2, spill.duration * 0.3);
            let opacity = 255;
            if (spill.lifeTime < fadeStart) {
                opacity = Math.floor(255 * (spill.lifeTime / fadeStart));
            }
            spill.node.opacity = Math.max(0, opacity);
            spill.node.zIndex = this.judgezIndex(spill.node.y) - 2;
        }
    }

    _updateBlackHoleArea(dt) {
        if (this._multiplayerMode) {
            for (let i = this._multiplayerBlackHoleAreas.length - 1; i >= 0; i--) {
                let area = this._multiplayerBlackHoleAreas[i];
                if (!area || !area.node || !cc.isValid(area.node)) {
                    this._multiplayerBlackHoleAreas.splice(i, 1);
                    continue;
                }
                if (area.duration != null) {
                    area.remainTime -= dt;
                    if (area.remainTime <= 0) {
                        area.remainTime = 0;
                        if (cc.isValid(area.node)) {
                            area.node.destroy();
                        }
                        this._multiplayerBlackHoleAreas.splice(i, 1);
                    }
                }
            }
            return;
        }
        if (!this._blackHoleAreaData || !this._blackHoleAreaData.node || !cc.isValid(this._blackHoleAreaData.node)) {
            return;
        }
        if (this._blackHoleAreaData.duration != null) {
            this._blackHoleAreaData.remainTime -= dt;
            if (this._blackHoleAreaData.remainTime <= 0) {
                this._clearBlackHoleTestNodes();
            }
        }
    }

    //地图滚动
    rollMap(){
        if (this._player && cc.isValid(this._player)) {
            let ret = this._correctMapPosition(cc.v2(-this._player.x,-this._player.y));
            this.node.x = ret.x;
            this.node.y = ret.y;
        }
    }

    spawnOilSpill(pos, options: any = {}) {
        if (!this._tmDecal || !cc.isValid(this._tmDecal)) {
            return null;
        }

        let spillPos = this.clampMapInnerPosition(cc.v2(pos), 68);
        let radius = options.radius || OIL_SPILL_RADIUS;
        let duration = options.duration || OIL_SPILL_DURATION;
        let slowFactor = options.slowFactor || OIL_SPILL_SLOW_FACTOR;

        let root = new cc.Node("_oilSpill");
        root.parent = this._tmDecal;
        root.setPosition(cc.v3(spillPos));
        root.zIndex = this.judgezIndex(spillPos.y) - 2;

        let spriteNode = new cc.Node("_oilSpillSprite");
        spriteNode.parent = root;
        spriteNode.opacity = 228;
        spriteNode.setContentSize(radius * 2.15, radius * 2.15);
        let sprite = spriteNode.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        spriteNode.color = cc.color(80, 56, 30, 228);
        this._loadOilSpillFrame((spriteFrame) => {
            if (sprite && cc.isValid(sprite) && spriteFrame) {
                sprite.spriteFrame = spriteFrame;
            }
        });

        let rim = new cc.Node("_oilSpillRim");
        rim.parent = root;
        let rimGraphics = rim.addComponent(cc.Graphics);
        rimGraphics.lineWidth = 5;
        rimGraphics.strokeColor = cc.color(145, 104, 62, 135);
        rimGraphics.circle(0, 0, radius * 0.9);
        rimGraphics.stroke();

        let core = new cc.Node("_oilSpillCore");
        core.parent = root;
        let coreGraphics = core.addComponent(cc.Graphics);
        coreGraphics.fillColor = cc.color(26, 18, 14, 110);
        coreGraphics.circle(0, 0, radius * 0.72);
        coreGraphics.fill();

        let splash = new cc.Node("_oilSpillSplash");
        splash.parent = root;
        splash.opacity = 0;
        splash.scale = 0.45;
        let splashGraphics = splash.addComponent(cc.Graphics);
        splashGraphics.lineWidth = 7;
        splashGraphics.strokeColor = cc.color(188, 142, 86, 160);
        splashGraphics.circle(0, 0, radius * 0.58);
        splashGraphics.stroke();
        splash.runAction(cc.sequence(
            cc.spawn(
                cc.fadeTo(0.1, 220),
                cc.scaleTo(0.1, 1.12)
            ),
            cc.spawn(
                cc.fadeOut(0.24),
                cc.scaleTo(0.24, 1.55)
            ),
            cc.removeSelf()
        ));

        let spill = {
            node: root,
            radius: radius,
            slowFactor: slowFactor,
            lifeTime: duration,
            duration: duration,
        };
        this._oilSpills.push(spill);
        return root;
    }

    showOilShellPreview(fromPos, toPos, options: any = {}) {
        this.hideOilShellPreview();
        if (!this._tmDecal || !cc.isValid(this._tmDecal) || !fromPos || !toPos) {
            return;
        }
        let root = new cc.Node("_oilShellPreview");
        root.parent = this._tmDecal;
        root.zIndex = 4000;
        this._oilShellPreviewNode = root;

        let line = new cc.Node("_oilShellPreviewLine");
        line.parent = root;
        let graphics = line.addComponent(cc.Graphics);
        graphics.lineWidth = 4;
        graphics.strokeColor = cc.color(190, 150, 92, 220);
        let start = cc.v2(fromPos);
        let end = cc.v2(toPos);
        let control = start.add(end).mul(0.5).add(cc.v2(0, options.radius || 110));
        graphics.moveTo(start.x, start.y);
        for (let i = 1; i <= 18; i++) {
            let t = i / 18;
            let inv = 1 - t;
            let point = start.mul(inv * inv).add(control.mul(2 * inv * t)).add(end.mul(t * t));
            graphics.lineTo(point.x, point.y);
        }
        graphics.stroke();

        let target = new cc.Node("_oilShellPreviewTarget");
        target.parent = root;
        target.setPosition(cc.v3(end));
        let targetGraphics = target.addComponent(cc.Graphics);
        let areaRadius = options.areaRadius || OIL_SPILL_RADIUS;
        targetGraphics.lineWidth = 4;
        targetGraphics.strokeColor = cc.color(115, 88, 54, 220);
        targetGraphics.circle(0, 0, areaRadius * 0.92);
        targetGraphics.stroke();
        targetGraphics.fillColor = cc.color(24, 20, 18, 55);
        targetGraphics.circle(0, 0, areaRadius * 0.72);
        targetGraphics.fill();
    }

    hideOilShellPreview() {
        if (this._oilShellPreviewNode && cc.isValid(this._oilShellPreviewNode)) {
            this._oilShellPreviewNode.destroy();
        }
        this._oilShellPreviewNode = null;
    }

    playOilShellThrow(fromPos, toPos, options: any = {}) {
        if (!this._fire._tmLayerObstacle || !fromPos || !toPos) {
            if (options && options.onLand) {
                options.onLand();
            }
            return;
        }
        let shell = new cc.Node("_oilThrowShell");
        shell.parent = this._fire._tmLayerObstacle;
        shell.setPosition(cc.v3(fromPos));
        shell.zIndex = 5200;
        let graphics = shell.addComponent(cc.Graphics);
        graphics.fillColor = cc.color(70, 48, 28, 235);
        graphics.circle(0, 0, 18);
        graphics.fill();
        graphics.fillColor = cc.color(24, 18, 14, 220);
        graphics.circle(-6, 2, 7);
        graphics.fill();
        graphics.circle(7, -3, 8);
        graphics.fill();

        let start = cc.v2(fromPos);
        let end = cc.v2(toPos);
        let control = start.add(end).mul(0.5).add(cc.v2(0, options.arcHeight || 110));
        let duration = 0.28;
        let self = this;
        let tData = { value: 0 };
        shell.runAction(cc.sequence(
            cc.spawn(
                cc.rotateBy(duration, 220),
                cc.sequence(
                    cc.callFunc(function () {
                        shell["__throwScheduler"] = function () {
                            tData.value += 1 / Math.max(1, Math.floor(duration * 60));
                            if (tData.value > 1) {
                                tData.value = 1;
                            }
                            let t = tData.value;
                            let inv = 1 - t;
                            let point = start.mul(inv * inv).add(control.mul(2 * inv * t)).add(end.mul(t * t));
                            shell.setPosition(cc.v3(point));
                            shell.zIndex = 5200;
                        };
                        self.schedule(shell["__throwScheduler"], 0);
                    }),
                    cc.delayTime(duration)
                )
            ),
            cc.callFunc(function () {
                if (shell["__throwScheduler"]) {
                    self.unschedule(shell["__throwScheduler"]);
                }
                shell.destroy();
                if (options && options.onLand) {
                    options.onLand();
                }
            })
        ));
    }

    getTerrainSpeedFactor(pos, radius = 0) {
        let factor = 1;
        let checkPos = cc.v2(pos);
        for (let i = this._oilSpills.length - 1; i >= 0; i--) {
            let spill = this._oilSpills[i];
            if (!spill || !spill.node || !cc.isValid(spill.node)) {
                this._oilSpills.splice(i, 1);
                continue;
            }

            let limit = spill.radius + radius * 0.35;
            if (checkPos.sub(spill.node.position).mag() <= limit) {
                factor = Math.min(factor, spill.slowFactor);
            }
        }
        return factor;
    }

    _updateEnergyEggTest() {
        if (this._energyEggs.length <= 0 && this._energyEggBushes.length <= 0) {
            return;
        }

        for (let i = this._energyEggBushes.length - 1; i >= 0; i--) {
            let bush = this._energyEggBushes[i];
            if (!bush || !bush.node || !cc.isValid(bush.node)) {
                this._energyEggBushes.splice(i, 1);
                continue;
            }
            bush.node.zIndex = this.judgezIndex(bush.node.y) + 2;
        }

        for (let i = this._energyEggs.length - 1; i >= 0; i--) {
            let egg = this._energyEggs[i];
            if (!egg || !egg.node || !cc.isValid(egg.node) || !egg.script) {
                this._energyEggs.splice(i, 1);
                continue;
            }

            let hidden = false;
            for (let j = 0; j < this._energyEggBushes.length; j++) {
                let bush = this._energyEggBushes[j];
                if (!bush || !bush.node || !cc.isValid(bush.node)) {
                    continue;
                }
                if (cc.v2(egg.node.position).sub(bush.node.position).mag() <= bush.radius * 0.78) {
                    hidden = true;
                    break;
                }
            }
            egg.script.setHiddenInBush(hidden);
            egg.node.zIndex = this.judgezIndex(egg.node.y) + 1;
        }

        if (this._multiplayerMode) {
            return;
        }

        if (this._player && cc.isValid(this._player) && this._player.script) {
            this._pushEnergyEggsByPlayer(this._player.script);
        }
    }

    _pushEnergyEggsByPlayer(player) {
        if (!player || !player.node || !cc.isValid(player.node) || player._currentSpeed <= 0.25) {
            return;
        }

        let playerPos = cc.v2(player.node.position);
        let playerDir = player._dir && player._dir.magSqr() > 0 ? cc.v2(player._dir).normalize() : cc.v2(1, 0);
        let playerRadius = player.getRadius ? player.getRadius() : 38;
        for (let i = 0; i < this._energyEggs.length; i++) {
            let egg = this._energyEggs[i];
            if (!egg || !egg.node || !cc.isValid(egg.node) || !egg.script) {
                continue;
            }

            let eggPos = cc.v2(egg.node.position);
            let offset = eggPos.sub(playerPos);
            let minDistance = playerRadius * 0.48 + egg.script.getRadius() + 8;
            if (offset.mag() > minDistance) {
                continue;
            }

            let pushDir = offset.magSqr() > 9 ? offset.normalize() : playerDir;
            if (pushDir.dot(playerDir) < -0.2) {
                continue;
            }

            let pushDistance = Math.max(1.6, player._currentSpeed * (egg.script.isMature() ? 0.42 : 0.62));
            let nextPos = this.clampMapInnerPosition(eggPos.add(pushDir.mul(pushDistance)), egg.script.getRadius() + 8);
            if (this.testColliders(nextPos, egg.script.getRadius() + 3).length > 0) {
                continue;
            }
            if (this._isEnergyEggBlockedByOtherEgg(egg, nextPos)) {
                continue;
            }

            egg.node.setPosition(cc.v3(nextPos));
            egg.node.zIndex = this.judgezIndex(nextPos.y) + 1;
        }
    }

    _isEnergyEggBlockedByOtherEgg(currentEgg, nextPos) {
        for (let i = 0; i < this._energyEggs.length; i++) {
            let other = this._energyEggs[i];
            if (other == currentEgg || !other || !other.node || !cc.isValid(other.node) || !other.script) {
                continue;
            }
            let limit = currentEgg.script.getRadius() + other.script.getRadius() + 8;
            if (cc.v2(other.node.position).sub(nextPos).mag() < limit) {
                return true;
            }
        }
        return false;
    }

    _getViewportSize() {
        let canvas = Utils.getCurrentSceneCanvas();
        if (canvas && cc.isValid(canvas)) {
            return canvas.getContentSize();
        }
        let visibleSize = cc.view.getVisibleSize();
        if (visibleSize && visibleSize.width > 0 && visibleSize.height > 0) {
            return visibleSize;
        }
        if (yyp.gameFrameSize) {
            return yyp.gameFrameSize;
        }
        return cc.winSize;
    }

    clampMapInnerPosition(pos, padding = 0) {
        let ret = cc.v2(pos);
        let halfWidth = Math.max(0, this._tmSize.width / 2 - padding);
        let halfHeight = Math.max(0, this._tmSize.height / 2 - padding);

        if (ret.x < -halfWidth) {
            ret.x = -halfWidth;
        }
        if (ret.x > halfWidth) {
            ret.x = halfWidth;
        }
        if (ret.y < -halfHeight) {
            ret.y = -halfHeight;
        }
        if (ret.y > halfHeight) {
            ret.y = halfHeight;
        }

        return ret;
    }
    
    _correctMapPosition(ret){
        let viewportSize = this._getViewportSize();
        let x = Math.max(0, (this._tmSize.width - viewportSize.width) / 2);
        let y = Math.max(0, (this._tmSize.height - viewportSize.height) / 2);
        let minPos = cc.v2(-x,-y);
        let maxPos = cc.v2(x,y);

        if (ret.x < minPos.x) {
            ret.x = minPos.x;
        }
        if (ret.x > maxPos.x) {
            ret.x = maxPos.x;
        }
        if (ret.y < minPos.y) {
            ret.y = minPos.y;
        }
        if (ret.y > maxPos.y) {
            ret.y = maxPos.y;
        }

        return ret;
    }

    //线段与矩形相交或者包含在矩形里面
    _lineInRect(A,B,rect){
        if ((A.x >= rect.x && A.x <= rect.x + rect.width && A.y >= rect.y && A.y <= rect.y + rect.height) ||
            (B.x >= rect.x && B.x <= rect.x + rect.width && B.y >= rect.y && B.y <= rect.y + rect.height) ||
            cc.Intersection.lineRect(A,B,rect) ) {
                return true;
        }
        return false;
    }

    //子弹,障碍物碰撞检测
    bulletObstacleCollisionTest(P,P1){
        return this.getBulletObstacleCollisionSegment(P, P1) != null;
    }

    getBulletObstacleCollisionSegment(P, P1) {
        //获取碰撞区
        let currArea = null;
        for (let i = 0; i < this._logicArea.length; i++) {
            let area = this._logicArea[i];
            if (P.x >= area.x && P.x <= area.x + area.width && P.y >= area.y && P.y <= area.y + area.height) {
                currArea = area;
                break;
            }
        }

        if (currArea) {
            for (let i = 0; i < currArea.length; i++) {
                let A = currArea[i].A;
                let B = currArea[i].B;
                if (cc.Intersection.lineLine(P,P1,A,B)) {
                    return {A: A, B: B};
                }
            }
        }
        else{
            // cc.log("未找到碰撞分区")
        }
        
        return null;
    }

    _distancePointToSegment(point, A, B) {
        let AB = B.sub(A);
        let lenSqr = AB.magSqr();
        if (lenSqr <= 0) {
            return point.sub(A).mag();
        }

        let t = point.sub(A).dot(AB) / lenSqr;
        t = cc.misc.clampf(t, 0, 1);
        let projection = A.add(AB.mul(t));
        return point.sub(projection).mag();
    }

    _cleanupInvalidCoverTestCovers() {
        for (let i = this._coverTestCovers.length - 1; i >= 0; i--) {
            let cover = this._coverTestCovers[i];
            if (!cover || !cover.node || !cc.isValid(cover.node)) {
                this._coverTestCovers.splice(i, 1);
            }
        }
    }

    _getAttachedCoverTestCover(player = null) {
        this._cleanupInvalidCoverTestCovers();
        let ownerNode = player && player.node ? player.node : null;
        let ownerPlayerId = player && player._multiplayerPlayerId != null ? player._multiplayerPlayerId : null;
        for (let i = 0; i < this._coverTestCovers.length; i++) {
            let cover = this._coverTestCovers[i];
            if (cover && cover.attached) {
                if (!ownerNode || cover.owner == ownerNode || (ownerPlayerId != null && cover.ownerPlayerId == ownerPlayerId)) {
                    return cover;
                }
            }
        }
        return null;
    }

    _getAttachedMultiplayerCover(player = null) {
        this._cleanupInvalidCoverTestCovers();
        let ownerPlayerId = player && player._multiplayerPlayerId != null ? player._multiplayerPlayerId : null;
        if (ownerPlayerId == null) {
            return null;
        }
        for (let i = 0; i < this._coverTestCovers.length; i++) {
            let cover = this._coverTestCovers[i];
            if (!cover || !cover.multiplayer || !cover.attached) {
                continue;
            }
            if (cover.ownerPlayerId == ownerPlayerId) {
                return cover;
            }
        }
        return null;
    }

    _getNearestAttachableCover(player) {
        if (!player || !player.node || !cc.isValid(player.node)) {
            return null;
        }

        this._cleanupInvalidCoverTestCovers();
        let playerPos = cc.v2(player.node.position);
        let nearest = null;
        let nearestLen = 0;
        for (let i = 0; i < this._coverTestCovers.length; i++) {
            let cover = this._coverTestCovers[i];
            if (!cover || !cover.node || !cc.isValid(cover.node) || cover.attached) {
                continue;
            }
            let len = playerPos.sub(cover.node.position).mag();
            if (len <= 110 && (nearest == null || len < nearestLen)) {
                nearest = cover;
                nearestLen = len;
            }
        }
        return nearest;
    }

    _getNearestMultiplayerAttachableCover(player) {
        if (!player || !player.node || !cc.isValid(player.node)) {
            return null;
        }

        this._cleanupInvalidCoverTestCovers();
        let playerPos = cc.v2(player.node.position);
        let nearest = null;
        let nearestLen = 0;
        for (let i = 0; i < this._coverTestCovers.length; i++) {
            let cover = this._coverTestCovers[i];
            if (!cover || !cover.multiplayer || !cover.node || !cc.isValid(cover.node) || cover.attached || cover.hp <= 0) {
                continue;
            }
            let len = playerPos.sub(cover.node.position).mag();
            if (len <= 110 && (nearest == null || len < nearestLen)) {
                nearest = cover;
                nearestLen = len;
            }
        }
        return nearest;
    }

    _getAttachedMultiplayerEnergyEgg(player = null) {
        let ownerPlayerId = player && player._multiplayerPlayerId != null ? player._multiplayerPlayerId : null;
        if (ownerPlayerId == null) {
            return null;
        }
        for (let id in this._multiplayerEnergyEggMap) {
            let egg = this._multiplayerEnergyEggMap[id];
            if (egg && egg.attached && egg.ownerPlayerId == ownerPlayerId) {
                return egg;
            }
        }
        return null;
    }

    _getNearestMultiplayerAttachableEnergyEgg(player) {
        if (!player || !player.node || !cc.isValid(player.node)) {
            return null;
        }
        let playerPos = cc.v2(player.node.position);
        let nearest = null;
        let nearestLen = 0;
        for (let id in this._multiplayerEnergyEggMap) {
            let egg = this._multiplayerEnergyEggMap[id];
            if (!egg || !egg.node || !cc.isValid(egg.node) || egg.attached || egg.burstDone) {
                continue;
            }
            let len = playerPos.sub(egg.node.position).mag();
            if (len <= 110 && (nearest == null || len < nearestLen)) {
                nearest = egg;
                nearestLen = len;
            }
        }
        return nearest;
    }

    _isLocalMultiplayerCoverTogglePending() {
        return !!(this._multiplayerMode && this._multiplayerPendingCoverToggleId != null && this._multiplayerCoverTogglePendingFrames > 0);
    }

    _getLocalMultiplayerPlayerNode() {
        return this._multiplayerPlayers && this._multiplayerPlayers.length > 0
            ? this._multiplayerPlayers[this._localPlayerId]
            : null;
    }

    _getLocalMultiplayerPlayerScript() {
        let player = this._getLocalMultiplayerPlayerNode();
        if (!player || !cc.isValid(player) || !player.script) {
            return null;
        }
        return player.script;
    }

    isLocalMultiplayerCoverActionAvailable() {
        if (!this._multiplayerMode || this._isLocalMultiplayerCoverTogglePending()) {
            return false;
        }
        let player = this._getLocalMultiplayerPlayerScript();
        if (!player) {
            return false;
        }
        return !!(
            this._getAttachedMultiplayerCover(player) ||
            this._getAttachedMultiplayerEnergyEgg(player) ||
            this._getNearestMultiplayerAttachableCover(player) ||
            this._getNearestMultiplayerAttachableEnergyEgg(player)
        );
    }

    buildLocalMultiplayerInteractionAction(seq) {
        if (!this._multiplayerMode || this._isLocalMultiplayerCoverTogglePending()) {
            return null;
        }
        let player = this._getLocalMultiplayerPlayerScript();
        if (!player) {
            return null;
        }
        let actionSeq = Number.isFinite(seq) ? seq : 0;
        let attachedCover = this._getAttachedMultiplayerCover(player);
        if (attachedCover && attachedCover.coverId != null) {
            this._setLocalMultiplayerInteractionPending("cover", attachedCover.coverId, "detach", actionSeq);
            return {
                coverAction: {
                    seq: actionSeq,
                    coverId: attachedCover.coverId,
                    action: "detach",
                },
            };
        }
        let attachedEgg = this._getAttachedMultiplayerEnergyEgg(player);
        if (attachedEgg && attachedEgg.eggId != null) {
            this._setLocalMultiplayerInteractionPending("energyEgg", attachedEgg.eggId, "detach", actionSeq);
            return {
                energyEggAction: {
                    seq: actionSeq,
                    eggId: attachedEgg.eggId,
                    action: "detach",
                },
            };
        }

        let nearestCover = this._getNearestMultiplayerAttachableCover(player);
        let nearestEgg = this._getNearestMultiplayerAttachableEnergyEgg(player);
        let targetType = null;
        let target = null;
        if (nearestCover && nearestEgg) {
            let coverLen = cc.v2(player.node.position).sub(nearestCover.node.position).mag();
            let eggLen = cc.v2(player.node.position).sub(nearestEgg.node.position).mag();
            targetType = coverLen <= eggLen ? "cover" : "energyEgg";
            target = targetType == "cover" ? nearestCover : nearestEgg;
        }
        else if (nearestCover) {
            targetType = "cover";
            target = nearestCover;
        }
        else if (nearestEgg) {
            targetType = "energyEgg";
            target = nearestEgg;
        }
        if (!target) {
            return null;
        }
        if (targetType == "cover" && target.coverId != null) {
            this._setLocalMultiplayerInteractionPending("cover", target.coverId, "attach", actionSeq);
            return {
                coverAction: {
                    seq: actionSeq,
                    coverId: target.coverId,
                    action: "attach",
                },
            };
        }
        if (targetType == "energyEgg" && target.eggId != null) {
            this._setLocalMultiplayerInteractionPending("energyEgg", target.eggId, "attach", actionSeq);
            return {
                energyEggAction: {
                    seq: actionSeq,
                    eggId: target.eggId,
                    action: "attach",
                },
            };
        }
        return null;
    }

    buildLocalMultiplayerCoverAction(seq) {
        if (!this._multiplayerMode || this._isLocalMultiplayerCoverTogglePending()) {
            return null;
        }
        let player = this._getLocalMultiplayerPlayerScript();
        if (!player) {
            return null;
        }
        let targetCover = this._getAttachedMultiplayerCover(player);
        let action = "detach";
        if (!targetCover) {
            targetCover = this._getNearestMultiplayerAttachableCover(player);
            action = "attach";
        }
        if (!targetCover || targetCover.coverId == null) {
            return null;
        }
        let actionSeq = Number.isFinite(seq) ? seq : 0;
        this._setLocalMultiplayerCoverTogglePending(targetCover.coverId, action, actionSeq);
        return {
            seq: actionSeq,
            coverId: targetCover.coverId,
            action: action,
        };
    }

    notifyLocalMultiplayerCoverToggleRequested() {
        if (!this._multiplayerMode) {
            return;
        }
        let player = this._getLocalMultiplayerPlayerScript();
        if (!player) {
            return;
        }
        let targetCover = this._getAttachedMultiplayerCover(player);
        let action = "detach";
        if (!targetCover) {
            targetCover = this._getNearestMultiplayerAttachableCover(player);
            action = "attach";
        }
        if (!targetCover || targetCover.coverId == null) {
            return;
        }
        this._setLocalMultiplayerCoverTogglePending(targetCover.coverId, action, 0);
    }

    _setLocalMultiplayerCoverTogglePending(coverId, action, seq) {
        this._setLocalMultiplayerInteractionPending("cover", coverId, action, seq);
    }

    _setLocalMultiplayerInteractionPending(type, targetId, action, seq) {
        this._multiplayerPendingCoverToggleId = targetId;
        this._multiplayerCoverTogglePendingFrames = 20;
        let normalizedAction = action == "detach" ? "detach" : "attach";
        this._multiplayerPendingInteraction = {
            type: type == "energyEgg" ? "energyEgg" : "cover",
            targetId: targetId,
            action: normalizedAction,
            seq: Number.isFinite(seq) ? seq : 0,
            expectedAttached: normalizedAction == "attach",
        };
        this._multiplayerPendingCoverAction = type == "energyEgg" ? null : {
            coverId: targetId,
            action: normalizedAction,
            seq: Number.isFinite(seq) ? seq : 0,
            expectedAttached: normalizedAction == "attach",
        };
        this._refreshLocalCoverInteractionUi();
    }

    _tickLocalMultiplayerCoverTogglePending() {
        if (!this._multiplayerMode || this._multiplayerPendingCoverToggleId == null || this._multiplayerCoverTogglePendingFrames <= 0) {
            return;
        }
        this._multiplayerCoverTogglePendingFrames--;
        if (this._multiplayerCoverTogglePendingFrames <= 0) {
            this._multiplayerCoverTogglePendingFrames = 0;
            this._multiplayerPendingCoverToggleId = null;
            this._multiplayerPendingCoverAction = null;
            this._multiplayerPendingInteraction = null;
        }
    }

    _clearLocalMultiplayerCoverTogglePending(coverId = null, type = null) {
        if (this._multiplayerPendingCoverToggleId == null) {
            return;
        }
        if (type != null && this._multiplayerPendingInteraction && this._multiplayerPendingInteraction.type != type) {
            return;
        }
        if (coverId != null && this._multiplayerPendingCoverToggleId != coverId) {
            return;
        }
        this._multiplayerPendingCoverToggleId = null;
        this._multiplayerCoverTogglePendingFrames = 0;
        this._multiplayerPendingCoverAction = null;
        this._multiplayerPendingInteraction = null;
    }

    _syncLocalMultiplayerCoverTogglePendingFromCover(coverData) {
        if (!this._isLocalMultiplayerCoverTogglePending() || !coverData || coverData.id == null) {
            return;
        }
        let pending = this._multiplayerPendingInteraction || this._multiplayerPendingCoverAction;
        if (!pending || (pending.type && pending.type != "cover")) {
            return;
        }
        let pendingId = pending.targetId == null ? pending.coverId : pending.targetId;
        if (pendingId != coverData.id) {
            return;
        }
        let attached = !!coverData.attached;
        let ownerPlayerId = coverData.ownerPlayerId == null ? null : coverData.ownerPlayerId;
        if (pending.expectedAttached) {
            if (attached || coverData.hp <= 0) {
                this._clearLocalMultiplayerCoverTogglePending(coverData.id, "cover");
            }
            return;
        }
        if (!attached || ownerPlayerId != this._localPlayerId || coverData.hp <= 0) {
            this._clearLocalMultiplayerCoverTogglePending(coverData.id, "cover");
        }
    }

    _syncLocalMultiplayerInteractionPendingFromEnergyEgg(eggData) {
        if (!this._isLocalMultiplayerCoverTogglePending() || !eggData || eggData.eggId == null) {
            return;
        }
        let pending = this._multiplayerPendingInteraction;
        if (!pending || pending.type != "energyEgg" || pending.targetId != eggData.eggId) {
            return;
        }
        let attached = !!eggData.attached;
        let ownerPlayerId = eggData.ownerPlayerId == null ? null : eggData.ownerPlayerId;
        if (pending.expectedAttached) {
            if (attached) {
                this._clearLocalMultiplayerCoverTogglePending(eggData.eggId, "energyEgg");
            }
            return;
        }
        if (!attached || ownerPlayerId != this._localPlayerId) {
            this._clearLocalMultiplayerCoverTogglePending(eggData.eggId, "energyEgg");
        }
    }

    _isCoverInteractionEnabled() {
        return !!(this._coverTestMode || this._multiplayerMode);
    }

    _refreshLocalCoverInteractionUi() {
        if (!this._isCoverInteractionEnabled()) {
            yyp.eventCenter.emit("cover-button-state",{visible:false});
            return;
        }
        let player = null;
        if (this._multiplayerMode) {
            player = this._getLocalMultiplayerPlayerNode();
        }
        else{
            player = this._player;
        }
        if (!player || !cc.isValid(player) || !player.script) {
            yyp.eventCenter.emit("cover-button-state",{visible:false});
            return;
        }
        this.refreshCoverTestButton(player.script);
    }

    refreshCoverTestButton(player) {
        if (!this._isCoverInteractionEnabled() || !player || !player.node || !cc.isValid(player.node)) {
            yyp.eventCenter.emit("cover-button-state",{visible:false});
            return;
        }

        if (this._multiplayerMode) {
            // Safeguard: only the local player should update the UI button state
            let localPlayer = this._getLocalMultiplayerPlayerNode();
            if (!localPlayer || !cc.isValid(localPlayer) || player.node !== localPlayer) {
                return;
            }

            if (this._isLocalMultiplayerCoverTogglePending()) {
                yyp.eventCenter.emit("cover-button-state",{visible:false});
                return;
            }

            let attached = this._getAttachedMultiplayerCover(player);
            if (attached) {
                yyp.eventCenter.emit("cover-button-state",{visible:true, mode:"detach"});
                return;
            }
            let attachedEgg = this._getAttachedMultiplayerEnergyEgg(player);
            if (attachedEgg) {
                yyp.eventCenter.emit("cover-button-state",{visible:true, mode:"detach"});
                return;
            }

            let nearest = this._getNearestMultiplayerAttachableCover(player);
            let nearestEgg = this._getNearestMultiplayerAttachableEnergyEgg(player);
            yyp.eventCenter.emit("cover-button-state",{visible:!!(nearest || nearestEgg), mode:"attach"});
            return;
        }

        let attached = this._getAttachedCoverTestCover(player);
        if (attached) {
            yyp.eventCenter.emit("cover-button-state",{visible:true, mode:"detach"});
            return;
        }

        let nearest = this._getNearestAttachableCover(player);
        yyp.eventCenter.emit("cover-button-state",{visible:!!nearest, mode:"attach"});
    }

    tryToggleCoverTestAttachment(player) {
        if (this._multiplayerMode) {
            return false;
        }
        if (!this._coverTestMode || !player || !player.node || !cc.isValid(player.node)) {
            return false;
        }

        let attached = this._getAttachedCoverTestCover(player);
        if (attached) {
            this._detachCoverTestCover(attached);
            this.refreshCoverTestButton(player);
            return true;
        }

        let nearest = this._getNearestAttachableCover(player);
        if (!nearest) {
            if (player._showSacrificeTip) {
                player._showSacrificeTip("靠近掩体后才能吸附");
            }
            this.refreshCoverTestButton(player);
            return false;
        }

        this._attachCoverTestCover(nearest, player);
        this.refreshCoverTestButton(player);
        return true;
    }

    _attachCoverTestCover(cover, player) {
        if (!cover || !cover.node || !cc.isValid(cover.node) || !player || !player.node || !cc.isValid(player.node)) {
            return;
        }

        let offset = cc.v2(cover.node.position).sub(player.node.position);
        if (offset.magSqr() <= 25) {
            offset = player._dir && player._dir.magSqr() > 0 ? player._dir.normalize().mul(70) : cc.v2(70, 0);
        }
        else{
            offset = offset.normalize().mul(Math.max(60, Math.min(84, offset.mag())));
        }

        cover.attached = true;
        cover.owner = player.node;
        cover.ownerPlayerId = player._multiplayerPlayerId == null ? null : player._multiplayerPlayerId;
        cover.attachOffset = offset;
        this.syncAttachedCoverTestCover(player);
    }

    _detachCoverTestCover(cover) {
        if (!cover) {
            return;
        }
        cover.attached = false;
        cover.owner = null;
        cover.ownerPlayerId = null;
    }

    forceDetachCoverTestFromPlayer(player) {
        let attached = this._multiplayerMode
            ? this._getAttachedMultiplayerCover(player)
            : this._getAttachedCoverTestCover(player);
        if (attached) {
            if (this._multiplayerMode) {
                attached.attached = false;
                attached.owner = null;
                attached.ownerPlayerId = null;
            } else {
                this._detachCoverTestCover(attached);
            }
        }
        
        let localPlayer = this._multiplayerMode
            ? this._getLocalMultiplayerPlayerNode()
            : this._player;
        if (!player || player.node === localPlayer) {
            yyp.eventCenter.emit("cover-button-state",{visible:false});
        }
    }

    syncAttachedCoverTestCover(player) {
        if (!this._isCoverInteractionEnabled() || !player || !player.node || !cc.isValid(player.node)) {
            return;
        }

        let cover = this._multiplayerMode 
            ? this._getAttachedMultiplayerCover(player)
            : this._getAttachedCoverTestCover(player);
        if (!cover || !cover.attachOffset) {
            return;
        }

        let pos = cc.v2(player.node.position).add(cover.attachOffset);
        pos = this.clampMapInnerPosition(pos, cover.radius + 6);
        cover.node.setPosition(cc.v3(pos));
        cover.node.zIndex = this.judgezIndex(pos.y) + 1;
    }

    _syncAllAttachedMultiplayerCovers() {
        if (!this._multiplayerMode) {
            return;
        }
        for (let i = 0; i < this._coverTestCovers.length; i++) {
            let cover = this._coverTestCovers[i];
            if (!cover || !cover.multiplayer || !cover.attached || !cover.attachOffset || !cover.node || !cc.isValid(cover.node)) {
                continue;
            }
            let owner = cover.ownerPlayerId != null && this._multiplayerPlayers
                ? this._multiplayerPlayers[cover.ownerPlayerId]
                : null;
            if (!owner || !cc.isValid(owner)) {
                continue;
            }
            cover.owner = owner;
            let pos = cc.v2(owner.position).add(cover.attachOffset);
            pos = this.clampMapInnerPosition(pos, (cover.radius || 34) + 6);
            cover.node.setPosition(cc.v3(pos));
            cover.node.zIndex = this.judgezIndex(pos.y) + 1;
        }
    }

    _syncAllAttachedMultiplayerEnergyEggs() {
        if (!this._multiplayerMode) {
            return;
        }
        for (let id in this._multiplayerEnergyEggMap) {
            let egg = this._multiplayerEnergyEggMap[id];
            if (!egg || !egg.attached || !egg.attachOffset || !egg.node || !cc.isValid(egg.node)) {
                continue;
            }
            let owner = egg.ownerPlayerId != null && this._multiplayerPlayers
                ? this._multiplayerPlayers[egg.ownerPlayerId]
                : null;
            if (!owner || !cc.isValid(owner)) {
                continue;
            }
            egg.owner = owner;
            let pos = cc.v2(owner.position).add(egg.attachOffset);
            pos = this.clampMapInnerPosition(pos, (egg.radius || 34) + 8);
            egg.node.setPosition(cc.v3(pos));
            egg.node.zIndex = this.judgezIndex(pos.y) + 1;
        }
    }

    tryHandleCoverBulletCollision(fromPos, toPos, bullet) {
        if ((!this._coverTestMode && !this._multiplayerMode) || !bullet) {
            return false;
        }
        if (this._coverTestMode && !this._multiplayerMode && bullet._camp != "enemy") {
            return false;
        }

        this._cleanupInvalidCoverTestCovers();
        let hitCover = null;
        let hitLen = 0;
        for (let i = 0; i < this._coverTestCovers.length; i++) {
            let cover = this._coverTestCovers[i];
            if (!cover || !cover.node || !cc.isValid(cover.node)) {
                continue;
            }
            let distance = this._distancePointToSegment(cc.v2(cover.node.position), cc.v2(fromPos), cc.v2(toPos));
            if (distance <= cover.radius + 4) {
                let len = cc.v2(cover.node.position).sub(fromPos).magSqr();
                if (hitCover == null || len < hitLen) {
                    hitCover = cover;
                    hitLen = len;
                }
            }
        }

        if (!hitCover) {
            return false;
        }

        this._damageCoverTestCover(hitCover, bullet);
        return true;
    }

    _damageCoverTestCover(cover, bullet = null) {
        if (!cover || !cover.node || !cc.isValid(cover.node)) {
            return;
        }
        if (cover.multiplayer) {
            if (bullet) {
                if (bullet.doDestroy) {
                    bullet.doDestroy();
                }
                else if (bullet.node && cc.isValid(bullet.node)) {
                    bullet.node.destroy();
                }
            }
            return;
        }

        cover.hp = Math.max(0, cover.hp - 1);
        this._refreshCoverTestCoverVisual(cover);
        this._playCoverTestHitEffect(cover);
        if (bullet) {
            if (bullet.doDestroy) {
                bullet.doDestroy();
            }
            else if (bullet.node && cc.isValid(bullet.node)) {
                bullet.node.destroy();
            }
        }

        if (cover.hp <= 0) {
            this._breakCoverTestCover(cover);
        }
        else if (this._player && cc.isValid(this._player) && this._player.script && this._isCoverInteractionEnabled()) {
            this.refreshCoverTestButton(this._player.script);
        }
    }

    _playCoverTestHitEffect(cover) {
        let flash = new cc.Node("_coverHitFx");
        flash.parent = cover.node;
        flash.opacity = 190;
        flash.scale = 0.72;
        let graphics = flash.addComponent(cc.Graphics);
        graphics.lineWidth = 4;
        graphics.strokeColor = cc.color(255, 220, 160, 220);
        graphics.rect(-24, -24, 48, 48);
        graphics.stroke();
        flash.runAction(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.08, 1.12),
                cc.fadeOut(0.08)
            ),
            cc.removeSelf()
        ));
    }

    _breakCoverTestCover(cover) {
        if (!cover || !cover.node || !cc.isValid(cover.node)) {
            return;
        }
        if (cover.multiplayer) {
            this._removeMultiplayerCover(cover.coverId);
            return;
        }

        let breakPos = cc.v2(cover.node.position);
        this._detachCoverTestCover(cover);
        for (let i = 0; i < 6; i++) {
            let shard = new cc.Node("_coverShard");
            shard.parent = this._fire._tmLayerObstacle;
            shard.setPosition(cc.v3(breakPos));
            shard.zIndex = this.judgezIndex(breakPos.y) + 3;
            let graphics = shard.addComponent(cc.Graphics);
            graphics.fillColor = cc.color(158 + Math.floor(Math.random() * 32), 112, 68, 240);
            graphics.rect(-5, -5, 10, 10);
            graphics.fill();
            let angle = Math.PI * 2 * i / 6 + Math.random() * 0.4;
            let distance = 26 + Math.random() * 22;
            shard.runAction(cc.sequence(
                cc.spawn(
                    cc.moveBy(0.22, Math.cos(angle) * distance, Math.sin(angle) * distance + 10),
                    cc.rotateBy(0.22, 150 + Math.random() * 180),
                    cc.fadeOut(0.22)
                ),
                cc.removeSelf()
            ));
        }

        cover.node.destroy();
        this._cleanupInvalidCoverTestCovers();
        if (this._player && cc.isValid(this._player) && this._player.script && this._isCoverInteractionEnabled()) {
            this.refreshCoverTestButton(this._player.script);
        }
    }

    tryTeleportBullet(bullet, fromPos, toPos) {
        if (!this._portalTestMode || !bullet || !this._portalPairs || this._portalPairs.length == 0) {
            return false;
        }

        let ignorePortalId = bullet.getPortalIgnoreId ? bullet.getPortalIgnoreId() : "";
        for (let i = 0; i < this._portalPairs.length; i++) {
            let portal = this._portalPairs[i];
            if (portal.id == ignorePortalId) {
                continue;
            }
            if (this._distancePointToSegment(portal.pos, cc.v2(fromPos), cc.v2(toPos)) > portal.radius) {
                continue;
            }

            let exitOffset = bullet._dir && bullet._dir.magSqr() > 0
                ? bullet._dir.normalize().mul(portal.radius + Math.max(16, bullet._speed * 1.8))
                : cc.v2(portal.radius + 18, 0);
            let exitPos = this.clampMapInnerPosition(portal.exitPos.add(exitOffset), 40);
            if (bullet.teleportByPortal) {
                bullet.teleportByPortal(exitPos, portal.exitId);
            }
            this._spawnPortalWarpFx(portal.pos, cc.color(110, 255, 245, 255));
            this._spawnPortalWarpFx(portal.exitPos, cc.color(255, 120, 220, 255));
            return true;
        }

        return false;
    }

    tryEnterCentrifugalRing(bullet, fromPos, toPos) {
        if (!this._centrifugalRingTestMode || !bullet || !this._centrifugalRingData) {
            return false;
        }
        if (bullet.hasUsedCentrifugalRing && bullet.hasUsedCentrifugalRing()) {
            return false;
        }

        let ring = this._centrifugalRingData;
        if (this._distancePointToSegment(ring.center, cc.v2(fromPos), cc.v2(toPos)) > ring.triggerRadius) {
            return false;
        }

        return bullet.enterCentrifugalRing ? bullet.enterCentrifugalRing(ring) : false;
    }

    
    //子弹,碰撞检测
    bulletEnemyCollisionTest(P,camp, ownerPlayerId = -1){
        if (this._multiplayerMode && camp == "player") {
            for (let i = 0; i < this._multiplayerPlayers.length; i++) {
                let player = this._multiplayerPlayers[i];
                if (!player || !cc.isValid(player) || i == ownerPlayerId) {
                    continue;
                }
                let len = P.sub(player.position).mag();
                let radius = player.script.getRadius();
                if (len < radius) {
                    return player;
                }
            }
            return null;
        }

        if (camp == "player") {
            for (let i = 0; i < this._enemys.length; i++) {
                let enemy = this._enemys[i];
                
                let len = P.sub(enemy.position).mag();
                let radius = enemy.script.getRadius();
                if (len < radius) {
                    return enemy;
                }
            }
        }
        else{
            if (this._player && cc.isValid(this._player)) {
                let len = P.sub(this._player.position).mag();
                let radius = this._player.script.getRadius();
                if (len < radius) {
                    return this._player;
                }
            }
        }

        return null;
    }

    //玩家和技能icon,碰撞检测
    playerSkillIconCollisionTest(){
        for (let i = 0; i < this._skills.length; i++) {
            let skill = this._skills[i];
            if (cc.isValid(skill)) {
                let playerRect = this._player.script.getPlayerBoundingBox();
                let skillRect = skill.script.getSkillBoundingBox();
                if (cc.Intersection.rectRect(playerRect,skillRect)) {
                    if (this._multiplayerMode && skill["__tarPickupId"] != null) {
                        yyp.eventCenter.emit("multiplayer-tar-pickup", {
                            pickupId: skill["__tarPickupId"],
                        });
                        return;
                    }
                    if (this._multiplayerMode && skill["__blackHolePickupId"] != null) {
                        yyp.eventCenter.emit("multiplayer-black-hole-pickup", {
                            pickupId: skill["__blackHolePickupId"],
                        });
                        return;
                    }
                    if (this._multiplayerMode && skill["__pickupId"] != null) {
                        yyp.eventCenter.emit("multiplayer-pickup", {
                            pickupId: skill["__pickupId"],
                        });
                        return;
                    }
                    skill.script.emitSkill();
                    this._skills.splice(i,1);
                    skill.destroy();
                    return;
                }
            }
            else{
                this._skills.splice(i,1);
            }
        }

        this.playerEnergyCollisionTest();
    }

    //玩家和能量,碰撞检测
    playerEnergyCollisionTest(){
        for (let i = 0; i < this._energys.length; i++) {
            let energy = this._energys[i];
            if (cc.isValid(energy)) {
                let energyScript = null;
                if (EnergyItem) {
                    energyScript = energy.getComponent(EnergyItem);
                }
                let energyNode : any = energy;
                if (!energyScript && energyNode._components) {
                    energyScript = energyNode._components.find((component) => {
                        return component && component.__classname__ == "EnergyItem";
                    }) || null;
                }
                if (!energyScript) {
                    this._energys.splice(i, 1);
                    energy.destroy();
                    return;
                }
                let playerScript = this._player && cc.isValid(this._player) ? this._player.script : null;
                if (!playerScript) {
                    return;
                }
                let playerRect = playerScript.getPlayerBoundingBox();
                let energyRect = energyScript.getEnergyBoundingBox();
                if (cc.Intersection.rectRect(playerRect, energyRect)) {
                    if (this._multiplayerMode) {
                        let energyId = energy["__energyId"];
                        yyp.eventCenter.emit("multiplayer-energy-pickup", {
                            energyId: energyId,
                        });
                    }
                    else{
                        playerScript.addEnergy(energyScript.getValue());
                        this._energys.splice(i, 1);
                        energy.destroy();
                    }
                    return;
                }
            }
            else{
                this._energys.splice(i,1);
            }
        }
    }

    _updateEnergy(dt) {
        for (let i = this._energys.length - 1; i >= 0; i--) {
            if (!cc.isValid(this._energys[i])) {
                this._energys.splice(i, 1);
            }
        }

        this._energyCdTime += dt;
        let interval = this._getEnergyConfig("BornInterval", 4);
        let maxCount = this._getEnergyConfig("MaxCount", 6);
        if (this._energyCdTime < interval || this._energys.length >= maxCount) {
            return;
        }

        this._energyCdTime = 0;
        this.createEnergy();
    }

    _updateSinglePlayerTarPickup(dt) {
        if (this._multiplayerMode || !this._gaming || !this._player || !cc.isValid(this._player)) {
            return;
        }
        for (let i = this._skills.length - 1; i >= 0; i--) {
            let skill = this._skills[i];
            if (!cc.isValid(skill)) {
                this._skills.splice(i, 1);
                continue;
            }
            if (skill.name == "OilPickup") {
                return;
            }
        }

        this._tarPickupCdTime += dt;
        if (this._tarPickupCdTime < TAR_PICKUP_SINGLEPLAYER_INTERVAL) {
            return;
        }
        this._tarPickupCdTime = 0;
        this.spawnTarPickupAt(this._getOilTestPickupPos());
    }

    _updateSinglePlayerBlackHolePickup(dt) {
        if (this._multiplayerMode || !this._gaming || !this._player || !cc.isValid(this._player)) {
            return;
        }
        for (let i = this._skills.length - 1; i >= 0; i--) {
            let skill = this._skills[i];
            if (!cc.isValid(skill)) {
                this._skills.splice(i, 1);
                continue;
            }
            if (skill.name == "OilPickup" && skill.script && skill.script.getPickupType && skill.script.getPickupType() == "blackHole") {
                return;
            }
        }

        this._blackHolePickupCdTime += dt;
        if (this._blackHolePickupCdTime < BLACK_HOLE_PICKUP_SINGLEPLAYER_INTERVAL) {
            return;
        }
        this._blackHolePickupCdTime = 0;
        this.spawnBlackHolePickupAt(this._getOilTestPickupPos());
    }

    //计算zIndex
    judgezIndex(y){
        return this._tmSize.height - Math.floor(y);
    }

    //开始游戏
    startGame(func){
        //获取关卡数据
        this._levelConfig = yyp.config.Level[0];
        this._levelId = LocalizedData.getIntItem("_level1_",1);
        this._resetKillBroadcastRuntime();
        this._killEffectTestMode = false;
        this._killBroadcastTestMode = false;
        this._playerHitTestMode = false;
        this._upgradeTestMode = false;
        this._shootEffectTestMode = false;
        this._portalTestMode = false;
        this._centrifugalRingTestMode = false;
        this._coverTestMode = false;
        this._energyEggTestMode = false;
        this._damageDoubleTestMode = false;
        this._speedDoubleTestMode = false;
        this._spreadBulletTestMode = false;
        this._bounceObstacleTestMode = false;
        this._blackHoleTestMode = false;
        this._clusterBombTestMode = false;
        this._maxEnemyCount = this._levelConfig.EnemyCount * this._levelId;
        this._timeMaxEnemyCount = this._levelConfig.Max + Math.floor(this._levelId/5);
        yyp.eventCenter.emit("current-levelid",{levelid:this._levelId});
        yyp.eventCenter.emit("current-enemycount",{enemycount:this._maxEnemyCount});

        this._roamFlg = false;
        this._tarPickupCdTime = TAR_PICKUP_SINGLEPLAYER_INTERVAL - 1.2;
        
        let will = this._correctMapPosition(cc.v2(-this._playerBornPos.x,-this._playerBornPos.y));
        let self = this;
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2,will),
            cc.callFunc(function(){
                self.createPlayer();
                self._gaming = true;
                func();
            })
        ));
        Analytics.getInstance().eventEx('start_game',{"level":this._levelId});
    }

    startKillEffectTestGame(func){
        this._levelConfig = yyp.config.Level[0];
        this._levelId = LocalizedData.getIntItem("_level1_",1);
        this._resetKillBroadcastRuntime();
        this._killEffectTestMode = true;
        this._killBroadcastTestMode = false;
        this._playerHitTestMode = false;
        this._upgradeTestMode = false;
        this._shootEffectTestMode = false;
        this._portalTestMode = false;
        this._centrifugalRingTestMode = false;
        this._coverTestMode = false;
        this._energyEggTestMode = false;
        this._damageDoubleTestMode = false;
        this._speedDoubleTestMode = false;
        this._spreadBulletTestMode = false;
        this._bounceObstacleTestMode = false;
        this._blackHoleTestMode = false;
        this._clusterBombTestMode = false;
        this._maxEnemyCount = 1;
        this._timeMaxEnemyCount = 1;
        this._bornEnemyCount = 1;
        this._deathEnemyCount = 0;
        this._bornCdTime = 0;
        yyp.eventCenter.emit("current-levelid",{levelid:this._levelId});
        yyp.eventCenter.emit("current-enemycount",{enemycount:1});

        this._roamFlg = false;
        let will = this._correctMapPosition(cc.v2(-this._playerBornPos.x,-this._playerBornPos.y));
        let self = this;
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2,will),
            cc.callFunc(function(){
                self.createPlayer();
                self.createKillEffectTestEnemy();
                self._gaming = true;
                func();
            })
        ));
    }

    startKillBroadcastTestGame(func){
        this._levelConfig = yyp.config.Level[0];
        this._levelId = LocalizedData.getIntItem("_level1_",1);
        this._resetKillBroadcastRuntime();
        this._killEffectTestMode = false;
        this._killBroadcastTestMode = true;
        this._playerHitTestMode = false;
        this._upgradeTestMode = false;
        this._shootEffectTestMode = false;
        this._portalTestMode = false;
        this._centrifugalRingTestMode = false;
        this._coverTestMode = false;
        this._energyEggTestMode = false;
        this._damageDoubleTestMode = false;
        this._speedDoubleTestMode = false;
        this._spreadBulletTestMode = false;
        this._bounceObstacleTestMode = false;
        this._blackHoleTestMode = false;
        this._clusterBombTestMode = false;
        this._maxEnemyCount = 5;
        this._timeMaxEnemyCount = 5;
        this._bornEnemyCount = 5;
        this._deathEnemyCount = 0;
        this._bornCdTime = 0;
        yyp.eventCenter.emit("current-levelid",{levelid:this._levelId});
        yyp.eventCenter.emit("current-enemycount",{enemycount:5});

        this._roamFlg = false;
        let will = this._correctMapPosition(cc.v2(-this._playerBornPos.x,-this._playerBornPos.y));
        let self = this;
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2,will),
            cc.callFunc(function(){
                self.createPlayer();
                self.createKillBroadcastTestEnemies();
                self._gaming = true;
                func();
            })
        ));
    }

    startPlayerHitTestGame(func){
        this._levelConfig = yyp.config.Level[0];
        this._levelId = LocalizedData.getIntItem("_level1_",1);
        this._resetKillBroadcastRuntime();
        this._killEffectTestMode = false;
        this._killBroadcastTestMode = false;
        this._playerHitTestMode = true;
        this._upgradeTestMode = false;
        this._shootEffectTestMode = false;
        this._portalTestMode = false;
        this._centrifugalRingTestMode = false;
        this._coverTestMode = false;
        this._energyEggTestMode = false;
        this._damageDoubleTestMode = false;
        this._speedDoubleTestMode = false;
        this._spreadBulletTestMode = false;
        this._bounceObstacleTestMode = false;
        this._blackHoleTestMode = false;
        this._clusterBombTestMode = false;
        this._maxEnemyCount = 1;
        this._timeMaxEnemyCount = 1;
        this._bornEnemyCount = 1;
        this._deathEnemyCount = 0;
        this._bornCdTime = 0;
        yyp.eventCenter.emit("current-levelid",{levelid:this._levelId});
        yyp.eventCenter.emit("current-enemycount",{enemycount:1});

        this._roamFlg = false;
        let will = this._correctMapPosition(cc.v2(-this._playerBornPos.x,-this._playerBornPos.y));
        let self = this;
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2,will),
            cc.callFunc(function(){
                self.createPlayer();
                self.createPlayerHitTestEnemy();
                self._gaming = true;
                func();
            })
        ));
    }

    startUpgradeTestGame(func){
        this._levelConfig = yyp.config.Level[0];
        this._levelId = LocalizedData.getIntItem("_level1_",1);
        this._resetKillBroadcastRuntime();
        this._killEffectTestMode = false;
        this._killBroadcastTestMode = false;
        this._playerHitTestMode = false;
        this._upgradeTestMode = true;
        this._shootEffectTestMode = false;
        this._portalTestMode = false;
        this._centrifugalRingTestMode = false;
        this._coverTestMode = false;
        this._energyEggTestMode = false;
        this._damageDoubleTestMode = false;
        this._speedDoubleTestMode = false;
        this._spreadBulletTestMode = false;
        this._bounceObstacleTestMode = false;
        this._blackHoleTestMode = false;
        this._clusterBombTestMode = false;
        this._maxEnemyCount = 0;
        this._timeMaxEnemyCount = 0;
        this._bornEnemyCount = 0;
        this._deathEnemyCount = 0;
        this._bornCdTime = 0;
        yyp.eventCenter.emit("current-levelid",{levelid:this._levelId});
        yyp.eventCenter.emit("current-enemycount",{enemycount:0});

        this._roamFlg = false;
        let will = this._correctMapPosition(cc.v2(-this._playerBornPos.x,-this._playerBornPos.y));
        let self = this;
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2,will),
            cc.callFunc(function(){
                self.createPlayer();
                self._gaming = true;
                func();
            })
        ));
    }

    startShootEffectTestGame(func){
        this._levelConfig = yyp.config.Level[0];
        this._levelId = LocalizedData.getIntItem("_level1_",1);
        this._resetKillBroadcastRuntime();
        this._killEffectTestMode = false;
        this._killBroadcastTestMode = false;
        this._playerHitTestMode = false;
        this._upgradeTestMode = false;
        this._shootEffectTestMode = true;
        this._portalTestMode = false;
        this._centrifugalRingTestMode = false;
        this._coverTestMode = false;
        this._energyEggTestMode = false;
        this._damageDoubleTestMode = false;
        this._speedDoubleTestMode = false;
        this._spreadBulletTestMode = false;
        this._bounceObstacleTestMode = false;
        this._blackHoleTestMode = false;
        this._clusterBombTestMode = false;
        this._maxEnemyCount = 1;
        this._timeMaxEnemyCount = 1;
        this._bornEnemyCount = 1;
        this._deathEnemyCount = 0;
        this._bornCdTime = 0;
        yyp.eventCenter.emit("current-levelid",{levelid:this._levelId});
        yyp.eventCenter.emit("current-enemycount",{enemycount:1});

        this._roamFlg = false;
        let will = this._correctMapPosition(cc.v2(-this._playerBornPos.x,-this._playerBornPos.y));
        let self = this;
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2,will),
            cc.callFunc(function(){
                self.createPlayer();
                self.createShootEffectTestEnemy();
                self._gaming = true;
                func();
            })
        ));
    }

    startPortalTestGame(func){
        this._levelConfig = yyp.config.Level[0];
        this._levelId = LocalizedData.getIntItem("_level1_",1);
        this._resetKillBroadcastRuntime();
        this._killEffectTestMode = false;
        this._killBroadcastTestMode = false;
        this._playerHitTestMode = false;
        this._upgradeTestMode = false;
        this._shootEffectTestMode = false;
        this._portalTestMode = true;
        this._centrifugalRingTestMode = false;
        this._coverTestMode = false;
        this._energyEggTestMode = false;
        this._damageDoubleTestMode = false;
        this._speedDoubleTestMode = false;
        this._spreadBulletTestMode = false;
        this._bounceObstacleTestMode = false;
        this._blackHoleTestMode = false;
        this._clusterBombTestMode = false;
        this._maxEnemyCount = 1;
        this._timeMaxEnemyCount = 1;
        this._bornEnemyCount = 1;
        this._deathEnemyCount = 0;
        this._bornCdTime = 0;
        yyp.eventCenter.emit("current-levelid",{levelid:this._levelId});
        yyp.eventCenter.emit("current-enemycount",{enemycount:1});

        this._roamFlg = false;
        let will = this._correctMapPosition(cc.v2(-this._playerBornPos.x,-this._playerBornPos.y));
        let self = this;
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2,will),
            cc.callFunc(function(){
                self.createPlayer();
                self.createPortalTestSetup();
                self._gaming = true;
                func();
            })
        ));
    }

    startCentrifugalRingTestGame(func){
        this._levelConfig = yyp.config.Level[0];
        this._levelId = LocalizedData.getIntItem("_level1_",1);
        this._resetKillBroadcastRuntime();
        this._killEffectTestMode = false;
        this._killBroadcastTestMode = false;
        this._playerHitTestMode = false;
        this._upgradeTestMode = false;
        this._shootEffectTestMode = false;
        this._portalTestMode = false;
        this._centrifugalRingTestMode = true;
        this._coverTestMode = false;
        this._energyEggTestMode = false;
        this._damageDoubleTestMode = false;
        this._speedDoubleTestMode = false;
        this._spreadBulletTestMode = false;
        this._bounceObstacleTestMode = false;
        this._blackHoleTestMode = false;
        this._clusterBombTestMode = false;
        this._maxEnemyCount = 1;
        this._timeMaxEnemyCount = 1;
        this._bornEnemyCount = 1;
        this._deathEnemyCount = 0;
        this._bornCdTime = 0;
        yyp.eventCenter.emit("current-levelid",{levelid:this._levelId});
        yyp.eventCenter.emit("current-enemycount",{enemycount:1});

        this._roamFlg = false;
        let will = this._correctMapPosition(cc.v2(-this._playerBornPos.x,-this._playerBornPos.y));
        let self = this;
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2,will),
            cc.callFunc(function(){
                self.createPlayer();
                self.createCentrifugalRingTestSetup();
                self._gaming = true;
                func();
            })
        ));
    }

    startCoverTestGame(func){
        this._levelConfig = yyp.config.Level[0];
        this._levelId = LocalizedData.getIntItem("_level1_",1);
        this._resetKillBroadcastRuntime();
        this._killEffectTestMode = false;
        this._killBroadcastTestMode = false;
        this._playerHitTestMode = false;
        this._upgradeTestMode = false;
        this._shootEffectTestMode = false;
        this._portalTestMode = false;
        this._centrifugalRingTestMode = false;
        this._coverTestMode = true;
        this._energyEggTestMode = false;
        this._damageDoubleTestMode = false;
        this._speedDoubleTestMode = false;
        this._spreadBulletTestMode = false;
        this._bounceObstacleTestMode = false;
        this._blackHoleTestMode = false;
        this._clusterBombTestMode = false;
        this._maxEnemyCount = 1;
        this._timeMaxEnemyCount = 1;
        this._bornEnemyCount = 1;
        this._deathEnemyCount = 0;
        this._bornCdTime = 0;
        yyp.eventCenter.emit("current-levelid",{levelid:this._levelId});
        yyp.eventCenter.emit("current-enemycount",{enemycount:1});

        this._roamFlg = false;
        let will = this._correctMapPosition(cc.v2(-this._playerBornPos.x,-this._playerBornPos.y));
        let self = this;
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2,will),
            cc.callFunc(function(){
                self.createPlayer();
                self.createCoverTestEnemy();
                self.spawnCoverTestCovers(6);
                self._gaming = true;
                func();
            })
        ));
    }

    startEnergyEggTestGame(func){
        this._levelConfig = yyp.config.Level[0];
        this._levelId = LocalizedData.getIntItem("_level1_",1);
        this._resetKillBroadcastRuntime();
        this._killEffectTestMode = false;
        this._killBroadcastTestMode = false;
        this._playerHitTestMode = false;
        this._upgradeTestMode = false;
        this._shootEffectTestMode = false;
        this._portalTestMode = false;
        this._centrifugalRingTestMode = false;
        this._coverTestMode = false;
        this._damageDoubleTestMode = false;
        this._speedDoubleTestMode = false;
        this._spreadBulletTestMode = false;
        this._bounceObstacleTestMode = false;
        this._blackHoleTestMode = false;
        this._clusterBombTestMode = false;
        this._energyEggTestMode = true;
        this._maxEnemyCount = 0;
        this._timeMaxEnemyCount = 0;
        this._bornEnemyCount = 0;
        this._deathEnemyCount = 0;
        this._bornCdTime = 0;
        yyp.eventCenter.emit("current-levelid",{levelid:this._levelId});
        yyp.eventCenter.emit("current-enemycount",{enemycount:0});

        this._roamFlg = false;
        let will = this._correctMapPosition(cc.v2(-this._playerBornPos.x,-this._playerBornPos.y));
        let self = this;
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2,will),
            cc.callFunc(function(){
                self.createPlayer();
                self.createEnergyEggTestSetup();
                self._gaming = true;
                func();
            })
        ));
    }

    startDamageDoubleTestGame(func){
        this._levelConfig = yyp.config.Level[0];
        this._levelId = LocalizedData.getIntItem("_level1_",1);
        this._resetKillBroadcastRuntime();
        this._killEffectTestMode = false;
        this._killBroadcastTestMode = false;
        this._playerHitTestMode = false;
        this._upgradeTestMode = false;
        this._shootEffectTestMode = false;
        this._portalTestMode = false;
        this._centrifugalRingTestMode = false;
        this._coverTestMode = false;
        this._energyEggTestMode = false;
        this._damageDoubleTestMode = true;
        this._speedDoubleTestMode = false;
        this._spreadBulletTestMode = false;
        this._bounceObstacleTestMode = false;
        this._blackHoleTestMode = false;
        this._clusterBombTestMode = false;
        this._maxEnemyCount = 1;
        this._timeMaxEnemyCount = 1;
        this._bornEnemyCount = 1;
        this._deathEnemyCount = 0;
        this._bornCdTime = 0;
        yyp.eventCenter.emit("current-levelid",{levelid:this._levelId});
        yyp.eventCenter.emit("current-enemycount",{enemycount:1});

        this._roamFlg = false;
        let will = this._correctMapPosition(cc.v2(-this._playerBornPos.x,-this._playerBornPos.y));
        let self = this;
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2,will),
            cc.callFunc(function(){
                self.createPlayer();
                self.createDamageDoubleTestSetup();
                self._gaming = true;
                func();
            })
        ));
    }

    startSpeedDoubleTestGame(func){
        this._levelConfig = yyp.config.Level[0];
        this._levelId = LocalizedData.getIntItem("_level1_",1);
        this._resetKillBroadcastRuntime();
        this._killEffectTestMode = false;
        this._killBroadcastTestMode = false;
        this._playerHitTestMode = false;
        this._upgradeTestMode = false;
        this._shootEffectTestMode = false;
        this._portalTestMode = false;
        this._centrifugalRingTestMode = false;
        this._coverTestMode = false;
        this._energyEggTestMode = false;
        this._damageDoubleTestMode = false;
        this._speedDoubleTestMode = true;
        this._spreadBulletTestMode = false;
        this._bounceObstacleTestMode = false;
        this._blackHoleTestMode = false;
        this._clusterBombTestMode = false;
        this._maxEnemyCount = 1;
        this._timeMaxEnemyCount = 1;
        this._bornEnemyCount = 1;
        this._deathEnemyCount = 0;
        this._bornCdTime = 0;
        yyp.eventCenter.emit("current-levelid",{levelid:this._levelId});
        yyp.eventCenter.emit("current-enemycount",{enemycount:1});

        this._roamFlg = false;
        let will = this._correctMapPosition(cc.v2(-this._playerBornPos.x,-this._playerBornPos.y));
        let self = this;
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2,will),
            cc.callFunc(function(){
                self.createPlayer();
                self.createSpeedDoubleTestSetup();
                self._gaming = true;
                func();
            })
        ));
    }

    startSpreadBulletTestGame(func){
        this._levelConfig = yyp.config.Level[0];
        this._levelId = LocalizedData.getIntItem("_level1_",1);
        this._resetKillBroadcastRuntime();
        this._killEffectTestMode = false;
        this._killBroadcastTestMode = false;
        this._playerHitTestMode = false;
        this._upgradeTestMode = false;
        this._shootEffectTestMode = false;
        this._portalTestMode = false;
        this._centrifugalRingTestMode = false;
        this._coverTestMode = false;
        this._energyEggTestMode = false;
        this._damageDoubleTestMode = false;
        this._speedDoubleTestMode = false;
        this._bounceObstacleTestMode = false;
        this._blackHoleTestMode = false;
        this._clusterBombTestMode = false;
        this._spreadBulletTestMode = true;
        this._maxEnemyCount = 1;
        this._timeMaxEnemyCount = 1;
        this._bornEnemyCount = 1;
        this._deathEnemyCount = 0;
        this._bornCdTime = 0;
        yyp.eventCenter.emit("current-levelid",{levelid:this._levelId});
        yyp.eventCenter.emit("current-enemycount",{enemycount:1});

        this._roamFlg = false;
        let will = this._correctMapPosition(cc.v2(-this._playerBornPos.x,-this._playerBornPos.y));
        let self = this;
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2,will),
            cc.callFunc(function(){
                self.createPlayer();
                self.createSpreadBulletTestSetup();
                self._gaming = true;
                func();
            })
        ));
    }

    startBounceObstacleTestGame(func){
        this._levelConfig = yyp.config.Level[0];
        this._levelId = LocalizedData.getIntItem("_level1_",1);
        this._resetKillBroadcastRuntime();
        this._killEffectTestMode = false;
        this._killBroadcastTestMode = false;
        this._playerHitTestMode = false;
        this._upgradeTestMode = false;
        this._shootEffectTestMode = false;
        this._portalTestMode = false;
        this._centrifugalRingTestMode = false;
        this._coverTestMode = false;
        this._energyEggTestMode = false;
        this._damageDoubleTestMode = false;
        this._speedDoubleTestMode = false;
        this._spreadBulletTestMode = false;
        this._bounceObstacleTestMode = true;
        this._maxEnemyCount = 1;
        this._timeMaxEnemyCount = 1;
        this._bornEnemyCount = 1;
        this._deathEnemyCount = 0;
        this._bornCdTime = 0;
        yyp.eventCenter.emit("current-levelid",{levelid:this._levelId});
        yyp.eventCenter.emit("current-enemycount",{enemycount:1});

        this._roamFlg = false;
        let will = this._correctMapPosition(cc.v2(-this._playerBornPos.x,-this._playerBornPos.y));
        let self = this;
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2,will),
            cc.callFunc(function(){
                self.createPlayer();
                self.createBounceObstacleTestSetup();
                self._gaming = true;
                func();
            })
        ));
    }

    startBlackHoleTestGame(func){
        this._levelConfig = yyp.config.Level[0];
        this._levelId = LocalizedData.getIntItem("_level1_",1);
        this._resetKillBroadcastRuntime();
        this._killEffectTestMode = false;
        this._killBroadcastTestMode = false;
        this._playerHitTestMode = false;
        this._upgradeTestMode = false;
        this._shootEffectTestMode = false;
        this._portalTestMode = false;
        this._centrifugalRingTestMode = false;
        this._coverTestMode = false;
        this._energyEggTestMode = false;
        this._damageDoubleTestMode = false;
        this._speedDoubleTestMode = false;
        this._spreadBulletTestMode = false;
        this._bounceObstacleTestMode = false;
        this._clusterBombTestMode = false;
        this._blackHoleTestMode = true;
        this._maxEnemyCount = 1;
        this._timeMaxEnemyCount = 1;
        this._bornEnemyCount = 1;
        this._deathEnemyCount = 0;
        this._bornCdTime = 0;
        yyp.eventCenter.emit("current-levelid",{levelid:this._levelId});
        yyp.eventCenter.emit("current-enemycount",{enemycount:1});

        this._roamFlg = false;
        let will = this._correctMapPosition(cc.v2(-this._playerBornPos.x,-this._playerBornPos.y));
        let self = this;
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2,will),
            cc.callFunc(function(){
                self.createPlayer();
                self.createBlackHoleTestSetup();
                self._gaming = true;
                func();
            })
        ));
    }

    startClusterBombTestGame(func){
        this._levelConfig = yyp.config.Level[0];
        this._levelId = LocalizedData.getIntItem("_level1_",1);
        this._resetKillBroadcastRuntime();
        this._killEffectTestMode = false;
        this._killBroadcastTestMode = false;
        this._playerHitTestMode = false;
        this._upgradeTestMode = false;
        this._shootEffectTestMode = false;
        this._portalTestMode = false;
        this._centrifugalRingTestMode = false;
        this._coverTestMode = false;
        this._energyEggTestMode = false;
        this._damageDoubleTestMode = false;
        this._speedDoubleTestMode = false;
        this._spreadBulletTestMode = false;
        this._bounceObstacleTestMode = false;
        this._blackHoleTestMode = false;
        this._clusterBombTestMode = true;
        this._maxEnemyCount = 12;
        this._timeMaxEnemyCount = 12;
        this._bornEnemyCount = 12;
        this._deathEnemyCount = 0;
        this._bornCdTime = 0;
        yyp.eventCenter.emit("current-levelid",{levelid:this._levelId});
        yyp.eventCenter.emit("current-enemycount",{enemycount:12});

        this._roamFlg = false;
        let will = this._correctMapPosition(cc.v2(-this._playerBornPos.x,-this._playerBornPos.y));
        let self = this;
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2,will),
            cc.callFunc(function(){
                self.createPlayer();
                self.createClusterBombTestSetup();
                self._gaming = true;
                func();
            })
        ));
    }

    isTestMode() {
        return this._killEffectTestMode || this._killBroadcastTestMode || this._playerHitTestMode || this._upgradeTestMode || this._shootEffectTestMode || this._portalTestMode || this._centrifugalRingTestMode || this._coverTestMode || this._energyEggTestMode || this._damageDoubleTestMode || this._speedDoubleTestMode || this._spreadBulletTestMode || this._bounceObstacleTestMode || this._blackHoleTestMode || this._clusterBombTestMode;
    }

    isShootEffectTestMode() {
        return this._shootEffectTestMode;
    }

    isKillEffectTestMode() {
        return this._killEffectTestMode;
    }

    isKillBroadcastTestMode() {
        return this._killBroadcastTestMode;
    }

    handleKillEffectTestEnemyDeath(enemyNode) {
        if (!enemyNode || !cc.isValid(enemyNode)) {
            return;
        }

        let deathPos = cc.v2(enemyNode.position);
        this.deleteEnemy(enemyNode);
        if (enemyNode.script) {
            enemyNode.script.enabled = false;
        }
        enemyNode.stopAllActions();
        this._showKillSkull(deathPos);
        this.node.runAction(cc.sequence(
            cc.delayTime(1),
            cc.callFunc(() => {
                this._showPlayerBubble("就这？");
            })
        ));

        let self = this;
        this.node.runAction(cc.sequence(
            cc.delayTime(0.15),
            cc.callFunc(function(){
                self.playKillExplosionEffectAt(deathPos);
                if (self._player && cc.isValid(self._player) && self._player.script
                    && self._player.script._spawnDeathAftermathAt) {
                    self._player.script._spawnDeathAftermathAt(deathPos, self._fire._tmLayerObstacle);
                }
                self._dropTestEnergy(deathPos);
                if (cc.isValid(enemyNode)) {
                    enemyNode.destroy();
                }
            })
        ));
    }

    handleKillBroadcastTestEnemyDeath(enemyNode) {
        if (!enemyNode || !cc.isValid(enemyNode)) {
            return;
        }

        let deathPos = cc.v2(enemyNode.position);
        let victimName = enemyNode["_killVictimName"] || "敌方坦克";
        let streak = this._recordKillStreak();
        this.deleteEnemy(enemyNode);
        if (enemyNode.script) {
            enemyNode.script.enabled = false;
        }
        enemyNode.stopAllActions();
        this._showKillSkull(deathPos);
        this._pushKillBroadcast("我击杀了" + victimName);
        this._showKillBadgeStamp(streak);
        if (streak >= 5) {
            this._showPlayerBubble("我在carry");
        }

        let self = this;
        this.node.runAction(cc.sequence(
            cc.delayTime(0.15),
            cc.callFunc(function(){
                self.playKillExplosionEffectAt(deathPos);
                if (self._player && cc.isValid(self._player) && self._player.script
                    && self._player.script._spawnDeathAftermathAt) {
                    self._player.script._spawnDeathAftermathAt(deathPos, self._fire._tmLayerObstacle);
                }
                if (cc.isValid(enemyNode)) {
                    enemyNode.destroy();
                }
            })
        ));
    }

    _showKillSkull(pos) {
        let skull = new cc.Node("_killSkull");
        skull.parent = this._fire._tmLayerObstacle;
        skull.setPosition(cc.v3(pos.x, pos.y + 85, 0));
        skull.zIndex = 6000;
        skull.opacity = 0;
        skull.scale = 1;
        let label = skull.addComponent(cc.Label);
        label.string = "💀";
        label.fontSize = 48;
        label.lineHeight = 52;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        skull.runAction(cc.sequence(
            cc.spawn(
                cc.moveBy(0.1, 0, 34),
                cc.fadeTo(0.1, 255),
                cc.scaleTo(0.1, 0.5)
            ),
            cc.delayTime(0.3),
            cc.fadeOut(0.1),
            cc.removeSelf()
        ));
    }

    _dropTestEnergy(pos) {
        let fromPos = cc.v2(pos);
        let toPos = this.clampMapInnerPosition(fromPos.add(cc.v2(70, 35)), 40);
        let energy = this.createEnergyAt(fromPos);
        energy.scale = 0.2;
        energy.runAction(cc.spawn(
            cc.scaleTo(0.28, 1),
            cc.jumpTo(0.35, toPos, 42, 1)
        ));
    }

    _showPlayerBubble(text) {
        if (!this._player || !cc.isValid(this._player)) {
            return;
        }

        let bubble = new cc.Node("_killBubble");
        bubble.parent = this._fire._tmLayerObstacle;
        bubble.setPosition(cc.v3(this._player.x, this._player.y + 105, 0));
        bubble.zIndex = 6000;

        let bg = bubble.addComponent(cc.Graphics);
        bg.fillColor = cc.color(255, 255, 255, 235);
        bg.roundRect(-58, -24, 116, 48, 12);
        bg.fill();
        bg.strokeColor = cc.color(40, 40, 40, 240);
        bg.lineWidth = 2;
        bg.roundRect(-58, -24, 116, 48, 12);
        bg.stroke();

        let labelNode = new cc.Node("_lbBubble");
        labelNode.parent = bubble;
        labelNode.setContentSize(116, 48);
        let label = labelNode.addComponent(cc.Label);
        label.string = text;
        label.fontSize = 24;
        label.lineHeight = 28;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        labelNode.color = cc.color(20, 20, 20);

        bubble.runAction(cc.sequence(
            cc.spawn(cc.moveBy(0.15, 0, 12), cc.fadeIn(0.15)),
            cc.delayTime(1),
            cc.fadeOut(0.25),
            cc.removeSelf()
        ));
    }

    _shakeMap() {
        let origin = cc.v3(this.node.position);
        this.node.stopActionByTag(9101);
        let action = cc.sequence(
            cc.moveBy(0.03, 4, 0),
            cc.moveBy(0.03, -8, 0),
            cc.moveBy(0.03, 4, 3),
            cc.moveBy(0.03, 0, -3),
            cc.callFunc(() => {
                this.node.setPosition(origin);
            })
        );
        action.setTag(9101);
        this.node.runAction(action);
    }

    playPlayerCritFeedback() {
        let origin = cc.v3(this.node.position);
        this.node.stopActionByTag(9102);
        let action = cc.sequence(
            cc.moveBy(0.02, 2, 0),
            cc.moveBy(0.02, -4, 0),
            cc.moveBy(0.02, 2, 1),
            cc.moveBy(0.02, 0, -1),
            cc.callFunc(() => {
                this.node.setPosition(origin);
            })
        );
        action.setTag(9102);
        this.node.runAction(action);
    }

    playLightScreenShake() {
        let origin = cc.v3(this.node.position);
        this.node.stopActionByTag(9103);
        let action = cc.sequence(
            cc.moveBy(0.02, 2, 0),
            cc.moveBy(0.02, -4, 0),
            cc.moveBy(0.02, 2, 1),
            cc.moveBy(0.02, 0, -1),
            cc.callFunc(() => {
                this.node.setPosition(origin);
            })
        );
        action.setTag(9103);
        this.node.runAction(action);
    }

    //设置结束
    setFinish(){
        this._gaming = false;
    }

    cleanMap(){
        this.node.stopAllActions();
        this._gaming = false;
        this._pause = false;
        this._multiplayerMode = false;
        this._multiplayerPlayers = [];
        this._multiplayerBullets = {};
        this._multiplayerSpecialEventMap = {};
        this._multiplayerDamageDoubleAreas = [];
        this._multiplayerSpeedDoubleAreas = [];
        this._multiplayerBlackHoleAreas = [];
        this._multiplayerSpawnSlots = [];
        this._multiplayerSafeZone = null;
        this._killEffectTestMode = false;
        this._killBroadcastTestMode = false;
        this._playerHitTestMode = false;
        this._upgradeTestMode = false;
        this._shootEffectTestMode = false;
        this._portalTestMode = false;
        this._centrifugalRingTestMode = false;
        this._coverTestMode = false;
        this._energyEggTestMode = false;
        this._damageDoubleTestMode = false;
        this._speedDoubleTestMode = false;
        this._spreadBulletTestMode = false;
        this._bounceObstacleTestMode = false;
        this._blackHoleTestMode = false;
        this._clusterBombTestMode = false;
        this._resetKillBroadcastRuntime();
        this._clearPortalTestNodes();
        this._clearCentrifugalRingTestNodes();
        this._clearDamageDoubleTestNodes();
        this._clearSpeedDoubleTestNodes();
        this._clearSpreadBulletTestNodes();
        this._clearBounceObstacleTestNodes();
        this._clearBlackHoleTestNodes();
        this._clearMultiplayerSafeZoneNode();
        if (this._player && cc.isValid(this._player)){
            this._player.destroy();
            this._player = null;
        }
        
        for (let i = 0; i < this._enemys.length; i++) {
            let enemy = this._enemys[i];
            enemy.destroy();
        }
        this._enemys = [];

        for (let i = 0; i < this._skills.length; i++) {
            let skill = this._skills[i];
            if (cc.isValid(skill)) {
                skill.destroy();
            }
        }
        this._skills = [];

        for (let i = 0; i < this._energys.length; i++) {
            let energy = this._energys[i];
            if (cc.isValid(energy)) {
                energy.destroy();
            }
        }
        this._energys = [];
        for (let i = 0; i < this._oilSpills.length; i++) {
            let spill = this._oilSpills[i];
            if (spill && spill.node && cc.isValid(spill.node)) {
                spill.node.destroy();
            }
        }
        this._oilSpills = [];
        this.hideOilShellPreview();
        this._coverTestCovers = [];
        this._coverTestEnemy = null;
        for (let i = 0; i < this._energyEggs.length; i++) {
            let egg = this._energyEggs[i];
            if (egg && egg.node && cc.isValid(egg.node)) {
                egg.node.destroy();
            }
        }
        this._energyEggs = [];
        for (let i = 0; i < this._energyEggBushes.length; i++) {
            let bush = this._energyEggBushes[i];
            if (bush && bush.node && cc.isValid(bush.node)) {
                bush.node.destroy();
            }
        }
        this._energyEggBushes = [];
        for (let i = 0; i < this._multiplayerBushes.length; i++) {
            let bush = this._multiplayerBushes[i];
            if (bush && bush.multiplayerGenerated && bush.node && cc.isValid(bush.node)) {
                bush.node.destroy();
            }
            else if (bush) {
                this._setBushVisualOpacity(bush, 255);
            }
        }
        this._multiplayerBushes = [];
        yyp.eventCenter.emit("cover-button-state",{visible:false});

        this._bornEnemyCount = 0;
        this._deathEnemyCount = 0;
        this._maxEnemyCount = 0;
        this._timeMaxEnemyCount = 0;
        this._energyCdTime = 0;
        this._roamFlg = true;
        this._clearRuntimeMapNodes();
    }

    _clearRuntimeMapNodes(){
        if (this._tmDecal && cc.isValid(this._tmDecal)) {
            let decalChildren = this._tmDecal.children.slice();
            for (let i = 0; i < decalChildren.length; i++) {
                let child = decalChildren[i];
                if (cc.isValid(child)) {
                    child.destroy();
                }
            }
        }

        let runtimeNames = {
            "Player": true,
            "Enemy": true,
            "Bullet": true,
            "Boom": true,
            "SkillIcon": true,
            "OilPickup": true,
            "EnergyItem": true,
            "_killSkull": true,
            "_killBubble": true,
            "_upgradeFloat": true,
            "_bulletMutationMedal": true,
            "_portalGateA": true,
            "_portalGateB": true,
            "_portalLinkFx": true,
            "_portalHintLabel": true,
            "_portalWarpFx": true,
            "_centrifugalRing": true,
            "_centrifugalRingHint": true,
            "_centrifugalRingGuide": true,
            "_centrifugalRingFx": true,
            "_oilSpill": true,
            "_coverTestCrate": true,
            "_coverTestCrateShadow": true,
            "_coverHitFx": true,
            "_coverShard": true,
            "EnergyEgg": true,
            "_energyEggBush": true,
            "_energyEggBushShadow": true,
            "_energyEggLeaf": true,
            "_energyEggBushCore": true,
            "_damageDoubleArea": true,
            "_damageDoubleFx": true,
            "_speedDoubleArea": true,
            "_speedDoubleFx": true,
            "_spreadBulletArea": true,
            "_spreadBulletFx": true,
            "_bounceObstacleCircle": true,
            "_bounceObstacleLine": true,
            "_blackHoleArea": true,
            "_blackHoleFx": true
        };
        let children = this._fire._tmLayerObstacle.children.slice();
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (cc.isValid(child) && runtimeNames[child.name]) {
                child.destroy();
            }
        }
    }
    
    _getMultiplayerCornerSpawnCandidates() {
        let safeRadius = this._getMultiplayerPreferredSafeRadius();
        let usableRadius = safeRadius - MULTIPLAYER_SPAWN_SAFE_PADDING;
        if (!(usableRadius > 0)) {
            return [];
        }

        let offset = Math.max(0, Math.floor(usableRadius / Math.sqrt(2)));
        let corners = [
            cc.v2(-offset, offset),
            cc.v2(offset, offset),
            cc.v2(-offset, -offset),
            cc.v2(offset, -offset),
        ];
        let result = [];
        let used = {};
        for (let i = 0; i < corners.length; i++) {
            let pos = this.clampMapInnerPosition(corners[i], MULTIPLAYER_SPAWN_EDGE_PADDING);
            let key = Math.round(pos.x) + ":" + Math.round(pos.y);
            if (used[key]) {
                continue;
            }
            used[key] = true;
            result.push(cc.v2(pos));
        }
        return result;
    }

    _getMultiplayerSpawnCandidates() {
        let cornerCandidates = this._getMultiplayerCornerSpawnCandidates();
        if (cornerCandidates.length >= 4) {
            return cornerCandidates;
        }

        let result = [];
        if (this._playerBornPos) {
            result.push(cc.v2(this._playerBornPos));
        }
        for (let i = 0; i < this._enemyBornPos.length; i++) {
            let pos = this._enemyBornPos[i];
            if (pos) {
                result.push(cc.v2(pos));
            }
        }
        return result;
    }

    _resolveMultiplayerSpawnPosition(playerIdx, playerCount) {
        let candidates = this._getMultiplayerSpawnCandidates();
        if (candidates.length <= 0) {
            let spawnOffset = cc.v2((playerIdx - (playerCount - 1) / 2) * 180, 0);
            return this.clampMapInnerPosition(this._playerBornPos.add(spawnOffset), 60);
        }

        let slot = this._multiplayerSpawnSlots[playerIdx];
        let index = slot == null ? playerIdx : slot;
        let candidate = candidates[index % candidates.length];
        return this.clampMapInnerPosition(candidate, 80);
    }

    createMultiplayerPlayer(playerIdx, playerCount, playerState = null) {
        let playerType = playerState && playerState.tankType != null
            ? playerState.tankType
            : LocalizedData.getIntItem("_current_player_type_",1);
        let playerLevel = playerState && playerState.playerLevel != null
            ? playerState.playerLevel
            : LocalizedData.getIntItem(`_player_${playerType}_`, 1);

        let player = cc.instantiate(this.playerPrefab);
        player.parent = this._fire._tmLayerObstacle;
        player.zIndex = 100;

        let spawnPos = this._resolveMultiplayerSpawnPosition(playerIdx, playerCount);
        player.position = cc.v3(spawnPos);
        player.script.setMap(this);
        player.script.setPlayerType(playerType, playerLevel);
        player.script.setInGame();
        player.script._multiplayerPlayerId = playerIdx;
        player["__multiplayerPlayerId"] = playerIdx;

        // Mark remote players (no UI controls)
        if (playerIdx !== this._localPlayerId) {
            player.script._multiplayerRemote = true;
        }
        player.script._multiplayerMode = true;
        if (playerState && player.script.syncMultiplayerState) {
            player.script.syncMultiplayerState(playerState);
        }

        // Visually distinguish players: P0=green tint, P1=blue tint
        let colorTint = playerIdx === this._localPlayerId ? cc.color(180, 255, 180, 255) : cc.color(160, 200, 255, 255);
        let tryNames = ['_sprBg1', '_sprBg2', '_sprBg3', '_sprBg4', '_sprBg'];
        tryNames.forEach(name => {
            let fireRefs = player["_fire"];
            let n = fireRefs ? fireRefs[name] : null;
            if (n && cc.isValid(n)) {
                try { n.color = colorTint; } catch (e) {}
            }
        });
        if (player.script && player.script.setMultiplayerDisplayName) {
            player.script.setMultiplayerDisplayName("player" + (playerIdx + 1), playerIdx === this._localPlayerId);
        }

        this._multiplayerPlayers[playerIdx] = player;
        if (playerIdx === this._localPlayerId) {
            this._player = player;
            this._refreshLocalCoverInteractionUi();
        }
        return player;
    }

    startMultiplayerGame(playerCount, localPlayerId, spawnSlots, energies, players, specialEvents, tarPickups, tarSpills, blackHolePickups, blackHoleZones, bushes, covers, safeZone, pickups, energyWells, onReady) {
        this._multiplayerMode = true;
        this._multiplayerPlayers = [];
        this._multiplayerBullets = {};
        this._multiplayerEnergyMap = {};
        this._multiplayerEnergyEggMap = {};
        this._multiplayerSpecialEventMap = {};
        this._multiplayerTarPickupMap = {};
        this._multiplayerTarSpillMap = {};
        this._multiplayerBlackHolePickupMap = {};
        this._multiplayerBlackHoleZoneMap = {};
        this._multiplayerCoverMap = {};
        this._multiplayerDamageDoubleAreas = [];
        this._multiplayerSpeedDoubleAreas = [];
        this._multiplayerBlackHoleAreas = [];
        this._multiplayerSafeZone = null;
        this._multiplayerSafeZoneNode = null;
        this._multiplayerCoverMap = {};
        this._pendingTarThrowMap = {};
        this._pendingBlackHoleThrowMap = {};
        this._multiplayerPickupMap = {};
        this._multiplayerEnergyWellMap = {};
        this._multiplayerPendingCoverToggleId = null;
        this._multiplayerCoverTogglePendingFrames = 0;
        this._multiplayerPendingCoverAction = null;
        this._multiplayerPendingInteraction = null;
        this._localPlayerId = localPlayerId == null ? 0 : localPlayerId;
        this._multiplayerSpawnSlots = spawnSlots ? spawnSlots.slice() : [];
        let playerStates = Array.isArray(players) ? players : [];
        let initialSpecialEvents = Array.isArray(specialEvents) ? specialEvents : [];
        let initialTarPickups = Array.isArray(tarPickups) ? tarPickups : [];
        let initialTarSpills = Array.isArray(tarSpills) ? tarSpills : [];
        let initialBlackHolePickups = Array.isArray(blackHolePickups) ? blackHolePickups : [];
        let initialBlackHoleZones = Array.isArray(blackHoleZones) ? blackHoleZones : [];
        let initialBushes = Array.isArray(bushes) ? bushes : [];
        let initialCovers = Array.isArray(covers) ? covers : [];
        let initialPickups = Array.isArray(pickups) ? pickups : [];
        let initialEnergyWells = Array.isArray(energyWells) ? energyWells : [];

        this._levelConfig = yyp.config.Level[0];
        this._levelId = LocalizedData.getIntItem("_level1_",1);
        this._clearAllTestNodes();

        this._killEffectTestMode = false;
        this._killBroadcastTestMode = false;
        this._playerHitTestMode = false;
        this._upgradeTestMode = false;
        this._shootEffectTestMode = false;
        this._portalTestMode = false;
        this._centrifugalRingTestMode = false;
        this._coverTestMode = false;
        this._energyEggTestMode = false;
        this._damageDoubleTestMode = false;
        this._speedDoubleTestMode = false;
        this._spreadBulletTestMode = false;
        this._bounceObstacleTestMode = false;
        this._blackHoleTestMode = false;
        this._clusterBombTestMode = false;

        this._roamFlg = false;
        let will = this._correctMapPosition(cc.v2(-this._playerBornPos.x, -this._playerBornPos.y));
        let self = this;
        this.node.runAction(cc.sequence(
            cc.moveTo(0.2, will),
            cc.callFunc(function () {
                for (let i = 0; i < playerCount; i++) {
                    self.createMultiplayerPlayer(i, playerCount, playerStates[i] || null);
                }
                self._initMultiplayerBushes(initialBushes);
                let initialEnergies = energies || [];
                for (let i = 0; i < initialEnergies.length; i++) {
                    self.onMultiplayerEnergySpawn(initialEnergies[i]);
                }
                for (let i = 0; i < initialSpecialEvents.length; i++) {
                    self._applyMultiplayerSpecialEventSpawn(initialSpecialEvents[i]);
                }
                for (let i = 0; i < initialTarPickups.length; i++) {
                    self._spawnMultiplayerTarPickup(initialTarPickups[i]);
                }
                for (let i = 0; i < initialTarSpills.length; i++) {
                    self._spawnMultiplayerTarSpill(initialTarSpills[i]);
                }
                for (let i = 0; i < initialBlackHolePickups.length; i++) {
                    self._spawnMultiplayerBlackHolePickup(initialBlackHolePickups[i]);
                }
                for (let i = 0; i < initialBlackHoleZones.length; i++) {
                    self._spawnMultiplayerBlackHoleZone(initialBlackHoleZones[i]);
                }
                for (let i = 0; i < initialPickups.length; i++) {
                    self._spawnMultiplayerPickup(initialPickups[i]);
                }
                for (let i = 0; i < initialEnergyWells.length; i++) {
                    self._spawnMultiplayerEnergyWell(initialEnergyWells[i]);
                }
                self._initMultiplayerCovers(initialCovers);
                self._applyMultiplayerSafeZoneState(safeZone || null);
                self._gaming = true;
                self._refreshMultiplayerBushVisibility();
                self._refreshLocalCoverInteractionUi();
                // Center camera on local player immediately
                self._centerOnLocalPlayer();
                if (onReady) onReady();
            })
        ));
    }

    simulateFrame(frameData) {
        if (!this._multiplayerMode) return;
        this._tickLocalMultiplayerCoverTogglePending();
        let commands = frameData && Array.isArray(frameData.commands) ? frameData.commands : [];
        this._applyMultiplayerFrameCommands(commands);
        this._syncAllAttachedMultiplayerCovers();
        this._syncAllAttachedMultiplayerEnergyEggs();
        this._refreshMultiplayerBushVisibility();
        this._refreshLocalCoverInteractionUi();

        this._centerOnLocalPlayer();
    }

    _applyMultiplayerFrameCommands(commands) {
        for (let i = 0; i < commands.length; i++) {
            let command = commands[i];
            if (!command || !command.type) {
                continue;
            }
            if (command.type === "hudState" || command.type === "announcement" || command.type === "matchResult") {
                continue;
            }
            if (command.type === "playerInput") {
                let player = this._multiplayerPlayers[command.playerId];
                if (player && cc.isValid(player) && player.script && player.script.setFrameInput) {
                    player.script.setFrameInput(command.inputs || {});
                }
            }
            else if (command.type === "playerState") {
                let player = this._multiplayerPlayers[command.playerId];
                if (player && cc.isValid(player) && player.script && player.script.syncMultiplayerState) {
                    player.script.syncMultiplayerState(command);
                }
            }
            else if (command.type === "playerFireState") {
                this._applyMultiplayerPlayerFireState(command);
            }
            else if (command.type === "playerHit") {
                this.applyMultiplayerHit(command);
            }
            else if (command.type === "bulletBounce") {
                this._applyMultiplayerBulletBounce(command);
            }
            else if (command.type === "energySpawn") {
                this.onMultiplayerEnergySpawn(command.energy);
            }
            else if (command.type === "energyConsume") {
                this.onMultiplayerEnergyRemove(command.energyId);
            }
            else if (command.type === "energyRemove") {
                this.onMultiplayerEnergyRemove(command.energyId);
            }
            else if (command.type === "playerUpgrade") {
                this.onMultiplayerPlayerUpgrade(command);
            }
            else if (command.type === "energyEggSpawn") {
                this._spawnMultiplayerEnergyEgg(command.egg);
            }
            else if (command.type === "energyEggMove") {
                this._moveMultiplayerEnergyEgg(command);
            }
            else if (command.type === "energyEggMature") {
                this._matureMultiplayerEnergyEgg(command);
            }
            else if (command.type === "energyEggRemove") {
                this._removeMultiplayerEnergyEgg(command.eggId);
            }
            else if (command.type === "specialEventSpawn") {
                this._applyMultiplayerSpecialEventSpawn(command.event);
            }
            else if (command.type === "specialEventRemove") {
                this._applyMultiplayerSpecialEventRemove(command.eventId, command.eventType);
            }
            else if (command.type === "pickupSpawn") {
                this._spawnMultiplayerPickup(command.pickup);
            }
            else if (command.type === "pickupRemove") {
                this._removeMultiplayerPickup(command.pickupId);
            }
            else if (command.type === "pickupUse") {
                this._playMultiplayerPickupUse(command);
            }
            else if (command.type === "pickupActionResult") {
            }
            else if (command.type === "energyWellSpawn") {
                this._spawnMultiplayerEnergyWell(command.well);
            }
            else if (command.type === "energyWellBurst") {
                this._applyMultiplayerEnergyWellBurst(command);
            }
            else if (command.type === "energyWellRemove") {
                this._removeMultiplayerEnergyWell(command.wellId);
            }
            else if (command.type === "tarPickupSpawn") {
                this._spawnMultiplayerTarPickup(command.pickup);
            }
            else if (command.type === "tarPickupRemove") {
                this._removeMultiplayerTarPickup(command.pickupId);
            }
            else if (command.type === "tarThrow") {
                this._playMultiplayerTarThrow(command);
            }
            else if (command.type === "tarSpillSpawn") {
                this._spawnMultiplayerTarSpill(command.spill);
            }
            else if (command.type === "tarSpillRemove") {
                this._removeMultiplayerTarSpill(command.spillId);
            }
            else if (command.type === "blackHolePickupSpawn") {
                this._spawnMultiplayerBlackHolePickup(command.pickup);
            }
            else if (command.type === "blackHolePickupRemove") {
                this._removeMultiplayerBlackHolePickup(command.pickupId);
            }
            else if (command.type === "blackHoleThrow") {
                this._playMultiplayerBlackHoleThrow(command);
            }
            else if (command.type === "blackHoleZoneSpawn") {
                this._spawnMultiplayerBlackHoleZone(command.zone);
            }
            else if (command.type === "blackHoleZoneRemove") {
                this._removeMultiplayerBlackHoleZone(command.zoneId);
            }
            else if (command.type === "safeZoneState") {
                this._applyMultiplayerSafeZoneState(command.safeZone);
            }
            else if (command.type === "safeZoneDamage") {
                this._applyMultiplayerSafeZoneDamage(command);
            }
            else if (command.type === "coverSync") {
                this._applyMultiplayerCoverSync(command.cover);
            }
            else if (command.type === "coverRemove") {
                this._removeMultiplayerCover(command.coverId);
            }
            else if (command.type === "coverActionResult") {
                this._applyMultiplayerCoverActionResult(command);
            }
            else if (command.type === "energyEggActionResult") {
                this._applyMultiplayerEnergyEggActionResult(command);
            }
        }
    }

    _applyMultiplayerCoverActionResult(command) {
        if (!this._isLocalMultiplayerCoverTogglePending() || !command || command.playerId != this._localPlayerId) {
            return;
        }
        let pending = this._multiplayerPendingCoverAction;
        if (!pending || pending.seq != command.seq || pending.coverId != command.coverId) {
            return;
        }
        if (command.accepted !== true) {
            this._clearLocalMultiplayerCoverTogglePending(command.coverId, "cover");
            this._refreshLocalCoverInteractionUi();
        }
    }

    _applyMultiplayerEnergyEggActionResult(command) {
        if (!this._isLocalMultiplayerCoverTogglePending() || !command || command.playerId != this._localPlayerId) {
            return;
        }
        let pending = this._multiplayerPendingInteraction;
        if (!pending || pending.type != "energyEgg" || pending.seq != command.seq || pending.targetId != command.eggId) {
            return;
        }
        if (command.accepted !== true) {
            this._clearLocalMultiplayerCoverTogglePending(command.eggId, "energyEgg");
            this._refreshLocalCoverInteractionUi();
        }
    }

    _initMultiplayerCovers(covers = []) {
        this._cleanupInvalidCoverTestCovers();
        for (let i = this._coverTestCovers.length - 1; i >= 0; i--) {
            let cover = this._coverTestCovers[i];
            if (cover && cover.multiplayer && cover.node && cc.isValid(cover.node)) {
                cover.node.destroy();
                this._coverTestCovers.splice(i, 1);
            }
        }
        this._multiplayerCoverMap = {};
        for (let i = 0; i < covers.length; i++) {
            this._applyMultiplayerCoverSync(covers[i]);
        }
    }

    _findMultiplayerCoverById(coverId) {
        if (coverId == null) {
            return null;
        }
        if (this._multiplayerCoverMap && this._multiplayerCoverMap[coverId]) {
            return this._multiplayerCoverMap[coverId];
        }
        for (let i = 0; i < this._coverTestCovers.length; i++) {
            let cover = this._coverTestCovers[i];
            if (cover && cover.multiplayer && cover.coverId == coverId) {
                return cover;
            }
        }
        return null;
    }

    _applyMultiplayerCoverSync(coverData) {
        if (!this._multiplayerMode || !coverData || coverData.id == null) {
            return;
        }
        let cover = this._findMultiplayerCoverById(coverData.id);
        if (!cover) {
            cover = this._createCoverTestCover(cc.v2(coverData.x || 0, coverData.y || 0));
            if (!cover) {
                return;
            }
            cover.multiplayer = true;
            cover.coverId = coverData.id;
            this._multiplayerCoverMap[coverData.id] = cover;
        }
        cover.radius = coverData.radius == null ? cover.radius : coverData.radius;
        cover.hp = coverData.hp == null ? cover.hp : coverData.hp;
        cover.maxHp = coverData.maxHp == null ? cover.maxHp : coverData.maxHp;
        cover.attached = !!coverData.attached;
        cover.ownerPlayerId = coverData.ownerPlayerId == null ? null : coverData.ownerPlayerId;
        cover.attachOffset = cc.v2(coverData.attachOffsetX || 0, coverData.attachOffsetY || 0);
        cover.owner = cover.ownerPlayerId != null && this._multiplayerPlayers
            ? this._multiplayerPlayers[cover.ownerPlayerId] || null
            : null;
        if (cover.node && cc.isValid(cover.node)) {
            let pos = cc.v2(coverData.x || 0, coverData.y || 0);
            if (cover.attached && cover.owner && cc.isValid(cover.owner)) {
                pos = cc.v2(cover.owner.position).add(cover.attachOffset || cc.v2(0, 0));
                pos = this.clampMapInnerPosition(pos, (cover.radius || 34) + 6);
            }
            cover.node.setPosition(cc.v3(pos));
            cover.node.zIndex = this.judgezIndex(pos.y) + 1;
        }
        this._syncLocalMultiplayerCoverTogglePendingFromCover(coverData);
        this._refreshCoverTestCoverVisual(cover);
        this._refreshLocalCoverInteractionUi();
    }

    _removeMultiplayerCover(coverId) {
        if (coverId == null) {
            return;
        }
        this._clearLocalMultiplayerCoverTogglePending(coverId, "cover");
        let cover = this._findMultiplayerCoverById(coverId);
        if (this._multiplayerCoverMap && this._multiplayerCoverMap[coverId]) {
            delete this._multiplayerCoverMap[coverId];
        }
        if (!cover) {
            return;
        }
        for (let i = this._coverTestCovers.length - 1; i >= 0; i--) {
            if (this._coverTestCovers[i] === cover) {
                this._coverTestCovers.splice(i, 1);
                break;
            }
        }
        if (cover.node && cc.isValid(cover.node)) {
            cover.node.destroy();
        }
        this._refreshLocalCoverInteractionUi();
    }

    _initMultiplayerBushes(bushes = []) {
        for (let i = 0; i < this._multiplayerBushes.length; i++) {
            let bush = this._multiplayerBushes[i];
            if (bush && bush.multiplayerGenerated && bush.node && cc.isValid(bush.node)) {
                bush.node.destroy();
            }
        }
        this._multiplayerBushes = [];
        for (let i = 0; i < bushes.length; i++) {
            let bushData = bushes[i];
            let bush = this._createMultiplayerBushNode(bushData);
            if (bush) {
                this._multiplayerBushes.push(bush);
            }
        }
    }

    _createMultiplayerBushNode(bushData) {
        if (!bushData || !this._fire._tmLayerObstacle) {
            return null;
        }
        let pos = cc.v2(bushData.x || 0, bushData.y || 0);
        let radius = bushData.radius == null ? 94 : bushData.radius;
        let mapBush = this._getMapGrassBushById(bushData.id);
        if (mapBush) {
            return {
                id: bushData.id == null ? mapBush.id : bushData.id,
                node: mapBush.node,
                nodes: mapBush.nodes,
                rects: Array.isArray(bushData.rects) && bushData.rects.length > 0 ? bushData.rects : mapBush.rects,
                width: bushData.width == null ? mapBush.width : bushData.width,
                height: bushData.height == null ? mapBush.height : bushData.height,
                x: bushData.x == null ? mapBush.x : bushData.x,
                y: bushData.y == null ? mapBush.y : bushData.y,
                radius: bushData.radius == null ? mapBush.radius : bushData.radius,
                multiplayer: true,
                multiplayerGenerated: false,
                fromMapGrass: true,
            };
        }
        let root = new cc.Node("_multiplayerBush");
        root.parent = this._fire._tmLayerObstacle;
        root.setPosition(cc.v3(pos));
        root.zIndex = this.judgezIndex(pos.y) + 2;

        let shadow = new cc.Node("_multiplayerBushShadow");
        shadow.parent = root;
        shadow.setPosition(0, -14);
        let shadowGraphics = shadow.addComponent(cc.Graphics);
        shadowGraphics.fillColor = cc.color(0, 0, 0, 60);
        shadowGraphics.ellipse(0, 0, radius * 0.62, radius * 0.22);
        shadowGraphics.fill();

        let spriteNode = new cc.Node("_multiplayerBushSprite");
        spriteNode.parent = root;
        spriteNode.setPosition(0, 8);
        spriteNode.setContentSize(radius * 1.95, radius * 1.95);
        let sprite = spriteNode.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        this._loadEnergyEggBushFrame((spriteFrame) => {
            if (sprite && cc.isValid(sprite) && spriteFrame) {
                sprite.spriteFrame = spriteFrame;
            }
        });

        return {
            id: bushData.id == null ? this._multiplayerBushes.length + 1 : bushData.id,
            node: root,
            nodes: [root],
            rects: Array.isArray(bushData.rects) ? bushData.rects : [],
            width: bushData.width,
            height: bushData.height,
            x: bushData.x,
            y: bushData.y,
            radius: radius,
            multiplayer: true,
            multiplayerGenerated: true,
        };
    }

    _getBushDisplayNodes(bush) {
        if (!bush) {
            return [];
        }
        if (Array.isArray(bush.nodes) && bush.nodes.length > 0) {
            return bush.nodes;
        }
        return bush.node ? [bush.node] : [];
    }

    _setBushVisualOpacity(bush, opacity = 255) {
        let nodes = this._getBushDisplayNodes(bush);
        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            if (!node || !cc.isValid(node)) {
                continue;
            }
            node.opacity = opacity;
        }
    }

    _refreshBushDisplayOrder(bush) {
        let nodes = this._getBushDisplayNodes(bush);
        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            if (!node || !cc.isValid(node)) {
                continue;
            }
            node.zIndex = this.judgezIndex(node.y) + 2;
        }
    }

    _isPointInsideBushRect(point, rect, inset = 0) {
        if (!point || !rect) {
            return false;
        }
        let halfWidth = Math.max(0, (rect.width || 0) / 2 - inset);
        let halfHeight = Math.max(0, (rect.height || 0) / 2 - inset);
        if (halfWidth <= 0 || halfHeight <= 0) {
            return false;
        }
        let dx = Math.abs(point.x - (rect.x || 0));
        let dy = Math.abs(point.y - (rect.y || 0));
        return dx <= halfWidth && dy <= halfHeight;
    }

    _isPointInsideBush(point, bush, inset = 0) {
        if (!point || !bush) {
            return false;
        }
        let pos = cc.v2(point);
        if (Array.isArray(bush.rects) && bush.rects.length > 0) {
            for (let i = 0; i < bush.rects.length; i++) {
                if (this._isPointInsideBushRect(pos, bush.rects[i], inset)) {
                    return true;
                }
            }
            return false;
        }
        let radius = Math.max(0, (bush.radius || MULTIPLAYER_BUSH_RADIUS) - inset);
        let center = cc.v2(bush.x || (bush.node ? bush.node.x : 0), bush.y || (bush.node ? bush.node.y : 0));
        return pos.sub(center).magSqr() <= radius * radius;
    }

    _getMultiplayerBushById(bushId) {
        if (bushId == null) {
            return null;
        }
        for (let i = 0; i < this._multiplayerBushes.length; i++) {
            let bush = this._multiplayerBushes[i];
            if (bush && bush.id == bushId && bush.node && cc.isValid(bush.node)) {
                return bush;
            }
        }
        return null;
    }

    _refreshMultiplayerBushVisibility() {
        if (!this._multiplayerMode) {
            return;
        }

        let localPlayer = this._multiplayerPlayers[this._localPlayerId];
        let localBushId = null;
        if (localPlayer && cc.isValid(localPlayer) && localPlayer.script) {
            localBushId = localPlayer.script._multiplayerInBush ? localPlayer.script._multiplayerBushId : null;
        }

        for (let i = 0; i < this._multiplayerBushes.length; i++) {
            let bush = this._multiplayerBushes[i];
            if (!bush || !bush.node || !cc.isValid(bush.node)) {
                continue;
            }
            this._refreshBushDisplayOrder(bush);
            this._setBushVisualOpacity(bush, localBushId != null && bush.id == localBushId ? 155 : 255);
        }

        for (let i = 0; i < this._multiplayerPlayers.length; i++) {
            let player = this._multiplayerPlayers[i];
            if (!player || !cc.isValid(player) || !player.script) {
                continue;
            }
            let playerBushId = player.script._multiplayerInBush ? player.script._multiplayerBushId : null;
            let visibleMode = "normal";
            if (playerBushId != null) {
                if (i == this._localPlayerId) {
                    visibleMode = "selfBush";
                }
                else if (localBushId == null || localBushId != playerBushId) {
                    visibleMode = "hidden";
                }
                else{
                    visibleMode = "selfBush";
                }
            }
            if (player.script.setBushVisibilityMode) {
                player.script.setBushVisibilityMode(visibleMode);
            }
        }

        for (let i = 0; i < this._energys.length; i++) {
            let energy = this._energys[i];
            if (!energy || !cc.isValid(energy) || localBushId == null) {
                if (energy && cc.isValid(energy)) {
                    energy.opacity = 255;
                }
                continue;
            }
            let bush = this._getMultiplayerBushById(localBushId);
            let hidden = bush && this._isPointInsideBush(energy.position, bush, 0);
            energy.opacity = hidden ? 110 : 255;
        }

        for (let i = 0; i < this._skills.length; i++) {
            let skill = this._skills[i];
            if (!skill || !cc.isValid(skill) || localBushId == null) {
                if (skill && cc.isValid(skill)) {
                    skill.opacity = 255;
                }
                continue;
            }
            let bush = this._getMultiplayerBushById(localBushId);
            let hidden = bush && this._isPointInsideBush(skill.position, bush, 0);
            skill.opacity = hidden ? 110 : 255;
        }

        for (let i = 0; i < this._oilSpills.length; i++) {
            let spill = this._oilSpills[i];
            if (!spill || !spill.node || !cc.isValid(spill.node) || localBushId == null) {
                if (spill && spill.node && cc.isValid(spill.node)) {
                    spill.node.opacity = Math.max(0, spill.node.opacity);
                }
                continue;
            }
            let bush = this._getMultiplayerBushById(localBushId);
            let hidden = bush && this._isPointInsideBush(spill.node.position, bush, 0);
            if (hidden) {
                spill.node.opacity = Math.min(spill.node.opacity, 120);
            }
        }
    }

    _spawnMultiplayerTarPickup(pickupData) {
        if (!this._multiplayerMode || !pickupData || pickupData.id == null) {
            return;
        }
        if (this._multiplayerTarPickupMap[pickupData.id] && cc.isValid(this._multiplayerTarPickupMap[pickupData.id])) {
            return;
        }
        let pickup = this.spawnTarPickupAt(
            cc.v2(pickupData.x || 0, pickupData.y || 0),
            pickupData.id,
            pickupData.remainTime == null ? 120 : pickupData.remainTime
        );
        if (pickup) {
            this._multiplayerTarPickupMap[pickupData.id] = pickup;
        }
    }

    _removeMultiplayerTarPickup(pickupId) {
        if (pickupId == null) {
            return;
        }
        let pickup = this._multiplayerTarPickupMap[pickupId];
        delete this._multiplayerTarPickupMap[pickupId];
        if (!pickup) {
            return;
        }
        for (let i = this._skills.length - 1; i >= 0; i--) {
            if (this._skills[i] === pickup) {
                this._skills.splice(i, 1);
                break;
            }
        }
        if (cc.isValid(pickup)) {
            pickup.destroy();
        }
    }

    _spawnMultiplayerTarSpill(spillData) {
        if (!this._multiplayerMode || !spillData || spillData.id == null) {
            return;
        }
        let pendingThrow = this._pendingTarThrowMap[spillData.id];
        if (pendingThrow) {
            pendingThrow.spillData = spillData;
            return;
        }
        if (this._multiplayerTarSpillMap[spillData.id] && cc.isValid(this._multiplayerTarSpillMap[spillData.id])) {
            return;
        }
        let node = this.spawnOilSpill(cc.v2(spillData.x || 0, spillData.y || 0), {
            radius: spillData.radius,
            duration: spillData.remainTime || spillData.duration,
            slowFactor: spillData.slowFactor,
        });
        if (node) {
            node["__tarSpillId"] = spillData.id;
            this._multiplayerTarSpillMap[spillData.id] = node;
        }
    }

    _spawnMultiplayerBlackHolePickup(pickupData) {
        if (!this._multiplayerMode || !pickupData || pickupData.id == null) {
            return;
        }
        if (this._multiplayerBlackHolePickupMap[pickupData.id] && cc.isValid(this._multiplayerBlackHolePickupMap[pickupData.id])) {
            return;
        }
        let pickup = this.spawnBlackHolePickupAt(
            cc.v2(pickupData.x || 0, pickupData.y || 0),
            pickupData.id,
            pickupData.remainTime == null ? 120 : pickupData.remainTime
        );
        if (pickup) {
            this._multiplayerBlackHolePickupMap[pickupData.id] = pickup;
        }
    }

    _removeMultiplayerBlackHolePickup(pickupId) {
        if (pickupId == null) {
            return;
        }
        let pickup = this._multiplayerBlackHolePickupMap[pickupId];
        delete this._multiplayerBlackHolePickupMap[pickupId];
        if (!pickup) {
            return;
        }
        for (let i = this._skills.length - 1; i >= 0; i--) {
            if (this._skills[i] === pickup) {
                this._skills.splice(i, 1);
                break;
            }
        }
        if (cc.isValid(pickup)) {
            pickup.destroy();
        }
    }

    _spawnMultiplayerPickup(pickupData) {
        if (!this._multiplayerMode || !pickupData || pickupData.id == null) {
            return;
        }
        if (this._multiplayerPickupMap[pickupData.id] && cc.isValid(this._multiplayerPickupMap[pickupData.id])) {
            return;
        }
        let pickup = this.spawnConfiguredPickupAt(
            cc.v2(pickupData.x || 0, pickupData.y || 0),
            pickupData.pickupType || "portal",
            pickupData.id,
            pickupData.remainTime == null ? 60 : pickupData.remainTime
        );
        if (pickup) {
            this._multiplayerPickupMap[pickupData.id] = pickup;
        }
    }

    _removeMultiplayerPickup(pickupId) {
        if (pickupId == null) {
            return;
        }
        let pickup = this._multiplayerPickupMap[pickupId];
        delete this._multiplayerPickupMap[pickupId];
        if (!pickup) {
            return;
        }
        for (let i = this._skills.length - 1; i >= 0; i--) {
            if (this._skills[i] === pickup) {
                this._skills.splice(i, 1);
                break;
            }
        }
        if (cc.isValid(pickup)) {
            pickup.destroy();
        }
    }

    _spawnMultiplayerEnergyWell(wellData) {
        if (!this._multiplayerMode || !wellData || wellData.id == null) {
            return;
        }
        if (this._multiplayerEnergyWellMap[wellData.id] && cc.isValid(this._multiplayerEnergyWellMap[wellData.id])) {
            return;
        }
        let root = new cc.Node("_energyWell");
        root.parent = this._fire._tmLayerObstacle;
        root.setPosition(cc.v3(wellData.x || 0, wellData.y || 0));
        root.zIndex = 5600;
        let graphics = root.addComponent(cc.Graphics);
        let radius = wellData.radius == null ? 46 : wellData.radius;
        graphics.fillColor = cc.color(40, 180, 120, 80);
        graphics.circle(0, 0, radius);
        graphics.fill();
        graphics.lineWidth = 5;
        graphics.strokeColor = cc.color(110, 255, 190, 255);
        graphics.circle(0, 0, radius - 4);
        graphics.stroke();
        root.runAction(cc.repeatForever(cc.sequence(
            cc.scaleTo(0.4, 1.05),
            cc.scaleTo(0.4, 0.98)
        )));
        this._multiplayerEnergyWellMap[wellData.id] = root;
    }

    _applyMultiplayerEnergyWellBurst(command) {
        if (!command || !Array.isArray(command.energies)) {
            return;
        }
        for (let i = 0; i < command.energies.length; i++) {
            this.onMultiplayerEnergySpawn(command.energies[i]);
        }
    }

    _removeMultiplayerEnergyWell(wellId) {
        if (wellId == null) {
            return;
        }
        let node = this._multiplayerEnergyWellMap[wellId];
        delete this._multiplayerEnergyWellMap[wellId];
        if (node && cc.isValid(node)) {
            node.destroy();
        }
    }

    _playMultiplayerPickupUse(command) {
        if (!command) {
            return;
        }
        if (command.pickupType == "portal") {
            this._spawnPortalWarpFx(cc.v2(command.x || 0, command.y || 0), cc.color(110, 255, 245, 255));
        }
        else if (command.pickupType == "speedDouble") {
            this.spawnSpeedDoubleFx(cc.v2(command.x || 0, command.y || 0));
        }
        else if (command.pickupType == "damageDouble") {
            this.spawnDamageDoubleFx(cc.v2(command.x || 0, command.y || 0));
        }
    }

    _removeMultiplayerTarSpill(spillId) {
        if (spillId == null) {
            return;
        }
        let node = this._multiplayerTarSpillMap[spillId];
        delete this._multiplayerTarSpillMap[spillId];
        for (let i = this._oilSpills.length - 1; i >= 0; i--) {
            let spill = this._oilSpills[i];
            if (spill && spill.node === node) {
                this._oilSpills.splice(i, 1);
                break;
            }
        }
        if (node && cc.isValid(node)) {
            node.destroy();
        }
    }

    _playMultiplayerTarThrow(command) {
        if (!command || !command.from || !command.to) {
            return;
        }
        if (command.spillId != null) {
            this._pendingTarThrowMap[command.spillId] = this._pendingTarThrowMap[command.spillId] || {};
        }
        let self = this;
        this.playOilShellThrow(cc.v2(command.from), cc.v2(command.to), {
            areaRadius: TAR_SPILL_RADIUS,
            arcHeight: 110,
            onLand: function () {
                if (command.spillId == null) {
                    return;
                }
                let pendingThrow = self._pendingTarThrowMap[command.spillId];
                if (pendingThrow && pendingThrow.spillData) {
                    let spillData = pendingThrow.spillData;
                    delete self._pendingTarThrowMap[command.spillId];
                    self._spawnMultiplayerTarSpill(spillData);
                }
                else{
                    delete self._pendingTarThrowMap[command.spillId];
                }
            }
        });
    }

    _spawnMultiplayerBlackHoleZone(zoneData) {
        if (!this._multiplayerMode || !zoneData || zoneData.id == null) {
            return;
        }
        let pendingThrow = this._pendingBlackHoleThrowMap[zoneData.id];
        if (pendingThrow) {
            pendingThrow.zoneData = zoneData;
            return;
        }
        if (this._multiplayerBlackHoleZoneMap[zoneData.id]) {
            return;
        }
        let node = this.spawnBlackHoleZone(cc.v2(zoneData.x || 0, zoneData.y || 0), zoneData);
        if (node) {
            this._multiplayerBlackHoleZoneMap[zoneData.id] = node;
            this._multiplayerBlackHoleAreas.push({
                node: node,
                center: cc.v2(zoneData.x || 0, zoneData.y || 0),
                radius: zoneData.radius == null ? 100 : zoneData.radius,
                destroyRadius: zoneData.destroyRadius == null ? 14 : zoneData.destroyRadius,
                gravityStrength: zoneData.gravityStrength == null ? 160 : zoneData.gravityStrength,
                duration: zoneData.duration == null ? null : zoneData.duration,
                remainTime: zoneData.remainTime == null ? zoneData.duration : zoneData.remainTime,
                eventId: zoneData.id,
            });
        }
    }

    _removeMultiplayerBlackHoleZone(zoneId) {
        if (zoneId == null) {
            return;
        }
        let node = this._multiplayerBlackHoleZoneMap[zoneId];
        if (node && cc.isValid(node)) {
            node.destroy();
        }
        delete this._multiplayerBlackHoleZoneMap[zoneId];
        for (let i = this._multiplayerBlackHoleAreas.length - 1; i >= 0; i--) {
            let area = this._multiplayerBlackHoleAreas[i];
            if (!area || area.eventId == zoneId) {
                this._multiplayerBlackHoleAreas.splice(i, 1);
            }
        }
    }

    _playMultiplayerBlackHoleThrow(command) {
        if (!command || !command.from || !command.to) {
            return;
        }
        if (command.zoneId != null) {
            this._pendingBlackHoleThrowMap[command.zoneId] = this._pendingBlackHoleThrowMap[command.zoneId] || {};
        }
        let self = this;
        this.playOilShellThrow(cc.v2(command.from), cc.v2(command.to), {
            areaRadius: BLACK_HOLE_ZONE_RADIUS,
            arcHeight: 110,
            onLand: function () {
                if (command.zoneId == null) {
                    return;
                }
                let pendingThrow = self._pendingBlackHoleThrowMap[command.zoneId];
                if (pendingThrow && pendingThrow.zoneData) {
                    let zoneData = pendingThrow.zoneData;
                    delete self._pendingBlackHoleThrowMap[command.zoneId];
                    self._spawnMultiplayerBlackHoleZone(zoneData);
                }
                else{
                    delete self._pendingBlackHoleThrowMap[command.zoneId];
                }
            }
        });
    }

    onMultiplayerEnergySpawn(energyData) {
        if (!this._multiplayerMode || !energyData || energyData.id == null) {
            return;
        }
        if (this._multiplayerEnergyMap[energyData.id] && cc.isValid(this._multiplayerEnergyMap[energyData.id])) {
            return;
        }
        this.createEnergyAtForMultiplayer(energyData);
    }

    onMultiplayerEnergyRemove(energyId) {
        if (!this._multiplayerMode || energyId == null) {
            return;
        }
        let energy = this._multiplayerEnergyMap[energyId];
        delete this._multiplayerEnergyMap[energyId];
        if (!energy) {
            return;
        }
        for (let i = this._energys.length - 1; i >= 0; i--) {
            if (this._energys[i] === energy) {
                this._energys.splice(i, 1);
                break;
            }
        }
        if (cc.isValid(energy)) {
            energy.destroy();
        }
    }

    onMultiplayerPlayerUpgrade(payload) {
        // 升级表现统一由玩家状态同步触发，避免消息先后顺序导致丢表现或重复表现。
    }

    isMultiplayerMode() {
        return this._multiplayerMode;
    }

    getLocalPlayerId() {
        return this._localPlayerId;
    }

    registerMultiplayerBullet(bulletId, bulletNode) {
        if (!this._multiplayerMode || !bulletId || !bulletNode) {
            return;
        }
        this._multiplayerBullets[bulletId] = bulletNode;
    }

    unregisterMultiplayerBullet(bulletId, bulletNode = null) {
        if (!bulletId || !this._multiplayerBullets[bulletId]) {
            return;
        }
        if (!bulletNode || this._multiplayerBullets[bulletId] === bulletNode) {
            delete this._multiplayerBullets[bulletId];
        }
    }

    reportMultiplayerBulletHit(bulletId, targetPlayerId) {
        if (!this._multiplayerMode || !bulletId || targetPlayerId == null || targetPlayerId < 0) {
            return;
        }
        yyp.eventCenter.emit("multiplayer-hit", {
            id: bulletId,
            tgid: targetPlayerId,
            hp: -1,
            damage: -1,
        });
    }

    applyMultiplayerHit(hitData) {
        if (!this._multiplayerMode || !hitData || !hitData.id) {
            return;
        }

        let bullet = this._multiplayerBullets[hitData.id];
        if (bullet && cc.isValid(bullet) && bullet.script && bullet.script.doDestroy) {
            bullet.script.doDestroy();
        }
        this.unregisterMultiplayerBullet(hitData.id, bullet);

        let targetPlayer = this._multiplayerPlayers[hitData.tgid];
        if (!targetPlayer || !cc.isValid(targetPlayer) || !targetPlayer.script || !targetPlayer.script.applyMultiplayerHit) {
            return;
        }
        targetPlayer.script.applyMultiplayerHit(hitData.damage, hitData.hp);
    }

    _applyMultiplayerBulletBounce(command) {
        if (!this._multiplayerMode || !command || !command.bulletId) {
            return;
        }

        let bullet = this._multiplayerBullets[command.bulletId];
        if (!bullet || !cc.isValid(bullet) || !bullet.script || !bullet.script.applyMultiplayerBounce) {
            return;
        }

        bullet.script.applyMultiplayerBounce(command.bounceLeft);
    }

    _applyMultiplayerSpecialEventSpawn(eventData) {
        if (!this._multiplayerMode || !eventData || !eventData.id || !eventData.type) {
            return;
        }
        this._multiplayerSpecialEventMap[eventData.id] = eventData;
        if (eventData.type === "portal") {
            this._applyMultiplayerPortalEvent(eventData);
        }
        else if (eventData.type === "damageDouble") {
            this._applyMultiplayerDamageDoubleEvent(eventData);
        }
        else if (eventData.type === "speedDouble") {
            this._applyMultiplayerSpeedDoubleEvent(eventData);
        }
        else if (eventData.type === "blackHole") {
            this._applyMultiplayerBlackHoleEvent(eventData);
        }
        else if (eventData.type === "centrifugal") {
            this._applyMultiplayerCentrifugalEvent(eventData);
        }
        else if (eventData.type === "spreadBullet") {
            this._applyMultiplayerSpreadBulletEvent(eventData);
        }
    }

    _applyMultiplayerSpecialEventRemove(eventId, eventType = "") {
        if (!this._multiplayerMode) {
            return;
        }
        if (eventId != null && this._multiplayerSpecialEventMap[eventId]) {
            delete this._multiplayerSpecialEventMap[eventId];
        }
        this._rebuildMultiplayerSpecialEventViews();
    }

    _applyMultiplayerSafeZoneDamage(command) {
        if (!this._multiplayerMode || !command || command.playerId == null) {
            return;
        }
        let targetPlayer = this._multiplayerPlayers[command.playerId];
        if (!targetPlayer || !cc.isValid(targetPlayer) || !targetPlayer.script || !targetPlayer.script.applyMultiplayerHit) {
            return;
        }
        targetPlayer.script.applyMultiplayerHit(command.damage || 0, command.hp);
    }

    _applyMultiplayerPlayerFireState(command) {
        if (!this._multiplayerMode || !command || command.playerId == null) {
            return;
        }
        let targetPlayer = this._multiplayerPlayers[command.playerId];
        if (!targetPlayer || !cc.isValid(targetPlayer) || !targetPlayer.script || !targetPlayer.script.applyMultiplayerFireState) {
            return;
        }
        targetPlayer.script.applyMultiplayerFireState(command);
    }

    _applyMultiplayerSafeZoneState(safeZone) {
        if (!this._multiplayerMode) {
            return;
        }
        if (!safeZone) {
            this._multiplayerSafeZone = null;
            this._clearMultiplayerSafeZoneNode();
            return;
        }
        this._multiplayerSafeZone = {
            centerX: safeZone.centerX == null ? 0 : safeZone.centerX,
            centerY: safeZone.centerY == null ? 0 : safeZone.centerY,
            startRadius: safeZone.startRadius == null ? 0 : safeZone.startRadius,
            targetRadius: safeZone.targetRadius == null ? 0 : safeZone.targetRadius,
            radius: safeZone.radius == null ? 0 : safeZone.radius,
            startDelay: safeZone.startDelay == null ? 60 : safeZone.startDelay,
            shrinkDuration: safeZone.shrinkDuration == null ? 45 : safeZone.shrinkDuration,
            damageInterval: safeZone.damageInterval == null ? 1 : safeZone.damageInterval,
            damagePerTick: safeZone.damagePerTick == null ? 0 : safeZone.damagePerTick,
            damagePercent: safeZone.damagePercent == null ? 0 : safeZone.damagePercent,
            damageMode: safeZone.damageMode || "",
            poisonStartTime: safeZone.poisonStartTime == null ? 0 : safeZone.poisonStartTime,
            poisonRemaining: safeZone.poisonRemaining == null ? 0 : safeZone.poisonRemaining,
            poisonActive: !!safeZone.poisonActive,
            active: !!safeZone.active,
            shrinking: !!safeZone.shrinking,
            finished: !!safeZone.finished,
            progress: safeZone.progress == null ? 0 : safeZone.progress,
            waitRemaining: safeZone.waitRemaining == null ? 0 : safeZone.waitRemaining,
            shrinkRemaining: safeZone.shrinkRemaining == null ? 0 : safeZone.shrinkRemaining,
            phase: safeZone.phase || "",
        };
        this._renderMultiplayerSafeZone();
    }

    _clearMultiplayerSafeZoneNode() {
        if (this._multiplayerSafeZoneNode && cc.isValid(this._multiplayerSafeZoneNode)) {
            this._multiplayerSafeZoneNode.destroy();
        }
        this._multiplayerSafeZoneNode = null;
    }

    _renderMultiplayerSafeZone() {
        if (!this._multiplayerSafeZone) {
            this._clearMultiplayerSafeZoneNode();
            return;
        }
        let safeZone = this._multiplayerSafeZone;
        let radius = Math.max(0, safeZone.radius || 0);
        if (radius <= 0) {
            this._clearMultiplayerSafeZoneNode();
            return;
        }
        let center = this.clampMapInnerPosition(cc.v2(safeZone.centerX || 0, safeZone.centerY || 0), 0);
        this._clearMultiplayerSafeZoneNode();

        let root = new cc.Node("_safeZoneRoot");
        root.parent = this._fire._tmLayerObstacle;
        root.setPosition(cc.v3(center));
        root.zIndex = 5600;

        let outerGlow = new cc.Node("_safeZoneGlow");
        outerGlow.parent = root;
        let glowGraphics = outerGlow.addComponent(cc.Graphics);
        glowGraphics.fillColor = cc.color(90, 170, 255, safeZone.active ? 18 : 8);
        glowGraphics.circle(0, 0, radius + 18);
        glowGraphics.fill();

        let ring = new cc.Node("_safeZoneRing");
        ring.parent = root;
        let ringGraphics = ring.addComponent(cc.Graphics);
        ringGraphics.lineWidth = 8;
        ringGraphics.strokeColor = cc.color(120, 210, 255, 235);
        ringGraphics.circle(0, 0, radius);
        ringGraphics.stroke();
        ringGraphics.lineWidth = 2;
        ringGraphics.strokeColor = cc.color(255, 255, 255, safeZone.active ? 170 : 90);
        ringGraphics.circle(0, 0, Math.max(6, radius - 8));
        ringGraphics.stroke();

        let labelNode = new cc.Node("_safeZoneLabel");
        labelNode.parent = root;
        labelNode.setPosition(0, radius + 42);
        let label = labelNode.addComponent(cc.Label);
        let poisonRemaining = Math.max(0, Math.ceil(safeZone.poisonRemaining || 0));
        if (safeZone.poisonActive) {
            label.string = "毒区爆发";
        }
        else if (poisonRemaining > 0) {
            label.string = "中心安全区 " + poisonRemaining + "s";
        }
        else {
            label.string = "中心安全区";
        }
        label.fontSize = 22;
        label.lineHeight = 24;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        labelNode.color = cc.color(220, 245, 255, 255);

        this._multiplayerSafeZoneNode = root;
    }

    _applyMultiplayerPortalEvent(eventData) {
        if (!eventData.entryPos || !eventData.exitPos) {
            return;
        }
        this._portalTestMode = true;
        let entryPos = this.clampMapInnerPosition(cc.v2(eventData.entryPos), 90);
        let exitPos = this.clampMapInnerPosition(cc.v2(eventData.exitPos), 90);
        this._createPortalGate("_portalGateA", entryPos, cc.color(90, 215, 255, 255), "A");
        this._createPortalGate("_portalGateB", exitPos, cc.color(255, 120, 220, 255), "B");
        this._createPortalLinkFx(entryPos, exitPos);
        this._createPortalHintLabel(entryPos);
        this._portalPairs.push({
            id: "portalA",
            pos: entryPos,
            radius: eventData.radius == null ? 44 : eventData.radius,
            exitId: "portalB",
            exitPos: exitPos,
            eventId: eventData.id
        });
        this._portalPairs.push({
            id: "portalB",
            pos: exitPos,
            radius: eventData.radius == null ? 44 : eventData.radius,
            exitId: "portalA",
            exitPos: entryPos,
            eventId: eventData.id
        });
    }

    _applyMultiplayerDamageDoubleEvent(eventData) {
        if (!eventData.center) {
            return;
        }
        this._damageDoubleTestMode = true;
        let center = this.clampMapInnerPosition(cc.v2(eventData.center), 100);
        let radius = eventData.radius == null ? 60 : eventData.radius;
        this._createDamageDoubleAreaNode(center, radius, cc.color(255, 40, 40, 255));
        let areaData = {
            center: center,
            radius: radius,
            damageMultiplier: eventData.damageMultiplier == null ? 2 : eventData.damageMultiplier,
            scaleMultiplier: eventData.scaleMultiplier == null ? 1.5 : eventData.scaleMultiplier,
            eventId: eventData.id,
        };
        this._damageDoubleAreaData = areaData;
        this._multiplayerDamageDoubleAreas.push(areaData);
    }

    _applyMultiplayerSpeedDoubleEvent(eventData) {
        if (!eventData.center) {
            return;
        }
        this._speedDoubleTestMode = true;
        let center = this.clampMapInnerPosition(cc.v2(eventData.center), 100);
        let radius = eventData.radius == null ? 60 : eventData.radius;
        this._createSpeedDoubleAreaNode(center, radius, cc.color(30, 130, 255, 255));
        let areaData = {
            center: center,
            radius: radius,
            speedMultiplier: eventData.speedMultiplier == null ? 3 : eventData.speedMultiplier,
            eventId: eventData.id,
        };
        this._speedDoubleAreaData = areaData;
        this._multiplayerSpeedDoubleAreas.push(areaData);
    }

    _applyMultiplayerBlackHoleEvent(eventData) {
        if (!eventData.center) {
            return;
        }
        this._blackHoleTestMode = true;
        let center = this.clampMapInnerPosition(cc.v2(eventData.center), 120);
        let radius = eventData.radius == null ? 100 : eventData.radius;
        let destroyRadius = eventData.destroyRadius == null ? 14 : eventData.destroyRadius;
        let node = this._createBlackHoleAreaNode(center, radius, destroyRadius, cc.color(80, 30, 160, 200));
        let areaData = {
            node: node,
            center: center,
            radius: radius,
            destroyRadius: destroyRadius,
            gravityStrength: eventData.gravityStrength == null ? 160 : eventData.gravityStrength,
            eventId: eventData.id,
        };
        this._blackHoleAreaData = areaData;
        this._multiplayerBlackHoleAreas.push(areaData);
    }

    _applyMultiplayerCentrifugalEvent(eventData) {
        if (!eventData.center) {
            return;
        }
        this._centrifugalRingTestMode = true;
        let center = this.clampMapInnerPosition(cc.v2(eventData.center), 120);
        let radius = eventData.radius == null ? 86 : eventData.radius;
        this._createCentrifugalRingNode(center, radius, cc.color(255, 170, 96, 255));
        this._centrifugalRingData = {
            center: center,
            radius: radius,
            triggerRadius: eventData.triggerRadius == null ? radius - 10 : eventData.triggerRadius,
            orbitRadius: eventData.orbitRadius == null ? radius + 10 : eventData.orbitRadius,
            rotateAngle: eventData.rotateAngle == null ? Math.PI * 0.5 : eventData.rotateAngle,
            angularSpeed: eventData.angularSpeed == null ? Math.PI * 4.2 : eventData.angularSpeed,
            speedBoost: eventData.speedBoost == null ? 1.85 : eventData.speedBoost,
            damageBoost: eventData.damageBoost == null ? 1.7 : eventData.damageBoost,
            directionSign: eventData.directionSign == null ? -1 : eventData.directionSign,
            color: cc.color(255, 165, 90, 255),
            eventId: eventData.id,
        };
    }

    _applyMultiplayerSpreadBulletEvent(eventData) {
        if (!eventData.center) {
            return;
        }
        this._spreadBulletTestMode = true;
        let center = this.clampMapInnerPosition(cc.v2(eventData.center), 100);
        let radius = eventData.radius == null ? 60 : eventData.radius;
        this._createSpreadBulletAreaNode(center, radius, cc.color(30, 230, 100, 255));
        this._spreadBulletAreaData = {
            center: center,
            radius: radius,
            spreadCount: eventData.spreadCount == null ? 2 : eventData.spreadCount,
            spreadAngle: eventData.spreadAngle == null ? 20 : eventData.spreadAngle,
            _splitTriggered: false,
            eventId: eventData.id,
        };
    }

    _rebuildMultiplayerSpecialEventViews() {
        if (!this._multiplayerMode) {
            return;
        }
        this._portalTestMode = false;
        this._centrifugalRingTestMode = false;
        this._damageDoubleTestMode = false;
        this._speedDoubleTestMode = false;
        this._spreadBulletTestMode = false;
        this._blackHoleTestMode = false;
        this._clearPortalTestNodes();
        this._clearCentrifugalRingTestNodes();
        this._clearDamageDoubleTestNodes();
        this._clearSpeedDoubleTestNodes();
        this._clearSpreadBulletTestNodes();
        let zoneIds = Object.keys(this._multiplayerBlackHoleZoneMap || {});
        for (let i = 0; i < zoneIds.length; i++) {
            let zoneId = zoneIds[i];
            let node = this._multiplayerBlackHoleZoneMap[zoneId];
            if (node && cc.isValid(node)) {
                node.destroy();
            }
        }
        this._multiplayerBlackHoleZoneMap = {};
        this._clearBlackHoleTestNodes();
        let eventIds = Object.keys(this._multiplayerSpecialEventMap || {});
        for (let i = 0; i < eventIds.length; i++) {
            let eventData = this._multiplayerSpecialEventMap[eventIds[i]];
            if (!eventData) {
                continue;
            }
            if (eventData.type === "portal") {
                this._applyMultiplayerPortalEvent(eventData);
            }
            else if (eventData.type === "damageDouble") {
                this._applyMultiplayerDamageDoubleEvent(eventData);
            }
            else if (eventData.type === "speedDouble") {
                this._applyMultiplayerSpeedDoubleEvent(eventData);
            }
            else if (eventData.type === "blackHole") {
                this._applyMultiplayerBlackHoleEvent(eventData);
            }
            else if (eventData.type === "centrifugal") {
                this._applyMultiplayerCentrifugalEvent(eventData);
            }
            else if (eventData.type === "spreadBullet") {
                this._applyMultiplayerSpreadBulletEvent(eventData);
            }
        }
    }

    _centerOnLocalPlayer() {
        if (!this._multiplayerMode) return;
        let player = this._multiplayerPlayers[this._localPlayerId];
        if (!player || !cc.isValid(player)) return;
        let pos = player.position;
        if (!pos) return;
        let will = this._correctMapPosition(cc.v2(-pos.x, -pos.y));
        this.node.setPosition(will);
    }

    getMapBounds() {
        if (!this._tmSize) {
            return null;
        }
        return {
            halfWidth: Math.max(0, this._tmSize.width / 2),
            halfHeight: Math.max(0, this._tmSize.height / 2),
        };
    }

    getMultiplayerSafeZoneState() {
        if (!this._multiplayerMode || !this._multiplayerSafeZone) {
            return null;
        }
        return {
            centerX: this._multiplayerSafeZone.centerX || 0,
            centerY: this._multiplayerSafeZone.centerY || 0,
            startRadius: this._multiplayerSafeZone.startRadius || 0,
            targetRadius: this._multiplayerSafeZone.targetRadius || 0,
            radius: this._multiplayerSafeZone.radius || 0,
            startDelay: this._multiplayerSafeZone.startDelay || 0,
            shrinkDuration: this._multiplayerSafeZone.shrinkDuration || 0,
            damageInterval: this._multiplayerSafeZone.damageInterval || 0,
            damagePerTick: this._multiplayerSafeZone.damagePerTick || 0,
            active: !!this._multiplayerSafeZone.active,
            shrinking: !!this._multiplayerSafeZone.shrinking,
            finished: !!this._multiplayerSafeZone.finished,
            progress: this._multiplayerSafeZone.progress || 0,
            waitRemaining: this._multiplayerSafeZone.waitRemaining || 0,
            shrinkRemaining: this._multiplayerSafeZone.shrinkRemaining || 0,
        };
    }

    _clearAllTestNodes() {
        this._clearPortalTestNodes();
        this._clearCentrifugalRingTestNodes();
        this._clearDamageDoubleTestNodes();
        this._clearSpeedDoubleTestNodes();
        this._clearSpreadBulletTestNodes();
        this._clearBounceObstacleTestNodes();
        this._clearBlackHoleTestNodes();
    }

    isMap(){
        return true;
    }

    //复活
    revive(){
        this.createPlayer();
        this._player.position = this._playerLastPos;
        for (let i = 0; i < this._enemys.length; i++) {
            let enemy = this._enemys[i];
            enemy.script.setTarget(this._player);
        }
    }

    pause(){
        this._pause = true;
    }

    resume(){
        this._pause = false;
    }
}
