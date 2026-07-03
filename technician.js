import {
  auth,
  db,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  signOut,
  serverTimestamp,
  onAuthStateChanged,
} from "./js/firebase.js";

let currentTechnician = null;
let assignedRepairs = [];
let activeNoteRepairId = null;

const loading = document.getElementById("techLoading");
const dashboard = document.getElementById("techDashboard");
const toast = document.getElementById("toast");

if (localStorage.getItem("bennyfix-tech-theme") === "dark") {
  document.body.classList.add("dark");
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists() || snap.data().role !== "technician") {
    showToast("Technician access only");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 900);
    return;
  }

  currentTechnician = {
    uid: user.uid,
    email: user.email,
    ...snap.data(),
  };

  renderTechnicianProfile();
  listenToAssignedRepairs(user.uid);

  loading.classList.add("hidden");
  dashboard.classList.remove("hidden");
});

function avatarFallback(name = "Technician") {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff`;
}

function renderTechnicianProfile() {
  const name = currentTechnician.name || currentTechnician.email || "Technician";
  const avatar = currentTechnician.avatar || avatarFallback(name);
  const availability = currentTechnician.availability || "available";

  setText("techName", name);
  setText("techEmail", currentTechnician.email || "");
  setText("profileName", name);
  setText("profileRole", "Technician");
  setText("profileEmail", currentTechnician.email || "Not set");
  setText("profilePhone", currentTechnician.phone || "Not set");
  setText("profileLocation", currentTechnician.location || "Not set");
  setText("profileAvailability", availability);

  setImage("techAvatar", avatar);
  setImage("profileAvatar", avatar);

  const select = document.getElementById("availabilitySelect");
  if (select) select.value = availability;
}

function listenToAssignedRepairs(uid) {
  const repairsQuery = query(
    collection(db, "repairs"),
    where("assignedTo.uid", "==", uid)
  );

  onSnapshot(repairsQuery, (snapshot) => {
    assignedRepairs = [];

    snapshot.forEach((docSnap) => {
      assignedRepairs.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    });

    assignedRepairs.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));

    renderStats();
    renderRepairs();
  }, (err) => {
    console.error(err);
    showToast("Could not load assigned repairs");
  });
}

function renderStats() {
  const active = assignedRepairs.filter((repair) =>
    (repair.status || "Pending") !== "Completed"
  ).length;
  const completed = assignedRepairs.filter((repair) =>
    repair.status === "Completed"
  ).length;

  setText("assignedCount", assignedRepairs.length);
  setText("activeCount", active);
  setText("completedCount", completed);
  setText("repairSummary", `${assignedRepairs.length} jobs`);
}

function renderRepairs() {
  renderRepairList("assignedRepairs", assignedRepairs);
  renderRepairList("recentRepairs", assignedRepairs.slice(0, 3));
}

function renderRepairList(containerId, repairs) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!repairs.length) {
    container.innerHTML = `
      <div class="empty-state">
        No assigned repairs yet.
      </div>
    `;
    return;
  }

  container.innerHTML = repairs.map((repair) => repairCard(repair)).join("");
}

function repairCard(repair) {
  const status = repair.status || "Pending";
  const statusKey = status.toLowerCase();

  return `
    <article class="repair-card">
      <div>
        <span class="status ${statusKey}">${status}</span>
        <h3>${repair.deviceName || repair.device || "Unknown device"}</h3>
        <p>${repair.issue || repair.problemType || "No issue recorded"}</p>
        <small>${repair.email || repair.phone || "No customer contact"}</small>
      </div>

      <div class="repair-actions">
        <select onchange="updateRepairStatus('${repair.id}', this.value)" ${status === "Completed" ? "disabled" : ""}>
          <option ${status === "Pending" ? "selected" : ""}>Pending</option>
          <option ${status === "Diagnosing" ? "selected" : ""}>Diagnosing</option>
          <option ${status === "Fixing" ? "selected" : ""}>Fixing</option>
          <option ${status === "Completed" ? "selected" : ""}>Completed</option>
        </select>
        <button onclick="openNoteModal('${repair.id}')">
          Add Note
        </button>
      </div>
    </article>
  `;
}

window.updateRepairStatus = async function (repairId, status) {
  const repair = assignedRepairs.find((item) => item.id === repairId);
  if (!repair) return;

  const timeline = repair.timeline || [];

  timeline.push({
    stage: status,
    time: new Date().toLocaleString(),
    by: currentTechnician.name || currentTechnician.email || "Technician",
  });

  const updateData = {
    status,
    timeline,
  };

  if (status === "Completed") {
    updateData.completedAt = serverTimestamp();
    updateData.completedBy = currentTechnician.email || currentTechnician.uid;
  }

  try {
    await updateDoc(doc(db, "repairs", repairId), updateData);
    showToast("Repair updated");
  } catch (err) {
    console.error(err);
    showToast("Could not update repair");
  }
};

window.openNoteModal = function (repairId) {
  activeNoteRepairId = repairId;
  const repair = assignedRepairs.find((item) => item.id === repairId);

  setText("noteRepairTitle", repair?.deviceName || "Repair update");
  document.getElementById("repairNote").value = "";
  document.getElementById("noteModal").classList.remove("hidden");
};

window.closeNoteModal = function () {
  activeNoteRepairId = null;
  document.getElementById("noteModal").classList.add("hidden");
};

window.saveRepairNote = async function () {
  const note = document.getElementById("repairNote").value.trim();
  if (!activeNoteRepairId || !note) return showToast("Write a note first");

  const repair = assignedRepairs.find((item) => item.id === activeNoteRepairId);
  const timeline = repair?.timeline || [];

  timeline.push({
    stage: "Technician Note",
    note,
    time: new Date().toLocaleString(),
    by: currentTechnician.name || currentTechnician.email || "Technician",
  });

  try {
    await updateDoc(doc(db, "repairs", activeNoteRepairId), {
      timeline,
      lastTechnicianNote: note,
      lastUpdatedAt: serverTimestamp(),
    });

    closeNoteModal();
    showToast("Note saved");
  } catch (err) {
    console.error(err);
    showToast("Could not save note");
  }
};

window.updateAvailability = async function (availability) {
  try {
    await updateDoc(doc(db, "users", currentTechnician.uid), {
      availability,
    });

    currentTechnician.availability = availability;
    setText("profileAvailability", availability);
    showToast("Availability updated");
  } catch (err) {
    console.error(err);
    showToast("Could not update availability");
  }
};

window.showTechSection = function (section) {
  document.querySelectorAll(".tech-section")
    .forEach((el) => el.classList.add("hidden"));

  document.getElementById(section)?.classList.remove("hidden");

  document.querySelectorAll(".tech-sidebar button")
    .forEach((btn) => btn.classList.remove("active"));

  document.getElementById(`nav-${section}`)?.classList.add("active");
};

window.toggleTechTheme = function () {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "bennyfix-tech-theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
};

window.logoutTechnician = async function () {
  await signOut(auth);
  window.location.href = "index.html";
};

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setImage(id, src) {
  const el = document.getElementById(id);
  if (el) el.src = src;
}

function getTime(value) {
  if (!value) return 0;
  if (value.toDate) return value.toDate().getTime();
  if (value.seconds) return value.seconds * 1000;
  return new Date(value).getTime() || 0;
}

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 2800);
}
