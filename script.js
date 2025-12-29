import { renderMarketHot } from './components/marketHot.js';
import { renderMarketCold } from './components/marketCold.js';

document.addEventListener('DOMContentLoaded', () => {
    
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
    const PROXY_URL = 'https://api.allorigins.win/raw?url=';
    const FPL_API_URL = encodeURIComponent('https://fantasy.premierleague.com/api/bootstrap-static/');

    async function fetchFPLData() {
        try {
            const response = await fetch(PROXY_URL + FPL_API_URL);
            if (!response.ok) throw new Error('Network response was not ok');
            const fplData = await response.json();

            // A. Basic Stats
            const currentEvent = fplData.events.find(event => event.is_current) || fplData.events.find(event => event.is_next);
            document.getElementById('gw-display').textContent = currentEvent ? currentEvent.name : "Pre-Season";

            const topPlayer = fplData.elements.sort((a, b) => b.total_points - a.total_points)[0];
            document.getElementById('top-player-display').textContent = `${topPlayer.web_name} (${topPlayer.total_points})`;

            document.getElementById('managers-display').textContent = fplData.total_players.toLocaleString();

            // B. Render Dashboard Modules
            renderMarketHot(fplData);
            renderMarketCold(fplData);

        } catch (error) {
            console.error('Error:', error);
            document.getElementById('gw-display').textContent = "Error";
        }
    }

    fetchFPLData();

    // --- 3. TAB SWITCHING LOGIC ---
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
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
        }
    });

    closeModal.addEventListener('click', () => modal.classList.add('hidden'));
    updateAuthUI();
});