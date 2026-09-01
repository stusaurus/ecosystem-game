// First visual upgrade: a field-guide rabbit and living grassland.
// Simulation rules stay in the existing files; this layer only changes drawing.
(function(){
  const rabbitSprite=new Image();
  rabbitSprite.src='assets/rabbit-topdown-v2.png?v=20260901-1';

  const previousDrawEntity=drawEntity;
  const groundMarks=Array.from({length:54},(_,i)=>({
    x:128+((i*137)%676),
    y:98+((i*83)%438),
    rx:18+(i%5)*7,
    ry:7+(i%4)*4,
    angle:((i%9)-4)*.12,
    light:i%3===0
  }));

  function drawSea(){
    const sea=ctx.createLinearGradient(0,0,0,VIEW_H);
    sea.addColorStop(0,'#83c9e8');
    sea.addColorStop(.55,'#a9ddec');
    sea.addColorStop(1,'#c8e7e3');
    ctx.fillStyle=sea;
    ctx.fillRect(0,0,VIEW_W,VIEW_H);

    ctx.fillStyle='rgba(255,255,255,.18)';
    for(const d of state.decorations){
      ctx.save();
      ctx.translate(d.x,d.y);
      ctx.rotate(d.a);
      ctx.beginPath();
      ctx.ellipse(0,0,d.w,d.h,0,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawBackground=function(){
    drawSea();

    ctx.save();
    ctx.shadowColor='rgba(55,67,38,.24)';
    ctx.shadowBlur=20;
    ctx.fillStyle='#827a50';
    ctx.strokeStyle='#667244';
    ctx.lineWidth=4;
    ctx.fill(state.continent);
    ctx.stroke(state.continent);
    ctx.restore();

    ctx.save();
    ctx.clip(state.continent);

    // Permanent, low-contrast ground texture keeps the island from looking flat.
    for(const m of groundMarks){
      ctx.save();
      ctx.translate(m.x,m.y);
      ctx.rotate(m.angle);
      ctx.fillStyle=m.light?'rgba(190,169,103,.10)':'rgba(64,91,48,.10)';
      ctx.beginPath();
      ctx.ellipse(0,0,m.rx,m.ry,0,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    // Every living plant greens the soil around it. When plants are eaten, the
    // exposed earth becomes visible without changing any population rules.
    for(const p of state.plants){
      const radius=p.type==='sapling'?25:18;
      ctx.beginPath();
      ctx.fillStyle=p.type==='sapling'?'rgba(66,115,54,.13)':'rgba(83,133,57,.17)';
      ctx.arc(p.x,p.y,radius,0,Math.PI*2);
      ctx.fill();
    }

    for(const n of state.nutrients){
      const soil=ctx.createRadialGradient(n.x,n.y,4,n.x,n.y,38);
      soil.addColorStop(0,'rgba(74,50,29,.34)');
      soil.addColorStop(1,'rgba(74,50,29,0)');
      ctx.fillStyle=soil;
      ctx.beginPath();
      ctx.arc(n.x,n.y,38,0,Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  };

  function drawGrass(p){
    const seed=p.id||1;
    const scale=.78+(seed%5)*.075;
    const lean=((seed%7)-3)*.055;
    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.rotate(lean);
    ctx.scale(scale,scale);
    ctx.lineCap='round';
    ctx.lineWidth=1.35;
    const blades=[[-5,5,-3,-5],[-2,6,-1,-8],[1,6,2,-10],[4,5,6,-6],[0,6,-5,-3]];
    blades.forEach((b,i)=>{
      ctx.strokeStyle=i%2?'#4f7e3f':'#678f43';
      ctx.beginPath();
      ctx.moveTo(b[0],b[1]);
      ctx.quadraticCurveTo((b[0]+b[2])*.45-1,b[3]*.15,b[2],b[3]);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawSapling(p){
    const seed=p.id||1;
    const scale=.82+(seed%4)*.08;
    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.scale(scale,scale);
    ctx.strokeStyle='#6d5434';
    ctx.lineWidth=1.6;
    ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(0,7);
    ctx.quadraticCurveTo(-1,0,1,-9);
    ctx.stroke();
    ctx.fillStyle='#4f7e3f';
    [[-4,-3,-.45],[5,-6,.55],[-3,-9,-.65]].forEach(([x,y,a])=>{
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0,0,4.2,2.1,0,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  function drawRabbit(a){
    const d=SPECIES.rabbit;
    const adult=clamp(a.age/d.adultAge,0,1);
    const scale=.68+adult*.32;
    const width=42*scale;
    const height=64*scale;
    const direction=Math.atan2(a.vy,a.vx)+Math.PI/2;
    const hop=Math.sin(performance.now()*.011+a.id*1.7)*1.1*scale;

    ctx.save();
    ctx.translate(a.x,a.y);
    ctx.fillStyle='rgba(28,35,20,.20)';
    ctx.beginPath();
    ctx.ellipse(0,height*.30,width*.40,height*.14,direction,0,Math.PI*2);
    ctx.fill();

    if(state.selectedId===a.id){
      ctx.strokeStyle='#183f52';
      ctx.lineWidth=2.5;
      ctx.beginPath();
      ctx.arc(0,0,Math.max(width,height)*.55,0,Math.PI*2);
      ctx.stroke();
    }

    ctx.save();
    ctx.rotate(direction);
    ctx.translate(0,hop);
    if(rabbitSprite.complete&&rabbitSprite.naturalWidth){
      ctx.drawImage(rabbitSprite,-width/2,-height/2,width,height);
    }else{
      // Keep the game usable while the small asset finishes loading.
      ctx.font=`${Math.round(24*scale)}px Apple Color Emoji,Segoe UI Emoji,sans-serif`;
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      ctx.fillText(d.icon,0,0);
    }
    ctx.restore();

    const hp=clamp(a.hunger/100,0,1);
    const barWidth=Math.max(18,width*.78);
    const barY=-height*.57;
    ctx.fillStyle='rgba(255,255,255,.86)';
    ctx.fillRect(-barWidth/2,barY,barWidth,3.5);
    ctx.fillStyle=hp>.55?'#4ca668':hp>.25?'#e4ad43':'#c85c50';
    ctx.fillRect(-barWidth/2,barY,barWidth*hp,3.5);
    ctx.restore();
  }

  drawEntity=function(e){
    if(e.type==='grass'){drawGrass(e);return;}
    if(e.type==='sapling'){drawSapling(e);return;}
    if(e.type==='rabbit'){drawRabbit(e);return;}
    previousDrawEntity(e);
  };
})();
