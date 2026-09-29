// Reuse the byte-preserving PNG inspector; its working manifest is local to this folder.
const fs=require('fs'),path=require('path');
const inspect=path.join(__dirname,'inspect-assets.cjs');
if(!fs.existsSync(inspect))fs.copyFileSync(path.join(__dirname,'../quit-confirm-assets-v1/prepare-assets.cjs'),inspect);
const scriptBackup=path.join(__dirname,'OptionUI.before.mlua');
if(!fs.existsSync(scriptBackup))fs.copyFileSync('RootDesk/MyDesk/OptionUI.mlua',scriptBackup);
const m=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'),'utf8'));
if(!fs.existsSync(m.preview.file))fs.copyFileSync(m.preview.source,m.preview.file);
require(inspect);
