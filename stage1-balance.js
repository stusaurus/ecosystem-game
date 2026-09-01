// Stage 1 tutorial balance: make the nutrient cycle visible and required.
(function(){
  const CYCLE_GOAL=3;
  state.regrownFromNutrients=0;
  window.stage1CycleGoal=CYCLE_GOAL;

  // Count only plants created by the nutrient-regrowth system.
  const updateNutrientsBeforeStage1=updateNutrients;
  updateNutrients=function(dtYears){
    const before=state.plants.length;
    updateNutrientsBeforeStage1(dtYears);
    const gained=Math.max(0,state.plants.length-before);
    if(gained>0) state.regrownFromNutrients=(state.regrownFromNutrients||0)+gained;
  };

  // Stage 1 should teach the full cycle, not only survival.
  const requirementsBeforeStage1=stageRequirementsMet;
  stageRequirementsMet=function(){
    if(state.stageIndex===0 && (state.regrownFromNutrients||0)<CYCLE_GOAL) return false;
    return requirementsBeforeStage1();
  };

  const snapshotBeforeStage1=requirementSnapshot;
  requirementSnapshot=function(){
    const items=snapshotBeforeStage1();
    if(state.stageIndex===0){
      items.splice(2,0,{
        ok:(state.regrownFromNutrients||0)>=CYCLE_GOAL,
        text:`♻️ 土の栄養から植物が ${CYCLE_GOAL}つ再生する`,
        now:`いま ${Math.min(state.regrownFromNutrients||0,CYCLE_GOAL)}つ`
      });
    }
    return items;
  };

  const renderStageBeforeStage1=renderStage;
  renderStage=function(){
    renderStageBeforeStage1();
    if(state.stageIndex===0){
      const mission=document.getElementById('stageMission');
      if(mission){
        const n=Math.min(state.regrownFromNutrients||0,CYCLE_GOAL);
        mission.textContent=`うさぎと植物を守りながら、死→土→植物の循環を確かめよう。再生 ${n}/${CYCLE_GOAL}`;
      }
    }
  };

  const startStageBeforeStage1=startStage;
  startStage=function(index){
    startStageBeforeStage1(index);
    state.regrownFromNutrients=0;

    if(state.stageIndex===0){
      // A natural population has mixed ages. One older rabbit guarantees that
      // natural death and soil return can be observed during the four-year tutorial.
      const elder=state.animals.find(a=>a.type==='rabbit');
      if(elder){
        elder.age=3.25;
        elder.maxAge=4.40;
        elder.hunger=Math.max(elder.hunger,75);
        elder.starveTime=0;
      }
      STAGES[0].mission='うさぎと植物を守りながら、死→土→植物の循環を確かめよう。';
      if(typeof LEARNING!=='undefined'){
        LEARNING[0].theme='植物・動物・土の循環';
        LEARNING[0].learn='植物は食べられると減ります。動物が死ぬと栄養が土へ戻り、その栄養から新しい植物が育ちます。';
        LEARNING[0].question='植物が減ったあと、土の栄養が増えると何が起こるかな？';
      }
    }
    renderStage();
    if(typeof renderLearning==='function')renderLearning();
  };

  // Rebuild the current stage once so the tutorial setup is applied immediately.
  startStage(state.stageIndex||0);
})();