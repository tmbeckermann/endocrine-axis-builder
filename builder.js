/* Pituitary Pathway Builder
   Pathway content is limited to the supplied course diagram. */
const builderPathways=[
  {id:'medulla',name:'Adrenal medulla',route:'Direct control by nervous system',steps:['Nervous system','Adrenal medulla','Epinephrine and norepinephrine']},
  {id:'acth',name:'ACTH',route:'Anterior pituitary',steps:['Anterior pituitary','ACTH','Adrenal cortex','Glucocorticoids (cortisol, corticosterone)']},
  {id:'tsh',name:'TSH',route:'Anterior pituitary',steps:['Anterior pituitary','TSH','Thyroid gland','Thyroid hormones (T3, T4)']},
  {id:'gh',name:'GH',route:'Anterior pituitary',steps:['Anterior pituitary','GH','Liver','Somatomedins','Bone, muscle, other tissues']},
  {id:'prl',name:'PRL',route:'Anterior pituitary',steps:['Anterior pituitary','PRL','Mammary glands']},
  {id:'fshlh-male',name:'FSH / LH (male)',route:'Anterior pituitary',steps:['Anterior pituitary','FSH and LH','Testes','Testosterone and inhibin']},
  {id:'fshlh-female',name:'FSH / LH (female)',route:'Anterior pituitary',steps:['Anterior pituitary','FSH and LH','Ovaries','Estrogen, progesterone, and inhibin']},
  {id:'msh',name:'MSH',route:'Anterior pituitary',steps:['Anterior pituitary','MSH','Melanocytes']},
  {id:'adh',name:'ADH',route:'Posterior pituitary',steps:['Posterior pituitary','ADH','Kidneys']},
  {id:'oxt-male',name:'OXT (male)',route:'Posterior pituitary',steps:['Posterior pituitary','OXT','Smooth muscle in ductus deferens and prostate gland']},
  {id:'oxt-female',name:'OXT (female)',route:'Posterior pituitary',steps:['Posterior pituitary','OXT','Uterine smooth muscle and mammary glands']}
];

let builderMastery=JSON.parse(localStorage.getItem('pituitaryBuilderMastery')||'{}');
let builderState={index:1,mystery:false,cards:[],selected:null,placements:{},attempts:0,results:null};

function builderShuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function currentBuilderPath(){return builderPathways[builderState.index]}

function loadBuilder(index,mystery=false){
  builderState.index=index;
  builderState.mystery=mystery;
  builderState.selected=null;
  builderState.placements={};
  builderState.attempts=0;
  builderState.results=null;
  const p=currentBuilderPath();
  builderState.cards=builderShuffle(p.steps.map((text,i)=>({id:`${p.id}-${i}`,text,correctIndex:i})));
  renderBuilder();
}

function renderBuilder(){
  const p=currentBuilderPath();
  document.getElementById('builderTitle').textContent=builderState.mystery?'Mystery pathway':`${p.name} pathway`;
  document.getElementById('builderRoute').innerHTML=`<span class="builder-route-chip">${p.route}</span>`;
  document.getElementById('builderAttempts').textContent=builderState.attempts;
  document.getElementById('builderPlaced').textContent=`${Object.keys(builderState.placements).length} / ${p.steps.length}`;
  renderBuilderList();
  renderBuilderSlots();
  renderBuilderCards();
  updateBuilderMastery();
  if(!builderState.results)document.getElementById('builderFeedback').textContent='Build the pathway before checking.';
}

function renderBuilderList(){
  const el=document.getElementById('builderPathList');
  el.innerHTML='';
  builderPathways.forEach((p,i)=>{
    const b=document.createElement('button');
    b.className='builder-path-btn'+(i===builderState.index&&!builderState.mystery?' active':'')+(builderMastery[p.id]?' mastered':'');
    b.innerHTML=`<strong>${p.name}</strong><span>${p.route} · ${p.steps.length} steps</span>`;
    b.onclick=()=>loadBuilder(i,false);
    el.appendChild(b);
  });
}

function renderBuilderSlots(){
  const p=currentBuilderPath();
  const el=document.getElementById('builderSlots');
  el.style.gridTemplateColumns=`repeat(${Math.min(p.steps.length,5)},minmax(0,1fr))`;
  el.innerHTML='';
  p.steps.forEach((_,i)=>{
    const placedId=builderState.placements[i];
    const card=builderState.cards.find(c=>c.id===placedId);
    const slot=document.createElement('section');
    const result=builderState.results?.[i];
    slot.className='builder-slot'+(result===true?' correct':result===false?' incorrect':'');
    slot.innerHTML=`<div class="builder-slot-header"><span class="builder-slot-number">${i+1}</span><small>Step ${i+1}</small></div>`;
    if(card){
      const b=document.createElement('button');
      b.className='builder-card';
      b.textContent=card.text;
      b.onclick=e=>{e.stopPropagation();delete builderState.placements[i];builderState.results=null;renderBuilderSlots();renderBuilderCards();updateBuilderPlaced();document.getElementById('builderFeedback').textContent='Card removed. Revise the pathway, then check again.'};
      slot.appendChild(b);
    }
    slot.onclick=()=>placeBuilderCard(i);
    el.appendChild(slot);
  });
}

function renderBuilderCards(){
  const el=document.getElementById('builderCards');
  el.innerHTML='<div class="builder-card-bank-label">Shuffled pathway pieces</div>';
  const used=Object.values(builderState.placements);
  builderState.cards.filter(c=>!used.includes(c.id)).forEach(card=>{
    const b=document.createElement('button');
    b.className='builder-card'+(builderState.selected===card.id?' selected':'');
    b.textContent=card.text;
    b.onclick=()=>{builderState.selected=builderState.selected===card.id?null:card.id;renderBuilderCards()};
    el.appendChild(b);
  });
  if(used.length===builderState.cards.length){
    const d=document.createElement('div');
    d.className='builder-card';
    d.textContent='All pieces placed. Check the pathway or remove a piece to revise.';
    el.appendChild(d);
  }
}

function placeBuilderCard(slotIndex){
  if(!builderState.selected)return;
  Object.keys(builderState.placements).forEach(k=>{if(builderState.placements[k]===builderState.selected)delete builderState.placements[k]});
  builderState.placements[slotIndex]=builderState.selected;
  builderState.selected=null;
  builderState.results=null;
  renderBuilderSlots();
  renderBuilderCards();
  updateBuilderPlaced();
}

function updateBuilderPlaced(){
  const p=currentBuilderPath();
  document.getElementById('builderPlaced').textContent=`${Object.keys(builderState.placements).length} / ${p.steps.length}`;
}

function checkBuilder(){
  const p=currentBuilderPath();
  builderState.attempts++;
  document.getElementById('builderAttempts').textContent=builderState.attempts;
  if(Object.keys(builderState.placements).length<p.steps.length){
    document.getElementById('builderFeedback').innerHTML='<strong>Not ready yet.</strong> Place every pathway piece before checking.';
    return;
  }
  const results={};
  let correct=0;
  p.steps.forEach((_,i)=>{
    const card=builderState.cards.find(c=>c.id===builderState.placements[i]);
    results[i]=card?.correctIndex===i;
    if(results[i])correct++;
  });
  builderState.results=results;
  renderBuilderSlots();
  if(correct===p.steps.length){
    builderMastery[p.id]=true;
    localStorage.setItem('pituitaryBuilderMastery',JSON.stringify(builderMastery));
    updateBuilderMastery();
    renderBuilderList();
    const reveal=builderState.mystery?` You reconstructed the <strong>${p.name}</strong> pathway.`:'';
    document.getElementById('builderFeedback').innerHTML=`<strong>Complete.</strong> ${p.steps.join(' → ')}.${reveal}`;
  }else{
    const n=p.steps.length-correct;
    document.getElementById('builderFeedback').innerHTML=`<strong>${correct} of ${p.steps.length} positions are correct.</strong> ${n} position${n===1?' needs':'s need'} revision.`;
  }
}

function updateBuilderMastery(){
  const n=builderPathways.filter(p=>builderMastery[p.id]).length;
  document.getElementById('builderMastered').textContent=`${n} / ${builderPathways.length}`;
}

function showBuilderMode(){
  pitState.mode='builder';
  document.querySelectorAll('.pit-mode').forEach(b=>b.classList.toggle('active',b.dataset.mode==='builder'));
  document.getElementById('pitMapMode').classList.add('hide');
  document.getElementById('pitRecallMode').classList.add('hide');
  document.getElementById('pitBuilderMode').classList.remove('hide');
  document.getElementById('pitHideLabels').style.display='none';
  document.getElementById('pitNextQuestion').style.display='none';
  renderBuilder();
}

function showExistingPitMode(mode){
  document.getElementById('pitBuilderMode').classList.add('hide');
  document.getElementById('pitHideLabels').style.display='';
  document.getElementById('pitNextQuestion').style.display='';
  setPitMode(mode);
}

/* app.js installs the original mode handlers first; replace them after it loads. */
document.querySelectorAll('.pit-mode').forEach(b=>{
  b.onclick=()=>b.dataset.mode==='builder'?showBuilderMode():showExistingPitMode(b.dataset.mode);
});

document.getElementById('builderCheck').onclick=checkBuilder;
document.getElementById('builderReset').onclick=()=>loadBuilder(builderState.index,builderState.mystery);
document.getElementById('builderMystery').onclick=()=>{
  let i=Math.floor(Math.random()*builderPathways.length);
  if(builderPathways.length>1&&i===builderState.index)i=(i+1)%builderPathways.length;
  loadBuilder(i,true);
};

loadBuilder(1,false);
