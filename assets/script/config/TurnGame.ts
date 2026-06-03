export type TurnCamp = "A" | "B";
export type TurnPhase = "init" | "build" | "zone" | "attack" | "waitBullet" | "upgrade" | "finish";
export type TurnUpgradeId = "bullet_bounce" | "extra_shot" | "damage_up" | "crystal_hp_up" | "unlock_black_hole" | "cover_resource_up";
export type TurnAssistZoneType = "black_hole";
export type TurnObstacleResourceType = "normal" | "mirror" | "exp" | "energy";
export type TurnMirrorDirection = "bl" | "br" | "tl" | "tr";

export interface TurnUpgradeConfig {
    id: TurnUpgradeId;
    name: string;
    desc: string;
}

export interface TurnObstacleSlotConfig {
    type: TurnObstacleResourceType;
    name: string;
}

export interface TurnGameConfig {
    crystalHp: number;
    buildSeconds: number;
    zoneSeconds: number;
    attackSeconds: number;
    waitBulletSeconds: number;
    upgradeSeconds: number;
    attackRounds: number;
    initialObstacles: number;
    obstacleGainPerRound: number;
    obstacleMaxPerRound: number;
    buildSecondsPerObstacle: number;
    baseExpPerRound: number;
    obstacleHitExp: number;
    crystalHitExp: number;
    levelUpExp: number;
    bulletDamage: number;
    bulletSpeed: number;
    bulletRadius: number;
    obstacleRadius: number;
    assistZoneRadius: number;
    blackHoleStrength: number;
    zoneInventoryOnUnlock: number;
    obstacleBaseHp: number;
    obstacleMaxHp: number;
    obstacleSlotMaxResources: number;
    expWallDestroyExp: number;
    energyWallRoundHeal: number;
    obstacleSlots: TurnObstacleSlotConfig[];
    tankMoveSpeed: number;
    mapWidth: number;
    mapHeight: number;
    roadY: {
        A: number;
        B: number;
    };
    crystalY: {
        A: number;
        B: number;
    };
    buildArea: {
        A: cc.Rect;
        B: cc.Rect;
    };
    upgradePool: TurnUpgradeConfig[];
}

export const TURN_GAME_CONFIG: TurnGameConfig = {
    crystalHp: 100,
    buildSeconds: 6,
    zoneSeconds: 5,
    attackSeconds: 3,
    waitBulletSeconds: 0,
    upgradeSeconds: 2,
    attackRounds: 3,
    initialObstacles: 2,
    obstacleGainPerRound: 1,
    obstacleMaxPerRound: 5,
    buildSecondsPerObstacle: 3,
    baseExpPerRound: 10,
    obstacleHitExp: 8,
    crystalHitExp: 25,
    levelUpExp: 60,
    bulletDamage: 20,
    bulletSpeed: 620,
    bulletRadius: 10,
    obstacleRadius: 26,
    assistZoneRadius: 74,
    blackHoleStrength: 2.7,
    zoneInventoryOnUnlock: 1,
    obstacleBaseHp: 10,
    obstacleMaxHp: 50,
    obstacleSlotMaxResources: 4,
    expWallDestroyExp: 50,
    energyWallRoundHeal: 10,
    obstacleSlots: [
        { type: "normal", name: "普通方块" },
        { type: "mirror", name: "镜面墙" },
        { type: "exp", name: "经验墙" },
        { type: "energy", name: "能量墙" },
    ],
    tankMoveSpeed: 360,
    mapWidth: 640,
    mapHeight: 960,
    roadY: {
        A: -330,
        B: 330,
    },
    crystalY: {
        A: -420,
        B: 420,
    },
    buildArea: {
        A: cc.rect(-280, -260, 560, 220),
        B: cc.rect(-280, 40, 560, 220),
    },
    upgradePool: [
        { id: "cover_resource_up", name: "基础资源 +1", desc: "随机强化一个基础资源槽" },
        { id: "bullet_bounce", name: "反弹 +1", desc: "子弹可以额外反弹一次" },
        // { id: "extra_shot", name: "多发 +1", desc: "每次行动可多开一炮" },
        { id: "damage_up", name: "伤害 +10", desc: "提高命中水晶时的伤害" },
        { id: "crystal_hp_up", name: "水晶 HP +20", desc: "提高己方水晶上限和当前 HP" },
        { id: "unlock_black_hole", name: "解锁黑洞区", desc: "后续辅助期可以放置黑洞区" },
    ],
};

export function getRoundObstacleGain(roundIndex: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    let gain = Math.max(1, Number(cfg.obstacleGainPerRound) || 1);
    return Math.min(gain, cfg.obstacleMaxPerRound);
}

export function getRoundBuildSeconds(roundIndex: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    return getRoundObstacleGain(roundIndex, cfg) * cfg.buildSecondsPerObstacle;
}

export function getBuildSecondsByObstacleTotal(totalResources: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    let total = Math.max(0, Math.round(Number(totalResources) || 0));
    return total * cfg.buildSecondsPerObstacle;
}

if (typeof yyp !== "undefined") {
    yyp.config = yyp.config || {};
    yyp.config.TurnGame = TURN_GAME_CONFIG;
}
