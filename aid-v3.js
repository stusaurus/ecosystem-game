// Reliable intervention flow for mobile Safari. It bypasses the old animal-button handler.
(function(){
  const AID_BY_STAGE=[
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

  function inject(){
    if($('aidV3Sheet'))return;
    const style=document.createElement('style');
    style.id='aid-v3-style';
    style.textContent=`
      .aid-v3-sheet{position:fixed;inset:0;z-index:900;background:rgba(25,42,51,.62);display:grid;place-items:center;padding:12px}
      .aid-v3-sheet.hidden{display:none!important}
      .aid-v3-card{width:min(520px,100%);background:#fffdf8;border:1px solid #d4e1e7;border-radius:20px;padding:14px;box-shadow:0 24px 60px rgba(20,35,44,.32)}
      .aid-v3-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
      .aid-v3-head h2{font-size:18px;margin:0}.aid-v3-x{width:46px;height:46px;border:1px solid #d4e1e7;border-radius:12px;background:#fff;font-size:20px;font-weight:900}
      .aid-v3-rule{padding:9px 10px;background:#fff8df;border:1px solid #eadfae;border-radius:11px;font-size:11px;font-weight:900;line-height:1.45;margin-bottom:8px}
      .aid-v3-status{display:flex;justify-content:space-between;gap:8px;padding:8px 9px;background:#f3f8fa;border-radius:11px;font-size:11px;font-weight:900;margin-bottom:9px}
      .aid-v3-options{display:grid;gap:7px}.aid-v3-choice{display:flex;align-items:center;gap:10px;min-height:58px;border:1px solid #d4e1e7;border-radius:13px;background:#fff;padding:9px;cursor:pointer}
      .aid-v3-choice input{width:22px;height:22px;flex:0 0 auto}.aid-v3-choice-text{display:block;min-width:0}.aid-v3-choice-text strong{display:block;font-size:13px}.aid-v3-choice-text small{display:block;color:#61727a;font-size:10px;margin-top:3px}
      .aid-v3-note{margin-top:9px;padding:8px 9px;border:1px dashed #b9d6b5;background:#f5fbf2;border-radius:10px;font-size:10px;color:#587159;line-height:1.5}
      .aid-v3-confirm,.aid-v3-back{width:100%;min-height:50px;margin-top:10px;border:0;border-radius:13px;font-size:14px;font-weight:900;-webkit-appearance:none;appearance:none;touch-action:manipulation}
      .aid-v3-confirm{background:#29485b;color:#fff}.aid-v3-confirm:disabled{opacity:.38}.aid-v3-back{background:#eef2f3;color:#40545e;margin-top:7px}
      .aid-v3-message{margin-top:8px;text-align:center;font-size:11px;font-weight:900;color:#3f7b50;min-height:16px}
    `;
    document.head.appendChild(style);

    const sheet=document.createElement('div');
    sheet.id='aidV3Sheet';
    sheet.className='aid-v3-sheet hidden';
    sheet.innerHTML=`<div class="aid-v3-card" role="dialog" aria-modal="true">
      <div class="aid-v3-head"><h2>動物への介入</h2><button type="button" id="aidV3Close" class="aid-v3-x">×</button></div>
      <div id="aidV3Body"></div>
    </div>`;
    document.body.appendChild(sheet);
    $('aidV3Close').addEventListener('click',close);
    sheet.addEventListener('click',e=>{if(e.target===sheet)close();});
  }

  function takeOverButton(){
    const button=$('uAidOpen');
    if(!button)return false;
    button.onclick=null;
    if(button.dataset.aidV3Bound==='1')return true;
    button.dataset.aidV3Bound='1';
    button.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      open();
    });
    return true;
  }

  function open(){
    inject();
    if(state.stageDone||state.modalOpen)return;
    // Make sure the older unified overlay cannot sit above/under this sheet.
    $('unifiedOverlay')?.classList.add('hidden');
    locked=false;
    wasRunning=!!state.running;
    state.running=false;
    const pause=$('pauseBtn');if(pause)pause.textContent='再開';
    render();
    $('aidV3Sheet').classList.remove('hidden');
  }

  function close(){
    locked=false;
    $('aidV3Sheet')?.classList.add('hidden');
    if(wasRunning&&!state.stageDone&&!state.modalOpen){
      state.running=true;
      const pause=$('pauseBtn');if(pause)pause.textContent='一時停止';
    }
    wasRunning=false;
  }

  function render(message=''){
    const body=$('aidV3Body');if(!body)return;
    const list=allowed();
    const rule=AID_RULES[state.stageIndex];
    const cooldown=Math.max(0,state.nextInterventionYear-state.year);
    const names=list.map(k=>`${SPECIES[k].icon}${SPECIES[k].name}`).join('・')||'なし';
    const nutrient=typeof window.soilNutrientAmount==='function'?window.soilNutrientAmount():0;
    const canUse=list.length>0&&state.interventionPoints>0&&cooldown<=0&&!locked;

    body.innerHTML=`
      <div class="aid-v3-rule">この面で介入できる動物：${names}</div>
      <div class="aid-v3-status"><span>介入ポイント ${state.interventionPoints}/${rule.points}</span><span>${cooldown>0?`次まで ${cooldown.toFixed(1)}年`:'介入可能'}</span></div>
      <div class="aid-v3-options">${list.map((type,i)=>{
        const d=SPECIES[type],cost=AID_COST[type],amount=AID_AMOUNT[type],delay=AID_DELAY[type];
        const disabled=state.interventionPoints<cost||cooldown>0;
        return `<label class="aid-v3-choice"><input type="radio" name="aidV3Choice" value="${type}" ${i===0?'checked':''} ${disabled?'disabled':''}><span class="aid-v3-choice-text"><strong>${d.icon} ${d.name} +${amount}</strong><small>${cost}pt使用・約${delay.toFixed(1)}年後に到着</small></span></label>`;
      }).join('')}</div>
      <div class="aid-v3-note">🌿 植物には直接介入できません。現在の土の栄養：${nutrient}</div>
      <button type="button" id="aidV3Confirm" class="aid-v3-confirm" ${canUse?'':'disabled'}>選んだ動物を介入する</button>
      <button type="button" id="aidV3Back" class="aid-v3-back">何もせず大陸へ戻る</button>
      <div class="aid-v3-message">${message}</div>`;

    $('aidV3Back').addEventListener('click',close);
    const confirm=$('aidV3Confirm');
    confirm?.addEventListener('click',confirmAid);
  }

  function confirmAid(e){
    e.preventDefault();
    e.stopPropagation();
    if(locked||state.stageDone||state.modalOpen)return;
    const selected=document.querySelector('input[name="aidV3Choice"]:checked');
    if(!selected){render('動物を選んでください');return;}
    const type=selected.value;
    if(!allowed().includes(type)){render('この動物には介入できません');return;}

    const rule=AID_RULES[state.stageIndex];
    const cost=AID_COST[type],amount=AID_AMOUNT[type],delay=AID_DELAY[type];
    const cooldown=Math.max(0,state.nextInterventionYear-state.year);
    if(state.interventionPoints<cost){render('介入ポイントが足りません');return;}
    if(cooldown>0){render(`次の介入まで ${cooldown.toFixed(1)}年です`);return;}

    locked=true;
    if(!Array.isArray(state.pendingInterventions))state.pendingInterventions=[];
    state.interventionPoints-=cost;
    state.nextInterventionYear=state.year+rule.cooldown;
    state.pendingInterventions.push({type,amount,due:state.year+delay});
    const d=SPECIES[type];
    addLog(`${d.icon}${d.name}の支援を要請。${delay.toFixed(1)}年後に到着予定。`);
    ticker(`${d.icon}${d.name} +${amount} を要請。約${delay.toFixed(1)}年後に到着。`);

    // Close immediately after the transaction; no animation or DOM replacement in between.
    $('aidV3Sheet').classList.add('hidden');
    if(wasRunning&&!state.stageDone&&!state.modalOpen){
      state.running=true;
      const pause=$('pauseBtn');if(pause)pause.textContent='一時停止';
    }
    wasRunning=false;
    locked=false;
  }

  inject();
  if(!takeOverButton()){
    const observer=new MutationObserver(()=>{if(takeOverButton())observer.disconnect();});
    observer.observe(document.body,{childList:true,subtree:true});
  }
})();