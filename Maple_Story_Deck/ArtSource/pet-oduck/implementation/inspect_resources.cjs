const fs=require('fs');
const api=require('G:/Maple_Story_Deck/.agents/skills/msw-search/scripts/msw_resource_api.cjs');
const ids=['33c4c6cc49044cb19871522bfbd9071e','3abab5b4d3524b048606a95efa0a0f40','bae8d87f1ca442d5bcbb68f3c9b37d69','1b43a3d250c64656be66bc04a9887fa5','d14e3254c4134f1eae318670d2167285','db884a33341341b9845aab1621fa8c49'];
(async()=>{
 const out=await api.getResourcesBatch(ids);fs.mkdirSync('outputs/pet-oduck',{recursive:true});fs.writeFileSync('outputs/pet-oduck/native-resource-details.json',JSON.stringify(out,null,2));
 console.log(JSON.stringify(out.items.map(r=>({id:r.id,type:r.type||r.resource_type,payload:r.payload})),null,2));
})().catch(e=>{console.error(e.message);process.exit(1)});
