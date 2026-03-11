/* Core.js - Client RICEVIMENTO v17.4 - ARCHITETTURA DIZIONARIO & DOM NATIVO */

const fbConfig = {
    apiKey: "AIzaSyCrDuK7SWHdbzrJR-pNpxmRwGnZgV2Dd2Y",
    authDomain: "touch-welness-massage.firebaseapp.com",
    databaseURL: "https://touch-welness-massage-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "touch-welness-massage",
    storageBucket: "touch-welness-massage.firebasestorage.app"
};

if (!firebase.apps.length) firebase.initializeApp(fbConfig);

window.twStructId = localStorage.getItem("tw_structure_id");
let db = { app: {}, requests: {}, settings: {}, servizi: [] };
let globalCustomers = [];
window.currentLogs = {}; 

if (window.twStructId) {
    const dbRef = firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + window.twStructId);
    
    dbRef.child('app').on('value', snap => { db.app = snap.val() || {}; if(typeof window.render === 'function') window.render(); });
    dbRef.child('requests').on('value', snap => { db.requests = snap.val() || {}; if(typeof window.render === 'function') window.render(); });
    dbRef.child('settings').on('value', snap => { db.settings = snap.val() || {}; if(typeof window.render === 'function') window.render(); });
    
    // LETTURA DIRETTA SERVIZI CON ARCHITETTURA A DIZIONARIO
    dbRef.child('servizi').on('value', snap => {
        let rawServ = snap.val();
        if(Array.isArray(rawServ)) { 
            db.servizi = rawServ; 
        } else if(rawServ && typeof rawServ === 'object') { 
            db.servizi = Object.values(rawServ); 
        } else { 
            db.servizi = []; 
        }
        populateServices();
    });

    firebase.database().ref('MASTER_ADMIN_DB/global_customers').on('value', snap => {
        globalCustomers = Object.values(snap.val() || {});
    });

    dbRef.child('requests_log').on('value', snap => {
        window.currentLogs = snap.val() || {};
        if(typeof renderLogs === 'function') renderLogs(window.currentLogs);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById("mainDate")) {
        const d = new Date();
        document.getElementById("mainDate").value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        setTimeout(() => { if(typeof window.render === 'function') window.render(); }, 500); 
    }
});

window.sysChangeDate = function(offset) {
    const picker = document.getElementById("mainDate");
    if(picker && picker.value) {
        const d = new Date(picker.value); d.setDate(d.getDate() + offset);
        picker.value = d.toISOString().split('T')[0];
        window.render();
    }
}

window.showToast = function(msg) { 
    const x = document.getElementById("toastBlue"); 
    if(x) { document.getElementById("toastMsg").innerText = msg; x.className = "show"; setTimeout(() => x.className = x.className.replace("show", ""), 3000); } 
}

window.closeSidebar = function(e, force = false) { 
    if(force || !e || (!e.target.closest('.sidebar') && !e.target.closest('.slot') && !e.target.closest('.modal-box') && !e.target.closest('.log-panel'))) {
        const sf = document.getElementById('sideForm');
        if(sf) { sf.classList.remove('active'); }
    }
}

// POPOLAMENTO TENDINA SERVIZI (DOM NATIVO ANTI-CRASH APOSTROFI)
function populateServices() {
    const sel = document.getElementById("rServ");
    if(!sel) return;
    
    sel.innerHTML = '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = "";
    defaultOpt.innerText = "-- Seleziona Trattamento --";
    sel.appendChild(defaultOpt);

    const validServices = db.servizi.filter(s => s && s.nome);

    if(validServices.length === 0) {
        const noOpt = document.createElement('option');
        noOpt.value = "";
        noOpt.innerText = "Nessun servizio abilitato in struttura.";
        noOpt.disabled = true;
        sel.appendChild(noOpt);
        return;
    }

    validServices.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.nome;
        opt.setAttribute('data-dur', s.durata || 30);
        opt.setAttribute('data-price', s.prezzo || 0);
        opt.innerText = `${s.nome} (${s.durata || 30} min)`;
        sel.appendChild(opt);
    });
}

// CRM
window.sysCheckCustomerInput = function() {
    const val = document.getElementById('rCog').value.toLowerCase().trim();
    const suggBox = document.getElementById('cogSuggestions');
    if(val.length >= 3) {
        const matches = globalCustomers.filter(c => c.nome && c.nome.toLowerCase().includes(val));
        if(matches.length > 0) {
            suggBox.innerHTML = matches.map(c => `<div class="auto-item" onclick="sysSelectCustomer('${c.nome.replace(/'/g, "\\'")}', '${c.tel||''}')"><div><b>${c.nome}</b><br><span>${c.tel ? c.tel : 'N.D.'}</span></div><i class="material-icons-round" style="color:var(--accent); font-size:16px">add</i></div>`).join('');
            suggBox.style.display = 'block';
        } else suggBox.style.display = 'none';
    } else suggBox.style.display = 'none';
}
window.sysSelectCustomer = function(nome, tel) { document.getElementById('rCog').value = nome; document.getElementById('rTel').value = tel; document.getElementById('cogSuggestions').style.display = 'none'; }
document.addEventListener('click', e => { if(e.target.id !== 'rCog' && document.getElementById('cogSuggestions')) document.getElementById('cogSuggestions').style.display = 'none'; });

// --- DRAG AND DROP DELLE RICHIESTE (PC E SMARTPHONE) ---
window.sysDragStart = function(e, reqId) { e.dataTransfer.setData("text/plain", reqId); e.target.classList.add('dragging'); }
window.sysAllowDrop = function(e) { e.preventDefault(); if(e.target.classList.contains('slot') && !e.target.querySelector('.app-busy') && !e.target.querySelector('.app-base')) { e.target.classList.add('drag-over'); } }
window.sysDragLeave = function(e) { e.target.classList.remove('drag-over'); }
window.sysDrop = function(e) {
    e.preventDefault(); e.target.classList.remove('drag-over');
    const reqId = e.dataTransfer.getData("text/plain"); const dropZone = e.target.closest('.slot');
    if(!dropZone || dropZone.querySelector('.app-busy') || dropZone.querySelector('.app-base')) return;
    sysMoveRequest(reqId, dropZone.getAttribute('data-ora'), dropZone.getAttribute('data-cab'));
}

window.touchTimer = null; window.isDragging = false; window.justDragged = false; window.draggedReqId = null; window.dragEl = null; window.offsetX = 0; window.offsetY = 0;
window.sysTouchStart = function(e, reqId) {
    if (e.touches.length !== 1) return; const touch = e.touches[0]; const target = e.currentTarget;
    window.touchTimer = setTimeout(() => {
        window.isDragging = true; window.draggedReqId = reqId; window.dragEl = target.cloneNode(true);
        window.dragEl.style.position = 'fixed'; window.dragEl.style.zIndex = '9999'; window.dragEl.style.opacity = '0.8';
        window.dragEl.style.width = target.offsetWidth + 'px'; window.dragEl.style.height = target.offsetHeight + 'px';
        window.dragEl.style.pointerEvents = 'none'; window.dragEl.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
        document.body.appendChild(window.dragEl);
        const rect = target.getBoundingClientRect(); window.offsetX = touch.clientX - rect.left; window.offsetY = touch.clientY - rect.top;
        window.dragEl.style.left = (touch.clientX - window.offsetX) + 'px'; window.dragEl.style.top = (touch.clientY - window.offsetY) + 'px';
        if(navigator.vibrate) navigator.vibrate(50); target.classList.add('dragging');
    }, 400); 
};
window.sysTouchMove = function(e) {
    if (!window.isDragging) { clearTimeout(window.touchTimer); return; } e.preventDefault(); 
    const touch = e.touches[0];
    if (window.dragEl) { window.dragEl.style.left = (touch.clientX - window.offsetX) + 'px'; window.dragEl.style.top = (touch.clientY - window.offsetY) + 'px'; }
};
window.sysTouchEnd = function(e) {
    clearTimeout(window.touchTimer); e.currentTarget.classList.remove('dragging');
    if (!window.isDragging) return;
    window.isDragging = false; window.justDragged = true; setTimeout(() => window.justDragged = false, 200);
    if (window.dragEl) {
        const touch = e.changedTouches[0]; window.dragEl.style.display = 'none';
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
        window.dragEl.remove(); window.dragEl = null;
        if(dropTarget) {
            const slot = dropTarget.closest('.slot');
            if (slot && slot.hasAttribute('data-ora') && slot.hasAttribute('data-cab') && !slot.querySelector('.app-busy') && !slot.querySelector('.app-base')) {
                sysMoveRequest(window.draggedReqId, slot.getAttribute('data-ora'), slot.getAttribute('data-cab'));
            }
        }
    }
    window.draggedReqId = null;
};

window.sysMoveRequest = function(reqId, newOra, newCab) {
    const d = document.getElementById("mainDate").value; 
    if(!d || !window.twStructId) return;
    
    let apps = Array.isArray(db.app[d]) ? db.app[d] : Object.values(db.app[d]||{});
    let reqs = Array.isArray(db.requests[d]) ? db.requests[d] : Object.values(db.requests[d]||{});
    
    const idx = reqs.findIndex(x => x && x.id === reqId);
    if(idx > -1) {
        if (reqs[idx].status !== 'pending') { showToast("Questa richiesta è già in gestione, impossibile spostarla."); window.render(); return; }

        const startMin = tToM(newOra); const appDur = parseInt(reqs[idx].dur) || 30; const endMin = startMin + appDur;
        
        let collisionReq = reqs.some(a => { if(!a || a.id === reqId || parseInt(a.cab) !== parseInt(newCab)) return false; const aStart = tToM(a.ora); const aEnd = aStart + (parseInt(a.dur) || 30); return (startMin < aEnd && endMin > aStart); });
        let collisionApp = apps.some(a => { if(!a || parseInt(a.cab) !== parseInt(newCab)) return false; const aStart = tToM(a.ora); const aEnd = aStart + (parseInt(a.dur) || 30); return (startMin < aEnd && endMin > aStart); });
        
        if(collisionReq || collisionApp) { showToast("Attenzione: Orario Occupato!"); window.render(); return; }
        
        reqs[idx].ora = newOra; reqs[idx].cab = newCab;
        
        const dbRefLocal = firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + window.twStructId);
        dbRefLocal.child('requests').child(d).set(reqs).then(() => { 
            dbRefLocal.child('requests_log').child(reqId).update({
                ora: newOra, msg: `La reception ha spostato la richiesta nello slot delle ${newOra}.`
            });
            showToast("Richiesta Spostata con Successo!"); 
        });
    }
}

// --- GESTIONE FORM RICEVIMENTO ---
window.sysOpenSlot = function(ora, cab) {
    const isSidebarActive = document.getElementById('sideForm').classList.contains('active');
    const isNoteMode = document.getElementById("btnSaveNote").style.display === "flex";

    if (isSidebarActive && !isNoteMode) {
        document.getElementById("rOra").value = ora; 
        document.getElementById("rCab").value = cab;
        return; 
    }

    ['rOra', 'rCam', 'rCog', 'rTel', 'rServ'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.removeAttribute('disabled');
    });
    const hint = document.getElementById("rOraHint");
    if(hint) hint.style.display = "inline";

    document.getElementById("sidebarTitle").innerText = "NUOVA RICHIESTA SPA"; 
    document.getElementById("rId").value = "";
    document.getElementById("rDate").value = document.getElementById("mainDate").value; 
    document.getElementById("rOra").value = ora; 
    document.getElementById("rCab").value = cab;
    
    ['rCam', 'rCog', 'rTel', 'rServ', 'rNote'].forEach(id => { 
        const el = document.getElementById(id);
        if(el) el.value = ""; 
    });
    
    document.getElementById("btnSaveReq").style.display = "flex";
    document.getElementById("btnDelReq").style.display = "none";
    document.getElementById("btnSaveNote").style.display = "none";
    document.getElementById('sideForm').classList.add('active');
}

window.sysOpenRequest = function(id) {
    if(window.justDragged) return;
    const d = document.getElementById("mainDate").value; 
    let reqs = Array.isArray(db.requests[d]) ? db.requests[d] : Object.values(db.requests[d]||{});
    const req = reqs.find(x => x && x.id === id); if(!req) return;

    if(req.status !== 'pending') {
        showToast("Questa richiesta è già stata processata dalla SPA.");
        return;
    }

    ['rOra', 'rCam', 'rCog', 'rTel', 'rServ'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.removeAttribute('disabled');
    });
    const hint = document.getElementById("rOraHint");
    if(hint) hint.style.display = "inline";

    document.getElementById("sidebarTitle").innerText = "MODIFICA RICHIESTA"; 
    document.getElementById("rId").value = req.id;
    document.getElementById("rDate").value = d; 
    document.getElementById("rOra").value = req.ora; 
    document.getElementById("rCab").value = req.cab;
    document.getElementById("rCam").value = req.cam || "";
    document.getElementById("rCog").value = req.cog || ""; 
    document.getElementById("rTel").value = req.tel || "";
    document.getElementById("rServ").value = req.serv || ""; 
    
    let currentNote = req.note || "";
    document.getElementById("rNote").value = currentNote.replace("[Nota Ricevimento]: ", "");
    
    document.getElementById("btnSaveReq").style.display = "flex";
    document.getElementById("btnDelReq").style.display = "flex";
    document.getElementById("btnSaveNote").style.display = "none";
    document.getElementById('sideForm').classList.add('active');
}

window.sysOpenAppNote = function(id) {
    const d = document.getElementById("mainDate").value; 
    let apps = Array.isArray(db.app[d]) ? db.app[d] : Object.values(db.app[d]||{});
    const app = apps.find(x => x && x.id === id); if(!app) return;

    document.getElementById("sidebarTitle").innerText = "MODIFICA NOTE"; 
    document.getElementById("rId").value = app.id;
    document.getElementById("rDate").value = d; 
    document.getElementById("rOra").value = app.ora; 
    document.getElementById("rCab").value = app.cab;
    document.getElementById("rCam").value = app.cam || "";
    document.getElementById("rCog").value = app.cog || ""; 
    document.getElementById("rTel").value = app.tel || "";
    
    let sel = document.getElementById("rServ");
    if(sel) {
        let exists = Array.from(sel.options).some(opt => opt.value === app.serv);
        if(!exists && app.serv) { 
            const newOpt = document.createElement('option');
            newOpt.value = app.serv;
            newOpt.innerText = app.serv;
            sel.appendChild(newOpt);
        }
        sel.value = app.serv || ""; 
    }
    
    let currentNote = app.note || "";
    document.getElementById("rNote").value = currentNote.replace("[Nota Ricevimento]: ", "");

    ['rOra', 'rCam', 'rCog', 'rTel', 'rServ'].forEach(field => { 
        const el = document.getElementById(field);
        if(el) el.setAttribute('disabled', 'true'); 
    });
    
    const hint = document.getElementById("rOraHint");
    if(hint) hint.style.display = "none";

    document.getElementById("btnSaveReq").style.display = "none";
    document.getElementById("btnDelReq").style.display = "none";
    document.getElementById("btnSaveNote").style.display = "flex";
    
    document.getElementById('sideForm').classList.add('active');
}

window.sysSaveRequest = function() {
    const selDate = document.getElementById("rDate").value; 
    const selServ = document.getElementById("rServ");
    
    if(!document.getElementById("rCam").value || !selServ.value) return showToast("Compila i campi Camera e Trattamento!");

    const sDur = selServ.options[selServ.selectedIndex].getAttribute('data-dur') || 30;
    const sPrice = selServ.options[selServ.selectedIndex].getAttribute('data-price') || 0;
    const id = document.getElementById("rId").value || "REQ" + Date.now();

    let noteText = document.getElementById("rNote").value.trim();
    if(noteText !== "" && !noteText.toLowerCase().includes("ricevimento")) { noteText = "[Nota Ricevimento]: " + noteText; }

    const obj = { 
        id: id, ora: document.getElementById("rOra").value, cab: document.getElementById("rCab").value, 
        cam: document.getElementById("rCam").value, cog: document.getElementById("rCog").value.trim(), 
        tel: document.getElementById("rTel").value.trim(), serv: selServ.value, 
        dur: parseInt(sDur), price: parseFloat(sPrice), note: noteText, 
        status: "pending", author: "Ricevimento", timestamp: Date.now()
    };
    
    let reqs = Array.isArray(db.requests[selDate]) ? db.requests[selDate] : Object.values(db.requests[selDate]||{});
    const idx = reqs.findIndex(x => x && x.id === id); 
    if(idx > -1) { reqs[idx] = obj; } else { reqs.push(obj); }

    const dbRefLocal = firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + window.twStructId);
    dbRefLocal.child('requests').child(selDate).set(reqs).then(() => { 
        dbRefLocal.child('requests_log').child(id).set({
            reqId: id, type: idx > -1 ? 'modified' : 'pending',
            cam: obj.cam, serv: obj.serv, ora: obj.ora,
            msg: idx > -1 ? `Hai modificato i dati della richiesta in attesa.` : `Richiesta inoltrata. In attesa di elaborazione dalla SPA.`,
            date: new Date().toLocaleString('it-IT'), timestamp: Date.now(), hidden: false
        });
        closeSidebar(null, true); showToast("Richiesta Salvata e Inoltrata!"); 
    });
}

window.sysSaveAppNote = function() {
    const id = document.getElementById("rId").value;
    const d = document.getElementById("rDate").value;
    
    let newNote = document.getElementById("rNote").value.trim();
    if(newNote !== "" && !newNote.toLowerCase().includes("ricevimento")) { newNote = "[Nota Ricevimento]: " + newNote; }

    const dbRefLocal = firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + window.twStructId);

    dbRefLocal.child('app').child(d).once('value').then(snap => {
        let apps = snap.val() || [];
        if(!Array.isArray(apps)) apps = Object.values(apps);
        
        const idx = apps.findIndex(x => x && x.id === id);
        if(idx > -1) {
            apps[idx].note = newNote;
            dbRefLocal.child('app').child(d).set(apps).then(() => {
                showToast("Note aggiornate nell'agenda!");
                closeSidebar(null, true);
                
                dbRefLocal.child('requests_log').push({
                    reqId: "NOTE_" + Date.now(),
                    type: 'modified', cam: apps[idx].cam, serv: apps[idx].serv, ora: apps[idx].ora,
                    msg: `Hai modificato/aggiunto una nota su questo appuntamento già in agenda.`,
                    date: new Date().toLocaleString('it-IT'), timestamp: Date.now(), hidden: false
                });
            });
        }
    });
}

window.sysDeleteRequest = function() {
    const id = document.getElementById("rId").value;
    const d = document.getElementById("rDate").value; 
    let reqs = Array.isArray(db.requests[d]) ? db.requests[d] : Object.values(db.requests[d]||{});
    const reqToDel = reqs.find(x => x && x.id === id); 
    reqs = reqs.filter(x => x && x.id !== id);
    
    const dbRefLocal = firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + window.twStructId);
    dbRefLocal.child('requests').child(d).set(reqs).then(() => { 
        if(reqToDel) {
            dbRefLocal.child('requests_log').child(id).set({
                reqId: id, type: 'deleted-after',
                cam: reqToDel.cam, serv: reqToDel.serv, ora: reqToDel.ora,
                msg: `Hai annullato questa richiesta prima della conferma.`,
                date: new Date().toLocaleString('it-IT'), timestamp: Date.now(), hidden: false
            });
        }
        closeSidebar(null, true); showToast("Richiesta Annullata."); 
    });
}

window.sysHideLog = function(logId) {
    if(!window.twStructId || !logId) return;
    firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + window.twStructId + '/requests_log/' + logId).update({ hidden: true });
}

window.sysClearAllLogs = function() {
    if(!window.twStructId || !window.currentLogs) return;
    if(!confirm("Vuoi nascondere le notifiche lette? Resteranno visibili in 'Log Attività'.")) return;
    
    const updates = {};
    Object.keys(window.currentLogs).forEach(k => {
        if(!window.currentLogs[k].hidden) { updates[k + '/hidden'] = true; }
    });
    
    if(Object.keys(updates).length > 0) {
        firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + window.twStructId + '/requests_log').update(updates).then(() => { showToast("Log rimossi dalla barra."); });
    }
}

function renderLogs(logsObj) {
    const container = document.getElementById('logContainer');
    if(!container) return;
    const logs = Object.values(logsObj).sort((a,b) => b.timestamp - a.timestamp); 
    const visibleLogs = logs.filter(l => !l.hidden);

    if(visibleLogs.length === 0) { container.innerHTML = "<div style='text-align:center; color:var(--text-muted); font-size:12px; margin-top:20px;'>Nessun ticket in evidenza.</div>"; return; }
    
    container.innerHTML = visibleLogs.map(l => {
        let badgeColor = "var(--accent)"; let badgeText = "IN ATTESA"; let icon = "schedule";
        
        if (l.type === 'accepted') { badgeColor = "var(--green)"; badgeText = "ACCETTATO DA SPA"; icon="check_circle"; }
        if (l.type === 'modified-accepted') { badgeColor = "var(--green)"; badgeText = "ACCETTATO (NUOVO ORARIO)"; icon="update"; }
        if (l.type === 'rejected') { badgeColor = "var(--red)"; badgeText = "RIFIUTATO DA SPA"; icon="cancel"; }
        if (l.type === 'deleted-after') { badgeColor = "var(--red)"; badgeText = "ELIMINATO"; icon="delete_forever"; }
        if (l.type === 'modified') { badgeColor = "var(--accent)"; badgeText = "MODIFICATO DA TE"; icon="edit"; }

        return `
        <div class="log-item" style="background:var(--bg-body); border-left: 4px solid ${badgeColor}; padding: 12px; border-radius: 0 8px 8px 0; margin-bottom: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); position:relative;">
            <i class="material-icons-round" style="position:absolute; top:5px; right:5px; font-size:16px; color:var(--text-muted); cursor:pointer;" onclick="sysHideLog('${l.reqId}')" title="Nascondi notifica">close</i>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; padding-right:15px;">
                <div>
                    <b style="color:var(--text-main); font-size:13px; display:block">Cam ${l.cam || '?'} <span style="color:var(--text-muted);">| ${l.ora}</span></b>
                    <span style="color:var(--text-muted); font-size:11px;">${l.serv}</span>
                </div>
                <span style="background:rgba(255,255,255,0.05); color:${badgeColor}; padding:4px 6px; border-radius:4px; font-size:9px; font-weight:bold; border:1px solid ${badgeColor}; white-space:nowrap;"><i class="material-icons-round" style="font-size:10px; vertical-align:middle">${icon}</i> ${badgeText}</span>
            </div>
            <div style="background:var(--bg-panel); padding:8px; border-radius:6px; font-size:11px; border:1px dashed ${badgeColor}; color:var(--text-main); line-height:1.4;">
                ${l.msg}
            </div>
            <div style="font-size: 10px; color: var(--text-muted); text-align: right; margin-top: 6px;">${l.date}</div>
        </div>
        `;
    }).join('');
}

function tToM(t) { if(!t || typeof t !== 'string') return 0; const p = t.split(':'); return (parseInt(p[0])||0)*60 + (parseInt(p[1])||0); }
function mToT(m) { const h=Math.floor(m/60); const mm=m%60; return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; }
function getSlots() { let s=[]; for(let i=10*60; i<=20*60; i+=10) s.push(mToT(i)); return s; }

window.render = function() {
    const grid = document.getElementById("mainGrid"); if(!grid) return;
    
    const d = document.getElementById("mainDate").value; if(!d) return;
    const nCabine = (db.settings && db.settings.cabine) ? parseInt(db.settings.cabine) : 2;
    const slots = getSlots();
    
    let dayApps = db.app[d] || []; if (!Array.isArray(dayApps)) dayApps = Object.values(dayApps);
    let dayReqs = db.requests[d] || []; if (!Array.isArray(dayReqs)) dayReqs = Object.values(dayReqs);

    let h = "";
    for(let c = 1; c <= nCabine; c++) {
        h += `<div class="colonna"><div class="col-head">CABINA ${c}</div>`;
        slots.forEach(s => {
            const sMin = tToM(s);
            
            const app = dayApps.find(x => { 
                if(!x || !x.ora) return false;
                const start = tToM(x.ora); const end = start + (parseInt(x.dur) || 30); 
                return parseInt(x.cab) === c && sMin >= start && sMin < end; 
            });

            const req = dayReqs.find(x => { 
                if(!x || !x.ora || x.status !== 'pending') return false;
                const start = tToM(x.ora); const end = start + (parseInt(x.dur) || 30); 
                return parseInt(x.cab) === c && sMin >= start && sMin < end; 
            });
            
            if(app) {
                if(tToM(app.ora) === sMin) {
                    const slotsCount = Math.ceil((parseInt(app.dur) || 30) / 10);
                    const hCss = `height: calc(${slotsCount * 100}% + ${slotsCount - 1}px - 6px); top: 3px;`;
                    h += `<div class="time-row"><div class="time-lbl">${s}</div><div class="slot">
                            <div class="app-base app-standard" style="${hCss}" onclick="sysOpenAppNote('${app.id}')">
                                <div class="app-info-col">
                                    <b><i class="material-icons-round" style="font-size:12px; vertical-align:middle">spa</i> APPUNTAMENTO SPA</b>
                                    <span>Cam ${app.cam||'?'} - ${app.cog||'N.D.'}</span>
                                    <span>${app.serv||'-'}</span>
                                </div>
                            </div>
                          </div></div>`;
                } else { h += `<div class="time-row"><div class="time-lbl">${s}</div><div class="slot"><div class="app-busy" onclick="sysOpenAppNote('${app.id}')"></div></div></div>`; }
            } else if(req) {
                if(tToM(req.ora) === sMin) {
                    const slotsCount = Math.ceil((parseInt(req.dur) || 30) / 10);
                    const hCss = `height: calc(${slotsCount * 100}% + ${slotsCount - 1}px - 6px); top: 3px;`;
                    h += `<div class="time-row"><div class="time-lbl">${s}</div>
                          <div class="slot" data-ora="${s}" data-cab="${c}" ondragover="sysAllowDrop(event)" ondragleave="sysDragLeave(event)" ondrop="sysDrop(event)">
                            <div class="app-base app-request" style="${hCss}" 
                                 draggable="true" ondragstart="sysDragStart(event, '${req.id}')"
                                 ontouchstart="sysTouchStart(event, '${req.id}')" ontouchmove="sysTouchMove(event)" ontouchend="sysTouchEnd(event)"
                                 onclick="sysOpenRequest('${req.id}')" ondragend="this.classList.remove('dragging')">
                                <div class="app-info-col">
                                    <b style="color:var(--accent)"><i class="material-icons-round" style="font-size:12px; vertical-align:middle">hourglass_empty</i> TUA RICHIESTA (In attesa)</b>
                                    <span>Cam ${req.cam||'?'} - ${req.cog || 'N.D.'}</span>
                                    <span>${req.serv || '-'}</span>
                                </div>
                            </div>
                          </div></div>`;
                } else { h += `<div class="time-row"><div class="time-lbl">${s}</div><div class="slot"><div class="app-busy req-busy" onclick="sysOpenRequest('${req.id}')"></div></div></div>`; }
            } else {
                h += `<div class="time-row"><div class="time-lbl">${s}</div>
                      <div class="slot" data-ora="${s}" data-cab="${c}" 
                           ondragover="sysAllowDrop(event)" ondragleave="sysDragLeave(event)" ondrop="sysDrop(event)"
                           onclick="sysOpenSlot('${s}', ${c})"></div></div>`;
            }
        });
        h += `</div>`;
    }
    grid.innerHTML = h;
};