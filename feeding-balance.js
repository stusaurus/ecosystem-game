// Feeding balance: animals should not eat while almost full.
(function(){
  const baseEatAndBreed=eatAndBreed;

  eatAndBreed=function(){
    const blocked=[];

    for(const a of state.animals){
      const d=SPECIES[a.type];
      if(!d)continue;
      const herbivore=!!(d.diet.grass||d.diet.sapling);
      const threshold=herbivore?72:82;

      // app.js allows eating below 94 hunger. Temporarily mark animals above
      // the new threshold as full so touching food does not consume it.
      if(a.hunger>=threshold&&a.hunger<94){
        blocked.push([a,a.hunger]);
        a.hunger=94;
      }
    }

    baseEatAndBreed();

    for(const [a,hunger] of blocked){
      if(state.animals.includes(a))a.hunger=hunger;
    }
  };
})();
