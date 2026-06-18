---
name: online-dual-end-config
description: >-
  Enforces networked multiplayer development with server-client parity and
  configurable game balance numbers. Use when implementing or modifying game
  features, combat formulas, turn-based logic, balance tuning, server/index.js,
  TurnGame config, networking, roomState, or when the user mentions 联网模式,
  服务端客户端兼容, or 可配置数值.
---

# 联网双端可配置数值约束

## 核心约束

> **约束条件：联网模式，兼容服务端和客户端，数值的设计都要改成可配置的。**

凡涉及玩法、战斗、经济、回合、掉落、伤害、冷却、概率等**数值或公式**的改动，默认按此约束执行，无需用户重复说明。

## 必须遵守

### 1. 联网模式（服务端权威）

- **服务端是唯一真相源**：随机、结算、伤害、阶段切换、胜负判定在 `server/index.js` 执行。
- **客户端只做**：输入上报、状态同步展示、本地预测/动画（若已有模式则沿用）。
- 禁止仅在客户端改逻辑导致单机与联网行为不一致。
- 客户端联网分支用 `_serverMode` / `setServerMode` 等现有模式区分；服务端逻辑走 frameCommand / roomState 同步。

### 2. 双端兼容

- 同一套规则必须在 **服务端** 与 **客户端** 可读、可维护、结果一致。
- 改公式时**同时检查**两端，不允许只改一端。
- 协议字段（roomState、frameCommand payload）保持向后兼容，或同步更新收发两端。

### 3. 数值可配置

- **禁止**在业务逻辑里硬编码平衡数值（伤害、HP、概率、冷却、奖励、半径、倍率等）。
- 新数值放入统一配置；已有配置结构优先扩展，不另起一套。
- 配置通过 `config.xxx` / `TURN_CONFIG.xxx` 读取，并做 `Number()` + 合理 fallback。

## 本项目配置落点

| 端 | 文件 | 说明 |
|----|------|------|
| 客户端 | `assets/script/config/TurnGame.ts` | `TurnGameConfig` 类型 + `TURN_GAME_CONFIG` 默认值 |
| 服务端 | `server/index.js` | `TURN_CONFIG` 对象（结构与客户端对齐） |

详细字段对照见 [reference.md](reference.md)。

## 实施流程

1. **先定配置**：在 `TurnGame.ts` 补类型与默认值；在 `server/index.js` 的 `TURN_CONFIG` 补同名字段。
2. **再写逻辑**：服务端算结果 → 客户端读配置做展示/本地辅助计算。
3. **保持同步**：两端 key 名、嵌套结构、默认值语义一致（注意 snake_case vs camelCase 映射）。
4. **收拢魔法数**：改动范围内顺手把相关硬编码迁入配置。

## 完成前检查

```
- [ ] 服务端已实现/更新权威逻辑
- [ ] 客户端联网模式行为与服务端一致（非仅本地单机）
- [ ] 新数值在 TurnGame.ts 与 TURN_CONFIG 均有定义
- [ ] 逻辑通过配置读取，无新增硬编码平衡数
- [ ] 若改协议，收发两端已同步
```

## 反模式（禁止）

- 只在 `TurnBattleMap.ts` 改伤害公式，不改 `server/index.js`
- 只在服务端改 `TURN_CONFIG`，客户端仍用旧常量
- `if (damage > 80)` 这类未进配置的阈值
- 客户端本地随机决定战斗结果

## 示例

**错误**：在 `TurnBattleMap.ts` 写 `const heal = blockCount * 2`

**正确**：
```typescript
// TurnGame.ts
settlementResourceRules: { energy: { healPerBlock: 2, ... } }

// 使用
const heal = blockCount * config.settlementResourceRules.energy.healPerBlock;
```

服务端对应：
```javascript
const rule = TURN_CONFIG.settlementResourceRules.energy;
const heal = blockCount * (Number(rule.healPerBlock) || 2);
```
