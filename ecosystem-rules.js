// Ecosystem core: abundant starting vegetation, nutrient-limited regrowth, and hard land-only movement.
(function(){
  // The continent begins green. Plants do not endlessly respawn by themselves.
  const GREEN_START=[
    {grass:120,sapling:20},
    {grass:132,sapling:22},
    {grass:144,sapling:24},
    {grass:154,sapling:26},
    {grass:164,sapling:28}
  ];
  const GREEN_MIN=[75,85,95,105,115];
  const GRASS_ZONE_MIN=[62,68,74,80,86];
  const SAPLING_ZONE_MIN=[8,9,10,11,12];

  STAGES.forEach((stage,i)=>{
    stage.start.grass=GREEN_START[i].grass;
    stage.start.sapling=GREEN_START[i].sapling;
    stage.required.plants=GREEN_MIN[i];
    if(stage.zones?.grass) stage.zones.grass[0]=GRASS_ZONE_MIN[i];
    if(stage.zones?.sapling) stage.zones.sapling[0]=SAPLING_ZONE_MIN[i];
  });

  // Larger bodies return more nutrients when they die.
  DEATH_PLANT_BONUS.wolf=14;
  DEATH_PLANT_BONUS.fox=9;
  DEATH_PLANT_BONUS.deer=12;
  DEATH_PLANT_BONUS.rabbit=4;
  const STARVATION_NUTRIENTS={wolf:10,fox:7,deer:9,rabbit:3};

  // Expose one simple value for the classroom UI.
  window.soilNutrientAmount=function(){
    return Math.round((state.nutrients||[]).reduce((sum,n)=>sum+Math.max(0,n.remaining||0),0));
  };

  // Plants no longer appear from nowhere. All regrowth is handled by nutrient patches below.
  growPlants=function(){
    plantTimer=0;
  };

  // Natural death is already handled by the base game. Add nutrient return for starvation as well.
  const lifeBeforeCycle=lifeAndDeath;
  lifeAndDeath=function(){
    const before=new Map(state.animals.map(a=>[a.id,{
      id:a.id,type:a.type,x:a.x,y:a.y,age:a.age,maxAge:a.maxAge,starveTime:a.starveTime
    }]));
    lifeBeforeCycle();
    const alive=new Set(state.animals.map(a=>a.id));
    for(const a of before.values()){
      if(alive.has(a.id))continue;
      const wasOld=a.age>=a.maxAge;
      const wasStarved=a.starveTime>.45;
      if(!wasOld&&wasStarved){
        const amount=STARVATION_NUTRIENTS[a.type]||3;
        state.nutrients.push({x:a.x,y:a.y,remaining:amount,timer:.18,life:4.6,type:'starved'});
        addLog(`${SPECIES[a.type].icon}${SPECIES[a.type].name}が餓死し、体の栄養が土へ戻りました。`);
        ticker('動物の死によって、土に植物を育てる栄養が戻った。');
        burst(a.x,a.y,'🍂');
      }
    }
  };

  // Nutrient patches are the only source of new plants.
  updateNutrients=function(dtYears){
    const slow=state.year<state.plantSlowUntil;
    const boost=state.year<state.plantBoostUntil;
    const growthRate=boost?1.7:(slow?.45:1);

    for(const n of state.nutrients){
      n.life=(n.life??4.6)-dtYears;
      n.timer=(n.timer??.2)-dtYears*growthRate;

      if(n.remaining>0&&n.timer<=0){
        n.timer=rand(.20,.44);
        const angle=rand(0,Math.PI*2),r=rand(8,64);
        const pos={x:n.x+Math.cos(angle)*r,y:n.y+Math.sin(angle)*r};
        if(ctx.isPointInPath(state.continent,pos.x,pos.y)){
          const type=Math.random()<.16?'sapling':'grass';
          const current=state.plants.filter(p=>p.type===type).length;
          if(current<CAPS[type]){
            state.plants.push(createPlant(type,pos));
            n.remaining--;
            n.life=Math.max(n.life,.9);
          }
        }
      }
    }
    state.nutrients=state.nutrients.filter(n=>n.remaining>0||n.life>0);
  };

  // Keep the learning text aligned with the nutrient cycle.
  if(typeof LEARNING!=='undefined'){
    LEARNING[0].theme='植物・動物・土のつながり';
    LEARNING[0].learn='最初は植物がたくさんあります。うさぎが食べると植物は減り、動物が死ぬと栄養が土へ戻って新しい植物が育ちます。';
    LEARNING[0].question='うさぎが増え続けたのに、まだ動物があまり死んでいなかったら、植物はどうなるかな？';
    LEARNING[1].learn='狐はうさぎを食べ、うさぎの増えすぎをおさえます。捕食された栄養は狐へ移り、その狐がいつか死ぬと土へ戻ります。';
    LEARNING[2].learn='鹿とうさぎはどちらも植物を食べます。草食動物が多すぎると、土へ栄養が戻るより早く植物が減ってしまいます。';
    LEARNING[3].learn='狼・狐・鹿・うさぎ・植物・土の栄養がつながると、1種類の増減が時間差で大陸全体へ広がります。';
    LEARNING[4].learn='環境の変化が起きても、植物を食べる量と、死によって土へ戻る栄養の両方を見て生態系を立て直します。';
  }

  const note=document.getElementById('controls')?.closest('.panel')?.querySelector('.note');
  if(note)note.textContent='草や木の芽は直接増やせません。動物が死んで土へ栄養が戻ることで、新しい植物が育ちます。';

  // Hard land-only movement.
  function hardMargin(a){
    return Math.max(46,a.radius+34);
  }

  function completelyOnLand(x,y,margin){
    if(!state.continent || !ctx.isPointInPath(state.continent,x,y)) return false;
    const rings=[margin,margin*.72];
    for(const r of rings){
      for(let i=0;i<32;i++){
        const t=Math.PI*2*i/32;
        if(!ctx.isPointInPath(state.continent,x+Math.cos(t)*r,y+Math.sin(t)*r)) return false;
      }
    }
    return true;
  }

  function deepLandPoint(a){
    const margin=hardMargin(a);
    for(let i=0;i<3000;i++){
      const p={x:rand(150,790),y:rand(120,520)};
      if(completelyOnLand(p.x,p.y,margin)) return p;
    }
    return {x:470,y:320};
  }

  function pointInward(a){
    const dx=470-a.x,dy=320-a.y,len=Math.max(1,Math.hypot(dx,dy));
    const speed=SPECIES[a.type].speed*.66;
    a.vx=dx/len*speed;
    a.vy=dy/len*speed;
    a.wanderTimer=Math.max(a.wanderTimer,.6);
  }

  const moveBeforeHardGuard=moveAnimal;
  moveAnimal=function(a,dtYears,dtSec){
    const ox=a.x,oy=a.y;
    moveBeforeHardGuard(a,dtYears,dtSec);
    const margin=hardMargin(a);

    if(!completelyOnLand(a.x,a.y,margin)){
      if(completelyOnLand(ox,oy,margin)){
        a.x=ox;a.y=oy;
      }else{
        const p=deepLandPoint(a);a.x=p.x;a.y=p.y;
      }
      pointInward(a);
      return;
    }

    const look=Math.max(.28,dtSec*5.5);
    const nx=a.x+a.vx*look,ny=a.y+a.vy*look;
    if(!completelyOnLand(nx,ny,margin)) pointInward(a);
  };

  const createBeforeHardGuard=createAnimal;
  createAnimal=function(type,pos=null,newborn=false){
    const a=createBeforeHardGuard(type,pos,newborn);
    if(!completelyOnLand(a.x,a.y,hardMargin(a))){
      const p=deepLandPoint(a);a.x=p.x;a.y=p.y;pointInward(a);
    }
    return a;
  };

  // Nothing is ever painted on the sea.
  draw=function(){
    drawBackground();
    ctx.save();
    ctx.clip(state.continent);
    state.plants.forEach(drawEntity);
    state.animals.forEach(drawEntity);
    for(const p of state.particles){
      ctx.save();ctx.globalAlpha=clamp(p.life/.7,0,1);ctx.font='17px Apple Color Emoji,Segoe UI Emoji,sans-serif';ctx.fillText(p.symbol,p.x,p.y);ctx.restore();
    }
    ctx.restore();
  };

  // Apply the new starting vegetation immediately on page load.
  if(typeof startStage==='function')startStage(state.stageIndex||0);
})();