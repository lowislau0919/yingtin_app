// ===== Firebase Configuration =====
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
    from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc,
         query, orderBy, limit, getDocs, serverTimestamp }
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
        provider.setCustomParameters({ prompt: 'select_account' });
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
// ===== Date Helpers for Leaderboards =====
function getPeriods() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    // ISO Week calculation
    const d2 = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d2.setUTCDate(d2.getUTCDate() + 4 - (d2.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d2.getUTCFullYear(),0,1));
    const weekNo = Math.ceil(( ( (d2 - yearStart) / 86400000) + 1)/7);

    return {
        daily: `${year}-${month}-${day}`,
        weekly: `${d2.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`,
        monthly: `${year}-${month}`
    };
}

// ===== Submit Score =====
export async function submitScore(gameName, score, playerName) {
    const user = auth.currentUser;
    if (!user) {
        console.error("submitScore: No user logged in!");
        return;
    }
    try {
        const p = getPeriods();
        const docRef = await addDoc(collection(db, 'scores'), {
            userId:    user.uid,
            name:      playerName || user.displayName || 'Guest',
            game:      gameName,
            score:     Number(score),
            dateStr:   p.daily,
            weekStr:   p.weekly,
            monthStr:  p.monthly,
            createdAt: serverTimestamp()
        });

        console.log("✅ Score submitted! Doc ID:", docRef.id, "Name:", playerName, "Score:", score);
    } catch (e) {
        console.error("❌ Score submission failed:", e.code, e.message);
    }
}

// ===== Get Top Scores (one entry per user, best score only) =====
export async function getTopScores(gameName, period = 'all', topN = 10) {
    try {
        console.log(`📊 Fetching leaderboard for: ${gameName} (${period})`);

        let q;
        const p = getPeriods();

        if (period === 'all') {
            q = query(
                collection(db, 'scores'),
                orderBy('score', 'desc'),
                limit(500)
            );
        } else if (period === 'daily') {
            q = query(collection(db, 'scores'), where('dateStr', '==', p.daily));
        } else if (period === 'weekly') {
            q = query(collection(db, 'scores'), where('weekStr', '==', p.weekly));
        } else if (period === 'monthly') {
            q = query(collection(db, 'scores'), where('monthStr', '==', p.monthly));
        }

        // 5-second timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 5000)
        );

        const snap = await Promise.race([getDocs(q), timeoutPromise]);
        console.log("📦 Firestore returned", snap.docs.length, "total docs");

        const allScores = snap.docs.map(d => d.data());

        // Filter by game
        const gameScores = allScores.filter(s => s.game === gameName);

        // Deduplicate: keep only the BEST score per unique NAME
        const bestByName = {};
        for (const s of gameScores) {
            const key = s.name || 'Anon'; // group by player name
            if (!bestByName[key] || Number(s.score) > Number(bestByName[key].score)) {
                bestByName[key] = s;
            }
        }

        // Sort by score descending and take topN
        const topScores = Object.values(bestByName)
            .sort((a, b) => Number(b.score) - Number(a.score))
            .slice(0, topN);

        console.log("🏆 Unique top scores by name:", topScores.length);
        return topScores;
    } catch (e) {
        console.error("❌ Leaderboard fetch FAILED:", e.code, e.message);
        return [];
    }
}
