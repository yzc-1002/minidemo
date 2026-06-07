export type TurnCamp = "A" | "B";
export type TurnPhase = "init" | "build" | "attack" | "waitBullet" | "settle" | "upgrade" | "finish";
export type TurnUpgradeId = "bullet_bounce" | "extra_shot" | "damage_up" | "crystal_hp_up" | "cover_resource_up";
export type TurnAssistZoneType = "black_hole";
export type TurnObstacleResourceType = "normal" | "mirror" | "exp" | "energy" | "blood";
export type TurnMirrorDirection = "bl" | "br" | "tl" | "tr";

export interface TurnUpgradeConfig {
    id: TurnUpgradeId;
    name: string;
    desc: string;
    maxStacks: number | null;
}

export interface TurnObstacleSlotConfig {
    type: TurnObstacleResourceType;
    name: string;
}

export interface TurnObstacleHpRuleConfig {
    baseHp: number;
    maxHp: number;
}

export interface TurnRoundResourceSlot {
    slotId: string;
    type: TurnObstacleResourceType;
    count: number;
    layout: { x: number; y: number }[];
    shapeKey: string;
    mirrorDir: TurnMirrorDirection | "";
    placed: boolean;
    placedObstacleId: string;
}

export interface TurnGameConfig {
    crystalHp: number;
    buildSeconds: number;
    attackSeconds: number;
    waitBulletSeconds: number;
    settleSeconds: number;
    upgradeSeconds: number;
    attackRounds: number;
    initialRoundResourceTotal: number;
    roundResourceGrowth: number;
    maxRoundResourceTotal: number;
    slotCountPerRound: number;
    slotMinResource: number;
    slotMaxResource: number;
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
    obstacleBaseHp: number;
    obstacleMaxHp: number;
    obstacleHpRules: {
        normal: TurnObstacleHpRuleConfig;
    };
    obstacleSlotMaxResources: number;
    expWallDestroyExp: number;
    energyWallRoundHeal: number;
    bloodBlockHealPerStack: number;
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
    buildSeconds: 15,
    attackSeconds: 8,
    waitBulletSeconds: 0,
    settleSeconds: 2,
    upgradeSeconds: 6,
    attackRounds: 1,
    initialRoundResourceTotal: 3,
    roundResourceGrowth: 1,
    maxRoundResourceTotal: 12,
    slotCountPerRound: 3,
    slotMinResource: 1,
    slotMaxResource: 4,
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
    obstacleBaseHp: 10,
    obstacleMaxHp: 50,
    obstacleHpRules: {
        normal: {
            baseHp: 10,
            maxHp: 50,
        },
    },
    obstacleSlotMaxResources: 4,
    expWallDestroyExp: 50,
    energyWallRoundHeal: 10,
    bloodBlockHealPerStack: 1,
    obstacleSlots: [
        { type: "normal", name: "普通方块" },
        { type: "mirror", name: "镜面墙" },
        { type: "exp", name: "经验墙" },
        { type: "energy", name: "能量墙" },
        { type: "blood", name: "滴血块" },
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
        A: cc.rect(-288, -480, 576, 224),
        B: cc.rect(-288, 256, 576, 224),
    },
    upgradePool: [
        { id: "cover_resource_up", name: "回合资源 +1", desc: "后续每回合可生成的总资源数 +1", maxStacks: 9 },
        { id: "bullet_bounce", name: "反弹 +1", desc: "子弹可以额外反弹一次", maxStacks: 5 },
        { id: "extra_shot", name: "连发 +1", desc: "一次攻击动作内额外发射 1 发子弹", maxStacks: 3 },
        { id: "damage_up", name: "伤害 +10", desc: "提高命中时的子弹伤害", maxStacks: null },
        { id: "crystal_hp_up", name: "水晶 HP +20", desc: "提高己方水晶上限和当前 HP", maxStacks: null },
    ],
};

export function getRoundObstacleGain(roundIndex: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    return getRoundResourceTotal(roundIndex, 0, cfg) - getRoundResourceTotal(Math.max(1, roundIndex - 1), 0, cfg);
}

export function getRoundBuildSeconds(roundIndex: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    return cfg.buildSeconds;
}

export function getBuildSecondsByObstacleTotal(totalResources: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    return cfg.buildSeconds;
}

export function getRoundResourceTotal(roundIndex: number, extraBonus = 0, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    let round = Math.max(1, Math.floor(Number(roundIndex) || 1));
    let total = cfg.initialRoundResourceTotal + (round - 1) * cfg.roundResourceGrowth + Math.max(0, Math.floor(Number(extraBonus) || 0));
    return Math.max(cfg.slotCountPerRound, Math.min(cfg.maxRoundResourceTotal, total));
}

if (typeof yyp !== "undefined") {
    yyp.config = yyp.config || {};
    yyp.config.TurnGame = TURN_GAME_CONFIG;
}
