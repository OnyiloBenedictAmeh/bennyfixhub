
function loadUserRepairs() {

  if (!currentUser) return;

  const active = document.getElementById("activeRepairs");
  const completed = document.getElementById("completedRepairs");

  if (!active || !completed) return;

  const q = query(
    collection(db, "repairs"),
    where("uid", "==", currentUser.uid)
  );

  onSnapshot(q, (snapshot) => {

    active.innerHTML = "";
    completed.innerHTML = "";

    if (snapshot.empty) {
      active.innerHTML = `
        <p class="empty-text">
          No repair requests yet
        </p>
      `;
      return;
    }
let activeCount = 0;
let completedCount = 0;
    snapshot.forEach((docSnap) => {

      const r = docSnap.data();

      const status = (r.status || "Pending").toLowerCase();

      const progressMap = {
        pending: 20,
        diagnosing: 40,
        fixing: 75,
        completed: 100
      };

      const progress = progressMap[status] || 10;

      const card = document.createElement("div");

      card.className = "repair-card";

      card.innerHTML = `

        <div class="repair-top">

          <div>
            <h3>${r.device}</h3>
            <p>${r.issue}</p>
          </div>

          <span class="status ${status}">
            ${r.status || "Pending"}
          </span>

        </div>

        <div class="repair-progress">

          <div class="progress-bar">
            <div 
              class="progress-fill"
              style="width:${progress}%">
            </div>
          </div>

          <small>${progress}% Complete</small>

        </div>

        ${
          r.assignedTo
          ? `
            <div class="tech-box">
              👨‍🔧 Technician:
              ${r.assignedTo.name}
            </div>
          `
          : ""
        }

<button
  class="journey-btn"
  onclick="togglejourney('${docSnap.id}')"
>
  View Repair Journey
</button>

<div
  class="journey-box hidden"
  id="journey-${docSnap.id}"
>

  ${
    r.journey && r.journey.length
    ? r.journey.map(t => `

      <div class="journey-step">

        <div class="journey-dot"></div>

        <div class="journey-content">
          <strong>${t.stage}</strong>
          <small>${t.time}</small>
        </div>

      </div>

    `).join("")
    : `
      <p class="empty-journey">
        No updates yet
      </p>
    `
  }

</div>
      `;

      if (status === "completed") {
        completedCount++;
        completed.appendChild(card);
      } else {
        activeCount++;
        active.appendChild(card);
      }

    });
document.getElementById("activeCount").innerText =
  activeCount;

document.getElementById("completedCount").innerText =
  completedCount;
  });

}
  document.querySelectorAll("[data-page]").forEach(el => {
  el.addEventListener("click", () => {

    const page = el.getAttribute("data-page");

    document.querySelectorAll(".page")
      .forEach(p => p.classList.remove("active"));

    document.getElementById(page + "Page")
      .classList.add("active");
  });
});
async function loadProfile() {
  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return;

  const data = snap.data();

  // PROFILE PAGE
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerText = value || "Not set";
  };

  set("profileName", data.name || user.email.split("@")[0]);
  set("profileBio", data.bio);
  set("profileEmail", data.email || user.email);
  set("profileLocation", data.location);
  set("profileJoined",
    data.createdAt?.toDate?.().toDateString() || "Unknown"
  );

  document.getElementById("profileAvatar").src =
    data.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || "User")}`;

  document.getElementById("coverImg").src =
    data.coverPhoto || "images/default-cover.jpg";
}
window.openEditProfile = function () {

  document.getElementById("editProfileModal")
    .classList.remove("hidden");

  // preload existing data
  document.getElementById("editName").value =
    document.getElementById("profileName").innerText;

  document.getElementById("editBio").value =
    document.getElementById("profileBio").innerText;

  document.getElementById("editLocation").value =
    document.getElementById("profileLocation").innerText;
};
window.closeEditProfile = function () {
  document.getElementById("editProfileModal")
    .classList.add("hidden");
};
async function uploadAvatar(file, uid) {
  const imageRef = ref(storage, `avatars/${uid}`);
  await uploadBytes(imageRef, file);
  return await getDownloadURL(imageRef);
}
import { updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

window.saveProfile = async function () {
  // avatar: avatarUrl || undefined,
  let avatarUrl;

if (avatarBlob) {
  avatarUrl = await uploadAvatar(avatarBlob, auth.currentUser.uid);
}
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid);

  const updateData = {
    name: document.getElementById("editName").value,
    bio: document.getElementById("editBio").value,
    location: document.getElementById("editLocation").value,
    avatar: document.getElementById("editAvatar").value,
    coverPhoto: document.getElementById("editCover").value
  };

  await updateDoc(ref, updateData);

  await loadProfile(); // IMPORTANT: refresh UI

  closeEditProfile();

  showToast("Profile updated successfully");
};
