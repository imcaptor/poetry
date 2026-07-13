# cnkgraph 近体诗格律校验协议

## 用途

使用古籍文献知识图谱网开放接口校验近体诗格律、押韵、逐字平仄和多音字风险。

脚本封装：`tools/check-meter.mjs`

底层接口：

```text
POST https://open.cnkgraph.com/api/Tool/AnalyzePoem
```

默认参数：

```json
{
  "rhymeBook": "psy",
  "selfPingZeBalanceEnabled": true,
  "clausesPingZeBalanceEnabled": true
}
```

说明：

- `rhymeBook: "psy"`：平水韵。
- `selfPingZeBalanceEnabled: true`：检查句内平仄均衡，包括平仄位置、孤平、三平尾等单句问题。
- `clausesPingZeBalanceEnabled: true`：检查句间粘对关系。

## 调用方式

```bash
node tools/check-meter.mjs "天下何曾有两全，干戈扰攘已经年。不须更作兴亡叹，一局残棋了宿缘。"
```

也可以从标准输入传入：

```bash
echo "天下何曾有两全，干戈扰攘已经年。不须更作兴亡叹，一局残棋了宿缘。" | node tools/check-meter.mjs
```

需要原始 JSON 时：

```bash
node tools/check-meter.mjs --json "诗文"
```

## 退出码

- `0`：无硬伤；可能仍有多音字、可平可仄等需人工确认项。
- `1`：接口调用失败、网络失败或脚本用法错误。
- `2`：发现硬伤，例如格式错误、出韵、平仄有误。

## 报告解读

脚本会输出：

- 用韵：接口识别出的平水韵部。
- 逐句平仄：每句的平仄串、韵部、逐字状态。
- 硬伤：格式错误、平仄有误、韵脚有误、出韵。
- 需人工确认：多音字、可平可仄、具体义项影响平仄的字。
- 同韵可替字：出韵时返回的同韵候选字。
- 平仄建议：接口给出的改字建议。

## 工作规则

1. 每个近体诗候选稿都必须运行 `tools/check-meter.mjs`，不得只凭模型判断格律。
2. 若脚本返回退出码 `2`，先提醒作者硬伤，再修改诗句；修改后重新运行脚本。
3. 若脚本返回退出码 `0` 但有“需人工确认”，把相关字列入报告；常见词义可判断时说明判断理由，仍标注“已人工确认”。
3.5. 即使脚本返回退出码 `0` 且韵脚同部，也必须人工检查是否存在**同部异音**（如十三元 an 系与 en 系混用、十灰 ai 系与 ei 系混用）。详见 `forms/jintishi.md` 同部异音章节。若发现跨读音区混用韵脚，标注为「韵脚读音不协」并按硬伤提醒。
4. 如果接口不可用，才退回 `tools/yundian-checker.md` 的逐字韵典校验流程，并在报告中说明接口失败原因。
5. 候选稿格律校验通过后，不自动查重；只有定稿阶段、暂存定稿或作者主动要求查重时，才运行 `tools/check-similar.mjs`。格律通过不等于查重通过。
6. **频次控制：** cnkgraph 接口有调用频次限制。每次调用 `check-meter.mjs` 或 `check-similar.mjs` 之间必须间隔至少 1 秒（`sleep 1`）。如果遇到 `fetch failed`，等待 3-5 秒后重试，最多重试 3 次。不要并发调用多个校验请求。
