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
// GET USER PROFILE
// =========================
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

function avatarFallback(name = "User") {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
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
  const name = data?.name || user.displayName || user.email?.split("@")[0] || "User";
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

  if (!emailIsValid || !passwordIsValid) return;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      emailInput.value.trim(),
      passwordInput.value
    );

    const user = userCredential.user;
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

// =========================
// LOGOUT
// =========================
window.logout = async function () {
  await signOut(auth);

  document.getElementById("email").value = "";
  document.getElementById("password").value = "";

  const dashboard = document.querySelector(".dashboard");
  const navWrapper = document.getElementById("navWrapper");
  const mega = document.getElementById("mega");
  const searchModal = document.getElementById("searchModal");
  const guestMenu = document.getElementById("guestMenu");
  const userMenu = document.getElementById("userMenu");

  if (dashboard) dashboard.style.display = "none";
  if (navWrapper) navWrapper.classList.remove("open");
  if (mega) mega.classList.remove("show");
  if (searchModal) searchModal.style.display = "none";
  if (guestMenu) guestMenu.style.display = "block";
  if (userMenu) userMenu.style.display = "none";

  const accountPanel = document.getElementById("accountPanel");
  if (accountPanel) accountPanel.classList.remove("open");

  const accountDropdown = document.getElementById("accountDropdown");
  if (accountDropdown) accountDropdown.classList.remove("show");
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
  const confirmIsValid = validateRequiredField(confirmInput, "Confirm your password");

  if (!nameIsValid || !emailIsValid || !phoneIsValid || !passwordIsValid || !confirmIsValid) return;

  if (passwordInput.value !== confirmInput.value) {
    setFieldError(confirmInput, "Passwords do not match");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      emailInput.value.trim(),
      passwordInput.value
    );

    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: nameInput.value.trim(),
      email: user.email,
      phone: phoneInput.value.trim(),
      role: "user",
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(nameInput.value.trim())}&background=487DE7&color=fff`,
      createdAt: serverTimestamp(),
    });

    await sendCustomVerificationEmail(user);
    showToast("Verification email sent", "success");
    showVerifyScreen(user);

    // Also trigger backend email
    const idToken = await user.getIdToken();
    await fetch("https://bennyfix-backend-v.vercel.app/api/send-verification-email", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
    });

    // showToast("Verification email sent", "success");
    // showVerifyScreen(user);
  } catch (err) {
    showToast(err.message, "error");
  }
};

// =========================
// FORGOT PASSWORD
// =========================
window.forgotPassword = async function () {
  const email = document.getElementById("email").value;

  if (!email) return showToast("Please enter your email first.");

  try {
    await sendPasswordResetEmail(auth, email);
    showToast("Password reset link sent! Check your email inbox or spam folder.");
  } catch (err) {
    if (err.code === "auth/user-not-found") showToast("No account found with this email.");
    else if (err.code === "auth/invalid-email") showToast("Invalid email address.");
    else showToast(err.message);
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
  return { success: true };
}

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

  if (!user) return showToast("Please login again first", "error");

  try {
    await user.reload();

    if (user.emailVerified) {
      const screen = document.getElementById("verifyScreen");
      if (screen) screen.style.display = "none";
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
  if (authModal) authModal.style.display = "flex";
  document.getElementById("accountDropdown")?.classList.remove("show");
};

window.closeAuth = function () {
  const authModal = document.getElementById("authModal");
  if (authModal) authModal.style.display = "none";
};

window.openAccountPanel = function () {
  document.getElementById("accountPanel").classList.add("open");
};

window.closeAccountPanel = function () {
  document.getElementById("accountPanel").classList.remove("open");
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

// Close dropdown on outside click
document.addEventListener("click", function (e) {
  const dropdown = document.getElementById("accountDropdown");
  const wrapper = document.querySelector(".account-wrapper");

  if (!dropdown || !wrapper) return;
  if (!wrapper.contains(e.target)) dropdown.classList.remove("show");
});

// Login/Register tab switching
window.showRegister = function () {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "flex";
};

window.showLogin = function () {
  document.getElementById("loginForm").style.display = "flex";
  document.getElementById("registerForm").style.display = "none";
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

  // Reset UI
  if (authModal) authModal.style.display = "none";
  if (verifyScreen) verifyScreen.style.display = "none";

  // No user
  if (!user) {
    if (guestMenu) guestMenu.style.display = "block";
    if (userMenu) userMenu.style.display = "none";
    return;
  }

  await user.reload();

  // Unverified
  if (!user.emailVerified) {
    if (guestMenu) guestMenu.style.display = "block";
    if (userMenu) userMenu.style.display = "none";
    if (authModal) authModal.style.display = "none";
    showVerifyScreen(user);
    return;
  }
const proceed = await runOnboarding(user);

if (!proceed) {
    return;
}
  // Verified
  if (guestMenu) guestMenu.style.display = "none";
  if (userMenu) userMenu.style.display = "block";
  if (authModal) authModal.style.display = "none";
  if (dashboard) dashboard.style.display = "grid";

  if (typeof window.loadUserRepairs === "function") window.loadUserRepairs();
  if (typeof window.listenToNotifications === "function") window.listenToNotifications();
  if (typeof window.loadProfile === "function") window.loadProfile();
  if (document.getElementById("repairCount")) window.loadProfileStats?.();
  if (typeof window.loadHeaderUser === "function") window.loadHeaderUser();

  const heading = document.querySelector(".main h1");
  if (heading) heading.innerText = "Welcome, " + user.email;
  if (emailBox) emailBox.innerText = user.email;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) {
    const data = snap.data();
    if (heading) heading.innerText = "Welcome, " + (data.name || user.email);
  }
});
