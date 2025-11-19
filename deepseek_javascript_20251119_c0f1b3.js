// ========== ЭЛЕМЕНТЫ ИНТЕРФЕЙСА ==========
const mainMenu = document.getElementById('main-menu');
const playBtn = document.getElementById('play-btn');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const howToPlayBtn = document.getElementById('how-to-play-btn');
const profileBtn = document.getElementById('profile-btn');
const shopBtn = document.getElementById('shop-btn');

// Модальные окна
const profileModal = document.getElementById('profile-modal');
const howToPlayModal = document.getElementById('how-to-play-modal');
const leaderboardModal = document.getElementById('leaderboard-modal');
const shopModal = document.getElementById('shop-modal');

// Элементы профиля
const profileNameInput = document.getElementById('profile-name-input');
const profileIdSpan = document.getElementById('profile-id');
const profileSaveBtn = document.getElementById('profile-save-btn');
const refreshLeaderboardBtn = document.getElementById('refresh-leaderboard');
const closeLeaderboardBtn = document.getElementById('close-leaderboard');
const closeHowToPlayBtn = document.getElementById('close-how-to-play');

// ========== ФУНКЦИИ ИНТЕРФЕЙСА ==========
function initMenuButtons() {
    const buttons = document.querySelectorAll('.menu-btn');
    if (!buttons) return;
    
    buttons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function() {
                if (this && this.classList) {
                    buttons.forEach(b => b?.classList?.remove('active'));
                    this.classList.add('active');
                }
            });
        }
    });
}

function showProfileModal() {
    if (!currentUser.id) {
        showToast('Нужно подключение к интернету');
        return;
    }

    if (!userSettings.inventory) {
        userSettings.inventory = { avatars: [], backgrounds: [], skins: [] };
    }
    if (!userSettings.inventory.avatars) userSettings.inventory.avatars = [];
    if (!userSettings.inventory.backgrounds) userSettings.inventory.backgrounds = [];
    if (!userSettings.inventory.skins) userSettings.inventory.skins = [];

    profileIdSpan.textContent = currentUser.id.substring(0, 8) + '...';
    profileNameInput.value = currentUser.display_name;

    updateProfileSelection();
    applyProfileBackground();

    profileModal.style.display = 'flex';
}

function showFullLeaderboard() {
    leaderboardModal.style.display = 'flex';
    loadLeaderboard(fullLeaderboard, null);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function returnToMenu() {
    clearInterval(gameLoop);
    clearInterval(refreshInterval);
    snake = [];
    food = {};
    direction = 'none';
    nextDirection = 'none';
    score = 0;
    gameActive = false;
    
    mainMenu.style.display = "block";
    gameContainer.style.display = "none";
    gameOverElement.style.display = "none";
    document.getElementById('leaderboard').style.display = 'none';
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    scoreElement.textContent = "0";
}

function applyProfileBackground() {
    document.body.classList.remove(
        "profile-bg-1", "profile-bg-2", "profile-bg-3",
        "profile-bg-4", "profile-bg-5", "profile-bg-6"
    );
    document.body.classList.add(`profile-bg-${userSettings.background}`);
}

function updateProfileButton() {
    profileBtn.textContent = currentUser.display_name;
}

function updateCoinsDisplay() {
    const coinsCounter = document.getElementById('coins-counter');
    const coinsAmount = document.getElementById('coins-amount');
    
    if (coinsCounter) coinsCounter.textContent = userSettings.coins || 0;
    if (coinsAmount) coinsAmount.textContent = userSettings.coins || 0;
}

// Инициализация UI
function initUI() {
    playBtn.addEventListener('click', startGame);
    leaderboardBtn.addEventListener('click', showFullLeaderboard);
    howToPlayBtn.addEventListener('click', () => howToPlayModal.style.display = 'flex');
    shopBtn.addEventListener('click', () => {
        document.getElementById('coins-amount').textContent = userSettings.coins;
        shopModal.style.display = 'flex';
    });
    profileBtn.addEventListener('click', showProfileModal);
    
    closeHowToPlayBtn.addEventListener('click', () => howToPlayModal.style.display = 'none');
    closeLeaderboardBtn.addEventListener('click', () => leaderboardModal.style.display = 'none');
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });
    
    restartBtn.addEventListener('click', startGame);
    menuBtn.addEventListener('click', returnToMenu);
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    initMenuButtons();
}