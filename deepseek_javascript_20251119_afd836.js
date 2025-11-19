// ========== ТАБЛИЦА РЕКОРДОВ ==========
const topPlayersList = document.getElementById('top-players');
const fullLeaderboard = document.getElementById('full-leaderboard');

// ========== РАБОТА С FIREBASE ==========
async function identifyUser() {
    try {
        const userCredential = await auth.signInAnonymously();
        const user = userCredential.user;
        
        const userRef = db.ref(`users/${user.uid}`);
        const settingsRef = db.ref(`userSettings/${user.uid}`);
        
        const [userSnapshot, settingsSnapshot] = await Promise.all([
            userRef.once('value'),
            settingsRef.once('value')
        ]);
        
        currentUser = {
            id: user.uid,
            display_name: userSnapshot.exists() ? 
                userSnapshot.val().display_name : 
                `Игрок ${Math.floor(1000 + Math.random() * 9000)}`
        };
        
        userSettings = settingsSnapshot.exists() ? settingsSnapshot.val() : {
            avatar: 1,
            background: 1,
            skin: 1,
            coins: 0,
            inventory: {
                avatars: [1],
                backgrounds: [1],
                skins: [1]
            },
            unlockedItems: {
                avatars: [1],
                backgrounds: [1],
                skins: [1]
            }
        };
        
        updateProfileButton();
        applyProfileSettings();
        updateCoinsDisplay();
        
    } catch (error) {
        console.error('Ошибка идентификации:', error);
        setupOfflineUser();
    }
}

function setupOfflineUser() {
    currentUser = {
        id: 'local_' + Date.now(),
        display_name: 'Гость'
    };
    updateProfileButton();
    showToast('Оффлайн-режим. Результаты не сохранятся.');
}

async function updateProfile() {
    const newName = profileNameInput.value.trim();
    
    if (newName.length < 2 || newName.length > 20) {
        showToast('Имя должно быть от 2 до 20 символов');
        return;
    }
    
    try {
        await db.ref(`userSettings/${currentUser.id}`).set(userSettings);
        
        await db.ref(`users/${currentUser.id}`).update({
            display_name: newName,
            last_login: firebase.database.ServerValue.TIMESTAMP
        });
        
        const scoresRef = db.ref('scores').orderByChild('user_id').equalTo(currentUser.id);
        const snapshot = await scoresRef.once('value');
        
        if (snapshot.exists()) {
            const updates = {};
            snapshot.forEach(child => {
                updates[`scores/${child.key}/display_name`] = newName;
                updates[`scores/${child.key}/avatar`] = userSettings.avatar;
            });
            await db.ref().update(updates);
        }
        
        currentUser.display_name = newName;
        updateProfileButton();
        applyProfileBackground();
        applyProfileSettings();
        
        profileModal.style.display = 'none';
        showToast('Профиль и все рекорды обновлены!');
        
        await loadLeaderboard(topPlayersList, 5);
        
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        showToast('Ошибка обновления профиля');
    }
}

async function saveScore() {
    if (!currentUser.id || currentUser.id.startsWith('local_') || score === 0) return;
    
    try {
        const userScoresRef = db.ref('scores').orderByChild('user_id').equalTo(currentUser.id);
        const snapshot = await userScoresRef.once('value');
        
        let bestScore = 0;
        let bestScoreKey = null;
        
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const childScore = child.val().score;
                if (childScore > bestScore) {
                    bestScore = childScore;
                    bestScoreKey = child.key;
                }
            });
        }
        
        if (score > bestScore) {
            if (bestScoreKey) {
                await db.ref(`scores/${bestScoreKey}`).remove();
            }
            
            const newScore = {
                user_id: currentUser.id,
                display_name: currentUser.display_name,
                avatar: userSettings.avatar,
                score: score,
                date: firebase.database.ServerValue.TIMESTAMP
            };
            
            await db.ref('scores').push(newScore);
            showToast(`Новый рекорд: ${score} очков!`);
        } else {
            showToast(`Ваш лучший рекорд: ${bestScore} очков`);
        }
        
        await loadLeaderboard(topPlayersList, 5);
    } catch (error) {
        console.error('Ошибка сохранения результата:', error);
        showToast('Не удалось сохранить результат');
    }
}

async function loadLeaderboard(targetElement = topPlayersList, limit = 5) {
    try {
        targetElement.innerHTML = '<li style="display: flex; align-items: center;"><span class="loading-spinner"></span>Загрузка...</li>';
        
        const scoresRef = db.ref('scores').orderByChild('score').limitToLast(100);
        const snapshot = await scoresRef.once('value');
        
        if (!snapshot.exists()) {
            targetElement.innerHTML = '<li class="no-scores">Рекордов пока нет<br><small>Сыграйте и сохраните свой результат!</small></li>';
            return;
        }
        
        const bestScores = {};
        snapshot.forEach(child => {
            const scoreData = child.val();
            if (!bestScores[scoreData.user_id] || scoreData.score > bestScores[scoreData.user_id].score) {
                bestScores[scoreData.user_id] = {
                    id: child.key,
                    ...scoreData
                };
            }
        });
        
        const scoresArray = Object.values(bestScores);
        scoresArray.sort((a, b) => b.score - a.score);
        
        targetElement.innerHTML = '';
        
        const itemsToShow = limit ? scoresArray.slice(0, limit) : scoresArray;
        
        if (itemsToShow.length === 0) {
            targetElement.innerHTML = '<li class="no-scores">Рекордов пока нет<br><small>Сыграйте и сохраните свой результат!</small></li>';
            return;
        }
        
        itemsToShow.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'leaderboard-entry';
            if (item.user_id === currentUser.id) {
                li.classList.add('current-user');
            }
            
            const avatar = item.avatar || 1;
            const avatarColor = getAvatarColor(item.avatar || 1);
            
            li.innerHTML = `
                <div class="player-info">
                    <div class="player-avatar" style="background: ${avatarColor}"></div>
                    <span>${item.display_name}</span>
                </div>
                <div class="player-score">${item.score || 0}</div>
            `;
            
            targetElement.appendChild(li);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки рекордов:', error);
        targetElement.innerHTML = '<li class="no-scores">Не удалось загрузить рекорды<br><small>Попробуйте позже</small></li>';
    }
}

function getAvatarColor(avatarNum) {
    const colors = [
        'linear-gradient(135deg, #4CAF50, #8BC34A)',
        'linear-gradient(135deg, #2196F3, #03A9F4)',
        'linear-gradient(135deg, #9C27B0, #E91E63)',
        'linear-gradient(135deg, #FF9800, #FFC107)',
        'linear-gradient(135deg, #607D8B, #9E9E9E)',
        'linear-gradient(135deg, #795548, #3E2723)'
    ];
    return colors[(avatarNum - 1) % colors.length];
}

async function loadInventory() {
    if (!currentUser.id) return;
    
    try {
        const snapshot = await db.ref(`userSettings/${currentUser.id}/unlockedItems`).once('value');
        if (snapshot.exists()) {
            userSettings.unlockedItems = snapshot.val();
            applyProfileSettings();
        }
    } catch (error) {
        console.error('Ошибка загрузки инвентаря:', error);
    }
}

function initUserSettings() {
    if (!userSettings) {
        userSettings = {
            coins: 0,
            avatar: 1,
            background: 1,
            skin: 1,
            unlockedItems: {
                avatars: ["1"],
                backgrounds: ["1"],
                skins: ["1"]
            }
        };
    }
    
    if (!userSettings.unlockedItems) {
        userSettings.unlockedItems = {
            avatars: ["1"],
            backgrounds: ["1"],
            skins: ["1"]
        };
    }
    
    if (!userSettings.unlockedItems.avatars) userSettings.unlockedItems.avatars = ["1"];
    if (!userSettings.unlockedItems.backgrounds) userSettings.unlockedItems.backgrounds = ["1"];
    if (!userSettings.unlockedItems.skins) userSettings.unlockedItems.skins = ["1"];
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
async function init() {
    initUI();
    setupProfileOptions();
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    db.ref('.info/connected').on('value', async (snap) => {
        if (snap.val() === true) {
            console.log("Connected to Firebase");
            await identifyUser();
            await loadProfileSettings();
            applyProfileBackground();
            loadLeaderboard(topPlayersList, 5);
            
            if (currentUser.id && !currentUser.id.startsWith('local_')) {
                await loadInventory();
            }
        } else {
            console.log("Disconnected from Firebase");
            setupOfflineUser();
            userSettings = { 
                avatar: 1, 
                background: 1, 
                skin: 1,
                coins: 0,
                inventory: {
                    avatars: [1],
                    backgrounds: [1],
                    skins: [1]
                },
                unlockedItems: {
                    avatars: [1],
                    backgrounds: [1],
                    skins: [1]
                }
            };
            applyProfileBackground();
        }
    });
    
    setupShopTabs();
    document.querySelectorAll('.shop-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.shop-tab-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const tabContent = document.getElementById(`shop-${tab.dataset.tab}`);
            if (tabContent) {
                tabContent.classList.add('active');
            } else {
                console.error(`Элемент shop-${tab.dataset.tab} не найден`);
            }
        });
    });
    
    userSettings = userSettings || { 
        avatar: 1, 
        background: 1, 
        skin: 1,
        coins: 0,
        inventory: {
            avatars: [1],
            backgrounds: [1],
            skins: [1]
        },
        unlockedItems: {
            avatars: [1],
            backgrounds: [1],
            skins: [1]
        }
    };
}

// Запуск игры при загрузке страницы
window.addEventListener('load', init);