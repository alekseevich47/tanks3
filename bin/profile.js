let viewingPlayer = null;

function openProfile(nameToView) {
    viewingPlayer = db[nameToView] ? db[nameToView] : null;
    if (!viewingPlayer) return;
    document.getElementById("profile-overlay").style.display = "flex";
    document.getElementById('prof-name').innerText = `[${viewingPlayer.name}]`;
    switchProfileTab('stats');
}

function closeProfile() {
    document.getElementById("profile-overlay").style.display = "none";
}

function switchProfileTab(tabName) {
    // Убраны ВСЕ пробелы и добавлены проверки
    const tabStats = document.getElementById("tab-stats");
    const tabRating = document.getElementById("tab-rating");
    const tabAchievements = document.getElementById("tab-achievements");
    const contentStats = document.getElementById("profile-stats-content");
    const contentRating = document.getElementById("profile-rating-content");
    const contentAchievements = document.getElementById("profile-achievements-content");
    
    if (tabStats) tabStats.classList.remove("active");
    if (tabRating) tabRating.classList.remove("active");
    if (tabAchievements) tabAchievements.classList.remove("active");
    
    if (contentStats) contentStats.style.display = "none";
    if (contentRating) contentRating.style.display = "none";
    if (contentAchievements) contentAchievements.style.display = "none";
    
    if (tabName === 'stats') {
        if (tabStats) tabStats.classList.add("active");
        if (contentStats) contentStats.style.display = "flex";
        updateProfileStats();
    } else if (tabName === 'rating') {
        if (tabRating) tabRating.classList.add("active");
        if (contentRating) contentRating.style.display = "block";
        renderLeaderboard();
    } else if (tabName === 'achievements') {
        if (tabAchievements) tabAchievements.classList.add("active");
        if (contentAchievements) contentAchievements.style.display = "block";
    }
}

function updateProfileStats() {
    if (!viewingPlayer) return;
    const s = viewingPlayer.globalStats;
    
    const elBattles = document.getElementById("st-battles");
    const elWins = document.getElementById("st-wins");
    const elRating = document.getElementById("st-rating");
    const elBots = document.getElementById("st-bots");
    const elEnv = document.getElementById("st-env");
    const elDeaths = document.getElementById("st-deaths");
    const elDmg = document.getElementById("st-dmg");
    const elHeal = document.getElementById("st-heal");
    const elCoins = document.getElementById("st-coins");
    const elShields = document.getElementById("st-shields");
    const elRank = document.getElementById("st-rank");
    
    if (elBattles) elBattles.innerText = s.battlesPlayed;
    if (elWins) elWins.innerText = s.battlesWon;
    if (elRating) elRating.innerText = viewingPlayer.exp;
    if (elBots) elBots.innerText = s.botsKilled;
    if (elEnv) elEnv.innerText = s.envDestroyed;
    if (elDeaths) elDeaths.innerText = s.deaths;
    if (elDmg) elDmg.innerText = s.damageDealt;
    if (elHeal) elHeal.innerText = s.damageRepaired;
    if (elCoins) elCoins.innerText = viewingPlayer.coins;
    if (elShields) elShields.innerText = viewingPlayer.shields;
    if (elRank) elRank.innerText = viewingPlayer.rank;
}

function renderLeaderboard() {
    const tbody = document.getElementById("rating-tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    let allPlayers = Object.values(db).sort((a, b) => b.exp - a.exp);

    allPlayers.forEach((p, i) => {
        let tr = document.createElement("tr");
        tr.className = i % 2 === 0 ? "row-light" : "row-dark";
        let nameStyle = p.name === currentUser ? 'color: red; font-weight: bold;' : 'color: #004400;';

        tr.innerHTML = `
            <td style="text-align:center;">${i + 1}</td>
            <td style="text-align:center;">${p.rank}</td>
            <td style="${nameStyle}">${p.name}</td>
            <td style="text-align:center; font-weight:bold;">${p.exp}</td>
            <td style="text-align:center;">
                <div class="action-green" onclick="openProfile('${p.name}')">⇒</div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}