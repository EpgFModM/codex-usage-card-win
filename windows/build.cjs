'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
(async()=>{const root=path.resolve(__dirname,'..'),runtime=path.join(__dirname,'runtime');fs.mkdirSync(runtime,{recursive:true});const hash='1c331340fa6cac5e4294725959070a143fa0507195a78ad77eed7943f719aac9';const exe=path.join(runtime,'node.exe');
if(!fs.existsSync(exe)||crypto.createHash('sha256').update(fs.readFileSync(exe)).digest('hex')!==hash){const r=await fetch('https://nodejs.org/dist/v24.22.2/win-x64/node.exe');if(!r.ok)throw Error('Node download failed');const bytes=Buffer.from(await r.arrayBuffer());if(crypto.createHash('sha256').update(bytes).digest('hex')!==hash)throw Error('Node checksum mismatch');fs.writeFileSync(exe,bytes);}
const license=await fetch('https://raw.githubusercontent.com/nodejs/node/v24.22.2/LICENSE');if(!license.ok)throw Error('Node license unavailable');fs.writeFileSync(path.join(runtime,'LICENSE.txt'),await license.text());
fs.copyFileSync(path.join(root,'LICENSE'),path.join(__dirname,'LICENSE'));
for(const name of ['ATTRIBUTION.md','SECURITY.md'])fs.copyFileSync(path.join(root,name),path.join(__dirname,name));
fs.writeFileSync(path.join(__dirname,'version.json'),JSON.stringify({version:'0.9.4-windows',node:'24.22.2',nodeSha256:hash,upstream:'f1cc9764a2dc7ccc4e459606cd3311da9d111896',windowsBaseline:'1c5359dc648a99525bb6c169f7149e51d3ce9712',platform:'win32-x64'},null,2));
fs.mkdirSync(path.join(root,'dist'),{recursive:true});const zip=path.join(root,'dist','CodexUsageCard-Windows-x64-0.9.4.zip');
execFileSync('python',['-c',`import zipfile,pathlib; r=pathlib.Path(${JSON.stringify(__dirname)}); z=zipfile.ZipFile(${JSON.stringify(zip)},'w',zipfile.ZIP_DEFLATED); [z.write(p,pathlib.Path('CodexUsageCard')/p.relative_to(r)) for p in r.rglob('*') if p.is_file() and p.suffix not in ('.log',)]; z.close()`],{stdio:'inherit'});
const digest=crypto.createHash('sha256').update(fs.readFileSync(zip)).digest('hex');fs.writeFileSync(path.join(root,'dist','SHA256SUMS.txt'),digest+'  '+path.basename(zip)+'\n');console.log(zip+'\nSHA256 '+digest);
})().catch(e=>{console.error(e);process.exitCode=1});
