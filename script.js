const fruitData = {
    snakeGame: {
        name: '貪食蛇',
        icon: '🐍',
        description: '經典貪食蛇遊戲！與全球玩家一較高下。<br>(Classic Snake game! Compete worldwide.)',
        color: '#10b981',
        hasGame: true
    },
    banana: {
        name: '香蕉',
        icon: '🍌',
        description: '成熟香甜的香蕉，是運動後的最佳能量補給。',
        color: '#eab308'
    },
    lemon: {
        name: '檸檬',
        icon: '🍋',
        description: '酸爽清新的檸檬，富含維他命C，讓人精神振奮。',
        color: '#facc15'
    },
    mango: {
        name: '芒果',
        icon: '🥭',
        description: '熱帶風情的芒果，果肉細嫩，甜美多汁。',
        color: '#f59e0b'
    },
    pineapple: {
        name: '鳳梨',
        icon: '🍍',
        description: '充滿熱帶氣息的鳳梨，酸甜適口，口感豐富。',
        color: '#fbbf24'
    },
    strawberry: {
        name: '士多啤梨',
        icon: '🍓',
        description: '鮮紅誘人的士多啤梨，酸甜適中的初戀滋味。',
        color: '#fb7185'
    },
    potato: {
        name: '馬鈴薯',
        icon: '🥔',
        description: '樸實營養的馬鈴薯，是餐桌上不可或缺的美味。',
        color: '#a8a29e'
    },
    tomato: {
        name: '番茄',
        icon: '🍅',
        description: '鮮豔多汁的番茄，既是水果也是蔬菜的健康之選。',
        color: '#f43f5e'
    },
    vegetable: {
        name: '蔬菜',
        icon: '🥦',
        description: '翠綠健康的蔬菜，為您的身體提供滿滿的纖維。',
        color: '#22c55e'
    },
    icecream: {
        name: '雪糕',
        icon: '🍦',
        description: '冰涼沁心的雪糕，是炎炎夏日裡最幸福的享受。',
        color: '#fdf4ff'
    },
    tree: {
        name: '大樹',
        icon: '🌳',
        description: '巍峨挺立的大樹，是大地的守護者，給予我們清新的空氣。',
        color: '#16a34a'
    },
    flower: {
        name: '花朵',
        icon: '🌸',
        description: '嬌豔芬芳的花朵，點綴著世界，散發出迷人的香氣。',
        color: '#f472b6'
    },
    leaf: {
        name: '葉子',
        icon: '🍃',
        description: '翠綠輕盈的葉子，隨風搖曳，是大自然生命力的象徵。',
        color: '#4ade80'
    },
    sun: {
        name: '太陽',
        icon: '☀️',
        description: '光芒萬丈的太陽，溫暖照耀大地，賦予萬物生長的能量。',
        color: '#fbbf24'
    },
    mountain: {
        name: '高山',
        icon: '⛰️',
        description: '雄偉壯闊的高山，屹立千年，象徵著堅韌不拔的精神。',
        color: '#78716c'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // --- Splash Screen ---
    const splash = document.getElementById('splashScreen');
    setTimeout(() => {
        splash.classList.add('hidden');
    }, 2300);

    const navItems = document.querySelectorAll('.nav-item');
    const contentArea = document.getElementById('appContent');
    const navTrack = document.getElementById('navTrack');
    const navContainer = document.getElementById('navTrackContainer');
    const dots = document.querySelectorAll('.dot');
    
    let currentPage = 0;
    let startX = 0;
    let isDragging = false;

    // --- Page Switching Logic ---
    function switchPage(pageId) {
        const data = fruitData[pageId];
        if (!data) return;

        // Update Nav UI
        navItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-page') === pageId);
        });

        // Fade out old content
        const oldContent = document.getElementById('page-content');
        if (oldContent) {
            oldContent.style.opacity = '0';
            oldContent.style.transform = 'translateY(-20px)';
        }

        setTimeout(() => {
            contentArea.innerHTML = `
                <div id="page-content" class="fade-in">
                    <div class="fruit-page">
                        <div class="fruit-image-container" style="box-shadow: 0 25px 50px rgba(0,0,0,0.4), inset 0 0 30px ${data.color}33">
                            <span class="fruit-emoji">${data.icon}</span>
                        </div>
                        <h2 class="fruit-name">${data.name}</h2>
                        <p class="fruit-description">${data.description}</p>
                        <div id="gameActionContainer">
                            ${data.hasGame ? `<button id="playGameBtn" class="play-game-btn">🎮 Play Game / 玩遊戲</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            // Attach play button listener
            if (data.hasGame) {
                const playBtn = document.getElementById('playGameBtn');
                if (playBtn) {
                    playBtn.addEventListener('click', () => {
                        document.getElementById('gameOverlay').classList.remove('hidden');
                        if (window.initSnakeGame) window.initSnakeGame();
                    });
                }
            }
        }, 300);
    }

    // --- Close Game Listener ---
    const closeGameBtn = document.getElementById('closeGameBtn');
    if (closeGameBtn) {
        closeGameBtn.addEventListener('click', () => {
            document.getElementById('gameOverlay').classList.add('hidden');
            if (window.stopSnakeGame) window.stopSnakeGame();
        });
    }

    // --- Nav Track Slide ---
    function setPositionByIndex() {
        navTrack.style.transform = `translateX(${currentPage * -33.333}%)`;
        updateIndicators();
    }

    function updateIndicators() {
        dots.forEach((dot, i) => dot.classList.toggle('active', i === currentPage));
    }

    // --- Touch/Mouse Swipe on the NAV CONTAINER ---
    function onDragStart(event) {
        startX = getClientX(event);
        isDragging = true;
    }

    function onDragMove(event) {
        if (!isDragging) return;
        // Prevent scroll while swiping nav
        if (event.cancelable) event.preventDefault();
    }

    function onDragEnd(event) {
        if (!isDragging) return;
        isDragging = false;

        // FIX: use changedTouches for touchend (touches[] is empty on release)
        const endX = getClientX(event, true);
        const diff = endX - startX;

        if (diff < -40 && currentPage < 2) {
            currentPage++;
        } else if (diff > 40 && currentPage > 0) {
            currentPage--;
        }
        setPositionByIndex();
    }

    function getClientX(event, isEnd = false) {
        if (event.type.startsWith('mouse')) return event.clientX;
        const list = isEnd ? event.changedTouches : event.touches;
        return list && list.length > 0 ? list[0].clientX : startX;
    }

    // Attach to the CONTAINER (wider touch target)
    navContainer.addEventListener('touchstart', onDragStart, { passive: true });
    navContainer.addEventListener('touchmove', onDragMove, { passive: false });
    navContainer.addEventListener('touchend', onDragEnd);
    navContainer.addEventListener('mousedown', onDragStart);
    navContainer.addEventListener('mousemove', (e) => { if (isDragging) onDragMove(e); });
    navContainer.addEventListener('mouseup', onDragEnd);
    navContainer.addEventListener('mouseleave', onDragEnd);

    // --- Nav Item Clicks ---
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            switchPage(item.getAttribute('data-page'));
        });
        item.addEventListener('touchstart', () => { item.style.transform = 'scale(0.92)'; }, { passive: true });
        item.addEventListener('touchend', () => { item.style.transform = ''; });
    });

    // --- Dot Clicks ---
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            currentPage = i;
            setPositionByIndex();
        });
    });

    // --- Initial state ---
    switchPage('snakeGame');
    setPositionByIndex();
});
