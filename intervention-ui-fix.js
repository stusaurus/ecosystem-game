// Robust intervention flow + stage-specific aid choices.
(function(){
  const STAGE_AID_SPECIES=[
    ['rabbit'],
    ['rabbit','fox'],
    ['rabbit','deer'],
    ['fox','deer'],
    ['fox']
  ];
  window.STAGE_AID_SPECIES=STAGE_AID_SPECIES;

  const originalAddEntities=addEntities;
  addEntities=function(type){
    const allowed=STAGE_AID_SPECIES[state.stageIndex]||[];
    if(!allowed.includes(type)){
      ticker('このステージでは、その動物には介入できません。');
      return false;
    }
    const beforePoints=state.interventionPoints;
    const beforePending=state.pendingInterventions.length;
    originalAddEntities(type);
    return state.interventionPoints<beforePoints || state.pendingInterventions.length>beforePending;
  };

  function speciesText(){
    const allowed=STAGE_AID_SPECIES[state.stageIndex]||[];
    return allowed.map(k=>`${SPECIES[k].icon}${SPECIES[k].name}`).join('・') || 'なし';
  }

  function forceReturnToWorld(){
    const overlay=document.getElementById('compactOverlay');
    if(overlay)overlay.classList.add('hidden');
    if(!state.stageDone&&!state.modalOpen){
      state.running=true;
      const pause=document.getElementById('pauseBtn');
      if(pause)pause.textContent='一時停止';
    }
  }

  function decorateInterventionPanel(){
    const overlay=document.getElementById('compactOverlay');
    const title=document.getElementById('compactDialogTitle');
    const body=document.getElementById('compactDialogBody');
    if(!overlay||overlay.classList.contains('hidden')||!body||title?.textContent!=='動物への介入')return;

    const allowed=STAGE_AID_SPECIES[state.stageIndex]||[];
    body.querySelectorAll('[data-aid]').forEach(btn=>{
      const type=btn.dataset.aid;
      if(!allowed.includes(type))btn.remove();
    });

    const section=body.querySelector('.compact-section');
    if(section&&!section.querySelector('.stage-aid-rule')){
      const note=document.createElement('div');
      note.className='stage-aid-rule';
      note.style.cssText='margin:0 0 8px;padding:8px 9px;border-radius:10px;background:#fff8df;border:1px solid #eadfae;font-size:10px;font-weight:800;line-height:1.45';
      note.textContent=`この面で介入できる動物：${speciesText()}`;
      section.prepend(note);
    }

    if(!body.querySelector('#returnToWorldBtn')){
      const back=document.createElement('button');
      back.id='returnToWorldBtn';
      back.type='button';
      back.textContent='大陸へ戻る';
      back.style.cssText='width:100%;min-height:46px;margin-top:9px;border:0;border-radius:12px;background:#29485b;color:white;font-weight:900;font-size:13px';
      body.appendChild(back);
    }
  }

  document.addEventListener('click',(e)=>{
    const aid=e.target.closest?.('[data-aid]');
    if(aid&&document.getElementById('compactOverlay')&&!document.getElementById('compactOverlay').classList.contains('hidden')){
      e.preventDefault();
      e.stopImmediatePropagation();
      const type=aid.dataset.aid;
      const ok=addEntities(type);
      if(ok){
        const d=SPECIES[type];
        const delay=AID_DELAY[type];
        forceReturnToWorld();
        ticker(`${d.icon}${d.name}の介入を受け付けました。約${delay.toFixed(1)}年後に到着します。`);
      }else{
        decorateInterventionPanel();
      }
      return;
    }

    if(e.target.closest?.('#returnToWorldBtn')){
      e.preventDefault();
      e.stopImmediatePropagation();
      forceReturnToWorld();
      return;
    }

    if(e.target.closest?.('#compactClose')){
      // Safety fallback for the previous freeze: always allow the close button to return to the world.
      e.preventDefault();
      e.stopImmediatePropagation();
      forceReturnToWorld();
    }
  },true);

  const observer=new MutationObserver(()=>decorateInterventionPanel());
  observer.observe(document.body,{childList:true,subtree:true});
  setInterval(decorateInterventionPanel,400);
})();