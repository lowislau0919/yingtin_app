const fruitData = {
    apple: {
        name: '蘋果',
        icon: '🍎',
        description: '新鮮甜美的紅蘋果，充滿營養與活力。',
        color: '#ef4444'
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
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const contentArea = document.getElementById('appContent');
    const navTrack = document.getElementById('navTrack');
    const dots = document.querySelectorAll('.dot');
    
    let currentPage = 0;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let isDragging = false;

    // --- Page Switching Logic ---
    function switchPage(pageId) {
        const data = fruitData[pageId];
        if (!data) return;

        // Update Nav UI
        navItems.forEach(item => {
            if (item.getAttribute('data-page') === pageId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Clear current content with animation
        const oldContent = document.getElementById('page-content');
        if (oldContent) {
            oldContent.style.opacity = '0';
            oldContent.style.transform = 'translateY(-20px)';
        }

        setTimeout(() => {
            // Inject new content
            contentArea.innerHTML = `
                <div id="page-content" class="fade-in">
                    <div class="fruit-page">
                        <div class="fruit-image-container" style="box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), inset 0 0 30px ${data.color}33">
                            <span class="fruit-emoji">${data.icon}</span>
                        </div>
                        <h2 class="fruit-name">${data.name}</h2>
                        <p class="fruit-description">${data.description}</p>
                    </div>
                </div>
            `;
        }, 300);
    }

    // --- Swipe Logic ---
    function setPositionByIndex() {
        currentTranslate = currentPage * -50; // -50% because each page is half of 200% width
        navTrack.style.transform = `translateX(${currentTranslate}%)`;
        updateIndicators();
    }

    function updateIndicators() {
        dots.forEach((dot, index) => {
            if (index === currentPage) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    navTrack.addEventListener('touchstart', touchStart);
    navTrack.addEventListener('touchend', touchEnd);
    navTrack.addEventListener('touchmove', touchMove);

    // Mouse events for desktop testing
    navTrack.addEventListener('mousedown', touchStart);
    navTrack.addEventListener('mouseup', touchEnd);
    navTrack.addEventListener('mouseleave', touchEnd);
    navTrack.addEventListener('mousemove', touchMove);

    function touchStart(event) {
        startX = getPositionX(event);
        isDragging = true;
    }

    function touchMove(event) {
        if (isDragging) {
            const currentX = getPositionX(event);
            const diff = currentX - startX;
            // No real-time move for simplicity in this implementation, 
            // just wait for the end to snap.
        }
    }

    function touchEnd(event) {
        if (!isDragging) return;
        isDragging = false;
        const endX = getPositionX(event);
        const diff = endX - startX;

        if (diff < -50 && currentPage === 0) {
            currentPage = 1;
        } else if (diff > 50 && currentPage === 1) {
            currentPage = 0;
        }

        setPositionByIndex();
    }

    function getPositionX(event) {
        return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
    }

    // --- Initialization ---
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.getAttribute('data-page');
            switchPage(pageId);
        });
        
        // Tactile feedback
        item.addEventListener('touchstart', () => { item.style.transform = 'scale(0.95)'; });
        item.addEventListener('touchend', () => { item.style.transform = ''; });
    });

    // Handle dot clicks
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentPage = index;
            setPositionByIndex();
        });
    });
});
