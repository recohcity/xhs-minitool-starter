/* ==========================================================================
   EBB AND FLOW - GAME ENGINE & COGNITIVE TASK-SWITCHING LOGIC
   ========================================================================== */

// ── Web Audio Synthesizer ──────────────────────────────────────────────────
class SoundSynth {
    constructor() {
        this.ctx = null;
        this.bgmGain = null;
        this.bgmTimer = null;
        this.isBgmPlaying = false;
        this.bgmStep = 0;
        this.bgmNextTime = 0;
        this.bgmTempo = 108; // BPM，轻快有节奏
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            // BGM 主音量：淡淡的背景，不喧宾夺主
            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.value = 0.06;
            this.bgmGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    play(type) {
        this.init();
        if (!this.ctx || this.ctx.state === 'suspended') return;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        const now = this.ctx.currentTime;

        if (type === 'correct') {
            // Sweet double chime
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, now); // D5
            osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.08); // D6
            gainNode.gain.setValueAtTime(0.12, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'incorrect') {
            // Low buzzer warning
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120.00, now);
            osc.frequency.setValueAtTime(85.00, now + 0.08);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'levelup') {
            // Ascending triad chord
            const notes = [440.00, 554.37, 659.25, 880.00]; // A4, C#5, E5, A5
            notes.forEach((freq, index) => {
                const subOsc = this.ctx.createOscillator();
                const subGain = this.ctx.createGain();
                subOsc.connect(subGain);
                subGain.connect(this.ctx.destination);
                
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(freq, now + index * 0.06);
                subGain.gain.setValueAtTime(0.08, now + index * 0.06);
                subGain.gain.linearRampToValueAtTime(0, now + index * 0.06 + 0.16);
                subOsc.start(now + index * 0.06);
                subOsc.stop(now + index * 0.06 + 0.16);
            });
        } else if (type === 'tick') {
            // Sharp soft tick
            osc.type = 'sine';
            osc.frequency.setValueAtTime(987.77, now); // B5
            gainNode.gain.setValueAtTime(0.06, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.03);
            osc.start(now);
            osc.stop(now + 0.03);
        } else if (type === 'gameover') {
            // Triumphant chord sweep
            const notes = [293.66, 369.99, 440.00, 587.33]; // D4, F#4, A4, D5
            notes.forEach((freq, index) => {
                const subOsc = this.ctx.createOscillator();
                const subGain = this.ctx.createGain();
                subOsc.connect(subGain);
                subGain.connect(this.ctx.destination);
                
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(freq, now + index * 0.08);
                subGain.gain.setValueAtTime(0.1, now + index * 0.08);
                subGain.gain.linearRampToValueAtTime(0, now + index * 0.08 + 0.35);
                subOsc.start(now + index * 0.08);
                subOsc.stop(now + index * 0.08 + 0.35);
            });
        }
    }

    // ── BGM 背景循环（Web Audio 合成，无外部资源） ──
    startBGM() {
        this.init();
        if (!this.ctx || this.isBgmPlaying) return;
        this.isBgmPlaying = true;
        this.bgmStep = 0;
        this.bgmNextTime = this.ctx.currentTime + 0.1;
        this._bgmScheduler();
    }

    stopBGM() {
        this.isBgmPlaying = false;
        if (this.bgmTimer) clearTimeout(this.bgmTimer);
    }

    _bgmScheduler() {
        if (!this.isBgmPlaying) return;
        const secondsPerBeat = 60.0 / this.bgmTempo;
        const secondsPer16th = secondsPerBeat / 4;
        while (this.bgmNextTime < this.ctx.currentTime + 0.1) {
            this._scheduleBgmStep(this.bgmStep, this.bgmNextTime);
            this.bgmNextTime += secondsPer16th;
            this.bgmStep = (this.bgmStep + 1) % 32; // 2小节循环
        }
        this.bgmTimer = setTimeout(() => this._bgmScheduler(), 25);
    }

    _scheduleBgmStep(step, time) {
        // Kick：每拍一个
        if (step % 4 === 0) this._bgmKick(time);
        // Hi-hat：八分音符，反拍稍重
        if (step % 2 === 0) this._bgmHiHat(time, step % 4 === 2 ? 0.25 : 0.15);
        // 贝斯：每拍第一个16分音符，C-F-G-C进行
        if (step % 4 === 0) {
            const bassNotes = [130.81, 130.81, 174.61, 196.00];
            this._bgmBass(time, bassNotes[Math.floor(step / 8) % 4]);
        }
        // 主旋律琶音：16分音符
        const melody = [
            523.25, 0, 659.25, 0, 783.99, 0, 659.25, 0,
            587.33, 0, 698.46, 0, 880.00, 0, 698.46, 0,
            523.25, 0, 659.25, 0, 783.99, 0, 659.25, 0,
            493.88, 0, 587.33, 0, 783.99, 0, 587.33, 0
        ];
        const freq = melody[step];
        if (freq) this._bgmLead(time, freq);
    }

    _bgmKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);
        gain.gain.setValueAtTime(0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(time);
        osc.stop(time + 0.15);
    }

    _bgmHiHat(time, vol) {
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 8000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);
        noise.start(time);
        noise.stop(time + 0.04);
    }

    _bgmBass(time, freq) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.4, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(time);
        osc.stop(time + 0.35);
    }

    _bgmLead(time, freq) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.2, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(time);
        osc.stop(time + 0.18);
    }
}

const synth = new SoundSynth();

// ── Game Constants & Vector Leaf ───────────────────────────────────────────
const LEAF_SVG = `
<svg class="leaf-svg" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
    <path class="leaf-outline" d="M 50,110 C 20,90 15,50 50,10 C 85,50 80,90 50,110 Z" fill="none" stroke="white" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
    <line class="leaf-outline-stem" x1="50" y1="110" x2="50" y2="120" stroke="white" stroke-width="6" stroke-linecap="round"/>
    <path class="leaf-left" d="M 50,110 C 20,90 15,50 50,10 Z"/>
    <path class="leaf-right" d="M 50,10 C 85,50 80,90 50,110 Z"/>
    <line class="leaf-stem" x1="50" y1="110" x2="50" y2="10"/>
    <line class="leaf-bottom-stem" x1="50" y1="110" x2="50" y2="120"/>
</svg>
`;

const DIRECTIONS = {
    UP: { name: 'up', deg: 0, dx: 0, dy: -1 },
    RIGHT: { name: 'right', deg: 90, dx: 1, dy: 0 },
    DOWN: { name: 'down', deg: 180, dx: 0, dy: 1 },
    LEFT: { name: 'left', deg: 270, dx: -1, dy: 0 }
};

const DIR_KEYS = {
    'ArrowUp': 'up', 'w': 'up', 'W': 'up',
    'ArrowRight': 'right', 'd': 'right', 'D': 'right',
    'ArrowDown': 'down', 's': 'down', 'S': 'down',
    'ArrowLeft': 'left', 'a': 'left', 'A': 'left'
};

// Fixed scattered leaf offsets inside game board (in percentage)
const LEAF_SPAWN_OFFSETS = [
    { x: 18, y: 16 },
    { x: 50, y: 22 },
    { x: 80, y: 18 },
    { x: 30, y: 65 },
    { x: 68, y: 60 }
];

// ── Game State variables ───────────────────────────────────────────────────
let gameState = {
    activeScreen: 'welcomeScreen',
    
    // Core game parameters
    score: 0,
    multiplier: 1,
    streak: 0,
    peakMultiplier: 1,
    timeLeft: 60,
    timerInterval: null,
    gameActive: false,
    
    // Performance metrics
    records: [], // items: { rule: 'green'|'orange', congruent: bool, isSwitch: bool, correct: bool, rt: ms }
    
    // Trial parameters
    currentColor: 'green', // 'green' (pointing) or 'orange' (moving)
    currentPointing: 'up',
    currentMoving: 'up',
    trialStartTime: 0,
    
    // Animated drifting leaves
    leaves: [],
    oldLeaves: [], // For slide-out transitions
    lastFrameTime: 0,
    animationFrameId: null,
    
    // Tutorial states
    tutStep: 1,
    tutConsecutiveCorrect: 0,
    tutPracticeTarget: null,
    tutPracticeColor: 'green',
    tutPracticePointing: 'up',
    tutPracticeMoving: 'up'
};

// ── DOM Elements ───────────────────────────────────────────────────────────
const screens = {
    welcomeScreen: document.getElementById('welcomeScreen'),
    tutorialScreen: document.getElementById('tutorialScreen'),
    playingScreen: document.getElementById('playingScreen'),
    gameOverScreen: document.getElementById('gameOverScreen'),
    reportScreen: document.getElementById('reportScreen')
};

// Controls & Buttons
const btnStartGame = document.getElementById('startGameBtn');
const btnStartTutorial = document.getElementById('startTutorialBtn');
const btnSkipTutorial = document.getElementById('skipTutorialBtn');
const btnInGameRestart = document.getElementById('inGameRestartBtn');
const btnInGameHome = document.getElementById('inGameHomeBtn');
const btnRestartGame = document.getElementById('restartGameBtn');
const btnShareResult = document.getElementById('shareResultBtn');
const btnBackToMenu = document.getElementById('backToMenuBtn');

// Share result snapshot (populated in endGame, consumed by share handler)
let shareSnapshot = null;

// Dashboard Elements
const timerDisplay = document.getElementById('timerDisplay');
const timerBarFill = document.getElementById('timerBarFill');
const multiplierDisplay = document.getElementById('multiplierDisplay');
const multiplierMeter = document.getElementById('multiplierMeter');
const scoreDisplay = document.getElementById('scoreDisplay');
const gameBoard = document.getElementById('gameBoard');
const leafContainer = document.getElementById('leafContainer');
const flashOverlay = document.getElementById('flashOverlay');
const viewReportBtn = document.getElementById('viewReportBtn');
const reportHint = document.getElementById('reportHint');

// 报告详情页元素
const reportDate = document.getElementById('reportDate');
const reportRankTitle = document.getElementById('reportRankTitle');
const reportRankTag = document.getElementById('reportRankTag');
const reportInterpretText = document.getElementById('reportInterpretText');
const reportSpeedVal = document.getElementById('reportSpeedVal');
const reportSpeedEval = document.getElementById('reportSpeedEval');
const reportAccuracyVal = document.getElementById('reportAccuracyVal');
const reportAccuracyEval = document.getElementById('reportAccuracyEval');
const reportSwitchVal = document.getElementById('reportSwitchVal');
const reportSwitchEval = document.getElementById('reportSwitchEval');
const reportFocusVal = document.getElementById('reportFocusVal');
const reportFocusEval = document.getElementById('reportFocusEval');
const reportSubScore = document.getElementById('reportSubScore');
const reportSubPeak = document.getElementById('reportSubPeak');
const reportSubFastest = document.getElementById('reportSubFastest');
const reportTipContent = document.getElementById('reportTipContent');
const reportBackBtn = document.getElementById('reportBackBtn');
const reportRetestBtn = document.getElementById('reportRetestBtn');
const reportShareBtn = document.getElementById('reportShareBtn');

// Game Over — 反应力报告面板元素
const rankTitle = document.getElementById('rankTitle');
const rankTag = document.getElementById('rankTag');
const interpretText = document.getElementById('interpretText');
const abilitySpeedVal = document.getElementById('abilitySpeedVal');
const abilitySpeedEval = document.getElementById('abilitySpeedEval');
const abilityAccuracyVal = document.getElementById('abilityAccuracyVal');
const abilityAccuracyEval = document.getElementById('abilityAccuracyEval');
const abilitySwitchVal = document.getElementById('abilitySwitchVal');
const abilitySwitchEval = document.getElementById('abilitySwitchEval');
const abilityFocusVal = document.getElementById('abilityFocusVal');
const abilityFocusEval = document.getElementById('abilityFocusEval');
const subScoreVal = document.getElementById('subScoreVal');
const subPeakVal = document.getElementById('subPeakVal');
const subFastestVal = document.getElementById('subFastestVal');
const tipContent = document.getElementById('tipContent');

// ── Screen Management ──────────────────────────────────────────────────────
function showScreen(screenId) {
    Object.keys(screens).forEach(id => {
        if (id === screenId) {
            screens[id].classList.add('active');
        } else {
            screens[id].classList.remove('active');
        }
    });
    gameState.activeScreen = screenId;
    
    if (screenId === 'welcomeScreen') {
        renderReportEntry();
        stopGameLoops();
    }
}

function stopGameLoops() {
    gameState.gameActive = false;
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    if (gameState.animationFrameId) {
        cancelAnimationFrame(gameState.animationFrameId);
        gameState.animationFrameId = null;
    }
    leafContainer.innerHTML = '';
    gameState.leaves = [];
    gameState.oldLeaves = [];
}

// ── Input Event Handlers ───────────────────────────────────────────────────
function handleInput(direction) {
    if (gameState.activeScreen === 'playingScreen' && gameState.gameActive) {
        processPlayResponse(direction);
    } else if (gameState.activeScreen === 'tutorialScreen' && gameState.tutStep === 3) {
        processTutorialPracticeResponse(direction);
    }
}

document.addEventListener('keydown', (e) => {
    if (DIR_KEYS[e.key]) {
        e.preventDefault(); // Stop window scrolling
        handleInput(DIR_KEYS[e.key]);
    }
});

// Swipe gestures — Pointer Events unify mouse (PC simulator) and touch (real devices)
// 通用绑定：对局棋盘与教学练习区共用同一套滑动识别
function bindSwipe(el) {
    let startX = 0;
    let startY = 0;
    el.addEventListener('pointerdown', (e) => {
        startX = e.clientX;
        startY = e.clientY;
    }, { passive: true });

    el.addEventListener('pointerup', (e) => {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const threshold = 35;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (Math.abs(dx) > threshold) {
                handleInput(dx > 0 ? 'right' : 'left');
            }
        } else {
            if (Math.abs(dy) > threshold) {
                handleInput(dy > 0 ? 'down' : 'up');
            }
        }
    }, { passive: true });
}

bindSwipe(gameBoard); // 对局屏
bindSwipe(document.querySelector('.practice-box')); // 教学第 3 步练习区

// ── Game Physics Loop (Drifting Leaves) ────────────────────────────────────
const DRIFT_SPEED = 60; // pixels per second
const SLIDE_OUT_SPEED = 900; // Fast slide transition out

function updatePhysics(timestamp) {
    if (!gameState.lastFrameTime) gameState.lastFrameTime = timestamp;
    const dt = (timestamp - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = timestamp;

    const boardWidth = gameBoard.clientWidth || 800;
    const boardHeight = gameBoard.clientHeight || 420;
    const leafW = 80;
    const leafH = 104;

    // 1. Update Active Leaves (Drift at normal speed)
    gameState.leaves.forEach(leaf => {
        const moveData = DIRECTIONS[leaf.moving.toUpperCase()];
        leaf.x += moveData.dx * DRIFT_SPEED * dt;
        leaf.y += moveData.dy * DRIFT_SPEED * dt;

        // Wrap around boundaries
        if (leaf.x > boardWidth + leafW / 2) leaf.x = -leafW / 2;
        if (leaf.x < -leafW / 2) leaf.x = boardWidth + leafW / 2;
        if (leaf.y > boardHeight + leafH / 2) leaf.y = -leafH / 2;
        if (leaf.y < -leafH / 2) leaf.y = boardHeight + leafH / 2;

        // Sync with DOM
        leaf.element.style.left = `${leaf.x - leafW / 2}px`;
        leaf.element.style.top = `${leaf.y - leafH / 2}px`;
    });

    // 2. Update Old Transitioning Leaves (Slide out quickly, fading out)
    gameState.oldLeaves.forEach((leaf, idx) => {
        const moveData = DIRECTIONS[leaf.moving.toUpperCase()];
        leaf.x += moveData.dx * SLIDE_OUT_SPEED * dt;
        leaf.y += moveData.dy * SLIDE_OUT_SPEED * dt;
        leaf.opacity -= 6 * dt; // Fade out quickly

        if (leaf.opacity <= 0) {
            leaf.element.remove();
        } else {
            leaf.element.style.left = `${leaf.x - leafW / 2}px`;
            leaf.element.style.top = `${leaf.y - leafH / 2}px`;
            leaf.element.style.opacity = leaf.opacity;
        }
    });

    // Filter out removed leaves
    gameState.oldLeaves = gameState.oldLeaves.filter(leaf => leaf.opacity > 0);

    // Continue loop if active
    if (gameState.gameActive) {
        gameState.animationFrameId = requestAnimationFrame(updatePhysics);
    }
}

// ── Game Core Loop & Initialization ────────────────────────────────────────
function initGame() {
    stopGameLoops();
    
    gameState.score = 0;
    gameState.multiplier = 1;
    gameState.streak = 0;
    gameState.peakMultiplier = 1;
    gameState.timeLeft = 60;
    gameState.gameActive = true;
    gameState.records = [];
    
    scoreDisplay.innerText = '0';
    scoreDisplay.dataset.raw = '0';
    multiplierDisplay.innerText = '1x';
    updateMultiplierMeterUI();
    timerDisplay.innerText = '60s';
    timerDisplay.classList.remove('critical');
    timerBarFill.style.width = '100%';
    timerBarFill.classList.remove('warning');
    
    showScreen('playingScreen');
    
    // Start count down timer
    let lastTime = performance.now();
    gameState.timerInterval = setInterval(() => {
        if (!gameState.gameActive) return;
        
        gameState.timeLeft -= 0.1;
        if (gameState.timeLeft <= 0) {
            gameState.timeLeft = 0;
            endGame();
            return;
        }
        
        // Update timer bar UI
        const percent = (gameState.timeLeft / 60) * 100;
        timerBarFill.style.width = `${percent}%`;
        timerDisplay.innerText = `${Math.ceil(gameState.timeLeft)}s`;
        
        // Soft warnings in the final 5 seconds
        if (gameState.timeLeft <= 5) {
            timerBarFill.classList.add('warning');
            timerDisplay.classList.add('critical');
            if (Math.abs(gameState.timeLeft % 1) < 0.05) {
                synth.play('tick');
            }
        }
    }, 100);
    
    // First trial spawn
    generateTrialLeaves(false);
    
    // Start physics
    gameState.lastFrameTime = 0;
    gameState.animationFrameId = requestAnimationFrame(updatePhysics);
}

// Spawns a new group of leaves on the game board
function generateTrialLeaves(isTransition = true) {
    const boardWidth = gameBoard.clientWidth || 800;
    const boardHeight = gameBoard.clientHeight || 420;
    const leafW = 80;
    const leafH = 104;

    // 1. 直接清空旧叶子 DOM，不再走 slide-out 淡出过渡
    //    旧实现把旧组塞进 oldLeaves 用 900px/s 滑出+6/s 淡出（~167ms 窗口），
    //    期间旧组仍在屏内漂移，而新组又生成到同一 LEAF_SPAWN_OFFSETS 位置，
    //    两组位置必然撞车——这就是绿+橙重叠的直接原因。
    //    该过渡属纯装饰，去掉后新旧两组不再同时可见，重叠彻底消失。
    if (isTransition) {
        gameState.leaves.forEach(leaf => leaf.element.remove());
        gameState.oldLeaves.forEach(leaf => leaf.element.remove());
        gameState.oldLeaves = [];
    } else {
        leafContainer.innerHTML = '';
    }
    gameState.leaves = [];

    // 2. Select randomly the attributes of the new trial
    const colors = ['green', 'orange'];
    gameState.currentColor = colors[Math.floor(Math.random() * colors.length)];
    
    const dirs = ['up', 'down', 'left', 'right'];
    gameState.currentPointing = dirs[Math.floor(Math.random() * dirs.length)];
    gameState.currentMoving = dirs[Math.floor(Math.random() * dirs.length)];

    // 3. Spawn 5 scattered leaves
    const pointData = DIRECTIONS[gameState.currentPointing.toUpperCase()];
    const moveData = DIRECTIONS[gameState.currentMoving.toUpperCase()];

    LEAF_SPAWN_OFFSETS.forEach(offset => {
        // Compute base scattered positions
        let targetX = (offset.x / 100) * boardWidth;
        let targetY = (offset.y / 100) * boardHeight;

        // Add small random noise
        targetX += (Math.random() - 0.5) * 40;
        targetY += (Math.random() - 0.5) * 30;

        // Initial coordinates — 直接落在 target 位置
        //    旧实现让新叶子从移动反方向 300px/200px 处入，再靠 setTimeout 在 10ms 后
        //    强制跳回 target（见下方原注释），会造成 1 帧位置不连续，且入场路径
        //    刚好穿过旧组尚未完全消失的位置，进一步加剧绿+橙重叠。
        //    去掉 slide-out 后，新组直接显示在 target，与旧组的过渡冲突一并消除。
        const initX = targetX;
        const initY = targetY;

        // Create DOM element
        const div = document.createElement('div');
        div.className = `leaf-element ${gameState.currentColor}-leaf`;
        div.innerHTML = LEAF_SVG;
        div.style.transform = `rotate(${pointData.deg}deg)`;
        div.style.left = `${initX - leafW / 2}px`;
        div.style.top = `${initY - leafH / 2}px`;
        leafContainer.appendChild(div);

        // Save leaf data
        const leafObj = {
            element: div,
            x: initX,
            y: initY,
            pointing: gameState.currentPointing,
            moving: gameState.currentMoving,
            opacity: 1.0
        };

        gameState.leaves.push(leafObj);
    });

    gameState.trialStartTime = performance.now();
}

function processPlayResponse(userInputDir) {
    const rt = performance.now() - gameState.trialStartTime;
    
    // Correct target is based on leaf color
    const targetDir = (gameState.currentColor === 'green') ? gameState.currentPointing : gameState.currentMoving;
    const isCorrect = (userInputDir === targetDir);
    
    // Determine whether this was a task-switch trial (changed rule color from previous trial)
    let isSwitch = false;
    if (gameState.records.length > 0) {
        const lastRecord = gameState.records[gameState.records.length - 1];
        isSwitch = (lastRecord.rule !== gameState.currentColor);
    }
    
    // Save record log
    gameState.records.push({
        rule: gameState.currentColor,
        congruent: (gameState.currentPointing === gameState.currentMoving),
        isSwitch: isSwitch,
        correct: isCorrect,
        rt: rt
    });

    // Flash and Audio feedback
    if (isCorrect) {
        synth.play('correct');
        triggerFlash('correct');
        
        // Multiplier & scoring calculations
        const gained = 50 * gameState.multiplier;
        gameState.score += gained;
        animateScoreTo(gameState.score);
        spawnScorePopup(gained);
        spawnHitParticles(gameState.currentColor === 'green' ? '#58c27a' : '#ff9f43');
        
        gameState.streak++;
        if (gameState.streak >= 4) {
            gameState.streak = 0;
            if (gameState.multiplier < 10) {
                gameState.multiplier++;
                synth.play('levelup');
                if (gameState.multiplier > gameState.peakMultiplier) {
                    gameState.peakMultiplier = gameState.multiplier;
                }
                spawnComboToast(`倍率提升 x${gameState.multiplier}！`);
                const multiplierWrap = multiplierDisplay.closest('.multiplier-display');
                if (multiplierWrap) {
                    multiplierWrap.classList.remove('burst');
                    void multiplierWrap.offsetWidth;
                    multiplierWrap.classList.add('burst');
                }
            }
        }
    } else {
        synth.play('incorrect');
        triggerFlash('incorrect');
        gameBoard.classList.add('shake');
        setTimeout(() => gameBoard.classList.remove('shake'), 300);
        
        // Decrement multiplier on error
        gameState.streak = 0;
        if (gameState.multiplier > 1) {
            gameState.multiplier--;
        }
    }

    // Refresh multiplier displays
    multiplierDisplay.innerText = `${gameState.multiplier}x`;
    updateMultiplierMeterUI();

    // Spawn next set
    generateTrialLeaves(true);
}

function updateMultiplierMeterUI() {
    const dots = multiplierMeter.children;
    for (let i = 0; i < 4; i++) {
        if (i < gameState.streak) {
            dots[i].classList.add('active');
        } else {
            dots[i].classList.remove('active');
        }
    }
}

// ── UI 反馈增强：得分数字滚动、飘字、连击提示、命中粒子 ─────────────────────

// 数字滚动到目标分数，取代生硬的瞬时赋值
function animateScoreTo(newScore) {
    const start = parseInt(scoreDisplay.dataset.raw || '0', 10);
    if (start === newScore) {
        scoreDisplay.innerText = newScore.toLocaleString();
        scoreDisplay.dataset.raw = String(newScore);
        return;
    }
    const duration = 260;
    const startTime = performance.now();
    function tick(now) {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = Math.round(start + (newScore - start) * eased);
        scoreDisplay.innerText = val.toLocaleString();
        if (t < 1) {
            requestAnimationFrame(tick);
        } else {
            scoreDisplay.dataset.raw = String(newScore);
        }
    }
    requestAnimationFrame(tick);
}

// 答对时在游戏区中央飘出 "+分数"
function spawnScorePopup(points) {
    const el = document.createElement('div');
    el.className = 'score-popup';
    el.textContent = `+${points}`;
    gameBoard.appendChild(el);
    setTimeout(() => el.remove(), 900);
}

// 倍率提升时弹出的连击提示条
function spawnComboToast(text) {
    const el = document.createElement('div');
    el.className = 'combo-toast';
    el.textContent = text;
    gameBoard.appendChild(el);
    setTimeout(() => el.remove(), 950);
}

// 答对时向四周迸发的小粒子
function spawnHitParticles(color) {
    const count = 7;
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const dist = 55 + Math.random() * 35;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;

        const p = document.createElement('div');
        p.className = 'hit-particle';
        p.style.setProperty('--pdx', `${dx}px`);
        p.style.setProperty('--pdy', `${dy}px`);
        p.style.setProperty('--pcolor', color);
        gameBoard.appendChild(p);
        setTimeout(() => p.remove(), 650);
    }
}

function triggerFlash(type) {
    const flashClass = type === 'correct' ? 'flash-correct' : 'flash-incorrect';
    flashOverlay.className = 'flash-overlay';
    void flashOverlay.offsetWidth; // Force CSS repaint to re-trigger transition
    flashOverlay.classList.add(flashClass);
    setTimeout(() => {
        flashOverlay.classList.remove(flashClass);
    }, 180);
}

// ── 反应力报告计算引擎 ──────────────────────────────────────────────────────

// 等级元数据：S/A/B 三档
const RANK_META = {
    S: {
        title: '🎉反应力等级：S｜超敏捷',
        tag: '超敏捷·反应小天才',
        slogan: '原来我是反应小天才🥳'
    },
    A: {
        title: '✨反应力等级：A｜稳定在线',
        tag: '稳扎稳打·状态在线',
        slogan: '我的反应力状态还不错～'
    },
    B: {
        title: '💪反应力等级：B｜有待提升',
        tag: '潜力选手·多多练习',
        slogan: '反应力还有很大的成长空间💪'
    }
};

// 判定反应力等级
// 输入：avgRt(平均正确反应时ms), accuracy(正确率%), switchCost(切换损耗ms)
function calcRank(avgRt, accuracy, switchCost) {
    if (avgRt > 0 && avgRt < 800 && accuracy >= 85 && switchCost < 200) return 'S';
    if (avgRt > 0 && avgRt < 1200 && accuracy >= 70) return 'A';
    return 'B';
}

// 四大能力评价（返回 {valueText, evalText}）
function evalSpeed(avgRepeatRt) {
    if (avgRepeatRt <= 0) return { valueText: '—', evalText: '数据不足' };
    if (avgRepeatRt < 700) return { valueText: avgRepeatRt + 'ms', evalText: '偏快' };
    if (avgRepeatRt <= 1000) return { valueText: avgRepeatRt + 'ms', evalText: '正常' };
    return { valueText: avgRepeatRt + 'ms', evalText: '可以再练练' };
}

function evalAccuracy(accuracy) {
    if (accuracy >= 85) return { valueText: accuracy + '%', evalText: '很稳定' };
    if (accuracy >= 70) return { valueText: accuracy + '%', evalText: '偶尔失误' };
    return { valueText: accuracy + '%', evalText: '容易判断出错' };
}

function evalSwitch(switchCost) {
    if (switchCost <= 0) return { valueText: '0ms', evalText: '灵活' };
    if (switchCost < 150) return { valueText: '+' + switchCost + 'ms', evalText: '灵活' };
    if (switchCost <= 350) return { valueText: '+' + switchCost + 'ms', evalText: '普通' };
    return { valueText: '+' + switchCost + 'ms', evalText: '切换有点吃力' };
}

function evalFocus(totalQuestions) {
    if (totalQuestions >= 15) return { valueText: totalQuestions + '题', evalText: '专注力在线' };
    if (totalQuestions >= 10) return { valueText: totalQuestions + '题', evalText: '略有波动' };
    return { valueText: totalQuestions + '题', evalText: '容易注意力涣散' };
}

// 找出最短板维度，用于个性化解读和训练建议
// 返回短板key: 'speed' | 'accuracy' | 'switch' | 'focus' | null(全优)
function findWeakness(speedEval, accuracyEval, switchEval, focusEval) {
    const weakSet = new Set(['可以再练练', '容易判断出错', '切换有点吃力', '容易注意力涣散']);
    if (weakSet.has(speedEval)) return 'speed';
    if (weakSet.has(switchEval)) return 'switch';
    if (weakSet.has(accuracyEval)) return 'accuracy';
    if (weakSet.has(focusEval)) return 'focus';
    return null;
}

// 个性化解读文案（根据等级+短板，精简单行版）
function getInterpretText(rank, weakness) {
    if (rank === 'S') return '又快又稳，切换自如，天赋很不错✨';
    if (rank === 'A') {
        if (weakness === 'switch') return '反应不错，规则切换还可以再加强';
        if (weakness === 'accuracy') return '手速很快，判断再稳一点就更好';
        return '表现稳定，继续保持可向S级冲刺';
    }
    // B级
    if (weakness === 'speed') return '多练短时训练，慢慢提升反应速度';
    if (weakness === 'switch') return '多练切换题，提升思维转场灵敏度';
    return '反应力可以训练，从每天3分钟开始';
}

// 训练建议文案（根据短板，精简版）
function getTipContent(weakness) {
    switch (weakness) {
        case 'speed': return '多做2-3分钟短时快速反应训练，锻炼瞬时手速。';
        case 'switch': return '多练习规则频繁切换的关卡，提升思维转场灵敏度。';
        case 'accuracy': return '答题不要太心急，适当放缓节奏，减少冲动误触。';
        case 'focus': return '短时间集中训练，疲劳时停止，保护注意力状态。';
        default: return '继续保持日常轻量训练，维持你的灵敏反应力！';
    }
}

// ── Game Over & Statistics Calculation ─────────────────────────────────────
function endGame() {
    stopGameLoops();
    synth.stopBGM(); // 游戏结束进入报告页，暂停背景音
    synth.play('gameover');

    // Basic calculation metrics
    const totalTrials = gameState.records.length;
    const correctTrials = gameState.records.filter(r => r.correct).length;
    const accuracy = totalTrials > 0 ? Math.round((correctTrials / totalTrials) * 100) : 0;

    // Filter correct trials for latency calculations
    const correctRecords = gameState.records.filter(r => r.correct);

    // Average RT
    const avgRt = correctRecords.length > 0
        ? Math.round(correctRecords.reduce((sum, r) => sum + r.rt, 0) / correctRecords.length)
        : 0;

    // Repeat trials (same rule color as preceding trial)
    const repeatTrials = correctRecords.filter(r => !r.isSwitch);
    const avgRepeatRt = repeatTrials.length > 0
        ? Math.round(repeatTrials.reduce((sum, r) => sum + r.rt, 0) / repeatTrials.length)
        : 0;

    // Switch trials (changed rule color from preceding trial)
    const switchTrials = correctRecords.filter(r => r.isSwitch);
    const avgSwitchRt = switchTrials.length > 0
        ? Math.round(switchTrials.reduce((sum, r) => sum + r.rt, 0) / switchTrials.length)
        : 0;

    // Task-switching cost
    const switchCost = (avgRepeatRt > 0 && avgSwitchRt > 0)
        ? Math.max(0, avgSwitchRt - avgRepeatRt)
        : 0;

    // 最快单次反应时间
    const fastestRt = correctRecords.length > 0
        ? Math.round(Math.min.apply(null, correctRecords.map(r => r.rt)))
        : 0;

    // ── 反应力报告计算 ──
    const rank = calcRank(avgRt, accuracy, switchCost);
    const rankMeta = RANK_META[rank];

    const speedResult = evalSpeed(avgRepeatRt || avgRt);
    const accuracyResult = evalAccuracy(accuracy);
    const switchResult = evalSwitch(switchCost);
    const focusResult = evalFocus(totalTrials);

    const weakness = findWeakness(speedResult.evalText, accuracyResult.evalText, switchResult.evalText, focusResult.evalText);
    const interpret = getInterpretText(rank, weakness);
    const tip = getTipContent(weakness);

    // ── 渲染结束页 ──
    rankTitle.innerText = rankMeta.title;
    rankTag.innerText = rankMeta.tag;
    interpretText.innerText = interpret;

    abilitySpeedVal.innerText = speedResult.valueText;
    abilitySpeedEval.innerText = speedResult.evalText;
    abilityAccuracyVal.innerText = accuracyResult.valueText;
    abilityAccuracyEval.innerText = accuracyResult.evalText;
    abilitySwitchVal.innerText = switchResult.valueText;
    abilitySwitchEval.innerText = switchResult.evalText;
    abilityFocusVal.innerText = focusResult.valueText;
    abilityFocusEval.innerText = focusResult.evalText;

    subScoreVal.innerText = gameState.score.toLocaleString();
    subPeakVal.innerText = gameState.peakMultiplier + 'x';
    subFastestVal.innerText = fastestRt > 0 ? fastestRt + 'ms' : '—';

    tipContent.innerText = tip;

    // 保存快照供分享使用（含完整报告字段）
    shareSnapshot = {
        score: gameState.score,
        accuracy: accuracy,
        peakMultiplier: gameState.peakMultiplier,
        switchCost: switchCost,
        total: totalTrials,
        avgRt: avgRt,
        avgRepeatRt: avgRepeatRt,
        fastestRt: fastestRt,
        rank: rank,
        rankTitle: rankMeta.title,
        rankTag: rankMeta.tag,
        slogan: rankMeta.slogan,
        speedEval: speedResult.evalText,
        accuracyEval: accuracyResult.evalText,
        switchEval: switchResult.evalText,
        focusEval: focusResult.evalText,
        interpretText: interpret,
        tipContent: tip,
        speedValue: speedResult.valueText,
        accuracyValue: accuracyResult.valueText,
        switchValue: switchResult.valueText,
        focusValue: focusResult.valueText
    };

    // 预渲染分享图（避免首次点击时 canvas 渲染 + postNote 初始化叠加导致延迟）
    try {
        const preCanvas = renderShareCard(shareSnapshot);
        shareSnapshot.shareImageDataUrl = preCanvas.toDataURL('image/png');
    } catch (e) {
        console.warn('pre-render share card failed:', e);
    }

    // 保存最近一次完整报告到 localStorage（供首页"我的反应力报告"查看）
    try {
        const reportToSave = {
            ...shareSnapshot,
            date: new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        };
        localStorage.setItem('float_last_report', JSON.stringify(reportToSave));
    } catch (e) {
        console.warn('save report failed:', e);
    }

    showScreen('gameOverScreen');
    ensureShareButton();
}

// ── 我的反应力报告（首页入口 + 详情页） ───────────────────────────────────

// 首页：报告按钮一直显示，无需控制显隐
function renderReportEntry() {
    // 按钮默认显示，无需额外操作
}

// 显示报告详情页（从 localStorage 读取最近一次完整报告）
function showReport() {
    let data = null;
    try {
        data = JSON.parse(localStorage.getItem('float_last_report') || 'null');
    } catch (e) {
        data = null;
    }
    if (!data) {
        if (reportHint) reportHint.style.display = 'block';
        return;
    }
    if (reportHint) reportHint.style.display = 'none';

    reportDate.innerText = data.date || '最近测试';
    reportRankTitle.innerText = data.rankTitle || '';
    reportRankTag.innerText = data.rankTag || '';
    reportInterpretText.innerText = data.interpretText || '';

    reportSpeedVal.innerText = data.speedValue || (data.avgRt + 'ms');
    reportSpeedEval.innerText = data.speedEval || '';
    reportAccuracyVal.innerText = data.accuracyValue || (data.accuracy + '%');
    reportAccuracyEval.innerText = data.accuracyEval || '';
    reportSwitchVal.innerText = data.switchValue || ('+' + data.switchCost + 'ms');
    reportSwitchEval.innerText = data.switchEval || '';
    reportFocusVal.innerText = data.focusValue || (data.total + '题');
    reportFocusEval.innerText = data.focusEval || '';

    reportSubScore.innerText = data.score ? data.score.toLocaleString() : '—';
    reportSubPeak.innerText = data.peakMultiplier ? data.peakMultiplier + 'x' : '—';
    reportSubFastest.innerText = data.fastestRt ? data.fastestRt + 'ms' : '—';

    reportTipContent.innerText = data.tipContent || '';

    showScreen('reportScreen');
}

// ── Interactive Tutorial Engine ────────────────────────────────────────────
function startTutorial() {
    gameState.tutStep = 1;
    gameState.tutConsecutiveCorrect = 0;
    showScreen('tutorialScreen');
    showTutorialStep();
}

function showTutorialStep() {
    // Deactivate all steps
    document.querySelectorAll('.tutorial-step').forEach(el => el.classList.remove('active'));

    const stepEl = document.getElementById(`step${gameState.tutStep}`);
    if (stepEl) stepEl.classList.add('active');

    if (gameState.tutStep === 1) {
        // Step 1: Green leaves (pointing UP, moving LEFT)
        renderStaticTutorialLeaf('tutLeaf1', 'green', 'up', 'left');
    } else if (gameState.tutStep === 2) {
        // Step 2: Orange leaves (pointing UP, moving LEFT)
        renderStaticTutorialLeaf('tutLeaf2', 'orange', 'up', 'left');
    } else if (gameState.tutStep === 3) {
        // Step 3: Interactive practice mode
        resetTutorialPracticeDots();
        generateTutorialPracticeTrial();
    }
}

function renderStaticTutorialLeaf(containerId, color, pointing, moving) {
    const box = document.getElementById(containerId);
    box.innerHTML = '';

    const pointData = DIRECTIONS[pointing.toUpperCase()];
    const moveData = DIRECTIONS[moving.toUpperCase()];

    // Generate 3 leaves flowing inside preview
    const positions = [
        { x: 30, y: 35 },
        { x: 50, y: 45 },
        { x: 70, y: 35 }
    ];

    positions.forEach(pos => {
        const div = document.createElement('div');
        div.className = `leaf-element ${color}-leaf`;
        div.innerHTML = LEAF_SVG;
        
        // absolute positioning inside the box
        div.style.left = `${pos.x}%`;
        div.style.top = `${pos.y}%`;
        div.style.transform = `translate(-50%, -50%) rotate(${pointData.deg}deg)`;
        
        // Add a gentle floating animation inside preview
        div.style.animation = `floatPreview 3s ease-in-out infinite alternate`;
        box.appendChild(div);
    });
}

// Add floats style rules dynamically to document head for tutorial previews
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes floatPreview {
    0% { transform: translate(-50%, -50%) translate(-8px, -5px) rotate(0deg); }
    100% { transform: translate(-50%, -50%) translate(8px, 5px) rotate(2deg); }
}
`;
document.head.appendChild(styleSheet);

function generateTutorialPracticeTrial() {
    const box = document.getElementById('tutPracticeLeaf');
    box.innerHTML = '';

    const colors = ['green', 'orange'];
    gameState.tutPracticeColor = colors[Math.floor(Math.random() * colors.length)];

    const dirs = ['up', 'down', 'left', 'right'];
    gameState.tutPracticePointing = dirs[Math.floor(Math.random() * dirs.length)];
    gameState.tutPracticeMoving = dirs[Math.floor(Math.random() * dirs.length)];

    // Target answer depends on color
    gameState.tutPracticeTarget = (gameState.tutPracticeColor === 'green') ? gameState.tutPracticePointing : gameState.tutPracticeMoving;

    const pointData = DIRECTIONS[gameState.tutPracticePointing.toUpperCase()];
    
    // Spawn 1 leaf in center of practice box
    const div = document.createElement('div');
    div.className = `leaf-element ${gameState.tutPracticeColor}-leaf`;
    div.innerHTML = LEAF_SVG;
    div.style.left = '50%';
    div.style.top = '45%';
    div.style.transform = `translate(-50%, -50%) rotate(${pointData.deg}deg)`;
    box.appendChild(div);

    // Apply soft movement indicator path in practice mode
    // (since it's a static box, we add an arrow pointing in the direction of movement or drift it)
    let driftX = 0, driftY = 0;
    const moveData = DIRECTIONS[gameState.tutPracticeMoving.toUpperCase()];
    let driftTimer = setInterval(() => {
        if (gameState.activeScreen !== 'tutorialScreen' || gameState.tutStep !== 3) {
            clearInterval(driftTimer);
            return;
        }
        driftX += moveData.dx * 1.5;
        driftY += moveData.dy * 1.5;
        
        // Reset when drifts too far
        if (Math.abs(driftX) > 60 || Math.abs(driftY) > 60) {
            driftX = 0;
            driftY = 0;
        }
        div.style.transform = `translate(calc(-50% + ${driftX}px), calc(-50% + ${driftY}px)) rotate(${pointData.deg}deg)`;
    }, 30);

    // Save timer reference on DOM element to clear it when replacing
    box.dataset.timerId = driftTimer;
}

function processTutorialPracticeResponse(userInputDir) {
    const box = document.getElementById('tutPracticeLeaf');
    if (box.dataset.timerId) {
        clearInterval(parseInt(box.dataset.timerId));
    }

    const isCorrect = (userInputDir === gameState.tutPracticeTarget);
    const feedback = document.getElementById('tutFeedback');

    if (isCorrect) {
        synth.play('correct');
        feedback.innerText = '答对了，继续！';
        feedback.className = 'feedback-indicator correct';
        gameState.tutConsecutiveCorrect++;

        // Update progress dots
        const dots = document.querySelectorAll('.practice-progress .dot');
        if (gameState.tutConsecutiveCorrect <= 3) {
            dots[gameState.tutConsecutiveCorrect - 1].classList.add('filled');
        }

        if (gameState.tutConsecutiveCorrect >= 3) {
            setTimeout(() => {
                feedback.innerText = '太棒了！马上开始…';
                setTimeout(() => {
                    synth.startBGM(); // 教学完成自动开始游戏，启动背景音
                    initGame();
                }, 900);
            }, 500);
            return;
        }
    } else {
        synth.play('incorrect');
        
        // Tell player what rule they missed
        if (gameState.tutPracticeColor === 'green') {
            feedback.innerText = '答错了，绿叶要看「指向」';
        } else {
            feedback.innerText = '答错了，橙叶要看「移动」';
        }
        
        feedback.className = 'feedback-indicator incorrect';
        gameState.tutConsecutiveCorrect = 0;
        resetTutorialPracticeDots();
    }

    // Next practice trial
    setTimeout(() => {
        generateTutorialPracticeTrial();
    }, 1000);
}

function resetTutorialPracticeDots() {
    const dots = document.querySelectorAll('.practice-progress .dot');
    dots.forEach(dot => dot.classList.remove('filled'));
    const feedback = document.getElementById('tutFeedback');
    feedback.innerText = '练习：向对应方向滑动';
    feedback.className = 'feedback-indicator';
}

// ── Bind Screen Actions ────────────────────────────────────────────────────
btnStartGame.addEventListener('click', () => {
    synth.init();
    synth.startBGM(); // 启动背景音效，全程循环播放
    initGame();
});

btnStartTutorial.addEventListener('click', () => {
    synth.init();
    startTutorial();
});

btnSkipTutorial.addEventListener('click', () => {
    synth.startBGM(); // 跳过教学直接开始游戏，启动背景音
    initGame();
});

// 对局中的快捷操作：重开一局 / 回首页
btnInGameRestart.addEventListener('click', () => {
    synth.startBGM(); // 游戏内重新开始，确保背景音播放
    initGame();
});

btnInGameHome.addEventListener('click', () => {
    stopGameLoops(); // 终止游戏进行
    synth.stopBGM(); // 返回首页，停止背景音
    showScreen('welcomeScreen');
});

btnRestartGame.addEventListener('click', () => {
    synth.startBGM(); // 重新挑战，恢复背景音
    initGame();
});

btnBackToMenu.addEventListener('click', () => {
    showScreen('welcomeScreen');
});

// 报告详情页按钮
if (reportBackBtn) {
    reportBackBtn.addEventListener('click', () => {
        showScreen('welcomeScreen');
    });
}
if (reportRetestBtn) {
    reportRetestBtn.addEventListener('click', () => {
        synth.init();
        synth.startBGM(); // 再测一次，恢复背景音
        initGame();
    });
}
if (reportShareBtn) {
    reportShareBtn.addEventListener('click', () => {
        let data = null;
        try {
            data = JSON.parse(localStorage.getItem('float_last_report') || 'null');
        } catch (e) {
            data = null;
        }
        if (data) handleShare(reportShareBtn, data);
    });
}

// 首页「我的反应力报告」按钮
if (viewReportBtn) {
    viewReportBtn.addEventListener('click', showReport);
}

// 分享按钮统一处理：loading状态防止重复点击，提升首次点击响应感知
async function handleShare(btn, snapshot) {
    if (!snapshot || btn.disabled) return;
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = '分享中...';
    try {
        await shareReport(snapshot);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// 通用分享函数：根据报告数据生成分享图并调用小红书 postNote
async function shareReport(snapshot) {
    if (!snapshot) return;
    const miniTool = window.xhs?.miniTool;
    if (!miniTool) return;
    try {
        // 优先使用预生成的分享图（游戏结束时已渲染），没有则实时生成
        const dataUrl = snapshot.shareImageDataUrl || (() => {
            const canvas = renderShareCard(snapshot);
            return canvas.toDataURL('image/png');
        })();
        const content =
            '60秒挑战完成！来看看我的反应力报告 ✨\n' +
            snapshot.slogan + '\n' +
            `反应力等级：${snapshot.rank}｜反应速度：${snapshot.avgRt}ms\n` +
            `判断准确度：${snapshot.accuracy}%｜切换灵活性：${snapshot.switchEval}\n` +
            '绿叶看指向 · 橙叶看移动 🍃';
        await miniTool.postNote({
            title: '飘 · 60秒测测你的反应力',
            content: content,
            pageType: 'photo_publish',
            mediaInfo: { image_resources: [{ url: dataUrl }] }
        });
    } catch (e) {
        console.warn('share report failed:', e);
    }
}

// 分享战绩：渲染战绩卡片 → postNote（data:uri 直接作为图片资源）
if (btnShareResult) {
    btnShareResult.addEventListener('click', () => {
        handleShare(btnShareResult, shareSnapshot);
    });
}

// 非小红书容器环境：结算页和报告页不显示分享按钮
function ensureShareButton() {
    const inMiniTool = !!window.xhs?.miniTool;
    if (btnShareResult) btnShareResult.style.display = inMiniTool ? '' : 'none';
    if (reportShareBtn) reportShareBtn.style.display = inMiniTool ? '' : 'none';
}

// ── Share Card Renderer（反应力人设海报） ────────────────────────────────────
function renderShareCard(snapshot) {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');

    // 深海渐变背景
    const bgGrad = ctx.createRadialGradient(360, 380, 60, 360, 600, 700);
    bgGrad.addColorStop(0, '#0d3663');
    bgGrad.addColorStop(1, '#03152b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 水流装饰线
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 180);
    ctx.quadraticCurveTo(180, 130, 360, 180);
    ctx.quadraticCurveTo(540, 230, 720, 180);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 1020);
    ctx.quadraticCurveTo(180, 970, 360, 1020);
    ctx.quadraticCurveTo(540, 1070, 720, 1020);
    ctx.stroke();

    // 顶部 logo 绿叶
    drawLeaf(ctx, 360, 170, 90, 117, '#58c27a', '#319451', '#a7f0bd', 0);

    // 产品名
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 34px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText('飘 · 60秒测测你的反应力', 360, 300);

    // 分隔线
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 345);
    ctx.lineTo(520, 345);
    ctx.stroke();

    // 海报主标题
    ctx.font = '500 24px -apple-system, "PingFang SC", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('我的反应力报告', 360, 400);

    // 等级展示（大卡片）
    const rankCardX = 100, rankCardY = 440, rankCardW = 520, rankCardH = 130;
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath();
    ctx.roundRect(rankCardX, rankCardY, rankCardW, rankCardH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 等级标题
    ctx.font = 'bold 36px -apple-system, "PingFang SC", sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(snapshot.rankTitle, 360, rankCardY + 50);
    // 等级标签
    ctx.font = '500 22px -apple-system, "PingFang SC", sans-serif';
    ctx.fillStyle = '#a7f0bd';
    ctx.fillText(snapshot.rankTag, 360, rankCardY + 95);

    // 四大能力精简列表
    const abilities = [
        { icon: '⚡', label: '反应速度', value: snapshot.avgRt + 'ms' },
        { icon: '🎯', label: '判断准确度', value: snapshot.accuracy + '%' },
        { icon: '🔄', label: '切换灵活性', value: snapshot.switchEval },
        { icon: '🧠', label: '连续专注力', value: snapshot.total + '题' }
    ];

    const listStartY = 620;
    const rowH = 82;
    abilities.forEach((ab, i) => {
        const y = listStartY + i * rowH;
        // 行背景
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.roundRect(120, y, 480, 68, 14);
        ctx.fill();

        // icon
        ctx.font = '28px -apple-system, "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(ab.icon, 150, y + 38);

        // label
        ctx.font = '500 20px -apple-system, "PingFang SC", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(ab.label, 200, y + 38);

        // value
        ctx.font = 'bold 26px -apple-system, "PingFang SC", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.fillText(ab.value, 570, y + 38);
        ctx.textAlign = 'center';
    });

    // 传播 slogan（核心可晒文案）
    ctx.font = 'bold 28px -apple-system, "PingFang SC", sans-serif';
    ctx.fillStyle = '#58c27a';
    ctx.fillText(snapshot.slogan, 360, 1000);

    // 底部氛围感文案
    ctx.font = '500 18px -apple-system, "PingFang SC", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText('绿叶看指向 · 橙叶看移动', 360, 1050);
    ctx.fillText('测一测，看看你的反应力是什么样✨', 360, 1085);

    return canvas;
}

function drawLeaf(ctx, cx, cy, w, h, leftColor, rightColor, stemColor, deg) {
    ctx.save();
    const halfW = w / 2, halfH = h / 2;
    ctx.translate(cx, cy);
    ctx.rotate(deg * Math.PI / 180);
    ctx.translate(-halfW, -halfH);
    // 路径基于 100x130 绘制（含叶柄），按目标尺寸等比缩放
    ctx.scale(w / 100, h / 130);

    // 与首页 logo / 游戏内叶片完全同源的 SVG 路径，直接复用同一路径数据绘制
    const pOutline = new Path2D('M 50,110 C 20,90 15,50 50,10 C 85,50 80,90 50,110 Z');
    const pLeft = new Path2D('M 50,110 C 20,90 15,50 50,10 Z');
    const pRight = new Path2D('M 50,10 C 85,50 80,90 50,110 Z');
    const pStem = new Path2D('M 50,110 L 50,120');

    // 左右半叶（左亮右暗）
    ctx.fillStyle = leftColor;
    ctx.fill(pLeft);
    ctx.fillStyle = rightColor;
    ctx.fill(pRight);

    // 中脉
    ctx.strokeStyle = stemColor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(50, 110);
    ctx.lineTo(50, 10);
    ctx.stroke();

    // 叶柄
    ctx.lineWidth = 6.5;
    ctx.stroke(pStem);

    // 白色描边：与首页 logo 一致，缺少这一层会让叶片看起来"缺一圈"、轮廓不完整
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.stroke(pOutline);
    ctx.stroke(pStem);

    ctx.restore();
}

// Stepper next clicks
document.querySelectorAll('.btn-next-step').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const nextStep = e.target.getAttribute('data-next');
        if (nextStep === 'step2') {
            gameState.tutStep = 2;
        } else if (nextStep === 'step3') {
            gameState.tutStep = 3;
        }
        showTutorialStep();
    });
});

// App initialization
window.addEventListener('load', () => {
    showScreen('welcomeScreen');
});

// ── Automated Test Exposure Hook API ───────────────────────────────────────
window.getGameState = function() {
    return {
        activeScreen: gameState.activeScreen,
        gameActive: gameState.gameActive,
        currentColor: gameState.currentColor,
        currentPointing: gameState.currentPointing,
        currentMoving: gameState.currentMoving,
        score: gameState.score,
        multiplier: gameState.multiplier,
        timeLeft: gameState.timeLeft,
        records: gameState.records,
        tutStep: gameState.tutStep,
        tutConsecutiveCorrect: gameState.tutConsecutiveCorrect,
        tutPracticeTarget: gameState.tutPracticeTarget
    };
};

window.simulateKeyInput = function(dir) {
    handleInput(dir);
};
