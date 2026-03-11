/* Admin_Menu.js - Menu Dinamico Direzionale Master v16.2 */

window.injectAdminMenu = function() {
    if (document.getElementById('adminSidebar')) return;

    // Determina la pagina corrente per mantenere attivo il sottomenu e l'evidenziazione
    const isDocPage = window.location.href.includes('admin_documenti');

    const menuHTML = `
    <div class="sidebar" id="adminSidebar">
        <button class="btn-icon" style="position:absolute; top:15px; right:15px; color:var(--text-main); display:none;" id="mobileCloseBtn" onclick="document.getElementById('sidebarOverlay').click()"><i class="material-icons-round">close</i></button>
        <div class="logo">ADMIN MASTER</div>

        <div class="nav-item ${!isDocPage ? 'active' : ''}" id="nav-stats" onclick="if(typeof app !== 'undefined'){app.switchView('stats'); document.getElementById('sidebarOverlay').click();}else{window.location.href='admin.html'}"><i class="material-icons-round">analytics</i> Dashboard</div>
        <div class="nav-item" id="nav-structures" onclick="if(typeof app !== 'undefined'){app.switchView('structures'); document.getElementById('sidebarOverlay').click();}else{window.location.href='admin.html'}"><i class="material-icons-round">apartment</i> Strutture & Licenze</div>
        <div class="nav-item" onclick="window.location.href='admin_chat.html'"><i class="material-icons-round">forum</i> Chat Network</div>

        <div class="nav-item ${isDocPage ? 'active' : ''}" id="nav-group-options" onclick="if(typeof app !== 'undefined'){app.toggleSubMenu('optionsSubMenu');}else{document.getElementById('optionsSubMenu').style.display='flex';}">
            <i class="material-icons-round">settings</i> Opzioni
            <i class="material-icons-round" id="optionsSubMenuIcon" style="margin-left:auto; transition: 0.3s; ${isDocPage ? 'transform: rotate(180deg);' : ''}">expand_more</i>
        </div>

        <div id="optionsSubMenu" style="display:${isDocPage ? 'flex' : 'none'}; flex-direction:column; padding-left:10px; margin-left:15px; border-left:2px solid var(--border-line);">
            <div class="nav-item" id="nav-customers" onclick="if(typeof app !== 'undefined'){app.switchView('customers'); document.getElementById('sidebarOverlay').click();}else{window.location.href='admin.html'}" style="padding:10px; font-size:12px;"><i class="material-icons-round" style="font-size:16px;">contact_phone</i> Anagrafica Clienti</div>
            <div class="nav-item" id="nav-treatments" onclick="if(typeof app !== 'undefined'){app.switchView('treatments'); document.getElementById('sidebarOverlay').click();}else{window.location.href='admin.html'}" style="padding:10px; font-size:12px;"><i class="material-icons-round" style="font-size:16px;">spa</i> Trattamenti Master</div>
            <div class="nav-item" id="nav-users" onclick="if(typeof app !== 'undefined'){app.switchView('users'); document.getElementById('sidebarOverlay').click();}else{window.location.href='admin.html'}" style="padding:10px; font-size:12px;"><i class="material-icons-round" style="font-size:16px;">people</i> Collaboratori</div>
            <div class="nav-item ${isDocPage ? 'active' : ''}" id="nav-documents" onclick="window.location.href='admin_documenti.html'" style="padding:10px; font-size:12px;"><i class="material-icons-round" style="font-size:16px;">folder</i> Documenti</div>
            <div class="nav-item" id="nav-options" onclick="if(typeof app !== 'undefined'){app.switchView('options'); document.getElementById('sidebarOverlay').click();}else{window.location.href='admin.html'}" style="padding:10px; font-size:12px;"><i class="material-icons-round" style="font-size:16px;">palette</i> Opzioni Tema</div>
        </div>

        <div style="margin-top:auto; padding-top:20px; border-top:1px solid var(--border-line); text-align:center; font-size:10px; color:var(--text-muted); line-height:1.6">
            <b style="color:var(--text-main); font-size:11px">BACCHI THOMAS</b><br>C.F. BCCTMS92S17F240A<br><span style="color:var(--red)">© ALL RIGHTS RESERVED</span>
        </div>
    </div>
    `;
    
    const overlay = document.getElementById('sidebarOverlay');
    if(overlay) {
        overlay.insertAdjacentHTML('afterend', menuHTML);
    }
};

if (document.readyState === 'loading') { 
    document.addEventListener('DOMContentLoaded', window.injectAdminMenu); 
} else { 
    window.injectAdminMenu(); 
}