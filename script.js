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
    const PROXY_URL = 'https://api.allorigins.win/get?url=';
    const FPL_API_URL = encodeURIComponent('https://fantasy.premierleague.com/api/bootstrap-static/');

    async function fetchFPLData() {
        try {
            const response = await fetch(PROXY_URL + FPL_API_URL);
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            // AllOrigins returns the actual data inside a 'contents' string property
            const fplData = JSON.parse(data.contents); 

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
});