const STORAGE_KEY = "bennyfix-tour-completed";

const DESKTOP_STEPS = [
  {
    selector: ".logo",
    title: "Welcome to BennyFix Hub",
    text: "This is home base for booking and tracking device repairs. Let's take a 30-second look around.",
  },
  {
    selector: ".account-wrapper .topbar-action",
    title: "Your account",
    text: "Open this to log in, create an account, or access your dashboard.",
  },
  {
    selector: ".topbar-action[aria-label='Claims']",
    title: "Claims",
    text: "Use this for repair claims and warranty follow-up.",
  },
  {
    selector: ".theme-toggle",
    title: "Dark mode",
    text: "Switch between light and dark mode anytime.",
  },
   {
  selector: ".header-search-btn",
  title: "Search anytime",
  text: "Looking for something specific? Search the site from here.",
},
  {
    selector: ".explore-repairs-btn",
    title: "Explore services",
    text: "Open the full services page to browse repair options, pricing, and turnaround times.",
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

const MOBILE_STEPS = DESKTOP_STEPS.filter((step) => !step.selector.includes("toggleSearch"));

let currentStep = 0;
let spotlightEl = null;
let tooltipEl = null;
let repositionTimer = null;

function getSteps() {
  return window.innerWidth <= 900 ? MOBILE_STEPS : DESKTOP_STEPS;
}

function isLegalGateOpen() {
  const overlay = document.getElementById("legalGateOverlay");
  return !!overlay && !overlay.classList.contains("hidden");
}

function findFirstAvailableStepIndex(fromIndex) {
  const steps = getSteps();

  for (let i = fromIndex; i < steps.length; i++) {
    if (document.querySelector(steps[i].selector)) return i;
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
  const step = getSteps()[index];
  const target = document.querySelector(step.selector);

  if (!target) {
    goToStep(index + 1);
    return;
  }

  step.prepare?.();
  target.scrollIntoView({ behavior: "auto", block: "center", inline: "center" });

  clearTimeout(repositionTimer);
  repositionTimer = setTimeout(() => positionOverlay(target, step, index), 80);
}

function positionOverlay(target, step, index) {
  if (!spotlightEl || !tooltipEl || !target?.isConnected) return;

  const rect = target.getBoundingClientRect();

  const isMobile = window.innerWidth <= 600;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const padding = isMobile ? 6 : 8;
  const screenGap = isMobile ? 12 : 16;
  const tooltipGap = isMobile ? 12 : 16;

  /* ========================================================
     SPOTLIGHT
     ======================================================== */

  const spotlightTop = Math.max(0, rect.top - padding);
  const spotlightLeft = Math.max(0, rect.left - padding);

  const spotlightWidth = Math.min(
    rect.width + padding * 2,
    viewportWidth - spotlightLeft
  );

  const spotlightHeight = Math.min(
    rect.height + padding * 2,
    viewportHeight - spotlightTop
  );

  spotlightEl.style.top = `${spotlightTop}px`;
  spotlightEl.style.left = `${spotlightLeft}px`;
  spotlightEl.style.width = `${spotlightWidth}px`;
  spotlightEl.style.height = `${spotlightHeight}px`;


  /* ========================================================
     TOOLTIP CONTENT
     ======================================================== */

  tooltipEl.innerHTML = `
    <div class="tour-progress">
      STEP ${index + 1} OF ${getSteps().length}
    </div>

    <h3>${step.title}</h3>

    <p>${step.text}</p>

    <div class="tour-actions">

      <button
        class="tour-skip-btn"
        type="button"
        data-action="skip"
      >
        Skip tour
      </button>

      <div>

        ${
          index > 0
            ? `
              <button
                class="tour-back-btn"
                type="button"
                data-action="back"
              >
                Back
              </button>
            `
            : ""
        }

        <button
          class="tour-next-btn"
          type="button"
          data-action="next"
        >
          ${index === getSteps().length - 1 ? "Done" : "Next"}
        </button>

      </div>

    </div>
  `;


  /* ========================================================
     MEASURE TOOLTIP
     ======================================================== */

  tooltipEl.style.visibility = "hidden";
  tooltipEl.style.left = "0px";
  tooltipEl.style.top = "0px";

  const tooltipWidth = Math.min(
    tooltipEl.offsetWidth || (isMobile ? viewportWidth - 24 : 300),
    viewportWidth - screenGap * 2
  );

  const tooltipHeight =
    tooltipEl.offsetHeight || (isMobile ? 180 : 170);


  /* ========================================================
     MOBILE POSITIONING
     ======================================================== */

  if (isMobile) {

    /*
     * On mobile we deliberately keep the tooltip inside
     * the viewport rather than trying to place it directly
     * beside the target.
     */

    let top;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (
      spaceBelow >= tooltipHeight + tooltipGap
    ) {
      top = rect.bottom + tooltipGap;
    } else if (
      spaceAbove >= tooltipHeight + tooltipGap
    ) {
      top = rect.top - tooltipHeight - tooltipGap;
    } else {
      /*
       * Neither side has enough room.
       * Center the tooltip safely inside the viewport.
       */
      top = (viewportHeight - tooltipHeight) / 2;
    }

    /*
     * Clamp vertically.
     */
    top = Math.max(
      screenGap,
      Math.min(
        top,
        viewportHeight - tooltipHeight - screenGap
      )
    );


    /*
     * Center the tooltip horizontally on mobile.
     */
    let left = (viewportWidth - tooltipWidth) / 2;

    /*
     * Clamp horizontally.
     */
    left = Math.max(
      screenGap,
      Math.min(
        left,
        viewportWidth - tooltipWidth - screenGap
      )
    );

    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.left = `${left}px`;

  } else {

    /* ======================================================
       DESKTOP POSITIONING
       ====================================================== */

    const spaceBelow = viewportHeight - rect.bottom;

    let top;

    if (spaceBelow > tooltipHeight + 24) {
      top = rect.bottom + 16;
    } else {
      top = rect.top - tooltipHeight - 16;
    }

    top = Math.max(
      screenGap,
      Math.min(
        top,
        viewportHeight - tooltipHeight - screenGap
      )
    );


    let left = rect.left;

    left = Math.max(
      screenGap,
      Math.min(
        left,
        viewportWidth - tooltipWidth - screenGap
      )
    );

    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.left = `${left}px`;
  }


  tooltipEl.style.visibility = "visible";


  /* ========================================================
     BUTTON EVENTS
     ======================================================== */

  tooltipEl
    .querySelector('[data-action="next"]')
    ?.addEventListener(
      "click",
      () => goToStep(index + 1)
    );

  tooltipEl
    .querySelector('[data-action="skip"]')
    ?.addEventListener(
      "click",
      endTour
    );

  tooltipEl
    .querySelector('[data-action="back"]')
    ?.addEventListener(
      "click",
      () => goToStep(index - 1)
    );
}

function goToStep(index) {
  if (index < 0) return;

  if (index >= getSteps().length) {
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

  if (!localStorage.getItem("bennyfix-cookie-consent")) {
    window.addEventListener("cookie-consent:resolved", maybeAutoStart, { once: true });
    return;
  }

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

let resizeTimeout;

window.addEventListener("resize", () => {
  if (!spotlightEl || !tooltipEl) return;

  clearTimeout(resizeTimeout);

  resizeTimeout = setTimeout(() => {
    const steps = getSteps();
    const step = steps[currentStep];

    if (!step) return;

    const target = document.querySelector(step.selector);

    if (!target) return;

    /*
     * Recalculate the existing position without
     * forcing another scrollIntoView().
     */
    positionOverlay(target, step, currentStep);
  }, 100);
});
