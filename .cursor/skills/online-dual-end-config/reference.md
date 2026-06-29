# 双端配置对照参考

## 关键文件

- **客户端配置**：`assets/script/config/TurnGame.ts`
  - 导出：`TurnGameConfig`、`TURN_GAME_CONFIG`、各类 `Turn*Config` 接口
  - 消费：`TurnGameMain.ts`、`TurnBattleMap.ts`、`TurnStateMachine.ts`、`TurnHud.ts`
- **服务端配置**：`server/index.js` 顶部附近 `const TURN_CONFIG = { ... }`
- **联网**：`assets/script/network/NetworkManager.ts`；回合地图 `TurnBattleMap._serverMode`

## 命名映射（常见）

| 客户端 (TurnGame.ts) | 服务端 (TURN_CONFIG) |
|----------------------|----------------------|
| `black_hole` | `blackHole` |
| `damage_boost` | `damageBoost` |
| `missile_silo` | `missile_silo` |
| `bondRules` | `bondRules` |
| `coinEconomy` | `coinEconomy` |
| `assistZones.types.black_hole` | `assistZones.types.blackHole` |

新增字段时优先统一命名；若历史原因不一致，在 skill 实施时两端显式对齐。

## 已有配置域（扩展时复用）

- **回合节奏**：`buildSeconds`、`attackSeconds`、`waitBulletSeconds`、`settleSeconds`
- **资源与经济**：`coinEconomy`、`initialRoundResourceTotal`、`roundResourceGrowth`、`obstacleSlots`
- **地图开发**：`undevelopedCells.initialCount`（开局双方镜像未开发格数量）
- **战斗**：`bulletDamage`、`baseBulletBounce`、`bulletSpeed`、`missileSilo`
- **障碍 HP**：`obstacleHpRules.<type>.baseHp / maxHp`
- **羁绊/协同**：`bondRules`、`attackSynergy`、`bulletSynergy`
- **结算**：`settlementResourceRules`（exp / energy / bleed）
- **辅助区域**：`assistZones.spawnRule`、`assistZones.types.*`
- **升级池**：`upgradePool`（客户端）；`TURN_UPGRADE_POOL`（服务端）

## 服务端权威逻辑入口（回合制）

在 `server/index.js` 中搜索：`TURN_CONFIG`、`evaluateTurnGameEnd`、`turnPhase`、frameCommand 相关函数。

## 客户端联网模式

- `TurnBattleMap.setServerMode(true)`：攻击/建造意图上报，子弹结果等服务端驱动
- 本地 camp 控制：`canControlCamp`、`isLocalAttackTurn`
- 非 serverMode 时客户端可本地模拟完整流程（开发/单机）
