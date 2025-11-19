// ========== ФУНКЦИИ ПРОФИЛЯ ==========
async function loadProfileSettings() {
    if (!currentUser.id || currentUser.id.startsWith('local_')) return;
    
    try {
        const snapshot = await db.ref(`userSettings/${currentUser.id}`).once('value');
        
        userSettings = {
            coins: 0,
            avatar: 1,
            background: 1,
            skin: 1,
            unlockedItems: {
                avatars: [1],
                backgrounds: [1],
                skins: [1]
            }
        };

        if (snapshot.exists()) {
            const data = snapshot.val();
            
            if (data.coins) userSettings.coins = Number(data.coins);
            if (data.avatar) userSettings.avatar = Number(data.avatar);
            if (data.background) userSettings.background = Number(data.background);
            if (data.skin) userSettings.skin = Number(data.skin);
            
            if (data.unlockedItems) {
                userSettings.unlockedItems.avatars = data.unlockedItems.avatars?.map(Number) || [1];
                userSettings.unlockedItems.backgrounds = data.unlockedItems.backgrounds?.map(Number) || [1];
                userSettings.unlockedItems.skins = data.unlockedItems.skins?.map(Number) || [1];
            }
        }
        
        applyProfileSettings();
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
        applyProfileSettings();
    }
}

function applyProfileSettings() {
    if (currentUser.id) {
        profileIdSpan.textContent = currentUser.id.substring(0, 8) + '...';
    }
    
    document.body.className = '';
    document.body.classList.add(`profile-bg-${userSettings.background}`);
    
    document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
    document.querySelector(`.avatar-option[data-avatar="${userSettings.avatar}"]`)?.classList.add('selected');
    
    document.querySelectorAll('.background-option').forEach(el => el.classList.remove('selected'));
    document.querySelector(`.background-option[data-bg="${userSettings.background}"]`)?.classList.add('selected');
    
    document.querySelectorAll('.snake-skin-option').forEach(el => el.classList.remove('selected'));
    document.querySelector(`.snake-skin-option[data-skin="${userSettings.skin}"]`)?.classList.add('selected');
    
    updateCoinsDisplay();
}

async function saveProfileSettings() {
    if (!currentUser.id || currentUser.id.startsWith('local_')) return;

    try {
        const saveData = {
            coins: userSettings.coins,
            avatar: userSettings.avatar,
            background: userSettings.background,
            skin: userSettings.skin,
            unlockedItems: {
                avatars: userSettings.unlockedItems.avatars.map(String),
                backgrounds: userSettings.unlockedItems.backgrounds.map(String),
                skins: userSettings.unlockedItems.skins.map(String)
            }
        };

        console.log("Saving data:", saveData);
        await db.ref(`userSettings/${currentUser.id}`).set(saveData);
        return true;
    } catch (error) {
        console.error("Ошибка сохранения настроек:", error);
        showToast("Ошибка сохранения");
        return false;
    }
}

function setupProfileOptions() {
    document.querySelectorAll('.avatar-option').forEach(option => {
        option.addEventListener('click', async () => {
            const avatarNum = parseInt(option.dataset.avatar);
            
            if (!userSettings.unlockedItems.avatars.includes(avatarNum)) {
                const success = await buyItem('avatars', avatarNum);
                if (!success) return;
                applyProfileSettings();
            }
            
            document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
            option.classList.add('selected');
            userSettings.avatar = avatarNum;
            
            if (currentUser.id && !currentUser.id.startsWith('local_')) {
                await db.ref(`userSettings/${currentUser.id}/avatar`).set(avatarNum);
            }
        });
    });
    
    document.querySelectorAll('.background-option').forEach(option => {
        option.addEventListener('click', async () => {
            const bgNum = parseInt(option.dataset.bg);
            
            if (!userSettings.unlockedItems.backgrounds.includes(bgNum)) {
                const success = await buyItem('backgrounds', bgNum);
                if (!success) return;
                applyProfileSettings();
            }
            
            document.querySelectorAll('.background-option').forEach(el => el.classList.remove('selected'));
            option.classList.add('selected');
            userSettings.background = bgNum;
            
            document.body.className = '';
            document.body.classList.add(`profile-bg-${bgNum}`);
            
            if (currentUser.id && !currentUser.id.startsWith('local_')) {
                await db.ref(`userSettings/${currentUser.id}/background`).set(bgNum);
            }
        });
    });
    
    document.querySelectorAll('.snake-skin-option').forEach(option => {
        option.addEventListener('click', async () => {
            const skinNum = parseInt(option.dataset.skin);
            
            if (!userSettings.unlockedItems.skins.includes(skinNum)) {
                const success = await buyItem('skins', skinNum);
                if (!success) return;
                applyProfileSettings();
            }
            
            document.querySelectorAll('.snake-skin-option').forEach(el => el.classList.remove('selected'));
            option.classList.add('selected');
            userSettings.skin = skinNum;
            
            if (gameActive) draw();
            
            if (currentUser.id && !currentUser.id.startsWith('local_')) {
                await db.ref(`userSettings/${currentUser.id}/skin`).set(skinNum);
            }
        });
    });
    
    profileSaveBtn.addEventListener('click', async () => {
        const newName = profileNameInput.value.trim();
        if (newName.length < 2 || newName.length > 20) {
            showToast('Имя должно быть от 2 до 20 символов');
            return;
        }
        
        try {
            await db.ref(`users/${currentUser.id}`).update({
                display_name: newName,
                last_login: firebase.database.ServerValue.TIMESTAMP
            });
            
            currentUser.display_name = newName;
            updateProfileButton();
            showToast('Профиль сохранен!');
            profileModal.style.display = 'none';
        } catch (error) {
            showToast('Ошибка сохранения');
        }
    });
}

function updateProfileSelection() {
    const avatarGrid = document.querySelector('.avatar-grid');
    if (avatarGrid) {
        avatarGrid.innerHTML = '';
        
        const unlockedAvatars = userSettings.unlockedItems?.avatars || ["1"];
        unlockedAvatars.forEach(avatarId => {
            const avatarOption = document.createElement('div');
            avatarOption.className = `avatar-option ${userSettings.avatar == avatarId ? 'selected' : ''}`;
            avatarOption.dataset.avatar = avatarId;
            avatarOption.textContent = avatarId;
            avatarOption.style.background = getAvatarColor(parseInt(avatarId));
            
            avatarOption.addEventListener('click', function() {
                document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                userSettings.avatar = parseInt(this.dataset.avatar);
            });
            
            avatarGrid.appendChild(avatarOption);
        });
    }
    
    const backgroundGrid = document.querySelector('.background-grid');
    if (backgroundGrid) {
        backgroundGrid.innerHTML = '';
        
        const unlockedBackgrounds = userSettings.unlockedItems?.backgrounds || ["1"];
        unlockedBackgrounds.forEach(bgId => {
            const bgOption = document.createElement('div');
            bgOption.className = `background-option profile-bg-${bgId} ${userSettings.background == bgId ? 'selected' : ''}`;
            bgOption.dataset.bg = bgId;
            
            bgOption.addEventListener('click', function() {
                document.querySelectorAll('.background-option').forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                userSettings.background = parseInt(this.dataset.bg);
                applyProfileBackground();
            });
            
            backgroundGrid.appendChild(bgOption);
        });
    }
    
    const skinGrid = document.querySelector('.snake-skin-grid');
    if (skinGrid) {
        skinGrid.innerHTML = '';
        
        const unlockedSkins = userSettings.unlockedItems?.skins || ["1"];
        unlockedSkins.forEach(skinId => {
            const skinOption = document.createElement('div');
            skinOption.className = `snake-skin-option snake-color-${skinId} ${userSettings.skin == skinId ? 'selected' : ''}`;
            skinOption.dataset.skin = skinId;
            
            skinOption.addEventListener('click', function() {
                document.querySelectorAll('.snake-skin-option').forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                userSettings.skin = parseInt(this.dataset.skin);
                if (gameActive) draw();
            });
            
            skinGrid.appendChild(skinOption);
        });
    }
}