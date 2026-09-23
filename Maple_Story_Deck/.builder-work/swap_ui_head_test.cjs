// Test helper: back up current .ui files and swap in the HEAD (released) versions, or restore the backup.
// usage: node swap_ui_head_test.cjs swap|restore <backupDir> <ui/File> ...
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const [mode, backupDir, ...files] = process.argv.slice(2);
const repoRoot = path.join(__dirname, "..");
fs.mkdirSync(backupDir, { recursive: true });

for (const rel of files) {
  const abs = path.join(repoRoot, rel);
  const bak = path.join(backupDir, path.basename(rel));
  if (mode === "swap") {
    fs.copyFileSync(abs, bak);
    fs.writeFileSync(abs, execSync(`git show HEAD:"Maple_Story_Deck/${rel}"`, { cwd: repoRoot, maxBuffer: 1 << 28 }));
    console.log("swapped " + rel + " (backup " + bak + ")");
  } else if (mode === "restore") {
    fs.copyFileSync(bak, abs);
    console.log("restored " + rel);
  }
}
