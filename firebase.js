// ===== Firebase Configuration =====
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
    from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc,
         query, orderBy, limit, getDocs, getDocsFromServer, serverTimestamp }
    from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyCtV0FOm2EKGvHbCLEdmAlXcNp-7UYZCAk",
    authDomain: "yingtinapp.firebaseapp.com",
    projectId: "yingtinapp",
    storageBucket: "yingtinapp.firebasestorage.app",
    messagingSenderId: "853952234796",
    appId: "1:853952234796:web:f88a2741b61ef4835a9889"
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db   = getFirestore(app);
const provider = new GoogleAuthProvider();

// ===== Auth UI Elements =====
const loginBtn   = document.getElementById('loginBtn');
const logoutBtn  = document.getElementById('logoutBtn');
const userAvatar = document.getElementById('userAvatar');
const userName   = document.getElementById('userName');
const userInfo   = document.getElementById('userInfo');

// ===== Sign In =====
loginBtn.addEventListener('click', async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        await saveUserProfile(result.user);
    } catch (e) {
        console.error('Login error:', e);
    }
});

// ===== Sign Out =====
logoutBtn.addEventListener('click', () => signOut(auth));

// ===== Save User Profile to Firestore =====
async function saveUserProfile(user) {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
        await setDoc(userRef, {
            name: user.displayName,
            email: user.email,
            avatar: user.photoURL,
            createdAt: serverTimestamp()
        });
    }
}

// ===== Auth State Listener =====
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginBtn.style.display  = 'none';
        userInfo.style.display  = 'flex';
        userAvatar.src          = user.photoURL || '';
        userAvatar.style.display = user.photoURL ? 'block' : 'none';
        userName.textContent    = user.displayName || user.email;
    } else {
        loginBtn.style.display  = 'flex';
        userInfo.style.display  = 'none';
    }
});

// ===== Submit Score =====
export async function submitScore(gameName, score, playerName) {
    const user = auth.currentUser;
    if (!user) return;
    try {
        await addDoc(collection(db, 'scores'), {
            userId:    user.uid,
            name:      playerName || user.displayName || 'Guest',
            game:      gameName,
            score:     score,
            createdAt: serverTimestamp()
        });
    } catch (e) {
        console.error("Score submission failed:", e);
    }
}

// ===== Get Top Scores =====
export async function getTopScores(gameName, topN = 10) {
    const demoScores = [
        { name: "YingTin", score: 500 },
        { name: "SnakePro", score: 300 },
        { name: "AppleLover", score: 150 }
    ];

    try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout")), 3000)
        );

        // Simple query: orderBy 'score' only to avoid composite index issues
        const q = query(
            collection(db, 'scores'),
            orderBy('score', 'desc'),
            limit(100)
        );

        // Force fetch from server to avoid any cache hangs
        const snap = await Promise.race([
            getDocsFromServer(q),
            timeoutPromise
        ]);

        const allScores = snap.docs.map(d => d.data());
        const filtered = allScores
            .filter(s => s.game === gameName)
            .slice(0, topN);

        // FALLBACK: If no online scores yet, show these demo scores
        if (filtered.length === 0) {
            return [
                { name: "YingTin (Top)", score: 500 },
                { name: "Snake Master", score: 250 },
                { name: "Fruit Hunter", score: 120 }
            ];
        }

        return filtered;
    } catch (e) {
        console.warn("Leaderboard fetch failed:", e);
        return [
            { name: "Guest User", score: 100 },
            { name: "Demo Player", score: 50 }
        ];
    }
}
