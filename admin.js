/* =========================
FIREBASE
========================= */

import {
  auth,
  db,
  addDoc,
  getDocs,
  doc,
  getDoc,
  collection,
  onSnapshot,
  updateDoc,
  query,
  where,
  serverTimestamp,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "./js/firebase.js";
/* =========================
   STATE VARIABLES
========================= */
let loadingInterval = null;
let loadingIndex = 0;
let firstLoad = true;
let pending = 0;
let progress = 0;
let completed = 0;
let statusChart = null;
let newCount = 0;
let technicians = [];
let adminMessages = [];
let activeMessageFilter = "all";
let activeMessageRecipient = null;
const sounds = {
  info: new Audio("sounds/notify-info.mp3"),
  success: new Audio("sounds/notify-success.mp3"),
  warning: new Audio("sounds/notify-warning.mp3"),
  error: new Audio("sounds/notify-error.mp3"),
  repair: new Audio("sounds/notify-repair.mp3"),
};

// set volume for all
Object.values(sounds).forEach((s) => {
  s.volume = 1;
});

const loadingTexts = [
  "Initializing secure session...",
  "Authenticating admin credentials...",
  "Syncing repair data...",
  "Preparing dashboard interface...",
];

function friendlyError(err) {
  if (err?.code === "permission-denied") {
    return "You do not have permission to do that";
  }

  if (err?.code === "unavailable") {
    return "Network problem. Please try again";
  }

  return "Something went wrong. Please try again";
}

function formatDate(value) {
  if (!value) return "Not recorded";
  if (value.toDate) return value.toDate().toLocaleString();
  if (value.seconds) return new Date(value.seconds * 1000).toLocaleString();
  return String(value);
}

function getMessageTime(message) {
  const value = message.createdAt || message.sentAt || message.time;

  if (!value) return 0;
  if (value.toDate) return value.toDate().getTime();
  if (value.seconds) return value.seconds * 1000;

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isAdminIncoming(message) {
  const audience = (message.audience || message.to || "").toLowerCase();
  const toRole = (message.toRole || "").toLowerCase();
  const receiverRole = (message.receiverRole || "").toLowerCase();

  return (
    audience === "admin" ||
    toRole === "admin" ||
    receiverRole === "admin"
  );
}

function isAdminOutgoing(message) {
  const from = (message.from || "").toLowerCase();
  const fromRole = (message.fromRole || message.senderRole || "").toLowerCase();
  const audience = (message.audience || "").toLowerCase();

  return (
    from === "admin" ||
    fromRole === "admin" ||
    audience === "user"
  );
}

function messageName(message, fallback) {
  return (
    message.senderName ||
    message.fromName ||
    message.name ||
    message.email ||
    message.senderEmail ||
    fallback
  );
}

function normalizeMessageText(text) {
  return text.trim().replace(/\s+/g, " ");
}

async function hasRecentDuplicateMessage({ senderUid, receiverUid, message }) {
  const normalized = normalizeMessageText(message).toLowerCase();
  const dedupeKey = `${senderUid}_${receiverUid}_${normalized}`;
  const duplicateQuery = query(
    collection(db, "notifications"),
    where("type", "==", "message"),
    where("dedupeKey", "==", dedupeKey)
  );

  const snapshot = await getDocs(duplicateQuery);
  const now = Date.now();

  return snapshot.docs.some((docSnap) => {
    const sentAt = getMessageTime(docSnap.data());
    return sentAt && now - sentAt < 60000;
  });
}
/* =========================
   UI STATES
========================= */
function hideAll() {
  ["loading", "adminLogin", "adminDashboard"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.classList.remove("screen-enter", "screen-exit");
    el.style.display = "none";
  });
}

function showScreen(id, display = "flex") {
  hideAll();

  const el = document.getElementById(id);
  if (!el) return;

  el.style.display = display;
  el.classList.add("screen-enter");
}

function showLoginUI() {
  stopLoadingAnimation();
  showScreen("adminLogin", "flex");
  setLoginButtonLoading(false);
  document.getElementById("adminEmail").focus();
}

function showDashboard() {
  stopLoadingAnimation();
  showScreen("adminDashboard", "flex");
}

function showLoading() {
  const el = document.getElementById("loading");

  // 🔥 If already visible, DO NOTHING
  if (el.style.display === "flex") return;

  showScreen("loading", "flex");
  startLoadingAnimation();
}
if (localStorage.getItem("bennyfix-admin-theme") === "dark") {
  document.body.classList.add("dark");
}

/* =========================
   INITIAL STATE
========================= */
showLoading();

/* =========================
   AUTH CHECK + ROLE PROTECTION
========================= */

function startLoadingAnimation() {
  const textEl = document.getElementById("loadingText");
  if (!textEl) return;

  let index = 0;

  function showNext() {
    if (index >= loadingTexts.length) return; // STOP HERE

    textEl.innerText = loadingTexts[index];
    index++;

    setTimeout(showNext, 1500); // next text after delay
  }

  showNext();
}
function stopLoadingAnimation() {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
}
function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function setLoginButtonLoading(isLoading) {
  const btn = document.getElementById("adminLoginBtn");
  if (!btn) return;

  btn.disabled = isLoading;
  btn.classList.toggle("is-loading", isLoading);
  btn.innerHTML = isLoading
    ? "<i class='bx bx-loader-alt bx-spin'></i><span>Checking access...</span>"
    : "<i class='bx bx-log-in-circle'></i><span>Enter Dashboard</span>";
}

onAuthStateChanged(auth, async (user) => {
  showLoading();

  try {
    const start = Date.now();

    if (!user) {
      await wait(3500); // 🔥 give loader time
      stopLoadingAnimation();
      showLoginUI();
      return;
    }

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists() || snap.data().role !== "admin") {
      await signOut(auth);
      await wait(3500);
      stopLoadingAnimation();
      showLoginUI();
      return;
    }

    await wait(3500); // 🔥 allow full animation cycle
    stopLoadingAnimation();
    showDashboard();
    loadAdminDashboard();
  } catch (err) {
    console.error(err);
    await wait(3500);
    stopLoadingAnimation();
    showLoginUI();
  }
});
window.adminLogin = async function () {
  const email = document.getElementById("adminEmail").value;
  const password = document.getElementById("adminPassword").value;
  const errorBox = document.getElementById("adminError");

  if (!email || !password) {
    errorBox.innerText = "Please fill all fields";
    return;
  }

  try {
    errorBox.innerText = "";
    setLoginButtonLoading(true);

    await signInWithEmailAndPassword(auth, email, password);

    // IMPORTANT: do NOT change UI here
  } catch (err) {
    errorBox.innerText = err.message;
    setLoginButtonLoading(false);
  }
};

/* =========================
   REPAIRS SYSTEM (REALTIME)
========================= */
function playSound(type = "info") {
  const sound = sounds[type];

  if (!sound) {
    console.warn("Sound type not found:", type);
    return;
  }

  sound.currentTime = 0;

  sound.play().catch((err) => {
    console.warn("Sound could not play:", type, err.message);
  });
}
function listenToRepairs() {
  const container = document.getElementById("repairsContainer");

onSnapshot(collection(db, "repairs"), (snapshot) => {
  const hasNewRepair = snapshot
    .docChanges()
    .some((change) => change.type === "added");

  if (!firstLoad && hasNewRepair) {
    showToast("New repair request");
    playSound("repair");
  }

  firstLoad = false;

    let total = 0;
    let diagnosing = 0;
    let fixing = 0;
    pending = 0;
    progress = 0;
    completed = 0;

    container.innerHTML = "";

    snapshot.forEach((docSnap) => {
  const r = docSnap.data();
  total++;

  const status = r.status || "Pending";
  const statusKey = status.toLowerCase();
  const deviceTitle = r.deviceName || r.device || "Unknown device";
  const repairImage = r.imageUrl
    ? `<img class="repair-thumb" src="${r.imageUrl}" alt="${deviceTitle}">`
    : "";

  if (statusKey === "pending") pending++;
  else if (statusKey === "diagnosing" || statusKey === "fixing") progress++;
  else if (statusKey === "completed") completed++;

  const card = document.createElement("div");
  card.className = "repair-card";

  card.innerHTML = `
  <div class="repair-left">
    ${repairImage}
    <h3>${r.deviceName || r.deviceTitle || "Unknown device"}</h3>
    <p class="issue">${r.issue}</p>
    <small class="email">${r.email || ""}</small>

    ${r.assignedTo ? `<small class="assigned">👨‍🔧 ${r.assignedTo.name}</small>` : ""}
  </div>

  <div class="repair-right">
<span class="status-badge ${statusKey}">${status}</span>
<select 
  onchange="updateRepair('${docSnap.id}', this.value)"
  ${status === "Completed" ? "disabled" : ""}
>      <option ${status === "Pending" ? "selected" : ""}>Pending</option>
      <option ${status === "Diagnosing" ? "selected" : ""}>Diagnosing</option>
      <option ${status === "Fixing" ? "selected" : ""}>Fixing</option>
      <option ${status === "Completed" ? "selected" : ""}>Completed</option>
      
    </select>

    ${
      !r.assignedTo
        ? `<button onclick="openAssignModal('${docSnap.id}')">
            Assign Technician
          </button>`
        : `<span class="assigned-label">Assigned</span>`
    }

    <button onclick="toggleJourney('${docSnap.id}')">View Journey</button>

    <div id="journey-${docSnap.id}" class="journey hidden"></div>
  </div>
`;

      container.appendChild(card);
    });

    // update stats
    document.getElementById("totalRepairs").innerText = total;
    document.getElementById("pendingRepairs").innerText = pending;
    document.getElementById("progressRepairs").innerText = progress;
    document.getElementById("completedRepairs").innerText = completed;

    updateChart();
  });
}

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, i) =>
    `<i class='bx ${i < rating ? "bxs-star" : "bx-star"}'></i>`
  ).join("");
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function listenToReviews() {
  const container = document.getElementById("reviewsContainer");
  if (!container) return;

  onSnapshot(
    query(collection(db, "repairs"), where("rating", ">=", 1)),
    (snapshot) => {
      const pendingReviews = [];

      snapshot.forEach((docSnap) => {
        const repair = docSnap.data();

        if (!repair.reviewStatus || repair.reviewStatus === "pending") {
          pendingReviews.push({ id: docSnap.id, ...repair });
        }
      });

      if (!pendingReviews.length) {
        container.innerHTML = `<p class="empty-state">No reviews waiting for approval.</p>`;
        return;
      }

      container.innerHTML = pendingReviews
        .map(
          (repair) => `
        <div class="review-card">
          <div class="review-stars">${renderStars(repair.rating)}</div>
          <p class="review-text">${repair.review ? escapeHtml(repair.review) : "<em>No written review</em>"}</p>
          <small>${escapeHtml(repair.customerName || repair.email || "Customer")} — ${escapeHtml(repair.deviceName || "Unknown device")}</small>
          <div class="review-actions">
            <button class="btn btn-primary" onclick="approveReview('${repair.id}')">Approve</button>
            <button class="btn btn-secondary" onclick="rejectReview('${repair.id}')">Reject</button>
          </div>
        </div>
      `
        )
        .join("");
    },
    (err) => {
      console.error(err);
      container.innerHTML = `<p class="empty-state">Could not load reviews.</p>`;
    }
  );
}

window.approveReview = async function (repairId) {
  try {
    const repairSnap = await getDoc(doc(db, "repairs", repairId));
    if (!repairSnap.exists()) return showToast("Repair not found");

    const repair = repairSnap.data();

    await addDoc(collection(db, "testimonials"), {
      customerName: repair.customerName || "BennyFix Customer",
      deviceName: repair.deviceName || "",
      rating: repair.rating,
      review: repair.review || "",
      repairId,
      approvedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "repairs", repairId), { reviewStatus: "approved" });

    showToast("Review approved and published");
  } catch (err) {
    console.error(err);
    showToast("Could not approve review");
  }
};

window.rejectReview = async function (repairId) {
  try {
    await updateDoc(doc(db, "repairs", repairId), { reviewStatus: "rejected" });
    showToast("Review rejected");
  } catch (err) {
    console.error(err);
    showToast("Could not reject review");
  }
};

function listenToNotifications() {
  const badge = document.getElementById("notifBadge");

  onSnapshot(collection(db, "notifications"), (snapshot) => {
    let unread = 0;
    adminMessages = [];

    snapshot.forEach((docSnap) => {
      const n = docSnap.data();
      const message = {
        id: docSnap.id,
        ...n
      };

      if (isAdminIncoming(message) || isAdminOutgoing(message)) {
        adminMessages.push(message);
      }

      if (isAdminIncoming(message) && !message.read) unread++;
    });

    adminMessages.sort(
      (a, b) => getMessageTime(b) - getMessageTime(a)
    );

    newCount = unread;

    if (badge) {
      badge.innerText = unread;
      badge.style.display = unread > 0 ? "flex" : "none";
    }

    renderAdminMessages();
  }, (err) => {
    console.error("Notifications listener failed:", err);
    showToast("Could not load messages");
  });
}

function renderAdminMessages() {
  const container = document.getElementById("messagesContainer");
  if (!container) return;

  const messages = adminMessages.filter((message) => {
    if (activeMessageFilter === "inbox") return isAdminIncoming(message);
    if (activeMessageFilter === "sent") return isAdminOutgoing(message);
    return true;
  });

  if (!messages.length) {
    container.innerHTML = `
      <div class="empty-messages">
        <i class='bx bx-message-rounded-dots'></i>
        <p>No messages found.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = messages
    .map((message) => {
      const incoming = isAdminIncoming(message);
      const outgoing = isAdminOutgoing(message) && !incoming;
      const direction = incoming ? "incoming" : outgoing ? "outgoing" : "system";
      const title = incoming
        ? messageName(message, "User")
        : outgoing
        ? "Admin"
        : "System";
      const target =
        message.toName ||
        message.receiverName ||
        message.audience ||
        message.uid ||
        "Admin";
      const text =
        message.message ||
        message.body ||
        message.text ||
        "No message content";
      const time = formatDate(message.createdAt || message.sentAt || message.time);
      const unreadClass = incoming && !message.read ? " unread" : "";

      return `
        <article class="message-card ${direction}${unreadClass}">
          <div class="message-icon">
            <i class='bx ${
              incoming
                ? "bx-inbox"
                : outgoing
                ? "bx-send"
                : "bx-info-circle"
            }'></i>
          </div>

          <div class="message-body">
            <div class="message-top">
              <strong>${title}</strong>
              <span>${time}</span>
            </div>

            <p>${text}</p>

            <small>
              ${incoming ? "Received by Admin" : `Sent to ${target}`}
            </small>
          </div>

          <span class="message-direction">
            ${incoming ? "Inbox" : outgoing ? "Sent" : "System"}
          </span>
        </article>
      `;
    })
    .join("");
}

window.setMessageFilter = function (filter) {
  activeMessageFilter = filter;

  document.querySelectorAll(".message-filters button")
    .forEach((btn) => btn.classList.remove("active"));

  document.getElementById(`messageFilter-${filter}`)
    ?.classList.add("active");

  renderAdminMessages();
};

window.openMessageModal = function (uid, name, role = "user") {
  activeMessageRecipient = { uid, name, role };

  document.getElementById("messageRecipient").innerText =
    `To ${name} (${role})`;
  document.getElementById("adminMessageText").value = "";
  document.getElementById("messageModal").classList.remove("hidden");
};

window.closeMessageModal = function () {
  activeMessageRecipient = null;
  document.getElementById("messageModal").classList.add("hidden");
};

window.sendAdminMessage = async function () {
  const text = normalizeMessageText(
    document.getElementById("adminMessageText").value
  );

  if (!activeMessageRecipient || !text) {
    return showToast("Write a message first");
  }

  const senderUid = auth.currentUser?.uid || "admin";
  const duplicate = await hasRecentDuplicateMessage({
    senderUid,
    receiverUid: activeMessageRecipient.uid,
    message: text,
  });

  if (duplicate) {
    return showToast("This message was already sent recently");
  }

  try {
    await addDoc(collection(db, "notifications"), {
      type: "message",
      audience: activeMessageRecipient.role,
      senderUid,
      senderRole: "admin",
      senderName: "Admin",
      receiverUid: activeMessageRecipient.uid,
      receiverRole: activeMessageRecipient.role,
      receiverName: activeMessageRecipient.name,
      message: text,
      dedupeKey: `${senderUid}_${activeMessageRecipient.uid}_${text.toLowerCase()}`,
      read: false,
      createdAt: serverTimestamp(),
    });

    closeMessageModal();
    showToast("Message sent");
  } catch (err) {
    console.error(err);
    showToast("Could not send message");
  }
};
window.toggleJourney = async function (id) {
  const box = document.getElementById(`journey-${id}`);

  if (box.classList.contains("hidden")) {
    const ref = doc(db, "repairs", id);
    const snap = await getDoc(ref);
    const data = snap.data();

    const timeline = data.timeline || [];

    box.innerHTML = timeline
      .map(
        (t) => `
      <div class="journey-step">
        <span>${t.stage}</span>
        <small>${t.time}</small>
      </div>
    `,
      )
      .join("");

    box.classList.remove("hidden");
  } else {
    box.classList.add("hidden");
  }
};
window.toggleNotifications = async function () {
  showSection("messages");

  const unreadIncoming =
    adminMessages.filter((message) =>
      isAdminIncoming(message) && !message.read
    );

  await Promise.all(
    unreadIncoming.map((message) =>
      updateDoc(doc(db, "notifications", message.id), {
        read: true,
      })
    )
  );

  const badge = document.getElementById("notifBadge");

  newCount = 0;

  if (badge) {
    badge.style.display = "none";
    badge.innerText = "";
  }

  renderAdminMessages();
};
/* =========================
   CHART SYSTEM
========================= */
function updateChart() {
  const ctx = document.getElementById("statusChart");
  if (!ctx) return;

  const data = [pending, progress, completed];

  // 🔥 if chart exists → just update values
  if (statusChart) {
    statusChart.data.datasets[0].data = data;
    statusChart.update();
    return;
  }

  // 🔥 create only ONCE
  statusChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Pending", "In Progress", "Completed"],
      datasets: [
        {
          data: data,
          backgroundColor: ["#f39c12", "#3498db", "#2ecc71"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

/* =========================
   UPDATE REPAIR STATUS
========================= */
window.updateRepair = async function (id, status) {
  const ref = doc(db, "repairs", id);

  const snap = await getDoc(ref);
  const data = snap.data();

  // 🔒 STOP if already completed
  if (data.status === "Completed") {
    return showToast("This repair is already completed");
  }

  const timeline = data.timeline || [];

  // 📅 better timestamp
  timeline.push({
    stage: status,
    time: new Date().toLocaleString(),
  });
// 🔊 SOUND LOGIC HERE (correct place)
  if (status === "Completed") {
    playSound("success");
  } 
  else if (status === "Fixing" || status === "Diagnosing") {
    playSound("info");
  } 
  else if (status === "Pending") {
    playSound("warning");
  }
  const updateData = {
    status,
    timeline,
  };

  // ✅ EXTRA when completed
  if (status === "Completed") {
updateData.completedAt = serverTimestamp();
updateData.completedBy = auth.currentUser?.email || "Admin";

  // 🔔 notify user
  notifyUser(data);
}

  try {
    await updateDoc(ref, updateData);
    if (status === "Completed") {
      await createMarketingDraftFromRepair(id, data);
      showToast("Marketing draft created");
    }
    showToast("Repair updated");

  } catch (err) {
    console.error(err);
    showToast("Update failed");
  }
};

async function createMarketingDraftFromRepair(repairId, repairData) {
  if (repairData.marketingPostId) return;

  const device = repairData.deviceName || repairData.category || "device";
  const problem = repairData.problemType || repairData.issue || "repair";
  const caption = [
    `Another ${device} repair completed at BennyFix Hub.`,
    `Issue handled: ${problem}.`,
    "Need a reliable fix? Send us your device and we will take care of it.",
  ].join("\n\n");

  const images = repairData.imageUrl
    ? [{ url: repairData.imageUrl, filename: `${device} repair` }]
    : [];

  const postRef = await addDoc(collection(db, "posts"), {
    caption,
    images,
    platforms: ["facebook", "instagram", "linkedin"],
    facebookPageIds: [],
    status: "scheduled",
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
    repairId,
    source: "repair-completion",
    createdBy: auth.currentUser?.uid || "",
    createdByEmail: auth.currentUser?.email || "",
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "repairs", repairId), {
    marketingPostId: postRef.id,
    marketingDraftCreatedAt: serverTimestamp(),
  });
}

async function notifyUser(repairData) {
  try {
    await addDoc(collection(db, "notifications"), {
  audience: "user",
  uid: repairData.uid,
  message: "Your repair has been completed",
  createdAt: serverTimestamp(),
  read: false
});
  } catch (err) {
    console.error("Notification failed", err);
  }
}

/* =========================
   USER MANAGEMENT
========================= */
function loadUsers() {
  const container = document.getElementById("usersContainer");
  if (!container) return;

  onSnapshot(collection(db, "users"), (snapshot) => {
    container.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const u = docSnap.data();

      const name = u.name?.trim() || "User";
      const email = u.email || "No email";
      const role = u.role || "user";

      const avatar =
        u.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;

      const div = document.createElement("div");
      div.className = "user-card";
div.innerHTML = `
  <div class="user-info">
    <img src="${avatar}" class="avatar" />
    <div>
      <p>${name}</p>
      <small>${email}</small>
    </div>
  </div>

  <span class="role">${role}</span>

  <button onclick="location.href='user-profile.html?uid=${docSnap.id}'">
    View Profile
  </button>

  <button onclick="openMessageModal('${docSnap.id}', '${name.replace(/'/g, "\\'")}', '${role}')">
    Message
  </button>

  ${
  role === "user"
    ? `<button onclick="makeTechnician('${docSnap.id}')">
        Make Technician
      </button>`
    : role === "technician"
    ? `
      <button onclick="makeAdmin('${docSnap.id}')">
        Make Admin
      </button>
      <button class="danger-btn" onclick="unemployTechnician('${docSnap.id}')">
        Unemploy
      </button>
    `
    : `<span class="admin-badge">Admin</span>`
}
`;

      container.appendChild(div);
    });
  });
}
window.openAssignModal = function (repairId) {
  if (!technicians.length) {
    return showToast("No technicians available");
  }

  const options = technicians
    .map(
      (t) =>
        `<option value="${t.id}" data-name="${t.name}">
      ${t.name}
    </option>`,
    )
    .join("");

  const modal = document.createElement("div");
  modal.className = "modal";

 modal.innerHTML = `
  <div class="modal-overlay" onclick="this.parentElement.remove()"></div>

  <div class="modal-box">
    <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>

    <h3>Assign Technician</h3>
    <p class="modal-sub">Choose a technician for this repair</p>

    <select id="techSelect" class="modal-select">
      <option disabled selected>Select technician</option>
      ${options}
    </select>

    <button class="assign-btn" onclick="assignTech('${repairId}')">
      Assign Technician
    </button>
  </div>
`;

  document.body.appendChild(modal);
};
function loadTechnicians() {
  onSnapshot(collection(db, "users"), (snapshot) => {
    technicians = [];

    snapshot.forEach((docSnap) => {
      const u = docSnap.data();

      if (u.role === "technician") {
        technicians.push({
          id: docSnap.id,
          name: u.name || u.email || "Technician",
          email: u.email || "",
          avatar: u.avatar || "",
          availability: u.availability || "available",
        });
      }
    });

    renderTechnicians();
  });
}

function renderTechnicians() {
  const container = document.getElementById("techniciansContainer");
  if (!container) return;

  if (!technicians.length) {
    container.innerHTML = `
      <p class="empty-state">No technicians yet. Promote a user from the Users section.</p>
    `;
    return;
  }

  container.innerHTML = technicians
    .map((tech) => {
      const avatar =
        tech.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(tech.name || "Technician")}&background=2563eb&color=fff`;

      return `
        <div class="user-card technician-card">
          <div class="user-info">
            <img src="${avatar}" class="avatar" />
            <div>
              <p>${tech.name}</p>
              <small>${tech.email || "No email"}</small>
            </div>
          </div>

          <span class="role">${tech.availability || "available"}</span>

          <button onclick="location.href='user-profile.html?uid=${tech.id}'">
            View Profile
          </button>

          <button onclick="openMessageModal('${tech.id}', '${tech.name.replace(/'/g, "\\'")}', 'technician')">
            Message
          </button>

          <button class="danger-btn" onclick="unemployTechnician('${tech.id}')">
            Unemploy
          </button>
        </div>
      `;
    })
    .join("");
}
window.assignTech = async function (repairId) {
  const select = document.getElementById("techSelect");

  const techId = select.value;
  const techName = select.options[select.selectedIndex].text;
  if (!confirm(`Assign this repair to ${techName}?`)) return;

  if (!techId) return showToast("Select technician");

  try {
    await updateDoc(doc(db, "repairs", repairId), {
      assignedTo: {
        uid: techId,
        name: techName,
      },
      status: "Diagnosing",
    });

    showToast(`Assigned to ${techName}`);
    document.querySelector(".modal")?.remove();
  } catch (err) {
    console.error(err);
    showToast("Assignment failed");
  }
};
/* =========================
   PROMOTE USER
========================= */
window.makeTechnician = async function (id) {
  await updateDoc(doc(db, "users", id), {
    role: "technician",
  });

  showToast("User promoted to technician");
};
window.makeAdmin = async function (id) {
  await updateDoc(doc(db, "users", id), {
    role: "admin",
  });

  showToast("User promoted to admin");
};
window.unemployTechnician = async function (id) {
  if (!confirm("Remove this technician role?")) return;

  try {
    await updateDoc(doc(db, "users", id), {
      role: "user",
    });

    showToast("Technician changed back to user");
  } catch (err) {
    console.error(err);
    showToast("Could not update technician");
  }
};
/* =========================
   TOAST SYSTEM
========================= */
window.showToast = function showToast(msg) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.innerText = msg;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}
// =========
//navigation js
// =========
window.showSection = function (section) {
  // hide all sections
  document.querySelectorAll(".section").forEach((el) => {
    el.style.display = "none";
  });

  // show selected section
  const target = document.getElementById(section);
  if (target) {
    target.style.display = "block";
  }

  // reset + set active bottom nav
  document.querySelectorAll(".bottom-nav button").forEach((btn) => {
    btn.classList.remove("active");
  });
document.querySelectorAll(".sidebar button").forEach((btn) => {
  btn.classList.remove("active");
});

const sidebarBtn = document.querySelector(
  `.sidebar button[onclick="showSection('${section}')"]`
);

if (sidebarBtn) {
  sidebarBtn.classList.add("active");
}
  const activeBtn = document.getElementById("tab-" + section);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }

  // 🔥 OPTIONAL: auto reset notifications when viewing repairs
  if (section === "repairs") {
    const badge = document.getElementById("notifBadge");
    newCount = 0;

    if (badge) {
      badge.innerText = "";
      badge.style.display = "none";
    }
  }
};
function loadAdminDashboard() {
  listenToNotifications();
  listenToRepairs();
  listenToReviews();
  loadUsers();
  loadTechnicians();
  showSection("overview");
}
window.logoutAdmin = async function () {
  const dashboard = document.getElementById("adminDashboard");

  if (dashboard) {
    dashboard.classList.remove("screen-enter");
    dashboard.classList.add("screen-exit");
    await wait(280);
  }

  await signOut(auth);
  showLoginUI();
};

// ======Dark Mode Toggle
window.toggleDarkMode = function () {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "bennyfix-admin-theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
};
// ======= USERS======//
window.openTechForm = function () {
  const modal = document.getElementById("techForm");
  modal.classList.remove("hidden");

  // reset form every time
  document.getElementById("techName").value = "";
  document.getElementById("techEmail").value = "";
  document.getElementById("techPassword").value = "";

  setTimeout(() => {
    document.getElementById("techName").focus();
  }, 100);
};

window.closeTechForm = function () {
  document.getElementById("techForm").classList.add("hidden");
};
window.addEventListener("click", function (e) {
  const modal = document.getElementById("techForm");

  if (e.target === modal) {
    closeTechForm();
  }
});
window.fixUsers = async function () {
  const snap = await getDocs(collection(db, "users"));

  snap.forEach(async (docSnap) => {
    const u = docSnap.data();

    await updateDoc(doc(db, "users", docSnap.id), {
      name: u.name || "User",
      role: u.role || "user",
      avatar:
        u.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "User")}`
    });
  });

  console.log("✅ Users fixed");
};
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const adminLoginBox = document.getElementById("adminLogin");

    if (adminLoginBox && adminLoginBox.style.display !== "none") {
      adminLogin();
    }
  }

  if (e.key === "Escape") {
    const techForm = document.getElementById("techForm");

    if (techForm && !techForm.classList.contains("hidden")) {
      closeTechForm();
    }

    document.querySelector(".modal")?.remove();
  }
});
const PUSH_REGISTER_API_URL = "https://bennyfix-backend-v.vercel.app/api/register-push";
const VAPID_PUBLIC_KEY = "BB5fTQvkGS165grJnDvi1bgriXXUcG0O3bgErqy-uFNVT2eNh9397r5oFqpPhGXK-UlbHjpLDQu-fx5lMB6MpX8";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

window.enableAdminPushNotifications = async function () {
  try {
    const user = auth.currentUser;

    if (!user) {
      return showToast("Login first");
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return showToast("Push notifications are not supported on this browser");
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      return showToast("Notification permission was not granted");
    }

    const registration = await navigator.serviceWorker.register("sw.js");

    let subscription = await registration.pushManager.getSubscription();

if (!subscription) {
  subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
}

    const idToken = await user.getIdToken();

    const response = await fetch(PUSH_REGISTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subscription }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Could not enable notifications");
    }

    showToast("Phone alerts enabled");
  } catch (err) {
    console.error(err);
    showToast(err.message || "Could not enable phone alerts");
  }
};
