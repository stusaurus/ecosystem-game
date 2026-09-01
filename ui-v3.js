// One-screen UI with inline intervention choices. No intervention modal.
(function(){
  const $=id=>document.getElementById(id);
  const AID_BY_STAGE=[['rabbit'],['rabbit','fox'],['rabbit','deer'],['fox','deer'],['fox']];
  let aidMode=false;
  let aidWasRunning=false;
  let infoWasRunning=false;

  function nutrient(){return typeof window.soilNutrientAmount==='function'?window.soilNutrientAmount():0;}

  function addStyles(){
    if($('ui-v3-style'))return;
    const s=document.createElement('style');
    s.id='ui-v3-style';
    s.textContent=`
      html,body{height:100%;overflow:hidden}
      .app{height:100dvh;max-width:980px;padding:calc(5px + env(safe-area-inset-top)) 7px calc(5px + env(safe-area-inset-bottom));display:flex;flex-direction:column;overflow:hidden}
      .topbar{flex:0 0 auto;margin-bottom:4px;min-height:36px}.topbar>div:first-child .eyebrow{display:none}.topbar h1{font-size:18px;white-space:nowrap}
      .top-buttons{gap:4px;flex-wrap:nowrap}.top-buttons .pill{padding:6px 8px;font-size:10px;min-height:32px}#resetBtn{display:none}
      .stage-card{flex:0 0 auto;margin:0 0 4px;padding:6px 8px;border-radius:13px}.stage-card .stage-top{min-height:25px}.stage-card .eyebrow{font-size:8px;margin-bottom:0}.stage-card h2{font-size:13px}.stage-mission{font-size:9px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:1px 0 3px!important}.stage-progress{height:4px!important}.stage-bottom{margin-top:2px!important;font-size:8px!important}.stage-buttons{gap:2px!important}.stage-btn{width:22px!important;height:22px!important;font-size:8px!important}.learning-block{display:none!important}
      .v3-reqs{flex:0 0 auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;margin:0 0 4px}.v3-req{min-width:0;border:1px solid #d8e1e3;background:#fff;border-radius:8px;padding:4px 3px;text-align:center;font-size:8px;font-weight:900;line-height:1.15;color:#6a787e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v3-req.ok{background:#edf8ef;border-color:#cfe4d4;color:#3f7b50}
      .layout{flex:1 1 auto;min-height:0;display:block!important}.world-card{height:100%;min-height:0;padding:5px;border-radius:14px;display:flex;flex-direction:column;overflow:hidden}.world-card>.section-head{flex:0 0 auto;justify-content:flex-end;min-height:24px;margin-bottom:2px}.world-card>.section-head>div:first-child{display:none}.badges{gap:4px;flex-wrap:nowrap}.badge{font-size:9px;padding:4px 6px;white-space:nowrap}#world{flex:1 1 auto;min-height:0;width:100%;height:auto;max-height:100%;border-radius:11px}.ticker{flex:0 0 auto;min-height:15px;margin-top:3px;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#selectedCard{display:none!important}.side-panel{display:none!important}
      .v3-toolbar{flex:0 0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:4px}.v3-btn{min-height:42px;border:1px solid #d4e1e7;border-radius:12px;background:#fff;color:#20313a;font-weight:900;font-size:11px;touch-action:manipulation;-webkit-appearance:none;appearance:none}.v3-btn.primary{background:#29485b;color:#fff;border-color:#29485b}.v3-btn.aid{background:#fff8df;border-color:#eadfae}.v3-btn:disabled{opacity:.38}
      .v3-overlay{position:fixed;inset:0;z-index:500;background:rgba(25,42,51,.58);display:grid;place-items:center;padding:10px}.v3-overlay.hidden{display:none!important}.v3-dialog{width:min(540px,100%);max-height:calc(100dvh - 20px);overflow:auto;background:#fffdf8;border:1px solid #d4e1e7;border-radius:20px;padding:12px}.v3-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.v3-head h2{font-size:17px;margin:0}.v3-close{width:44px;height:44px;border:1px solid #d4e1e7;border-radius:12px;background:#fff;font-size:20px;font-weight:900}.v3-section{border:1px solid #d4e1e7;border-radius:13px;background:#fff;padding:9px;margin-top:8px;font-size:11px;line-height:1.55}.v3-title{font-weight:900;margin-bottom:6px}.v3-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.v3-count{border:1px solid #d4e1e7;border-radius:10px;padding:6px;text-align:center}.v3-count b{display:block;font-size:14px}.v3-check{margin:4px 0}.v3-learning{background:#fff8d9;border-color:#eadfae}.v3-reset{width:100%;min-height:44px;margin-top:8px;border:1px solid #e1c9c5;border-radius:12px;background:#fff5f3;color:#995249;font-weight:900}
      @media(max-height:700px){.stage-mission,.stage-bottom,.ticker{display:none!important}.topbar{min-height:30px}.topbar h1{font-size:15px}.v3-btn{min-height:38px}.v3-req{padding:3px 2px}}
    `;
    document.head.appendChild(s);
  }

  function ensureUI(){
    addStyles();
    ['unifiedReqs','unifiedToolbar','unifiedOverlay','aidV3Sheet','compactToolbar','compactOverlay','aidSheet','cleanAidSheet'].forEach(id=>$(id)?.remove());
    if(!$('v3Reqs')){
      const req=document.createElement('div');req.id='v3Reqs';req.className='v3-reqs';
      const layout=document.querySelector('.layout');layout?.parentNode?.insertBefore(req,layout);
    }
    if(!$('v3Toolbar')){
      const t=document.createElement('div');t.id='v3Toolbar';t.className='v3-toolbar';document.querySelector('.app')?.appendChild(t);
    }
    if(!$('v3Overlay')){
      const o=document.createElement('div');o.id='v3Overlay';o.className='v3-overlay hidden';
      o.innerHTML='<div class="v3-dialog"><div class="v3-head"><h2 id="v3Title"></h2><button type="button" id="v3Close" class="v3-close">×</button></div><div id="v3Body"></div></div>';
      document.body.appendChild(o);$('v3Close').onclick=closeInfo;o.onclick=e=>{if(e.target===o)closeInfo();};
    }
    renderNormalToolbar();
  }

  function renderNormalToolbar(){
    aidMode=false;
    const t=$('v3Toolbar');if(!t)return;
    t.innerHTML='<button type="button" id="v3AidOpen" class="v3-btn primary">🐾 介入</button><button type="button" id="v3Detail" class="v3-btn">📊 現在の詳細</button><button type="button" id="v3Hint" class="v3-btn">💡 ヒント</button>';
    $('v3AidOpen').onclick=enterAidMode;$('v3Detail').onclick=()=>openInfo('detail');$('v3Hint').onclick=()=>openInfo('hint');
  }

  function enterAidMode(){
    if(state.stageDone||state.modalOpen)return;
    aidMode=true;aidWasRunning=!!state.running;state.running=false;
    const p=$('pauseBtn');if(p)p.textContent='再開';
    const list=AID_BY_STAGE[state.stageIndex]||[],t=$('v3Toolbar');if(!t)return;
    const cooldown=Math.max(0,(state.nextInterventionYear||0)-state.year);
    const buttons=list.map(type=>{
      const d=SPECIES[type],cost=AID_COST[type],amount=AID_AMOUNT[type];
      const disabled=(state.interventionPoints||0)<cost||cooldown>0;
      return `<button type="button" class="v3-btn aid" data-v3-aid="${type}" ${disabled?'disabled':''}>${d.icon} ${d.name} +${amount}</button>`;
    }).join('');
    t.innerHTML=buttons+'<button type="button" id="v3AidCancel" class="v3-btn">↩ 戻る</button>';
    t.querySelectorAll('[data-v3-aid]').forEach(btn=>{btn.onclick=()=>confirmAid(btn.dataset.v3Aid);});
    $('v3AidCancel').onclick=exitAidMode;
    ticker(cooldown>0?`次の介入まで ${cooldown.toFixed(1)}年。`:'介入する動物を選んでください。');
  }

  function confirmAid(type){
    if(!aidMode||state.stageDone||state.modalOpen)return;
    const list=AID_BY_STAGE[state.stageIndex]||[];if(!list.includes(type))return;
    const rule=AID_RULES[state.stageIndex],cost=AID_COST[type],amount=AID_AMOUNT[type],delay=AID_DELAY[type];
    const cooldown=Math.max(0,(state.nextInterventionYear||0)-state.year);
    if((state.interventionPoints||0)<cost){ticker('介入ポイントが足りません。');return;}
    if(cooldown>0){ticker(`次の介入まで ${cooldown.toFixed(1)}年。`);return;}
    if(!Array.isArray(state.pendingInterventions))state.pendingInterventions=[];
    state.interventionPoints-=cost;
    state.nextInterventionYear=state.year+rule.cooldown;
    state.pendingInterventions.push({type,amount,due:state.year+delay});
    const d=SPECIES[type];
    addLog(`${d.icon}${d.name}の支援を要請。${delay.toFixed(1)}年後に到着予定。`);
    ticker(`${d.icon}${d.name} +${amount} を要請。約${delay.toFixed(1)}年後に到着。`);
    exitAidMode();
  }

  function exitAidMode(){
    const resume=aidWasRunning;
    aidMode=false;aidWasRunning=false;renderNormalToolbar();
    if(resume&&!state.stageDone&&!state.modalOpen){state.running=true;const p=$('pauseBtn');if(p)p.textContent='一時停止';}
  }

  function openInfo(mode){
    if(state.stageDone||state.modalOpen)return;
    infoWasRunning=!!state.running;state.running=false;const p=$('pauseBtn');if(p)p.textContent='再開';
    $('v3Title').textContent=mode==='detail'?'現在の詳細':'ヒント';
    if(mode==='detail')renderDetail();else renderHint();$('v3Overlay').classList.remove('hidden');
  }
  function closeInfo(){
    $('v3Overlay')?.classList.add('hidden');
    if(infoWasRunning&&!state.stageDone&&!state.modalOpen){state.running=true;const p=$('pauseBtn');if(p)p.textContent='一時停止';}
    infoWasRunning=false;
  }

  function reqData(){
    const s=currentStage(),c=counts(),r=s.required||{},plants=c.grass+c.sapling,out=[];
    if(r.wolf)out.push({ok:c.wolf>=r.wolf,label:`🐺 ${c.wolf}/${r.wolf}`});if(r.fox)out.push({ok:c.fox>=r.fox,label:`🦊 ${c.fox}/${r.fox}`});if(r.deer)out.push({ok:c.deer>=r.deer,label:`🦌 ${c.deer}/${r.deer}`});if(r.rabbit)out.push({ok:c.rabbit>=r.rabbit,label:`🐇 ${c.rabbit}/${r.rabbit}`});if(r.plants)out.push({ok:plants>=r.plants,label:`🌿 ${plants}/${r.plants}`});
    const need=requiredStableYears();out.push({ok:stability(c)>=s.minScore,label:`⚖ ${stability(c)}/${s.minScore}`});out.push({ok:state.stableTime>=need,label:`🕰 ${state.stableTime.toFixed(1)}/${need.toFixed(1)}`});out.push({ok:state.year>=s.years,label:`⏱ ${Math.min(state.year,s.years).toFixed(1)}/${s.years}`});return out;
  }
  function renderReqs(){const e=$('v3Reqs');if(e)e.innerHTML=reqData().map(x=>`<div class="v3-req ${x.ok?'ok':''}">${x.ok?'✓ ':''}${x.label}</div>`).join('');updateNutrientBadge();}
  function updateNutrientBadge(){const b=document.querySelector('.badges');if(!b)return;let n=$('soilNutrientBadge');if(!n){n=document.createElement('span');n.id='soilNutrientBadge';n.className='badge';b.appendChild(n);}n.innerHTML=`土の栄養 <b>${nutrient()}</b>`;}

  function renderDetail(){
    const body=$('v3Body'),items=requirementSnapshot(),c=counts(),order=['wolf','fox','deer','rabbit','grass','sapling'].filter(k=>currentStage().allowed.includes(k));
    body.innerHTML=`<div class="v3-section"><div class="v3-title">🏁 クリア条件</div>${items.map(x=>`<div class="v3-check">${x.ok?'✅':'⬜️'} ${x.text} <small>${x.now}</small></div>`).join('')}</div><div class="v3-section"><div class="v3-title">🐾 個体数</div><div class="v3-grid">${order.map(k=>{const d=SPECIES[k]||PLANTS[k];return `<div class="v3-count">${d.icon} ${d.name}<b>${c[k]||0}</b></div>`;}).join('')}</div></div><div class="v3-section"><div class="v3-title">♻️ 命の循環</div>土の栄養：<b>${nutrient()}</b><br>植物 → 草食動物 → 肉食動物 → 死 → 土 → 植物</div><button type="button" id="v3Reset" class="v3-reset">この面を最初からやり直す</button>`;
    $('v3Reset').onclick=()=>{closeInfo();startStage(state.stageIndex);renderReqs();};
  }
  function renderHint(){const l=LEARNING[state.stageIndex],c=counts(),plants=c.grass+c.sapling;let hint=plants<(currentStage().required?.plants||0)?`🌿 緑が少ない。土の栄養は${nutrient()}。動物を増やしすぎず、再生の速さを見よう。`:'👀 増えている生き物と、その生き物が食べるものを順番に見よう。';$('v3Body').innerHTML=`<div class="v3-section v3-learning"><div class="v3-title">📘 ${l.theme}</div>${l.learn}</div><div class="v3-section"><div class="v3-title">💡 いまのヒント</div>${hint}</div><div class="v3-section"><b>考えてみよう：</b>${l.question}</div>`;}

  ensureUI();renderReqs();setInterval(renderReqs,500);
})();