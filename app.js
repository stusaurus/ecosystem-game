const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
const VIEW_W = 960;
const VIEW_H = 640;
const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
canvas.width = VIEW_W * DPR;
canvas.height = VIEW_H * DPR;
ctx.scale(DPR, DPR);

const SPECIES = {
  wolf:   {name:'狼', icon:'🐺', radius:16, speed:72, adultAge:2.2, lifespan:[11,16], hungerDrain:28, foodGain:72, mealsToBreed:3, breedCooldown:2.0, offspring:1, diet:{deer:1.0,fox:.65,rabbit:.42}, fleeFrom:[]},
  fox:    {name:'狐', icon:'🦊', radius:14, speed:68, adultAge:1.4, lifespan:[7,11], hungerDrain:32, foodGain:68, mealsToBreed:2, breedCooldown:1.3, offspring:1, diet:{rabbit:1.0,deer:.24}, fleeFrom:['wolf']},
  deer:   {name:'鹿', icon:'🦌', radius:15, speed:57, adultAge:1.8, lifespan:[10,15], hungerDrain:25, foodGain:46, mealsToBreed:3, breedCooldown:1.2, offspring:1, diet:{grass:1.0,sapling:.75}, fleeFrom:['wolf','fox']},
  rabbit: {name:'うさぎ', icon:'🐇', radius:11, speed:78, adultAge:.55, lifespan:[4,7], hungerDrain:35, foodGain:43, mealsToBreed:2, breedCooldown:.7, offspring:2, diet:{grass:1.0}, fleeFrom:['wolf','fox']}
};

const PLANTS = {
  grass:{name:'草',icon:'🌿',radius:7,nutrition:1},
  sapling:{name:'木の芽',icon:'🌱',radius:8,nutrition:1.25}
};

const START = {wolf:3,fox:5,deer:12,rabbit:18,grass:100,sapling:18};
const CAPS = {wolf:20,fox:34,deer:55,rabbit:85,grass:180,sapling:55};
const ADD = {wolf:1,fox:1,deer:2,rabbit:3,grass:10,sapling:4};
const SPEEDS = [1,2,4];
const DEATH_PLANT_BONUS = {wolf:8,fox:6,deer:8,rabbit:3};

const state = {
  animals:[], plants:[], nutrients:[], particles:[],
  year:0, running:true, speedIndex:0, selectedId:null,
  continent:null, log:[], lastTicker:'',
  decorations:[], lastHud:0, stabilityHistory:[]
};

let nextId = 1;
let lastTs = 0;
let plantTimer = 0;
let balanceTimer = 0;

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rand=(a,b)=>a+Math.random()*(b-a);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const sqDist=(a,b)=>{const x=a.x-b.x,y=a.y-b.y;return x*x+y*y};

function continentPath(){
  const p=new Path2D();
  p.moveTo(145,130);
  p.bezierCurveTo(224,55,385,37,535,73);
  p.bezierCurveTo(710,113,849,206,816,334);
  p.bezierCurveTo(783,467,677,543,520,562);
  p.bezierCurveTo(365,581,216,542,140,457);
  p.bezierCurveTo(70,378,76,224,145,130);
  return p;
}

function pointOnLand(){
  for(let i=0;i<1000;i++){
    const p={x:rand(105,830),y:rand(78,558)};
    if(ctx.isPointInPath(state.continent,p.x,p.y)) return p;
  }
  return {x:480,y:320};
}

function createAnimal(type, pos=null, newborn=false){
  const d=SPECIES[type], p=pos||pointOnLand(), angle=rand(0,Math.PI*2);
  return {
    id:nextId++, type, x:p.x, y:p.y,
    vx:Math.cos(angle)*rand(d.speed*.35,d.speed*.65),
    vy:Math.sin(angle)*rand(d.speed*.35,d.speed*.65),
    age:newborn?0:rand(0,d.lifespan[0]*.55),
    maxAge:rand(d.lifespan[0],d.lifespan[1]),
    hunger:newborn?72:rand(58,100), meals:newborn?0:Math.floor(rand(0,d.mealsToBreed)),
    breedCooldown:newborn?d.adultAge:rand(0,d.breedCooldown),
    huntCooldown:0, starveTime:0, wanderTimer:rand(.4,1.4),
    radius:d.radius
  };
}

function createPlant(type,pos=null){
  const p=pos||pointOnLand();
  return {id:nextId++,type,x:p.x,y:p.y,radius:PLANTS[type].radius};
}

function reset(){
  state.continent=continentPath(); state.animals=[]; state.plants=[]; state.nutrients=[]; state.particles=[];
  state.year=0;state.running=true;state.speedIndex=0;state.selectedId=null;state.log=[];state.stabilityHistory=[];
  nextId=1;plantTimer=0;balanceTimer=0;
  for(const [type,n] of Object.entries(START)){
    for(let i=0;i<n;i++){
      if(SPECIES[type]) state.animals.push(createAnimal(type));
      else state.plants.push(createPlant(type));
    }
  }
  state.decorations=Array.from({length:18},()=>({x:rand(80,880),y:rand(40,600),w:rand(24,70),h:rand(5,13),a:rand(-.4,.4)}));
  addLog('新しい大陸が始まりました。');
  ticker('生き物をタップすると年齢や空腹度を見られます。');
  document.getElementById('pauseBtn').textContent='一時停止';
  document.getElementById('speedBtn').textContent='速度 ×1';
  renderSelected(); updateHud(true);
}

function counts(){
  const c={wolf:0,fox:0,deer:0,rabbit:0,grass:0,sapling:0};
  state.animals.forEach(a=>c[a.type]++); state.plants.forEach(p=>c[p.type]++); return c;
}

function stability(c=counts()){
  const zones={wolf:[2,6],fox:[3,10],deer:[8,24],rabbit:[10,38],grass:[45,145],sapling:[8,38]};
  let score=100;
  for(const [k,[lo,hi]] of Object.entries(zones)){
    const v=c[k];
    if(v===0) score-=k==='grass'?18:10;
    else if(v<lo) score-=Math.min(16,(lo-v)/lo*16);
    else if(v>hi) score-=Math.min(16,(v-hi)/hi*16);
  }
  if(c.wolf>0 && c.deer===0 && c.rabbit===0 && c.fox===0) score-=18;
  if((c.deer+c.rabbit)>45 && (c.grass+c.sapling)<35) score-=20;
  return Math.round(clamp(score,0,100));
}

function addLog(text){
  state.log.unshift({year:state.year.toFixed(1),text}); state.log=state.log.slice(0,20); renderLog();
}
function ticker(text){state.lastTicker=text;document.getElementById('ticker').textContent=text;}
function renderLog(){document.getElementById('log').innerHTML=state.log.map(x=>`<div class="log-item"><b>${x.year}年</b>　${x.text}</div>`).join('');}

function renderControls(){
  const order=['wolf','fox','deer','rabbit','grass','sapling'];
  document.getElementById('controls').innerHTML=order.map(type=>{
    const d=SPECIES[type]||PLANTS[type], n=ADD[type];
    return `<button class="control-btn" data-type="${type}"><strong>${d.icon} ${d.name} +${n}</strong><span>大陸へ追加</span></button>`;
  }).join('');
  document.querySelectorAll('.control-btn').forEach(btn=>btn.onclick=()=>addEntities(btn.dataset.type));
}

function addEntities(type){
  const amount=ADD[type], cap=CAPS[type];
  for(let i=0;i<amount;i++){
    const current=SPECIES[type]?state.animals.filter(a=>a.type===type).length:state.plants.filter(p=>p.type===type).length;
    if(current>=cap) break;
    if(SPECIES[type]) state.animals.push(createAnimal(type,null,true)); else state.plants.push(createPlant(type));
  }
  const d=SPECIES[type]||PLANTS[type]; addLog(`${d.icon}${d.name}を大陸に追加しました。`); ticker(`${d.name}を増やした。数年後どうなる？`); updateHud(true);
}

function nearestFood(a){
  const d=SPECIES[a.type]; let best=null,bestScore=Infinity;
  if(d.diet.grass||d.diet.sapling){
    for(const p of state.plants){
      const pref=d.diet[p.type]; if(!pref) continue;
      const score=sqDist(a,p)/pref; if(score<bestScore){bestScore=score;best=p;}
    }
  }else{
    for(const b of state.animals){
      if(a.id===b.id) continue; const pref=d.diet[b.type]; if(!pref) continue;
      const score=sqDist(a,b)/pref; if(score<bestScore){bestScore=score;best=b;}
    }
  }
  return best;
}

function nearestMate(a){
  const d=SPECIES[a.type];
  if(a.age<d.adultAge||a.meals<d.mealsToBreed||a.breedCooldown>0||a.hunger<62) return null;
  let best=null,bestD=Infinity;
  for(const b of state.animals){
    if(b.id===a.id||b.type!==a.type) continue;
    if(b.age<d.adultAge||b.meals<d.mealsToBreed||b.breedCooldown>0||b.hunger<62) continue;
    const dd=sqDist(a,b);if(dd<bestD){bestD=dd;best=b;}
  }
  return best;
}

function nearbyPredator(a){
  const threats=SPECIES[a.type].fleeFrom;if(!threats.length)return null;
  let nearest=null,best=125*125;
  for(const b of state.animals){if(!threats.includes(b.type))continue;const d=sqDist(a,b);if(d<best){best=d;nearest=b;}}
  return nearest;
}

function moveAnimal(a,dtYears,dtSec){
  const d=SPECIES[a.type]; let tx=0,ty=0,force=0;
  const threat=nearbyPredator(a);
  if(threat){tx=a.x-threat.x;ty=a.y-threat.y;force=1.4;}
  else{
    const mate=nearestMate(a);
    const food=(a.hunger<82||a.meals<d.mealsToBreed)?nearestFood(a):null;
    const target=mate||food;
    if(target){tx=target.x-a.x;ty=target.y-a.y;force=mate?1.0:1.12;}
  }
  if(force){const len=Math.max(1,Math.hypot(tx,ty));a.vx+=(tx/len)*d.speed*force*dtSec;a.vy+=(ty/len)*d.speed*force*dtSec;}
  a.wanderTimer-=dtSec;
  if(a.wanderTimer<=0){a.wanderTimer=rand(.5,1.5);const ang=rand(0,Math.PI*2);a.vx+=Math.cos(ang)*d.speed*.3;a.vy+=Math.sin(ang)*d.speed*.3;}
  const max=d.speed*(threat?1.16:1);const sp=Math.hypot(a.vx,a.vy);if(sp>max){a.vx=a.vx/sp*max;a.vy=a.vy/sp*max;}
  let nx=a.x+a.vx*dtSec,ny=a.y+a.vy*dtSec;
  if(ctx.isPointInPath(state.continent,nx,ny)){a.x=nx;a.y=ny;}else{a.vx*=-.75;a.vy*=-.75;nx=a.x+a.vx*dtSec;ny=a.y+a.vy*dtSec;if(ctx.isPointInPath(state.continent,nx,ny)){a.x=nx;a.y=ny;}}
  a.age+=dtYears;a.breedCooldown=Math.max(0,a.breedCooldown-dtYears);a.huntCooldown=Math.max(0,a.huntCooldown-dtYears);
  a.hunger=Math.max(0,a.hunger-d.hungerDrain*dtYears);
  if(a.hunger<=0)a.starveTime+=dtYears;else a.starveTime=Math.max(0,a.starveTime-dtYears*.5);
}

function eatAndBreed(){
  const removeAnimals=new Set(),removePlants=new Set(),births=[];
  for(const a of state.animals){
    if(removeAnimals.has(a.id))continue;const d=SPECIES[a.type];
    if(a.huntCooldown<=0&&a.hunger<94){
      if(d.diet.grass||d.diet.sapling){
        for(const p of state.plants){
          if(removePlants.has(p.id)||!d.diet[p.type])continue;
          if(dist(a,p)<=a.radius+p.radius+3){removePlants.add(p.id);a.hunger=clamp(a.hunger+d.foodGain*PLANTS[p.type].nutrition,0,100);a.meals++;a.huntCooldown=.08;ticker(`${d.icon}${d.name}が${PLANTS[p.type].name}を食べた。`);break;}
        }
      }else{
        for(const b of state.animals){
          if(a.id===b.id||removeAnimals.has(b.id)||!d.diet[b.type])continue;
          if(dist(a,b)<=a.radius+b.radius+2){removeAnimals.add(b.id);a.hunger=clamp(a.hunger+d.foodGain,0,100);a.meals++;a.huntCooldown=.12;ticker(`${d.icon}${d.name}が${SPECIES[b.type].icon}${SPECIES[b.type].name}を食べた。`);burst(b.x,b.y,'🍖');break;}
        }
      }
    }
  }
  state.animals=state.animals.filter(a=>!removeAnimals.has(a.id));state.plants=state.plants.filter(p=>!removePlants.has(p.id));

  const paired=new Set();
  for(let i=0;i<state.animals.length;i++){
    const a=state.animals[i],d=SPECIES[a.type];
    if(paired.has(a.id)||a.age<d.adultAge||a.meals<d.mealsToBreed||a.breedCooldown>0||a.hunger<62)continue;
    for(let j=i+1;j<state.animals.length;j++){
      const b=state.animals[j];
      if(paired.has(b.id)||b.type!==a.type||b.age<d.adultAge||b.meals<d.mealsToBreed||b.breedCooldown>0||b.hunger<62)continue;
      if(dist(a,b)<=a.radius+b.radius+6){
        const current=state.animals.filter(x=>x.type===a.type).length+births.filter(x=>x.type===a.type).length;if(current>=CAPS[a.type])break;
        for(let k=0;k<d.offspring&&current+k<CAPS[a.type];k++)births.push(createAnimal(a.type,{x:(a.x+b.x)/2+rand(-10,10),y:(a.y+b.y)/2+rand(-10,10)},true));
        a.meals=0;b.meals=0;a.breedCooldown=d.breedCooldown;b.breedCooldown=d.breedCooldown;a.hunger-=16;b.hunger-=16;paired.add(a.id);paired.add(b.id);
        addLog(`${d.icon}${d.name}が繁殖して${d.offspring}匹生まれました。`);ticker(`${d.icon}${d.name}の子どもが生まれた！`);burst((a.x+b.x)/2,(a.y+b.y)/2,'💛');break;
      }
    }
  }
  state.animals.push(...births);
}

function lifeAndDeath(){
  const survivors=[];
  for(const a of state.animals){
    const old=a.age>=a.maxAge, starved=a.starveTime>.45;
    if(old||starved){
      if(old){
        const amount=DEATH_PLANT_BONUS[a.type];state.nutrients.push({x:a.x,y:a.y,remaining:amount,timer:.08,life:3.2,type:a.type});
        addLog(`${SPECIES[a.type].icon}${SPECIES[a.type].name}が寿命を迎え、土に栄養が還りました。`);ticker(`自然死した場所から草木が増えていく。`);burst(a.x,a.y,'🍂');
      }else{burst(a.x,a.y,'💨');}
      if(state.selectedId===a.id)state.selectedId=null;
    }else survivors.push(a);
  }
  state.animals=survivors;
}

function updateNutrients(dtYears){
  for(const n of state.nutrients){
    n.life-=dtYears;n.timer-=dtYears;
    if(n.remaining>0&&n.timer<=0){
      n.timer=rand(.16,.36);n.remaining--;
      const angle=rand(0,Math.PI*2),r=rand(8,62),pos={x:n.x+Math.cos(angle)*r,y:n.y+Math.sin(angle)*r};
      if(ctx.isPointInPath(state.continent,pos.x,pos.y)){
        const type=Math.random()<.28?'sapling':'grass';if(state.plants.filter(p=>p.type===type).length<CAPS[type])state.plants.push(createPlant(type,pos));
      }
    }
  }
  state.nutrients=state.nutrients.filter(n=>n.life>0||n.remaining>0);
}

function growPlants(dtSec){
  plantTimer+=dtSec;if(plantTimer<.48)return;plantTimer=0;
  const c=counts();const total=c.grass+c.sapling;if(total>=CAPS.grass+CAPS.sapling)return;
  let amount=total<55?3:total<110?2:1;
  while(amount--){const type=Math.random()<.14?'sapling':'grass';if(c[type]<CAPS[type])state.plants.push(createPlant(type));}
}

function burst(x,y,symbol){for(let i=0;i<5;i++)state.particles.push({x,y,vx:rand(-16,16),vy:rand(-28,-8),life:.7,symbol});}
function updateParticles(dt){for(const p of state.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=22*dt;p.life-=dt;}state.particles=state.particles.filter(p=>p.life>0);}

function periodicBalance(dtYears){
  balanceTimer+=dtYears;if(balanceTimer<.8)return;balanceTimer=0;
  const c=counts(),s=stability(c);state.stabilityHistory.push(s);state.stabilityHistory=state.stabilityHistory.slice(-10);
  if(c.rabbit===0)addLog('うさぎが絶滅。狐の主な餌が減っています。');
  if(c.deer===0)addLog('鹿が絶滅。狼と狐の餌が減っています。');
  if(c.wolf===0)addLog('狼が絶滅。鹿や狐が増えやすくなります。');
  if(c.grass+c.sapling<25)addLog('植物が少ない。草食動物が飢え始めます。');
}

function update(dtSec){
  if(!state.running)return;const speed=SPEEDS[state.speedIndex],scaled=dtSec*speed,dtYears=scaled*.12;state.year+=dtYears;
  [...state.animals].forEach(a=>moveAnimal(a,dtYears,scaled));eatAndBreed();lifeAndDeath();updateNutrients(dtYears);growPlants(scaled);updateParticles(scaled);periodicBalance(dtYears);updateHud();renderSelected();
}

function updateHud(force=false){
  const now=performance.now();if(!force&&now-state.lastHud<150)return;state.lastHud=now;
  const c=counts(),s=stability(c);document.getElementById('yearLabel').textContent=state.year.toFixed(1);document.getElementById('stabilityLabel').textContent=s;
  const order=['wolf','fox','deer','rabbit','grass','sapling'];
  document.getElementById('stats').innerHTML=order.map(k=>{const d=SPECIES[k]||PLANTS[k];let sub='';if(SPECIES[k]){const arr=state.animals.filter(a=>a.type===k);const avg=arr.length?arr.reduce((z,a)=>z+a.age,0)/arr.length:0;sub=`平均年齢 ${avg.toFixed(1)}年`;}return `<div class="stat-row"><div class="stat-name">${d.icon} ${d.name}</div><div class="stat-number">${c[k]}</div>${sub?`<div class="stat-sub">${sub}</div>`:''}</div>`;}).join('');
}

function renderSelected(){
  const card=document.getElementById('selectedCard'),a=state.animals.find(x=>x.id===state.selectedId);if(!a){card.classList.add('hidden');card.innerHTML='';return;}
  const d=SPECIES[a.type],adult=a.age>=d.adultAge,ready=adult&&a.meals>=d.mealsToBreed&&a.breedCooldown<=0&&a.hunger>=62;
  card.classList.remove('hidden');card.innerHTML=`<div class="selected-title">${d.icon} ${d.name} #${a.id}</div><div class="selected-grid"><span>年齢：${a.age.toFixed(1)} / 約${a.maxAge.toFixed(1)}年</span><span>空腹度：${Math.round(a.hunger)}%</span><span>食事：${a.meals} / ${d.mealsToBreed}</span><span>状態：${!adult?'子ども':ready?'繁殖可能':a.hunger<35?'空腹':'成獣'}</span></div>`;
}

function drawBackground(){
  const g=ctx.createLinearGradient(0,0,0,VIEW_H);g.addColorStop(0,'#8fd2f7');g.addColorStop(1,'#c5eafb');ctx.fillStyle=g;ctx.fillRect(0,0,VIEW_W,VIEW_H);
  ctx.fillStyle='rgba(255,255,255,.22)';for(const d of state.decorations){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.a);ctx.beginPath();ctx.ellipse(0,0,d.w,d.h,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.save();ctx.shadowColor='rgba(40,70,50,.15)';ctx.shadowBlur=18;ctx.fillStyle='#b9d58e';ctx.strokeStyle='#86ad68';ctx.lineWidth=3;ctx.fill(state.continent);ctx.stroke(state.continent);ctx.restore();
  ctx.save();ctx.clip(state.continent);ctx.fillStyle='rgba(91,148,83,.12)';ctx.beginPath();ctx.ellipse(330,260,180,95,.12,0,Math.PI*2);ctx.ellipse(610,244,150,82,-.2,0,Math.PI*2);ctx.ellipse(510,445,230,90,.05,0,Math.PI*2);ctx.fill();ctx.restore();
  for(const n of state.nutrients){ctx.beginPath();ctx.fillStyle='rgba(104,78,48,.16)';ctx.arc(n.x,n.y,34,0,Math.PI*2);ctx.fill();}
}

function drawEntity(e){
  const d=SPECIES[e.type]||PLANTS[e.type];ctx.save();ctx.translate(e.x,e.y);
  if(SPECIES[e.type]){ctx.beginPath();ctx.fillStyle='rgba(0,0,0,.13)';ctx.ellipse(0,e.radius+6,e.radius*.85,e.radius*.35,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.fillStyle='rgba(255,255,255,.75)';ctx.arc(0,0,e.radius+3,0,Math.PI*2);ctx.fill();if(state.selectedId===e.id){ctx.strokeStyle='#244d64';ctx.lineWidth=3;ctx.stroke();}ctx.font=`${e.radius+13}px Apple Color Emoji,Segoe UI Emoji,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(d.icon,0,1);
    const hp=clamp(e.hunger/100,0,1);ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillRect(-e.radius,-e.radius-11,e.radius*2,4);ctx.fillStyle=hp>.55?'#4ca668':hp>.25?'#e4ad43':'#c85c50';ctx.fillRect(-e.radius,-e.radius-11,e.radius*2*hp,4);
  }else{ctx.font=`${e.type==='sapling'?19:16}px Apple Color Emoji,Segoe UI Emoji,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(d.icon,0,0);}
  ctx.restore();
}
function draw(){drawBackground();state.plants.forEach(drawEntity);state.animals.forEach(drawEntity);for(const p of state.particles){ctx.save();ctx.globalAlpha=clamp(p.life/.7,0,1);ctx.font='17px Apple Color Emoji,Segoe UI Emoji,sans-serif';ctx.fillText(p.symbol,p.x,p.y);ctx.restore();}}

function pointerSelect(ev){
  const r=canvas.getBoundingClientRect(),x=(ev.clientX-r.left)*VIEW_W/r.width,y=(ev.clientY-r.top)*VIEW_H/r.height;let best=null,bd=38*38;
  for(const a of state.animals){const d=(a.x-x)**2+(a.y-y)**2;if(d<bd){bd=d;best=a;}}
  state.selectedId=best?.id||null;renderSelected();
}

function bind(){
  document.getElementById('pauseBtn').onclick=()=>{state.running=!state.running;document.getElementById('pauseBtn').textContent=state.running?'一時停止':'再開';ticker(state.running?'観察を再開。':'停止中。今の個体数を確認しよう。');};
  document.getElementById('resetBtn').onclick=()=>reset();
  document.getElementById('speedBtn').onclick=()=>{state.speedIndex=(state.speedIndex+1)%SPEEDS.length;document.getElementById('speedBtn').textContent=`速度 ×${SPEEDS[state.speedIndex]}`;};
  canvas.addEventListener('pointerdown',pointerSelect);
}

function loop(ts){if(!lastTs)lastTs=ts;const dt=Math.min(.035,(ts-lastTs)/1000);lastTs=ts;update(dt);draw();requestAnimationFrame(loop);}

renderControls();bind();reset();requestAnimationFrame(loop);
