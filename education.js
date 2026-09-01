// Elementary-school learning UI and animal-only intervention rules.
const LEARNING = [
  {
    theme:'植物と草食動物のつながり',
    learn:'うさぎが増えると草はどうなる？ 植物と動物は、おたがいの数に影響します。',
    question:'うさぎを増やしすぎると、しばらく後に何が起こるかな？'
  },
  {
    theme:'食べる・食べられる関係',
    learn:'狐がうさぎを食べることで、うさぎの増えすぎをおさえることがあります。',
    question:'狐がいなくなると、うさぎと植物はどう変わるかな？'
  },
  {
    theme:'同じ食べ物を使う生き物',
    learn:'鹿とうさぎは、どちらも植物を食べます。食べ物をめぐる競争にも注目しよう。',
    question:'鹿とうさぎが両方増えたら、植物はどうなるかな？'
  },
  {
    theme:'食物連鎖から食物網へ',
    learn:'狼・狐・鹿・うさぎがつながると、1種類の変化が大陸全体へ広がります。',
    question:'狼が減ったとき、最初に増えそうなのはどの動物かな？'
  },
  {
    theme:'環境の変化と生態系',
    learn:'干ばつや火事などが起きても、生き物どうしのつながりを考えると立て直し方が見えてきます。',
    question:'事件が起きたとき、すぐ動物を増やすのと見守るのは、どちらがよいかな？'
  }
];

function requiredStableYears(){
  const s=currentStage(), rule=AID_RULES[state.stageIndex];
  return s.years*rule.stableRatio;
}

function requirementSnapshot(){
  const s=currentStage(), c=counts(), r=s.required, plants=c.grass+c.sapling;
  const items=[];
  const currentScore=stability(c);
  if(r.wolf) items.push({ok:c.wolf>=r.wolf,text:`🐺 狼が ${r.wolf}匹以上いる`,now:`いま ${c.wolf}匹`});
  if(r.fox) items.push({ok:c.fox>=r.fox,text:`🦊 狐が ${r.fox}匹以上いる`,now:`いま ${c.fox}匹`});
  if(r.deer) items.push({ok:c.deer>=r.deer,text:`🦌 鹿が ${r.deer}匹以上いる`,now:`いま ${c.deer}匹`});
  if(r.rabbit) items.push({ok:c.rabbit>=r.rabbit,text:`🐇 うさぎが ${r.rabbit}匹以上いる`,now:`いま ${c.rabbit}匹`});
  if(r.plants) items.push({ok:plants>=r.plants,text:`🌿🌱 草と木の芽が合計 ${r.plants}以上ある`,now:`いま ${plants}`});
  const need=requiredStableYears();
  items.push({ok:currentScore>=s.minScore,text:`⚖️ いまの安定度が ${s.minScore}以上`,now:`いま ${currentScore}`});
  items.push({ok:state.stableTime>=need,text:`🕰️ 安定した状態を ${need.toFixed(1)}年以上保つ`,now:`いま ${state.stableTime.toFixed(1)}年`});
  items.push({ok:state.year>=s.years,text:`⏱️ ${s.years}年間、大陸を見守る`,now:`いま ${Math.min(state.year,s.years).toFixed(1)}年`});
  return items;
}

function ensureLearningUI(){
  const card=document.querySelector('.stage-card');
  if(card && !document.getElementById('learningBlock')){
    const block=document.createElement('div');
    block.id='learningBlock';
    block.className='learning-block';
    const mission=document.getElementById('stageMission');
    if(mission) mission.insertAdjacentElement('afterend',block);
  }
  const controlPanel=document.getElementById('controls')?.closest('.panel');
  if(controlPanel){
    const title=controlPanel.querySelector('h2');
    if(title) title.textContent='動物への介入';
    const note=controlPanel.querySelector('.note');
    if(note) note.textContent='動物だけを保護・移入できます。草や木の芽は自然に増えるため、直接増やすことはできません。';
  }
  if(!document.getElementById('learning-style')){
    const style=document.createElement('style');
    style.id='learning-style';
    style.textContent=`
      .learning-block{margin:8px 0 10px;display:grid;gap:8px}
      .learning-theme{padding:9px 10px;border-radius:13px;background:#fff8d9;border:1px solid #eadfae;font-size:11px;line-height:1.55}
      .learning-theme b{display:block;color:#695617;font-size:12px;margin-bottom:2px}
      .clear-box{border:1px solid var(--line,#d4e1e7);border-radius:14px;background:#fff;padding:10px}
      .clear-title{font-size:12px;font-weight:900;margin-bottom:7px}
      .clear-list{display:grid;gap:6px}
      .clear-item{display:grid;grid-template-columns:22px 1fr auto;gap:6px;align-items:center;font-size:11px}
      .clear-mark{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#f1f4f5;color:#8a989e;font-weight:900}
      .clear-item.ok .clear-mark{background:#e6f5e9;color:#3f8554}
      .clear-now{font-size:10px;color:var(--muted,#61727a);white-space:nowrap}
      .think-box{font-size:11px;color:var(--muted,#61727a);padding:8px 10px;border-left:3px solid #6da0b6;background:#f3f9fc;border-radius:0 10px 10px 0;line-height:1.55}
      .plant-observe{grid-column:1/-1;border:1px dashed #b9d6b5;border-radius:12px;padding:8px 10px;background:#f5fbf2;font-size:10px;color:#587159;line-height:1.5}
    `;
    document.head.appendChild(style);
  }
}

function renderLearning(){
  ensureLearningUI();
  const block=document.getElementById('learningBlock');
  if(!block)return;
  const l=LEARNING[state.stageIndex];
  const items=requirementSnapshot();
  block.innerHTML=`
    <div class="learning-theme"><b>📘 この面で学ぶこと：${l.theme}</b>${l.learn}</div>
    <div class="clear-box">
      <div class="clear-title">🏁 クリア条件　<span style="font-weight:600;color:var(--muted,#61727a)">全部 ✓ になればクリア！</span></div>
      <div class="clear-list">${items.map(x=>`<div class="clear-item ${x.ok?'ok':''}"><span class="clear-mark">${x.ok?'✓':'・'}</span><span>${x.text}</span><span class="clear-now">${x.now}</span></div>`).join('')}</div>
    </div>
    <div class="think-box">💡 <b>考えてみよう：</b>${l.question}</div>
  `;
}

// Replace intervention controls: animals only. Plants must recover naturally.
renderControls=function(){
  ensureLearningUI();
  const animalOrder=['wolf','fox','deer','rabbit'].filter(x=>currentStage().allowed.includes(x));
  const rule=AID_RULES[state.stageIndex];
  const cooldown=Math.max(0,state.nextInterventionYear-state.year);
  const pending=state.pendingInterventions.length;
  const box=document.getElementById('controls');
  if(!box)return;
  let html=`<div style="grid-column:1/-1;border:1px solid var(--line,#d4e1e7);border-radius:13px;padding:9px 10px;background:#f7fbfd;margin-bottom:1px"><div style="display:flex;justify-content:space-between;gap:8px;font-size:11px;font-weight:800"><span>介入ポイント ${state.interventionPoints} / ${rule.points}</span><span>${cooldown>0?`次まで ${cooldown.toFixed(1)}年`:'介入可能'}</span></div><div style="font-size:10px;color:var(--muted,#61727a);margin-top:3px">動物だけ介入できます。使ったポイントはこの面では戻りません。${pending?` 到着待ち ${pending}件。`:''}</div></div>`;
  if(animalOrder.length===0){
    html+=`<div class="plant-observe">🌿 この面では植物の変化を観察しよう。草や木の芽を直接増やすことはできません。</div>`;
  } else {
    html+=animalOrder.map(type=>{
      const d=SPECIES[type],cost=AID_COST[type],n=AID_AMOUNT[type];
      const disabled=state.interventionPoints<cost||cooldown>0||state.stageDone||state.modalOpen;
      return `<button class="control-btn" data-type="${type}" ${disabled?'disabled':''}><strong>${d.icon} ${d.name} +${n}</strong><span>${cost}pt使用・到着に時間がかかる</span></button>`;
    }).join('');
    html+=`<div class="plant-observe">🌿🌱 草と木の芽は「自然に増えるもの」。動物の数を考えて、植物を食べ尽くさないようにしよう。</div>`;
  }
  box.innerHTML=html;
  box.querySelectorAll('.control-btn').forEach(btn=>btn.onclick=()=>addEntities(btn.dataset.type));
};

const renderStageBeforeLearning=renderStage;
renderStage=function(){
  renderStageBeforeLearning();
  renderLearning();
};

const updateBeforeLearning=update;
update=function(dtSec){
  updateBeforeLearning(dtSec);
  renderLearning();
};

const startStageBeforeLearning=startStage;
startStage=function(index){
  startStageBeforeLearning(index);
  ensureLearningUI();
  renderControls();
  renderLearning();
};

ensureLearningUI();
renderControls();
renderLearning();
