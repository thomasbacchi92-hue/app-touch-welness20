/* Backup Manager - Esportazione Avanzata v3.0 */

function exportSimpleExcel() {
    const d = document.getElementById("poolDate").value;
    const list = poolData[d] || [];
    
    if(list.length === 0) return alert("Nessun dato da esportare per oggi.");

    // FORMATO RICHIESTO: N. Camera, Nome Cognome, PAX, Tipologia Accesso
    let csv = "N. CAMERA;NOME E COGNOME;PAX;TIPOLOGIA DI ACCESSO\n";
    
    list.forEach(row => {
        // Pulisce eventuali punto e virgola nei dati per evitare errori strutturali nel CSV
        const cam = (row.cam || "").toString().replace(/;/g, "");
        const cog = (row.cog || "").toString().replace(/;/g, " ");
        const pax = (row.pers || "1").toString().replace(/;/g, "");
        const area = (row.area || "").toString().replace(/;/g, "");
        
        csv += `${cam};${cog};${pax};${area}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lista_Accessi_${d}.csv`;
    a.click();
}

function backupData() { /* Legacy function mantenuta se necessaria in futuro */ }