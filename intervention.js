// Intervention limits and sustained-stability rules.
const AID_RULES=[
  {points:5,cooldown:.35,stableRatio:.50},
  {points:4,cooldown:.55,stableRatio:.58},
  {points:4,cooldown:.75,stableRatio:.64},
  {points:3,cooldown:.95,stableRatio:.70},
  {points:3,cooldown:1.15,stableRatio:.76}
];
const AID_COST={wolf:3,fox:2,deer:2,rabbit:1,grass:1,sapling:1};
const AID_AMOUNT={wolf:1,fox:1,deer:1,rabbit:2,grass:8,sapling:3};
const AID_DELAY={wolf:.65,fox:.55,deer:.50,rabbit:.38,grass:.18,sapling:.25};

function initAidState(){
  const rule=AID_RULES[state.stageIndex];
  state.interventionPoints=rule.points;
  state.nextInterventionYear=0;
  state.pendingInterventions=[];
  state.stableTime=0;
  state.crisisTime=0;
  state._aidControlTick=-1;
}

const stageStartBeforeAid=startStage;
startStage=function(index){
  stageStartBeforeAid(index);
  initAidState();
  renderControls();
  renderStage();
};

const stageRenderBeforeAid=renderStage;
renderStage=function(){
  stageRenderBeforeAid();
  const s=currentStage(),rule=AID_RULES[state.stageIndex];
  const el=document.getElementById('stageProgressText');
  if(el)el.textContent=`${Math.min(state.year,s.years).toFixed(1)} / ${s.years.toFixed(1)}年　安定 ${state.stableTime.toFixed(1)}年 / 必要 ${(s.years*rule.stableRatio).toFixed(1)}年`;
};

renderControls=function(){
  const order=['wolf','fox','deer','rabbit','grass','sapling'].filter(x=>currentStage().allowed.includes(x));
  const rule=AID_RULES[state.stageIndex];
  const cooldown=Math.max(0,state.nextInterventionYear-state.year);
  const pending=state.pendingInterventions.length;
  const box=document.getElementById('controls');
  if(!box)return;
  box.innerHTML=`<div style="grid-column:1/-1;border:1px solid var(--line,#d4e1e7);border-radius:13px;padding:9px 10px;background:#f7fbfd;margin-bottom:1px"><div style="display:flex;justify-content:space-between;gap:8px;font-size:11px;font-weight:800"><span>介入ポイント ${state.interventionPoints} / ${rule.points}</span><span>${cooldown>0?`次の介入まで ${cooldown.toFixed(1)}年`:'介入可能'}</span></div><div style="font-size:10px;color:var(--muted,#61727a);margin-top:3px">この面で使えるポイントは戻りません。支援もすぐには到着しません。${pending?` 到着待ち ${pending}件。`:''}</div></div>`+order.map(type=>{
    const d=SPECIES[type]||PLANTS[type],cost=AID_COST[type],n=AID_AMOUNT[type];
    const disabled=state.interventionPoints<cost||cooldown>0||state.stageDone||state.modalOpen;
    return `<button class="control-btn" data-type="${type}" ${disabled?'disabled':''}><strong>${d.icon} ${d.name} +${n}</strong><span>消費 ${cost}pt${state.interventionPoints<cost?'・ポイント不足':''}</span></button>`;
  }).join('');
  box.querySelectorAll('.control-btn').forEach(btn=>btn.onclick=()=>addEntities(btn.dataset.type));
};

addEntities=function(type){
  if(state.stageDone||state.modalOpen)return;
  const rule=AID_RULES[state.stageIndex],cost=AID_COST[type];
  if(state.interventionPoints<cost){ticker('介入ポイントが足りない。自然回復を待つ判断も必要。');return;}
  if(state.year<state.nextInterventionYear){ticker(`次の介入はあと${(state.nextInterventionYear-state.year).toFixed(1)}年後。`);return;}
  state.interventionPoints-=cost;
  state.nextInterventionYear=state.year+rule.cooldown;
  state.pendingInterventions.push({type,amount:AID_AMOUNT[type],due:state.year+AID_DELAY[type]});
  const d=SPECIES[type]||PLANTS[type];
  addLog(`${d.icon}${d.name}の支援を要請。${AID_DELAY[type].toFixed(1)}年後に到着予定。`);
  ticker(`${d.name}はすぐには増えない。到着まで大陸を持ちこたえよう。`);
  renderControls();
};

function deliverAid(){
  const ready=state.pendingInterventions.filter(x=>state.year>=x.due);
  if(!ready.length)return;
  state.pendingInterventions=state.pendingInterventions.filter(x=>state.year<x.due);
  for(const req of ready){
    const type=req.type,d=SPECIES[type]||PLANTS[type],cap=CAPS[type];let added=0;
    for(let i=0;i<req.amount;i++){
      const current=SPECIES[type]?state.animals.filter(a=>a.type===type).length:state.plants.filter(p=>p.type===type).length;
      if(current>=cap)break;
      if(SPECIES[type]){
        const a=createAnimal(type,null,false);
        a.age=rand(SPECIES[type].adultAge,SPECIES[type].adultAge+1.1);
        a.hunger=55;
        a.meals=0;
        a.breedCooldown=Math.max(.8,SPECIES[type].breedCooldown*.7);
        state.animals.push(a);
      }else state.plants.push(createPlant(type));
      added++;
    }
    addLog(`${d.icon}${d.name}の支援が到着し、${added}追加された。`);
    ticker(`${d.name}が到着。ただし移入直後は繁殖しにくい。`);
  }
  renderControls();
}

function aidViableNow(){
  const c=counts(),r=currentStage().required,plants=c.grass+c.sapling;
  if(r.wolf&&c.wolf<r.wolf)return false;
  if(r.fox&&c.fox<r.fox)return false;
  if(r.deer&&c.deer<r.deer)return false;
  if(r.rabbit&&c.rabbit<r.rabbit)return false;
  if(r.plants&&plants<r.plants)return false;
  return stability(c)>=currentStage().minScore;
}

const requirementsBeforeAid=stageRequirementsMet;
stageRequirementsMet=function(){
  const rule=AID_RULES[state.stageIndex];
  if(state.stableTime<currentStage().years*rule.stableRatio)return false;
  return requirementsBeforeAid();
};

const finishBeforeAid=finishStage;
finishStage=function(){
  finishBeforeAid();
  const rule=AID_RULES[state.stageIndex],need=currentStage().years*rule.stableRatio;
  const status=document.getElementById('stageState');
  if(status&&status.classList.contains('fail')&&state.stableTime<need){
    const text=document.getElementById('modalText');
    if(text)text.textContent=`終了時だけ整えてもクリアにはなりません。安定していたのは${state.stableTime.toFixed(1)}年で、この面では${need.toFixed(1)}年以上が必要です。`;
  }
};

const updateBeforeAid=update;
update=function(dtSec){
  const before=state.year;
  updateBeforeAid(dtSec);
  const dy=Math.max(0,state.year-before);
  if(state.stageDone)return;
  deliverAid();
  if(aidViableNow())state.stableTime+=dy;else state.crisisTime+=dy;
  const tick=Math.floor(state.year*10);
  if(tick!==state._aidControlTick){state._aidControlTick=tick;renderControls();renderStage();}
};

// stage.js already started stage 1 before this file loaded.
initAidState();
renderControls();
renderStage();