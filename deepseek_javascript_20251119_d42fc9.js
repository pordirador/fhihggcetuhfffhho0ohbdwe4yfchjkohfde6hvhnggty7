// ========== МАГАЗИН ==========
const shopItems = {
    avatars: [
        { id: 1, name: "Зеленый", price: 0, unlocked: true },
        { id: 2, name: "Синий", price: 1 },
        { id: 3, name: "Фиолетовый", price: 1 },
        { id: 4, name: "Оранжевый", price: 1 },
        { id: 5, name: "Розовый", price: 1 },
        { id: 6, name: "Бирюзовый", price: 1 }
    ],
    backgrounds: [
        { id: 1, name: "Зеленый градиент", price: 0, unlocked: true },
        { id: 2, name: "Синий градиент", price: 1 },
        { id: 3, name: "Фиолетовый градиент", price: 1 },
        { id: 4, name: "Оранжевый градиент", price: 1 },
        { id: 5, name: "Серый градиент", price: 1 },
        { id: 6, name: "Коричневый градиент", price: 1 }
    ],
    skins: [
        { id: 1, name: "Зеленая змейка", price: 0, unlocked: true },
        { id: 2, name: "Синяя змейка", price: 1 },
        { id: 3, name: "Фиолетовая змейка", price: 1 },
        { id: 4, name: "Оранжевая змейка", price: 1 },
        { id: 5, name: "Розовая змейка", price: 1 },
        { id: 6, name: "Бирюзовая змейка", price: 1 }
    ]
};

function showShopModal() {
    if (!currentUser.id) {
        showToast('Нужно подключение к интернету');
        return;
    }
    
    updateCoinsDisplay();
    renderShopItems();
    shopModal.style.display = 'flex';
}

function renderShopItems() {
    const categories = [
        { key: 'avatars', containerId: 'avatars-grid' },
        { key: 'backgrounds', containerId: 'backgrounds-grid' },
        { key: 'skins', containerId: 'skins-grid' }
    ];

    categories.forEach(category => {
        const container = document.getElementById(category.containerId);
        if (!container) return;
        container.innerHTML = '';

        const items = shopItems[category.key];
        if (!items) return;

        items.forEach(item => {
            const unlockedKey = category.key;
            const isUnlocked = userSettings.unlockedItems && 
                              userSettings.unlockedItems[unlockedKey] && 
                              userSettings.unlockedItems[unlockedKey].includes(item.id);
            
            const itemEl = document.createElement('div');
            itemEl.className = `shop-item ${isUnlocked ? 'unlocked' : ''}`;
            itemEl.dataset.type = category.key;
            itemEl.dataset.id = item.id;

            if (category.key === 'avatars') {
                itemEl.style.background = getAvatarColor(item.id);
                itemEl.textContent = item.id;
                itemEl.style.display = 'flex';
                itemEl.style.alignItems = 'center';
                itemEl.style.justifyContent = 'center';
                itemEl.style.color = 'white';
                itemEl.style.fontWeight = 'bold';
                itemEl.style.fontSize = '1.2rem';
            } else if (category.key === 'backgrounds') {
                itemEl.classList.add(`profile-bg-${item.id}`);
            } else if (category.key === 'skins') {
                itemEl.classList.add(`snake-color-${item.id}`);
            }

            const nameEl = document.createElement('div');
            nameEl.className = 'item-name';
            nameEl.textContent = item.name;
            itemEl.appendChild(nameEl);

            if (!isUnlocked) {
                const priceTag = document.createElement('div');
                priceTag.className = 'price-tag';
                priceTag.textContent = `${item.price} 🪙`;
                itemEl.appendChild(priceTag);
            }

            itemEl.addEventListener('click', () => handleShopItemClick(category.key, item));
            container.appendChild(itemEl);
        });
    });
}

async function handleShopItemClick(category, item) {
    try {
        const targetCategory = category;
        
        if (!userSettings.unlockedItems) {
            userSettings.unlockedItems = {
                avatars: ["1"],
                backgrounds: ["1"],
                skins: ["1"]
            };
        }
        
        if (!userSettings.unlockedItems[targetCategory]) {
            userSettings.unlockedItems[targetCategory] = ["1"];
        }

        const isUnlocked = userSettings.unlockedItems[targetCategory].includes(item.id.toString());
        
        if (isUnlocked) {
            if (category === 'skins') {
                userSettings.skin = item.id;
            } else if (category === 'avatars') {
                userSettings.avatar = item.id;
            } else if (category === 'backgrounds') {
                userSettings.background = item.id;
            }
            
            applyProfileSettings();
            renderShopItems();
            updateProfileSelection();
            await saveProfileSettings();
            showToast(`${item.name} выбран!`);
        } else {
            if (userSettings.coins >= item.price) {
                if (confirm(`Купить ${item.name} за ${item.price} монет?`)) {
                    userSettings.coins -= item.price;
                    userSettings.unlockedItems[targetCategory].push(item.id.toString());
                    
                    if (category === 'skins') {
                        userSettings.skin = item.id;
                    } else if (category === 'avatars') {
                        userSettings.avatar = item.id;
                    } else if (category === 'backgrounds') {
                        userSettings.background = item.id;
                    }
                    
                    await saveProfileSettings();
                    updateCoinsDisplay();
                    renderShopItems();
                    updateProfileSelection();
                    applyProfileSettings();
                    showToast(`${item.name} куплен и выбран!`);
                }
            } else {
                showToast(`Недостаточно монет! Нужно ещё ${item.price - userSettings.coins}`);
            }
        }
    } catch (error) {
        console.error('Ошибка в обработчике клика:', error);
        showToast('Произошла ошибка при обработке покупки');
    }
}

async function buyItem(type, id) {
    if (userSettings.coins < 10) {
        showToast('Недостаточно монет!');
        return false;
    }
    
    if (!userSettings.unlockedItems[type].includes(id)) {
        userSettings.coins -= 10;
        userSettings.unlockedItems[type].push(id);
        
        try {
            await db.ref(`userSettings/${currentUser.id}`).update({
                coins: userSettings.coins,
                [`unlockedItems/${type}`]: userSettings.unlockedItems[type]
            });
            
            showToast('Покупка успешна!');
            applyProfileSettings();
            return true;
        } catch (error) {
            console.error('Ошибка покупки:', error);
            showToast('Ошибка покупки');
            return false;
        }
    }
    return true;
}

function setupShopTabs() {
    const tabs = document.querySelectorAll('.shop-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            
            const tabId = tab.dataset.tab;
            const contentId = `shop-${tabId}`;
            const tabContent = document.getElementById(contentId);
            
            if (tabContent) {
                tabContent.classList.add('active');
            } else {
                console.error(`Не найден контент для вкладки: ${contentId}`);
            }
        });
    });
}