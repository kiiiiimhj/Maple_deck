// 문자열 연결(`..`) 표현식 분석 → GetTextFormat 전환 가능성 판정. 2026-09-22.
//   node .builder-work/concat_scan.cjs
//
// 왜: `"대미지 : " .. n` 같은 건 기계적 치환이 안 된다. 어순이 다른 언어에선 깨지므로
//   `GetTextFormat("KEY", n)` + 번역표 원문 `대미지 : {0}` 형태로 바꿔야 한다.
//   그러려면 **연결 사슬 전체**를 하나의 템플릿으로 묶어야 해서, 먼저 모양을 세어본다.
//
// 방법: 한국어 리터럴을 발견하면 거기서 좌우로 `..`를 따라 사슬을 확장한다.
//   괄호/대괄호 깊이를 세면서 깊이 0에서 `,` `)` `(` `=` 등을 만나면 멈춘다.
const fs = require("fs");
const path = require("path");

const KO = /[가-힣]/;

// 소스에서 주석/문자열 구간을 미리 표시해 둔다(문자 단위 스캐너).
function analyze(src) {
  const n = src.length;
  const kind = new Uint8Array(n);   // 0=코드 1=문자열내부 2=주석
  const strs = [];                  // {start,end,text}
  let i = 0, line = 1;
  const lineOf = new Int32Array(n);
  while (i < n) {
    lineOf[i] = line;
    const c = src[i];
    if (c === "\n") { line++; i++; continue; }
    if (c === "-" && src[i + 1] === "-") {
      let stop;
      if (src[i + 2] === "[" && src[i + 3] === "[") {
        const e = src.indexOf("]]", i + 4);
        stop = e === -1 ? n : e + 2;
      } else {
        let j = i; while (j < n && src[j] !== "\n") j++;
        stop = j;
      }
      for (let k = i; k < stop; k++) { kind[k] = 2; lineOf[k] = line; if (src[k] === "\n") line++; }
      i = stop; continue;
    }
    if (c === '"' || c === "'") {
      const quote = c, start = i, startLine = line;
      let j = i + 1, buf = "";
      while (j < n) {
        const d = src[j];
        if (d === "\\") { buf += src[j + 1] === "n" ? "\n" : src[j + 1]; j += 2; continue; }
        if (d === quote || d === "\n") break;
        buf += d; j++;
      }
      const end = j + 1;
      for (let k = start; k < end && k < n; k++) { kind[k] = 1; lineOf[k] = startLine; }
      strs.push({ start, end, text: buf, line: startLine });
      i = end; continue;
    }
    i++;
  }
  return { kind, strs, lineOf };
}

// pos에서 좌/우로 `..` 사슬을 확장해 표현식 범위를 구한다.
function expandChain(src, kind, start, end) {
  let lo = start, hi = end;
  // 왼쪽
  for (;;) {
    let p = lo - 1;
    while (p >= 0 && /\s/.test(src[p]) && kind[p] === 0) p--;
    if (p >= 1 && src[p] === "." && src[p - 1] === "." && kind[p] === 0) {
      let q = p - 2;
      // 피연산자 하나를 왼쪽으로 삼킨다(깊이 고려)
      let depth = 0;
      while (q >= 0) {
        const c = src[q];
        if (kind[q] !== 0) { q--; continue; }
        if (c === ")" || c === "]") depth++;
        else if (c === "(" || c === "[") { if (depth === 0) break; depth--; }
        else if (depth === 0 && (c === "," || c === "=" || c === "\n" || c === ";")) break;
        q--;
      }
      lo = q + 1;
      while (lo < start && /\s/.test(src[lo])) lo++;
      continue;
    }
    break;
  }
  // 오른쪽
  for (;;) {
    let p = hi;
    while (p < src.length && /\s/.test(src[p]) && kind[p] === 0) p++;
    if (src[p] === "." && src[p + 1] === "." && kind[p] === 0) {
      let q = p + 2, depth = 0;
      while (q < src.length) {
        const c = src[q];
        if (kind[q] !== 0) { q++; continue; }
        if (c === "(" || c === "[") depth++;
        else if (c === ")" || c === "]") { if (depth === 0) break; depth--; }
        else if (depth === 0 && (c === "," || c === "\n" || c === ";")) break;
        else if (depth === 0 && src.startsWith(" then", q)) break;
        q++;
      }
      hi = q;
      while (hi > p && /\s/.test(src[hi - 1])) hi--;
      continue;
    }
    break;
  }
  // ⚠ 왼쪽 확장이 `then` / `return` / `and` 같은 키워드를 넘어가 버리는 경우가 있다
  //   (실측: `if k == "skillPull" then return tostring(amount) .. "개"` 에서 조건절까지 삼킴).
  //   사슬 앞쪽에 그런 경계가 있으면 그 뒤로 잘라낸다.
  // ⚠ 경계 탐색은 **코드 구간(kind===0)에서만** 해야 한다. 문자열 안의 `(`까지 경계로 치면
  //   `name .. " (+" .. n .. "강화)"` 가 `" (+"` 의 괄호에서 잘려나간다(실측).
  const KW = /^(then|return|do|else|elseif|and|or|not)$/;
  let cutAbs = -1;
  for (let p = lo; p < start; p++) {
    if (kind[p] !== 0) continue;
    const c = src[p];
    if (c === "=" || c === "," || c === "(" || c === "[") { cutAbs = p + 1; continue; }
    if (/[A-Za-z]/.test(c) && (p === 0 || !/[A-Za-z0-9_]/.test(src[p - 1]))) {
      let q = p; while (q < start && /[A-Za-z]/.test(src[q])) q++;
      if (KW.test(src.slice(p, q))) cutAbs = q;
      p = q - 1;
    }
  }
  if (cutAbs > lo) { lo = cutAbs; while (lo < start && /\s/.test(src[lo])) lo++; }

  return { lo, hi };
}

// 사슬을 조각내어 템플릿과 인자 목록을 만든다.
function buildTemplate(src, kind, lo, hi) {
  const parts = [];
  let depth = 0, seg = lo;
  for (let i = lo; i < hi; i++) {
    if (kind[i] !== 0) continue;
    const c = src[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (depth === 0 && c === "." && src[i + 1] === "." ) {
      parts.push(src.slice(seg, i).trim());
      i++; seg = i + 1;
    }
  }
  parts.push(src.slice(seg, hi).trim());

  let tpl = "", args = [], argN = 0, ok = true;
  for (const p of parts) {
    const m = p.match(/^"((?:[^"\\]|\\.)*)"$/) || p.match(/^'((?:[^'\\]|\\.)*)'$/);
    if (m) {
      tpl += m[1].replace(/\\n/g, "\n");
    } else if (p === "") {
      ok = false;
    } else {
      tpl += "{" + argN + "}";
      args.push(p);
      argN++;
    }
  }
  return { tpl, args, parts, ok };
}

const shapes = new Map();
const samples = [];
let total = 0, withKo = 0;

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { walk(p); continue; }
    if (!f.name.endsWith(".mlua")) continue;
    const src = fs.readFileSync(p, "utf8");
    const { kind, strs } = analyze(src);
    const lines = src.split(/\r?\n/);
    const done = new Set();

    for (const s of strs) {
      if (!KO.test(s.text)) continue;
      const lt = lines[s.line - 1] || "";
      if (/\blog(_warning|_error)?\s*\(/.test(lt)) continue;
      const { lo, hi } = expandChain(src, kind, s.start, s.end);
      if (hi - lo === s.end - s.start) continue;    // 연결 아님
      if (done.has(lo)) continue;
      done.add(lo);
      total++;
      const { tpl, args, parts, ok } = buildTemplate(src, kind, lo, hi);
      if (!KO.test(tpl)) continue;
      withKo++;
      const shape = `${parts.length}조각/인자${args.length}`;
      shapes.set(shape, (shapes.get(shape) || 0) + 1);
      if (samples.length < 25) {
        samples.push(`${p.split(path.sep).join("/")}:${s.line}\n      원본: ${src.slice(lo, hi).replace(/\s+/g, " ").slice(0, 120)}\n      템플릿: ${JSON.stringify(tpl).slice(0, 110)}  인자=${args.length}`);
      }
    }
  }
}
walk("RootDesk/MyDesk");

console.log(`연결 표현식 ${total}개 (그중 템플릿에 한국어가 남는 것 ${withKo}개)`);
console.log("\n-- 모양별 --");
for (const [k, v] of [...shapes].sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);
console.log("\n-- 샘플 --");
for (const s of samples) console.log("  " + s);
