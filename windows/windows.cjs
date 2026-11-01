'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),net=require('node:net'),crypto=require('node:crypto');
const {spawn,execFileSync}=require('node:child_process');
const {resolveCodexBin,isMainWindow}=require('./agent.cjs');
const port=39222;
const pipe='\\\\.\\pipe\\codex-usage-card-'+crypto.createHash('sha256').update(os.homedir().toLowerCase()).digest('hex').slice(0,24);
const stateDir=path.join(process.env.LOCALAPPDATA||os.tmpdir(),'CodexUsageCard');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const launchArgs=()=>['--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${port}`];
function launchEntryExists(file){try{return !fs.lstatSync(file).isDirectory();}catch{return false;}}
function desktopLaunchPath(app,localAppData=process.env.LOCALAPPDATA,exists=launchEntryExists){
 // Activate Store apps through their registered alias: direct EXE launch fails on Win10.
 const storeApp=/[\\/]OpenAI\.Codex_[^\\/]+[\\/]app[\\/]ChatGPT\.exe$/i.test(app);
 const alias=localAppData&&path.join(localAppData,'Microsoft','WindowsApps','chatgpt-desktop.exe');
 return storeApp&&alias&&exists(alias)?alias:app;
}
async function launchDesktop(app,{localAppData=process.env.LOCALAPPDATA,exists=launchEntryExists,spawnProcess=spawn}={}){
 const target=desktopLaunchPath(app,localAppData,exists);
 try{return await new Promise((resolve,reject)=>{
  const child=spawnProcess(target,launchArgs(),{detached:true,stdio:'ignore',windowsHide:false});
  child.once('error',reject);
  child.once('spawn',()=>{child.unref();resolve(child);});
 });}catch(e){throw Error(`无法启动 Codex（${e.code||e.message}）：${target}。若为 Store 版，请检查 Windows 设置中的 chatgpt-desktop.exe 应用执行别名是否启用。`,{cause:e});}
}
function ps(code){return execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"[Console]::OutputEncoding=[Text.UTF8Encoding]::new();"+code],{encoding:'utf8',windowsHide:true,timeout:15000}).trim();}
function options(args){const o={};for(let i=0;i<args.length;i++){if(!['--app','--codex-bin'].includes(args[i])||!args[i+1])throw Error('参数无效');o[args[i].slice(2)]=path.resolve(args[++i]);}return o;}
function processes(){return JSON.parse(ps("ConvertTo-Json -Compress -InputObject @(Get-Process ChatGPT -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*OpenAI.Codex_*' } | Select-Object Id,Path)" )||'[]');}
function discover(o={}){
 let app=o.app||process.env.CODEX_BADGE_APP;
 if(!app){const root=ps('(Get-AppxPackage -Name OpenAI.Codex | Select-Object -First 1).InstallLocation');app=root?path.join(root,'app','ChatGPT.exe'):processes()[0]?.Path;}
 if(!app||!fs.existsSync(app))throw Error('未找到 Codex。请安装 Microsoft Store 版，或使用 --app 指定 ChatGPT.exe。');
 return {app,cli:resolveCodexBin(o['codex-bin']||process.env.CODEX_BADGE_BIN,app)};
}
async function rpc(command){return new Promise((resolve,reject)=>{const c=net.connect(pipe);let data='';c.setTimeout(5000,()=>c.destroy(Error('监控响应超时')));c.on('error',reject);c.on('connect',()=>c.write(JSON.stringify({command})+'\n'));c.on('data',b=>{data+=b;if(data.includes('\n')){c.end();try{resolve(JSON.parse(data.split('\n')[0]));}catch(e){reject(e);}}});});}
async function pages(){const r=await fetch(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(2000),redirect:'error'});if(!r.ok)throw Error('调试连接不可用');return (await r.json()).filter(t=>t.type==='page'&&isMainWindow(t));}
async function evaluate(t,expression){const u=new URL(t.webSocketDebuggerUrl);if(u.protocol!=='ws:'||u.hostname!=='127.0.0.1'||u.port!==String(port))throw Error('调试地址无效');return new Promise((resolve,reject)=>{const w=new WebSocket(u);const timer=setTimeout(()=>done(Error('调试请求超时')),3000);let finished=false;function done(e,v){if(finished)return;finished=true;clearTimeout(timer);w.close();e?reject(e):resolve(v);}w.onopen=()=>w.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression,returnByValue:true}}));w.onerror=()=>done(Error('调试连接失败'));w.onmessage=e=>{try{const m=JSON.parse(e.data);if(m.id===1)done(m.error||m.result?.exceptionDetails,m.result?.result?.value);}catch(e){done(e);}};});}
async function occupied(checkPort=port){return new Promise(resolve=>{const c=net.connect({host:'127.0.0.1',port:checkPort});c.setTimeout(1000);c.on('connect',()=>{c.destroy();resolve(true)});c.on('error',()=>resolve(false));c.on('timeout',()=>{c.destroy();resolve(true)});});}
async function shutdownAgent(agent){if(!agent||agent.exitCode!==null)return;await new Promise(resolve=>{const timer=setTimeout(()=>{agent.kill();resolve()},3000);agent.once('exit',()=>{clearTimeout(timer);resolve()});if(agent.connected)agent.send({type:'shutdown'},()=>{});else agent.kill();});}
async function monitor(attach,o){
 let stopping=false,agent,desktop;let state={phase:'starting',windows:[]};
 const server=net.createServer(c=>{let data='';c.on('error',()=>{});c.on('data',b=>{data+=b;if(data.length>1024){c.destroy();return;}if(data.includes('\n')){try{const m=JSON.parse(data.split('\n')[0]);if(m.command==='stop')stopping=true;c.end(JSON.stringify(state)+'\n');}catch{c.destroy();}}});});
 try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(pipe,resolve);});}catch(e){if(e.code==='EADDRINUSE')return;throw e;}
 try{
 const {app,cli}=discover(o);const running=processes().some(p=>p.Path?.toLowerCase()===app.toLowerCase());
 if(attach){if(!running||!(await pages()).length)throw Error('没有可连接的 Codex 主窗口。');}
 else {if(running)throw Error('请保存工作并完全退出 Codex，再从专用快捷方式启动。');if(await occupied())throw Error('39222 端口已占用，请先关闭占用程序。');desktop=await launchDesktop(app);}
 let ready=false;for(let i=0;i<60&&!stopping;i++){try{if((await pages()).length){ready=true;break;}}catch{}await sleep(1000);}
 if(!ready)throw Error('60 秒内未找到 Codex 主窗口。请运行诊断并检查客户端版本。');
 let absent=0;
 while(!stopping){
  if(!agent||agent.exitCode!==null){agent=spawn(process.execPath,[path.join(__dirname,'agent.cjs'),'--app',app,'--codex-bin',cli],{stdio:['ignore','inherit','inherit','ipc'],windowsHide:true});agent.on('error',e=>{state={phase:'error',error:e.message};stopping=true});}
  let appAlive=true;try{appAlive=processes().some(p=>p.Path?.toLowerCase()===app.toLowerCase());}catch{}
  if(!appAlive){if(++absent>=2)break;}else absent=0;
  try{const windows=[];for(const t of await pages())windows.push(await evaluate(t,'window.__codexUsageBadge?.status() ?? null'));state={phase:windows.some(w=>w?.placed)?'running':'reconnecting',checkedAt:new Date().toISOString(),windows};}catch{state={phase:'reconnecting',windows:[]};}
  for(let i=0;i<10&&!stopping;i++)await sleep(500);
 }
 }catch(e){state={phase:'error',error:e.message};fs.mkdirSync(stateDir,{recursive:true});fs.writeFileSync(path.join(stateDir,'last-error.txt'),e.message);console.error(e.message);await sleep(1500);}
 finally{await shutdownAgent(agent);if(agent)try{for(const t of await pages())await evaluate(t,'window.__codexUsageBadge?.destroy()');}catch{}server.close();}
}
function shortcut(remove=false){const folder=ps("[Environment]::GetFolderPath('Programs')");const dest=path.join(folder,'Codex + 额度卡片.lnk');const owner=path.join(stateDir,'shortcut.json');fs.mkdirSync(stateDir,{recursive:true});
 if(remove){if(fs.existsSync(owner)){const old=JSON.parse(fs.readFileSync(owner));const actual=ps(`$s=(New-Object -ComObject WScript.Shell).CreateShortcut('${dest.replaceAll("'","''")}');$s.Arguments`);if(actual===old.arguments)fs.rmSync(dest,{force:true});fs.rmSync(owner,{force:true});}return;}
 if(fs.existsSync(dest)&&!fs.existsSync(owner))throw Error('同名快捷方式已存在，未覆盖。');
 const exe=process.execPath.replaceAll("'","''"),script=__filename.replaceAll("'","''");const command=`& '${exe}' '${script}' start --notify`;
 const args='-NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand '+Buffer.from(command,'utf16le').toString('base64');
 const q=s=>"'"+s.replaceAll("'","''")+"'";
 ps(`$s=(New-Object -ComObject WScript.Shell).CreateShortcut(${q(dest)});$s.TargetPath=${q(path.join(process.env.SystemRoot,'System32','WindowsPowerShell','v1.0','powershell.exe'))};$s.Arguments=${q(args)};$s.WorkingDirectory=${q(__dirname)};$s.Save()`);fs.writeFileSync(owner,JSON.stringify({arguments:args}));console.log('已创建开始菜单快捷方式：Codex + 额度卡片');}
async function stopMonitor(){try{await rpc('stop');}catch{return;}for(let i=0;i<24;i++){await sleep(500);try{await rpc('status');}catch{return;}}throw Error('停止尚未完成，请稍后重试。');}
async function main(){const args=process.argv.slice(2);const cmd=args.shift()||'start';const notify=args.includes('--notify');const o=options(args.filter(a=>a!=='--notify'));
 if(cmd==='monitor'||cmd==='monitor-attached')return monitor(cmd==='monitor-attached',o);
 if(cmd==='doctor'){console.log(JSON.stringify({...discover(o),node:process.version,platform:process.platform,arch:process.arch,port},null,2));return;}
 if(cmd==='install')return shortcut();
 if(cmd==='uninstall'){await stopMonitor();shortcut(true);return;}
 if(cmd==='stop'){await stopMonitor();console.log('监控已停止，Codex 窗口保留。');return;}
 if(cmd==='status'){try{console.log(JSON.stringify(await rpc(cmd),null,2));}catch{console.log('监控未运行。');}return;}
 if(!['start','attach'].includes(cmd))throw Error('支持 start / attach / status / stop / doctor / install / uninstall');
 try{const state=await rpc('status');console.log(JSON.stringify(state));return;}catch{}
 discover(o);fs.mkdirSync(stateDir,{recursive:true});fs.rmSync(path.join(stateDir,'last-error.txt'),{force:true});const log=fs.openSync(path.join(stateDir,'windows.log'),'a');
 const child=spawn(process.execPath,[__filename,cmd==='attach'?'monitor-attached':'monitor',...Object.entries(o).flatMap(([k,v])=>['--'+k,v])],{detached:true,stdio:['ignore',log,log],windowsHide:true});child.unref();fs.closeSync(log);
 for(let i=0;i<70;i++){await sleep(1000);try{const s=await rpc('status');if(s.phase==='error')throw Error(s.error);if(s.phase==='running'){console.log('额度卡片已启动。');return;}}catch(e){if(fs.existsSync(path.join(stateDir,'last-error.txt')))throw Error(fs.readFileSync(path.join(stateDir,'last-error.txt'),'utf8'));}}
 throw Error('启动超时，请运行 Doctor.cmd 查看诊断。');
}
module.exports={launchArgs,desktopLaunchPath,launchDesktop,options,shutdownAgent,occupied,pipe,rpc};
if(require.main===module)main().catch(e=>{console.error(e.message);if(process.argv.includes('--notify'))try{const msg=Buffer.from(e.message,'utf8').toString('base64');ps(`Add-Type -AssemblyName PresentationFramework;[System.Windows.MessageBox]::Show([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${msg}')),'Codex Usage Card')|Out-Null`);}catch{}process.exitCode=1;});
