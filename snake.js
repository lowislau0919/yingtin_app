import { submitScore, getTopScores, auth } from './firebase.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 15;
const tileCount = canvas.width / gridSize;

let snake = [];
let food = { x: 5, y: 5 };
let dx = 0;
let dy = 0;
let score = 0;
let gameLoop = null;
let isGameOver = false;
let gameActive = false;
let currentLang = 'zh';

// Audio Context for funny/professional sounds
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type = 'square', duration = 0.1) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const uiText = {
    en: {
        gameOver: "Game Over!",
        score: "Score:",
        tryAgain: "Try Again",
        top10: "Global Top 10",
        langToggle: "EN/中",
        startTitle: "🍎 Apple Snake",
        startBtn: "Start Game",
        loginReq: "Login Required!",
        eatMsg: "Yum!"
    },
    zh: {
        gameOver: "遊戲結束！",
        score: "分數：",
        tryAgain: "再試一次",
        top10: "全球前 10 名",
        langToggle: "EN/中",
        startTitle: "🍎 蘋果貪食蛇",
        startBtn: "開始遊戲",
        loginReq: "請先登入！",
        eatMsg: "好味！"
    }
};

export function openSnakeGame() {
    gameActive = false;
    isGameOver = false;
    if (gameLoop) clearInterval(gameLoop);
    
    document.getElementById('gameStartScreen').classList.remove('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    drawInitial();
    updateLanguage();
}

function drawInitial() {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function startGame() {
    if (!auth.currentUser) {
        alert(uiText[currentLang].loginReq);
        return;
    }
    playSound(440, 'sine', 0.2); // Start sound
    
    document.getElementById('gameStartScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    food = { x: 5, y: 5 };
    dx = 0;
    dy = -1;
    score = 0;
    isGameOver = false;
    gameActive = true;
    
    document.getElementById('currentScore').innerText = score;
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, 130); // Slightly faster for fun
}

function gameStep() {
    if (!gameActive || isGameOver) return;
    
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // Collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return endMatch();
    }
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return endMatch();
    }
    
    snake.unshift(head);
    
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById('currentScore').innerText = score;
        playSound(880, 'square', 0.05); // Eat sound
        spawnFood();
        // Animation: Quick flash
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        snake.pop();
    }
    
    draw();
}

function draw() {
    ctx.fillStyle = '#0f172a'; // Match app theme
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for(let i=0; i<tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i*gridSize, 0); ctx.lineTo(i*gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i*gridSize); ctx.lineTo(canvas.width, i*gridSize);
        ctx.stroke();
    }

    // Draw food (Apple animation)
    const time = Date.now() * 0.005;
    const pulse = Math.sin(time) * 2;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, (gridSize/2 - 2) + pulse, 0, Math.PI*2);
    ctx.fill();
    
    // Draw snake
    snake.forEach((part, index) => {
        const isHead = index === 0;
        ctx.fillStyle = isHead ? '#34d399' : '#10b981';
        
        // Rounded segments
        const r = 4;
        const x = part.x * gridSize + 1;
        const y = part.y * gridSize + 1;
        const w = gridSize - 2;
        const h = gridSize - 2;
        
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
        
        if (isHead) {
            // Eyes
            ctx.fillStyle = '#000';
            const eyeSize = 2;
            if (dx === 1) { // Right
                ctx.fillRect(x + w - 4, y + 3, eyeSize, eyeSize);
                ctx.fillRect(x + w - 4, y + h - 5, eyeSize, eyeSize);
            } else if (dx === -1) { // Left
                ctx.fillRect(x + 2, y + 3, eyeSize, eyeSize);
                ctx.fillRect(x + 2, y + h - 5, eyeSize, eyeSize);
            } else if (dy === -1) { // Up
                ctx.fillRect(x + 3, y + 2, eyeSize, eyeSize);
                ctx.fillRect(x + w - 5, y + 2, eyeSize, eyeSize);
            } else { // Down
                ctx.fillRect(x + 3, y + h - 4, eyeSize, eyeSize);
                ctx.fillRect(x + w - 5, y + h - 4, eyeSize, eyeSize);
            }
        }
    });
}

function spawnFood() {
    while (true) {
        let newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        if (!snake.some(p => p.x === newFood.x && p.y === newFood.y)) {
            food = newFood;
            break;
        }
    }
}

async function endMatch() {
    isGameOver = true;
    gameActive = false;
    clearInterval(gameLoop);
    playSound(150, 'sawtooth', 0.5); // Game over sound
    
    document.getElementById('finalScore').innerText = score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    
    try {
        await submitScore('snake', score);
    } catch (e) {}
    loadLeaderboard();
}

async function loadLeaderboard() {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '<li>Loading...</li>';
    try {
        const scores = await getTopScores('snake', 10);
        list.innerHTML = '';
        scores.forEach((s, i) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>#${i+1} ${s.name || 'Anon'}</span> <span>${s.score}</span>`;
            list.appendChild(li);
        });
    } catch (e) {
        list.innerHTML = '<li>Leaderboard Error</li>';
    }
}

function changeDir(dir) {
    if (!gameActive) return;
    if (dir === 'UP' && dy !== 1) { dx = 0; dy = -1; }
    if (dir === 'DOWN' && dy !== -1) { dx = 0; dy = 1; }
    if (dir === 'LEFT' && dx !== 1) { dx = -1; dy = 0; }
    if (dir === 'RIGHT' && dx !== -1) { dx = 1; dy = 0; }
}

// Events
document.getElementById('btnUp').addEventListener('touchstart', (e) => { e.preventDefault(); changeDir('UP'); });
document.getElementById('btnDown').addEventListener('touchstart', (e) => { e.preventDefault(); changeDir('DOWN'); });
document.getElementById('btnLeft').addEventListener('touchstart', (e) => { e.preventDefault(); changeDir('LEFT'); });
document.getElementById('btnRight').addEventListener('touchstart', (e) => { e.preventDefault(); changeDir('RIGHT'); });

function updateLanguage() {
    const texts = uiText[currentLang];
    document.getElementById('gameOverTitle').innerText = texts.gameOver;
    document.getElementById('leaderboardTitle').innerText = texts.top10;
    document.getElementById('restartGameBtn').innerText = texts.tryAgain;
    document.getElementById('startGameBtn').innerText = texts.startBtn;
    const scoreBox = document.querySelector('.game-score');
    scoreBox.innerHTML = `${texts.score} <span id="currentScore">${score}</span>`;
}

document.getElementById('langToggleBtn').addEventListener('click', () => {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    updateLanguage();
});

document.getElementById('startGameBtn').addEventListener('click', startGame);
document.getElementById('restartGameBtn').addEventListener('click', startGame);

window.openSnakeGame = openSnakeGame;
window.stopSnakeGame = () => {
    gameActive = false;
    clearInterval(gameLoop);
};
