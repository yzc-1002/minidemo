export type TurnCamp = "A" | "B";
export type TurnPhase = "init" | "build" | "attack" | "waitBullet" | "settle" | "upgrade" | "finish";
export type TurnUpgradeId = "bullet_bounce" | "extra_shot" | "damage_up" | "crystal_hp_up" | "cover_resource_up";
export type TurnAssistZoneType = "black_hole";
export type TurnObstacleResourceType = "normal" | "mirror" | "exp" | "energy" | "bleed" | "bullet" | "attack";
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

export interface TurnSettlementResourceRuleConfig {
    expPerBlock: number;
    baseMultiplier: number;
}

export interface TurnSettlementHealRuleConfig {
    healPerBlock: number;
    baseMultiplier: number;
    bloodBlockPerStack: number;
}

export interface TurnBulletSynergyRuleConfig {
    blocksPerExtraShot: number;
}

export interface TurnAttackSynergyTierConfig {
    minCount: number;
    multiplier: number;
}

export type TurnBondResourceType = "bullet" | "attack" | "exp" | "energy" | "bleed";

export interface TurnBondTierConfig {
    minCount: number;
    multiplier: number;
}

export interface TurnBondBulletRuleConfig {
    blocksPerExtraShot: number;
}

export interface TurnBondValueRuleConfig {
    amountPerBlock: number;
    tiers: TurnBondTierConfig[];
}

export interface TurnBondRulesConfig {
    bullet: TurnBondBulletRuleConfig;
    attack: TurnBondValueRuleConfig;
    exp: TurnBondValueRuleConfig;
    energy: TurnBondValueRuleConfig;
    bleed: TurnBondValueRuleConfig;
}

export interface TurnBondCountMap {
    bullet: number;
    attack: number;
    exp: number;
    energy: number;
    bleed: number;
}

export interface TurnBondUpgradeSnapshot {
    extraShots: number;
    damageBonus: number;
    bulletBounce: number;
}

export interface TurnAttackBondSnapshot {
    bulletBlockCount: number;
    attackBlockCount: number;
    attackMultiplier: number;
    totalShots: number;
    extraShotsFromUpgrade: number;
    extraShotsFromBulletBlock: number;
    bonusDamageFromUpgrade: number;
    bonusDamageFromAttackBlock: number;
    bulletDamage: number;
    bulletBounce: number;
    shotsLeft: number;
}

export interface TurnSettlementBondSnapshot {
    expBlockCount: number;
    expMultiplier: number;
    expGain: number;
    energyBlockCount: number;
    energyMultiplier: number;
    totalHeal: number;
    blockedHealByEnemy: number;
    finalHeal: number;
    bleedBlockCount: number;
    bleedMultiplier: number;
    blockedHeal: number;
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
        mirror: TurnObstacleHpRuleConfig;
        exp: TurnObstacleHpRuleConfig;
        energy: TurnObstacleHpRuleConfig;
        bleed: TurnObstacleHpRuleConfig;
        bullet: TurnObstacleHpRuleConfig;
        attack: TurnObstacleHpRuleConfig;
    };
    settlementResourceRules: {
        exp: TurnSettlementResourceRuleConfig;
        energy: TurnSettlementHealRuleConfig;
        bleed: {
            blockPerBlock: number;
            baseMultiplier: number;
        };
    };
    bulletSynergy: TurnBulletSynergyRuleConfig;
    attackSynergy: {
        damagePerBlock: number;
        tiers: TurnAttackSynergyTierConfig[];
    };
    bondRules: TurnBondRulesConfig;
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
        mirror: {
            baseHp: 10,
            maxHp: 10,
        },
        exp: {
            baseHp: 10,
            maxHp: 30,
        },
        energy: {
            baseHp: 10,
            maxHp: 30,
        },
        bleed: {
            baseHp: 10,
            maxHp: 30,
        },
        bullet: {
            baseHp: 10,
            maxHp: 30,
        },
        attack: {
            baseHp: 10,
            maxHp: 30,
        },
    },
    settlementResourceRules: {
        exp: {
            expPerBlock: 5,
            baseMultiplier: 1,
        },
        energy: {
            healPerBlock: 2,
            baseMultiplier: 1,
            bloodBlockPerStack: 1,
        },
        bleed: {
            blockPerBlock: 1,
            baseMultiplier: 1,
        },
    },
    bulletSynergy: {
        blocksPerExtraShot: 4,
    },
    attackSynergy: {
        damagePerBlock: 1,
        tiers: [
            { minCount: 12, multiplier: 6 },
            { minCount: 8, multiplier: 4 },
            { minCount: 4, multiplier: 2 },
            { minCount: 0, multiplier: 1 },
        ],
    },
    bondRules: {
        bullet: {
            blocksPerExtraShot: 4,
        },
        attack: {
            amountPerBlock: 1,
            tiers: [
                { minCount: 12, multiplier: 6 },
                { minCount: 8, multiplier: 4 },
                { minCount: 4, multiplier: 2 },
                { minCount: 1, multiplier: 1 },
            ],
        },
        exp: {
            amountPerBlock: 5,
            tiers: [
                { minCount: 12, multiplier: 6 },
                { minCount: 8, multiplier: 4 },
                { minCount: 4, multiplier: 2 },
                { minCount: 1, multiplier: 1 },
            ],
        },
        energy: {
            amountPerBlock: 2,
            tiers: [
                { minCount: 12, multiplier: 6 },
                { minCount: 8, multiplier: 4 },
                { minCount: 4, multiplier: 2 },
                { minCount: 1, multiplier: 1 },
            ],
        },
        bleed: {
            amountPerBlock: 1,
            tiers: [
                { minCount: 12, multiplier: 6 },
                { minCount: 8, multiplier: 4 },
                { minCount: 4, multiplier: 2 },
                { minCount: 1, multiplier: 1 },
            ],
        },
    },
    obstacleSlotMaxResources: 4,
    expWallDestroyExp: 50,
    energyWallRoundHeal: 10,
    bloodBlockHealPerStack: 1,
    obstacleSlots: [
        { type: "normal", name: "普通方块" },
        { type: "mirror", name: "反弹块" },
        { type: "exp", name: "经验墙" },
        { type: "energy", name: "能量墙" },
        { type: "bleed", name: "滴血块" },
        { type: "bullet", name: "子弹块" },
        { type: "attack", name: "攻击块" },
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

export function createTurnBondCountMap(source?: Partial<TurnBondCountMap>): TurnBondCountMap {
    return {
        bullet: Math.max(0, Math.floor(Number(source && source.bullet) || 0)),
        attack: Math.max(0, Math.floor(Number(source && source.attack) || 0)),
        exp: Math.max(0, Math.floor(Number(source && source.exp) || 0)),
        energy: Math.max(0, Math.floor(Number(source && source.energy) || 0)),
        bleed: Math.max(0, Math.floor(Number(source && source.bleed) || 0)),
    };
}

export function getTurnBondCount(counts: Partial<TurnBondCountMap> | null | undefined, type: TurnBondResourceType): number {
    return Math.max(0, Math.floor(Number(counts && counts[type]) || 0));
}

export function getTurnBondMultiplier(type: Exclude<TurnBondResourceType, "bullet">, count: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    let safeCount = Math.max(0, Math.floor(Number(count) || 0));
    if (safeCount <= 0) {
        return 0;
    }
    let rule = cfg.bondRules && cfg.bondRules[type];
    let tiers = rule && Array.isArray(rule.tiers) ? rule.tiers : [];
    for (let i = 0; i < tiers.length; i++) {
        if (safeCount >= Math.max(0, Number(tiers[i].minCount) || 0)) {
            return Math.max(1, Number(tiers[i].multiplier) || 1);
        }
    }
    return 1;
}

export function getTurnBulletExtraShots(count: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    let safeCount = Math.max(0, Math.floor(Number(count) || 0));
    let blocksPerExtraShot = Math.max(1, Number(cfg.bondRules && cfg.bondRules.bullet && cfg.bondRules.bullet.blocksPerExtraShot) || 4);
    return Math.floor(safeCount / blocksPerExtraShot);
}

export function getTurnBondValue(type: Exclude<TurnBondResourceType, "bullet">, count: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    let safeCount = Math.max(0, Math.floor(Number(count) || 0));
    if (safeCount <= 0) {
        return 0;
    }
    let rule = cfg.bondRules && cfg.bondRules[type];
    let amountPerBlock = Math.max(0, Number(rule && rule.amountPerBlock) || 0);
    let multiplier = getTurnBondMultiplier(type, safeCount, cfg);
    return safeCount * amountPerBlock * multiplier;
}

export function buildTurnAttackBondSnapshot(counts: Partial<TurnBondCountMap>, upgrades?: Partial<TurnBondUpgradeSnapshot>, config?: TurnGameConfig): TurnAttackBondSnapshot {
    let cfg = config || TURN_GAME_CONFIG;
    let safeCounts = createTurnBondCountMap(counts);
    let extraShotsFromUpgrade = Math.max(0, Math.floor(Number(upgrades && upgrades.extraShots) || 0));
    let bonusDamageFromUpgrade = Math.max(0, Math.floor(Number(upgrades && upgrades.damageBonus) || 0));
    let bulletBounce = Math.max(0, Math.floor(Number(upgrades && upgrades.bulletBounce) || 0));
    let extraShotsFromBulletBlock = getTurnBulletExtraShots(safeCounts.bullet, cfg);
    let attackMultiplier = getTurnBondMultiplier("attack", safeCounts.attack, cfg);
    let bonusDamageFromAttackBlock = getTurnBondValue("attack", safeCounts.attack, cfg);
    let totalShots = Math.max(1, 1 + extraShotsFromUpgrade + extraShotsFromBulletBlock);
    return {
        bulletBlockCount: safeCounts.bullet,
        attackBlockCount: safeCounts.attack,
        attackMultiplier: attackMultiplier,
        totalShots: totalShots,
        extraShotsFromUpgrade: extraShotsFromUpgrade,
        extraShotsFromBulletBlock: extraShotsFromBulletBlock,
        bonusDamageFromUpgrade: bonusDamageFromUpgrade,
        bonusDamageFromAttackBlock: bonusDamageFromAttackBlock,
        bulletDamage: Math.max(1, Number(cfg.bulletDamage) || 1) + bonusDamageFromUpgrade + bonusDamageFromAttackBlock,
        bulletBounce: bulletBounce,
        shotsLeft: totalShots,
    };
}

export function buildTurnSettlementBondSnapshot(
    ownCounts: Partial<TurnBondCountMap>,
    enemyCounts?: Partial<TurnBondCountMap>,
    config?: TurnGameConfig,
): TurnSettlementBondSnapshot {
    let cfg = config || TURN_GAME_CONFIG;
    let selfCounts = createTurnBondCountMap(ownCounts);
    let foeCounts = createTurnBondCountMap(enemyCounts);
    let expMultiplier = getTurnBondMultiplier("exp", selfCounts.exp, cfg);
    let energyMultiplier = getTurnBondMultiplier("energy", selfCounts.energy, cfg);
    let bleedMultiplier = getTurnBondMultiplier("bleed", selfCounts.bleed, cfg);
    let expGain = getTurnBondValue("exp", selfCounts.exp, cfg);
    let totalHeal = getTurnBondValue("energy", selfCounts.energy, cfg);
    let blockedHealByEnemy = getTurnBondValue("bleed", foeCounts.bleed, cfg);
    return {
        expBlockCount: selfCounts.exp,
        expMultiplier: expMultiplier,
        expGain: expGain,
        energyBlockCount: selfCounts.energy,
        energyMultiplier: energyMultiplier,
        totalHeal: totalHeal,
        blockedHealByEnemy: blockedHealByEnemy,
        finalHeal: Math.max(0, totalHeal - blockedHealByEnemy),
        bleedBlockCount: selfCounts.bleed,
        bleedMultiplier: bleedMultiplier,
        blockedHeal: getTurnBondValue("bleed", selfCounts.bleed, cfg),
    };
}

if (typeof yyp !== "undefined") {
    yyp.config = yyp.config || {};
    yyp.config.TurnGame = TURN_GAME_CONFIG;
}
