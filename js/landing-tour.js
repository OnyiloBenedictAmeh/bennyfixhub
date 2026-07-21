const STORAGE_KEY = "bennyfix-tour-completed";

const STEPS = [
  {
    selector: ".logo",
    title: "Welcome to BennyFix Hub",
    text: "This is home base for booking and tracking device repairs. Let's take a 30-second look around.",
  },
  {
    selector: ".nav-item[data-menu='repairs']",
    title: "Browse repair services",
    text: "Hover or tap here to see the kinds of repairs we handle.",
  },
  {
    selector: ".nav-item[onclick=\"toggleSearch(event)\"]",
    title: "Search anytime",
    text: "Looking for something specific? Search the site from here.",
  },
  {
    selector: ".hero-actions .primary-btn",
    title: "Start a repair",
    text: "This is the fastest way to request a repair \u2014 a short guided form walks you through it.",
  },
  {
    selector: ".related-grid",
    title: "Common issues",
    text: "Quick links to frequently requested fixes, in case you're not sure where to start.",
  },
  {
    selector: "footer",
    title: "Policies & contact",
    text: "Our terms, privacy policy, and other legal info live down here whenever you need them.",
  },
];

let currentStep = 0;
let spotlightEl = null;
let tooltipEl = null;
let repositionTimer = null;

function isLegalGateOpen() {
  const overlay = document.getElementById("legalGateOverlay");
  return !!overlay && !overlay.classList.contains("hidden");
}

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

export function startTour() {
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
  btn.addEventListener("click", startTour);
  document.body.appendChild(btn);
}

function maybeAutoStart() {
  if (localStorage.getItem(STORAGE_KEY)) return;

  if (isLegalGateOpen()) {
    setTimeout(maybeAutoStart, 500);
    return;
  }

  setTimeout(startTour, 800);
}

document.addEventListener("DOMContentLoaded", () => {
  addReplayButton();
  maybeAutoStart();
});

window.addEventListener("resize", () => {
  if (!spotlightEl || !tooltipEl) return;
  renderStep(currentStep);
});
