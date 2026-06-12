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

export type TurnBondResourceType = "bullet" | "attack" | "exp" | "energy" | "bleed" | "coin";

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
    coin: TurnBondValueRuleConfig;
}

export interface TurnBondCountMap {
    bullet: number;
    attack: number;
    exp: number;
    energy: number;
    bleed: number;
    coin: number;
}

export interface TurnCoinEconomyConfig {
    initialCoins: number;
    baseRoundReward: number;
    slotCost: number;
    refreshCost: number;
    perDestroyedEnemyCell: number;
    perCoinBlockSettlement: number;
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
    baseFireInterval: number;
    bulletBlockExtraShotInterval: number;
    bulletMaxLifeSeconds: number;
    bulletSpeed: number;
    bulletRadius: number;
    obstacleRadius: number;
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
    attackSeconds: 20,
    waitBulletSeconds: 0,
    settleSeconds: 1,
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
    baseBulletCount: 1,
    bulletDamage: 10,
    baseBulletBounce: 0,
    baseFireInterval: 0,
    bulletBlockExtraShotInterval: 0.5,
    bulletMaxLifeSeconds: 30,
    bulletSpeed: 620,
    bulletRadius: 10,
    obstacleRadius: 26,
    assistZones: {
        spawnRule: {
            round1: 1,
            round2: 2,
            round3Plus: 3,
            maxSimultaneous: 3,
        },
        maxPlacementRetries: 24,
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
        coin: {
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
    upgradePool: [
        { id: "bullet_bounce_add", name: "反弹 +1", desc: "子弹可以额外反弹一次", maxStacks: 5, effect: { type: "bullet_bounce", stackMode: "add", value: 1 } },
        { id: "first_bounce_damage_x2", name: "首弹反弹增伤", desc: "第一次反弹后，子弹剩余伤害 x2", maxStacks: 1, effect: { type: "first_bounce_damage", stackMode: "multiply", value: 2 } },
        { id: "round_resource_add", name: "回合资源 +1", desc: "后续每回合可生成的总资源数 +1", maxStacks: 9, effect: { type: "round_resource", stackMode: "add", value: 1 } },
        { id: "normal_hp_add", name: "普通方块 HP +10", desc: "普通方块资源血量 +10，最大 50", maxStacks: 4, effect: { type: "resource_hp", stackMode: "add", value: 10, targetResourceType: "normal", maxValue: 50 } },
        { id: "exp_hp_add", name: "经验块 HP +10", desc: "经验块血量 +10，最大 30", maxStacks: 2, effect: { type: "resource_hp", stackMode: "add", value: 10, targetResourceType: "exp", maxValue: 30 } },
        { id: "energy_hp_add", name: "能量块 HP +10", desc: "能量块血量 +10，最大 30", maxStacks: 2, effect: { type: "resource_hp", stackMode: "add", value: 10, targetResourceType: "energy", maxValue: 30 } },
        { id: "bullet_hp_add", name: "子弹块 HP +10", desc: "子弹块血量 +10，最大 30", maxStacks: 2, effect: { type: "resource_hp", stackMode: "add", value: 10, targetResourceType: "bullet", maxValue: 30 } },
        { id: "bleed_hp_add", name: "滴血块 HP +10", desc: "滴血块血量 +10，最大 30", maxStacks: 2, effect: { type: "resource_hp", stackMode: "add", value: 10, targetResourceType: "bleed", maxValue: 30 } },
        { id: "spread_extra_split_add", name: "扩散分裂 +1", desc: "穿过扩散区域后额外分裂数 +1", maxStacks: null, effect: { type: "spread_extra_split", stackMode: "add", value: 1 } },
        { id: "damage_boost_temp_attack_add", name: "增伤区域攻击 +10", desc: "穿过伤害翻倍区域后临时额外获得 +10 攻击", maxStacks: null, effect: { type: "damage_boost_temp_attack", stackMode: "add", value: 10 } },
        { id: "black_hole_strength_pct", name: "黑洞引力 +10%", desc: "黑洞区域引力效果 +10%", maxStacks: null, effect: { type: "black_hole_strength", stackMode: "add", value: 0.1 } },
        { id: "missile_explosion_radius_add", name: "导弹爆炸 +1格", desc: "导弹爆炸范围向四周增加 1 个地图格子", maxStacks: null, effect: { type: "missile_explosion_radius", stackMode: "add", value: 1 } },
        { id: "missile_damage_add", name: "导弹伤害 +10", desc: "导弹命中伤害 +10", maxStacks: null, effect: { type: "missile_damage", stackMode: "add", value: 10 } },
        { id: "missile_main_cannon_chance_add", name: "导弹命中主炮 +10%", desc: "导弹优先命中敌方主炮概率 +10%", maxStacks: 10, effect: { type: "missile_main_cannon_chance", stackMode: "add", value: 0.1, maxValue: 1 } },
        { id: "coin_drop_pct", name: "攻击金币掉落 +10%", desc: "攻击掉敌方资源获得金币 +10%", maxStacks: null, effect: { type: "coin_drop", stackMode: "add", value: 0.1 } },
        { id: "exp_drop_pct", name: "攻击经验掉落 +10%", desc: "攻击掉敌方资源获得经验 +10%", maxStacks: null, effect: { type: "exp_drop", stackMode: "add", value: 0.1 } },
    ],
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
    };
}

export function getTurnCoinSettlementGain(coinBlockCount: number, config?: TurnGameConfig): number {
    let cfg = config || TURN_GAME_CONFIG;
    let safeCount = Math.max(0, Math.floor(Number(coinBlockCount) || 0));
    if (safeCount <= 0) {
        return 0;
    }
    let economy = cfg.coinEconomy;
    let perBlock = Math.max(0, Number(economy && economy.perCoinBlockSettlement) || 0);
    let multiplier = getTurnBondMultiplier("coin", safeCount, cfg);
    return safeCount * perBlock * multiplier;
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
    let firstBounceDamageMultiplier = Math.max(1, Number(upgrades && upgrades.firstBounceDamageMultiplier) || 1);
    let spreadExtraSplit = Math.max(0, Math.floor(Number(upgrades && upgrades.spreadExtraSplit) || 0));
    let damageBoostTempAttack = Math.max(0, Math.floor(Number(upgrades && upgrades.damageBoostTempAttack) || 0));
    let blackHoleStrengthMultiplier = Math.max(1, Number(upgrades && upgrades.blackHoleStrengthMultiplier) || 1);
    let extraShotsFromBulletBlock = getTurnBulletExtraShots(safeCounts.bullet, cfg);
    let attackMultiplier = getTurnBondMultiplier("attack", safeCounts.attack, cfg);
    let bonusDamageFromAttackBlock = getTurnBondValue("attack", safeCounts.attack, cfg);
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
        bulletBounce: Math.max(0, Math.floor(Number(cfg.baseBulletBounce) || 0)) + bulletBounce,
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
