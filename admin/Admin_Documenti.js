/* Admin_Documenti.js - Core Logic per Documenti Cloud e Generazione v4.6 (Fix Lettura Diretta DB) */

const fbConfigDocs = {
    apiKey: "AIzaSyCrDuK7SWHdbzrJR-pNpxmRwGnZgV2Dd2Y",
    authDomain: "touch-welness-massage.firebaseapp.com",
    databaseURL: "https://touch-welness-massage-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "touch-welness-massage",
    storageBucket: "touch-welness-massage.firebasestorage.app"
};

if (!firebase.apps.length) firebase.initializeApp(fbConfigDocs);

window.docApp = {
    templates: {},
    structures: {},
    structuresData: {}, 
    currentTemplateId: null,
    driveFolderId: "",

    init: function() {
        if(localStorage.getItem('tw_admin_theme') === 'light') document.documentElement.classList.add('light-theme');

        firebase.database().ref('MASTER_ADMIN_DB/settings/drive_folder_id').on('value', snap => {
            this.driveFolderId = snap.val() || "";
            this.renderDrive();
        });

        firebase.database().ref('MASTER_ADMIN_DB/doc_templates').on('value', snap => {
            this.templates = snap.val() || {};
            this.renderTemplates();
        });

        firebase.database().ref('MASTER_ADMIN_DB/structures').on('value', snap => {
            this.structures = snap.val() || {};
            this.renderGeneratedDocs();
            this.renderConfigSelect();
        });

        firebase.database().ref('MASTER_ADMIN_DB/structures_data').on('value', snap => {
            this.structuresData = snap.val() || {};
            this.renderGeneratedDocs();
        });
    },

    openTab: function(tab, element) {
        document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
        
        const targetContent = document.getElementById('tab-' + tab);
        if(targetContent) targetContent.classList.add('active');
        
        if(element) element.classList.add('active');
    },

    showToast: function(m) { 
        const t = document.getElementById("toastBlue"); 
        if(t){ t.innerText = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); } 
    },

    renderDrive: function() {
        const container = document.getElementById('driveFrameContainer');
        if(!container) return;

        if(this.driveFolderId) {
            container.innerHTML = `<iframe src="https://drive.google.com/embeddedfolderview?id=${this.driveFolderId}#list" width="100%" height="100%" frameborder="0" style="border:none;"></iframe>`;
        } else {
            container.innerHTML = `
                <div style="text-align:center; padding:50px; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;">
                    <i class="material-icons-round" style="font-size:48px; color:var(--text-muted); margin-bottom:15px;">cloud_off</i>
                    <h3 style="color:var(--text-main); margin:0 0 10px 0;">Cartella non configurata</h3>
                    <p style="color:var(--text-muted); font-size:13px; max-width:400px; margin-bottom:20px;">
                        Per visualizzare il Drive all'interno del software, clicca su CONFIGURA e inserisci l'ID di una cartella Google Drive che hai precedentemente impostato su "Chiunque abbia il link".
                    </p>
                    <button class="btn-action" onclick="docApp.setupDrive()">INSERISCI ID CARTELLA</button>
                </div>
            `;
        }
    },

    setupDrive: function() {
        const msg = "Inserisci l'ID della tua cartella Google Drive.\n\nEsempio se il tuo link è:\ndrive.google.com/drive/folders/1WeBMBWbCtw...\n\nDevi incollare solo l'ID finale: 1WeBMBWbCtwPwabvL215aF_hiFoHBr_cP";
        const id = prompt(msg, this.driveFolderId);
        
        if(id !== null && id.trim() !== "") {
            firebase.database().ref('MASTER_ADMIN_DB/settings/drive_folder_id').set(id.trim()).then(() => {
                this.showToast("Google Drive configurato correttamente!");
            });
        }
    },

    openNativeDriveEditor: function() {
        if(!this.driveFolderId) return this.showToast("Configura prima l'ID Cartella");
        window.open('https://drive.google.com/drive/folders/' + this.driveFolderId, '_blank');
    },

    renderTemplates: function() {
        const tbody = document.getElementById('templatesTable');
        if(!tbody) return;
        tbody.innerHTML = '';
        const entries = Object.entries(this.templates);
        
        if(entries.length === 0) {
            tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:30px; font-weight:bold; color:var(--text-muted)'>Nessun file vergine caricato nel sistema.</td></tr>";
            return;
        }

        entries.forEach(([id, t]) => {
            tbody.innerHTML += `
            <tr>
                <td><b style="color:var(--text-main); font-size:14px;">${t.name}</b></td>
                <td style="color:var(--text-muted); font-size:12px">${t.createdAt}</td>
                <td style="color:var(--text-muted); font-size:12px">${t.updatedAt}</td>
                <td style="text-align:right; white-space:nowrap;">
                    <button class="btn-action btn-sm btn-outline" style="margin-right:5px;" onclick="docApp.openTemplateModal('${id}')" title="Modifica File Vergine"><i class="material-icons-round" style="font-size:14px; margin-right:4px;">edit</i> MODIFICA / SALVA</button>
                    <button class="btn-action btn-sm" style="background:rgba(56, 189, 248, 0.1); color:var(--accent); border:1px solid rgba(56, 189, 248, 0.3);" onclick="docApp.openTransform('${id}')" title="Trasforma con dati struttura"><i class="material-icons-round" style="font-size:14px; margin-right:4px;">auto_fix_high</i> TRASFORMA</button>
                    <button class="btn-icon btn-del" style="margin-left:10px; display:inline-block; vertical-align:middle;" onclick="docApp.deleteTemplate('${id}')" title="Elimina File Vergine"><i class="material-icons-round">delete</i></button>
                </td>
            </tr>
            `;
        });
    },

    openTemplateModal: function(id = null) {
        this.currentTemplateId = id;
        if(id && this.templates[id]) {
            document.getElementById('tplName').value = this.templates[id].name;
            document.getElementById('tplContent').value = this.templates[id].content;
            document.getElementById('tplModalTitle').innerText = "Modifica File Vergine";
        } else {
            document.getElementById('tplName').value = "";
            document.getElementById('tplContent').value = "";
            document.getElementById('tplModalTitle').innerText = "Nuovo File Vergine";
        }
        document.getElementById('templateModal').style.display = 'flex';
    },

    saveTemplate: function() {
        const name = document.getElementById('tplName').value.trim();
        const content = document.getElementById('tplContent').value.trim();
        if(!name || !content) return this.showToast("Inserisci il Nome e il Testo Base del documento!");
        
        const now = new Date().toLocaleString('it-IT');
        let data = { name: name, content: content, updatedAt: now };
        
        if(this.currentTemplateId) {
            data.createdAt = this.templates[this.currentTemplateId].createdAt;
            firebase.database().ref('MASTER_ADMIN_DB/doc_templates/' + this.currentTemplateId).update(data).then(() => {
                this.showToast("Modifiche Salvate");
                document.getElementById('templateModal').style.display = 'none';
            });
        } else {
            data.createdAt = now;
            firebase.database().ref('MASTER_ADMIN_DB/doc_templates').push(data).then(() => {
                this.showToast("Nuovo File Vergine Caricato");
                document.getElementById('templateModal').style.display = 'none';
            });
        }
    },

    deleteTemplate: function(id) {
        if(confirm("Attenzione!\nSei sicuro di voler eliminare definitivamente questo File Vergine?")) {
            firebase.database().ref('MASTER_ADMIN_DB/doc_templates/' + id).remove().then(() => {
                this.showToast("File Vergine eliminato.");
            });
        }
    },

    openTransform: function(id) {
        this.currentTemplateId = id;
        const sel = document.getElementById('transStruct');
        sel.innerHTML = '<option value="">-- Seleziona Struttura Destinataria --</option>';
        Object.values(this.structures).forEach(s => {
            if(!s.archived) sel.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        });
        document.getElementById('transPreview').value = "Seleziona una struttura dal menu a tendina per visualizzare il testo trasformato automaticamente.";
        document.getElementById('transformModal').style.display = 'flex';
    },

    generatePreview: function() {
        const structId = document.getElementById('transStruct').value;
        if(!structId) return;
        
        const template = this.templates[this.currentTemplateId];
        const struct = this.structures[structId];
        const info = struct.info || {};
        
        let text = template.content;
        
        text = text.replace(/\{\{NOME_STRUTTURA\}\}/g, struct.name || "[Nome Struttura Mancante]");
        text = text.replace(/\{\{SOCIETA_GESTORE\}\}/g, info.g_ragione || info.gestore || "[Società Mancante]");
        text = text.replace(/\{\{INDIRIZZO\}\}/g, info.s_addr || info.addr || "[Indirizzo Mancante]");
        text = text.replace(/\{\{CITTA\}\}/g, info.s_city || info.city || "[Città Mancante]");
        text = text.replace(/\{\{PIVA\}\}/g, info.g_piva || info.piva || "[P.IVA Mancante]");
        text = text.replace(/\{\{TELEFONO\}\}/g, info.s_tel || info.tel || "[Telefono Mancante]");
        text = text.replace(/\{\{EMAIL\}\}/g, info.s_email || info.pec || "[Email Mancante]");
        
        document.getElementById('transPreview').value = text;
    },

    saveTransformed: function() {
        const structId = document.getElementById('transStruct').value;
        const text = document.getElementById('transPreview').value;
        const template = this.templates[this.currentTemplateId];
        
        if(!structId) return this.showToast("Seleziona prima una struttura dalla tendina!");
        if(text.includes("Seleziona una struttura dal menu")) return this.showToast("Genera prima l'anteprima selezionando una struttura.");
        
        const docData = {
            date: new Date().toLocaleString('it-IT'),
            type: 'struttura_template', 
            documentName: template.name + " (Intestato)",
            assignedTo: 'Struttura',
            testoGenerato: text 
        };
        
        firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + structId + '/contracts').push(docData).then(() => {
            this.showToast("Documento salvato e intestato con successo!");
            document.getElementById('transformModal').style.display = 'none';
        });
    },

    renderGeneratedDocs: function() {
        const container = document.getElementById('generatedDocsContainer');
        if(!container || Object.keys(this.structures).length === 0 || Object.keys(this.structuresData).length === 0) return;
        
        let html = '';
        let globalCount = 0;

        Object.values(this.structures).forEach(struct => {
            if(struct.archived) return;
            
            const structData = this.structuresData[struct.id];
            if(!structData || !structData.contracts) return;
            
            let structDocsHtml = '';
            let structDocCount = 0;

            Object.entries(structData.contracts).forEach(([docId, doc]) => {
                if(doc.testoGenerato) {
                    structDocCount++;
                    globalCount++;
                    structDocsHtml += `
                        <tr style="background:var(--bg-body)">
                            <td><b style="color:var(--text-main)">${doc.documentName}</b></td>
                            <td style="color:var(--text-muted); font-size:12px">${doc.date}</td>
                            <td style="text-align:right; white-space:nowrap;">
                                <button class="btn-action btn-sm btn-outline" style="margin-right:5px;" onclick="docApp.openEditGenDoc('${struct.id}', '${docId}')"><i class="material-icons-round" style="font-size:14px;">edit</i> MODIFICA</button>
                                <button class="btn-action btn-sm" style="background:#dc2626; margin-right:5px;" onclick="docApp.exportPDF('${struct.id}', '${docId}')"><i class="material-icons-round" style="font-size:14px;">picture_as_pdf</i> STAMPA / PDF</button>
                                <button class="btn-action btn-sm" style="background:#2563eb;" onclick="docApp.exportWord('${struct.id}', '${docId}')"><i class="material-icons-round" style="font-size:14px;">description</i> WORD</button>
                                <button class="btn-icon btn-del" style="margin-left:10px; display:inline-block; vertical-align:middle;" onclick="docApp.deleteGenDoc('${struct.id}', '${docId}')" title="Elimina Documento"><i class="material-icons-round">delete</i></button>
                            </td>
                        </tr>
                    `;
                }
            });

            if(structDocCount > 0) {
                html += `
                    <div class="struct-folder" onclick="docApp.toggleFolder('f_${struct.id}')">
                        <i class="material-icons-round" style="color:var(--gold)">folder</i> 
                        ${struct.name} <span style="font-size:11px; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:10px;">${structDocCount} file</span>
                    </div>
                    <div id="f_${struct.id}" style="display:none; padding:10px 0 20px 0; margin-left:15px; border-left:2px solid var(--accent); padding-left:15px;">
                        <table class="data-table">
                            <thead><tr><th>Nome Documento</th><th>Data Creazione</th><th style="text-align:right">Azioni ed Export</th></tr></thead>
                            <tbody>${structDocsHtml}</tbody>
                        </table>
                    </div>
                `;
            }
        });

        if(globalCount === 0) {
            container.innerHTML = "<div style='text-align:center; padding:30px; color:var(--text-muted); font-weight:bold;'>Nessun documento è ancora stato intestato ad alcuna struttura.</div>";
        } else {
            container.innerHTML = html;
        }
    },

    toggleFolder: function(folderId) {
        const f = document.getElementById(folderId);
        if(f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
    },

    openEditGenDoc: function(structId, docId) {
        const doc = this.structuresData[structId].contracts[docId];
        if(!doc) return;
        document.getElementById('egd_structId').value = structId;
        document.getElementById('egd_docId').value = docId;
        document.getElementById('egd_content').value = doc.testoGenerato;
        document.getElementById('editGenDocModal').style.display = 'flex';
    },

    saveEditedDoc: function() {
        const structId = document.getElementById('egd_structId').value;
        const docId = document.getElementById('egd_docId').value;
        const content = document.getElementById('egd_content').value;
        
        firebase.database().ref(`MASTER_ADMIN_DB/structures_data/${structId}/contracts/${docId}`).update({ testoGenerato: content }).then(() => {
            this.showToast("Modifiche salvate con successo!");
            document.getElementById('editGenDocModal').style.display = 'none';
        });
    },

    deleteGenDoc: function(structId, docId) {
        if(confirm("Sei sicuro di voler eliminare definitivamente questo documento intestato?")) {
            firebase.database().ref(`MASTER_ADMIN_DB/structures_data/${structId}/contracts/${docId}`).remove().then(() => {
                this.showToast("Documento eliminato.");
            });
        }
    },

    exportPDF: function(structId, docId) {
        const doc = this.structuresData[structId].contracts[docId];
        if(!doc) return;
        let content = doc.testoGenerato;
        
        if (!content.includes('<div') && !content.includes('<table')) {
            content = content.replace(/\n/g, '<br>');
        }

        const printWindow = window.open('', '_blank', 'height=900,width=800');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html><head><title>${doc.documentName}</title>
            <style>
                @page { size: A4; margin: 10mm; }
                body { 
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                    line-height: 1.3; 
                    padding: 0; 
                    color: #000; 
                    font-size: 11px;
                    margin: 0;
                    background: white;
                }
                table { width: 100%; border-collapse: collapse; }
                td, th { border: 1px solid #000; padding: 4px; }
                @media print {
                    @page { margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
            </head><body>${content}</body></html>
        `);
        printWindow.document.close();
        setTimeout(() => { printWindow.focus(); printWindow.print(); }, 500);
    },

    exportWord: function(structId, docId) {
        const doc = this.structuresData[structId].contracts[docId];
        if(!doc) return;
        let content = doc.testoGenerato;
        
        if (!content.includes('<div') && !content.includes('<table')) {
            content = content.replace(/\n/g, '<br>');
        }

        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export</title></head><body>";
        const footer = "</body></html>";
        const sourceHTML = header + "<div style='font-family:Arial; font-size:12px; white-space:pre-wrap;'>" + content + "</div>" + footer;
        
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = doc.documentName + '.doc';
        fileDownload.click();
        document.body.removeChild(fileDownload);
    },

    renderConfigSelect: function() {
        const sel = document.getElementById('configStructSelect');
        if(!sel) return;
        const currentVal = sel.value;
        sel.innerHTML = '<option value="">-- Seleziona Struttura --</option>';
        Object.values(this.structures).forEach(s => {
            if(!s.archived) sel.innerHTML += `<option value="${s.id}">${s.name} (${s.id})</option>`;
        });
        sel.value = currentVal;
    }
};

// FIX: Ora va a leggere DIRETTAMENTE in tempo reale dal database per essere 100% infallibile
window.loadStructDocsForConfig = function() {
    const sid = document.getElementById('configStructSelect').value;
    const container = document.getElementById('configDocsList');
    
    if(!sid) {
        container.innerHTML = '<div style="color:var(--text-muted); font-size:12px; text-align:center;">Seleziona una struttura dal menu a tendina.</div>';
        return;
    }

    container.innerHTML = '<div style="color:var(--accent); font-size:13px; font-weight:bold; text-align:center;">Caricamento documenti in corso...</div>';

    // Lettura Diretta per non soffrire di eventuali ritardi o desincronizzazioni di pagina
    firebase.database().ref(`MASTER_ADMIN_DB/structures_data/${sid}`).once('value').then(snap => {
        const structData = snap.val() || {};
        const docs = structData.contracts || structData.generated_docs || {}; 
        const activeDocs = (structData.settings && structData.settings.active_docs) ? structData.settings.active_docs : [];

        if(Object.keys(docs).length === 0) {
             container.innerHTML = '<div style="color:var(--red); font-size:13px; font-weight:bold; text-align:center;">Nessun documento generato per questa struttura. Prima trasforma i modelli.</div>';
             return;
        }

        let html = '';
        Object.entries(docs).forEach(([docId, doc]) => {
            if(!doc.testoGenerato) return;
            const docName = doc.documentName || docId;
            const isChecked = activeDocs.includes(docName) ? "checked" : "";
            html += `
            <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; cursor: pointer; padding: 10px; background: var(--bg-body); border: 1px solid var(--border-line); border-radius: 8px;">
                <input type="checkbox" class="multi-doc-config-checkbox" value="${docName}" ${isChecked} style="width: 20px; height: 20px; accent-color: var(--accent); margin:0;">
                <span style="font-size: 14px; font-weight: bold; color:var(--text-main)">${docName}</span>
            </label>`;
        });
        
        if (html === '') {
            container.innerHTML = '<div style="color:var(--red); font-size:13px; font-weight:bold; text-align:center;">Nessun documento valido trovato.</div>';
        } else {
            container.innerHTML = html;
        }
    }).catch(err => {
        container.innerHTML = '<div style="color:var(--red); text-align:center;">Errore di caricamento: ' + err.message + '</div>';
    });
};

window.saveActiveDocsConfig = function() {
    const sid = document.getElementById('configStructSelect').value;
    if(!sid) return alert("Seleziona una struttura prima di salvare.");
    
    const checkboxes = document.querySelectorAll('.multi-doc-config-checkbox:checked');
    const selectedDocs = Array.from(checkboxes).map(cb => cb.value);

    if(selectedDocs.length === 0) {
        if(!confirm("Non hai selezionato nessun documento. Vuoi che la reception di questa struttura non invii nulla al tablet?")) return;
    }

    firebase.database().ref(`MASTER_ADMIN_DB/structures_data/${sid}/settings/active_docs`).set(selectedDocs)
    .then(() => {
        docApp.showToast("Impostazioni salvate! La Reception ora userà questi documenti.");
    }).catch(e => alert("Errore durante il salvataggio: " + e.message));
};

if (document.readyState === 'loading') { 
    document.addEventListener('DOMContentLoaded', () => docApp.init()); 
} else { 
    docApp.init(); 
}