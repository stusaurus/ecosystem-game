// Final isolated intervention UI. This deliberately does not reuse any legacy compact intervention handlers.
(function(){
  const AID_BY_STAGE = window.STAGE_AID_SPECIES || [
    ['rabbit'],
    ['rabbit','fox'],
    ['rabbit','deer'],
    ['fox','deer'],
    ['fox']
  ];
  let wasRunning=false;
  let locked=false;

  const $=id=>document.getElementById(id);
  const allowed=()=>AID_BY_STAGE[state.stageIndex]||[];

  function replaceToolbarButton(){
    const old=document.querySelector('#compactToolbar [data-view="intervention"], #compactToolbar #cleanAidOpen');
    if(!old)return false;
    if(old.id==='cleanAidOpen')return true;
    const btn=document.createElement('button');
    btn.type='button';
    btn.id='cleanAidOpen';
    btn.className=old.className||'compact-main-btn primary';
    btn.textContent='🐾 介入';
    old.replaceWith(btn);
    btn.addEventListener('click',openSheet);
    btn.addEventListener('pointerup',e=>e.stopPropagation());
    return true;
  }

  function injectSheet(){
    if($('cleanAidSheet'))return;
    const style=document.createElement('style');
    style.id='clean-aid-style';
    style.textContent=`
      .clean-aid-sheet{position:fixed;inset:0;z-index:300;background:rgba(25,42,51,.62);display:grid;place-items:center;padding:12px;touch-action:manipulation}
      .clean-aid-sheet.hidden{display:none!important}
      .clean-aid-card{width:min(520px,100%);background:#fffdf8;border-radius:20px;border:1px solid #d4e1e7;padding:14px;box-shadow:0 24px 60px rgba(20,35,44,.32)}
      .clean-aid-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
      .clean-aid-head h2{font-size:18px;margin:0}
      .clean-aid-close{width:46px;height:46px;border:1px solid #d4e1e7;border-radius:12px;background:#fff;font-size:21px;font-weight:900}
      .clean-aid-rule{padding:9px 10px;background:#fff8df;border:1px solid #eadfae;border-radius:11px;font-size:11px;font-weight:900;line-height:1.45;margin-bottom:8px}
      .clean-aid-status{display:flex;justify-content:space-between;gap:8px;padding:8px 9px;background:#f3f8fa;border-radius:11px;font-size:11px;font-weight:900;margin-bottom:8px}
      .clean-aid-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .clean-aid-animal{min-height:60px;border:1px solid #d4e1e7;border-radius:13px;background:#fff;text-align:left;padding:9px;color:#20313a;touch-action:manipulation}
      .clean-aid-animal strong{display:block;font-size:13px}.clean-aid-animal span{display:block;font-size:10px;color:#61727a;margin-top:4px}
      .clean-aid-animal:disabled{opacity:.38}.clean-aid-animal.chosen{background:#e9f7ec;border-color:#93c59e}
      .clean-aid-note{margin-top:9px;padding:8px 9px;border:1px dashed #b9d6b5;background:#f5fbf2;border-radius:10px;font-size:10px;color:#587159;line-height:1.5}
      .clean-aid-back{width:100%;min-height:48px;margin-top:10px;border:0;border-radius:13px;background:#29485b;color:#fff;font-size:13px;font-weight:900}
      .clean-aid-toast{position:fixed;z-index:350;left:50%;bottom:82px;transform:translateX(-50%);max-width:90vw;background:#20313a;color:#fff;padding:10px 14px;border-radius:999px;font-size:12px;font-weight:900;box-shadow:0 10px 24px rgba(0,0,0,.2);pointer-events:none}
      @media(max-width:390px){.clean-aid-card{padding:11px}.clean-aid-grid{gap:6px}.clean-aid-animal{min-height:56px;padding:8px}}
    `;
    document.head.appendChild(style);
    const sheet=document.createElement('div');
    sheet.id='cleanAidSheet';
    sheet.className='clean-aid-sheet hidden';
    sheet.innerHTML=`<div class="clean-aid-card" role="dialog" aria-modal="true">
      <div class="clean-aid-head"><h2>動物への介入</h2><button type="button" id="cleanAidClose" class="clean-aid-close">×</button></div>
      <div id="cleanAidBody"></div>
      <button type="button" id="cleanAidBack" class="clean-aid-back">何もせず大陸へ戻る</button>
    </div>`;
    document.body.appendChild(sheet);
    $('cleanAidClose').onclick=closeSheet;
    $('cleanAidBack').onclick=closeSheet;
    sheet.addEventListener('click',e=>{if(e.target===sheet)closeSheet();});
  }

  function showToast(text){
    document.querySelector('.clean-aid-toast')?.remove();
    const t=document.createElement('div');t.className='clean-aid-toast';t.textContent=text;document.body.appendChild(t);
    setTimeout(()=>t.remove(),1800);
  }

  function renderSheet(){
    const body=$('cleanAidBody');if(!body)return;
    const list=allowed();
    const rule=AID_RULES[state.stageIndex];
    const cooldown=Math.max(0,state.nextInterventionYear-state.year);
    const names=list.map(k=>`${SPECIES[k].icon}${SPECIES[k].name}`).join('・')||'なし';
    const nutrient=typeof window.soilNutrientAmount==='function'?window.soilNutrientAmount():0;
    body.innerHTML=`<div class="clean-aid-rule">この面で介入できる動物：${names}</div>
      <div class="clean-aid-status"><span>介入ポイント ${state.interventionPoints}/${rule.points}</span><span>${cooldown>0?`次まで ${cooldown.toFixed(1)}年`:'介入可能'}</span></div>
      <div class="clean-aid-grid">${list.map(type=>{
        const d=SPECIES[type],cost=AID_COST[type],amount=AID_AMOUNT[type],delay=AID_DELAY[type];
        const disabled=locked||state.interventionPoints<cost||cooldown>0;
        return `<button type="button" class="clean-aid-animal" data-clean-aid="${type}" ${disabled?'disabled':''}><strong>${d.icon} ${d.name} +${amount}</strong><span>${cost}pt・約${delay.toFixed(1)}年後に到着</span></button>`;
      }).join('')}</div>
      <div class="clean-aid-note">🌿 植物には直接介入できません。現在の土の栄養：${nutrient}</div>`;
    body.querySelectorAll('[data-clean-aid]').forEach(btn=>{
      btn.onclick=()=>requestAid(btn.dataset.cleanAid,btn);
    });
  }

  function openSheet(){
    injectSheet();
    // Hide any old overlay that might still be open from cached handlers.
    $('compactOverlay')?.classList.add('hidden');
    $('aidSheet')?.classList.add('hidden');
    if(state.stageDone||state.modalOpen)return;
    locked=false;
    wasRunning=!!state.running;
    state.running=false;
    const p=$('pauseBtn');if(p)p.textContent='再開';
    renderSheet();
    $('cleanAidSheet').classList.remove('hidden');
  }

  function closeSheet(){
    locked=false;
    $('cleanAidSheet')?.classList.add('hidden');
    if(wasRunning&&!state.stageDone&&!state.modalOpen){state.running=true;const p=$('pauseBtn');if(p)p.textContent='一時停止';}
    wasRunning=false;
  }

  function requestAid(type,button){
    if(locked||!allowed().includes(type)||state.stageDone||state.modalOpen)return;
    const rule=AID_RULES[state.stageIndex],cost=AID_COST[type],amount=AID_AMOUNT[type],delay=AID_DELAY[type];
    const cooldown=Math.max(0,state.nextInterventionYear-state.year);
    if(state.interventionPoints<cost){showToast('介入ポイントが足りません');return;}
    if(cooldown>0){showToast(`次の介入まで ${cooldown.toFixed(1)}年`);return;}
    locked=true;
    state.interventionPoints-=cost;
    state.nextInterventionYear=state.year+rule.cooldown;
    state.pendingInterventions.push({type,amount,due:state.year+delay});
    const d=SPECIES[type];
    button.classList.add('chosen');button.disabled=true;
    addLog(`${d.icon}${d.name}の支援を要請。${delay.toFixed(1)}年後に到着予定。`);
    ticker(`${d.icon}${d.name} +${amount} を要請。約${delay.toFixed(1)}年後に到着。`);
    showToast(`${d.icon}${d.name} +${amount} を要請しました`);
    setTimeout(()=>closeSheet(),120);
  }

  injectSheet();
  // compact-ui has already created the toolbar by the time this script is loaded.
  if(!replaceToolbarButton()){
    const obs=new MutationObserver(()=>{if(replaceToolbarButton())obs.disconnect();});
    obs.observe(document.body,{childList:true,subtree:true});
  }
})();