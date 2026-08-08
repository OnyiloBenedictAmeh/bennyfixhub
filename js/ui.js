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
const searchResults = document.getElementById("searchResults");
const searchClearBtn = document.getElementById("searchClearBtn");

// Searchable index of site pages/services. Add entries here as pages are added.
const SEARCH_INDEX = [
  { title: "Phone Repair", desc: "Screens, batteries, charging ports", icon: "bx-mobile", url: "services.html#phone" },
  { title: "Laptop Repair", desc: "Windows and Mac troubleshooting", icon: "bx-laptop", url: "services.html#laptop" },
  { title: "Tablet Repair", desc: "Screens and accessories", icon: "bx-tab", url: "services.html#tablet" },
  { title: "PC Repair", desc: "Desktop diagnostics and fixes", icon: "bx-desktop", url: "services.html#pc" },
  { title: "WiFi Fix", desc: "Network drops, weak signal, router setup", icon: "bx-wifi", url: "index.html#wifi-fix" },
  { title: "Overheating", desc: "Thermal cleaning, fan checks, cooling", icon: "bx-hive", url: "index.html#overheating" },
  { title: "Slow PC", desc: "Startup cleanup, malware scan, speed tuning", icon: "bx-tachometer", url: "index.html#slow-pc" },
  { title: "Sell a Device", desc: "Get cash for your old device", icon: "bx-dollar-circle", url: "shop.html" },
  { title: "Get Tech Support", desc: "Phone, laptop, tablet, diagnostics", icon: "bx-support", url: "help-center.html" },
  { title: "Track Repair", desc: "Check the status of your repair", icon: "bx-search-alt", url: "track-repair.html" },
  { title: "Start a Repair", desc: "Submit a new repair request", icon: "bx-wrench", url: "javascript:void(0)", onSelect: () => window.toggleRepairForm?.() },
  { title: "My Account", desc: "Login, register, or manage your account", icon: "bx-user", url: "javascript:void(0)", onSelect: () => window.openAuth?.() },
  { title: "FAQ", desc: "Frequently asked questions", icon: "bx-help-circle", url: "faq.html" },
  { title: "Contact Us", desc: "Get in touch with BennyFix Hub", icon: "bx-envelope", url: "contact.html" },
];

let activeResultIndex = -1;

function renderSearchResults(query) {
  if (!searchResults) return;

  const trimmed = query.trim().toLowerCase();
  activeResultIndex = -1;

  if (searchClearBtn) searchClearBtn.classList.toggle("hidden", !trimmed);

  if (!trimmed) {
    searchResults.innerHTML = "";
    return;
  }

  const matches = SEARCH_INDEX.filter(
    (item) =>
      item.title.toLowerCase().includes(trimmed) ||
      item.desc.toLowerCase().includes(trimmed)
  ).slice(0, 8);

  if (!matches.length) {
    searchResults.innerHTML = `<div class="search-empty-state">No results for "${escapeSearchHtml(query)}"</div>`;
    return;
  }

  searchResults.innerHTML = matches
    .map(
      (item, i) => `
      <a class="search-result-item" href="${item.url}" data-index="${i}">
        <i class='bx ${item.icon}'></i>
        <div class="search-result-text">
          <strong>${escapeSearchHtml(item.title)}</strong>
          <small>${escapeSearchHtml(item.desc)}</small>
        </div>
      </a>
    `
    )
    .join("");

  [...searchResults.querySelectorAll(".search-result-item")].forEach((el, i) => {
    el.addEventListener("click", (e) => {
      const match = matches[i];
      if (match.onSelect) {
        e.preventDefault();
        match.onSelect();
        closeSearch();
      }
    });
  });
}

function escapeSearchHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function moveActiveResult(delta) {
  const items = searchResults ? [...searchResults.querySelectorAll(".search-result-item")] : [];
  if (!items.length) return;

  items[activeResultIndex]?.classList.remove("active");
  activeResultIndex = (activeResultIndex + delta + items.length) % items.length;
  items[activeResultIndex].classList.add("active");
  items[activeResultIndex].scrollIntoView({ block: "nearest" });
}

function closeSearch() {
  if (searchModal) searchModal.style.display = "none";
  if (searchInput) searchInput.value = "";
  if (searchResults) searchResults.innerHTML = "";
  if (searchClearBtn) searchClearBtn.classList.add("hidden");
  activeResultIndex = -1;
}

export function toggleSearch(e) {
  if (!searchModal || !searchInput) return;
  e?.stopPropagation();

  const isOpen = searchModal.style.display === "block";

  if (isOpen) {
    closeSearch();
    return;
  }

  // Close the mobile nav drawer if it's open, so search always renders on top
  const navWrapper = document.getElementById("navWrapper");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  navWrapper?.classList.remove("open");
  drawerBackdrop?.classList.remove("show");

  searchModal.style.display = "block";
  setTimeout(() => searchInput.focus(), 50);
}

window.toggleSearch = toggleSearch;

searchInput?.addEventListener("input", (e) => renderSearchResults(e.target.value));

searchInput?.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    moveActiveResult(1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    moveActiveResult(-1);
  } else if (e.key === "Enter") {
    e.preventDefault();
    const items = searchResults ? [...searchResults.querySelectorAll(".search-result-item")] : [];
    const target = items[activeResultIndex] || items[0];
    target?.click();
  }
});

searchClearBtn?.addEventListener("click", () => {
  if (!searchInput) return;
  searchInput.value = "";
  searchInput.focus();
  renderSearchResults("");
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-box") && !e.target.closest(".header-search-btn")) {
    closeSearch();
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
    closeSearch();
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

// Footer accordion click binding now lives in footer-loader.js — it has to
// run *after* the shared footer is fetched and injected, so it can't live
// here at module top-level (this ran before the footer existed in the DOM).

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
    if (searchModal.style.display !== "block") toggleSearch();
    return;
  }

  // Escape → close all panels
  if (e.key === "Escape") {
    closeSearch();
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