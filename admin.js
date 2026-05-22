/* =========================
   STATE VARIABLES
========================= */ let loadingInterval = null;
let loadingIndex = 0;
let firstLoad = true;
let pending = 0;
let progress = 0;
let completed = 0;
let statusChart = null;
let newCount = 0;
let technicians = [];
const sounds = {
  info: new Audio("/sounds/notify-info.mp3"),
  success: new Audio("/sounds/notify-success.mp3"),
  warning: new Audio("/sounds/notify-warning.mp3"),
  error: new Audio("/sounds/notify-error.mp3"),
  repair: new Audio("/sounds/notify-repair.mp3"),
};

// set volume for all
Object.values(sounds).forEach((s) => {
  s.volume = 0.4;
});notifySound.volume = 0.5;
const loadingTexts = [
  "Initializing secure session...",
  "Authenticating admin credentials...",
  "Syncing repair data...",
  "Preparing dashboard interface...",
];
/* =========================
   UI STATES
========================= */
function hideAll() {
  document.getElementById("loading").style.display = "none";
  document.getElementById("adminLogin").style.display = "none";
  document.getElementById("adminDashboard").style.display = "none";
}

function showLoginUI() {
  hideAll();
  stopLoadingAnimation();
  document.getElementById("adminLogin").style.display = "flex";
  document.getElementById("adminEmail").focus();
}

function showDashboard() {
  hideAll();
  stopLoadingAnimation();
  document.getElementById("adminDashboard").style.display = "flex";
}

function showLoading() {
  const el = document.getElementById("loading");

  // 🔥 If already visible, DO NOTHING
  if (el.style.display === "flex") return;

  hideAll();
  el.style.display = "flex";

  startLoadingAnimation();
}

/* =========================
   FIREBASE IMPORTS
========================= */
import {
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  collection,
  onSnapshot,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================
   CONFIG
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyA4btiZMSBa4g6vt3XKf1uHeJiu8GJtTj4",
  authDomain: "bennyfixhub.firebaseapp.com",
  projectId: "bennyfixhub",
  storageBucket: "bennyfixhub.appspot.com",
  messagingSenderId: "281036247412",
  appId: "1:281036247412:web:19db51739bc6c81fbc1c21",
  measurementId: "G-EZ4FHYDFZB",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
onAuthStateChanged(auth, async (user) => {
  console.log("Current UID:", user?.uid);

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
    errorBox.innerText = "Logging in...";

    await signInWithEmailAndPassword(auth, email, password);

    // IMPORTANT: do NOT change UI here
  } catch (err) {
    errorBox.innerText = err.message;
  }
};

/* =========================
   REPAIRS SYSTEM (REALTIME)
========================= */
function playSound(type = "info") {
  const sound = sounds[type];

  if (!sound) return;

  // reset so it can replay quickly
  sound.currentTime = 0;

  sound.play().catch(() => {});
}
function listenToRepairs() {
  const container = document.getElementById("repairsContainer");

  onSnapshot(collection(db, "repairs"), (snapshot) => {

  if (!firstLoad) {
    showToast("🔔 New repair update");

    // 🔊 play sound
    playsound("repair").catch(() => {});
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

      if (r.status === "Pending") pending++;
      else if (r.status === "Diagnosing" || r.status === "Fixing") progress++;
      else if (r.status === "Completed") completed++;

      const card = document.createElement("div");
      card.className = "repair-card";

      card.innerHTML = `
  <div class="repair-left">
    <h3>${r.device}</h3>
    <p class="issue">${r.issue}</p>
    <small class="email">${r.email || ""}</small>

    ${r.assignedTo ? `<small class="assigned">👨‍🔧 ${r.assignedTo.name}</small>` : ""}
  </div>

  <div class="repair-right">
    <span class="status-badge ${r.status.toLowerCase()}">${r.status}</span>

<select 
  onchange="updateRepair('${docSnap.id}', this.value)"
  ${r.status === "Completed" ? "disabled" : ""}
>      <option ${r.status === "Pending" ? "selected" : ""}>Pending</option>
      <option ${r.status === "Diagnosing" ? "selected" : ""}>Diagnosing</option>
      <option ${r.status === "Fixing" ? "selected" : ""}>Fixing</option>
      <option ${r.status === "Completed" ? "selected" : ""}>Completed</option>
      
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
    console.log("🔥 Repairs snapshot size:", snapshot.size);
  });
}
function listenToNotifications() {
  const badge = document.getElementById("notifBadge");

  const q = query(collection(db, "notifications"));

  onSnapshot(q, (snapshot) => {

    let unread = 0;

    snapshot.forEach((docSnap) => {
      const n = docSnap.data();

      if (!n.read) unread++;
    });

    newCount = unread;

    if (badge) {
      badge.innerText = unread;
      badge.style.display = unread > 0 ? "flex" : "none";
    }

  });
}
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

  const q = collection(db, "notifications");

  const snapshot = await getDocs(q);

  snapshot.forEach(async (docSnap) => {
    await updateDoc(doc(db, "notifications", docSnap.id), {
      read: true
    });
  });

  const badge = document.getElementById("notifBadge");

  newCount = 0;

  if (badge) {
    badge.style.display = "none";
    badge.innerText = "";
  }

  showSection("repairs");

  const btn = document.getElementById("tab-repairs");
  if (btn) {
    document.querySelectorAll(".bottom-nav button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
  }

  showToast("Notifications cleared");
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
  updateData.completedAt = new Date();
  updateData.completedBy = auth.currentUser?.email || "Admin";

  // 🔔 notify user
  notifyUser(data);
}

  try {
    await updateDoc(ref, updateData);
    showToast("Repair updated");

  } catch (err) {
    console.error(err);
    showToast("Update failed");
  }
};
import { addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function notifyUser(repairData) {
  try {
    await addDoc(collection(db, "notifications"), {
      uid: repairData.uid,
      message: "✅ Your repair has been completed",
      createdAt: new Date(),
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
            <button onclick="location.href='profile.html?uid=${docSnap.id}'">
    View Profile
  </button>
          </div>
        </div>

        <span class="role">${role}</span>

        ${
          role === "user"
            ? `<button onclick="makeTechnician('${docSnap.id}')">
                Make Technician
              </button>`
            : role === "technician"
            ? `<button onclick="makeAdmin('${docSnap.id}')">
                Make Admin
              </button>`
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
document.addEventListener("keydown", (e) => {
  const modal = document.getElementById("techForm");

  if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    closeTechForm();
  }
});
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

/* =========================
   TOAST SYSTEM
========================= */
function showToast(msg) {
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
  loadUsers();
  showSection("overview");
}
window.logoutAdmin = async function () {
  await signOut(auth);
  location.reload();
};

// ======Dark Mode Toggle
window.toggleDarkMode = function () {
  document.body.classList.toggle("dark");
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