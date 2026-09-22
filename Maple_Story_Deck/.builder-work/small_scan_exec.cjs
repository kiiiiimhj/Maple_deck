// small_scan 결과에 둘러싼 메서드와 ExecSpace를 붙여 출력
const fs=require("fs"),{execSync}=require("child_process");
const lines=execSync("node .builder-work/small_scan.cjs" + (process.argv.includes("--all") ? " --all" : "")).toString().split("\n").slice(1).filter(Boolean);
const cache={};
for(const h of lines){const m=h.match(/^([^:]+):(\d+):/);const f="RootDesk/MyDesk/"+m[1];const n=+m[2];
 const L=cache[f]||(cache[f]=fs.readFileSync(f,"utf8").split(/\r?\n/));
 let meth="(top)",ex="-";for(let i=n-1;i>=0;i--){if(/^\s*(method|handler)\s/.test(L[i])){meth=L[i].trim().replace(/\s*$/,"");for(let j=i-1;j>=Math.max(0,i-3);j--){const e=L[j].match(/@ExecSpace\("(\w+)"\)/);if(e){ex=e[1];break}}break}}
 console.log(ex.padEnd(10)+" | "+meth.slice(0,60).padEnd(60)+" | "+h.slice(0,110));}
