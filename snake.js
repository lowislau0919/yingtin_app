import { submitScore, getTopScores } from './firebase.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 15;
const tileCount = canvas.width / gridSize;

let snake = [];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let gameLoop;
let isGameOver = false;
let gameSpeed = 150;

let currentLang = 'zh';

const uiText = {
    en: {
        gameOver: "Game Over!",
        score: "Score:",
        tryAgain: "Try Again",
        top10: "Global Top 10",
        langToggle: "EN/中"
    },
    zh: {
        gameOver: "遊戲結束！",
        score: "分數：",
        tryAgain: "再試一次",
        top10: "全球前 10 名",
        langToggle: "EN/中"
    }
};

function initGame() {
    snake = [{ x: 10, y: 10 }];
    food = { x: 5, y: 5 };
    dx = 0;
    dy = -1;
    score = 0;
    isGameOver = false;
    document.getElementById('currentScore').innerText = score;
    document.getElementById('gameOverScreen').classList.add('hidden');
    spawnFood();
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, gameSpeed);
    updateLanguage();
}

function update() {
    if (isGameOver) return;
    
    // Move snake
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // Wall collision logic (die)
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return gameOver();
    }
    
    // Self collision
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return gameOver();
        }
    }
    
    snake.unshift(head);
    
    // Eat food
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
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw food
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);
    
    // Draw snake
    ctx.fillStyle = '#10b981';
    for (let i = 0; i < snake.length; i++) {
        ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 1, gridSize - 1);
    }
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    // Ensure food doesn't spawn on snake
    for (let part of snake) {
        if (part.x === food.x && part.y === food.y) {
            spawnFood();
            break;
        }
    }
}

async function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    
    document.getElementById('finalScore').innerText = score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    
    // Submit score
    await submitScore('snake', score);
    
    // Load leaderboard
    loadLeaderboard();
}

async function loadLeaderboard() {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '<li>Loading...</li>';
    
    const scores = await getTopScores('snake', 10);
    list.innerHTML = '';
    
    if (scores.length === 0) {
        list.innerHTML = '<li>No scores yet!</li>';
    } else {
        scores.forEach((s, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>#${index + 1} ${s.name || 'Anonymous'}</span> <span>${s.score}</span>`;
            list.appendChild(li);
        });
    }
}

// --- Controls ---
function move(direction) {
    if (direction === 'UP' && dy !== 1) { dx = 0; dy = -1; }
    if (direction === 'DOWN' && dy !== -1) { dx = 0; dy = 1; }
    if (direction === 'LEFT' && dx !== 1) { dx = -1; dy = 0; }
    if (direction === 'RIGHT' && dx !== -1) { dx = 1; dy = 0; }
}

document.getElementById('btnUp').addEventListener('touchstart', (e) => { e.preventDefault(); move('UP'); });
document.getElementById('btnDown').addEventListener('touchstart', (e) => { e.preventDefault(); move('DOWN'); });
document.getElementById('btnLeft').addEventListener('touchstart', (e) => { e.preventDefault(); move('LEFT'); });
document.getElementById('btnRight').addEventListener('touchstart', (e) => { e.preventDefault(); move('RIGHT'); });

// Mouse fallback for testing
document.getElementById('btnUp').addEventListener('mousedown', () => move('UP'));
document.getElementById('btnDown').addEventListener('mousedown', () => move('DOWN'));
document.getElementById('btnLeft').addEventListener('mousedown', () => move('LEFT'));
document.getElementById('btnRight').addEventListener('mousedown', () => move('RIGHT'));

// Keyboard fallback
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') move('UP');
    if (e.key === 'ArrowDown') move('DOWN');
    if (e.key === 'ArrowLeft') move('LEFT');
    if (e.key === 'ArrowRight') move('RIGHT');
});

// --- UI Actions ---
document.getElementById('restartGameBtn').addEventListener('click', initGame);

function updateLanguage() {
    const texts = uiText[currentLang];
    document.getElementById('gameOverTitle').innerText = texts.gameOver;
    document.getElementById('leaderboardTitle').innerText = texts.top10;
    document.getElementById('restartGameBtn').innerText = texts.tryAgain;
    
    // Update score prefix
    const scoreElement = document.querySelector('.game-score');
    scoreElement.innerHTML = `${texts.score} <span id="currentScore">${score}</span>`;
}

document.getElementById('langToggleBtn').addEventListener('click', () => {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    updateLanguage();
});

// Export to window so script.js can call it
window.initSnakeGame = initGame;
window.stopSnakeGame = () => {
    isGameOver = true;
    clearInterval(gameLoop);
};
