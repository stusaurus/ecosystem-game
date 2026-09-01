// Unified one-screen classroom UI: requirements, details, hints, and intervention.
(function(){
  const $=id=>document.getElementById(id);
  const AID_BY_STAGE=[
    ['rabbit'],
    ['rabbit','fox'],
    ['rabbit','deer'],
    ['fox','deer'],
    ['fox']
  ];
  let overlayWasRunning=false;
  let overlayMode=null;
  let aidLocked=false;

  function nutrient(){
    return typeof window.soilNutrientAmount==='function'?window.soilNutrientAmount():0;
  }

  function injectStyles(){
    if($('unified-ui-style'))return;
    const style=document.createElement('style');
    style.id='unified-ui-style';
    style.textContent=`
      html,body{height:100%;overflow:hidden}
      .app{height:100dvh;max-width:980px;padding:calc(5px + env(safe-area-inset-top)) 7px calc(5px + env(safe-area-inset-bottom));display:flex;flex-direction:column;overflow:hidden}
      .topbar{flex:0 0 auto;margin-bottom:4px;min-height:36px}.topbar>div:first-child .eyebrow{display:none}.topbar h1{font-size:18px;white-space:nowrap}
      .top-buttons{gap:4px;flex-wrap:nowrap}.top-buttons .pill{padding:6px 8px;font-size:10px;min-height:32px}#resetBtn{display:none}
      .stage-card{flex:0 0 auto;margin:0 0 4px;padding:6px 8px;border-radius:13px}.stage-card .stage-top{min-height:25px}.stage-card .eyebrow{font-size:8px;margin-bottom:0}.stage-card h2{font-size:13px}
      .stage-mission{font-size:9px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:1px 0 3px!important}.stage-progress{height:4px!important}.stage-bottom{margin-top:2px!important;font-size:8px!important}.stage-buttons{gap:2px!important}.stage-btn{width:22px!important;height:22px!important;font-size:8px!important}.learning-block{display:none!important}
      .unified-reqs{flex:0 0 auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;margin:0 0 4px}.unified-req{min-width:0;border:1px solid #d8e1e3;background:#fff;border-radius:8px;padding:4px 3px;text-align:center;font-size:8px;font-weight:900;line-height:1.15;color:#6a787e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.unified-req.ok{background:#edf8ef;border-color:#cfe4d4;color:#3f7b50}
      .layout{flex:1 1 auto;min-height:0;display:block!important}.world-card{height:100%;min-height:0;padding:5px;border-radius:14px;display:flex;flex-direction:column;overflow:hidden;position:relative}.world-card>.section-head{flex:0 0 auto;justify-content:flex-end;min-height:24px;margin-bottom:2px}.world-card>.section-head>div:first-child{display:none}.badges{gap:4px;flex-wrap:nowrap}.badge{font-size:9px;padding:4px 6px;white-space:nowrap}#world{flex:1 1 auto;min-height:0;width:100%;height:auto;max-height:100%;border-radius:11px}.ticker{flex:0 0 auto;min-height:15px;margin-top:3px;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#selectedCard{display:none!important}.side-panel{display:none!important}
      .unified-toolbar{flex:0 0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:4px}.unified-btn{min-height:42px;border:1px solid var(--line,#d4e1e7);border-radius:12px;background:#fff;color:var(--ink,#20313a);font-weight:900;font-size:11px;touch-action:manipulation}.unified-btn.primary{background:#29485b;color:#fff;border-color:#29485b}
      .unified-overlay{position:fixed;inset:0;z-index:500;background:rgba(25,42,51,.58);display:grid;place-items:center;padding:10px;touch-action:manipulation}.unified-overlay.hidden{display:none!important}.unified-dialog{width:min(540px,100%);max-height:calc(100dvh - 20px);overflow:auto;background:#fffdf8;border:1px solid #d4e1e7;border-radius:20px;padding:12px;box-shadow:0 24px 60px rgba(20,35,44,.3);-webkit-overflow-scrolling:touch}.unified-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}.unified-head h2{font-size:17px;margin:0}.unified-close{width:44px;height:44px;border:1px solid #d4e1e7;border-radius:12px;background:#fff;font-size:20px;font-weight:900;touch-action:manipulation}
      .u-section{border:1px solid #d4e1e7;border-radius:13px;background:#fff;padding:9px;margin-top:7px}.u-title{font-size:11px;font-weight:900;margin-bottom:6px}.u-checks{display:grid;grid-template-columns:1fr 1fr;gap:5px 8px}.u-check{display:grid;grid-template-columns:18px 1fr;gap:5px;align-items:start;font-size:10px;line-height:1.35}.u-check i{font-style:normal;width:18px;height:18px;border-radius:50%;display:grid;place-items:center;background:#f0f3f4;color:#85949a;font-weight:900}.u-check.ok i{background:#e4f4e8;color:#3f8554}.u-check small{display:block;color:#61727a;font-size:9px}.u-counts{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.u-count{border:1px solid #d4e1e7;border-radius:10px;padding:6px 7px;text-align:center;font-size:10px}.u-count b{display:block;font-size:14px;margin-top:1px}.u-learning{background:#fff8d9;border-color:#eadfae}.u-learning b{display:block;font-size:12px;margin-bottom:3px;color:#695617}.u-advice{font-size:11px;line-height:1.6}.u-hint{padding:7px 8px;border-radius:10px;background:#f4f9fb;margin-top:5px}.u-question{margin-top:7px;padding:7px 8px;border-left:3px solid #6da0b6;background:#f3f9fc;border-radius:0 9px 9px 0;font-size:10px;line-height:1.5}
      .u-aid-rule{padding:9px 10px;background:#fff8df;border:1px solid #eadfae;border-radius:11px;font-size:11px;font-weight:900;line-height:1.45;margin-bottom:8px}.u-aid-status{display:flex;justify-content:space-between;gap:8px;padding:8px 9px;background:#f3f8fa;border-radius:11px;font-size:11px;font-weight:900;margin-bottom:8px}.u-aid-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.u-aid{min-height:60px;border:1px solid #d4e1e7;border-radius:13px;background:#fff;text-align:left;padding:9px;color:#20313a;touch-action:manipulation}.u-aid strong{display:block;font-size:13px}.u-aid span{display:block;font-size:10px;color:#61727a;margin-top:4px}.u-aid:disabled{opacity:.38}.u-aid-note{margin-top:9px;padding:8px 9px;border:1px dashed #b9d6b5;background:#f5fbf2;border-radius:10px;font-size:10px;color:#587159;line-height:1.5}.u-back,.u-reset{width:100%;min-height:46px;margin-top:9px;border:0;border-radius:12px;background:#29485b;color:#fff;font-size:13px;font-weight:900;touch-action:manipulation}.u-reset{background:#fff5f3;color:#995249;border:1px solid #e1c9c5}
      @media(max-width:420px){.topbar h1{font-size:16px}.top-buttons .pill{padding:5px 7px;font-size:9px}.stage-card{padding:5px 7px}.unified-dialog{padding:9px}.unified-req{font-size:7.5px;padding:3px 2px}.u-checks{gap:4px 6px}.u-aid-grid{gap:6px}}
      @media(max-height:700px){.topbar{min-height:30px}.topbar h1{font-size:15px}.top-buttons .pill{min-height:29px;padding:4px 6px}.stage-mission{display:none}.stage-card{padding:4px 6px}.stage-bottom{display:none!important}.world-card>.section-head{min-height:22px}.unified-btn{min-height:38px}.ticker{display:none}.unified-req{padding:3px 2px}}
    `;
    document.head.appendChild(style);
  }

  function ensureUI(){
    injectStyles();
    document.getElementById('compactToolbar')?.remove();
    document.getElementById('compactOverlay')?.remove();
    document.getElementById('aidSheet')?.remove();
    document.getElementById('cleanAidSheet')?.remove();

    if(!$('unifiedReqs')){
      const req=document.createElement('div');req.id='unifiedReqs';req.className='unified-reqs';
      const layout=document.querySelector('.layout');layout?.parentNode?.insertBefore(req,layout);
    }
    if(!$('unifiedToolbar')){
      const bar=document.createElement('div');bar.id='unifiedToolbar';bar.className='unified-toolbar';
      bar.innerHTML='<button type="button" id="uAidOpen" class="unified-btn primary">🐾 介入</button><button type="button" id="uDetailOpen" class="unified-btn">📊 現在の詳細</button><button type="button" id="uHintOpen" class="unified-btn">💡 ヒント</button>';
      document.querySelector('.app')?.appendChild(bar);
    }
    if(!$('unifiedOverlay')){
      const ov=document.createElement('div');ov.id='unifiedOverlay';ov.className='unified-overlay hidden';
      ov.innerHTML='<div class="unified-dialog" role="dialog" aria-modal="true"><div class="unified-head"><h2 id="unifiedTitle"></h2><button type="button" id="unifiedClose" class="unified-close">×</button></div><div id="unifiedBody"></div></div>';
      document.body.appendChild(ov);
      $('unifiedClose').onclick=closeOverlay;
      ov.addEventListener('click',e=>{if(e.target===ov)closeOverlay();});
    }
    $('uAidOpen').onclick=()=>openOverlay('aid');
    $('uDetailOpen').onclick=()=>openOverlay('detail');
    $('uHintOpen').onclick=()=>openOverlay('hint');
  }

  function pauseForOverlay(){overlayWasRunning=!!state.running;state.running=false;const p=$('pauseBtn');if(p)p.textContent='再開';}
  function resumeAfterOverlay(){if(overlayWasRunning&&!state.stageDone&&!state.modalOpen){state.running=true;const p=$('pauseBtn');if(p)p.textContent='一時停止';}overlayWasRunning=false;}
  function closeOverlay(){aidLocked=false;$('unifiedOverlay')?.classList.add('hidden');overlayMode=null;resumeAfterOverlay();renderReqs();}

  function reqData(){
    const s=currentStage(),c=counts(),r=s.required||{},plants=(c.grass||0)+(c.sapling||0),out=[];
    if(r.wolf)out.push({ok:c.wolf>=r.wolf,label:`🐺 ${c.wolf}/${r.wolf}`});
    if(r.fox)out.push({ok:c.fox>=r.fox,label:`🦊 ${c.fox}/${r.fox}`});
    if(r.deer)out.push({ok:c.deer>=r.deer,label:`🦌 ${c.deer}/${r.deer}`});
    if(r.rabbit)out.push({ok:c.rabbit>=r.rabbit,label:`🐇 ${c.rabbit}/${r.rabbit}`});
    if(r.plants)out.push({ok:plants>=r.plants,label:`🌿 ${plants}/${r.plants}`});
    const need=requiredStableYears();
    out.push({ok:stability(c)>=s.minScore,label:`⚖ ${stability(c)}/${s.minScore}`});
    out.push({ok:state.stableTime>=need,label:`🕰 ${state.stableTime.toFixed(1)}/${need.toFixed(1)}`});
    out.push({ok:state.year>=s.years,label:`⏱ ${Math.min(state.year,s.years).toFixed(1)}/${s.years}`});
    return out;
  }
  function renderReqs(){const el=$('unifiedReqs');if(!el)return;el.innerHTML=reqData().map(x=>`<div class="unified-req ${x.ok?'ok':''}">${x.ok?'✓ ':''}${x.label}</div>`).join('');updateNutrientBadge();}

  function updateNutrientBadge(){
    const badges=document.querySelector('.badges');if(!badges)return;
    let b=$('soilNutrientBadge');if(!b){b=document.createElement('span');b.id='soilNutrientBadge';b.className='badge';badges.appendChild(b);}b.innerHTML=`土の栄養 <b>${nutrient()}</b>`;
  }

  function openOverlay(mode){
    ensureUI();if(state.stageDone||state.modalOpen)return;
    overlayMode=mode;aidLocked=false;pauseForOverlay();
    $('unifiedTitle').textContent=mode==='aid'?'動物への介入':mode==='hint'?'ヒント':'現在の詳細';
    if(mode==='aid')renderAid();else if(mode==='hint')renderHint();else renderDetail();
    $('unifiedOverlay').classList.remove('hidden');
  }

  function renderDetail(){
    const body=$('unifiedBody'),items=requirementSnapshot(),c=counts();
    const order=['wolf','fox','deer','rabbit','grass','sapling'].filter(k=>currentStage().allowed.includes(k));
    body.innerHTML=`<div class="u-section"><div class="u-title">🏁 クリア条件</div><div class="u-checks">${items.map(x=>`<div class="u-check ${x.ok?'ok':''}"><i>${x.ok?'✓':'・'}</i><div>${x.text}<small>${x.now}</small></div></div>`).join('')}</div></div>
      <div class="u-section"><div class="u-title">🐾 いまの個体数</div><div class="u-counts">${order.map(k=>{const d=SPECIES[k]||PLANTS[k];return `<div class="u-count">${d.icon} ${d.name}<b>${c[k]||0}</b></div>`;}).join('')}</div></div>
      <div class="u-section"><div class="u-title">♻️ 命の循環</div><div class="u-advice">土の栄養：<b>${nutrient()}</b><br>植物 → 草食動物 → 肉食動物 → 死 → 土の栄養 → 植物</div></div>
      <button type="button" id="uResetStage" class="u-reset">この面を最初からやり直す</button>`;
    $('uResetStage').onclick=()=>{closeOverlay();startStage(state.stageIndex);renderReqs();};
  }

  function hints(){
    const s=currentStage(),c=counts(),plants=c.grass+c.sapling,z=s.zones||{},arr=[];
    if(plants<(s.required?.plants||0))arr.push(nutrient()>0?`🌿 緑が少なめ。土の栄養は${nutrient()}あるので、動物を増やさず再生を待つ手もある。`:'🌿 緑が少ないのに土の栄養も少ない。動物を増やしすぎず、死によって栄養が戻るまでの流れを見よう。');
    if(z.rabbit&&c.rabbit>z.rabbit[1])arr.push('🐇 うさぎが多い。草を食べる速さが、土から緑が戻る速さを上回っていないかな？');
    if(z.deer&&c.deer>z.deer[1])arr.push('🦌 鹿が多い。うさぎと同じ植物を使うので、緑の減り方を見よう。');
    if(z.fox&&c.fox<z.fox[0]&&c.rabbit>(z.rabbit?.[0]||0))arr.push('🦊 狐が少ない。うさぎが増えすぎると、その先で植物に何が起こるかな？');
    if(z.wolf&&c.wolf<z.wolf[0])arr.push('🐺 狼が少ない。鹿や狐の数がこのあとどう変わるか観察しよう。');
    if(!arr.length)arr.push('👀 今は大きく崩れていない。増えている生き物と、その生き物が食べるものを順番に見よう。');
    return arr.slice(0,3);
  }
  function renderHint(){
    const l=LEARNING[state.stageIndex],body=$('unifiedBody');
    body.innerHTML=`<div class="u-section u-learning"><b>📘 この面で学ぶこと：${l.theme}</b><div class="u-advice">${l.learn}</div></div><div class="u-section"><div class="u-title">💡 いまのヒント</div><div class="u-advice">${hints().map(h=>`<div class="u-hint">${h}</div>`).join('')}</div></div><div class="u-question"><b>考えてみよう：</b>${l.question}</div>`;
  }

  function renderAid(){
    const body=$('unifiedBody'),list=AID_BY_STAGE[state.stageIndex]||[],rule=AID_RULES[state.stageIndex],cooldown=Math.max(0,state.nextInterventionYear-state.year);
    const names=list.map(k=>`${SPECIES[k].icon}${SPECIES[k].name}`).join('・')||'なし';
    body.innerHTML=`<div class="u-aid-rule">この面で介入できる動物：${names}</div><div class="u-aid-status"><span>介入ポイント ${state.interventionPoints}/${rule.points}</span><span>${cooldown>0?`次まで ${cooldown.toFixed(1)}年`:'介入可能'}</span></div>
      <div class="u-aid-grid">${list.map(type=>{const d=SPECIES[type],cost=AID_COST[type],amount=AID_AMOUNT[type],delay=AID_DELAY[type],disabled=aidLocked||state.interventionPoints<cost||cooldown>0;return `<button type="button" class="u-aid" data-u-aid="${type}" ${disabled?'disabled':''}><strong>${d.icon} ${d.name} +${amount}</strong><span>${cost}pt・約${delay.toFixed(1)}年後に到着</span></button>`;}).join('')}</div><div class="u-aid-note">🌿 植物には直接介入できません。現在の土の栄養：${nutrient()}</div><button type="button" id="uAidBack" class="u-back">何もせず大陸へ戻る</button>`;
    body.querySelectorAll('[data-u-aid]').forEach(btn=>btn.onclick=()=>requestAid(btn.dataset.uAid));
    $('uAidBack').onclick=closeOverlay;
  }

  function requestAid(type){
    if(aidLocked||overlayMode!=='aid'||state.stageDone||state.modalOpen)return;
    const list=AID_BY_STAGE[state.stageIndex]||[];if(!list.includes(type))return;
    const rule=AID_RULES[state.stageIndex],cost=AID_COST[type],amount=AID_AMOUNT[type],delay=AID_DELAY[type],cooldown=Math.max(0,state.nextInterventionYear-state.year);
    if(state.interventionPoints<cost||cooldown>0){renderAid();return;}
    aidLocked=true;
    state.interventionPoints-=cost;
    state.nextInterventionYear=state.year+rule.cooldown;
    state.pendingInterventions.push({type,amount,due:state.year+delay});
    const d=SPECIES[type];
    addLog(`${d.icon}${d.name}の支援を要請。${delay.toFixed(1)}年後に到着予定。`);
    ticker(`${d.icon}${d.name} +${amount} を要請。約${delay.toFixed(1)}年後に到着。`);
    closeOverlay();
  }

  ensureUI();
  renderReqs();
  setInterval(()=>{
    renderReqs();
    if(!$('unifiedOverlay')?.classList.contains('hidden')){
      if(overlayMode==='detail')renderDetail();
      else if(overlayMode==='hint')renderHint();
      else if(overlayMode==='aid'&&!aidLocked)renderAid();
    }
  },500);
})();
