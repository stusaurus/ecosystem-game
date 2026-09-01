// One-screen classroom UI. Main play stays on one screen; details/help pause safely in overlays.
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
      .app{height:100dvh;max-width:980px;padding:calc(5px + env(safe-area-inset-top)) 7px calc(5px + env(safe-area-inset-bottom));display:flex;flex-direction:column;overflow:hidden}
      .topbar{flex:0 0 auto;margin-bottom:4px;min-height:36px}
      .topbar>div:first-child .eyebrow{display:none}
      .topbar h1{font-size:18px;white-space:nowrap}
      .top-buttons{gap:4px;flex-wrap:nowrap}
      .top-buttons .pill{padding:6px 8px;font-size:10px;min-height:32px}
      #resetBtn{display:none}

      .stage-card{flex:0 0 auto;margin:0 0 4px;padding:6px 8px;border-radius:13px}
      .stage-card .stage-top{min-height:25px}
      .stage-card .eyebrow{font-size:8px;margin-bottom:0}
      .stage-card h2{font-size:13px}
      .stage-mission{font-size:9px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:1px 0 3px!important}
      .stage-progress{height:4px!important}
      .stage-bottom{margin-top:2px!important;font-size:8px!important}
      .stage-buttons{gap:2px!important}
      .stage-btn{width:22px!important;height:22px!important;font-size:8px!important}
      .learning-block{display:none!important}

      .compact-requirements{flex:0 0 auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;margin:0 0 4px}
      .compact-req{min-width:0;border:1px solid #d8e1e3;background:#fff;border-radius:8px;padding:4px 3px;text-align:center;font-size:8px;font-weight:800;line-height:1.15;color:#6a787e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .compact-req.ok{background:#edf8ef;border-color:#cfe4d4;color:#3f7b50}
      .compact-req b{font-size:9px;color:inherit}

      .layout{flex:1 1 auto;min-height:0;display:block!important}
      .world-card{height:100%;min-height:0;padding:5px;border-radius:14px;display:flex;flex-direction:column;overflow:hidden;position:relative}
      .world-card>.section-head{flex:0 0 auto;justify-content:flex-end;min-height:24px;margin-bottom:2px}
      .world-card>.section-head>div:first-child{display:none}
      .badges{gap:4px;flex-wrap:nowrap}
      .badge{font-size:9px;padding:4px 6px;white-space:nowrap}
      #world{flex:1 1 auto;min-height:0;width:100%;height:auto;max-height:100%;border-radius:11px}
      .ticker{flex:0 0 auto;min-height:15px;margin-top:3px;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #selectedCard{display:none!important}
      .side-panel{display:none!important}

      .compact-toolbar{flex:0 0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:4px}
      .compact-main-btn{min-height:42px;border:1px solid var(--line,#d4e1e7);border-radius:12px;background:#fff;color:var(--ink,#20313a);font-weight:900;font-size:11px}
      .compact-main-btn.primary{background:#29485b;color:#fff;border-color:#29485b}

      .compact-overlay{position:fixed;inset:0;z-index:60;background:rgba(25,42,51,.52);display:grid;place-items:center;padding:10px}
      .compact-overlay.hidden{display:none}
      .compact-dialog{width:min(540px,100%);max-height:calc(100dvh - 20px);overflow:auto;background:#fffdf8;border:1px solid var(--line,#d4e1e7);border-radius:20px;padding:12px;box-shadow:0 24px 60px rgba(20,35,44,.28)}
      .compact-dialog-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
      .compact-dialog-head h2{font-size:17px}
      .compact-close{min-width:42px;min-height:42px;border:1px solid var(--line,#d4e1e7);border-radius:12px;background:#fff;font-weight:900}
      .compact-section{border:1px solid var(--line,#d4e1e7);border-radius:13px;background:#fff;padding:9px;margin-top:7px}
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

      .compact-aid-head{display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:11px;font-weight:900;margin-bottom:7px}
      .compact-aid-note{font-size:9px;color:var(--muted,#61727a);line-height:1.45;margin-bottom:8px}
      .compact-aid-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
      .compact-aid-btn{min-height:48px;border:1px solid var(--line,#d4e1e7);border-radius:12px;background:#fff;text-align:left;padding:8px;color:var(--ink,#20313a)}
      .compact-aid-btn strong{display:block;font-size:12px}
      .compact-aid-btn span{display:block;font-size:9px;color:var(--muted,#61727a);margin-top:3px}
      .compact-aid-btn:disabled{opacity:.38}
      .compact-plant-note{margin-top:7px;border:1px dashed #b9d6b5;border-radius:10px;padding:7px 8px;background:#f5fbf2;font-size:9px;color:#587159;line-height:1.45}

      @media(max-width:420px){
        .topbar h1{font-size:16px}
        .top-buttons .pill{padding:5px 7px;font-size:9px}
        .stage-card{padding:5px 7px}
        .compact-checks{gap:4px 6px}
        .compact-dialog{padding:9px}
        .compact-req{font-size:7.5px;padding:3px 2px}
        .compact-req b{font-size:8px}
      }
      @media(max-height:700px){
        .topbar{min-height:30px}.topbar h1{font-size:15px}.top-buttons .pill{min-height:29px;padding:4px 6px}
        .stage-mission{display:none}.stage-card{padding:4px 6px}.stage-bottom{display:none!important}
        .world-card>.section-head{min-height:22px}.compact-main-btn{min-height:38px}.ticker{display:none}
        .compact-req{padding:3px 2px}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureUI(){
    injectStyle();

    if (!$('compactRequirements')){
      const req = document.createElement('div');
      req.id = 'compactRequirements';
      req.className = 'compact-requirements';
      const layout = document.querySelector('.layout');
      layout?.parentNode?.insertBefore(req, layout);
    }

    if (!$('compactToolbar')){
      const toolbar = document.createElement('div');
      toolbar.id = 'compactToolbar';
      toolbar.className = 'compact-toolbar';
      toolbar.innerHTML = `<button type="button" class="compact-main-btn primary" data-view="intervention">🐾 介入</button><button type="button" class="compact-main-btn" data-view="detail">📊 現在の詳細</button><button type="button" class="compact-main-btn" data-view="advice">💡 ヒント</button>`;
      document.querySelector('.app')?.appendChild(toolbar);
      toolbar.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>openCompact(btn.dataset.view)));
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
  }

  function pauseForOverlay(){
    compactWasRunning = !!state.running;
    state.running = false;
    const pause = $('pauseBtn');
    if (pause) pause.textContent = '再開';
  }

  function closeCompact(){
    const overlay = $('compactOverlay');
    if (!overlay || overlay.classList.contains('hidden')) return;
    overlay.classList.add('hidden');
    compactView = null;
    if (compactWasRunning && !state.modalOpen && !state.stageDone){
      state.running = true;
      const pause = $('pauseBtn');
      if (pause) pause.textContent = '一時停止';
    }
    compactWasRunning = false;
    updateVisibleRequirements();
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
    if(hints.length===0) hints.push('👀 増えている生き物と、その生き物が食べるものを順番に見てみよう。');
    return hints.slice(0,3);
  }

  function visibleRequirementData(){
    const s=currentStage(), c=counts(), r=s.required||{}, plants=(c.grass||0)+(c.sapling||0), out=[];
    if(r.wolf) out.push({ok:c.wolf>=r.wolf,label:`🐺 ${c.wolf}/${r.wolf}`});
    if(r.fox) out.push({ok:c.fox>=r.fox,label:`🦊 ${c.fox}/${r.fox}`});
    if(r.deer) out.push({ok:c.deer>=r.deer,label:`🦌 ${c.deer}/${r.deer}`});
    if(r.rabbit) out.push({ok:c.rabbit>=r.rabbit,label:`🐇 ${c.rabbit}/${r.rabbit}`});
    if(r.plants) out.push({ok:plants>=r.plants,label:`🌿 ${plants}/${r.plants}`});
    const need=requiredStableYears();
    out.push({ok:stability(c)>=s.minScore,label:`⚖ ${stability(c)}/${s.minScore}`});
    out.push({ok:state.stableTime>=need,label:`🕰 ${state.stableTime.toFixed(1)}/${need.toFixed(1)}`});
    out.push({ok:state.year>=s.years,label:`⏱ ${Math.min(state.year,s.years).toFixed(1)}/${s.years}`});
    return out;
  }

  function updateVisibleRequirements(){
    const el=$('compactRequirements');
    if(!el || typeof currentStage!=='function' || typeof requiredStableYears!=='function') return;
    const data=visibleRequirementData();
    el.innerHTML=data.map(x=>`<div class="compact-req ${x.ok?'ok':''}"><b>${x.ok?'✓ ':''}${x.label}</b></div>`).join('');
  }

  function renderDetail(){
    const body=$('compactDialogBody');
    if(!body)return;
    const req=requirementSnapshot(), done=req.filter(x=>x.ok).length, total=req.length;
    body.innerHTML=`<div class="compact-section"><div class="compact-section-title">🏁 クリア条件　${done}/${total} ✓</div>${requirementsHtml()}</div><div class="compact-section"><div class="compact-section-title">🐾 いまの個体数</div>${countsHtml()}</div>${selectedHtml()}<button type="button" id="compactResetStage" class="compact-reset">この面を最初からやり直す</button>`;
    $('compactResetStage')?.addEventListener('click',()=>{ closeCompact(); startStage(state.stageIndex); updateVisibleRequirements(); });
  }

  function renderAdvice(){
    const body=$('compactDialogBody');
    if(!body)return;
    const l=LEARNING[state.stageIndex], hints=buildAdvice();
    body.innerHTML=`<div class="compact-section compact-learning"><b>📘 この面で学ぶこと：${l.theme}</b><div class="compact-advice">${l.learn}</div></div><div class="compact-section"><div class="compact-section-title">💡 いまのヒント</div><div class="compact-advice">${hints.map(h=>`<div class="compact-advice-item">${h}</div>`).join('')}</div></div><div class="compact-question"><b>考えてみよう：</b>${l.question}</div>`;
  }

  function renderIntervention(){
    const body=$('compactDialogBody');
    if(!body)return;
    const rule=AID_RULES[state.stageIndex];
    const cooldown=Math.max(0,state.nextInterventionYear-state.year);
    const pending=state.pendingInterventions.length;
    const animalOrder=['wolf','fox','deer','rabbit'].filter(x=>currentStage().allowed.includes(x));

    let buttons='';
    if(animalOrder.length===0){
      buttons='<div class="compact-plant-note">🌿 この面では動物への介入はありません。植物とうさぎの変化を観察しよう。</div>';
    }else{
      buttons=`<div class="compact-aid-grid">${animalOrder.map(type=>{
        const d=SPECIES[type], cost=AID_COST[type], n=AID_AMOUNT[type];
        const disabled=state.interventionPoints<cost || cooldown>0 || state.stageDone || state.modalOpen;
        return `<button type="button" class="compact-aid-btn" data-aid="${type}" ${disabled?'disabled':''}><strong>${d.icon} ${d.name} +${n}</strong><span>${cost}pt使用・到着まで${AID_DELAY[type].toFixed(1)}年</span></button>`;
      }).join('')}</div><div class="compact-plant-note">🌿🌱 草と木の芽には直接介入できません。動物の数を考えて植物を守ろう。</div>`;
    }

    body.innerHTML=`<div class="compact-section"><div class="compact-aid-head"><span>介入ポイント ${state.interventionPoints}/${rule.points}</span><span>${cooldown>0?`次まで ${cooldown.toFixed(1)}年`:'介入可能'}</span></div><div class="compact-aid-note">使ったポイントは戻りません。${pending?`到着待ち ${pending}件。`:'必要なときだけ使おう。'}</div>${buttons}</div>`;

    body.querySelectorAll('[data-aid]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        addEntities(btn.dataset.aid);
        renderIntervention();
        updateVisibleRequirements();
      });
    });
  }

  function openCompact(view){
    ensureUI();
    if(state.modalOpen || state.stageDone) return;
    pauseForOverlay();
    compactView=view;
    const title=$('compactDialogTitle');
    if(title) title.textContent=view==='intervention'?'動物への介入':view==='advice'?'ヒント':'現在の詳細';
    if(view==='intervention') renderIntervention();
    else if(view==='advice') renderAdvice();
    else renderDetail();
    $('compactOverlay')?.classList.remove('hidden');
  }

  ensureUI();
  updateVisibleRequirements();
  setInterval(()=>{
    updateVisibleRequirements();
    if(compactView==='intervention' && !$('compactOverlay')?.classList.contains('hidden')) renderIntervention();
  },500);
})();