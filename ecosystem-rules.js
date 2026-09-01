// Strong classroom ecosystem rules: abundant green cover and a hard land-only animal zone.
(function(){
  // A healthy ecosystem must keep a substantial producer base.
  const GREEN_MIN=[55,65,75,85,95];
  const GRASS_ZONE_MIN=[45,50,56,62,68];
  const SAPLING_ZONE_MIN=[7,8,10,11,12];
  STAGES.forEach((stage,i)=>{
    stage.required.plants=GREEN_MIN[i];
    if(stage.zones?.grass) stage.zones.grass[0]=GRASS_ZONE_MIN[i];
    if(stage.zones?.sapling) stage.zones.sapling[0]=SAPLING_ZONE_MIN[i];
  });

  function hardMargin(a){
    // Large visual buffer: the whole emoji plus its shadow/energy bar stays inland.
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

    // Look far enough ahead that fast animals cannot step across the coast between frames.
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

  // Final visual safety net: animals/plants/particles can never be painted on the sea.
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

  // Re-home any animals that existed before this file loaded.
  for(const a of state.animals){
    if(!completelyOnLand(a.x,a.y,hardMargin(a))){
      const p=deepLandPoint(a);a.x=p.x;a.y=p.y;pointInward(a);
    }
  }

  if(typeof renderStage==='function') renderStage();
  if(typeof renderLearning==='function') renderLearning();
})();