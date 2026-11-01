const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {options,launchArgs,desktopLaunchPath,launchDesktop,shutdownAgent}=require('./windows.cjs');

test('Store launch uses registered alias and preserves debugging arguments',async()=>{
 const path=require('node:path'),{EventEmitter}=require('node:events');
 const app='C:/Program Files/WindowsApps/OpenAI.Codex_26.1027_x64__test/app/ChatGPT.exe';
 const local=path.resolve('test user 测试'),alias=path.join(local,'Microsoft','WindowsApps','chatgpt-desktop.exe');
 let unreferenced=false;
 const child=await launchDesktop(app,{localAppData:local,exists:p=>p===alias,spawnProcess:(target,args,options)=>{
  assert.equal(target,alias);assert.deepEqual(args,launchArgs());assert.equal(options.detached,true);assert.equal(options.stdio,'ignore');
  const child=new EventEmitter();child.unref=()=>{unreferenced=true};queueMicrotask(()=>child.emit('spawn'));return child;
 }});
 assert.ok(child);assert.equal(unreferenced,true);
 assert.equal(desktopLaunchPath(app,local,()=>false),app);
 const custom='D:/custom Codex/ChatGPT.exe';assert.equal(desktopLaunchPath(custom,local,()=>true),custom);
});

test('execution alias reparse point is detected without following its target',t=>{
 const fs=require('node:fs'),path=require('node:path');const local=path.resolve('alias test');
 const alias=path.join(local,'Microsoft','WindowsApps','chatgpt-desktop.exe');
 t.mock.method(fs,'existsSync',()=>false);
 t.mock.method(fs,'lstatSync',p=>{assert.equal(p,alias);return {isDirectory:()=>false};});
 assert.equal(desktopLaunchPath('C:/WindowsApps/OpenAI.Codex_test/app/ChatGPT.exe',local),alias);
});

test('launch rejection reports actual target for synchronous and asynchronous errors',async()=>{
 const {EventEmitter}=require('node:events');const app='D:/custom Codex/ChatGPT.exe';
 for(const synchronous of [true,false])await assert.rejects(launchDesktop(app,{spawnProcess:()=>{
  const error=Object.assign(new Error('spawn EPERM'),{code:'EPERM'});
  if(synchronous)throw error;
  const child=new EventEmitter();queueMicrotask(()=>child.emit('error',error));return child;
 }}),error=>error.message.includes('EPERM')&&error.message.includes(app));
});
const {formatRateLimits,unavailableValue,parseArgs,resolveCodexBin,AppServerClient}=require('./agent.cjs');
test('local endpoint only',()=>assert.deepEqual(launchArgs(),['--remote-debugging-address=127.0.0.1','--remote-debugging-port=39222']));
test('paths with spaces and Chinese remain whole',()=>{const o=options(['--app','C:/测试 folder/ChatGPT.exe']);assert.match(o.app,/测试 folder/);assert.throws(()=>options(['--bad','x']));});
test('explicit CLI path is honored and missing installation is rejected',()=>{assert.equal(resolveCodexBin(process.execPath),process.execPath);assert.throws(()=>resolveCodexBin(undefined,'Z:/missing','darwin'));});
test('polling stays at 60 seconds',()=>assert.equal(parseArgs([]).pollMs,60000));
test('Plus distinct windows show remaining percentages',()=>{const v=formatRateLimits({rateLimits:{planType:'plus',primary:{usedPercent:11,windowDurationMins:300},secondary:{usedPercent:8,windowDurationMins:10080}}});assert.deepEqual(v.rings.map(r=>r.percent),[89,92]);});
test('unavailable data never displays zero as a successful quota',()=>{const v=unavailableValue(formatRateLimits({rateLimits:{planType:'plus',primary:{usedPercent:10,windowDurationMins:300}}}));assert.equal(v.stale,true);assert.ok(v.rings.every(r=>r.percent===null));});
test('missing reset credits are unavailable, not zero',()=>assert.match(formatRateLimits({}).title,/重置卡：暂不可用/));
test('reset credits come from the protocol',()=>assert.match(formatRateLimits({rateLimitResetCredits:{availableCount:2,credits:null}}).title,/2 张可用/));
test('agent exits via Windows IPC and closes child processes',async()=>{const c=spawn(process.execPath,[require.resolve('./agent.cjs'),'--codex-bin',process.execPath,'--port','39999'],{stdio:['ignore','pipe','ignore','ipc'],windowsHide:true});await new Promise((resolve,reject)=>{c.once('error',reject);c.stdout.once('data',resolve)});await shutdownAgent(c);assert.equal(c.exitCode,0);});
test('partial updates and account changes are received from app-server',async()=>{
 const fixture = `let b='';process.stdin.on('data',d=>{b+=d;let n;while((n=b.indexOf(String.fromCharCode(10)))>=0){const m=JSON.parse(b.slice(0,n));b=b.slice(n+1);if(m.id)console.log(JSON.stringify({id:m.id,result:m.method==='initialize'?{}:{rateLimits:{planType:'plus',primary:{usedPercent:25,windowDurationMins:300},secondary:{usedPercent:5,windowDurationMins:10080}}}}));if(m.method==='account/rateLimits/read'){setTimeout(()=>console.log(JSON.stringify({method:'account/rateLimits/updated',params:{rateLimits:{primary:{usedPercent:40}}}})),50);setTimeout(()=>console.log(JSON.stringify({method:'account/updated',params:{authMode:null}})),100);}}});`;
 const c=new AppServerClient({command:process.execPath,args:['-e',fixture]});
 try{const changed=new Promise(resolve=>c.once('account-changed',resolve));let update;c.on('rate-limits',v=>{update=v;});await c.start();await changed;assert.equal(update.rateLimits.primary.usedPercent,40);assert.equal(update.rateLimits.primary.windowDurationMins,300);assert.equal(update.rateLimits.secondary.usedPercent,5);assert.equal(c.rateLimits,null);}finally{c.stop();}
});

test('null credit count is not a successful zero',()=>assert.match(formatRateLimits({rateLimitResetCredits:{availableCount:null,credits:null}}).title,/暂不可用/));
test('occupied port is detected without contacting or stopping its owner',async()=>{
 const net=require('node:net');const {occupied}=require('./windows.cjs');const server=net.createServer(c=>c.end());
 try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});assert.equal(await occupied(server.address().port),true);}finally{await new Promise(resolve=>server.close(resolve));}
});
test('duplicate launcher reuses the existing per-user monitor',async()=>{
 const net=require('node:net');const {pipe}=require('./windows.cjs');const {execFile}=require('node:child_process');
 const server=net.createServer(c=>c.on('data',()=>c.end(JSON.stringify({phase:'running',windows:[]})+'\n')));
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(pipe,resolve)});
 try{await Promise.all([1,2].map(()=>new Promise((resolve,reject)=>execFile(process.execPath,[require.resolve('./windows.cjs'),'start'],{windowsHide:true,timeout:5000},(error,out)=>{if(error)return reject(error);assert.equal(JSON.parse(out).phase,'running');resolve();}))));}finally{await new Promise(resolve=>server.close(resolve));}
});

test('startup account notification keeps the server alive and reads quota',async()=>{
 const fixture = `let b='';process.stdin.on('data',d=>{b+=d;let n;while((n=b.indexOf('\\n'))>=0){const m=JSON.parse(b.slice(0,n));b=b.slice(n+1);if(m.method==='initialize'){console.log(JSON.stringify({method:'account/updated',params:{authMode:'chatgpt',planType:'plus'}}));console.log(JSON.stringify({id:m.id,result:{}}));}else if(m.id)console.log(JSON.stringify({id:m.id,result:{rateLimits:{planType:'plus',primary:{usedPercent:9,windowDurationMins:300}}}}));}});`;
 const c=new AppServerClient({command:process.execPath,args:['-e',fixture]});
 try{let changes=0;c.on('account-changed',()=>changes++);await c.start();assert.equal(changes,1);assert.equal(c.child.exitCode,null);assert.equal(c.rateLimits.rateLimits.primary.usedPercent,9);await c.refresh();assert.equal(c.rateLimits.rateLimits.primary.usedPercent,9);}finally{c.stop();}
});
test('account change during a read discards the previous account response',async()=>{
 const c=new AppServerClient();let reads=0;
 c.request=async()=>{if(++reads===1)c.accountRevision++;return {rateLimits:{primary:{usedPercent:reads===1?80:10}}};};
 await c.refresh();assert.equal(reads,2);assert.equal(c.rateLimits.rateLimits.primary.usedPercent,10);
});
