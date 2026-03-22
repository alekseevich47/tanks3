const MAPS = {
    zachistka:[["~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~","~....................................~","~..##..##..##..====..##..##..##..##..~","~..##..##..##..====..##..##..##..##..~","~..##..##..##..====..##..##..##..##..~","~..............====..................~","~..''''........====........''''......~","~..''''..@@@@..====..@@@@..''''......~","~..''''..@@@@..====..@@@@..''''......~","~........@@@@..====..@@@@............~","~..............====..................~","~..##..##..##..====..##..##..##..##..~","~..##..##..##..====..##..##..##..##..~","~..##..##..##..====..##..##..##..##..~","~..............====..................~","~..**..**..**..====..**..**..**..**..~","~..............====..................~","~..##..##..##..====..##..##..##..##..~","~..##..##..##..====..##..##..##..##..~","~..##..##..##..====..##..##..##..##..~","~..............====..................~","~..''''..@@@@..====..@@@@..''''......~","~..''''..@@@@..====..@@@@..''''......~","~........@@@@..====..@@@@............~","~..............====..................~","~..##..##..##..====..##..##..##..##..~","~....................................~","~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"],["~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~","~..............@@@@..................~","~..@@@@..##....@@@@....##....@@@@....~","~..@@@@..##....@@@@....##....@@@@....~","~........##............##............~","~..''''........****........''''......~","~..''''..##............##..''''......~","~........##....@@@@....##............~","~..@@@@..##....@@@@....##....@@@@....~","~..@@@@..##....@@@@....##....@@@@....~","~....................................~","~..====..**..==....==..**..====......~","~..====......==....==......====......~","~..====......==....==......====......~","~....................................~","~..@@@@..##....@@@@....##....@@@@....~","~..@@@@..##....@@@@....##....@@@@....~","~........##............##............~","~..''''........****........''''......~","~..''''..##............##..''''......~","~........##....@@@@....##............~","~..@@@@..##....@@@@....##....@@@@....~","~..@@@@..##....@@@@....##....@@@@....~","~....................................~","~..##..##..##........##..##..##..##..~","~..##..##..##........##..##..##..##..~","~....................................~","~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"],["~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~","~....................................~","~..''''''''''........''''''''''''....~","~..''''''''''........''''''''''''....~","~..''''''''''........''''''''''''....~","~....................................~","~........##............##............~","~........##............##............~","~..@@@@..##..''''''''..##....@@@@....~","~..@@@@..##..''''''''..##....@@@@....~","~............''''''''................~","~............''''''''................~","~..====..**............**..====......~","~..====..**............**..====......~","~............''''''''................~","~............''''''''................~","~..@@@@..##..''''''''..##....@@@@....~","~..@@@@..##..''''''''..##....@@@@....~","~........##............##............~","~........##............##............~","~....................................~","~..''''''''''........''''''''''''....~","~..''''''''''........''''''''''''....~","~..''''''''''........''''''''''''....~","~....................................~","~..##..##..##........##..##..##..##..~","~....................................~","~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"],["~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~","~....................................~","~..**..**..**..**..**..**..**..**....~","~..**..**..**..**..**..**..**..**....~","~....................................~","~....##..##..##..##..##..##..##..##..~","~....##..##..##..##..##..##..##..##..~","~....................................~","~..@@@@......@@@@......@@@@......@@@@~","~..@@@@......@@@@......@@@@......@@@@~","~........''''......''''......''''....~","~........''''......''''......''''....~","~..====..**..====..**..====..**..====~","~..====..**..====..**..====..**..====~","~........''''......''''......''''....~","~........''''......''''......''''....~","~..@@@@......@@@@......@@@@......@@@@~","~..@@@@......@@@@......@@@@......@@@@~","~....................................~","~....##..##..##..##..##..##..##..##..~","~....##..##..##..##..##..##..##..##..~","~....................................~","~..**..**..**..**..**..**..**..**....~","~..**..**..**..**..**..**..**..**....~","~....................................~","~..##..##..##........##..##..##..##..~","~....................................~","~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"]
    ]
};

const ctx = canvasElem.getContext("2d");
let keys = {}; let bullets = []; let bots = []; let tracks = []; let explosions =[]; let craters =[]; 
window.lastShotTime = 0; let animationFrameId;

window.addEventListener("keydown", (e) => { 
    keys[e.code] = true; 
    if (game.state === "battle" && e.code.startsWith("Digit")) {
        let idx = parseInt(e.code.replace("Digit", "")) - 1;
        if (idx >= 0 && idx <= 5) {
            let specialAmmoCount = player.shells.slice(1).reduce((a, b) => a + b, 0);
            if (idx === 0 && specialAmmoCount > 0) return; 
            if (idx !== 0 && player.shells[idx] <= 0) return; 
            player.activeShell = idx; updateUI();
        }
    }
});
window.addEventListener("keyup", (e) => { keys[e.code] = false; });

const TILE = 24; 
let mapData =[]; let totalBotsToKill = 9; let botsKilled = 0;

function initMap() {
    mapData =[];
    const layout = MAPS.zachistka[Math.floor(Math.random() * MAPS.zachistka.length)];
    for (let r = 0; r < layout.length; r++) {
        let row =[];
        for (let c = 0; c < layout[r].length; c++) {
            let ch = layout[r][c];
            if (ch === '#') row.push({ type: 1, hp: 250 });
            else if (ch === '@') row.push({ type: 2 });
            else if (ch === '*') row.push({ type: 3 }); 
            else if (ch === '~') row.push({ type: 4 }); 
            else if (ch === '=') row.push({ type: 5 }); 
            else if (ch === "'") row.push({ type: 6 }); 
            else row.push({ type: 0 }); 
        }
        mapData.push(row);
    }
}

const tank = { x: 18 * TILE, y: 26 * TILE, targetX: 18 * TILE, targetY: 26 * TILE, w: TILE, h: TILE, speed: 0.8, dir: "up", state: "idle", turnDelay: 0, color: "#2E8B57", lastTrack: 0, isDead: false, respawnTime: 0, invulnTime: 0 };

function startBattleEngine() {
    canvasElem.style.display = "block";
    document.getElementById("btn-exit-battle").style.display = "block";
    game.state = "battle";
    
    initMap();
    tank.speed = player.speed || 0.8; // ВАЖНО ДЛЯ АДМИНА
    tank.x = 18 * TILE; tank.y = 26 * TILE; tank.targetX = tank.x; tank.targetY = tank.y;
    tank.dir = "up"; tank.state = "idle"; tank.turnDelay = 0; tank.isDead = false; tank.invulnTime = Date.now() + 2000;
    
    bullets = []; bots = []; tracks =[]; explosions = []; craters =[];
    botsKilled = 0; totalBotsToKill = 9; window.lastShotTime = 0;

    skills.shield.currentMax = 10000; skills.shield.readyAt = Date.now() + 10000; skills.shield.active = false;
    skills.rapid.currentMax = 10000; skills.rapid.readyAt = Date.now() + 10000; skills.rapid.active = false;
    
    spawnBot(4 * TILE, 1 * TILE); spawnBot(18 * TILE, 1 * TILE); spawnBot(32 * TILE, 1 * TILE);
    startBattleTimer(); updateUI(); cancelAnimationFrame(animationFrameId); gameLoop();
}

function spawnBot(x, y) {
    bots.push({ x: x, y: y, targetX: x, targetY: y, w: TILE, h: TILE, speed: 0.6, dir: "down", state: "idle", turnDelay: 0, hp: 150, maxHp: 150, color: "#8B0000", lastShot: 0, lastTrack: 0, isDead: false, respawnTime: 0, invulnTime: Date.now() + 2000, lives: 3, toBeRemoved: false, wantToShoot: false });
}

function checkTankCollisions(nextX, nextY, currentTank, isPlayer) {
    if (!isPlayer && !tank.isDead && nextX === tank.targetX && nextY === tank.targetY) return true;
    for (let i = 0; i < bots.length; i++) {
        let b = bots[i];
        if (b === currentTank || b.isDead) continue;
        if (nextX === b.targetX && nextY === b.targetY) return true;
    }
    return false;
}

function isCollidingMap(x, y, w, h) {
    if (x < 0 || y < 0 || x + w > canvasElem.width || y + h > canvasElem.height) return true;
    let corners =[{ cx: x+1, cy: y+1 }, { cx: x+w-1, cy: y+1 }, { cx: x+1, cy: y+h-1 }, { cx: x+w-1, cy: y+h-1 }];
    for (let c of corners) {
        let col = Math.floor(c.cx / TILE); let row = Math.floor(c.cy / TILE);
        if (mapData[row] && mapData[row][col] && (mapData[row][col].type === 1 || mapData[row][col].type === 2 || mapData[row][col].type === 3)) return true;
    }
    return false;
}

function fireBullet(isPlayer, sx, sy, sdir) { bullets.push({ x: sx, y: sy, w: 4, h: 4, speed: 5, dir: sdir, isPlayer: isPlayer }); }
function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) { return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1; }
function addTrack(t) { const now = Date.now(); if (now - t.lastTrack > 200) { tracks.push({ x: t.x, y: t.y, dir: t.dir, time: now }); t.lastTrack = now; } }
function createBigExplosion(x, y) { explosions.push({ x: x, y: y, timer: 30, big: true }); }

function canSeePlayer(bot) {
    if (tank.isDead) return null;
    let dx = Math.abs(bot.x - tank.x); let dy = Math.abs(bot.y - tank.y);
    let alignX = dx < TILE - 4; let alignY = dy < TILE - 4;
    if (alignX) {
        let dir = tank.y < bot.y ? "up" : "down"; let step = dir === "up" ? -TILE : TILE; let blocked = false;
        for (let y = bot.y; dir === "up" ? y > tank.y : y < tank.y; y += step) {
            let col = Math.floor((bot.x + bot.w/2) / TILE); let row = Math.floor((y + bot.h/2) / TILE);
            if (row < 0 || row >= mapData.length) break;
            if (mapData[row] && mapData[row][col] && mapData[row][col].type === 2) blocked = true; 
        }
        if (!blocked) return dir;
    }
    if (alignY) {
        let dir = tank.x < bot.x ? "left" : "right"; let step = dir === "left" ? -TILE : TILE; let blocked = false;
        for (let x = bot.x; dir === "left" ? x > tank.x : x < tank.x; x += step) {
            let col = Math.floor((x + bot.w/2) / TILE); let row = Math.floor((bot.y + bot.h/2) / TILE);
            if (col < 0 || col >= mapData[0].length) break;
            if (mapData[row] && mapData[row][col] && mapData[row][col].type === 2) blocked = true;
        }
        if (!blocked) return dir;
    }
    return null;
}

function getSmartBotDirection(bot) {
    let seeDir = canSeePlayer(bot);
    if (seeDir) { bot.wantToShoot = true; return seeDir; }
    bot.wantToShoot = false;
    let possibleDirs =["up", "down", "left", "right"];
    let safeDirs =[]; let brickDirs =[];
    possibleDirs.forEach(d => {
        let nextX = bot.x; let nextY = bot.y;
        if (d === "up") nextY -= TILE; if (d === "down") nextY += TILE;
        if (d === "left") nextX -= TILE; if (d === "right") nextX += TILE;
        if (!checkTankCollisions(nextX, nextY, bot, false)) {
            let blockedByConcrete = false; let blockedByBrick = false;
            let outOfBounds = nextX < 0 || nextY < 0 || nextX + bot.w > canvasElem.width || nextY + bot.h > canvasElem.height;
            if (!outOfBounds) {
                let corners =[{ cx: nextX+1, cy: nextY+1 }, { cx: nextX+bot.w-1, cy: nextY+1 }, { cx: nextX+1, cy: nextY+bot.h-1 }, { cx: nextX+bot.w-1, cy: nextY+bot.h-1 }];
                for (let c of corners) {
                    let col = Math.floor(c.cx / TILE); let row = Math.floor(c.cy / TILE);
                    if (mapData[row] && mapData[row][col]) {
                        if (mapData[row][col].type === 2 || mapData[row][col].type === 3) blockedByConcrete = true; 
                        if (mapData[row][col].type === 1) blockedByBrick = true; 
                    }
                }
            } else blockedByConcrete = true;
            if (!blockedByConcrete && !blockedByBrick) safeDirs.push(d); 
            if (!blockedByConcrete && blockedByBrick) brickDirs.push(d); 
        }
    });
    let bestDir = bot.dir; let minDist = Infinity; let dirsToEval = safeDirs.length > 0 ? safeDirs : brickDirs;
    if (dirsToEval.length === 0) return bot.dir; 
    if (Math.random() < 0.15 && safeDirs.length > 0) return safeDirs[Math.floor(Math.random() * safeDirs.length)];
    dirsToEval.forEach(d => {
        let nextX = bot.x; let nextY = bot.y;
        if (d === "up") nextY -= TILE; if (d === "down") nextY += TILE;
        if (d === "left") nextX -= TILE; if (d === "right") nextX += TILE;
        let dist = Math.abs(nextX - tank.x) + Math.abs(nextY - tank.y); 
        if (d !== bot.dir) dist += TILE * 1.5; 
        if (dist < minDist) { minDist = dist; bestDir = d; }
    });
    if (brickDirs.includes(bestDir) && !safeDirs.includes(bestDir)) bot.wantToShoot = true;
    return bestDir;
}

function moveTankGridState(t, isPlayer) {
    if (t.state === "idle") {
        let reqDir = null;
        if (isPlayer) {
            if (keys["ArrowUp"]) reqDir = "up"; else if (keys["ArrowDown"]) reqDir = "down"; else if (keys["ArrowLeft"]) reqDir = "left"; else if (keys["ArrowRight"]) reqDir = "right";
        } else reqDir = getSmartBotDirection(t);
        if (reqDir) {
            if (t.dir !== reqDir) { t.dir = reqDir; t.turnDelay = 8; return; }
            if (t.turnDelay > 0) { t.turnDelay--; return; }
            let nextX = t.x; let nextY = t.y;
            if (t.dir === "up") nextY -= TILE; if (t.dir === "down") nextY += TILE;
            if (t.dir === "left") nextX -= TILE; if (t.dir === "right") nextX += TILE;
            if (!isCollidingMap(nextX, nextY, t.w, t.h) && !checkTankCollisions(nextX, nextY, t, isPlayer)) {
                t.targetX = nextX; t.targetY = nextY; t.state = "moving"; 
            } else if (!isPlayer) {
                if (!t.wantToShoot) { const dirs = ["up", "down", "left", "right"]; t.dir = dirs[Math.floor(Math.random() * dirs.length)]; t.turnDelay = 10; }
            }
        }
    }
    if (t.state === "moving") {
        addTrack(t); 
        let dx = Math.abs(t.targetX - t.x); let dy = Math.abs(t.targetY - t.y);
        if (dx <= t.speed && dy <= t.speed) { t.x = t.targetX; t.y = t.targetY; t.state = "idle"; } 
        else {
            if (t.dir === "up") t.y -= t.speed; if (t.dir === "down") t.y += t.speed;
            if (t.dir === "left") t.x -= t.speed; if (t.dir === "right") t.x += t.speed;
        }
    }
}

function updateEngine() {
    if (game.state !== "battle") return;
    const now = Date.now();

    for (let i = tracks.length - 1; i >= 0; i--) if (now - tracks[i].time > 5000) tracks.splice(i, 1);
    for (let i = explosions.length - 1; i >= 0; i--) { explosions[i].timer--; if (explosions[i].timer <= 0) explosions.splice(i, 1); }

    if (keys["KeyZ"] && now >= skills.shield.readyAt) {
        skills.shield.active = true; skills.shield.currentMax = 30000; skills.shield.readyAt = now + 30000; skills.shield.timerEnd = now + 5000; updateUI(); 
    }
    if (skills.shield.active && now > skills.shield.timerEnd) skills.shield.active = false;

    if (keys["KeyX"] && now >= skills.rapid.readyAt) {
        skills.rapid.active = true; skills.rapid.currentMax = 30000; skills.rapid.readyAt = now + 30000; skills.rapid.shotsLeft = 5; updateUI(); 
    }
    
    if (tank.isDead) {
        if (now >= tank.respawnTime) {
            tank.isDead = false; player.hp = player.maxHp;
            tank.x = 18 * TILE; tank.y = 26 * TILE; tank.targetX = tank.x; tank.targetY = tank.y;
            tank.state = "idle"; tank.invulnTime = now + 2000; updateUI(); 
        }
    } else {
        if (skills.rapid.active && now - window.lastShotTime >= 100 && skills.rapid.shotsLeft > 0) {
            if(player.shells[player.activeShell] > 0 || player.activeShell === 0) {
                fireBullet(true, tank.x + tank.w/2 - 2, tank.y + tank.h/2 - 2, tank.dir);
                if (player.activeShell !== 0) player.shells[player.activeShell]--; 
                player.globalStats.shellsUsed++; skills.rapid.shotsLeft--; window.lastShotTime = now; 
                autoSwitchShell(); updateUI();
            } else skills.rapid.active = false;
        } else if (skills.rapid.shotsLeft <= 0) skills.rapid.active = false;

        moveTankGridState(tank, true);

        if (keys["Space"] && !skills.rapid.active && now - window.lastShotTime >= 1000 && (player.activeShell === 0 || player.shells[player.activeShell] > 0)) {
            if (player.activeShell !== 0) player.shells[player.activeShell]--; 
            player.globalStats.shellsUsed++; updateUI(); window.lastShotTime = now;
            fireBullet(true, tank.x + tank.w/2 - 2, tank.y + tank.h/2 - 2, tank.dir);
            autoSwitchShell(); updateUI();
        }
    }

    bots.forEach((bot) => {
        if (bot.toBeRemoved) return;
        if (bot.isDead) {
            if (now >= bot.respawnTime) {
                bot.isDead = false; bot.hp = bot.maxHp; bot.invulnTime = now + 2000;
                const spawns =[4, 18, 32];
                bot.x = spawns[Math.floor(Math.random() * spawns.length)] * TILE; bot.y = 1 * TILE;
                bot.targetX = bot.x; bot.targetY = bot.y; bot.state = "idle";
            }
            return;
        }
        moveTankGridState(bot, false);
        if (now - bot.lastShot > 1500) {
            if (bot.wantToShoot || Math.random() < 0.05) { bot.lastShot = now; fireBullet(false, bot.x + bot.w/2 - 2, bot.y + bot.h/2 - 2, bot.dir); }
        }
    });

    bots = bots.filter(b => !b.toBeRemoved); 

    let bulletsToRemove = new Set();
    for (let i = 0; i < bullets.length; i++) {
        for (let j = i + 1; j < bullets.length; j++) {
            let b1 = bullets[i]; let b2 = bullets[j];
            if (!bulletsToRemove.has(i) && !bulletsToRemove.has(j) && b1.isPlayer !== b2.isPlayer) {
                if (rectIntersect(b1.x, b1.y, b1.w, b1.h, b2.x, b2.y, b2.w, b2.h)) {
                    bulletsToRemove.add(i); bulletsToRemove.add(j);
                    explosions.push({ x: (b1.x + b2.x)/2 + 2, y: (b1.y + b2.y)/2 + 2, timer: 15, big: false });
                }
            }
        }
    }
    bullets = bullets.filter((_, idx) => !bulletsToRemove.has(idx));

    let currentDmg = player.shellDamage[player.activeShell];
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        if (b.dir === "up") b.y -= b.speed; if (b.dir === "down") b.y += b.speed;
        if (b.dir === "left") b.x -= b.speed; if (b.dir === "right") b.x += b.speed;

        let hitObstacle = false;
        if (b.y < 0 || b.y > canvasElem.height || b.x < 0 || b.x > canvasElem.width) hitObstacle = true;

        if (!hitObstacle) {
            let col = Math.floor((b.x + b.w/2) / TILE); let row = Math.floor((b.y + b.h/2) / TILE);
            if (mapData[row] && mapData[row][col] && (mapData[row][col].type === 1 || mapData[row][col].type === 2)) {
                if (mapData[row][col].type === 1) {
                    mapData[row][col].hp -= currentDmg;
                    if (b.isPlayer) { addBattleProgress(0, Math.floor((currentDmg/100)*50), currentDmg); }
                    if (mapData[row][col].hp <= 0) { mapData[row][col].type = 0; if (b.isPlayer) player.globalStats.envDestroyed++; }
                }
                hitObstacle = true;
            }
        }

        if (!hitObstacle && b.isPlayer) {
            for (let j = bots.length - 1; j >= 0; j--) {
                let bot = bots[j];
                if (!bot.isDead && bot.invulnTime < now && b.x > bot.x && b.x < bot.x + bot.w && b.y > bot.y && b.y < bot.y + bot.h) {
                    bot.hp -= currentDmg; addBattleProgress(0, Math.floor((currentDmg/100)*50), currentDmg); hitObstacle = true;
                    if (bot.hp <= 0 && !bot.isDead) {
                        createBigExplosion(bot.x + bot.w/2, bot.y + bot.h/2); craters.push({ x: bot.x, y: bot.y });
                        bot.lives--; botsKilled++; battleStats.kills++; player.globalStats.botsKilled++;
                        addBattleProgress(100, 500, 0); bot.isDead = true;
                        
                        if (bot.lives > 0) bot.respawnTime = now + 3000;
                        else {
                            bot.toBeRemoved = true;
                            if (botsKilled + bots.filter(b => !b.toBeRemoved).length < totalBotsToKill) { setTimeout(() => spawnBot(4 * TILE, 1 * TILE), 3000); } 
                            else if (bots.filter(b => !b.toBeRemoved).length === 0) { setTimeout(() => showBattleResult(true), 1500); }
                        }
                    }
                    break;
                }
            }
        } else if (!hitObstacle && !b.isPlayer) {
            if (!tank.isDead && tank.invulnTime < now && b.x > tank.x && b.x < tank.x + tank.w && b.y > tank.y && b.y < tank.y + tank.h) {
                hitObstacle = true;
                if (!skills.shield.active) {
                    player.hp -= 50; 
                    if (player.hp <= 0) {
                        player.lives--; player.globalStats.deaths++;
                        createBigExplosion(tank.x + tank.w/2, tank.y + tank.h/2); craters.push({ x: tank.x, y: tank.y });
                        if(player.lives > 0) { tank.isDead = true; tank.respawnTime = now + 3000; } else showBattleResult(false); 
                    }
                    updateUI();
                }
            }
        }
        if (hitObstacle) { explosions.push({ x: b.x + 2, y: b.y + 2, timer: 15, big: false }); bullets.splice(i, 1); }
    }
}

function drawBg() { ctx.fillStyle = "#5c4033"; ctx.fillRect(0, 0, canvasElem.width, canvasElem.height); }
function drawGrass(x, y) { ctx.fillStyle = "#3e8e41"; ctx.fillRect(x, y, TILE, TILE); ctx.fillStyle = "#2e662b"; ctx.fillRect(x+4, y+4, 2, 4); ctx.fillRect(x+16, y+8, 2, 5); ctx.fillRect(x+10, y+16, 2, 4); }
function drawSand(x, y) { ctx.fillStyle = "#e6c280"; ctx.fillRect(x, y, TILE, TILE); ctx.fillStyle = "#cda45e"; ctx.fillRect(x+3, y+3, 2, 2); ctx.fillRect(x+18, y+6, 2, 2); ctx.fillRect(x+8, y+18, 2, 2); }
function drawRails(x, y) { ctx.fillStyle = "#5c4033"; ctx.fillRect(x, y, TILE, TILE); ctx.fillStyle = "#8b5a2b"; ctx.fillRect(x, y+4, TILE, 4); ctx.fillRect(x, y+16, TILE, 4); ctx.fillStyle = "#b0c4de"; ctx.fillRect(x+6, y, 2, TILE); ctx.fillRect(x+16, y, 2, TILE); }
function drawHedgehog(x, y) { ctx.fillStyle = "#5c4033"; ctx.fillRect(x, y, TILE, TILE); ctx.strokeStyle = "#808080"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x+2, y+2); ctx.lineTo(x+TILE-2, y+TILE-2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x+TILE-2, y+2); ctx.lineTo(x+2, y+TILE-2); ctx.stroke(); ctx.fillStyle = "#696969"; ctx.fillRect(x+10, y+8, 4, 8); }
function drawBrick(x, y, hp) { ctx.fillStyle = "#b22222"; ctx.fillRect(x, y, TILE, TILE); ctx.fillStyle = "#8b1a1a"; ctx.fillRect(x, y+TILE/2, TILE, TILE/2); ctx.fillStyle = "#d3d3d3"; ctx.fillRect(x, y+11, TILE, 1); ctx.fillRect(x+6, y, 1, 11); ctx.fillRect(x+18, y+12, 1, 12); if (hp <= 150) { ctx.strokeStyle = "black"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x+3, y+3); ctx.lineTo(x+10, y+10); ctx.lineTo(x+8, y+18); ctx.stroke(); } if (hp <= 50) { ctx.beginPath(); ctx.moveTo(x+20, y+3); ctx.lineTo(x+12, y+20); ctx.stroke(); } }
function drawConcrete(x, y) { ctx.fillStyle = "#a9a9a9"; ctx.fillRect(x, y, TILE, TILE); ctx.fillStyle = "#696969"; ctx.fillRect(x+2, y+2, 20, 20); ctx.fillStyle = "#222"; ctx.fillRect(x+4, y+4, 2, 2); ctx.fillRect(x+18, y+4, 2, 2); ctx.fillRect(x+4, y+18, 2, 2); ctx.fillRect(x+18, y+18, 2, 2); }

function drawCrater(x, y) { ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; ctx.beginPath(); ctx.arc(x + TILE/2, y + TILE/2, TILE*0.7, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "rgba(20, 10, 0, 0.9)"; ctx.beginPath(); ctx.arc(x + TILE/2, y + TILE/2, TILE*0.4, 0, Math.PI*2); ctx.fill(); }

function drawTracks() {
    const now = Date.now();
    tracks.forEach(tr => {
        let alpha = Math.max(0, 1 - (now - tr.time) / 5000); 
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.4})`; 
        ctx.save(); ctx.translate(tr.x + TILE/2, tr.y + TILE/2);
        if (tr.dir === "up" || tr.dir === "down") { ctx.fillRect(-10, -12, 3, 24); ctx.fillRect(7, -12, 3, 24); } 
        else { ctx.fillRect(-12, -10, 24, 3); ctx.fillRect(-12, 7, 24, 3); }
        ctx.restore();
    });
}

function drawTank(t, isPlayer) {
    if (t.isDead) return;
    ctx.save();
    if (t.invulnTime > Date.now() && Math.floor(Date.now() / 150) % 2 === 0) ctx.globalAlpha = 0.4;
    ctx.translate(t.x + t.w/2, t.y + t.h/2);
    if (t.dir === "up") ctx.rotate(0); if (t.dir === "down") ctx.rotate(Math.PI);
    if (t.dir === "left") ctx.rotate(-Math.PI/2); if (t.dir === "right") ctx.rotate(Math.PI/2);

    ctx.fillStyle = "#222"; ctx.fillRect(-12, -12, 5, 24); ctx.fillRect(7, -12, 5, 24);
    ctx.fillStyle = "#000"; for(let i = -10; i < 12; i += 4) { ctx.fillRect(-12, i, 5, 1); ctx.fillRect(7, i, 5, 1); }
    ctx.fillStyle = t.color; ctx.fillRect(-7, -10, 14, 20);
    ctx.fillStyle = isPlayer ? "#004d00" : "#5c0000"; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#111"; ctx.fillRect(-1, -16, 2, 10);
    ctx.restore();

    let curHp = isPlayer ? player.hp : t.hp; let maxHp = isPlayer ? player.maxHp : t.maxHp;
    ctx.fillStyle = "red"; ctx.fillRect(t.x, t.y - 6, TILE, 4); 
    ctx.fillStyle = "#00ff00"; ctx.fillRect(t.x, t.y - 6, TILE * Math.max(0, curHp / maxHp), 4); 
    ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.strokeRect(t.x, t.y - 6, TILE, 4); 
}

function drawEngine() {
    drawBg();
    for (let r = 0; r < mapData.length; r++) {
        for (let c = 0; c < mapData[r].length; c++) {
            if (mapData[r][c].type === 4) drawSand(c * TILE, r * TILE);
            else if (mapData[r][c].type === 5) drawRails(c * TILE, r * TILE);
            else if (mapData[r][c].type === 6) drawGrass(c * TILE, r * TILE);
        }
    }
    craters.forEach(c => drawCrater(c.x, c.y));
    drawTracks(); 
    for (let r = 0; r < mapData.length; r++) {
        for (let c = 0; c < mapData[r].length; c++) {
            if (mapData[r][c].type === 1) drawBrick(c * TILE, r * TILE, mapData[r][c].hp);
            else if (mapData[r][c].type === 2) drawConcrete(c * TILE, r * TILE);
            else if (mapData[r][c].type === 3) drawHedgehog(c * TILE, r * TILE);
        }
    }
    bots.forEach(bot => drawTank(bot, false)); drawTank(tank, true);

    if (skills.shield.active && !tank.isDead) { ctx.strokeStyle = "rgba(0, 255, 255, 0.8)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(tank.x + 12, tank.y + 12, 16, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = "#FFD700"; bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x + 2, b.y + 2, 2, 0, Math.PI*2); ctx.fill(); });

    explosions.forEach(e => {
        if (e.big) {
            let r = (30 - e.timer) * 1.5; ctx.fillStyle = `rgba(255, ${Math.max(0, 150 - r*3)}, 0, ${e.timer/30})`;
            ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = `rgba(255, 255, 200, ${e.timer/30})`; ctx.beginPath(); ctx.arc(e.x, e.y, r*0.5, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.fillStyle = "rgba(255, 69, 0, 0.8)"; ctx.beginPath(); ctx.arc(e.x, e.y, 8, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "rgba(255, 255, 0, 0.9)"; ctx.beginPath(); ctx.arc(e.x, e.y, 4, 0, Math.PI*2); ctx.fill();
        }
    });
}

function gameLoop() { if (game.state === "battle") { updateEngine(); drawEngine(); animationFrameId = requestAnimationFrame(gameLoop); } }