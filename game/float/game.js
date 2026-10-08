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
            // 国际标准倒计时读秒：干净短促的"哔"（1kHz 正弦，设备/相机倒计时音色）
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1000.00, now);
            gainNode.gain.setValueAtTime(0.18, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'final') {
            // 最后 1 秒：标准长音"哔——"收尾（经典倒计时 T-0 长音）
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1000.00, now);
            gainNode.gain.setValueAtTime(0.20, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.60);
            osc.start(now);
            osc.stop(now + 0.60);
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

// ── 测评参数：受控试次生成（保证指标可算、结果可比） ──────────────────────
const TEST_CONFIG = {
    warmupCount: 3,          // 前 N 题热身：只练不计分，不入统计
    responseWindowMs: 1500,  // 单题响应窗口：对齐 Ebb & Flow 紧凑节奏（原版~1s，手机滑动留裕量取1.5s）；超时自动跳题并计为异常
    minRTAnticipation: 150,  // RT 低于此值视为预期反应/误触（视觉反应时下限）
    maxValidRT: 3000,        // 统计清洗：超过此值的正确 RT 剔除
    phaseTiming: [10, 40],   // 适应段结束秒 / 核心段结束秒（之后进入压力段）
    switchRatio: { adapt: 0.15, core: 0.30, pressure: 0.45 },   // 切换试次目标概率
    conflictRatio: { adapt: 0.15, core: 0.50, pressure: 0.70 }  // 冲突试次目标概率
};

// 受控试次生成：阶段渐进 + 切换受控（连续同色≤3）+ 冲突配比 + 四向均衡
function pickNextTrial(prev) {
    const elapsed = (performance.now() - gameState.sessionStartTime) / 1000;
    let phase = 'core';
    if (elapsed < TEST_CONFIG.phaseTiming[0]) phase = 'adapt';
    else if (elapsed < TEST_CONFIG.phaseTiming[1]) phase = 'core';
    else phase = 'pressure';
    gameState.phase = phase;

    const isWarmup = gameState.trialIndex < TEST_CONFIG.warmupCount;

    // ── 1. 任务类型（颜色）：切换概率按阶段，连续同色强制切换 ──
    let color, isSwitch = false;
    if (!prev) {
        color = Math.random() < 0.5 ? 'green' : 'orange';
    } else {
        const forceSwitch = (gameState.sameColorStreak || 0) >= 3;
        const wantSwitch = Math.random() < TEST_CONFIG.switchRatio[phase];
        if (forceSwitch || wantSwitch) {
            color = (prev.color === 'green') ? 'orange' : 'green';
            isSwitch = true;
        } else {
            color = prev.color;
        }
    }
    if (prev && prev.color === color) {
        gameState.sameColorStreak = (gameState.sameColorStreak || 0) + 1;
    } else {
        gameState.sameColorStreak = 0;
    }

    // ── 2. 指向：从使用最少的方向中选（四向均衡，避免方向偏好） ──
    const pointing = pickBalancedDirection(gameState.directionUsage);
    gameState.directionUsage[pointing]++;

    // ── 3. 移动：按阶段冲突概率生成（冲突 = 指向≠移动） ──
    let moving;
    if (Math.random() < TEST_CONFIG.conflictRatio[phase]) {
        const others = ['up', 'down', 'left', 'right'].filter(function (d) { return d !== pointing; });
        moving = others[Math.floor(Math.random() * others.length)];
    } else {
        moving = pointing;
    }

    return {
        color: color, pointing: pointing, moving: moving,
        isSwitch: isSwitch, isConflict: (moving !== pointing),
        phase: phase, isWarmup: isWarmup
    };
}

function pickBalancedDirection(usage) {
    const keys = Object.keys(usage);
    let min = Infinity, best = [];
    keys.forEach(function (k) {
        if (usage[k] < min) { min = usage[k]; best = [k]; }
        else if (usage[k] === min) { best.push(k); }
    });
    return best[Math.floor(Math.random() * best.length)];
}

// ── Game State variables ───────────────────────────────────────────────────
let gameState = {
    activeScreen: 'welcomeScreen',
    
    // Core game parameters
    score: 0,
    multiplier: 1,
    streak: 0,
    peakMultiplier: 1,
    timeLeft: 60,
    lastBeepSec: 6,
    timerInterval: null,
    gameActive: false,
    
    // Performance metrics
    records: [], // items: { rule:'green'|'orange', congruent:bool, isSwitch:bool, correct:bool, rt:ms|null, phase:'adapt'|'core'|'pressure', warmup:bool, anomalous:'anticipation'|'timeout'|null }
    
    // Trial parameters
    currentColor: 'green', // 'green' (pointing) or 'orange' (moving)
    currentPointing: 'up',
    currentMoving: 'up',
    trialStartTime: 0,
    
    // 测评受控生成状态
    trialIndex: 0,          // 已生成试次序号（含 warm-up）
    phase: 'adapt',         // 当前阶段 adapt/core/pressure
    sameColorStreak: 0,     // 连续同色计数（强制切换用）
    directionUsage: { up: 0, down: 0, left: 0, right: 0 }, // 指向方向均衡
    currentTrialMeta: null, // 当前试次生成元数据 {color,pointing,moving,isSwitch,isConflict,phase,isWarmup}
    lastTrialMeta: null,    // 上一试次生成元数据
    responseTimer: null,    // 单题超时窗口 timer
    timeoutCount: 0,        // 超时试次数
    sessionStartTime: 0,    // 本局开始时间（暂停时顺延）
    pausedAt: null,         // 页面隐藏暂停时刻
    
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

// 报告页分享数据内存缓存：进入页面时预渲染分享图、预构建文案，
// 点击分享时零准备、直接同步调用 postNote（避免首次点击时渲染/解析/清洗导致容器吞掉手势）
let cachedReportShare = null;

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
const reportRingOuter = document.getElementById('reportRingOuter');
const reportRingMid = document.getElementById('reportRingMid');
const reportRingInner = document.getElementById('reportRingInner');
const reportRingA = document.getElementById('reportRingA');
const reportRingB = document.getElementById('reportRingB');
const reportIndexValue = document.getElementById('reportIndexValue');
const reportValidity = document.getElementById('reportValidity');
const reportTipContent = document.getElementById('reportTipContent');
const reportMiniTrend = document.getElementById('reportMiniTrend');
const reportProcessLabel = document.getElementById('reportProcessLabel');
const reportFocusCurve = document.getElementById('reportFocusCurve');
const reportDiagnosis = document.getElementById('reportDiagnosis');
const reportBackBtn = document.getElementById('reportBackBtn');
const reportRetestBtn = document.getElementById('reportRetestBtn');
const reportShareBtn = document.getElementById('reportShareBtn');

// Game Over — 测评报告面板元素（人话报告）
const rankHero = document.getElementById('rankHero');
const rankTitle = document.getElementById('rankTitle');
const rankTag = document.getElementById('rankTag');
const goTestTime = document.getElementById('goTestTime');
const goRingOuter = document.getElementById('goRingOuter');
const goRingMid = document.getElementById('goRingMid');
const goRingInner = document.getElementById('goRingInner');
const goIndexValue = document.getElementById('goIndexValue');
const goMiniTrend = document.getElementById('goMiniTrend');
const goInsightList = document.getElementById('goInsightList');
const goValidity = document.getElementById('goValidity');
const goTipContent = document.getElementById('goTipContent');
const goProReportBtn = document.getElementById('goProReportBtn');

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
    disarmResponseWindow();
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
    if (e.repeat) return; // 防连打：长按方向键只算一次
    if (DIR_KEYS[e.key]) {
        e.preventDefault(); // Stop window scrolling
        handleInput(DIR_KEYS[e.key]);
    }
});

// 页面切走自动暂停：保护计时与 RT 数据不被"切后台"污染
document.addEventListener('visibilitychange', () => {
    if (!gameState.gameActive) return;
    if (document.hidden) {
        gameState.pausedAt = performance.now();
        stopGameTimer();
        disarmResponseWindow();
        synth.stopBGM();
    } else if (gameState.pausedAt) {
        const pausedDur = performance.now() - gameState.pausedAt;
        gameState.sessionStartTime += pausedDur; // 阶段判定基于有效测试时间
        gameState.pausedAt = null;
        startGameTimer();
        armResponseWindow();
        synth.startBGM();
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

// ── 计时器：独立启停，支持页面切走暂停 ────────────────────────────────────
function startGameTimer() {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
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
            gameBoard.classList.add('board-urgency');
            // 按整数秒边界触发读秒（ceil 计数器，跨秒必触发，绝不漏拍）
            const whole = Math.ceil(gameState.timeLeft);
            if (whole !== gameState.lastBeepSec) {
                gameState.lastBeepSec = whole;
                synth.play(whole <= 1 ? 'final' : 'tick');
            }
        } else {
            gameState.lastBeepSec = 6;
            gameBoard.classList.remove('board-urgency');
        }
    }, 100);
}

function stopGameTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

// 单题响应窗口：超时自动跳题并计为异常试次
function armResponseWindow() {
    disarmResponseWindow();
    gameState.responseTimer = setTimeout(() => {
        if (!gameState.gameActive) return;
        const meta = gameState.currentTrialMeta || {};
        gameState.timeoutCount++;
        gameState.records.push({
            rule: gameState.currentColor,
            congruent: (gameState.currentPointing === gameState.currentMoving),
            isSwitch: !!meta.isSwitch,
            correct: false,
            rt: null,
            phase: gameState.phase,
            warmup: !!meta.isWarmup,
            anomalous: 'timeout'
        });
        gameState.lastTrialMeta = meta;
        // Warm-up 超时静默，正式题给负反馈
        if (!meta.isWarmup) {
            synth.play('incorrect');
            triggerFlash('incorrect');
            // 超时视同答错：对齐原版，重置连击与乘数
            gameState.streak = 0;
            gameState.multiplier = 1;
            multiplierDisplay.innerText = '1x';
            updateMultiplierMeterUI();
        }
        generateTrialLeaves(true);
    }, TEST_CONFIG.responseWindowMs);
}

function disarmResponseWindow() {
    if (gameState.responseTimer) {
        clearTimeout(gameState.responseTimer);
        gameState.responseTimer = null;
    }
}

// ── Game Core Loop & Initialization ────────────────────────────────────────
function initGame() {
    stopGameLoops();
    warmupBridge();
    
    gameState.score = 0;
    gameState.multiplier = 1;
    gameState.streak = 0;
    gameState.peakMultiplier = 1;
    gameState.timeLeft = 60;
    gameState.lastBeepSec = 6;
    gameState.gameActive = true;
    gameState.records = [];
    
    // 测评状态重置
    gameState.trialIndex = 0;
    gameState.phase = 'adapt';
    gameState.sameColorStreak = 0;
    gameState.directionUsage = { up: 0, down: 0, left: 0, right: 0 };
    gameState.currentTrialMeta = null;
    gameState.lastTrialMeta = null;
    gameState.timeoutCount = 0;
    gameState.pausedAt = null;
    gameState.sessionStartTime = performance.now();
    
    scoreDisplay.innerText = '0';
    scoreDisplay.dataset.raw = '0';
    multiplierDisplay.innerText = '1x';
    updateMultiplierMeterUI();
    timerDisplay.innerText = '60s';
    timerDisplay.classList.remove('critical');
    gameBoard.classList.remove('board-urgency');
    timerBarFill.style.width = '100%';
    timerBarFill.classList.remove('warning');
    
    showScreen('playingScreen');
    
    startGameTimer();
    
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

    // 2. 受控生成新试次（阶段渐进 + 切换/冲突配比 + 四向均衡）
    const trial = pickNextTrial(gameState.lastTrialMeta);
    gameState.currentTrialMeta = trial;
    gameState.currentColor = trial.color;
    gameState.currentPointing = trial.pointing;
    gameState.currentMoving = trial.moving;
    gameState.trialIndex++;

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
    armResponseWindow();
}

function processPlayResponse(userInputDir) {
    disarmResponseWindow(); // 本题已响应，关闭超时窗口

    const rt = performance.now() - gameState.trialStartTime;
    const meta = gameState.currentTrialMeta || {};
    const isWarmup = !!meta.isWarmup;

    // Correct target is based on leaf color
    const targetDir = (gameState.currentColor === 'green') ? gameState.currentPointing : gameState.currentMoving;
    const isCorrect = (userInputDir === targetDir);

    // 异常分类：RT 低于视觉反应时下限视为预期反应/误触
    let anomalous = null;
    if (rt < TEST_CONFIG.minRTAnticipation) anomalous = 'anticipation';

    // Save record log（isSwitch 取生成时受控判定，比事后比较更准）
    gameState.records.push({
        rule: gameState.currentColor,
        congruent: (gameState.currentPointing === gameState.currentMoving),
        isSwitch: !!meta.isSwitch,
        correct: isCorrect,
        rt: rt,
        phase: gameState.phase,
        warmup: isWarmup,
        anomalous: anomalous
    });
    gameState.lastTrialMeta = meta;

    // Flash and Audio feedback
    if (isCorrect) {
        synth.play('correct');
        triggerFlash('correct');
        
        // Warm-up 题：只反馈不计分，不参与倍率/连击
        if (!isWarmup) {
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
        }
    } else {
        synth.play('incorrect');
        triggerFlash('incorrect');
        gameBoard.classList.add('shake');
        setTimeout(() => gameBoard.classList.remove('shake'), 300);
        
        // Decrement multiplier on error（Warm-up 不惩罚）——对齐原版：答错重置 ×1
        if (!isWarmup) {
            gameState.streak = 0;
            gameState.multiplier = 1;
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

// 等级元数据：五档测评评级（S/A/B/C/D），分享海报沿用
const RANK_META = {
    S: { letter: 'S', label: '优秀', title: '反应力等级：优秀', tag: '反应敏捷·发挥出色', slogan: '我的反应力发挥出色' },
    A: { letter: 'A', label: '良好', title: '反应力等级：良好', tag: '状态不错·发挥稳定', slogan: '我的反应力状态不错' },
    B: { letter: 'B', label: '中等', title: '反应力等级：中等', tag: '水平中等·有提升空间', slogan: '反应力还有提升空间' },
    C: { letter: 'C', label: '偏弱', title: '反应力等级：偏弱', tag: '偏弱·建议加强训练', slogan: '反应力有点弱，开始练起来' },
    D: { letter: 'D', label: '待提升', title: '反应力等级：待提升', tag: '待提升·坚持每日轻量训练', slogan: '每天一点点，反应力练起来' }
};

// 等级标题前的线描图标（与四维能力同源风格，随 S/A/B/C/D 等级切换）
// S=奖牌、A=对勾圆环、B=上升趋势、C=缺口圆环、D=下降趋势；路径同时用于 HTML SVG 与分享卡 Path2D
const RANK_TITLE_ICON_PATHS = {
    S: 'M12 2a6 6 0 1 0 0 12a6 6 0 1 0 0-12 M15.477 12.89 17 22l-5-3-5 3 1.523-9.11',
    A: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01 9 11.01',
    B: 'M23 6 13.5 15.5 8.5 10.5 1 18 M17 6 23 6 23 12',
    C: 'M21 12a9 9 0 1 1-9-9 M21 12 23 12',
    D: 'M1 7l6 6 4-4 12 12 M17 21 23 21 23 15'
};

// 解读/口号/页脚处的小星标（4 角 sparkle 与 5 角 star），仅用于分享卡 Canvas 绘制
const SHARE_SPARK_PATH = 'M12 2l2.2 5.8L20 10l-5.8 2.2L12 18l-2.2-5.8L4 10l5.8-2.2z';
const SHARE_STAR_PATH = 'M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2';

// ══════════════════════════════════════════════════════════════════════════
// 测评统计引擎：清洗 → 中位数 → 指标 → 综合指数 → 有效性 → 人话解读
// ══════════════════════════════════════════════════════════════════════════

// 中位数（抗离群，对比均值更稳）
function median(arr) {
    if (!arr || !arr.length) return 0;
    const sorted = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// 分段线性标准化：按折线点把原始值映射到 0-100 分
function lerpScore(value, points) {
    if (!points || !points.length) return 0;
    const v = Number(value);
    if (v <= points[0][0]) return points[0][1];
    for (let i = 1; i < points.length; i++) {
        if (v <= points[i][0]) {
            const x0 = points[i - 1][0], y0 = points[i - 1][1];
            const x1 = points[i][0], y1 = points[i][1];
            return Math.round(y0 + (v - x0) / (x1 - x0) * (y1 - y0));
        }
    }
    return points[points.length - 1][1];
}

// 各分项标准化折线（x 升序；speed/switch/inhib/cv 越低越好，accuracy 越高越好）
const SCORE_POINTS = {
    speed:    [[500, 100], [700, 90], [1000, 75], [1300, 60], [1600, 45], [2000, 30], [3000, 15]],
    accuracy: [[0, 15], [60, 50], [75, 70], [90, 90], [100, 100]],
    switch:   [[0, 95], [50, 90], [150, 72], [300, 55], [600, 35], [1000, 15]],
    inhib:    [[0, 95], [50, 90], [150, 72], [300, 55], [600, 35], [1000, 15]],
    cv:       [[0, 100], [0.25, 90], [0.4, 72], [0.6, 50], [1.0, 30]]
};

// 综合指数 → 五档评级
function rankFromIndex(idx) {
    if (idx >= 85) return 'S';
    if (idx >= 70) return 'A';
    if (idx >= 55) return 'B';
    if (idx >= 40) return 'C';
    return 'D';
}

// 核心统计：从 gameState.records 计算全部测评指标
function computeStats() {
    const formal = gameState.records.filter(function (r) { return !r.warmup; }); // 正式试次（剔除热身）
    const formalCount = formal.length;

    // 异常试次：超时 / 预期反应 / 超上限 RT
    const anomalies = formal.filter(function (r) {
        return r.anomalous === 'timeout' || r.anomalous === 'anticipation' || (r.rt !== null && r.rt > TEST_CONFIG.maxValidRT);
    });
    const anomalyRate = formalCount > 0 ? Math.round(anomalies.length / formalCount * 100) : 0;

    // 有效试次（剔除异常）与正确试次
    const valid = formal.filter(function (r) { return !r.anomalous && r.rt !== null && r.rt <= TEST_CONFIG.maxValidRT; });
    const correct = valid.filter(function (r) { return r.correct; });
    const correctCount = correct.length;
    const accuracy = valid.length > 0 ? Math.round(correctCount / valid.length * 100) : 0;

    // 反应速度：正确试次中位 RT
    const medianRt = correct.length > 0 ? Math.round(median(correct.map(function (r) { return r.rt; }))) : 0;
    const fastestRt = correct.length > 0 ? Math.round(Math.min.apply(null, correct.map(function (r) { return r.rt; }))) : 0;

    // 切换损耗：切换 − 重复（中位数差）；样本不足 4 题为 null
    const rep = correct.filter(function (r) { return !r.isSwitch; });
    const sw = correct.filter(function (r) { return r.isSwitch; });
    let switchCost = null;
    if (rep.length >= 4 && sw.length >= 4) {
        switchCost = Math.max(0, Math.round(median(sw.map(function (r) { return r.rt; })) - median(rep.map(function (r) { return r.rt; }))));
    }

    // 抑制损耗：冲突 − 一致（中位数差）
    const cong = correct.filter(function (r) { return r.congruent; });
    const conf = correct.filter(function (r) { return !r.congruent; });
    let inhibCost = null;
    if (cong.length >= 4 && conf.length >= 4) {
        inhibCost = Math.max(0, Math.round(median(conf.map(function (r) { return r.rt; })) - median(cong.map(function (r) { return r.rt; }))));
    }

    // 反应稳定性：CV = SD / Mean
    const rtArr = correct.map(function (r) { return r.rt; });
    let cv = null;
    if (rtArr.length >= 8) {
        const mean = rtArr.reduce(function (s, v) { return s + v; }, 0) / rtArr.length;
        const sd = Math.sqrt(rtArr.reduce(function (s, v) { return s + (v - mean) * (v - mean); }, 0) / rtArr.length);
        cv = Math.round(sd / mean * 100) / 100;
    }

    // 冲动指数：答错中位 RT 明显快于答对 → 抢答倾向
    const wrong = valid.filter(function (r) { return !r.correct; });
    let impulse = false, impulseCount = 0;
    if (wrong.length >= 3 && correct.length >= 3) {
        const wrongMed = median(wrong.map(function (r) { return r.rt; }));
        if (wrongMed < medianRt - 80) { impulse = true; impulseCount = wrong.length; }
    }

    // 疲劳信号：压力段准确率 − 核心段准确率（负值=下滑）
    let fatigueDrop = null;
    const core = valid.filter(function (r) { return r.phase === 'core'; });
    const pressure = valid.filter(function (r) { return r.phase === 'pressure'; });
    if (core.length >= 6 && pressure.length >= 4) {
        const coreAcc = core.filter(function (r) { return r.correct; }).length / core.length * 100;
        const pressAcc = pressure.filter(function (r) { return r.correct; }).length / pressure.length * 100;
        fatigueDrop = Math.round(pressAcc - coreAcc);
    }

    // ── 过程表现：从答题序列深挖 60 秒内的专注与自控信号（全为本局实测） ──
    // 序列口径：答对=成功；答错/超时/预期反应=失误；按答题顺序逐题判定
    let maxStreak = 0, maxErrStreak = 0, recRate = null, focusDrop = null;
    const seq = formal.map(function (r) { return r.correct === true; });
    let curOk = 0, curErr = 0;
    seq.forEach(function (ok) {
        curOk = ok ? curOk + 1 : 0;
        curErr = ok ? 0 : curErr + 1;
        if (curOk > maxStreak) maxStreak = curOk;
        if (curErr > maxErrStreak) maxErrStreak = curErr;
    });
    // 错后恢复率：失误后下一题立即答对的比例（体现情绪自控与抗挫节奏）
    if (maxErrStreak > 0) {
        let recBase = 0, recHit = 0;
        for (let i = 0; i < seq.length - 1; i++) {
            if (!seq[i]) { recBase++; if (seq[i + 1]) recHit++; }
        }
        recRate = recBase > 0 ? Math.round(recHit / recBase * 100) : null;
    }
    // 专注保持：有效试次按序均分前后半程，比较正确率（后半 − 前半）
    if (valid.length >= 12) {
        const half = Math.floor(valid.length / 2);
        const h1 = valid.slice(0, half);
        const h2 = valid.slice(valid.length - half);
        const a1 = h1.filter(function (r) { return r.correct; }).length / h1.length * 100;
        const a2 = h2.filter(function (r) { return r.correct; }).length / h2.length * 100;
        focusDrop = Math.round(a2 - a1);
    }

    // 分项分数
    const sSpeed = medianRt > 0 ? lerpScore(medianRt, SCORE_POINTS.speed) : 0;
    const sAcc = lerpScore(accuracy, SCORE_POINTS.accuracy);
    const sSwitch = switchCost !== null ? lerpScore(switchCost, SCORE_POINTS.switch) : null;
    const sInhib = inhibCost !== null ? lerpScore(inhibCost, SCORE_POINTS.inhib) : null;
    const sCv = cv !== null ? lerpScore(cv, SCORE_POINTS.cv) : null;

    // 综合指数：速度30 + 准确25 + 切换20 + 稳定15 + 抑制10（抑制样本不足时权重并入切换）
    let index = 0;
    if (medianRt > 0 && valid.length > 0) {
        let wSwitch = 20, wInhib = 10;
        if (sInhib === null) { wSwitch += wInhib; wInhib = 0; }
        const total = 30 + 25 + wSwitch + 15 + wInhib;
        index = Math.round((
            sSpeed * 30 + sAcc * 25 +
            (sSwitch !== null ? sSwitch : sSpeed) * wSwitch +
            (sCv !== null ? sCv : sSpeed) * 15 +
            (sInhib !== null ? sInhib : 0) * wInhib
        ) / total);
    }

    // 数据充分性与可信度
    const sampleOK = valid.length >= 20;
    const reliable = sampleOK && anomalyRate <= 30;

    // 短板：分项中最低且低于 75 分的维度
    const cands = [];
    if (medianRt > 0) cands.push({ k: 'speed', v: sSpeed });
    cands.push({ k: 'accuracy', v: sAcc });
    if (sSwitch !== null) cands.push({ k: 'switch', v: sSwitch });
    if (sCv !== null) cands.push({ k: 'stability', v: sCv });
    if (sInhib !== null) cands.push({ k: 'inhibition', v: sInhib });
    let weakest = null;
    if (cands.length) {
        cands.sort(function (a, b) { return a.v - b.v; });
        if (cands[0].v < 75) weakest = cands[0].k;
    }

    return {
        formalCount: formalCount, anomalyRate: anomalyRate, validCount: valid.length,
        correctCount: correctCount, accuracy: accuracy,
        medianRt: medianRt, fastestRt: fastestRt,
        switchCost: switchCost, inhibCost: inhibCost, cv: cv,
        impulse: impulse, impulseCount: impulseCount, fatigueDrop: fatigueDrop,
        sSpeed: sSpeed, sAcc: sAcc, sSwitch: sSwitch, sInhib: sInhib, sCv: sCv,
        index: index, sampleOK: sampleOK, reliable: reliable, weakest: weakest,
        maxStreak: maxStreak, maxErrStreak: maxErrStreak, recRate: recRate, focusDrop: focusDrop,
        timeoutCount: gameState.timeoutCount,
        score: gameState.score, peakMultiplier: gameState.peakMultiplier
    };
}

// 人话解读图标（SVG path，key → 图标与主题色）
const INSIGHT_ICONS = {
    speed:    { c: '#38bdf8', path: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z' },
    accuracy: { c: '#34d399', path: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 2v4 M12 18v4 M2 12h4 M18 12h4' },
    switch:   { c: '#a78bfa', path: 'M17 1l4 4-4 4 M3 11V9a4 4 0 0 1 4-4h14 M7 23l-4-4 4-4 M21 13v2a4 4 0 0 1-4 4H3' },
    fatigue:  { c: '#fb923c', path: 'M12 2s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z' },
    impulse:  { c: '#fbbf24', path: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2' }
};

// 人话解读：每条都引用本次实测数值，返回结构化 {key, tag, text, main, sub}
// 文案刻意精简（≤18 字），保证分享卡与报告页都能单行完整显示、不换行；
// main/sub 为结算页 3 卡横排拆解（主数值醒目 + 短注），text 保持分享卡/报告页整句
function buildInsights(stats) {
    const list = [];
    if (stats.medianRt > 0) {
        const rt = stats.medianRt;
        const sec = (rt / 1000).toFixed(2);
        // 绝对区间描述（不引入人群对比）：基于选择反应任务的一般参考区间
        const speedDesc = rt < 450 ? '反应很快' : (rt < 600 ? '反应不错' : (rt < 750 ? '反应一般' : '反应偏慢'));
        list.push({ key: 'speed', tag: '手速', main: sec + ' 秒/题', sub: speedDesc, text: '平均 ' + sec + ' 秒/题，' + speedDesc });
    }
    if (stats.accuracy > 0) {
        const base = { key: 'accuracy', tag: '正确', main: stats.correctCount + '/' + stats.validCount + ' 题' };
        if (stats.accuracy >= 90) {
            list.push(Object.assign({}, base, { sub: stats.accuracy + '% · 发挥很稳', text: stats.correctCount + '/' + stats.validCount + ' 题（' + stats.accuracy + '%），发挥很稳' }));
        } else if (stats.accuracy >= 75) {
            list.push(Object.assign({}, base, { sub: stats.accuracy + '% · 整体稳定', text: stats.correctCount + '/' + stats.validCount + ' 题（' + stats.accuracy + '%），整体稳定' }));
        } else {
            list.push(Object.assign({}, base, { sub: stats.accuracy + '% · 容易看错规则', text: stats.correctCount + '/' + stats.validCount + ' 题（' + stats.accuracy + '%），容易看错规则' }));
        }
    }
    if (stats.switchCost !== null) {
        const base = { key: 'switch', tag: '切换' };
        if (stats.switchCost < 50) {
            list.push(Object.assign({}, base, { main: '几乎不拖慢', sub: '切换很流畅', text: '规则切换几乎不拖慢你' }));
        } else if (stats.switchCost < 150) {
            list.push(Object.assign({}, base, { main: '稍慢属正常', sub: '切换略慢一点点', text: '切换规则稍慢，属正常' }));
        } else if (stats.switchCost < 300) {
            list.push(Object.assign({}, base, { main: '切换明显变慢', sub: '建议专项练习', text: '切换规则明显变慢，可专项练' }));
        } else {
            list.push(Object.assign({}, base, { main: '切换比较吃力', sub: '建议先放慢', text: '切换比较吃力，建议先放慢' }));
        }
    }
    if (stats.fatigueDrop !== null && stats.fatigueDrop <= -8) {
        list.push({ key: 'fatigue', tag: '尾声', main: '有点疲劳', sub: '最后 20 秒出错偏多', text: '最后 20 秒出错偏多，有点疲劳' });
    }
    if (stats.impulse) {
        list.push({ key: 'impulse', tag: '节奏', main: stats.impulseCount + ' 次抢答', sub: '放稳一点更准', text: '有 ' + stats.impulseCount + ' 次抢答，放稳更准' });
    }
    return list;
}

// 渲染结算页"你这次的表现"：一行 3 个小卡（手速 / 准头 / 切换），仅本局数据
function renderInsightCards(container, list) {
    if (!container) return;
    container.innerHTML = '';
    if (!list || !list.length) {
        const empty = document.createElement('p');
        empty.className = 'insight-empty';
        empty.textContent = '有效样本偏少，本次结果仅供参考，建议再测一次。';
        container.appendChild(empty);
        return;
    }
    const keys = ['speed', 'accuracy', 'switch'];
    const wrap = document.createElement('div');
    wrap.className = 'insight-cards';
    keys.forEach(function (k) {
        let item = null;
        for (let i = 0; i < list.length; i++) { if (list[i].key === k) { item = list[i]; break; } }
        if (!item) return;
        const icon = INSIGHT_ICONS[k] || { c: '#94a3b8', path: 'M12 2l2.2 5.8L20 10l-5.8 2.2L12 18l-2.2-5.8L4 10l5.8-2.2z' };
        const card = document.createElement('div');
        card.className = 'insight-card';
        card.style.setProperty('--insight-c', icon.c);
        card.innerHTML = '<div class="ic-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + icon.path + '"/></svg><span>' + item.tag + '</span></div>' +
            '<div class="ic-main">' + (item.main || item.text) + '</div>' +
            '<div class="ic-sub">' + (item.sub || '') + '</div>';
        wrap.appendChild(card);
    });
    container.appendChild(wrap);
}

// 渲染单条解读卡片（图标 + 标签 + 人话文本）
function renderInsightItem(insight) {
    if (typeof insight === 'string') {
        // 兼容旧版字符串格式
        const li = document.createElement('li');
        li.className = 'insight-item';
        const body = document.createElement('div');
        body.className = 'insight-body';
        const p = document.createElement('p');
        p.className = 'insight-text';
        p.textContent = insight;
        body.appendChild(p);
        li.appendChild(body);
        return li;
    }
    const icon = INSIGHT_ICONS[insight.key] || { c: '#94a3b8', path: 'M12 2l2.2 5.8L20 10l-5.8 2.2L12 18l-2.2-5.8L4 10l5.8-2.2z' };
    const li = document.createElement('li');
    li.className = 'insight-item';
    li.style.setProperty('--insight-c', icon.c);
    const iconWrap = document.createElement('span');
    iconWrap.className = 'insight-icon';
    iconWrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + icon.path + '"/></svg>';
    const body = document.createElement('div');
    body.className = 'insight-body';
    const tag = document.createElement('span');
    tag.className = 'insight-tag';
    tag.textContent = insight.tag || '';
    const p = document.createElement('p');
    p.className = 'insight-text';
    p.textContent = insight.text || '';
    body.appendChild(tag);
    body.appendChild(p);
    li.appendChild(iconWrap);
    li.appendChild(body);
    return li;
}

// 指数环形仪表（Apple 健身三环风格）：外环手速 / 中环准头 / 内环切换，中央为等级字母与综合分
function setIndexRings(els, dims) {
    if (!els) return;
    const conf = [
        { el: els.outer, key: 'sSpeed', r: 54 },
        { el: els.mid, key: 'sAcc', r: 46 },
        { el: els.inner, key: 'sSwitch', r: 38 },
        { el: els.a, key: 'sInhib', r: 30 },
        { el: els.b, key: 'sCv', r: 22 }
    ];
    conf.forEach(function (c) {
        if (!c.el) return;
        const circ = 2 * Math.PI * c.r;
        c.el.style.strokeDasharray = String(circ.toFixed(1));
        const v = dims && dims[c.key] != null ? dims[c.key] : 0;
        const pct = Math.max(0, Math.min(100, v)) / 100;
        c.el.style.strokeDashoffset = String((circ * (1 - pct)).toFixed(1));
    });
}


// 迷你 5 点趋势（结算页圆环下方）：固定 5 个槽位、最新在右并高亮；
// 记录不足 5 次时，左侧空槽显示占位空心点；无历史时 5 个槽位全为占位
function renderMiniTrend(container, hist) {
    if (!container) return;
    const svg = container.querySelector('.mini-trend-svg');
    if (!svg) return;
    const recent = hist.slice(0, 5); // hist[0] = 本次（最新）
    const W = 200, H = 50, padL = 8, padR = 8, padT = 24, padB = 4;
    const step = (W - padL - padR) / 4;
    const slotX = function (i) { return Math.round(padL + i * step); };
    const yOf = function (v) { return Math.round(padT + (100 - v) / 100 * (H - padT - padB)); };
    const labelY = 11; // 分数固定置于顶部行，与分点保持稳定间距（最小 ≈6px）
    // 槽位映射：recent[j]（j=0 最新）→ 槽位 i = 4 - j，占位自动落在左侧空槽
    const slots = [null, null, null, null, null];
    recent.forEach(function (h, j) {
        const i = 4 - j;
        slots[i] = { v: h.index !== undefined ? h.index : 0 };
    });
    let svgHtml = '';
    // 连线：相邻实点（跳过占位）
    let prev = null;
    slots.forEach(function (s, i) {
        if (!s) return;
        const x = slotX(i), y = yOf(s.v);
        if (prev) {
            svgHtml += '<line class="mini-trend-link" x1="' + prev.x + '" y1="' + prev.y + '" x2="' + x + '" y2="' + y + '"/>';
        }
        prev = { x: x, y: y };
    });
    // 点：实点（小一档）/ 占位点；最新点稍大并高亮
    slots.forEach(function (s, i) {
        const x = slotX(i);
        if (s) {
            const y = yOf(s.v);
            const isNewest = (i === 4);
            svgHtml += '<circle class="mini-trend-dot' + (isNewest ? ' newest' : '') + '" cx="' + x + '" cy="' + y + '" r="' + (isNewest ? 3.8 : 2.6) + '"/>';
            if (isNewest) {
                svgHtml += '<text class="mini-trend-label" x="' + x + '" y="' + labelY + '" text-anchor="middle">' + s.v + '</text>';
            }
        } else {
            svgHtml += '<circle class="mini-trend-ph" cx="' + x + '" cy="' + yOf(50) + '" r="3"/>';
        }
    });
    svg.innerHTML = svgHtml;
}

// 针对性训练建议（基于短板）；文案刻意精简（≤22 字），保证分享卡与报告页单行完整显示
function buildAdvice(stats) {
    const diag = buildDiagnosis(stats);
    const dk = diag && diag.main ? diag.main.key : '';
    switch (dk) {
        case 'swift':
            return '挑战连续答对 5 题，看看连击能到哪！';
        case 'steady':
            return '下一局快一点点，看看能不能又稳又快！';
        case 'wavy':
            return '挑战连续 5 题不失手，看看状态能稳多久！';
        case 'impulse':
            return '给自己半秒判断，挑战一次又快又准！';
        case 'anxious':
            return '先稳住开局，看看能不能一路连下去！';
        case 'miss':
            return '看到答案就大胆出手，挑战一次零超时！';
        case 'random':
            return '先热一局手感，再来挑战真正的自己！';
        case 'low':
            return '准备好了再来一次，这次完整挑战到底！';
        case 'slow':
            return '下一局逐步提速，找到属于你的最佳节奏！';
        case 'normal':
            return '保持手感，挑战更长连击，看看能否突破自己！';
        case 'fatigue':
            return '练耐力：后半程保持节奏别掉速，3 天后复测。';
        default:
            return '保持现状：隔 2–3 天测一次，看趋势稳不稳。';
    }
}

// ── Game Over & Statistics Calculation ─────────────────────────────────────
// 根据等级给徽章容器切换配色 class（rank-s / rank-a / rank-b），并联动等级标题图标
function applyRankHeroClass(heroEl, rank) {
    if (!heroEl) return;
    heroEl.classList.remove('rank-s', 'rank-a', 'rank-b');
    heroEl.classList.add('rank-' + rank.toLowerCase());
    // 等级标题前的线描图标随等级切换（S=奖牌 A=对勾 B=上升）
    const icon = heroEl.querySelector('.rank-title-icon path');
    if (icon) {
        icon.setAttribute('d', RANK_TITLE_ICON_PATHS[rank] || RANK_TITLE_ICON_PATHS.A);
    }
    // 将当前等级强调色提升到所在屏幕，供解读星标等屏内元素取用
    const screenEl = heroEl.closest('.screen');
    if (screenEl) {
        const accentMap = { S: '#fbbf24', A: '#6ee7b7', B: '#93c5fd', C: '#f87171', D: '#94a3b8' };
        screenEl.style.setProperty('--rank-accent', accentMap[rank] || '#fbbf24');
    }
}

function endGame() {
    stopGameLoops();
    gameBoard.classList.remove('board-urgency');
    synth.stopBGM(); // 游戏结束进入报告页，暂停背景音
    synth.play('gameover');

    // ── 测评统计（清洗 → 中位数 → 指标 → 综合指数） ──
    const stats = computeStats();
    const rank = stats.index > 0 ? rankFromIndex(stats.index) : 'D';
    const rankMeta = RANK_META[rank];
    const insights = buildInsights(stats);
    const advice = buildAdvice(stats);
    const diag = buildDiagnosis(stats);

    const now = new Date();
    const dateStr = (now.getMonth() + 1) + '月' + now.getDate() + '日 ' +
        String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    // ── 渲染结论区：等级标题（等级字母入标题）+ 环形仪表（中央仅综合分） ──
    applyRankHeroClass(rankHero, rank);
    // 结算页结论与首页报告一致：同源画像（名 + 小标题 + 评语）
    rankTitle.innerText = diag.main.name;
    rankTag.innerText = diag.main.title;
    if (goVerdict) goVerdict.innerText = diag.main.verdict;
    if (goTestTime) goTestTime.innerText = dateStr;
    setIndexRings({ outer: goRingOuter, mid: goRingMid, inner: goRingInner }, {
        sSpeed: stats.sSpeed, sAcc: stats.sAcc, sSwitch: stats.sSwitch
    });
    if (goIndexValue) goIndexValue.innerText = stats.index;

    // ── 人话解读（本次实测数据生成，3 卡横排） ──
    if (goInsightList) {
        renderInsightCards(goInsightList, insights);
    }

    // ── 数据有效性（正常时不显示，异常时才人话提示） ──
    if (goValidity) {
        if (stats.reliable) {
            goValidity.textContent = '';
            goValidity.style.display = 'none';
        } else {
            const txt = stats.validCount < 20
                ? '这次答题中断较多，结果仅供参考，建议重新测一次'
                : '这次测试受干扰较多，结果仅供参考';
            goValidity.textContent = txt;
            goValidity.className = 'validity-note warn';
            goValidity.style.display = '';
        }
    }

    // ── 训练建议 ──
    if (goTipContent) goTipContent.innerText = advice;

    // ── 历史保存与迷你趋势（圆环下方 5 点，替换原"建议连续测 3 次取稳定值"） ──
    const hist = saveHistoryEntry(stats, rank, dateStr);
    if (goMiniTrend) renderMiniTrend(goMiniTrend, hist);

    // ── 分享快照（兼容旧分享卡字段 + 新测评字段） ──
    shareSnapshot = {
        score: stats.score,
        accuracy: stats.accuracy,
        peakMultiplier: stats.peakMultiplier,
        switchCost: stats.switchCost !== null ? stats.switchCost : 0,
        total: stats.validCount,
        avgRt: stats.medianRt,
        fastestRt: stats.fastestRt,
        index: stats.index,
        rank: rank,
        rankLetter: rankMeta.letter,
        rankLabel: rankMeta.label,
        rankTitle: rankMeta.title,
        rankTag: rankMeta.tag,
        slogan: rankMeta.slogan,
        interpretText: insights[0] || '本次测评完成，看看你的反应力水平',
        tipContent: advice,
        insights: insights,
        sSpeed: stats.sSpeed, sAcc: stats.sAcc, sSwitch: stats.sSwitch, sInhib: stats.sInhib, sCv: stats.sCv,
        diagName: diag.main.name,
        diagSub: diag.main.title,
        diagColor: diag.main.color,
        diagVerdict: diag.main.verdict,
        diagEvidence: buildEvidenceText(stats, diag),
        speedEval: stats.medianRt > 0 ? (stats.medianRt < 1000 ? '偏快' : '正常') : '',
        accuracyEval: stats.accuracy >= 85 ? '很稳定' : (stats.accuracy >= 70 ? '偶尔失误' : '容易判断出错'),
        switchEval: stats.switchCost !== null ? (stats.switchCost < 150 ? '灵活' : (stats.switchCost <= 350 ? '普通' : '有点吃力')) : '数据不足',
        focusEval: stats.validCount >= 20 ? '专注力在线' : '样本不足',
        speedValue: stats.medianRt > 0 ? stats.medianRt + 'ms' : '—',
        accuracyValue: stats.accuracy + '%',
        switchValue: stats.switchCost !== null ? (stats.switchCost > 0 ? '+' + stats.switchCost + 'ms' : '约 0ms') : '—',
        inhibValue: stats.inhibCost !== null ? (stats.inhibCost > 0 ? '+' + stats.inhibCost + 'ms' : '约 0ms') : '—',
        cvText: stats.cv !== null ? String(stats.cv) : '—',
        focusValue: stats.validCount + '题',
        // ── 过程表现（本轮深挖）：全为本局实测，无人群对比 ──
        maxStreak: stats.maxStreak,
        maxErrStreak: stats.maxErrStreak,
        recRate: stats.recRate,
        focusDrop: stats.focusDrop,
        seq: gameState.records.filter(function (r) { return !r.warmup; }).map(function (r) {
            if (r.correct === true) return 1;      // 答对
            if (r.anomalous) return -1;            // 异常（超时/预期反应）
            return 0;                              // 答错
        }),
        // 专注力情绪曲线：每题状态分（答对按 RT 相对中位评分，答错/连错/异常逐级走低）
        seqState: buildSeqState(gameState.records.filter(function (r) { return !r.warmup; }), stats.medianRt),
        // 趋势图用时（秒）：每题实际答题用时，异常题按 1.5s 上限计
        seqRt: gameState.records.filter(function (r) { return !r.warmup; }).map(function (r) {
            if (r.correct === true) return Math.min(1.5, (r.rt || 0) / 1000);
            if (r.anomalous) return 1.5;
            return Math.min(1.5, (r.rt || 0) / 1000);
        })
    };

    // 预渲染分享图（仅内存，不写入 localStorage，避免撑爆配额）
    try {
        const preCanvas = renderShareCard(shareSnapshot);
        shareSnapshot.shareImageDataUrl = exportShareCard(preCanvas);
    } catch (e) {
        console.warn('pre-render share card failed:', e);
    }

    // 立即预热分享图落盘：结算动画 + 用户阅读报告期间完成 writeTempFile，
    // 点击分享时 filePath 必已就绪（dataURL 直传在真机不可靠，filePath 才稳定）
    if (shareSnapshot.shareImageDataUrl) {
        prewarmShareImage(shareSnapshot);
    }

    // 保存最近一次结构化报告（不含分享图 base64；含人话解读与统计摘要）
    try {
        const reportToSave = Object.assign({}, shareSnapshot, {
            date: dateStr,
            rankLabel: rankMeta.label,
            insights: insights,
            advice: advice,
            stats: {
                validCount: stats.validCount, formalCount: stats.formalCount,
                anomalyRate: stats.anomalyRate, timeoutCount: stats.timeoutCount,
                sSpeed: stats.sSpeed, sAcc: stats.sAcc,
                sSwitch: stats.sSwitch, sInhib: stats.sInhib, sCv: stats.sCv,
                reliable: stats.reliable, sampleOK: stats.sampleOK,
                maxStreak: stats.maxStreak, maxErrStreak: stats.maxErrStreak,
                recRate: stats.recRate, focusDrop: stats.focusDrop,
                score: stats.score, peakMultiplier: stats.peakMultiplier,
                accuracy: stats.accuracy, medianRt: stats.medianRt,
                impulse: stats.impulse, impulseCount: stats.impulseCount,
                fatigueDrop: stats.fatigueDrop
            }
        });
        delete reportToSave.shareImageDataUrl;
        localStorage.setItem('float_last_report', JSON.stringify(reportToSave));
    } catch (e) {
        console.warn('save report failed:', e);
    }

    // 结算与报告同版式：直接渲染完整评测报告并进入报告页（无独立精简版）
    showReport();
    showScreen('reportScreen');
    ensureShareButton();
}

// ── 历史存储与趋势（无数据库 → 个人纵向常模） ─────────────────────────────
function loadHistory() {
    try {
        const h = JSON.parse(localStorage.getItem('float_test_history_v2') || '[]');
        return Array.isArray(h) ? h : [];
    } catch (e) { return []; }
}

function saveHistoryEntry(stats, rank, dateStr) {
    try {
        const hist = loadHistory();
        hist.unshift({
            t: Date.now(), date: dateStr,
            index: stats.index, rank: rank,
            medianRt: stats.medianRt, accuracy: stats.accuracy,
            switchCost: stats.switchCost, cv: stats.cv,
            validCount: stats.validCount
        });
        if (hist.length > 30) hist.length = 30;
        localStorage.setItem('float_test_history_v2', JSON.stringify(hist));
        return hist;
    } catch (e) { return loadHistory(); }
}

// ── 我的反应力报告（首页入口 + 详情页） ───────────────────────────────────

// 彻底去除字符串中的系统表情（兼容历史 localStorage 中旧代码写入的带 emoji 文案）
function stripEmoji(str) {
    // 去除系统表情（Chrome 61 不支持 \p{Extended_Pictographic}，改用码点区间覆盖主要 emoji 区块）
    return String(str == null ? '' : str).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}]/gu, '');
}

// 清洗整份报告数据中所有字符串字段（rankTitle/slogan/interpretText/tipContent 等）
// 注意：shareImageDataUrl 是 base64（不含 emoji），跳过正则避免扫描大字符串拖慢分享
function sanitizeReportData(data) {
    if (!data || typeof data !== 'object') return data;
    const clean = {};
    for (const k in data) {
        if (k === 'shareImageDataUrl') { clean[k] = data[k]; continue; }
        clean[k] = typeof data[k] === 'string' ? stripEmoji(data[k]) : data[k];
    }
    return clean;
}

// 预渲染分享图并缓存（进入报告页时执行一次；结算页已在 endGame 预渲染）
function prepareSharePayload(data) {
    if (!data) return data;
    try {
        if (!data.shareImageDataUrl) {
            const c = renderShareCard(data);
            data.shareImageDataUrl = exportShareCard(c);
        }
    } catch (e) {
        console.warn('prepare share payload failed:', e);
    }
    return data;
}

// 首页：报告按钮一直显示，无需控制显隐
function renderReportEntry() {
    // 按钮默认显示，无需额外操作
}

// 渲染五维能力明细（专业报告页）：手速 / 准头 / 切换 / 抗扰 / 稳定，
// 每行 = 维度名 + 得分条 + 得分 + 原始值说明；维度与结算页 3 卡不同，更完整更专业

// 维度原始值说明（1 行人话，基于本次实测；专业页与结算页措辞互补）
function buildDimNote(key, data) {
    const st = data.stats || {};
    switch (key) {
        case 'speed': {
            const s = data.speedValue || '';
            const txt = pickFromInsight(data, 'speed', /反应很快|反应不错|反应一般|反应偏慢/);
            if (s === '—') return '数据不足';
            return '中位 ' + s + (txt ? ' · ' + txt : '');
        }
        case 'accuracy': {
            const v = data.accuracyValue || '';
            const txt = pickFromInsight(data, 'accuracy', /发挥很稳|整体稳定|容易看错规则/);
            return v !== '—' && txt ? '答对率 ' + v + ' · ' + txt : '数据不足';
        }
        case 'switch': {
            const v = data.switchValue || '';
            const txt = pickFromInsight(data, 'switch', /几乎不拖慢你|稍慢，属正常|可专项练|建议先放慢/);
            return v !== '—' && txt ? '切换耗时 ' + v + ' · ' + txt : '数据不足';
        }
        case 'inhib': {
            const v = data.inhibValue || '—';
            if (v === '—') return '数据不足';
            const cost = parseInt(v, 10) || 0;
            const txt = cost < 80 ? '抗干扰好，几乎不受反向题影响' : (cost < 200 ? '抗干扰正常' : '抗干扰偏弱，易受反向题干扰');
            return '反向题额外 ' + v + ' · ' + txt;
        }
        case 'cv': {
            const v = data.cvText || '—';
            if (v === '—') return '数据不足';
            const cv = parseFloat(v);
            const txt = cv < 0.25 ? '节奏稳定，发挥一致' : (cv < 0.4 ? '节奏略有起伏，属正常' : '节奏波动较大，稳定性待提升');
            return '稳定性 CV ' + v + ' · ' + txt;
        }
        default:
            return '';
    }
}

// 从对应维度的人话整句中提取短短语（避免专业页与结算页整句重复）
function pickFromInsight(data, key, regex) {
    const item = findInsight(data, key);
    if (!item || !item.text) return '';
    const m = String(item.text).match(regex);
    return m ? m[0] : '';
}

// ── 状态诊断：像体检报告一样给 60 秒表现"下判断" ──
// 框架来源：速度-准确权衡（Speed-Accuracy Tradeoff）、注意波动（attentional
// fluctuation）、错误后恢复（post-error recovery）、反应抑制（response
// inhibition）、心流（flow）。判定全部基于本局实测，无任何人群对比。

// 画像依据（评语下的证据小字，体检报告式，避免技术术语）
function buildEvidenceText(st, diag) {
    const parts = [];
    if (st.validCount > 0 && st.accuracy != null) parts.push('答对率' + Math.round(st.accuracy) + '%');
    if (st.maxStreak >= 3) parts.push('连对' + st.maxStreak + '题');
    if (st.recRate != null && st.recRate >= 40) parts.push('错后恢复' + Math.round(st.recRate) + '%');
    if (st.maxErrStreak >= 3) parts.push('连续失误' + st.maxErrStreak + '题');
    const text = parts.join(' · ');
    return text || (diag && diag.main && diag.main.evidenceFallback) || '本次数据完整有效';
}

function buildDiagnosis(st) {
    const acc = st.accuracy !== undefined ? st.accuracy : 0;
    const rt = st.medianRt || 0;
    const sec = rt > 0 ? (rt / 1000).toFixed(2) : null;
    const timeoutRate = st.formalCount > 0 ? Math.round((st.timeoutCount || 0) / st.formalCount * 100) : 0;
    const rec = st.recRate;
    const errStreak = st.maxErrStreak || 0;
    const focus = st.focusDrop;
    const valid = st.validCount || 0;

    // 依次判定（先命中即主导画像）
    let main = null;

    // 1) 参与度不足 / 状态游离：样本太少或大量超时错失
    if (valid < 15) {
        main = { key: 'low', name: '待机型', title: '状态待机 · 实力加载中', color: '#94a3b8',
            verdict: '这次有效作答较少，还不足以完整展现你的真实水平。',
            evidence: '有效' + valid + '题·中断' + st.anomalyRate + '%' };
    } else if (timeoutRate >= 20) {
        main = { key: 'miss', name: '临门型', title: '看得很准 · 及时出手', color: '#94a3b8',
            verdict: '不少题目判断都很准确，偶尔犹豫会错过最佳出手时机。',
            evidence: '超时' + (st.timeoutCount || 0) + '题·占' + timeoutRate + '%' };
    }
    // 2) 随机作答：正确率过低
    else if (acc < 55) {
        main = { key: 'random', name: '热身型', title: '慢慢进入状态 · 后劲更足', color: '#fbbf24',
            verdict: '这一局还没完全打开状态，真实水平还没有充分发挥出来。',
            evidence: '答对率' + acc + '%·' + (sec || '—') + '秒/题' };
    }
    // 3) 冲动抢答：错得又快又急
    else if (st.impulse && acc < 88) {
        main = { key: 'impulse', name: '抢先型', title: '敢抢敢答 · 反应够快', color: '#fb923c',
            verdict: '出手非常果断，速度是你的优势，有时也会快了一步。',
            evidence: '答对率' + acc + '%·' + (sec || '—') + '秒/题' };
    }
    // 4) 快准兼备
    else if (acc >= 90 && rt > 0 && rt <= 600) {
        main = { key: 'swift', name: '闪电型', title: '眼快手快 · 出手如闪电', color: '#38bdf8',
            verdict: '反应又快又准，这一局状态拉满，发挥很亮眼！',
            evidence: sec + '秒/题·答对率' + acc + '%' };
    }
    // 5) 稳健谨慎：慢而准（速度-准确权衡的"准确优先"端）
    else if (acc >= 90 && rt > 600) {
        main = { key: 'steady', name: '稳王型', title: '稳稳出手 · 实力不慌不忙', color: '#34d399',
            verdict: '这一局又稳又准，节奏保持得很好，发挥相当扎实！',
            evidence: sec + '秒/题·答对率' + acc + '%' };
    }
    // 7) 迟缓型：整体偏慢且一般（先于弹性型，避免被波动画像抢占）
    else if (rt > 800) {
        main = { key: 'slow', name: '蓄力型', title: '判断很稳 · 蓄力加速', color: '#94a3b8',
            verdict: '判断比较稳，出手速度还有空间，整体发挥偏向稳中求准。',
            evidence: sec + '秒/题·答对率' + acc + '%' };
    }
    // 6) 波动起伏但能自我修复
    else if (acc >= 70 && rec !== null && rec >= 60) {
        main = { key: 'wavy', name: '回弹型', title: '跌宕起伏 · 自我修复', color: '#a78bfa',
            verdict: '这一局有快有慢，但失误后总能很快找回状态，恢复力是你的优势。',
            evidence: '答对率' + acc + '%·' + (sec || '—') + '秒/题' };
    }
    // 7) 焦虑失焦：连错且难以恢复
    else if (rec !== null && rec < 60 || errStreak >= 3) {
        main = { key: 'anxious', name: '节奏型', title: '找到节奏 · 发挥更稳', color: '#f87171',
            verdict: '这一局状态有些起伏，连续失误后容易影响后面的节奏。',
            evidence: '答对率' + acc + '%·' + (sec || '—') + '秒/题' };
    }
    // 兜底：正常发挥
    else {
        main = { key: 'normal', name: '连击型', title: '全程在线 · 稳定高分', color: '#38bdf8',
            verdict: '整体发挥很均衡，没有明显短板，是很扎实的一局。',
            evidence: '平均 ' + (sec || '—') + ' 秒/题 · 答对率 ' + acc + '%' };
    }
    return { main: main };
}

// 渲染报告页"状态诊断"卡（体检报告口吻，位于环区之后、能力明细之前）
function renderDiagnosis(cardEl, data) {
    if (!cardEl) return;
    const st = data.stats || {};
    if (!st.validCount) { cardEl.style.display = 'none'; return; }
    const diag = buildDiagnosis(st);
    cardEl.style.display = '';
    cardEl.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'diag-card';
    // 画像区：名 + 小标题（圆环前）；评语与游戏成绩移到圆环图示后（与分享图同序）
    let html = '<div class="diag-name" style="color:' + diag.main.color + '">' + diag.main.name + '</div>' +
        '<div class="diag-sub">' + diag.main.title + '</div>';
    wrap.innerHTML = html;
    cardEl.appendChild(wrap);

    const bodyEl = document.getElementById('reportDiagBody');
    if (bodyEl) {
        bodyEl.innerHTML = '';
        const bwrap = document.createElement('div');
        bwrap.className = 'diag-card diag-card-body';
        let bhtml = '<p class="diag-verdict">' + diag.main.verdict + '</p>' +
            '<p class="diag-evidence">游戏成绩：' + buildEvidenceText(st, diag) + '</p>';
        bwrap.innerHTML = bhtml;
        bodyEl.appendChild(bwrap);
    }
}

// 每题状态分：答对按 RT 相对中位（快=高分，慢=降分，保底 55）；
// 答错=低谷（25 起，连错逐级加深）；超时/误触=最低（10 起）
// ── 60 秒过程剖析：专注力情绪曲线 + 4 项深挖指标（全为本局实测） ──
function buildSeqState(formal, medianRt) {
    let errRun = 0;
    return formal.map(function (r) {
        if (r.correct === true) {
            errRun = 0;
            const slow = Math.max(0, (r.rt || 0) - medianRt);
            return Math.max(55, Math.round(100 - slow / 12));
        }
        errRun++;
        if (r.anomalous) return Math.max(1, 10 - (errRun - 1) * 3);
        return Math.max(1, 25 - (errRun - 1) * 8);
    });
}

// 60 秒趋势图：X=60 秒时间轴，Y=每题答题用时（0~1.5s 上限），绿点=答对、红点=答错、灰点=超时/误触
// 一眼看懂：点越高越慢，点越低越快；绿多红少就是好状态
function renderFocusCurve(container, marks, rts) {
    if (!container || !Array.isArray(marks) || marks.length < 2) return;
    container.innerHTML = '';
    const W = 300, H = 96, padL = 36, padR = 10, padT = 20, padB = 20;
    const n = marks.length;
    const xOf = function (i) { return Math.round((padL + i / Math.max(1, n - 1) * (W - padL - padR)) * 10) / 10; };
    const xSec = function (sec) { return Math.round((padL + sec / 60 * (W - padL - padR)) * 10) / 10; };
    const yOf = function (sec) { return Math.round((padT + (1.5 - sec) / 1.5 * (H - padT - padB)) * 10) / 10; };

    let svg = '<svg class="focus-curve" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">';
    // 顶部 1.5s 上限参考线（淡实线）+ 左侧 Y 轴刻度（用时）
    svg += '<line class="fc-maxline" x1="' + padL + '" y1="' + padT + '" x2="' + (W - padR) + '" y2="' + padT + '"/>';
    svg += '<text class="fc-axis" x="' + 2 + '" y="' + 12 + '" text-anchor="start">用时</text>';
    [1.5, 1.0, 0.5].forEach(function (sec) {
        svg += '<text class="fc-axis" x="' + (padL - 5) + '" y="' + (yOf(sec) + 3) + '" text-anchor="end">' + sec + '</text>';
    });
    // 数据点：每题（绿=对/红=错/灰=超时误触），y=用时
    marks.forEach(function (m, i) {
        const sec = rts && rts[i] !== undefined ? Math.min(1.5, rts[i]) : 0.8;
        const cls = m === 0 ? 'err' : (m === -1 ? 'anom' : 'ok');
        svg += '<circle class="fc-dot ' + cls + '" cx="' + xOf(i) + '" cy="' + yOf(sec) + '" r="2.4"/>';
    });
    // 右上角图例：文字在前、色点在后，组间留间距（答对 / 答错 / 超时）
    const leg = [{ t: '答对', c: 'ok' }, { t: '答错', c: 'err' }, { t: '超时', c: 'anom' }];
    let lx = W - padR;
    for (let k = 0; k < leg.length; k++) {
        const tw = leg[k].t.length * 8;
        const w = tw + 18;
        lx -= w;
        svg += '<text class="fc-legendtext" x="' + lx + '" y="' + 12 + '" text-anchor="start">' + leg[k].t + '</text>';
        svg += '<circle class="fc-dot ' + leg[k].c + '" cx="' + (lx + tw + 6) + '" cy="' + 10 + '" r="2.2"/>';
    }
    // 底部时间轴：轴线 + 5 刻度 + 标签（0s/15s/30s/45s/60s）
    const axisY = H - padB + 2;
    svg += '<line class="fc-axisline" x1="' + padL + '" y1="' + axisY + '" x2="' + (W - padR) + '" y2="' + axisY + '"/>';
    [0, 15, 30, 45, 60].forEach(function (sec) {
        const tx = xSec(sec);
        svg += '<line class="fc-tick" x1="' + tx + '" y1="' + axisY + '" x2="' + tx + '" y2="' + (axisY + 4) + '"/>';
        svg += '<text class="fc-axis" x="' + tx + '" y="' + (H - 3) + '" text-anchor="middle">' + sec + 's</text>';
    });
    svg += '</svg>';
    container.innerHTML = svg;
}

// 过程指标行（4 项：最长连对 / 错后恢复 / 连续失误 / 专注保持，另附最高倍率）

// 渲染专业报告页"60 秒过程剖析"板块；旧数据无过程字段时返回 false 供调用方隐藏
function renderReportProcess(curveEl, data) {
    const st = data.stats || {};
    const hasState = Array.isArray(data.seqState) && data.seqState.length >= 2;
    const hasSeq = Array.isArray(data.seq) && data.seq.length >= 2;
    if (!hasState && !(st.maxStreak > 0)) return false;
    if (curveEl && hasState && hasSeq) {
        // 新存档直接用每题用时；旧存档无 seqRt 时按状态分反推（答对由状态分还原，答错取中位，异常取上限）
        let rts = data.seqRt;
        if (!rts || rts.length !== data.seq.length) {
            rts = data.seq.map(function (m, i) {
                if (m === 1) {
                    const slow = Math.max(0, (100 - data.seqState[i]) * 12);
                    return Math.min(1.5, ((st.medianRt || 500) + slow) / 1000);
                }
                if (m === -1) return 1.5;
                return Math.min(1.5, (st.medianRt || 500) / 1000);
            });
        }
        renderFocusCurve(curveEl, data.seq, rts);
    }
    return true;
}

function findInsight(data, key) {
    const list = Array.isArray(data.insights) ? data.insights : [];
    for (let i = 0; i < list.length; i++) {
        if (list[i] && list[i].key === key) return list[i];
    }
    return null;
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
    // 清洗历史数据中的系统表情（旧版本存的文案带 emoji），并回写一次让存储也干净
    data = sanitizeReportData(data);
    try {
        const raw = JSON.stringify(data);
        if (raw !== localStorage.getItem('float_last_report')) {
            localStorage.setItem('float_last_report', raw);
        }
    } catch (e) { /* 写回失败不影响展示 */ }
    if (reportHint) reportHint.style.display = 'none';

    // 预渲染分享图并缓存到内存（不落盘），点击分享时零准备
    cachedReportShare = prepareSharePayload(data);
    // 预热落盘：把分享图先写入临时文件，点击分享时 postNote 可同步发出（解决首次点击被吞）
    prewarmShareImage(cachedReportShare);

    // ── 结论区：画像 + 评语 + 依据（体检报告式，替代旧等级横幅） ──
    if (reportDate) reportDate.innerText = data.date || '最近测试';
    if (reportDiagnosis) renderDiagnosis(reportDiagnosis, data);

    // ── 五环仪表（手速/正确/切换/抗扰/稳定） + 中心总分 ──
    const st5 = (data.stats || {});
    setIndexRings({ outer: reportRingOuter, mid: reportRingMid, inner: reportRingInner, a: reportRingA, b: reportRingB }, {
        sSpeed: st5.sSpeed, sAcc: st5.sAcc, sSwitch: st5.sSwitch, sInhib: st5.sInhib, sCv: st5.sCv
    });
    if (reportIndexValue) reportIndexValue.innerText = data.index !== undefined ? data.index : '—';

    // ── 60 秒状态趋势（专注力情绪曲线；旧数据无字段时隐藏） ──
    const hasProcess = renderReportProcess(reportFocusCurve, data);
    if (reportProcessLabel) reportProcessLabel.style.display = hasProcess ? '' : 'none';
    if (reportTotalLabel) {
        const st = data.stats || {};
        const total = st.formalCount || st.validCount || 0;
        let t = '';
        if (total > 0 && st.medianRt) t = '共挑战 ' + total + ' 题・平均 ' + (st.medianRt / 1000).toFixed(2) + ' 秒/题';
        else if (total > 0) t = '共挑战 ' + total + ' 题';
        reportTotalLabel.innerText = t;
    }
    if (reportProcess) reportProcess.style.display = hasProcess ? '' : 'none';

    // ── 数据有效性（正常时不显示，异常时才人话提示） ──
    if (reportValidity) {
        const st = data.stats || {};
        if (st.reliable) {
            reportValidity.textContent = '';
            reportValidity.style.display = 'none';
        } else {
            const txt = (st.validCount || 0) < 20
                ? '这次答题中断较多，结果仅供参考，建议重新测一次'
                : '这次测试受干扰较多，结果仅供参考';
            reportValidity.textContent = txt;
            reportValidity.className = 'validity-note warn';
            reportValidity.style.display = '';
        }
    }

    // ── 建议 ──
    if (reportTipContent) reportTipContent.innerText = data.advice || data.tipContent || '';

    // ── 迷你趋势（整合在圆环区下方，5 个分点） ──
    if (reportMiniTrend) renderMiniTrend(reportMiniTrend, loadHistory());

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
        // 直接用进入页面时缓存的报告数据（已预渲染分享图），点击瞬间即可触发 postNote
        handleShare(reportShareBtn, cachedReportShare);
    });
}

// 首页「我的反应力报告」按钮
if (viewReportBtn) {
    viewReportBtn.addEventListener('click', showReport);
}

// 分享按钮统一处理：用 CSS class 防重复（不写 disabled / 不改文本，避免在 postNote
// 前触发强制重排拖慢手势），首次点击立即、同步、纯净地调用 postNote
function handleShare(btn, snapshot) {
    if (!snapshot || btn.dataset.sharing === '1') return;
    btn.dataset.sharing = '1';
    btn.classList.add('is-sharing');
    const settle = () => {
        btn.dataset.sharing = '';
        btn.classList.remove('is-sharing');
    };
    let p = null;
    try {
        p = shareReport(snapshot);
    } catch (e) {
        console.warn('share handler error:', e);
    }
    if (p && typeof p.finally === 'function') {
        p.finally(settle);
    } else {
        settle();
        return;
    }
    // 超时兜底：容器弹出发布页后可能不返回 JS（Promise 挂起）。
    // 2.5s 内未确认成功即恢复按钮，避免用户在发布页弹出前盲目连点；
    // 若首次调用确实被吞，2.5s 后按钮恢复可再点（此时桥已预热、filePath 已就绪，成功率高）
    setTimeout(() => {
        if (btn.dataset.sharing === '1') settle();
    }, 2500);
}

// 通用分享函数（v4·同步优先版）：postNote 必须在点击手势的【同步栈】内发出，
// postNote 之前绝无 await——真机「点两次」的根治路径：
// ① 首次点击同步发出：filePath 已就绪用 filePath；未就绪同步发起 writeTempFile（不 await）并用
//    小体积 dataURL 兜底同步发出（exportShareCard 已压至 ~30KB，真机经验首次过桥稳定）
// ② 容器吞调用（Promise 挂起）→ 600ms 自动补发（此时同步发起的 writeTempFile 大概率已完成，
//    补发用 filePath）；成功跳转后页面销毁，定时器不再触发
// ③ 首次 reject → 400ms 后补发一次（filePath 大概率已就绪）
function shareReport(snapshot, _retried) {
    if (!snapshot || !snapshot.shareImageDataUrl) return Promise.resolve(false);
    const miniTool = window.xhs && window.xhs.miniTool;
    if (!miniTool) {
        // 桥未注入：等待注入后自动重发（用户感知为一次点击；warmup 轮询也在后台预热）。
        // 注：此分支的 postNote 发生在异步回调（非同步栈），容器接受异步 postNote
        // （600ms 挂起补发即异步且真机验证有效），关键仍是 filePath/dataURL 就绪。
        return waitForBridge(2500).then(function (ok) {
            return ok ? shareReport(snapshot, _retried) : false;
        });
    }
    // filePath 未就绪：同步发起落盘（fire-and-forget，为补发/下次点击备 filePath），
    // 本次 postNote 用 dataURL 同步发出（体积已压小，无需 await 冒险拖出同步栈）
    if (!snapshot.shareImagePath) {
        prewarmShareImage(snapshot);
    }
    const imageUrl = snapshot.shareImagePath || snapshot.shareImageDataUrl;
    // 人话化数值：反应速度用秒，不用毫秒
    const rtMs = snapshot.avgRt != null ? snapshot.avgRt : snapshot.speedValue;
    const sec = (rtMs != null && !isNaN(rtMs)) ? (Number(rtMs) / 1000).toFixed(2) : '—';
    const acc = snapshot.accuracy != null ? snapshot.accuracy : snapshot.accuracyValue;
    // 话题标签（最多 10 个）：正文用 "#名称[话题]#" 序列化格式还原真实话题（蓝字），
    // tags 字段传不带 # 的话题名（空格分隔），走平台话题联想选中
    const noteTags = ['反应力测试', '反应力训练', '反应力', '专注力', '脑力挑战', '手速挑战', '小游戏', '趣味测试', '挑战自己', '来测一测'];
    const tagMarkup = noteTags.map(t => '#' + t + '[话题]#').join(' ');
    const payload = {
        title: '飘 · 60秒测测你的反应力',
        content:
            '60秒反应力测评完成！\n' +
            ((snapshot.diagName || snapshot.rankLabel || '') + (snapshot.diagSub ? ' · ' + snapshot.diagSub : '')) + '\n' +
            (snapshot.diagVerdict || '') + '\n' +
            `综合得分：${(snapshot.index != null ? snapshot.index : '—')}/100\n` +
            `平均 ${sec} 秒/题｜答对率 ${(acc != null ? acc : '—')}%\n` +
            '点击下方小红书小工具：飘，测一下你的反应力\n' +
            tagMarkup,
        pageType: 'photo_publish',
        mediaInfo: { image_resources: [{ url: imageUrl }] },
        tags: noteTags.join(' ')
    };
    // ② 挂起兜底：容器吞掉 postNote 时 Promise 既不 resolve 也不 reject。
    //    600ms 后若 filePath 已就绪（首发 dataURL 被吞、落盘已完成）→ 用 filePath 补发；
    //    仍未就绪 → 重新发起落盘，就绪后再补一次（dataURL 重发无意义，不再重复发同地址）。
    const swallowTimer = setTimeout(function () {
        if (_retried) return;
        if (snapshot.shareImagePath) {
            shareReport(snapshot, true).catch(function () {});
        } else {
            snapshot._prewarm = null; // 旧发起已挂起 600ms：清缓存强制重新落盘（旧调用若稍后完成仍会回填 filePath）
            prewarmShareImage(snapshot).then(function (fp) {
                if (fp && !_retried) shareReport(snapshot, true).catch(function () {});
            });
        }
    }, 600);
    let p = null;
    try {
        p = miniTool.postNote(payload); // 同步栈内发出，绝不在其前 await
    } catch (e) {
        clearTimeout(swallowTimer);
        console.warn('share postNote sync throw:', e);
        // ③ 同步抛出（罕见）：400ms 后补发一次
        if (!_retried) {
            return new Promise(r => setTimeout(r, 400)).then(() => shareReport(snapshot, true));
        }
        return Promise.resolve(false);
    }
    if (!p || typeof p.then !== 'function') { // 低版本桥同步返回：视为成功
        clearTimeout(swallowTimer);
        return Promise.resolve(true);
    }
    return p.then(function () {
        clearTimeout(swallowTimer);
        return true;
    }, function (e) {
        clearTimeout(swallowTimer);
        console.warn('share report failed:', e);
        // ③ 首次失败（常见于容器桥首次调用被吞）后自动补一次
        if (!_retried) {
            return new Promise(r => setTimeout(r, 400)).then(() => shareReport(snapshot, true));
        }
        return false;
    });
}

// 等待容器桥注入：轮询 window.xhs.miniTool 出现，注入后立即预热通道。
// 容器桥注入时机随版本不同，可能晚于页面 JS 执行——首次点击分享前必须确保桥就绪，
// 否则首次 postNote 落在桥初始化窗口内被吞（真机「点两次」的根因之一）
function waitForBridge(timeout) {
    const limit = timeout || 3000;
    return new Promise(function (resolve) {
        const t0 = Date.now();
        (function poll() {
            try {
                const miniTool = window.xhs && window.xhs.miniTool;
                if (miniTool) { warmupBridgeOnce(miniTool); return resolve(true); }
            } catch (e) { /* 继续轮询 */ }
            if (Date.now() - t0 >= limit) return resolve(false);
            setTimeout(poll, 50);
        })();
    });
}

let bridgeWarmed = false;

// 预热 JSBridge 通道：容器桥首次调用存在初始化延迟，首次 postNote 可能被吞。
// 用无副作用的只读 API getLaunchOptions 在桥注入后立刻建立通道（只做一次）；
// 桥未注入或该方法不存在时静默跳过，不影响任何流程。
function warmupBridgeOnce(miniTool) {
    if (bridgeWarmed || !miniTool) return;
    try {
        if (typeof miniTool.getLaunchOptions === 'function') {
            const p = miniTool.getLaunchOptions({});
            if (p && typeof p.then === 'function') {
                p.then(function () {}, function () {});
            }
        }
        bridgeWarmed = true;
    } catch (e) { /* 预热失败不影响主流程 */ }
}

// 预热入口：页面加载/开局时后台等待桥注入并建立通道（不阻塞主流程）
function warmupBridge() {
    waitForBridge(3000);
}

// 预热分享图落盘：进入报告页即后台把分享图写入临时文件并缓存 filePath，
// 点击分享时 postNote 无需等待异步写入，可同步发出（避免容器吞掉首次手势）。
// 返回 Promise 且 single-flight：重复调用复用同一写入任务；
// 点击手势内若尚未完成，await 它拿到 filePath 后再 postNote
function prewarmShareImage(snapshot) {
    if (!snapshot || !snapshot.shareImageDataUrl) return Promise.resolve(null);
    if (snapshot.shareImagePath) return Promise.resolve(snapshot.shareImagePath);
    const miniTool = window.xhs && window.xhs.miniTool;
    if (!miniTool || typeof miniTool.writeTempFile !== 'function') {
        return Promise.resolve(null);
    }
    // 容器偶发「静默挂起」writeTempFile（不 resolve 不 reject）：1.2s 判失败并清缓存，
    // 允许后续（点击时）重新发起，绝不让挂起的 _prewarm 永久占用导致 filePath 永不就绪。
    const attempt = function () {
        let p = null;
        try {
            p = miniTool.writeTempFile({ data: snapshot.shareImageDataUrl });
        } catch (e) {
            return Promise.resolve(null); // 桥异常：点击时回退 dataURL 兜底
        }
        if (!p || typeof p.then !== 'function') return Promise.resolve(null); // 低版本桥可能同步返回
        const done = Promise.resolve(p).then(function (temp) {
            if (temp && temp.filePath) {
                snapshot.shareImagePath = temp.filePath;
                return temp.filePath;
            }
            return null;
        }).catch(function () {
            return null; // 预热失败不阻塞：点击时回退 dataURL 兜底
        });
        return Promise.race([
            done,
            new Promise(function (res) { setTimeout(function () { res(null); }, 1200); })
        ]).then(function (v) {
            if (!v) snapshot._prewarm = null; // 失败/超时：清缓存允许重试（挂起的原始 Promise 若稍后完成仍会回填 shareImagePath）
            return v;
        });
    };
    if (snapshot._prewarm) return snapshot._prewarm;
    snapshot._prewarm = attempt();
    return snapshot._prewarm;
}

// 分享战绩：渲染战绩卡片 → postNote（data:uri 直接作为图片资源）
if (btnShareResult) {
    btnShareResult.addEventListener('click', () => {
        handleShare(btnShareResult, shareSnapshot);
    });
}

// 非小红书容器环境：结算页和报告页不显示分享按钮
function ensureShareButton() {
    const inMiniTool = !!window.xhs && !!window.xhs.miniTool;
    if (btnShareResult) btnShareResult.style.display = inMiniTool ? '' : 'none';
    if (reportShareBtn) reportShareBtn.style.display = inMiniTool ? '' : 'none';
}

// ── Share Card Renderer（反应力人设海报） ────────────────────────────────────
// 与四维能力 SVG 图标同源的 Path2D 路径数据（保持视觉语言一致）
const SHARE_ICON_PATHS = {
    speed: 'M13 2L3 14L12 14L11 22L21 10L12 10Z',
    accuracy: 'M21 12A9 9 0 1 1 3 12A9 9 0 1 1 21 12 M17 12A5 5 0 1 1 7 12A5 5 0 1 1 17 12 M13 12A1 1 0 1 1 11 12A1 1 0 1 1 13 12',
    switch: 'M17 1L21 5L17 9 M3 11V9A4 4 0 0 1 7 5H21 M7 23L3 19L7 15 M21 13V15A4 4 0 0 1 17 19H3',
    focus: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M15 12A3 3 0 1 1 9 12A3 3 0 1 1 15 12'
};

// 分享海报配色：等级徽章环色 + 四维能力强调色，与报告页 CSS 变量一一对应
const SHARE_RANK_COLORS = {
    S: { ringA: '#fde68a', ringB: '#f59e0b', glow: 'rgba(251,191,36,0.55)', tag: '#fbbf24' },
    A: { ringA: '#86efac', ringB: '#10b981', glow: 'rgba(16,185,129,0.50)', tag: '#6ee7b7' },
    B: { ringA: '#93c5fd', ringB: '#3b82f6', glow: 'rgba(59,130,246,0.45)', tag: '#93c5fd' },
    C: { ringA: '#fca5a5', ringB: '#ef4444', glow: 'rgba(239,68,68,0.45)', tag: '#f87171' },
    D: { ringA: '#cbd5e1', ringB: '#64748b', glow: 'rgba(100,116,139,0.45)', tag: '#94a3b8' }
};

const SHARE_ABILITY_META = [
    { key: 'speed',    color: '#38bdf8', label: '反应速度',   path: SHARE_ICON_PATHS.speed },
    { key: 'accuracy', color: '#34d399', label: '判断准确度', path: SHARE_ICON_PATHS.accuracy },
    { key: 'switch',   color: '#a78bfa', label: '切换灵活性', path: SHARE_ICON_PATHS.switch },
    { key: 'focus',    color: '#fbbf24', label: '连续专注力', path: SHARE_ICON_PATHS.focus }
];

// 在 canvas 上绘制与 HTML 内联 SVG 同源的 line-icon（保持描边风格一致）
function drawShareLineIcon(ctx, pathD, cx, cy, size, color) {
    const p = new Path2D(pathD);
    ctx.save();
    ctx.translate(cx - size / 2, cy - size / 2);
    ctx.scale(size / 24, size / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(p);
    ctx.restore();
}

// 圆角矩形助手：优先用原生 ctx.roundRect（Chrome 99+/Safari 16+），
// 旧内核 WebView 缺失时自动退化为手动路径绘制，保证分享卡在旧容器也能正常出图。
// r 支持数字，或 [topLeft, topRight, bottomRight, bottomLeft] 数组（与原生 roundRect 一致）
function drawRoundRect(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        return;
    }
    const rr = Array.isArray(r) ? r : [r, r, r, r];
    const tl = rr[0], tr = rr[1], br = rr[2], bl = rr[3];
    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.arcTo(x + w, y, x + w, y + tr, tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
    ctx.lineTo(x + bl, y + h);
    ctx.arcTo(x, y + h, x, y + h - bl, bl);
    ctx.lineTo(x, y + tl);
    ctx.arcTo(x, y, x + tl, y, tl);
    ctx.closePath();
}

// 分享卡文本换行：按测量宽度逐字切行，最多 maxLines 行，末行超宽以省略号截断
function wrapShareText(ctx, text, maxWidth, maxLines) {
    const chars = String(text || '').split('');
    const lines = [];
    let line = '';
    for (const ch of chars) {
        if (ctx.measureText(line + ch).width > maxWidth) {
            lines.push(line);
            line = ch;
            if (lines.length >= maxLines) break;
        } else {
            line += ch;
        }
    }
    if (lines.length < maxLines && line) lines.push(line);
    if (lines.length && ctx.measureText(lines[lines.length - 1] + '…').width > maxWidth) {
        let last = lines[lines.length - 1];
        while (last && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
        lines[lines.length - 1] = last + '…';
    }
    return lines;
}

// 分享图缩小导出：720 宽渲染 → 540 宽导出 + JPEG 0.82，把过桥体积压到 ~30KB。
// 真机经验：postNote 的 mediaInfo 传 dataURL 时体积越小首次过桥越稳（810KB→57KB 后
// 点击即弹页；再压一档让 dataURL 兜底路径也足够稳，filePath 未就绪时不必冒险 await）
function exportShareCard(canvas) {
    try {
        const w = 540;
        const h = Math.round(canvas.height * (w / canvas.width));
        const small = document.createElement('canvas');
        small.width = w;
        small.height = h;
        const sctx = small.getContext('2d');
        sctx.drawImage(canvas, 0, 0, w, h);
        return small.toDataURL('image/jpeg', 0.82);
    } catch (e) {
        return canvas.toDataURL('image/jpeg', 0.85); // 缩小失败回退原尺寸导出
    }
}

function renderShareCard(snapshot) {
    const canvas = document.createElement('canvas');
    const CX = 360;
    canvas.width = 720;
    canvas.height = 1700;
    const ctx = canvas.getContext('2d');
    const diagColor = snapshot.diagColor || '#38bdf8';

    // 深海渐变背景
    const bgGrad = ctx.createRadialGradient(360, 380, 60, 360, 700, 950);
    bgGrad.addColorStop(0, '#0d3663');
    bgGrad.addColorStop(1, '#03152b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 水流装饰线（顶部）
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 180);
    ctx.quadraticCurveTo(180, 130, 360, 180);
    ctx.quadraticCurveTo(540, 230, 720, 180);
    ctx.stroke();

    ctx.textBaseline = 'middle';

    // 顶部 logo 绿叶 + 产品名
    drawLeaf(ctx, 360, 150, 78, 102, '#58c27a', '#319451', '#a7f0bd', 0);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText('飘 · 60秒测测你的反应力', 360, 262);

    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(210, 298);
    ctx.lineTo(510, 298);
    ctx.stroke();

    // ── 画像区：名 + 小标题（评语与游戏成绩移到图例下方）──
    const diagName = snapshot.diagName || '反应力测评';
    const diagSub = snapshot.diagSub || '';
    const diagVerdict = snapshot.diagVerdict || '';
    // 分享卡精简成绩：只留最直观的 3 项（陌生人可读）
    const evParts = snapshot.diagEvidence ? String(snapshot.diagEvidence).split('·').map(s => s.trim()).filter(Boolean).slice(0, 3) : [];
    const diagEvidence = evParts.length ? '游戏成绩：' + evParts.join(' · ') : '';

    ctx.fillStyle = 'rgba(148,163,184,0.85)';
    ctx.font = '500 12px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText('反应力类型', CX, 322);

    ctx.fillStyle = diagColor;
    ctx.font = 'bold 32px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText(diagName, CX, 350);

    if (diagSub) {
        ctx.fillStyle = 'rgba(226,232,240,0.75)';
        ctx.font = '600 19px -apple-system, "PingFang SC", sans-serif';
        ctx.fillText(diagSub, CX, 388);
    }

    // ── 五环仪表（与报告页同构：手速/正确/切换/抗扰/稳定，中央仅分数）──
    const ringCY = 606;
    const ringConf = [
        { r: 118, w: 15, c: '#38bdf8', v: snapshot.sSpeed },
        { r: 96,  w: 13, c: '#34d399', v: snapshot.sAcc },
        { r: 74,  w: 11, c: '#a78bfa', v: snapshot.sSwitch },
        { r: 54,  w: 9,  c: '#fb923c', v: snapshot.sInhib },
        { r: 36,  w: 7,  c: '#22d3ee', v: snapshot.sCv }
    ];
    ringConf.forEach((ring) => {
        const v = typeof ring.v === 'number' ? Math.max(0, Math.min(100, ring.v)) : (snapshot.index || 80);
        ctx.beginPath();
        ctx.arc(CX, ringCY, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = ring.w;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(CX, ringCY, ring.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (v / 100));
        ctx.strokeStyle = ring.c;
        ctx.lineWidth = ring.w;
        ctx.lineCap = 'round';
        ctx.stroke();
    });

    // 环中央：综合分（环内只留分数）
    ctx.textAlign = 'center';
    ctx.font = '900 30px -apple-system, "PingFang SC", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 14;
    ctx.fillText(String(snapshot.index || '—'), CX, ringCY + 6);
    ctx.restore();

    // 五环图例
    const legendY = ringCY + 150;
    const legends = [
        { label: '手速', c: '#38bdf8' },
        { label: '正确', c: '#34d399' },
        { label: '切换', c: '#a78bfa' },
        { label: '抗扰', c: '#fb923c' },
        { label: '稳定', c: '#22d3ee' }
    ];
    ctx.font = '500 16px -apple-system, "PingFang SC", sans-serif';
    legends.forEach((lg, i) => {
        const lx = CX + (i - 2) * 96;
        ctx.beginPath();
        ctx.arc(lx - 24, legendY, 8, 0, Math.PI * 2);
        ctx.fillStyle = lg.c;
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.textAlign = 'left';
        ctx.fillText(lg.label, lx - 10, legendY);
    });

    // ── 图例下方：评语（19px，与小标题同字号）+ 游戏成绩 ──
    ctx.textAlign = 'center';
    let bodyY = legendY + 46;
    if (diagVerdict) {
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '600 19px -apple-system, "PingFang SC", sans-serif';
        const vLines = wrapShareText(ctx, diagVerdict, 640, 1);
        vLines.forEach((line, li) => { ctx.fillText(line, CX, bodyY + li * 26); });
        bodyY += vLines.length * 26;
    }
    if (diagEvidence) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 13px -apple-system, "PingFang SC", sans-serif';
        const eLines = wrapShareText(ctx, diagEvidence, 640, 1);
        eLines.forEach((line, li) => { ctx.fillText(line, CX, bodyY + 10 + li * 20); });
        bodyY += eLines.length * 20 + 10;
    }

    // ── 给你一个小挑战（与报告页同构）──
    const tipY = bodyY + 46;
    const tipH = 104;
    const tipW = 520, tipX = 100;
    drawRoundRect(ctx, tipX, tipY, tipW, tipH, 18);
    ctx.fillStyle = 'rgba(16,185,129,0.10)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(16,185,129,0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 19px -apple-system, "PingFang SC", sans-serif';
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText('给你一个小挑战', CX, tipY + 30);

    ctx.font = '500 16px -apple-system, "PingFang SC", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    const tipLines = wrapShareText(ctx, snapshot.tipContent || '', 460, 2);
    tipLines.forEach((line, li) => {
        ctx.fillText(line, CX, tipY + 62 + li * 24);
    });

    // ── 底部品牌标语 ──
    const footerY = tipY + tipH + 30;
    ctx.font = '500 13px -apple-system, "PingFang SC", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText('绿叶看指向 · 橙叶看移动', CX, footerY);
    const footerSloganText = '测一测，看看你的反应力是什么样';
    const footerW = ctx.measureText(footerSloganText).width;
    const footerSparkSize = 11;
    ctx.fillText(footerSloganText, CX, footerY + 26);
    drawShareLineIcon(ctx, SHARE_SPARK_PATH, CX + footerW / 2 + footerSparkSize / 2 + 8, footerY + 26, footerSparkSize, 'rgba(255,255,255,0.55)');

    // 底部水流装饰线
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, footerY + 52);
    ctx.quadraticCurveTo(180, footerY + 82, 360, footerY + 52);
    ctx.quadraticCurveTo(540, footerY + 22, 720, footerY + 52);
    ctx.stroke();

    // 按实际内容裁剪
    const finalHeight = footerY + 80;
    const cropped = document.createElement('canvas');
    cropped.width = canvas.width;
    cropped.height = finalHeight;
    cropped.getContext('2d').drawImage(canvas, 0, 0);
    return cropped;
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
    warmupBridge();
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

// ── Chrome 61 兼容：Flex gap 行为检测 ────────────────────────────────────
// Chrome 61 支持 Grid gap 但不支持 Flexbox gap。用「实际创建 flex 容器并测量」的方式
// 检测，通过后给 <html> 加 .supports-flex-gap，由 CSS 启用 gap 并清除 margin 基线。
(function detectFlexGap() {
    if (typeof document === 'undefined' || !document.createElement) return;
    var flex = document.createElement('div');
    flex.style.position = 'absolute';
    flex.style.visibility = 'hidden';
    flex.style.display = 'flex';
    flex.style.flexDirection = 'column';
    flex.style.rowGap = '1px';
    flex.appendChild(document.createElement('div'));
    flex.appendChild(document.createElement('div'));
    document.body.appendChild(flex);
    var supported = flex.scrollHeight === 1;
    flex.parentNode.removeChild(flex);
    if (supported) document.documentElement.className += ' supports-flex-gap';
})();
