#!/usr/bin/env node
/**
 * check-similar.mjs — 诗句查重工具
 * 
 * 用法:
 *   node check-similar.mjs "一局残棋了宿缘"
 *   node check-similar.mjs "一局残棋了宿缘" "天下何曾有两全"
 *   node check-similar.mjs --full "一局残棋了宿缘"
 * 
 * API:
 *   GET https://open.cnkgraph.com/api/Poem/SimilarClauses/{clause}
 *   GET https://open.cnkgraph.com/api/Poem/{id}
 */

const BASE = 'https://open.cnkgraph.com/api/Poem';

function charDiff(a, b) {
  const strip = s => s.replace(/[，。、！？；：""''（）《》【】\s,.!?;:'"()\[\]{}<>·…—]/g, '');
  const sa = strip(a);
  const sb = strip(b);
  let diff = Math.abs(sa.length - sb.length);
  const minLen = Math.min(sa.length, sb.length);
  for (let i = 0; i < minLen; i++) {
    if (sa[i] !== sb[i]) diff++;
  }
  return diff;
}

async function fetchJSON(url) {
  const resp = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return resp.json();
}

async function checkClause(clause, fullPoem) {
  const encoded = encodeURIComponent(clause);
  const url = `${BASE}/SimilarClauses/${encoded}`;
  
  let data;
  try {
    data = await fetchJSON(url);
  } catch (e) {
    return { clause, error: e.message, hits: [] };
  }

  const allHits = [];
  
  if (Array.isArray(data)) {
    for (const group of data) {
      if (group.SimilarClauses) {
        for (const sim of group.SimilarClauses) {
          const diff = charDiff(clause, sim.Content || '');
          if (diff <= 1) {
            allHits.push({ ...sim, diff });
          }
        }
      }
    }
  }

  if (fullPoem && allHits.length > 0) {
    for (const hit of allHits) {
      try {
        const poem = await fetchJSON(`${BASE}/${hit.Id}`);
        hit.FullPoem = poem;
      } catch {
        hit.FullPoem = null;
      }
    }
  }

  return { clause, totalSimilar: data[0]?.SimilarClauses?.length ?? 0, hits: allHits };
}

function formatReport(result) {
  const lines = [];
  lines.push(`【查重】「${result.clause}」`);
  lines.push(`  API 返回 ${result.totalSimilar} 条相似句`);
  
  if (result.hits.length === 0) {
    lines.push(`  ✅ 未发现完全相同或仅差1字的诗句`);
    return lines.join('\n');
  }

  lines.push(`  ⚠️ 发现 ${result.hits.length} 条高度相似（完全相同或仅差1字）：`);
  lines.push('');
  
  for (const hit of result.hits) {
    const diffLabel = hit.diff === 0 ? '完全相同' : `差${hit.diff}字`;
    lines.push(`  • [${hit.Dynasty}] ${hit.Author}《${hit.Title}》`);
    lines.push(`    相似句: 「${hit.Content}」（${diffLabel}）`);
    
    if (hit.FullPoem && hit.FullPoem.Clauses) {
      lines.push(`    原诗全文:`);
      for (const c of hit.FullPoem.Clauses) {
        lines.push(`      ${c.Content}`);
      }
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

const args = process.argv.slice(2);
let fullPoem = false;
const clauses = [];

for (const a of args) {
  if (a === '--full' || a === '-f') fullPoem = true;
  else clauses.push(a);
}

if (clauses.length === 0) {
  console.error('用法: node check-similar.mjs [--full] "诗句1" ["诗句2" ...]');
  process.exit(1);
}

const results = [];
for (const clause of clauses) {
  const r = await checkClause(clause, fullPoem);
  results.push(r);
  if (clauses.length > 1) await new Promise(r => setTimeout(r, 500));
}

console.log('\n========== 诗句查重报告 ==========\n');
for (const r of results) {
  if (r.error) {
    console.log(`【查重】「${r.clause}」\n  ❌ 查询失败: ${r.error}\n`);
  } else {
    console.log(formatReport(r));
  }
}
console.log('==================================');
