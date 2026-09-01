// Small UI helpers for the nutrient-cycle mechanic.
(function(){
  function nutrient(){
    return typeof window.soilNutrientAmount==='function'?window.soilNutrientAmount():0;
  }

  function ensureNutrientBadge(){
    const badges=document.querySelector('.badges');
    if(!badges||document.getElementById('soilNutrientBadge'))return;
    const span=document.createElement('span');
    span.id='soilNutrientBadge';
    span.className='badge';
    span.innerHTML='土の栄養 <b id="soilNutrientLabel">0</b>';
    badges.appendChild(span);
  }

  function updateNutrientBadge(){
    ensureNutrientBadge();
    const label=document.getElementById('soilNutrientLabel');
    if(label)label.textContent=nutrient();
  }

  function rewriteOpenPanel(){
    const body=document.getElementById('compactDialogBody');
    if(!body)return;

    body.querySelectorAll('.compact-advice-item').forEach(el=>{
      if(el.textContent.includes('植物がかなり少ない')){
        const n=nutrient();
        el.textContent=n>0
          ?`🌿 植物がかなり少ないよ。土の栄養は${n}あるので、動物を増やさず草木が戻るのを待つ判断も大切。`
          :'🌿 植物がかなり少ないのに、土の栄養がほとんどありません。動物を増やすとさらに植物を食べるので、死によって栄養が戻るまでのバランスを考えよう。';
      }
    });

    const plantNote=body.querySelector('.compact-plant-note');
    if(plantNote){
      plantNote.textContent=`🌿🌱 草と木の芽には直接介入できません。植物は動物に食べられて減り、動物が死んで土へ戻した栄養から新しく育ちます。現在の土の栄養：${nutrient()}`;
    }

    if(document.getElementById('compactDialogTitle')?.textContent==='現在の詳細'&&!document.getElementById('cycleDetail')){
      const section=document.createElement('div');
      section.id='cycleDetail';
      section.className='compact-section';
      section.innerHTML=`<div class="compact-section-title">♻️ 命の循環</div><div class="compact-advice">土の栄養：<b>${nutrient()}</b><br>植物 → 草食動物 → 肉食動物 → 死 → 土の栄養 → 植物</div>`;
      const reset=document.getElementById('compactResetStage');
      if(reset)body.insertBefore(section,reset);else body.appendChild(section);
    }
  }

  function attach(){
    document.querySelectorAll('[data-view="advice"],[data-view="detail"],[data-view="intervention"]').forEach(btn=>{
      if(btn.dataset.cycleBound)return;
      btn.dataset.cycleBound='1';
      btn.addEventListener('click',()=>setTimeout(rewriteOpenPanel,0));
    });
  }

  updateNutrientBadge();
  attach();
  setInterval(()=>{
    updateNutrientBadge();
    attach();
    const overlay=document.getElementById('compactOverlay');
    if(overlay&&!overlay.classList.contains('hidden'))rewriteOpenPanel();
  },500);
})();