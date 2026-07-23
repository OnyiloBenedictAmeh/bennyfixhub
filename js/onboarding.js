/* ==========================================================
   BENNYFIX HUB
   USER ONBOARDING
========================================================== */

import { db, doc, getDoc, updateDoc, serverTimestamp } from "./firebase.js";
const POLICY_VERSION = "1.0.0";

let overlay;
let continueBtn;
let checkbox;

/* ==========================================================
   PUBLIC FUNCTION
========================================================== */

export async function runOnboarding(user) {
  const userRef = doc(db, "users", user.uid);

  const snap = await getDoc(userRef);

  const data = snap.data() || {};

  const legal = data.legalAcceptance;

  // User already accepted current version
  if (legal && legal.accepted === true && legal.version === POLICY_VERSION) {
    return true;
  }

  return await showLegalModal(userRef);
}

/* ==========================================================
   BUILD MODAL
========================================================== */

function buildModal() {
  overlay = document.createElement("div");

  overlay.className = "onboarding-overlay";

  overlay.innerHTML = `

<div class="onboarding-modal">

<div class="onboarding-header">

<h2>Welcome to BennyFix Hub</h2>

<p>

Before using BennyFix Hub, please review our legal
documents and accept them to continue.

</p>

</div>

<div class="onboarding-body">

<h3>Legal Documents</h3>

<div class="policy-grid">

<a class="policy-card"
href="terms-of-service.html"
target="_blank">

<h4>Terms of Service</h4>

<p>Rules for using BennyFix Hub.</p>

</a>

<a class="policy-card"
href="privacy-policy.html"
target="_blank">

<h4>Privacy Policy</h4>

<p>How we collect and protect your data.</p>

</a>

<a class="policy-card"
href="cookie-policy.html"
target="_blank">

<h4>Cookie Policy</h4>

<p>Information about cookies.</p>

</a>

<a class="policy-card"
href="refund-policy.html"
target="_blank">

<h4>Refund Policy</h4>

<p>Payments, refunds and cancellations.</p>

</a>

<a class="policy-card"
href="repair-warranty-policy.html"
target="_blank">

<h4>Repair Warranty</h4>

<p>Warranty information.</p>

</a>

<a class="policy-card"
href="acceptable-use-policy.html"
target="_blank">

<h4>Acceptable Use</h4>

<p>Platform rules and responsibilities.</p>

</a>

</div>

<div class="agreement">

<input
type="checkbox"
id="acceptPolicies">

<label for="acceptPolicies">

I have read and agree to the BennyFix Hub
Terms of Service, Privacy Policy,
Cookie Policy, Refund Policy,
Repair Warranty and Acceptable Use Policy.

</label>

</div>

</div>

<div class="onboarding-footer">

<span>

Policy Version ${POLICY_VERSION}

</span>

<button
class="continue-btn"
disabled>

Continue

</button>

</div>

</div>

`;

  document.body.appendChild(overlay);

  checkbox = document.getElementById("acceptPolicies");

  continueBtn = document.querySelector(".continue-btn");

  checkbox.addEventListener("change", () => {
    continueBtn.disabled = !checkbox.checked;

    continueBtn.classList.toggle("enabled", checkbox.checked);
  });

  requestAnimationFrame(() => {
    overlay.classList.add("active");
  });
}

/* ==========================================================
   SHOW MODAL
========================================================== */

function showLegalModal(userRef) {
  return new Promise((resolve) => {
    buildModal();

    continueBtn.onclick = async () => {
      await updateDoc(userRef, {
        legalAcceptance: {
          accepted: true,

          acceptedAt: serverTimestamp(),

          version: POLICY_VERSION,
        },

        onboarding: {
          tourCompleted: false,
        },
      });

      overlay.remove();

      resolve(true);
    };
  });
}
