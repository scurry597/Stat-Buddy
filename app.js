'use strict';
const $=id=>document.getElementById(id),clone=x=>JSON.parse(JSON.stringify(x)),uid=()=>crypto.randomUUID?.()||String(Date.now()+Math.random()),read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const PUPILS=['Adam','Benjamin','Caleb','Daniel','Ezekial','Frank','Gideon','Haggai','Isaac','Jericho','Kosher','Liam','Michael','Nun','Opal','Pepper','Queen','Rachel','Samuel','Timothy','Urail','Violet','William','Xandar','Young','Zechariah'];
const BUILT_INS={wellbeing:{name:'Wellbeing Check',icon:'💚',type:'wellbeing'},score:{name:'Score Tracker',icon:'🔢',type:'score',entries:[{label:'Score',defaultMax:20}],groups:[{name:'Africa',maxima:[20],pupils:[...PUPILS]}]},dragdrop: {
    name: 'Drag & Drop',
    icon: '📦',
    type: 'dragdrop',

    sections: [
        {
            id: 'section-1',
            name: 'Section 1',
            colour: '#dcfce7'
        },
        {
            id: 'section-2',
            name: 'Section 2',
            colour: '#fee2e2'
        },
        {
            id: 'section-3',
            name: 'Section 3',
            colour: '#fef3c7'
        }
    ],

    feedbackEnabled: true,

    feedbackPrompt: 'How did you find this task?',

    feedbackOptions: [
        'I felt confident',
        'I needed a little help',
        'I needed a lot of help'
    ]
},guided:{name:'Guided Reading',icon:'📖',type:'guided',criteria:['Fluency','Diction','Volume','Expression','Comprehension'],groups:[{name:'Africa',book:'',pupils:[...PUPILS]}]},record:{name:'Individual Pupil Record',icon:'📝',type:'record',entryLabel:'Record title'},learning:{name:'Learning Intention Tracker',icon:'🎯',type:'learning',subjects:['Literacy','Numeracy','WAU','PDMU','PE','ICT'],outcomes:['Achieving Learning Intention','Working towards','Not quite achieving yet'],allowOverride:true,notes:true,groups:[{name:'Africa',defaultLI:'',pupils:[...PUPILS]}]}};
function makeTool(key,builtIn=true){return{id:builtIn?key:uid(),...clone(BUILT_INS[key]),enabled:true,builtIn,sourceTemplate:BUILT_INS[key].name}}
let classes=read('sb_li_classes',[{id:uid(),name:'Demo Class',pupils:[...PUPILS],tools:Object.keys(BUILT_INS).map(k=>makeTool(k))}]),records=read('sb_li_records',[]),ci=0,tool=null,pupil='',draft={},sessionLI='',sessionSubject='',filter='All',editId='';
const cls=()=>classes[ci],find=id=>cls().tools.find(t=>t.id===id),day=(d=new Date())=>d.toISOString().slice(0,10),esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
function show(id){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('hidden',p.id!==id));$('nav').classList.toggle('hidden',id==='login')}function renderClasses(){$('classTiles').innerHTML=classes.map((c,i)=>`<button class="tile" data-class="${i}">🏫 ${esc(c.name)}</button>`).join('');show('classes')}function renderTools(){$('classTitle').textContent=cls().name;$('toolTiles').innerHTML=cls().tools.filter(t=>t.enabled).map(t=>`<button class="tile" data-tool="${t.id}">${t.icon} ${esc(t.name)}</button>`).join('');show('tools')}function done(n){return records.some(r=>r.classId===cls().id&&r.toolId===tool.id&&r.pupil===n&&day(new Date(r.date))===day())}
function openTool(id){tool=find(id);if (tool.type === 'dragdrop') {
    openDragDropTool();
    return;
}sessionLI='';sessionSubject='';$('trackerTitle').textContent=tool.name;if(tool.type==='learning'){$('sessionSetup').innerHTML=`<div class="li-banner"><label>Subject<select id="sessionSubject"><option value="">Select subject</option>${(tool.subjects||[]).map(s=>`<option>${esc(s)}</option>`).join('')}</select></label><label>Learning Intention for this session<input id="sessionLI" placeholder="Enter the Learning Intention"></label><button id="saveSessionLI" class="primary">Use this Learning Intention</button><span id="liSaved"></span></div>`}else $('sessionSetup').innerHTML='';renderPupils();show('tracker')}function renderPupils(){$('pupilTiles').innerHTML=cls().pupils.map(n=>`<button class="pupil" ${done(n)?'disabled':''} data-pupil="${encodeURIComponent(n)}">${esc(n)}${done(n)?' ✓':''}</button>`).join('')}
function openPupil(n){pupil=decodeURIComponent(n);draft={scores:{}};$('entryTitle').textContent=`${pupil} · ${tool.name}`;let h='';if(tool.type==='learning'){let g=tool.groups.find(g=>g.pupils.includes(pupil)),base=sessionLI||g?.defaultLI||'';h=`<div class="li-banner"><b>${esc(sessionSubject||'Subject not selected')}</b><p>${esc(base||'No Learning Intention entered')}</p></div>${tool.allowOverride?`<label class="override-box"><input id="overrideCheck" type="checkbox"> Use a different Learning Intention for this pupil</label><div id="overrideArea" class="hidden"><label>Individual Learning Intention<input id="overrideLI"></label></div>`:''}<div class="outcome-grid">${tool.outcomes.map((o,i)=>`<button class="score ${['outcome-achieving','outcome-working','outcome-notyet'][i]}" data-outcome="${encodeURIComponent(o)}">${esc(o)}</button>`).join('')}</div>${tool.notes?`<label>Notes<textarea id="liNotes" rows="3"></textarea></label>`:''}`;}else if(tool.type==='record'){h=`<label>${esc(tool.entryLabel)}<input id="recordTitle"></label><label>Notes<textarea id="recordNotes"></textarea></label>`}else if(tool.type==='score'){let g=tool.groups?.find(g=>g.pupils.includes(pupil))||{maxima:tool.entries.map(e=>e.defaultMax)};h=`<div class="multi-score">${tool.entries.map((e,i)=>`<div><h3>${esc(e.label)} out of ${g.maxima[i]??e.defaultMax}</h3><div class="scores">${Array.from({length:Number(g.maxima[i]??e.defaultMax)+1},(_,v)=>`<button class="score" data-score-entry="${i}" data-score-value="${v}" data-score-max="${g.maxima[i]??e.defaultMax}">${v}</button>`).join('')}</div></div>`).join('')}</div>`}else if(tool.type==='wellbeing'){h=`<h3>Mood</h3><div class="scores">${[['😢 Sad',1],['🙁 Not great',2],['😐 Okay',3],['🙂 Good',4],['😁 Great',5]].map(([l,v])=>`<button class="score" data-mood="${v}">${l}</button>`).join('')}</div><div id="wellFollow" class="hidden"><label>Feeling<select id="wellFeeling"><option>Sad</option><option>Angry</option><option>Frustrated</option><option>Worried</option><option>Lonely</option><option>Upset</option></select></label><label>Reason<select id="wellReason"><option>Tired</option><option>Home</option><option>Weather</option><option>Friends</option><option>School work</option><option>Playtime</option><option>Feeling unwell</option><option>Something else</option><option>I do not know</option><option>Prefer not to say</option></select></label></div><label>Notes<textarea id="wellNotes"></textarea></label><label><input id="teacherCheck" type="checkbox"> Teacher check-in requested</label>`}else if(tool.type==='homework'){h=`<div class="outcome-grid"><button class="score outcome-achieving" data-homework="Brought in">Brought in</button><button class="score outcome-notyet" data-homework="Not brought in">Not brought in</button></div>`}else if(tool.type==='guided'){let g=tool.groups?.find(g=>g.pupils.includes(pupil))||tool.groups?.[0];h=`<label>Current book<input id="guidedBook" value="${esc(g?.book||'')}"></label>${tool.criteria.map(c=>`<div class="criteria"><b>${esc(c)}</b><div class="scores">${[1,2,3,4,5].map(v=>`<button class="score" data-guide="${encodeURIComponent(c)}" data-guide-value="${v}">${v}</button>`).join('')}</div></div>`).join('')}<label>Notes<textarea id="guidedNotes"></textarea></label><label><input id="guidedAbsent" type="checkbox"> Absent</label>`}$('entryBody').innerHTML=h;$('entryModal').classList.remove('hidden')}
function saveEntry(){let details={};if(tool.type==='learning'){if(!draft.outcome)return alert('Choose an outcome.');let group=tool.groups.find(g=>g.pupils.includes(pupil)),classLI=sessionLI||group?.defaultLI||'',override=$('overrideCheck')?.checked?$('overrideLI').value.trim():'';if(!sessionSubject)return alert('Select a subject before recording.');if(!classLI&&!override)return alert('Enter a Learning Intention.');if($('overrideCheck')?.checked&&!override)return alert('Enter the individual Learning Intention.');details={Subject:sessionSubject,ClassLearningIntention:classLI,RecordedLearningIntention:override||classLI,IndividualOverride:override?'Yes':'No',Outcome:draft.outcome,Notes:$('liNotes')?.value.trim()||''}}else if(tool.type==='record'){let title=$('recordTitle').value.trim();if(!title)return alert('Enter a title.');details={Title:title,Notes:$('recordNotes').value.trim()}}else if(tool.type==='score'){if(Object.keys(draft.scores).length!==tool.entries.length)return alert('Select every score.');details={Entries:tool.entries.map((e,i)=>({Label:e.label,Score:draft.scores[i].score,OutOf:draft.scores[i].max}))}}else if(tool.type==='wellbeing'){if(!draft.mood)return alert('Choose a mood.');details={Mood:draft.mood,Feeling:draft.mood<=2?$('wellFeeling').value:'Positive or okay',Reason:draft.mood<=2?$('wellReason').value:'Not required',Notes:$('wellNotes').value.trim(),TeacherCheckIn:$('teacherCheck').checked?'Yes':'No'}}else if(tool.type==='homework'){if(!draft.homework)return alert('Choose a homework status.');details={Status:draft.homework}}else if(tool.type==='guided'){let absent=$('guidedAbsent').checked,g=tool.groups?.find(g=>g.pupils.includes(pupil))||tool.groups?.[0],book=$('guidedBook').value.trim();if(g)g.book=book;if(!absent&&tool.criteria.some(c=>draft[c]==null))return alert('Score every reading objective or mark absent.');details=absent?{Status:'Absent',Group:g?.name||'',Book:book,Notes:$('guidedNotes').value.trim()}:{Group:g?.name||'',Book:book,Notes:$('guidedNotes').value.trim(),...Object.fromEntries(tool.criteria.map(c=>[c,draft[c]]))};save('sb_li_classes',classes)}records.unshift({id:uid(),date:new Date().toISOString(),classId:cls().id,className:cls().name,toolId:tool.id,toolName:tool.name,pupil,details});save('sb_li_records',records);$('entryModal').classList.add('hidden');renderPupils()}
function manage(){$('manageClass').innerHTML=classes.map((c,i)=>`<option value="${i}" ${i===ci?'selected':''}>${esc(c.name)}</option>`).join('');$('className').value=cls().name;$('classList').value=cls().pupils.join('\n');$('manageTools').innerHTML=cls().tools.map(t=>`<div class="card"><span class="template-tag">${t.builtIn?'Built-in':`Copied from ${esc(t.sourceTemplate)}`}</span><h3>${t.icon} ${esc(t.name)}</h3><label><input data-enable="${t.id}" type="checkbox" ${t.enabled?'checked':''}> Show</label><button data-edit="${t.id}">Edit</button><button data-copy="${t.id}">Copy</button></div>`).join('');$('editor').innerHTML='';show('manage')}
function edit(id){editId=id;let t=find(id),h=`<div class="card"><h2>Edit ${esc(t.name)}</h2><label>Widget name<input id="editName" value="${esc(t.name)}"></label>`;if(t.type==='learning'){h+=`<h3>Outcome labels</h3>${t.outcomes.map((o,i)=>`<label>Outcome ${i+1}<input data-outcome-label="${i}" value="${esc(o)}"></label>`).join('')}<label><input id="allowOverride" type="checkbox" ${t.allowOverride?'checked':''}> Allow individual Learning Intention override</label><label><input id="allowNotes" type="checkbox" ${t.notes?'checked':''}> Include notes</label><label>Subjects, one per line<textarea id="subjectList" rows="6">${(t.subjects||[]).join('\n')}</textarea></label><h3>Groups</h3>${t.groups.map((g,i)=>`<div class="group-box"><label>Reading Group / Group name<input data-group-name="${i}" value="${esc(g.name)}"></label><label>Default Learning Intention<input data-group-li="${i}" value="${esc(g.defaultLI||'')}"></label></div>`).join('')}`}h+=`<button id="saveTool" class="primary">Save widget</button></div>`;$('editor').innerHTML=h}
function saveTool(){let t=find(editId);t.name=$('editName').value.trim()||t.name;if(t.type==='learning'){document.querySelectorAll('[data-outcome-label]').forEach(x=>t.outcomes[+x.dataset.outcomeLabel]=x.value.trim());t.allowOverride=$('allowOverride').checked;t.notes=$('allowNotes').checked;t.subjects=$('subjectList').value.split('\n').map(x=>x.trim()).filter(Boolean);document.querySelectorAll('[data-group-name]').forEach(x=>t.groups[+x.dataset.groupName].name=x.value.trim());document.querySelectorAll('[data-group-li]').forEach(x=>t.groups[+x.dataset.groupLi].defaultLI=x.value.trim())}save('sb_li_classes',classes);alert('Widget saved.')}
function picker(){$('templateTiles').innerHTML=Object.keys(BUILT_INS).map(k=>`<button class="tile" data-template="${k}">${BUILT_INS[k].icon} Copy ${esc(BUILT_INS[k].name)}</button>`).join('');$('templateModal').classList.remove('hidden')}function copyKey(k){let t=makeTool(k,false);t.name=`My ${t.name}`;if(t.groups)t.groups.forEach(g=>g.pupils=[...cls().pupils]);cls().tools.push(t);save('sb_li_classes',classes);$('templateModal').classList.add('hidden');manage();edit(t.id)}function duplicate(id){let s=find(id),t={...clone(s),id:uid(),name:`Copy of ${s.name}`,builtIn:false,sourceTemplate:s.sourceTemplate||s.name};cls().tools.push(t);save('sb_li_classes',classes);manage();edit(t.id)}
function portal(){$('portalClass').innerHTML=classes.map((c,i)=>`<option value="${i}" ${i===ci?'selected':''}>${esc(c.name)}</option>`).join('');let ds=[...new Set(records.filter(r=>r.classId===cls().id).map(r=>day(new Date(r.date))))].sort().reverse();$('portalDay').innerHTML=(ds.length?ds:[day()]).map(d=>`<option>${d}</option>`).join('');renderPortal();show('portal')}function renderPortal(){let all=records.filter(r=>r.classId===cls().id&&day(new Date(r.date))===$('portalDay').value),shown=filter==='All'?all:all.filter(r=>r.toolName===filter);$('portalTabs').innerHTML=['All',...cls().tools.map(t=>t.name)].map(n=>`<button class="tab ${filter===n?'active':''}" data-tab="${encodeURIComponent(n)}">${esc(n)}</button>`).join('');$('summary').innerHTML=cls().tools.map(t=>`<div class="card"><b>${esc(t.name)}</b><h2>${all.filter(r=>r.toolId===t.id).length}</h2></div>`).join('');$('rows').innerHTML=shown.map(r=>`<tr><td>${esc(r.pupil)}</td><td>${esc(r.toolName)}</td><td>${esc(Object.entries(r.details).map(([k,v])=>`${k}: ${v}`).join(' | '))}</td></tr>`).join('')||'<tr><td colspan="3">No records</td></tr>'}
/* =========================================================
   DRAG AND DROP TOOL
   ========================================================= */

const DEFAULT_DRAG_FEEDBACK = [
    'I felt confident',
    'I needed a little help',
    'I needed a lot of help'
];

let draggedPupil = '';
let pendingDrop = null;
let selectedDropFeedback = '';

function prepareDragDropTool() {
    if (!Array.isArray(tool.sections) || tool.sections.length < 2) {
        tool.sections = [
            {
                id: uid(),
                name: 'Section 1',
                colour: '#dcfce7'
            },
            {
                id: uid(),
                name: 'Section 2',
                colour: '#fee2e2'
            },
            {
                id: uid(),
                name: 'Section 3',
                colour: '#fef3c7'
            }
        ];
    }

    tool.sections.forEach(section => {
        section.id = section.id || uid();
        section.name = section.name || 'Untitled section';
        section.colour = section.colour || '#eef2ff';
    });

    if (typeof tool.feedbackEnabled !== 'boolean') {
        tool.feedbackEnabled = true;
    }

    tool.feedbackPrompt =
        tool.feedbackPrompt || 'How did you find this task?';

    if (
        !Array.isArray(tool.feedbackOptions) ||
        tool.feedbackOptions.length === 0
    ) {
        tool.feedbackOptions = [...DEFAULT_DRAG_FEEDBACK];
    }
}

function dragDropRecordsToday() {
    return records.filter(record =>
        record.classId === cls().id &&
        record.toolId === tool.id &&
        day(new Date(record.date)) === day()
    );
}

function openDragDropTool() {
    prepareDragDropTool();

    sessionLI = '';
    sessionSubject = '';

    $('trackerTitle').textContent = tool.name;

    $('sessionSetup').innerHTML = `
        <div class="drag-toolbar">
            <label class="drag-feedback-toggle">
                <input
                    id="dragFeedbackToggle"
                    type="checkbox"
                    ${tool.feedbackEnabled ? 'checked' : ''}
                >
                Ask pupils for feedback when dropped
            </label>

            <button
                type="button"
                id="editDragDropTool"
                class="secondary"
            >
                ✏️ Edit Drag & Drop
            </button>
        </div>
    `;

    renderDragDropBoard();
    show('tracker');
}

function makeDragPupil(pupilName, feedback = '') {
    return `
        <button
            type="button"
            class="drag-pupil"
            draggable="true"
            data-drag-pupil="${encodeURIComponent(pupilName)}"
        >
            <span>${esc(pupilName)}</span>
            ${feedback ? '<span title="Feedback recorded">💬</span>' : ''}
        </button>
    `;
}

function renderDragDropBoard() {
    prepareDragDropTool();

    const todayRecords = dragDropRecordsToday();

    const placedPupils = new Set(
        todayRecords.map(record => record.pupil)
    );

    const pupilsToSort = cls().pupils.filter(
        pupilName => !placedPupils.has(pupilName)
    );

    const unsortedSection = `
        <section
            class="drag-section drag-unsorted"
            data-drag-section=""
        >
            <h3>👥 Pupils to sort</h3>

            <div class="drag-pupil-list">
                ${
                    pupilsToSort.length
                        ? pupilsToSort.map(name =>
                            makeDragPupil(name)
                        ).join('')
                        : '<p class="drag-empty">Everyone has been sorted.</p>'
                }
            </div>
        </section>
    `;

    const sections = tool.sections.map(section => {
        const sectionRecords = todayRecords.filter(record =>
            record.details.SectionId === section.id
        );

        return `
            <section
                class="drag-section"
                style="--drag-colour:${esc(section.colour)}"
                data-drag-section="${section.id}"
            >
                <h3>${esc(section.name)}</h3>

                <div class="drag-pupil-list">
                    ${
                        sectionRecords.length
                            ? sectionRecords.map(record =>
                                makeDragPupil(
                                    record.pupil,
                                    record.details.Feedback
                                )
                            ).join('')
                            : '<p class="drag-empty">Drop pupils here</p>'
                    }
                </div>
            </section>
        `;
    }).join('');

    $('pupilTiles').innerHTML = `
        <div class="drag-board">
            ${unsortedSection}
            ${sections}
        </div>
    `;
}

function removePupilDragRecord(pupilName) {
    records = records.filter(record =>
        !(
            record.classId === cls().id &&
            record.toolId === tool.id &&
            record.pupil === pupilName &&
            day(new Date(record.date)) === day()
        )
    );
}

function saveDragDropResult(
    pupilName,
    sectionId,
    feedback = '',
    comment = ''
) {
    const section = tool.sections.find(item =>
        item.id === sectionId
    );

    if (!section) {
        return;
    }

    removePupilDragRecord(pupilName);

    records.unshift({
        id: uid(),
        date: new Date().toISOString(),
        classId: cls().id,
        className: cls().name,
        toolId: tool.id,
        toolName: tool.name,
        pupil: pupilName,

        details: {
            SectionId: section.id,
            Section: section.name,
            Feedback: feedback,
            Comment: comment
        }
    });

    save('sb_li_records', records);
    renderDragDropBoard();
}

function returnDragPupilToUnsorted(pupilName) {
    removePupilDragRecord(pupilName);
    save('sb_li_records', records);
    renderDragDropBoard();
}

function openDragFeedback(pupilName, sectionId) {
    pendingDrop = {
        pupilName,
        sectionId
    };

    selectedDropFeedback = '';

    const section = tool.sections.find(item =>
        item.id === sectionId
    );

    $('dragFeedbackTitle').textContent =
        `${pupilName} · ${section?.name || tool.name}`;

    $('dragFeedbackQuestion').textContent =
        tool.feedbackPrompt;

    $('dragFeedbackOptions').innerHTML =
        tool.feedbackOptions.map((option, index) => {
            const indicator =
                index === 0 ? '🟢' :
                index === 1 ? '🟡' :
                index === 2 ? '🔴' : '🔵';

            return `
                <button
                    type="button"
                    class="score drag-feedback-option"
                    data-drag-feedback="${encodeURIComponent(option)}"
                >
                    ${indicator} ${esc(option)}
                </button>
            `;
        }).join('');

    $('dragFeedbackComment').value = '';
    $('dragFeedbackModal').classList.remove('hidden');
}

function savePendingDragFeedback() {
    if (!pendingDrop) {
        return;
    }

    if (!selectedDropFeedback) {
        alert('Choose a feedback response.');
        return;
    }

    saveDragDropResult(
        pendingDrop.pupilName,
        pendingDrop.sectionId,
        selectedDropFeedback,
        $('dragFeedbackComment').value.trim()
    );

    pendingDrop = null;
    selectedDropFeedback = '';

    $('dragFeedbackModal').classList.add('hidden');
}

function openDragDropEditor() {
    prepareDragDropTool();

    $('dragToolName').value = tool.name;
    $('dragFeedbackEnabled').checked = tool.feedbackEnabled;
    $('dragFeedbackPromptInput').value = tool.feedbackPrompt;

    renderDragSectionEditor();
    renderDragFeedbackEditor();

    $('dragFeedbackEditorSettings').classList.toggle(
        'hidden',
        !tool.feedbackEnabled
    );

    $('dragDropEditorModal').classList.remove('hidden');
}

function renderDragSectionEditor() {
    $('dragSectionEditor').innerHTML =
        tool.sections.map((section, index) => `
            <div class="drag-edit-row">
                <strong>${index + 1}</strong>

                <label>
                    Section name
                    <input
                        data-drag-section-name="${section.id}"
                        value="${esc(section.name)}"
                    >
                </label>

                <label>
                    Colour
                    <input
                        data-drag-section-colour="${section.id}"
                        type="color"
                        value="${esc(section.colour)}"
                    >
                </label>

                <button
                    type="button"
                    class="danger"
                    data-remove-drag-section="${section.id}"
                    ${tool.sections.length <= 2 ? 'disabled' : ''}
                >
                    Remove
                </button>
            </div>
        `).join('');
}

function renderDragFeedbackEditor() {
    $('dragFeedbackEditor').innerHTML =
        tool.feedbackOptions.map((option, index) => `
            <div class="drag-feedback-edit-row">
                <input
                    data-drag-feedback-edit="${index}"
                    value="${esc(option)}"
                >

                <button
                    type="button"
                    class="danger"
                    data-remove-feedback="${index}"
                    ${tool.feedbackOptions.length <= 1 ? 'disabled' : ''}
                >
                    Remove
                </button>
            </div>
        `).join('');
}

function saveDragToolSettings() {
    tool.name =
        $('dragToolName').value.trim() || 'Drag & Drop';

    tool.feedbackEnabled =
        $('dragFeedbackEnabled').checked;

    tool.feedbackPrompt =
        $('dragFeedbackPromptInput').value.trim() ||
        'How did you find this task?';

    document
        .querySelectorAll('[data-drag-section-name]')
        .forEach(input => {
            const section = tool.sections.find(item =>
                item.id === input.dataset.dragSectionName
            );

            if (section) {
                section.name =
                    input.value.trim() || 'Untitled section';
            }
        });

    document
        .querySelectorAll('[data-drag-section-colour]')
        .forEach(input => {
            const section = tool.sections.find(item =>
                item.id === input.dataset.dragSectionColour
            );

            if (section) {
                section.colour = input.value;
            }
        });

    tool.feedbackOptions = Array
        .from(document.querySelectorAll('[data-drag-feedback-edit]'))
        .map(input => input.value.trim())
        .filter(Boolean);

    if (!tool.feedbackOptions.length) {
        tool.feedbackOptions = [...DEFAULT_DRAG_FEEDBACK];
    }

    save('sb_li_classes', classes);

    $('dragDropEditorModal').classList.add('hidden');

    openDragDropTool();
}

document.addEventListener('dragstart', event => {
    const pupilButton =
        event.target.closest('[data-drag-pupil]');

    if (!pupilButton) {
        return;
    }

    draggedPupil = decodeURIComponent(
        pupilButton.dataset.dragPupil
    );

    event.dataTransfer.setData(
        'text/plain',
        draggedPupil
    );

    event.dataTransfer.effectAllowed = 'move';

    pupilButton.classList.add('dragging');
});

document.addEventListener('dragend', event => {
    const pupilButton =
        event.target.closest('[data-drag-pupil]');

    if (pupilButton) {
        pupilButton.classList.remove('dragging');
    }

    document
        .querySelectorAll('.drag-section')
        .forEach(section =>
            section.classList.remove('drag-over')
        );
});

document.addEventListener('dragover', event => {
    const section =
        event.target.closest('[data-drag-section]');

    if (!section) {
        return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    section.classList.add('drag-over');
});

document.addEventListener('dragleave', event => {
    const section =
        event.target.closest('[data-drag-section]');

    if (
        section &&
        !section.contains(event.relatedTarget)
    ) {
        section.classList.remove('drag-over');
    }
});

document.addEventListener('drop', event => {
    const section =
        event.target.closest('[data-drag-section]');

    if (!section || !draggedPupil) {
        return;
    }

    event.preventDefault();
    section.classList.remove('drag-over');

    const sectionId = section.dataset.dragSection;

    if (!sectionId) {
        returnDragPupilToUnsorted(draggedPupil);
        draggedPupil = '';
        return;
    }

    const feedbackIsOn =
        $('dragFeedbackToggle')?.checked ??
        tool.feedbackEnabled;

    if (feedbackIsOn) {
        openDragFeedback(
            draggedPupil,
            sectionId
        );
    } else {
        saveDragDropResult(
            draggedPupil,
            sectionId
        );
    }

    draggedPupil = '';
    document.addEventListener('click', e => {
    const pageButton = e.target.closest('[data-page]');

    if (pageButton) {
        const page = pageButton.dataset.page;

        if (page === 'classes') {
            renderClasses();
        } else if (page === 'manage') {
            manage();
        } else {
            renderTools();
        }
    }

    const classButton = e.target.closest('[data-class]');

    if (classButton) {
        ci = Number(classButton.dataset.class);
        renderTools();
    }

    const toolButton = e.target.closest('[data-tool]');

    if (toolButton) {
        openTool(toolButton.dataset.tool);
    }

    const pupilButton = e.target.closest('[data-pupil]');

    if (pupilButton) {
        openPupil(pupilButton.dataset.pupil);
    }

    const scoreButton = e.target.closest('[data-score-entry]');

    if (scoreButton) {
        const entryIndex = Number(scoreButton.dataset.scoreEntry);

        draft.scores[entryIndex] = {
            score: Number(scoreButton.dataset.scoreValue),
            max: Number(scoreButton.dataset.scoreMax)
        };

        scoreButton.parentElement
            .querySelectorAll('.score')
            .forEach(button => {
                button.classList.toggle(
                    'active',
                    button === scoreButton
                );
            });
    }

    const moodButton = e.target.closest('[data-mood]');

    if (moodButton) {
        draft.mood = Number(moodButton.dataset.mood);

        moodButton.parentElement
            .querySelectorAll('.score')
            .forEach(button => {
                button.classList.toggle(
                    'active',
                    button === moodButton
                );
            });

        $('wellFollow').classList.toggle(
            'hidden',
            draft.mood > 2
        );
    }

    const guideButton = e.target.closest('[data-guide]');

    if (guideButton) {
        const criterion = decodeURIComponent(
            guideButton.dataset.guide
        );

        draft[criterion] = Number(
            guideButton.dataset.guideValue
        );

        guideButton.parentElement
            .querySelectorAll('.score')
            .forEach(button => {
                button.classList.toggle(
                    'active',
                    button === guideButton
                );
            });
    }

    const outcomeButton = e.target.closest('[data-outcome]');

    if (outcomeButton) {
        draft.outcome = decodeURIComponent(
            outcomeButton.dataset.outcome
        );

        outcomeButton.parentElement
            .querySelectorAll('.score')
            .forEach(button => {
                button.classList.toggle(
                    'active',
                    button === outcomeButton
                );
            });
    }

    const editButton = e.target.closest('[data-edit]');

    if (editButton) {
        const selectedTool = find(editButton.dataset.edit);

        if (selectedTool?.type === 'dragdrop') {
            tool = selectedTool;
            openDragDropEditor();
        } else {
            edit(editButton.dataset.edit);
        }
    }

    const copyButton = e.target.closest('[data-copy]');

    if (copyButton) {
        duplicate(copyButton.dataset.copy);
    }

    const templateButton = e.target.closest('[data-template]');

    if (templateButton) {
        copyKey(templateButton.dataset.template);
    }

    const tabButton = e.target.closest('[data-tab]');

    if (tabButton) {
        filter = decodeURIComponent(tabButton.dataset.tab);
        renderPortal();
    }

    const dragFeedbackButton =
        e.target.closest('[data-drag-feedback]');

    if (dragFeedbackButton) {
        selectedDropFeedback = decodeURIComponent(
            dragFeedbackButton.dataset.dragFeedback
        );

        $('dragFeedbackOptions')
            .querySelectorAll('.drag-feedback-option')
            .forEach(button => {
                button.classList.toggle(
                    'active',
                    button === dragFeedbackButton
                );
            });
    }

    const removeDragSectionButton =
        e.target.closest('[data-remove-drag-section]');

    if (removeDragSectionButton) {
        if (tool.sections.length <= 2) {
            alert('Keep at least two sections.');
            return;
        }

        tool.sections = tool.sections.filter(section =>
            section.id !==
            removeDragSectionButton.dataset.removeDragSection
        );

        renderDragSectionEditor();
    }

    const removeFeedbackButton =
        e.target.closest('[data-remove-feedback]');

    if (removeFeedbackButton) {
        if (tool.feedbackOptions.length <= 1) {
            alert('Keep at least one feedback choice.');
            return;
        }

        tool.feedbackOptions.splice(
            Number(removeFeedbackButton.dataset.removeFeedback),
            1
        );

        renderDragFeedbackEditor();
    }

    if (e.target.id === 'saveTool') {
        saveTool();
    }

    if (e.target.id === 'saveSessionLI') {
        sessionLI = $('sessionLI').value.trim();
        sessionSubject = $('sessionSubject').value;

        if (!sessionSubject || !sessionLI) {
            alert(
                'Select a subject and enter the Learning Intention.'
            );
            return;
        }

        $('liSaved').textContent =
            ' ✓ Subject and Learning Intention set';
    }

    if (e.target.id === 'editDragDropTool') {
        openDragDropEditor();
    }

    if (e.target.id === 'saveDragFeedback') {
        savePendingDragFeedback();
    }

    if (e.target.id === 'cancelDragFeedback') {
        pendingDrop = null;
        selectedDropFeedback = '';
        $('dragFeedbackModal').classList.add('hidden');
    }

    if (e.target.id === 'closeDragDropEditor') {
        $('dragDropEditorModal').classList.add('hidden');
    }

    if (e.target.id === 'addDragSection') {
        tool.sections.push({
            id: uid(),
            name: `Section ${tool.sections.length + 1}`,
            colour: '#eef2ff'
        });

        renderDragSectionEditor();
    }

    if (e.target.id === 'addDragFeedback') {
        tool.feedbackOptions.push('New feedback choice');
        renderDragFeedbackEditor();
    }

    if (e.target.id === 'saveDragToolSettings') {
        saveDragToolSettings();
    }

    const closeButton = e.target.closest('.close');

    if (
        closeButton &&
        !closeButton.matches(
            '#cancelDragFeedback, #closeDragDropEditor'
        )
    ) {
        closeButton.closest('.modal')?.classList.add('hidden');
    }
});

document.addEventListener('change', e => {
    if (e.target.id === 'overrideCheck') {
        $('overrideArea').classList.toggle(
            'hidden',
            !e.target.checked
        );
    }

    if (e.target.id === 'dragFeedbackToggle') {
        tool.feedbackEnabled = e.target.checked;
        save('sb_li_classes', classes);
    }

    if (e.target.id === 'dragFeedbackEnabled') {
        $('dragFeedbackEditorSettings').classList.toggle(
            'hidden',
            !e.target.checked
        );
    }
});

async function checkMicrosoftLogin() {
    try {
        const response = await fetch('/.auth/me');
        const data = await response.json();

        if (data.clientPrincipal) {
            sessionStorage.sbli = '1';
            renderClasses();
        }
    } catch (error) {
        console.error(
            'Unable to check Microsoft login:',
            error
        );
    }
}

checkMicrosoftLogin();

$('logout').onclick = () => {
    sessionStorage.clear();
    window.location.href =
        '/.auth/logout?post_logout_redirect_uri=/';
};

$('portalNav').onclick = portal;
$('saveEntry').onclick = saveEntry;
$('createTool').onclick = picker;

$('saveClass').onclick = () => {
    cls().name =
        $('className').value.trim() || cls().name;

    cls().pupils = [
        ...new Set(
            $('classList')
                .value
                .split(/[\n,;]+/)
                .map(name => name.trim())
                .filter(Boolean)
        )
    ];

    document
        .querySelectorAll('[data-enable]')
        .forEach(input => {
            find(input.dataset.enable).enabled =
                input.checked;
        });

    save('sb_li_classes', classes);

    $('saved').classList.remove('hidden');

    setTimeout(() => {
        $('saved').classList.add('hidden');
    }, 2000);
};

$('manageClass').onchange = e => {
    ci = Number(e.target.value);
    manage();
};

$('portalClass').onchange = e => {
    ci = Number(e.target.value);
    portal();
};

$('portalDay').onchange = renderPortal;

$('resetTool').onclick = () => {
    records = records.filter(record =>
        !(
            record.classId === cls().id &&
            record.toolId === tool.id &&
            day(new Date(record.date)) === day()
        )
    );

    save('sb_li_records', records);

    if (tool.type === 'dragdrop') {
        renderDragDropBoard();
    } else {
        renderPupils();
    }
};

if (sessionStorage.sbli) {
    renderClasses();
}
});
