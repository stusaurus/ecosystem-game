// Standalone intervention sheet for reliable mobile interaction.
(function(){
  const STAGE_AID = window.STAGE_AID_SPECIES || [
    ['rabbit'],
    ['rabbit','fox'],
    ['rabbit','deer'],
    ['fox','deer'],
    ['fox']
  ];
  let wasRunning=false;
  let requestLocked=false;

  function el(id){return document.getElementById(id);}
  function allowed(){return STAGE_AID[state.stageIndex]||[];}

  function inject(){
    if(el('aidSheet'))return;
    const style=document.createElement('style');
    style.textContent=`
      .aid-sheet{position:fixed;inset:0;z-index:120;background:rgba(25,42,51,.58);display:grid;place-items:center;padding:12px;touch-action:manipulation}
      .aid-sheet.hidden{display:none!important}
      .aid-card{width:min(520px,100%);max-height:calc(100dvh - 24px);overflow:auto;background:#fffdf8;border:1px solid #d4e1e7;border-radius:20px;padding:14px;box-shadow:0 24px 60px rgba(20,35,44,.3);-webkit-overflow-scrolling:touch}
      .aid-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}
      .aid-head h2{margin:0;font-size:18px}
      .aid-x{width:42px;height:42px;border:1px solid #d4e1e7;border-radius:12px;background:white;font-size:20px;font-weight:900;touch-action:manipulation}
      .aid-rule{padding:9px 10px;border-radius:11px;background:#fff8df;border:1px solid #eadfae;font-size:11px;font-weight:800;line-height:1.5;margin-bottom:9px}
      .aid-status{display:flex;justify-content:space-between;gap:8px;font-size:11px;font-weight:900;padding:8px 9px;border-radius:11px;background:#f3f8fa;margin-bottom:9px}
      .aid-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .aid-animal{min-height:58px;border:1px solid #d4e1e7;border-radius:13px;background:white;text-align:left;padding:9px;color:#20313a;touch-action:manipulation;cursor:pointer}
      .aid-animal strong{display:block;font-size:13px}
      .aid-animal span{display:block;font-size:10px;color:#61727a;margin-top:4px;line-height:1.35}
      .aid-animal:disabled{opacity:.38}
      .aid-animal.accepted{background:#eaf7ed;border-color:#9fcca9}
      .aid-explain{margin-top:9px;padding:9px 10px;border:1px dashed #b9d6b5;border-radius:11px;background:#f5fbf2;font-size:10px;color:#587159;line-height:1.5}
      .aid-back{width:100%;min-height:48px;margin-top:10px;border:0;border-radius:13px;background:#29485b;color:white;font-size:13px;font-weight:900;touch-action:manipulation}
      @media(max-width:390px){.aid-card{padding:11px}.aid-grid{gap:6px}.aid-animal{min-height:54px;padding:8px}}
    `;
    document.head.appendChild(style);

    const sheet=document.createElement('div');
    sheet.id='aidSheet';
    sheet.className='aid-sheet hidden';
    sheet.innerHTML=`<div class="aid-card" role="dialog" aria-modal="true" aria-labelledby="aidTitle">
      <div class="aid-head"><h2 id="aidTitle">動物への介入</h2><button id="aidClose" class="aid-x" type="button" aria-label="閉じる">×</button></div>
      <div id="aidBody"></div>
      <button id="aidBack" class="aid-back" type="button">何もせず大陸へ戻る</button>
    </div>`;
    document.body.appendChild(sheet);
    el('aidClose').addEventListener('click',close);
    el('aidBack').addEventListener('click',close);
    sheet.addEventListener('click',e=>{if(e.target===sheet)close();});
  }

  function resume(){
    if(wasRunning && !state.stageDone && !state.modalOpen){
      state.running=true;
      const p=el('pauseBtn'); if(p)p.textContent='一時停止';
    }
    wasRunning=false;
  }

  function close(){
    requestLocked=false;
    const sheet=el('aidSheet');
    if(sheet)sheet.classList.add('hidden');
    resume();
  }

  function render(){
    const body=el('aidBody'); if(!body)return;
    const rule=AID_RULES[state.stageIndex];
    const cooldown=Math.max(0,state.nextInterventionYear-state.year);
    const list=allowed();
    const names=list.map(k=>`${SPECIES[k].icon}${SPECIES[k].name}`).join('・')||'なし';
    const nutrient=typeof window.soilNutrientAmount==='function'?window.soilNutrientAmount():0;
    body.innerHTML=`
      <div class="aid-rule">この面で介入できる動物：${names}</div>
      <div class="aid-status"><span>介入ポイント ${state.interventionPoints}/${rule.points}</span><span>${cooldown>0?`次まで ${cooldown.toFixed(1)}年`:'介入可能'}</span></div>
      <div class="aid-grid">${list.map(type=>{
        const d=SPECIES[type],cost=AID_COST[type],amount=AID_AMOUNT[type],delay=AID_DELAY[type];
        const disabled=requestLocked||state.interventionPoints<cost||cooldown>0||state.stageDone||state.modalOpen;
        return `<button type="button" class="aid-animal" data-sheet-aid="${type}" ${disabled?'disabled':''}><strong>${d.icon} ${d.name} +${amount}</strong><span>${cost}pt使用・約${delay.toFixed(1)}年後に到着</span></button>`;
      }).join('')}</div>
      <div class="aid-explain">🌿 草や木の芽には直接介入できません。植物は動物に食べられて減り、動物が死んで土へ戻した栄養から育ちます。現在の土の栄養：${nutrient}</div>`;
    body.querySelectorAll('[data-sheet-aid]').forEach(btn=>{
      btn.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        request(btn.dataset.sheetAid,btn);
      });
      btn.addEventListener('pointerup',e=>e.stopPropagation());
    });
  }

  function open(){
    inject();
    if(state.stageDone||state.modalOpen)return;
    requestLocked=false;
    wasRunning=!!state.running;
    state.running=false;
    const p=el('pauseBtn'); if(p)p.textContent='再開';
    render();
    el('aidSheet').classList.remove('hidden');
  }

  // Do not call the legacy addEntities() chain here. It has several wrappers from
  // older UI versions. The intervention sheet owns this transaction directly.
  function request(type,button){
    if(requestLocked||!allowed().includes(type)||state.stageDone||state.modalOpen)return;
    const rule=AID_RULES[state.stageIndex];
    const cost=AID_COST[type];
    const delay=AID_DELAY[type];
    const amount=AID_AMOUNT[type];
    const cooldown=Math.max(0,state.nextInterventionYear-state.year);

    if(state.interventionPoints<cost){
      ticker('介入ポイントが足りません。');
      render();
      return;
    }
    if(cooldown>0){
      ticker(`次の介入はあと${cooldown.toFixed(1)}年後です。`);
      render();
      return;
    }

    requestLocked=true;
    state.interventionPoints-=cost;
    state.nextInterventionYear=state.year+rule.cooldown;
    state.pendingInterventions.push({type,amount,due:state.year+delay});

    const d=SPECIES[type];
    if(button){button.classList.add('accepted');button.disabled=true;}
    addLog(`${d.icon}${d.name}の支援を要請。${delay.toFixed(1)}年後に到着予定。`);
    ticker(`${d.icon}${d.name}の介入を受け付けました。約${delay.toFixed(1)}年後に到着します。`);

    // Close on the next paint so the tap gets visible feedback first on mobile Safari.
    requestAnimationFrame(()=>{
      const sheet=el('aidSheet');
      if(sheet)sheet.classList.add('hidden');
      resume();
      requestLocked=false;
      if(typeof renderControls==='function')renderControls();
      if(typeof renderStage==='function')renderStage();
    });
  }

  // Capture the toolbar intervention button before the older compact overlay handler.
  document.addEventListener('click',e=>{
    const trigger=e.target.closest?.('[data-view="intervention"]');
    if(!trigger)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    open();
  },true);

  inject();
})();