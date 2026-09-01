// One-screen classroom UI. Keeps the simulation visible and moves details/help into pause overlays.
(function(){
  const $ = (id) => document.getElementById(id);
  let compactView = null;
  let compactWasRunning = false;

  function injectStyle(){
    if ($('compact-ui-style')) return;
    const style = document.createElement('style');
    style.id = 'compact-ui-style';
    style.textContent = `
      html,body{height:100%;overflow:hidden}
      .app{height:100dvh;max-width:980px;padding:calc(6px + env(safe-area-inset-top)) 8px calc(6px + env(safe-area-inset-bottom));display:flex;flex-direction:column;overflow:hidden}
      .topbar{flex:0 0 auto;margin-bottom:5px;min-height:38px}
      .topbar>div:first-child .eyebrow{display:none}
      .topbar h1{font-size:19px;white-space:nowrap}
      .top-buttons{gap:5px;flex-wrap:nowrap}
      .top-buttons .pill{padding:7px 9px;font-size:11px;min-height:34px}
      #resetBtn{display:none}
      .stage-card{flex:0 0 auto;margin:0 0 5px;padding:7px 9px;border-radius:14px}
      .stage-card .stage-top{min-height:28px}
      .stage-card .eyebrow{font-size:8px;margin-bottom:1px}
      .stage-card h2{font-size:14px}
      .stage-mission{font-size:10px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:2px 0 4px!important}
      .stage-progress{height:4px!important}
      .stage-bottom{margin-top:3px!important;font-size:9px!important}
      .stage-buttons{gap:3px!important}
      .stage-btn{width:24px!important;height:24px!important;font-size:9px!important}
      .learning-block{display:none!important}
      .layout{flex:1 1 auto;min-height:0;display:block!important}
      .world-card{height:100%;min-height:0;padding:6px;border-radius:15px;display:flex;flex-direction:column;overflow:hidden;position:relative}
      .world-card>.section-head{flex:0 0 auto;justify-content:flex-end;min-height:28px;margin-bottom:3px}
      .world-card>.section-head>div:first-child{display:none}
      .badges{gap:5px;flex-wrap:nowrap}
      .badge{font-size:10px;padding:5px 7px;white-space:nowrap}
      #world{flex:1 1 auto;min-height:0;width:100%;height:auto;max-height:100%;border-radius:12px}
      .ticker{flex:0 0 auto;min-height:17px;margin-top:4px;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #selectedCard{display:none!important}
      .side-panel{display:none!important}
      .compact-toolbar{flex:0 0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:5px}
      .compact-main-btn{min-height:44px;border:1px solid var(--line,#d4e1e7);border-radius:13px;background:#fff;color:var(--ink,#20313a);font-weight:900;font-size:12px}
      .compact-main-btn.primary{background:#29485b;color:#fff;border-color:#29485b}
      .compact-summary{position:absolute;left:12px;top:36px;font-size:9px;font-weight:900;color:#4a7657;background:rgba(239,249,241,.94);border:1px solid #d6e8d9;border-radius:999px;padding:4px 7px;pointer-events:none}
      .compact-overlay{position:fixed;inset:0;z-index:60;background:rgba(25,42,51,.52);display:grid;place-items:center;padding:10px}
      .compact-overlay.hidden{display:none}
      .compact-dialog{width:min(540px,100%);max-height:calc(100dvh - 20px);overflow:auto;background:#fffdf8;border:1px solid var(--line,#d4e1e7);border-radius:20px;padding:13px;box-shadow:0 24px 60px rgba(20,35,44,.28)}
      .compact-dialog-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
      .compact-dialog-head h2{font-size:18px}
      .compact-close{min-width:42px;min-height:42px;border:1px solid var(--line,#d4e1e7);border-radius:12px;background:#fff;font-weight:900}
      .compact-section{border:1px solid var(--line,#d4e1e7);border-radius:13px;background:#fff;padding:9px;margin-top:8px}
      .compact-section-title{font-size:11px;font-weight:900;margin-bottom:6px}
      .compact-checks{display:grid;grid-template-columns:1fr 1fr;gap:5px 8px}
      .compact-check{display:grid;grid-template-columns:18px 1fr;gap:5px;align-items:start;font-size:10px;line-height:1.35}
      .compact-check i{font-style:normal;width:18px;height:18px;border-radius:50%;display:grid;place-items:center;background:#f0f3f4;color:#85949a;font-weight:900}
      .compact-check.ok i{background:#e4f4e8;color:#3f8554}
      .compact-check small{display:block;color:var(--muted,#61727a);font-size:9px}
      .compact-counts{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
      .compact-count{border:1px solid var(--line,#d4e1e7);border-radius:10px;padding:6px 7px;text-align:center;font-size:10px}
      .compact-count b{display:block;font-size:14px;margin-top:1px}
      .compact-advice{font-size:11px;line-height:1.6;color:var(--ink,#20313a)}
      .compact-advice-item{padding:7px 8px;border-radius:10px;background:#f4f9fb;margin-top:5px}
      .compact-learning{background:#fff8d9;border-color:#eadfae}
      .compact-learning b{display:block;font-size:12px;margin-bottom:3px;color:#695617}
      .compact-question{margin-top:7px;padding:7px 8px;border-left:3px solid #6da0b6;background:#f3f9fc;border-radius:0 9px 9px 0;font-size:10px;line-height:1.5}
      .compact-reset{width:100%;min-height:42px;margin-top:8px;border:1px solid #e1c9c5;border-radius:12px;background:#fff5f3;color:#995249;font-weight:900}
      .compact-selected{font-size:10px;line-height:1.45;color:var(--muted,#61727a)}
      #compactControlHost .controls{display:grid!important;grid-template-columns:1fr 1fr!important;gap:6px!important}
      #compactControlHost .control-btn{padding:8px!important;min-height:44px}
      #compactControlHost .plant-observe{font-size:9px!important;padding:6px 8px!important}
      @media(max-width:420px){.topbar h1{font-size:17px}.top-buttons .pill{padding:6px 8px;font-size:10px}.stage-card{padding:6px 8px}.compact-checks{gap:4px 6px}.compact-dialog{padding:10px}}
      @media(max-height:700px){.topbar{min-height:32px}.topbar h1{font-size:16px}.top-buttons .pill{min-height:30px;padding:5px 7px}.stage-mission{display:none}.stage-card{padding:5px 7px}.stage-bottom{display:none!important}.world-card>.section-head{min-height:24px}.compact-main-btn{min-height:40px}.ticker{display:none}}
    `;
    document.head.appendChild(style);
  }

  function parkControls(){
    const parking=$('compactParking');
    const controls=$('controls');
    if(parking && controls && controls.parentElement!==parking) parking.appendChild(controls);
  }

  function ensureUI(){
    injectStyle();
    if (!$('compactToolbar')){
      const toolbar = document.createElement('div');
      toolbar.id = 'compactToolbar';
      toolbar.className = 'compact-toolbar';
      toolbar.innerHTML = `<button type="button" class="compact-main-btn primary" data-view="intervention">🐾 介入</button><button type="button" class="compact-main-btn" data-view="detail">📊 現在の詳細</button><button type="button" class="compact-main-btn" data-view="advice">💡 ヒント</button>`;
      document.querySelector('.app')?.appendChild(toolbar);
      toolbar.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>openCompact(btn.dataset.view)));
    }
    if (!$('compactSummary')){
      const summary = document.createElement('div');
      summary.id = 'compactSummary';
      summary.className = 'compact-summary';
      document.querySelector('.world-card')?.appendChild(summary);
    }
    if (!$('compactOverlay')){
      const overlay = document.createElement('div');
      overlay.id = 'compactOverlay';
      overlay.className = 'compact-overlay hidden';
      overlay.innerHTML = `<div class="compact-dialog" role="dialog" aria-modal="true" aria-labelledby="compactDialogTitle"><div class="compact-dialog-head"><h2 id="compactDialogTitle">現在の詳細</h2><button type="button" id="compactClose" class="compact-close" aria-label="閉じる">×</button></div><div id="compactDialogBody"></div></div>`;
      document.body.appendChild(overlay);
      $('compactClose').addEventListener('click', closeCompact);
      overlay.addEventListener('click',(e)=>{ if(e.target===overlay) closeCompact(); });
    }
    if (!$('compactParking')){
      const parking=document.createElement('div');
      parking.id='compactParking';
      parking.hidden=true;
      document.body.appendChild(parking);
    }
    parkControls();
  }

  function pauseForOverlay(){
    compactWasRunning = !!state.running;
    state.running = false;
    const pause = $('pauseBtn');
    if (pause) pause.textContent = '再開';
  }

  function closeCompact(){
    parkControls();
    const overlay = $('compactOverlay');
    if (!overlay || overlay.classList.contains('hidden')) return;
    overlay.classList.add('hidden');
    compactView = null;
    if (compactWasRunning && !state.modalOpen && !state.stageDone){
      state.running = true;
      const pause = $('pauseBtn');
      if (pause) pause.textContent = '一時停止';
    }
  }

  function speciesLabel(key){
    const d = SPECIES[key] || PLANTS[key];
    return d ? `${d.icon} ${d.name}` : key;
  }

  function countsHtml(){
    const c = counts();
    const order=['wolf','fox','deer','rabbit','grass','sapling'].filter(k=>currentStage().allowed.includes(k));
    return `<div class="compact-counts">${order.map(k=>`<div class="compact-count">${speciesLabel(k)}<b>${c[k]||0}</b></div>`).join('')}</div>`;
  }

  function requirementsHtml(){
    const items = requirementSnapshot();
    return `<div class="compact-checks">${items.map(x=>`<div class="compact-check ${x.ok?'ok':''}"><i>${x.ok?'✓':'・'}</i><div>${x.text}<small>${x.now}</small></div></div>`).join('')}</div>`;
  }

  function selectedHtml(){
    const selected = $('selectedCard');
    if (!selected || !selected.innerHTML.trim() || selected.classList.contains('hidden')) return '';
    return `<div class="compact-section"><div class="compact-section-title">🔎 タップした生き物</div><div class="compact-selected">${selected.innerHTML}</div></div>`;
  }

  function buildAdvice(){
    const s=currentStage(), c=counts(), plants=(c.grass||0)+(c.sapling||0), hints=[];
    const zone=s.zones||{};
    const plantNeed=s.required?.plants||0;
    if(plants < Math.max(plantNeed, 25)) hints.push('🌿 植物がかなり少ないよ。草食動物を増やす前に、植物が自然に回復できるか観察してみよう。');
    if(zone.rabbit && c.rabbit>zone.rabbit[1]) hints.push('🐇 うさぎが多め。うさぎが増えると、植物にはどんな変化が起きるかな？');
    if(zone.deer && c.deer>zone.deer[1]) hints.push('🦌 鹿が多め。鹿とうさぎは同じ植物を食べることに注目しよう。');
    if(zone.fox && c.fox<zone.fox[0] && c.rabbit>(zone.rabbit?.[0]||0)) hints.push('🦊 狐が少なめ。狐が減ると、うさぎの数にどんな影響が出るか考えてみよう。');
    if(zone.wolf && c.wolf<zone.wolf[0] && ((c.deer||0)>(zone.deer?.[0]||0) || (c.fox||0)>(zone.fox?.[0]||0))) hints.push('🐺 狼が少なめ。食べられる側の動物がこのあとどう変わるか観察してみよう。');
    if(stability(c)>=s.minScore && hints.length===0) hints.push('⚖️ 今は大きく崩れていないよ。「何もしないで見守る」ことも大切な選択だよ。');
    if(hints.length===0) hints.push('👀 まず個体数の変化を見よう。増えている生き物と、その生き物が食べるものを順番に考えると原因が見つけやすいよ。');
    return hints.slice(0,3);
  }

  function renderDetail(){
    parkControls();
    const body=$('compactDialogBody');
    if(!body)return;
    const req=requirementSnapshot(), done=req.filter(x=>x.ok).length, total=req.length;
    body.innerHTML=`<div class="compact-section"><div class="compact-section-title">🏁 クリア条件　${done}/${total} ✓</div>${requirementsHtml()}</div><div class="compact-section"><div class="compact-section-title">🐾 いまの個体数</div>${countsHtml()}</div>${selectedHtml()}<button type="button" id="compactResetStage" class="compact-reset">この面を最初からやり直す</button>`;
    $('compactResetStage')?.addEventListener('click',()=>{ startStage(state.stageIndex); closeCompact(); });
  }

  function renderAdvice(){
    parkControls();
    const body=$('compactDialogBody');
    if(!body)return;
    const l=LEARNING[state.stageIndex], hints=buildAdvice();
    body.innerHTML=`<div class="compact-section compact-learning"><b>📘 この面で学ぶこと：${l.theme}</b><div class="compact-advice">${l.learn}</div></div><div class="compact-section"><div class="compact-section-title">💡 いまのヒント</div><div class="compact-advice">${hints.map(h=>`<div class="compact-advice-item">${h}</div>`).join('')}</div></div><div class="compact-question"><b>考えてみよう：</b>${l.question}</div>`;
  }

  function renderIntervention(){
    parkControls();
    const body=$('compactDialogBody');
    if(!body)return;
    body.innerHTML=`<div class="compact-section"><div class="compact-section-title">🐾 動物への介入</div><div class="compact-advice">草や木の芽には直接介入できません。動物の数を変えると植物がどう変わるか考えよう。</div></div>`;
    const host=document.createElement('div');
    host.id='compactControlHost';
    const controls=$('controls');
    if(controls) host.appendChild(controls);
    body.appendChild(host);
    renderControls();
  }

  function openCompact(view){
    ensureUI();
    pauseForOverlay();
    compactView=view;
    const title=$('compactDialogTitle');
    if(title) title.textContent=view==='intervention'?'動物への介入':view==='advice'?'ヒント':'現在の詳細';
    parkControls();
    if(view==='intervention')renderIntervention();
    else if(view==='advice')renderAdvice();
    else renderDetail();
    $('compactOverlay').classList.remove('hidden');
  }

  function updateSummary(){
    const el=$('compactSummary');
    if(!el || typeof requirementSnapshot!=='function')return;
    const items=requirementSnapshot(), done=items.filter(x=>x.ok).length;
    el.textContent=`クリア条件 ${done}/${items.length} ✓`;
    if(compactView==='detail' && !$('compactOverlay')?.classList.contains('hidden')) renderDetail();
    if(compactView==='advice' && !$('compactOverlay')?.classList.contains('hidden')) renderAdvice();
  }

  ensureUI();
  updateSummary();
  setInterval(updateSummary,500);
})();