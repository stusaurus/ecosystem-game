// Stage 2 balance: foxes should be able to restrain rabbit growth.
(function(){
  const BASE={
    offspring:2,
    breedCooldown:.7,
    mealsToBreed:2
  };

  // Start with a little less pressure on vegetation.
  STAGES[1].start.rabbit=12;

  function applyStage2RabbitRules(){
    if(state.stageIndex===1){
      SPECIES.rabbit.offspring=1;
      SPECIES.rabbit.breedCooldown=1.10;
      SPECIES.rabbit.mealsToBreed=3;
    }else if(state.stageIndex!==0){
      // Stage 1 has its own rules in stage1-balance.js.
      SPECIES.rabbit.offspring=BASE.offspring;
      SPECIES.rabbit.breedCooldown=BASE.breedCooldown;
      SPECIES.rabbit.mealsToBreed=BASE.mealsToBreed;
    }
  }

  const startStageBeforeStage2=startStage;
  startStage=function(index){
    startStageBeforeStage2(index);
    applyStage2RabbitRules();

    if(state.stageIndex===1){
      // Prevent the initial rabbits from reproducing immediately at the start.
      state.animals.filter(a=>a.type==='rabbit').forEach(a=>{
        a.meals=0;
        a.breedCooldown=Math.max(a.breedCooldown,.65);
      });

      STAGES[1].mission='狐がうさぎの増えすぎを抑える関係を見ながら、6年間共存させよう。';
      if(typeof LEARNING!=='undefined'){
        LEARNING[1].theme='捕食者が数の増えすぎを抑える';
        LEARNING[1].learn='狐がうさぎを食べると、うさぎが植物を食べすぎるのを抑えられます。狐が少なすぎても、多すぎてもバランスは崩れます。';
        LEARNING[1].question='うさぎが増えすぎたとき、狐を増やすと植物はどう変わるかな？';
      }
      renderStage();
      if(typeof renderLearning==='function')renderLearning();
    }
  };
})();
