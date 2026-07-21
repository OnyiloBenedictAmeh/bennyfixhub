// =========================
// UI UTILITIES
// =========================
import { auth } from "./firebase.js";

// =========================
// TOAST
// =========================
export function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

window.showToast = showToast;

// =========================
// SITE THEME
// =========================
const savedTheme = localStorage.getItem("bennyfix-theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark");
}

function syncThemeToggleIcon() {
  const icon = document.querySelector(".theme-toggle i");
  if (!icon) return;

  const isDark = document.body.classList.contains("dark");
  icon.className = isDark ? "bx bx-sun" : "bx bx-moon";
}

window.toggleSiteTheme = function () {
  document.body.classList.toggle("dark");

  localStorage.setItem(
    "bennyfix-theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );

  syncThemeToggleIcon();
};

syncThemeToggleIcon();

// =========================
// FIELD VALIDATION HELPERS
// =========================
export function setFieldError(input, message) {
  input.classList.add("field-invalid");

  let error = input.parentElement?.querySelector(
    `.field-error[data-for="${input.id}"]`
  );

  if (!error) {
    error = document.createElement("small");
    error.className = "field-error";
    error.dataset.for = input.id;
    input.insertAdjacentElement("afterend", error);
  }

  error.innerText = message;
}

export function clearFieldError(input) {
  input.classList.remove("field-invalid");

  const error = input.parentElement?.querySelector(
    `.field-error[data-for="${input.id}"]`
  );

  if (error) error.remove();
}

export function validateRequiredField(input, message = "This field is required") {
  clearFieldError(input);
  if (!input.value.trim()) {
    setFieldError(input, message);
    return false;
  }
  return true;
}

export function validateEmailField(input) {
  clearFieldError(input);
  const value = input.value.trim();

  if (!value) {
    setFieldError(input, "Email is required");
    return false;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    setFieldError(input, "Enter a valid email address");
    return false;
  }

  return true;
}

export function validatePasswordField(input, minLength = 6) {
  clearFieldError(input);
  const value = input.value;

  if (!value.trim()) {
    setFieldError(input, "Password is required");
    return false;
  }

  if (value.length < minLength) {
    setFieldError(input, `Password must be at least ${minLength} characters`);
    return false;
  }

  return true;
}

export function validatePhoneField(input) {
  clearFieldError(input);
  const value = input.value.trim().replace(/\s+/g, "");

  if (!value) {
    setFieldError(input, "Phone number is required");
    return false;
  }

  if (!/^\+?\d{10,15}$/.test(value)) {
    setFieldError(input, "Enter a valid phone number");
    return false;
  }

  return true;
}

export function friendlyError(err) {
  if (err?.code === "permission-denied") return "You do not have permission to do that";
  if (err?.code === "unavailable") return "Network problem. Please try again";
  if (err?.code?.startsWith("auth/")) return err.message;
  return "Something went wrong. Please try again";
}

// =========================
// SEARCH
// =========================
const searchModal = document.getElementById("searchModal");
const searchInput = document.getElementById("searchInput");

export function toggleSearch(e) {
  if (!searchModal || !searchInput) return;
  e.stopPropagation();

  const isOpen = searchModal.style.display === "block";
  searchModal.style.display = isOpen ? "none" : "block";

  if (!isOpen) setTimeout(() => searchInput.focus(), 50);
}

window.toggleSearch = toggleSearch;

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-box") && !e.target.closest(".bx-search")) {
    if (searchModal) searchModal.style.display = "none";
  }
});

// =========================
// HERO BACKGROUND ROTATION
// =========================
const hero = document.querySelector(".hero-premium");

if (hero) {
  const heroImages = [
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

  let heroImageIndex = 0;

  heroImages.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  hero.style.backgroundImage = `url("${heroImages[0]}")`;

  setInterval(() => {
    hero.classList.add("fade");

    setTimeout(() => {
      heroImageIndex =
        (heroImageIndex + 1) % heroImages.length;

      hero.style.backgroundImage =
        `url("${heroImages[heroImageIndex]}")`;

      hero.classList.remove("fade");
    }, 400);
  }, 5000);
}

// =========================
// MOBILE MENU
// =========================
window.toggleMenu = function () {
  const navWrapper = document.getElementById("navWrapper");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const icon = document.querySelector(".hamburger i");

  if (!navWrapper || !icon) return;

  navWrapper.classList.toggle("open");
  drawerBackdrop?.classList.toggle("show");

  if (navWrapper.classList.contains("open")) {
    icon.classList.remove("bx-menu");
    icon.classList.add("bx-x");
  } else {
    icon.classList.remove("bx-x");
    icon.classList.add("bx-menu");
  }
};

// =========================
// SCROLL BEHAVIOR
// =========================
let scrollTimeout;
const mega = () => document.getElementById("mega");

window.addEventListener("scroll", () => {
  clearTimeout(scrollTimeout);

  scrollTimeout = setTimeout(() => {
    if (searchModal) searchModal.style.display = "none";
    const megaEl = mega();
    if (megaEl) megaEl.classList.remove("show");
  }, 100);
});

// =========================
// BACK TO TOP
// =========================
const btn = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  if (!btn) return;
  btn.style.display = window.scrollY > 300 ? "block" : "none";
});

window.scrollToTop = function () {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// =========================
// FOOTER ACCORDION
// =========================
document.querySelectorAll(".footer-section h4").forEach((h4) => {
  h4.addEventListener("click", () => {
    h4.parentElement.classList.toggle("active");
  });
});

// =========================
// KEYBOARD SHORTCUTS
// =========================
document.addEventListener("keydown", function (e) {
  const activeTag = document.activeElement?.tagName?.toLowerCase();
  const megaEl = document.getElementById("mega");
  const navWrapper = document.getElementById("navWrapper");

  // Ctrl/Cmd + K → open search
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    if (searchModal) {
      searchModal.style.display = "block";
      setTimeout(() => searchInput?.focus(), 50);
    }
    return;
  }

  // Escape → close all panels
  if (e.key === "Escape") {
    if (searchModal) searchModal.style.display = "none";
    if (megaEl) megaEl.classList.remove("show");
    if (navWrapper) navWrapper.classList.remove("open");

    const repairOverlay = document.getElementById("repairOverlay");
    if (repairOverlay) repairOverlay.classList.remove("show");

    const accountPanel = document.getElementById("accountPanel");
    const accountOverlay = document.getElementById("accountOverlay");
    if (accountPanel) accountPanel.classList.remove("open");
    if (accountOverlay) accountOverlay.classList.remove("show");
    return;
  }

  // Enter → submit auth forms or advance repair steps
  if (e.key === "Enter") {
    const authModal = document.getElementById("authModal");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const authIsOpen = authModal && authModal.style.display !== "none";

    if (authIsOpen) {
      e.preventDefault();
      if (registerForm && registerForm.style.display !== "none") {
        window.signup?.();
      } else if (loginForm && loginForm.style.display !== "none") {
        window.login?.();
      }
      return;
    }

    const repairOverlay = document.getElementById("repairOverlay");
    const repairIsOpen = repairOverlay?.classList.contains("show");

    if (repairIsOpen && activeTag !== "textarea") {
      e.preventDefault();
      const step = window._currentRepairStep ?? 1;
      if (step >= 1 && step < 7) {
        window.nextStep?.(step);
      } else {
        window.startRepair?.();
      }
    }
  }

  // Arrow keys → navigate repair steps
  const repairOverlay = document.getElementById("repairOverlay");
  const repairIsOpen = repairOverlay?.classList.contains("show");
  const step = window._currentRepairStep ?? 1;

  if (repairIsOpen) {
    if (e.key === "ArrowRight" && step < 7) window.nextStep?.(step);
    if (e.key === "ArrowLeft" && step > 1) window.prevStep?.(step);
  }
});

// =========================
// INPUT: CLEAR ERRORS ON CHANGE
// =========================
document.querySelectorAll("input, select, textarea").forEach((input) => {
  input.addEventListener("input", () => clearFieldError(input));
  input.addEventListener("change", () => clearFieldError(input));
});
