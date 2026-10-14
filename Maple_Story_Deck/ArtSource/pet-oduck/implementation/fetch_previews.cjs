const fs=require('fs');
const meta=JSON.parse(fs.readFileSync('outputs/pet-oduck/native-resource-details.json','utf8'));
(async()=>{for(const [id,key]of [['33c4c6cc49044cb19871522bfbd9071e','oduck'],['bae8d87f1ca442d5bcbb68f3c9b37d69','dance'],['db884a33341341b9845aab1621fa8c49','mirror']]){
 const r=meta.items.find(x=>x.id===id);const response=await fetch(r.payload.thumbnail);if(!response.ok)throw Error(key+' thumbnail '+response.status);
 fs.writeFileSync('outputs/pet-oduck/'+key+(r.type==='sprite'?'.png':'.gif'),Buffer.from(await response.arrayBuffer()));
}console.log('Native pet and mirror-ball references saved.');})().catch(e=>{console.error(e.message);process.exit(1)});
