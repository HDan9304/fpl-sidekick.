document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. THEME TOGGLE LOGIC ---
    const toggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    // Check for saved preference in local storage
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        html.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            toggle.checked = true;
        }
    }

    // Listener for switch changes
    toggle.addEventListener('change', () => {
        if (toggle.checked) {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            html.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });


    // --- 2. FPL LIVE DATA FETCHING ---
    // Note: Using a proxy to bypass CORS restrictions for development
    const PROXY_URL = 'https://corsproxy.io/?';
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