/**
 * QUICKQUEST - SVG 2D Map Edition (Strict Corridor Rules)
 */

if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);

const ENTITIES = {
    GUARD: { type: 'enemy', name: 'Guard', hp: 40, body: 6, reflex: 4, spriteIdx: 12, sheet: 'face' },
    ORC: { type: 'enemy', name: 'Orc', hp: 60, body: 8, reflex: 3, spriteIdx: 15, sheet: 'face' },
    MERCHANT: { type: 'npc', name: 'Merchant', spriteIdx: 6, sheet: 'face', msg: "I HAVE THE RING, BUT THE GUARDS ARE WATCHING AT (30,30)." },
    LADY: { type: 'npc', name: 'Lady', spriteIdx: 9, sheet: 'face', msg: "YOU FOUND IT! THE CROWN IS SAVED." },
    RING: { type: 'item', name: 'Ring', spriteIdx: 4, sheet: 'item' },
    CHEST: { type: 'item', name: 'Chest', spriteIdx: 11, sheet: 'item' }
};

const state = {
    pos: { x: 10, y: 10 },
    facing: 0, // 0:E, 1:S, 2:W, 3:N
    axis: 'X',
    mode: 'PLAY',
    index: 0,
    target: null,
    targetPos: null,
    combatLog: "",
    questStep: 0,
    hero: {
        spriteIdx: 5,
        body: 6, reflex: 6, hp: 50, maxHp: 50, exp: 0, level: 1, inventory: []
    },
    entities: {}
};

const SPRITE_SIZE = 40;
const SPACING = 42;
const COLS = 12;
const ROADS_X = [10, 15, 20, 25, 30]; 
const ROADS_Y = [10, 15, 20, 25, 30]; 

const isIntersection = (x, y) => ROADS_X.includes(y) && ROADS_Y.includes(x);
const hasRoad = (x, y, axis) => {
    if (x < 5 || x > 35 || y < 5 || y > 35) return false;
    return axis === 'X' ? ROADS_X.includes(y) : ROADS_Y.includes(x);
};
const canMove = (x, y) => (x >= 5 && x <= 35 && y >= 5 && y <= 35) && (ROADS_X.includes(y) || ROADS_Y.includes(x));

const getSpriteHtml = (idx, sheet = 'face', extraStyle = "") => {
    const x = (idx % COLS) * SPACING + 1;
    const y = Math.floor(idx / COLS) * SPACING + 1;
    return `<div class="sprite ${sheet}" style="background-position: -${x}px -${y}px; ${extraStyle}"></div>`;
};

const rnd = (n) => Math.floor(Math.random() * n) + 1;
const getHpBar = (curr, max) => {
    const size = 5;
    const fill = Math.ceil((curr / max) * size);
    return '▰'.repeat(Math.max(0, fill)) + '▱'.repeat(Math.max(0, size - fill));
};

function initWorld() {
    state.entities = {};
    for (let x = 5; x <= 35; x++) {
        for (let y = 5; y <= 35; y++) {
            if (canMove(x, y) && !isIntersection(x, y)) {
                if ((x === 10 && y === 10) || (x === 30 && y === 30)) continue;
                const r = Math.random();
                if (r < 0.04) state.entities[`${x},${y}`] = { ...ENTITIES.GUARD, spriteIdx: Math.floor(Math.random() * 50) };
                else if (r < 0.02) state.entities[`${x},${y}`] = { ...ENTITIES.ORC };
                else if (r < 0.03) state.entities[`${x},${y}`] = { ...ENTITIES.CHEST };
            }
        }
    }
}

function getEntity(x, y) {
    if (x === 10 && y === 10) {
        if (state.questStep === 0 || state.questStep === 1) return ENTITIES.MERCHANT;
        if (state.questStep === 2) return ENTITIES.LADY;
    }
    if (x === 30 && y === 30 && state.questStep === 1) return ENTITIES.RING;
    return state.entities[`${x},${y}`];
}

function getBackgroundSvg(x, y, currentAxis) {
    const isMainRoad = hasRoad(x, y, currentAxis);
    const otherAxis = currentAxis === 'X' ? 'Y' : 'X';
    const hasIntersection = hasRoad(x, y, otherAxis);
    
    let lines = "";
    if (isMainRoad) {
        lines += `<line x1="0" y1="12" x2="40" y2="12" stroke="#444" stroke-width="1.5"/>`;
        lines += `<line x1="0" y1="28" x2="40" y2="28" stroke="#444" stroke-width="1.5"/>`;

        if (hasIntersection) {
            lines = `<line x1="0" y1="12" x2="12" y2="12" stroke="#444" stroke-width="1.5"/>
                     <line x1="28" y1="12" x2="40" y2="12" stroke="#444" stroke-width="1.5"/>
                     <line x1="0" y1="28" x2="12" y2="28" stroke="#444" stroke-width="1.5"/>
                     <line x1="28" y1="28" x2="40" y2="28" stroke="#444" stroke-width="1.5"/>
                     <line x1="12" y1="0" x2="12" y2="12" stroke="#444" stroke-width="1.5"/>
                     <line x1="28" y1="0" x2="28" y2="12" stroke="#444" stroke-width="1.5"/>
                     <line x1="12" y1="28" x2="12" y2="40" stroke="#444" stroke-width="1.5"/>
                     <line x1="28" y1="28" x2="28" y2="40" stroke="#444" stroke-width="1.5"/>`;
        }
        
        const pC = currentAxis === 'X' ? x - 1 : y - 1;
        const nC = currentAxis === 'X' ? x + 1 : y + 1;
        const hasPrev = currentAxis === 'X' ? hasRoad(pC, y, 'X') : hasRoad(x, pC, 'Y');
        const hasNext = currentAxis === 'X' ? hasRoad(nC, y, 'X') : hasRoad(x, nC, 'Y');
        
        if (!hasPrev) lines += `<line x1="0" y1="12" x2="0" y2="28" stroke="#444" stroke-width="2"/>`;
        if (!hasNext) lines += `<line x1="40" y1="12" x2="40" y2="28" stroke="#444" stroke-width="2"/>`;
    } else {
        lines += `<line x1="20" y1="0" x2="20" y2="40" stroke="#DDD" stroke-width="0.5" stroke-dasharray="2,2"/>`;
    }
    
    return `<svg width="40" height="40" style="display:block;">${lines}</svg>`;
}

const getHeroHtml = () => {
    let scaleX = state.facing === 2 ? -1 : 1;
    const style = `transform: scale(${scaleX}, 1); transition: transform 0.1s;`;
    return getSpriteHtml(state.hero.spriteIdx, 'face', style);
};

const getCellHtml = (x, y) => {
    const isPlayer = x === state.pos.x && y === state.pos.y;
    const ent = getEntity(x, y);
    const bg = getBackgroundSvg(x, y, state.axis);
    const sprite = isPlayer ? getHeroHtml() : (ent ? getSpriteHtml(ent.spriteIdx, ent.sheet) : "");
    
    return `<div style="position:relative; display:inline-block; width:40px; height:40px; margin: 0; vertical-align: middle;">
        <div style="position:absolute; top:0; left:0; width:40px; height:40px;">${bg}</div>
        <div style="position:absolute; top:0; left:0; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">${sprite}</div>
    </div>`;
};

function render() {
    const display = document.getElementById('game-render');
    if (!display) return;

    let html = "";
    if (state.mode === 'PLAY') {
        const hpBar = getHpBar(state.hero.hp, state.hero.maxHp);
        const inv = state.hero.inventory.length > 0 ? ` 🎒${state.hero.inventory.length}` : "";
        const directions = ['E', 'S', 'W', 'N'];
        const compass = `<span class="bg-white text-black px-2 font-black mr-2">${directions[state.facing]}</span>`;
        
        html += `<span class="text-xs opacity-50 mr-4">${compass} LVL ${state.hero.level} ${hpBar}${inv} <span class="mono">(${state.pos.x},${state.pos.y})</span></span>`;

        if (state.axis === 'X') {
            for (let x = state.pos.x - 7; x <= state.pos.x + 7; x++) {
                html += getCellHtml(x, state.pos.y);
            }
        } else {
            for (let y = state.pos.y - 7; y <= state.pos.y + 7; y++) {
                html += getCellHtml(state.pos.x, y);
            }
        }
    } else if (state.mode === 'BATTLE') {
        const hBar = getHpBar(state.hero.hp, state.hero.maxHp);
        const eBar = getHpBar(state.target.hp, state.target.maxHp);
        const options = ["ATTACK", "PARRY", "FLEE"].map((opt, idx) =>
            `<span class="${idx === state.index ? 'option-active' : 'option-inactive'}">${opt}</span>`
        ).join(" ");
        const actionEffect = state.combatLog ? `<span class="mx-4 text-white font-bold animate-bounce">${state.combatLog}</span>` : " VS ";
        html = `<span>${hBar}${getHeroHtml()}${actionEffect}${getSpriteHtml(state.target.spriteIdx, state.target.sheet)}${eBar}</span> <span class="ml-8">${options}</span>`;
    } else if (state.mode === 'MESSAGE') {
        html = `<span class="font-bold text-white uppercase tracking-widest">${state.combatLog}</span> <span class="option-active ml-8 text-xs">[ENTER]</span>`;
    }

    display.innerHTML = html;
}

function handleInput(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();

    if (state.mode === 'PLAY') {
        let nX = state.pos.x;
        let nY = state.pos.y;
        let nAxis = state.axis;
        let nFacing = state.facing;
        let moved = false;
        const atIntersection = isIntersection(state.pos.x, state.pos.y);

        if (e.key === 'ArrowLeft') {
            if (state.axis === 'X') { nX--; nFacing = 2; moved = true; }
            else { nY--; nFacing = 3; moved = true; }
        } else if (e.key === 'ArrowRight') {
            if (state.axis === 'X') { nX++; nFacing = 0; moved = true; }
            else { nY++; nFacing = 1; moved = true; }
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            if (atIntersection) {
                nAxis = (state.axis === 'X') ? 'Y' : 'X';
                if (nAxis === 'Y') {
                    if (e.key === 'ArrowUp') { nY--; nFacing = 3; }
                    else { nY++; nFacing = 1; }
                } else {
                    if (e.key === 'ArrowUp') { nX--; nFacing = 2; }
                    else { nX++; nFacing = 0; }
                }
                moved = true;
            }
        }

        if (moved) {
            const ent = getEntity(nX, nY);
            if (canMove(nX, nY)) {
                state.axis = nAxis;
                state.facing = nFacing;
                if (ent?.type === 'enemy') {
                    state.target = { ...ent, maxHp: ent.hp };
                    state.targetPos = { x: nX, y: nY };
                    state.mode = 'BATTLE';
                    state.index = 0; state.combatLog = "";
                } else {
                    state.pos.x = nX;
                    state.pos.y = nY;
                }
            }
        }

        const currentEnt = getEntity(state.pos.x, state.pos.y);
        if (e.key === 'Enter' || e.key === ' ') {
            if (currentEnt?.type === 'npc') {
                state.combatLog = `${currentEnt.name}: "${currentEnt.msg}"`;
                if (currentEnt.name === 'Merchant' && state.questStep === 0) state.questStep = 1;
                if (currentEnt.name === 'Lady' && state.questStep === 2) {
                    state.combatLog = "THE RING IS RETURNED. TRUTH IS RESTORED. YOU WIN!";
                    state.questStep = 3;
                }
                state.mode = 'MESSAGE';
            } else if (currentEnt?.type === 'item') {
                if (currentEnt.name === 'Ring') {
                    state.questStep = 2;
                    state.combatLog = "OBTAINED THE SHATTERED RING!";
                } else {
                    state.hero.exp += 20;
                    state.combatLog = "FOUND SUPPLIES! +20 EXP";
                }
                state.hero.inventory.push(currentEnt.spriteIdx);
                if (currentEnt.name !== 'Ring') delete state.entities[`${state.pos.x},${state.pos.y}`];
                state.mode = 'MESSAGE';
                checkLevelUp();
            }
        }
    } else if (state.mode === 'BATTLE') {
        if (e.key === 'ArrowLeft') state.index = Math.max(0, state.index - 1);
        if (e.key === 'ArrowRight') state.index = Math.min(2, state.index + 1);
        if (e.key === 'Enter') executeTurn(["ATTACK", "PARRY", "FLEE"][state.index]);
    } else if (state.mode === 'MESSAGE') {
        if (e.key === 'Enter' || e.key === 'Escape') {
            if (state.hero.hp <= 0 || state.questStep === 3) location.reload();
            state.mode = 'PLAY';
        }
    }
    render();
}

function executeTurn(action) {
    if (action === 'FLEE') { state.mode = 'PLAY'; return; }
    let hRoll = state.hero.reflex + rnd(6);
    let eRoll = state.target.reflex + rnd(6);
    if (hRoll >= eRoll) {
        let dmg = state.hero.body + rnd(6);
        state.target.hp -= dmg;
        state.combatLog = `HIT! -${dmg}`;
    } else { state.combatLog = `MISS!`; }

    if (state.target.hp <= 0) {
        state.hero.exp += 30; state.combatLog = `VICTORY! +30 EXP`;
        state.mode = 'MESSAGE'; 
        if (state.targetPos) {
            delete state.entities[`${state.targetPos.x},${state.targetPos.y}`];
            state.targetPos = null;
        }
        checkLevelUp(); return;
    }

    setTimeout(() => {
        let eAtkRoll = state.target.reflex + rnd(6);
        let hDefRoll = state.hero.reflex + (action === 'PARRY' ? 5 : 0) + rnd(6);
        if (eAtkRoll > hDefRoll) {
            let dmg = state.target.body + rnd(4);
            state.hero.hp -= dmg; state.combatLog = `OOF! -${dmg}`;
        } else { state.combatLog = `BLOCKED!`; }
        if (state.hero.hp <= 0) { state.combatLog = "YOU HAVE DIED."; state.mode = 'MESSAGE'; }
        render();
    }, 400);
}

function checkLevelUp() {
    if (state.hero.exp >= state.hero.level * 60) {
        state.hero.level++; state.hero.body += 2; state.hero.maxHp += 15;
        state.hero.hp = state.hero.maxHp;
        state.combatLog = `LEVEL UP! REACHED LEVEL ${state.hero.level}`;
        state.mode = 'MESSAGE';
    }
}

initWorld();
render();
const gameContainer = document.getElementById('game-container');
gameContainer.focus();
gameContainer.addEventListener('keydown', handleInput);
document.addEventListener('click', () => gameContainer.focus());
setInterval(() => { if(state.mode === 'PLAY') render(); }, 800);
