const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve('apps/web/public/themes/pawiwahan-agung');
const output = path.join(root,'prada-terpusat-01');
async function main() {
  await fs.mkdir(output,{recursive:true});
  const master = sharp(path.join(root,'gate-bg.webp')).extract({left:286,top:320,width:452,height:850});
  const file = path.join(output,'letter-cloth.webp');
  await master.clone().resize({width:420}).webp({quality:84}).toFile(file);
  const pngRoot = path.resolve('.tmp/pawiwahan-prada-terpusat/raster-masters');
  await fs.mkdir(pngRoot,{recursive:true});
  await master.png().toFile(path.join(pngRoot,'letter-cloth.png'));
  const {width,height} = await sharp(file).metadata();
  const manifest = {
    designId:'pawiwahan-agung', visualRevision:'prada-terpusat-01', packageKind:'renderer-supplement', productionText:false,
    assets:{letterCloth:{url:'/themes/pawiwahan-agung/prada-terpusat-01/letter-cloth.webp',width,height,sizeBytes:(await fs.stat(file)).size,transparent:false}},
    reuse:{background:'gateBackground',bothPanels:'gateTransition',prada:'gateInteractive',divider:'divider'},
    symmetry:{background:'left-half mirrored about center',panels:'same left source mirrored; original right panel intentionally not stacked'},
    portal:{sideInsetPercent:23.65,bottomInsetPercent:11.65}, motion:{lifecycleMs:1650,panelMs:950,panelDelayMs:280,reducedMotion:'fade-only'},
    note:'Visual revision only; no database artwork version is assigned or changed.',
  };
  await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({output,width,height}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
