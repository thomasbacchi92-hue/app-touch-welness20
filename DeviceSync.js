/* DeviceSync.js - Ponte Radio Multi-Firma v3.0 (Anti-404) */
window.DeviceSync = {
    initPC: function() {
        if(!window.twStructId) return;
        const syncRef = firebase.database().ref(`MASTER_ADMIN_DB/structures_data/${window.twStructId}/device_sync/tablet`);
        
        syncRef.on('value', snap => {
            const data = snap.val();
            if(data && data.status === 'completed') {
                
                // Controllo di Sicurezza: Il link deve esistere e iniziare con http
                if(data.driveLink && data.driveLink.startsWith("http")) {
                    
                    // Salva nel database dell'appuntamento
                    if(typeof window.savePrivacyLink === 'function') {
                        window.savePrivacyLink(data.appId, data.date, data.driveLink);
                    }
                    
                    // Forza l'aggiornamento grafico del bottone VEDI PDF
                    const btnPdf = document.getElementById('uiPrivacyLink');
                    if(btnPdf) {
                        btnPdf.href = data.driveLink;
                        btnPdf.style.display = 'flex';
                    }
                    
                    if(typeof showToast === 'function') showToast('✅ Documento Firmato e Salvato!');
                } else {
                    alert("⚠️ Firma completata, ma il server non ha generato un PDF valido. Controlla Make.com o Google Script.");
                }
                
                // Pulisce il canale radio
                syncRef.remove();
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

// Avvia l'ascolto in automatico solo se siamo nella pagina della Reception (Agenda)
document.addEventListener('DOMContentLoaded', () => { 
    const url = window.location.href.toLowerCase();
    if(!url.includes('mobile.html') && !url.includes('firma.html') && !url.includes('admin')) {
        setTimeout(() => { window.DeviceSync.initPC(); }, 1500);
    }
});
