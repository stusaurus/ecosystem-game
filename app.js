const SPECIES = [
  { id:"carnLarge", name:"肉食・大", icon:"🐺", sub:"繁殖：とても遅い", color:"#d9b4aa", width:42, step:1 },
  { id:"carnMed",   name:"肉食・中", icon:"🦊", sub:"繁殖：遅い",       color:"#e1c69d", width:50, step:2 },
  { id:"carnSmall", name:"肉食・小", icon:"🐸", sub:"繁殖：やや速い", color:"#d5daa7", width:58, step:4 },
  { id:"herbLarge", name:"草食・大", icon:"🦌", sub:"繁殖：遅い",       color:"#bcd6af", width:67, step:2 },
  { id:"herbMed",   name:"草食・中", icon:"🐇", sub:"繁殖：速い",       color:"#b7d9c9", width:76, step:5 },
  { id:"herbSmall", name:"草食・小", icon:"🐛", sub:"繁殖：とても速い", color:"#b9d8d4", width:87, step:10 },
  { id:"plants",    name:"植物",     icon:"🌱", sub:"生産者・土台",      color:"#a9cf9f", width:100, step:40 }
];

const BASE = {
  plants: 760,
  herbSmall: 120,
  herbMed: 62,
  herbLarge: 28,
  carnSmall: 34,
  carnMed: 15,
  carnLarge: 6
};

let state = {
  year: 0,
  pop: {...BASE},
  prevPop: {...BASE},
  actionsLeft: 3,
  stableYears: 0,
  history: [],
  report: null,
  won: false
};

const $ = (id) => document.getElementById(id);

function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
function round(v){ return Math.max(0, Math.round(v)); }

function showToast(msg){
  const el=$("toast");
  el.textContent=msg;
  el.classList.add("show");
  clearTimeout(showToast.t);
  showToast.t=setTimeout(()=>el.classList.remove("show"),1600);
}

function stabilityScore(pop, prev=pop){
  const keys=SPECIES.map(s=>s.id);
  const alive = keys.filter(k=>pop[k] > 0).length / keys.length;
  let changePenalty=0;
  keys.forEach(k=>{
    const p=Math.max(1,prev[k]);
    changePenalty += Math.min(1.5, Math.abs(pop[k]-prev[k])/p);
  });
  changePenalty /= keys.length;

  const zones = {
    plants:[350,1200],
    herbSmall:[35,260],
    herbMed:[18,150],
    herbLarge:[8,70],
    carnSmall:[8,90],
    carnMed:[4,40],
    carnLarge:[2,18]
  };
  let zoneScore=0;
  keys.forEach(k=>{
    const [lo,hi]=zones[k], v=pop[k];
    if(v>=lo && v<=hi) zoneScore+=1;
    else {
      const d=v<lo ? (lo-v)/lo : (v-hi)/hi;
      zoneScore += Math.max(0,1-d);
    }
  });
  zoneScore/=keys.length;

  const score = 100 * (0.46*zoneScore + 0.34*alive + 0.20*(1-clamp(changePenalty,0,1)));
  return round(clamp(score,0,100));
}

function forecastFor(id){
  if(state.year===0) return "flat";
  const now=state.pop[id], prev=state.prevPop[id];
  if(prev<=0 && now<=0) return "flat";
  const rate=(now-prev)/Math.max(1,prev);
  if(rate>0.08) return "up";
  if(rate<-0.08) return "down";
  return "flat";
}

function render(){
  $("year").textContent=state.year;
  const score=stabilityScore(state.pop,state.prevPop);
  $("stability").textContent=score;
  $("stabilityBar").style.width=score+"%";
  $("stabilityBar").style.background=score>=70 ? "var(--good)" : score>=45 ? "var(--warn)" : "var(--bad)";
  $("stableYears").textContent=state.stableYears;
  $("actionsLeft").textContent=state.actionsLeft;

  let status="生態系は大きく揺れています。原因を探そう。";
  if(score>=85) status="かなり安定しています。むやみに触らないのも選択肢。";
  else if(score>=70) status="安定圏です。この状態を維持できるかな？";
  else if(score>=45) status="少し不安定。増えすぎ・減りすぎを観察しよう。";
  if(state.won) status="クリア！ 10年間、安定した生態系を維持しました。";
  $("statusMessage").textContent=status;

  $("pyramid").innerHTML = SPECIES.map(s=>{
    const v=state.pop[s.id];
    return `<div class="tier ${v===0?"extinct":""}" style="width:${s.width}%;background:${s.color}">
      <div class="tier-left">
        <div class="emoji">${s.icon}</div>
        <div><div class="tier-name">${s.name}</div><div class="tier-sub">${s.sub}</div></div>
      </div>
      <div class="count">${v}</div>
    </div>`;
  }).join("");

  const arrow={up:"↗",down:"↘",flat:"→"};
  const word={up:"増加",down:"減少",flat:"安定"};
  $("forecastGrid").innerHTML=SPECIES.slice().reverse().map(s=>{
    const tr=forecastFor(s.id);
    return `<div class="forecast-item"><span>${s.icon} ${s.name}</span><span class="trend ${tr}" title="${word[tr]}">${arrow[tr]}</span></div>`;
  }).join("");

  $("controlGrid").innerHTML=SPECIES.slice().reverse().map(s=>{
    const disabled=state.actionsLeft<=0;
    return `<div class="control-row">
      <div class="control-label"><span>${s.icon}</span><span>${s.name}</span></div>
      <button class="adjust-btn" ${disabled?"disabled":""} data-id="${s.id}" data-dir="-1">−</button>
      <button class="adjust-btn" ${disabled?"disabled":""} data-id="${s.id}" data-dir="1">＋</button>
    </div>`;
  }).join("");

  document.querySelectorAll(".adjust-btn").forEach(btn=>{
    btn.addEventListener("click",()=>intervene(btn.dataset.id, Number(btn.dataset.dir)));
  });

  if(state.report) renderReport();
  else $("report").innerHTML='<div class="report-empty">まだ1年目は始まっていません。</div>';

  document.querySelector(".status-card").classList.toggle("win",state.won);
}

function intervene(id,dir){
  if(state.actionsLeft<=0) return showToast("今年の介入は3回使いました");
  const s=SPECIES.find(x=>x.id===id);
  const amount=s.step*dir;
  if(dir<0 && state.pop[id]===0) return showToast("これ以上減らせません");
  state.pop[id]=round(state.pop[id]+amount);
  state.actionsLeft--;
  showToast(`${s.name}を${dir>0?"増やした":"減らした"} ${Math.abs(amount)}`);
  render();
}

function applyEvent(pop){
  const events=[
    {p:.07,name:"☀️ 乾燥した年",desc:"植物の回復が弱まりました。",apply:()=>({plantGrowth:.72})},
    {p:.06,name:"🌧️ 恵みの雨",desc:"植物がよく育ちました。",apply:()=>({plantGrowth:1.28})},
    {p:.045,name:"🦠 草食動物の感染症",desc:"草食動物の自然死が増えました。",apply:()=>({herbDeath:1.7})},
    {p:.035,name:"🔥 小規模な山火事",desc:"植物が一部失われました。",apply:()=>{pop.plants=round(pop.plants*.78);return {};}}
  ];
  const roll=Math.random();
  let acc=0;
  for(const ev of events){
    acc+=ev.p;
    if(roll<acc){
      return {name:ev.name,desc:ev.desc,mod:ev.apply()};
    }
  }
  return null;
}

function simulateYear(){
  const before={...state.pop};
  let p={...state.pop};
  const detail={};
  const event=applyEvent(p);
  const mod=event?.mod || {};
  const plantGrowthMod=mod.plantGrowth || 1;
  const herbDeathMod=mod.herbDeath || 1;

  const K=1450;
  const r=0.88*plantGrowthMod;
  const growth=Math.max(0, p.plants*r*(1-p.plants/K));
  p.plants += growth;

  const herbCfg={
    herbSmall:{birth:.76,death:.22,need:1.45,starve:.68},
    herbMed:{birth:.46,death:.16,need:3.15,starve:.58},
    herbLarge:{birth:.23,death:.11,need:7.2,starve:.48}
  };
  const herbIds=Object.keys(herbCfg);
  const totalDemand=herbIds.reduce((a,id)=>a+p[id]*herbCfg[id].need,0);
  const foodRatio=clamp(p.plants/Math.max(1,totalDemand),0,1);
  const plantEaten=Math.min(p.plants,totalDemand);
  p.plants-=plantEaten;

  herbIds.forEach(id=>{
    const c=herbCfg[id], base=p[id];
    const births=base*c.birth*Math.pow(foodRatio,0.78);
    const starvation=base*c.starve*Math.pow(1-foodRatio,1.35);
    const natural=base*c.death*herbDeathMod;
    detail[id]={births,starvation,natural,predation:0};
    p[id]=Math.max(0,base+births-starvation-natural);
  });

  const carnCfg={
    carnSmall:{birth:.34,death:.17,need:1.7,starve:.60,prey:{herbSmall:1.0,herbMed:.18}},
    carnMed:{birth:.24,death:.14,need:2.8,starve:.55,prey:{herbSmall:.25,herbMed:1.0,herbLarge:.08}},
    carnLarge:{birth:.13,death:.10,need:4.8,starve:.50,prey:{herbMed:.28,herbLarge:1.0}}
  };

  Object.keys(carnCfg).forEach(id=>{
    const c=carnCfg[id], predators=p[id], need=predators*c.need;
    let available=0;
    Object.entries(c.prey).forEach(([prey,w])=>available+=p[prey]*w);
    const killTarget=Math.min(need, available*0.52);
    const weights=Object.entries(c.prey);
    const denom=weights.reduce((a,[prey,w])=>a+p[prey]*w,0);

    let actualKills=0;
    if(denom>0){
      weights.forEach(([prey,w])=>{
        const share=(p[prey]*w)/denom;
        const kills=Math.min(p[prey],killTarget*share);
        p[prey]-=kills;
        actualKills+=kills;
        if(detail[prey]) detail[prey].predation+=kills;
      });
    }
    const realizedFood=clamp(actualKills/Math.max(1,need),0,1);
    const births=predators*c.birth*Math.pow(realizedFood,.8);
    const starvation=predators*c.starve*Math.pow(1-realizedFood,1.3);
    const natural=predators*c.death;
    detail[id]={births,starvation,natural,predation:0};
    p[id]=Math.max(0,predators+births-starvation-natural);
  });

  Object.keys(p).forEach(k=>{
    p[k]=round(p[k]);
    if(p[k]<1) p[k]=0;
  });

  detail.plants={births:growth,starvation:0,natural:plantEaten,predation:0};

  state.prevPop=before;
  state.pop=p;
  state.year++;
  state.actionsLeft=3;

  const score=stabilityScore(state.pop,state.prevPop);
  if(score>=70) state.stableYears++;
  else state.stableYears=0;
  if(state.stableYears>=10) state.won=true;

  state.report={before,after:{...p},detail,event,score};
  state.history.push(state.report);
  render();

  const extinct=SPECIES.filter(s=>p[s.id]===0).map(s=>s.name);
  if(extinct.length) showToast(`絶滅：${extinct.join("・")}`);
  else if(state.won) showToast("生態系が10年間安定！クリア");
}

function renderReport(){
  const r=state.report;
  const eventHtml=r.event ? `<div class="event"><b>${r.event.name}</b><br>${r.event.desc}</div>` : "";
  const rows=SPECIES.slice().reverse().map(s=>{
    const b=r.before[s.id], a=r.after[s.id], d=a-b;
    const x=r.detail[s.id] || {};
    let why="";
    if(s.id==="plants"){
      why=`＋${round(x.births||0)} 回復 ／ −${round(x.natural||0)} 草食動物が消費`;
    } else {
      why=`＋${round(x.births||0)} 繁殖 ／ −${round(x.predation||0)} 捕食 ／ −${round(x.starvation||0)} 餓死 ／ −${round(x.natural||0)} 自然死`;
    }
    return `<div class="report-row">
      <div><div class="report-title">${s.icon} ${s.name}　${b} → ${a}</div><div class="report-detail">${why}</div></div>
      <div class="delta ${d>0?"pos":d<0?"neg":""}">${d>0?"+":""}${d}</div>
    </div>`;
  }).join("");
  $("report").innerHTML=eventHtml+`<div class="report-list">${rows}</div>`;
}

$("nextYearBtn").addEventListener("click",simulateYear);
$("resetBtn").addEventListener("click",()=>{
  if(!confirm("最初の生態系に戻しますか？")) return;
  state={year:0,pop:{...BASE},prevPop:{...BASE},actionsLeft:3,stableYears:0,history:[],report:null,won:false};
  render();
});

render();
