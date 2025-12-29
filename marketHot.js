export function renderMarketHot(fplData) {
    const hotPlayers = [...fplData.elements]
        .sort((a, b) => b.transfers_in_event - a.transfers_in_event)
        .slice(0, 5);

    const html = hotPlayers.map(p => `
        <div class="player-row">
            <div class="p-info">
                <span class="p-name">${p.web_name}</span>
                <span class="p-meta">£${(p.now_cost / 10).toFixed(1)}m | ${p.selected_by_percent}% Owned</span>
            </div>
            <div class="p-stat" style="color: var(--fpl-cyan)">
                +${p.transfers_in_event.toLocaleString()}
            </div>
        </div>
    `).join('');

    document.getElementById('market-hot-list').innerHTML = html;
}