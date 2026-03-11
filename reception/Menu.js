/* Menu.js - Navigazione Client RICEVIMENTO/DIREZIONE */

window.injectMenu = function() {
    if (document.getElementById('navMenu')) return; 

    const path = window.location.pathname.toLowerCase();
    const inRoot = !path.includes('/reception'); 
    
    const base = inRoot ? './reception/' : './';
    const rootBase = inRoot ? './' : '../';

    const menuHTML = `
    <style>
        #navMenu { position: fixed; top: 0; right: -320px; width: 300px; height: 100vh; background: #0f172a !important; color: #ffffff !important; border-left: 2px solid #334155; box-shadow: -10px 0 30px rgba(0,0,0,0.8); transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 9999; padding: 20px; box-sizing: border-box; display: flex; flex-direction: column; overflow-y: auto; }
        #navMenu.open { right: 0; }
        .nav-link { display: flex; align-items: center; gap: 12px; color: #ffffff; text-decoration: none; padding: 15px; margin-bottom: 8px; border-radius: 8px; font-weight: bold; font-size: 14px; transition: 0.2s; border: 1px solid transparent; cursor: pointer; }
        .nav-link:hover { background: rgba(168, 85, 247, 0.1); color: #a855f7; border-color: #a855f7; }
    </style>
    <div id="navMenu">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 30px; border-bottom: 1px solid #334155; padding-bottom: 15px;">
            <div style="font-weight:900; color:#a855f7; letter-spacing:1px; font-size:16px;">DIREZIONE / RECEPTION</div>
            <i class="material-icons-round" style="cursor:pointer; color:#94a3b8;" onclick="window.toggleMenu(event)">close</i>
        </div>
        
        <a href="${base}index.html" class="nav-link"><i class="material-icons-round">calendar_today</i> INVIA RICHIESTE</a>
        <a href="${base}log.html" class="nav-link"><i class="material-icons-round">history</i> LOG ATTIVITÀ</a>
        
        <a href="${rootBase}chat.html" class="nav-link"><i class="material-icons-round">forum</i> CHAT STRUTTURA</a>
        
        <a href="${base}Area_Riservata.html" class="nav-link"><i class="material-icons-round">lock_person</i> AREA RISERVATA INCASSI</a>
        
        <div class="nav-link" onclick="window.logoutApp()" style="margin-top:auto; color:#ef4444; background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.2); justify-content:center; cursor:pointer;">
            <i class="material-icons-round">logout</i> DISCONNETTI
        </div>
    </div>
    `;
    document.head.insertAdjacentHTML('beforeend', '<style>@import url("https://fonts.googleapis.com/icon?family=Material+Icons+Round");</style>');
    document.body.insertAdjacentHTML('beforeend', menuHTML);
};

window.toggleMenu = function(e) { 
    if(e) e.stopPropagation(); 
    const menu = document.getElementById('navMenu');
    if(menu) { menu.classList.toggle('open'); } else { window.injectMenu(); setTimeout(() => { document.getElementById('navMenu').classList.toggle('open'); }, 50); }
};

window.logoutApp = function() {
    localStorage.clear();
    const path = window.location.pathname.toLowerCase();
    const inRoot = !path.includes('/reception'); 
    const rootBase = inRoot ? './' : '../';
    window.location.href = rootBase + "login.html";
};

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', window.injectMenu); } else { window.injectMenu(); }