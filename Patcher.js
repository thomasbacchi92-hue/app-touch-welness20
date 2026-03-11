// Patcher.js - Super Patcher Executable v3.0 (Con Motore Sostituzione Stringhe)
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const currentDir = process.cwd();
const logFile = path.join(currentDir, 'patcher_log.txt');

function log(message, isError = false) {
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const formattedMessage = `[${timestamp}] ${isError ? '❌ ERRORE:' : 'INFO:'} ${message}`;
    if (isError) console.error(formattedMessage);
    else console.log(formattedMessage);
    try { fs.appendFileSync(logFile, formattedMessage + '\n'); } catch(e) {}
}

log("==========================================");
log("🚀 AVVIO SUPER PATCHER V3 (CON SOSTITUZIONE STRINGHE)");
log("==========================================");

// --- 1. MOTORE DI SOSTITUZIONE STRINGHE (DELTA PATCHING) ---
// Qui il Patcher sa esattamente quali stringhe cercare e come correggerle
const stringPatches = [
    {
        file: 'DeviceSync.js',
        find: 'const MAKE_WEBHOOK_URL = https://hook.eu1.make.com/mlpkbaerv5kjtmj9gol8u6fkas17aejk',
        replace: "const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/mlpkbaerv5kjtmj9gol8u6fkas17aejk';"
    }
];

try {
    log("📝 Controllo stringhe da correggere nei file...");
    
    // Esegue le sostituzioni
    stringPatches.forEach(patch => {
        const filePath = path.join(currentDir, patch.file);
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            if (content.includes(patch.find)) {
                content = content.replace(patch.find, patch.replace);
                fs.writeFileSync(filePath, content, 'utf8');
                log(`🔧 [PATCH APPLICATA] Testo corretto con successo in: ${patch.file}`);
            }
        }
    });

    // --- 2. SISTEMA ANTI-CACHE E BACKUP ---
    const jsFiles = ['System.js', 'DeviceSync.js', 'Menu.js']; 
    const htmlFiles = ['index.html', 'Mobile.html'];
    
    let currentHashes = {};
    let hasChanges = false;
    let history = {};
    const historyPath = path.join(currentDir, 'patch_history.json');

    if (fs.existsSync(historyPath)) {
        history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }

    log("🔍 Inizio scansione integrità e aggiornamento cache...");
    jsFiles.forEach(file => {
        const filePath = path.join(currentDir, file);
        if (fs.existsSync(filePath)) {
            const fileBuffer = fs.readFileSync(filePath);
            const hashSum = crypto.createHash('sha256');
            hashSum.update(fileBuffer);
            const hex = hashSum.digest('hex');
            currentHashes[file] = hex;

            if (history[file] !== hex) {
                log(`[MODIFICATO] -> Rilevata nuova versione di ${file}`);
                hasChanges = true;
            } else {
                log(`[INTATTO] -> ${file}`);
            }
        }
    });

    if (!hasChanges) {
        log("✅ Nessuna modifica rilevata. I file sono pronti.");
        log("==========================================\n");
        process.exit(0);
    }

    const newVersion = "v" + Date.now();
    log(`⚙️ Generazione stringa anti-cache: ${newVersion}`);

    htmlFiles.forEach(htmlFile => {
        const htmlPath = path.join(currentDir, htmlFile);
        if (fs.existsSync(htmlPath)) {
            const backupName = path.join(currentDir, `${htmlFile}.bak`);
            try {
                fs.copyFileSync(htmlPath, backupName);
                log(`🛡️ [BACKUP] Creato salvagente per ${htmlFile}`);

                let content = fs.readFileSync(htmlPath, 'utf8');
                jsFiles.forEach(jsFile => {
                    const regex = new RegExp(`src=["']${jsFile}(\\?v=[a-zA-Z0-9_]+)?["']`, 'g');
                    content = content.replace(regex, `src="${jsFile}?v=${newVersion}"`);
                });

                const tempFile = path.join(currentDir, `${htmlFile}.tmp`);
                fs.writeFileSync(tempFile, content, 'utf8');
                fs.renameSync(tempFile, htmlPath);
                log(`✅ [COMPLETATO] Iniettata versione in ${htmlFile}`);
            } catch (err) {
                log(`ERRORE FATALE in ${htmlFile}: ${err.message}`, true);
                if (fs.existsSync(backupName)) fs.copyFileSync(backupName, htmlPath);
            }
        }
    });

    fs.writeFileSync(historyPath, JSON.stringify(currentHashes, null, 2));
    log("🎉 AGGIORNAMENTO COMPLETATO CON SUCCESSO!");
    log("==========================================\n");

} catch (globalError) {
    log(`CRASH IMPREVISTO DI SISTEMA: ${globalError.stack}`, true);
    log("==========================================\n");
}