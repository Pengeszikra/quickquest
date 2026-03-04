/**
 * ROGMOR MINIMAL - Competition Quest Edition
 */

// Clean the URL on start
if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);

const state = {
    world: [],
    playerPos: 5,
    mode: 'PLAY',
    index: 0,
    target: null,
    combatLog: "",
    questStep: 0, // 0: Start, 1: Talked to Merchant, 2: Got Ring, 3: Reach Lady
    hero: {
        spriteIdx: 5,
        body: 6, reflex: 6, hp: 50, maxHp: 50, exp: 0, level: 1, inventory: []
    }
};

const SPRITE_SIZE = 40;
const SPACING = 42;
const COLS = 12;

const ENTITIES = {
    DOOR: { type: 'door', spriteIdx: 0, sheet: 'item', name: 'Alley' },
    PATH: { type: 'path', spriteIdx: 1, sheet: 'item', name: 'Road' },
    GUARD: { type: 'enemy', name: 'Guard', hp: 40, body: 6, reflex: 4, spriteIdx: 12, sheet: 'face' },
    ORC: { type: 'enemy', name: 'Orc', hp: 60, body: 8, reflex: 3, spriteIdx: 15, sheet: 'face' },
    MERCHANT: { type: 'npc', name: 'Merchant', spriteIdx: 6, sheet: 'face', msg: "I HAVE THE RING, BUT THE GUARDS ARE WATCHING." },
    LADY: { type: 'npc', name: 'Lady', spriteIdx: 9, sheet: 'face', msg: "DO YOU HAVE THE RING, MY LORD?" },
    WIZARD: { type: 'npc', name: 'Wizard', spriteIdx: 17, sheet: 'face', msg: "THE FOG HIDES MANY SECRETS." },
    RING: { type: 'item', name: 'Ring', spriteIdx: 4, sheet: 'item' },
    CHEST: { type: 'item', name: 'Chest', spriteIdx: 11, sheet: 'item' }
};

const getSpriteHtml = (idx, sheet = 'face') => {
    const x = (idx % COLS) * SPACING + 1;
    const y = Math.floor(idx / COLS) * SPACING + 1;
    return `<div class="sprite ${sheet}" style="background-position: -${x}px -${y}px"></div>`;
};

const rnd = (n) => Math.floor(Math.random() * n) + 1;
const getHpBar = (curr, max) => {
    const size = 5;
    const fill = Math.ceil((curr / max) * size);
    return '▰'.repeat(Math.max(0, fill)) + '▱'.repeat(Math.max(0, size - fill));
};

function generateWorld(type = 'city') {
    state.world = Array.from({ length: 45 }, (_, i) => {
        const r = Math.random();
        if (i === 12 && state.questStep === 0) return { ...ENTITIES.MERCHANT };
        if (i === 12 && state.questStep === 2) return { ...ENTITIES.LADY };
        if (i === 30 && state.questStep === 1) return { ...ENTITIES.RING };
        
        if (r < 0.08) {
            // Randomize guard face: there are dozens in the sheet, let's pick from a safe range
            const randomFace = Math.floor(Math.random() * 50); 
            return { ...ENTITIES.GUARD, spriteIdx: randomFace };
        }
        if (r < 0.04) return { ...ENTITIES.ORC };
        if (r < 0.05) return { ...ENTITIES.WIZARD };

        if (r < 0.05) return { ...ENTITIES.CHEST };
        if (r < 0.08) return { ...ENTITIES.DOOR };
        return null;
    });
}

function render() {
    const display = document.getElementById('game-render');
    if (!display) return;

    let html = "";
    if (state.mode === 'PLAY') {
        const hpBar = getHpBar(state.hero.hp, state.hero.maxHp);
        const inv = state.hero.inventory.length > 0 ? ` 🎒${state.hero.inventory.length}` : "";
        html += `<span class="text-xs opacity-50 mr-4">LVL ${state.hero.level} ${hpBar}${inv}</span>`;

        let start = Math.max(0, state.playerPos - 10);
        let end = Math.min(state.world.length, start + 20);
        for (let i = start; i < end; i++) {
            if (i === state.playerPos) html += getSpriteHtml(state.hero.spriteIdx);
            else {
                const ent = state.world[i];
                if (ent?.type === 'door' || ent?.type === 'path') {
                    html += `<span class="portal-marker">/ \\</span>`;
                } else {
                    html += ent ? getSpriteHtml(ent.spriteIdx, ent.sheet) : `<span class="floor w-[40px] inline-block text-center text-xs">·</span>`;
                }
            }
        }
    } else if (state.mode === 'BATTLE') {
        const hBar = getHpBar(state.hero.hp, state.hero.maxHp);
        const eBar = getHpBar(state.target.hp, state.target.maxHp);
        const options = ["ATTACK", "PARRY", "FLEE"].map((opt, idx) =>
            `<span class="${idx === state.index ? 'option-active' : 'option-inactive'}">${opt}</span>`
        ).join(" ");
        const actionEffect = state.combatLog ? `<span class="mx-4 text-white font-bold animate-bounce">${state.combatLog}</span>` : " VS ";
        html = `<span>${hBar}${getSpriteHtml(state.hero.spriteIdx)}${actionEffect}${getSpriteHtml(state.target.spriteIdx, 'face')}${eBar}</span> <span class="ml-8">${options}</span>`;
    } else if (state.mode === 'MESSAGE') {
        html = `<span class="font-bold text-white uppercase tracking-widest">${state.combatLog}</span> <span class="option-active ml-8 text-xs">[ENTER]</span>`;
    }

    display.innerHTML = html;
}

function handleInput(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();

    if (state.mode === 'PLAY') {
        if (e.key === 'ArrowLeft') state.playerPos = Math.max(0, state.playerPos - 1);
        if (e.key === 'ArrowRight') state.playerPos = Math.min(state.world.length - 1, state.playerPos + 1);

        const ent = state.world[state.playerPos];
        if (e.key === 'ArrowUp' || e.key === 'Enter') {
            if (ent?.type === 'enemy') {
                state.mode = 'BATTLE';
                state.target = { ...ent, maxHp: ent.hp };
                state.index = 0; state.combatLog = "";
            } else if (ent?.type === 'npc') {
                state.combatLog = `${ent.name}: "${ent.msg}"`;
                if (ent.name === 'Merchant' && state.questStep === 0) state.questStep = 1;
                if (ent.name === 'Lady' && state.questStep === 2) {
                    state.combatLog = "THE RING IS RETURNED. TRUTH IS RESTORED. YOU WIN!";
                    state.questStep = 3;
                }
                state.mode = 'MESSAGE';
            } else if (ent?.type === 'item') {
                if (ent.name === 'Ring') {
                    state.questStep = 2;
                    state.combatLog = "OBTAINED THE SHATTERED RING!";
                } else {
                    state.hero.exp += 20;
                    state.combatLog = "FOUND SUPPLIES! +20 EXP";
                }
                state.hero.inventory.push(ent.spriteIdx);
                state.world[state.playerPos] = null;
                state.mode = 'MESSAGE';
                checkLevelUp();
            } else if (ent?.type === 'door') {
                generateWorld(); state.playerPos = 0;
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
    if (action === 'FLEE') { state.mode = 'PLAY'; state.playerPos = Math.max(0, state.playerPos - 2); return; }
    let hRoll = state.hero.reflex + rnd(6);
    let eRoll = state.target.reflex + rnd(6);
    if (hRoll >= eRoll) {
        let dmg = state.hero.body + rnd(6);
        state.target.hp -= dmg;
        state.combatLog = `HIT! -${dmg}`;
    } else { state.combatLog = `MISS!`; }

    if (state.target.hp <= 0) {
        state.hero.exp += 30; state.combatLog = `VICTORY! +30 EXP`;
        state.mode = 'MESSAGE'; state.world[state.playerPos] = null;
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

generateWorld();
render();
const container = document.getElementById('game-container');
container.focus();
container.addEventListener('keydown', handleInput);
document.addEventListener('click', () => container.focus());
setInterval(() => { if(state.mode === 'PLAY') render(); }, 800);
