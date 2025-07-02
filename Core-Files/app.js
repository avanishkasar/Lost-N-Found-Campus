// Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";
import { query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";


// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCndVZ_mqGMoKMI4U9UG5tmIOvfObjHELk",
  authDomain: "lost-n-found-campus.firebaseapp.com",
  projectId: "lost-n-found-campus",
  storageBucket: "lost-n-found-campus.appspot.com",
  messagingSenderId: "656002920427",
  appId: "1:656002920427:web:c6d2e2d199f48eb604b3ae"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Sign-in
document.getElementById("loginBtn").addEventListener("click", () => {
  signInWithPopup(auth, provider).catch(err => alert(err.message));
});

// Sign-out
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
});

// Handle login state
onAuthStateChanged(auth, (user) => {
  document.getElementById("loginBtn").style.display = user ? "none" : "block";
  document.getElementById("logoutBtn").style.display = user ? "block" : "none";
});

// Submit lost item
document.getElementById("lostForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("itemTitle").value.trim();
  const desc = document.getElementById("itemDesc").value.trim();
  const user = auth.currentUser;

  if (!user) return alert("Login first!");

  try {
    await addDoc(collection(db, "lost_items"), {
      title,
      description: desc,
      user: user.displayName,
      userId: user.uid,
      time: serverTimestamp()
    });

    alert("Posted!");
    document.getElementById("lostForm").reset();
  } catch (err) {
    alert("Error: " + err.message);
  }
});

// Function to show items in the DOM
function showLostItems() {
  const itemsDiv = document.getElementById("itemsList");
  const q = query(collection(db, "lost_items"), orderBy("time", "desc"));

  onSnapshot(q, (snapshot) => {
    itemsDiv.innerHTML = ""; // Clear old list
    snapshot.forEach((doc) => {
      const data = doc.data();

      const itemBox = document.createElement("div");
      itemBox.className = "item-box";

      itemBox.innerHTML = `
        <h3>${data.title}</h3>
        <p>${data.description}</p>
        <small>Posted by: ${data.user || "Anonymous"}</small>
      `;

      itemsDiv.appendChild(itemBox);
    });
  });
}

showLostItems(); // Call it once at load

// Gemini API Key
const GEMINI_API_KEY = 'AIzaSyDoq8GepwDR4kdl9SP2JGnU3mpbIBF9Pzs'; // Ensure this key is valid and enabled for Gemini API

// Generate better description using Gemini
document.getElementById("aiHelpBtn").addEventListener("click", async () => {
  const input = document.getElementById("itemTitle").value.trim();
  if (!input) return alert("Enter the item title first.");

  const prompt = `Help me write a better description for this lost item: "${input}"`;

  try {
    // v1beta is changed to v1
  const res = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await res.json();
    const output = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (output) {
      document.getElementById("itemDesc").value = output;
    } else {
      console.error("Gemini response:", data); // Log the full response for debugging
      alert("Gemini didn't respond properly. Check console for details.");
    }
  } catch (err) {
    alert("Error talking to Gemini: " + err.message);
  }
});