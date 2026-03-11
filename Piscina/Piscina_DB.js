/* Database Manager - Piscina Module v30.0 - FULL CLOUD FIREBASE */

const fbConfigPool = {
    apiKey: "AIzaSyCrDuK7SWHdbzrJR-pNpxmRwGnZgV2Dd2Y",
    authDomain: "touch-welness-massage.firebaseapp.com",
    databaseURL: "https://touch-welness-massage-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "touch-welness-massage",
    storageBucket: "touch-welness-massage.firebasestorage.app"
};

// Inizializza solo se non esiste già
if (!firebase.apps.length) firebase.initializeApp(fbConfigPool);

// Recupera ID Struttura (che serve per sapere in quale cartella di Firebase entrare)
const currentStructureId = localStorage.getItem("tw_structure_id");

if (!currentStructureId) {
    alert("Sessione scaduta. Effettua il Login.");
    window.location.href = "../Login.html";
    throw new Error("Accesso Negato: ID Struttura mancante"); 
}

// Punta ESCLUSIVAMENTE a Firebase
const poolRef = firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + currentStructureId + '/piscina_db_v1');

// Variabile locale di appoggio (non salva nella cache del browser)
let poolData = {};

function initDB() {
    // Resta in ascolto del server: se cambia qualcosa online, si aggiorna da solo
    poolRef.on('value', snapshot => {
        poolData = snapshot.val() || {};
        if(typeof loadPoolData === "function") loadPoolData();
    });
}

function savePoolEntry(date, entry, isFullUpdate = false) {
    if (!poolData) poolData = {};
    if (!poolData[date]) poolData[date] = [];

    if (!isFullUpdate && entry) {
        poolData[date].push(entry);
    }

    // Forza la scrittura FISICA SUL SERVER (No Cache)
    poolRef.child(date).set(poolData[date])
        .then(() => {
            if(typeof loadPoolData === "function") loadPoolData();
        })
        .catch((error) => {
            console.error("Errore salvataggio Cloud:", error);
        });
}

function removePoolEntry(date, id) {
    if(poolData[date]) {
        poolData[date] = poolData[date].filter(x => x.id !== id);
        // Cancella FISICAMENTE DAL SERVER
        poolRef.child(date).set(poolData[date]);
    }
}