# Achievement System – Plan, Settings & Maintenance

本文档记录成就系统的设计、配置与后续扩充/修改时的注意事项，便于回顾与维护。

---

## 1. 概述

- **位置**：Log in 页，Support & Feedback 区块下方；Account 区显示总 star 数。
- **奖励**：每个成就 1 star；未完成 / 已完成分别用两种星形图片展示。
- **防重复**：每个成就仅可解锁一次；后端 `user_achievement_unlocks` 表 + 幂等 claim API。
- **数据**：解锁记录与（部分）校验在 Supabase；前端在适当时机检测条件并调用 claim。

---

## 2. 成就列表与判定规则

| achievement_id   | 成就名 (EN)      | 条件简述 | 数据来源 | 服务端校验 |
|------------------|------------------|----------|----------|------------|
| call_to_arm      | Call to arm      | 添加至少 2 个 Player | 本地 players 数量 | 否 |
| first_show       | First Show       | 记录 1 场完整比赛 | 本地 completed 场数 >= 1 | 否 |
| being_supportive | Being Supportive | 使用 Comment 并保存至少 1 次 | 本地 match.comment 非空 | 否 |
| post_game        | Post game        | 使用 Match Review 生成至少 1 次报告 | review_usage 表 | **是** |
| big_server       | Big server       | 用 tracking serve 记录 1 场完整比赛 | 本地 completed + serve log 有数据 | 否 |
| big_target       | Big Target       | 在 Players 里查看某 player 的比赛记录 | 前端 showPlayerStats + getMatchesByPlayer >= 1 | 否 |
| friendship       | Friendship       | 分享 APP 且对方通过链接注册 | referral_claims 表 | **是** |
| long_term_run    | Long term run    | 记录 10 场完整比赛 | 本地 completed 场数 >= 10 | 否 |
| grand_slam       | Grand Slam       | 记录 32 场完整比赛 | 本地 completed 场数 >= 32 | 否 |

- **完整比赛**：`match.status === 'completed'`（且通常有 `match.winner`、`match.endTime`）。
- **防重复**：同一 (user_id, achievement_id) 只插入一次；claim 已存在时仍返回 200（幂等）。

---

## 3. 数据库（Supabase）

### 3.1 表：user_achievement_unlocks

- **用途**：记录用户已解锁的成就，供展示星星与防重复领取。
- **结构**：`user_id` (UUID, FK profiles), `achievement_id` (TEXT), `unlocked_at` (TIMESTAMPTZ), PRIMARY KEY (user_id, achievement_id).
- **RLS**：用户仅可 SELECT 自己的行；INSERT 仅由后端 API 使用 service role 执行。

### 3.2 表：review_usage

- **用途**：记录“用户使用过 Match Review”，供成就 post_game 服务端校验。
- **结构**：`id` (UUID), `user_id` (UUID, FK profiles), `created_at` (TIMESTAMPTZ).
- **写入**：仅在 match-review API 成功返回前由后端 INSERT 一行。
- **RLS**：不开放前端 INSERT；仅 service role 写入。

### 3.3 现有表：referral_claims

- **用途**：成就 friendship 的服务端校验（是否存在 referrer_id = 当前用户）。

---

## 4. 后端 API

### 4.1 GET /api/achievements（或 /api/achievements/unlocked）

- **鉴权**：`Authorization: Bearer <access_token>`
- **响应**：`{ unlockedIds: ['call_to_arm', 'first_show', ...] }`
- **实现**：JWT 取 user_id，查 `user_achievement_unlocks` 该用户的 achievement_id 列表。

### 4.2 POST /api/achievements/claim

- **鉴权**：同上
- **Body**：`{ achievementId: 'call_to_arm' }`
- **逻辑**：校验 achievementId 在预定义列表中；对 post_game / friendship 做服务端校验；INSERT user_achievement_unlocks，唯一冲突则视为已领取并返回 200。

---

## 5. 前端要点

- **星星资源**：未完成 `star-empty` / 已完成 `star-filled`（路径如 icons/ 或 img/）。
- **成就区块**：Support 下方，列表展示 9 个成就名 + 说明 + 1 颗星（按 unlocked 切换图片）。
- **Account**：已登录时显示 “Achievement stars: X / 9”（或等价文案）。
- **触发 claim 的时机**：见下方「何时检测并 claim」；统一入口为 `tryClaimAchievement(achievementId)`。

---

## 6. 何时检测并 claim（调用时机）

- call_to_arm：Log in 页或初始化，players 数量 >= 2。
- first_show / long_term_run / grand_slam：Log in 或列表/统计刷新后，按 completed 场数。
- being_supportive：Comment 保存成功后。
- post_game：Match Review 请求成功并展示报告后（后端会查 review_usage）。
- big_server：有至少 1 场 completed 且该场 getProTrackingServeLog(matchId).length > 0。
- big_target：showPlayerStats(playerId) 内，getMatchesByPlayer(playerId).length >= 1 时。
- friendship：Log in / Account 刷新时尝试 claim，由后端根据 referral_claims 决定是否通过。

---

## 7. 涉及文件一览

| 文件 | 说明 |
|------|------|
| supabase/schema.sql | user_achievement_unlocks、review_usage 表及 RLS |
| api/match-review.js | 成功返回前 INSERT review_usage(user_id) |
| api/achievements.js | GET 已解锁列表；POST claim（含 post_game/friendship 校验） |
| index.html | Achievements 区块；Account 区 star 数 |
| js/app.js | 成就常量、GET/POST、tryClaimAchievement、各时机调用、刷新 UI |
| icons/ 或 img/ | star-empty、star-filled 图片 |

---

## 8. 后续扩充 / 修改成就时的注意事项

### 8.1 新增一个成就

1. **确定 achievement_id**：小写+下划线，如 `new_achievement`，并在前后端共用同一常量/列表。
2. **判定规则**：
   - 若仅依赖本地数据（玩家数、比赛数、comment、serve log、是否打开过某页等）：在前端对应时机调用 `tryClaimAchievement('new_achievement')`，后端只校验 ID 合法 + 未解锁过。
   - 若需服务端校验：在后端增加数据来源（如新表或现有表），在 claim API 中对该 achievement_id 增加校验逻辑。
3. **后端**：在 achievements API 的“预定义 achievement 列表”中加入新 id；若需服务端校验，在 claim 分支里查表/业务逻辑。
4. **前端**：在成就列表常量中增加 `{ id, name, description }`；在满足条件的时机调用 `tryClaimAchievement('new_achievement')`。
5. **UI**：在 Achievements 区块增加一行；总 star 数通常用“已解锁数量 / 成就总数”，成就总数改为 10 即可。

### 8.2 修改已有成就的判定条件

- **仅前端条件**：改 app.js 里对应 achievementId 的检测逻辑与调用时机即可。
- **涉及服务端**：同时改 api/achievements.js 中该成就的校验逻辑，以及数据来源（如 review_usage、referral_claims 或新表）。

### 8.3 为成就增加“服务端校验”（防止作弊）

- 当前仅 **post_game**（review_usage）、**friendship**（referral_claims）做服务端校验。
- 若希望例如 long_term_run / grand_slam 由服务端根据“真实完成场数”校验，需要：
  - 在完成比赛时有写入（如 match 同步到 Supabase 或单独“完成事件”表），
  - 在 claim API 中根据该数据计算 completed 场数再决定是否允许解锁。

### 8.4 成就星级或奖励变更

- 若改为“每个成就多颗星”或“不同成就不同星数”：需在数据结构中区分（例如 achievement 表带 star_count，或前端写死映射），Account 与成就区块的“总 star”改为按成就累加星数。
- 若未来增加非星形奖励（如 credit）：可在 claim 成功后由后端写 profiles 或其它表，并在 API 返回中体现。

### 8.5 配置与常量

- **Achievement ID 列表**：建议在前后端各维护一份权威列表（前端用于展示与调用 claim，后端用于校验 achievementId 合法性），新增/下线成就时两边同步修改。
- **API 基地址**：与 match-review 等一致，如 `https://tennis-match-recorder.vercel.app`；GET/POST achievements 路径需与 Vercel 路由一致（如 api/achievements.js 对应 /api/achievements）。

---

## 9. 注意事项小结

- **唯一性**：同一用户同一成就只解锁一次，依赖表主键与 claim 幂等。
- **安全**：claim 必须带 JWT；post_game / friendship 必须用服务端数据校验，不信任前端自称“已完成”。
- **体验**：进入 Log in 页时拉取 unlocked 列表并刷新成就 UI 与 Account star 数，避免数据滞后。
- **扩展**：新增成就时补全“成就列表、判定时机、后端校验（若需要）、UI 一行”，并更新本文档的成就表与涉及文件。

---

*文档版本：与成就系统首次实现方案一致；后续扩充或修改成就时请同步更新本文档。*
