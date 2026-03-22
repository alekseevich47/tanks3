let viewingPlayer = null;

function openProfile(nameToView) {
    viewingPlayer = db[nameToView] ? db[nameToView] : null;
    if (!viewingPlayer) return; // Защита

    document.getElementById("profile-overlay").style.display = "flex";
    document.getElementById('prof-name').innerText = `[${viewingPlayer.name}]`;
    switchProfileTab('stats');
}

function closeProfile() {
    document.getElementById("profile-overlay").style.display = "none";
}

function switchProfileTab(tabName) {
  // Сбрасываем все вкладки
  document.getElementById("tab-stats").classList.remove("active");
  document.getElementById("tab-rating").classList.remove("active");
  document.getElementById("tab-achievements").classList.remove("active");
  
  // Скрываем весь контент
  document.getElementById("profile-stats-content").style.display = "none";
  document.getElementById("profile-rating-content").style.display = "none";
  document.getElementById("profile-achievements-content").style.display = "none";
  
  // Показываем нужное
  if (tabName === 'stats') {
    document.getElementById("tab-stats").classList.add("active");
    document.getElementById("profile-stats-content").style.display = "flex";
    updateProfileStats();
  } else if (tabName === 'rating') {
    document.getElementById("tab-rating").classList.add("active");
    document.getElementById("profile-rating-content").style.display = "block";
    renderLeaderboard();
  } else if (tabName === 'achievements') {
    document.getElementById("tab-achievements").classList.add("active");
    document.getElementById("profile-achievements-content").style.display = "block";
  }
}

function updateProfileStats() {
    const s = viewingPlayer.globalStats;
    document.getElementById("st-battles").innerText = s.battlesPlayed;
    document.getElementById("st-wins").innerText = s.battlesWon;
    document.getElementById("st-rating").innerText = viewingPlayer.exp;
    document.getElementById("st-bots").innerText = s.botsKilled;
    document.getElementById("st-env").innerText = s.envDestroyed;
    document.getElementById("st-deaths").innerText = s.deaths;
    document.getElementById("st-dmg").innerText = s.damageDealt;
    document.getElementById("st-heal").innerText = s.damageRepaired;
    document.getElementById("st-coins").innerText = s.coinsEarned;
    document.getElementById("st-shells").innerText = s.shellsUsed;
    document.getElementById("profile-rank").innerText = viewingPlayer.rank;
}

function renderLeaderboard() {
    const tbody = document.getElementById("rating-tbody");
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