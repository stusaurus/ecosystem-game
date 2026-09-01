// Dedicated current-stage reset. Bypasses the wrapped startStage() chain.
(function(){
  function hardResetCurrentStage(){
    const s=STAGES[state.stageIndex];
    if(!s)return;

    // Close only the info overlay; keep unlocked stages intact.
    document.getElementById('v3Overlay')?.classList.add('hidden');
    document.getElementById('modalBackdrop')?.classList.add('hidden');

    state.animals=[];
    state.plants=[];
    state.nutrients=[];
    state.particles=[];
    state.year=0;
    state.running=true;
    state.speedIndex=0;
    state.selectedId=null;
    state.log=[];
    state.stabilityHistory=[];
    state.stageDone=false;
    state.triggeredEvents=new Set();
    state.modalOpen=false;
    state.resumeAfterModal=true;
    state.plantBoostUntil=0;
    state.plantSlowUntil=0;

    // Reset simulation counters used by app/stage logic.
    if(typeof nextId!=='undefined') nextId=1;
    if(typeof plantTimer!=='undefined') plantTimer=0;
    if(typeof balanceTimer!=='undefined') balanceTimer=0;

    // Reset intervention state without calling wrapped startStage().
    if(typeof initAidState==='function'){
      initAidState();
    }else{
      const rule=AID_RULES[state.stageIndex];
      state.interventionPoints=rule.points;
      state.nextInterventionYear=0;
      state.pendingInterventions=[];
      state.stableTime=0;
      state.crisisTime=0;
      state._aidControlTick=-1;
    }

    // Recreate this stage from its current (already balanced) start values.
    for(const [type,n] of Object.entries(s.start)){
      for(let i=0;i<n;i++){
        if(SPECIES[type]) state.animals.push(createAnimal(type));
        else state.plants.push(createPlant(type));
      }
    }

    addLog(`ステージ${state.stageIndex+1}「${s.name}」を最初からやり直しました。`);
    ticker(s.mission);

    const pause=document.getElementById('pauseBtn');
    const speed=document.getElementById('speedBtn');
    if(pause)pause.textContent='一時停止';
    if(speed)speed.textContent='速度 ×1';

    if(typeof renderControls==='function')renderControls();
    if(typeof renderStage==='function')renderStage();
    if(typeof renderSelected==='function')renderSelected();
    if(typeof updateHud==='function')updateHud(true);
    if(typeof renderLearning==='function')renderLearning();

    // ui-v3 refreshes the visible requirement cards on its timer.
  }

  // Capture the reset tap before the ui-v3 onclick handler can call wrapped startStage().
  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('#v3Reset');
    if(!btn)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    hardResetCurrentStage();
  },true);

  window.hardResetCurrentStage=hardResetCurrentStage;
})();
