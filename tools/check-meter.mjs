#!/usr/bin/env node
/**
 * check-meter.mjs — 近体诗格律校验工具
 *
 * 用法:
 *   node tools/check-meter.mjs "天下何曾有两全，干戈扰攘已经年。不须更作兴亡叹，一局残棋了宿缘。"
 *   echo "天下何曾有两全，干戈扰攘已经年。不须更作兴亡叹，一局残棋了宿缘。" | node tools/check-meter.mjs
 *   node tools/check-meter.mjs --json "诗文"
 *
 * API:
 *   POST https://open.cnkgraph.com/api/Tool/AnalyzePoem
 */

const ENDPOINT = 'https://open.cnkgraph.com/api/Tool/AnalyzePoem';

function parseArgs(argv) {
  const opts = {
    json: false,
    rhymeBook: 'psy',
    selfPingZeBalanceEnabled: true,
    clausesPingZeBalanceEnabled: true,
  };
  const parts = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') opts.json = true;
    else if (arg === '--rhyme-book') opts.rhymeBook = argv[++i] || opts.rhymeBook;
    else if (arg === '--no-self-balance') opts.selfPingZeBalanceEnabled = false;
    else if (arg === '--no-clauses-balance') opts.clausesPingZeBalanceEnabled = false;
    else parts.push(arg);
  }

  return { opts, content: parts.join(' ').trim() };
}

async function readStdin() {
  if (process.stdin.isTTY) return '';
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  return input.trim();
}

async function analyzePoem(content, opts) {
  const resp = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      rhymeBook: opts.rhymeBook,
      selfPingZeBalanceEnabled: opts.selfPingZeBalanceEnabled,
      clausesPingZeBalanceEnabled: opts.clausesPingZeBalanceEnabled,
    }),
    signal: AbortSignal.timeout(15000),
  });

  const text = await resp.text();
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${text.slice(0, 200)}`);

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`API returned non-JSON response: ${text.slice(0, 200)}`);
  }
}

function clauseText(clause) {
  return (clause.Chars || []).map(c => c.Character).join('').replace(/[，。！？；：,.!?;:]+$/u, '');
}

function toneText(clause) {
  return (clause.Chars || [])
    .filter(c => c.Tone)
    .map(c => c.Tone)
    .join('');
}

function collectIssues(data) {
  const result = data.ValidationResult || {};
  const issues = [];
  const warnings = [];

  if (data.InputError) issues.push(`输入错误：${data.InputError}`);
  if (data.FormatError) issues.push(`格式错误：${data.FormatError}`);

  for (const [index, clause] of (result.Clauses || []).entries()) {
    if (clause.Errors) issues.push(`第${index + 1}句：${clause.Errors}`);
    for (const char of clause.Chars || []) {
      if (!char.Status) continue;
      const line = `第${index + 1}句「${char.Character}」：${char.Status}`;
      if (char.Status.includes('有误')) issues.push(line);
      else warnings.push(line);
    }
  }

  const wrongRhymeChars = result.RhymeError?.WrongChars || [];
  for (const item of wrongRhymeChars) {
    const refs = (item.Refers || []).map(r => r.Category).filter(Boolean).join('、');
    issues.push(`韵脚「${item.Character}」出韵${refs ? `（${refs}）` : ''}`);
  }

  if (result.MaySinglePing) warnings.push(`孤平提示：${result.MaySinglePing}`);
  for (const item of result.UncertainTones || []) {
    const refs = (item.Refers || [])
      .map(r => `${r.Category || '未知韵部'} ${r.Tone || '未知声调'} ${r.Spell || ''}`.trim())
      .slice(0, 3)
      .join('；');
    warnings.push(`多音/多义需确认：「${item.Character}」${refs ? `（${refs}）` : ''}`);
  }

  return { issues, warnings };
}

function formatReport(data, content, opts) {
  const result = data.ValidationResult || {};
  const { issues, warnings } = collectIssues(data);
  const lines = [];

  lines.push('========== 近体诗格律校验报告 ==========');
  lines.push('');
  lines.push(`原文：${content}`);
  lines.push(`韵书：${opts.rhymeBook === 'psy' ? '平水韵（psy）' : opts.rhymeBook}`);
  lines.push(`用韵：${result.UsedRhyme || '未识别'}`);
  lines.push(`结论：${issues.length ? '不通过' : '通过'}${warnings.length ? '（有需人工确认项）' : ''}`);
  lines.push('');

  if (result.Clauses?.length) {
    lines.push('【逐句平仄】');
    for (const [index, clause] of result.Clauses.entries()) {
      const status = (clause.Chars || [])
        .filter(c => c.Status)
        .map(c => `${c.Character}:${c.Status}`)
        .join('；') || '无';
      lines.push(`${index + 1}. ${clauseText(clause)}  ${toneText(clause)}  韵部：${clause.Rhymes || '无'}  标注：${status}`);
    }
    lines.push('');
  }

  if (issues.length) {
    lines.push('【硬伤】');
    for (const issue of issues) lines.push(`- ${issue}`);
    lines.push('');
  }

  if (warnings.length) {
    lines.push('【需人工确认】');
    for (const warning of warnings) lines.push(`- ${warning}`);
    lines.push('');
  }

  const rhymeCandidates = result.RhymeError?.AvailableRhymeChars || [];
  if (rhymeCandidates.length) {
    lines.push(`【同韵可替字】${rhymeCandidates.slice(0, 40).map(c => c.Character).join('、')}`);
    lines.push('');
  }

  const toneAdvices = result.ToneAdvices || [];
  if (toneAdvices.length) {
    lines.push('【平仄建议】');
    for (const advice of toneAdvices.slice(0, 5)) {
      lines.push(`- ${advice.Message || JSON.stringify(advice)}`);
    }
    lines.push('');
  }

  lines.push('========================================');
  return lines.join('\n');
}

const { opts, content: argContent } = parseArgs(process.argv.slice(2));
const stdinContent = await readStdin();
const content = argContent || stdinContent;

if (!content) {
  console.error('用法: node tools/check-meter.mjs [--json] "诗文"');
  process.exit(1);
}

try {
  const data = await analyzePoem(content, opts);
  const { issues } = collectIssues(data);
  if (opts.json) console.log(JSON.stringify(data, null, 2));
  else console.log(formatReport(data, content, opts));
  process.exit(issues.length ? 2 : 0);
} catch (error) {
  console.error(`格律校验失败：${error.message}`);
  process.exit(1);
}
