import { renderMarketHot } from './components/marketHot.js';
import { renderMarketCold } from './components/marketCold.js';

document.addEventListener('DOMContentLoaded', () => {
    let cachedFplData = null; // Store for reactive loading
    
    // --- 1. THEME TOGGLE LOGIC ---
    const toggleBtn = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const moonIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    const sunIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';

    function setTheme(theme) {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        toggleBtn.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    toggleBtn.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    });

    // --- 2. FPL LIVE DATA FETCHING ---
    const PROXIES = [
        'https://corsproxy.io/?',
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://api.allorigins.win/raw?url='
    ];
    const FPL_API_URL = encodeURIComponent('https://fantasy.premierleague.com/api/bootstrap-static/');

    async function fetchFPLData() {
        let fplData = null;

        // Loop through proxies until one works
        for (const proxy of PROXIES) {
            try {
                const res = await fetch(proxy + FPL_API_URL);
                if (res.ok) { fplData = await res.json(); break; }
            } catch (e) { console.warn('Proxy failed:', proxy); }
        }

        if (!fplData) { 
            if(document.getElementById('gw-display')) document.getElementById('gw-display').textContent = "Error"; 
            return; 
        }

        cachedFplData = fplData; // Save data for re-use

        try {
            // A. Basic Stats (Only on Home Page)
            if (document.getElementById('gw-display')) {
                const currentEvent = fplData.events.find(event => event.is_current) || fplData.events.find(event => event.is_next);
                document.getElementById('gw-display').textContent = currentEvent ? currentEvent.name : "Pre-Season";

                const topPlayer = fplData.elements.sort((a, b) => b.total_points - a.total_points)[0];
                document.getElementById('top-player-display').textContent = `${topPlayer.web_name} (${topPlayer.total_points})`;

                document.getElementById('managers-display').textContent = fplData.total_players.toLocaleString();
            }

            // B. Render Dashboard Modules (Only on Home Page)
            if (document.getElementById('market-hot-list')) {
                renderMarketHot(fplData);
                renderMarketCold(fplData);
            }
            
            // C. Load Planner (Only on Planner Page)
            if (document.getElementById('planner-message')) {
                loadUserTeam(fplData);
            }

        } catch (error) {
            console.error('Error:', error);
            if(document.getElementById('gw-display')) document.getElementById('gw-display').textContent = "Error";
        }
    }

    fetchFPLData();

    // --- 3. TAB SWITCHING LOGIC ---
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (!tab.dataset.tab) return; // Guard for buttons without targets
            
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // --- 4. AUTH / MODAL LOGIC ---
    const authBtn = document.getElementById('auth-btn');
    const modal = document.getElementById('auth-modal');
    const closeModal = document.getElementById('close-modal');
    const saveBtn = document.getElementById('save-id-btn');
    const idInput = document.getElementById('fpl-id-input');

    function updateAuthUI() {
        const storedId = localStorage.getItem('fpl_id');
        if (storedId) {
            authBtn.textContent = 'Sign Out';
            authBtn.style.backgroundColor = 'var(--fpl-pink)';
            authBtn.style.color = 'white';
        } else {
            authBtn.textContent = 'Sign In';
            authBtn.style.backgroundColor = 'var(--fpl-cyan)';
            authBtn.style.color = 'var(--fpl-purple)';
        }
    }

    authBtn.addEventListener('click', () => {
        if (localStorage.getItem('fpl_id')) {
            if(confirm('Sign out?')) {
                localStorage.removeItem('fpl_id');
                updateAuthUI();
            }
        } else {
            modal.classList.remove('hidden');
        }
    });

    saveBtn.addEventListener('click', () => {
        if (idInput.value) {
            localStorage.setItem('fpl_id', idInput.value);
            modal.classList.add('hidden');
            updateAuthUI();

            // Instant Reload: If we have data and are on the planner page, load the team
            if (cachedFplData && document.getElementById('planner-message')) {
                loadUserTeam(cachedFplData);
            }
        }
    });

    closeModal.addEventListener('click', () => modal.classList.add('hidden'));

    // --- 5. HAMBURGER MENU TOGGLE ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        // Toggle icon between bars and times (X)
        const icon = hamburger.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.replace('fa-bars', 'fa-xmark');
        } else {
            icon.classList.replace('fa-xmark', 'fa-bars');
        }
    });

    // Close mobile menu when a link is clicked
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            hamburger.querySelector('i').classList.replace('fa-xmark', 'fa-bars');
        });
    });

    // --- 6. PLANNER LOGIC (Formation) ---
    async function loadUserTeam(fplData) {
        const userId = localStorage.getItem('fpl_id');
        const messageEl = document.getElementById('planner-message');
        const squadView = document.getElementById('squad-view');

        if (!userId) {
            messageEl.style.display = 'block';
            squadView.style.display = 'none';
            return;
        }

        // Get Current Gameweek
        const currentEvent = fplData.events.find(e => e.is_current) || fplData.events.find(e => e.is_next);
        const gwId = currentEvent ? currentEvent.id : 1;
        const picksUrl = encodeURIComponent(`https://fantasy.premierleague.com/api/entry/${userId}/event/${gwId}/picks/`);
        
        try {
            let picksData = null;
            for (const proxy of PROXIES) {
                try {
                    const res = await fetch(proxy + picksUrl);
                    if (res.ok) { picksData = await res.json(); break; }
                } catch(e) {}
            }

            if (!picksData) throw new Error('Could not fetch team');

            // Merge IDs with Real Data
            const fullSquad = picksData.picks.map(pick => {
                const player = fplData.elements.find(e => e.id === pick.element);
                return { ...player, position: pick.position }; 
            });

            renderPitch(fullSquad);
            messageEl.style.display = 'none';
            squadView.style.display = 'block';

        } catch (err) {
            console.error(err);
            messageEl.innerHTML = `<p style="color:red">Error loading team. ID might be wrong or API is busy.</p>`;
        }
    }

    function renderPitch(squad) {
        const pitchContainer = document.getElementById('pitch-field');
        const benchContainer = document.getElementById('bench-field');
        pitchContainer.innerHTML = ''; benchContainer.innerHTML = '';

        // Split Starters (1-11) & Bench (12-15)
        const starters = squad.slice(0, 11);
        const bench = squad.slice(11, 15);

        // Group by Element Type (1=GKP, 2=DEF, 3=MID, 4=FWD)
        const rows = [
            starters.filter(p => p.element_type === 1),
            starters.filter(p => p.element_type === 2),
            starters.filter(p => p.element_type === 3),
            starters.filter(p => p.element_type === 4)
        ];

        // Modern Card Template: Badge on Kit + Name Pill
        const createCard = (p) => `
            <div class="pitch-player">
                <div class="kit-wrapper">
                    <i class="fa-solid fa-shirt kit-icon" style="color: ${p.element_type === 1 ? '#eab308' : '#fff'}"></i>
                    <div class="points-badge">${p.event_points}</div>
                </div>
                <div class="player-pill">
                    <span class="p-name-short">${p.web_name}</span>
                </div>
            </div>`;

        rows.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'pitch-row';
            rowDiv.innerHTML = row.map(createCard).join('');
            pitchContainer.appendChild(rowDiv);
        });

        benchContainer.innerHTML = bench.map(createCard).join('');
    }
    
    updateAuthUI();
});