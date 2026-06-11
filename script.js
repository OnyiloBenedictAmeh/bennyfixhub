function hideAllAuthUI() {
  if (authModal) authModal.style.display = "none";
  const verify = document.getElementById("verifyScreen");
  if (verify) verify.style.display = "none";
}
// =========================
// ELEMENT REFERENCES
// =========================
const guestMenu = document.getElementById("guestMenu");
const userMenu = document.getElementById("userMenu");
const mega = document.getElementById("mega");
const searchModal = document.getElementById("searchModal");
const searchInput = document.getElementById("searchInput");
const navWrapper = document.getElementById("navWrapper");
const authModal = document.getElementById("authModal");
const dashboard = document.querySelector(".dashboard");
const REPAIR_API_URL = "https://bennyfix-backend-v.vercel.app/api/create-repair";
let currentUser = null;

// =========================
// MEGA MENU FUNCTIONALITY
// =========================
let megaTimeout;
let resizeTimeout;
let scrollTimeout;
let resendCooldown = 30;
let resendInterval;
let verifyInterval;
// SWITCH TAB
function switchTab(id) {
  document.querySelectorAll(".mega-content").forEach((el) => {
    el.classList.remove("active");
  });

  const activeTab = document.getElementById(id);

  if (!activeTab) {
    console.warn("Mega tab not found:", id);
    return;
  }

  activeTab.classList.add("active");

  if (typeof updateMegaLayout === "function") {
    updateMegaLayout();
  }
}

// OPEN MEGA & CLOSE
function openMega(tab) {
  if (!mega) return;

  mega.classList.add("show");
  switchTab(tab);
}

function closeMega() {
  if (!mega) return;

  mega.classList.remove("show");
}
window.addEventListener("scroll", () => {
  clearTimeout(scrollTimeout);

  scrollTimeout = setTimeout(() => {
    if (searchModal) {
      searchModal.style.display = "none";
    }

    if (mega) mega.classList.remove("show");
  }, 100);
});
// HOVER CONTROL
document.addEventListener("DOMContentLoaded", () => {
  const mega = document.getElementById("mega");

  if (mega) {
    mega.addEventListener("mouseenter", () => clearTimeout(megaTimeout));
    mega.addEventListener("mouseleave", closeMega);
  }
});
document.querySelectorAll(".nav-item").forEach((item) => {
  const menu = item.dataset.menu;

  if (!menu) return;

  item.addEventListener("mouseenter", () => {
    if (window.innerWidth > 900) openMega(menu);
  });

  item.addEventListener("mouseleave", () => {
    if (window.innerWidth > 900) closeMega();
  });

  item.addEventListener("click", (e) => {
    if (window.innerWidth <= 900) {
      e.preventDefault();
      e.stopPropagation();
      openMega(menu);
    }
  });
});

// =========================
// RESPONSIVE LAYOUT
// =========================
function updateMegaLayout() {
  document.querySelectorAll(".mega-content").forEach((container) => {
    const items = [...container.querySelectorAll(".mega-box")].filter(
      (el) => el.offsetParent !== null,
    ).length;

    if (items === 3) container.classList.add("three-items");
    else container.classList.remove("three-items");
  });
}

document.addEventListener("DOMContentLoaded", updateMegaLayout);

window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(updateMegaLayout, 150);
});

// =========================
// SEARCH FUNCTION
// =========================
function toggleSearch(e) {
  if (!searchModal || !searchInput) return;
  e.stopPropagation();

  const isOpen = searchModal.style.display === "block";
  searchModal.style.display = isOpen ? "none" : "block";

  if (!isOpen) {
    setTimeout(() => searchInput.focus(), 50);
  }
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-box") && !e.target.closest(".bx-search")) {
    if (searchModal) {
      searchModal.style.display = "none";
    }
  }
});

// =========================
// MOBILE MENU
// =========================
window.toggleMenu = function () {
  const navWrapper = document.getElementById("navWrapper");
  if (!navWrapper) return;

  navWrapper.classList.toggle("open");
};

// =========================
// SCROLL BEHAVIOR
// =========================
window.addEventListener("scroll", () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    if (searchModal) {
      if (searchModal) {
        searchModal.style.display = "none";
      }
    }
    if (mega) mega.classList.remove("show");
  }, 100);
});

// =========================
// 🔥 FIREBASE SETUP
// =========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDoc,
  getDocs,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const emailBox = document.getElementById("emailBox");
window.auth = auth;
window.db = db;
window.storage = storage;
window.getDoc = getDoc;
window.getDocs = getDocs;
window.doc = doc;
window.collection = collection;
window.query = query;
window.where = where;
window.onSnapshot = onSnapshot;
window.updateDoc = updateDoc;
window.serverTimestamp = serverTimestamp;
window.ref = ref;
window.uploadBytes = uploadBytes;
window.getDownloadURL = getDownloadURL;
const uploadBox = document.getElementById("uploadBox");
const fileInput = document.getElementById("deviceImage");
const uploadContent = document.getElementById("uploadContent");
const previewBox = document.getElementById("imagePreviewBox");
const previewImg = document.getElementById("previewImg");
const removeBtn = document.getElementById("removeImageBtn");
// =========================
// AUTH FUNCTIONS
// =========================
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));

  if (snap.exists()) {
    return snap.data();
  }

  return null;
}
window.login = async function () {
  const email = document.getElementById("email").value;

  const password = document.getElementById("password").value;

  if (!email || !password) {
    return showToast("Fill all fields");
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const user = userCredential.user;

    // Refresh verification status
    await user.reload();

    if (!user.emailVerified) {
      await signOut(auth);

      return showToast(
        "Please verify your email first. Check your inbox or spam folder.",
      );
    }

    showToast("Logged in successfully!");
  } catch (err) {
    showToast(err.message);
  }
};
window.logout = async function () {
  await signOut(auth);

  // reset forms
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";

  // reset UI states
  document.addEventListener("DOMContentLoaded", () => {
    const dashboard = document.querySelector(".dashboard");
    const navWrapper = document.getElementById("navWrapper");
    const mega = document.getElementById("mega");
    const searchModal = document.getElementById("searchModal");
  });
  if (dashboard) dashboard.style.display = "none";
  if (navWrapper) navWrapper.classList.remove("open");
  if (mega) mega.classList.remove("show");
  if (searchModal) searchModal.style.display = "none";

  // reset menus (VERY IMPORTANT)
  if (typeof guestMenu !== "undefined" && guestMenu) {
    guestMenu.style.display = "block";
  }

  if (typeof userMenu !== "undefined" && userMenu) {
    userMenu.style.display = "none";
  }

  // close account panels / dropdowns
  const accountPanel = document.getElementById("accountPanel");
  if (accountPanel) accountPanel.classList.remove("open");

  const accountDropdown = document.getElementById("accountDropdown");
  if (accountDropdown) accountDropdown.classList.remove("show");
};
// =========================
// AUTH STATE CONTROL
// =========================
document.addEventListener("click", function (e) {
  const dropdown = document.getElementById("accountDropdown");
  const wrapper = document.querySelector(".account-wrapper");

  if (!dropdown || !wrapper) return;

  if (!wrapper.contains(e.target)) {
    dropdown.classList.remove("show");
  }
});
window.openAuth = function () {
  // authModal.style.display = "flex";
};
window.closeAccountPanel = function () {
  document.getElementById("accountPanel").classList.remove("open");
  document.getElementById("accountOverlay").classList.remove("show");
};
onAuthStateChanged(auth, async (user) => {
  // console.log("AUTH STATE:", user);
  currentUser = user;

  const authModal = document.getElementById("authModal");
  const verifyScreen = document.getElementById("verifyScreen");

  // RESET UI FIRST (VERY IMPORTANT)
  if (authModal) authModal.style.display = "none";
  if (verifyScreen) verifyScreen.style.display = "none";

  // ❌ NO USER
  if (!user) {
    if (guestMenu) guestMenu.style.display = "block";
    if (userMenu) userMenu.style.display = "none";

    if (authModal) authModal.style.display = "flex";
    return;
  }

  // 🔄 REFRESH USER STATE
  await user.reload();

  // ❌ NOT VERIFIED
  if (!user.emailVerified) {
    if (guestMenu) guestMenu.style.display = "block";
    if (userMenu) userMenu.style.display = "none";

    if (authModal) authModal.style.display = "none";

    showVerifyScreen(user);
    return;
  }

  // ✅ VERIFIED USER
  if (guestMenu) guestMenu.style.display = "none";
  if (userMenu) userMenu.style.display = "block";
  if (authModal) authModal.style.display = "none";
  if (dashboard) dashboard.style.display = "grid";
  if (typeof loadUserRepairs === "function") loadUserRepairs();
  if (typeof listenToNotifications === "function") listenToNotifications();
  if (typeof window.loadProfile === "function") window.loadProfile();
  if (typeof loadHeaderUser === "function") loadHeaderUser();
  if (document.getElementById("repairCount")) {
    loadProfileStats();
  }

  const heading = document.querySelector(".main h1");
  if (heading) heading.innerText = "Welcome, " + user.email;

  if (emailBox) emailBox.innerText = user.email;

  const snap = await getDoc(doc(db, "users", user.uid));

  if (snap.exists()) {
    const data = snap.data();

    if (heading) {
      heading.innerText = "Welcome, " + (data.name || user.email);
    }
  }
});
window.toggleAccountMenu = function (e) {
  e.preventDefault();

  const user = auth.currentUser;

  if (user) {
    openAccountPanel();
  } else {
    authModal.style.display = "flex";
  }
};
function showVerifyScreen(user) {
  const screen = document.getElementById("verifyScreen");
  if (!screen) return;

  screen.style.display = "flex";
  const verifyEmail = document.getElementById("verifyEmail");
  if (verifyEmail) verifyEmail.innerText = user.email;

  startAutoCheck();
}
function startAutoCheck() {
  clearInterval(verifyInterval);

  verifyInterval = setInterval(async () => {
    if (!auth.currentUser) return;

    await auth.currentUser.reload();

    if (auth.currentUser.emailVerified) {
      clearInterval(verifyInterval);

      showToast("Email verified!", "success");

      document.getElementById("verifyScreen").style.display = "none";
    }
  }, 5000);
}
window.resendVerification = async function () {
  const user = auth.currentUser;

  if (!user) {
    return showToast("Please login again first", "error");
  }

  try {
    await user.reload();

    if (user.emailVerified) {
      document.getElementById("verifyScreen").style.display = "none";
      showToast("Email already verified", "success");
      return;
    }

    await sendEmailVerification(user);

    showToast("Verification email resent!", "success");

    startResendTimer();
  } catch (err) {
    console.error("Verification resend error:", err.code, err.message);

    if (err.code === "auth/too-many-requests") {
      showToast("Too many attempts. Please wait before trying again.", "error");
    } else {
      showToast(err.message, "error");
    }
  }
};
function startResendTimer() {
  const btn = document.getElementById("resendBtn");
  const timer = document.getElementById("resendTimer");

  resendCooldown = 30;
  btn.disabled = true;

  clearInterval(resendInterval);

  resendInterval = setInterval(() => {
    resendCooldown--;

    timer.innerText = `Resend available in ${resendCooldown}s`;

    if (resendCooldown <= 0) {
      clearInterval(resendInterval);
      btn.disabled = false;
      timer.innerText = "";
    }
  }, 1000);
}
window.rateRepair = async function (id) {
  const rating = prompt("Rate technician (1 - 5 stars)");

  if (!rating || rating < 1 || rating > 5) {
    return showToast("Invalid rating");
  }

  try {
    await updateDoc(doc(db, "repairs", id), {
      rating: Number(rating),
      ratedAt: serverTimestamp(),
    });

    showToast("Thanks for your feedback!");
  } catch (err) {
    console.error(err);
    showToast("Failed to submit rating");
  }
};
function listenToNotifications() {
  const box = document.getElementById("userNotifications");

  if (!box || !currentUser) return;

  const q = query(
    collection(db, "notifications"),
    where("uid", "==", currentUser.uid),
  );

  onSnapshot(q, (snapshot) => {
    box.innerHTML = "";

    let count = 0;

    snapshot.forEach((docSnap) => {
      const n = docSnap.data();

      count++;

      // 🔥 LIVE TOAST for new notifications
      showToast(n.message, n.type || "info");

      const div = document.createElement("div");

      div.className = "notif-card";

      div.innerHTML = `
        <div class="notif-icon-box">🔔</div>

        <div class="notif-content">
          <p>${n.message}</p>
          <small>
            ${
              n.createdAt
                ? new Date(n.createdAt.seconds * 1000).toLocaleString()
                : "Just now"
            }
          </small>
        </div>
      `;

      box.prepend(div);
    });

    updateNotificationBadge(count);
  });
}
function updateNotificationBadge(count) {
  const bell = document.querySelector(".notif-icon");

  if (!bell) return;

  let badge = document.querySelector(".notif-badge");

  if (!badge) {
    badge = document.createElement("span");
    badge.className = "notif-badge";
    bell.appendChild(badge);
  }

  badge.innerText = count;

  // hide badge if zero
  badge.style.display = count > 0 ? "flex" : "none";
}
// =========================
// NOTIFICATIONS
// =========================
window.toggleNotif = function () {
  const panel = document.getElementById("notifPanel");

  panel.classList.toggle("show");
};
//-----====================
//login  switching settings
window.showRegister = function () {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "flex";
};

window.showLogin = function () {
  document.getElementById("loginForm").style.display = "flex";
  document.getElementById("registerForm").style.display = "none";
};
window.signup = async function () {
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const confirm = document.getElementById("regConfirm").value;

  if (!name || !email || !password || !confirm) {
    return showToast("Fill all fields", "error");
  }

  if (password !== confirm) {
    return showToast("Passwords do not match", "error");
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name,
      email: user.email,
      role: "user",
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=487DE7&color=fff`,
      createdAt: serverTimestamp(),
    });

    await sendEmailVerification(user);

    showToast("Verification email sent", "success");

    // IMPORTANT: DO NOT LOG OUT
    showVerifyScreen(user);
  } catch (err) {
    showToast(err.message, "error");
  }
};
window.resendVerification = async function () {
  const user = auth.currentUser;

  if (!user) {
    return showToast("Login first", "error");
  }

  try {
    await sendEmailVerification(user);

    showToast("Verification email resent!", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
};
window.forgotPassword = async function () {
  const email = document.getElementById("email").value;

  if (!email) {
    return showToast("Please enter your email first.");
  }

  try {
    await sendPasswordResetEmail(auth, email);

    showToast(
      "Password reset link sent! Check your email inbox or spam folder.",
    );
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      showToast("No account found with this email.");
    } else if (err.code === "auth/invalid-email") {
      showToast("Invalid email address.");
    } else {
      showToast(err.message);
    }
  }
};
// =========================
// HERO BACKGROUND ROTATION
// =========================
// =========================
// HERO BACKGROUND ROTATION
// =========================

const hero = document.querySelector(".hero-premium");

if (hero) {
  const images = [
    "images/1.jpg",
    "images/2.jpg",
    "images/3.jpg",
    "images/4.jpg",
    "images/5.jpg",
    "images/6.jpg",
    "images/7.jpg",
    "images/8.jpg",
    "images/9.png",
    "images/10.jpg",
    "images/11.jpg",
    "images/12.jpg",
    "images/13.jpg",
  ];

  let index = 0;

  // preload images
  images.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  // first image
  hero.style.backgroundImage = `url(${images[0]})`;

  function changeHeroBg() {
    hero.classList.add("fade");

    setTimeout(() => {
      index = (index + 1) % images.length;

      hero.style.backgroundImage = `url(${images[index]})`;

      hero.classList.remove("fade");
    }, 400);
  }

  setInterval(changeHeroBg, 5000);
}
// MY ACCOUNT PANEL SCRIPT
window.openAccountPanel = function () {
  document.getElementById("accountPanel").classList.add("open");
};

window.closeAccountPanel = function () {
  document.getElementById("accountPanel").classList.remove("open");
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

function friendlyError(err) {
  if (err?.code === "permission-denied") {
    return "You do not have permission to do that";
  }

  if (err?.code === "unavailable") {
    return "Network problem. Please try again";
  }

  if (err?.code?.startsWith("auth/")) {
    return err.message;
  }

  return "Something went wrong. Please try again";
}

function setFieldError(input, message) {
  input.style.border = "2px solid #ef4444";

  let error = input.parentElement?.querySelector(
    `.field-error[data-for="${input.id}"]`,
  );

  if (!error) {
    error = document.createElement("small");
    error.className = "field-error";
    error.dataset.for = input.id;
    input.insertAdjacentElement("afterend", error);
  }

  error.innerText = message;
}

function clearFieldError(input) {
  input.style.border = "1px solid #ddd";

  const error = input.parentElement?.querySelector(
    `.field-error[data-for="${input.id}"]`,
  );

  if (error) error.remove();
}
window.toggleRepairForm = function () {
  const form = document.getElementById("repairForm");
  if (!form) return;

  form.classList.toggle("show");
};

function loadUserRepairs() {
  if (!currentUser) return;

  const active = document.getElementById("activeRepairs");
  const completed = document.getElementById("completedRepairs");

  if (!active || !completed) return;

  const q = query(
    collection(db, "repairs"),
    where("uid", "==", currentUser.uid),
  );

  onSnapshot(q, (snapshot) => {
    active.innerHTML = `<p class="empty-text">Loading repairs...</p>`;
    completed.innerHTML = `<p class="empty-text">Loading completed repairs...</p>`;

    if (snapshot.empty) {
      active.innerHTML = `
        <p class="empty-text">
          No repairs yet
        </p>
      `;
      completed.innerHTML = `
        <p class="empty-text">
          No completed repairs yet
        </p>
      `;
      return;
    }
    active.innerHTML = "";
    completed.innerHTML = "";
    let activeCount = 0;
    let completedCount = 0;
    snapshot.forEach((docSnap) => {
      const r = docSnap.data();

      const status = (r.status || "Pending").toLowerCase();
      const timeline = r.timeline || [];

      const progressMap = {
        pending: 20,
        diagnosing: 40,
        fixing: 75,
        completed: 100,
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


<div
  class="journey-box hidden"
  id="journey-${docSnap.id}"
>

  ${
    timeline.length
      ? timeline
          .map(
            (t) => `

      <div class="journey-step">

        <div class="journey-dot"></div>

        <div class="journey-content">
          <strong>${t.stage}</strong>
          <small>${t.time}</small>
        </div>

      </div>

    `,
          )
          .join("")
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
    if (activeCount === 0) {
      active.innerHTML = `<p class="empty-text">No active repairs yet</p>`;
    }

    if (completedCount === 0) {
      completed.innerHTML = `<p class="empty-text">No completed repairs yet</p>`;
    }

    const activeCountEl = document.getElementById("activeCount");
    const completedCountEl = document.getElementById("completedCount");

    if (activeCountEl) activeCountEl.innerText = activeCount;
    if (completedCountEl) completedCountEl.innerText = completedCount;
  });
}
//add technician code
window.createTechnician = async function () {
  const nameEl = document.getElementById("techName");
  const emailEl = document.getElementById("techEmail");

  const name = nameEl.value.trim();
  const email = emailEl.value.trim();

  if (!name || name.length < 3) return showToast("Enter valid name");
  if (!email.includes("@")) return showToast("Enter valid email");

  try {
    const id = "tech_" + Date.now();

    await setDoc(doc(db, "users", id), {
      name,
      email,
      role: "technician",
      createdAt: serverTimestamp(),
    });

    showToast("Technician added successfully");

    nameEl.value = "";
    emailEl.value = "";
    closeTechForm();
  } catch (err) {
    console.error(err);
    showToast("Failed to add technician");
  }
};
// dashboard codes
window.navigate = function (page) {
  document.querySelectorAll(".page").forEach((p) => {
    p.classList.remove("active");
  });

  const target = document.getElementById(page + "Page");
  if (target) target.classList.add("active");

  document.getElementById("pageTitle").innerText =
    page.charAt(0).toUpperCase() + page.slice(1);

  localStorage.setItem("lastPage", page);
};

document.querySelectorAll("[data-page]").forEach((card) => {
  card.addEventListener("click", () => {
    window.navigate(card.dataset.page);
  });
});
window.toggleJourney = function (id) {
  const box = document.getElementById(`journey-${id}`);
  if (!box) return;

  const ref = doc(db, "repairs", id);
  getDoc(ref).then((snap) => {
    const data = snap.data();
    const timeline = data.timeline || [];

    box.innerHTML = timeline.length
      ? timeline
          .map(
            (t) => `
      <div class="journey-step">
        <strong>${t.stage}</strong>
        <small>${t.time}</small>
      </div>
    `,
          )
          .join("")
      : `<p class="empty-journey">No updates yet</p>`;

    box.classList.toggle("hidden");
  });
};
let currentStep = 1;
const totalSteps = 7;

window.nextStep = function (step) {
  if (!validateStep(step)) return;
  currentStep = step + 1;
  showStep(currentStep);
};

window.prevStep = function (step) {
  currentStep = step - 1;
  showStep(currentStep);
};

window.showStep = function (step) {
  document
    .querySelectorAll(".step")
    .forEach((s) => s.classList.remove("active"));

  const el = document.getElementById("step" + step);
  if (!el) return;

  el.classList.add("active");

  // 🔥 RESET IMAGE WHEN LEAVING STEP 1
  // if (step !== 1) {
  //   resetImagePreview();
  // }

  if (step === 7) buildReview();

  let progress = ((step - 1) / (7 - 1)) * 100;
  document.getElementById("progress").style.width = progress + "%";
};
function resetImagePreview() {
  const fileInput = document.getElementById("deviceImage");
  const previewImg = document.getElementById("previewImg");
  const uploadContent = document.getElementById("uploadContent");
  const previewBox = document.getElementById("imagePreviewBox");

  if (fileInput) fileInput.value = "";
  if (previewImg) previewImg.src = "";

  if (previewBox) previewBox.style.display = "none";
  if (uploadContent) uploadContent.style.display = "block";
}
function collectFormData() {
  return {
    category: document.getElementById("category")?.value || "",
    deviceName: document.getElementById("deviceName")?.value || "",
    problemType: document.getElementById("problemType")?.value || "",
    issue: document.getElementById("issue")?.value || "",
    urgency: document.getElementById("urgency")?.value || "",
    contact: document.getElementById("contact")?.value || "",
    serviceType: document.getElementById("serviceType")?.value || "",
  };
}
window.startRepair = async function startRepair() {
  const submitButtons = document.querySelectorAll(
    'button[onclick="startRepair()"]',
  );

  try {
    const user = auth.currentUser;

    if (!user) {
      showToast("Please login first");
      return;
    }

    submitButtons.forEach((btn) => {
      btn.disabled = true;
      btn.dataset.originalText = btn.innerText;
      btn.innerText = "Submitting...";
    });

    showToast("Submitting repair request...");

    const data = collectFormData();
    const idToken = await user.getIdToken();
    const imageFile = document.getElementById("deviceImage")?.files?.[0];

    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (imageFile) {
      formData.append("deviceImage", imageFile);
    }

    const response = await fetch(REPAIR_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Could not submit repair");
    }

    showToast("Repair submitted successfully", "success");
    closeRepairForm();
    resetImagePreview();
  } catch (err) {
    console.error(err);
    showToast(err.message || friendlyError(err), "error");
  } finally {
    submitButtons.forEach((btn) => {
      btn.disabled = false;
      btn.innerText = btn.dataset.originalText || "Submit";
    });
  }
};
window.addEventListener("DOMContentLoaded", () => {
  const draft = localStorage.getItem("repairDraft");

  if (draft) {
    const data = JSON.parse(draft);

    Object.keys(data).forEach((key) => {
      const el = document.getElementById(key);
      if (el) el.value = data[key];
    });
  }
});
document.querySelectorAll("input, select").forEach((el) => {
  el.addEventListener("change", () => {
    clearFieldError(el);

    if (typeof saveDraft === "function") {
      saveDraft();
    }
  });
});
function validateStep(step) {
  const stepEl = document.getElementById("step" + step);
  if (!stepEl) return false;

  const inputs = stepEl.querySelectorAll("input, select, textarea");

  for (let input of inputs) {
    // Image upload is disabled for now
    if (input.type === "file" || input.id === "deviceImage") {
      continue;
    }

    if (input.disabled) {
      continue;
    }

    if (input.value.trim() === "") {
      const label =
        input.placeholder ||
        input.options?.[0]?.text ||
        "This field";
      setFieldError(input, `${label} is required`);
      return false;
    } else {
      clearFieldError(input);
    }
  }

  return true;
}
// const deviceImageInput = document.getElementById("deviceImage");
// if (deviceImageInput) {
//   deviceImageInput.disabled = true;
// }
function buildReview() {
  const data = collectFormData();

  document.getElementById("reviewBox").innerHTML = `
    <p><b>Category:</b> ${data.category}</p>
    <p><b>Device:</b> ${data.deviceName}</p>
    <p><b>Problem:</b> ${data.problemType}</p>
    <p><b>Issue:</b> ${data.issue}</p>
    <p><b>Contact:</b> ${data.contact}</p>
    <p><b>Urgency:</b> ${data.urgency}</p>
    <p><b>Service:</b> ${data.serviceType}</p>
  `;
}
const deviceImage = document.getElementById("deviceImage");

if (deviceImage) {
  deviceImage.addEventListener("change", function (e) {
    const file = e.target.files[0];

    const preview = document.getElementById("previewImg");

    if (!file || !preview) return;

    const reader = new FileReader();

    reader.onload = function (event) {
      preview.src = event.target.result;

      preview.style.display = "block";
    };

    reader.readAsDataURL(file);
  });
}
async function uploadImage(file) {
  if (!file || !storage) return null;

  const imageRef = ref(storage, `repair_images/${Date.now()}_${file.name}`);

  await uploadBytes(imageRef, file);

  return await getDownloadURL(imageRef);
}
window.switchTab = function (id) {
  console.log("switchTab running:", id);
};
if (uploadBox && fileInput) {
  // CLICK to open file picker
  uploadBox.addEventListener("click", () => {
    fileInput.click();
  });

  // DRAG OVER
  uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = "#2563eb";
  });

  // DRAG LEAVE
  uploadBox.addEventListener("dragleave", () => {
    uploadBox.style.borderColor = "#d1d5db";
  });

  // DROP FILE
  uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  });

  // FILE CHANGE
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    handleFile(file);
  });
}

// HANDLE FILE
function handleFile(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    return showToast("Only image files allowed", "error");
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    if (previewImg) previewImg.src = e.target.result;

    if (uploadContent) uploadContent.style.display = "none";

    if (previewBox) previewBox.style.display = "flex";
  };

  reader.readAsDataURL(file);
}

// REMOVE IMAGE
if (removeBtn) {
  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    if (fileInput) fileInput.value = "";
    if (previewImg) previewImg.src = "";

    if (previewBox) previewBox.style.display = "none";

    if (uploadContent) uploadContent.style.display = "block";
  });
}
window.toggleRepairForm = function () {
  const overlay = document.getElementById("repairOverlay");
  if (!overlay) return;

  overlay.classList.toggle("show");
};

window.closeRepairForm = function () {
  const overlay = document.getElementById("repairOverlay");
  if (overlay) overlay.classList.remove("show");
};

const repairOverlay = document.getElementById("repairOverlay");
if (repairOverlay) {
  repairOverlay.addEventListener("click", (event) => {
    if (event.target === repairOverlay) {
      window.closeRepairForm();
    }
  });
}
async function loadHeaderUser() {
  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return;

  const data = snap.data();

  const nameEl = document.getElementById("userName");
  const roleEl = document.getElementById("userRole");

  if (nameEl) {
    nameEl.innerText = data.name || user.email.split("@")[0];
  }

  if (roleEl) {
    roleEl.innerText = data.role || "User";
  }
}
async function loadProfileStats() {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "repairs"), where("uid", "==", user.uid));
  const snap = await getDocs(q);

  let total = 0;
  let completed = 0;

  snap.forEach((doc) => {
    total++;
    if ((doc.data().status || "").toLowerCase() === "completed") {
      completed++;
    }
  });

  const repairCountEl = document.getElementById("repairCount");
  const completedCountEl = document.getElementById("completedCount");
  const profileCompletedCountEl = document.getElementById("profileCompletedCount");

  if (repairCountEl) repairCountEl.innerText = total;
  if (completedCountEl) completedCountEl.innerText = completed;
  if (profileCompletedCountEl) profileCompletedCountEl.innerText = completed;
}
document.addEventListener("keydown", function (e) {
  const activeTag = document.activeElement?.tagName?.toLowerCase();

  // Ctrl/Cmd + K opens search
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();

    if (searchModal) {
      searchModal.style.display = "block";
      setTimeout(() => searchInput?.focus(), 50);
    }

    return;
  }

  // Escape closes open UI
  if (e.key === "Escape") {
    if (searchModal) searchModal.style.display = "none";
    if (mega) mega.classList.remove("show");
    if (navWrapper) navWrapper.classList.remove("open");

    const repairOverlay = document.getElementById("repairOverlay");
    if (repairOverlay) repairOverlay.classList.remove("show");

    const accountPanel = document.getElementById("accountPanel");
    const accountOverlay = document.getElementById("accountOverlay");

    if (accountPanel) accountPanel.classList.remove("open");
    if (accountOverlay) accountOverlay.classList.remove("show");

    return;
  }

  // Enter submits auth forms
  if (e.key === "Enter") {
    const authModal = document.getElementById("authModal");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    const authIsOpen = authModal && authModal.style.display !== "none";

    if (authIsOpen) {
      e.preventDefault();

      if (registerForm && registerForm.style.display !== "none") {
        signup();
      } else if (loginForm && loginForm.style.display !== "none") {
        login();
      }

      return;
    }

    // Enter controls repair modal steps
    const repairOverlay = document.getElementById("repairOverlay");
    const repairIsOpen = repairOverlay?.classList.contains("show");

    if (repairIsOpen && activeTag !== "textarea") {
      e.preventDefault();

      if (currentStep >= 1 && currentStep < 6) {
        nextStep(currentStep);
      } else {
        startRepair();
      }
    }
  }

  // Arrow navigation for repair modal
  const repairOverlay = document.getElementById("repairOverlay");
  const repairIsOpen = repairOverlay?.classList.contains("show");

  if (repairIsOpen) {
    if (e.key === "ArrowRight" && currentStep < 6) {
      nextStep(currentStep);
    }

    if (e.key === "ArrowLeft" && currentStep > 1) {
      prevStep(currentStep);
    }
  }
});
