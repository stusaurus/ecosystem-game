// Reliable current-stage restart. Reuses the same stage-button path that already works in the game.
(function(){
  function install(){
    const btn=document.getElementById('v3Reset');
    if(!btn)return;

    // ui-v3 recreates this button whenever Details opens, so replace its handler each time.
    btn.onclick=function(e){
      e.preventDefault();
      e.stopPropagation();

      // Close the details overlay first.
      const overlay=document.getElementById('v3Overlay');
      if(overlay)overlay.classList.add('hidden');

      const index=Number(state.stageIndex||0);
      const stageBtn=document.querySelector(`.stage-btn[data-stage="${index}"]`);

      // Use the exact same route as tapping the current stage number.
      if(stageBtn && !stageBtn.disabled){
        stageBtn.click();
      }else if(typeof startStage==='function'){
        startStage(index);
      }
    };
  }

  // The Details panel is rendered dynamically, so bind after each DOM change.
  const observer=new MutationObserver(install);
  observer.observe(document.body,{childList:true,subtree:true});
  install();
})();
