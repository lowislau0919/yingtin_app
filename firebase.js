// ===== Firebase Configuration =====
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
    from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc,
         query, orderBy, limit, getDocs, serverTimestamp, where, deleteDoc }
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
        const finalName = playerName || user.displayName || 'Guest';

        // Check if name is already taken by another Google Account
        const nameQuery = query(collection(db, 'scores'), where('name', '==', finalName), limit(1));
        const nameSnap = await getDocs(nameQuery);
        if (!nameSnap.empty) {
            const existingUserId = nameSnap.docs[0].data().userId;
            if (existingUserId !== user.uid) {
                alert(`The name "${finalName}" is already taken by another Google account. Please use a different name! / 這個名字已被其他帳號使用，請選擇另一個名字！`);
                return false; // Stop submission
            }
        }

        const docRef = await addDoc(collection(db, 'scores'), {
            userId:    user.uid,
            name:      finalName,
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
        const baseQuery = collection(db, 'scores');

        if (period === 'all') {
            q = query(
                baseQuery,
                where('game', '==', gameName),
                orderBy('score', 'desc'),
                limit(100) // Fetch top 100 to deduplicate
            );
        } else if (period === 'daily') {
            q = query(baseQuery, where('game', '==', gameName), where('dateStr', '==', p.daily), orderBy('score', 'desc'), limit(100));
        } else if (period === 'weekly') {
            q = query(baseQuery, where('game', '==', gameName), where('weekStr', '==', p.weekly), orderBy('score', 'desc'), limit(100));
        } else if (period === 'monthly') {
            q = query(baseQuery, where('game', '==', gameName), where('monthStr', '==', p.monthly), orderBy('score', 'desc'), limit(100));
        }

        // 5-second timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 5000)
        );

        const snap = await Promise.race([getDocs(q), timeoutPromise]);
        console.log("📦 Firestore returned", snap.docs.length, "docs for", gameName);

        const allScores = snap.docs.map(d => d.data());

        // Deduplicate: keep only the BEST score per unique USER (using userId for better sync)
        const bestByUser = {};
        for (const s of allScores) {
            const key = s.userId || s.name || 'Anon'; 
            if (!bestByUser[key] || Number(s.score) > Number(bestByUser[key].score)) {
                bestByUser[key] = s;
            }
        }

        // Sort by score descending and take topN
        const topScores = Object.values(bestByUser)
            .sort((a, b) => Number(b.score) - Number(a.score))
            .slice(0, topN);

        console.log("🏆 Unique top scores:", topScores.length);
        return topScores;
    } catch (e) {
        console.error("❌ Leaderboard fetch FAILED:", e.code, e.message);
        // Fallback for missing index: try fetching without orderBy and sort in memory
        if (e.code === 'failed-precondition') {
            console.warn("⚠️ Firestore index missing! Falling back to in-memory sort...");
            const qFallback = query(collection(db, 'scores'), where('game', '==', gameName), limit(500));
            const snapFallback = await getDocs(qFallback);
            const allScores = snapFallback.docs.map(d => d.data());
            const bestByUser = {};
            for (const s of allScores) {
                const key = s.userId || s.name || 'Anon';
                if (!bestByUser[key] || Number(s.score) > Number(bestByUser[key].score)) {
                    bestByUser[key] = s;
                }
            }
            return Object.values(bestByUser)
                .sort((a, b) => Number(b.score) - Number(a.score))
                .slice(0, topN);
        }
        return [];
    }
}

// Admin function to wipe all scores
export async function wipeAllScores() {
    try {
        const snap = await getDocs(collection(db, 'scores'));
        let count = 0;
        for (const d of snap.docs) {
            await deleteDoc(doc(db, 'scores', d.id));
            count++;
        }
        alert(`Admin: Successfully deleted ${count} scores! Leaderboard is reset.`);
        window.location.href = window.location.pathname; // remove ?admin=reset
    } catch (e) {
        alert(`Admin Delete Error: ${e.message}`);
    }
}

// Secret URL trigger
if (window.location.search.includes('admin=reset')) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            document.body.innerHTML = '<h1 style="color:white; text-align:center; margin-top:50px;">Deleting all scores... Please wait.</h1>';
            await wipeAllScores();
        } else {
            alert('Admin: You must log in first to delete scores!');
        }
    });
}
