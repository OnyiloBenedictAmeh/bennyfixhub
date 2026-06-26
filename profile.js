avatar:`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=487DE7&color=fff`
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
import {
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


const uid =
  new URLSearchParams(window.location.search)
    .get("uid");

async function loadProfile() {
  if (!uid) return;

  const snap =
    await getDoc(doc(db, "users", uid));

  if (!snap.exists()) return;

  const data = snap.data();

  profileName.textContent =
    data.name || "User";

  profileBio.textContent =
    data.bio || "No bio yet";

  profileEmail.innerHTML =
    `<strong>Email:</strong> ${data.email || ""}`;

  profileLocation.innerHTML =
    `<strong>Location:</strong> ${
      data.location || "Not provided"
    }`;

  profileAvatar.src =
    data.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      data.name || "User"
    )}&background=487DE7&color=fff`;
}
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