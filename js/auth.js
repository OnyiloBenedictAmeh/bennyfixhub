// =========================
// AUTH
// =========================

import {
  auth,
  db,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  serverTimestamp,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "./firebase.js";

import {
  showToast,
  validateEmailField,
  validatePasswordField,
  validateRequiredField,
  validatePhoneField,
  setFieldError,
} from "./ui.js";

import { runOnboarding } from "./onboarding.js";

let resendCooldown = 30;
let resendInterval;
let verifyInterval;

export let currentUser = null;

// =========================
// LOGOUT UI
// =========================

let logoutInProgress = false;

function injectLogoutStyles() {
  if (document.getElementById("bennyfix-logout-styles")) return;

  const style = document.createElement("style");
  style.id = "bennyfix-logout-styles";

  style.textContent = `
    /* =========================================================
       BENNYFIX HUB LOGOUT EXPERIENCE
       ========================================================= */

    #bennyfixLogoutOverlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(15, 23, 42, 0.62);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition:
        opacity 0.25s ease,
        visibility 0.25s ease;
    }

    #bennyfixLogoutOverlay.show {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    .bennyfix-logout-card {
      width: min(380px, calc(100vw - 40px));
      padding: 32px 28px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      background: #ffffff;
      color: #111827;
      text-align: center;
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.28);
      transform: translateY(12px) scale(0.97);
      transition: transform 0.28s ease;
    }

    #bennyfixLogoutOverlay.show .bennyfix-logout-card {
      transform: translateY(0) scale(1);
    }

    .bennyfix-logout-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 62px;
      height: 62px;
      margin: 0 auto 18px;
      border-radius: 50%;
      background: #eff6ff;
      color: #2563eb;
      font-size: 29px;
    }

    .bennyfix-logout-icon.success {
      background: #ecfdf5;
      color: #16a34a;
    }

    .bennyfix-logout-icon.error {
      background: #fef2f2;
      color: #dc2626;
    }

    .bennyfix-logout-spinner {
      width: 28px;
      height: 28px;
      border: 3px solid #dbeafe;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: bennyfixLogoutSpin 0.75s linear infinite;
    }

    @keyframes bennyfixLogoutSpin {
      to {
        transform: rotate(360deg);
      }
    }

    .bennyfix-logout-card h3 {
      margin: 0 0 8px;
      font-size: 20px;
      line-height: 1.3;
    }

    .bennyfix-logout-card p {
      margin: 0;
      color: #64748b;
      font-size: 14px;
      line-height: 1.6;
    }

    .bennyfix-logout-close {
      display: none;
      margin: 20px auto 0;
      padding: 9px 18px;
      border: 0;
      border-radius: 9px;
      background: #2563eb;
      color: #ffffff;
      font-weight: 700;
      cursor: pointer;
    }

    @media (prefers-reduced-motion: reduce) {
      #bennyfixLogoutOverlay,
      .bennyfix-logout-card {
        transition: none;
      }

      .bennyfix-logout-spinner {
        animation: none;
      }
    }

    @media (max-width: 480px) {
      #bennyfixLogoutOverlay {
        padding: 16px;
      }

      .bennyfix-logout-card {
        width: 100%;
        padding: 28px 22px;
        border-radius: 18px;
      }

      .bennyfix-logout-icon {
        width: 56px;
        height: 56px;
        font-size: 25px;
      }

      .bennyfix-logout-card h3 {
        font-size: 18px;
      }

      .bennyfix-logout-card p {
        font-size: 13px;
      }
    }
  `;

  document.head.appendChild(style);
}

function createLogoutOverlay() {
  if (document.getElementById("bennyfixLogoutOverlay")) {
    return document.getElementById("bennyfixLogoutOverlay");
  }

  injectLogoutStyles();

  const overlay = document.createElement("div");
  overlay.id = "bennyfixLogoutOverlay";
  overlay.setAttribute("aria-hidden", "true");

  overlay.innerHTML = `
    <div
      class="bennyfix-logout-card"
      role="status"
      aria-live="polite"
    >
      <div class="bennyfix-logout-icon" id="bennyfixLogoutIcon">
        <div class="bennyfix-logout-spinner"></div>
      </div>

      <h3 id="bennyfixLogoutTitle">
        Signing you out…
      </h3>

      <p id="bennyfixLogoutMessage">
        Please wait while we securely close your session.
      </p>

      <button
        type="button"
        class="bennyfix-logout-close"
        id="bennyfixLogoutClose"
      >
        Continue
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeButton = overlay.querySelector("#bennyfixLogoutClose");

  closeButton?.addEventListener("click", () => {
    hideLogoutOverlay();
  });

  return overlay;
}

function showLogoutProgress() {
  const overlay = createLogoutOverlay();

  const icon = overlay.querySelector("#bennyfixLogoutIcon");
  const title = overlay.querySelector("#bennyfixLogoutTitle");
  const message = overlay.querySelector("#bennyfixLogoutMessage");
  const closeButton = overlay.querySelector("#bennyfixLogoutClose");

  icon.className = "bennyfix-logout-icon";
  icon.innerHTML = `
    <div class="bennyfix-logout-spinner"></div>
  `;

  title.textContent = "Signing you out…";
  message.textContent = "Please wait while we securely close your session.";

  if (closeButton) {
    closeButton.style.display = "none";
  }

  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden", "false");
}

function showLogoutSuccess() {
  const overlay = createLogoutOverlay();

  const icon = overlay.querySelector("#bennyfixLogoutIcon");
  const title = overlay.querySelector("#bennyfixLogoutTitle");
  const message = overlay.querySelector("#bennyfixLogoutMessage");
  const closeButton = overlay.querySelector("#bennyfixLogoutClose");

  icon.className = "bennyfix-logout-icon success";
  icon.innerHTML = "✓";

  title.textContent = "You're logged out";
  message.textContent = "Your BennyFix Hub session has been securely closed.";

  if (closeButton) {
    closeButton.style.display = "none";
  }

  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden", "false");
}

function showLogoutError() {
  const overlay = createLogoutOverlay();

  const icon = overlay.querySelector("#bennyfixLogoutIcon");
  const title = overlay.querySelector("#bennyfixLogoutTitle");
  const message = overlay.querySelector("#bennyfixLogoutMessage");
  const closeButton = overlay.querySelector("#bennyfixLogoutClose");

  icon.className = "bennyfix-logout-icon error";
  icon.innerHTML = "!";

  title.textContent = "Logout failed";
  message.textContent = "We couldn't complete the logout. Please try again.";

  if (closeButton) {
    closeButton.style.display = "inline-block";
  }

  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden", "false");
}

function hideLogoutOverlay() {
  const overlay = document.getElementById("bennyfixLogoutOverlay");

  if (!overlay) return;

  overlay.classList.remove("show");
  overlay.setAttribute("aria-hidden", "true");
}

// =========================
// GET USER PROFILE
// =========================

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

function avatarFallback(name = "User") {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=487DE7&color=fff`;
}

function setAccountAvatar(src, name = "User") {
  const avatarCircle = document.getElementById("avatarCircle");

  if (!avatarCircle) return;

  avatarCircle.innerHTML = `
    <img
      src="${src}"
      alt="${name} profile picture"
      onerror="this.src='${avatarFallback(name)}'"
    />
  `;
}

// =========================
// ACCOUNT PROFILE DISPLAY
// =========================

window.loadHeaderUser = async function () {
  const user = auth.currentUser;

  if (!user) return;

  const nameEl = document.getElementById("userName");
  const roleEl = document.getElementById("userRole");
  const technicianLink = document.getElementById("technicianDashboardLink");

  const data = await getUserProfile(user.uid);

  const name =
    data?.name || user.displayName || user.email?.split("@")[0] || "User";

  const role = data?.role || "BennyFix Hub Member";

  const avatar = data?.avatar || avatarFallback(name);

  if (nameEl) nameEl.textContent = name;
  if (roleEl) roleEl.textContent = role;

  if (technicianLink) {
    technicianLink.style.display = role === "technician" ? "flex" : "none";
  }

  setAccountAvatar(avatar, name);
};

window.handleAvatarUpload = async function (event) {
  const file = event.target.files?.[0];
  const user = auth.currentUser;

  if (!file || !user) return;

  const previewUrl = URL.createObjectURL(file);

  setAccountAvatar(previewUrl, user.email?.split("@")[0] || "User");

  try {
    const avatarRef = ref(storage, `avatars/${user.uid}`);

    await uploadBytes(avatarRef, file);

    const avatarUrl = await getDownloadURL(avatarRef);

    await updateDoc(doc(db, "users", user.uid), {
      avatar: avatarUrl,
    });

    await window.loadHeaderUser();

    showToast("Profile picture updated", "success");
  } catch (err) {
    console.error(err);

    await window.loadHeaderUser();

    showToast("Could not update profile picture", "error");
  } finally {
    URL.revokeObjectURL(previewUrl);
    event.target.value = "";
  }
};

// =========================
// LOGIN
// =========================

window.login = async function () {
  const emailInput = document.getElementById("email");

  const passwordInput = document.getElementById("password");

  const emailIsValid = validateEmailField(emailInput);

  const passwordIsValid = validatePasswordField(passwordInput);

  if (!emailIsValid || !passwordIsValid) {
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      emailInput.value.trim(),
      passwordInput.value,
    );

    const user = userCredential.user;

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

// =========================
// LOGOUT
// =========================

window.logout = async function () {
  /*
   * Prevent double-clicks and multiple simultaneous
   * signOut() operations.
   */

  if (logoutInProgress) return;

  logoutInProgress = true;

  try {
    // ---------------------------------------------------------
    // 1. SHOW VISUAL FEEDBACK IMMEDIATELY
    // ---------------------------------------------------------

    showLogoutProgress();

    // ---------------------------------------------------------
    // 2. CLOSE ACCOUNT UI BEHIND THE OVERLAY
    // ---------------------------------------------------------

    const navWrapper = document.getElementById("navWrapper");

    const mega = document.getElementById("mega");

    const searchModal = document.getElementById("searchModal");

    const accountPanel = document.getElementById("accountPanel");

    const accountDropdown = document.getElementById("accountDropdown");

    if (navWrapper) {
      navWrapper.classList.remove("open");
    }

    if (mega) {
      mega.classList.remove("show");
    }

    if (searchModal) {
      searchModal.style.display = "none";
    }

    if (accountPanel) {
      accountPanel.classList.remove("open");
    }

    if (accountDropdown) {
      accountDropdown.classList.remove("show");
    }

    // ---------------------------------------------------------
    // 3. ACTUALLY SIGN OUT FROM FIREBASE
    // ---------------------------------------------------------

    await signOut(auth);

    // ---------------------------------------------------------
    // 4. CLEAR LOGIN FIELDS
    // ---------------------------------------------------------

    const emailInput = document.getElementById("email");

    const passwordInput = document.getElementById("password");

    if (emailInput) {
      emailInput.value = "";
    }

    if (passwordInput) {
      passwordInput.value = "";
    }

    // ---------------------------------------------------------
    // 5. EXPLICITLY RESET LOCAL UI
    //
    // onAuthStateChanged() will also handle this, but
    // doing it here makes the transition immediate and
    // prevents stale account UI.
    // ---------------------------------------------------------

    const dashboard = document.querySelector(".dashboard");

    const guestMenu = document.getElementById("guestMenu");

    const userMenu = document.getElementById("userMenu");

    if (dashboard) {
      dashboard.style.display = "none";
    }

    if (guestMenu) {
      guestMenu.style.display = "block";
    }

    if (userMenu) {
      userMenu.style.display = "none";
    }

    // ---------------------------------------------------------
    // 6. SHOW SUCCESS STATE
    // ---------------------------------------------------------

    showLogoutSuccess();

    /*
     * Give the user enough time to actually see
     * the confirmation instead of instantly removing it.
     */

    await new Promise((resolve) => {
      setTimeout(resolve, 900);
    });

    // ---------------------------------------------------------
    // 7. CLOSE THE LOGOUT UI
    // ---------------------------------------------------------

    hideLogoutOverlay();
  } catch (err) {
    console.error("Logout error:", err);

    showLogoutError();
  } finally {
    logoutInProgress = false;
  }
};

// =========================
// SIGNUP
// =========================

window.signup = async function () {
  const nameInput = document.getElementById("regName");

  const emailInput = document.getElementById("regEmail");

  const phoneInput = document.getElementById("regphone");

  const passwordInput = document.getElementById("regPassword");

  const confirmInput = document.getElementById("regConfirm");

  const nameIsValid = validateRequiredField(nameInput, "Full name is required");

  const emailIsValid = validateEmailField(emailInput);

  const phoneIsValid = validatePhoneField(phoneInput);

  const passwordIsValid = validatePasswordField(passwordInput);

  const confirmIsValid = validateRequiredField(
    confirmInput,
    "Confirm your password",
  );

  if (
    !nameIsValid ||
    !emailIsValid ||
    !phoneIsValid ||
    !passwordIsValid ||
    !confirmIsValid
  ) {
    return;
  }

  if (passwordInput.value !== confirmInput.value) {
    setFieldError(confirmInput, "Passwords do not match");

    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      emailInput.value.trim(),
      passwordInput.value,
    );

    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: nameInput.value.trim(),
      email: user.email,
      phone: phoneInput.value.trim(),
      role: "user",

      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        nameInput.value.trim(),
      )}&background=487DE7&color=fff`,

      createdAt: serverTimestamp(),
    });

    await sendCustomVerificationEmail(user);

    showToast("Verification email sent", "success");

    showVerifyScreen(user);

    // Also trigger backend email

    const idToken = await user.getIdToken();

    await fetch(
      "https://bennyfix-backend-v.vercel.app/api/send-verification-email",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${idToken}`,

          "Content-Type": "application/json",
        },
      },
    );
  } catch (err) {
    showToast(err.message, "error");
  }
};

// =========================
// FORGOT PASSWORD
// =========================

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
// VERIFICATION
// =========================

async function sendCustomVerificationEmail(user) {
  const actionCodeSettings = {
    url: "https://onyilobenedictameh.github.io/bennyfixhub/index.html",

    handleCodeInApp: false,
  };

  await sendEmailVerification(user, actionCodeSettings);

  return {
    success: true,
  };
}

function showVerifyScreen(user) {
  const screen = document.getElementById("verifyScreen");

  if (!screen) return;

  screen.style.display = "flex";

  const verifyEmail = document.getElementById("verifyEmail");

  if (verifyEmail) {
    verifyEmail.innerText = user.email;
  }

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

      const verifyScreen = document.getElementById("verifyScreen");

      if (verifyScreen) {
        verifyScreen.style.display = "none";
      }
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
      const screen = document.getElementById("verifyScreen");

      if (screen) {
        screen.style.display = "none";
      }

      return showToast("Email already verified", "success");
    }

    const res = await sendCustomVerificationEmail(user);

    console.log("Resend response:", res);

    showToast("Verification email resent!", "success");

    startResendTimer();
  } catch (err) {
    console.error("Resend error:", err);

    if (err?.code === "auth/too-many-requests") {
      showToast("Too many attempts. Please wait before trying again.", "error");
    } else {
      showToast(err?.message || "Failed to resend verification email", "error");
    }
  }
};

function startResendTimer() {
  const btn = document.getElementById("resendBtn");

  const timer = document.getElementById("resendTimer");

  if (!btn || !timer) return;

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

// =========================
// ACCOUNT PANEL
// =========================

window.openAuth = function () {
  const authModal = document.getElementById("authModal");

  if (authModal) {
    authModal.style.display = "flex";
  }

  document.getElementById("accountDropdown")?.classList.remove("show");
};

window.closeAuth = function () {
  const authModal = document.getElementById("authModal");

  if (authModal) {
    authModal.style.display = "none";
  }
};

window.openAccountPanel = function () {
  document.getElementById("accountPanel")?.classList.add("open");
};

window.closeAccountPanel = function () {
  document.getElementById("accountPanel")?.classList.remove("open");

  document.getElementById("accountOverlay")?.classList.remove("show");
};

window.toggleAccountMenu = function (e) {
  e.preventDefault();

  const user = auth.currentUser;

  const dropdown = document.getElementById("accountDropdown");

  if (user) {
    window.openAccountPanel();
  } else {
    dropdown?.classList.toggle("show");
  }
};

// =========================
// CLOSE DROPDOWN ON OUTSIDE CLICK
// =========================

document.addEventListener("click", function (e) {
  const dropdown = document.getElementById("accountDropdown");

  const wrapper = document.querySelector(".account-wrapper");

  if (!dropdown || !wrapper) {
    return;
  }

  if (!wrapper.contains(e.target)) {
    dropdown.classList.remove("show");
  }
});

// =========================
// LOGIN / REGISTER TAB
// =========================

window.showRegister = function () {
  const loginForm = document.getElementById("loginForm");

  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.style.display = "none";
  }

  if (registerForm) {
    registerForm.style.display = "flex";
  }
};

window.showLogin = function () {
  const loginForm = document.getElementById("loginForm");

  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.style.display = "flex";
  }

  if (registerForm) {
    registerForm.style.display = "none";
  }
};

// =========================
// AUTH STATE
// =========================

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  const authModal = document.getElementById("authModal");

  const verifyScreen = document.getElementById("verifyScreen");

  const guestMenu = document.getElementById("guestMenu");

  const userMenu = document.getElementById("userMenu");

  const dashboard = document.querySelector(".dashboard");

  const emailBox = document.getElementById("emailBox");

  // ---------------------------------------------------------
  // RESET UI
  // ---------------------------------------------------------

  if (authModal) {
    authModal.style.display = "none";
  }

  if (verifyScreen) {
    verifyScreen.style.display = "none";
  }

  // ---------------------------------------------------------
  // NO USER
  // ---------------------------------------------------------

  if (!user) {
    if (guestMenu) {
      guestMenu.style.display = "block";
    }

    if (userMenu) {
      userMenu.style.display = "none";
    }

    return;
  }

  await user.reload();

  // ---------------------------------------------------------
  // UNVERIFIED USER
  // ---------------------------------------------------------

  if (!user.emailVerified) {
    if (guestMenu) {
      guestMenu.style.display = "block";
    }

    if (userMenu) {
      userMenu.style.display = "none";
    }

    if (authModal) {
      authModal.style.display = "none";
    }

    showVerifyScreen(user);

    return;
  }

  // ---------------------------------------------------------
  // ONBOARDING
  // ---------------------------------------------------------

  const proceed = await runOnboarding(user);

  if (!proceed) {
    return;
  }

  // ---------------------------------------------------------
  // VERIFIED USER
  // ---------------------------------------------------------

  if (guestMenu) {
    guestMenu.style.display = "none";
  }

  if (userMenu) {
    userMenu.style.display = "block";
  }

  if (authModal) {
    authModal.style.display = "none";
  }

  if (dashboard) {
    dashboard.style.display = "grid";
  }

  if (typeof window.loadUserRepairs === "function") {
    window.loadUserRepairs();
  }

  if (typeof window.listenToNotifications === "function") {
    window.listenToNotifications();
  }

  if (typeof window.loadProfile === "function") {
    window.loadProfile();
  }

  if (document.getElementById("repairCount")) {
    window.loadProfileStats?.();
  }

  if (typeof window.loadHeaderUser === "function") {
    window.loadHeaderUser();
  }

  const heading = document.querySelector(".main h1");

  if (heading) {
    heading.innerText = "Welcome, " + user.email;
  }

  if (emailBox) {
    emailBox.innerText = user.email;
  }

  const snap = await getDoc(doc(db, "users", user.uid));

  if (snap.exists()) {
    const data = snap.data();

    if (heading) {
      heading.innerText = "Welcome, " + (data.name || user.email);
    }
  }
});
