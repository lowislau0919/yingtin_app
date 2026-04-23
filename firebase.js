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
const auth = getAuth(app);
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

// ===== Submit Score (for future games) =====
export async function submitScore(gameName, score) {
    const user = auth.currentUser;
    if (!user) return;
    await addDoc(collection(db, 'leaderboard', gameName, 'scores'), {
        userId:    user.uid,
        name:      user.displayName,
        avatar:    user.photoURL,
        score:     score,
        createdAt: serverTimestamp()
    });
}

// ===== Get Top Scores (for future games) =====
export async function getTopScores(gameName, topN = 10) {
    const q = query(
        collection(db, 'leaderboard', gameName, 'scores'),
        orderBy('score', 'desc'),
        limit(topN)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
}
