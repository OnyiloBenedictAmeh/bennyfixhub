console.log("repairs.js loaded");
// =========================
// REPAIRS
// =========================
import {
  auth,
  db,
  doc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
} from "./firebase.js";

import { showToast, clearFieldError, setFieldError, friendlyError } from "./ui.js";

const REPAIR_API_URL = "https://bennyfix-backend-v.vercel.app/api/create-repair";

let currentStep = 1;
let isSubmittingRepair = false;
const totalSteps = 7;

// Expose step tracker to keyboard handler in ui.js
Object.defineProperty(window, "_currentRepairStep", {
  get: () => currentStep,
});

// =========================
// STEP NAVIGATION
// =========================
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
  document.querySelectorAll(".step").forEach((s) => s.classList.remove("active"));

  const el = document.getElementById("step" + step);
  if (!el) return;

  el.classList.add("active");

  if (step === 7) buildReview();

  const progress = ((step - 1) / (totalSteps - 1)) * 100;
  document.getElementById("progress").style.width = progress + "%";
};

// =========================
// VALIDATION
// =========================
function validateStep(step) {
  const stepEl = document.getElementById("step" + step);
  if (!stepEl) return false;

  const inputs = stepEl.querySelectorAll("input, select, textarea");

  for (let input of inputs) {
    if (input.type === "file" || input.id === "deviceImage") continue;
    if (input.disabled) continue;

    const value = input.value.trim();
    clearFieldError(input);

    if (!value) {
      setFieldError(input, "This field is required");
      return false;
    }

    if (input.id === "contact") {
      const phone = value.replace(/\s+/g, "");
      if (!/^\+?\d{10,15}$/.test(phone)) {
        setFieldError(input, "Enter a valid phone number");
        return false;
      }
    }

    if (input.id === "deviceName" && value.length < 2) {
      setFieldError(input, "Device model is too short");
      return false;
    }

    if (input.id === "issue" && value.length < 10) {
      setFieldError(input, "Please describe the issue in at least 10 characters");
      return false;
    }
  }

  return true;
}

function validateRepairImage() {
  const imageFile = document.getElementById("deviceImage")?.files?.[0];
  if (!imageFile) return true;

  if (!imageFile.type.startsWith("image/")) {
    showToast("Only image files are allowed", "error");
    return false;
  }

  const maxSize = 5 * 1024 * 1024;
  if (imageFile.size > maxSize) {
    showToast("Image must be 5MB or less", "error");
    return false;
  }

  return true;
}

// =========================
// FORM DATA
// =========================
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

// =========================
// SUBMIT REPAIR
// =========================
window.startRepair = async function startRepair() {
  if (isSubmittingRepair) {
    showToast("Repair request is already submitting");
    return;
  }

  const submitButtons = document.querySelectorAll('button[onclick="startRepair()"]');

  try {
    const user = auth.currentUser;
    if (!user) {
      showToast("Please login first");
      return;
    }

    for (let step = 1; step <= 6; step++) {
      if (!validateStep(step)) {
        currentStep = step;
        showStep(step);
        return;
      }
    }

    if (!validateRepairImage()) {
      currentStep = 1;
      showStep(1);
      return;
    }

    const confirmed = confirm(
      "Submit this repair request now? Please confirm all details are correct."
    );
    if (!confirmed) return;

    isSubmittingRepair = true;
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
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));
    if (imageFile) formData.append("deviceImage", imageFile);

    const response = await fetch(REPAIR_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not submit repair");

    showToast("Repair submitted successfully", "success");
    closeRepairForm();
    resetImagePreview();
  } catch (err) {
    console.error(err);
    showToast(err.message || friendlyError(err), "error");
  } finally {
    isSubmittingRepair = false;
    submitButtons.forEach((btn) => {
      btn.disabled = false;
      btn.innerText = btn.dataset.originalText || "Submit";
    });
  }
};

// =========================
// IMAGE PREVIEW
// =========================
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

function handleFile(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    return showToast("Only image files allowed", "error");
  }

  const previewImg = document.getElementById("previewImg");
  const uploadContent = document.getElementById("uploadContent");
  const previewBox = document.getElementById("imagePreviewBox");

  const reader = new FileReader();
  reader.onload = (e) => {
    if (previewImg) previewImg.src = e.target.result;
    if (uploadContent) uploadContent.style.display = "none";
    if (previewBox) previewBox.style.display = "flex";
  };
  reader.readAsDataURL(file);
}

document.addEventListener("DOMContentLoaded", () => {
  const uploadBox = document.getElementById("uploadBox");
  const fileInput = document.getElementById("deviceImage");
  const previewImg = document.getElementById("previewImg");
  const removeBtn = document.getElementById("removeImageBtn");
  const uploadContent = document.getElementById("uploadContent");
  const previewBox = document.getElementById("imagePreviewBox");

  if (uploadBox && fileInput) {
    uploadBox.addEventListener("click", () => fileInput.click());

    uploadBox.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadBox.style.borderColor = "#2563eb";
    });

    uploadBox.addEventListener("dragleave", () => {
      uploadBox.style.borderColor = "#d1d5db";
    });

    uploadBox.addEventListener("drop", (e) => {
      e.preventDefault();
      handleFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));
  }

  if (removeBtn) {
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (fileInput) fileInput.value = "";
      if (previewImg) previewImg.src = "";
      if (previewBox) previewBox.style.display = "none";
      if (uploadContent) uploadContent.style.display = "block";
    });
  }

  // Restore draft
  const draft = localStorage.getItem("repairDraft");
  if (draft) {
    const data = JSON.parse(draft);
    Object.keys(data).forEach((key) => {
      const el = document.getElementById(key);
      if (el) el.value = data[key];
    });
  }
});

// =========================
// REPAIR OVERLAY
// =========================
window.toggleRepairForm = function () {
  console.log("toggleRepairForm called");
  const overlay = document.getElementById("repairOverlay");
  if (!overlay) return;
  overlay.classList.toggle("show");
};

window.closeRepairForm = function () {
  const overlay = document.getElementById("repairOverlay");
  if (overlay) overlay.classList.remove("show");
};

document.addEventListener("DOMContentLoaded", () => {
  const repairOverlay = document.getElementById("repairOverlay");
  if (repairOverlay) {
    repairOverlay.addEventListener("click", (event) => {
      if (event.target === repairOverlay) window.closeRepairForm();
    });
  }
});

// =========================
// LOAD USER REPAIRS
// =========================
export function loadUserRepairs() {
  const currentUser = window.currentUser;
  if (!currentUser) return;

  const active = document.getElementById("activeRepairs");
  const completed = document.getElementById("completedRepairs");
  if (!active || !completed) return;

  const q = query(collection(db, "repairs"), where("uid", "==", currentUser.uid));

  onSnapshot(q, (snapshot) => {
    active.innerHTML = `<p class="empty-text">Loading repairs...</p>`;
    completed.innerHTML = `<p class="empty-text">Loading completed repairs...</p>`;

    if (snapshot.empty) {
      active.innerHTML = `<p class="empty-text">No repairs yet</p>`;
      completed.innerHTML = `<p class="empty-text">No completed repairs yet</p>`;
      return;
    }

    active.innerHTML = "";
    completed.innerHTML = "";

    let activeCount = 0;
    let completedCount = 0;

    const progressMap = { pending: 20, diagnosing: 40, fixing: 75, completed: 100 };

    snapshot.forEach((docSnap) => {
      const r = docSnap.data();
      const status = (r.status || "Pending").toLowerCase();
      const timeline = r.timeline || [];
      const progress = progressMap[status] || 10;

      const card = document.createElement("div");
      card.className = "repair-card";
      card.innerHTML = `
        <div class="repair-top">
          <div>
            <h3>${r.deviceName || r.device || "Unknown device"}</h3>
            <p>${r.issue}</p>
          </div>
          <span class="status ${status}">${r.status || "Pending"}</span>
        </div>
        <div class="repair-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width:${progress}%"></div>
          </div>
          <small>${progress}% Complete</small>
        </div>
        ${r.assignedTo ? `<div class="tech-box">👨‍🔧 Technician: ${r.assignedTo.name}</div>` : ""}
        <div class="journey-box hidden" id="journey-${docSnap.id}">
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
                </div>`
                  )
                  .join("")
              : `<p class="empty-journey">No updates yet</p>`
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

    if (activeCount === 0) active.innerHTML = `<p class="empty-text">No active repairs yet</p>`;
    if (completedCount === 0) completed.innerHTML = `<p class="empty-text">No completed repairs yet</p>`;

    const activeCountEl = document.getElementById("activeCount");
    const completedCountEl = document.getElementById("completedCount");
    if (activeCountEl) activeCountEl.innerText = activeCount;
    if (completedCountEl) completedCountEl.innerText = completedCount;
  });
}

window.loadUserRepairs = loadUserRepairs;

// =========================
// REPAIR JOURNEY TOGGLE
// =========================
window.toggleJourney = function (id) {
  const box = document.getElementById(`journey-${id}`);
  if (!box) return;

  getDoc(doc(db, "repairs", id)).then((snap) => {
    const data = snap.data();
    const timeline = data.timeline || [];

    box.innerHTML = timeline.length
      ? timeline
          .map(
            (t) => `
        <div class="journey-step">
          <strong>${t.stage}</strong>
          <small>${t.time}</small>
        </div>`
          )
          .join("")
      : `<p class="empty-journey">No updates yet</p>`;

    box.classList.toggle("hidden");
  });
};

// =========================
// RATE REPAIR
// =========================
window.rateRepair = async function (id) {
  const rating = prompt("Rate technician (1 - 5 stars)");
  if (!rating || rating < 1 || rating > 5) return showToast("Invalid rating");

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

// =========================
// NOTIFICATIONS
// =========================
export function listenToNotifications() {
  const box = document.getElementById("userNotifications");
  const currentUser = window._currentUser;

  if (!box || !currentUser) return;

  const q = query(collection(db, "notifications"), where("uid", "==", currentUser.uid));

  onSnapshot(q, (snapshot) => {
    box.innerHTML = "";
    let count = 0;

    snapshot.forEach((docSnap) => {
      const n = docSnap.data();
      count++;
      showToast(n.message, n.type || "info");

      const div = document.createElement("div");
      div.className = "notif-card";
      div.innerHTML = `
        <div class="notif-icon-box">🔔</div>
        <div class="notif-content">
          <p>${n.message}</p>
          <small>${n.createdAt ? new Date(n.createdAt.seconds * 1000).toLocaleString() : "Just now"}</small>
        </div>
      `;
      box.prepend(div);
    });

    updateNotificationBadge(count);
  });
}

window.listenToNotifications = listenToNotifications;

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
  badge.style.display = count > 0 ? "flex" : "none";
}

window.toggleNotif = function () {
  const panel = document.getElementById("notifPanel");
  panel.classList.toggle("show");
};

// =========================
// DASHBOARD NAVIGATION
// =========================
window.navigate = function (page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));

  const target = document.getElementById(page + "Page");
  if (target) target.classList.add("active");

  document.getElementById("pageTitle").innerText =
    page.charAt(0).toUpperCase() + page.slice(1);

  localStorage.setItem("lastPage", page);
};

document.querySelectorAll("[data-page]").forEach((card) => {
  card.addEventListener("click", () => window.navigate(card.dataset.page));
});

// =========================
// ADD TECHNICIAN
// =========================
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
  } catch (err) {
    console.error(err);
    showToast("Failed to add technician");
  }
};