// Year-by-year decision game layer.
// Keeps the living simulation, but turns it into a clear decision -> observe -> result loop.
(function(){
  const $=id=>document.getElementById(id);
  const ORDER=['wolf','fox','deer','rabbit'];
  const MOVE_AMOUNT={wolf:1,fox:1,deer:1,rabbit:2};
  const ADD_AMOUNT={wolf:1,fox:1,deer:1,rabbit:2};

  const GOALS=[
    {title:'4年後も草原を残そう',detail:'🌿植物75以上・🐇うさぎ4〜18匹',plants:75,min:{rabbit:4},max:{rabbit:18}},
    {title:'狐とうさぎと草原を共存させよう',detail:'🌿植物85以上・🦊狐1〜6匹・🐇うさぎ5〜24匹',plants:85,min:{fox:1,rabbit:5},max:{fox:6,rabbit:24}},
    {title:'鹿とうさぎが暮らせる草原を守ろう',detail:'🌿植物95以上・🦊狐1〜6・🦌鹿4〜16・🐇うさぎ5〜22',plants:95,min:{fox:1,deer:4,rabbit:5},max:{fox:6,deer:16,rabbit:22}},
    {title:'狼までつながる食物網を守ろう',detail:'🌿植物105以上・4種類の動物を適正な数で残す',plants:105,min:{wolf:1,fox:1,deer:4,rabbit:5},max:{wolf:4,fox:7,deer:18,rabbit:24}},
    {title:'環境変化の中で生態系を立て直そう',detail:'🌿植物115以上・4種類の動物を適正な数で残す',plants:115,min:{wolf:1,fox:1,deer:5,rabbit:6},max:{wolf:5,fox:8,deer:20,rabbit:26}}
  ];

  function nutrient(){return typeof window.soilNutrientAmount==='function'?window.soilNutrientAmount():0;}
  function goal(){return GOALS[state.stageIndex]||GOALS[0];}
  function animalCounts(){
    const c=counts();
    return {wolf:c.wolf||0,fox:c.fox||0,deer:c.deer||0,rabbit:c.rabbit||0,grass:c.grass||0,sapling:c.sapling||0,plants:(c.grass||0)+(c.sapling||0)};
  }
  function snapshot(){
    const c=animalCounts();
    return {...c,nutrient:nutrient(),regrown:state.regrownFromNutrients||0,year:state.year};
  }
  function allowedAnimals(){
    return ORDER.filter(type=>currentStage().allowed.includes(type));
  }

  function goalFailures(c=animalCounts()){
    const g=goal(),miss=[];
    if(c.plants<g.plants)miss.push(`🌿植物 ${c.plants}/${g.plants}`);
    for(const [type,n] of Object.entries(g.min||{})){
      if((c[type]||0)<n)miss.push(`${SPECIES[type].icon}${SPECIES[type].name} ${c[type]||0}/${n}以上`);
    }
    for(const [type,n] of Object.entries(g.max||{})){
      if((c[type]||0)>n)miss.push(`${SPECIES[type].icon}${SPECIES[type].name} ${c[type]||0}/${n}以下`);
    }
    return miss;
  }
  function turnGoalMet(){return goalFailures().length===0;}

  function advice(){
    const c=animalCounts(),g=goal(),allowed=allowedAnimals();
    const herb=c.rabbit+c.deer;

    if(c.plants<g.plants+12){
      if(c.rabbit>(g.max.rabbit||99) || c.deer>(g.max.deer||99)){
        return '🌿 植物が危ない。増えすぎた草食動物を「移す」のが有効。';
      }
      if(allowed.includes('fox') && c.rabbit>(g.min.rabbit||0)+5 && c.fox<(g.min.fox||1)+1){
        return '🌿 植物が減っている。狐を増やすと、うさぎの増えすぎを抑えられる。';
      }
      return nutrient()>0
        ?'♻️ 土に栄養がある。動物を増やさず、植物の再生を見守るのも大事。'
        :'🌿 植物が少ない。今は動物を増やさず、数を抑える判断が安全。';
    }

    for(const [type,max] of Object.entries(g.max||{})){
      if((c[type]||0)>max){
        if(type==='rabbit'&&allowed.includes('fox'))return '🐇 うさぎが多い。狐を増やすか、うさぎを別の大陸へ移そう。';
        return `${SPECIES[type].icon} ${SPECIES[type].name}が多い。少し別の大陸へ移すとバランスを戻しやすい。`;
      }
    }
    for(const [type,min] of Object.entries(g.min||{})){
      if((c[type]||0)<min)return `${SPECIES[type].icon} ${SPECIES[type].name}が少ない。「増やす」で補う候補。`;
    }

    if(nutrient()>=4)return '♻️ 土の栄養が戻っている。今は「何もしない」で1年見るのもよさそう。';
    if(herb>22&&c.plants<g.plants+30)return '🌿 草食動物がやや多い。これ以上増やさず様子を見よう。';
    return '👀 今は大きく崩れていない。「何もしない」で1年見るのも立派な判断。';
  }

  function addStyles(){
    if($('turn-game-style'))return;
    const s=document.createElement('style');s.id='turn-game-style';
    s.textContent=`
      body.turn-game #speedBtn,body.turn-game #pauseBtn{display:none!important}
      body.turn-game #v3Reqs{display:none!important}
      body.turn-game .stage-mission{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;font-size:10px!important;font-weight:900;color:#29485b!important;margin:2px 0!important}
      .turn-guide{font-size:9px;line-height:1.35;color:#5e6e75;margin-top:3px;padding:5px 7px;border-radius:8px;background:#f4f8f9;border:1px solid #dce7ea}
      .turn-guide b{color:#20313a}
      .turn-choice{flex:0 0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:4px;padding:5px;border-radius:12px;background:#fff8df;border:1px solid #eadfae}
      .turn-choice.hidden{display:none!important}
      .turn-choice button{min-height:36px;border:1px solid #d4e1e7;border-radius:10px;background:#fff;font-size:10px;font-weight:900;color:#20313a;touch-action:manipulation}
      .turn-choice .back{background:#f3f5f6}
      #v3Toolbar.turn-toolbar{grid-template-columns:repeat(3,1fr)!important}
      #v3Toolbar.turn-toolbar .v3-btn{min-height:44px}
      #v3Toolbar.turn-toolbar .advance{background:#29485b;color:#fff;border-color:#29485b}
      #v3Toolbar.turn-toolbar .used{background:#edf8ef;color:#3f7b50;border-color:#cfe4d4}
      .turn-overlay{position:fixed;inset:0;z-index:760;background:rgba(24,40,49,.58);display:grid;place-items:center;padding:12px}
      .turn-overlay.hidden{display:none!important}
      .turn-card{width:min(520px,100%);max-height:calc(100dvh - 24px);overflow:auto;background:#fffdf8;border:1px solid #d4e1e7;border-radius:20px;padding:14px;box-shadow:0 22px 60px rgba(20,35,44,.28)}
      .turn-card h2{font-size:19px;margin:0 0 4px}.turn-sub{font-size:11px;color:#64747b;margin-bottom:9px}.turn-result-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin:8px 0}.turn-result-cell{border:1px solid #d8e1e3;border-radius:10px;padding:7px 4px;text-align:center;font-size:10px}.turn-result-cell b{display:block;font-size:14px;margin-top:2px}.turn-result-cell .up{color:#3f8554}.turn-result-cell .down{color:#b25a50}
      .turn-explain{border:1px solid #d8e1e3;border-radius:12px;background:#f5f9fa;padding:9px;font-size:11px;line-height:1.55;margin:8px 0}.turn-explain div+div{margin-top:4px}
      .turn-action-btn{width:100%;min-height:46px;border:0;border-radius:12px;background:#29485b;color:#fff;font-weight:900;font-size:13px;margin-top:6px}.turn-action-btn.secondary{background:#fff;color:#29485b;border:1px solid #cddce2}
      @media(max-height:700px){.turn-guide{font-size:8px;padding:3px 5px}.turn-choice button{min-height:32px}.turn-card{padding:10px}.turn-result-grid{margin:5px 0}.turn-explain{padding:7px;margin:5px 0}}
    `;document.head.appendChild(s);
  }

  function ensureUI(){
    addStyles();document.body.classList.add('turn-game');
    const app=document.querySelector('.app'),toolbar=$('v3Toolbar');
    if(toolbar)toolbar.classList.add('turn-toolbar');
    if(!$('turnChoice')){
      const p=document.createElement('div');p.id='turnChoice';p.className='turn-choice hidden';
      if(toolbar)app.insertBefore(p,toolbar);else app.appendChild(p);
    }
    if(!$('turnGuide')){
      const g=document.createElement('div');g.id='turnGuide';g.className='turn-guide';
      const mission=$('stageMission');mission?.insertAdjacentElement('afterend',g);
    }
    if(!$('turnOverlay')){
      const o=document.createElement('div');o.id='turnOverlay';o.className='turn-overlay hidden';
      o.innerHTML='<div class="turn-card" id="turnCard"></div>';document.body.appendChild(o);
    }
  }

  function setStageStatus(text,cls=''){
    const e=$('stageState');if(!e||state.stageDone)return;e.className=`stage-state ${cls}`.trim();e.textContent=text;
  }

  function renderTurnHeader(){
    ensureUI();const g=goal();
    const mission=$('stageMission');if(mission)mission.textContent=`🎯 ${g.title}`;
    const guide=$('turnGuide');if(guide)guide.innerHTML=`<b>成功ライン：</b>${g.detail}<br><b>今の見立て：</b>${advice()}`;
    const p=$('stageProgressText');
    if(p&&!state.stageDone){
      const y=Math.min(Math.floor(state.year+1e-6),currentStage().years);
      p.textContent=state.turnAdvancing?`${y}年目 → ${Math.min(y+1,currentStage().years)}年目を観察中`:`${y} / ${currentStage().years}年　次の判断をしよう`;
    }
    if(!state.stageDone)setStageStatus(state.turnAdvancing?'観察中':'判断待ち');
  }

  function renderToolbar(){
    ensureUI();const t=$('v3Toolbar');if(!t)return;
    t.className='v3-toolbar turn-toolbar';
    if(state.turnAdvancing){
      t.innerHTML='<button class="v3-btn" disabled>＋ 増やす</button><button class="v3-btn" disabled>－ 移す</button><button class="v3-btn advance" disabled>⏳ 1年を観察中…</button>';
      hideChoice();return;
    }
    const used=!!state.turnActionUsed;
    t.innerHTML=`<button type="button" id="turnAdd" class="v3-btn ${used?'used':''}" ${used?'disabled':''}>${used?'✓ 判断済み':'＋ 増やす'}</button><button type="button" id="turnRemove" class="v3-btn" ${used?'disabled':''}>－ 移す</button><button type="button" id="turnAdvance" class="v3-btn advance">${used?'▶ 1年進める':'👀 何もしないで1年'}</button>`;
    $('turnAdd').onclick=()=>showChoice('add');$('turnRemove').onclick=()=>showChoice('remove');$('turnAdvance').onclick=advanceYear;
  }

  function hideChoice(){const p=$('turnChoice');if(p){p.classList.add('hidden');p.innerHTML='';}}
  function showChoice(kind){
    if(state.turnAdvancing||state.turnActionUsed)return;
    const p=$('turnChoice');if(!p)return;const list=allowedAnimals(),c=animalCounts();
    p.classList.remove('hidden');
    p.innerHTML=list.map(type=>{
      const d=SPECIES[type],n=(kind==='add'?ADD_AMOUNT:MOVE_AMOUNT)[type];
      const disabled=kind==='remove'&&(c[type]||0)<n;
      return `<button type="button" data-turn-type="${type}" ${disabled?'disabled':''}>${kind==='add'?'+':'−'} ${d.icon}${d.name} ${n}</button>`;
    }).join('')+'<button type="button" class="back" id="turnChoiceBack">↩ 戻る</button>';
    p.querySelectorAll('[data-turn-type]').forEach(b=>b.onclick=()=>applyAction(kind,b.dataset.turnType));
    $('turnChoiceBack').onclick=hideChoice;
  }

  function applyAction(kind,type){
    if(state.turnAdvancing||state.turnActionUsed||!allowedAnimals().includes(type))return;
    const d=SPECIES[type],n=(kind==='add'?ADD_AMOUNT:MOVE_AMOUNT)[type];
    if(kind==='add'){
      for(let i=0;i<n;i++){
        if(state.animals.filter(a=>a.type===type).length>=CAPS[type])break;
        const a=createAnimal(type,null,false);a.hunger=72;a.meals=0;a.breedCooldown=Math.max(.7,d.breedCooldown*.8);state.animals.push(a);
      }
      state.turnActionLabel=`＋ ${d.icon}${d.name}${n}`;
      ticker(`${d.name}を${n}匹、この大陸へ移した。1年後どうなる？`);
    }else{
      const candidates=state.animals.filter(a=>a.type===type).sort(()=>Math.random()-.5).slice(0,n);
      const ids=new Set(candidates.map(a=>a.id));state.animals=state.animals.filter(a=>!ids.has(a.id));
      state.turnActionLabel=`－ ${d.icon}${d.name}${candidates.length}`;
      ticker(`${d.name}を${candidates.length}匹、別の大陸へ移した。死ではないので土の栄養にはならない。`);
    }
    state.turnActionUsed=true;hideChoice();updateHud(true);renderToolbar();renderTurnHeader();
  }

  function advanceYear(){
    if(state.turnAdvancing||state.stageDone)return;
    hideChoice();
    state.turnAdvancing=true;state.turnTargetYear=Math.min(currentStage().years,Math.floor(state.year+1e-6)+1);
    if(!state.turnActionUsed)state.turnActionLabel='👀 何もしない';
    state.speedIndex=2;state.running=true;state.turnPendingFinish=false;
    ticker(`${state.turnTargetYear}年目まで観察します。食べる・増える・死ぬ・再生する変化を見よう。`);
    renderToolbar();renderTurnHeader();
  }

  function deltaText(v){return v>0?`+${v}`:`${v}`;}
  function resultCells(before,after){
    const keys=allowedAnimals();let html='';
    for(const type of keys){
      const d=SPECIES[type],diff=(after[type]||0)-(before[type]||0),cls=diff>0?'up':diff<0?'down':'';
      html+=`<div class="turn-result-cell">${d.icon}${d.name}<b>${before[type]||0} → ${after[type]||0}</b><span class="${cls}">${deltaText(diff)}</span></div>`;
    }
    const pd=after.plants-before.plants,nd=after.nutrient-before.nutrient;
    html+=`<div class="turn-result-cell">🌿植物<b>${before.plants} → ${after.plants}</b><span class="${pd>0?'up':pd<0?'down':''}">${deltaText(pd)}</span></div>`;
    html+=`<div class="turn-result-cell">♻️土の栄養<b>${before.nutrient} → ${after.nutrient}</b><span class="${nd>0?'up':nd<0?'down':''}">${deltaText(nd)}</span></div>`;
    return html;
  }

  function explainYear(before,after){
    const lines=[],plantD=after.plants-before.plants,rabbitD=after.rabbit-before.rabbit,deerD=after.deer-before.deer,foxD=after.fox-before.fox,wolfD=after.wolf-before.wolf,nutrientD=after.nutrient-before.nutrient,regrownD=after.regrown-before.regrown;
    if(rabbitD>=3)lines.push('🐇 うさぎが大きく増えた。次の年は植物を食べる量が増えやすい。');
    if(deerD>=2)lines.push('🦌 鹿が増えた。うさぎと同じ植物を使うので、草原への負担が増える。');
    if((foxD>0||wolfD>0)&&(rabbitD<0||deerD<0))lines.push('🐺🦊 捕食者が増え、草食動物の増えすぎを抑える方向に働いた。');
    if(plantD<=-12)lines.push('🌿 植物が大きく減った。草食動物の数を抑える判断を考えよう。');
    else if(plantD<0)lines.push('🌿 植物は少し減った。まだ余裕があるか、次の年も確認しよう。');
    if(nutrientD>0)lines.push('♻️ 動物の死によって、体の栄養が土へ戻った。');
    if(regrownD>0)lines.push(`🌱 土の栄養から植物が${regrownD}つ再生した。死も生態系の循環の一部。`);
    if(plantD>0)lines.push('🌱 植物が増えた。土へ戻った栄養が次の命につながっている。');
    if(!lines.length)lines.push('👀 大きな変化はなかった。何もしないことがよい年もある。');
    return lines.slice(0,4);
  }

  function showYearResult(){
    const before=state.turnStartSnapshot||snapshot(),after=snapshot(),year=Math.round(state.turnTargetYear);
    state.turnLastSnapshot=after;state.running=false;ensureUI();
    const card=$('turnCard');
    card.innerHTML=`<h2>${year}年目の結果</h2><div class="turn-sub">あなたの判断：${state.turnActionLabel||'👀 何もしない'}</div><div class="turn-result-grid">${resultCells(before,after)}</div><div class="turn-explain">${explainYear(before,after).map(x=>`<div>${x}</div>`).join('')}</div><div class="turn-explain"><b>次の判断のヒント</b><div>${advice()}</div></div><button type="button" id="turnResultNext" class="turn-action-btn">${year>=currentStage().years?'ステージ結果を見る':'次の判断へ'}</button>`;
    $('turnOverlay').classList.remove('hidden');
    $('turnResultNext').onclick=()=>{
      $('turnOverlay').classList.add('hidden');
      if(year>=currentStage().years)finalizeStage();else beginDecision();
    };
  }

  function beginDecision(){
    state.turnActionUsed=false;state.turnActionLabel='';state.turnStartSnapshot=snapshot();state.turnPendingFinish=false;state.running=false;state.speedIndex=0;
    renderToolbar();renderTurnHeader();ticker(advice());
  }

  function finalizeStage(){
    state.stageDone=true;state.running=false;const ok=turnGoalMet(),g=goal(),c=animalCounts(),status=$('stageState');
    if(ok){
      if(status){status.className='stage-state clear';status.textContent='クリア';}
      if(state.stageIndex<STAGES.length-1){state.unlocked=Math.max(state.unlocked,state.stageIndex+1);try{localStorage.setItem('ecosystem-unlocked-stage',String(state.unlocked));}catch(e){}}
    }else if(status){status.className='stage-state fail';status.textContent='失敗';}
    renderStage();
    const misses=goalFailures(c),card=$('turnCard');
    if(ok){
      card.innerHTML=`<h2>🎉 STAGE ${state.stageIndex+1} クリア！</h2><div class="turn-sub">${g.title}</div><div class="turn-explain">最後の状態は成功ラインの中に収まった。次のステージでは、考える生き物や環境変化が増える。</div>${state.stageIndex<STAGES.length-1?'<button id="turnNextStage" class="turn-action-btn">次のステージへ</button>':''}<button id="turnReplay" class="turn-action-btn secondary">この面をもう一度</button>`;
      if($('turnNextStage'))$('turnNextStage').onclick=()=>{ $('turnOverlay').classList.add('hidden');startStage(state.stageIndex+1); };
    }else{
      card.innerHTML=`<h2>今回はバランスが崩れた</h2><div class="turn-sub">目標：${g.title}</div><div class="turn-explain"><b>届かなかったところ</b><div>${misses.join('、')}</div></div><div class="turn-explain"><b>次に試すなら</b><div>${advice()}</div></div><button id="turnReplay" class="turn-action-btn">最初からやり直す</button>`;
    }
    $('turnReplay').onclick=()=>{ $('turnOverlay').classList.add('hidden');startStage(state.stageIndex); };
    $('turnOverlay').classList.remove('hidden');
  }

  // Turn-mode owns the visible clear condition. Old stability-point conditions are no longer used.
  stageRequirementsMet=function(){return turnGoalMet();};

  const finishBeforeTurn=finishStage;
  finishStage=function(){
    if(!state.turnMode)return finishBeforeTurn();
    if(state.turnPendingFinish)return;
    state.turnPendingFinish=true;state.running=false;
  };

  const renderStageBeforeTurn=renderStage;
  renderStage=function(){renderStageBeforeTurn();if(state.turnMode)renderTurnHeader();};

  const updateBeforeTurn=update;
  update=function(dtSec){
    updateBeforeTurn(dtSec);
    if(!state.turnMode||!state.turnAdvancing)return;
    if(state.modalOpen)return; // environmental event is being answered
    if(state.year+1e-6>=state.turnTargetYear){
      state.year=state.turnTargetYear;state.running=false;state.turnAdvancing=false;updateHud(true);renderStage();renderToolbar();showYearResult();
    }
  };

  const startStageBeforeTurn=startStage;
  startStage=function(index){
    $('turnOverlay')?.classList.add('hidden');hideChoice();
    startStageBeforeTurn(index);
    state.turnMode=true;state.turnAdvancing=false;state.turnPendingFinish=false;state.running=false;state.speedIndex=0;state.turnActionUsed=false;state.turnActionLabel='';state.turnTargetYear=0;state.turnStartSnapshot=snapshot();
    ensureUI();renderToolbar();renderTurnHeader();ticker(advice());
  };

  state.turnMode=true;
  ensureUI();
  // Rebuild current stage once so all start-stage wrappers and turn state agree.
  startStage(state.stageIndex||0);
})();
