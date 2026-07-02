const fs = require('fs');
const path = process.argv[2];
const data = fs.readFileSync(path, 'utf8');
const re = /DEPTH[^"\]*/g;
let m;
while ((m = re.exec(data)) !== null) console.log(m[0]);
