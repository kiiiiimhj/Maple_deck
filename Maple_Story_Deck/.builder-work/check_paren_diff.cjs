// git diff를 읽어 "내 편집이 괄호 균형을 깨뜨렸는지" 검사한다. 2026-09-22.
//   git diff -U0 -- <paths> > d.txt && node .builder-work/check_paren_diff.cjs d.txt
//
// 연결형 → GetTextFormat 변환에서 사슬 끝(hi)을 잘못 잡으면 닫는 괄호를 먹거나 남긴다.
// 원본 줄과 바뀐 줄의 괄호 수지가 다르면 그 편집이 깨진 것이다.
const fs = require("fs");
const lines = fs.readFileSync(process.argv[2], "utf8").split("\n");

// 문자열/주석 밖의 괄호만 센다
function bal(s) {
  let dep = 0, i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === "-" && s[i + 1] === "-") break;          // 줄 주석
    if (c === '"' || c === "'") {
      const q = c; i++;
      while (i < s.length) {
        if (s[i] === "\\") { i += 2; continue; }
        if (s[i] === q) { i++; break; }
        i++;
      }
      continue;
    }
    if (c === "(" || c === "[") dep++;
    if (c === ")" || c === "]") dep--;
    i++;
  }
  return dep;
}

let file = "", minus = [], plus = [], bad = 0;
function flush() {
  if (minus.length || plus.length) {
    const bm = minus.reduce((a, l) => a + bal(l), 0);
    const bp = plus.reduce((a, l) => a + bal(l), 0);
    if (bm !== bp) {
      bad++;
      console.log("⚠ " + file);
      console.log("   before(" + bm + "): " + minus.join(" / ").slice(0, 160));
      console.log("   after (" + bp + "): " + plus.join(" / ").slice(0, 160));
    }
  }
  minus = []; plus = [];
}
for (const l of lines) {
  if (l.startsWith("+++ b/")) { flush(); file = l.slice(6); continue; }
  if (l.startsWith("@@")) { flush(); continue; }
  if (l.startsWith("-") && !l.startsWith("---")) minus.push(l.slice(1));
  else if (l.startsWith("+") && !l.startsWith("+++")) plus.push(l.slice(1));
}
flush();
console.log("\n괄호 균형이 깨진 편집: " + bad + "건");
