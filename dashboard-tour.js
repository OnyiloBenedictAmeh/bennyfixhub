const STORAGE_KEY = "bennyfix-tour-dashboard-completed";

const STEPS = [
  {
    selector: ".profile-header",
    title: "Your profile",
    text: "Your photo, bio, and basic info live here. Tap \"Edit Profile\" anytime to update them.",
  },
  {
    selector: ".stats-grid",
    title: "Your stats at a glance",
    text: "See how many repairs you've made, completed, any claims, and hire requests.",
  },
  {
    selector: "#repairsContainer",
    title: "Active repairs",
    text: "Everything you currently have in for repair shows up here.",
  },
  {
    selector: "#repairJourney",
    title: "Repair journey",
    text: "Select a repair to see exactly what stage it's at, step by step.",
  },
  {
    selector: "#messagesCard",
    title: "Message the admin team",
    text: "Got a question about a repair? Send a message straight from here.",
  },
  {
    selector: "#profileBackBtn",
    title: "Heading back",
    text: "This takes you back to the main BennyFix Hub site whenever you're done here.",
  },
];

let currentStep = 0;
let spotlightEl = null;
let tooltipEl = null;
let repositionTimer = null;

function findFirstAvailableStepIndex(fromIndex) {
  for (let i = fromIndex; i < STEPS.length; i++) {
    if (document.querySelector(STEPS[i].selector)) return i;
  }
  return -1;
}

function buildOverlayElements() {
  spotlightEl = document.createElement("div");
  spotlightEl.className = "tour-spotlight";

  tooltipEl = document.createElement("div");
  tooltipEl.className = "tour-tooltip";

  document.body.append(spotlightEl, tooltipEl);
}

function removeOverlayElements() {
  spotlightEl?.remove();
  tooltipEl?.remove();
  spotlightEl = null;
  tooltipEl = null;
}

function renderStep(index) {
  const step = STEPS[index];
  const target = document.querySelector(step.selector);

  if (!target) {
    goToStep(index + 1);
    return;
  }

  target.scrollIntoView({ behavior: "auto", block: "center", inline: "center" });

  clearTimeout(repositionTimer);
  repositionTimer = setTimeout(() => positionOverlay(target, step, index), 80);
}

function positionOverlay(target, step, index) {
  if (!spotlightEl || !tooltipEl || !target?.isConnected) return;

  const rect = target.getBoundingClientRect();
  const padding = 8;

  spotlightEl.style.top = `${rect.top - padding}px`;
  spotlightEl.style.left = `${rect.left - padding}px`;
  spotlightEl.style.width = `${rect.width + padding * 2}px`;
  spotlightEl.style.height = `${rect.height + padding * 2}px`;

  tooltipEl.innerHTML = `
    <div class="tour-progress">STEP ${index + 1} OF ${STEPS.length}</div>
    <h3>${step.title}</h3>
    <p>${step.text}</p>
    <div class="tour-actions">
      <button class="tour-skip-btn" type="button" data-action="skip">Skip tour</button>
      <div>
        ${index > 0 ? '<button class="tour-back-btn" type="button" data-action="back">Back</button>' : ""}
        <button class="tour-next-btn" type="button" data-action="next">
          ${index === STEPS.length - 1 ? "Done" : "Next"}
        </button>
      </div>
    </div>
  `;

  const tooltipWidth = tooltipEl.offsetWidth || 300;
  const tooltipHeight = tooltipEl.offsetHeight || 170;
  const spaceBelow = window.innerHeight - rect.bottom;
  const top = spaceBelow > tooltipHeight + 24
    ? rect.bottom + 16
    : Math.max(16, rect.top - tooltipHeight - 16);
  const left = Math.min(
    Math.max(16, rect.left),
    window.innerWidth - tooltipWidth - 16
  );

  tooltipEl.style.top = `${top}px`;
  tooltipEl.style.left = `${left}px`;

  tooltipEl.querySelector('[data-action="next"]').addEventListener("click", () => goToStep(index + 1));
  tooltipEl.querySelector('[data-action="skip"]').addEventListener("click", endTour);
  tooltipEl.querySelector('[data-action="back"]')?.addEventListener("click", () => goToStep(index - 1));
}

function goToStep(index) {
  if (index < 0) return;

  if (index >= STEPS.length) {
    endTour();
    return;
  }

  const nextAvailable = findFirstAvailableStepIndex(index);

  if (nextAvailable === -1) {
    endTour();
    return;
  }

  currentStep = nextAvailable;
  renderStep(currentStep);
}

function endTour() {
  clearTimeout(repositionTimer);
  removeOverlayElements();
  localStorage.setItem(STORAGE_KEY, "true");
}

export function startDashboardTour() {
  removeOverlayElements();
  buildOverlayElements();
  goToStep(0);
}

function addReplayButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "tour-replay-btn";
  btn.title = "Take the tour";
  btn.innerHTML = "?";
  btn.addEventListener("click", startDashboardTour);
  document.body.appendChild(btn);
}

function maybeAutoStart() {
  if (localStorage.getItem(STORAGE_KEY)) return;

  // The page shows skeleton placeholders while data loads (see
  // .profile-loading in user-profile.css) — wait for that to clear so the
  // tour highlights real content, not skeleton shimmer.
  const waitForLoad = setInterval(() => {
    if (!document.body.classList.contains("profile-loading")) {
      clearInterval(waitForLoad);
      setTimeout(startDashboardTour, 500);
    }
  }, 300);

  // Don't wait forever if loading state never clears for some reason.
  setTimeout(() => clearInterval(waitForLoad), 8000);
}

document.addEventListener("DOMContentLoaded", () => {
  addReplayButton();
  maybeAutoStart();
});

window.addEventListener("resize", () => {
  if (!spotlightEl || !tooltipEl) return;
  renderStep(currentStep);
});

window.addEventListener("scroll", () => {
  if (!spotlightEl || !tooltipEl) return;
  const step = STEPS[currentStep];
  const target = document.querySelector(step.selector);
  if (!target) return;

  clearTimeout(repositionTimer);
  repositionTimer = setTimeout(() => positionOverlay(target, step, currentStep), 40);
}, { passive: true });
