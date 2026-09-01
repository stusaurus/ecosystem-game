// Native-navigation stage reset for reliable mobile Safari behavior.
(function(){
  const params=new URLSearchParams(location.search);
  const restart=params.get('restart');

  function installResetLink(){
    const old=document.getElementById('v3Reset');
    if(!old || old.tagName==='A') return;
    const stageIndex=Number(state.stageIndex||0);
    const a=document.createElement('a');
    a.id='v3Reset';
    a.className=old.className;
    a.textContent='この面を最初からやり直す';
    a.href=`?restart=${stageIndex}&v=20260901-10`;
    a.style.display='grid';
    a.style.placeItems='center';
    a.style.textDecoration='none';
    old.replaceWith(a);
  }

  const observer=new MutationObserver(installResetLink);
  observer.observe(document.body,{childList:true,subtree:true});
  installResetLink();

  if(restart!==null){
    const index=Math.max(0,Math.min(STAGES.length-1,Number(restart)||0));
    // All game scripts are loaded before this file. Start the requested stage fresh.
    startStage(index);
    const clean=new URL(location.href);
    clean.searchParams.delete('restart');
    history.replaceState(null,'',clean.pathname+clean.search+clean.hash);
  }
})();
