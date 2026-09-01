// Stage progression, events, and stronger continent-boundary rules.
const STAGES = [
  {name:'草原のはじまり',years:4,mission:'うさぎと植物だけの大陸。4年間、どちらも絶やさずに保とう。',start:{rabbit:8,grass:72,sapling:10},allowed:['rabbit','grass','sapling'],zones:{rabbit:[5,24],grass:[35,145],sapling:[5,35]},minScore:55,required:{rabbit:4,plants:30},events:[]},
  {name:'狐を迎える',years:6,mission:'狐が加わる。狐・うさぎ・植物を6年間共存させよう。',start:{fox:2,rabbit:15,grass:84,sapling:12},allowed:['fox','rabbit','grass','sapling'],zones:{fox:[1,7],rabbit:[7,30],grass:[38,145],sapling:[6,38]},minScore:57,required:{fox:1,rabbit:5,plants:32},events:[]},
  {name:'草食動物が増えた大陸',years:7,mission:'鹿が加わり、植物の奪い合いが始まる。途中で最初の環境イベントも起こる。',start:{fox:3,deer:8,rabbit:15,grass:92,sapling:16},allowed:['fox','deer','rabbit','grass','sapling'],zones:{fox:[1,8],deer:[5,20],rabbit:[7,30],grass:[38,145],sapling:[7,40]},minScore:58,required:{fox:1,deer:4,rabbit:5,plants:32},events:[{year:3,id:'drought'}]},
  {name:'狼のいる大陸',years:8,mission:'ついに狼が登場。食物網全体を8年間維持しよう。判断イベントは2回。',start:{wolf:2,fox:4,deer:11,rabbit:17,grass:100,sapling:18},allowed:['wolf','fox','deer','rabbit','grass','sapling'],zones:{wolf:[1,5],fox:[2,9],deer:[6,22],rabbit:[8,32],grass:[40,150],sapling:[7,42]},minScore:60,required:{wolf:1,fox:1,deer:4,rabbit:5,plants:32},events:[{year:2.8,id:'disease'},{year:5.3,id:'migration'}]},
  {name:'変化する大陸',years:10,mission:'全ての生物がいる大陸を、連続する環境変化の中で10年間守り抜こう。',start:{wolf:3,fox:5,deer:12,rabbit:18,grass:100,sapling:18},allowed:['wolf','fox','deer','rabbit','grass','sapling'],zones:{wolf:[2,6],fox:[3,10],deer:[8,24],rabbit:[10,38],grass:[45,145],sapling:[8,38]},minScore:64,required:{wolf:1,fox:1,deer:5,rabbit:6,plants:35},events:[{year:2,id:'drought'},{year:4.1,id:'fire'},{year:6.2,id:'disease'},{year:8,id:'migration'}]}
];

state.stageIndex=0;state.unlocked=0;state.stageDone=false;state.triggeredEvents=new Set();state.modalOpen=false;state.resumeAfterModal=true;state.plantBoostUntil=0;state.plantSlowUntil=0;
const currentStage=()=>STAGES[state.stageIndex];

function ensureStageUI(){
  const resetBtn=document.getElementById('resetBtn');if(resetBtn)resetBtn.textContent='この面をやり直す';
  const layout=document.querySelector('.layout');
  if(!document.getElementById('stageTitle')&&layout){
    const stage=document.createElement('section');stage.className='stage-card';
    stage.innerHTML=`<div class="stage-top"><div><p class="eyebrow" id="stageKicker">STAGE 1</p><h2 id="stageTitle">草原のはじまり</h2></div><div class="stage-state" id="stageState">挑戦中</div></div><p id="stageMission" class="stage-mission"></p><div class="stage-progress"><div id="stageProgressBar"></div></div><div class="stage-bottom"><span id="stageProgressText">0.0 / 4.0年</span><div id="stageButtons" class="stage-buttons"></div></div>`;
    layout.parentNode.insertBefore(stage,layout);
  }
  if(!document.getElementById('modalBackdrop')){
    const modal=document.createElement('div');modal.id='modalBackdrop';modal.className='modal-backdrop hidden';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
    modal.innerHTML=`<div class="modal-card"><p id="modalKicker" class="eyebrow">EVENT</p><h2 id="modalTitle"></h2><p id="modalText" class="modal-text"></p><div id="modalChoices" class="modal-choices"></div></div>`;document.body.appendChild(modal);
  }
  if(!document.getElementById('stage-system-style')){
    const style=document.createElement('style');style.id='stage-system-style';style.textContent=`.stage-card{background:rgba(255,253,248,.94);border:1px solid var(--line,#d4e1e7);border-radius:18px;box-shadow:var(--shadow,0 14px 32px rgba(44,72,86,.11));padding:12px 14px;margin-bottom:12px}.stage-top,.stage-bottom{display:flex;justify-content:space-between;align-items:center;gap:12px}.stage-state{font-size:11px;font-weight:900;padding:6px 9px;border-radius:999px;background:#eef7ef;color:#47875c;border:1px solid #d4e6d6}.stage-state.fail{background:#fff0ee;color:#b5574e;border-color:#f0d3d0}.stage-state.clear{background:#edf7ff;color:#356f91;border-color:#d2e7f3}.stage-mission{font-size:12px;color:var(--muted,#61727a);line-height:1.55;margin:7px 0 8px}.stage-progress{height:7px;background:#e9eff0;border-radius:999px;overflow:hidden}.stage-progress>div{height:100%;width:0;background:#47875c;border-radius:inherit;transition:width .25s}.stage-bottom{margin-top:7px;font-size:10px;color:var(--muted,#61727a)}.stage-buttons{display:flex;gap:5px}.stage-btn{width:28px;height:28px;border-radius:50%;border:1px solid var(--line,#d4e1e7);background:#fff;color:var(--muted,#61727a);font-weight:900;font-size:11px}.stage-btn.active{background:#29485b;color:#fff;border-color:#29485b}.stage-btn:disabled{opacity:.35}.modal-backdrop{position:fixed;inset:0;z-index:20;background:rgba(24,40,49,.48);display:grid;place-items:center;padding:18px}.modal-backdrop.hidden{display:none}.modal-card{width:min(480px,100%);background:#fffdf8;border:1px solid var(--line,#d4e1e7);border-radius:22px;box-shadow:0 24px 60px rgba(20,35,44,.25);padding:20px}.modal-card h2{font-size:22px;margin-bottom:8px}.modal-text{font-size:13px;color:var(--muted,#61727a);line-height:1.7;margin-bottom:14px}.modal-choices{display:grid;gap:9px}.choice-btn{border:1px solid var(--line,#d4e1e7);background:#fff;border-radius:15px;padding:12px;text-align:left;color:var(--ink,#20313a)}.choice-btn strong{display:block;font-size:13px}.choice-btn span{display:block;font-size:11px;color:var(--muted,#61727a);margin-top:4px;line-height:1.5}.choice-btn.primary{background:#29485b;color:#fff;border-color:#29485b}.choice-btn.primary span{color:rgba(255,255,255,.74)}@media(max-width:680px){.stage-bottom{align-items:flex-end}.stage-buttons{flex-wrap:wrap;justify-content:flex-end}}`;document.head.appendChild(style);
  }
}

function marginOnLand(x,y,margin=0){
  if(!ctx.isPointInPath(state.continent,x,y))return false;if(!margin)return true;
  const pts=[[margin,0],[-margin,0],[0,margin],[0,-margin],[margin*.7,margin*.7],[-margin*.7,margin*.7],[margin*.7,-margin*.7],[-margin*.7,-margin*.7]];
  return pts.every(([dx,dy])=>ctx.isPointInPath(state.continent,x+dx,y+dy));
}
function safeLandPoint(margin=0){for(let i=0;i<1600;i++){const p={x:rand(110,825),y:rand(85,555)};if(marginOnLand(p.x,p.y,margin))return p;}return{x:480,y:320};}

const baseCreateAnimal=createAnimal;
createAnimal=function(type,pos=null,newborn=false){const a=baseCreateAnimal(type,pos,newborn),m=SPECIES[type].radius+5;if(!marginOnLand(a.x,a.y,m)){const p=safeLandPoint(m);a.x=p.x;a.y=p.y;}return a;};
const baseMoveAnimal=moveAnimal;
moveAnimal=function(a,dtYears,dtSec){const oldX=a.x,oldY=a.y;baseMoveAnimal(a,dtYears,dtSec);const margin=a.radius+5;if(marginOnLand(a.x,a.y,margin))return;if(marginOnLand(oldX,oldY,margin)){a.x=oldX;a.y=oldY;}else{const p=safeLandPoint(margin);a.x=p.x;a.y=p.y;}const dx=470-a.x,dy=320-a.y,len=Math.max(1,Math.hypot(dx,dy)),sp=Math.max(SPECIES[a.type].speed*.45,Math.hypot(a.vx,a.vy));a.vx=dx/len*sp;a.vy=dy/len*sp;};

const baseStability=stability;
stability=function(c=counts()){const zones=currentStage()?.zones;if(!zones)return baseStability(c);let score=100;for(const[k,[lo,hi]]of Object.entries(zones)){const v=c[k]||0;if(v===0)score-=k==='grass'?20:14;else if(v<lo)score-=Math.min(18,(lo-v)/lo*18);else if(v>hi)score-=Math.min(18,(v-hi)/hi*18);}if((c.deer+c.rabbit)>45&&(c.grass+c.sapling)<35)score-=20;return Math.round(clamp(score,0,100));};

function renderStage(){const s=currentStage(),ratio=clamp(state.year/s.years,0,1);document.getElementById('stageKicker').textContent=`STAGE ${state.stageIndex+1}`;document.getElementById('stageTitle').textContent=s.name;document.getElementById('stageMission').textContent=s.mission;document.getElementById('stageProgressBar').style.width=`${ratio*100}%`;document.getElementById('stageProgressText').textContent=`${Math.min(state.year,s.years).toFixed(1)} / ${s.years.toFixed(1)}年`;const se=document.getElementById('stageState');if(!state.stageDone){se.className='stage-state';se.textContent='挑戦中';}document.getElementById('stageButtons').innerHTML=STAGES.map((_,i)=>`<button class="stage-btn ${i===state.stageIndex?'active':''}" data-stage="${i}" ${i>state.unlocked?'disabled':''}>${i+1}</button>`).join('');document.querySelectorAll('.stage-btn').forEach(b=>b.onclick=()=>startStage(Number(b.dataset.stage)));}

renderControls=function(){const order=['wolf','fox','deer','rabbit','grass','sapling'].filter(x=>currentStage().allowed.includes(x));document.getElementById('controls').innerHTML=order.map(type=>{const d=SPECIES[type]||PLANTS[type],n=ADD[type];return `<button class="control-btn" data-type="${type}"><strong>${d.icon} ${d.name} +${n}</strong><span>大陸へ追加</span></button>`;}).join('');document.querySelectorAll('.control-btn').forEach(btn=>btn.onclick=()=>addEntities(btn.dataset.type));};

function closeStageModal(resume=true){document.getElementById('modalBackdrop').classList.add('hidden');state.modalOpen=false;if(resume&&state.resumeAfterModal&&!state.stageDone)state.running=true;}
function startStage(index){
  state.stageIndex=clamp(index,0,STAGES.length-1);const s=currentStage();state.animals=[];state.plants=[];state.nutrients=[];state.particles=[];state.year=0;state.running=true;state.speedIndex=0;state.selectedId=null;state.log=[];state.stabilityHistory=[];state.stageDone=false;state.triggeredEvents=new Set();state.modalOpen=false;state.plantBoostUntil=0;state.plantSlowUntil=0;nextId=1;plantTimer=0;balanceTimer=0;
  for(const[type,n]of Object.entries(s.start)){for(let i=0;i<n;i++){if(SPECIES[type])state.animals.push(createAnimal(type));else state.plants.push(createPlant(type));}}
  addLog(`ステージ${state.stageIndex+1}「${s.name}」開始。`);ticker(s.mission);document.getElementById('pauseBtn').textContent='一時停止';document.getElementById('speedBtn').textContent='速度 ×1';renderControls();renderStage();renderSelected();updateHud(true);closeStageModal(false);
}
reset=function(){startStage(state.stageIndex);};

function removeFraction(type,fraction){const arr=state.animals.filter(a=>a.type===type).sort(()=>Math.random()-.5),remove=new Set(arr.slice(0,Math.floor(arr.length*fraction)).map(a=>a.id));state.animals=state.animals.filter(a=>!remove.has(a.id));return remove.size;}
function removePlantFraction(fraction){const arr=[...state.plants].sort(()=>Math.random()-.5),remove=new Set(arr.slice(0,Math.floor(arr.length*fraction)).map(p=>p.id));state.plants=state.plants.filter(p=>!remove.has(p.id));return remove.size;}
function feedGroup(type,amount){state.animals.filter(a=>a.type===type).forEach(a=>a.hunger=clamp(a.hunger+amount,0,100));}
function addGroup(type,n){for(let i=0;i<n;i++)if(state.animals.filter(a=>a.type===type).length<CAPS[type])state.animals.push(createAnimal(type,null,false));}

const EVENTS={
  drought:{title:'雨がほとんど降らない',text:'乾燥が続いている。植物を守るか、草食動物の水場を優先するか。どちらかは負担を受ける。',choices:[
    {title:'植物を優先して守る',desc:'植物の減少を抑える代わりに、鹿とうさぎの空腹が進む。',effect:()=>{removePlantFraction(.10);feedGroup('deer',-24);feedGroup('rabbit',-24);state.plantSlowUntil=state.year+1.2;addLog('乾燥：植物を守り、草食動物の負担が増えた。');}},
    {title:'水場を草食動物に開放',desc:'鹿とうさぎは回復するが、踏み荒らしで植物が大きく減る。',effect:()=>{removePlantFraction(.28);feedGroup('deer',28);feedGroup('rabbit',28);state.plantSlowUntil=state.year+.7;addLog('乾燥：草食動物を守り、植物が大きく減った。');}}]},
  disease:{title:'うさぎの群れに病気',text:'感染が広がり始めた。群れを早めに隔離するか、自然回復に賭けるか。',choices:[
    {title:'感染した群れを隔離',desc:'うさぎを約20%失うが、流行はそこで止まる。',effect:()=>{const n=removeFraction('rabbit',.20);addLog(`病気：${n}匹のうさぎを隔離し、流行を止めた。`);}},
    {title:'自然回復に任せる',desc:'被害は10〜40%のどこか。少なく済む可能性もある。',effect:()=>{const n=removeFraction('rabbit',rand(.10,.40));feedGroup('rabbit',12);addLog(`病気：自然回復を選び、うさぎが${n}匹減った。`);}}]},
  migration:{title:'外から狼の群れが来た',text:'2匹の狼が大陸に入ろうとしている。今の鹿や狐の数を見て判断しよう。',choices:[
    {title:'狼を受け入れる',desc:'狼が2匹増える。草食動物が多い時には助けになるが、餌が少ないと危険。',effect:()=>{addGroup('wolf',2);addLog('移動してきた狼2匹を受け入れた。');}},
    {title:'この群れは入れない',desc:'今いる個体数のまま維持する。捕食者不足なら後で草食動物が増えるかもしれない。',effect:()=>addLog('移動してきた狼を大陸には入れなかった。')}]},
  fire:{title:'乾いた草原で火災',text:'火をすぐ消すか、小さく燃やして土を更新するか。後者は今の植物を多く失うが、その後の回復は速い。',choices:[
    {title:'すぐに消火する',desc:'植物を約12%失う。回復速度は通常のまま。',effect:()=>{removePlantFraction(.12);addLog('火災を早期に消火した。');}},
    {title:'小規模な火入れに切り替える',desc:'植物を約30%失うが、その後約2年間は植物が増えやすくなる。',effect:()=>{removePlantFraction(.30);state.plantBoostUntil=state.year+2;for(let i=0;i<6;i++){const p=safeLandPoint(20);state.nutrients.push({x:p.x,y:p.y,remaining:4,timer:.1,life:2.4,type:'fire'});}addLog('火入れを行い、土の更新を選んだ。');}}]}
};

function openStageEvent(id){if(state.modalOpen||state.stageDone)return;const ev=EVENTS[id];state.modalOpen=true;state.resumeAfterModal=state.running;state.running=false;document.getElementById('modalKicker').textContent='ENVIRONMENT EVENT';document.getElementById('modalTitle').textContent=ev.title;document.getElementById('modalText').textContent=ev.text;document.getElementById('modalChoices').innerHTML=ev.choices.map((c,i)=>`<button class="choice-btn ${i===0?'primary':''}" data-choice="${i}"><strong>${c.title}</strong><span>${c.desc}</span></button>`).join('');document.getElementById('modalBackdrop').classList.remove('hidden');document.querySelectorAll('.choice-btn').forEach(btn=>btn.onclick=()=>{ev.choices[Number(btn.dataset.choice)].effect();closeStageModal(true);updateHud(true);});}
function checkStageEvents(){for(const e of currentStage().events){const key=e.id+e.year;if(state.year>=e.year&&!state.triggeredEvents.has(key)){state.triggeredEvents.add(key);openStageEvent(e.id);break;}}}

function stageRequirementsMet(){const c=counts(),r=currentStage().required,plants=c.grass+c.sapling;if(r.wolf&&c.wolf<r.wolf)return false;if(r.fox&&c.fox<r.fox)return false;if(r.deer&&c.deer<r.deer)return false;if(r.rabbit&&c.rabbit<r.rabbit)return false;if(r.plants&&plants<r.plants)return false;return stability(c)>=currentStage().minScore;}
function finishStage(){
  if(state.stageDone)return;state.stageDone=true;state.running=false;const ok=stageRequirementsMet(),s=currentStage(),status=document.getElementById('stageState');
  if(ok){status.className='stage-state clear';status.textContent='クリア';if(state.stageIndex<STAGES.length-1){state.unlocked=Math.max(state.unlocked,state.stageIndex+1);try{localStorage.setItem('ecosystem-unlocked-stage',String(state.unlocked));}catch(e){}}
    document.getElementById('modalKicker').textContent='STAGE CLEAR';document.getElementById('modalTitle').textContent=`「${s.name}」クリア！`;document.getElementById('modalText').textContent=`${s.years}年間、生態系を維持できた。次の面では生物や環境変化が増えていく。`;document.getElementById('modalChoices').innerHTML=state.stageIndex<STAGES.length-1?`<button id="nextStage" class="choice-btn primary"><strong>次のステージへ</strong><span>STAGE ${state.stageIndex+2} を始める</span></button><button id="replayStage" class="choice-btn"><strong>この面をもう一度</strong><span>別のバランスも試せます</span></button>`:`<button id="replayStage" class="choice-btn primary"><strong>最終ステージをもう一度</strong><span>別の選択を試す</span></button>`;document.getElementById('modalBackdrop').classList.remove('hidden');state.modalOpen=true;const n=document.getElementById('nextStage');if(n)n.onclick=()=>startStage(state.stageIndex+1);document.getElementById('replayStage').onclick=()=>startStage(state.stageIndex);
  }else{status.className='stage-state fail';status.textContent='失敗';document.getElementById('modalKicker').textContent='STAGE FAILED';document.getElementById('modalTitle').textContent='大陸のバランスが崩れた';document.getElementById('modalText').textContent=`終了時の安定度は${stability(counts())}。必要な生物を残し、植物量も確保してもう一度挑戦しよう。`;document.getElementById('modalChoices').innerHTML=`<button id="retryStage" class="choice-btn primary"><strong>この面をやり直す</strong><span>最初の状態から再挑戦</span></button>`;document.getElementById('modalBackdrop').classList.remove('hidden');state.modalOpen=true;document.getElementById('retryStage').onclick=()=>startStage(state.stageIndex);}
  renderStage();
}

const baseGrowPlants=growPlants;
growPlants=function(dtSec){if(state.year<state.plantBoostUntil)plantTimer+=dtSec*.65;if(state.year<state.plantSlowUntil)plantTimer-=dtSec*.22;baseGrowPlants(dtSec);};
const baseUpdate=update;
update=function(dtSec){baseUpdate(dtSec);if(!state.stageDone){checkStageEvents();renderStage();if(!state.modalOpen&&state.year>=currentStage().years)finishStage();}};

ensureStageUI();
try{state.unlocked=clamp(Number(localStorage.getItem('ecosystem-unlocked-stage')||0),0,STAGES.length-1);}catch(e){state.unlocked=0;}
startStage(0);
