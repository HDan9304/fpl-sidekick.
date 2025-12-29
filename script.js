document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. THEME TOGGLE LOGIC ---
    const toggleBtn = document.getElementById('theme-toggle');
    const html = document.documentElement;
    
    // Icons
    const moonIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    const sunIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';

    function setTheme(theme) {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        toggleBtn.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
    }

    // Init
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    toggleBtn.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });


    // --- 2. FPL LIVE DATA FETCHING ---
    // Note: Using a proxy to bypass CORS restrictions for development
    const PROXY_URL = 'https://api.allorigins.win/raw?url=';
    const FPL_API_URL = encodeURIComponent('https://fantasy.premierleague.com/api/bootstrap-static/');

    async function fetchFPLData() {
        try {
            const response = await fetch(PROXY_URL + FPL_API_URL);
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const fplData = await response.json();
            // corsproxy returns raw JSON, no JSON.parse needed on contents

            // A. Get Current Gameweek
            const currentEvent = fplData.events.find(event => event.is_current) || fplData.events.find(event => event.is_next);
            const gwName = currentEvent ? currentEvent.name : "Pre-Season";

            // B. Get Top Scoring Player (Total Points)
            const topPlayer = fplData.elements.sort((a, b) => b.total_points - a.total_points)[0];
            const topPlayerName = `${topPlayer.web_name} (${topPlayer.total_points})`;

            // C. Total Players (Managers)
            const totalPlayers = fplData.total_players.toLocaleString();

            // Update DOM Elements
            document.getElementById('gw-display').textContent = gwName;
            document.getElementById('top-player-display').textContent = topPlayerName;
            document.getElementById('managers-display').textContent = totalPlayers;

        } catch (error) {
            console.error('Error fetching FPL data:', error);
            document.getElementById('gw-display').textContent = "Error";
            document.getElementById('top-player-display').textContent = "Unavailable";
            document.getElementById('managers-display').textContent = "Unavailable";
        }
    }

    // Trigger the fetch
    fetchFPLData();

    // --- 3. ACCOUNT / MODAL LOGIC ---
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
            // Sign Out action
            if(confirm('Are you sure you want to sign out?')) {
                localStorage.removeItem('fpl_id');
                updateAuthUI();
                alert('Signed out successfully.');
            }
        } else {
            // Sign In action (Open Modal)
            modal.classList.remove('hidden');
        }
    });

    saveBtn.addEventListener('click', () => {
        const id = idInput.value;
        if (id) {
            localStorage.setItem('fpl_id', id);
            modal.classList.add('hidden');
            updateAuthUI();
            alert('Team ID saved!');
        }
    });

    closeModal.addEventListener('click', () => modal.classList.add('hidden'));
    
    // Check status on load
    updateAuthUI();
});