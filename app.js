(() => {
  "use strict";
  const SPECIES = {
    plant:{name:"植物",emoji:"🌿",max:24}, rabbit:{name:"うさぎ",emoji:"🐇",max:12,image:"assets/rabbit-topdown-v3.png"},
    deer:{name:"鹿",emoji:"🦌",max:8,image:"assets/deer-topdown-v1.png"}, fox:{name:"きつね",emoji:"🦊",max:6,image:"assets/fox-topdown-v1.png"},
    wolf:{name:"おおかみ",emoji:"🐺",max:4,image:"assets/wolf-topdown-v1.png"}
  };
  const STAGES = [
    {title:"植物とうさぎ",lesson:"草を食べる数を考えよう",years:5,species:["plant","rabbit"],ranges:{plant:[8,18],rabbit:[3,6]},initial:{plant:[10,9],rabbit:[1,1]},hint:"うさぎが少ないよ。増やして、草とのつり合いを作ろう。"},
    {title:"きつねの力",lesson:"捕食者が増えすぎを止める",years:5,species:["plant","rabbit","fox"],ranges:{plant:[8,18],rabbit:[3,6],fox:[1,2]},initial:{plant:[6,6],rabbit:[4,4],fox:[0,0]},hint:"うさぎが多すぎる！ うさぎを食べるのはだれ？"},
    {title:"草の取り合い",lesson:"うさぎと鹿は同じ草を食べる",years:5,species:["plant","rabbit","deer","fox"],ranges:{plant:[8,18],rabbit:[3,6],deer:[2,4],fox:[1,2]},initial:{plant:[2,5],rabbit:[2,2],deer:[3,0],fox:[1,0]},hint:"左の大陸だけ草が足りない。鹿を右へ移してみよう。"},
    {title:"おおかみの食物網",lesson:"強い捕食者にも餌が必要",years:6,species:["plant","rabbit","deer","fox","wolf"],ranges:{plant:[8,18],rabbit:[3,6],deer:[2,4],fox:[1,2],wolf:[1,2]},initial:{plant:[6,6],rabbit:[4,4],deer:[3,2],fox:[2,1],wolf:[0,0]},hint:"草食動物もきつねも多い。食物網の頂点を増やそう。"}
  ];

  const $ = id => document.getElementById(id), canvas=$("world"), ctx=canvas.getContext("2d");
  const images={}; Object.entries(SPECIES).forEach(([k,v])=>{if(v.image){const im=new Image(); im.onload=drawWorld; im.src=v.image; images[k]=im;}});
  let state, action={type:"none"}, animation=0;
  const total=k=>state.zones[0][k]+state.zones[1][k];
  const split=(n,preferred=0)=>preferred===0?[Math.ceil(n/2),Math.floor(n/2)]:[Math.floor(n/2),Math.ceil(n/2)];

  function startStage(index){
    const s=STAGES[index]; state={stage:index,year:1,streak:0,zones:[{},{}],ended:false};
    s.species.forEach(k=>{state.zones[0][k]=s.initial[k][0];state.zones[1][k]=s.initial[k][1];}); action={type:"none"}; animation=0; render();
  }
  function status(k){const n=total(k),[lo,hi]=STAGES[state.stage].ranges[k]; if(n===0)return ["red","絶滅の危険"]; if(n<lo)return ["yellow","少なすぎる"]; if(n>hi)return ["yellow","多すぎる"]; return ["green","ちょうどよい"];}
  function allGood(){return STAGES[state.stage].species.every(k=>status(k)[0]==="green");}

  function render(){
    const s=STAGES[state.stage]; $("stageLabel").textContent=`STAGE ${state.stage+1} / 4`; $("stageTitle").textContent=s.title; $("lessonLabel").textContent=s.lesson;
    $("yearLabel").textContent=`${state.year}年目 / ${s.years}年`; $("hint").textContent=s.hint;
    $("streakText").textContent=state.streak?`安定まで あと${2-state.streak}年`:`安定まで あと2年`;
    renderTabs(); renderChain(); renderCards(); renderActions(); drawWorld();
  }
  function renderTabs(){ $("stageTabs").innerHTML=STAGES.map((s,i)=>`<button type="button" data-stage="${i}" class="${i===state.stage?'active':''}">${i+1}. ${s.title}</button>`).join(""); }
  function renderChain(){
    const has=k=>STAGES[state.stage].species.includes(k), alive=k=>!has(k)||total(k)>0; let html="";
    if(has("wolf"))html+=`<span class="chain-node">🐺 おおかみ</span><span class="arrow ${alive('wolf')?'':'broken'}">─食べる→</span><span class="chain-node">🦌鹿・🐇うさぎ・🦊きつね</span><br>`;
    if(has("fox"))html+=`<span class="chain-node">🦊 きつね</span><span class="arrow ${alive('fox')&&alive('rabbit')?'':'broken'}">─食べる→</span>`;
    html+=`<span class="chain-node">🐇${has('deer')?'うさぎ・🦌鹿':'うさぎ'}</span><span class="arrow ${alive('rabbit')&&alive('plant')?'':'broken'}">─食べる→</span><span class="chain-node">🌿 草</span>`;
    $("foodChain").innerHTML=html; $("chainMessage").textContent=allGood()?"食物連鎖がつながっている！":"黄色や赤の生き物を、適正範囲へ戻そう";
  }
  function renderCards(){const s=STAGES[state.stage]; $("speciesCards").innerHTML=s.species.map(k=>{const [c,label]=status(k),r=s.ranges[k];return `<article class="species-card ${c}" data-species="${k}"><span class="species-name">${SPECIES[k].emoji} ${SPECIES[k].name}</span><b class="species-count">${total(k)}</b><small class="range">適正 ${r[0]}〜${r[1]} ／ 最大${SPECIES[k].max}</small><span class="status">● ${label}</span></article>`}).join("");}
  function renderActions(){
    const tabs=[['none','何もしない'],['add','＋ 増やす'],['move','↔ 移す']];
    $("actionTabs").innerHTML=tabs.map(([k,v])=>`<button type="button" data-action="${k}" class="${action.type===k?'active':''}">${v}</button>`).join("");
    const animals=STAGES[state.stage].species.filter(k=>k!=="plant"); let html="";
    if(action.type==="add") html=animals.flatMap(k=>[1,2].map(n=>`<button type="button" class="option-button ${action.species===k&&action.amount===n?'active':''}" data-add="${k}" data-amount="${n}">${SPECIES[k].emoji} ${SPECIES[k].name} +${n}</button>`)).join("");
    if(action.type==="move") html=animals.flatMap(k=>[0,1].map(from=>`<button type="button" class="option-button ${action.species===k&&action.from===from?'active':''}" data-move="${k}" data-from="${from}">${SPECIES[k].emoji} ${from?'右→左':'左→右'} 1匹</button>`)).join("");
    $("actionOptions").innerHTML=html;
    let text="「何もしない」を選択中"; if(action.type==='add'&&action.species)text=`${SPECIES[action.species].name}を${action.amount}匹増やす`; if(action.type==='move'&&action.species)text=`${SPECIES[action.species].name}を${action.from?'右から左':'左から右'}へ1匹移す`;
    $("selectionText").textContent=text; $("nextYearButton").disabled=action.type!=="none"&&!action.species;
  }

  function applyAction(lines){
    if(action.type==='add'){const k=action.species,n=Math.min(action.amount,SPECIES[k].max-total(k));state.zones[state.zones[0][k]<=state.zones[1][k]?0:1][k]+=n;lines.push(`${SPECIES[k].name}を${n}匹増やした`);}
    else if(action.type==='move'){const k=action.species,from=action.from,to=1-from;if(state.zones[from][k]>0){state.zones[from][k]--;state.zones[to][k]++;lines.push(`${SPECIES[k].name}を別の大陸へ移した`);}else lines.push(`${from?'右':'左'}には${SPECIES[k].name}がいなかった`);}
    else lines.push("生き物を増やさず、ようすを見た");
  }
  function remove(k,n){for(let i=0;i<n;i++){const z=state.zones[0][k]>=state.zones[1][k]?0:1;if(state.zones[z][k]>0)state.zones[z][k]--;}}
  function add(k,n){for(let i=0;i<n&&total(k)<SPECIES[k].max;i++)state.zones[state.zones[0][k]<=state.zones[1][k]?0:1][k]++;}
  function setTotal(k,n){const v=split(Math.max(0,Math.min(SPECIES[k].max,n)));state.zones[0][k]=v[0];state.zones[1][k]=v[1];}
  function simulate(){
    const before={};STAGES[state.stage].species.forEach(k=>before[k]=total(k));const lines=[];applyAction(lines);const i=state.stage;
    if(i===0){const r=total('rabbit'); if(r>6){setTotal('plant',Math.max(0,total('plant')-5));lines.push(`うさぎが多すぎる → 草をたくさん食べた`);}else if(r<3){setTotal('plant',Math.min(24,total('plant')+2));lines.push(`うさぎが少ない → 草が増えた`);}else setTotal('plant',Math.max(8,Math.min(18,total('plant')-1)));}
    if(i===1){if(total('fox')>0&&total('rabbit')>6){remove('rabbit',2);lines.push(`きつねがうさぎを食べた → うさぎが${before.rabbit}から${total('rabbit')}に減った`);}if(total('fox')===0){setTotal('plant',Math.max(0,total('plant')-5));lines.push(`うさぎが多い → 植物が${before.plant}から${total('plant')}に減った`);}else if(total('rabbit')<=6){add('plant',1);lines.push("うさぎが減った → 植物が回復し始めた");}}
    if(i===2){if(action.type==='move'&&action.species==='deer'){add('plant',2);lines.push("草を食べる動物が分かれた → 植物が回復した");}else if(state.zones[0].rabbit+state.zones[0].deer>=6){remove('plant',2);lines.push("うさぎと鹿が同じ草を食べた → 左の草が減った");}else add('plant',1);}
    if(i===3){if(total('wolf')>0){if(total('rabbit')>6)remove('rabbit',2);if(total('deer')>4)remove('deer',1);if(total('fox')>2)remove('fox',1);lines.push("おおかみが狩りをした → 多すぎた動物が減った");}else{remove('plant',3);lines.push("草食動物が多い → 植物が大きく減った");}if(total('wolf')>2){remove('rabbit',2);remove('deer',1);remove('fox',1);remove('wolf',1);lines.push("肉食動物が多すぎる → 餌不足でおおかみも減った");}}
    const deaths=STAGES[state.stage].species.slice(1).some(k=>total(k)<before[k]);if(deaths&&lines.length<3){add('plant',1);lines.push("動物が死んだ場所 → 小さな芽が出た 🌱");}
    return {before,lines:lines.slice(0,3)};
  }
  async function advance(){
    $("nextYearButton").disabled=true; const result=simulate(); animation=1; $("animLabel").textContent="生き物たちの1年…";$("animLabel").classList.remove("hidden");
    const start=performance.now(); await new Promise(resolve=>{function frame(t){animation=Math.min(1,(t-start)/2800);drawWorld();if(animation<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
    $("animLabel").classList.add("hidden"); if(allGood())state.streak++;else state.streak=0;
    const extinct=STAGES[state.stage].species.some(k=>total(k)===0),clear=state.streak>=2,timeout=state.year>=STAGES[state.stage].years&&!clear;
    showResult(result.lines,clear,extinct||timeout); render();
  }
  function showResult(lines,clear,failed){
    $("resultIcon").textContent=clear?'🎉':failed?'🥀':allGood()?'🌿':'🔎'; $("resultTitle").textContent=clear?'食物連鎖が安定した！':failed?'もう一度考えてみよう':allGood()?`いいバランス！ あと${2-state.streak}年`:'変化の理由を見てみよう';
    $("resultLines").innerHTML=lines.map(x=>`<p>${x}</p>`).join(''); const b=$("resultButton");
    if(clear){b.textContent=state.stage===3?'最初から遊ぶ':'次のステージへ';b.dataset.next='stage';}else if(failed){b.textContent='このステージをやり直す';b.dataset.next='retry';}else{b.textContent='次の判断へ';b.dataset.next='turn';}
    $("resultOverlay").classList.remove('hidden');
  }
  function closeResult(){const mode=$("resultButton").dataset.next;$("resultOverlay").classList.add('hidden');if(mode==='retry')return startStage(state.stage);if(mode==='stage')return startStage((state.stage+1)%4);state.year++;action={type:'none'};render();}

  function drawWorld(){
    ctx.clearRect(0,0,900,520);const sky=ctx.createLinearGradient(0,0,0,520);sky.addColorStop(0,'#8bd4ed');sky.addColorStop(1,'#4ba4ca');ctx.fillStyle=sky;ctx.fillRect(0,0,900,520);
    const islands=[{x:225,y:270,rx:190,ry:175},{x:680,y:280,rx:175,ry:160}]; islands.forEach((p,z)=>{ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#9b6538';ctx.beginPath();ctx.ellipse(0,0,p.rx,p.ry,-.08,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#714525';ctx.lineWidth=8;ctx.stroke();ctx.fillStyle='#f8e2b5';ctx.font='bold 18px sans-serif';ctx.fillText(z?'右の大陸':'左の大陸',-48,-p.ry+28);ctx.restore();});
    islands.forEach((p,z)=>{let slots=0;STAGES[state.stage].species.forEach(k=>{const count=state.zones[z][k]||0;for(let n=0;n<count;n++){const col=slots%6,row=Math.floor(slots/6);const x=p.x-p.rx+48+col*55+(row%2)*10,y=p.y-p.ry+65+row*58;slots++;if(k==='plant'){ctx.font='28px serif';ctx.fillText('🌿',x-13,y+9);}else{const im=images[k],size=k==='wolf'?52:k==='deer'?48:43;if(im&&im.complete)ctx.drawImage(im,x-size/2,y-size/2,size,size);else{ctx.font='30px serif';ctx.fillText(SPECIES[k].emoji,x-15,y+10);}}}});});
  }

  document.addEventListener('click',e=>{const stage=e.target.closest('[data-stage]');if(stage)return startStage(+stage.dataset.stage);const tab=e.target.closest('[data-action]');if(tab){action={type:tab.dataset.action};return renderActions();}const addBtn=e.target.closest('[data-add]');if(addBtn){action={type:'add',species:addBtn.dataset.add,amount:+addBtn.dataset.amount};return renderActions();}const move=e.target.closest('[data-move]');if(move){action={type:'move',species:move.dataset.move,from:+move.dataset.from};return renderActions();}});
  $("nextYearButton").addEventListener('click',advance); $("resultButton").addEventListener('click',closeResult); $("resetButton").addEventListener('click',()=>startStage(state.stage));
  window.__ecosystem={getState:()=>JSON.parse(JSON.stringify(state)),total,startStage}; startStage(0);
})();
