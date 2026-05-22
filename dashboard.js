
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

<button
  class="journey-btn"
  onclick="togglejourney('${docSnap.id}')"
>
  View Repair Journey
</button>

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