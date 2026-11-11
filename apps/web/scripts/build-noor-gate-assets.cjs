// Deterministic raster crops from the exact approved Lengkung Gading preview.
const path=require('node:path'),sharp=require('sharp');
const root=path.resolve(__dirname,'..');
async function main(){
  const source=path.join(root,'public/themes/noor-e-nikah/gate-panel-left.webp');
  const out=path.join(root,'src/components/invitation/assets');
  for(const[name,region]of [['jali',{left:50,top:30,width:140,height:1470}],['cloth',{left:250,top:400,width:100,height:280}]]){
    await sharp(source).extract(region).webp({quality:92,alphaQuality:100}).toFile(path.join(out,`noor-gate-${name}.webp`));
  }
}
main().catch(e=>{console.error(e);process.exitCode=1});
