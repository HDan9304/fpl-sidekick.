export function renderMarketCold(fplData) {
    const coldPlayers = [...fplData.elements]
        .sort((a, b) => b.transfers_out_event - a.transfers_out_event)
        .slice(0, 5);

    const html = coldPlayers.map(p => `
        <div class="player-row">
            <div class="p-info">
                <span class="p-name">${p.web_name}</span>
                <span class="p-meta">£${(p.now_cost / 10).toFixed(1)}m | ${p.selected_by_percent}% Owned</span>
            </div>
            <div class="p-stat text-trend-down">
                -${p.transfers_out_event.toLocaleString()}
            </div>
        </div>
    `).join('');

    document.getElementById('market-cold-list').innerHTML = html;
}