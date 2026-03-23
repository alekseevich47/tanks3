let db = JSON.parse(localStorage.getItem('tanks_db')) || {};
let currentUser = null;
let player = null;

const RANKS = [
    { name: "Рядовой", exp: 3000 },
    { name: "Ефрейтор", exp: 5000 },
    { name: "Мл. сержант", exp: 7000 },
    { name: "Сержант", exp: 10000 },
    { name: "Ст. сержант", exp: 15000 },
    { name: "Старшина", exp: 20000 },
    { name: "Прапорщик", exp: 30000 },
    { name: "Ст. прапорщик", exp: 50000 },
    { name: "Мл. лейтенант", exp: 60000 },
    { name: "Лейтенант", exp: 70000 },
    { name: "Ст. лейтенант", exp: 100000 },
    { name: "Капитан", exp: 120000 },
    { name: "Майор", exp: 150000 },
    { name: "Подполковник", exp: 200000 },
    { name: "Полковник", exp: 300000 },
    { name: "Генерал-майор", exp: 450000 },
    { name: "Генерал-лейтенант", exp: 650000 },
    { name: "Генерал-полковник", exp: 1000000 },
    { name: "Маршал", exp: 2000000 }
];

const SHELL_DATA = [
    { name: "Базовый", dmg: 50, costCoins: 0, costShields: 0 },
    { name: "Осколочный", dmg: 100, costCoins: 50, costShields: 0 },
    { name: "Бронебойный", dmg: 150, costCoins: 70, costShields: 0 },
    { name: "Подкалиберный", dmg: 200, costCoins: 100, costShields: 0 },
    { name: "Кумулятивный", dmg: 300, costCoins: 250, costShields: 2 },
    { name: "Управляемый", dmg: 500, costCoins: 500, costShields: 10 }
];

const REPAIR_DATA = [
    { heal: 100, costCoins: 100 },
    { heal: 200, costCoins: 200 },
    { heal: 300, costCoins: 300 },
    { heal: 500, costCoins: 500 }
];

function createDefaultPlayer(name) {
    return {
        name: name,
        hp: 1650,
        maxHp: 1650,
        lives: 4,
        maxLives: 4,
        speed: 0.8,
        shells: [Infinity, 0, 0, 0, 0, 0],
        repairs: [0, 0, 0, 0],
        activeShell: 0,
        shellDamage: [50, 100, 150, 200, 250, 300],
        coins: 1000,
        shields: 0,
        exp: 0,
        rank: "Рядовой",
        nextRankExp: 3000,
        fuel: 1200,
        maxFuel: 1200,
        lastFuelUpdate: Date.now(),
        globalStats: {
            battlesPlayed: 0,
            battlesWon: 0,
            battlesLost: 0,
            ratingPoints: 0,
            enemyTanksKilled: 0,
            botsKilled: 0,
            turretsKilled: 0,
            envDestroyed: 0,
            deaths: 0,
            damageDealt: 0,
            damageRepaired: 0,
            coinsEarned: 0,
            courageEarned: 0,
            shellsUsed: 0
        }
    };
}

function saveDB() {
    if (currentUser && player) {
        db[currentUser] = player;
        localStorage.setItem('tanks_db', JSON.stringify(db));
    }
}

function initiateLogin() {
    const name = document.getElementById("login-username").value.trim();
    if (name.length < 3) {
        showGameAlert("Позывной должен быть не менее 3 символов!");
        return;
    }
    if (name === "adm") {
        document.getElementById('password-overlay').style.display = 'flex';
    } else {
        performLogin(name);
    }
}

function verifyAdminPassword() {
    const pass = document.getElementById("admin-password").value;
    if (pass === "4757") {
        document.getElementById('password-overlay').style.display = 'none';
        performLogin("adm");
    } else {
        showGameAlert("Неверный пароль доступа!");
    }
}

function cancelAdminLogin() {
    document.getElementById('password-overlay').style.display = 'none';
}

function performLogin(name) {
    if (!db[name]) {
        db[name] = createDefaultPlayer(name);
    }
    currentUser = name;
    player = db[name];
    
    if (!player.fuel) {
        player.fuel = 1200;
        player.maxFuel = 1200;
        player.lastFuelUpdate = Date.now();
    }
    if (!player.shellDamage) {
        player.shellDamage = [50, 100, 150, 200, 250, 300];
    }
    if (!player.repairs) {
        player.repairs = [0, 0, 0, 0];
    }
    if (!player.speed) {
        player.speed = 0.8;
    }
    if (player.shells[0] === null || player.shells[0] === 0) {
        player.shells[0] = Infinity;
    }

    calculateOfflineFuel();
    document.getElementById('login-overlay').style.display = 'none';

    const pName = document.getElementById('prof-name');
    if (pName) {
        pName.innerText = `[${name}]`;
    }

    saveDB();
    autoSwitchShell();
    updateUI();
    Logger.log(`Авторизация успешна. Игрок: ${name}`);
}

function calculateOfflineFuel() {
    const now = Date.now();
    const minutesPassed = Math.floor((now - player.lastFuelUpdate) / 60000);
    if (minutesPassed > 0) {
        player.fuel = Math.min(player.maxFuel, player.fuel + minutesPassed * 1);
        player.lastFuelUpdate += minutesPassed * 60000;
    }
}

function logout() {
    saveDB();
    currentUser = null;
    player = null;
    document.getElementById('profile-overlay').style.display = 'none';
    document.getElementById('login-overlay').style.display = 'flex';
}

const game = {
    state: "hangar",
    battleTimeLeft: 600,
    timerInterval: null
};

const battleStats = {
    damage: 0,
    kills: 0,
    tempExp: 0,
    tempCoins: 0
};

const skills = {
    shield: {
        active: false,
        readyAt: 0,
        timerEnd: 0,
        currentMax: 30000
    },
    rapid: {
        active: false,
        shotsLeft: 0,
        readyAt: 0,
        currentMax: 30000
    }
};

function addBattleProgress(expObj, coinsObj, dmgObj = 0) {
    battleStats.tempExp += expObj;
    battleStats.tempCoins += coinsObj;
    battleStats.damage += dmgObj;
}

function applyBattleRewards(isWin) {
    player.exp += battleStats.tempExp;
    player.coins += battleStats.tempCoins;
    player.globalStats.coinsEarned += battleStats.tempCoins;
    player.globalStats.battlesPlayed++;
    if (isWin) {
        player.globalStats.battlesWon++;
    } else {
        player.globalStats.battlesLost++;
    }
    checkRankUp();
    saveDB();
}

function checkRankUp() {
    let rankIndex = RANKS.findIndex(r => r.name === player.rank);
    if (rankIndex === -1) rankIndex = 0;
    let promoted = false;
    while (rankIndex < RANKS.length - 1 && player.exp >= RANKS[rankIndex].exp) {
        rankIndex++;
        player.rank = RANKS[rankIndex].name;
        player.nextRankExp = RANKS[rankIndex].exp;
        promoted = true;
    }
    if (promoted) {
        showGameAlert(`Поздравляем! Присвоено новое звание: ${player.rank}`);
    }
}

function buyItem(type, index) {
    if (game.state === "battle") return;
    if (type === 'shell' && index > 0) {
        const costC = SHELL_DATA[index].costCoins;
        const costS = SHELL_DATA[index].costShields;
        if (player.coins >= costC && player.shields >= costS) {
            player.coins -= costC;
            player.shields -= costS;
            player.shells[index] += 10;
            saveDB();
            autoSwitchShell();
            updateUI();
        } else {
            showGameAlert("Недостаточно валюты для покупки!");
        }
    } else if (type === 'repair') {
        const costC = REPAIR_DATA[index].costCoins;
        if (player.coins >= costC) {
            player.coins -= costC;
            player.repairs[index]++;
            saveDB();
            updateUI();
        } else {
            showGameAlert("Недостаточно монет для покупки!");
        }
    }
}

function autoSwitchShell() {
    let specialAmmoCount = player.shells.slice(1).reduce((a, b) => a + b, 0);
    if (specialAmmoCount > 0) {
        if (player.activeShell === 0 || player.shells[player.activeShell] <= 0) {
            for (let i = 1; i <= 5; i++) {
                if (player.shells[i] > 0) {
                    player.activeShell = i;
                    break;
                }
            }
        }
    } else {
        player.activeShell = 0;
    }
}