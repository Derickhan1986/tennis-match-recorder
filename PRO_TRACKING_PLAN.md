# Pro Tracking Serve 集成计划（含 Undo）

## 目标
- 追踪球员发球时、Serve 开关打开：**每一分在记录之前**先弹出 Deuce/Ad 落点选择（不依赖用户先点任何按钮）。
- **棕色区** → 直接记发球失误，用户无需再点「Serve fault」。
- **绿色区** → 视为发球进区，随后由用户选择这一分如何结束（Winner、Error 等）。
- 独立日志 `pro_tracking_serve_${matchId}`，与 match log 分开。
- 分析视图：按区、按边（Deuce/Ad）统计次数与占比。

---

## Deuce / Ad 侧说明（避免与一发/二发混淆）

- **Deuce side** = 该局**先发球**的一侧，即该局第 1、3、5、7… 分发球落点所在的一侧。
- **Ad side** = 该局**后发球**的一侧，即该局第 2、4、6、8… 分发球落点所在的一侧。

实现时 **serveSide** 应由「当前局已完成的分数」推导，例如：

- 当前局已打 0 分 → 下一发是第 1 分 → **deuce**
- 当前局已打 1 分 → 下一发是第 2 分 → **ad**
- 当前局已打 2 分 → 下一发是第 3 分 → **deuce**
- 即：`serveSide = (pointsInCurrentGame % 2 === 0) ? 'deuce' : 'ad'`

**不要**用 `currentServeNumber`（1 = 一发，2 = 二发）来当 serveSide：一发/二发是指同一分内的第一次或第二次发球，与 Deuce/Ad 是不同概念。例如 0–0 第一分一发失误、二发仍在 **deuce** 侧。

抢七时发球顺序不同，需按抢七规则单独算「当前发球在哪一侧」。

---

## 1. 记分流程（match-recorder.js）

### 1.1 何时弹出落点选择（先于任何按钮点击）

在以下时机检查「当前是否追踪球员发球 + Serve 开」；若是，则**主动弹出**落点选择，而不是等用户点击按钮后再弹：

- **比赛开始后**：进入记分页、`updateDisplay()` 完成后，若当前发球方 = 追踪球员且 Serve 开 → 弹窗。
- **上一分结束后**：每次记录完一分（或一发失误）并 `updateDisplay()` 后，若下一发/下一分的发球方 = 追踪球员且 Serve 开 → 弹窗。
- **撤销后**：`undoPoint()` 完成并 `updateDisplay()` 后，若当前发球方 = 追踪球员且 Serve 开 → 弹窗。

即：**先弹落点选择，再根据选择决定是直接记 fault，还是进入「选这一分如何结束」**。

### 1.2 用户选区后的行为

- **选棕色区**：  
  - 调用 `recordPoint(server, 'Serve Fault', null)`，并往 pro tracking 日志 append 一条（serveSide、zone_id、gameScore、gamesScore、setsScore）。  
  - 更新界面后，若仍是同一人发球（二发）且仍满足弹窗条件 → **再次弹出**落点选择；否则（双误后换发等）按 1.1 在下一分前再弹。

- **选绿色区**：  
  - 往 pro tracking 日志 append 一条“进区”记录（字段同棕区：serveSide、zone_id、gameScore、gamesScore、setsScore）。  
  - **不记分**，进入「等待用户选择该分如何结束」：显示正常记分按钮（Ace、Winner、各类 Error 等）。用户点击某一按钮后，在 `handleActionButton` 中识别为「绿区之后的点击」，直接记分并传入 `afterProTrackingGreen: true`，**不再弹落点选择**。

### 1.3 实现要点（逻辑分离）

- **入口统一**：提供 `maybeShowServeZonePicker()`：在满足条件时根据**当前局已打分数**算出 `serveSide`（见上文 Deuce/Ad 说明），再弹出 `showServeZonePickerBySide(serveSide)`，并根据结果走棕区/绿区逻辑；不满足条件则什么都不做。
- **调用时机**：在 `updateDisplay()` 末尾、以及记录完一分/一发失误并刷新后，调用 `maybeShowServeZonePicker()`。若当前处于「绿区后等待点结果」状态，则不弹窗（等用户点按钮）。
- **状态**：用 `pendingAfterGreenZone`（或类似）标记「已选绿区，等待用户点 Ace/Winner/Error 等」；用户点击任一记分按钮时视为绿区后的操作，记分后清空该状态并在下一分前再按 1.1 弹窗。

---

## 2. 存储（storage.js）

- `getProTrackingServeLog(matchId)`、`appendProTrackingServeEntry(matchId, entry)`。
- 可选：`removeLastProTrackingServeEntry(matchId)`，用于 Undo 时删除最后一条。
- key: `pro_tracking_serve_${matchId}`。每条 entry（棕区失误与绿区进区均用同一结构）含：serveSide, zone_id, gameScore, gamesScore, setsScore。

---

## 3. 分析视图（app.js + UI）

- 在比赛详情页，若该场有 pro tracking 数据，显示“发球落点分析”入口。
- 弹窗内按 serveSide（Deuce/Ad）和 zone_id 分组，展示每区次数与占比（该边总发球数中的占比）。

---

## 4. Undo 与 Pro Tracking 同步（重要）

撤销最后一分时，需要同步回退 pro tracking 日志，否则分析会多算一条。

### 4.1 何时需要删一条 pro tracking 记录

- **情况 A**：撤销的是「发球失误」——这条失误来自选棕色区，记分时已往 pro tracking 追加了一条。Undo 后应删除 pro tracking 最后一条。
- **情况 B**：撤销的是「绿区进区后的那一分」——选绿区时已往 pro tracking 追加了一条“进区”，用户再记 Winner/Error 等。Undo 这一分后，也应删除 pro tracking 最后一条（即该“进区”记录）。

因此：**只要被撤销的那一分与 pro tracking 有关（要么是棕区失误，要么是绿区进区后的那一分），就应删除 pro tracking 的最后一条。**

### 4.2 如何判断“与 pro tracking 有关”

- **发球失误**：若最后一分的 `action === 'Serve Fault'` 或 `pointType === 'Serve Fault'`，且 `server === 追踪球员`，则这条一定是棕区触发的，应删 pro tracking 最后一条。
- **绿区进区后的那一分**：若最后一分是普通得分（ACE、Winner、各种 Error 等），且该分的 `server === 追踪球员`，我们无法仅从 log 判断是否来自绿区。因此需要在**记分时打标**：若该分是在“绿区回调”里记的，在对应 log 条目上写入 `afterProTrackingGreen: true`。Undo 时：若最后一条 log 的 `server === 追踪球员` 且 `lastEntry.afterProTrackingGreen === true`，则删 pro tracking 最后一条。

### 4.3 实现要点

1. **match-engine.js**
   - `recordPoint` 增加可选参数 `extraPointInfo`（或通过 pointInfo 传入），在 `addToLog` / `addToLogWithSets` 里若存在 `afterProTrackingGreen: true` 则写入 log 条目。
   - `createLogEntry`（models.js）支持的字段中增加 `afterProTrackingGreen`，并传入 `addToLogWithSets` 的 pointInfo。

2. **match-recorder.js**
   - 在“绿区回调”里调用 `recordPoint` 时传入 `afterProTrackingGreen: true`（例如通过 pointInfo 或 extraPointInfo，依你现有 recordPoint 接口而定）。
   - 在 `undoPoint()` 中，**在**调用 `this.matchEngine.undoLastPoint()` **之前**：
     - 取当前 log 最后一条 `lastEntry = this.currentMatch.log[this.currentMatch.log.length - 1]`。
     - 若不存在 lastEntry，直接执行原有 undo。
     - 否则判断：  
       `shouldRemoveProTracking = (lastEntry.action === 'Serve Fault' && lastEntry.server === trackingPlayerId) || (lastEntry.afterProTrackingGreen === true)`  
       （其中 `trackingPlayerId` 需从当前 Pro Tracking 设置或 match 上拿到，且需把 player 与 'player1'/'player2' 对应好。）
     - 调用 `this.matchEngine.undoLastPoint()`。
     - 若 `shouldRemoveProTracking`，再调用 `storage.removeLastProTrackingServeEntry(this.currentMatch.id)`。

3. **storage.js**
   - 实现 `removeLastProTrackingServeEntry(matchId)`：读 `pro_tracking_serve_${matchId}` 数组，pop 最后一项，再写回。

4. **models.js**
   - `createLogEntry` 增加字段：`afterProTrackingGreen: data.afterProTrackingGreen || false`。

这样，Undo 后 match log 与 pro tracking 日志保持一致，分析视图不会多算或少算。

---

## 5. 边界情况小结

- 未登录 / 未选追踪球员 / Serve 关：不弹窗，不写 pro tracking，Undo 不删 pro tracking。
- 当前发球方不是追踪球员：不弹窗，不写 pro tracking。
- 双误：第一次棕区记 fault 并 append 一条，第二次若再选棕区再记 fault 再 append；Undo 时按“最后一条是否与 pro tracking 有关”按上面规则删一条即可。
- 仅撤销到“与 pro tracking 无关”的分数时，不调用 `removeLastProTrackingServeEntry`。

---

## 6. 实现顺序建议

1. 存储：get/append pro tracking log，再实现 removeLast。
2. models：createLogEntry 支持 afterProTrackingGreen；match-engine：recordPoint/addToLog 支持传入并写入该字段。
3. match-recorder：**先于任何按钮**在合适时机调用 `maybeShowServeZonePicker()`（见 1.1）：如 `updateDisplay()` 末尾、记录完一分/一发失误并刷新后、undo 后；实现棕区自动记 fault、绿区 append 后进入「等待点结果」并仅在此后按钮点击时记分并传 afterProTrackingGreen。
4. match-recorder：undoPoint 中按 4.3 增加“读 lastEntry → undo → 按条件 removeLast”逻辑。
5. 分析视图与 UI。
