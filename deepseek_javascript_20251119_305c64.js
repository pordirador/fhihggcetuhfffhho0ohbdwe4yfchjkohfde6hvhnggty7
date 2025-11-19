// ========== ИНИЦИАЛИЗАЦИЯ FIREBASE ==========
const firebaseConfig = {
    apiKey: "AIzaSyBfSUiSe_sWYTLEyA38DN2C7xtKL3uwV8E",
    authDomain: "mr-zmeyka.firebaseapp.com",
    databaseURL: "https://mr-zmeyka-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "mr-zmeyka",
    storageBucket: "mr-zmeyka.appspot.com",
    messagingSenderId: "521576761425",
    appId: "1:521576761425:web:8dc4125c3a1b5f0a285070"
};

// Инициализация Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// Включим логирование для отладки
firebase.database.enableLogging(true);

// Глобальные переменные
let currentUser = {
    id: null,
    display_name: 'Гость'
};

let userSettings = {
    coins: 0,
    avatar: 1,
    background: 1,
    skin: 1,
    unlockedItems: {
        avatars: ["1"],
        backgrounds: ["1"],
        skins: ["1"]
    },
    inventory: {
        avatars: ["1"],
        backgrounds: ["1"],
        skins: ["1"]
    }
};