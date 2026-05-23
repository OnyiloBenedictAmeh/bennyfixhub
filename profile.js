avatar:
`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=487DE7&color=fff`
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "bennyfixhub.firebaseapp.com",
  projectId: "bennyfixhub",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// get UID from URL
const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get("uid");

async function loadProfile() {
  if (!uid) {
    document.body.innerHTML = "No user selected";
    return;
  }

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    document.body.innerHTML = "User not found";
    return;
  }

  const u = snap.data();

  document.getElementById("name").innerText = u.name || "User";
  document.getElementById("email").innerText = u.email || "";
  document.getElementById("role").innerText = u.role || "user";

  document.getElementById("avatar").src =
    u.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "User")}`;

  document.getElementById("joined").innerText =
    u.createdAt?.toDate?.().toLocaleDateString() || "Unknown";
}

loadProfile();
const auth = getAuth();
const db = getFirestore();

async function loadProfile() {

  const user = auth.currentUser;

  if (!user) return;

  const ref = doc(db, "users", user.uid);

  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("profileName").innerText =
    data.name || "User";

  document.getElementById("profileBio").innerText =
    data.bio || "No bio yet";

  document.getElementById("profileEmail").innerText =
    data.email || "";

  document.getElementById("profileLocation").innerText =
    data.location || "No location";

  document.getElementById("profileAvatar").src =
    data.avatar;

  document.getElementById("coverImg").src =
    data.coverPhoto ||
    "images/default-cover.jpg";
}
import {
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

window.saveProfile = async function () {

  const user = auth.currentUser;

  await updateDoc(
    doc(db, "users", user.uid),
    {
      name:
        document.getElementById("editName").value,

      bio:
        document.getElementById("editBio").value,

      location:
        document.getElementById("editLocation").value
    }
  );

  showToast("Profile updated");
};
function loadRepairStats() {

  const user = auth.currentUser;

  const q = query(
    collection(db, "repairs"),
    where("uid", "==", user.uid)
  );

  onSnapshot(q, (snapshot) => {

    let total = 0;
    let completed = 0;

    snapshot.forEach((docSnap) => {

      const r = docSnap.data();

      total++;

      if (r.status === "Completed") {
        completed++;
      }

      addActivity(r);

    });

    document.getElementById("repairCount").innerText =
      total;

    document.getElementById("completedCount").innerText =
      completed;
  });
}
function addActivity(repair) {

  const feed =
    document.getElementById("activityFeed");

  const div =
    document.createElement("div");

  div.className = "activity-item";

  div.innerHTML = `
    <div class="activity-avatar">
      🔧
    </div>

    <div class="activity-content">

      <strong>
        ${repair.device}
      </strong>

      <p>
        ${repair.status}
      </p>

      <small>
        ${repair.issue}
      </small>

    </div>
  `;

  feed.prepend(div);
}