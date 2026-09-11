'use strict';
const ACTIVITIES=[
 {id:'guided',name:'Guided Reading',icon:'📖',max:5},
 {id:'mental',name:'Mental Maths',icon:'➗',max:20},
 {id:'literacy',name:'Literacy Starter',icon:'✏️',max:20},
 {id:'weekly',name:'Weekly Roundup',icon:'🔤',max:10},
 {id:'wellbeing',name:'Wellbeing',icon:'💚',max:5},
 {id:'homework',name:'Homework Checker',icon:'🏠',max:1},
 {id:'portal',name:'Teacher Portal',icon:'📊'}
];
const seedNames=['Dexter','Jack','Melita','Scarlett','Jayden','Ani','Katie','Braxton','Kaylen','Bethany','Isaac','Lucy','Blake','Max','Lara','Luiza','Brooklyn','Josh','Jaxon','Brooke','Emily','Thomas','Edie','Daisy','Bodi','April','Clark','Iacob','Ruben'];
let classes=read('cp_classes',[{name:'P7SC',pupils:seedNames,tools:Object.fromEntries(ACTIVITIES.map(a=>[a.id,true]))}]);
// Ensure all activities exist for older saved classes

classes.forEach(c => {

    if(!c.tools){
        c.tools = {};
    }

    ACTIVITIES.forEach(a => {

        if(c.tools[a.id] === undefined){
            c.tools[a.id] = true;
        }

    });

});

// Force Weekly Roundup on

classes.forEach(c => {
    c.tools.weekly = true;
});

save('cp_classes', classes);let records=read('cp_records',[]),classIndex=0,currentActivity=null,currentPupil='',selectedScore=null,portalFilter='All';
const $=id=>document.getElementById(id), save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function read(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
function show(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('hidden',v.id!==id));$('nav').classList.toggle('hidden',id==='login');scrollTo(0,0)}
function today(d=new Date()){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function currentClass(){return classes[classIndex]}
function login(){if($('username').value==='teacher'&&$('password').value==='demo123'){sessionStorage.cp='1';renderHome()}else $('loginError').textContent='Incorrect demo login.'}
function renderHome(){$('classButtons').innerHTML=classes.map((c,i)=>`<button class="tile" data-class="${i}">🏫 ${escapeHtml(c.name)}</button>`).join('');show('home')}
function chooseClass(i){classIndex=Number(i);$('classTitle').textContent=currentClass().name;$('activityTiles').innerHTML=ACTIVITIES.filter(a=>currentClass().tools?.[a.id]!==false).map(a=>`<button class="tile" data-activity="${a.id}">${a.icon} ${a.name}${a.id==='portal'?portalBadge():''}</button>`).join('');show('activities')}
function portalBadge(){const n=records.filter(r=>r.className===currentClass().name&&today(new Date(r.date))===today()&&needsAttention(r)).length;return n?` <span class="badge">${n}</span>`:''}
function openActivity(id){if(id==='portal')return openPortal();currentActivity=ACTIVITIES.find(a=>a.id===id);$('trackerTitle').textContent=currentActivity.name;renderPupils();show('tracker')}
function completedToday(name){return records.some(r=>r.className===currentClass().name&&r.pupil===name&&r.activity===currentActivity.name&&today(new Date(r.date))===today())}
function renderPupils(){$('pupilButtons').innerHTML=currentClass().pupils.map(n=>`<button class="pupil" ${completedToday(n)?'disabled':''} data-pupil="${encodeURIComponent(n)}">${escapeHtml(n)}${completedToday(n)?' ✓':''}</button>`).join('')}
function openScore(name){currentPupil=decodeURIComponent(name);selectedScore=null;document.querySelectorAll('.pupil').forEach(b=>b.classList.toggle('selected',b.dataset.pupil===name));$('scoreHeading').textContent=`${currentPupil} · ${currentActivity.name}`;$('scorePrompt').textContent=`Select a score out of ${currentActivity.max}`;$('scoreButtons').innerHTML=Array.from({length:currentActivity.max+1},(_,v)=>`<button class="score" data-score="${v}">${v}</button>`).join('');$('scoreChoice').classList.add('hidden');$('confirmScore').classList.add('hidden');$('scoreModal').classList.remove('hidden')}
function selectScore(v){selectedScore=Number(v);document.querySelectorAll('.score').forEach(b=>b.classList.toggle('selected',Number(b.dataset.score)===selectedScore));$('scoreChoice').textContent=`Selected score: ${selectedScore} out of ${currentActivity.max}`;$('scoreChoice').classList.remove('hidden');$('confirmScore').classList.remove('hidden')}
function addRecord(){records.unshift({id:crypto.randomUUID?.()||String(Date.now()+Math.random()),date:new Date().toISOString(),className:currentClass().name,pupil:currentPupil,activity:currentActivity.name,details:{Score:selectedScore,'Out of':currentActivity.max}});save('cp_records',records);$('scoreModal').classList.add('hidden');renderPupils()}
function resetActivity(){if(!confirm('Reset today? Today’s entries for this activity will be removed.'))return;records=records.filter(r=>!(r.className===currentClass().name&&r.activity===currentActivity.name&&today(new Date(r.date))===today()));save('cp_records',records);renderPupils()}
function openPortal(){$('portalClass').innerHTML=classes.map((c,i)=>`<option value="${i}" ${i===classIndex?'selected':''}>${escapeHtml(c.name)}</option>`).join('');buildDays();portalFilter='All';renderTabs();renderPortal();show('portal')}
function buildDays() {const days=[...new Set(records.filter(r=>r.className===currentClass().name).map(r=>today(new Date(r.date))))].sort().reverse();$('portalDay').innerHTML=(days.length?days:[today()]).map(d=>`<option>${d}</option>`).join('')}
function renderTabs(){const tabs=['All',...ACTIVITIES.filter(a=>a.id!=='portal').map(a=>a.name)];$('portalTabs').innerHTML=tabs.map(t=>`<button class="tab ${t===portalFilter?'active':''}" data-tab="${escapeHtml(t)}">${escapeHtml(t)}${tabBadge(t)}</button>`).join('')}
function dayRecords(){return records.filter(r=>r.className===currentClass().name&&today(new Date(r.date))===$('portalDay').value)}
function tabBadge(tab){if(tab==='All')return '';const n=new Set(dayRecords().filter(r=>r.activity===tab&&needsAttention(r)).map(r=>r.pupil)).size;return n?` <span class="badge">${n}</span>`:''}
function needsAttention(r){if(r.activity==='Wellbeing')return Number(r.details.Mood)<=2;const s=Number(r.details.Score),m=Number(r.details['Out of']);return Number.isFinite(s)&&m>0&&100*s/m<40}
function renderPortal(){const all=dayRecords(),shown=all.filter(r=>portalFilter==='All'||r.activity===portalFilter);const attention=new Set(all.filter(needsAttention).map(r=>`${r.pupil}|${r.activity}`)).size;$('attentionBadge').textContent=attention;$('attentionBadge').classList.toggle('hidden',!attention);$('summaryCards').innerHTML=[...ACTIVITIES.filter(a=>a.id!=='portal').map(a=>({name:a.name,n:all.filter(r=>r.activity===a.name).length})),{name:'Needs attention',n:attention,attention:true}].map(x=>`<div class="card ${x.attention?'attention':''}"><b>${escapeHtml(x.name)}</b><div class="summary-number">${x.n}</div></div>`).join('');renderChart(shown);$('recordRows').innerHTML=shown.map(r=>`<tr class="${needsAttention(r)?'alert-row':''}"><td>${new Date(r.date).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</td><td>${escapeHtml(r.pupil)}</td><td>${escapeHtml(r.activity)}</td><td>${escapeHtml(Object.entries(r.details).map(([k,v])=>`${k}: ${v}`).join(' | '))}</td><td><div class="action-cell"><button class="small-btn" data-view="${encodeURIComponent(r.pupil)}">View pupil</button><button class="danger" data-delete="${r.id}">Delete</button></div></td></tr>`).join('')||'<tr><td colspan="5">No records.</td></tr>';renderTabs()}
function renderChart(rows){$('chartCard').classList.toggle('hidden',portalFilter==='All');if(portalFilter==='All')return;$('chartTitle').textContent=`${portalFilter} score bands`;const bins=Array(10).fill(0);rows.forEach(r=>{const p=100*Number(r.details.Score||0)/Number(r.details['Out of']||1),i=p<=10?0:Math.min(9,Math.ceil(p/10)-1);bins[i]++});const labels=['0–10','11–20','21–30','31–40','41–50','51–60','61–70','71–80','81–90','91–100'],max=Math.max(1,...bins);$('chart').innerHTML=bins.map((n,i)=>`<div class="bar-wrap"><b>${n}</b><div class="bar ${i<4?'low':''}" style="height:${n/max*100}%"></div><span class="bar-label">${labels[i]}%</span></div>`).join('')}
function viewPupil(name){const pupil=decodeURIComponent(name),start=new Date();start.setDate(start.getDate()-13);$('pupilName').textContent=pupil;const rr=records.filter(r=>r.className===currentClass().name&&r.pupil===pupil&&new Date(r.date)>=start);$('pupilHistory').innerHTML=rr.map(r=>`<div class="history-item ${needsAttention(r)?'attention':''}"><b>${new Date(r.date).toLocaleDateString()}</b> · ${escapeHtml(r.activity)}<p>${escapeHtml(Object.entries(r.details).map(([k,v])=>`${k}: ${v}`).join(' | '))}</p></div>`).join('')||'<p>No responses in the past 14 days.</p>';$('pupilModal').classList.remove('hidden')}
function renderManage(){$('manageClass').innerHTML=classes.map((c,i)=>`<option value="${i}" ${i===classIndex?'selected':''}>${escapeHtml(c.name)}</option>`).join('');$('manageClassName').value=currentClass().name;$('classList').value=currentClass().pupils.join('\n');$('toolCards').innerHTML=ACTIVITIES.map(a=>`<div class="card"><b>${a.icon} ${a.name}</b><label><input type="checkbox" data-tool="${a.id}" ${currentClass().tools?.[a.id]!==false?'checked':''}> Show on home screen</label></div>`).join('');show('manage')}
function saveClass(){currentClass().name=$('manageClassName').value.trim()||currentClass().name;currentClass().pupils=[...new Set($('classList').value.split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean))];document.querySelectorAll('[data-tool]').forEach(x=>currentClass().tools[x.dataset.tool]=x.checked);save('cp_classes',classes);alert('Class saved.');renderManage()}
function exportCSV(){const rows=[['Date','Class','Pupil','Activity','Details'],...dayRecords().map(r=>[r.date,r.className,r.pupil,r.activity,Object.entries(r.details).map(([k,v])=>`${k}: ${v}`).join(' | ')])];const csv=rows.map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=`${currentClass().name}-${$('portalDay').value}.csv`;a.click();URL.revokeObjectURL(a.href)}
function escapeHtml(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
document.addEventListener('click',e=>{const go=e.target.closest('[data-go]');if(go){const v=go.dataset.go;if(v==='home')renderHome();else if(v==='activities')chooseClass(classIndex);else if(v==='manage')renderManage()}const c=e.target.closest('[data-class]');if(c)chooseClass(c.dataset.class);const a=e.target.closest('[data-activity]');if(a)openActivity(a.dataset.activity);const p=e.target.closest('[data-pupil]');if(p)openScore(p.dataset.pupil);const sc=e.target.closest('[data-score]');if(sc)selectScore(sc.dataset.score);const tab=e.target.closest('[data-tab]');if(tab){portalFilter=tab.dataset.tab;renderPortal()}const view=e.target.closest('[data-view]');if(view)viewPupil(view.dataset.view);const del=e.target.closest('[data-delete]');if(del){records=records.filter(r=>r.id!==del.dataset.delete);save('cp_records',records);renderPortal()}});
$('loginBtn').onclick=login;$('logoutBtn').onclick=()=>{sessionStorage.removeItem('cp');show('login')};$('resetBtn').onclick=resetActivity;$('closeScore').onclick=()=>$('scoreModal').classList.add('hidden');$('confirmScore').onclick=addRecord;$('closePupil').onclick=()=>$('pupilModal').classList.add('hidden');$('portalClass').onchange=e=>{classIndex=Number(e.target.value);openPortal()};$('portalDay').onchange=renderPortal;$('exportBtn').onclick=exportCSV;$('fullscreenChart').onclick=()=>$('chartCard').requestFullscreen?.();$('manageClass').onchange=e=>{classIndex=Number(e.target.value);renderManage()};$('saveClassBtn').onclick=saveClass;$('addClassBtn').onclick=()=>{classes.push({name:'New Class',pupils:[],tools:Object.fromEntries(ACTIVITIES.map(a=>[a.id,true]))});classIndex=classes.length-1;save('cp_classes',classes);renderManage()};if(sessionStorage.cp)renderHome();
