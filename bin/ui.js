function showGameAlert(text) {
    document.getElementById("custom-alert-text").innerText = text;
    document.getElementById("custom-alert-overlay").style.display = "flex";
}

function closeGameAlert() {
    document.getElementById("custom-alert-overlay").style.display = "none";
}

const modal = document.getElementById("modal-overlay");
const resultModal = document.getElementById("result-modal");
const canvasElem = document.getElementById("canvas");

document.getElementById("btn-choose-battle").onclick = () => {
    modal.style.display = "flex";
};

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

document.getElementById("btn-start-battle").onclick = () => {
    // Определяем выбранный режим
    let selectedMode = "ZACHISTKA";
    const zachistkaRadio = document.getElementById("mode-zachistka");
    const proRadio = document.getElementById("mode-zachistka-pro");
    
    if (proRadio && proRadio.checked) {
        selectedMode = "ZACHISTKA_PRO";
    }
    
    if (player.fuel < 100) {
        showGameAlert("Недостаточно топлива для выхода в бой!");
        return;
    }
    
    player.fuel -= 100;
    saveDB();
    closeModal('modal-overlay');
    
    // Скрываем ангар
    document.getElementById("hangar-ui").style.display = "none";
    document.getElementById("battle-bottom-panel").style.display = "flex";
    
    // Запускаем бой с выбранным режимом
    startBattleEngine(selectedMode);
};

setInterval(() => {
    if (player) {
        calculateOfflineFuel();
    }
}, 60000);

function updateSmoothUI() {
    requestAnimationFrame(updateSmoothUI);
    if (!player) return;
    const now = Date.now();
    let sLeft = Math.max(0, skills.shield.readyAt - now);
    let sPerc = (sLeft / skills.shield.currentMax) * 100;
    document.getElementById("cd-shield").style.background = sLeft > 0 
        ? `conic-gradient(rgba(0,0,0,0.8) ${sPerc}%, transparent 0)` 
        : 'none';
    let rLeft = Math.max(0, skills.rapid.readyAt - now);
    let rPerc = (rLeft / skills.rapid.currentMax) * 100;
    document.getElementById("cd-fire").style.background = rLeft > 0 
        ? `conic-gradient(rgba(0,0,0,0.8) ${rPerc}%, transparent 0)` 
        : 'none';

    let canShoot = false;
    if (game.state === "battle") {
        if (skills.rapid.active) {
            canShoot = (now - window.lastShotTime >= 100) && skills.rapid.shotsLeft > 0;
        } else {
            canShoot = (now - window.lastShotTime >= 1000);
        }
    } else {
        canShoot = true;
    }

    const ind = document.getElementById("shoot-indicator");
    if (ind) {
        ind.className = canShoot ? "indicator-green" : "indicator-red";
    }
}

requestAnimationFrame(updateSmoothUI);

function updateUI() {
    if (!player) return;
    document.getElementById("rp-rank-text").innerText = player.rank;
    document.getElementById("rp-name-text").innerText = player.name;
    document.getElementById("ui-hp-text").innerText = `${player.hp}/${player.maxHp}`;
    document.getElementById("ui-hp-bar").style.width = `${(player.hp / player.maxHp) * 100}%`;
    document.getElementById("ui-fuel-text").innerText = `${player.fuel}/${player.maxFuel}`;
    document.getElementById("ui-fuel-bar").style.width = `${(player.fuel / player.maxFuel) * 100}%`;
    
    for (let i = 1; i <= 5; i++) {
        let el = document.getElementById(`sh-c-${i}`);
        if (el) el.innerText = player.shells[i];
    }
    for (let i = 0; i <= 5; i++) {
        let box = document.getElementById(`ui-shell-${i}`);
        if (box) {
            box.className = (player.activeShell === i) ? "shell-box active-shell" : "shell-box disabled-shell";
        }
    }

    const sd = SHELL_DATA[player.activeShell];
    document.getElementById("active-shell-info").innerText = `${sd.name} (${sd.dmg} ед.)`;

    for (let i = 0; i < 4; i++) {
        let el = document.getElementById(`ui-rep-${i}`);
        if (el) el.innerText = player.repairs[i];
    }

    document.getElementById("ui-coins").innerText = player.coins;
    document.getElementById("ui-shields").innerText = player.shields;
    document.getElementById("ui-exp").innerText = player.exp;
    document.getElementById("ui-max-exp").innerText = player.nextRankExp;
    document.getElementById("ui-rank").innerText = player.rank;
    document.getElementById("exp-bar").style.width = `${(player.exp / player.nextRankExp) * 100}%`;

    const livesDisplay = document.getElementById("ui-lives").children;
    for (let i = 0; i < 4; i++) {
        livesDisplay[i].style.opacity = (i < player.lives) ? "1" : "0.3";
    }

    if (game.state === "battle") {
        document.getElementById("bb-rank-name").innerText = player.rank;
        document.getElementById("bb-exp-num").innerText = `${player.exp}/${player.nextRankExp}`;
        document.getElementById("bb-exp-fill").style.width = `${(player.exp / player.nextRankExp) * 100}%`;
        
        let bbHtml = `
            <div class="avatar-slot">
                <div class="av-name">${player.name}</div>
                <div class="av-hp-bg"><div class="av-hp-fill" style="width:${(player.hp/player.maxHp)*100}%"></div></div>
                <div class="av-img">👤</div>
                <div class="av-lives">
                    <div class="av-life-box ${player.lives >= 1 ? 'av-life-green':'av-life-gray'}"></div>
                    <div class="av-life-box ${player.lives >= 2 ? 'av-life-green':'av-life-gray'}"></div>
                    <div class="av-life-box ${player.lives >= 3 ? 'av-life-green':'av-life-gray'}"></div>
                    <div class="av-life-box ${player.lives >= 4 ? 'av-life-green':'av-life-gray'}"></div>
                </div>
            </div>`;
        for (let i = 0; i < 9; i++) {
            bbHtml += `<div class="avatar-slot"><div class="av-img-empty">?</div></div>`;
        }
        document.getElementById("bb-avatars-container").innerHTML = bbHtml;
    }
}

function interactRepair(type) {
    if (game.state === "hangar") {
        buyItem('repair', type);
    } else if (game.state === "battle") {
        if (player.repairs[type] > 0 && player.hp < player.maxHp) {
            player.repairs[type]--;
            let healAmount = Math.min(REPAIR_DATA[type].heal, player.maxHp - player.hp);
            player.hp += healAmount;
            player.globalStats.damageRepaired += healAmount;
            updateUI();
        } else if (player.repairs[type] <= 0) {
            showGameAlert("Нет ремкомплектов этого типа!");
        }
    }
}

function startBattleTimer() {
    game.battleTimeLeft = 600;
    battleStats.damage = 0;
    battleStats.kills = 0;
    battleStats.tempExp = 0;
    battleStats.tempCoins = 0;
    clearInterval(game.timerInterval);
    game.timerInterval = setInterval(() => {
        if (game.state !== "battle") return;
        game.battleTimeLeft--;
        let m = Math.floor(game.battleTimeLeft / 60);
        let s = game.battleTimeLeft % 60;
        document.getElementById("ui-timer").innerText = `${m < 10 ? '0':''}${m}:${s < 10 ? '0':''}${s}`;
        if (game.battleTimeLeft <= 0) showBattleResult(false);
    }, 1000);
}

function showBattleResult(isWin) {
    game.state = "result";
    applyBattleRewards(isWin);
    resultModal.style.display = "flex";
    document.getElementById("result-title-text").innerText = isWin ? "Победа!!!" : "Поражение...";
    document.getElementById("result-title-text").style.color = isWin ? "#335500" : "#aa0000";
    document.getElementById("result-emoji").innerText = isWin ? "😆" : "😢";
    document.getElementById("result-cup-icon").innerText = isWin ? "🏆" : "☠️";
    document.getElementById("res-dmg").innerText = battleStats.damage;
    document.getElementById("res-kills").innerText = battleStats.kills;
    document.getElementById("res-exp").innerText = battleStats.tempExp;
    document.getElementById("res-coins").innerText = battleStats.tempCoins;
    updateUI();
}

function requestExitBattle() {
    document.getElementById("exit-confirm-overlay").style.display = "flex";
}

function confirmExitBattle() {
    document.getElementById("exit-confirm-overlay").style.display = "none";
    showBattleResult(false);
}

function exitToHangar() {
    game.state = "hangar";
    document.getElementById("result-modal").style.display = "none";
    canvasElem.style.display = "none";
    document.getElementById("btn-exit-battle").style.display = "none";
    document.getElementById("battle-bottom-panel").style.display = "none";
    document.getElementById("hangar-ui").style.display = "flex";
    clearInterval(game.timerInterval);
    skills.shield.readyAt = 0;
    skills.shield.active = false;
    skills.rapid.readyAt = 0;
    skills.rapid.active = false;

    player.hp = player.maxHp;
    player.lives = player.maxLives;
    saveDB();
    updateUI();
}