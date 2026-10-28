// 변환된 엔티티를 가리키는 .mlua 코드를 새 컴포넌트로 바꾼다(줄 끝 CRLF/LF 유지)
const fs=require("fs"),path=require("path");
const groups=process.argv.slice(2);
const ids=new Set();
for(const g of groups) for(const d of JSON.parse(fs.readFileSync(path.join(__dirname,"textgui_"+g+".json"))).done) ids.add(d.id);
function walk(d){let r=[];for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())r=r.concat(walk(p));else if(f.name.endsWith(".mlua"))r.push(p);}return r;}
let total=0;
for(const f of walk("RootDesk/MyDesk")){
  const src=fs.readFileSync(f,"utf8");
  const out=src.replace(/property(\s+)TextComponent(\s+\w+\s*=\s*")([0-9a-f-]{36})"/g,(m,s1,s2,id)=>ids.has(id)?(total++,`property${s1}TextGUIRendererComponent${s2}${id}"`):m);
  if(out!==src){fs.writeFileSync(f,out,"utf8");console.log("props",f);}
}
console.log("typed props changed",total);
