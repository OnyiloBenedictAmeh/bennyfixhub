import {
  auth,
  db,
  doc,
  getDoc,
  updateDoc,
  onAuthStateChanged,
  serverTimestamp,
  signOut,
} from "./firebase.js";

// Bump this whenever the policies change to force everyone to re-consent.
const CONSENT_VERSION = "2026-07-18";

const REQUIRED_KEYS = [
  "termsOfService",
  "privacyPolicy",
  "cookiePolicy",
  "refundPolicy",
  "repairWarranty",
  "acceptableUsePolicy",
];

const overlay = document.getElementById("legalGateOverlay");
const continueBtn = document.getElementById("legalGateContinueBtn");
const logoutBtn = document.getElementById("legalGateLogoutBtn");
const selectAll = document.getElementById("legalSelectAll");
const checkboxes = document.querySelectorAll(".legal-gate-checkbox");

let currentUid = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    hideGate();
    return;
  }

  currentUid = user.uid;

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const data = snap.exists() ? snap.data() : {};
    const consent = data.legalConsent;

    if (!consent || consent.version !== CONSENT_VERSION) {
      showGate();
    } else {
      hideGate();
    }
  } catch (err) {
    console.error("Could not check legal consent:", err);
  }
});

function showGate() {
  if (!overlay) return;
  resetCheckboxes();
  overlay.classList.remove("hidden");
  document.body.classList.add("legal-gate-locked");
}

function hideGate() {
  if (!overlay) return;
  overlay.classList.add("hidden");
  document.body.classList.remove("legal-gate-locked");
}

function resetCheckboxes() {
  checkboxes.forEach((box) => (box.checked = false));
  if (selectAll) selectAll.checked = false;
  updateContinueState();
}

function updateContinueState() {
  if (!continueBtn) return;
  const allChecked = [...checkboxes].every((box) => box.checked);
  continueBtn.disabled = !allChecked;
}

checkboxes.forEach((box) => {
  box.addEventListener("change", () => {
    if (selectAll) {
      selectAll.checked = [...checkboxes].every((b) => b.checked);
    }
    updateContinueState();
  });
});

if (selectAll) {
  selectAll.addEventListener("change", () => {
    checkboxes.forEach((box) => (box.checked = selectAll.checked));
    updateContinueState();
  });
}

if (continueBtn) {
  continueBtn.addEventListener("click", async () => {
    if (!currentUid) return;

    continueBtn.disabled = true;
    continueBtn.textContent = "Saving...";

    const items = {};
    REQUIRED_KEYS.forEach((key) => (items[key] = true));

    try {
      await updateDoc(doc(db, "users", currentUid), {
        legalConsent: {
          version: CONSENT_VERSION,
          items,
          acceptedAt: serverTimestamp(),
        },
      });

      hideGate();
    } catch (err) {
      console.error("Could not save legal consent:", err);
      continueBtn.disabled = false;
      continueBtn.textContent = "Continue";
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    hideGate();
  });
}
