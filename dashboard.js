const auth = window.auth;
const db = window.db;
const storage = window.storage;
window.avatarBlob = null
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
            <h3>${r.deviceName || r.device || "Unknown device"}</h3>
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
window.loadProfile = async function () {

  const user = window.auth?.currentUser;

  if (!user) return;

  const snap = await getDoc(doc(window.db, "users", user.uid));

  if (!snap.exists()) return;

  const data = snap.data();

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerText = value || "Not set";
  };

  set("profileName", data.name || user.email.split("@")[0]);
  set("profileBio", data.bio);
  set("profileEmail", data.email || user.email);
  set("profileLocation", data.location);
  set(
    "profileJoined",
    data.createdAt?.toDate?.().toDateString() || "Unknown"
  );

  const avatar = document.getElementById("profileAvatar");
  if (avatar) {
    avatar.src =
      data.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        data.name || "User"
      )}`;
  }

  const cover = document.getElementById("coverImg");
  if (cover) {
    cover.src =
      data.coverPhoto || "images/default-cover.jpg";
  }
};
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
  const modal = document.getElementById("editProfileModal");
  if (!modal) return;

  modal.classList.add("hidden");
};
async function uploadAvatar(file, uid) {
  const imageRef = ref(storage, `avatars/${uid}`);
  await uploadBytes(imageRef, file);
  return await getDownloadURL(imageRef);
}
window.saveProfile = async function () {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid);

  const btn = document.querySelector("saveProfileBtn");
  if (btn) {
    btn.disabled = true;
    btn.innerText = "Saving...";
  }

  try {
    let avatarUrl = null;

    if (window.avatarBlob) {
      avatarUrl = await uploadAvatar(window.avatarBlob, user.uid);
    }

    const updateData = {
      name: document.getElementById("editName").value,
      bio: document.getElementById("editBio").value,
      location: document.getElementById("editLocation").value,
      coverPhoto: document.getElementById("editCover").value || ""
    };

    if (avatarUrl) {
      updateData.avatar = avatarUrl;
    }

    await updateDoc(ref, updateData);

    await loadProfile();

    closeEditProfile();

    showToast("Profile updated successfully");

    window.avatarBlob = null;

  } catch (err) {
    console.error(err);
    showToast("Failed to update profile");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = "Save Changes";
    }
  }
};

let cropper = null;


window.addEventListener("DOMContentLoaded", () => {
  const avatar = document.getElementById("profileAvatar");
  const file = document.getElementById("avatarFile");

  if (!avatar || !file) return;

  if (avatar) avatar.style.cursor = "pointer";

  avatar.addEventListener("click", () => {
    file.click();
  });
  file.addEventListener("change", (e) => {
    const selectedFile =
      e.target.files[0];

    if (!selectedFile) return;

    const reader = new FileReader();

    reader.onload = (event) => {

      const cropImg =
        document.getElementById("cropImage");

      cropImg.src = event.target.result;

      document
        .getElementById("cropModal")
        .classList.remove("hidden");

      if (cropper) {
        cropper.destroy();
      }

      cropper = new Cropper(cropImg, {
        aspectRatio: 1,
        viewMode: 1,
        dragMode: "move",
        autoCropArea: 1,
        responsive: true,
        background: false,
        movable: true,
        zoomable: true,
        scalable: false,
        cropBoxResizable: false
      });
    };

    reader.readAsDataURL(selectedFile);
  });

  const zoom =
    document.getElementById("zoomSlider");

 if (zoom) {
  zoom.addEventListener("input", () => {
    if (cropper) cropper.zoomTo(zoom.value);
  });
}
});
window.closeCropper = function () {
  document
    .getElementById("cropModal")
    .classList.add("hidden");

  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
};

window.cropAvatar = function () {

  if (!cropper) return;

  const canvas =
    cropper.getCroppedCanvas({
      width: 500,
      height: 500
    });

  canvas.toBlob((blob) => {

    window.avatarBlob = blob;

    const preview =
      document.getElementById("profileAvatar");

    preview.src =
      URL.createObjectURL(blob);

    closeCropper();

  }, "image/jpeg", 0.9);
};