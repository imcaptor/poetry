#!/usr/bin/env node
import fs from 'node:fs';

function usage(exitCode = 0) {
  const text = `用法：
  node tools/check-guping.mjs '<json>'
  node tools/check-guping.mjs 输入文件.json

输入 JSON 结构：
{
  "lines": [
    { "text": "万时一梦轻", "tones": "仄平仄仄平" },
    { "text": "...", "tones": "平平仄仄平" }
  ]
}

规则：
  对五言或七言平收句，如果除句末韵脚外只剩一个明确平声字，
  判为孤平。遇到 ? / 中 / 可 / X 等不确定平仄符号时，
  判为需人工确认。
`;
  (exitCode ? console.error : console.log)(text);
  process.exit(exitCode);
}

function readInput(arg) {
  if (!arg || arg === '-h' || arg === '--help') usage(arg ? 0 : 1);
  if (fs.existsSync(arg)) return fs.readFileSync(arg, 'utf8');
  return arg;
}

function normalizeToneString(value) {
  return String(value ?? '')
    .replace(/[\s,，、|/]+/g, '')
    .replace(/平/g, '平')
    .replace(/仄/g, '仄');
}

function checkLine(line, index) {
  const tones = normalizeToneString(line.tones ?? line.pattern ?? line.pingze);
  const text = String(line.text ?? `第${index + 1}句`);
  const length = tones.length;
  const result = {
    index: index + 1,
    text,
    tones,
    status: '通过',
    guping: false,
    reason: ''
  };

  if (![5, 7].includes(length)) {
    result.status = '需人工确认';
    result.reason = `平仄串长度为 ${length}，只支持五言或七言。`;
    return result;
  }

  if (/[^平仄]/.test(tones)) {
    result.status = '需人工确认';
    result.reason = '平仄串含可平可仄、多音或未知符号。';
    return result;
  }

  if (tones.at(-1) !== '平') {
    result.reason = '非平收句，不按孤平规则判。';
    return result;
  }

  const beforeRhymeFoot = [...tones.slice(0, -1)];
  const levelCount = beforeRhymeFoot.filter((tone) => tone === '平').length;

  if (levelCount === 1) {
    result.status = '孤平';
    result.guping = true;
    result.reason = '平收句除句末韵脚外只剩一个平声字。';
    return result;
  }

  result.reason = `平收句除韵脚外有 ${levelCount} 个平声字。`;
  return result;
}

let parsed;
try {
  parsed = JSON.parse(readInput(process.argv[2]));
} catch (error) {
  console.error(`JSON 无效：${error.message}`);
  usage(1);
}

const lines = Array.isArray(parsed) ? parsed : parsed.lines;
if (!Array.isArray(lines) || lines.length === 0) {
  console.error('输入必须包含非空的 lines 数组。');
  usage(1);
}

const lineChecks = lines.map(checkLine);
const hasGuping = lineChecks.some((line) => line.guping);
const needsReview = lineChecks.some((line) => line.status === '需人工确认');
const status = hasGuping ? '不通过' : needsReview ? '需人工确认' : '通过';

console.log(JSON.stringify({ status, line_checks: lineChecks }, null, 2));
process.exit(hasGuping ? 2 : needsReview ? 3 : 0);
