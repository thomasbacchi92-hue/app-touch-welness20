/* DeviceSync.js - Ponte Radio Multi-Firma v4.0 (Anti-404 + CRM Globale) */
window.DeviceSync = {
    initPC: function() {
        if(!window.twStructId) return;
        const syncRef = firebase.database().ref(`MASTER_ADMIN_DB/structures_data/${window.twStructId}/device_sync/tablet`);
        
        syncRef.on('value', snap => {
            const data = snap.val();
            if(data && data.status === 'completed') {
                
                if(data.driveLink && data.driveLink.startsWith("http")) {
                    
                    // 1. Salva nel database dell'appuntamento specifico
                    if(typeof window.savePrivacyLink === 'function') {
                        window.savePrivacyLink(data.appId, data.date, data.driveLink);
                    }
                    
                    // 2. SALVA NELL'ANAGRAFICA GLOBALE DEL CLIENTE (CRM)
                    window.DeviceSync.linkToGlobalCRM(data.appId, data.date, data.driveLink, data.docs);

                    // 3. Aggiorna il bottone "Vedi PDF" in Reception
                    const btnPdf = document.getElementById('uiPrivacyLink');
                    if(btnPdf) {
                        btnPdf.href = data.driveLink;
                        btnPdf.style.display = 'flex';
                    }
                    
                    if(typeof showToast === 'function') showToast('✅ Documento Firmato e Salvato nel CRM!');
                } else {
                    alert("⚠️ Firma completata, ma il server non ha generato un PDF valido.");
                }
                
                syncRef.remove(); // Pulisce la frequenza radio
            }
        });
    },

    // Funzione intelligente che trova il cliente e gli allega il documento
    linkToGlobalCRM: function(appId, date, link, docsArray) {
        const sid = window.twStructId;
        if(!sid) return;

        // Recupera i dati dell'appuntamento appena firmato per capire chi è l'ospite
        firebase.database().ref(`MASTER_ADMIN_DB/structures_data/${sid}/app/${date}`).once('value').then(snap => {
            let apps = snap.val() || [];
            if(!Array.isArray(apps)) apps = Object.values(apps);
            let myApp = apps.find(a => a && a.id === appId);

            if(myApp && myApp.cog) {
                const nomeCliente = myApp.cog.trim().toLowerCase();

                // Cerca questo nome nell'archivio clienti globale
                firebase.database().ref('MASTER_ADMIN_DB/global_customers').once('value').then(cSnap => {
                    const customers = cSnap.val() || {};
                    let targetCustId = null;

                    for(let cid in customers) {
                        if(customers[cid].nome && customers[cid].nome.trim().toLowerCase() === nomeCliente) {
                            targetCustId = cid; 
                            break;
                        }
                    }

                    // Se il cliente esiste nel CRM, inietta il documento nel suo profilo!
                    if(targetCustId) {
                        const docName = docsArray && docsArray.length > 0 ? "Multi-Firma: " + docsArray.join(', ') : "Consenso Privacy e Trattamenti SPA";
                        firebase.database().ref(`MASTER_ADMIN_DB/global_customers/${targetCustId}/docs`).push({
                            dataInserimento: new Date().toLocaleString('it-IT'),
                            nomeDoc: docName,
                            link: link,
                            structId: sid
                        });
                    }
                });
            }
        });
    },

    sendToMobile: function(appId, date, docsArray = ["Consenso Privacy Base"]) {
        if(!window.twStructId) return;
        firebase.database().ref(`MASTER_ADMIN_DB/structures_data/${window.twStructId}/device_sync/tablet`).set({ 
            status: 'pending', 
            appId: appId, 
            date: date, 
            docs: docsArray, 
            timestamp: Date.now() 
        });
        if(typeof showToast === 'function') showToast('Inviato al Tablet... In attesa di firma');
    }
};

document.addEventListener('DOMContentLoaded', () => { 
    const url = window.location.href.toLowerCase();
    if(!url.includes('mobile.html') && !url.includes('firma.html') && !url.includes('admin')) {
        setTimeout(() => { window.DeviceSync.initPC(); }, 1500);
    }
});
