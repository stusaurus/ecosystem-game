// Soil-colored continent and strict animal shoreline guard.
(function(){
  const LAND_CENTER={x:470,y:320};

  function strictOnLand(x,y,margin){
    if(!state.continent||!ctx.isPointInPath(state.continent,x,y))return false;
    const samples=20;
    for(let i=0;i<samples;i++){
      const a=Math.PI*2*i/samples;
      const px=x+Math.cos(a)*margin;
      const py=y+Math.sin(a)*margin;
      if(!ctx.isPointInPath(state.continent,px,py))return false;
    }
    return true;
  }

  function visualMargin(animal){
    return animal.radius+18;
  }

  function strictSafePoint(margin){
    for(let i=0;i<2400;i++){
      const p={x:rand(125,805),y:rand(100,540)};
      if(strictOnLand(p.x,p.y,margin))return p;
    }
    return {x:LAND_CENTER.x,y:LAND_CENTER.y};
  }

  function turnInward(a,strong=false){
    const dx=LAND_CENTER.x-a.x,dy=LAND_CENTER.y-a.y;
    const len=Math.max(1,Math.hypot(dx,dy));
    const base=Math.max(SPECIES[a.type].speed*(strong ? .72 : .55),Math.hypot(a.vx,a.vy)*.72);
    const jitter=rand(-.18,.18);
    const ca=Math.cos(jitter),sa=Math.sin(jitter);
    const ux=dx/len,uy=dy/len;
    a.vx=(ux*ca-uy*sa)*base;
    a.vy=(ux*sa+uy*ca)*base;
    a.wanderTimer=Math.max(a.wanderTimer,.35);
  }

  const previousCreateAnimal=createAnimal;
  createAnimal=function(type,pos=null,newborn=false){
    const a=previousCreateAnimal(type,pos,newborn);
    const margin=visualMargin(a);
    if(!strictOnLand(a.x,a.y,margin)){
      const p=strictSafePoint(margin);
      a.x=p.x;a.y=p.y;
      turnInward(a,true);
    }
    return a;
  };

  const previousMoveAnimal=moveAnimal;
  moveAnimal=function(a,dtYears,dtSec){
    const oldX=a.x,oldY=a.y;
    previousMoveAnimal(a,dtYears,dtSec);
    const margin=visualMargin(a);

    if(!strictOnLand(a.x,a.y,margin)){
      if(strictOnLand(oldX,oldY,margin)){
        a.x=oldX;a.y=oldY;
      }else{
        const p=strictSafePoint(margin);
        a.x=p.x;a.y=p.y;
      }
      turnInward(a,true);
      return;
    }

    const look=Math.max(.10,dtSec*2.4);
    const nx=a.x+a.vx*look,ny=a.y+a.vy*look;
    if(!strictOnLand(nx,ny,margin))turnInward(a,false);
  };

  function secureExistingAnimals(){
    if(!state.continent)return;
    for(const a of state.animals){
      const margin=visualMargin(a);
      if(!strictOnLand(a.x,a.y,margin)){
        const p=strictSafePoint(margin);
        a.x=p.x;a.y=p.y;
        turnInward(a,true);
      }
    }
  }

  drawBackground=function(){
    const sea=ctx.createLinearGradient(0,0,0,VIEW_H);
    sea.addColorStop(0,'#89cff3');
    sea.addColorStop(1,'#c5eafb');
    ctx.fillStyle=sea;
    ctx.fillRect(0,0,VIEW_W,VIEW_H);

    ctx.fillStyle='rgba(255,255,255,.20)';
    for(const d of state.decorations){
      ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.a);ctx.beginPath();
      ctx.ellipse(0,0,d.w,d.h,0,0,Math.PI*2);ctx.fill();ctx.restore();
    }

    ctx.save();
    ctx.shadowColor='rgba(76,52,31,.22)';
    ctx.shadowBlur=18;
    ctx.fillStyle='#b8895b';
    ctx.strokeStyle='#8b633f';
    ctx.lineWidth=4;
    ctx.fill(state.continent);
    ctx.stroke(state.continent);
    ctx.restore();

    ctx.save();
    ctx.clip(state.continent);
    ctx.fillStyle='rgba(104,70,42,.10)';
    ctx.beginPath();
    ctx.ellipse(325,255,185,92,.12,0,Math.PI*2);
    ctx.ellipse(625,245,155,86,-.2,0,Math.PI*2);
    ctx.ellipse(510,448,225,86,.05,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle='rgba(214,174,122,.13)';
    ctx.beginPath();
    ctx.ellipse(485,175,165,62,-.05,0,Math.PI*2);
    ctx.ellipse(295,430,120,55,.2,0,Math.PI*2);
    ctx.fill();
    ctx.restore();

    for(const n of state.nutrients){
      ctx.beginPath();ctx.fillStyle='rgba(72,48,29,.20)';ctx.arc(n.x,n.y,34,0,Math.PI*2);ctx.fill();
    }
  };

  secureExistingAnimals();
})();
