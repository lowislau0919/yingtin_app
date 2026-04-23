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
let gameActive = false; // New state to track if we are in a match
let currentLang = 'zh';

const uiText = {
    en: {
        gameOver: "Game Over!",
        score: "Score:",
        tryAgain: "Try Again",
        top10: "Global Top 10",
        langToggle: "EN/中",
        startTitle: "Snake Game",
        startBtn: "Start Game",
        loginReq: "Please login first!"
    },
    zh: {
        gameOver: "遊戲結束！",
        score: "分數：",
        tryAgain: "再試一次",
        top10: "全球前 10 名",
        langToggle: "EN/中",
        startTitle: "貪食蛇遊戲",
        startBtn: "開始遊戲",
        loginReq: "請先登入！"
    }
};

// 1. Preparation - Show the start menu
export function openSnakeGame() {
    gameActive = false;
    isGameOver = false;
    dx = 0;
    dy = 0;
    
    document.getElementById('gameStartScreen').classList.remove('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    
    // Draw empty board
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    updateLanguage();
}

// 2. Start the actual game loop
function startGame() {
    if (!auth.currentUser) {
        alert(uiText[currentLang].loginReq);
        return;
    }

    document.getElementById('gameStartScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    
    // Reset Game State
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    food = { x: 5, y: 5 };
    dx = 0;
    dy = -1; // Start moving UP
    score = 0;
    isGameOver = false;
    gameActive = true;
    
    document.getElementById('currentScore').innerText = score;
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, 150);
}

function gameStep() {
    if (!gameActive || isGameOver) return;
    
    // Calculate new head
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        endMatch();
        return;
    }
    
    // Self collision
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            endMatch();
            return;
        }
    }
    
    // Move
    snake.unshift(head);
    
    // Food check
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById('currentScore').innerText = score;
        spawnFood();
    } else {
        snake.pop();
    }
    
    draw();
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw food
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(food.x * gridSize + 1, food.y * gridSize + 1, gridSize - 2, gridSize - 2);
    
    // Draw snake
    ctx.fillStyle = '#10b981';
    snake.forEach((part, index) => {
        if (index === 0) ctx.fillStyle = '#34d399'; // Head slightly brighter
        else ctx.fillStyle = '#10b981';
        ctx.fillRect(part.x * gridSize + 1, part.y * gridSize + 1, gridSize - 2, gridSize - 2);
    });
}

function spawnFood() {
    let newFood;
    while (true) {
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        // Check if on snake
        let collision = false;
        for (let part of snake) {
            if (part.x === newFood.x && part.y === newFood.y) {
                collision = true;
                break;
            }
        }
        if (!collision) break;
    }
    food = newFood;
}

async function endMatch() {
    isGameOver = true;
    gameActive = false;
    clearInterval(gameLoop);
    
    document.getElementById('finalScore').innerText = score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    
    try {
        await submitScore('snake', score);
    } catch (e) {
        console.error("Score submit failed", e);
    }
    
    loadLeaderboard();
}

async function loadLeaderboard() {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '<li>Loading...</li>';
    try {
        const scores = await getTopScores('snake', 10);
        list.innerHTML = '';
        if (scores.length === 0) {
            list.innerHTML = '<li>No scores yet</li>';
        } else {
            scores.forEach((s, i) => {
                const li = document.createElement('li');
                li.innerHTML = `<span>#${i+1} ${s.name || 'Anonymous'}</span> <span>${s.score}</span>`;
                list.appendChild(li);
            });
        }
    } catch (e) {
        list.innerHTML = '<li>Leaderboard Error</li>';
    }
}

// --- Controls ---
function changeDir(dir) {
    if (!gameActive) return;
    if (dir === 'UP' && dy !== 1) { dx = 0; dy = -1; }
    if (dir === 'DOWN' && dy !== -1) { dx = 0; dy = 1; }
    if (dir === 'LEFT' && dx !== 1) { dx = -1; dy = 0; }
    if (dir === 'RIGHT' && dx !== -1) { dx = 1; dy = 0; }
}

// Buttons
document.getElementById('btnUp').addEventListener('touchstart', (e) => { e.preventDefault(); changeDir('UP'); });
document.getElementById('btnDown').addEventListener('touchstart', (e) => { e.preventDefault(); changeDir('DOWN'); });
document.getElementById('btnLeft').addEventListener('touchstart', (e) => { e.preventDefault(); changeDir('LEFT'); });
document.getElementById('btnRight').addEventListener('touchstart', (e) => { e.preventDefault(); changeDir('RIGHT'); });

// UI Language
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
