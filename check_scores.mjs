import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCtV0fOm2EKGvHbCLEdmALXcNp-7UYZCAk",
    authDomain: "yingtinapp.firebaseapp.com",
    projectId: "yingtinapp",
    storageBucket: "yingtinapp.firebasestorage.app",
    messagingSenderId: "853952234796",
    appId: "1:853952234796:web:f88a2741b61ef4835a9889",
    measurementId: "G-HLQ2LQ1RJP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
    try {
        console.log("Fetching latest 5 scores...");
        const q = query(collection(db, 'scores'), orderBy('createdAt', 'desc'), limit(5));
        const snap = await getDocs(q);
        snap.docs.forEach(d => {
            console.log(d.id, "=>", d.data());
        });
        
        console.log("\nTesting daily query...");
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dailyStr = `${year}-${month}-${day}`;
        console.log("Looking for dateStr:", dailyStr);
        
        const q2 = query(collection(db, 'scores'), where('dateStr', '==', dailyStr));
        const snap2 = await getDocs(q2);
        console.log(`Found ${snap2.docs.length} daily scores`);
    } catch(e) {
        console.error(e);
    }
}

check();
