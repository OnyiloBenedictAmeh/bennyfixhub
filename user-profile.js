import {
  auth,
  db,
  doc,
  getDoc,
  query,
  where,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  onAuthStateChanged,
} from "./js/firebase.js";
let currentUid = null;
let viewedUid = null;
let isViewingOwnProfile = true;
let currentUserRole = "user";
let userMessages = [];
const AVATAR_UPLOAD_API_URL =
  "https://bennyfix-backend-v.vercel.app/api/upload-avatar";
const previousPageUrl = document.referrer;
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
const editProfileBtn =
  document.getElementById("editProfileBtn");
const avatarWrap =
  document.querySelector(".avatar-wrap");
const profileBackBtn =
  document.getElementById("profileBackBtn");
// const avatarModal =
//   document.getElementById("avatarModal");

// const avatarPreview =
//   document.getElementById("avatarPreview");

const avatarFile =
  document.getElementById("avatarFile");
let cropper = null;








onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUid = user.uid;
  viewedUid = user.uid;

  const requestedUid =
    new URLSearchParams(window.location.search).get("uid");

  const currentUserSnap =
    await getDoc(doc(db, "users", user.uid));

  currentUserRole =
    currentUserSnap.exists()
      ? currentUserSnap.data().role || "user"
      : "user";

  if (requestedUid && requestedUid !== user.uid) {
    if (currentUserRole !== "admin") {
      alert("You do not have permission to view this profile");
      window.location.href = "user-profile.html";
      return;
    }

    viewedUid = requestedUid;
  }

  isViewingOwnProfile = viewedUid === currentUid;
  setProfileEditMode();
  setBackButton();

  try {
    await loadUserProfile(viewedUid);
    await loadRepairStats(viewedUid);
    await loadRepairs(viewedUid);
    await loadActivity(viewedUid);
    listenToUserMessages(viewedUid);
  } finally {
    finishProfileLoading();
  }
//   await loadClaimStats(user.uid);
});

function finishProfileLoading() {
  document.body.classList.remove("profile-loading");

  document
    .querySelectorAll(".skeleton-text")
    .forEach((el) => {
      el.classList.remove(
        "skeleton-text",
        "skeleton-title",
        "skeleton-line",
        "skeleton-chip",
        "skeleton-number",
        "skeleton-value"
      );
    });

  document
    .querySelectorAll(".skeleton-block, .skeleton-avatar")
    .forEach((el) => {
      el.classList.remove("skeleton-block", "skeleton-avatar");
    });
}

function setProfileEditMode() {
  const canEditProfile = isViewingOwnProfile;

  if (editProfileBtn) {
    editProfileBtn.style.display =
      canEditProfile ? "inline-block" : "none";
  }

  if (avatarWrap) {
    avatarWrap.classList.toggle("readonly", !canEditProfile);
  }
}

function setBackButton() {
  if (!profileBackBtn) return;

  profileBackBtn.style.display = "inline-flex";

  const cameFrom =
    previousPageUrl.includes("admin.html")
      ? "Admin"
      : previousPageUrl.includes("index.html")
      ? "Home"
      : viewedUid !== currentUid
      ? "Admin"
      : "Home";

  profileBackBtn.textContent = `← Back to ${cameFrom}`;
}

window.goBackFromProfile = function () {
  const fallbackPage =
    viewedUid && viewedUid !== currentUid
      ? "admin.html"
      : "index.html";

  if (previousPageUrl) {
    const previousUrl = new URL(previousPageUrl);

    if (previousUrl.origin === window.location.origin) {
      window.history.back();
      return;
    }
  }

  window.location.href = fallbackPage;
};

function listenToUserMessages(uid) {
  if (!isViewingOwnProfile) return;

  onSnapshot(collection(db, "notifications"), (snapshot) => {
    userMessages = [];

    snapshot.forEach((docSnap) => {
      const message = {
        id: docSnap.id,
        ...docSnap.data(),
      };

      if (
        message.type === "message" &&
        (message.receiverUid === uid || message.senderUid === uid)
      ) {
        userMessages.push(message);
      }
    });

    userMessages.sort((a, b) => getMessageTime(b.createdAt) - getMessageTime(a.createdAt));
    renderUserMessages();
  });
}

function renderUserMessages() {
  const container = document.getElementById("userMessages");
  if (!container) return;

  if (!userMessages.length) {
    container.innerHTML = "<p>No messages yet.</p>";
    return;
  }

  container.innerHTML = userMessages.map((message) => {
    const outgoing = message.senderUid === currentUid;
    return `
      <div class="message-item ${outgoing ? "outgoing" : "incoming"}">
        <strong>${outgoing ? "You" : message.senderName || "Admin"}</strong>
        <p>${message.message || ""}</p>
        <small>${formatMessageDate(message.createdAt)}</small>
      </div>
    `;
  }).join("");
}

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
  if (!isViewingOwnProfile) {
    return showToast(
      "Admins can view user profiles, but cannot edit them here",
      "info"
    );
  }

  const snap = await getDoc(doc(db, "users", currentUid));

  if (!snap.exists()) return;

  const data = snap.data();

  editName.value = data.name || "";

  editPhone.value = data.phone || "";

  editLocation.value = data.location || "";

  editBio.value = data.bio || "";

  editProfileModal.classList.remove("hidden");
  editProfileModal.style.display = "flex";
};
window.closeEditProfile = function () {
  editProfileModal.classList.add("hidden");
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

window.openUserMessageModal = function () {
  document.getElementById("userMessageText").value = "";
  document.getElementById("userMessageModal").classList.remove("hidden");
  document.getElementById("userMessageModal").style.display = "flex";
};

window.closeUserMessageModal = function () {
  document.getElementById("userMessageModal").classList.add("hidden");
  document.getElementById("userMessageModal").style.display = "none";
};

window.sendUserMessage = async function () {
  const text = normalizeMessageText(
    document.getElementById("userMessageText").value
  );

  if (!text) return showToast("Write a message first", "info");

  const duplicate = await hasRecentDuplicateMessage({
    senderUid: currentUid,
    receiverUid: "admin",
    message: text,
  });

  if (duplicate) {
    return showToast("This message was already sent recently", "info");
  }

  const snap = await getDoc(doc(db, "users", currentUid));
  const data = snap.exists() ? snap.data() : {};

  try {
    await addDoc(collection(db, "notifications"), {
      type: "message",
      audience: "admin",
      senderUid: currentUid,
      senderRole: data.role || "user",
      senderName: data.name || data.email || "User",
      receiverUid: "admin",
      receiverRole: "admin",
      receiverName: "Admin",
      message: text,
      dedupeKey: `${currentUid}_admin_${text.toLowerCase()}`,
      read: false,
      createdAt: serverTimestamp(),
    });

    closeUserMessageModal();
    showToast("Message sent", "success");
  } catch (err) {
    console.error(err);
    showToast("Could not send message", "error");
  }
};

function normalizeMessageText(text) {
  return text.trim().replace(/\s+/g, " ");
}

function getMessageTime(value) {
  if (!value) return 0;
  if (value.toDate) return value.toDate().getTime();
  if (value.seconds) return value.seconds * 1000;
  return new Date(value).getTime() || 0;
}

function formatMessageDate(value) {
  if (!value) return "Just now";
  if (value.toDate) return value.toDate().toLocaleString();
  if (value.seconds) return new Date(value.seconds * 1000).toLocaleString();
  return String(value);
}

async function hasRecentDuplicateMessage({ senderUid, receiverUid, message }) {
  const normalized = normalizeMessageText(message).toLowerCase();
  const duplicateQuery = query(
    collection(db, "notifications"),
    where("type", "==", "message"),
    where("dedupeKey", "==", `${senderUid}_${receiverUid}_${normalized}`)
  );

  const snapshot = await getDocs(duplicateQuery);
  const now = Date.now();

  return snapshot.docs.some((docSnap) => {
    const sentAt = getMessageTime(docSnap.data().createdAt);
    return sentAt && now - sentAt < 60000;
  });
}

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
document.addEventListener(
  "DOMContentLoaded",
  () => {

    const avatar =
      document.getElementById(
        "profileAvatar"
      );

    const file =
      document.getElementById(
        "avatarFile"
      );

    avatar.addEventListener(
      "click",
      () => {
        if (!isViewingOwnProfile) return;
        file.click();
      }
    );

    file.addEventListener(
      "change",
      handleAvatarSelection
    );
  }
);
function handleAvatarSelection(e) {
  if (!isViewingOwnProfile) {
    e.target.value = "";
    return;
  }

  const file =
    e.target.files[0];

  if (!file) return;

  const reader =
    new FileReader();

  reader.onload = (event) => {

    const cropImage =
      document.getElementById(
        "cropImage"
      );

    cropImage.src =
      event.target.result;

    const modal =
  document.getElementById("cropModal");

modal.classList.remove("hidden");
modal.style.display = "flex";

    if (cropper) {
      cropper.destroy();
    }

    cropper =
      new Cropper(
        cropImage,
        {
          aspectRatio: 1,
          viewMode: 1,
          dragMode: "move",
          autoCropArea: 1,
          background: false,
          movable: true,
          zoomable: true,
          cropBoxResizable: false
        }
      );
  };

  reader.readAsDataURL(file);
}
document
  .getElementById(
    "zoomSlider"
  )
  ?.addEventListener(
    "input",
    (e) => {

      if (cropper) {
        cropper.zoomTo(
          e.target.value
        );
      }

    }
  );
window.closeCropper =
  function () {

   const modal =
  document.getElementById("cropModal");

modal.classList.add("hidden");
modal.style.display = "none";

    if (cropper) {
      cropper.destroy();
      cropper = null;
    }

  };

async function uploadAvatarToApi(
  blob
) {

  const token =
    await auth.currentUser
      .getIdToken();

  const formData =
    new FormData();

  formData.append(
    "avatar",
    blob,
    "avatar.jpg"
  );

  const response =
    await fetch(
      AVATAR_UPLOAD_API_URL,
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

  return result.avatarUrl;
}
  window.cropAvatar =
async function () {

  console.log("SAVE CLICKED");

  if (!cropper) {
    console.log("NO CROPPER");
    return;
  }

  console.log("CROPPER EXISTS");
    const canvas =
      cropper.getCroppedCanvas({
        width: 500,
        height: 500
      });

    canvas.toBlob(
      async (blob) => {

        try {

          const avatarUrl =
            await uploadAvatarToApi(
              blob
            );

          profileAvatar.src =
            avatarUrl;

          closeCropper();

          await loadUserProfile(
            viewedUid
          );

          showToast(
            "Profile photo updated",
            "success"
          );

        } catch (err) {

          showToast(
            err.message,
            "error"
          );

        }

      },
      "image/jpeg",
      0.9
    );

  };
  window.showToast = function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");

  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
};
