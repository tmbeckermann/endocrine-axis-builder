/* Mixed Pituitary Mastery
   Uses the same builderPathways defined in builder.js. */
let mixedState={count:3,paths:[],cards:[],selected:null,placements:{},attempts:0,results:null,rounds:parseInt(localStorage.getItem('pituitaryMixedRounds')||'0',10)};

function mixedShuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

function startMixed(){
  mixedState.count=parseInt(document.getElementById('mixedCount').value,10);
  mixedState.paths=mixedShuffle(builderPathways).slice(0,mixedState.count);
  mixedState.cards=[];
  mixedState.selected=null;
  mixedState.placements={};
  mixedState.attempts=0;
  mixedState.results=null;
  mixedState.paths.forEach(p=>p.steps.forEach((text,stepIndex)=>mixedState.cards.push({id:`${p.id}-${stepIndex}`,pathId:p.id,text,correctIndex:stepIndex})));
  mixedState.cards=mixedShuffle(mixedState.cards);
  renderMixed();
}

function showMixedMode(){
  pitState.mode='mixed';
  document.querySelectorAll('.pit-mode').forEach(b=>b.classList.toggle('active',b.dataset.mode==='mixed'));
  document.getElementById('pitMapMode').classList.add('hide');
  document.getElementById('pitRecallMode').classList.add('hide');
  document.getElementById('pitBuilderMode').classList.add('hide');
  document.getElementById('pitMixedMode').classList.remove('hide');
  document.getElementById('pitHideLabels').style.display='none';
  document.getElementById('pitNextQuestion').style.display='none';
  if(!mixedState.paths.length)startMixed(); else renderMixed();
}

function showNonMixedMode(mode){
  document.getElementById('pitMixedMode').classList.add('hide');
  if(mode==='builder')showBuilderMode(); else showExistingPitMode(mode);
}

document.querySelectorAll('.pit-mode').forEach(b=>{
  b.onclick=()=>b.dataset.mode==='mixed'?showMixedMode():showNonMixedMode(b.dataset.mode);
});

function renderMixed(){
  document.getElementById('mixedAttempts').textContent=mixedState.attempts;
  document.getElementById('mixedMastered').textContent=mixedState.rounds;
  document.getElementById('mixedDifficulty').textContent=`${mixedState.count} pathways`;
  renderMixedLanes();
  renderMixedCards();
  updateMixedRemaining();
  if(!mixedState.results)document.getElementById('mixedFeedback').textContent='Select a card, then choose its numbered slot in the correct pathway.';
}

function renderMixedLanes(){
  const el=document.getElementById('mixedLanes');
  el.innerHTML='';
  mixedState.paths.forEach(p=>{
    const lane=document.createElement('section');
    const laneResult=mixedState.results?.lanes?.[p.id];
    lane.className='mixed-lane'+(laneResult===true?' correct':laneResult===false?' incorrect':'');
    lane.innerHTML=`<div class="mixed-lane-header"><div><h3>${p.name}</h3><p>${p.route}</p></div><span class="route-badge">${p.steps.length} steps</span></div>`;
    const row=document.createElement('div');
    row.className='mixed-slot-row';
    row.style.gridTemplateColumns=`repeat(${Math.min(p.steps.length,5)},minmax(0,1fr))`;
    p.steps.forEach((_,i)=>{
      const slot=document.createElement('section');
      const key=`${p.id}:${i}`;
      const placedId=mixedState.placements[key];
      const card=mixedState.cards.find(c=>c.id===placedId);
      const result=mixedState.results?.slots?.[key];
      slot.className='mixed-slot'+(result===true?' correct':result===false?' incorrect':'');
      slot.innerHTML=`<div class="mixed-slot-head"><span class="mixed-slot-number">${i+1}</span><span>Step ${i+1}</span></div>`;
      if(card){
        const b=document.createElement('button');
        b.className='mixed-card';
        b.textContent=card.text;
        b.onclick=e=>{e.stopPropagation();delete mixedState.placements[key];mixedState.results=null;renderMixedLanes();renderMixedCards();updateMixedRemaining();document.getElementById('mixedFeedback').textContent='Card removed. Revise the pathways, then check again.'};
        slot.appendChild(b);
      }
      slot.onclick=()=>placeMixedCard(key);
      row.appendChild(slot);
    });
    lane.appendChild(row);
    el.appendChild(lane);
  });
}

function renderMixedCards(){
  const el=document.getElementById('mixedCards');
  el.innerHTML='';
  const used=Object.values(mixedState.placements);
  mixedState.cards.filter(c=>!used.includes(c.id)).forEach(card=>{
    const b=document.createElement('button');
    b.className='mixed-card'+(mixedState.selected===card.id?' selected':'');
    b.textContent=card.text;
    b.onclick=()=>{mixedState.selected=mixedState.selected===card.id?null:card.id;renderMixedCards()};
    el.appendChild(b);
  });
  if(used.length===mixedState.cards.length){
    const d=document.createElement('div');
    d.className='small';
    d.textContent='All cards placed. Check all pathways or remove a card to revise.';
    el.appendChild(d);
  }
}

function placeMixedCard(key){
  if(!mixedState.selected)return;
  Object.keys(mixedState.placements).forEach(k=>{if(mixedState.placements[k]===mixedState.selected)delete mixedState.placements[k]});
  mixedState.placements[key]=mixedState.selected;
  mixedState.selected=null;
  mixedState.results=null;
  renderMixedLanes();
  renderMixedCards();
  updateMixedRemaining();
}

function updateMixedRemaining(){
  const remaining=mixedState.cards.length-Object.keys(mixedState.placements).length;
  document.getElementById('mixedRemaining').textContent=`${remaining} card${remaining===1?'':'s'} remaining`;
}

function checkMixed(){
  mixedState.attempts++;
  document.getElementById('mixedAttempts').textContent=mixedState.attempts;
  if(Object.keys(mixedState.placements).length<mixedState.cards.length){
    document.getElementById('mixedFeedback').innerHTML='<strong>Not ready yet.</strong> Place every card before checking.';
    return;
  }
  const slots={};
  const lanes={};
  let totalCorrect=0;
  mixedState.paths.forEach(p=>{
    let laneCorrect=true;
    p.steps.forEach((_,i)=>{
      const key=`${p.id}:${i}`;
      const card=mixedState.cards.find(c=>c.id===mixedState.placements[key]);
      const ok=card?.pathId===p.id&&card?.correctIndex===i;
      slots[key]=ok;
      if(ok)totalCorrect++; else laneCorrect=false;
    });
    lanes[p.id]=laneCorrect;
  });
  mixedState.results={slots,lanes};
  renderMixedLanes();
  const total=mixedState.cards.length;
  if(totalCorrect===total){
    mixedState.rounds++;
    localStorage.setItem('pituitaryMixedRounds',String(mixedState.rounds));
    document.getElementById('mixedMastered').textContent=mixedState.rounds;
    document.getElementById('mixedFeedback').innerHTML=`<strong>Mixed round mastered.</strong> You correctly separated and reconstructed all ${mixedState.count} pathways.`;
    const el=document.getElementById('pitMixedMode');
    el.classList.remove('mixed-celebration');void el.offsetWidth;el.classList.add('mixed-celebration');
  }else{
    const wrong=total-totalCorrect;
    const completeLanes=Object.values(lanes).filter(Boolean).length;
    document.getElementById('mixedFeedback').innerHTML=`<strong>${totalCorrect} of ${total} positions correct.</strong> ${completeLanes} of ${mixedState.count} pathways are fully correct. Revise ${wrong} position${wrong===1?'':'s'}.`;
  }
}

document.getElementById('mixedNew').onclick=startMixed;
document.getElementById('mixedCheck').onclick=checkMixed;
document.getElementById('mixedCount').onchange=startMixed;
