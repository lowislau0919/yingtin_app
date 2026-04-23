import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

async function deleteAll() {
    try {
        console.log("Fetching all scores to delete...");
        const snap = await getDocs(collection(db, 'scores'));
        console.log(`Found ${snap.docs.length} scores. Deleting...`);
        
        let count = 0;
        for (const d of snap.docs) {
            await deleteDoc(doc(db, 'scores', d.id));
            count++;
        }
        console.log(`Successfully deleted ${count} scores. The leaderboard is now empty.`);
        process.exit(0);
    } catch(e) {
        console.error("Error deleting scores:", e);
        process.exit(1);
    }
}

deleteAll();
