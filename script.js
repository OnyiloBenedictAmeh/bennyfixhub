function hideAllAuthUI() {
  if (authModal) authModal.style.display = "none";
  const verify = document.getElementById("verifyScreen");
  if (verify) verify.style.display = "none";
}
// =========================
// ELEMENT REFERENCES
// =========================
const mega = document.getElementById("mega");
const searchModal = document.getElementById("searchModal");
const searchInput = document.getElementById("searchInput");
const navWrapper = document.getElementById("navWrapper");
const authModal = document.getElementById("authModal");
const dashboard = document.querySelector(".dashboard");
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
  if (activeTab) activeTab.classList.add("active");

  updateMegaLayout();
}

// OPEN MEGA
function openMega(tab) {
  clearTimeout(megaTimeout);
  mega.classList.add("show");
  switchTab(tab);
}

// CLOSE MEGA
function closeMega() {
  megaTimeout = setTimeout(() => {
    mega.classList.remove("show");
  }, 150);
}

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
    e.stopPropagation(); // 🔥 prevent bubbling
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
      (el) => el.offsetParent !== null
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
    mega.classList.remove("show");
  }, 100);
});

// =========================
// 🔥 FIREBASE SETUP
// =========================
// import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyA4btiZMSBa4g6vt3XKf1uHeJiu8GJtTj4",
  authDomain: "bennyfixhub.firebaseapp.com",
  projectId: "bennyfixhub",
  storageBucket: "bennyfixhub.appspot.com",
  messagingSenderId: "281036247412",
  appId: "1:281036247412:web:19db51739bc6c81fbc1c21",
  measurementId: "G-EZ4FHYDFZB"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
// =========================
// AUTH FUNCTIONS
// =========================
window.login = async function () {
  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  if (!email || !password) {
    return showToast("Fill all fields");
  }

  try {

    const userCredential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = userCredential.user;

    // Refresh verification status
    await user.reload();

    if (!user.emailVerified) {

      await signOut(auth);

      return showToast(
        "Please verify your email first. Check your inbox or spam folder."
      );
    }

    showToast("Logged in successfully!");

  } catch (err) {
    showToast(err.message);
  }
};
window.logout = function () {
  signOut(auth);
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
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
};onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  const authModal = document.getElementById("authModal");
  const verifyScreen = document.getElementById("verifyScreen");

  // RESET UI FIRST (VERY IMPORTANT)
  if (authModal) authModal.style.display = "none";
  if (verifyScreen) verifyScreen.style.display = "none";
  if (dashboard) dashboard.style.display = "none";

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

  loadUserRepairs();
  listenToNotifications();

  if (authModal) authModal.style.display = "none";
  if (dashboard) dashboard.style.display = "grid";

  const heading = document.querySelector(".main h1");
  if (heading) heading.innerText = "Welcome, " + user.email;

  if (emailBox) emailBox.innerText = user.email;
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

  screen.style.display = "flex";
  document.getElementById("verifyEmail").innerText = user.email;

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

  if (!user) return;

  try {
    await sendEmailVerification(user);
    showToast("Verification email resent", "success");
  } catch (err) {
    showToast(err.message, "error");
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
    });

    showToast("Thanks for your feedback!");
  } catch (err) {
    console.error(err);
    showToast("Failed to submit rating");
  }
};
function listenToNotifications() {

  const box =
    document.getElementById("userNotifications");

  if (!box || !currentUser) return;

  const q = query(
    collection(db, "notifications"),
    where("uid", "==", currentUser.uid)
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
              ? new Date(
                  n.createdAt.seconds * 1000
                ).toLocaleString()
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

  const bell =
    document.querySelector(".notif-icon");

  if (!bell) return;

  let badge =
    document.querySelector(".notif-badge");

  if (!badge) {

    badge = document.createElement("span");
    badge.className = "notif-badge";
    bell.appendChild(badge);
  }

  badge.innerText = count;

  // hide badge if zero
  badge.style.display =
    count > 0 ? "flex" : "none";
}
// =========================
// NOTIFICATIONS
// =========================
window.toggleNotif = function () {

  const panel =
    document.getElementById("notifPanel");

  panel.classList.toggle("show");

};
//-----====================
//login  switching settings
window.showRegister = function () {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
};

window.showLogin = function () {
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("registerForm").style.display = "none";
};window.signup = async function () {
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
    const userCredential =
      await createUserWithEmailAndPassword(auth, email, password);

    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name,
      email: user.email,
      role: "user",
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=487DE7&color=fff`,
      createdAt: serverTimestamp()
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

    showToast(
      "Verification email resent!",
      "success"
    );

  } catch (err) {
    showToast(err.message, "error");
  }
};
window.forgotPassword = async function () {

  const email =
    document.getElementById("email").value;

  if (!email) {
    return showToast(
      "Please enter your email first."
    );
  }

  try {

    await sendPasswordResetEmail(
      auth,
      email
    );

    showToast(
      "Password reset link sent! Check your email inbox or spam folder."
    );

  } catch (err) {

    if (err.code === "auth/user-not-found") {
      showToast("No account found with this email.");
    } else if (
      err.code === "auth/invalid-email"
    ) {
      showToast("Invalid email address.");
    } else {
      showToast(err.message);
    }
  }
};
// =========================
// HERO BACKGROUND ROTATION
// =========================

const hero = document.querySelector(".hero-premium");

const images = [
  "images/1.jpg",
  "images/2.jpg",
  "images/3.jpg",
  "images/4.jpg",
  "images/5.jpg",
  "images/6.jpg",
  "images/7.jpg",
  "images/8.jpg",
  "images/9.jpg",
  "images/10.jpg",
  "images/11.jpg",
  "images/12.jpg",
  "images/13.jpg"
];
let index = 0;

// preload images (prevents lag)
images.forEach(src => {
  const img = new Image();
  img.src = src;
});

// set first image
hero.style.backgroundImage = `url(${images[0]})`;

function changeHeroBg() {
  hero.classList.add("fade");

  setTimeout(() => {
    index = (index + 1) % images.length;
    hero.style.backgroundImage = `url(${images[index]})`;
    hero.classList.remove("fade");
  }, 400);
}

// change every 5 seconds
setInterval(changeHeroBg, 5000);
// MY ACCOUNT PANEL SCRIPT
window.openAccountPanel = function () {
  document.getElementById("accountPanel").classList.add("open");
};

window.closeAccountPanel = function () {
  document.getElementById("accountPanel").classList.remove("open");
};
// start repair form scripts
window.startRepair = async function () {

  const category =
    document.getElementById("category").value;

  const device =
    document.getElementById("deviceName").value;

  const problemType =
    document.getElementById("problemType").value;

  const issue =
    document.getElementById("issue").value;

  const urgency =
    document.getElementById("urgency").value;

  const contact =
    document.getElementById("contact").value;

  const serviceType =
    document.getElementById("serviceType").value;

  if (!category || !device || !problemType || !issue || !contact) {
    return showToast("Please fill all required fields");
  }

  if (!currentUser) {
    return showToast("Please login first", "error");
  }

  try {

    await addDoc(collection(db, "repairs"), {

      uid: currentUser.uid,
      email: currentUser.email,

      category,
      device,
      problemType,
      issue,
      urgency,
      contact,
      serviceType,

      status: "Pending",
      createdAt: serverTimestamp()

    });

    showToast("Repair submitted successfully!", "success");

    document.getElementById("repairForm").reset();

    window.location.href = "dashboard.html";

  } catch (err) {
    console.error(err);
    showToast("Error: " + err.message);
  }
};
function showToast(message, type = "info") {
  const container =
    document.getElementById("toastContainer");

  if (!container) return;

  const toast =
    document.createElement("div");

  toast.className =
    `toast ${type}`;

  toast.innerText = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
};
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
//add technician code
window.createTechnician = async function () {
  const nameEl = document.getElementById("techName");
  const emailEl = document.getElementById("techEmail");

  const name = nameEl.value.trim();
  const email = emailEl.value.trim();

  if (!name || name.length < 3) return showToast("Enter valid name");
  if (!email.includes("@")) return showToast("Enter valid email");

  try {
    // const id = "tech_" + Date.now();

    await setDoc(doc(db, "users", id), {
      name,
      email,
      role: "technician",
      createdAt: serverTimestamp()
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
  document.querySelectorAll(".page").forEach(p => {
    p.classList.remove("active");
  });

  const target = document.getElementById(page + "Page");
  if (target) target.classList.add("active");

  document.getElementById("pageTitle").innerText =
    page.charAt(0).toUpperCase() + page.slice(1);

  localStorage.setItem("lastPage", page);
};

document.querySelectorAll("[data-page]").forEach(card => {
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
    const journey = data.journey || [];

    box.innerHTML = journey.map(t => `
      <div class="journey-step">
        <strong>${t.stage}</strong>
        <small>${t.time}</small>
      </div>
    `).join("");

    box.classList.toggle("hidden");
  });
};
