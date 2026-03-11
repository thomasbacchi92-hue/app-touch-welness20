/* System.js - Core Logic SPA v17.3 - FIX DEFINITIVO SERVIZI (DOM NATIVO) E ARCHITETTURA A DIZIONARIO */

const fbConfig = {
    apiKey: "AIzaSyCrDuK7SWHdbzrJR-pNpxmRwGnZgV2Dd2Y",
    authDomain: "touch-welness-massage.firebaseapp.com",
    databaseURL: "https://touch-welness-massage-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "touch-welness-massage",
    storageBucket: "touch-welness-massage.firebasestorage.app"
};

if (!firebase.apps.length) firebase.initializeApp(fbConfig);

window.twStructId = localStorage.getItem("tw_structure_id");
let db = { app: {}, requests: {}, settings: {}, staff: [], servizi: [] };
let globalCustomers = [];
let tempSelectedServiceId = null;

if (window.twStructId) {
    const dbRefLocal = firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + window.twStructId);
    
    dbRefLocal.on('value', snap => {
        const val = snap.val() || {};
        db.app = val.app || {};
        db.requests = val.requests || {}; 
        db.settings = val.settings || {};
        db.staff = Array.isArray(val.staff) ? val.staff : Object.values(val.staff || {});
        
        // LETTURA DIRETTA DALLA SCHEDA DELLA STRUTTURA (Supporta sia Array storici che nuovi Dizionari)
        let rawServ = val.servizi;
        if(Array.isArray(rawServ)) {
            db.servizi = rawServ;
        } else if(rawServ && typeof rawServ === 'object') {
            db.servizi = Object.values(rawServ);
        } else {
            db.servizi = [];
        }
        
        if(typeof window.render === 'function') window.render();
    });

    firebase.database().ref('MASTER_ADMIN_DB/global_customers').on('value', snap => {
        globalCustomers = Object.values(snap.val() || {});
    });
}

window.addEventListener('DOMContentLoaded', () => {
    /* Pulizia box duplicati eventuali generati in passato */
    const privacyBoxes = document.querySelectorAll('.privacy-box');
    if(privacyBoxes.length > 1) { for(let i=1; i<privacyBoxes.length; i++) privacyBoxes[i].remove(); }

    if(document.getElementById("mainDate")) {
        const d = new Date();
        document.getElementById("mainDate").value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if(typeof window.render === 'function') window.render(); 
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

// --- LOGICA PRIVACY DRIVE ---
window.checkAndSendPrivacy = function() {
    const id = document.getElementById("mId").value;
    if(!id) { showToast("⚠️ Devi PRIMA SALVARE l'appuntamento in agenda!"); return; }
    if(typeof DeviceSync !== 'undefined') {
        DeviceSync.sendToMobile(id, document.getElementById("aDate").value);
    } else {
        showToast("Errore di connessione col Tablet.");
    }
};

window.savePrivacyLink = function(appId, date, link) {
    const dbRefLocal = firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + window.twStructId);
    dbRefLocal.child('app').child(date).once('value').then(snap => {
        let apps = snap.val() || [];
        if(!Array.isArray(apps)) apps = Object.values(apps);
        const idx = apps.findIndex(x => x && x.id === appId);
        if(idx > -1) {
            apps[idx].privacySigned = true;
            apps[idx].driveLink = link;
            dbRefLocal.child('app').child(date).set(apps).then(() => {
                if(typeof window.render === 'function') window.render();
                const uiLink = document.getElementById('uiPrivacyLink');
                if(uiLink) { uiLink.href = link; uiLink.style.display = 'flex'; }
            });
        }
    });
};

window.showToast = function(msg) { 
    const x = document.getElementById("toastBlue"); 
    if(x) { document.getElementById("toastMsg").innerText = msg; x.className = "show"; setTimeout(() => x.className = x.className.replace("show", ""), 3000); } 
}

window.closeSidebar = function(e, force = false) { 
    if(force || !e || (!e.target.closest('.sidebar') && !e.target.closest('.slot') && !e.target.closest('.modal-box') && !e.target.closest('.btn-quick-eseg'))) {
        const sf = document.getElementById('sideForm');
        if(sf) { sf.classList.remove('active'); sf.classList.remove('request-mode'); }
    }
}

// CRM
window.sysCheckCustomerInput = function() {
    const val = document.getElementById('aCog').value.toLowerCase().trim();
    const suggBox = document.getElementById('cogSuggestions');
    if(val.length >= 3) {
        const matches = globalCustomers.filter(c => c.nome && c.nome.toLowerCase().includes(val));
        if(matches.length > 0) {
            suggBox.innerHTML = matches.map(c => `<div class="auto-item" onclick="sysSelectCustomer('${c.nome.replace(/'/g, "\\'")}', '${c.tel||''}')"><div><b>${c.nome}</b><br><span>${c.tel ? c.tel : 'N.D.'}</span></div><i class="material-icons-round" style="color:var(--accent); font-size:16px">add</i></div>`).join('');
            suggBox.style.display = 'block';
        } else suggBox.style.display = 'none';
    } else suggBox.style.display = 'none';
}
window.sysSelectCustomer = function(nome, tel) { document.getElementById('aCog').value = nome; document.getElementById('aTel').value = tel; document.getElementById('cogSuggestions').style.display = 'none'; }
document.addEventListener('click', e => { if(e.target.id !== 'aCog' && document.getElementById('cogSuggestions')) document.getElementById('cogSuggestions').style.display = 'none'; });

// =========================================================
// GESTIONE SERVIZI (CREAZIONE DOM NATIVA ANTICRASH)
// =========================================================

window.sysRenderServiceBox = function() {
    const area = document.getElementById('serviceRenderArea'); const sName = document.getElementById('aServ').value;
    if(sName) { area.innerHTML = `<div class="selected-service-badge"><div class="info"><b>${sName}</b><span>${document.getElementById('aDur').value} min | ${document.getElementById('aPrice').value} €</span></div><div class="icon-del" onclick="sysExecuteRemoveService()"><i class="material-icons-round" style="font-size:14px;">close</i></div></div>`; } 
    else { area.innerHTML = `<button class="btn-add-service" onclick="sysOpenServiceSelector()"><i class="material-icons-round" style="color:var(--accent); font-size:18px;">add_circle</i> AGGIUNGI SERVIZIO</button>`; }
}

window.sysFilterServices = function() { 
    const val = document.getElementById('searchServiceInput').value.toLowerCase(); 
    document.querySelectorAll('.serv-item').forEach(el => { 
        const name = el.getAttribute('data-name') || '';
        el.style.display = name.includes(val) ? 'flex' : 'none'; 
    }); 
}

window.sysOpenServiceSelector = function() {
    const listUI = document.getElementById('serviziUIList'); 
    listUI.innerHTML = ""; 
    document.getElementById('searchServiceInput').value = ""; 
    
    let servList = db.servizi || [];
    servList = servList.filter(s => s && s.nome); // Filtro sicurezza per evitare vuoti

    if(servList.length === 0) { 
        listUI.innerHTML = "<div style='text-align:center; padding:20px; color:var(--text-muted); font-size:12px'>Nessun servizio abilitato in questa Struttura. Aggiungili dal pannello Admin Master.</div>"; 
    } else {
        servList.forEach((s, index) => {
            const sId = s.id || ('SV_TEMP_' + index);
            s.id = sId;

            // CREAZIONE DOM NATIVA: Evita qualsiasi crash dovuto ad apostrofi o virgolette nel nome!
            const div = document.createElement('div');
            div.className = 'serv-item';
            div.id = 'srvUI_' + sId;
            div.setAttribute('data-name', s.nome.toLowerCase());
            
            div.innerHTML = `
                <i class="material-icons-round" style="color:var(--text-muted); font-size:18px;">spa</i>
                <div class="serv-info">
                    <b>${s.nome}</b>
                    <span style="color:var(--accent); margin-left:10px;">${s.durata || 30} min - ${s.prezzo || 0} €</span>
                </div>
            `;
            
            // L'onclick viene assegnato via codice, senza passare stringhe testo
            div.onclick = function() {
                window.sysTempSelectService(sId);
            };

            listUI.appendChild(div);
        });
    }
    tempSelectedServiceId = null; 
    document.getElementById('serviceSelectModal').style.display = 'flex';
}

window.sysTempSelectService = function(id) { 
    document.querySelectorAll('.serv-item').forEach(x => x.classList.remove('active')); 
    const el = document.getElementById('srvUI_' + id);
    if(el) el.classList.add('active'); 
    
    const s = db.servizi.find(x => x.id === id);
    if(s) {
        tempSelectedServiceId = { nome: s.nome, dur: s.durata, price: s.prezzo }; 
    }
}

window.sysConfirmServiceSelection = function() { 
    if(tempSelectedServiceId) { 
        document.getElementById('aServ').value = tempSelectedServiceId.nome; 
        document.getElementById('aDur').value = tempSelectedServiceId.dur; 
        document.getElementById('aPrice').value = tempSelectedServiceId.price; 
        sysRenderServiceBox(); 
        document.getElementById('serviceSelectModal').style.display = 'none'; 
    } else { 
        showToast("Seleziona un trattamento prima di confermare."); 
    } 
}

window.sysExecuteRemoveService = function() { 
    document.getElementById('aServ').value = ""; document.getElementById('aDur').value = "30"; document.getElementById('aPrice').value = "0"; sysRenderServiceBox(); 
}

// ZOOM
window.sysApplyZoom = function() { const z = document.getElementById('gridZoom').value; const grid = document.getElementById('mainGrid'); if(grid) { grid.style.zoom = z / 100; } }
window.sysSetZoom = function(step) { const slider = document.getElementById('gridZoom'); if(!slider) return; let z = parseInt(slider.value) + step; if(z < 50) z = 50; if(z > 150) z = 150; slider.value = z; sysApplyZoom(); }

// DRAG & DROP NORMALE
window.sysDragStart = function(e, appId) { e.dataTransfer.setData("text/plain", appId); e.target.classList.add('dragging'); }
window.sysAllowDrop = function(e) { e.preventDefault(); if(e.target.classList.contains('slot') && !e.target.querySelector('.app-busy')) { e.target.classList.add('drag-over'); } }
window.sysDragLeave = function(e) { e.target.classList.remove('drag-over'); }
window.sysDrop = function(e) {
    e.preventDefault(); e.target.classList.remove('drag-over');
    const appId = e.dataTransfer.getData("text/plain"); const dropZone = e.target.closest('.slot');
    if(!dropZone || dropZone.querySelector('.app-busy')) return;
    sysMoveAppointment(appId, dropZone.getAttribute('data-ora'), dropZone.getAttribute('data-cab'));
}

window.sysMoveAppointment = function(appId, newOra, newCab) {
    const d = document.getElementById("mainDate").value; 
    if(!d || !window.twStructId) return;
    firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + window.twStructId + '/app/' + d).once('value').then(snap => {
        let apps = snap.val() || []; if(!Array.isArray(apps)) apps = Object.values(apps);
        const idx = apps.findIndex(x => x && x.id === appId);
        if(idx > -1) {
            const startMin = tToM(newOra); const appDur = parseInt(apps[idx].dur) || 30; const endMin = startMin + appDur;
            let collision = apps.some(a => { if(!a || a.id === appId || parseInt(a.cab) !== parseInt(newCab)) return false; const aStart = tToM(a.ora); const aEnd = aStart + (parseInt(a.dur) || 30); return (startMin < aEnd && endMin > aStart); });
            if(collision) { showToast("Attenzione: Orario Occupato!"); window.render(); return; }
            apps[idx].ora = newOra; apps[idx].cab = newCab;
            firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + window.twStructId + '/app/' + d).set(apps).then(() => { showToast("Appuntamento Spostato!"); });
        }
    });
}

// --- GESTIONE FORM E MODIFICA ORARIO TRAMITE CLICK ---

window.sysEnableTimePick = function(e) {
    e.preventDefault();
    showToast("Clicca su uno spazio vuoto nell'agenda per cambiare orario.");
}

window.sysOpenSlot = function(ora, cab) {
    const isSidebarActive = document.getElementById('sideForm').classList.contains('active');
    
    if (isSidebarActive) { 
        document.getElementById("aOra").value = ora; 
        document.getElementById("aCab").value = cab;
        showToast(`Orario aggiornato alle ${ora}`);
        return; 
    }

    document.getElementById('sideForm').classList.remove('request-mode');
    document.getElementById("sidebarTitle").innerText = "Nuovo Appuntamento"; document.getElementById("sidebarTitle").style.color = "var(--gold)";
    document.getElementById("mId").value = "";
    document.getElementById("mReqId").value = "";
    
    const cd = document.getElementById("mainDate").value; document.getElementById("aDate").value = cd; document.getElementById("mOldDate").value = cd; 
    document.getElementById("aOra").value = ora; document.getElementById("aCab").value = cab;
    
    ['aCam', 'aCog', 'aTel', 'aOp', 'aNote', 'aServ'].forEach(id => { const el=document.getElementById(id); if(el) el.value = ""; });
    document.getElementById("aDur").value = "30"; document.getElementById("aPrice").value = "0";
    
    document.getElementById("eseguitoSwitchBox").style.display = "flex";
    const esegToggle = document.getElementById("aEseguito"); if(esegToggle) esegToggle.checked = false;
    
    const uiBox = document.getElementById("uiPrivacyBox"); 
    const uiLink = document.getElementById("uiPrivacyLink");
    if(uiBox) uiBox.style.display = "block";
    if(uiLink) uiLink.style.display = "none";
    
    sysRenderServiceBox(); 
    
    document.getElementById("btnSaveAppStandard").style.display = "flex";
    document.getElementById("editActionButtons").style.display = "none"; 
    document.getElementById("reqActionButtons").style.display = "none";
    
    document.getElementById('sideForm').classList.add('active');
}

window.sysOpenEdit = function(id) {
    if(window.justDragged) return; 
    const d = document.getElementById("mainDate").value; let apps = Array.isArray(db.app[d]) ? db.app[d] : Object.values(db.app[d]||{});
    const app = apps.find(x => x && x.id === id); if(!app) return;

    document.getElementById('sideForm').classList.remove('request-mode');
    document.getElementById("sidebarTitle").innerText = "Modifica Prenotazione"; document.getElementById("sidebarTitle").style.color = "var(--gold)";
    document.getElementById("mId").value = app.id;
    document.getElementById("mReqId").value = ""; 
    
    document.getElementById("aDate").value = d; document.getElementById("mOldDate").value = d;
    document.getElementById("aOra").value = app.ora; document.getElementById("aCam").value = app.cam || "";
    document.getElementById("aCog").value = app.cog || ""; document.getElementById("aTel").value = app.tel || "";
    document.getElementById("aOp").value = app.op || ""; document.getElementById("aNote").value = app.note || "";
    document.getElementById("aCab").value = app.cab;
    
    document.getElementById("eseguitoSwitchBox").style.display = "flex";
    const esegToggle = document.getElementById("aEseguito"); if(esegToggle) esegToggle.checked = app.eseguito === true;

    const uiBox = document.getElementById("uiPrivacyBox"); 
    const uiLink = document.getElementById("uiPrivacyLink");
    if(uiBox) uiBox.style.display = "block";
    if(uiLink) { 
        if(app.driveLink) { uiLink.href = app.driveLink; uiLink.style.display = "flex"; } 
        else { uiLink.style.display = "none"; } 
    }

    if(app.serv) { document.getElementById('aServ').value = app.serv; document.getElementById('aDur').value = app.dur || 30; document.getElementById('aPrice').value = app.price || 0; } 
    else { document.getElementById('aServ').value = ""; }
    
    sysRenderServiceBox(); 
    document.getElementById("btnSaveAppStandard").style.display = "flex";
    document.getElementById("editActionButtons").style.display = "flex"; 
    document.getElementById("reqActionButtons").style.display = "none";
    
    document.getElementById('sideForm').classList.add('active');
}

window.sysOpenRequestSidebar = function(reqId) {
    const d = document.getElementById("mainDate").value;
    let reqs = Array.isArray(db.requests[d]) ? db.requests[d] : Object.values(db.requests[d]||{});
    const req = reqs.find(x => x && x.id === reqId);
    if(!req) return;

    document.getElementById('sideForm').classList.add('request-mode');
    document.getElementById("sidebarTitle").innerText = "GESTISCI RICHIESTA"; 
    document.getElementById("sidebarTitle").style.color = "var(--purple)";
    
    document.getElementById("mId").value = ""; 
    document.getElementById("mReqId").value = req.id; 
    document.getElementById("reqConfOldOra").value = req.ora; 
    
    document.getElementById("aDate").value = d; document.getElementById("mOldDate").value = d;
    document.getElementById("aOra").value = req.ora; document.getElementById("aCam").value = req.cam || "";
    document.getElementById("aCog").value = req.cog || ""; document.getElementById("aTel").value = req.tel || "";
    document.getElementById("aOp").value = ""; 
    document.getElementById("aNote").value = req.note || "";
    document.getElementById("aCab").value = req.cab;
    
    document.getElementById("eseguitoSwitchBox").style.display = "none";
    if(document.getElementById("uiPrivacyBox")) document.getElementById("uiPrivacyBox").style.display = "none";

    if(req.serv) { document.getElementById('aServ').value = req.serv; document.getElementById('aDur').value = req.dur || 30; document.getElementById('aPrice').value = req.price || 0; } 
    else { document.getElementById('aServ').value = ""; }
    
    sysRenderServiceBox(); 
    
    document.getElementById("btnSaveAppStandard").style.display = "none";
    document.getElementById("editActionButtons").style.display = "none"; 
    document.getElementById("reqActionButtons").style.display = "flex";
    
    document.getElementById('sideForm').classList.add('active');
}

// --- SALVATAGGIO / ACCETTAZIONE SPA ---

window.sysSaveApp = function() {
    const id = document.getElementById("mId").value; const selDate = document.getElementById("aDate").value; 
    const oldDate = document.getElementById("mOldDate").value; const sName = document.getElementById('aServ').value;
    
    if(!selDate || !document.getElementById("aCam").value || !sName) return showToast("Compila i campi Camera e Servizio!");

    const nCog = document.getElementById('aCog').value.trim(); const nTel = document.getElementById('aTel').value.trim();
    if(nCog) { const ex = globalCustomers.find(c => c.nome && c.nome.toLowerCase() === nCog.toLowerCase()); if(!ex) firebase.database().ref('MASTER_ADMIN_DB/global_customers').push({ nome: nCog, tel: nTel, created_at: new Date().toISOString() }); }

    const toggleEseguito = document.getElementById("aEseguito") ? document.getElementById("aEseguito").checked : false;

    const obj = { 
        id: id || "APP"+Date.now(), 
        ora: document.getElementById("aOra").value, cab: document.getElementById("aCab").value, 
        cam: document.getElementById("aCam").value, cog: nCog, tel: nTel, 
        serv: sName, dur: parseInt(document.getElementById("aDur").value) || 30, price: parseFloat(document.getElementById("aPrice").value) || 0, 
        op: document.getElementById("aOp").value, note: document.getElementById("aNote").value, 
        eseguito: toggleEseguito, pagato: false 
    };
    
    const dbRefLocal = firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + window.twStructId);

    if(id && oldDate && oldDate !== selDate) { let oldApps = Array.isArray(db.app[oldDate]) ? db.app[oldDate] : Object.values(db.app[oldDate]||{}); oldApps = oldApps.filter(x => x && x.id !== id); dbRefLocal.child('app').child(oldDate).set(oldApps); }
    
    let apps = Array.isArray(db.app[selDate]) ? db.app[selDate] : Object.values(db.app[selDate]||{});
    if(id && oldDate === selDate) { 
        const idx = apps.findIndex(x => x && x.id === id); 
        if(idx > -1) { 
            obj.pagato = apps[idx].pagato; obj.fromReception = apps[idx].fromReception; obj.reqId = apps[idx].reqId; 
            if(apps[idx].privacySigned) obj.privacySigned = apps[idx].privacySigned;
            if(apps[idx].driveLink) obj.driveLink = apps[idx].driveLink;
            apps[idx] = obj; 
        } else apps.push(obj); 
    } else apps.push(obj); 

    dbRefLocal.child('app').child(selDate).set(apps).then(() => { closeSidebar(null, true); showToast("Agenda Salvata!"); if(selDate !== document.getElementById("mainDate").value) { document.getElementById("mainDate").value = selDate; window.render(); } });
}

window.sysAcceptRequest = function() {
    const reqId = document.getElementById('mReqId').value;
    const d = document.getElementById("mainDate").value;
    const confOra = document.getElementById('aOra').value;
    const oldOra = document.getElementById('reqConfOldOra').value;
    const sName = document.getElementById('aServ').value;
    
    if(!document.getElementById("aCam").value || !sName) return showToast("Compila i campi Camera e Servizio!");

    let reqs = Array.isArray(db.requests[d]) ? db.requests[d] : Object.values(db.requests[d]||{});
    const req = reqs.find(x => x && x.id === reqId);
    if(!req) return;

    const newApp = {
        id: "APP" + Date.now(), reqId: reqId,
        ora: confOra, cab: document.getElementById("aCab").value,
        cam: document.getElementById("aCam").value, cog: document.getElementById("aCog").value.trim(), tel: document.getElementById("aTel").value.trim(),
        serv: sName, dur: parseInt(document.getElementById("aDur").value) || 30, price: parseFloat(document.getElementById("aPrice").value) || 0,
        op: document.getElementById("aOp").value, note: document.getElementById("aNote").value, 
        eseguito: false, pagato: false, fromReception: true
    };

    const dbRefLocal = firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + window.twStructId);
    let apps = Array.isArray(db.app[d]) ? db.app[d] : Object.values(db.app[d]||{});
    apps.push(newApp);

    req.status = 'accepted';

    const isChanged = confOra !== oldOra;
    const logMsg = isChanged 
        ? `L'appuntamento è stato inserito in agenda modificando l'orario (Da ${oldOra} a ${confOra}).` 
        : `L'appuntamento è stato confermato regolarmente.`;

    Promise.all([
        dbRefLocal.child('app').child(d).set(apps),
        dbRefLocal.child('requests').child(d).set(reqs),
        dbRefLocal.child('requests_log').child(reqId).update({
            type: isChanged ? 'modified-accepted' : 'accepted', ora: confOra,
            msg: logMsg, date: new Date().toLocaleString('it-IT'), timestamp: Date.now()
        })
    ]).then(() => { closeSidebar(null, true); showToast("Confermato e Inserito!"); });
}

// --- ELIMINAZIONE INTELLIGENTE ---
window.sysPromptRejectRequest = function() {
    document.getElementById('delReasonInput').value = "";
    document.getElementById('deleteModal').style.display = 'flex';
    setTimeout(() => document.getElementById('delReasonInput').focus(), 100);
}

window.sysDelApp = function() { 
    const id = document.getElementById("mId").value; 
    const d = document.getElementById("mainDate").value; 
    let apps = Array.isArray(db.app[d]) ? db.app[d] : Object.values(db.app[d]||{});
    const appToDel = apps.find(x => x && x.id === id); 
    
    if (appToDel && appToDel.fromReception) {
        document.getElementById('delReasonInput').value = "";
        document.getElementById('deleteModal').style.display = 'flex';
        setTimeout(() => document.getElementById('delReasonInput').focus(), 100);
    } else {
        if(confirm("Sei sicuro di voler eliminare definitivamente questo appuntamento?")) {
            sysExecuteDeleteApp("Cancellato dallo Staff SPA");
        }
    }
}

window.sysConfirmDelete = function() {
    const motivo = document.getElementById('delReasonInput').value.trim(); 
    if(!motivo) { showToast("Inserisci un motivo obbligatorio!"); return; }
    
    const reqId = document.getElementById("mReqId").value;
    
    if(reqId) {
        const d = document.getElementById("mainDate").value;
        let reqs = Array.isArray(db.requests[d]) ? db.requests[d] : Object.values(db.requests[d]||{});
        const req = reqs.find(x => x && x.id === reqId);
        if(!req) return;
        req.status = 'rejected';
        
        const dbRefLocal = firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + window.twStructId);
        Promise.all([
            dbRefLocal.child('requests').child(d).set(reqs),
            dbRefLocal.child('requests_log').child(reqId).update({
                type: 'rejected', msg: `Richiesta RIFIUTATA dallo Staff SPA. Motivo: ${motivo}`,
                date: new Date().toLocaleString('it-IT'), timestamp: Date.now()
            })
        ]).then(() => {
            document.getElementById('deleteModal').style.display = 'none'; closeSidebar(null, true); showToast("Richiesta Rifiutata.");
        });
    } else {
        sysExecuteDeleteApp(motivo);
    }
}

function sysExecuteDeleteApp(motivo) {
    const id = document.getElementById("mId").value; 
    const d = document.getElementById("mainDate").value; 
    let apps = Array.isArray(db.app[d]) ? db.app[d] : Object.values(db.app[d]||{}); 
    const appToDel = apps.find(x => x && x.id === id); 
    apps = apps.filter(x => x && x.id !== id);
    
    const dbRefLocal = firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + window.twStructId);
    let promises = [dbRefLocal.child('app').child(d).set(apps)];

    if(appToDel) { 
        appToDel.deleteReason = motivo; appToDel.date = d; appToDel.deletedAt = new Date().toLocaleString('it-IT'); appToDel.deletedBy = localStorage.getItem("tw_user") || "Staff"; 
        promises.push(dbRefLocal.child('deleted_apps').push(appToDel)); 
        
        if(appToDel.fromReception && appToDel.reqId) {
            promises.push(dbRefLocal.child('requests_log').child(appToDel.reqId).update({
                type: 'deleted-after', msg: `L'appuntamento (già confermato in precedenza) è stato CANCELLATO dalla SPA. Motivo: ${motivo}`,
                date: new Date().toLocaleString('it-IT'), timestamp: Date.now()
            }));
        }
    } 
    
    Promise.all(promises).then(() => { document.getElementById('deleteModal').style.display = 'none'; closeSidebar(null, true); showToast("Eliminato con successo."); });
}

window.sysToggleEseguitoAgenda = function(e, date, appId) { e.stopPropagation(); let dayApps = Array.isArray(db.app[date]) ? db.app[date] : Object.values(db.app[date]||{}); const idx = dayApps.findIndex(a => a && a.id === appId); if(idx > -1) { const ns = !dayApps[idx].eseguito; dayApps[idx].eseguito = ns; firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + window.twStructId + '/app/' + date).set(dayApps).then(() => showToast(ns ? "Eseguito!" : "Spunta Rimossa!")); } }
window.sysShareWA = function() { const id = document.getElementById("mId").value; const d = document.getElementById("mainDate").value; let apps = Array.isArray(db.app[d]) ? db.app[d] : Object.values(db.app[d]||{}); const app = apps.find(x => x && x.id === id); if(app && app.tel) { window.open(`https://wa.me/${app.tel}?text=${encodeURIComponent(`Gentile Ospite, ti ricordiamo il tuo appuntamento per il trattamento: ${app.serv}, alle ore ${app.ora}. Ti aspettiamo nella nostra SPA!`)}`, '_blank'); closeSidebar(null, true); } else showToast("Manca telefono."); }

function tToM(t) { if(!t || typeof t !== 'string') return 0; const p = t.split(':'); return (parseInt(p[0])||0)*60 + (parseInt(p[1])||0); }
function mToT(m) { const h=Math.floor(m/60); const mm=m%60; return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; }
function getSlots() { let s=[]; for(let i=10*60; i<=20*60; i+=10) s.push(mToT(i)); return s; }

window.render = function() {
    const grid = document.getElementById("mainGrid"); if(!grid) return;
    
    const selOp = document.getElementById("aOp");
    if(selOp && db.staff) {
        const currentVal = selOp.value; selOp.innerHTML = '<option value="">-- Seleziona Operatore --</option>';
        const staffList = Array.isArray(db.staff) ? db.staff : Object.values(db.staff);
        staffList.forEach(s => { if(s && s.nome) selOp.innerHTML += `<option value="${s.nome}">${s.nome} ${s.cognome || ''}</option>`; });
        selOp.value = currentVal;
    }

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
            
            const startApp = dayApps.find(x => x && x.ora === s && parseInt(x.cab) === c);
            const busyApp = dayApps.find(x => { 
                if(!x || !x.ora) return false;
                const start = tToM(x.ora); const end = start + (parseInt(x.dur) || 30); 
                return parseInt(x.cab) === c && sMin > start && sMin < end; 
            });

            const startReq = dayReqs.find(x => x && x.ora === s && parseInt(x.cab) === c && x.status === 'pending');
            const busyReq = dayReqs.find(x => { 
                if(!x || !x.ora || x.status !== 'pending') return false;
                const start = tToM(x.ora); const end = start + (parseInt(x.dur) || 30); 
                return parseInt(x.cab) === c && sMin > start && sMin < end; 
            });
            
            if(startApp) {
                const isEseg = startApp.eseguito ? "eseguito-style" : "";
                const slotsCount = Math.ceil((parseInt(startApp.dur) || 30) / 10);
                const hCss = `height: calc(${slotsCount * 100}% + ${slotsCount - 1}px - 6px); top: 3px;`;
                let noteHtml = startApp.note ? `<div class="app-note-preview"><i class="material-icons-round" style="font-size:10px; vertical-align:middle">chat</i> ${startApp.note}</div>` : '';
                
                h += `<div class="time-row"><div class="time-lbl">${s}</div>
                      <div class="slot" data-ora="${s}" data-cab="${c}" ondragover="sysAllowDrop(event)" ondragleave="sysDragLeave(event)" ondrop="sysDrop(event)">
                        <div class="app-base ${isEseg}" style="${hCss}" draggable="true" ondragstart="sysDragStart(event, '${startApp.id}')"
                             ontouchstart="sysTouchStart(event, '${startApp.id}')" ontouchmove="sysTouchMove(event)" ontouchend="sysTouchEnd(event)"
                             onclick="sysOpenEdit('${startApp.id}')" ondragend="this.classList.remove('dragging')">
                            <div class="app-info-col">
                                <b>Cam ${startApp.cam || '?'} - ${startApp.cog || 'N.D.'}</b>
                                <span style="font-size:11px; margin-bottom:2px; opacity:0.9;">${startApp.serv || '-'} (${startApp.dur||30} min)</span>
                                <span style="font-size:10px; font-weight:bold; color:var(--gold);">OP: ${startApp.op || '-'}</span>
                                ${noteHtml}
                            </div>
                            <button class="btn-quick-eseg" onclick="sysToggleEseguitoAgenda(event, '${d}', '${startApp.id}')"><i class="material-icons-round">check</i></button>
                        </div>
                      </div></div>`;
            } else if(busyApp) {
                h += `<div class="time-row"><div class="time-lbl">${s}</div><div class="slot"><div class="app-busy" onclick="sysOpenEdit('${busyApp.id}')"></div></div></div>`;
            } else if(startReq) {
                const slotsCount = Math.ceil((parseInt(startReq.dur) || 30) / 10);
                const hCss = `height: calc(${slotsCount * 100}% + ${slotsCount - 1}px - 6px); top: 3px;`;
                let noteHtml = startReq.note ? `<div class="app-note-preview"><i class="material-icons-round" style="font-size:10px; vertical-align:middle">chat</i> ${startReq.note}</div>` : '';
                
                h += `<div class="time-row"><div class="time-lbl">${s}</div>
                      <div class="slot">
                        <div class="app-base req-style" style="${hCss}" onclick="sysOpenRequestSidebar('${startReq.id}')">
                            <div class="app-info-col">
                                <b><i class="material-icons-round" style="font-size:12px">notifications_active</i> RICHIESTA SPA</b>
                                <span style="font-size:11px; margin-bottom:2px; opacity:0.9;">Cam ${startReq.cam || '?'} - ${startReq.cog || 'Ospite'}</span>
                                <span style="font-size:10px; font-weight:bold;">${startReq.serv || '-'} (${startReq.dur||30} min)</span>
                                ${noteHtml}
                            </div>
                        </div>
                      </div></div>`;
            } else if(busyReq) {
                h += `<div class="time-row"><div class="time-lbl">${s}</div><div class="slot"><div class="app-busy req-busy" onclick="sysOpenRequestSidebar('${busyReq.id}')"></div></div></div>`;
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
    
    if(window.sysApplyZoom) window.sysApplyZoom();
};