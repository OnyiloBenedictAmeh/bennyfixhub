import {
  auth,
  db,
  doc,
  getDoc,
  query,
  where,
  collection,
  getDocs,
  onSnapshot,
  updateDoc,
  onAuthStateChanged,
} from "./js/firebase.js";
let currentUid = null;
const profileName = document.getElementById("profileName");
const profileBio = document.getElementById("profileBio");
const profileEmail = document.getElementById("profileEmail");
const profilePhone = document.getElementById("profilePhone");
const profileRole = document.getElementById("profileRole");
const profileLocation = document.getElementById("profileLocation");
const profileAvatar = document.getElementById("profileAvatar");
const profileJoined = document.getElementById("profileJoined");
const coverImg = document.getElementById("coverImg");
const profileProgress = document.getElementById("profileProgress");
const profileProgressText = document.getElementById("profileProgressText");
const editName =
  document.getElementById("editName");
const editPhone =
  document.getElementById("editPhone");
const editLocation =
  document.getElementById("editLocation");
const editBio =
  document.getElementById("editBio");
const editProfileModal =
  document.getElementById("editProfileModal");
const avatarModal =
  document.getElementById("avatarModal");

const avatarPreview =
  document.getElementById("avatarPreview");

const avatarFile =
  document.getElementById("avatarFile");









onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUid = user.uid;

  await loadUserProfile(user.uid);
  await loadRepairStats(user.uid);
  await loadRepairs(user.uid);
  await loadActivity(user.uid);
//   await loadClaimStats(user.uid);
});
async function loadUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));

  if (!snap.exists()) return;

  const data = snap.data();

  // PROFILE COMPLETION

  const fields = [
    data.name,
    data.email,
    data.phone,
    data.location,
    data.bio,
    data.avatar,
    data.coverPhoto,
    data.createdAt,
  ];

  const filled = fields.filter(Boolean).length;

  const percent = Math.round((filled / fields.length) * 100);

  profileProgress.style.width = percent + "%";

  profileProgressText.textContent = `${percent}% Profile Complete`;

  // PROFILE DATA

  profileName.textContent = data.name || "User";

  profileBio.textContent = data.bio || "Welcome to BennyFix Hub";

  profileEmail.textContent = data.email || "";

  profilePhone.textContent = data.phone || "Not set";

  profileRole.textContent = data.role || "Customer";

  profileLocation.textContent = data.location || "Not provided";

  profileAvatar.src =
    data.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      data.name || "User",
    )}&background=487DE7&color=fff`;

  coverImg.src =
    data.coverPhoto ||
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3";

  if (data.createdAt?.toDate) {

  const date = data.createdAt.toDate();

  profileJoined.textContent =
    "Member since " +
    date.toLocaleString("en-US", {
      month: "long",
      year: "numeric"
    });

}
}

async function loadRepairStats(uid) {
  const repairsQuery = query(
    collection(db, "repairs"),
    where("uid", "==", uid),
  );

  const repairsSnap = await getDocs(repairsQuery);

  let total = 0;
  let completed = 0;

  repairsSnap.forEach((docSnap) => {
    const repair = docSnap.data();

    total++;

    if (repair.status === "Completed") {
      completed++;
    }
  });

  repairCount.textContent = total;
  completedCount.textContent = completed;
}
async function loadRepairs(uid) {
  const repairsContainer = document.getElementById("repairsContainer");

  repairsContainer.innerHTML = "";

  const repairsQuery = query(
    collection(db, "repairs"),
    where("uid", "==", uid),
  );

  const repairsSnap = await getDocs(repairsQuery);

  if (repairsSnap.empty) {
    repairsContainer.innerHTML = "<p>No repairs found.</p>";

    return;
  }

  repairsSnap.forEach((docSnap) => {
    const repair = docSnap.data();

    const div = document.createElement("div");

    div.className = "repair-item";

    div.innerHTML = `
  <div>
    <strong>
      ${repair.deviceName || "Unknown Device"}
    </strong>

    <p>
      ${repair.problemType || repair.issue || ""}
    </p>

    <small>
      ${repair.category || ""}
    </small>
  </div>

  <span class="repair-status ${repair.status.toLowerCase()}">
    ${repair.status}
  </span>
`;

    div.addEventListener("click", () => {
      showRepairJourney(repair);
    });

    repairsContainer.appendChild(div);
  });
}
async function loadActivity(uid) {
  const activityFeed = document.getElementById("activityFeed");

  activityFeed.innerHTML = "";

  const repairsQuery = query(
    collection(db, "repairs"),
    where("uid", "==", uid),
  );

  const repairsSnap = await getDocs(repairsQuery);

  if (repairsSnap.empty) {
    activityFeed.innerHTML = "<p>No recent activity.</p>";

    return;
  }

  repairsSnap.forEach((docSnap) => {
    const repair = docSnap.data();

    const activity = document.createElement("div");

    activity.className = "activity-item";

    activity.innerHTML = `
      <strong>
        ${repair.deviceName}
      </strong>

      <p>
        ${repair.status}
      </p>

      <small>
        ${
          repair.createdAt?.toDate
            ? repair.createdAt.toDate().toLocaleString()
            : ""
        }
      </small>
    `;

    activityFeed.appendChild(activity);
  });
}
function showRepairJourney(repair) {
  const container = document.getElementById("repairJourney");

  const timeline = repair.timeline || [];

  container.innerHTML = timeline
    .map(
      (item) => `
      <div class="timeline-item">

        <div class="timeline-dot"></div>

        <div>

          <strong>
            ${item.stage}
          </strong>

          <p>
            ${item.time}
          </p>

        </div>

      </div>
    `,
    )
    .join("");
}
window.openEditProfile = async function () {
  const snap = await getDoc(doc(db, "users", currentUid));

  if (!snap.exists()) return;

  const data = snap.data();

  editName.value = data.name || "";

  editPhone.value = data.phone || "";

  editLocation.value = data.location || "";

  editBio.value = data.bio || "";

  editProfileModal.style.display = "flex";
};
window.closeEditProfile = function () {
  editProfileModal.style.display = "none";
};
window.saveProfile = async function () {
  try {
    await updateDoc(doc(db, "users", currentUid), {
      name: editName.value.trim(),
      phone: editPhone.value.trim(),
      location: editLocation.value.trim(),
      bio: editBio.value.trim(),
    });

    closeEditProfile();

    await loadUserProfile(currentUid);
    await loadRepairStats(currentUid);
    await loadRepairs(currentUid);
    await loadActivity(currentUid);

    alert("Profile updated successfully");
  } catch (error) {
    console.error(error);

    alert("Failed to update profile");
  }
};
async function loadClaimStats(uid) {

  const claimsQuery = query(
    collection(db, "claims"),
    where("uid", "==", uid)
  );

  const claimsSnap =
    await getDocs(claimsQuery);

  claimCount.textContent =
    claimsSnap.size;
}
window.openAvatarModal = function () {

  avatarPreview.src =
    profileAvatar.src;

  avatarModal.style.display =
    "flex";

};

window.closeAvatarModal = function () {

  avatarModal.style.display =
    "none";

};
avatarFile.addEventListener(
  "change",
  (e) => {

    const file =
      e.target.files[0];

    if (!file) return;

    avatarPreview.src =
      URL.createObjectURL(file);

  }
);
window.uploadAvatar = async function () {

  try {

    const file =
      avatarFile.files[0];

    if (!file) {
      showToast(
        "Please select an image",
        "error"
      );
      return;
    }

    showToast(
      "Uploading photo...",
      "info"
    );

    const token =
      await auth.currentUser.getIdToken();

    const formData =
      new FormData();

    formData.append(
      "avatar",
      file
    );

    const response =
      await fetch(
        "/api/upload-avatar",
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${token}`
          },
          body: formData
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.error
      );
    }

    profileAvatar.src =
      result.avatarUrl;

    closeAvatarModal();

    showToast(
      "Profile photo updated",
      "success"
    );

  } catch (error) {

    showToast(
      error.message ||
      "Upload failed",
      "error"
    );

  }

};