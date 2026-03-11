/* DeviceSync.js - Ponte Radio Multi-Firma v2.0 */
window.DeviceSync = {
    initPC: function() {
        if(!window.twStructId) return;
        const syncRef = firebase.database().ref(`MASTER_ADMIN_DB/structures_data/${window.twStructId}/device_sync/tablet`);
        syncRef.on('value', snap => {
            const data = snap.val();
            if(data && data.status === 'completed') {
                if(typeof window.savePrivacyLink === 'function') window.savePrivacyLink(data.appId, data.date, data.driveLink);
                syncRef.remove();
                if(typeof showToast === 'function') showToast('✅ Documenti Firmati e Salvati!');
            }
        });
    },
    // Ora accetta un terzo parametro: l'array dei documenti
    sendToMobile: function(appId, date, docsArray = ["Consenso Privacy Base"]) {
        if(!window.twStructId) return;
        firebase.database().ref(`MASTER_ADMIN_DB/structures_data/${window.twStructId}/device_sync/tablet`).set({ 
            status: 'pending', 
            appId: appId, 
            date: date, 
            docs: docsArray, // Passa la lista
            timestamp: Date.now() 
        });
        if(typeof showToast === 'function') showToast('Inviato al Tablet... In attesa di firma');
    }
};

document.addEventListener('DOMContentLoaded', () => { 
    if(!window.location.href.toLowerCase().includes('mobile.html') && !window.location.href.toLowerCase().includes('firma.html')) {
        setTimeout(() => { window.DeviceSync.initPC(); }, 1500);
    }
});
