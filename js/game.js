// ========== НАСТРОЙКИ ИГРЫ ==========
const gridSize = 20;
let snake = [];
let food = {};
let direction = 'none';
let nextDirection = 'none';
let score = 0;
let gameSpeed = 150;
let gameLoop;
let gameActive = false;
let refreshInterval;

// ========== ЭЛЕМЕНТЫ ИНТЕРФЕЙСА ==========
const gameContainer = document.getElementById('game-container');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');

// ========== ИГРОВЫЕ ФУНКЦИИ ==========
function resizeCanvas() {
    canvas.width = gameContainer.offsetWidth;
    canvas.height = gameContainer.offsetHeight;
}

function initSnake() {
    snake = [];
    const startX = Math.floor(canvas.width / gridSize / 2) * gridSize;
    const startY = Math.floor(canvas.height / gridSize / 2) * gridSize;
    
    for (let i = 3; i >= 0; i--) {
        snake.push({ x: startX - i * gridSize, y: startY });
    }
}

function generateFood() {
    const maxX = Math.floor(canvas.width / gridSize) - 1;
    const maxY = Math.floor(canvas.height / gridSize) - 1;
    
    let validPosition = false;
    let attempts = 0;
    
    while (!validPosition && attempts < 100) {
        food = {
            x: Math.floor(Math.random() * maxX) * gridSize,
            y: Math.floor(Math.random() * maxY) * gridSize
        };
        
        validPosition = true;
        
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                validPosition = false;
                break;
            }
        }
        
        attempts++;
    }
}

function draw() {
    // Очистка canvas
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Цвета для змейки
    const colors = [
        ['#4CAF50', '#8BC34A'], // зеленый
        ['#2196F3', '#03A9F4'], // синий
        ['#9C27B0', '#E91E63'], // фиолетовый
        ['#FF9800', '#FFC107'], // оранжевый
        ['#E91E63', '#F06292'], // розовый
        ['#00BCD4', '#80DEEA']  // бирюзовый
    ];
    
    const skinIndex = (userSettings.skin || 1) - 1;
    const headColor = colors[skinIndex][0];
    const bodyColor = colors[skinIndex][1];
    
    // Отрисовка змейки
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? headColor : bodyColor;
        ctx.fillRect(segment.x, segment.y, gridSize - 1, gridSize - 1);
    });
    
    // Отрисовка еды
    ctx.fillStyle = '#FF5722';
    ctx.beginPath();
    ctx.arc(food.x + gridSize/2, food.y + gridSize/2, gridSize/2 - 1, 0, Math.PI * 2);
    ctx.fill();
}

function update() {
    // Обновляем направление
    direction = nextDirection;
    
    if (direction === 'none') return;
    
    const head = { ...snake[0] };
    
    // Движение головы
    switch (direction) {
        case 'up': head.y -= gridSize; break;
        case 'down': head.y += gridSize; break;
        case 'left': head.x -= gridSize; break;
        case 'right': head.x += gridSize; break;
    }
    
    // Проверка столкновений
    if (head.x < 0 || head.y < 0 || head.x >= canvas.width || head.y >= canvas.height) {
        gameOver();
        return;
    }
    
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            gameOver();
            return;
        }
    }
    
    // Добавление новой головы
    snake.unshift(head);
    
    // Проверка съедания еды
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        
        // Увеличение скорости каждые 50 очков
        if (score % 50 === 0 && gameSpeed > 50) {
            gameSpeed -= 10;
            clearInterval(gameLoop);
            gameLoop = setInterval(gameStep, gameSpeed);
        }
        
        generateFood();
    } else {
        snake.pop(); // Удаление хвоста, если не съели еду
    }
}

function gameStep() {
    update(); // Обновляем состояние игры
    draw();   // Перерисовываем игровое поле
}

async function gameOver() {
    clearInterval(gameLoop);
    updateCoinsDisplay();
    finalScoreElement.textContent = `Счёт: ${score}`;
    gameOverElement.style.display = 'flex';
    gameActive = false;
    
    // Начисляем монеты (1 монета за каждые 10 очков)
    const coinsEarned = Math.floor(score / 10);
    if (coinsEarned > 0 && currentUser.id && !currentUser.id.startsWith('local_')) {
        userSettings.coins = (userSettings.coins || 0) + coinsEarned;
        await saveProfileSettings();
        showToast(`Вы заработали ${coinsEarned} монет!`);
    }
    
    // Сохранение результата
    if (currentUser.id && !currentUser.id.startsWith('local_') && score > 0) {
        await saveScore();
        await loadLeaderboard(topPlayersList, 5);
    }
}

function startGame() {
    // Сбрасываем игровое состояние
    snake = [];
    food = {};
    direction = 'none';
    nextDirection = 'none';
    score = 0;
    gameSpeed = 150;
    gameActive = true;
    
    // Обновляем интерфейс
    mainMenu.style.display = "none";
    gameContainer.style.display = "block";
    gameOverElement.style.display = "none";
    document.getElementById('leaderboard').style.display = 'none';
    scoreElement.textContent = score;
    
    // Инициализация игровых элементов
    resizeCanvas();
    initSnake();
    generateFood();
    draw();
    
    // Запуск игрового цикла
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, gameSpeed);
    
    // Автообновление таблицы лидеров каждые 30 секунд
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => loadLeaderboard(topPlayersList, 5), 30000);
}

// ========== УПРАВЛЕНИЕ ==========
function handleInput(newDirection) {
    if (!gameActive) return;
    
    // Запрет на разворот на 180 градусов
    if (
        (newDirection === 'up' && direction !== 'down') ||
        (newDirection === 'down' && direction !== 'up') ||
        (newDirection === 'left' && direction !== 'right') ||
        (newDirection === 'right' && direction !== 'left')
    ) {
        nextDirection = newDirection;
    }
}

// Клавиатура (WASD и стрелки)
document.addEventListener('keydown', (e) => {
    switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': handleInput('up'); break;
        case 's': case 'arrowdown': handleInput('down'); break;
        case 'a': case 'arrowleft': handleInput('left'); break;
        case 'd': case 'arrowright': handleInput('right'); break;
    }
});

// Свайпы на мобильных устройствах
let touchStartX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD = 30;

canvas.addEventListener('touchstart', (e) => {
    if (!gameActive) return;
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    if (!gameActive) return;
    e.preventDefault();
    const touch = e.touches[0];
    const diffX = touchStartX - touch.clientX;
    const diffY = touchStartY - touch.clientY;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > SWIPE_THRESHOLD) handleInput('left');
        else if (diffX < -SWIPE_THRESHOLD) handleInput('right');
    } else {
        if (diffY > SWIPE_THRESHOLD) handleInput('up');
        else if (diffY < -SWIPE_THRESHOLD) handleInput('down');
    }
}, { passive: false });
