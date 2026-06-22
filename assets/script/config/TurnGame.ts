export type TurnCamp = "A" | "B";
export type TurnPhase = "init" | "build" | "attack" | "waitBullet" | "settle" | "upgrade" | "finish";
export type TurnUpgradeId =
    | "bullet_bounce_add"
    | "first_bounce_damage_x2"
    | "round_resource_add"
    | "normal_hp_add"
    | "exp_hp_add"
    | "energy_hp_add"
    | "bullet_hp_add"
    | "bleed_hp_add"
    | "spread_extra_split_add"
    | "damage_boost_temp_attack_add"
    | "black_hole_strength_pct"
    | "missile_explosion_radius_add"
    | "missile_damage_add"
    | "missile_main_cannon_chance_add"
    | "coin_drop_pct"
    | "exp_drop_pct";
export type TurnAssistZoneType = "black_hole" | "spread" | "damage_boost";
export type TurnObstacleResourceType = "normal" | "mirror" | "exp" | "energy" | "bleed" | "bullet" | "attack" | "missile_silo" | "coin";
export type TurnMirrorDirection = "bl" | "br" | "tl" | "tr";
export type TurnUpgradeStackMode = "add" | "multiply";
export type TurnUpgradeEffectType =
    | "bullet_bounce"
    | "first_bounce_damage"
    | "round_resource"
    | "resource_hp"
    | "spread_extra_split"
    | "damage_boost_temp_attack"
    | "black_hole_strength"
    | "missile_explosion_radius"
    | "missile_damage"
    | "missile_main_cannon_chance"
    | "coin_drop"
    | "exp_drop";

export interface TurnUpgradeEffectConfig {
    type: TurnUpgradeEffectType;
    stackMode: TurnUpgradeStackMode;
    value: number;
    targetResourceType?: TurnObstacleResourceType;
    maxValue?: number;
}

export interface TurnAssistZoneTypeConfig {
    name: string;
    minRadius: number;
    maxRadius: number;
    blackHoleStrength?: number;
    blackHoleCurvePower?: number;
    blackHoleMaxOffsetPerTick?: number;
    damageBoostMaxMultiplier?: number;
    spreadSplitCount?: number;
    spreadSplitStepAngle?: number;
}

export interface TurnAssistZoneSpawnRuleConfig {
    round1: number;
    round2: number;
    round3Plus: number;
    maxSimultaneous: number;
}

export interface TurnAssistZoneConfig {
    spawnRule: TurnAssistZoneSpawnRuleConfig;
    enabledTypes: TurnAssistZoneType[];
    maxPlacementRetries: number;
    allowOverlap: boolean;
    types: {
        black_hole: TurnAssistZoneTypeConfig;
        spread: TurnAssistZoneTypeConfig;
        damage_boost: TurnAssistZoneTypeConfig;
    };
}

export interface TurnUpgradeConfig {
    id: TurnUpgradeId;
    name: string;
    desc: string;
    maxStacks: number | null;
    effect: TurnUpgradeEffectConfig;
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

export type TurnBondResourceType = "bullet" | "attack" | "exp" | "energy" | "bleed" | "coin" | "missile_silo" | "mirror";

export interface TurnBondTierConfig {
    minCount?: number;
    multiplier: number;
}

export interface TurnBondBulletRuleConfig {
    blocksPerExtraShot: number;
}

export interface TurnBondValueRuleConfig {
    amountPerBlock: number;
    tiers: TurnBondTierConfig[];
    bountyMultipliers?: number[];
    hitTankChanceBonuses?: number[];
    damageReductionRatios?: number[];
}

export interface TurnBondRulesConfig {
    maxLevel: number;
    valueThresholds: number[];
    bullet: TurnBondBulletRuleConfig;
    missile_silo: TurnBondValueRuleConfig;
    mirror: TurnBondValueRuleConfig;
    attack: TurnBondValueRuleConfig;
    exp: TurnBondValueRuleConfig;
    energy: TurnBondValueRuleConfig;
    bleed: TurnBondValueRuleConfig;
    coin: TurnBondValueRuleConfig;
}

export interface TurnBondCountMap {
    bullet: number;
    attack: number;
    exp: number;
    energy: number;
    bleed: number;
    coin: number;
    missile_silo: number;
    mirror: number;
}

export interface TurnCoinEconomyConfig {
    initialCoins: number;
    baseRoundReward: number;
    slotCost: number;
    refreshCost: number;
    destroyedEnemyResourceCoinReward: number;
    enemyTankHitCoinReward: number;
    perDestroyedEnemyCell: number;
    perCoinBlockSettlement: number;
}

export interface TurnResourceMergeConfig {
    maxLevel: number;
    levelValues: number[];
    typeLevels: { [type: string]: TurnResourceLevelAttributeConfig[] };
}

export interface TurnResourceLevelAttributeConfig {
    hp: number;
    attack?: number;
    coin?: number;
    heal?: number;
    healBlock?: number;
    missileDamage?: number;
}

export interface TurnBondUpgradeSnapshot {
    extraShots: number;
    damageBonus: number;
    bulletBounce: number;
    firstBounceDamageMultiplier?: number;
    spreadExtraSplit?: number;
    damageBoostTempAttack?: number;
    blackHoleStrengthMultiplier?: number;
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
    firstBounceDamageMultiplier: number;
    spreadExtraSplit: number;
    damageBoostTempAttack: number;
    blackHoleStrengthMultiplier: number;
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

export interface TurnResourceHpBonusByType {
    normal: number;
    exp: number;
    energy: number;
    bullet: number;
    bleed: number;
}

export interface TurnDerivedUpgradeState {
    bulletBounceBonus: number;
    firstBounceDamageMultiplier: number;
    roundResourceBonus: number;
    resourceHpBonusByType: TurnResourceHpBonusByType;
    spreadExtraSplit: number;
    damageBoostTempAttack: number;
    blackHoleStrengthMultiplier: number;
    missileExplosionRadiusBonus: number;
    missileDamageBonus: number;
    missileMainCannonChanceBonus: number;
    coinDropMultiplier: number;
    expDropMultiplier: number;
}

export interface TurnEconomyState {
    coins: number;
    placedThisRound: boolean;
    slotCost: number;
    refreshCost: number;
    canRefresh: boolean;
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
    baseBulletCount: number;
    bulletDamage: number;
    baseBulletBounce: number;
    roundBulletBounceGrowth: number;
    maxRoundBulletBounce: number;
    baseFireInterval: number;
    bulletBlockExtraShotInterval: number;
    bulletMaxLifeSeconds: number;
    bulletSpeed: number;
    bulletRadius: number;
    obstacleRadius: number;
    resourceMerge: TurnResourceMergeConfig;
    assistZones: TurnAssistZoneConfig;
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
        missile_silo: TurnObstacleHpRuleConfig;
        coin: TurnObstacleHpRuleConfig;
    };
    missileSilo: {
        directDamage: number;
        explosionRadiusCells: number;
        mainCannonChance: number;
    };
    coinEconomy: TurnCoinEconomyConfig;
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
    attackSeconds: 25,
    waitBulletSeconds: 0,
    settleSeconds: 1,
    upgradeSeconds: 0,
    attackRounds: 1,
    initialRoundResourceTotal: 3,
    roundResourceGrowth: 1,
    maxRoundResourceTotal: 12,
    slotCountPerRound: 3,
    slotMinResource: 1,
    slotMaxResource: 4,
    baseExpPerRound: 0,
    obstacleHitExp: 0,
    crystalHitExp: 0,
    levelUpExp: 0,
    baseBulletCount: 1,
    bulletDamage: 10,
    baseBulletBounce: 0,
    roundBulletBounceGrowth: 1,
    maxRoundBulletBounce: 4,
    baseFireInterval: 0,
    bulletBlockExtraShotInterval: 0.5,
    bulletMaxLifeSeconds: 30,
    bulletSpeed: 620,
    bulletRadius: 10,
    obstacleRadius: 26,
    resourceMerge: {
        maxLevel: 5,
        levelValues: [1, 3, 6, 10, 15],
        typeLevels: {
            normal: [{ hp: 10 }, { hp: 20 }, { hp: 30 }, { hp: 40 }, { hp: 50 }],
            mirror: [{ hp: 10 }, { hp: 20 }, { hp: 30 }, { hp: 40 }, { hp: 50 }],
            missile_silo: [{ hp: 10, missileDamage: 10 }, { hp: 20, missileDamage: 15 }, { hp: 30, missileDamage: 20 }, { hp: 40, missileDamage: 25 }, { hp: 50, missileDamage: 30 }],
            bullet: [{ hp: 10 }, { hp: 20 }, { hp: 30 }, { hp: 40 }, { hp: 50 }],
            attack: [{ hp: 10, attack: 1 }, { hp: 20, attack: 2 }, { hp: 30, attack: 4 }, { hp: 40, attack: 8 }, { hp: 50, attack: 10 }],
            coin: [{ hp: 10, coin: 1 }, { hp: 20, coin: 2 }, { hp: 30, coin: 4 }, { hp: 40, coin: 8 }, { hp: 50, coin: 10 }],
            energy: [{ hp: 10, heal: 2 }, { hp: 20, heal: 4 }, { hp: 30, heal: 6 }, { hp: 40, heal: 10 }, { hp: 50, heal: 12 }],
            bleed: [{ hp: 10, healBlock: 1 }, { hp: 20, healBlock: 2 }, { hp: 30, healBlock: 3 }, { hp: 40, healBlock: 5 }, { hp: 50, healBlock: 6 }],
        },
    },
    assistZones: {
        spawnRule: {
            round1: 1,
            round2: 2,
            round3Plus: 3,
            maxSimultaneous: 3,
        },
        maxPlacementRetries: 24,
        enabledTypes: ["spread", "damage_boost"],
        allowOverlap: false,
        types: {
            black_hole: {
                name: "黑洞",
                minRadius: 64,
                maxRadius: 92,
                blackHoleStrength: 9,
                blackHoleCurvePower: 1.0,
                blackHoleMaxOffsetPerTick: 8,
            },
            spread: {
                name: "扩散",
                minRadius: 58,
                maxRadius: 84,
                spreadSplitCount: 3,
                spreadSplitStepAngle: 15,
            },
            damage_boost: {
                name: "增伤",
                minRadius: 52,
                maxRadius: 78,
                damageBoostMaxMultiplier: 3,
            },
        },
    },
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
        missile_silo: {
            baseHp: 10,
            maxHp: 10,
        },
        coin: {
            baseHp: 10,
            maxHp: 30,
        },
    },
    missileSilo: {
        directDamage: 10,
        explosionRadiusCells: 1,
        mainCannonChance: 0,
    },
    coinEconomy: {
        initialCoins: 0,
        baseRoundReward: 10,
        slotCost: 10,
        refreshCost: 5,
        destroyedEnemyResourceCoinReward: 1,
        enemyTankHitCoinReward: 1,
        perDestroyedEnemyCell: 1,
        perCoinBlockSettlement: 1,
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
        maxLevel: 5,
        valueThresholds: [4, 10, 18, 28, 40],
        bullet: {
            blocksPerExtraShot: 4,
        },
        missile_silo: {
            amountPerBlock: 0,
            tiers: [],
            hitTankChanceBonuses: [0.1, 0.3, 0.5, 0.75, 1],
        },
        mirror: {
            amountPerBlock: 0,
            tiers: [],
            damageReductionRatios: [0.7, 0.6, 0.5, 0.4, 0.3],
        },
        attack: {
            amountPerBlock: 1,
            tiers: [
                { multiplier: 1.2 },
                { multiplier: 1.5 },
                { multiplier: 1.8 },
                { multiplier: 2 },
                { multiplier: 3 },
            ],
        },
        exp: {
            amountPerBlock: 5,
            tiers: [
                { multiplier: 1.2 },
                { multiplier: 1.5 },
                { multiplier: 1.8 },
                { multiplier: 2 },
                { multiplier: 3 },
            ],
        },
        energy: {
            amountPerBlock: 2,
            tiers: [
                { multiplier: 1.2 },
                { multiplier: 1.5 },
                { multiplier: 1.8 },
                { multiplier: 2 },
                { multiplier: 3 },
            ],
        },
        bleed: {
            amountPerBlock: 1,
            tiers: [
                { multiplier: 1.2 },
                { multiplier: 1.5 },
                { multiplier: 1.8 },
                { multiplier: 2 },
                { multiplier: 3 },
            ],
        },
        coin: {
            amountPerBlock: 1,
            tiers: [],
            bountyMultipliers: [1.2, 1.5, 1.8, 2, 3],
        },
    },
    obstacleSlotMaxResources: 4,
    expWallDestroyExp: 0,
    energyWallRoundHeal: 10,
    bloodBlockHealPerStack: 1,
    obstacleSlots: [
        { type: "normal", name: "普通方块" },
        { type: "mirror", name: "反弹块" },
        { type: "energy", name: "能量墙" },
        { type: "bleed", name: "滴血块" },
        { type: "bullet", name: "子弹块" },
        { type: "attack", name: "攻击块" },
        { type: "missile_silo", name: "导弹井" },
        { type: "coin", name: "金币块" },
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
        A: cc.rect(-320, -480, 640, 224),
        B: cc.rect(-320, 256, 640, 224),
    },
    upgradePool: [],
};

export function getRoundObstacleGain(roundIndex: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    return getRoundResourceTotal(roundIndex, 0, cfg) - getRoundResourceTotal(Math.max(1, roundIndex - 1), 0, cfg);
}

export function getTurnAssistZoneSpawnCount(roundIndex: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    let rule = cfg.assistZones && cfg.assistZones.spawnRule;
    let round = Math.max(1, Math.floor(Number(roundIndex) || 1));
    let count = round <= 1
        ? Math.max(0, Number(rule && rule.round1) || 0)
        : round === 2
            ? Math.max(0, Number(rule && rule.round2) || 0)
            : Math.max(0, Number(rule && rule.round3Plus) || 0);
    let maxSimultaneous = Math.max(0, Number(rule && rule.maxSimultaneous) || 0);
    return maxSimultaneous > 0 ? Math.min(maxSimultaneous, count) : count;
}

export function getTurnAssistZoneTypeConfig(type: TurnAssistZoneType, config?: TurnGameConfig): TurnAssistZoneTypeConfig {
    let cfg = config || TURN_GAME_CONFIG;
    let types = cfg.assistZones && cfg.assistZones.types;
    return types && types[type] ? types[type] : types.black_hole;
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
        coin: Math.max(0, Math.floor(Number(source && source.coin) || 0)),
        missile_silo: Math.max(0, Math.floor(Number(source && source.missile_silo) || 0)),
        mirror: Math.max(0, Math.floor(Number(source && source.mirror) || 0)),
    };
}

export function getTurnResourceLevelValue(resourceLevel: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    let values = cfg.resourceMerge && Array.isArray(cfg.resourceMerge.levelValues) ? cfg.resourceMerge.levelValues : [1];
    let maxLevel = Math.max(1, Math.floor(Number(cfg.resourceMerge && cfg.resourceMerge.maxLevel) || values.length || 1));
    let level = Math.max(1, Math.min(maxLevel, Math.floor(Number(resourceLevel) || 1)));
    let value = Math.max(1, Math.floor(Number(values[level - 1]) || 0));
    return value > 0 ? value : level;
}

export function getTurnResourceLevelConfig(type: TurnObstacleResourceType, resourceLevel: number, config?: TurnGameConfig): TurnResourceLevelAttributeConfig {
    let cfg = config || TURN_GAME_CONFIG;
    let typeLevels = cfg.resourceMerge && cfg.resourceMerge.typeLevels;
    let list = typeLevels && Array.isArray(typeLevels[type]) ? typeLevels[type] : null;
    let maxLevel = Math.max(1, Math.floor(Number(cfg.resourceMerge && cfg.resourceMerge.maxLevel) || (list ? list.length : 1) || 1));
    let level = Math.max(1, Math.min(maxLevel, Math.floor(Number(resourceLevel) || 1)));
    let fallbackHp = Math.max(1, level * 10);
    return list && list[level - 1] ? list[level - 1] : { hp: fallbackHp };
}

export function getTurnResourceLevelHp(type: TurnObstacleResourceType, resourceLevel: number, config?: TurnGameConfig): number {
    let levelConfig = getTurnResourceLevelConfig(type, resourceLevel, config);
    return Math.max(1, Math.floor(Number(levelConfig.hp) || 1));
}

export function getTurnResourcePropertyValue(type: TurnObstacleResourceType, resourceLevel: number, config?: TurnGameConfig): number {
    let levelConfig = getTurnResourceLevelConfig(type, resourceLevel, config);
    if (type === "attack") {
        return Math.max(0, Number(levelConfig.attack) || 0);
    }
    if (type === "coin") {
        return Math.max(0, Number(levelConfig.coin) || 0);
    }
    if (type === "energy") {
        return Math.max(0, Number(levelConfig.heal) || 0);
    }
    if (type === "bleed") {
        return Math.max(0, Number(levelConfig.healBlock) || 0);
    }
    if (type === "missile_silo") {
        return Math.max(0, Number(levelConfig.missileDamage) || 0);
    }
    return 0;
}

export function getTurnCoinSettlementGain(coinBlockCount: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    let safeCount = Math.max(0, Math.floor(Number(coinBlockCount) || 0));
    if (safeCount <= 0) {
        return 0;
    }
    let economy = cfg.coinEconomy;
    let perBlock = Math.max(0, Number(economy && economy.perCoinBlockSettlement) || 0);
    return safeCount * perBlock;
}

export function getTurnBondCount(counts: Partial<TurnBondCountMap> | null | undefined, type: TurnBondResourceType): number {
    return Math.max(0, Math.floor(Number(counts && counts[type]) || 0));
}

export function getTurnBondLevel(count: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    let safeCount = Math.max(0, Math.floor(Number(count) || 0));
    if (safeCount <= 0) {
        return 0;
    }
    let thresholds = cfg.bondRules && Array.isArray(cfg.bondRules.valueThresholds) ? cfg.bondRules.valueThresholds : [];
    let maxLevel = Math.max(1, Math.floor(Number(cfg.bondRules && cfg.bondRules.maxLevel) || thresholds.length || 1));
    let tierIndex = -1;
    for (let i = 0; i < thresholds.length && i < maxLevel; i++) {
        if (safeCount >= Math.max(0, Number(thresholds[i]) || 0)) {
            tierIndex = i;
        }
    }
    if (tierIndex < 0) {
        return 0;
    }
    return tierIndex + 1;
}

export function getTurnBondMultiplier(type: Exclude<TurnBondResourceType, "bullet">, count: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    let level = getTurnBondLevel(count, cfg);
    if (level <= 0) {
        return 0;
    }
    let rule = cfg.bondRules && cfg.bondRules[type];
    let tiers = rule && Array.isArray(rule.tiers) ? rule.tiers : [];
    let tier = tiers[Math.min(level - 1, tiers.length - 1)];
    return Math.max(0, Number(tier && tier.multiplier) || 0);
}

export function getTurnBulletExtraShots(count: number, config?: TurnGameConfig): number {
    return getTurnBondLevel(count, config);
}

export function getTurnBondBountyMultiplier(type: Exclude<TurnBondResourceType, "bullet">, count: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    let level = getTurnBondLevel(count, cfg);
    if (level <= 0) {
        return 1;
    }
    let rule = cfg.bondRules && cfg.bondRules[type];
    let values = rule && Array.isArray(rule.bountyMultipliers) ? rule.bountyMultipliers : [];
    return Math.max(1, Number(values[Math.min(level - 1, values.length - 1)]) || 1);
}

export function getTurnMissileSiloHitTankChanceBonus(count: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    let level = getTurnBondLevel(count, cfg);
    let rule = cfg.bondRules && cfg.bondRules.missile_silo;
    let values = rule && Array.isArray(rule.hitTankChanceBonuses) ? rule.hitTankChanceBonuses : [];
    return level > 0 ? Math.max(0, Math.min(1, Number(values[Math.min(level - 1, values.length - 1)]) || 0)) : 0;
}

export function getTurnMirrorDamageReductionRatio(count: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    let level = getTurnBondLevel(count, cfg);
    let rule = cfg.bondRules && cfg.bondRules.mirror;
    let values = rule && Array.isArray(rule.damageReductionRatios) ? rule.damageReductionRatios : [];
    return level > 0 ? Math.max(0, Math.min(1, Number(values[Math.min(level - 1, values.length - 1)]) || 0)) : 0;
}

export function getTurnRoundBulletBounce(roundIndex: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    let round = Math.max(1, Math.floor(Number(roundIndex) || 1));
    let baseBounce = Math.max(0, Math.floor(Number(cfg.baseBulletBounce) || 0));
    let growth = Math.max(0, Math.floor(Number(cfg.roundBulletBounceGrowth) || 0));
    let maxBounce = Math.max(baseBounce, Math.floor(Number(cfg.maxRoundBulletBounce) || baseBounce));
    return Math.min(maxBounce, baseBounce + Math.max(0, round - 1) * growth);
}

export function getTurnBondValue(type: Exclude<TurnBondResourceType, "bullet">, count: number, config?: TurnGameConfig, propertyValue?: number): number {
    let cfg = config || TURN_GAME_CONFIG;
    let safeCount = Math.max(0, Math.floor(Number(count) || 0));
    if (safeCount <= 0) {
        return 0;
    }
    let rule = cfg.bondRules && cfg.bondRules[type];
    let amountPerBlock = Math.max(0, Number(rule && rule.amountPerBlock) || 0);
    let multiplier = getTurnBondMultiplier(type, safeCount, cfg);
    let baseValue = Number.isFinite(propertyValue) ? Math.max(0, Number(propertyValue) || 0) : safeCount * amountPerBlock;
    return baseValue * multiplier;
}

export function buildTurnAttackBondSnapshot(counts: Partial<TurnBondCountMap>, upgrades?: Partial<TurnBondUpgradeSnapshot>, config?: TurnGameConfig, roundIndex?: number, propertyValues?: Partial<TurnBondCountMap>): TurnAttackBondSnapshot {
    let cfg = config || TURN_GAME_CONFIG;
    let safeCounts = createTurnBondCountMap(counts);
    let safeProperties = createTurnBondCountMap(propertyValues);
    let extraShotsFromUpgrade = Math.max(0, Math.floor(Number(upgrades && upgrades.extraShots) || 0));
    let bonusDamageFromUpgrade = Math.max(0, Math.floor(Number(upgrades && upgrades.damageBonus) || 0));
    let bulletBounce = Math.max(0, Math.floor(Number(upgrades && upgrades.bulletBounce) || 0));
    let firstBounceDamageMultiplier = Math.max(1, Number(upgrades && upgrades.firstBounceDamageMultiplier) || 1);
    let spreadExtraSplit = Math.max(0, Math.floor(Number(upgrades && upgrades.spreadExtraSplit) || 0));
    let damageBoostTempAttack = Math.max(0, Math.floor(Number(upgrades && upgrades.damageBoostTempAttack) || 0));
    let blackHoleStrengthMultiplier = Math.max(1, Number(upgrades && upgrades.blackHoleStrengthMultiplier) || 1);
    let extraShotsFromBulletBlock = getTurnBulletExtraShots(safeCounts.bullet, cfg);
    let attackMultiplier = getTurnBondMultiplier("attack", safeCounts.attack, cfg);
    let bonusDamageFromAttackBlock = getTurnBondValue("attack", safeCounts.attack, cfg, safeProperties.attack);
    let baseBulletCount = Math.max(1, Math.floor(Number(cfg.baseBulletCount) || 1));
    let totalShots = Math.max(1, baseBulletCount + extraShotsFromUpgrade + extraShotsFromBulletBlock);
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
        bulletBounce: getTurnRoundBulletBounce(roundIndex, cfg) + bulletBounce,
        firstBounceDamageMultiplier: firstBounceDamageMultiplier,
        spreadExtraSplit: spreadExtraSplit,
        damageBoostTempAttack: damageBoostTempAttack,
        blackHoleStrengthMultiplier: blackHoleStrengthMultiplier,
        shotsLeft: totalShots,
    };
}

export function buildTurnSettlementBondSnapshot(
    ownCounts: Partial<TurnBondCountMap>,
    enemyCounts?: Partial<TurnBondCountMap>,
    config?: TurnGameConfig,
    ownProperties?: Partial<TurnBondCountMap>,
    enemyProperties?: Partial<TurnBondCountMap>,
): TurnSettlementBondSnapshot {
    let cfg = config || TURN_GAME_CONFIG;
    let selfCounts = createTurnBondCountMap(ownCounts);
    let foeCounts = createTurnBondCountMap(enemyCounts);
    let selfProperties = createTurnBondCountMap(ownProperties);
    let foeProperties = createTurnBondCountMap(enemyProperties);
    let expMultiplier = getTurnBondMultiplier("exp", selfCounts.exp, cfg);
    let energyMultiplier = getTurnBondMultiplier("energy", selfCounts.energy, cfg);
    let bleedMultiplier = getTurnBondMultiplier("bleed", selfCounts.bleed, cfg);
    let expGain = getTurnBondValue("exp", selfCounts.exp, cfg, selfProperties.exp);
    let totalHeal = getTurnBondValue("energy", selfCounts.energy, cfg, selfProperties.energy);
    let blockedHealByEnemy = getTurnBondValue("bleed", foeCounts.bleed, cfg, foeProperties.bleed);
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
        blockedHeal: getTurnBondValue("bleed", selfCounts.bleed, cfg, selfProperties.bleed),
    };
}

if (typeof yyp !== "undefined") {
    yyp.config = yyp.config || {};
    yyp.config.TurnGame = TURN_GAME_CONFIG;
}
